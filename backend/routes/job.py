# -*- coding: utf-8 -*-
"""
Job Management & AI Matching Routes

Endpoints:
    - CRUD: สร้าง/ดู/แก้ไข/ลบ Job postings (HR/Admin)
    - AI Recommendations: แนะนำงาน Green/Yellow/Red zone (Student)
    - Applications: สมัครงาน + ดูผู้สมัคร (Student/HR)
"""

import logging
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from core.auth import get_current_user_data, get_current_user_id
from core.database import get_database
from core.utils import generate_unique_id
from services.matching_service import MatchingService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["Jobs"])

# Singleton — โหลด SBERT model ครั้งเดียว ใช้ร่วมกันทุก request
matching_service = MatchingService()


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class JobCreate(BaseModel):
    """Schema สำหรับสร้าง Job ใหม่"""

    # Basic Information
    title: str = Field(..., min_length=5, max_length=100)
    description: str = Field(..., min_length=20, max_length=2000)
    department: str = Field(..., min_length=2, max_length=100)
    job_type: str = Field(default="Internship")
    work_mode: str = Field(default="Onsite")
    location: str = Field(..., min_length=2, max_length=200)

    # Allowance (เบี้ยเลี้ยง)
    allowance_amount: Optional[int] = Field(None, ge=0)
    allowance_type: Optional[str] = None  # "daily" or "monthly"

    # Job Requirements
    requirements: List[str] = Field(default=[])
    skills_required: List[str] = Field(..., min_items=1, max_items=20)
    majors: List[str] = Field(default=["ทุกสาขา"])
    min_gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    student_levels: List[str] = Field(default=["ปี 3", "ปี 4"])
    experience_required: Optional[int] = Field(default=0, ge=0)

    # Additional Information
    positions_available: int = Field(default=1, ge=1, le=100)
    application_deadline: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

    # Legacy fields (backward compatibility)
    compensation_amount: Optional[int] = Field(None, ge=0)
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    duration_months: int = Field(default=4, ge=1, le=12)


class JobUpdate(BaseModel):
    """Schema สำหรับ partial update — ทุก field เป็น Optional"""

    title: Optional[str] = Field(None, min_length=5, max_length=100)
    description: Optional[str] = Field(None, min_length=20, max_length=2000)
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    job_type: Optional[str] = None
    work_mode: Optional[str] = None
    location: Optional[str] = Field(None, min_length=2, max_length=200)

    allowance_amount: Optional[int] = Field(None, ge=0)
    allowance_type: Optional[str] = None

    requirements: Optional[List[str]] = None
    skills_required: Optional[List[str]] = Field(None, max_items=20)
    majors: Optional[List[str]] = None
    min_gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    student_levels: Optional[List[str]] = None
    experience_required: Optional[int] = Field(None, ge=0)

    positions_available: Optional[int] = Field(None, ge=1, le=100)
    application_deadline: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: Optional[bool] = None

    compensation_amount: Optional[int] = Field(None, ge=0)
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    duration_months: Optional[int] = Field(None, ge=1, le=12)


class JobResponse(BaseModel):
    """Schema สำหรับ response ของ Job"""

    id: str
    job_code: str
    title: str
    description: str
    company_id: str
    company_name: str

    department: Optional[str] = None
    job_type: Optional[str] = None
    work_mode: Optional[str] = None
    location: Optional[str] = None

    allowance_amount: Optional[int] = None
    allowance_type: Optional[str] = None

    requirements: List[str] = []
    skills_required: List[str]
    majors: List[str]
    min_gpa: Optional[float] = None
    student_levels: List[str]
    experience_required: Optional[int] = None

    positions_available: Optional[int] = 1
    application_deadline: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

    compensation_amount: Optional[int] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    duration_months: Optional[int] = None

    is_active: bool
    created_at: str
    applications_count: int = 0

    # AI matching fields (มีค่าเมื่อ Student request)
    ai_match_score: Optional[float] = None
    recommendation_reason: Optional[str] = None


class ApplicationCreate(BaseModel):
    """Schema สำหรับสมัครงาน"""

    cover_letter: Optional[str] = Field(None, max_length=1500)
    portfolio_url: Optional[str] = None
    available_start_date: Optional[str] = None


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def convert_job_to_requirements(job: dict) -> dict:
    """
    แปลง Job document (MongoDB) → format ที่ MatchingService ต้องการ

    Field mapping:
        majors (List[str])          → major_required (str)  — ใช้ตัวแรก
        experience_required (years) → min_experience_months  — ×12
        skills_required             → skills_required        — pass-through
        min_gpa                     → min_gpa                — pass-through
    """
    majors = job.get("majors", [])
    major_required = ""
    if majors and majors[0] != "ทุกสาขา":
        major_required = majors[0]

    experience_years = job.get("experience_required", 0) or 0

    return {
        "title": job.get("title", ""),
        "skills_required": job.get("skills_required", []),
        "major_required": major_required,
        "min_gpa": job.get("min_gpa", 0) or 0,
        "min_experience_months": experience_years * 12,
        "required_certifications": [],
        "preferred_certifications": [],
    }


async def get_resume_features(user_id: str, db) -> Optional[dict]:
    """
    ดึง extracted features ของ resume ล่าสุดจาก AI extraction

    Returns:
        dict ที่มี education, skills, projects, experience_months, ...
        หรือ None ถ้าไม่มี resume / ยังไม่ได้ extract
    """
    resume = await db.resumes.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )

    if not resume:
        return None

    # ลอง extracted_features (AI extraction) ก่อน, fallback เป็น extracted_data
    features = resume.get("extracted_features", resume.get("extracted_data", None))

    # ป้องกัน empty dict — ถือว่ายังไม่มีข้อมูล
    if not features:
        return None

    return features


def transform_job_data(job: dict) -> dict:
    """แปลง MongoDB document → JSON-serializable dict (ObjectId → str, datetime → ISO)"""
    if not job:
        return {}

    def convert_value(value):
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, dict):
            return {k: convert_value(v) for k, v in value.items()}
        if isinstance(value, list):
            return [convert_value(item) for item in value]
        return value

    result = {}
    for key, value in job.items():
        if key == "_id":
            result["id"] = str(value)
        else:
            result[key] = convert_value(value)

    result.setdefault("applications_count", 0)
    return result


def normalize_score(score_0_100: float) -> float:
    """แปลง score จาก 0-100 → 0-1 (backward compatibility กับ frontend)"""
    return round(score_0_100 / 100.0, 2)


# =============================================================================
# HEALTH CHECK
# =============================================================================

@router.get("/test")
async def test_jobs_api():
    """Health check — แสดงสถานะ API และ SBERT model"""
    return {
        "message": "Jobs API Working!",
        "version": "3.0 - Real AI Matching",
        "features": ["CRUD Jobs", "Apply", "AI Matching (MatchingService + SBERT)"],
        "sbert_available": matching_service.sbert_model is not None,
    }


@router.get("/statistics/overview")
async def get_job_statistics(
    current_user: dict = Depends(get_current_user_data),
    db=Depends(get_database),
):
    """HR/Admin ดูสถิติภาพรวมตำแหน่งงาน"""
    user_type = current_user.get("user_type")
    if user_type not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="HR or Admin only")

    # สำหรับ HR → กรองเฉพาะงานของบริษัทตัวเอง
    job_filter = {}
    if user_type == "HR":
        user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
        if user and user.get("company_id"):
            job_filter["company_id"] = str(user["company_id"])

    total_jobs = await db.jobs.count_documents(job_filter)
    active_jobs = await db.jobs.count_documents({**job_filter, "is_active": True})

    # นับ applications
    job_ids = []
    async for job in db.jobs.find(job_filter, {"_id": 1}):
        job_ids.append(str(job["_id"]))

    app_filter = {"job_id": {"$in": job_ids}} if job_ids else {"job_id": "__none__"}
    total_applications = await db.applications.count_documents(app_filter)
    pending_applications = await db.applications.count_documents({**app_filter, "status": "pending"})

    return {
        "overview": {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": total_applications,
            "pending_applications": pending_applications,
        }
    }


@router.get("/analytics/detailed")
async def get_detailed_analytics(
    current_user: dict = Depends(get_current_user_data),
    db=Depends(get_database),
):
    """HR/Admin ดูสถิติเชิงลึก — per-job breakdown, acceptance rate, avg AI score"""
    user_type = current_user.get("user_type")
    if user_type not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="HR or Admin only")

    job_filter = {}
    if user_type == "HR":
        user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
        if user and user.get("company_id"):
            job_filter["company_id"] = str(user["company_id"])

    jobs = await db.jobs.find(job_filter).sort("created_at", -1).to_list(length=100)

    per_job = []
    total_accepted = 0
    total_rejected = 0
    total_pending = 0
    total_apps = 0
    all_scores = []

    for job in jobs:
        jid = str(job["_id"])
        apps = await db.applications.find({"job_id": jid}).to_list(length=500)

        accepted = sum(1 for a in apps if a.get("status") == "accepted")
        rejected = sum(1 for a in apps if a.get("status") == "rejected")
        pending = sum(1 for a in apps if a.get("status") == "pending")
        scores = [a.get("ai_score", 0) for a in apps if a.get("ai_score") is not None]
        avg_score = round(sum(scores) / len(scores) * 100, 1) if scores else 0

        total_accepted += accepted
        total_rejected += rejected
        total_pending += pending
        total_apps += len(apps)
        all_scores.extend(scores)

        per_job.append({
            "job_id": jid,
            "title": job.get("title", ""),
            "is_active": job.get("is_active", False),
            "total": len(apps),
            "accepted": accepted,
            "rejected": rejected,
            "pending": pending,
            "avg_ai_score": avg_score,
        })

    overall_avg = round(sum(all_scores) / len(all_scores) * 100, 1) if all_scores else 0
    acceptance_rate = round(total_accepted / total_apps * 100, 1) if total_apps else 0

    return {
        "summary": {
            "total_jobs": len(jobs),
            "total_applications": total_apps,
            "total_accepted": total_accepted,
            "total_rejected": total_rejected,
            "total_pending": total_pending,
            "acceptance_rate": acceptance_rate,
            "avg_ai_score": overall_avg,
        },
        "per_job": per_job,
    }


@router.get("/all-applicants")
async def get_all_applicants(
    current_user: dict = Depends(get_current_user_data),
    db=Depends(get_database),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("ai_score"),
):
    """HR/Admin ดูผู้สมัครทุกตำแหน่ง — สำหรับ cross-job search"""
    user_type = current_user.get("user_type")
    if user_type not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="HR or Admin only")

    job_filter = {}
    if user_type == "HR":
        user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
        if user and user.get("company_id"):
            job_filter["company_id"] = str(user["company_id"])

    job_ids = []
    async for job in db.jobs.find(job_filter, {"_id": 1}):
        job_ids.append(str(job["_id"]))

    if not job_ids:
        return {"applicants": []}

    app_filter = {"job_id": {"$in": job_ids}}
    if status_filter and status_filter != "all":
        app_filter["status"] = status_filter

    sort_field = "ai_score"
    sort_dir = -1
    if sort_by == "name":
        sort_field = "student_name"
        sort_dir = 1
    elif sort_by == "date":
        sort_field = "submitted_at"
        sort_dir = -1

    applications = await db.applications.find(app_filter).sort(
        sort_field, sort_dir
    ).to_list(length=200)

    result = []
    for app in applications:
        # Text search filter
        if search:
            s = search.lower()
            name = (app.get("student_name") or "").lower()
            email = (app.get("student_email") or "").lower()
            title = (app.get("job_title") or "").lower()
            if s not in name and s not in email and s not in title:
                continue

        item = {}
        for key, value in app.items():
            if isinstance(value, ObjectId):
                item[key] = str(value)
            elif hasattr(value, "isoformat"):
                item[key] = value.isoformat()
            else:
                item[key] = value
        if "_id" in item:
            item["id"] = item.pop("_id")

        # Backfill resume_file_url
        if not item.get("resume_file_url") and item.get("student_id"):
            resume = await db.resumes.find_one(
                {"user_id": item["student_id"]},
                sort=[("created_at", -1)]
            )
            if resume:
                fp = resume.get("file_path", "")
                if fp:
                    item["resume_file_url"] = "/" + fp.replace("\\", "/")

        result.append(item)

    return {"applicants": result}


# =============================================================================
# AI RECOMMENDATIONS (Student) — ต้องอยู่ก่อน /{job_id} เพื่อไม่ให้ FastAPI จับผิด route
# =============================================================================

@router.get("/recommended/for-me")
async def get_recommendations(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_database),
):
    """
    แนะนำงานที่เหมาะสม (🟢 Green ≥80% / 🟡 Yellow 50-79%)

    ใช้ MatchingService จริง — SBERT semantic matching + weighted scoring 6 มิติ
    ไม่แสดงงาน 🔴 Red (< 50%)
    """
    resume_features = await get_resume_features(user_id, db)
    if not resume_features:
        raise HTTPException(status_code=400, detail="Please upload resume first")

    jobs = await db.jobs.find({"is_active": True}).to_list(length=100)

    green_jobs = []
    yellow_jobs = []

    for job in jobs:
        job_requirements = convert_job_to_requirements(job)
        result = matching_service.calculate_match(resume_features, job_requirements)

        job_data = transform_job_data(job)
        job_data["ai_match_score"] = normalize_score(result["overall_score"])
        job_data["recommendation_reason"] = result["recommendation"]
        job_data["matching_breakdown"] = result["breakdown"]
        job_data["matching_zone"] = result["zone"]

        if result["zone"] == "green":
            green_jobs.append(job_data)
        elif result["zone"] == "yellow":
            yellow_jobs.append(job_data)

    logger.info(
        "[Jobs AI] Recommendations for %s: %d green, %d yellow",
        user_id, len(green_jobs), len(yellow_jobs),
    )

    return {
        "green": sorted(green_jobs, key=lambda x: x["ai_match_score"], reverse=True),
        "yellow": sorted(yellow_jobs, key=lambda x: x["ai_match_score"], reverse=True),
    }


@router.get("/not-ready/for-me")
async def get_not_ready_jobs(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_database),
):
    """
    งานที่ยังไม่เหมาะสม (🔴 Red < 50%) พร้อม Gap Analysis

    ใช้ MatchingService จริง — วิเคราะห์ว่าขาด skills อะไร พร้อมคำแนะนำ
    """
    resume_features = await get_resume_features(user_id, db)
    if not resume_features:
        raise HTTPException(status_code=400, detail="Please upload resume first")

    jobs = await db.jobs.find({"is_active": True}).to_list(length=100)

    red_jobs = []

    for job in jobs:
        job_requirements = convert_job_to_requirements(job)
        result = matching_service.calculate_match(resume_features, job_requirements)

        if result["zone"] != "red":
            continue

        # Gap Analysis — วิเคราะห์ว่าขาดอะไรบ้าง
        gap_result = matching_service.get_gap_analysis(resume_features, job_requirements)

        # รวม missing items จากทุก gap area → flat list
        missing_skills = []
        for gap in gap_result.get("gaps", []):
            if "missing" in gap:
                missing_skills.extend(gap["missing"][:3])

        red_jobs.append({
            "job_id": str(job["_id"]),
            "job_title": job.get("title", "Unknown"),
            "company_name": job.get("company_name", "Unknown"),
            "score": normalize_score(result["overall_score"]),
            "missing_skills": missing_skills[:5],
            "recommendations": gap_result.get("recommendations", []),
            "breakdown": result["breakdown"],
        })

    logger.info("[Jobs AI] Not-ready jobs for %s: %d red", user_id, len(red_jobs))

    return {
        "jobs": sorted(red_jobs, key=lambda x: x["score"], reverse=True),
    }


@router.get("/my-applications")
async def get_my_applications(
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_database),
):
    """Student ดูรายการงานที่สมัครไว้ (เรียงจากใหม่สุด)"""
    applications = await db.applications.find(
        {"student_id": user_id}
    ).sort("submitted_at", -1).to_list(length=100)

    result = []
    for app in applications:
        # แปลง ObjectId ทุกตัวเป็น string
        item = {}
        for key, value in app.items():
            if isinstance(value, ObjectId):
                item[key] = str(value)
            elif hasattr(value, "isoformat"):
                item[key] = value.isoformat()
            else:
                item[key] = value

        # ใช้ _id เป็น id
        if "_id" in item:
            item["id"] = item.pop("_id")

        # Enrich: ดึง job_title / company_name
        job_id = app.get("job_id")
        if job_id:
            try:
                oid = ObjectId(job_id) if isinstance(job_id, str) else job_id
                job_doc = await db.jobs.find_one({"_id": oid})
                if job_doc:
                    item["job_title"] = job_doc.get("title", "ตำแหน่งงาน")
                    item["company_name"] = job_doc.get("company_name", "บริษัท")
            except Exception:
                pass

        result.append(item)

    return result


# =============================================================================
# JOB CRUD (HR/Admin)
# =============================================================================

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_job(
    job: JobCreate,
    current_user: dict = Depends(get_current_user_data),
    db=Depends(get_database),
):
    """สร้าง Job posting ใหม่ — เฉพาะ HR/Admin"""
    user_type = current_user.get("user_type")
    if user_type not in ["HR", "Admin"]:
        raise HTTPException(
            status_code=403,
            detail=f"HR or Admin only. Your user_type: {user_type}",
        )

    # ดึงข้อมูล company (ถ้าเป็น HR)
    company_name = "System"
    company_id = "system"

    if user_type == "HR":
        user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
        if user and user.get("company_id"):
            company = await db.companies.find_one({"_id": user["company_id"]})
            if company:
                company_name = company["name"]
                company_id = str(company["_id"])

    job_doc = {
        **job.dict(),
        "job_code": generate_unique_id("JOB"),
        "company_id": company_id,
        "company_name": company_name,
        "is_active": True,
        "applications_count": 0,
        "created_by": current_user["sub"],
        "created_at": datetime.utcnow(),
    }

    result = await db.jobs.insert_one(job_doc)
    created_job = await db.jobs.find_one({"_id": result.inserted_id})

    return transform_job_data(created_job)


@router.get("")
async def get_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    search: Optional[str] = None,
    db=Depends(get_database),
):
    """ดูรายการงานทั้งหมด (public, เรียงจากใหม่สุด)"""
    filter_query = {"is_active": True}

    if search:
        filter_query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"company_name": {"$regex": search, "$options": "i"}},
        ]

    cursor = db.jobs.find(filter_query).sort("created_at", -1).skip(skip).limit(limit)
    jobs = await cursor.to_list(length=limit)

    return [transform_job_data(job) for job in jobs]


@router.get("/{job_id}")
async def get_job_detail(
    job_id: str,
    current_user: Optional[dict] = Depends(get_current_user_data),
    db=Depends(get_database),
):
    """ดูรายละเอียดงาน (public)"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return transform_job_data(job)


@router.put("/{job_id}")
async def update_job(
    job_id: str,
    job_update: JobUpdate,
    current_user: dict = Depends(get_current_user_data),
    db=Depends(get_database),
):
    """แก้ไข Job — เฉพาะ HR (เฉพาะบริษัทตัวเอง) หรือ Admin"""
    user_type = current_user.get("user_type")
    if user_type not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="HR or Admin only")

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    existing_job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not existing_job:
        raise HTTPException(status_code=404, detail="Job not found")

    # HR สามารถแก้ไขได้เฉพาะ job ของบริษัทตัวเอง
    if user_type == "HR":
        user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_company_id = user.get("company_id")
        if not user_company_id:
            raise HTTPException(status_code=403, detail="HR user must be assigned to a company")

        if str(existing_job.get("company_id")) != str(user_company_id):
            raise HTTPException(status_code=403, detail="You can only edit jobs from your company")

    update_data = job_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()

    result = await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": update_data},
    )

    if result.modified_count == 0:
        return {"message": "No changes made", "job_id": job_id}

    logger.info("[Jobs] Updated job %s by %s", job_id, current_user.get("email"))
    return {"message": "Job updated successfully", "job_id": job_id}


@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    current_user: dict = Depends(get_current_user_data),
    db=Depends(get_database),
):
    """Soft delete — เปลี่ยน is_active เป็น False"""
    if current_user.get("user_type") not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="HR or Admin only")

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"is_active": False}},
    )

    return {"message": "Job deleted successfully"}


# =============================================================================
# APPLICATION (Student)
# =============================================================================

@router.post("/{job_id}/apply")
async def apply_job(
    job_id: str,
    application: ApplicationCreate,
    user_id: str = Depends(get_current_user_id),
    db=Depends(get_database),
):
    """Student สมัครงาน — คำนวณ AI match score อัตโนมัติ"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = await db.jobs.find_one({"_id": ObjectId(job_id), "is_active": True})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # ตรวจสอบว่าสมัครซ้ำหรือไม่
    existing = await db.applications.find_one({
        "job_id": job_id,
        "student_id": user_id,
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")

    # ดึงข้อมูล user
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # คำนวณ AI score ด้วย MatchingService
    resume_features = await get_resume_features(user_id, db) or {}
    job_requirements = convert_job_to_requirements(job)
    match_result = matching_service.calculate_match(resume_features, job_requirements)

    ai_score = normalize_score(match_result["overall_score"])
    ai_feedback = match_result["recommendation"]

    # ดึง resume file path สำหรับ HR ดู PDF
    resume_doc = await db.resumes.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    resume_file_url = ""
    if resume_doc:
        fp = resume_doc.get("file_path", "")
        if fp:
            # file_path = "uploads/resumes/xxx.pdf" → URL = "/uploads/resumes/xxx.pdf"
            resume_file_url = "/" + fp.replace("\\", "/")

    app_doc = {
        **application.dict(),
        "application_code": generate_unique_id("APP"),
        "job_id": job_id,
        "job_title": job.get("title", "Unknown"),
        "company_name": job.get("company_name", "Unknown"),
        "student_id": user_id,
        "student_name": user.get("full_name", user.get("username", "Unknown")),
        "student_email": user.get("email", ""),
        "resume_data": resume_features,
        "resume_file_url": resume_file_url,
        "status": "pending",
        "ai_score": ai_score,
        "ai_feedback": ai_feedback,
        "matching_breakdown": match_result.get("breakdown", {}),
        "matching_zone": match_result.get("zone", ""),
        "submitted_at": datetime.utcnow(),
    }

    result = await db.applications.insert_one(app_doc)

    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$inc": {"applications_count": 1}},
    )

    logger.info("[Jobs] User %s applied to job %s (score: %s)", user_id, job_id, ai_score)

    return {"message": "Applied successfully", "application_id": str(result.inserted_id)}


# =============================================================================
# HR VIEW APPLICANTS
# =============================================================================

@router.get("/{job_id}/applicants")
async def get_applicants(
    job_id: str,
    current_user: dict = Depends(get_current_user_data),
    db=Depends(get_database),
):
    """HR/Admin ดูรายชื่อผู้สมัคร (เรียงตาม AI score สูงสุด)"""
    if current_user.get("user_type") not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="HR or Admin only")

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    # ดึงข้อมูล job
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    job_info = {
        "title": job.get("title", "ตำแหน่งงาน") if job else "ตำแหน่งงาน",
        "company_name": job.get("company_name", "บริษัท") if job else "บริษัท",
        "department": job.get("department", "") if job else "",
    }

    applications = await db.applications.find(
        {"job_id": job_id}
    ).sort("ai_score", -1).to_list(length=100)

    result = []
    for app in applications:
        item = {}
        for key, value in app.items():
            if isinstance(value, ObjectId):
                item[key] = str(value)
            elif hasattr(value, "isoformat"):
                item[key] = value.isoformat()
            else:
                item[key] = value

        if "_id" in item:
            item["id"] = item.pop("_id")

        # Backfill resume_file_url สำหรับ applications เก่าที่ยังไม่มี
        if not item.get("resume_file_url") and item.get("student_id"):
            resume = await db.resumes.find_one(
                {"user_id": item["student_id"]},
                sort=[("created_at", -1)]
            )
            if resume:
                fp = resume.get("file_path", "")
                if fp:
                    item["resume_file_url"] = "/" + fp.replace("\\", "/")

        result.append(item)

    return {"job": job_info, "applicants": result}


@router.put("/applications/{app_id}")
async def update_application_status(
    app_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user_data),
    db=Depends(get_database),
):
    """HR/Admin ตัดสินใจรับ/ปฏิเสธผู้สมัคร — เก็บ reason + ai_breakdown สำหรับ XGBoost"""
    if current_user.get("user_type") not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="HR or Admin only")

    new_status = body.get("status")
    reason = body.get("reason", "")

    if new_status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status. Use 'accepted' or 'rejected'")

    if not ObjectId.is_valid(app_id):
        raise HTTPException(status_code=400, detail="Invalid application ID")

    # ดึง application เดิมเพื่อเก็บ ai_breakdown snapshot
    application = await db.applications.find_one({"_id": ObjectId(app_id)})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # สร้าง update data พร้อม XGBoost training fields
    update_data = {
        "status": new_status,
        "hr_decision": new_status,
        "hr_reason": reason,
        "decided_at": datetime.utcnow(),
        "decided_by": current_user["sub"],
        "ai_score_at_decision": application.get("ai_score", 0),
    }

    # เก็บ ai_breakdown snapshot ตอนตัดสินใจ (training features สำหรับ XGBoost)
    resume_data = application.get("resume_data", {})
    if resume_data:
        update_data["ai_breakdown_at_decision"] = {
            "skills": resume_data.get("skills_score", 0),
            "education": resume_data.get("education_score", 0),
            "experience": resume_data.get("experience_score", 0),
            "projects": resume_data.get("projects_score", 0),
            "gpa": resume_data.get("gpa_score", 0),
        }

    # ถ้ามี matching_breakdown จาก apply_job ให้ใช้แทน
    if application.get("matching_breakdown"):
        update_data["ai_breakdown_at_decision"] = application["matching_breakdown"]

    result = await db.applications.update_one(
        {"_id": ObjectId(app_id)},
        {"$set": update_data},
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")

    logger.info("[HR] %s %s application %s (reason: %s)",
                current_user["sub"], new_status, app_id, reason or "none")

    return {"message": f"Application {new_status}", "status": new_status}