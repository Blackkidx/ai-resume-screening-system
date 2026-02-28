# Quick cleanup of seeded student data for re-seeding
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
import motor.motor_asyncio

async def cleanup():
    url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "ai_resume_screening")
    client = motor.motor_asyncio.AsyncIOMotorClient(url)
    db = client[db_name]

    usernames = [
        "chinatthawat", "isara", "kanokchat", "kittawit", "narathon",
        "phanudach", "puridech", "sutaya", "teerawat", "thanakorn",
        "thanatan", "theeraphat", "yanisa",
    ]

    for u in usernames:
        user = await db.users.find_one({"username": u})
        if user:
            uid = str(user["_id"])
            r1 = await db.applications.delete_many({"student_id": uid})
            r2 = await db.resumes.delete_many({"user_id": uid})
            await db.user_role_assignments.delete_many({"user_id": user["_id"]})
            await db.users.delete_one({"_id": user["_id"]})
            print(f"  Deleted {u}: {r1.deleted_count} apps, {r2.deleted_count} resumes")

    # Reset applications_count on jobs
    await db.jobs.update_many({}, {"$set": {"applications_count": 0}})
    print("Cleanup done!")
    client.close()

asyncio.run(cleanup())
