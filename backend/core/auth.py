import os
import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer for token authentication
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

# Alias for backward compatibility
def hash_password(password: str) -> str:
    """Hash a password (alias for get_password_hash)"""
    return get_password_hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    """Decode JWT access token"""
    try:
        # Remove 'Bearer ' prefix if present (multiple ways)
        if token.startswith("Bearer "):
            token = token[7:]
        elif token.startswith("bearer "):
            token = token[7:]
        
        # Debug: print token info
        print(f"🔍 Decoding token: {token[:50]}...")
        print(f"🔍 Token length: {len(token)}")
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✅ Token decoded successfully: {payload.get('username', 'unknown')}")
        return payload
        
    except jwt.ExpiredSignatureError:
        print("❌ Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.DecodeError as e:
        print(f"❌ Token decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        print(f"❌ Invalid token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user ID from JWT token"""
    token = credentials.credentials
    
    # ✅ แก้ไขใหม่ - ไม่ใช้ try-except ซ้อน
    payload = decode_access_token(token)  # จะ raise HTTPException ถ้ามีปัญหา
    
    user_id: str = payload.get("sub")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: no user ID",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_id

# Optional: Get current user object (if you need full user data)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """Get current user object from database"""
    from core.database import get_database
    from bson.objectid import ObjectId  # ✅ ใช้ pymongo.bson แทน
    
    try:
        db = get_database()
        
        # ✅ แก้ไข: ลองทั้ง ObjectId และ string
        try:
            # ลอง ObjectId ก่อน
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except:
            # ถ้าไม่ได้ ลอง string
            user = await db.users.find_one({"_id": user_id})
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Convert ObjectId to string for JSON serialization
        if "_id" in user:
            user["id"] = str(user["_id"])
            del user["_id"]
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )