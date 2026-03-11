# backend/routes/company.py - Company Management Routes
import os
import uuid
from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Optional
from pymongo import ASCENDING, DESCENDING

# Local imports
from core.models import (
    CompanyCreate, CompanyUpdate, CompanyResponse, 
    CompanyHRAssignRequest, CompanyHRResponse
)
from core.auth import require_admin, require_hr_or_admin, get_current_user_data
from core.database import get_database

# Create router
router = APIRouter(prefix="/companies", tags=["Company Management"])

# =============================================================================
# ADMIN - COMPANY MANAGEMENT
# =============================================================================

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_data: CompanyCreate,
    admin_data: dict = Depends(require_admin)
):
    """สร้าง Company ใหม่ (Admin เท่านั้น)"""
    try:
        db = get_database()
        
        # ตรวจสอบชื่อ Company ซ้ำ
        existing_company = await db.companies.find_one({"name": company_data.name})
        if existing_company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company name already exists"
            )
        
        # สร้าง company document
        company_doc = {
            "name": company_data.name,
            "industry": company_data.industry,
            "description": company_data.description,
            "location": company_data.location,
            "website": company_data.website,
            "contact_email": company_data.contact_email,
            "contact_phone": company_data.contact_phone,
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "created_by": admin_data.get("username", "admin")
        }
        
        # บันทึก company
        result = await db.companies.insert_one(company_doc)
        company_id = result.inserted_id
        
        # ดึงข้อมูล company ที่สร้างแล้ว
        created_company = await db.companies.find_one({"_id": company_id})
        
        return CompanyResponse(
            id=str(created_company["_id"]),
            name=created_company["name"],
            industry=created_company["industry"],
            description=created_company.get("description"),
            location=created_company.get("location"),
            website=created_company.get("website"),
            contact_email=created_company.get("contact_email"),
            contact_phone=created_company.get("contact_phone"),
            is_active=created_company["is_active"],
            created_at=created_company["created_at"],
            updated_at=created_company.get("updated_at"),
            hr_count=0,
            active_hr_count=0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create company"
        )

@router.get("", response_model=List[CompanyResponse])
async def get_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    admin_data: dict = Depends(require_admin)
):
    """ดึงรายการ Companies ทั้งหมด (Admin เท่านั้น)"""
    try:
        db = get_database()
        
        # สร้าง filter
        filter_query = {}
        
        if search:
            filter_query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"industry": {"$regex": search, "$options": "i"}},
                {"location": {"$regex": search, "$options": "i"}}
            ]
        
        if industry:
            filter_query["industry"] = {"$regex": industry, "$options": "i"}
            
        if is_active is not None:
            filter_query["is_active"] = is_active
        
        # คำนวณ skip และ limit
        skip = (page - 1) * limit
        
        # ดึงข้อมูล companies
        cursor = db.companies.find(filter_query).sort("created_at", DESCENDING).skip(skip).limit(limit)
        companies = await cursor.to_list(length=limit)
        
        # แปลงข้อมูลและนับ HR
        result = []
        for company in companies:
            # นับ HR ในแต่ละ company
            hr_count = await db.company_hr_assignments.count_documents({
                "company_id": company["_id"]
            })
            
            # นับ active HR
            active_hr_pipeline = [
                {"$match": {"company_id": company["_id"]}},
                {"$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user"
                }},
                {"$match": {"user.is_active": True}},
                {"$count": "active_count"}
            ]
            
            active_hr_result = await db.company_hr_assignments.aggregate(active_hr_pipeline).to_list(length=1)
            active_hr_count = active_hr_result[0]["active_count"] if active_hr_result else 0
            
            result.append(CompanyResponse(
                id=str(company["_id"]),
                name=company["name"],
                industry=company["industry"],
                description=company.get("description"),
                location=company.get("location"),
                website=company.get("website"),
                contact_email=company.get("contact_email"),
                contact_phone=company.get("contact_phone"),
                logo_url=company.get("logo_url"),
                is_active=company["is_active"],
                created_at=company["created_at"],
                updated_at=company.get("updated_at"),
                hr_count=hr_count,
                active_hr_count=active_hr_count
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch companies"
        )

@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company_by_id(
    company_id: str,
    admin_data: dict = Depends(require_admin)
):
    """ดึงข้อมูล Company ตาม ID"""
    try:
        db = get_database()
        
        try:
            company = await db.companies.find_one({"_id": ObjectId(company_id)})
        except:
            company = await db.companies.find_one({"_id": company_id})
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # นับ HR
        hr_count = await db.company_hr_assignments.count_documents({
            "company_id": company["_id"]
        })
        
        # นับ active HR
        active_hr_pipeline = [
            {"$match": {"company_id": company["_id"]}},
            {"$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user"
            }},
            {"$match": {"user.is_active": True}},
            {"$count": "active_count"}
        ]
        
        active_hr_result = await db.company_hr_assignments.aggregate(active_hr_pipeline).to_list(length=1)
        active_hr_count = active_hr_result[0]["active_count"] if active_hr_result else 0
        
        return CompanyResponse(
            id=str(company["_id"]),
            name=company["name"],
            industry=company["industry"],
            description=company.get("description"),
            location=company.get("location"),
            website=company.get("website"),
            contact_email=company.get("contact_email"),
            contact_phone=company.get("contact_phone"),
            is_active=company["is_active"],
            created_at=company["created_at"],
            updated_at=company.get("updated_at"),
            hr_count=hr_count,
            active_hr_count=active_hr_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch company"
        )

