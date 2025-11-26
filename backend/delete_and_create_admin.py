# backend/delete_and_create_admin.py
"""
ลบ Admin เก่าและสร้างใหม่
รันด้วย: python delete_and_create_admin.py
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from core.auth import hash_password
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "ai_resume_screening")  # แก้ชื่อ database ให้ถูก

async def delete_and_create_admin():
    """ลบ Admin เก่าและสร้างใหม่"""
    
    # เชื่อมต่อ MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🔗 Connected to MongoDB")
    print(f"📂 Database: {DATABASE_NAME}")
    
    # ===== ลบ Admin เก่า =====
    print("\n🗑️  Deleting old admin users...")
    
    # ลบทั้ง username และ email
    delete_result_username = await db.users.delete_many({"username": "admin"})
    delete_result_email = await db.users.delete_many({"email": "admin@internscreen.com"})
    delete_result_type = await db.users.delete_many({"user_type": "Admin"})
    
    total_deleted = delete_result_username.deleted_count + delete_result_email.deleted_count + delete_result_type.deleted_count
    
    if total_deleted > 0:
        print(f"   ✅ Deleted {total_deleted} admin user(s)")
    else:
        print("   ℹ️  No admin users found to delete")
    
    # ===== สร้าง Admin ใหม่ =====
    print("\n👤 Creating new admin user...")
    
    admin_data = {
        "username": "admin",
        "email": "admin@internscreen.com",
        "password": "admin123456",
        "full_name": "System Administrator",
        "phone": "0800000000"
    }
    
    # Hash password
    try:
        password_hash = hash_password(admin_data["password"])
    except Exception as e:
        print(f"❌ Error hashing password: {e}")
        print("\n⚠️  Trying simple hash method...")
        # ถ้า hash ไม่ได้ ใช้วิธีง่ายๆ
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_hash = pwd_context.hash(admin_data["password"])
    
    # สร้าง admin document
    admin_doc = {
        "username": admin_data["username"],
        "email": admin_data["email"],
        "password_hash": password_hash,
        "full_name": admin_data["full_name"],
        "phone": admin_data["phone"],
        "user_type": "Admin",
        "company_id": None,
        "is_active": True,
        "is_verified": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None
    }
    
    # บันทึกลง database
    result = await db.users.insert_one(admin_doc)
    
    print("\n" + "="*60)
    print("✅ Admin user created successfully!")
    print("="*60)
    print(f"👤 Username: {admin_data['username']}")
    print(f"📧 Email: {admin_data['email']}")
    print(f"🔑 Password: {admin_data['password']}")
    print(f"🆔 User ID: {result.inserted_id}")
    print("="*60)
    print("\n⚠️  Please change the password after first login!")
    print("🔗 Login at: http://localhost:3000/login\n")
    
    # ปิดการเชื่อมต่อ
    client.close()

if __name__ == "__main__":
    print("🚀 Deleting old admin and creating new one...")
    print("="*60)
    asyncio.run(delete_and_create_admin())