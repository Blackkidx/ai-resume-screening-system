# =============================================================================
# SIMPLE USER MODELS 👤
# เริ่มแบบง่าย ๆ ก่อน
# =============================================================================
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class UserType(str, Enum):
    """ประเภทผู้ใช้"""
    STUDENT = "student"    # นักศึกษา
    HR = "hr"             # HR
    ADMIN = "admin"       # Admin

# =============================================================================
# REQUEST MODELS (สำหรับรับข้อมูลจาก Frontend)
# =============================================================================

class UserRegisterRequest(BaseModel):
    """ข้อมูลสำหรับสมัครสมาชิก"""
    username: str
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    user_type: UserType

class UserLoginRequest(BaseModel):
    """ข้อมูลสำหรับเข้าสู่ระบบ"""
    username: str
    password: str

class UserUpdateRequest(BaseModel):
    """ข้อมูลสำหรับแก้ไขโปรไฟล์"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class ChangePasswordRequest(BaseModel):
    """ข้อมูลสำหรับเปลี่ยนรหัสผ่าน"""
    current_password: str
    new_password: str

# =============================================================================
# RESPONSE MODELS (สำหรับส่งข้อมูลกลับไป Frontend)
# =============================================================================

class UserResponse(BaseModel):
    """ข้อมูลผู้ใช้ (ไม่รวม password)"""
    id: str
    username: str
    email: str
    full_name: str
    phone: Optional[str]
    user_type: UserType
    is_active: bool
    created_at: datetime

class TokenResponse(BaseModel):
    """ข้อมูล JWT token"""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user_info: UserResponse