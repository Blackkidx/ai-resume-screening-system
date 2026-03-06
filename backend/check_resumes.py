"""Check for duplicate resumes in MongoDB"""
from pymongo import MongoClient
from collections import Counter

MONGO_URL = "mongodb+srv://rakeiei244:rakeiei2444@resume-screening.knyxpww.mongodb.net/ai_resume_screening?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true"

try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=15000)
    db = client["ai_resume_screening"]
    
    resumes = list(db.resumes.find({}, {"student_name": 1, "user_id": 1, "file_path": 1, "status": 1}))
    
    print(f"Total Resumes: {len(resumes)}")
    
    # Check for duplicate student names / user_ids
    names = [r.get("student_name", "Unknown") for r in resumes]
    name_counts = Counter(names)
    
    print("\n=== Resume Counts per Student ===")
    for name, count in name_counts.most_common():
        print(f"{name}: {count} resume(s)")
        
    print("\n=== All Resumes ===")
    for r in resumes:
        print(f"- {r.get('student_name', '?')} | {r.get('status', '?')} | {r.get('file_path', '?')}")
        
    client.close()
except Exception as e:
    print(f"ERROR: {e}")
