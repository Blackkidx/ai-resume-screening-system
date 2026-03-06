# -*- coding: utf-8 -*-
"""
Certificate Upload & Management API

Endpoints:
    - POST /upload     — อัปโหลด Certificate (PDF/Image)
    - GET  /my/list    — ดูรายการ Certificate ของฉัน
    - DELETE /{id}      — ลบ Certificate
"""

import logging
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from core.auth import get_current_user_id
from core.database import get_database

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/certificates", tags=["Certificates"])

UPLOAD_FOLDER = "uploads/certificates"
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB per file

Path(UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class CertificateResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_path: str
    file_size: int
    certificate_name: Optional[str] = None
    uploaded_at: datetime
    message: str = ""


class CertificateListResponse(BaseModel):
    certificates: List[dict]
    total: int


# =============================================================================
# UPLOAD
# =============================================================================

@router.post("/upload", response_model=CertificateResponse, status_code=status.HTTP_201_CREATED)
async def upload_certificate(
    file: UploadFile = File(..., description="Certificate file (PDF/Image)"),
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_database),
):
    """อัปโหลด Certificate — รองรับ PDF, JPG, PNG"""
    
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"ไฟล์ไม่รองรับ — ใช้ได้เฉพาะ {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="ไฟล์มีขนาดใหญ่เกิน 10MB")

    # Save file
    unique_id = uuid.uuid4().hex[:12]
    safe_name = f"{user_id}_{unique_id}{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, safe_name)

    with open(file_path, "wb") as f:
        f.write(content)

    # Save to MongoDB
    cert_doc = {
        "user_id": user_id,
        "file_name": file.filename,
        "file_path": file_path,
        "file_size": len(content),
        "file_type": ext.replace(".", ""),
        "certificate_name": os.path.splitext(file.filename)[0],
        "uploaded_at": datetime.utcnow(),
    }

    result = await db.certificates.insert_one(cert_doc)

    logger.info(f"[Certificate] Uploaded by {user_id}: {file.filename}")

    return CertificateResponse(
        id=str(result.inserted_id),
        user_id=user_id,
        file_name=file.filename,
        file_path=file_path,
        file_size=len(content),
        certificate_name=cert_doc["certificate_name"],
        uploaded_at=cert_doc["uploaded_at"],
        message="อัปโหลด Certificate สำเร็จ",
    )


# =============================================================================
# LIST
# =============================================================================

@router.get("/my/list", response_model=CertificateListResponse)
async def get_my_certificates(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_database),
):
    """ดูรายการ Certificate ของฉัน"""
    cursor = db.certificates.find({"user_id": user_id}).sort("uploaded_at", -1)
    certs = await cursor.to_list(length=50)

    result = []
    for cert in certs:
        result.append({
            "id": str(cert["_id"]),
            "file_name": cert.get("file_name", ""),
            "file_size": cert.get("file_size", 0),
            "file_type": cert.get("file_type", ""),
            "certificate_name": cert.get("certificate_name", ""),
            "file_url": "/" + cert.get("file_path", "").replace("\\", "/"),
            "uploaded_at": cert.get("uploaded_at", datetime.utcnow()).isoformat(),
        })

    return CertificateListResponse(certificates=result, total=len(result))


# =============================================================================
# DELETE
# =============================================================================

@router.delete("/{certificate_id}", status_code=status.HTTP_200_OK)
async def delete_certificate(
    certificate_id: str,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_database),
):
    """ลบ Certificate"""
    if not ObjectId.is_valid(certificate_id):
        raise HTTPException(status_code=400, detail="Invalid certificate ID")

    cert = await db.certificates.find_one({
        "_id": ObjectId(certificate_id),
        "user_id": user_id,
    })

    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    # Delete file from disk
    file_path = cert.get("file_path", "")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass

    # Delete from DB
    await db.certificates.delete_one({"_id": ObjectId(certificate_id)})

    logger.info(f"[Certificate] Deleted {certificate_id} by {user_id}")

    return {"message": "ลบ Certificate สำเร็จ", "id": certificate_id}
