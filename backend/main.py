# =============================================================================
# MAIN APPLICATION 🚀
# AI Resume Screening System - Backend
# =============================================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import connect_to_mongo, close_mongo_connection, test_connection
from routes.auth import router as auth_router
import uvicorn

# =============================================================================
# CREATE FASTAPI APPLICATION
# =============================================================================
app = FastAPI(
    title="AI Resume Screening System",
    description="ระบบคัดกรองเรซูเม่สำหรับนักศึกษาฝึกงานด้วย AI",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc"  # ReDoc
)

# =============================================================================
# CORS MIDDLEWARE (สำหรับ Frontend)
# =============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],  # Accept, Content-Type, Authorization, etc.
)

# =============================================================================
# INCLUDE ROUTERS
# =============================================================================
app.include_router(auth_router)

# =============================================================================
# STARTUP & SHUTDOWN EVENTS
# =============================================================================
@app.on_event("startup")
async def startup_event():
    """เริ่มต้นระบบ"""
    await connect_to_mongo()
    print("🚀 Application started successfully!")
    print("📊 API Documentation: http://localhost:8000/docs")

@app.on_event("shutdown")
async def shutdown_event():
    """ปิดระบบ"""
    await close_mongo_connection()
    print("👋 Application shutdown complete!")

# =============================================================================
# BASIC ROUTES
# =============================================================================

@app.get("/")
async def read_root():
    """หน้าแรก - ข้อมูลเบื้องต้น"""
    return {
        "message": "AI Resume Screening System API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "register": "POST /auth/register",
            "login": "POST /auth/login",
            "profile": "GET /auth/me",
            "health": "GET /health"
        }
    }

@app.get("/health")
async def health_check():
    """ตรวจสุขภาพระบบ"""
    db_status = await test_connection()
    return {
        "status": "healthy",
        "service": "backend",
        "database": db_status,
        "message": "All systems operational"
    }

@app.get("/test")
async def test_endpoint():
    """ทดสอบ API"""
    return {
        "message": "Test successful!",
        "timestamp": "2025-05-19",
        "api_version": "1.0.0"
    }

# =============================================================================
# RUN SERVER
# =============================================================================
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )