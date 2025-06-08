# backend/scripts/create_admin.py
import asyncio
import os
import sys
from datetime import datetime

# แก้ไข import path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.insert(0, backend_dir)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

from core.database import connect_to_mongo, get_database
from core.auth import hash_password

async def create_admin_user():
    """
    🔐 สร้าง Admin User เริ่มต้น
    """
    try:
        print("🔐 Creating initial Admin user...")
        
        # เชื่อมต่อฐานข้อมูล
        await connect_to_mongo()
        db = get_database()
        
        # ตรวจสอบว่ามี Admin อยู่แล้วหรือไม่
        existing_admin = await db.users.find_one({"user_type": "Admin"})
        if existing_admin:
            print("⚠️ Admin user already exists!")
            print(f"   Username: {existing_admin['username']}")
            print(f"   Email: {existing_admin['email']}")
            return
        
        # ข้อมูล Admin เริ่มต้น
        admin_data = {
            "username": "admin",
            "email": "admin@internscreen.com", 
            "password_hash": hash_password("admin123"),  # รหัสผ่านเริ่มต้น
            "full_name": "System Administrator",
            "phone": None,
            "user_type": "Admin",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_login": None
        }
        
        # สร้าง Admin user
        result = await db.users.insert_one(admin_data)
        admin_id = result.inserted_id
        
        print("✅ Admin user created successfully!")
        print(f"   ID: {admin_id}")
        print(f"   Username: admin")
        print(f"   Email: admin@internscreen.com")
        print(f"   Password: admin123")
        print("")
        print("🚨 IMPORTANT: Please change the default password after first login!")
        
        # สร้าง role assignment
        try:
            # หา Admin role
            admin_role = await db.user_roles.find_one({"role_name": "Admin"})
            if admin_role:
                # สร้าง role assignment
                await db.user_role_assignments.insert_one({
                    "user_id": admin_id,
                    "role_id": admin_role["_id"],
                    "role_name": "Admin",
                    "assigned_at": datetime.utcnow(),
                    "assigned_by": "system"
                })
                print("✅ Admin role assigned successfully!")
            else:
                print("⚠️ Admin role not found in database")
                
        except Exception as e:
            print(f"⚠️ Failed to assign admin role: {e}")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")

async def create_test_users():
    """
    👥 สร้าง Test Users สำหรับทดสอบระบบ
    """
    try:
        print("\n👥 Creating test users...")
        
        db = get_database()
        
        # Test users data
        test_users = [
            {
                "username": "hr_test",
                "email": "hr@test.com",
                "password_hash": hash_password("hr123"),
                "full_name": "HR Manager",
                "phone": "080-123-4567",
                "user_type": "HR",
                "is_active": True,
                "is_verified": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            },
            {
                "username": "student_test",
                "email": "student@test.com", 
                "password_hash": hash_password("student123"),
                "full_name": "Test Student",
                "phone": "080-987-6543",
                "user_type": "Student",
                "is_active": True,
                "is_verified": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            },
            {
                "username": "student_inactive",
                "email": "inactive@test.com",
                "password_hash": hash_password("inactive123"),
                "full_name": "Inactive Student",
                "phone": None,
                "user_type": "Student",
                "is_active": False,  # ปิดใช้งาน
                "is_verified": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            }
        ]
        
        # สร้าง test users
        for user_data in test_users:
            # ตรวจสอบว่ามีอยู่แล้วหรือไม่
            existing = await db.users.find_one({"username": user_data["username"]})
            if existing:
                print(f"   ⚠️ User {user_data['username']} already exists")
                continue
            
            # สร้าง user
            result = await db.users.insert_one(user_data)
            user_id = result.inserted_id
            
            # สร้าง role assignment
            try:
                role = await db.user_roles.find_one({"role_name": user_data["user_type"]})
                if role:
                    await db.user_role_assignments.insert_one({
                        "user_id": user_id,
                        "role_id": role["_id"],
                        "role_name": user_data["user_type"],
                        "assigned_at": datetime.utcnow(),
                        "assigned_by": "system"
                    })
            except Exception as e:
                print(f"   ⚠️ Failed to assign role for {user_data['username']}: {e}")
            
            print(f"   ✅ Created {user_data['username']} ({user_data['user_type']})")
        
        print("✅ Test users created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating test users: {e}")

async def main():
    """
    🚀 Main function
    """
    try:
        print("🚀 Setting up Admin user and test data...")
        print("=" * 50)
        
        # สร้าง Admin user
        await create_admin_user()
        
        # สร้าง Test users
        await create_test_users()
        
        print("=" * 50)
        print("🎉 Setup completed!")
        print("")
        print("📝 Login credentials:")
        print("   Admin    - username: admin, password: admin123")
        print("   HR       - username: hr_test, password: hr123") 
        print("   Student  - username: student_test, password: student123")
        print("")
        print("🌐 You can now test the Admin Dashboard at:")
        print("   http://localhost:3000/admin/dashboard")
        
    except Exception as e:
        print(f"💥 Error in main setup: {e}")

if __name__ == "__main__":
    asyncio.run(main())