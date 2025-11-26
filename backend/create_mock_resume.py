import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def create_mock_resume():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["ai_resume_screening"]
    
    # 🔥 ใส่ user_id ของคุณตรงนี้ (ลบ ObjectId() ออก)
    user_id = "672abc123def456789012345"  # <-- เปลี่ยนตรงนี้
    
    mock_resume = {
        "user_id": user_id,
        "file_path": "/mock/resume.pdf",
        "file_type": "PDF",
        "extracted_data": {
            "name": "นักศึกษาทดสอบ",
            "email": "student@test.com",
            "university": "มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี",
            "major": "เทคโนโลยีสารสนเทศ",
            "gpa": 3.25,
            "year": "ปี 3",
            "skills": ["Python", "FastAPI", "React", "MongoDB", "Git"],
            "experience": "มีประสบการณ์ทำโปรเจค Web Development",
            "projects": ["AI Resume System", "E-commerce Website"]
        },
        "created_at": datetime.utcnow(),
        "is_public": False
    }
    
    result = await db.resumes.insert_one(mock_resume)
    print(f"✅ Created mock resume: {result.inserted_id}")
    
    # เช็คว่าสร้างสำเร็จ
    created = await db.resumes.find_one({"_id": result.inserted_id})
    print(f"📄 Resume data: {created['extracted_data']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_mock_resume())