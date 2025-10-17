# =============================================================================
# 📄 RESUME UPLOAD & PROCESSING API - FastAPI Version
# ไฟล์: backend/routes/resume.py
# =============================================================================

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from datetime import datetime
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
from pydantic import BaseModel

# สร้าง router สำหรับ Resume API
router = APIRouter(prefix="/resumes", tags=["Resume Management"])

# =============================================================================
# 📁 CONFIGURATION - การตั้งค่า
# =============================================================================
UPLOAD_FOLDER = "uploads/resumes"  # โฟลเดอร์เก็บไฟล์
ALLOWED_EXTENSIONS = {".pdf"}      # อนุญาตเฉพาะ PDF
MAX_FILE_SIZE = 15 * 1024 * 1024   # ขนาดไฟล์สูงสุด 15MB

# สร้างโฟลเดอร์ถ้ายังไม่มี
Path(UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)

# ตั้งค่า logging เพื่อดู log
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# 📋 PYDANTIC MODELS - โครงสร้างข้อมูล
# =============================================================================

class ResumeUploadResponse(BaseModel):
    """ข้อมูลที่ส่งกลับหลังอัปโหลดสำเร็จ"""
    id: str
    user_id: str
    file_name: str
    file_path: str
    file_size: int
    status: str
    uploaded_at: datetime
    message: str

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
    """ตรวจสอบขนาดไฟล์และอ่านข้อมูล"""
    
    # อ่านไฟล์ทั้งหมด
    contents = await file.read()
    file_size = len(contents)
    
    # ตรวจสอบขนาด
    if file_size > MAX_FILE_SIZE:
        return False, f"ไฟล์ใหญ่เกินไป {file_size} bytes (สูงสุด {MAX_FILE_SIZE} bytes)", b""
    
    return True, f"ขนาดไฟล์เหมาะสม: {file_size} bytes", contents

def extract_text_pypdf2(file_content: bytes) -> str:
    """ดึงข้อความด้วย PyPDF2"""
    try:
        # สร้าง file object จาก bytes
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        # อ่านทุกหน้า
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        return text.strip()
    except Exception as e:
        logger.error(f"PyPDF2 ดึงข้อความไม่ได้: {str(e)}")
        return ""

def extract_text_pdfplumber(file_content: bytes) -> str:
    """ดึงข้อความด้วย pdfplumber (แม่นยำกว่า)"""
    try:
        pdf_file = io.BytesIO(file_content)
        
        with pdfplumber.open(pdf_file) as pdf:
            text = ""
            # อ่านทุกหน้า
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        return text.strip()
    except Exception as e:
        logger.error(f"pdfplumber ดึงข้อความไม่ได้: {str(e)}")
        return ""

def extract_text_from_pdf(file_content: bytes) -> str:
    """ดึงข้อความจาก PDF โดยใช้หลายวิธี"""
    
    # ลอง pdfplumber ก่อน (แม่นยำกว่า)
    text = extract_text_pdfplumber(file_content)
    
    # ถ้าไม่ได้ผล ใช้ PyPDF2
    if not text or len(text.strip()) < 10:
        text = extract_text_pypdf2(file_content)
    
    return text

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
        
        # ขั้นตอนที่ 3: สร้างชื่อไฟล์ใหม่
        file_extension = Path(file.filename).suffix
        unique_filename = f"{user_id}_{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
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
            "uploaded_at": datetime.utcnow(),
            "processed_at": None,
            "status": "pending"  # pending = รอประมวลผล
        }
        
        result = await db.resumes.insert_one(resume_doc)
        resume_id = str(result.inserted_id)
        
        # ขั้นตอนที่ 6: ประมวลผล PDF (ดึงข้อความ)
        try:
            extracted_text = extract_text_from_pdf(file_content)
            
            if extracted_text and len(extracted_text.strip()) > 0:
                # ประมวลผลสำเร็จ
                await db.resumes.update_one(
                    {"_id": ObjectId(resume_id)},
                    {
                        "$set": {
                            "extracted_text": extracted_text,
                            "processed_at": datetime.utcnow(),
                            "status": "processed"  # processed = เสร็จแล้ว
                        }
                    }
                )
                logger.info(f"Resume {resume_id} ประมวลผลสำเร็จ")
                status_message = "processed"
            else:
                # ดึงข้อความไม่ได้
                await db.resumes.update_one(
                    {"_id": ObjectId(resume_id)},
                    {
                        "$set": {
                            "status": "error",
                            "error_message": "ไม่สามารถดึงข้อความจาก PDF ได้"
                        }
                    }
                )
                logger.warning(f"ไม่สามารถดึงข้อความจาก Resume {resume_id}")
                status_message = "error"
                
        except Exception as e:
            # เกิดข้อผิดพลาดในการประมวลผล
            await db.resumes.update_one(
                {"_id": ObjectId(resume_id)},
                {
                    "$set": {
                        "status": "error",
                        "error_message": str(e)
                    }
                }
            )
            logger.error(f"ประมวลผล Resume {resume_id} ไม่สำเร็จ: {str(e)}")
            status_message = "error"
        
        # ส่งผลลัพธ์กลับ
        return ResumeUploadResponse(
            id=resume_id,
            user_id=user_id,
            file_name=file.filename,
            file_path=file_path,
            file_size=file_size,
            status=status_message,
            uploaded_at=datetime.utcnow(),
            message="อัปโหลดและประมวลผล Resume สำเร็จ"
        )
        
    except HTTPException:
        raise  # ส่งต่อ HTTP error
    except Exception as e:
        logger.error(f"เกิดข้อผิดพลาดในการอัปโหลด: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"อัปโหลด Resume ไม่สำเร็จ: {str(e)}"
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
            detail=f"ตรวจสอบสถานะ Resume ไม่สำเร็จ: {str(e)}"
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
            detail=f"ดูรายละเอียด Resume ไม่สำเร็จ: {str(e)}"
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
                "has_error": bool(resume.get("error_message"))
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
            detail=f"ดูรายการ Resume ไม่สำเร็จ: {str(e)}"
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
            detail=f"ลบ Resume ไม่สำเร็จ: {str(e)}"
        )

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
        "timestamp": datetime.utcnow().isoformat()
    }