# Reset HR decisions back to "pending" so user can decide manually via UI
import asyncio, os, sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
import motor.motor_asyncio

async def reset():
    url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "ai_resume_screening")
    client = motor.motor_asyncio.AsyncIOMotorClient(url)
    db = client[db_name]

    # Reset all seeded applications back to pending
    result = await db.applications.update_many(
        {"hr_decision": {"$in": ["accepted", "rejected"]}},
        {"$set": {"status": "pending"},
         "$unset": {
             "hr_decision": "",
             "hr_reason": "",
             "decided_at": "",
             "decided_by": "",
             "ai_score_at_decision": "",
             "ai_breakdown_at_decision": "",
         }}
    )
    print(f"Reset {result.modified_count} applications back to 'pending'")
    print("HR can now decide via the web UI!")
    client.close()

asyncio.run(reset())
