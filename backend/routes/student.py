# backend/routes/student.py - Student Profile Management Routes
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from datetime import datetime
from bson import ObjectId
from typing import Optional
import os
import uuid

# Local imports
from core.auth import get_current_user_id, hash_password, verify_password
from core.database import get_database
from core.models import ChangePasswordRequest

# Create router
router = APIRouter(prefix="/student", tags=["Student Management"])

# =============================================================================
# PYDANTIC MODELS สำหรับ Student
# =============================================================================
from pydantic import BaseModel, EmailStr, validator

class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    
    @validator('full_name')
    def name_must_not_be_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Full name cannot be empty')
        return v.strip() if v else None
    
    @validator('phone')
    def phone_must_be_valid(cls, v):
        if v is not None and v.strip() == "":
            return None
        return v.strip() if v else None

class StudentProfileResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    user_type: str
    created_at: datetime
    updated_at: Optional[datetime] = None

# =============================================================================
# FILE UPLOAD CONFIGURATION
# =============================================================================
UPLOAD_DIR = "uploads/profiles"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
async def verify_student_access(user_id: str):
    """ตรวจสอบว่าเป็น Student และมีสิทธิ์เข้าถึง"""
    db = get_database()
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        user = await db.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.get("user_type") != "Student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student access required."
        )
    
    return user

