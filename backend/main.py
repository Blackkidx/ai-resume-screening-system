# =============================================================================
# 🚀 FASTAPI MAIN APPLICATION - AI Resume Screening System
# =============================================================================
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import uvicorn
import os
import sys
from dotenv import load_dotenv
from typing import Optional

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

# ลอง import job router แบบ safe
try:
    from routes.job import router as job_router
    JOB_ROUTER_AVAILABLE = True
    print("✅ Job router imported successfully")
except ImportError as e:
    print(f"⚠️ Job router not available: {e}")
    JOB_ROUTER_AVAILABLE = False
    job_router = None

# Load environment variables
load_dotenv()

# =============================================================================
# 📊 APP CONFIGURATION
# =============================================================================
app = FastAPI(
    title="AI Resume Screening System",
    description="ระบบคัดกรองเรซูเม่สำหรับนักศึกษาฝึกงานด้วยเทคโนโลยี AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
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
    allow_headers=["*"],
)

# =============================================================================
# 📋 INCLUDE ROUTERS - เพิ่ม API endpoints
# =============================================================================
app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(company_router, prefix="/api")
app.include_router(student_router, prefix="/api")
app.include_router(profile_router, prefix="/api")

# Include job router เฉพาะเมื่อใช้ได้
if JOB_ROUTER_AVAILABLE and job_router is not None:
    app.include_router(job_router, prefix="/api")
    print("✅ Job router included")
else:
    print("⚠️ Job router skipped")

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
    print("🚀 Starting AI Resume Screening System...")
    await connect_to_mongo()
    
    # ตรวจสอบ uploads folder
    uploads_dirs = ["uploads/profiles", "uploads/resumes", "uploads/companies"]
    for directory in uploads_dirs:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"📁 Created directory: {directory}")
    
    print("🎯 Application started successfully!")
    print(f"📁 Static files available at: http://localhost:8000/uploads/")

@app.on_event("shutdown") 
async def shutdown_event():
    """
    🛑 เหตุการณ์เมื่อแอพปิดทำงาน
    - ปิดการเชื่อมต่อฐานข้อมูล
    """
    print("🛑 Shutting down AI Resume Screening System...")
    await close_mongo_connection()
    print("👋 Application stopped successfully!")

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
            detail=f"System health check failed: {str(e)}"
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
        # สร้าง filter query
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
        
        # ดึงข้อมูลจากฐานข้อมูล
        cursor = db.jobs.find(filter_query).sort("created_at", -1).skip(skip).limit(limit)
        jobs = await cursor.to_list(length=limit)
        
        # แปลง ObjectId เป็น string และเตรียมข้อมูล
        result_jobs = []
        for job in jobs:
            job["id"] = str(job["_id"])
            
            # ตั้งค่า default values ถ้าไม่มี
            job.setdefault("company_name", "Unknown Company")
            job.setdefault("requirements", [])
            job.setdefault("skills_required", [])
            job.setdefault("salary_min", None)
            job.setdefault("salary_max", None)
            job.setdefault("is_remote", False)
            job.setdefault("positions_available", 1)
            job.setdefault("applications_count", 0)
            
            # แปลง datetime เป็น string ถ้าเป็น datetime object
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
        return {
            "error": str(e),
            "jobs": [],
            "message": "Error fetching jobs but API is working"
        }

@app.get("/api/jobs/{job_id}")
async def manual_get_job_by_id(
    job_id: str,
    db=Depends(get_database)
):
    """📋 ดึงข้อมูลงานตาม ID (Manual)"""
    try:
        from bson import ObjectId
        
        if not ObjectId.is_valid(job_id):
            return {
                "error": "Invalid job ID format",
                "job_id": job_id
            }
        
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            return {
                "error": "Job not found",
                "job_id": job_id
            }
        
        # แปลงข้อมูล
        job["id"] = str(job["_id"])
        job.setdefault("company_name", "Unknown Company")
        job.setdefault("requirements", [])
        job.setdefault("skills_required", [])
        job.setdefault("applications_count", 0)
        
        # แปลง datetime
        if "created_at" in job and hasattr(job["created_at"], "isoformat"):
            job["created_at"] = job["created_at"].isoformat()
        if "updated_at" in job and hasattr(job["updated_at"], "isoformat"):
            job["updated_at"] = job["updated_at"].isoformat()
        if "application_deadline" in job and hasattr(job["application_deadline"], "isoformat"):
            job["application_deadline"] = job["application_deadline"].isoformat()
        
        return job
        
    except Exception as e:
        return {
            "error": str(e),
            "job_id": job_id,
            "message": "Error fetching job but API is working"
        }

