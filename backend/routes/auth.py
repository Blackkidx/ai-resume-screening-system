# backend/routes/auth.py
import random
import string
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status, Depends, Request
from bson import ObjectId
from pydantic import BaseModel, EmailStr

from core.models import (
    UserRegisterRequest, UserLoginRequest, UserResponse,
    TokenResponse, UserUpdateRequest, ChangePasswordRequest, UserType
)
from core.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user_id, ACCESS_TOKEN_EXPIRE_MINUTES, blacklist_token
)
from core.database import get_database

router = APIRouter(prefix="/auth", tags=["Authentication"])

# =============================================================================
# IN-MEMORY STORES
# _pending_registrations: ข้อมูลผู้ใช้รอยืนยัน OTP (ยังไม่บันทึกลง DB)
# _otp_store: OTP สำหรับ forgot-password
# Format:
#   _pending_registrations[email] = { user_data, otp, expires_at }
#   _otp_store[email]             = { otp, expires_at, reset_token }
# =============================================================================
_pending_registrations: dict = {}
_otp_store: dict = {}

OTP_EXPIRY_MINUTES = 10


def _generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))


def _send_register_otp_email(email: str, otp: str, full_name: str):
    """ส่ง OTP สำหรับการสมัครสมาชิก"""
    try:
        from services.email_service import send_otp_email
        send_otp_email(email, otp, full_name)
    except Exception as e:
        print(f"[Auth] Email send error: {e}")
    print(f"[DEV] Register OTP for {email}: {otp}")


def _send_reset_otp_email(email: str, otp: str, full_name: str):
    """ส่ง OTP สำหรับรีเซ็ตรหัสผ่าน"""
    try:
        from services.email_service import send_password_reset_email
        send_password_reset_email(email, otp, full_name)
    except Exception as e:
        print(f"[Auth] Reset email send error: {e}")
    print(f"[DEV] Reset OTP for {email}: {otp}")


# =============================================================================
# HELPERS
# =============================================================================
async def ensure_user_roles_exist(db):
    try:
        if await db.user_roles.count_documents({}) == 0:
            await db.user_roles.insert_many([
                {
                    "role_name": "Student",
                    "description": "นักศึกษาที่มาฝึกงาน",
                    "permissions": {"can_upload_resume": True, "can_view_jobs": True,
                                    "can_apply_jobs": True, "can_view_profile": True},
                    "created_at": datetime.utcnow()
                },
                {
                    "role_name": "HR",
                    "description": "เจ้าหน้าที่ HR ของบริษัท",
                    "permissions": {"can_create_jobs": True, "can_view_resumes": True,
                                    "can_screen_candidates": True, "can_manage_interviews": True},
                    "created_at": datetime.utcnow()
                },
                {
                    "role_name": "Admin",
                    "description": "ผู้ดูแลระบบ",
                    "permissions": {"can_manage_users": True, "can_manage_companies": True,
                                    "can_view_analytics": True, "can_manage_system": True},
                    "created_at": datetime.utcnow()
                },
            ])
            print("✅ Created default user roles")
    except Exception as e:
        print(f"⚠️ Error creating user roles: {e}")


async def _assign_student_role(db, user_id):
    try:
        student_role = await db.user_roles.find_one({"role_name": "Student"})
        if student_role:
            await db.user_role_assignments.insert_one({
                "user_id": user_id,
                "role_id": student_role["_id"],
                "role_name": "Student",
                "assigned_at": datetime.utcnow(),
                "assigned_by": "system"
            })
    except Exception as e:
        print(f"⚠️ Failed to assign role: {e}")


def _build_user_response(user: dict) -> UserResponse:
    return UserResponse(
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


def _build_token_response(user: dict, roles: list) -> TokenResponse:
    token_data = {
        "sub": str(user["_id"]),
        "username": user["username"],
        "user_type": user["user_type"],
        "roles": roles,
        "email": user["email"]
    }
    access_token = create_access_token(token_data)
    return TokenResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_info=_build_user_response(user)
    )


# =============================================================================
# REGISTER — Step 1: Validate → Send OTP → Store pending (NOT in DB yet)
# =============================================================================
@router.post("/register", status_code=status.HTTP_200_OK)
async def register_user(user_data: UserRegisterRequest):
    """สมัครสมาชิก — ส่ง OTP ก่อน ยังไม่บันทึก user ลง DB"""
    db = get_database()
    await ensure_user_roles_exist(db)

    if user_data.user_type != UserType.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration is only available for students"
        )

    # Check uniqueness
    if await db.users.find_one({"username": user_data.username}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    if await db.users.find_one({"email": user_data.email}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Build user document (not inserted yet)
    first_name = user_data.first_name or ""
    last_name  = user_data.last_name  or ""
    full_name  = f"{first_name} {last_name}".strip() or user_data.full_name

    pending_doc = {
        "username":      user_data.username,
        "email":         user_data.email,
        "password_hash": hash_password(user_data.password),
        "full_name":     full_name,
        "first_name":    first_name or None,
        "last_name":     last_name  or None,
        "phone":         user_data.phone,
        "user_type":     user_data.user_type.value,
    }

    otp        = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    _pending_registrations[user_data.email] = {
        "user_data":  pending_doc,
        "otp":        otp,
        "expires_at": expires_at,
    }

    _send_register_otp_email(user_data.email, otp, full_name)

    return {
        "message": "ส่ง OTP ไปยังอีเมลแล้ว กรุณายืนยัน OTP เพื่อสร้างบัญชี",
        "email":   user_data.email,
    }


# =============================================================================
# VERIFY REGISTER OTP — Step 2: Verify OTP → Create user in DB → Auto-login
# =============================================================================
class VerifyRegisterOTPRequest(BaseModel):
    email: str
    otp:   str


@router.post("/verify-register-otp", response_model=TokenResponse)
async def verify_register_otp(data: VerifyRegisterOTPRequest):
    """ยืนยัน OTP หลังสมัครสมาชิก → สร้าง user ใน DB → auto-login"""
    pending = _pending_registrations.get(data.email)
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ไม่พบข้อมูลการสมัคร กรุณาลองสมัครใหม่"
        )

    if datetime.utcnow() > pending["expires_at"]:
        _pending_registrations.pop(data.email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP หมดอายุแล้ว กรุณาสมัครใหม่"
        )

    if pending["otp"] != data.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP ไม่ถูกต้อง"
        )

    db       = get_database()
    user_doc = pending["user_data"]

    # Double-check uniqueness
    if await db.users.find_one({"username": user_doc["username"]}):
        _pending_registrations.pop(data.email, None)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    if await db.users.find_one({"email": user_doc["email"]}):
        _pending_registrations.pop(data.email, None)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    now = datetime.utcnow()
    user_doc.update({
        "company_id":  None,
        "is_active":   True,
        "is_verified": True,
        "created_at":  now,
        "updated_at":  now,
        "last_login":  now,
    })
    result  = await db.users.insert_one(user_doc)
    user_id = result.inserted_id

    await _assign_student_role(db, user_id)
    _pending_registrations.pop(data.email, None)

    user = await db.users.find_one({"_id": user_id})
    return _build_token_response(user, ["Student"])


# =============================================================================
# REGISTER RESEND OTP
# =============================================================================
class ResendRegisterOTPRequest(BaseModel):
    email: str


@router.post("/register-resend-otp")
async def resend_register_otp(data: ResendRegisterOTPRequest):
    pending = _pending_registrations.get(data.email)
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ไม่พบข้อมูลการสมัคร กรุณาลองสมัครใหม่"
        )

    otp        = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    pending["otp"]        = otp
    pending["expires_at"] = expires_at
    _pending_registrations[data.email] = pending

    full_name = pending["user_data"].get("full_name", "")
    _send_register_otp_email(data.email, otp, full_name)
    return {"message": "ส่ง OTP ใหม่แล้ว กรุณาตรวจสอบอีเมล"}


