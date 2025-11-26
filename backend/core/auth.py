# =============================================================================
# 📋 AUTHENTICATION UTILITIES
# =============================================================================
import os
import hashlib  # ⭐ เพิ่มบรรทัดนี้สำหรับแก้ปัญหา bcrypt 72 bytes
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

# =============================================================================
# CONFIGURATION 📊
# =============================================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ai-resume-secret-key-2025-super-secure-jwt-token")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer for token extraction
security = HTTPBearer()

# =============================================================================
# PASSWORD FUNCTIONS 🔒 (แก้ไขแล้ว)
# =============================================================================
def hash_password(password: str) -> str:
    """เข้ารหัสรหัสผ่านด้วย SHA256 + bcrypt
    
    ใช้ SHA256 ก่อนเพื่อแปลง password ทุกความยาวให้เป็น 64 hex characters
    จากนั้นจึง hash ด้วย bcrypt (ป้องกันปัญหา 72 bytes limit)
    
    Args:
        password (str): รหัสผ่านที่ต้องการเข้ารหัส
        
    Returns:
        str: รหัสผ่านที่เข้ารหัสแล้วด้วย bcrypt
    """
    # Step 1: Hash password ด้วย SHA256 (ได้ 64 hex chars เสมอ)
    password_sha = hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    # Step 2: Hash ด้วย bcrypt
    return pwd_context.hash(password_sha)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ตรวจสอบรหัสผ่าน (ใช้วิธีเดียวกับ hash_password)
    
    Args:
        plain_password (str): รหัสผ่านที่ user กรอก
        hashed_password (str): รหัสผ่านที่ hash แล้วจาก database
        
    Returns:
        bool: True ถ้ารหัสผ่านถูกต้อง, False ถ้าไม่ถูกต้อง
    """
    # Hash password ด้วย SHA256 ก่อน (เหมือนตอน register)
    password_sha = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    
    # ตรวจสอบด้วย bcrypt
    return pwd_context.verify(password_sha, hashed_password)

# =============================================================================
# JWT TOKEN FUNCTIONS 🎫
# =============================================================================
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """สร้าง JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """ถอดรหัส JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# =============================================================================
# DEPENDENCY FUNCTIONS 🔗
# =============================================================================
async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """ดึง user_id ของผู้ใช้ปัจจุบันจาก JWT token"""
    try:
        payload = decode_access_token(credentials.credentials)
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_id
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_data(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """ดึงข้อมูลผู้ใช้ปัจจุบันทั้งหมดจาก JWT token"""
    try:
        payload = decode_access_token(credentials.credentials)
        
        if payload.get("sub") is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return payload
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# =============================================================================
# ROLE-BASED ACCESS CONTROL 👥
# =============================================================================
def require_role(allowed_roles: list):
    """Decorator สำหรับตรวจสอบ role ของผู้ใช้"""
    async def role_checker(user_data: Dict[str, Any] = Depends(get_current_user_data)):
        user_type = user_data.get("user_type")
        
        if user_type not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        
        return user_data
    
    return role_checker

# Specific role checkers
async def require_admin(user_data: Dict[str, Any] = Depends(get_current_user_data)):
    """ต้องเป็น Admin เท่านั้น"""
    if user_data.get("user_type") != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user_data

async def require_hr_or_admin(user_data: Dict[str, Any] = Depends(get_current_user_data)):
    """ต้องเป็น HR หรือ Admin"""
    user_type = user_data.get("user_type")
    if user_type not in ["HR", "Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR or Admin access required"
        )
    return user_data

# =============================================================================
# TOKEN VALIDATION 🔍
# =============================================================================
def validate_token(token: str) -> bool:
    """ตรวจสอบว่า token ยังใช้งานได้หรือไม่"""
    try:
        payload = decode_access_token(token)
        return True
    except HTTPException:
        return False

def get_token_expiry(token: str) -> Optional[datetime]:
    """ดึงเวลาหมดอายุของ token"""
    try:
        payload = decode_access_token(token)
        exp_timestamp = payload.get("exp")
        if exp_timestamp:
            return datetime.fromtimestamp(exp_timestamp)
        return None
    except HTTPException:
        return None