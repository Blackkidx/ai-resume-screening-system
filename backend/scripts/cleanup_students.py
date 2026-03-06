"""
🧹 Cleanup Script: ลบ Student users ทั้งหมด + แสดง HR users
"""
from pymongo import MongoClient
import sys

MONGO_URL = "mongodb+srv://rakeiei244:rakeiei2444@resume-screening.knyxpww.mongodb.net/ai_resume_screening?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true"
DATABASE_NAME = "ai_resume_screening"

print("Connecting to MongoDB...")
client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=15000)
db = client[DATABASE_NAME]

try:
    client.admin.command("ping")
    print("✅ Connected to MongoDB\n")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)

# ─── 1. Find all Student users ───
students = list(db.users.find({"user_type": "Student"}))
student_ids = [str(s["_id"]) for s in students]

print(f"🎓 พบ Student ทั้งหมด {len(students)} คน:")
for s in students:
    print(f"   - {s.get('full_name', s.get('username', '?'))} | {s.get('email', '?')}")

if not students:
    print("   (ไม่มี Student ในระบบ)")
else:
    # ─── 2. Delete related data ───
    app_result = db.applications.delete_many({"student_id": {"$in": student_ids}})
    print(f"\n🗑️  ลบ Applications: {app_result.deleted_count} รายการ")

    res_result = db.resumes.delete_many({"user_id": {"$in": student_ids}})
    print(f"🗑️  ลบ Resumes: {res_result.deleted_count} รายการ")

    try:
        match_result = db.matching_results.delete_many({"user_id": {"$in": student_ids}})
        print(f"🗑️  ลบ Matching Results: {match_result.deleted_count} รายการ")
    except Exception:
        pass

    try:
        notif_result = db.notifications.delete_many({"user_id": {"$in": student_ids}})
        print(f"🗑️  ลบ Notifications: {notif_result.deleted_count} รายการ")
    except Exception:
        pass

    try:
        cert_result = db.certificates.delete_many({"user_id": {"$in": student_ids}})
        print(f"🗑️  ลบ Certificates: {cert_result.deleted_count} รายการ")
    except Exception:
        pass

    user_result = db.users.delete_many({"user_type": "Student"})
    print(f"🗑️  ลบ Student Users: {user_result.deleted_count} คน")

    db.jobs.update_many({}, {"$set": {"applications_count": 0}})
    print("🔄 Reset applications_count ของ Jobs ทั้งหมดเป็น 0")

# ─── 3. Show HR users ───
print("\n" + "=" * 50)
print("💼 HR Users ในระบบ:")
print("=" * 50)

hr_users = list(db.users.find({"user_type": "HR"}))
if hr_users:
    for h in hr_users:
        print(f"   👤 {h.get('full_name', h.get('username', '?'))}")
        print(f"      Email: {h.get('email', '?')}")
        print(f"      Username: {h.get('username', '?')}")
        company_id = h.get("company_id")
        if company_id:
            try:
                # company_id is a string in user, but Object ID in companies
                from bson import ObjectId
                company = db.companies.find_one({"_id": ObjectId(company_id)})
                if company:
                    print(f"      Company: {company.get('name', '?')}")
            except:
                pass
        print()
else:
    print("   (ไม่มี HR ในระบบ)")

# ─── 4. Show Admin users ───
print("=" * 50)
print("👑 Admin Users ในระบบ:")
print("=" * 50)

admins = list(db.users.find({"user_type": "Admin"}))
if admins:
    for a in admins:
        print(f"   👤 {a.get('full_name', a.get('username', '?'))} | {a.get('email', '?')}")
else:
    print("   (ไม่มี Admin ในระบบ)")

# ─── Summary ───
total_users = db.users.count_documents({})
total_apps = db.applications.count_documents({})
total_resumes = db.resumes.count_documents({})

print(f"\n📊 สรุปหลัง Cleanup:")
print(f"   Users: {total_users}")
print(f"   Applications: {total_apps}")
print(f"   Resumes: {total_resumes}")

client.close()
print("\n✅ Done!")
