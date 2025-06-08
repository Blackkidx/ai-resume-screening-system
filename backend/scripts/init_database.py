# backend/scripts/init_database.py - Updated with Company Collections
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
    📋 สร้าง Collections และ Indexes ตาม Data Dictionary PDF + Company Management
    """
    try:
        db = get_database()
        
        print("🗄️ สร้างโครงสร้างฐานข้อมูลตาม PDF Data Dictionary...")
        print("✅ รวมระบบจัดการบริษัท (Company Management)")
        print("(ไม่มี Mock Data - พร้อมทดสอบจริง)")
        
        # =================================================================
        # 1. USERS COLLECTION (ผู้ใช้งานระบบ)
        # =================================================================
        print("1️⃣ สร้าง users collection...")
        
        # สร้าง index สำหรับ users
        await db.users.create_index("username", unique=True)
        await db.users.create_index("email", unique=True) 
        await db.users.create_index("user_type")
        await db.users.create_index("company_id")  # เพิ่ม index สำหรับ company_id
        print("   ✅ users indexes created")
        
        # =================================================================
        # 2. COMPANIES COLLECTION (บริษัท) - ใหม่
        # =================================================================
        print("2️⃣ สร้าง companies collection...")
        
        # สร้าง index สำหรับ companies
        await db.companies.create_index("name", unique=True)
        await db.companies.create_index("industry")
        await db.companies.create_index("is_active")
        await db.companies.create_index("created_at")
        print("   ✅ companies indexes created")
        
        # =================================================================
        # 3. COMPANY_HR_ASSIGNMENTS COLLECTION (การกำหนด HR ให้บริษัท) - ใหม่
        # =================================================================
        print("3️⃣ สร้าง company_hr_assignments collection...")
        
        # สร้าง index สำหรับ company_hr_assignments
        await db.company_hr_assignments.create_index([("company_id", 1), ("user_id", 1)], unique=True)
        await db.company_hr_assignments.create_index("company_id")
        await db.company_hr_assignments.create_index("user_id")
        await db.company_hr_assignments.create_index("assigned_at")
        print("   ✅ company_hr_assignments indexes created")
        
        # =================================================================
        # 4. RESUMES COLLECTION (เรซูเม่)
        # =================================================================
        print("4️⃣ สร้าง resumes collection...")
        
        # สร้าง index สำหรับ resumes
        await db.resumes.create_index("user_id")
        await db.resumes.create_index("file_type")
        await db.resumes.create_index("uploaded_at")
        print("   ✅ resumes indexes created")
        
        # =================================================================
        # 5. JOB_POSITIONS COLLECTION (ตำแหน่งงานฝึกงาน)
        # =================================================================
        print("5️⃣ สร้าง job_positions collection...")
        
        # สร้าง index สำหรับ job_positions
        await db.job_positions.create_index("user_id")  # HR ที่สร้าง
        await db.job_positions.create_index("company_id")  # เพิ่ม company_id
        await db.job_positions.create_index("title")
        await db.job_positions.create_index("is_active")
        await db.job_positions.create_index("department")
        await db.job_positions.create_index("created_at")
        print("   ✅ job_positions indexes created")
        
        # =================================================================
        # 6. SKILLS COLLECTION (ทักษะ)
        # =================================================================
        print("6️⃣ สร้าง skills collection...")
        
        # สร้าง index สำหรับ skills
        await db.skills.create_index("name", unique=True)
        await db.skills.create_index("type")  # Hard Skill, Soft Skill
        await db.skills.create_index("category")
        print("   ✅ skills indexes created")
        
        # =================================================================
        # 7. RESUME_SKILLS COLLECTION (ทักษะในเรซูเม่)
        # =================================================================
        print("7️⃣ สร้าง resume_skills collection...")
        
        # สร้าง index สำหรับ resume_skills
        await db.resume_skills.create_index([("resume_id", 1), ("skill_id", 1)], unique=True)
        await db.resume_skills.create_index("resume_id")
        await db.resume_skills.create_index("skill_id")
        await db.resume_skills.create_index("proficiency_level")
        print("   ✅ resume_skills indexes created")
        
        # =================================================================
        # 8. JOB_SKILLS COLLECTION (ทักษะที่ต้องการสำหรับตำแหน่งงาน)
        # =================================================================
        print("8️⃣ สร้าง job_skills collection...")
        
        # สร้าง index สำหรับ job_skills
        await db.job_skills.create_index([("position_id", 1), ("skill_id", 1)], unique=True)
        await db.job_skills.create_index("position_id")
        await db.job_skills.create_index("skill_id")
        await db.job_skills.create_index("priority")
        print("   ✅ job_skills indexes created")
        
        # =================================================================
        # 9. MATCHING_RESULTS COLLECTION (ผลการจับคู่)
        # =================================================================
        print("9️⃣ สร้าง matching_results collection...")
        
        # สร้าง index สำหรับ matching_results
        await db.matching_results.create_index([("resume_id", 1), ("position_id", 1)], unique=True)
        await db.matching_results.create_index("resume_id")
        await db.matching_results.create_index("position_id")
        await db.matching_results.create_index("matching_score")
        await db.matching_results.create_index("status")
        await db.matching_results.create_index("created_at")
        print("   ✅ matching_results indexes created")
        
        # =================================================================
        # 10. USER_ROLES COLLECTION (บทบาทผู้ใช้งาน)
        # =================================================================
        print("🔟 สร้าง user_roles collection...")
        
        # สร้าง index สำหรับ user_roles
        await db.user_roles.create_index("role_name", unique=True)
        print("   ✅ user_roles indexes created")
        
        # =================================================================
        # 11. USER_ROLE_ASSIGNMENTS COLLECTION (การกำหนดบทบาท)
        # =================================================================
        print("1️⃣1️⃣ สร้าง user_role_assignments collection...")
        
        # สร้าง index สำหรับ user_role_assignments
        await db.user_role_assignments.create_index([("user_id", 1), ("role_id", 1)], unique=True)
        await db.user_role_assignments.create_index("user_id")
        await db.user_role_assignments.create_index("role_id")
        await db.user_role_assignments.create_index("role_name")
        print("   ✅ user_role_assignments indexes created")
        
        print("🎉 สร้างโครงสร้างฐานข้อมูลสำเร็จแล้ว! (รวม Company Management)")
        
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
        expected_collections = [
            'users', 'companies', 'company_hr_assignments', 'resumes', 
            'job_positions', 'skills', 'resume_skills', 'job_skills', 
            'matching_results', 'user_roles', 'user_role_assignments'
        ]
        
        for collection_name in expected_collections:
            if collection_name in collections:
                collection = db[collection_name]
                count = await collection.count_documents({})
                print(f"   📊 {collection_name}: {count} documents (ว่างเปล่า - พร้อมทดสอบ)")
            else:
                print(f"   ⚠️ {collection_name}: ไม่พบ collection")
        
        # ตรวจสอบ indexes ที่สำคัญ
        print("📇 ตรวจสอบ indexes สำคัญ:")
        important_collections = ['users', 'companies', 'company_hr_assignments', 'resumes', 'job_positions']
        for col_name in important_collections:
            if col_name in collections:
                indexes = await db[col_name].list_indexes().to_list(length=None)
                index_names = [idx['name'] for idx in indexes if idx['name'] != '_id_']
                print(f"   🔍 {col_name}: {index_names}")
        
        print("✅ ตรวจสอบเสร็จสิ้น!")
        
    except Exception as e:
        print(f"❌ Error verifying database: {e}")

async def create_default_admin():
    """
    👑 สร้าง Admin account เริ่มต้น (ถ้ายังไม่มี)
    """
    try:
        db = get_database()
        
        # ตรวจสอบว่ามี Admin อยู่แล้วหรือไม่
        existing_admin = await db.users.find_one({"user_type": "Admin"})
        
        if not existing_admin:
            print("👑 สร้าง Admin account เริ่มต้น...")
            
            # Import hash_password function
            from core.auth import hash_password
            
            admin_data = {
                "username": "admin",
                "email": "admin@internscreen.com",
                "password_hash": hash_password("admin123"),
                "full_name": "System Administrator",
                "phone": None,
                "user_type": "Admin",
                "company_id": None,
                "is_active": True,
                "is_verified": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            }
            
            result = await db.users.insert_one(admin_data)
            admin_id = result.inserted_id
            
            # สร้าง Admin role (ถ้ายังไม่มี)
            admin_role = await db.user_roles.find_one({"role_name": "Admin"})
            if admin_role:
                # กำหนด role ให้ admin
                await db.user_role_assignments.insert_one({
                    "user_id": admin_id,
                    "role_id": admin_role["_id"],
                    "role_name": "Admin",
                    "assigned_at": datetime.utcnow(),
                    "assigned_by": "system"
                })
            
            print(f"✅ สร้าง Admin account สำเร็จ!")
            print(f"   👤 Username: admin")
            print(f"   📧 Email: admin@internscreen.com") 
            print(f"   🔑 Password: admin123")
            print(f"   ⚠️ กรุณาเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก!")
            
        else:
            print("👑 พบ Admin account อยู่แล้ว - ข้าม")
            
    except Exception as e:
        print(f"❌ Error creating default admin: {e}")

async def create_default_roles():
    """
    🎭 สร้าง default user roles
    """
    try:
        db = get_database()
        
        # ตรวจสอบว่ามี roles อยู่แล้วหรือไม่
        existing_roles = await db.user_roles.count_documents({})
        
        if existing_roles == 0:
            print("🎭 สร้าง default user roles...")
            
            default_roles = [
                {
                    "role_name": "Student",
                    "description": "นักศึกษาที่มาฝึกงาน",
                    "permissions": {
                        "can_upload_resume": True,
                        "can_view_jobs": True,
                        "can_apply_jobs": True,
                        "can_view_profile": True
                    },
                    "created_at": datetime.utcnow()
                },
                {
                    "role_name": "HR",
                    "description": "เจ้าหน้าที่ HR ของบริษัท",
                    "permissions": {
                        "can_create_jobs": True,
                        "can_view_resumes": True,
                        "can_screen_candidates": True,
                        "can_manage_interviews": True,
                        "can_manage_company_jobs": True
                    },
                    "created_at": datetime.utcnow()
                },
                {
                    "role_name": "Admin",
                    "description": "ผู้ดูแลระบบ",
                    "permissions": {
                        "can_manage_users": True,
                        "can_manage_companies": True,
                        "can_view_analytics": True,
                        "can_manage_system": True,
                        "can_assign_hr_to_companies": True
                    },
                    "created_at": datetime.utcnow()
                }
            ]
            
            await db.user_roles.insert_many(default_roles)
            print("✅ สร้าง default user roles สำเร็จ")
            
        else:
            print("🎭 พบ user roles อยู่แล้ว - ข้าม")
            
    except Exception as e:
        print(f"❌ Error creating default roles: {e}")

async def main():
    """
    🚀 ฟังก์ชันหลักสำหรับการตั้งค่าฐานข้อมูล
    """
    try:
        print("🚀 เริ่มการตั้งค่าฐานข้อมูล AI Resume Screening System")
        print("🎯 โหมด: เฉพาะโครงสร้าง + Admin Account + Company Management")
        print("=" * 70)
        
        # เชื่อมต่อฐานข้อมูล
        await connect_to_mongo()
        
        # สร้าง default roles ก่อน
        await create_default_roles()
        
        # สร้างโครงสร้างฐานข้อมูล
        await create_collections_and_indexes()
        
        # สร้าง default admin account
        await create_default_admin()
        
        # ตรวจสอบผลลัพธ์
        await verify_database_structure()
        
        print("=" * 70)
        print("🎉 ตั้งค่าฐานข้อมูลเสร็จสมบูรณ์!")
        print("📝 พร้อมทดสอบการใช้งาน:")
        print("")
        print("🌐 Frontend: http://localhost:3000")
        print("📚 API Docs: http://localhost:8000/docs")
        print("")
        print("👑 Admin Login:")
        print("   Username: admin")
        print("   Password: admin123")
        print("")
        print("✨ ฟีเจอร์ที่พร้อมใช้งาน:")
        print("   - ระบบ Authentication (Login/Register)")
        print("   - Admin Dashboard (จัดการผู้ใช้)")
        print("   - Company Management (จัดการบริษัท)")
        print("   - HR Assignment (กำหนด HR ให้บริษัท)")
        print("   - HR Dashboard (หน้า Dashboard สำหรับ HR)")
        
    except Exception as e:
        print(f"💥 Error in main setup: {e}")

if __name__ == "__main__":
    asyncio.run(main())