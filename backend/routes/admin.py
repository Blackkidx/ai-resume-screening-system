# backend/routes/admin.py
from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
from pymongo import ASCENDING, DESCENDING

# Local imports
from core.models import UserType
from core.auth import require_admin, get_current_user_data
from core.database import get_database

# Create router
router = APIRouter(prefix="/admin", tags=["Admin Management"])

# =============================================================================
# PYDANTIC MODELS สำหรับ Admin
# =============================================================================
from pydantic import BaseModel, EmailStr

class UserListResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    user_type: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    user_type: Optional[UserType] = None
    is_active: Optional[bool] = None

class UserCreateRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    user_type: UserType
    is_active: bool = True

class AdminStatsResponse(BaseModel):
    total_users: int
    student_count: int
    hr_count: int
    admin_count: int
    active_users: int
    inactive_users: int

# =============================================================================
# ADMIN DASHBOARD - ข้อมูลสถิติ
# =============================================================================
@router.get("/dashboard", response_model=AdminStatsResponse)
async def get_admin_dashboard(admin_data: dict = Depends(require_admin)):
    """ดึงข้อมูลสถิติสำหรับ Admin Dashboard"""
    try:
        db = get_database()
        
        # นับจำนวน users ทั้งหมด
        total_users = await db.users.count_documents({})
        
        # นับตาม user_type
        student_count = await db.users.count_documents({"user_type": "Student"})
        hr_count = await db.users.count_documents({"user_type": "HR"})
        admin_count = await db.users.count_documents({"user_type": "Admin"})
        
        # นับตาม status
        active_users = await db.users.count_documents({"is_active": True})
        inactive_users = await db.users.count_documents({"is_active": False})
        
        return AdminStatsResponse(
            total_users=total_users,
            student_count=student_count,
            hr_count=hr_count,
            admin_count=admin_count,
            active_users=active_users,
            inactive_users=inactive_users
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard data: {str(e)}"
        )