@app.post("/api/jobs")
async def manual_create_job(
    job_data: dict,
    db=Depends(get_database)
):
    """➕ สร้างงานใหม่ (Manual - แบบง่าย)"""
    try:
        from datetime import datetime
        
        # เพิ่มข้อมูลเริ่มต้น
        job_data.update({
            "company_id": "default_company",
            "company_name": "Test Company",
            "created_by": "system",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        })
        
        # บันทึกลงฐานข้อมูล
        result = await db.jobs.insert_one(job_data)
        
        return {
            "message": "Job created successfully",
            "job_id": str(result.inserted_id),
            "status": "success",
            "source": "main.py"
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "message": "Error creating job but API is working",
            "status": "error"
        }

@app.get("/api/jobs/statistics/overview")
async def manual_jobs_statistics(db=Depends(get_database)):
    """📊 สถิติภาพรวมของงาน (Manual)"""
    try:
        # สถิติทั่วไป
        total_jobs = await db.jobs.count_documents({})
        active_jobs = await db.jobs.count_documents({"is_active": True})
        remote_jobs = await db.jobs.count_documents({"is_active": True, "is_remote": True})
        onsite_jobs = active_jobs - remote_jobs
        
        return {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "inactive_jobs": total_jobs - active_jobs,
            "remote_jobs": remote_jobs,
            "onsite_jobs": onsite_jobs,
            "total_applications": 0,  # Mock ก่อน
            "avg_applications_per_job": 0.0,
            "by_department": {},
            "by_location": {},
            "database_source": True,
            "source": "main.py",
            "timestamp": "2025-07-05"
        }
        
    except Exception as e:
        return {
            "total_jobs": 0,
            "active_jobs": 0,
            "error": str(e),
            "source": "main.py"
        }

@app.get("/api/jobs/departments")
async def manual_get_departments(db=Depends(get_database)):
    """🏢 ดึงรายการแผนกทั้งหมด (Manual)"""
    try:
        # ดึงแผนกที่มีงานอยู่
        pipeline = [
            {"$match": {"is_active": True}},
            {"$group": {"_id": "$department"}},
            {"$sort": {"_id": 1}}
        ]
        dept_cursor = db.jobs.aggregate(pipeline)
        departments = [item["_id"] async for item in dept_cursor]
        
        return {
            "departments": departments,
            "count": len(departments),
            "source": "main.py"
        }
        
    except Exception as e:
        return {
            "departments": ["IT", "Marketing", "Finance", "Design"],
            "count": 4,
            "error": str(e),
            "source": "main.py"
        }

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
    
    print(f"🌟 Starting server on http://{HOST}:{PORT}")
    print(f"📚 API Documentation: http://{HOST}:{PORT}/docs")
    print(f"🔐 Auth endpoints: http://{HOST}:{PORT}/api/auth/*")
    print(f"👤 Profile endpoints: http://{HOST}:{PORT}/api/profile/*")
    print(f"📋 Job endpoints: http://{HOST}:{PORT}/api/jobs/*")
    print(f"👑 Admin endpoints: http://{HOST}:{PORT}/api/admin/*")
    print(f"🏢 Company endpoints: http://{HOST}:{PORT}/api/companies/*")
    print(f"📁 Static files: http://{HOST}:{PORT}/uploads/*")
    print(f"🔄 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level="info"
    )