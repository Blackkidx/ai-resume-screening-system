# =============================================================================
# FIXED DATABASE CONNECTION 🗄️ (แก้ไข Motor error แล้ว - ใช้ connection string จัดการ SSL)
# Phase 1: เชื่อมต่อ MongoDB Atlas เบื้องต้น
# =============================================================================
import os
import logging
import motor.motor_asyncio
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# โหลดไฟล์ .env เพื่ออ่าน environment variables
load_dotenv()

# =============================================================================
# DATABASE VARIABLES 📊
# =============================================================================
# เก็บ database connection ไว้ใช้ทั่วทั้งแอพ
database_client = None
database = None

# =============================================================================
# CONNECTION FUNCTIONS 🔌
# =============================================================================
async def connect_to_mongo():
    """
    เชื่อมต่อไป MongoDB Atlas
    - อ่าน connection string จากไฟล์ .env
    - ทดสอบการเชื่อมต่อ
    - เก็บ connection ไว้ใช้
    """
    global database_client, database
    
    try:
        # อ่าน connection string จาก .env
        MONGODB_URL = os.getenv("MONGODB_URL")
        DATABASE_NAME = os.getenv("DATABASE_NAME", "ai_resume_screening")
        
        if not MONGODB_URL:
            raise Exception("MONGODB_URL not found in .env file")
        
        # Security: warn and strip tlsAllowInvalidCertificates if present
        if "tlsAllowInvalidCertificates=true" in MONGODB_URL:
            logger.warning("[SECURITY] tlsAllowInvalidCertificates=true detected — removing for secure TLS validation")
            MONGODB_URL = MONGODB_URL.replace("tlsAllowInvalidCertificates=true", "tlsAllowInvalidCertificates=false")
        
        logger.info("Connecting to MongoDB Atlas...")
        logger.info("Database name: %s", DATABASE_NAME)
        
        # สร้างการเชื่อมต่อแบบง่าย - ให้ connection string จัดการ SSL
        database_client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
        
        database = database_client[DATABASE_NAME]
        
        # ทดสอบการเชื่อมต่อด้วยคำสั่ง ping
        await database_client.admin.command('ping')
        
        logger.info("Connected to MongoDB Atlas successfully!")
        return True
        
    except Exception as e:
        logger.error("Failed to connect to MongoDB: %s", e)
        logger.info("กรุณาตรวจสอบ: 1) .env MONGODB_URL 2) Internet 3) Atlas cluster 4) IP whitelist")
        raise e

async def close_mongo_connection():
    """
    ปิดการเชื่อมต่อ database อย่างปลอดภัย
    - ใช้ตอนปิดโปรแกรม
    """
    global database_client
    
    if database_client is not None:
        database_client.close()
        logger.info("Disconnected from MongoDB Atlas")

async def test_connection():
    """
    ทดสอบสถานะการเชื่อมต่อ database
    - ใช้สำหรับ health check endpoint
    - return status และ message
    """
    try:
        if database_client is None:
            return {
                "status": "unhealthy", 
                "message": "Database client not connected"
            }
        
        # ทดสอบด้วยคำสั่ง ping
        result = await database_client.admin.command('ping')
        
        return {
            "status": "healthy", 
            "message": "MongoDB Atlas connection successful",
            "ping_result": result
        }
        
    except Exception as e:
        return {
            "status": "unhealthy", 
            "message": "MongoDB connection failed"
        }

# =============================================================================
# HELPER FUNCTIONS 🛠️
# =============================================================================
def get_database():
    """
    ได้ database instance สำหรับใช้ใน routes อื่น ๆ
    """
    if database is None:
        raise Exception("Database not connected. Call connect_to_mongo() first.")
    return database

def get_client():
    """
    ได้ database client สำหรับใช้งานระดับ admin
    """
    if database_client is None:
        raise Exception("Database client not connected. Call connect_to_mongo() first.")
    return database_client

# =============================================================================
# TESTING FUNCTIONS 🧪 - ใช้ทดสอบเบื้องต้น
# =============================================================================
async def test_insert_data():
    """
    ทดสอบการเพิ่มข้อมูลลง database
    - ใช้ทดสอบว่าเขียนข้อมูลได้หรือไม่
    """
    try:
        db = get_database()
        
        # ทดสอบใส่ข้อมูลในตาราง test_collection
        test_data = {
            "message": "Hello from AI Resume Screening System!",
            "timestamp": "2025-06-05",
            "test": True
        }
        
        result = await db.test_collection.insert_one(test_data)
        logger.info("Test data inserted with ID: %s", result.inserted_id)
        
        return {"success": True, "inserted_id": str(result.inserted_id)}
        
    except Exception as e:
        logger.error("Failed to insert test data: %s", e)
        return {"success": False, "error": "Insert failed"}

async def test_read_data():
    """
    ทดสอบการอ่านข้อมูลจาก database
    """
    try:
        db = get_database()
        
        # อ่านข้อมูลจากตาราง test_collection
        documents = await db.test_collection.find().to_list(length=10)
        
        logger.info("Found %d test documents", len(documents))
        return {"success": True, "count": len(documents), "data": documents}
        
    except Exception as e:
        logger.error("Failed to read test data: %s", e)
        return {"success": False, "error": "Read failed"}

# =============================================================================
# COMPATIBILITY FUNCTIONS 🔄 - สำหรับ backward compatibility
# =============================================================================
async def check_database_health():
    """
    Alias สำหรับ test_connection() เพื่อความเข้ากันได้กับโค้ดเก่า
    """
    return await test_connection()