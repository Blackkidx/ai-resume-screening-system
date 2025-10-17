# =============================================================================
# 📝 PYDANTIC MODELS - สำหรับ API Request/Response
# =============================================================================
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional, List  # ⭐ เพิ่ม List ตรงนี้
from enum import Enum

# =============================================================================
# ENUMS 🏷️
# =============================================================================
class UserType(str, Enum):
    STUDENT = "Student"
    HR = "HR"
    ADMIN = "Admin"

# =============================================================================
# AUTH MODELS 🔐
# =============================================================================
class UserRegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    user_type: UserType = UserType.STUDENT
    
    @validator('username')
    def username_must_be_valid(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, underscore and hyphen')
        return v
    
    @validator('password')
    def password_must_be_strong(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    phone: Optional[str] = None
    user_type: UserType
    is_active: bool
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_info: UserResponse

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def password_must_be_strong(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

# =============================================================================
# RESUME MODELS 📄
# =============================================================================
class ResumeUploadResponse(BaseModel):
    id: str
    user_id: str
    file_path: str
    file_type: str
    original_filename: str
    uploaded_at: datetime

# =============================================================================
# JOB POSITION MODELS 💼
# =============================================================================
class JobPositionCreate(BaseModel):
    title: str
    description: str
    department: str
    duration: int  # วัน
    requirements: Optional[str] = None
    
class JobPositionResponse(BaseModel):
    id: str
    title: str
    description: str
    department: str
    duration: int
    is_active: bool
    created_by: str
    created_at: datetime

# =============================================================================
# SKILL MODELS 🛠️
# =============================================================================
class SkillCreate(BaseModel):
    name: str
    type: str  # Hard Skill, Soft Skill
    category: str

class SkillResponse(BaseModel):
    id: str
    name: str
    type: str
    category: str

# =============================================================================
# MATCHING MODELS 🎯
# =============================================================================
class MatchingResultResponse(BaseModel):
    id: str
    resume_id: str
    position_id: str
    technical_score: float
    soft_skill_score: float
    matching_score: float
    status: str
    created_at: datetime

# =============================================================================
# COMPANY MODELS 🏢
# =============================================================================
class CompanyCreate(BaseModel):
    name: str
    industry: str
    description: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Company name cannot be empty')
        return v.strip()

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None

class CompanyResponse(BaseModel):
    id: str
    name: str
    industry: str
    description: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # สถิติ HR
    hr_count: Optional[int] = 0
    active_hr_count: Optional[int] = 0

class CompanyHRAssignRequest(BaseModel):
    user_ids: List[str]  # ⭐ ตรงนี้ใช้ List ที่เรา import มาแล้ว
    
class CompanyHRResponse(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    is_active: bool
    assigned_at: datetime
    last_login: Optional[datetime] = None
    
    # เพิ่มที่ส่วนท้ายไฟล์
class ResumeUploadResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_path: str
    file_size: int
    status: str
    uploaded_at: datetime
    message: str

class ResumeStatusResponse(BaseModel):
    id: str
    status: str
    uploaded_at: datetime
    processed_at: Optional[datetime]
    file_name: str
    file_size: int
    text_length: int
    error_message: Optional[str]