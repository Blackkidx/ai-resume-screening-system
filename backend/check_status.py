"""Quick status check - query MongoDB for counts (using pymongo)"""
from pymongo import MongoClient

MONGO_URL = "mongodb+srv://rakeiei244:rakeiei2444@resume-screening.knyxpww.mongodb.net/ai_resume_screening?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true"

try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=15000)
    db = client["ai_resume_screening"]
    db.command("ping")

    print("=== SYSTEM STATUS ===")
    print(f"Users: {db.users.count_documents({})}")
    print(f"Jobs: {db.jobs.count_documents({})}")
    print(f"Resumes: {db.resumes.count_documents({})}")
    print(f"Applications: {db.applications.count_documents({})}")
    print(f"Certificates: {db.certificates.count_documents({})}")

    print("\n=== JOB LISTINGS ===")
    for j in db.jobs.find({}, {"title": 1, "company_name": 1, "status": 1}):
        print(f"  [{j.get('status','?')}] {j.get('title','?')} - {j.get('company_name','?')}")

    print("\n=== RESUMES ===")
    for r in db.resumes.find({}, {"student_name": 1, "status": 1}):
        print(f"  [{r.get('status','?')}] {r.get('student_name','?')}")

    print("\n=== APPLICATIONS ===")
    for a in db.applications.find({}, {"student_name": 1, "status": 1, "ai_score": 1}):
        score = a.get("ai_score", "N/A")
        if isinstance(score, (int, float)):
            score = f"{score:.1f}%"
        print(f"  [{a.get('status','pending')}] {a.get('student_name','?')} - Score: {score}")

    client.close()
except Exception as e:
    print(f"ERROR: {e}")
