# =============================================================================
# SIMPLE AUTHENTICATION UTILITIES 🔐
# =============================================================================
import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer
from dotenv import load_dotenv

# โหลดไฟล์ .env
load_dotenv()

# =============================================================================
# JWT CONFIGURATION
# =============================================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 วัน

# HTTP Bearer for FastAPI
security = HTTPBearer()

# =============================================================================
# PASSWORD FUNCTIONS
# =============================================================================

def hash_password(password: str) -> str:
    """เข้ารหัสรหัสผ่าน"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ตรวจสอบรหัสผ่าน"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

# =============================================================================
# JWT TOKEN FUNCTIONS
# =============================================================================

def create_access_token(data: Dict[str, Any]) -> str:
    """สร้าง JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """ถอดรหัส JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# =============================================================================
# AUTHENTICATION DEPENDENCIES
# =============================================================================

async def get_current_user_id(credentials = Depends(security)) -> str:
    """ดึง user_id จาก JWT token"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    return user_id

async def get_current_user_data(credentials = Depends(security)) -> Dict[str, Any]:
    """ดึงข้อมูล user ทั้งหมดจาก JWT token"""
    token = credentials.credentials
    payload = decode_access_token(token)
    return payload

# =============================================================================
# ROLE-BASED ACCESS CONTROL
# =============================================================================

def require_roles(allowed_roles: list):
    """ตรวจสอบ role ของผู้ใช้"""
    async def role_checker(user_data: Dict[str, Any] = Depends(get_current_user_data)):
        user_role = user_data.get("user_type")
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        
        return user_data
    
    return role_checker

# Shortcuts สำหรับ role ต่าง ๆ
require_student = require_roles(["student"])
require_hr = require_roles(["hr", "admin"])
require_admin = require_roles(["admin"])