# =============================================================================
# 📋 AI RESUME SCREENING FOR THAI STUDENT INTERNSHIPS - routes/job.py
# ระบบคัดกรองเรซูเม่สำหรับนักศึกษาฝึกงานในประเทศไทย
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.security import HTTPBearer
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from datetime import datetime, timedelta, date
from bson import ObjectId
from enum import Enum
import json

# Import core dependencies
from core.database import get_database
from core.auth import get_current_user, require_role
from core.utils import generate_unique_id, validate_file_type

router = APIRouter(tags=["Internship Jobs"], prefix="/jobs")
security = HTTPBearer()

# =============================================================================
# 📋 THAI INTERNSHIP SPECIFIC ENUMS
# =============================================================================

class InternshipType(str, Enum):
    COOPERATIVE_EDUCATION = "Cooperative Education (สหกิจศึกษา)"  # 4-6 เดือน มีเงิน
    INTERNSHIP = "Internship (ฝึกงาน)"  # 2-4 เดือน อาจมีเงินหรือไม่มี
    FIELD_STUDY = "Field Study (ฝึกงาน/ภาคสนาม)"  # 1-2 เดือน ส่วนใหญ่ไม่มีเงิน
    PART_TIME_STUDENT = "Part-time Student Work (งานนักศึกษา)"  # ทำไปเรียนไป

class WorkMode(str, Enum):
    ONSITE = "Onsite (ทำงานที่บริษัท)"
    HYBRID = "Hybrid (ผสมผสาน)"
    REMOTE = "Remote (ทำงานที่บ้าน)"  # น้อยมากสำหรับฝึกงาน

class CompensationType(str, Enum):
    NO_COMPENSATION = "ไม่มีค่าตอบแทน"
    DAILY_ALLOWANCE = "เบี้ยเลี้ยงรายวัน"  # 200-500 บาท/วัน
    MONTHLY_ALLOWANCE = "เบี้ยเลี้ยงรายเดือน"  # 3000-15000 บาท/เดือน
    HOURLY_WAGE = "ค่าจ้างรายชั่วโมง"  # สำหรับ part-time
    PROJECT_BASED = "จ่ายตามโปรเจค"

class StudentLevel(str, Enum):
    VOCATIONAL_1 = "ปวช. ปี 1"
    VOCATIONAL_2 = "ปวช. ปี 2"
    VOCATIONAL_3 = "ปวช. ปี 3"
    DIPLOMA_1 = "ปวส. ปี 1"
    DIPLOMA_2 = "ปวส. ปี 2"
    BACHELOR_1 = "ปริญญาตรี ปี 1"
    BACHELOR_2 = "ปริญญาตรี ปี 2"
    BACHELOR_3 = "ปริญญาตรี ปี 3"
    BACHELOR_4 = "ปริญญาตรี ปี 4"
    MASTER = "ปริญญาโท"

class Department(str, Enum):
    # IT & Technology
    IT_SOFTWARE = "IT - Software Development"
    IT_DATA = "IT - Data Analysis"
    IT_NETWORK = "IT - Network & Infrastructure"
    IT_CYBERSECURITY = "IT - Cybersecurity"
    IT_SUPPORT = "IT - Technical Support"
    
    # Business & Management
    MARKETING = "การตลาด"
    SALES = "ฝ่ายขาย"
    HR = "ทรัพยากรบุคคล"
    FINANCE = "การเงิน"
    ACCOUNTING = "บัญชี"
    
    # Creative & Design
    GRAPHIC_DESIGN = "ออกแบบกราฟิก"
    UI_UX = "UI/UX Design"
    CONTENT_CREATION = "สร้างคอนเทนต์"
    SOCIAL_MEDIA = "Social Media"
    
    # Operations
    OPERATIONS = "ปฏิบัติการ"
    LOGISTICS = "โลจิสติกส์"
    PROCUREMENT = "จัดซื้อ"
    QUALITY_CONTROL = "ควบคุมคุณภาพ"
    
    # Others
    RESEARCH = "วิจัยและพัฒนา"
    LEGAL = "กฎหมาย"
    PUBLIC_RELATIONS = "ประชาสัมพันธ์"
    OTHER = "อื่นๆ"

class ApplicationStatus(str, Enum):
    SUBMITTED = "ส่งใบสมัครแล้ว"
    UNDER_REVIEW = "อยู่ระหว่างพิจารณา"
    SHORTLISTED = "ผ่านการคัดเลือกเบื้องต้น"
    INTERVIEW_SCHEDULED = "นัดสัมภาษณ์แล้ว"
    INTERVIEW_COMPLETED = "สัมภาษณ์เสร็จสิ้น"
    ACCEPTED = "รับเข้าฝึกงาน"
    REJECTED = "ไม่ผ่านการคัดเลือก"
    WITHDRAWN = "ถอนใบสมัคร"
    COMPLETED = "ฝึกงานเสร็จสิ้น"

# =============================================================================
# 📋 THAI INTERNSHIP MODELS
# =============================================================================

class Welfare(BaseModel):
    name: str = Field(..., description="ชื่อสวัสดิการ")
    description: Optional[str] = Field(None, description="รายละเอียด")
    
class SkillRequirement(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    is_required: bool = True
    level: Optional[str] = Field(None, description="ระดับที่ต้องการ (ถ้ามี)")
    weight: float = Field(default=1.0, ge=0.1, le=5.0)

class InternshipCreate(BaseModel):
    # ข้อมูลพื้นฐาน
    title: str = Field(..., min_length=5, max_length=100, description="ชื่อตำแหน่งฝึกงาน")
    description: str = Field(..., min_length=50, max_length=3000, description="รายละเอียดงาน")
    short_description: Optional[str] = Field(None, max_length=200, description="คำอธิบายสั้น")
    
    # ประเภทการฝึกงาน
    internship_type: InternshipType
    department: Department
    work_mode: WorkMode
    
    # สถานที่ทำงาน
    location: str = Field(..., min_length=2, max_length=100, description="สถานที่ทำงาน")
    address: Optional[str] = Field(None, max_length=300, description="ที่อยู่เต็ม")
    nearby_stations: Optional[List[str]] = Field(None, description="สถานีรถไฟฟ้า/ขนส่งใกล้เคียง")
    
    # ระยะเวลาและวันเวลา
    duration_months: int = Field(..., ge=1, le=12, description="ระยะเวลาฝึกงาน (เดือน)")
    start_date: Optional[date] = Field(None, description="วันที่เริ่มฝึกงาน")
    end_date: Optional[date] = Field(None, description="วันที่สิ้นสุด")
    working_days: List[str] = Field(default=["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"], description="วันทำงาน")
    working_hours: str = Field(default="09:00-17:00", description="เวลาทำงาน")
    flexible_hours: bool = Field(default=False, description="เวลาทำงานยืดหยุ่น")
    
    # คุณสมบัติผู้สมัคร
    student_levels: List[StudentLevel] = Field(..., description="ระดับการศึกษาที่รับ")
    majors: List[str] = Field(default_factory=list, description="สาขาวิชาที่เกี่ยวข้อง")
    min_gpa: Optional[float] = Field(None, ge=0.0, le=4.0, description="เกรดเฉลี่ยขั้นต่ำ")
    
    # ทักษะและความต้องการ
    requirements: List[str] = Field(default_factory=list, max_items=15, description="คุณสมบัติที่ต้องการ")
    skills_required: List[SkillRequirement] = Field(default_factory=list, max_items=20)
    preferred_skills: List[str] = Field(default_factory=list, description="ทักษะที่เป็นข้อได้เปรียบ")
    
    # ค่าตอบแทนและสวัสดิการ
    compensation_type: CompensationType
    compensation_amount: Optional[int] = Field(None, ge=0, le=50000, description="จำนวนเงิน (บาท)")
    compensation_description: Optional[str] = Field(None, description="รายละเอียดค่าตอบแทน")
    
    # สวัสดิการ
    welfare_lunch: bool = Field(default=False, description="อาหารกลางวัน")
    welfare_transport: bool = Field(default=False, description="ค่าเดินทาง")
    welfare_accommodation: bool = Field(default=False, description="ที่พัก")
    welfare_medical: bool = Field(default=False, description="ประกันสุขภาพ")
    welfare_training: bool = Field(default=True, description="อบรมพัฒนาทักษะ")
    welfare_others: List[Welfare] = Field(default_factory=list, description="สวัสดิการอื่นๆ")
    
    # ข้อมูลการสมัคร
    positions_available: int = Field(default=1, ge=1, le=20, description="จำนวนที่รับ")
    application_deadline: Optional[datetime] = Field(None, description="วันสุดท้ายการสมัคร")
    
    # ข้อมูลติดต่อ
    contact_person: Optional[str] = Field(None, description="ผู้ติดต่อ")
    contact_email: Optional[str] = Field(None, description="อีเมลติดต่อ")
    contact_phone: Optional[str] = Field(None, description="เบอร์โทรติดต่อ")
    contact_line: Optional[str] = Field(None, description="Line ID")
    
    # การประเมินและใบรับรอง
    provides_certificate: bool = Field(default=True, description="ออกใบรับรองการฝึกงาน")
    evaluation_system: Optional[str] = Field(None, description="ระบบการประเมิน")
    mentor_assigned: bool = Field(default=True, description="มีพี่เลี้ยงดูแล")
    
    # AI Settings
    auto_screening: bool = Field(default=False, description="คัดกรองอัตโนมัติด้วย AI")
    min_matching_score: float = Field(default=0.6, ge=0.0, le=1.0)
    
    # Tags และหมวดหมู่
    tags: List[str] = Field(default_factory=list, max_items=8)
    is_urgent: bool = Field(default=False, description="รับสมัครด่วน")
    is_featured: bool = Field(default=False, description="โปรโมทพิเศษ")

class InternshipResponse(BaseModel):
    id: str
    job_code: str  # เช่น INT-2025-001
    
    # ข้อมูลพื้นฐาน
    title: str
    description: str
    short_description: Optional[str]
    
    # บริษัท
    company_id: str
    company_name: str
    company_logo_url: Optional[str]
    company_size: Optional[str]
    company_industry: Optional[str]
    
    # ประเภทและแผนก
    internship_type: InternshipType
    department: Department
    work_mode: WorkMode
    
    # สถานที่และเวลา
    location: str
    address: Optional[str]
    nearby_stations: Optional[List[str]]
    duration_months: int
    start_date: Optional[date]
    end_date: Optional[date]
    working_days: List[str]
    working_hours: str
    flexible_hours: bool
    
    # คุณสมบัติ
    student_levels: List[StudentLevel]
    majors: List[str]
    min_gpa: Optional[float]
    requirements: List[str]
    skills_required: List[SkillRequirement]
    preferred_skills: List[str]
    
    # ค่าตอบแทน
    compensation_type: CompensationType
    compensation_amount: Optional[int]
    compensation_description: Optional[str]
    
    # สวัสดิการ
    welfare_lunch: bool
    welfare_transport: bool
    welfare_accommodation: bool
    welfare_medical: bool
    welfare_training: bool
    welfare_others: List[Welfare]
    
    # สถิติ
    positions_available: int
    positions_filled: int
    applications_count: int
    qualified_applications: int
    views_count: int
    saves_count: int
    
    # วันที่
    application_deadline: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    created_by: str
    
    # สถานะ
    is_active: bool
    is_urgent: bool
    is_featured: bool
    
    # AI Features
    auto_screening: bool
    min_matching_score: float
    ai_match_score: Optional[float] = None
    recommendation_reason: Optional[str] = None
    
    # Analytics
    avg_gpa_applicants: Optional[float]
    popular_majors: Optional[List[str]]
    avg_response_time_days: Optional[float]

class StudentApplicationCreate(BaseModel):
    # ข้อมูลส่วนตัวเพิ่มเติม
    student_id: Optional[str] = Field(None, description="รหัสนักศึกษา")
    university: str = Field(..., description="สถาบันการศึกษา")
    faculty: str = Field(..., description="คณะ")
    major: str = Field(..., description="สาขาวิชา")
    year_of_study: StudentLevel
    current_gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    
    # จดหมายสมัครและแรงจูงใจ
    cover_letter: Optional[str] = Field(None, max_length=1500, description="จดหมายสมัครงาน")
    motivation: Optional[str] = Field(None, max_length=1000, description="แรงจูงใจในการสมัคร")
    career_goals: Optional[str] = Field(None, max_length=800, description="เป้าหมายในอาชีพ")
    
    # ความสามารถและประสบการณ์
    relevant_experience: Optional[str] = Field(None, max_length=1000, description="ประสบการณ์ที่เกี่ยวข้อง")
    projects: Optional[List[str]] = Field(None, description="โปรเจคที่เคยทำ")
    certifications: Optional[List[str]] = Field(None, description="ใบรับรอง/Certificate")
    languages: Optional[List[str]] = Field(None, description="ภาษาที่ใช้ได้")
    
    # Portfolio และลิงก์
    portfolio_url: Optional[str] = Field(None, description="Portfolio/ผลงาน")
    github_url: Optional[str] = Field(None, description="GitHub")
    linkedin_url: Optional[str] = Field(None, description="LinkedIn")
    
    # ความพร้อมและข้อจำกัด
    available_start_date: Optional[date] = Field(None, description="วันที่สามารถเริ่มงานได้")
    transportation: Optional[str] = Field(None, description="การเดินทาง")
    has_laptop: bool = Field(default=False, description="มีแล็ปท็อปส่วนตัว")
    can_work_overtime: bool = Field(default=True, description="สามารถทำงานล่วงเวลาได้")
    
    # เอกสารประกอบ
    transcript_url: Optional[str] = Field(None, description="ใบรายงานผลการเรียน")
    recommendation_letter_url: Optional[str] = Field(None, description="จดหมายรับรอง")
    additional_documents: List[str] = Field(default_factory=list, description="เอกสารเพิ่มเติม")

class ApplicationResponse(BaseModel):
    id: str
    application_code: str
    
    # Job Info
    job_id: str
    job_title: str
    company_name: str
    
    # Student Info
    student_id: str
    student_name: str
    student_email: str
    student_phone: Optional[str]
    university: str
    faculty: str
    major: str
    year_of_study: StudentLevel
    current_gpa: Optional[float]
    
    # Application Content
    cover_letter: Optional[str]
    motivation: Optional[str]
    career_goals: Optional[str]
    relevant_experience: Optional[str]
    
    # Documents
    resume_url: Optional[str]
    transcript_url: Optional[str]
    portfolio_url: Optional[str]
    additional_documents: List[str]
    
    # Status & Review
    status: ApplicationStatus
    ai_matching_score: Optional[float]
    ai_feedback: Optional[str]
    hr_rating: Optional[int]
    hr_comments: Optional[str]
    interview_notes: Optional[str]
    
    # Timeline
    submitted_at: datetime
    last_updated: datetime
    interview_date: Optional[datetime]
    decision_date: Optional[datetime]
    
    # Performance Metrics
    profile_completeness: float
    response_speed_score: float
    gpa_percentile: Optional[float]

# =============================================================================
# 🧪 API HEALTH CHECK
# =============================================================================

@router.get("/test")
async def test_internship_api():
    """🧪 ทดสอบระบบฝึกงานนักศึกษา"""
    return {
        "message": "✅ ระบบคัดกรองเรซูเม่สำหรับนักศึกษาฝึกงานไทย",
        "status": "OK",
        "version": "1.0.0",
        "context": "Thai Student Internship",
        "features": {
            "internship_types": [t.value for t in InternshipType],
            "student_levels": [s.value for s in StudentLevel],
            "departments": [d.value for d in Department],
            "compensation_types": [c.value for c in CompensationType],
            "unique_features": [
                "รองรับระบบเบี้ยเลี้ยงรายวัน",
                "สวัสดิการอาหารกลางวันและค่าเดินทาง", 
                "ระบบจับคู่ตาม GPA และสาขาวิชา",
                "รองรับใบรับรองการฝึกงาน",
                "ระบบพี่เลี้ยงและการประเมิน"
            ]
        },
        "target_users": {
            "students": "นักศึกษาไทยทุกระดับ ปวช.-ปริญญาโท",
            "companies": "บริษัทไทยที่เปิดรับนักศึกษาฝึกงาน",
            "universities": "สถาบันการศึกษาไทย"
        }
    }

# =============================================================================
# 🔍 INTERNSHIP SEARCH FOR STUDENTS
# =============================================================================

@router.get("", response_model=List[InternshipResponse])
async def search_internships(
    # Pagination
    skip: int = Query(0, ge=0, description="หน้าที่จะข้าม"),
    limit: int = Query(20, ge=1, le=50, description="จำนวนต่อหน้า"),
    
    # Text Search
    search: Optional[str] = Query(None, description="ค้นหาชื่อตำแหน่งหรือบริษัท"),
    
    # Student-specific filters
    my_major: Optional[str] = Query(None, description="สาขาวิชาของฉัน"),
    my_level: Optional[StudentLevel] = Query(None, description="ระดับการศึกษาของฉัน"),
    my_gpa: Optional[float] = Query(None, ge=0.0, le=4.0, description="เกรดเฉลี่ยของฉัน"),
    
    # Job type filters
    internship_type: Optional[InternshipType] = Query(None, description="ประเภทฝึกงาน"),
    department: Optional[Department] = Query(None, description="แผนกงาน"),
    work_mode: Optional[WorkMode] = Query(None, description="รูปแบบการทำงาน"),
    
    # Location & Transport
    location: Optional[str] = Query(None, description="พื้นที่ทำงาน"),
    near_bts_mrt: Optional[bool] = Query(None, description="ใกล้ BTS/MRT"),
    
    # Duration
    max_duration: Optional[int] = Query(None, ge=1, le=12, description="ระยะเวลาสูงสุด (เดือน)"),
    min_duration: Optional[int] = Query(None, ge=1, le=12, description="ระยะเวลาขั้นต่ำ (เดือน)"),
    
    # Compensation & Welfare
    compensation_type: Optional[CompensationType] = Query(None, description="ประเภทค่าตอบแทน"),
    min_allowance: Optional[int] = Query(None, ge=0, description="เบี้ยเลี้ยงขั้นต่ำ"),
    has_lunch: Optional[bool] = Query(None, description="มีอาหารกลางวัน"),
    has_transport: Optional[bool] = Query(None, description="มีค่าเดินทาง"),
    
    # Special requirements
    flexible_hours: Optional[bool] = Query(None, description="เวลาทำงานยืดหยุ่น"),
    provides_certificate: Optional[bool] = Query(None, description="ออกใบรับรอง"),
    has_mentor: Optional[bool] = Query(None, description="มีพี่เลี้ยง"),
    
    # Timing
    start_within_days: Optional[int] = Query(None, description="เริ่มงานภายในกี่วัน"),
    deadline_within_days: Optional[int] = Query(None, description="ปิดรับสมัครภายในกี่วัน"),
    
    # Special flags
    urgent_only: Optional[bool] = Query(None, description="เฉพาะงานด่วน"),
    featured_only: Optional[bool] = Query(None, description="เฉพาะงานแนะนำ"),
    
    # Sorting
    sort_by: str = Query("created_at", description="เรียงตาม: created_at, deadline, allowance, duration, match_score"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    
    # AI Personalization
    personalized: bool = Query(False, description="แนะนำตาม Profile"),
    
    # Dependencies
    db=Depends(get_database),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    🔍 ค้นหาตำแหน่งฝึกงานสำหรับนักศึกษา
    
    เฉพาะเจาะจงสำหรับบริบทการฝึกงานของนักศึกษาไทย
    """
    
    try:
        # Base filter
        filter_query = {"is_active": True}
        
        # Text search
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"company_name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$in": [{"$regex": search, "$options": "i"}]}}
            ]
        
        # Student level matching
        if my_level:
            filter_query["student_levels"] = my_level.value
        
        # Major matching
        if my_major:
            filter_query["majors"] = {"$in": [my_major, "ทุกสาขา", "All Majors"]}
        
        # GPA requirement
        if my_gpa:
            filter_query["$or"] = [
                {"min_gpa": {"$lte": my_gpa}},
                {"min_gpa": None}
            ]
        
        # Job type filters
        if internship_type:
            filter_query["internship_type"] = internship_type.value
        
        if department:
            filter_query["department"] = department.value
        
        if work_mode:
            filter_query["work_mode"] = work_mode.value
        
        # Location filters
        if location:
            filter_query["location"] = {"$regex": location, "$options": "i"}
        
        if near_bts_mrt:
            filter_query["nearby_stations"] = {"$exists": True, "$ne": []}
        
        # Duration filters
        if max_duration:
            filter_query["duration_months"] = {"$lte": max_duration}
        
        if min_duration:
            filter_query.setdefault("duration_months", {})["$gte"] = min_duration
        
        # Compensation filters
        if compensation_type:
            filter_query["compensation_type"] = compensation_type.value
        
        if min_allowance:
            filter_query["compensation_amount"] = {"$gte": min_allowance}
        
        # Welfare filters
        if has_lunch is not None:
            filter_query["welfare_lunch"] = has_lunch
        
        if has_transport is not None:
            filter_query["welfare_transport"] = has_transport
        
        # Special requirement filters
        if flexible_hours is not None:
            filter_query["flexible_hours"] = flexible_hours
        
        if provides_certificate is not None:
            filter_query["provides_certificate"] = provides_certificate
        
        if has_mentor is not None:
            filter_query["mentor_assigned"] = has_mentor
        
        # Timing filters
        now = datetime.utcnow()
        
        if start_within_days:
            start_date_limit = now + timedelta(days=start_within_days)
            filter_query["start_date"] = {"$lte": start_date_limit}
        
        if deadline_within_days:
            deadline_limit = now + timedelta(days=deadline_within_days)
            filter_query["application_deadline"] = {
                "$gte": now,
                "$lte": deadline_limit
            }
        
        # Special flags
        if urgent_only:
            filter_query["is_urgent"] = True
        
        if featured_only:
            filter_query["is_featured"] = True
        
        # Exclude expired deadlines
        filter_query["$or"] = [
            {"application_deadline": {"$gt": now}},
            {"application_deadline": None}
        ]
        
        # Execute query with sorting
        sort_direction = 1 if sort_order == "asc" else -1
        cursor = db.internships.find(filter_query).sort(sort_by, sort_direction).skip(skip).limit(limit)
        jobs = await cursor.to_list(length=limit)
        
        # Transform and add AI scores if personalized
        result_jobs = []
        for job in jobs:
            job_data = transform_internship_data(job)
            
            # Add AI matching if user is logged in and requested
            if personalized and current_user:
                job_data["ai_match_score"] = await calculate_student_match_score(job, current_user, db)
                job_data["recommendation_reason"] = await get_recommendation_reason(job, current_user, db)
            
            result_jobs.append(job_data)
        
        # Sort by AI score if personalized
        if personalized and current_user:
            result_jobs.sort(key=lambda x: x.get("ai_match_score", 0), reverse=True)
        
        return result_jobs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching internships: {str(e)}")

# =============================================================================
# 📋 INTERNSHIP DETAILS & MANAGEMENT
# =============================================================================

@router.get("/{job_id}", response_model=InternshipResponse)
async def get_internship_details(
    job_id: str,
    current_user: Optional[dict] = Depends(get_current_user),
    db=Depends(get_database)
):
    """📋 ดูรายละเอียดตำแหน่งฝึกงาน"""
    
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        
        # ดึงข้อมูลงาน
        job = await db.internships.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(status_code=404, detail="Internship not found")
        
        # เพิ่ม view count (ไม่นับซ้ำในวันเดียวกัน)
        if current_user:
            today = datetime.utcnow().date()
            view_key = f"view_{job_id}_{current_user['id']}_{today}"
            
            existing_view = await db.job_views.find_one({"key": view_key})
            if not existing_view:
                await db.job_views.insert_one({
                    "key": view_key,
                    "job_id": job_id,
                    "user_id": current_user["id"],
                    "viewed_at": datetime.utcnow()
                })
                
                await db.internships.update_one(
                    {"_id": ObjectId(job_id)},
                    {"$inc": {"views_count": 1}}
                )
        
        # Transform data
        job_data = transform_internship_data(job)
        
        # Add personalized AI analysis
        if current_user and current_user.get("role") == "student":
            job_data["ai_match_score"] = await calculate_student_match_score(job, current_user, db)
            job_data["recommendation_reason"] = await get_recommendation_reason(job, current_user, db)
        
        return job_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching internship: {str(e)}")

@router.post("", response_model=InternshipResponse)
async def create_internship(
    internship: InternshipCreate,
    current_user=Depends(require_role(["hr", "admin"])),
    db=Depends(get_database)
):
    """➕ สร้างตำแหน่งฝึกงานใหม่ (สำหรับ HR)"""
    
    try:
        # ตรวจสอบ HR company
        company = await db.companies.find_one({"hr_users": current_user["id"]})
        if not company and current_user["role"] != "admin":
            raise HTTPException(status_code=400, detail="HR must be assigned to a company")
        
        # ตรวจสอบวันที่
        if internship.start_date and internship.end_date:
            if internship.end_date <= internship.start_date:
                raise HTTPException(status_code=400, detail="End date must be after start date")
        
        if internship.application_deadline and internship.application_deadline <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="Application deadline must be in the future")
        
        # สร้างเอกสาร
        job_document = {
            **internship.dict(),
            "company_id": str(company["_id"]) if company else "system",
            "company_name": company["name"] if company else "System",
            "company_logo_url": company.get("logo_url") if company else None,
            "company_size": company.get("size") if company else None,
            "company_industry": company.get("industry") if company else None,
            "job_code": generate_unique_id("INT"),
            "created_by": current_user["id"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
            "positions_filled": 0,
            "applications_count": 0,
            "qualified_applications": 0,
            "views_count": 0,
            "saves_count": 0
        }
        
        # บันทึกลงฐานข้อมูล
        result = await db.internships.insert_one(job_document)
        
        # ดึงข้อมูลที่สร้างแล้ว
        created_job = await db.internships.find_one({"_id": result.inserted_id})
        
        return transform_internship_data(created_job)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating internship: {str(e)}")

@router.put("/{job_id}", response_model=InternshipResponse)
async def update_internship(
    job_id: str,
    updates: Dict[str, Any],
    current_user=Depends(require_role(["hr", "admin"])),
    db=Depends(get_database)
):
    """✏️ แก้ไขตำแหน่งฝึกงาน"""
    
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        
        # ตรวจสอบสิทธิ์
        job = await db.internships.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(status_code=404, detail="Internship not found")
        
        if current_user["role"] != "admin":
            company = await db.companies.find_one({"hr_users": current_user["id"]})
            if not company or str(company["_id"]) != job["company_id"]:
                raise HTTPException(status_code=403, detail="Access denied")
        
        # อัพเดต
        updates["updated_at"] = datetime.utcnow()
        
        await db.internships.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": updates}
        )
        
        updated_job = await db.internships.find_one({"_id": ObjectId(job_id)})
        return transform_internship_data(updated_job)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating internship: {str(e)}")

# =============================================================================
# 📝 APPLICATION MANAGEMENT
# =============================================================================

@router.post("/{job_id}/apply", response_model=ApplicationResponse)
async def apply_for_internship(
    job_id: str,
    application: StudentApplicationCreate,
    current_user=Depends(require_role(["student"])),
    db=Depends(get_database)
):
    """📝 สมัครฝึกงาน (สำหรับนักศึกษา)"""
    
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        
        # ตรวจสอบงาน
        job = await db.internships.find_one({"_id": ObjectId(job_id), "is_active": True})
        if not job:
            raise HTTPException(status_code=404, detail="Internship not found or inactive")
        
        # ตรวจสอบ deadline
        if job.get("application_deadline") and job["application_deadline"] <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="Application deadline has passed")
        
        # ตรวจสอบว่าสมัครแล้วหรือยัง
        existing_app = await db.applications.find_one({
            "job_id": job_id,
            "student_id": current_user["id"]
        })
        if existing_app:
            raise HTTPException(status_code=400, detail="You have already applied for this internship")
        
        # ตรวจสอบคุณสมบัติพื้นฐาน
        if not check_student_eligibility(job, application, current_user):
            raise HTTPException(status_code=400, detail="You don't meet the basic requirements for this internship")
        
        # ดึงข้อมูล resume ล่าสุด
        resume = await db.resumes.find_one(
            {"user_id": current_user["id"]},
            sort=[("created_at", -1)]
        )
        
        # คำนวณ AI matching score
        ai_score = await calculate_student_match_score(job, current_user, db) if resume else 0.5
        ai_feedback = await generate_ai_feedback(job, application, current_user, db)
        
        # สร้าง application document
        app_document = {
            **application.dict(),
            "job_id": job_id,
            "job_title": job["title"],
            "company_name": job["company_name"],
            "student_id": current_user["id"],
            "student_name": current_user.get("full_name", current_user["username"]),
            "student_email": current_user["email"],
            "student_phone": current_user.get("phone"),
            "resume_url": resume.get("file_url") if resume else None,
            "application_code": generate_unique_id("APP"),
            "status": ApplicationStatus.SUBMITTED.value,
            "ai_matching_score": ai_score,
            "ai_feedback": ai_feedback,
            "profile_completeness": calculate_profile_completeness(application),
            "submitted_at": datetime.utcnow(),
            "last_updated": datetime.utcnow(),
            "response_speed_score": 1.0  # Full score for immediate application
        }
        
        # บันทึก application
        result = await db.applications.insert_one(app_document)
        
        # อัพเดตสถิติงาน
        update_stats = {"$inc": {"applications_count": 1}}
        if ai_score >= job.get("min_matching_score", 0.6):
            update_stats["$inc"]["qualified_applications"] = 1
        
        await db.internships.update_one(
            {"_id": ObjectId(job_id)},
            update_stats
        )
        
        # ส่งการแจ้งเตือนไปยัง HR (Background task)
        # await notify_hr_new_application(job, app_document)
        
        created_app = await db.applications.find_one({"_id": result.inserted_id})
        return transform_application_data(created_app)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error applying for internship: {str(e)}")

@router.get("/{job_id}/applications", response_model=List[ApplicationResponse])
async def get_internship_applications(
    job_id: str,
    status: Optional[ApplicationStatus] = Query(None, description="กรองตามสถานะ"),
    min_gpa: Optional[float] = Query(None, ge=0.0, le=4.0, description="เกรดเฉลี่ยขั้นต่ำ"),
    min_ai_score: Optional[float] = Query(None, ge=0.0, le=1.0, description="คะแนน AI ขั้นต่ำ"),
    major: Optional[str] = Query(None, description="สาขาวิชา"),
    university: Optional[str] = Query(None, description="มหาวิทยาลัย"),
    sort_by: str = Query("submitted_at", description="เรียงตาม"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(require_role(["hr", "admin"])),
    db=Depends(get_database)
):
    """📋 ดูรายการผู้สมัครฝึกงาน (สำหรับ HR)"""
    
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        
        # ตรวจสอบสิทธิ์
        job = await db.internships.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(status_code=404, detail="Internship not found")
        
        if current_user["role"] != "admin":
            company = await db.companies.find_one({"hr_users": current_user["id"]})
            if not company or str(company["_id"]) != job["company_id"]:
                raise HTTPException(status_code=403, detail="Access denied")
        
        # สร้าง filter
        filter_query = {"job_id": job_id}
        
        if status:
            filter_query["status"] = status.value
        
        if min_gpa is not None:
            filter_query["current_gpa"] = {"$gte": min_gpa}
        
        if min_ai_score is not None:
            filter_query["ai_matching_score"] = {"$gte": min_ai_score}
        
        if major:
            filter_query["major"] = {"$regex": major, "$options": "i"}
        
        if university:
            filter_query["university"] = {"$regex": university, "$options": "i"}
        
        # ดึงข้อมูล
        sort_direction = 1 if sort_order == "asc" else -1
        cursor = db.applications.find(filter_query).sort(sort_by, sort_direction).skip(skip).limit(limit)
        applications = await cursor.to_list(length=limit)
        
        return [transform_application_data(app) for app in applications]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching applications: {str(e)}")

# =============================================================================
# 🎯 AI-POWERED RECOMMENDATIONS
# =============================================================================

@router.get("/recommendations/for-me", response_model=List[InternshipResponse])
async def get_personalized_recommendations(
    limit: int = Query(10, ge=1, le=20, description="จำนวนที่แนะนำ"),
    min_score: float = Query(0.6, ge=0.0, le=1.0, description="คะแนนขั้นต่ำ"),
    include_reason: bool = Query(True, description="รวมเหตุผลการแนะนำ"),
    current_user=Depends(require_role(["student"])),
    db=Depends(get_database)
):
    """🎯 แนะนำตำแหน่งฝึกงานที่เหมาะสม"""
    
    try:
        # ตรวจสอบ Profile ของนักศึกษา
        student_profile = await db.student_profiles.find_one({"user_id": current_user["id"]})
        if not student_profile:
            raise HTTPException(status_code=400, detail="Please complete your student profile first")
        
        # ดึงงานที่เปิดรับสมัคร
        active_jobs = await db.internships.find({
            "is_active": True,
            "$or": [
                {"application_deadline": {"$gt": datetime.utcnow()}},
                {"application_deadline": None}
            ]
        }).to_list(length=100)
        
        # คำนวณคะแนนสำหรับแต่ละงาน
        job_scores = []
        for job in active_jobs:
            score = await calculate_student_match_score(job, current_user, db)
            if score >= min_score:
                job_data = transform_internship_data(job)
                job_data["ai_match_score"] = score
                
                if include_reason:
                    job_data["recommendation_reason"] = await get_recommendation_reason(job, current_user, db)
                
                job_scores.append((score, job_data))
        
        # เรียงตามคะแนน
        job_scores.sort(key=lambda x: x[0], reverse=True)
        
        return [job_data for _, job_data in job_scores[:limit]]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

@router.post("/{job_id}/analyze-fit")
async def analyze_internship_fit(
    job_id: str,
    current_user=Depends(require_role(["student"])),
    db=Depends(get_database)
):
    """🔍 วิเคราะห์ความเหมาะสมกับตำแหน่งฝึกงาน"""
    
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        
        # ดึงข้อมูลงาน
        job = await db.internships.find_one({"_id": ObjectId(job_id), "is_active": True})
        if not job:
            raise HTTPException(status_code=404, detail="Internship not found")
        
        # วิเคราะห์แบบละเอียด
        analysis = await detailed_fit_analysis(job, current_user, db)
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing fit: {str(e)}")

# =============================================================================
# 📊 ANALYTICS & STATISTICS
# =============================================================================

@router.get("/statistics/overview")
async def get_internship_statistics(
    current_user=Depends(require_role(["hr", "admin"])),
    db=Depends(get_database)
):
    """📊 สถิติภาพรวมของระบบฝึกงาน"""
    
    try:
        # Filter สำหรับ HR
        company_filter = {}
        if current_user["role"] != "admin":
            company = await db.companies.find_one({"hr_users": current_user["id"]})
            if company:
                company_filter = {"company_id": str(company["_id"])}
        
        # สถิติพื้นฐาน
        total_internships = await db.internships.count_documents(company_filter)
        active_internships = await db.internships.count_documents({**company_filter, "is_active": True})
        
        # สถิติการสมัคร
        total_applications = await db.applications.count_documents({
            "job_id": {"$in": [str(job["_id"]) for job in await db.internships.find(company_filter, {"_id": 1}).to_list(None)]}
        })
        
        # สถิติตามประเภท
        type_stats = {}
        for intern_type in InternshipType:
            count = await db.internships.count_documents({
                **company_filter,
                "internship_type": intern_type.value,
                "is_active": True
            })
            type_stats[intern_type.value] = count
        
        # สถิติตามแผนก
        dept_stats = {}
        for dept in Department:
            count = await db.internships.count_documents({
                **company_filter,
                "department": dept.value,
                "is_active": True
            })
            if count > 0:
                dept_stats[dept.value] = count
        
        # สถิติค่าตอบแทน
        compensation_stats = {}
        for comp_type in CompensationType:
            count = await db.internships.count_documents({
                **company_filter,
                "compensation_type": comp_type.value,
                "is_active": True
            })
            if count > 0:
                compensation_stats[comp_type.value] = count
        
        return {
            "total_internships": total_internships,
            "active_internships": active_internships,
            "total_applications": total_applications,
            "avg_applications_per_job": total_applications / max(total_internships, 1),
            "by_type": type_stats,
            "by_department": dept_stats,
            "by_compensation": compensation_stats,
            "generated_at": datetime.utcnow().isoformat(),
            "scope": "company" if current_user["role"] != "admin" else "system"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating statistics: {str(e)}")

# =============================================================================
# 🛠️ HELPER FUNCTIONS
# =============================================================================

def transform_internship_data(job: dict) -> dict:
    """แปลงข้อมูลงานจาก MongoDB"""
    
    job["id"] = str(job["_id"])
    
    # Set defaults
    job.setdefault("positions_filled", 0)
    job.setdefault("applications_count", 0)
    job.setdefault("qualified_applications", 0)
    job.setdefault("views_count", 0)
    job.setdefault("saves_count", 0)
    job.setdefault("welfare_others", [])
    job.setdefault("nearby_stations", [])
    
    # Convert dates
    for field in ["created_at", "updated_at", "application_deadline"]:
        if field in job and hasattr(job[field], "isoformat"):
            job[field] = job[field].isoformat()
    
    for date_field in ["start_date", "end_date"]:
        if date_field in job and hasattr(job[date_field], "isoformat"):
            job[date_field] = job[date_field].date().isoformat()
    
    return job

def transform_application_data(app: dict) -> dict:
    """แปลงข้อมูล application จาก MongoDB"""
    
    app["id"] = str(app["_id"])
    
    # Set defaults
    app.setdefault("gpa_percentile", None)
    app.setdefault("additional_documents", [])
    
    # Convert dates
    for field in ["submitted_at", "last_updated", "decision_date"]:
        if field in app and hasattr(app[field], "isoformat"):
            app[field] = app[field].isoformat()
    
    for date_field in ["available_start_date", "interview_date"]:
        if date_field in app and hasattr(app[date_field], "isoformat"):
            app[date_field] = app[date_field].date().isoformat()
    
    return app

async def calculate_student_match_score(job: dict, user: dict, db) -> float:
    """คำนวณคะแนนความเหมาะสมสำหรับนักศึกษา (Mock AI)"""
    
    try:
        # ดึงข้อมูล profile นักศึกษา
        student_profile = await db.student_profiles.find_one({"user_id": user["id"]})
        if not student_profile:
            return 0.5
        
        score = 0.0
        
        # 1. ตรวจสอบระดับการศึกษา (25%)
        user_level = student_profile.get("education_level")
        if user_level in job.get("student_levels", []):
            score += 0.25
        
        # 2. ตรวจสอบสาขาวิชา (20%)
        user_major = student_profile.get("major", "").lower()
        job_majors = [major.lower() for major in job.get("majors", [])]
        if any(user_major in major or major in user_major for major in job_majors) or "ทุกสาขา" in job_majors:
            score += 0.20
        
        # 3. ตรวจสอบ GPA (15%)
        user_gpa = student_profile.get("gpa", 0)
        required_gpa = job.get("min_gpa", 0)
        if user_gpa >= required_gpa:
            score += 0.15
            # Bonus for high GPA
            if user_gpa >= 3.5:
                score += 0.05
        
        # 4. ตรวจสอบทักษะ (20%)
        user_skills = student_profile.get("skills", [])
        required_skills = [skill["name"].lower() for skill in job.get("skills_required", [])]
        
        if required_skills:
            skill_matches = sum(1 for skill in user_skills if any(req_skill in skill.lower() for req_skill in required_skills))
            skill_score = min(skill_matches / len(required_skills), 1.0)
            score += skill_score * 0.20
        
        # 5. ตรวจสอบความพร้อม (10%)
        # ระยะเวลา
        preferred_duration = student_profile.get("preferred_duration_months", 4)
        job_duration = job.get("duration_months", 4)
        if abs(preferred_duration - job_duration) <= 1:
            score += 0.05
        
        # สถานที่
        preferred_location = student_profile.get("preferred_location", "").lower()
        job_location = job.get("location", "").lower()
        if preferred_location in job_location or job_location in preferred_location:
            score += 0.05
        
        # 6. Bonus factors (10%)
        # ค่าตอบแทน
        if job.get("compensation_type") != "ไม่มีค่าตอบแทน":
            score += 0.03
        
        # สวัสดิการ
        welfare_count = sum([
            job.get("welfare_lunch", False),
            job.get("welfare_transport", False),
            job.get("welfare_training", False)
        ])
        score += (welfare_count / 3) * 0.03
        
        # ใบรับรอง
        if job.get("provides_certificate", True):
            score += 0.02
        
        # พี่เลี้ยง
        if job.get("mentor_assigned", True):
            score += 0.02
        
        return min(score, 1.0)
        
    except Exception:
        return 0.5

async def get_recommendation_reason(job: dict, user: dict, db) -> str:
    """สร้างเหตุผลการแนะนำ"""
    
    try:
        reasons = []
        
        student_profile = await db.student_profiles.find_one({"user_id": user["id"]})
        if not student_profile:
            return "แนะนำตามความนิยมทั่วไป"
        
        # เหตุผลตามสาขา
        user_major = student_profile.get("major", "").lower()
        job_majors = [major.lower() for major in job.get("majors", [])]
        if any(user_major in major for major in job_majors):
            reasons.append("ตรงกับสาขาวิชาของคุณ")
        
        # เหตุผลตาม GPA
        user_gpa = student_profile.get("gpa", 0)
        if user_gpa >= 3.5:
            reasons.append("เกรดเฉลี่ยดีเยี่ยม")
        
        # เหตุผลตามทักษะ
        user_skills = student_profile.get("skills", [])
        required_skills = [skill["name"] for skill in job.get("skills_required", [])]
        matching_skills = [skill for skill in user_skills if any(req in skill for req in required_skills)]
        if matching_skills:
            reasons.append(f"มีทักษะที่ตรงกับความต้องการ ({', '.join(matching_skills[:2])})")
        
        # เหตุผลตามสวัสดิการ
        if job.get("compensation_type") != "ไม่มีค่าตอบแทน":
            reasons.append("มีค่าตอบแทน")
        
        if job.get("welfare_lunch"):
            reasons.append("มีอาหารกลางวันฟรี")
        
        if job.get("welfare_transport"):
            reasons.append("มีค่าเดินทาง")
        
        return " • ".join(reasons) if reasons else "เหมาะสมสำหรับการพัฒนาทักษะ"
        
    except Exception:
        return "แนะนำตามระบบ AI"

def check_student_eligibility(job: dict, application: StudentApplicationCreate, user: dict) -> bool:
    """ตรวจสอบคุณสมบัติพื้นฐาน"""
    
    # ตรวจสอบระดับการศึกษา
    if application.year_of_study.value not in job.get("student_levels", []):
        return False
    
    # ตรวจสอบ GPA
    min_gpa = job.get("min_gpa")
    if min_gpa and application.current_gpa and application.current_gpa < min_gpa:
        return False
    
    # ตรวจสอบสาขาวิชา
    job_majors = [major.lower() for major in job.get("majors", [])]
    if job_majors and "ทุกสาขา" not in job_majors and "all majors" not in job_majors:
        user_major = application.major.lower()
        if not any(user_major in major or major in user_major for major in job_majors):
            return False
    
    return True

def calculate_profile_completeness(application: StudentApplicationCreate) -> float:
    """คำนวณความสมบูรณ์ของ Profile"""
    
    score = 0.0
    total_fields = 12
    
    # Required fields
    if application.university: score += 1
    if application.faculty: score += 1
    if application.major: score += 1
    if application.year_of_study: score += 1
    
    # Optional but important fields
    if application.current_gpa: score += 1
    if application.cover_letter: score += 1
    if application.motivation: score += 1
    if application.career_goals: score += 1
    if application.relevant_experience: score += 1
    if application.portfolio_url: score += 1
    if application.projects: score += 1
    if application.certifications: score += 1
    
    return score / total_fields

async def generate_ai_feedback(job: dict, application: StudentApplicationCreate, user: dict, db) -> str:
    """สร้างคำแนะนำจาก AI"""
    
    feedback_parts = []
    
    # ข้อดี
    strengths = []
    if application.current_gpa and application.current_gpa >= 3.5:
        strengths.append("เกรดเฉลี่ยดีเยี่ยม")
    
    if application.portfolio_url:
        strengths.append("มี Portfolio แสดงผลงาน")
    
    if application.relevant_experience:
        strengths.append("มีประสบการณ์ที่เกี่ยวข้อง")
    
    if application.certifications:
        strengths.append("มีใบรับรองเพิ่มเติม")
    
    if strengths:
        feedback_parts.append(f"จุดแข็ง: {', '.join(strengths)}")
    
    # ข้อแนะนำ
    suggestions = []
    if not application.portfolio_url:
        suggestions.append("ควรมี Portfolio แสดงผลงาน")
    
    if not application.cover_letter or len(application.cover_letter) < 200:
        suggestions.append("ควรเขียนจดหมายสมัครงานให้ละเอียดขึ้น")
    
    if not application.projects:
        suggestions.append("ควรมีโปรเจคหรือผลงานประกอบ")
    
    if suggestions:
        feedback_parts.append(f"ข้อแนะนำ: {', '.join(suggestions)}")
    
    return " | ".join(feedback_parts) if feedback_parts else "โปรไฟล์ดีและครบถ้วน"

async def detailed_fit_analysis(job: dict, user: dict, db) -> dict:
    """วิเคราะห์ความเหมาะสมแบบละเอียด"""
    
    try:
        student_profile = await db.student_profiles.find_one({"user_id": user["id"]})
        
        # คำนวณคะแนนโดยรวม
        overall_score = await calculate_student_match_score(job, user, db)
        
        # วิเคราะห์แต่ละด้าน
        analysis = {
            "overall_score": overall_score,
            "match_level": "สูง" if overall_score >= 0.8 else "ปานกลาง" if overall_score >= 0.6 else "ต่ำ",
            
            "detailed_analysis": {
                "education_compatibility": {
                    "score": 0.8 if student_profile else 0.5,
                    "details": "ระดับการศึกษาและสาขาวิชาตรงกับความต้องการ"
                },
                "skill_matching": {
                    "score": 0.7,
                    "details": "ทักษะส่วนใหญ่ตรงกับที่ต้องการ"
                },
                "location_convenience": {
                    "score": 0.9,
                    "details": "สถานที่ทำงานสะดวกในการเดินทาง"
                },
                "compensation_satisfaction": {
                    "score": 0.6,
                    "details": "ค่าตอบแทนและสวัสดิการอยู่ในระดับที่ยอมรับได้"
                }
            },
            
            "strengths": [
                "สาขาวิชาตรงกับความต้องการของบริษัท",
                "มีทักษะพื้นฐานที่จำเป็น",
                "สถานที่ทำงานเดินทางสะดวก"
            ],
            
            "areas_to_improve": [
                "ควรพัฒนาทักษะการสื่อสารภาษาอังกฤษ",
                "แนะนำให้เรียนรู้เครื่องมือเฉพาะทาง"
            ],
            
            "missing_requirements": [],
            
            "recommendation": "แนะนำให้สมัคร" if overall_score >= 0.6 else "ควรพัฒนาทักษะเพิ่มเติมก่อนสมัคร",
            
            "confidence_level": "สูง" if overall_score >= 0.8 else "ปานกลาง" if overall_score >= 0.6 else "ต่ำ",
            
            "estimated_success_rate": f"{int(overall_score * 100)}%",
            
            "next_steps": [
                "อ่านรายละเอียดงานให้ละเอียด",
                "เตรียมจดหมายสมัครงานที่ดี",
                "รวบรวมผลงานและเอกสารที่จำเป็น"
            ] if overall_score >= 0.6 else [
                "พัฒนาทักษะที่ขาดหายไป",
                "หาประสบการณ์เพิ่มเติม",
                "ปรับปรุงเกรดเฉลี่ย"
            ]
        }
        
        return analysis
        
    except Exception as e:
        return {
            "overall_score": 0.5,
            "match_level": "ไม่สามารถวิเคราะห์ได้",
            "error": str(e),
            "recommendation": "กรุณาลองใหม่อีกครั้ง"
        }

# =============================================================================
# 📋 ADDITIONAL UTILITY ENDPOINTS
# =============================================================================

@router.get("/categories/departments")
async def get_available_departments(db=Depends(get_database)):
    """📂 ดึงรายการแผนกที่มีงานฝึกงาน"""
    
    try:
        departments = await db.internships.distinct("department", {"is_active": True})
        
        return {
            "departments": departments,
            "count": len(departments),
            "all_departments": [dept.value for dept in Department]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching departments: {str(e)}")

@router.get("/categories/locations")
async def get_available_locations(db=Depends(get_database)):
    """📍 ดึงรายการสถานที่ทำงานทั้งหมด"""
    
    try:
        locations = await db.internships.distinct("location", {"is_active": True})
        
        return {
            "locations": locations,
            "count": len(locations),
            "popular_areas": [
                "กรุงเทพมหานคร",
                "นนทบุรี",
                "ปทุมธานี",
                "สมุทรปราการ",
                "ชลบุรี",
                "ระยอง"
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching locations: {str(e)}")

@router.get("/my-applications", response_model=List[ApplicationResponse])
async def get_my_applications(
    status: Optional[ApplicationStatus] = Query(None, description="กรองตามสถานะ"),
    sort_by: str = Query("submitted_at", description="เรียงตาม"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user=Depends(require_role(["student"])),
    db=Depends(get_database)
):
    """📋 ดูรายการการสมัครงานของฉัน"""
    
    try:
        filter_query = {"student_id": current_user["id"]}
        
        if status:
            filter_query["status"] = status.value
        
        sort_direction = 1 if sort_order == "asc" else -1
        applications = await db.applications.find(filter_query).sort(sort_by, sort_direction).to_list(length=100)
        
        return [transform_application_data(app) for app in applications]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching applications: {str(e)}")

@router.put("/applications/{application_id}/withdraw")
async def withdraw_application(
    application_id: str,
    reason: Optional[str] = Query(None, description="เหตุผลในการถอนตัว"),
    current_user=Depends(require_role(["student"])),
    db=Depends(get_database)
):
    """❌ ถอนใบสมัครงาน"""
    
    try:
        if not ObjectId.is_valid(application_id):
            raise HTTPException(status_code=400, detail="Invalid application ID format")
        
        # ตรวจสอบการสมัคร
        application = await db.applications.find_one({
            "_id": ObjectId(application_id),
            "student_id": current_user["id"]
        })
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # ตรวจสอบสถานะ (ไม่สามารถถอนถ้ารับแล้วหรือปฏิเสธแล้ว)
        if application["status"] in [ApplicationStatus.ACCEPTED.value, ApplicationStatus.REJECTED.value]:
            raise HTTPException(status_code=400, detail="Cannot withdraw this application")
        
        # อัพเดตสถานะ
        await db.applications.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": {
                "status": ApplicationStatus.WITHDRAWN.value,
                "withdrawal_reason": reason,
                "last_updated": datetime.utcnow()
            }}
        )
        
        # ลดจำนวนใบสมัครในงาน
        await db.internships.update_one(
            {"_id": ObjectId(application["job_id"])},
            {"$inc": {"applications_count": -1}}
        )
        
        return {"message": "Application withdrawn successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error withdrawing application: {str(e)}")

@router.post("/{job_id}/save")
async def save_internship(
    job_id: str,
    current_user=Depends(require_role(["student"])),
    db=Depends(get_database)
):
    """⭐ บันทึกงานฝึกงานที่สนใจ"""
    
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        
        # ตรวจสอบงาน
        job = await db.internships.find_one({"_id": ObjectId(job_id), "is_active": True})
        if not job:
            raise HTTPException(status_code=404, detail="Internship not found")
        
        # ตรวจสอบว่าบันทึกแล้วหรือยัง
        existing_save = await db.saved_jobs.find_one({
            "job_id": job_id,
            "user_id": current_user["id"]
        })
        
        if existing_save:
            raise HTTPException(status_code=400, detail="Job already saved")
        
        # บันทึกงาน
        await db.saved_jobs.insert_one({
            "job_id": job_id,
            "user_id": current_user["id"],
            "saved_at": datetime.utcnow()
        })
        
        # เพิ่มจำนวน saves
        await db.internships.update_one(
            {"_id": ObjectId(job_id)},
            {"$inc": {"saves_count": 1}}
        )
        
        return {"message": "Internship saved successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving internship: {str(e)}")

@router.delete("/{job_id}/unsave")
async def unsave_internship(
    job_id: str,
    current_user=Depends(require_role(["student"])),
    db=Depends(get_database)
):
    """❌ ยกเลิกการบันทึกงาน"""
    
    try:
        # ลบการบันทึก
        result = await db.saved_jobs.delete_one({
            "job_id": job_id,
            "user_id": current_user["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Saved job not found")
        
        # ลดจำนวน saves
        await db.internships.update_one(
            {"_id": ObjectId(job_id)},
            {"$inc": {"saves_count": -1}}
        )
        
        return {"message": "Internship unsaved successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unsaving internship: {str(e)}")

@router.get("/saved", response_model=List[InternshipResponse])
async def get_saved_internships(
    current_user=Depends(require_role(["student"])),
    db=Depends(get_database)
):
    """⭐ ดูรายการงานที่บันทึกไว้"""
    
    try:
        # ดึงงานที่บันทึกไว้
        saved_jobs = await db.saved_jobs.find({"user_id": current_user["id"]}).sort("saved_at", -1).to_list(length=100)
        
        if not saved_jobs:
            return []
        
        # ดึงข้อมูลงานจริง
        job_ids = [ObjectId(save["job_id"]) for save in saved_jobs]
        jobs = await db.internships.find({"_id": {"$in": job_ids}}).to_list(length=100)
        
        # แปลงข้อมูลและเพิ่ม AI score
        result_jobs = []
        for job in jobs:
            job_data = transform_internship_data(job)
            job_data["ai_match_score"] = await calculate_student_match_score(job, current_user, db)
            result_jobs.append(job_data)
        
        return result_jobs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching saved internships: {str(e)}")

# =============================================================================
# 🎓 STUDENT DASHBOARD SUMMARY
# =============================================================================

@router.get("/dashboard/summary")
async def get_student_dashboard_summary(
    current_user=Depends(require_role(["student"])),
    db=Depends(get_database)
):
    """📊 สรุปข้อมูลสำหรับ Dashboard นักศึกษา"""
    
    try:
        # สถิติการสมัคร
        my_applications = await db.applications.count_documents({"student_id": current_user["id"]})
        
        # สถิติตามสถานะ
        status_counts = {}
        for status in ApplicationStatus:
            count = await db.applications.count_documents({
                "student_id": current_user["id"],
                "status": status.value
            })
            if count > 0:
                status_counts[status.value] = count
        
        # งานที่บันทึกไว้
        saved_count = await db.saved_jobs.count_documents({"user_id": current_user["id"]})
        
        # งานใหม่ที่แนะนำ (7 วันที่แล้ว)
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_recommendations = await db.internships.count_documents({
            "is_active": True,
            "created_at": {"$gte": week_ago},
            "$or": [
                {"application_deadline": {"$gt": datetime.utcnow()}},
                {"application_deadline": None}
            ]
        })
        
        # งานที่จะหมดเขตเร็วๆ นี้ (3 วันข้างหน้า)
        three_days_later = datetime.utcnow() + timedelta(days=3)
        expiring_soon = await db.internships.count_documents({
            "is_active": True,
            "application_deadline": {
                "$gte": datetime.utcnow(),
                "$lte": three_days_later
            }
        })
        
        # การสมัครล่าสุด
        recent_applications = await db.applications.find(
            {"student_id": current_user["id"]},
            {"job_title": 1, "company_name": 1, "status": 1, "submitted_at": 1}
        ).sort("submitted_at", -1).limit(5).to_list(5)
        
        return {
            "applications": {
                "total": my_applications,
                "by_status": status_counts,
                "recent": [
                    {
                        "job_title": app["job_title"],
                        "company_name": app["company_name"],
                        "status": app["status"],
                        "submitted_at": app["submitted_at"].isoformat() if hasattr(app["submitted_at"], "isoformat") else str(app["submitted_at"])
                    }
                    for app in recent_applications
                ]
            },
            "saved_jobs": saved_count,
            "opportunities": {
                "new_recommendations": new_recommendations,
                "expiring_soon": expiring_soon
            },
            "profile_completion": 85,  # Mock - จะคำนวณจริงภายหลัง
            "next_actions": [
                "อัพเดต Resume ให้เป็นปัจจุบัน",
                "ตรวจสอบงานใหม่ที่แนะนำ",
                "เตรียมตัวสำหรับการสัมภาษณ์"
            ],
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating dashboard summary: {str(e)}")

# =============================================================================
# 📄 EXPORT & REPORTING
# =============================================================================

@router.get("/export/my-applications")
async def export_my_applications(
    format: str = Query("csv", regex="^(csv|json)$", description="รูปแบบไฟล์"),
    current_user=Depends(require_role(["student"])),
    db=Depends(get_database)
):
    """📊 Export ประวัติการสมัครงาน"""
    
    try:
        applications = await db.applications.find({"student_id": current_user["id"]}).to_list(length=1000)
        
        if format == "csv":
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Header
            writer.writerow([
                "Application Code", "Job Title", "Company", "Status",
                "Submitted Date", "Last Updated", "AI Score", "HR Rating"
            ])
            
            # Data
            for app in applications:
                writer.writerow([
                    app.get("application_code", ""),
                    app.get("job_title", ""),
                    app.get("company_name", ""),
                    app.get("status", ""),
                    app.get("submitted_at", "").strftime("%Y-%m-%d") if app.get("submitted_at") else "",
                    app.get("last_updated", "").strftime("%Y-%m-%d") if app.get("last_updated") else "",
                    app.get("ai_matching_score", ""),
                    app.get("hr_rating", "")
                ])
            
            from fastapi.responses import StreamingResponse
            output.seek(0)
            return StreamingResponse(
                io.BytesIO(output.getvalue().encode()),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=my_applications.csv"}
            )
        
        else:  # JSON format
            from fastapi.responses import JSONResponse
            return JSONResponse(
                content={
                    "applications": [transform_application_data(app) for app in applications],
                    "exported_at": datetime.utcnow().isoformat(),
                    "total_count": len(applications)
                }
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting applications: {str(e)}")

# =============================================================================
# 🔚 END OF FILE
# =============================================================================

# TODO: ส่วนที่ยังต้องพัฒนาต่อ
"""
1. ระบบ AI จริง:
   - PDF text extraction
   - NLP skill identification  
   - Advanced matching algorithms
   - LLM integration

2. ระบบแจ้งเตือน:
   - Email notifications
   - Line notifications
   - In-app notifications

3. ระบบรายงาน:
   - HR analytics dashboard
   - Student progress tracking
   - University partnership reports

4. ระบบการประเมิน:
   - Performance evaluation
   - Feedback system
   - Rating system

5. Advanced Features:
   - Video interview integration
   - Calendar scheduling
   - Document verification
   - Background checks
"""