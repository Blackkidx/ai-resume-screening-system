# -*- coding: utf-8 -*-
"""
Certificate Upload & Management API

Endpoints:
    - POST /upload     — อัปโหลด Certificate (PDF/Image)
                         → extract text → LLM analyze → auto-sync กับ resume
    - GET  /my/list    — ดูรายการ Certificate ของฉัน
    - DELETE /{id}      — ลบ Certificate + auto-sync
"""

import io
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from core.auth import get_current_user_id
from core.database import get_database
from services.llm_service import LLMService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/certificates", tags=["Certificates"])

# Always relative so URLs work on any machine / deployment environment
UPLOAD_FOLDER = "uploads/certificates"
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB per file

Path(UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)


def _to_relative_url(file_path: str) -> str:
    """
    Convert any file_path (absolute or relative) to a clean URL path.
    e.g.
      'uploads/certificates/foo.pdf'              → '/uploads/certificates/foo.pdf'
      'D:\\...\\uploads\\certificates\\foo.pdf'   → '/uploads/certificates/foo.pdf'
    """
    fp = file_path.replace("\\", "/")
    idx = fp.find("uploads/")
    if idx != -1:
        return "/" + fp[idx:]
    return "/" + fp

# Singleton LLM service (shared with resume route)
_llm_service: Optional[LLMService] = None


def _get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


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
    extracted_cert_name: Optional[str] = None
    llm_cert_name: Optional[str] = None
    is_valid_cert: Optional[bool] = None
    uploaded_at: datetime
    message: str = ""


class CertificateListResponse(BaseModel):
    certificates: List[dict]
    total: int


# =============================================================================
# HELPERS
# =============================================================================

def _extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from a certificate PDF using pdfplumber."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            pages_text = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text.strip())
            return "\n".join(pages_text).strip()
    except Exception as e:
        logger.warning(f"[Certificate] PDF extraction failed: {e}")
        return ""


def _guess_cert_name_from_text(text: str, fallback: str) -> str:
    """Heuristic: first meaningful line that looks like a cert name."""
    if not text:
        return fallback
    for line in text.splitlines():
        line = line.strip()
        if len(line) > 6 and not line.lower().startswith(("this certif", "is hereby", "awarded")):
            return line
    return fallback


async def _sync_cert_urls(user_id: str, db) -> None:
    """
    Re-build `certificate_urls`, `has_cert_files`, and `cert_llm_analyses`
    on every resume document owned by `user_id`.

    `cert_llm_analyses` = list of LLM analysis dicts from each cert
    (used by matching_service to do intelligent cert-job relevance scoring)
    """
    try:
        cert_docs = await db.certificates.find({"user_id": user_id}).to_list(length=100)

        # Build relative URL using helper — works for any stored path format
        def _to_url(file_path: str) -> str:
            fp = file_path.replace("\\", "/")
            idx = fp.find("uploads/")
            if idx != -1:
                return "/" + fp[idx:]
            return "/" + fp

        cert_urls = [
            _to_url(c.get("file_path", ""))
            for c in cert_docs if c.get("file_path")
        ]
        has_cert_files = len(cert_urls) > 0

        # Collect LLM analyses — only include entries where LLM succeeded
        cert_llm_analyses = [
            c["llm_analysis"]
            for c in cert_docs
            if c.get("llm_analysis") and isinstance(c.get("llm_analysis"), dict)
        ]

        await db.resumes.update_many(
            {"user_id": user_id},
            {"$set": {
                "certificate_urls": cert_urls,
                "has_cert_files": has_cert_files,
                "cert_llm_analyses": cert_llm_analyses,
                "certs_synced_at": datetime.now(timezone.utc),
            }}
        )
        logger.info(
            f"[Certificate] Synced {len(cert_urls)} cert(s), "
            f"{len(cert_llm_analyses)} LLM analysis(es) → "
            f"all resumes of user {user_id}"
        )
    except Exception as e:
        logger.error(f"[Certificate] _sync_cert_urls failed for user {user_id}: {e}")