@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    company_update: CompanyUpdate,
    admin_data: dict = Depends(require_admin)
):
    """อัปเดตข้อมูล Company"""
    try:
        db = get_database()
        
        # ตรวจสอบว่า company มีอยู่หรือไม่
        try:
            existing_company = await db.companies.find_one({"_id": ObjectId(company_id)})
        except:
            existing_company = await db.companies.find_one({"_id": company_id})
        
        if not existing_company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # สร้าง update data
        update_data = {"updated_at": datetime.now(timezone.utc)}
        
        if company_update.name is not None:
            name_trimmed = company_update.name.strip()
            if name_trimmed != existing_company.get("name"):
                # ตรวจสอบชื่อซ้ำ
                name_check = await db.companies.find_one({
                    "name": name_trimmed,
                    "_id": {"$ne": existing_company["_id"]}
                })
                if name_check:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Company name already exists"
                    )
                update_data["name"] = name_trimmed
        
        # อัปเดตฟิลด์อื่นๆ
        for field in ["industry", "description", "location", "website", "contact_email", "contact_phone", "is_active"]:
            value = getattr(company_update, field)
            if value is not None:
                if isinstance(value, str):
                    update_data[field] = value.strip() if value.strip() else None
                else:
                    update_data[field] = value
        
        # อัปเดต company
        result = await db.companies.update_one(
            {"_id": existing_company["_id"]},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes made"
            )
        
        # ดึงข้อมูลที่อัปเดตแล้ว
        updated_company = await db.companies.find_one({"_id": existing_company["_id"]})
        
        # นับ HR
        hr_count = await db.company_hr_assignments.count_documents({
            "company_id": updated_company["_id"]
        })
        
        return CompanyResponse(
            id=str(updated_company["_id"]),
            name=updated_company["name"],
            industry=updated_company["industry"],
            description=updated_company.get("description"),
            location=updated_company.get("location"),
            website=updated_company.get("website"),
            contact_email=updated_company.get("contact_email"),
            contact_phone=updated_company.get("contact_phone"),
            is_active=updated_company["is_active"],
            created_at=updated_company["created_at"],
            updated_at=updated_company.get("updated_at"),
            hr_count=hr_count,
            active_hr_count=0  # จะคำนวณใหม่ถ้าต้องการ
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update company"
        )

@router.delete("/{company_id}")
async def delete_company(
    company_id: str,
    admin_data: dict = Depends(require_admin)
):
    """ลบ Company"""
    try:
        db = get_database()
        
        # ตรวจสอบว่า company มีอยู่หรือไม่
        try:
            existing_company = await db.companies.find_one({"_id": ObjectId(company_id)})
        except:
            existing_company = await db.companies.find_one({"_id": company_id})
        
        if not existing_company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # ลบ company
        await db.companies.delete_one({"_id": existing_company["_id"]})
        
        # ลบ HR assignments
        await db.company_hr_assignments.delete_many({"company_id": existing_company["_id"]})
        
        return {"message": "Company deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete company"
        )

