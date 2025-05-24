from fastapi import FastAPI
from core.database import test_connection

app = FastAPI(
    title="AI Resume Screening System",
    description="ระบบคัดกรองเรซูเม่นักศึกษาฝึกงานด้วย AI",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "AI Resume Screening System API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "backend"}

@app.get("/test")
def test_endpoint():
    return {"message": "Test successful!", "timestamp": "2025-05-19"}

# เพิ่มใน main.py
@app.get("/db-test")
def test_database():
    return {"message": "MongoDB test - will implement later"}