async def _recalculate_application_scores(user_id: str, db) -> None:
    """
    Recalculate AI scores for all pending/applications of user when new cert is uploaded.
    This ensures applications reflect the updated certificate information.
    """
    try:
        # Find all applications for this user that are still pending/reviewing
        applications = await db.applications.find({
            "student_id": user_id,
            "status": {"$in": ["pending", "reviewing"]}
        }).to_list(length=100)
        
        if not applications:
            logger.info(f"[Certificate] No pending applications to update for user {user_id}")
            return
            
        logger.info(f"[Certificate] Recalculating scores for {len(applications)} applications")
        
        from services.matching_service import MatchingService
        from routes.job import get_resume_features, convert_job_to_requirements
        
        matching_service = MatchingService()
        
        for app in applications:
            try:
                job_id = app.get("job_id")
                if not job_id:
                    continue
                    
                # Get job details
                from bson import ObjectId
                job = await db.jobs.find_one({"_id": ObjectId(job_id)})
                if not job:
                    continue
                
                # Get updated resume features with new certificates
                resume_features = await get_resume_features(user_id, db, has_cert_files=True) or {}
                job_requirements = convert_job_to_requirements(job)
                
                # Recalculate AI score
                match_result = matching_service.calculate_ai_match(resume_features, job_requirements)
                
                # Update application with new scores
                await db.applications.update_one(
                    {"_id": app["_id"]},
                    {"$set": {
                        "ai_score": match_result.get("overall_score", app.get("ai_score", 0)),
                        "ai_score_details": match_result.get("breakdown", app.get("ai_score_details", {})),
                        "ai_method": "xgboost_v4_cert_updated",
                        "certificate_urls": resume_features.get("certificate_urls", app.get("certificate_urls", []))
                    }}
                )
                
                logger.info(f"[Certificate] Updated app {app['_id']} score: {match_result.get('overall_score', 0)}%")
                
            except Exception as e:
                logger.error(f"[Certificate] Failed to update app {app.get('_id')}: {e}")
                continue
                
    except Exception as e:
        logger.error(f"[Certificate] _recalculate_application_scores failed for user {user_id}: {e}")


# =============================================================================
# UPLOAD
# =============================================================================