# =============================================================================
# COMPANY HR MANAGEMENT
# =============================================================================

@router.get("/{company_id}/hr", response_model=List[CompanyHRResponse])
async def get_company_hr_users(
    company_id: str,
    admin_data: dict = Depends(require_admin)
):
    """ดึงรายการ HR ของ Company"""
    try:
        db = get_database()
        
        # ตรวจสอบว่า company มีอยู่หรือไม่
        try:
            company = await db.companies.find_one({"_id": ObjectId(company_id)})
        except:
            company = await db.companies.find_one({"_id": company_id})
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # ดึงรายการ HR
        pipeline = [
            {"$match": {"company_id": company["_id"]}},
            {"$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user"
            }},
            {"$unwind": "$user"},
            {"$match": {"user.user_type": "HR"}},
            {"$project": {
                "user_id": "$user._id",
                "username": "$user.username",
                "full_name": "$user.full_name",
                "email": "$user.email",
                "is_active": "$user.is_active",
                "assigned_at": "$assigned_at",
                "last_login": "$user.last_login",
                "profile_image": "$user.profile_image"
            }}
        ]
        
        hr_users = await db.company_hr_assignments.aggregate(pipeline).to_list(length=None)
        
        result = []
        for hr_user in hr_users:
            result.append(CompanyHRResponse(
                id=str(hr_user["user_id"]),
                username=hr_user["username"],
                full_name=hr_user["full_name"],
                email=hr_user["email"],
                is_active=hr_user["is_active"],
                assigned_at=hr_user["assigned_at"],
                last_login=hr_user.get("last_login"),
                profile_image=hr_user.get("profile_image")
            ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch company HR users"
        )

@router.post("/{company_id}/hr")
async def assign_hr_to_company(
    company_id: str,
    hr_assign: CompanyHRAssignRequest,
    admin_data: dict = Depends(require_admin)
):
    """เพิ่ม HR Users ให้กับ Company"""
    try:
        db = get_database()
        
        # ตรวจสอบว่า company มีอยู่หรือไม่
        try:
            company = await db.companies.find_one({"_id": ObjectId(company_id)})
        except:
            company = await db.companies.find_one({"_id": company_id})
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        assigned_count = 0
        errors = []
        
        for user_id in hr_assign.user_ids:
            try:
                # ตรวจสอบ user
                try:
                    user = await db.users.find_one({"_id": ObjectId(user_id)})
                except:
                    user = await db.users.find_one({"_id": user_id})
                
                if not user:
                    errors.append(f"User {user_id} not found")
                    continue
                
                if user["user_type"] != "HR":
                    errors.append(f"User {user['username']} is not HR")
                    continue
                
                # ⭐ FIX: ตรวจสอบว่า user มี assignment กับบริษัทนี้อยู่แล้วหรือไม่
                existing_assignment = await db.company_hr_assignments.find_one({
                    "company_id": company["_id"],
                    "user_id": user["_id"]
                })
                
                if existing_assignment:
                    errors.append(f"User {user['username']} already assigned to this company")
                    continue
                
                # ⭐ FIX: ลบ assignment เก่าทั้งหมดของ user นี้ก่อน (ถ้ามี)
                # เพื่อให้ HR แต่ละคนสามารถมีสิทธิ์เข้าถึงได้เพียง 1 บริษัทเท่านั้น
                old_assignments = await db.company_hr_assignments.delete_many({
                    "user_id": user["_id"]
                })
                
                if old_assignments.deleted_count > 0:
                    print(f"🔄 Removed {old_assignments.deleted_count} old assignment(s) for user {user['username']}")
                
                # สร้าง assignment ใหม่
                assignment_doc = {
                    "company_id": company["_id"],
                    "user_id": user["_id"],
                    "assigned_at": datetime.now(timezone.utc),
                    "assigned_by": admin_data.get("username", "admin")
                }
                
                await db.company_hr_assignments.insert_one(assignment_doc)
                
                # อัปเดต user company_id
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"company_id": company["_id"]}}
                )
                
                assigned_count += 1
                
            except Exception as e:
                errors.append(f"Error assigning user {user_id}: {str(e)}")
        
        return {
            "message": f"Successfully assigned {assigned_count} HR users to company",
            "assigned_count": assigned_count,
            "errors": errors if errors else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign HR to company"
        )

