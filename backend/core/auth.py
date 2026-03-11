# =============================================================================
# 📋 AUTHENTICATION UTILITIES
# =============================================================================
import os
import secrets
import warnings
import hashlib  # ⭐ เพิ่มบรรทัดนี้สำหรับแก้ปัญหา bcrypt 72 bytes
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv

# Load .env explicitly from the backend directory to prevent working-dir issues
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path=env_path)

# =============================================================================
# CONFIGURATION 📊
# =============================================================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    warnings.warn("JWT_SECRET_KEY is not set! Generating a random 32-byte key for this session. Tokens will invalidate on restart.")
    SECRET_KEY = secrets.token_hex(32)
elif SECRET_KEY == "ai-resume-secret-key-2025-super-secure-jwt-token":
    warnings.warn("Using default JWT_SECRET_KEY! Please change it in production for security.")

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer for token extraction
security = HTTPBearer()

# =============================================================================
# TOKEN BLACKLIST (In-Memory) 🚫
# =============================================================================
_token_blacklist: set[str] = set()

def blacklist_token(token: str) -> None:
    """เพิ่ม token เข้า blacklist เมื่อ logout"""
    _token_blacklist.add(token)

def is_token_blacklisted(token: str) -> bool:
    """ตรวจสอบว่า token อยู่ใน blacklist หรือไม่"""
    return token in _token_blacklist

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
    """ตรวจสอบรหัสผ่าน (รองรับทั้งแบบเก่าและแบบใหม่)
    
    Args:
        plain_password (str): รหัสผ่านที่ user กรอก
        hashed_password (str): รหัสผ่านที่ hash แล้วจาก database
        
    Returns:
        bool: True ถ้ารหัสผ่านถูกต้อง, False ถ้าไม่ถูกต้อง
    """
    try:
        # วิธีที่ 1: ลองแบบใหม่ (SHA256 + bcrypt) ก่อน
        password_sha = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
        if pwd_context.verify(password_sha, hashed_password):
            return True
    except Exception as e:
        pass
    
    try:
        # วิธีที่ 2: ลองแบบเก่า (bcrypt โดยตรง) สำหรับ backward compatibility
        if pwd_context.verify(plain_password, hashed_password):
            return True
    except Exception as e:
        pass
    
    # ถ้าทั้ง 2 วิธีไม่ได้ผล
    return False

# =============================================================================
# JWT TOKEN FUNCTIONS 🎫
# =============================================================================
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """สร้าง JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """ถอดรหัส JWT token"""
    if is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
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