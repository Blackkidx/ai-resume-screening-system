# แทนที่ไฟล์ backend/routes/auth.py เดิม
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
# INITIALIZE USER ROLES - สร้าง default roles
# =============================================================================
async def ensure_user_roles_exist(db):
    """ตรวจสอบและสร้าง default user roles"""
    try:
        # ตรวจสอบว่ามี roles อยู่แล้วหรือไม่
        existing_roles = await db.user_roles.count_documents({})
        
        if existing_roles == 0:
            # สร้าง default roles
            default_roles = [
                {
                    "role_name": "Student",
                    "description": "นักศึกษาที่มาฝึกงาน",
                    "permissions": {
                        "can_upload_resume": True,
                        "can_view_jobs": True,
                        "can_apply_jobs": True,
                        "can_view_profile": True
                    },
                    "created_at": datetime.utcnow()
                },
                {
                    "role_name": "HR",
                    "description": "เจ้าหน้าที่ HR ของบริษัท",
                    "permissions": {
                        "can_create_jobs": True,
                        "can_view_resumes": True,
                        "can_screen_candidates": True,
                        "can_manage_interviews": True
                    },
                    "created_at": datetime.utcnow()
                },
                {
                    "role_name": "Admin",
                    "description": "ผู้ดูแลระบบ",
                    "permissions": {
                        "can_manage_users": True,
                        "can_manage_companies": True,
                        "can_view_analytics": True,
                        "can_manage_system": True
                    },
                    "created_at": datetime.utcnow()
                }
            ]
            
            # บันทึก roles ลง database
            await db.user_roles.insert_many(default_roles)
            print("✅ Created default user roles")
        
    except Exception as e:
        print(f"⚠️ Error creating user roles: {e}")

# =============================================================================
# REGISTER - สมัครสมาชิก (Student only) + บันทึก role
# =============================================================================
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegisterRequest):
    """สมัครสมาชิก - เฉพาะนักศึกษาเท่านั้น"""
    db = get_database()
    
    # ตรวจสอบและสร้าง user roles หากยังไม่มี
    await ensure_user_roles_exist(db)
    
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
    
    # สร้าง full_name จาก first_name + last_name (ถ้ามี)
    first_name = user_data.first_name
    last_name = user_data.last_name
    if first_name and last_name:
        full_name = f"{first_name} {last_name}"
    elif first_name:
        full_name = first_name
    else:
        full_name = user_data.full_name

    # สร้าง user document
    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": password_hash,
        "full_name": full_name,
        "first_name": first_name,
        "last_name": last_name,
        "phone": user_data.phone,
        "user_type": user_data.user_type.value,
        "company_id": None,
        "is_active": True,
        "is_verified": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None
    }
    
    # บันทึก user ลง database
    result = await db.users.insert_one(user_doc)
    user_id = result.inserted_id
    
    # ⭐ เพิ่ม: บันทึก user role mapping
    try:
        # หา role_id ของ Student
        student_role = await db.user_roles.find_one({"role_name": "Student"})
        
        if student_role:
            # สร้าง user-role mapping
            user_role_mapping = {
                "user_id": user_id,
                "role_id": student_role["_id"],
                "role_name": "Student",
                "assigned_at": datetime.utcnow(),
                "assigned_by": "system"  # ระบบสมัครเอง
            }
            
            # บันทึกลง user_role_assignments collection
            await db.user_role_assignments.insert_one(user_role_mapping)
            print(f"✅ Assigned Student role to user {user_data.username}")
        
    except Exception as e:
        print(f"⚠️ Failed to assign role: {e}")
        # ไม่ให้ error นี้หยุดการสมัครสมาชิก
    
    # ดึงข้อมูล user ที่สร้างแล้ว
    created_user = await db.users.find_one({"_id": user_id})
    
    # Return response
    return UserResponse(
        id=str(created_user["_id"]),
        username=created_user["username"],
        email=created_user["email"],
        full_name=created_user["full_name"],
        first_name=created_user.get("first_name"),
        last_name=created_user.get("last_name"),
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
    
    # ⭐ เพิ่ม: ดึงข้อมูล role ของ user
    user_roles = []
    try:
        role_assignments = await db.user_role_assignments.find(
            {"user_id": user["_id"]}
        ).to_list(length=10)
        
        user_roles = [assignment["role_name"] for assignment in role_assignments]
        
    except Exception as e:
        print(f"⚠️ Failed to get user roles: {e}")
        # ใช้ user_type จาก user document แทน
        user_roles = [user.get("user_type", "Student")]
    
    # สร้าง JWT token
    token_data = {
        "sub": str(user["_id"]),
        "username": user["username"],
        "user_type": user["user_type"],
        "roles": user_roles,  # เพิ่ม roles ใน token
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
        first_name=user.get("first_name"),
        last_name=user.get("last_name"),
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
# GET CURRENT USER - ดูข้อมูลตัวเอง + roles
# =============================================================================
@router.get("/me")
async def get_current_user_info(user_id: str = Depends(get_current_user_id)):
    """Get current user information พร้อม roles"""
    try:
        db = get_database()
        
        # ดึงข้อมูล user
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except:
            user = await db.users.find_one({"_id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # ดึงข้อมูล roles
        user_roles = []
        try:
            role_assignments = await db.user_role_assignments.find(
                {"user_id": user["_id"]}
            ).to_list(length=10)
            
            user_roles = [assignment["role_name"] for assignment in role_assignments]
            
        except Exception as e:
            print(f"⚠️ Failed to get user roles: {e}")
            user_roles = [user.get("user_type", "Student")]
        
        # เตรียมข้อมูลส่งกลับ
        user_data = {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "phone": user.get("phone"),
            "user_type": user["user_type"],
            "roles": user_roles,  # เพิ่ม roles
            "is_active": user["is_active"],
            "created_at": user["created_at"]
        }
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# =============================================================================
# เหลือเหมือนเดิม...
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

@router.post("/logout")
async def logout_user():
    """ออกจากระบบ (Client จะลบ token เอง)"""
    return {"message": "Logged out successfully"}