# =============================================================================
# USER MANAGEMENT - จัดการผู้ใช้
# =============================================================================
@router.get("/users", response_model=List[UserListResponse])
async def get_all_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    user_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    admin_data: dict = Depends(require_admin)
):
    """ดึงรายการผู้ใช้ทั้งหมด พร้อม pagination และ filter"""
    try:
        db = get_database()
        
        # สร้าง filter
        filter_query = {}
        
        if search:
            filter_query["$or"] = [
                {"username": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"full_name": {"$regex": search, "$options": "i"}}
            ]
        
        if user_type:
            filter_query["user_type"] = user_type
            
        if is_active is not None:
            filter_query["is_active"] = is_active
        
        # คำนวณ skip และ limit
        skip = (page - 1) * limit
        
        # ดึงข้อมูล users
        cursor = db.users.find(filter_query).sort("created_at", DESCENDING).skip(skip).limit(limit)
        users = await cursor.to_list(length=limit)
        
        # แปลงข้อมูล
        result = []
        for user in users:
            result.append(UserListResponse(
                id=str(user["_id"]),
                username=user["username"],
                email=user["email"],
                full_name=user["full_name"],
                user_type=user["user_type"],
                is_active=user["is_active"],
                created_at=user["created_at"],
                last_login=user.get("last_login")
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )

@router.get("/users/{user_id}")
async def get_user_by_id(
    user_id: str,
    admin_data: dict = Depends(require_admin)
):
    """ดึงข้อมูลผู้ใช้ตาม ID"""
    try:
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
        
        # ดึงข้อมูล roles
        user_roles = []
        try:
            role_assignments = await db.user_role_assignments.find(
                {"user_id": user["_id"]}
            ).to_list(length=10)
            
            user_roles = [assignment["role_name"] for assignment in role_assignments]
        except:
            user_roles = [user.get("user_type", "Student")]
        
        return {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "phone": user.get("phone"),
            "user_type": user["user_type"],
            "roles": user_roles,
            "is_active": user["is_active"],
            "created_at": user["created_at"],
            "updated_at": user.get("updated_at"),
            "last_login": user.get("last_login")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user: {str(e)}"
        )

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user_update: UserUpdateRequest,
    admin_data: dict = Depends(require_admin)
):
    """อัปเดตข้อมูลผู้ใช้"""
    try:
        db = get_database()
        
        # ตรวจสอบว่า user มีอยู่หรือไม่
        try:
            existing_user = await db.users.find_one({"_id": ObjectId(user_id)})
        except:
            existing_user = await db.users.find_one({"_id": user_id})
        
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # สร้าง update data
        update_data = {"updated_at": datetime.utcnow()}
        
        if user_update.full_name is not None:
            update_data["full_name"] = user_update.full_name
        if user_update.email is not None:
            # ตรวจสอบ email ซ้ำ
            email_check = await db.users.find_one({
                "email": user_update.email,
                "_id": {"$ne": existing_user["_id"]}
            })
            if email_check:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists"
                )
            update_data["email"] = user_update.email
        if user_update.phone is not None:
            update_data["phone"] = user_update.phone
        if user_update.user_type is not None:
            update_data["user_type"] = user_update.user_type.value
        if user_update.is_active is not None:
            update_data["is_active"] = user_update.is_active
        
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
        
        # อัปเดต role ถ้ามีการเปลี่ยน user_type
        if user_update.user_type is not None:
            try:
                # ลบ role assignments เก่า
                await db.user_role_assignments.delete_many({"user_id": existing_user["_id"]})
                
                # หา role ใหม่
                new_role = await db.user_roles.find_one({"role_name": user_update.user_type.value})
                if new_role:
                    # สร้าง role assignment ใหม่
                    await db.user_role_assignments.insert_one({
                        "user_id": existing_user["_id"],
                        "role_id": new_role["_id"],
                        "role_name": user_update.user_type.value,
                        "assigned_at": datetime.utcnow(),
                        "assigned_by": admin_data.get("username", "admin")
                    })
            except Exception as e:
                print(f"⚠️ Failed to update role assignments: {e}")
        
        return {"message": "User updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin_data: dict = Depends(require_admin)
):
    """ลบผู้ใช้"""
    try:
        db = get_database()
        
        # ตรวจสอบว่า user มีอยู่หรือไม่
        try:
            existing_user = await db.users.find_one({"_id": ObjectId(user_id)})
        except:
            existing_user = await db.users.find_one({"_id": user_id})
        
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # ป้องกันไม่ให้ลบ admin ตัวเอง
        if str(existing_user["_id"]) == admin_data.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete yourself"
            )
        
        # ลบ user
        await db.users.delete_one({"_id": existing_user["_id"]})
        
        # ลบ role assignments
        await db.user_role_assignments.delete_many({"user_id": existing_user["_id"]})
        
        return {"message": "User deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )

# =============================================================================
# USER CREATION - สร้างผู้ใช้ใหม่
# =============================================================================
from core.auth import hash_password

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreateRequest,
    admin_data: dict = Depends(require_admin)
):
    """สร้างผู้ใช้ใหม่"""
    try:
        db = get_database()
        
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
                detail="Email already exists"
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
            "is_active": user_data.is_active,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None
        }
        
        # บันทึก user
        result = await db.users.insert_one(user_doc)
        user_id = result.inserted_id
        
        # สร้าง role assignment
        try:
            role = await db.user_roles.find_one({"role_name": user_data.user_type.value})
            if role:
                await db.user_role_assignments.insert_one({
                    "user_id": user_id,
                    "role_id": role["_id"],
                    "role_name": user_data.user_type.value,
                    "assigned_at": datetime.utcnow(),
                    "assigned_by": admin_data.get("username", "admin")
                })
        except Exception as e:
            print(f"⚠️ Failed to assign role: {e}")
        
        return {
            "message": "User created successfully",
            "user_id": str(user_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )