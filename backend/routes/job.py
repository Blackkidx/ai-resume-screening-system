# backend/routes/job.py - Simple MVP Version with Mock AI
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, Field

from core.database import get_database
from core.auth import get_current_user_data, get_current_user_id
from core.utils import generate_unique_id

router = APIRouter(prefix="/jobs", tags=["Jobs"])

# =============================================================================
# MODELS
# =============================================================================

class JobCreate(BaseModel):
    # Basic Information
    title: str = Field(..., min_length=5, max_length=100)
    description: str = Field(..., min_length=20, max_length=2000)
    department: str = Field(..., min_length=2, max_length=100)
    job_type: str = Field(default="Internship")
    work_mode: str = Field(default="Onsite")
    location: str = Field(..., min_length=2, max_length=200)
    
    # Allowance (เบี้ยเลี้ยง)
    allowance_amount: Optional[int] = Field(None, ge=0)
    allowance_type: Optional[str] = Field(None)  # "daily" or "monthly"
    
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
    
    # Legacy fields (for backward compatibility)
    compensation_amount: Optional[int] = Field(None, ge=0)
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    duration_months: int = Field(default=4, ge=1, le=12)

class JobResponse(BaseModel):
    id: str
    job_code: str
    title: str
    description: str
    company_id: str
    company_name: str
    
    # Basic Information
    department: Optional[str] = None
    job_type: Optional[str] = None
    work_mode: Optional[str] = None
    location: Optional[str] = None
    
    # Allowance (เบี้ยเลี้ยง)
    allowance_amount: Optional[int] = None
    allowance_type: Optional[str] = None
    
    # Job Requirements
    requirements: List[str] = []
    skills_required: List[str]
    majors: List[str]
    min_gpa: Optional[float]
    student_levels: List[str]
    experience_required: Optional[int] = None
    
    # Additional Information
    positions_available: Optional[int] = 1
    application_deadline: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    
    # Legacy fields
    compensation_amount: Optional[int] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    duration_months: Optional[int] = None
    
    # Metadata
    is_active: bool
    created_at: str
    applications_count: int = 0
    
    # AI fields (จะมีค่าถ้า Student request)
    ai_match_score: Optional[float] = None
    recommendation_reason: Optional[str] = None

class ApplicationCreate(BaseModel):
    cover_letter: Optional[str] = Field(None, max_length=1500)
    portfolio_url: Optional[str] = None
    available_start_date: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: str
    application_code: str
    job_id: str
    job_title: str
    company_name: str
    student_id: str
    student_name: str
    cover_letter: Optional[str]
    portfolio_url: Optional[str]
    status: str  # pending, accepted, rejected
    ai_score: float
    ai_feedback: str
    submitted_at: str

class GapAnalysisResponse(BaseModel):
    job_id: str
    job_title: str
    score: float
    missing_skills: List[str]
    recommendations: List[str]
    alternative_jobs: List[dict]

# =============================================================================
# MOCK AI FUNCTIONS (จะเปลี่ยนเป็น LLM ทีหลัง)
# =============================================================================

async def mock_calculate_score(resume_data: dict, job_data: dict) -> float:
    """
    Mock AI: คำนวณคะแนนความเหมาะสม
    TODO: เปลี่ยนเป็น LLM
    """
    score = 0.0
    
    # สาขาตรง (25%)
    resume_major = resume_data.get("major", "").lower()
    job_majors = [m.lower() for m in job_data.get("majors", [])]
    if any(resume_major in major or "ทุกสาขา" in major for major in job_majors):
        score += 0.25
    
    # ทักษะ (40%)
    resume_skills = [s.lower() for s in resume_data.get("skills", [])]
    job_skills = [s.lower() for s in job_data.get("skills_required", [])]
    if job_skills:
        matched = sum(1 for skill in resume_skills if any(js in skill for js in job_skills))
        score += (matched / len(job_skills)) * 0.40
    
    # GPA (15%)
    min_gpa = job_data.get("min_gpa", 0)
    resume_gpa = resume_data.get("gpa", 0)
    if resume_gpa >= min_gpa:
        score += 0.15
    
    # ระดับชั้นปี (20%)
    if resume_data.get("year") in job_data.get("student_levels", []):
        score += 0.20
    
    return round(score, 2)

async def mock_generate_reason(score: float, resume_data: dict, job_data: dict) -> str:
    """
    Mock AI: สร้างเหตุผล
    TODO: เปลี่ยนเป็น LLM
    """
    reasons = []
    
    if resume_data.get("major") in job_data.get("majors", []):
        reasons.append("สาขาตรง")
    
    if resume_data.get("gpa", 0) >= 3.5:
        reasons.append("GPA สูง")
    
    if score >= 0.8:
        return f"เหมาะสมมาก: {', '.join(reasons)}"
    elif score >= 0.5:
        return f"พิจารณาได้: {', '.join(reasons) if reasons else 'มีทักษะบางส่วน'}"
    else:
        return "ควรพัฒนาทักษะเพิ่มเติม"

async def mock_gap_analysis(resume_data: dict, job_data: dict) -> dict:
    """
    Mock AI: วิเคราะห์ช่องว่าง
    TODO: เปลี่ยนเป็น LLM
    """
    resume_skills = set(s.lower() for s in resume_data.get("skills", []))
    job_skills = set(s.lower() for s in job_data.get("skills_required", []))
    missing = list(job_skills - resume_skills)
    
    recommendations = []
    if missing:
        recommendations.append(f"เรียนรู้ {missing[0]} ผ่าน online courses")
        recommendations.append("ทำโปรเจคเล็กๆ เพื่อฝึกฝน")
    
    if resume_data.get("gpa", 0) < job_data.get("min_gpa", 0):
        recommendations.append("พยายามเรียนให้ได้เกรดดีขึ้น")
    
    return {
        "missing_skills": missing[:3],  # แสดงแค่ 3 อันดับแรก
        "recommendations": recommendations
    }

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def get_resume_data(user_id: str, db) -> dict:
    """ดึงข้อมูล Resume ของ Student"""
    resume = await db.resumes.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    
    if not resume:
        return None
    
    return resume.get("extracted_data", {})

def transform_job_data(job: dict) -> dict:
    if not job:
        return {}
    
    def convert_value(value):
        if isinstance(value, ObjectId):
            return str(value)
        elif isinstance(value, datetime):
            return value.isoformat()
        elif isinstance(value, dict):
            return {k: convert_value(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [convert_value(item) for item in value]
        else:
            return value
    
    result = {}
    for key, value in job.items():
        if key == "_id":
            result["id"] = str(value)
        else:
            result[key] = convert_value(value)
    
    result.setdefault("applications_count", 0)
    return result

# =============================================================================
# ENDPOINTS - CORE FEATURES
# =============================================================================

@router.get("/test")
async def test_jobs_api():
    """ทดสอบ Jobs API"""
    return {
        "message": "Jobs API Working!",
        "version": "2.0 - Simple MVP",
        "features": ["CRUD Jobs", "Apply", "AI Matching (Mock)"]
    }

# -----------------------------------------------------------------------------
# JOB MANAGEMENT (HR/Admin)
# -----------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_job(
    job: JobCreate,
    current_user: dict = Depends(get_current_user_data),
    db = Depends(get_database)
):
    """สร้างงานฝึกงาน (HR/Admin)"""
    
    # Debug: แสดงข้อมูล current_user แบบละเอียด
    print("=" * 80)
    print("[DEBUG] CREATE JOB - Full current_user payload:")
    print(f"  Type: {type(current_user)}")
    print(f"  Content: {current_user}")
    print(f"  Keys: {current_user.keys() if isinstance(current_user, dict) else 'N/A'}")
    print(f"  user_type value: '{current_user.get('user_type')}'")
    print(f"  user_type type: {type(current_user.get('user_type'))}")
    print("=" * 80)
    
    # ตรวจสอบ role
    user_type = current_user.get("user_type")
    if user_type not in ["HR", "Admin"]:
        print(f"[ERROR] Access denied! user_type='{user_type}' not in ['HR', 'Admin']")
        raise HTTPException(
            status_code=403, 
            detail=f"HR or Admin only. Your user_type: {user_type}"
        )
    
    # ดึงข้อมูล company (ถ้าเป็น HR)
    company_name = "System"
    company_id = "system"
    
    if current_user.get("user_type") == "HR":
        user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
        if user and user.get("company_id"):
            company = await db.companies.find_one({"_id": user["company_id"]})
            if company:
                company_name = company["name"]
                company_id = str(company["_id"])
    
    # สร้าง job document
    job_doc = {
        **job.dict(),
        "job_code": generate_unique_id("JOB"),
        "company_id": company_id,
        "company_name": company_name,
        "is_active": True,
        "applications_count": 0,
        "created_by": current_user["sub"],
        "created_at": datetime.utcnow()
    }
    
    result = await db.jobs.insert_one(job_doc)
    
    created_job = await db.jobs.find_one({"_id": result.inserted_id})
    return transform_job_data(created_job)

@router.get("")
async def get_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    search: Optional[str] = None,
    db = Depends(get_database)
):
    """ดูรายการงานทั้งหมด"""
    
    filter_query = {"is_active": True}
    
    if search:
        filter_query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"company_name": {"$regex": search, "$options": "i"}}
        ]
    
    cursor = db.jobs.find(filter_query).sort("created_at", -1).skip(skip).limit(limit)
    jobs = await cursor.to_list(length=limit)
    
    return [transform_job_data(job) for job in jobs]

@router.get("/{job_id}")
async def get_job_detail(
    job_id: str,
    current_user: Optional[dict] = Depends(get_current_user_data),
    db = Depends(get_database)
):
    """ดูรายละเอียดงาน"""
    
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return transform_job_data(job)

@router.put("/{job_id}")
async def update_job(
    job_id: str,
    job_update: JobCreate,
    current_user: dict = Depends(get_current_user_data),
    db = Depends(get_database)
):
    """แก้ไขงาน (HR/Admin)"""
    
    # Check user type
    user_type = current_user.get("user_type")
    if user_type not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="HR or Admin only")
    
    # Validate job_id
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    # Get existing job
    existing_job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not existing_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check ownership (HR can only edit their company's jobs)
    if user_type == "HR":
        company_id = current_user.get("company_id")
        if not company_id:
            raise HTTPException(status_code=403, detail="HR user must have company_id")
        
        if str(existing_job.get("company_id")) != str(company_id):
            raise HTTPException(status_code=403, detail="You can only edit jobs from your company")
    
    # Prepare update data
    update_data = job_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    # Update job
    result = await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        # Job exists but no changes were made
        return {"message": "No changes made", "job_id": job_id}
    
    return {"message": "Job updated successfully", "job_id": job_id}


@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    current_user: dict = Depends(get_current_user_data),
    db = Depends(get_database)
):
    """ลบงาน (เปลี่ยนเป็น inactive)"""
    
    if current_user.get("user_type") not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="HR or Admin only")
    
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"is_active": False}}
    )
    
    return {"message": "Job deleted successfully"}

# -----------------------------------------------------------------------------
# AI RECOMMENDATIONS (Student)
# -----------------------------------------------------------------------------

@router.get("/recommended/for-me")
async def get_recommendations(
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_database)
):
    """
    แนะนำงานที่เหมาะสม (🟢🟡)
    ไม่แสดงงาน 🔴 (< 50%)
    """
    
    # ดึง Resume
    resume_data = await get_resume_data(user_id, db)
    if not resume_data:
        raise HTTPException(status_code=400, detail="Please upload resume first")
    
    # ดึงงานทั้งหมด
    jobs = await db.jobs.find({"is_active": True}).to_list(length=100)
    
    green_jobs = []  # 80-100%
    yellow_jobs = []  # 50-79%
    
    for job in jobs:
        score = await mock_calculate_score(resume_data, job)
        reason = await mock_generate_reason(score, resume_data, job)
        
        job_data = transform_job_data(job)
        job_data["ai_match_score"] = score
        job_data["recommendation_reason"] = reason
        
        if score >= 0.8:
            green_jobs.append(job_data)
        elif score >= 0.5:
            yellow_jobs.append(job_data)
        # ไม่แสดง < 50%
    
    return {
        "green": sorted(green_jobs, key=lambda x: x["ai_match_score"], reverse=True),
        "yellow": sorted(yellow_jobs, key=lambda x: x["ai_match_score"], reverse=True)
    }

@router.get("/not-ready/for-me")
async def get_not_ready_jobs(
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_database)
):
    """
    งานที่ยังไม่เหมาะสม (🔴 < 50%)
    พร้อม Gap Analysis
    """
    
    # ดึง Resume
    resume_data = await get_resume_data(user_id, db)
    if not resume_data:
        raise HTTPException(status_code=400, detail="Please upload resume first")
    
    # ดึงงานทั้งหมด
    jobs = await db.jobs.find({"is_active": True}).to_list(length=100)
    
    red_jobs = []
    
    for job in jobs:
        score = await mock_calculate_score(resume_data, job)
        
        if score < 0.5:  # เฉพาะงานที่ไม่เหมาะสม
            gap = await mock_gap_analysis(resume_data, job)
            
            red_jobs.append({
                "job_id": str(job["_id"]),
                "job_title": job["title"],
                "company_name": job["company_name"],
                "score": score,
                "missing_skills": gap["missing_skills"],
                "recommendations": gap["recommendations"]
            })
    
    return {
        "jobs": sorted(red_jobs, key=lambda x: x["score"], reverse=True)
    }

# -----------------------------------------------------------------------------
# APPLICATION (Student)
# -----------------------------------------------------------------------------

@router.post("/{job_id}/apply")
async def apply_job(
    job_id: str,
    application: ApplicationCreate,
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_database)
):
    """สมัครงาน"""
    
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    # ตรวจสอบงาน
    job = await db.jobs.find_one({"_id": ObjectId(job_id), "is_active": True})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # ตรวจสอบว่าสมัครแล้วหรือยัง
    existing = await db.applications.find_one({
        "job_id": job_id,
        "student_id": user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")
    
    # ดึงข้อมูล user และ resume
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    resume_data = await get_resume_data(user_id, db)
    
    # คำนวณ AI score
    ai_score = await mock_calculate_score(resume_data or {}, job)
    ai_feedback = await mock_generate_reason(ai_score, resume_data or {}, job)
    
    # สร้าง application
    app_doc = {
        **application.dict(),
        "application_code": generate_unique_id("APP"),
        "job_id": job_id,
        "job_title": job["title"],
        "company_name": job["company_name"],
        "student_id": user_id,
        "student_name": user.get("full_name", user["username"]),
        "student_email": user["email"],
        "resume_data": resume_data,
        "status": "pending",
        "ai_score": ai_score,
        "ai_feedback": ai_feedback,
        "submitted_at": datetime.utcnow()
    }
    
    result = await db.applications.insert_one(app_doc)
    
    # อัพเดตจำนวนผู้สมัคร
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$inc": {"applications_count": 1}}
    )
    
    return {"message": "Applied successfully", "application_id": str(result.inserted_id)}

@router.get("/my-applications")
async def get_my_applications(
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_database)
):
    """ดูรายการที่สมัคร"""
    
    applications = await db.applications.find(
        {"student_id": user_id}
    ).sort("submitted_at", -1).to_list(length=100)
    
    result = []
    for app in applications:
        app["id"] = str(app["_id"])
        if "submitted_at" in app and hasattr(app["submitted_at"], "isoformat"):
            app["submitted_at"] = app["submitted_at"].isoformat()
        result.append(app)
    
    return result

# -----------------------------------------------------------------------------
# HR VIEW APPLICANTS
# -----------------------------------------------------------------------------

@router.get("/{job_id}/applicants")
async def get_applicants(
    job_id: str,
    current_user: dict = Depends(get_current_user_data),
    db = Depends(get_database)
):
    """HR ดูผู้สมัคร"""
    
    if current_user.get("user_type") not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="HR or Admin only")
    
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    applications = await db.applications.find(
        {"job_id": job_id}
    ).sort("ai_score", -1).to_list(length=100)
    
    result = []
    for app in applications:
        app["id"] = str(app["_id"])
        if "submitted_at" in app and hasattr(app["submitted_at"], "isoformat"):
            app["submitted_at"] = app["submitted_at"].isoformat()
        result.append(app)
    
    return result

@router.put("/applications/{app_id}")
async def update_application_status(
    app_id: str,
    status: str,  # accepted, rejected
    current_user: dict = Depends(get_current_user_data),
    db = Depends(get_database)
):
    """HR ตัดสินใจ"""
    
    if current_user.get("user_type") not in ["HR", "Admin"]:
        raise HTTPException(status_code=403, detail="HR or Admin only")
    
    if status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    if not ObjectId.is_valid(app_id):
        raise HTTPException(status_code=400, detail="Invalid application ID")
    
    result = await db.applications.update_one(
        {"_id": ObjectId(app_id)},
        {"$set": {
            "status": status,
            "decided_at": datetime.utcnow(),
            "decided_by": current_user["sub"]
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {"message": f"Application {status}"}