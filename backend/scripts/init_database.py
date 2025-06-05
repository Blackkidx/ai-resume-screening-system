# =============================================================================
# 🗄️ DATABASE INITIALIZATION - เฉพาะโครงสร้าง ไม่มี Mock Data
# ระบบคัดกรองเรซูเม่สำหรับนักศึกษาฝึกงาน
# =============================================================================
import asyncio
import os
import sys
from datetime import datetime

# แก้ไข import path - เพิ่ม backend folder ลงใน Python path
current_dir = os.path.dirname(os.path.abspath(__file__))  # scripts folder
backend_dir = os.path.dirname(current_dir)  # backend folder
sys.path.insert(0, backend_dir)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

# ตอนนี้ import ได้แล้ว
from core.database import connect_to_mongo, get_database

async def create_collections_and_indexes():
    """
    📋 สร้าง Collections และ Indexes ตาม Data Dictionary PDF
    """
    try:
        db = get_database()
        
        print("🗄️ สร้างโครงสร้างฐานข้อมูลตาม PDF Data Dictionary...")
        print("(ไม่มี Mock Data - พร้อมทดสอบจริง)")
        
        # =================================================================
        # 1. USERS COLLECTION (ผู้ใช้งานระบบ)
        # =================================================================
        print("1️⃣ สร้าง users collection...")
        
        # สร้าง index สำหรับ users
        await db.users.create_index("username", unique=True)
        await db.users.create_index("email", unique=True) 
        await db.users.create_index("user_type")
        print("   ✅ users indexes created")
        
        # =================================================================
        # 2. RESUMES COLLECTION (เรซูเม่)
        # =================================================================
        print("2️⃣ สร้าง resumes collection...")
        
        # สร้าง index สำหรับ resumes
        await db.resumes.create_index("user_id")
        await db.resumes.create_index("file_type")
        print("   ✅ resumes indexes created")
        
        # =================================================================
        # 3. JOB_POSITIONS COLLECTION (ตำแหน่งงานฝึกงาน)
        # =================================================================
        print("3️⃣ สร้าง job_positions collection...")
        
        # สร้าง index สำหรับ job_positions
        await db.job_positions.create_index("user_id")  # HR ที่สร้าง
        await db.job_positions.create_index("title")
        await db.job_positions.create_index("is_active")
        await db.job_positions.create_index("department")
        print("   ✅ job_positions indexes created")
        
        # =================================================================
        # 4. SKILLS COLLECTION (ทักษะ)
        # =================================================================
        print("4️⃣ สร้าง skills collection...")
        
        # สร้าง index สำหรับ skills
        await db.skills.create_index("name", unique=True)
        await db.skills.create_index("type")  # Hard Skill, Soft Skill
        await db.skills.create_index("category")
        print("   ✅ skills indexes created")
        
        # =================================================================
        # 5. RESUME_SKILLS COLLECTION (ทักษะในเรซูเม่)
        # =================================================================
        print("5️⃣ สร้าง resume_skills collection...")
        
        # สร้าง index สำหรับ resume_skills
        await db.resume_skills.create_index([("resume_id", 1), ("skill_id", 1)], unique=True)
        await db.resume_skills.create_index("proficiency_level")
        print("   ✅ resume_skills indexes created")
        
        # =================================================================
        # 6. JOB_SKILLS COLLECTION (ทักษะที่ต้องการสำหรับตำแหน่งงาน)
        # =================================================================
        print("6️⃣ สร้าง job_skills collection...")
        
        # สร้าง index สำหรับ job_skills
        await db.job_skills.create_index([("position_id", 1), ("skill_id", 1)], unique=True)
        await db.job_skills.create_index("priority")
        print("   ✅ job_skills indexes created")
        
        # =================================================================
        # 7. MATCHING_RESULTS COLLECTION (ผลการจับคู่)
        # =================================================================
        print("7️⃣ สร้าง matching_results collection...")
        
        # สร้าง index สำหรับ matching_results
        await db.matching_results.create_index([("resume_id", 1), ("position_id", 1)], unique=True)
        await db.matching_results.create_index("matching_score")
        await db.matching_results.create_index("status")
        print("   ✅ matching_results indexes created")
        
        # =================================================================
        # 8. USER_ROLES COLLECTION (บทบาทผู้ใช้งาน)
        # =================================================================
        print("8️⃣ สร้าง user_roles collection...")
        
        # สร้าง index สำหรับ user_roles
        await db.user_roles.create_index("role_name", unique=True)
        print("   ✅ user_roles indexes created")
        
        print("🎉 สร้างโครงสร้างฐานข้อมูลสำเร็จแล้ว!")
        
    except Exception as e:
        print(f"❌ Error creating database structure: {e}")

async def verify_database_structure():
    """
    🔍 ตรวจสอบโครงสร้างฐานข้อมูลที่สร้างแล้ว
    """
    try:
        db = get_database()
        
        print("🔍 ตรวจสอบโครงสร้างฐานข้อมูล...")
        
        # นับจำนวน collections
        collections = await db.list_collection_names()
        print(f"📋 Collections ที่สร้าง ({len(collections)}): {collections}")
        
        # ตรวจสอบว่าแต่ละ collection ว่างเปล่า (ไม่มี Mock Data)
        for collection_name in collections:
            if collection_name.startswith('system'):  # ข้าม system collections
                continue
                
            collection = db[collection_name]
            count = await collection.count_documents({})
            print(f"   📊 {collection_name}: {count} documents (ว่างเปล่า - พร้อมทดสอบ)")
        
        # ตรวจสอบ indexes
        print("📇 ตรวจสอบ indexes:")
        important_collections = ['users', 'resumes', 'job_positions', 'skills']
        for col_name in important_collections:
            if col_name in collections:
                indexes = await db[col_name].list_indexes().to_list(length=None)
                index_names = [idx['name'] for idx in indexes if idx['name'] != '_id_']
                print(f"   🔍 {col_name}: {index_names}")
        
        print("✅ ตรวจสอบเสร็จสิ้น!")
        
    except Exception as e:
        print(f"❌ Error verifying database: {e}")

async def main():
    """
    🚀 ฟังก์ชันหลักสำหรับการตั้งค่าฐานข้อมูล (ไม่มี Mock Data)
    """
    try:
        print("🚀 เริ่มการตั้งค่าฐานข้อมูล AI Resume Screening System")
        print("🎯 โหมด: เฉพาะโครงสร้าง (ไม่มี Mock Data)")
        print("=" * 60)
        
        # เชื่อมต่อฐานข้อมูล
        await connect_to_mongo()
        
        # สร้างโครงสร้างฐานข้อมูล
        await create_collections_and_indexes()
        
        # ตรวจสอบผลลัพธ์
        await verify_database_structure()
        
        print("=" * 60)
        print("🎉 ตั้งค่าฐานข้อมูลเสร็จสมบูรณ์!")
        print("📝 พร้อมทดสอบการสมัครสมาชิก")
        print("🌐 Frontend: http://localhost:3000")
        print("📚 API Docs: http://localhost:8000/docs")
        
    except Exception as e:
        print(f"💥 Error in main setup: {e}")

if __name__ == "__main__":
    asyncio.run(main())