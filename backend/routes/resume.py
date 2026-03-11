# =============================================================================
# 📄 RESUME UPLOAD & PROCESSING API - FastAPI Version
# ไฟล์: backend/routes/resume.py
# =============================================================================

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional, List
import os
import uuid
import logging
from pathlib import Path

# PDF Processing Libraries
import PyPDF2
import pdfplumber
import io

# Local imports
from core.database import get_database
from core.auth import get_current_user_id
from pydantic import BaseModel, Field
from typing import Dict, Any

# AI Services
from services.llm_service import LLMService

# Initialize LLM Service (singleton)
llm_service = LLMService()

# สร้าง router สำหรับ Resume API
router = APIRouter(prefix="/resumes", tags=["Resume Management"])

# =============================================================================
# 📁 CONFIGURATION - การตั้งค่า
# =============================================================================
UPLOAD_FOLDER = "uploads/resumes"  # โฟลเดอร์เก็บไฟล์
ALLOWED_EXTENSIONS = {".pdf"}      # อนุญาตเฉพาะ PDF
MAX_FILE_SIZE = 15 * 1024 * 1024   # ขนาดไฟล์สูงสุด 15MB

# Certificate upload config
CERT_UPLOAD_FOLDER = "uploads/certificates"
CERT_ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
CERT_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# สร้างโฟลเดอร์ถ้ายังไม่มี
Path(UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)
Path(CERT_UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)

# ตั้งค่า logging เพื่อดู log
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _to_relative_url(file_path: str) -> str:
    """
    Convert any file_path (absolute or relative) to a clean URL path.
    Strips drive letters and machine-specific prefixes so URLs work on any deployment.
    'uploads/certificates/foo.pdf'            → '/uploads/certificates/foo.pdf'
    'D:\\backend\\uploads\\certificates\\foo.pdf' → '/uploads/certificates/foo.pdf'
    """
    fp = file_path.replace("\\", "/")
    for prefix in ("uploads/resumes", "uploads/certificates", "uploads"):
        idx = fp.find(prefix)
        if idx != -1:
            return "/" + fp[idx:]
    return "/" + fp

# =============================================================================
# 📋 PYDANTIC MODELS - โครงสร้างข้อมูล
# =============================================================================

class ResumeUploadResponse(BaseModel):
    """Response after resume upload."""
    id: str
    user_id: str
    file_name: str
    file_path: str
    file_size: int
    status: str
    uploaded_at: datetime
    message: str
    extracted_features: Optional[Dict[str, Any]] = None
    failure_type: Optional[str] = None  # image_only_pdf | ai_failed | partial_extraction | None

class ResumeStatusResponse(BaseModel):
    """ข้อมูลสถานะการประมวลผล"""
    id: str
    status: str
    uploaded_at: datetime
    processed_at: Optional[datetime]
    file_name: str
    file_size: int
    text_length: int
    error_message: Optional[str]

class ResumeDetailResponse(BaseModel):
    """ข้อมูลรายละเอียด Resume"""
    id: str
    user_id: str
    file_name: str
    file_size: int
    extracted_text: str
    status: str
    uploaded_at: datetime
    processed_at: Optional[datetime]
    error_message: Optional[str]

# =============================================================================
# 🛠️ HELPER FUNCTIONS - ฟังก์ชันช่วย
# =============================================================================

def validate_file(file: UploadFile) -> tuple[bool, str]:
    """ตรวจสอบไฟล์ว่าใช้ได้หรือไม่"""
    
    # ตรวจสอบว่ามีชื่อไฟล์หรือไม่
    if not file.filename:
        return False, "ไม่มีชื่อไฟล์"
    
    # ตรวจสอบนามสกุลไฟล์
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"อนุญาตเฉพาะไฟล์ PDF เท่านั้น ได้รับ {file_ext}"
    
    return True, "ไฟล์ถูกต้อง"

async def validate_file_size(file: UploadFile) -> tuple[bool, str, bytes]:
    """ตรวจสอบขนาดไฟล์, อ่านข้อมูล และป้องกันการปลอมแปลงไฟล์ด้วย Magic bytes"""
    
    # อ่านไฟล์ทั้งหมด
    contents = await file.read()
    file_size = len(contents)
    
    # ตรวจสอบขนาด
    if file_size > MAX_FILE_SIZE:
        return False, f"ไฟล์ใหญ่เกินไป {file_size} bytes (สูงสุด {MAX_FILE_SIZE} bytes)", b""
    
    # ตรวจสอบ Magic Bytes สำหรับ PDF (%PDF-)
    if not contents.startswith(b"%PDF-"):
        return False, "ไฟล์ไม่ใช่รูปแบบ PDF ที่ถูกต้อง (Invalid magic bytes)", b""
    
    return True, f"ขนาดไฟล์และรูปแบบเหมาะสม", contents