@router.post("/upload", response_model=CertificateResponse, status_code=status.HTTP_201_CREATED)
async def upload_certificate(
    file: UploadFile = File(..., description="Certificate file (PDF/Image)"),
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_database),
):
    """อัปโหลด Certificate

    Pipeline:
    1. Validate file
    2. Save to disk
    3. Extract text from PDF (pdfplumber)
    4. LLM analyze cert content → domain, skills_covered, relevance_tags, is_valid_cert
    5. Save to MongoDB
    6. Auto-sync certificate_urls + cert_llm_analyses → all resumes of user
    """

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

    # Save file — use UPLOAD_FOLDER (relative) so stored path is always relative
    unique_id = uuid.uuid4().hex[:12]
    safe_name = f"{user_id}_{unique_id}{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, safe_name)  # e.g. uploads/certificates/xxx.pdf

    with open(file_path, "wb") as f:
        f.write(content)

    base_name = os.path.splitext(file.filename)[0]

    # ── Step 3: Extract text from PDF cert ──
    extracted_text = ""
    extracted_cert_name = None

    if ext == ".pdf":
        extracted_text = _extract_text_from_pdf(content)
        if extracted_text:
            extracted_cert_name = _guess_cert_name_from_text(extracted_text, base_name)
            logger.info(
                f"[Certificate] Extracted {len(extracted_text)} chars "
                f"from '{file.filename}' — heuristic name: '{extracted_cert_name}'"
            )
        else:
            logger.info(f"[Certificate] image-only cert PDF: {file.filename}")

    # ── Step 4: LLM analyze cert ──
    llm_analysis = None
    llm_cert_name = None
    is_valid_cert = None

    if extracted_text:
        llm_svc = _get_llm_service()
        if llm_svc.is_ready():
            logger.info(f"[Certificate] Running LLM cert analysis for '{file.filename}'...")
            llm_analysis = llm_svc.analyze_certificate(extracted_text)
            if llm_analysis:
                llm_cert_name = llm_analysis.get("cert_name") or extracted_cert_name
                is_valid_cert = llm_analysis.get("is_valid_cert", False)
                logger.info(
                    f"[Certificate] LLM result: name='{llm_cert_name}' "
                    f"domain='{llm_analysis.get('domain')}' "
                    f"tags={llm_analysis.get('relevance_tags')} "
                    f"valid={is_valid_cert}"
                )
            else:
                logger.warning(f"[Certificate] LLM analysis returned None for '{file.filename}'")
        else:
            logger.warning("[Certificate] LLM service not ready — skipping cert analysis")

    # ── Step 5: Save to MongoDB ──
    cert_doc = {
        "user_id": user_id,
        "file_name": file.filename,
        "file_path": file_path,
        "file_size": len(content),
        "file_type": ext.replace(".", ""),
        "certificate_name": base_name,
        "extracted_text": extracted_text,
        "extracted_cert_name": extracted_cert_name,
        "llm_analysis": llm_analysis,          # Full LLM result dict or None
        "llm_cert_name": llm_cert_name,
        "is_valid_cert": is_valid_cert,
        "uploaded_at": datetime.now(timezone.utc),
    }

    result = await db.certificates.insert_one(cert_doc)
    logger.info(f"[Certificate] Saved cert {result.inserted_id} for user {user_id}")

    # ── Step 6: Auto-sync cert info to all resumes ──
    await _sync_cert_urls(user_id, db)
    
    # ── Step 7: Recalculate AI scores for existing applications ──
    await _recalculate_application_scores(user_id, db)

    return CertificateResponse(
        id=str(result.inserted_id),
        user_id=user_id,
        file_name=file.filename,
        file_path=file_path,
        file_size=len(content),
        certificate_name=base_name,
        extracted_cert_name=extracted_cert_name,
        llm_cert_name=llm_cert_name,
        is_valid_cert=is_valid_cert,
        uploaded_at=cert_doc["uploaded_at"],
        message=(
            "อัปโหลด Certificate สำเร็จ — LLM วิเคราะห์แล้ว"
            if llm_analysis else
            "อัปโหลด Certificate สำเร็จ — ไม่สามารถอ่าน text ได้ (image cert)"
        ),
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
        llm = cert.get("llm_analysis") or {}
        result.append({
            "id": str(cert["_id"]),
            "file_name": cert.get("file_name", ""),
            "file_size": cert.get("file_size", 0),
            "file_type": cert.get("file_type", ""),
            "certificate_name": cert.get("certificate_name", ""),
            "extracted_cert_name": cert.get("extracted_cert_name"),
            "llm_cert_name": cert.get("llm_cert_name"),
            "is_valid_cert": cert.get("is_valid_cert"),
            "llm_domain": llm.get("domain"),
            "llm_relevance_tags": llm.get("relevance_tags", []),
            "llm_skills_covered": llm.get("skills_covered", []),
            "file_url": _to_relative_url(cert.get("file_path", "")),
            "uploaded_at": cert.get("uploaded_at", datetime.now(timezone.utc)).isoformat(),
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
    """ลบ Certificate และ re-sync resume"""
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

    # Re-sync cert URLs + LLM analyses into resumes
    await _sync_cert_urls(user_id, db)
    
    # Recalculate AI scores for existing applications (cert removed = lower score)
    await _recalculate_application_scores(user_id, db)

    return {"message": "ลบ Certificate สำเร็จ และอัปเดต Resume แล้ว", "id": certificate_id}