@router.delete("/{company_id}/hr/{user_id}")
async def remove_hr_from_company(
    company_id: str,
    user_id: str,
    admin_data: dict = Depends(require_admin)
):
    """ลบ HR User จาก Company"""
    try:
        db = get_database()
        
        # ตรวจสอบว่า company มีอยู่หรือไม่
        try:
            company = await db.companies.find_one({"_id": ObjectId(company_id)})
        except:
            company = await db.companies.find_one({"_id": company_id})
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # ตรวจสอบ user
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except:
            user = await db.users.find_one({"_id": user_id})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # ตรวจสอบว่า assign อยู่หรือไม่
        existing_assignment = await db.company_hr_assignments.find_one({
            "company_id": company["_id"],
            "user_id": user["_id"]
        })
        
        if not existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="HR user is not assigned to this company"
            )
        
        # ลบ assignment
        await db.company_hr_assignments.delete_one({
            "company_id": company["_id"],
            "user_id": user["_id"]
        })
        
        # อัปเดต user company_id เป็น null
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$unset": {"company_id": ""}}
        )
        
        return {"message": f"Successfully removed HR user {user['username']} from company"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove HR from company"
        )

# =============================================================================
# HR DASHBOARD ACCESS
# =============================================================================

@router.get("/my-company/info")
async def get_my_company_info(
    user_data: dict = Depends(require_hr_or_admin)
):
    """ดึงข้อมูล Company ของ HR ปัจจุบัน"""
    try:
        db = get_database()
        
        # ดึงข้อมูล user
        try:
            user = await db.users.find_one({"_id": ObjectId(user_data.get("sub"))})
        except:
            user = await db.users.find_one({"_id": user_data.get("sub")})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # ถ้าเป็น Admin ให้ส่งข้อมูลพิเศษ
        if user["user_type"] == "Admin":
            return {
                "user_type": "Admin",
                "message": "Admin has access to all companies",
                "company": None
            }
        
        # ถ้าเป็น HR ให้หา company ที่ assigned
        if not user.get("company_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="HR user is not assigned to any company"
            )
        
        # ดึงข้อมูล company
        company = await db.companies.find_one({"_id": user["company_id"]})
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        return {
            "user_type": "HR",
            "company": {
                "id": str(company["_id"]),
                "name": company["name"],
                "industry": company.get("industry"),
                "description": company.get("description"),
                "location": company.get("location"),
                "address": company.get("address"),
                "website": company.get("website"),
                "contact_email": company.get("contact_email"),
                "contact_phone": company.get("contact_phone"),
                "logo_url": company.get("logo_url"),
                "is_active": company["is_active"],
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch company info"
        )


# =============================================================================
# HR - UPDATE OWN COMPANY INFO
# =============================================================================

COMPANY_LOGO_DIR = "uploads/company_logos"
os.makedirs(COMPANY_LOGO_DIR, exist_ok=True)
LOGO_ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}
LOGO_MAX_SIZE = 5 * 1024 * 1024  # 5MB