# =============================================================================
# GET STUDENT PROFILE
# =============================================================================
@router.get("/profile", response_model=StudentProfileResponse)
async def get_student_profile(user_id: str = Depends(get_current_user_id)):
    """ดึงข้อมูลโปรไฟล์ของนักศึกษา"""
    try:
        user = await verify_student_access(user_id)
        
        return StudentProfileResponse(
            id=str(user["_id"]),
            username=user["username"],
            email=user["email"],
            full_name=user["full_name"],
            phone=user.get("phone"),
            profile_image=user.get("profile_image"),
            user_type=user["user_type"],
            created_at=user["created_at"],
            updated_at=user.get("updated_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile: {str(e)}"
        )

# =============================================================================
# UPDATE STUDENT PROFILE
# =============================================================================
@router.put("/profile")
async def update_student_profile(
    profile_data: StudentProfileUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """อัปเดตข้อมูลโปรไฟล์ของนักศึกษา"""
    try:
        db = get_database()
        existing_user = await verify_student_access(user_id)
        
        # สร้าง update data
        update_data = {"updated_at": datetime.utcnow()}
        
        # อัปเดต full_name
        if profile_data.full_name is not None:
            update_data["full_name"] = profile_data.full_name
            
        # อัปเดต email (ตรวจสอบซ้ำ)
        if profile_data.email is not None:
            email_check = await db.users.find_one({
                "email": profile_data.email,
                "_id": {"$ne": existing_user["_id"]}
            })
            if email_check:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )
            update_data["email"] = profile_data.email
            
        # อัปเดต phone
        if profile_data.phone is not None:
            update_data["phone"] = profile_data.phone
        
        # ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
        if len(update_data) == 1:  # มีแค่ updated_at
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes provided"
            )
        
        # อัปเดต user
        result = await db.users.update_one(
            {"_id": existing_user["_id"]},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes made"
            )
        
        return {
            "message": "Profile updated successfully",
            "updated_fields": list(update_data.keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

# =============================================================================
# UPLOAD PROFILE IMAGE
# =============================================================================
@router.post("/profile/upload-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """อัปโหลดรูปโปรไฟล์"""
    try:
        db = get_database()
        user = await verify_student_access(user_id)
        
        # ตรวจสอบไฟล์
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file uploaded"
            )
        
        # ตรวจสอบนามสกุลไฟล์
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # ตรวจสอบขนาดไฟล์
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 5MB"
            )
        
        # สร้างชื่อไฟล์ใหม่
        file_id = str(uuid.uuid4())
        filename = f"{user_id}_{file_id}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # ลบรูปเก่า (ถ้ามี)
        old_image = user.get("profile_image")
        if old_image and old_image.startswith("/uploads/profiles/"):
            old_file_path = old_image[1:]  # เอา / หน้าออก
            if os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                except:
                    pass  # ไม่สำคัญถ้าลบไม่ได้
        
        # บันทึกไฟล์ใหม่
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        
        # อัปเดตฐานข้อมูล
        update_result = await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "profile_image": f"/uploads/profiles/{filename}",
                "updated_at": datetime.utcnow()
            }}
        )
        
        if update_result.modified_count == 0:
            # ลบไฟล์ถ้าอัปเดต DB ไม่สำเร็จ
            try:
                os.remove(file_path)
            except:
                pass
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile image in database"
            )
        
        return {
            "message": "Profile image uploaded successfully",
            "image_url": f"/uploads/profiles/{filename}",
            "filename": filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )

# =============================================================================
# DELETE PROFILE IMAGE
# =============================================================================
@router.delete("/profile/image")
async def delete_profile_image(user_id: str = Depends(get_current_user_id)):
    """ลบรูปโปรไฟล์"""
    try:
        db = get_database()
        user = await verify_student_access(user_id)
        
        # ตรวจสอบว่ามีรูปโปรไฟล์หรือไม่
        current_image = user.get("profile_image")
        if not current_image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No profile image found"
            )
        
        # ลบไฟล์
        if current_image.startswith("/uploads/profiles/"):
            file_path = current_image[1:]  # เอา / หน้าออก
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Failed to delete file {file_path}: {e}")
        
        # อัปเดตฐานข้อมูล
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$unset": {"profile_image": ""}, "$set": {"updated_at": datetime.utcnow()}}
        )
        
        return {"message": "Profile image deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete profile image: {str(e)}"
        )

# =============================================================================
# CHANGE PASSWORD
# =============================================================================
@router.post("/change-password")
async def change_student_password(
    password_data: ChangePasswordRequest,
    user_id: str = Depends(get_current_user_id)
):
    """เปลี่ยนรหัสผ่านของนักศึกษา"""
    try:
        db = get_database()
        user = await verify_student_access(user_id)
        
        # ตรวจสอบ current password
        if not verify_password(password_data.current_password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Hash new password
        new_password_hash = hash_password(password_data.new_password)
        
        # อัปเดต password
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "password_hash": new_password_hash,
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )

# =============================================================================
# STUDENT DASHBOARD INFO
# =============================================================================
@router.get("/dashboard")
async def get_student_dashboard(user_id: str = Depends(get_current_user_id)):
    """ดึงข้อมูลสำหรับ Student Dashboard"""
    try:
        db = get_database()
        user = await verify_student_access(user_id)
        
        # ข้อมูลพื้นฐาน
        dashboard_data = {
            "user_info": {
                "name": user["full_name"],
                "email": user["email"],
                "profile_image": user.get("profile_image")
            },
            "stats": {
                "resumes_uploaded": 0,  # จะเพิ่มทีหลังเมื่อมี resume system
                "jobs_applied": 0,      # จะเพิ่มทีหลังเมื่อมี job application system
                "profile_completeness": calculate_profile_completeness(user)
            },
            "recent_activity": [],      # จะเพิ่มทีหลัง
            "notifications": []         # จะเพิ่มทีหลัง
        }
        
        return dashboard_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard data: {str(e)}"
        )

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
def calculate_profile_completeness(user: dict) -> int:
    """คำนวณความสมบูรณ์ของโปรไฟล์ (0-100%)"""
    total_fields = 5
    completed_fields = 0
    
    # ข้อมูลพื้นฐานที่ต้องมี
    required_fields = ["full_name", "email", "username"]
    optional_fields = ["phone", "profile_image"]
    
    # นับข้อมูลพื้นฐาน
    for field in required_fields:
        if user.get(field):
            completed_fields += 1
    
    # นับข้อมูลเสริม
    for field in optional_fields:
        if user.get(field):
            completed_fields += 1
    
    return int((completed_fields / total_fields) * 100)