# =============================================================================
# LOGIN — รองรับทั้ง username และ email, ไม่มี rate limiting
# =============================================================================
@router.post("/login", response_model=TokenResponse)
async def login_user(login_data: UserLoginRequest):
    """เข้าสู่ระบบ — ใช้ได้ทั้ง username และ email"""
    db = get_database()

    identifier = login_data.username.strip()
    user = await db.users.find_one({"username": identifier})
    if not user:
        user = await db.users.find_one({"email": identifier})

    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง"
        )

    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="บัญชีถูกระงับการใช้งาน"
        )

    user_roles = []
    try:
        assignments = await db.user_role_assignments.find(
            {"user_id": user["_id"]}
        ).to_list(length=10)
        user_roles = [a["role_name"] for a in assignments]
    except Exception:
        user_roles = [user.get("user_type", "Student")]

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )

    return _build_token_response(user, user_roles)


# =============================================================================
# GET CURRENT USER
# =============================================================================
@router.get("/me")
async def get_current_user_info(user_id: str = Depends(get_current_user_id)):
    try:
        db = get_database()
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = await db.users.find_one({"_id": user_id})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_roles = []
        try:
            assignments = await db.user_role_assignments.find(
                {"user_id": user["_id"]}
            ).to_list(length=10)
            user_roles = [a["role_name"] for a in assignments]
        except Exception:
            user_roles = [user.get("user_type", "Student")]

        return {
            "id":         str(user["_id"]),
            "username":   user["username"],
            "email":      user["email"],
            "full_name":  user["full_name"],
            "first_name": user.get("first_name"),
            "last_name":  user.get("last_name"),
            "phone":      user.get("phone"),
            "user_type":  user["user_type"],
            "roles":      user_roles,
            "is_active":  user["is_active"],
            "created_at": user["created_at"],
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


# =============================================================================
# CHANGE PASSWORD
# =============================================================================
@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    db   = get_database()
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(password_data.current_password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="รหัสผ่านปัจจุบันไม่ถูกต้อง")

    await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$set": {"password_hash": hash_password(password_data.new_password),
                  "updated_at":    datetime.utcnow()}}
    )
    return {"message": "เปลี่ยนรหัสผ่านสำเร็จ"}


# =============================================================================
# LOGOUT
# =============================================================================
@router.post("/logout")
async def logout_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        blacklist_token(auth_header[7:])
    return {"message": "ออกจากระบบสำเร็จ"}


# =============================================================================
# FORGOT PASSWORD / OTP / RESET PASSWORD
# (OTP store is managed here, not in email_service)
# =============================================================================
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: str
    otp:   str

class ResetPasswordRequest(BaseModel):
    email:        str
    reset_token:  str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    db   = get_database()
    user = await db.users.find_one({"email": data.email})
    # Always return success for security (don't reveal if email exists)
    if not user:
        return {"message": "ถ้าอีเมลนี้มีในระบบ คุณจะได้รับ OTP ภายใน 1-2 นาที"}

    otp        = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    _otp_store[data.email] = {
        "otp":        otp,
        "expires_at": expires_at,
        "reset_token": None,
    }

    full_name = user.get("full_name", "")
    _send_reset_otp_email(data.email, otp, full_name)

    return {"message": "ถ้าอีเมลนี้มีในระบบ คุณจะได้รับ OTP ภายใน 1-2 นาที"}


@router.post("/verify-otp")
async def verify_otp(data: VerifyOTPRequest):
    """ยืนยัน OTP สำหรับ forgot-password → รับ reset_token"""
    record = _otp_store.get(data.email)
    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ไม่พบ OTP กรุณาขอใหม่อีกครั้ง")

    if datetime.utcnow() > record["expires_at"]:
        _otp_store.pop(data.email, None)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP หมดอายุแล้ว กรุณาขอ OTP ใหม่")

    if record["otp"] != data.otp.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP ไม่ถูกต้อง")

    # Generate one-time reset token
    reset_token = secrets.token_urlsafe(32)
    record["reset_token"] = reset_token
    _otp_store[data.email] = record

    return {"message": "OTP verified successfully", "reset_token": reset_token}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """รีเซ็ตรหัสผ่านด้วย reset_token"""
    record = _otp_store.get(data.email)
    if not record or record.get("reset_token") != data.reset_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token ไม่ถูกต้องหรือหมดอายุแล้ว")

    if len(data.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")

    db   = get_database()
    user = await db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": hash_password(data.new_password),
                  "updated_at":    datetime.utcnow()}}
    )
    _otp_store.pop(data.email, None)

    return {"message": "รีเซ็ตรหัสผ่านสำเร็จ"}