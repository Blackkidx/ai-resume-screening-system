from pymongo import MongoClient
from decouple import config

# อ่าน URL จาก .env
DATABASE_URL = config('DATABASE_URL')

# เชื่อมต่อ MongoDB
client = MongoClient(DATABASE_URL, serverSelectionTimeoutMS=5000)
database = client.resume_screening

# Collections (ตาราง)
users_collection = database.users
resumes_collection = database.resumes
jobs_collection = database.jobs

def test_connection():
    try:
        client.admin.command('ping')
        return {
            "status": "Connected to MongoDB Atlas",
            "database": "resume_screening",
            "cluster": "resume-screening"
        }
    except Exception as e:
        return {"status": "Failed", "error": str(e)}