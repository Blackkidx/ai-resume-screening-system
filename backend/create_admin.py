# backend/create_admin.py
"""
Script สำหรับสร้าง Admin user
รันด้วย: python create_admin.py
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
DATABASE_NAME = os.getenv("DATABASE_NAME", "ai_resume_db")

async def create_admin_user():
    """สร้าง Admin user"""
    
    # เชื่อมต่อ MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🔗 Connected to MongoDB")
    
    # ข้อมูล Admin
    admin_data = {
        "username": "admin",
        "email": "admin@internscreen.com",
        "password": "admin123456",  # เปลี่ยนได้ตามต้องการ
        "full_name": "System Administrator",
        "phone": "0800000000"
    }
    
    # ตรวจสอบว่ามี admin อยู่แล้วหรือไม่
    existing_admin = await db.users.find_one({"username": admin_data["username"]})
    
    if existing_admin:
        print(f"⚠️  Admin user '{admin_data['username']}' already exists!")
        
        # ถามว่าต้องการลบและสร้างใหม่หรือไม่
        response = input("Do you want to delete and recreate? (yes/no): ").lower()
        
        if response == "yes":
            await db.users.delete_one({"username": admin_data["username"]})
            print("🗑️  Deleted existing admin user")
        else:
            print("❌ Cancelled")
            client.close()
            return
    
    # Hash password
    password_hash = hash_password(admin_data["password"])
    
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
    
    print("\n" + "="*50)
    print("✅ Admin user created successfully!")
    print("="*50)
    print(f"👤 Username: {admin_data['username']}")
    print(f"📧 Email: {admin_data['email']}")
    print(f"🔑 Password: {admin_data['password']}")
    print(f"🆔 User ID: {result.inserted_id}")
    print("="*50)
    print("\n⚠️  Please change the password after first login!")
    
    # ปิดการเชื่อมต่อ
    client.close()

if __name__ == "__main__":
    print("🚀 Creating Admin User...")
    asyncio.run(create_admin_user())