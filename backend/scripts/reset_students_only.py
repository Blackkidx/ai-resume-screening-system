# -*- coding: utf-8 -*-
"""
🧹 Reset Students Only
Deletes: students, resumes, applications, notifications
Keeps: companies, jobs, HR users, admin
"""
import asyncio
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import os
from dotenv import load_dotenv
import motor.motor_asyncio

load_dotenv()
MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise ValueError("MONGODB_URL is not set in the environment variables.")

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    db = client["ai_resume_screening"]

    print("=" * 50)
    print("BEFORE RESET")
    print("=" * 50)

    students = await db.users.count_documents({"role": "student"})
    hr_users = await db.users.count_documents({"role": {"$in": ["hr", "admin"]}})
    resumes = await db.resumes.count_documents({})
    apps = await db.applications.count_documents({})
    jobs = await db.jobs.count_documents({})
    companies = await db.companies.count_documents({})
    notifs = await db.notifications.count_documents({})

    print(f"  Students:      {students}")
    print(f"  HR/Admin:      {hr_users}")
    print(f"  Resumes:       {resumes}")
    print(f"  Applications:  {apps}")
    print(f"  Jobs:          {jobs}")
    print(f"  Companies:     {companies}")
    print(f"  Notifications: {notifs}")

    print(f"\n{'='*50}")
    print("DELETING student data...")
    print("=" * 50)

    r1 = await db.users.delete_many({"role": "student"})
    print(f"  Deleted {r1.deleted_count} students")

    r2 = await db.resumes.delete_many({})
    print(f"  Deleted {r2.deleted_count} resumes")

    r3 = await db.applications.delete_many({})
    print(f"  Deleted {r3.deleted_count} applications")

    r4 = await db.notifications.delete_many({})
    print(f"  Deleted {r4.deleted_count} notifications")

    # Reset application counts on jobs
    r5 = await db.jobs.update_many({}, {"$set": {"application_count": 0}})
    print(f"  Reset application_count on {r5.modified_count} jobs")

    print(f"\n{'='*50}")
    print("AFTER RESET")
    print("=" * 50)

    students2 = await db.users.count_documents({"role": "student"})
    hr_users2 = await db.users.count_documents({"role": {"$in": ["hr", "admin"]}})
    resumes2 = await db.resumes.count_documents({})
    apps2 = await db.applications.count_documents({})
    jobs2 = await db.jobs.count_documents({})
    companies2 = await db.companies.count_documents({})

    print(f"  Students:      {students2} (was {students})")
    print(f"  HR/Admin:      {hr_users2} (kept)")
    print(f"  Resumes:       {resumes2} (was {resumes})")
    print(f"  Applications:  {apps2} (was {apps})")
    print(f"  Jobs:          {jobs2} (kept)")
    print(f"  Companies:     {companies2} (kept)")

    print(f"\n{'='*50}")
    print("READY FOR MANUAL TESTING!")
    print("=" * 50)
    print("  Model: XGBoost v5.0 (loaded from xgboost_model.json)")
    print("  Students can now register + upload resume + apply")
    print("  HR can login and review applications with AI scores")

    client.close()

asyncio.run(main())