async def _get_hr_company(user_data: dict):
    """Helper: returns (user_doc, company_doc) for the current HR user."""
    db = get_database()
    user_id = user_data.get("sub")

    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = await db.users.find_one({"_id": user_id})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["user_type"] not in ("HR", "Admin"):
        raise HTTPException(status_code=403, detail="HR or Admin only")

    company_id = user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=403, detail="HR user is not assigned to any company")

    company = await db.companies.find_one({"_id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return user, company


@router.put("/my-company/update")
async def hr_update_company(
    company_update: CompanyUpdate,
    user_data: dict = Depends(require_hr_or_admin),
):
    """HR แก้ไขข้อมูลบริษัทของตัวเอง (ไม่สามารถเปลี่ยน is_active ได้)"""
    try:
        db = get_database()
        user, company = await _get_hr_company(user_data)

        update_data = {"updated_at": datetime.now(timezone.utc)}

        # Fields HR can edit
        editable = ["name", "industry", "description", "location", "website", "contact_email", "contact_phone"]
        for field in editable:
            value = getattr(company_update, field, None)
            if value is not None:
                update_data[field] = value.strip() if isinstance(value, str) else value

        if len(update_data) == 1:
            raise HTTPException(status_code=400, detail="No changes provided")

        # Check name uniqueness if name is being changed
        if "name" in update_data and update_data["name"] != company.get("name"):
            existing = await db.companies.find_one({
                "name": update_data["name"],
                "_id": {"$ne": company["_id"]}
            })
            if existing:
                raise HTTPException(status_code=400, detail="Company name already exists")

        await db.companies.update_one({"_id": company["_id"]}, {"$set": update_data})

        # Sync company_name into jobs if name changed
        if "name" in update_data:
            await db.jobs.update_many(
                {"company_id": str(company["_id"])},
                {"$set": {"company_name": update_data["name"]}}
            )

        updated = await db.companies.find_one({"_id": company["_id"]})
        return {
            "message": "อัปเดตข้อมูลบริษัทสำเร็จ",
            "company": {
                "id": str(updated["_id"]),
                "name": updated["name"],
                "industry": updated.get("industry"),
                "description": updated.get("description"),
                "location": updated.get("location"),
                "website": updated.get("website"),
                "contact_email": updated.get("contact_email"),
                "contact_phone": updated.get("contact_phone"),
                "logo_url": updated.get("logo_url"),
                "is_active": updated.get("is_active"),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update company: {str(e)}")


# =============================================================================
# HR - UPLOAD COMPANY LOGO
# =============================================================================

@router.post("/my-company/logo")
async def hr_upload_company_logo(
    file: UploadFile = File(...),
    user_data: dict = Depends(require_hr_or_admin),
):
    """HR อัปโหลดโลโก้บริษัท"""
    try:
        db = get_database()
        user, company = await _get_hr_company(user_data)

        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in LOGO_ALLOWED_EXT:
            raise HTTPException(
                status_code=400,
                detail=f"ไฟล์ไม่รองรับ — ใช้ได้เฉพาะ {', '.join(LOGO_ALLOWED_EXT)}"
            )

        content = await file.read()
        if len(content) > LOGO_MAX_SIZE:
            raise HTTPException(status_code=400, detail="ไฟล์มีขนาดใหญ่เกิน 5MB")

        # Remove old logo file
        old_logo = company.get("logo_url", "")
        if old_logo and old_logo.startswith("/uploads/company_logos/"):
            old_path = old_logo.lstrip("/")
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except Exception:
                    pass

        # Save new file
        filename = f"{str(company['_id'])}_{uuid.uuid4().hex[:10]}{ext}"
        file_path = os.path.join(COMPANY_LOGO_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(content)

        logo_url = f"/uploads/company_logos/{filename}"

        # Update company document
        await db.companies.update_one(
            {"_id": company["_id"]},
            {"$set": {"logo_url": logo_url, "updated_at": datetime.now(timezone.utc)}}
        )

        # Sync logo_url into all jobs for this company
        await db.jobs.update_many(
            {"company_id": str(company["_id"])},
            {"$set": {"company_logo": logo_url}}
        )

        return {"message": "อัปโหลดโลโก้บริษัทสำเร็จ", "logo_url": logo_url}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")


# =============================================================================
# HR - DELETE COMPANY LOGO
# =============================================================================

@router.delete("/my-company/logo")
async def hr_delete_company_logo(
    user_data: dict = Depends(require_hr_or_admin),
):
    """HR ลบโลโก้บริษัท (กลับเป็น initials)"""
    try:
        db = get_database()
        user, company = await _get_hr_company(user_data)

        logo_url = company.get("logo_url", "")
        if not logo_url:
            raise HTTPException(status_code=404, detail="ไม่มีโลโก้บริษัท")

        # Delete file
        file_path = logo_url.lstrip("/")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

        await db.companies.update_one(
            {"_id": company["_id"]},
            {"$unset": {"logo_url": ""}, "$set": {"updated_at": datetime.now(timezone.utc)}}
        )

        # Clear logo from jobs
        await db.jobs.update_many(
            {"company_id": str(company["_id"])},
            {"$unset": {"company_logo": ""}}
        )

        return {"message": "ลบโลโก้บริษัทสำเร็จ"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete logo: {str(e)}")