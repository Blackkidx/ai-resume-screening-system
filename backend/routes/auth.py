# =============================================================================
# SIMPLE AUTHENTICATION ROUTES 🔐
# =============================================================================
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId

# Local imports
from core.models import (
    UserRegisterRequest, UserLoginRequest, UserResponse, 
    TokenResponse, UserUpdateRequest, ChangePasswordRequest, UserType
)
from core.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user_id, ACCESS_TOKEN_EXPIRE_MINUTES
)
from core.database import get_database

# Create router
router = APIRouter(prefix="/auth", tags=["Authentication"])

# =============================================================================
# REGISTER - สมัครสมาชิก (Student only)
# =============================================================================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegisterRequest):
    """สมัครสมาชิก - เฉพาะนักศึกษาเท่านั้น"""
    db = get_database()
    
    # บังคับให้เป็น Student เท่านั้น
    if user_data.user_type != UserType.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration is only available for students"
        )
    
    # ตรวจสอบ username ซ้ำ
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # ตรวจสอบ email ซ้ำ
    existing_email = await db.users.find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = hash_password(user_data.password)
    
    # สร้าง user document
    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": password_hash,
        "full_name": user_data.full_name,
        "phone": user_data.phone,
        "user_type": user_data.user_type.value,
        "company_id": None,
        "is_active": True,
        "is_verified": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None
    }
    
    # บันทึกลง database
    result = await db.users.insert_one(user_doc)
    
    # ดึงข้อมูล user ที่สร้างแล้ว
    created_user = await db.users.find_one({"_id": result.inserted_id})
    
    # Return response
    return UserResponse(
        id=str(created_user["_id"]),
        username=created_user["username"],
        email=created_user["email"],
        full_name=created_user["full_name"],
        phone=created_user.get("phone"),
        user_type=UserType(created_user["user_type"]),
        is_active=created_user["is_active"],
        created_at=created_user["created_at"]
    )

# =============================================================================
# LOGIN - เข้าสู่ระบบ (All roles)
# =============================================================================

@router.post("/login", response_model=TokenResponse)
async def login_user(login_data: UserLoginRequest):
    """เข้าสู่ระบบ - ทุก Role"""
    db = get_database()
    
    # หา user จาก username
    user = await db.users.find_one({"username": login_data.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # ตรวจสอบ password
    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # ตรวจสอบ account active
    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # สร้าง JWT token
    token_data = {
        "sub": str(user["_id"]),
        "username": user["username"],
        "user_type": user["user_type"],
        "email": user["email"]
    }
    
    access_token = create_access_token(token_data)
    
    # อัปเดต last_login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Prepare user info
    user_info = UserResponse(
        id=str(user["_id"]),
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        phone=user.get("phone"),
        user_type=UserType(user["user_type"]),
        is_active=user["is_active"],
        created_at=user["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_info=user_info
    )

# =============================================================================
# GET CURRENT USER - ดูข้อมูลตัวเอง
# =============================================================================

# ในไฟล์ routes/auth.py หา endpoint /auth/me

# ในไฟล์ routes/auth.py หา endpoint /auth/me

@router.get("/me")
async def get_current_user_info(user_id: str = Depends(get_current_user_id)):
    """Get current user information"""
    from core.database import get_database
    from bson.objectid import ObjectId  # ✅ ใช้ pymongo.bson
    
    try:
        db = get_database()
        
        # ✅ แก้ไข: ลองทั้ง ObjectId และ string
        try:
            # ลอง ObjectId ก่อน (MongoDB default)
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except:
            # ถ้าไม่ได้ ลอง string
            user = await db.users.find_one({"_id": user_id})
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Convert ObjectId to string for JSON response
        if "_id" in user:
            user["id"] = str(user["_id"])
            del user["_id"]
        
        # Remove sensitive data
        if "hashed_password" in user:
            del user["hashed_password"]
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
# =============================================================================
# CHANGE PASSWORD - เปลี่ยนรหัสผ่าน
# =============================================================================

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """เปลี่ยนรหัสผ่าน"""
    db = get_database()
    
    # หา user ปัจจุบัน
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
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
        {"_id": ObjectId(current_user_id)},
        {
            "$set": {
                "password_hash": new_password_hash,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Password changed successfully"}

# =============================================================================
# LOGOUT - ออกจากระบบ
# =============================================================================

@router.post("/logout")
async def logout_user():
    """ออกจากระบบ (Client จะลบ token เอง)"""
    return {"message": "Logged out successfully"}