def _words_to_lines(words: list) -> str:
    """Group pdfplumber word-dicts into lines by vertical position, return joined text."""
    if not words:
        return ""
    lines, current_line, current_top = [], [], None
    for w in words:
        if current_top is None or abs(w["top"] - current_top) <= 5:
            current_line.append(w["text"])
            current_top = w["top"]
        else:
            lines.append(" ".join(current_line))
            current_line, current_top = [w["text"]], w["top"]
    if current_line:
        lines.append(" ".join(current_line))
    return "\n".join(lines)


def extract_text_column_aware(file_content: bytes) -> str:
    """
    Column-aware PDF extraction using pdfplumber word bboxes.
    Splits each page into left/right columns by midpoint, reads in correct order.
    Fixes garbled Thai text caused by multi-column resume layouts.
    """
    try:
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            pages_text = []
            for page in pdf.pages:
                words = page.extract_words(x_tolerance=5, y_tolerance=5, keep_blank_chars=False)
                if not words:
                    continue
                mid_x = page.width / 2
                left  = sorted([w for w in words if w["x0"] < mid_x],  key=lambda w: (round(w["top"] / 5) * 5, w["x0"]))
                right = sorted([w for w in words if w["x0"] >= mid_x], key=lambda w: (round(w["top"] / 5) * 5, w["x0"]))
                left_text  = _words_to_lines(left)
                right_text = _words_to_lines(right)
                page_text  = f"{left_text}\n\n{right_text}".strip() if right_text else left_text
                if page_text:
                    pages_text.append(page_text)
        return "\n\n".join(pages_text).strip()
    except Exception as e:
        logger.error(f"Column-aware extraction failed: {e}")
        return ""


def _extract_plain_pdfplumber(file_content: bytes) -> str:
    """Fallback: plain pdfplumber extraction (no column logic)."""
    try:
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            return "\n".join(p.extract_text() or "" for p in pdf.pages).strip()
    except Exception as e:
        logger.error(f"pdfplumber plain extraction failed: {e}")
        return ""


def _extract_plain_pypdf2(file_content: bytes) -> str:
    """Last-resort fallback using PyPDF2."""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        return "\n".join(p.extract_text() or "" for p in reader.pages).strip()
    except Exception as e:
        logger.error(f"PyPDF2 extraction failed: {e}")
        return ""


def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extract text from PDF using a 3-tier strategy:
    1. Column-aware (best for Thai multi-column resumes)
    2. Plain pdfplumber (fallback)
    3. PyPDF2 (last resort)
    Always sanitizes the result before returning.
    """
    text = extract_text_column_aware(file_content)
    plain = _extract_plain_pdfplumber(file_content)

    # Prefer column-aware only if it yields meaningfully more content
    if len(plain) > len(text) * 1.2:
        text = plain

    if not text or len(text.strip()) < 10:
        text = _extract_plain_pypdf2(file_content)

    return llm_service.sanitize_text(text)


def _diagnose_extraction(extracted_text: str, features: dict | None) -> str | None:
    """
    Diagnose extraction quality and return a failure_type code, or None on success.
    Codes: image_only_pdf | partial_extraction | ai_failed | None
    """
    if not extracted_text or len(extracted_text.strip()) < 50:
        return "image_only_pdf"

    if not features or "error" in features or features.get("extraction_error"):
        return "ai_failed"

    edu = features.get("education") or {}
    skills = features.get("skills") or {}
    techs = skills.get("technical_skills", [])
    has_university = bool(edu.get("university"))
    has_skills = len(techs) > 0
    has_projects = len(features.get("projects", [])) > 0

    if not (has_university and has_skills and has_projects):
        return "partial_extraction"

    return None  # All good


# =============================================================================
# 📤 UPLOAD API - อัปโหลด Resume
# =============================================================================

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(..., description="ไฟล์ Resume PDF"),
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_database)
):
    """📄 อัปโหลดและประมวลผล Resume PDF"""
    
    try:
        # ขั้นตอนที่ 1: ตรวจสอบไฟล์
        is_valid, message = validate_file(file)
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)
        
        # ขั้นตอนที่ 2: ตรวจสอบขนาดและอ่านไฟล์
        size_valid, size_message, file_content = await validate_file_size(file)
        if not size_valid:
            raise HTTPException(status_code=400, detail=size_message)
        
        file_size = len(file_content)
        
        # ขั้นตอนที่ 3: สร้างชื่อไฟล์ใหม่ — ใช้ relative path เสมอเพื่อรองรับ deployment
        file_extension = Path(file.filename).suffix
        unique_filename = f"{user_id}_{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)  # relative: uploads/resumes/xxx.pdf
        
        # ขั้นตอนที่ 4: บันทึกไฟล์
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # ขั้นตอนที่ 5: สร้างข้อมูลใน database
        resume_doc = {
            "user_id": user_id,
            "file_name": file.filename,
            "file_path": file_path,
            "file_type": "pdf",
            "file_size": file_size,
            "extracted_text": "",  # จะอัปเดตทีหลัง
            "uploaded_at": datetime.now(timezone.utc),
            "processed_at": None,
            "status": "pending"  # pending = รอประมวลผล
        }
        
        result = await db.resumes.insert_one(resume_doc)
        resume_id = str(result.inserted_id)
        
        extracted_features = None
        try:
            extracted_text = extract_text_from_pdf(file_content)

            if extracted_text and len(extracted_text.strip()) > 0:
                logger.info(f"Resume {resume_id}: extracted {len(extracted_text)} chars")

                try:
                    if llm_service.is_ready():
                        logger.info(f"Resume {resume_id}: running AI analysis...")
                        extracted_features = llm_service.extract_features(extracted_text)

                        if extracted_features and not extracted_features.get("extraction_error"):
                            extracted_features.pop("extraction_error", None)

                        logger.info(f"Resume {resume_id}: AI analysis complete")
                    else:
                        logger.warning(f"Resume {resume_id}: LLM Service not ready")
                        extracted_features = {"error": "LLM Service not ready"}

                except Exception as ai_error:
                    logger.error(f"Resume {resume_id}: AI error - {ai_error}")
                    extracted_features = {"error": str(ai_error)}
                
                # Diagnose extraction quality → structured failure type
                failure_type = _diagnose_extraction(extracted_text, extracted_features)
                db_status = "processed" if failure_type != "ai_failed" else "ai_failed"
                await db.resumes.update_one(
                    {"_id": ObjectId(resume_id)},
                    {"$set": {
                        "extracted_text": extracted_text,
                        "extracted_features": extracted_features,
                        "processed_at": datetime.now(timezone.utc),
                        "status": db_status,
                        "failure_type": failure_type,
                    }}
                )
                logger.info(f"Resume {resume_id}: status={db_status} failure_type={failure_type}")
                status_message = db_status
            else:
                failure_type = "image_only_pdf"
                await db.resumes.update_one(
                    {"_id": ObjectId(resume_id)},
                    {"$set": {"status": "ocr_not_supported", "failure_type": failure_type}}
                )
                logger.warning(f"Resume {resume_id}: empty text → image_only_pdf")
                status_message = "ocr_not_supported"

        except Exception as e:
            failure_type = "ai_failed"
            await db.resumes.update_one(
                {"_id": ObjectId(resume_id)},
                {"$set": {"status": "error", "failure_type": failure_type, "error_message": str(e)}}
            )
            logger.error(f"Resume {resume_id} processing error: {e}")
            status_message = "error"

        return ResumeUploadResponse(
            id=resume_id,
            user_id=user_id,
            file_name=file.filename,
            file_path=file_path,
            file_size=file_size,
            status=status_message,
            uploaded_at=datetime.now(timezone.utc),
            message="Resume processed successfully" if not failure_type else "Resume processed with warnings",
            extracted_features=extracted_features,
            failure_type=failure_type,
        )

        
    except HTTPException:
        raise  # ส่งต่อ HTTP error
    except Exception as e:
        logger.error(f"เกิดข้อผิดพลาดในการอัปโหลด: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="อัปโหลด Resume ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
        )

# =============================================================================
# 📊 STATUS API - ตรวจสอบสถานะ
# =============================================================================

@router.get("/status/{resume_id}", response_model=ResumeStatusResponse)
async def get_resume_status(
    resume_id: str,
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_database)
):
    """📊 ตรวจสอบสถานะการประมวลผล Resume"""
    
    try:
        # ตรวจสอบ resume_id ว่าถูกต้องหรือไม่
        if not ObjectId.is_valid(resume_id):
            raise HTTPException(status_code=400, detail="รูปแบบ resume ID ไม่ถูกต้อง")
        
        # หา Resume ในฐานข้อมูล
        resume = await db.resumes.find_one({"_id": ObjectId(resume_id)})
        
        if not resume:
            raise HTTPException(status_code=404, detail="ไม่พบ Resume")
        
        # ตรวจสอบสิทธิ์ (เฉพาะเจ้าของ)
        if resume["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์เข้าถึง")
        
        return ResumeStatusResponse(
            id=resume_id,
            status=resume["status"],
            uploaded_at=resume["uploaded_at"],
            processed_at=resume.get("processed_at"),
            file_name=resume["file_name"],
            file_size=resume["file_size"],
            text_length=len(resume.get("extracted_text", "")),
            error_message=resume.get("error_message")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ตรวจสอบสถานะไม่สำเร็จ: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="ตรวจสอบสถานะ Resume ไม่สำเร็จ"
        )

# =============================================================================
# 📄 DETAIL API - ดูรายละเอียด
# =============================================================================

@router.get("/{resume_id}", response_model=ResumeDetailResponse)
async def get_resume_details(
    resume_id: str,
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_database)
):
    """📄 ดูรายละเอียด Resume รวมทั้งข้อความที่ดึงได้"""
    
    try:
        if not ObjectId.is_valid(resume_id):
            raise HTTPException(status_code=400, detail="รูปแบบ resume ID ไม่ถูกต้อง")
        
        resume = await db.resumes.find_one({"_id": ObjectId(resume_id)})
        
        if not resume:
            raise HTTPException(status_code=404, detail="ไม่พบ Resume")
        
        # ตรวจสอบสิทธิ์
        if resume["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์เข้าถึง")
        
        return ResumeDetailResponse(
            id=resume_id,
            user_id=resume["user_id"],
            file_name=resume["file_name"],
            file_size=resume["file_size"],
            extracted_text=resume.get("extracted_text", ""),
            status=resume["status"],
            uploaded_at=resume["uploaded_at"],
            processed_at=resume.get("processed_at"),
            error_message=resume.get("error_message")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ดูรายละเอียด Resume ไม่สำเร็จ: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="ดูรายละเอียด Resume ไม่สำเร็จ"
        )

# =============================================================================
# 📋 LIST API - ดูรายการ Resume ของฉัน
# =============================================================================

@router.get("/my/list")
async def get_my_resumes(
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_database)
):
    """📋 ดูรายการ Resume ของฉัน"""
    
    try:
        # ดึงรายการ Resume ของผู้ใช้
        resumes_cursor = db.resumes.find({"user_id": user_id}).sort("uploaded_at", -1)
        resumes = await resumes_cursor.to_list(length=100)
        
        # แปลงข้อมูล
        resume_list = []
        for resume in resumes:
            resume_data = {
                "id": str(resume["_id"]),
                "file_name": resume["file_name"],
                "file_size": resume["file_size"],
                "status": resume["status"],
                "uploaded_at": resume["uploaded_at"].isoformat(),
                "processed_at": resume["processed_at"].isoformat() if resume.get("processed_at") else None,
                "text_length": len(resume.get("extracted_text", "")),
                "has_error": bool(resume.get("error_message")),
                "extracted_features": resume.get("extracted_features")
            }
            resume_list.append(resume_data)
        
        return {
            "user_id": user_id,
            "resumes": resume_list,
            "total_count": len(resume_list)
        }
        
    except Exception as e:
        logger.error(f"ดูรายการ Resume ไม่สำเร็จ: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="ดูรายการ Resume ไม่สำเร็จ"
        )

# =============================================================================
# 🗑️ DELETE API - ลบ Resume
# =============================================================================

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_database)
):
    """🗑️ ลบ Resume"""
    
    try:
        if not ObjectId.is_valid(resume_id):
            raise HTTPException(status_code=400, detail="รูปแบบ resume ID ไม่ถูกต้อง")
        
        resume = await db.resumes.find_one({"_id": ObjectId(resume_id)})
        
        if not resume:
            raise HTTPException(status_code=404, detail="ไม่พบ Resume")
        
        # ตรวจสอบสิทธิ์
        if resume["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์เข้าถึง")
        
        # ลบไฟล์จากระบบ
        try:
            if os.path.exists(resume["file_path"]):
                os.remove(resume["file_path"])
                logger.info(f"ลบไฟล์: {resume['file_path']}")
        except Exception as e:
            logger.warning(f"ไม่สามารถลบไฟล์ {resume['file_path']}: {e}")
        
        # ลบจากฐานข้อมูล
        await db.resumes.delete_one({"_id": ObjectId(resume_id)})
        
        return {"message": "ลบ Resume สำเร็จ", "deleted_id": resume_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ลบ Resume ไม่สำเร็จ: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="ลบ Resume ไม่สำเร็จ"
        )

# =============================================================================
# 📜 CERTIFICATE UPLOAD API - อัปโหลดใบเซอร์
# =============================================================================

@router.post("/upload-cert")
async def upload_certificate(
    file: UploadFile = File(..., description="ไฟล์ใบเซอร์ (JPG/PNG/PDF)"),
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_database)
):
    """📜 อัปโหลดใบ Certificate (รูปภาพ/PDF) — เก็บไว้ให้ HR ดู"""

    if not file.filename:
        raise HTTPException(status_code=400, detail="ไม่มีชื่อไฟล์")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in CERT_ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"รองรับเฉพาะ: {', '.join(CERT_ALLOWED_EXTENSIONS)}"
        )

    contents = await file.read()
    if len(contents) > CERT_MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="ไฟล์ใหญ่เกิน 10MB")
        
    # ตรวจสอบว่ามี Magic bytes ที่คุ้นเคยของ JPG, PNG หรือ PDF
    if not (contents.startswith(b"%PDF-") or contents.startswith(b"\xff\xd8\xff") or contents.startswith(b"\x89PNG\r\n\x1a\n") or contents.startswith(b"RIFF")):
        raise HTTPException(status_code=400, detail="รูปแบบไฟล์ไม่ถูกต้อง (Invalid magic bytes)")

    # ใช้ relative path เสมอ — CERT_UPLOAD_FOLDER เป็น relative อยู่แล้ว
    user_cert_folder = os.path.join(CERT_UPLOAD_FOLDER, user_id)
    Path(user_cert_folder).mkdir(parents=True, exist_ok=True)

    unique_name = f"{uuid.uuid4()}{file_ext}"
    relative_path = os.path.join(user_cert_folder, unique_name)  # uploads/certificates/{user_id}/xxx.pdf
    cert_url = _to_relative_url(relative_path)

    with open(relative_path, "wb") as f:
        f.write(contents)

    cert_doc = {
        "user_id": user_id,
        "file_name": file.filename,
        "file_path": relative_path,   # always relative
        "file_url": cert_url,
        "file_size": len(contents),
        "uploaded_at": datetime.now(timezone.utc),
    }
    result = await db.certificates.insert_one(cert_doc)

    logger.info(f"[Cert] User {user_id} uploaded cert: {file.filename}")

    return {
        "id": str(result.inserted_id),
        "file_name": file.filename,
        "file_url": cert_url,
        "file_size": len(contents),
        "message": "อัปโหลดใบ Certificate สำเร็จ"
    }


@router.get("/my-certs")
async def get_my_certificates(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_database)
):
    """📋 ดูรายการใบ Certificate ของฉัน"""
    certs = await db.certificates.find(
        {"user_id": user_id}
    ).sort("uploaded_at", -1).to_list(length=20)

    return [{
        "id": str(c["_id"]),
        "file_name": c["file_name"],
        "file_url": c["file_url"],
        "file_size": c["file_size"],
        "uploaded_at": c["uploaded_at"].isoformat()
    } for c in certs]


# =============================================================================
# 🏥 HEALTH CHECK API - ตรวจสอบสถานะระบบ
# =============================================================================

@router.get("/health")
async def resume_api_health():
    """🏥 ตรวจสอบสถานะ Resume API"""
    
    return {
        "status": "healthy",
        "service": "Resume Upload & Processing API",
        "version": "1.0.0",
        "features": [
            "อัปโหลดและตรวจสอบไฟล์ PDF",
            "ดึงข้อความจาก PDF (PyPDF2 + pdfplumber)",
            "จัดเก็บและจัดการ Resume",
            "ติดตามสถานะการประมวลผล",
            "ตรวจสอบขนาดและประเภทไฟล์"
        ],
        "upload_config": {
            "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024),
            "allowed_extensions": list(ALLOWED_EXTENSIONS),
            "upload_folder": UPLOAD_FOLDER
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }