# -*- coding: utf-8 -*-
# =============================================================================
# 🚀 FASTAPI MAIN APPLICATION - AI Resume Screening System
# =============================================================================
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import uvicorn
import os
import sys
import logging
from dotenv import load_dotenv
from typing import Optional

logger = logging.getLogger(__name__)

# เพิ่ม current directory ลง Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Import database functions
from core.database import connect_to_mongo, close_mongo_connection, test_connection, get_database

# Import route modules with error handling
from routes.auth import router as auth_router
from routes.admin import router as admin_router
from routes.company import router as company_router
from routes.student import router as student_router
from routes.profile import router as profile_router
from routes.resume import router as resume_router
from routes.matching import router as matching_router

from core.auth import get_current_user_data
# ลอง import job router แบบ safe
try:
    from routes.job import router as job_router
    JOB_ROUTER_AVAILABLE = True
    logger.info("Job router imported successfully")
except ImportError as e:
    logger.warning("Job router not available: %s", e)
    JOB_ROUTER_AVAILABLE = False
    job_router = None

# Import XGBoost router
try:
    from routes.xgboost import router as xgboost_router
    XGBOOST_ROUTER_AVAILABLE = True
    logger.info("XGBoost router imported successfully")
except ImportError as e:
    logger.warning("XGBoost router not available: %s", e)
    XGBOOST_ROUTER_AVAILABLE = False
    xgboost_router = None

# Load environment variables
load_dotenv()

# =============================================================================
# 📊 APP CONFIGURATION
# =============================================================================
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

app = FastAPI(
    title="AI Resume Screening System",
    description="ระบบคัดกรองเรซูเม่สำหรับนักศึกษาฝึกงานด้วยเทคโนโลยี AI",
    version="1.0.0",
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if ENVIRONMENT == "development" else None
)

# =============================================================================
# 📁 STATIC FILES MOUNTING - สำหรับ serve รูปภาพและไฟล์
# =============================================================================
uploads_path = "uploads"
if not os.path.exists(uploads_path):
    os.makedirs(uploads_path)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# =============================================================================
# 🌐 CORS MIDDLEWARE - อนุญาตให้ Frontend เรียก API ได้
# =============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin"],
)

# =============================================================================
# 🛡️ SECURITY HEADERS MIDDLEWARE
# =============================================================================
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if ENVIRONMENT != "development":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

@app.middleware("http")
async def verify_uploads_access(request: Request, call_next):
    """ตรวจสอบสิทธิ์การเข้าถึงไฟล์ Static"""
    if request.url.path.startswith("/uploads"):
        if request.method == "OPTIONS":
            return await call_next(request)
            
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        elif "token" in request.query_params:
            token = request.query_params["token"]
            
        if not token:
            return JSONResponse(status_code=401, content={"detail": "Unauthorized access to static files. Please provide a token."})
            
        from core.auth import validate_token
        if not validate_token(token):
            return JSONResponse(status_code=401, content={"detail": "Invalid or expired token."})
            
    return await call_next(request)

# =============================================================================
# 📋 INCLUDE ROUTERS - เพิ่ม API endpoints
# =============================================================================
app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(company_router, prefix="/api")
app.include_router(student_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(resume_router, prefix="/api")
app.include_router(matching_router, prefix="/api")

# Include job router เฉพาะเมื่อใช้ได้
if JOB_ROUTER_AVAILABLE and job_router is not None:
    app.include_router(job_router, prefix="/api")
    logger.info("Job router included")
else:
    logger.warning("Job router skipped")

# Include XGBoost router
if XGBOOST_ROUTER_AVAILABLE and xgboost_router is not None:
    app.include_router(xgboost_router, prefix="/api/xgboost")
    logger.info("XGBoost router included")
else:
    logger.warning("XGBoost router skipped")

# =============================================================================
# 🔄 APP LIFECYCLE EVENTS
# =============================================================================
@app.on_event("startup")
async def startup_event():
    """
    🚀 เหตุการณ์เมื่อแอพเริ่มทำงาน
    - เชื่อมต่อฐานข้อมูล
    - ตั้งค่าเริ่มต้น
    """
    logger.info("Starting AI Resume Screening System...")
    await connect_to_mongo()
    
    # ตรวจสอบ uploads folder
    uploads_dirs = ["uploads/profiles", "uploads/resumes", "uploads/companies"]
    for directory in uploads_dirs:
        if not os.path.exists(directory):
            os.makedirs(directory)
            logger.info("Created directory: %s", directory)
    
    # Initialize XGBoost Service
    try:
        from services.xgboost_service import XGBoostService
        xgb = XGBoostService.get_instance()
        if xgb.is_model_available():
            logger.info("XGBoost model loaded")
        else:
            logger.info("XGBoost model not found — using rule-based fallback")
    except Exception as e:
        logger.warning("XGBoost service init failed: %s", e)
    
    logger.info("Application started successfully!")

@app.on_event("shutdown") 
async def shutdown_event():
    """
    🛑 เหตุการณ์เมื่อแอพปิดทำงาน
    - ปิดการเชื่อมต่อฐานข้อมูล
    """
    logger.info("Shutting down AI Resume Screening System...")
    await close_mongo_connection()
    logger.info("Application stopped successfully!")

# =============================================================================
# 🏠 ROOT ENDPOINTS
# =============================================================================
@app.get("/")
async def root():
    """
    🏠 หน้าแรก - แสดงข้อมูลเบื้องต้นของระบบ
    """
    endpoints = {
        "auth": {
            "register": "/api/auth/register",
            "login": "/api/auth/login",
            "me": "/api/auth/me"
        },
        "profile": {
            "get_profile": "/api/profile",
            "update_profile": "/api/profile",
            "upload_image": "/api/profile/upload-image",
            "change_password": "/api/profile/change-password",
            "dashboard": "/api/profile/dashboard"
        },
        "jobs": {
            "test": "/api/jobs/test",
            "list": "/api/jobs",
            "get_by_id": "/api/jobs/{job_id}",
            "create": "/api/jobs",
            "statistics": "/api/jobs/statistics/overview",
            "departments": "/api/jobs/departments"
        },
        "student": {
            "dashboard": "/api/student/dashboard"
        },
        "admin": {
            "dashboard": "/api/admin/dashboard",
            "users": "/api/admin/users",
            "create_user": "/api/admin/users"
        },
        "companies": {
            "list": "/api/companies",
            "create": "/api/companies",
            "manage_hr": "/api/companies/{company_id}/hr",
            "my_company": "/api/companies/my-company/info"
        }
    }
    
    return {
        "message": "🤖 AI Resume Screening System",
        "description": "ระบบคัดกรองเรซูเม่สำหรับนักศึกษาฝึกงานด้วยเทคโนโลยี AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "api_prefix": "/api",
        "static_files": "/uploads",
        "job_router_status": "manual" if not JOB_ROUTER_AVAILABLE else "available",
        "endpoints": endpoints
    }

@app.get("/api/health")
async def health_check():
    """
    🏥 ตรวจสอบสถานะระบบ
    - ตรวจสอบการเชื่อมต่อฐานข้อมูล
    - ตรวจสอบสถานะ API
    """
    try:
        # ตรวจสอบการเชื่อมต่อฐานข้อมูล
        db_status = await test_connection()
        
        # ตรวจสอบ uploads directory
        uploads_status = {
            "exists": os.path.exists("uploads"),
            "profiles": os.path.exists("uploads/profiles"),
            "resumes": os.path.exists("uploads/resumes"),
            "companies": os.path.exists("uploads/companies")
        }
        
        return {
            "status": "healthy",
            "timestamp": "2025-06-22T15:30:00Z",
            "version": "1.0.0",
            "services": {
                "api": "healthy",
                "database": db_status["status"],
                "static_files": "healthy" if uploads_status["exists"] else "warning",
                "job_router": "manual" if not JOB_ROUTER_AVAILABLE else "available"
            },
            "database_info": db_status,
            "uploads_info": uploads_status
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="System health check failed. Please try again later."
        )

# =============================================================================
# 📋 MANUAL JOB ENDPOINTS (เพราะ job router ไม่ทำงาน)
# =============================================================================
@app.get("/api/jobs/test")
async def manual_test_jobs():
    """🧪 ทดสอบ Jobs API (Manual)"""
    return {
        "message": "Jobs API working from main.py!",
        "status": "OK", 
        "source": "main.py",
        "timestamp": "2025-07-05",
        "database_connected": True
    }

@app.get("/api/jobs")
async def manual_get_jobs(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    department: Optional[str] = None,
    is_remote: Optional[bool] = None,
    db=Depends(get_database)
):
    """📋 ดึงรายการงานทั้งหมด (Manual)"""
    try:
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # สร้าง filter query
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        filter_query = {"is_active": True}
        
        # ค้นหาด้วยข้อความ
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            filter_query["$or"] = [
                {"title": search_regex},
                {"description": search_regex},
                {"company_name": search_regex}
            ]
        
        # กรองตามแผนก
        if department:
            filter_query["department"] = department
        
        # กรองตาม remote/onsite
        if is_remote is not None:
            filter_query["is_remote"] = is_remote
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # ดึงข้อมูลจากฐานข้อมูล
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        cursor = db.jobs.find(filter_query).sort("created_at", -1).skip(skip).limit(limit)
        jobs = await cursor.to_list(length=limit)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # ⭐ แปลง ObjectId เป็น string
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        result_jobs = []
        for job in jobs:
            # 🔑 แปลง _id (ObjectId) เป็น string
            job["id"] = str(job["_id"])
            # 📝 แปลง ObjectId เป็น string
            
            del job["_id"]
            # 📝 ลบ _id เดิมออก (ไม่จำเป็น)
            
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━
            # ขั้นที่ 4: ตั้งค่า default
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━
            job.setdefault("company_name", "Unknown Company")
            job.setdefault("requirements", [])
            job.setdefault("skills_required", [])
            job.setdefault("salary_min", None)
            job.setdefault("salary_max", None)
            job.setdefault("is_remote", False)
            job.setdefault("positions_available", 1)
            job.setdefault("applications_count", 0)
            
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━
            # ขั้นที่ 5: แปลง datetime → string
            # ━━━━━━━━━━━━━━━━━━━━━━━━━━
            if "created_at" in job:
                if hasattr(job["created_at"], "isoformat"):
                    job["created_at"] = job["created_at"].isoformat()
                elif not isinstance(job["created_at"], str):
                    job["created_at"] = str(job["created_at"])
            
            if "updated_at" in job:
                if hasattr(job["updated_at"], "isoformat"):
                    job["updated_at"] = job["updated_at"].isoformat()
                elif not isinstance(job["updated_at"], str):
                    job["updated_at"] = str(job["updated_at"])
            
            if "application_deadline" in job:
                if hasattr(job["application_deadline"], "isoformat"):
                    job["application_deadline"] = job["application_deadline"].isoformat()
                elif not isinstance(job["application_deadline"], str):
                    job["application_deadline"] = str(job["application_deadline"])
            
            result_jobs.append(job)
        
        return result_jobs
        
    except Exception as e:
        logger.error("Error fetching jobs: %s", e)
        return {
            "jobs": [],
            "message": "Error fetching jobs. Please try again later."
        }

@app.get("/api/jobs/{job_id}")
async def manual_get_job_by_id(
    job_id: str,
    current_user: dict = Depends(get_current_user_data),
    db=Depends(get_database)
):
    """📋 ดึงรายละเอียดงานตาม ID (Manual)"""
    try:
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # ขั้นที่ 1: ตรวจสอบว่า job_id ถูกต้องหรือไม่
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        from bson import ObjectId
        
        if not ObjectId.is_valid(job_id):
            # 📝 ObjectId.is_valid(): เช็คว่า string สามารถแปลงเป็น ObjectId ได้หรือไม่
            raise HTTPException(
                status_code=400,
                detail="Invalid job ID format"
            )
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # ขั้นที่ 2: ดึงข้อมูลจาก Database
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        job = await db.jobs.find_one({
            "_id": ObjectId(job_id)
            # 📝 แปลง string → ObjectId เพื่อค้นหา
        })
        
        if not job:
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # ขั้นที่ 3: แปลง ObjectId → string ⭐
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        job["id"] = str(job["_id"])
        # 📝 แปลง ObjectId เป็น string
        
        del job["_id"]
        # 📝 ลบ _id เดิมออก (ไม่ต้องการแล้ว)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # ขั้นที่ 4: ตั้งค่า default
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        job.setdefault("company_name", "Unknown Company")
        job.setdefault("requirements", [])
        job.setdefault("skills_required", [])
        job.setdefault("salary_min", None)
        job.setdefault("salary_max", None)
        job.setdefault("is_remote", False)
        job.setdefault("positions_available", 1)
        job.setdefault("applications_count", 0)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # ขั้นที่ 5: แปลง datetime → string
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        if "created_at" in job:
            if hasattr(job["created_at"], "isoformat"):
                job["created_at"] = job["created_at"].isoformat()
            elif not isinstance(job["created_at"], str):
                job["created_at"] = str(job["created_at"])
        
        if "updated_at" in job:
            if hasattr(job["updated_at"], "isoformat"):
                job["updated_at"] = job["updated_at"].isoformat()
            elif not isinstance(job["updated_at"], str):
                job["updated_at"] = str(job["updated_at"])
        
        if "application_deadline" in job:
            if hasattr(job["application_deadline"], "isoformat"):
                job["application_deadline"] = job["application_deadline"].isoformat()
            elif not isinstance(job["application_deadline"], str):
                job["application_deadline"] = str(job["application_deadline"])
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # ขั้นที่ 6: ส่งกลับ
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        return job
        
    except HTTPException:
        # 📝 HTTPException: Error ที่เรายกขึ้นเอง (400, 404)
        raise
        
    except Exception as e:
        # 📝 Exception อื่นๆ: Error ที่ไม่คาดคิด
        logger.error("Error in get_job_by_id: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Error fetching job."
        )

@app.post("/api/jobs")
async def manual_create_job(
    job_data: dict,
    current_user: dict = Depends(get_current_user_data),
    db=Depends(get_database)
):
    """➕ สร้างงานใหม่ (Manual - with authentication)"""
    try:
        from datetime import datetime
        from bson import ObjectId
        
        # ตรวจสอบ role - ต้องเป็น HR หรือ Admin
        user_type = current_user.get("user_type")
        if user_type not in ["HR", "Admin"]:
            logger.warning("Access denied for user_type=%s", user_type)
            raise HTTPException(
                status_code=403, 
                detail="Access denied. HR or Admin role required."
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
        
        # เพิ่มข้อมูลเริ่มต้น
        job_data.update({
            "company_id": company_id,
            "company_name": company_name,
            "created_by": current_user["sub"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
            "applications_count": 0
        })
        
        # บันทึกลงฐานข้อมูล
        result = await db.jobs.insert_one(job_data)
        
        # ดึงข้อมูลที่สร้างแล้ว
        created_job = await db.jobs.find_one({"_id": result.inserted_id})
        created_job["id"] = str(created_job["_id"])
        created_job.pop("_id", None)
        
        # แปลง datetime เป็น string
        if "created_at" in created_job and hasattr(created_job["created_at"], "isoformat"):
            created_job["created_at"] = created_job["created_at"].isoformat()
        if "updated_at" in created_job and hasattr(created_job["updated_at"], "isoformat"):
            created_job["updated_at"] = created_job["updated_at"].isoformat()
        
        logger.info("Job created successfully: %s", created_job['id'])
        
        return created_job
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create job: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Error creating job."
        )


# =============================================================================
# 🔧 ERROR HANDLERS
# =============================================================================
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """จัดการ 404 Not Found"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "ไม่พบหน้าที่ต้องการ",
            "path": str(request.url)
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """จัดการ 500 Internal Server Error"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error", 
            "message": "เกิดข้อผิดพลาดภายในระบบ"
        }
    )

# =============================================================================
# 🏃‍♂️ RUN APPLICATION
# =============================================================================
if __name__ == "__main__":
    # Get configuration from environment
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    DEBUG = os.getenv("ENVIRONMENT", "development") == "development"
    
    logger.info("Starting server on http://%s:%d", HOST, PORT)
    logger.info("Environment: %s", os.getenv('ENVIRONMENT', 'development'))
   
    
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level="info"
    )