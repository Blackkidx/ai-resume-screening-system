# =============================================================================
# 🚀 FASTAPI MAIN APPLICATION - AI Resume Screening System
# =============================================================================
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # 🆕 เพิ่มบรรทัดนี้
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

# Import database functions
from core.database import connect_to_mongo, close_mongo_connection, test_connection

# Import route modules
from routes.auth import router as auth_router
from routes.admin import router as admin_router
from routes.company import router as company_router
from routes.student import router as student_router
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
# 🆕 เพิ่มส่วนนี้ - Mount uploads folder เพื่อ serve static files
uploads_path = "uploads"
if not os.path.exists(uploads_path):
    os.makedirs(uploads_path)  # สร้าง folder ถ้ายังไม่มี

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# =============================================================================
# 🌐 CORS MIDDLEWARE - อนุญาตให้ Frontend เรียก API ได้
# =============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
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
    
    # 🆕 ตรวจสอบ uploads folder
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
    return {
        "message": "🤖 AI Resume Screening System",
        "description": "ระบบคัดกรองเรซูเม่สำหรับนักศึกษาฝึกงานด้วยเทคโนโลยี AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "api_prefix": "/api",
        "static_files": "/uploads",  # 🆕 เพิ่มข้อมูล static files
        "endpoints": {
            "auth": {
                "register": "/api/auth/register",
                "login": "/api/auth/login",
                "me": "/api/auth/me"
            },
            "student": {
                "profile": "/api/student/profile",
                "dashboard": "/api/student/dashboard",
                "upload_image": "/api/student/profile/upload-image",
                "change_password": "/api/student/change-password"
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
        
        # 🆕 ตรวจสอบ uploads directory
        uploads_status = {
            "exists": os.path.exists("uploads"),
            "profiles": os.path.exists("uploads/profiles"),
            "resumes": os.path.exists("uploads/resumes"),
            "companies": os.path.exists("uploads/companies")
        }
        
        return {
            "status": "healthy",
            "timestamp": "2025-06-08T15:30:00Z",
            "version": "1.0.0",
            "services": {
                "api": "healthy",
                "database": db_status["status"],
                "static_files": "healthy" if uploads_status["exists"] else "warning"
            },
            "database_info": db_status,
            "uploads_info": uploads_status  # 🆕 ข้อมูล uploads
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"System health check failed: {str(e)}"
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
    
    print(f"🌟 Starting server on http://{HOST}:{PORT}")
    print(f"📚 API Documentation: http://{HOST}:{PORT}/docs")
    print(f"🔐 Auth endpoints: http://{HOST}:{PORT}/api/auth/*")
    print(f"👑 Admin endpoints: http://{HOST}:{PORT}/api/admin/*")
    print(f"🏢 Company endpoints: http://{HOST}:{PORT}/api/companies/*")
    print(f"📁 Static files: http://{HOST}:{PORT}/uploads/*")  # 🆕 แสดงข้อมูล static files
    print(f"🔄 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level="info"
    )