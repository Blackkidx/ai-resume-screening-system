# -*- coding: utf-8 -*-
"""
🔄 Reset Students + Seed ALL Resumes with Model v4.2

1. Delete ALL student users + resumes (keep applications for training)
2. Delete old pending applications (orphaned)
3. Re-create students for ALL 25 PDFs in 'resume test/'
4. Upload & AI-analyze each resume
5. Apply to ALL open jobs → scored by Model v4.2

Usage: python backend/scripts/reset_and_seed_all.py
"""

import asyncio, hashlib, os, random, shutil, sys, time, uuid
from datetime import datetime
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import motor.motor_asyncio
from bson import ObjectId
from dotenv import load_dotenv
from passlib.context import CryptContext

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

from services.pdf_service import PDFExtractor
from services.llm_service import LLMService
from services.matching_service import MatchingService
from services.xgboost_service import XGBoostService

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

RESUME_SOURCE_DIR = PROJECT_ROOT / "resume test"
UPLOAD_FOLDER = BACKEND_DIR / "uploads" / "resumes"
STUDENT_PASSWORD = "student123"


def hash_password(pw: str) -> str:
    return pwd_context.hash(hashlib.sha256(pw.encode()).hexdigest())


def gen_id(prefix="APP") -> str:
    return f"{prefix}-{datetime.utcnow().year}-{str(uuid.uuid4())[:8].upper()}"


# Auto-detect all PDF resumes and derive student info
def discover_students() -> list[dict]:
    """Scan resume test/ for PDFs and auto-generate student records."""
    students = []
    for pdf in sorted(RESUME_SOURCE_DIR.glob("*.pdf")):
        fname = pdf.stem

        # Extract name from filename patterns:
        # "Resume - Name", "resume - Name", "Resume_Name", "resume-Name", "CV_Name..."
        name = fname
        for prefix in ["Resume - ", "resume - ", "Resume ", "resume ", "Resume-", "resume-", "CV_", "CV "]:
            if name.startswith(prefix):
                name = name[len(prefix):]
                break

        # Remove extra suffixes like "_2026_NETWORK SECURITY"
        if " - " in name:
            name = name.split(" - ")[-1].strip()

        # Clean up
        name = name.strip().replace("_", " ")
        username = name.lower().replace(" ", "_").replace(".", "")[:20]

        # Handle Thai names — keep as-is
        students.append({
            "username": username,
            "email": f"{username}@student.example.com",
            "full_name": name,
            "pdf": pdf.name,
        })

    return students


def convert_job_to_requirements(job: dict) -> dict:
    majors = job.get("majors", [])
    major_required = ""
    if majors and majors[0] != "ทุกสาขา":
        major_required = majors[0]
    exp_years = job.get("experience_required", 0) or 0
    return {
        "title": job.get("title", ""),
        "skills_required": job.get("skills_required", []),
        "major_required": major_required,
        "min_gpa": job.get("min_gpa", 0) or 0,
        "min_experience_months": exp_years * 12,
        "required_certifications": [],
        "preferred_certifications": [],
    }


async def main():
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "ai_resume_screening")

    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    try:
        await client.admin.command("ping")
    except Exception as e:
        print(f"[ERROR] DB connection failed: {e}")
        sys.exit(1)

    print("=" * 70)
    print("  🔄 RESET & SEED — Model v4.2 Validation")
    print(f"  📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # ────────────────────────────────────────────────────
    # STEP 0: Clean up
    # ────────────────────────────────────────────────────
    print("\n  📊 CURRENT STATE:")
    print(f"     Students:     {await db.users.count_documents({'user_type': 'Student'})}")
    print(f"     Resumes:      {await db.resumes.count_documents({})}")
    print(f"     Applications: {await db.applications.count_documents({})}")
    decided = await db.applications.count_documents({"hr_decision": {"$in": ["accepted", "rejected"]}})
    pending = await db.applications.count_documents({"status": "pending"})
    print(f"       - Decided:  {decided} (KEEP for training)")
    print(f"       - Pending:  {pending} (will delete)")

    print("\n  🗑️ STEP 0: Cleaning up...")

    # Get student IDs before deleting
    student_ids = [str(u["_id"]) async for u in db.users.find({"user_type": "Student"}, {"_id": 1})]

    # Delete students
    r1 = await db.users.delete_many({"user_type": "Student"})
    print(f"     Deleted {r1.deleted_count} student accounts")

    # Delete resumes
    r2 = await db.resumes.delete_many({})
    print(f"     Deleted {r2.deleted_count} resumes")

    # Delete role assignments for students
    if student_ids:
        oids = [ObjectId(sid) for sid in student_ids]
        r3 = await db.user_role_assignments.delete_many({"user_id": {"$in": oids}})
        print(f"     Deleted {r3.deleted_count} role assignments")

    # Delete ONLY pending applications (keep decided ones for training)
    r4 = await db.applications.delete_many({"status": "pending"})
    print(f"     Deleted {r4.deleted_count} pending applications (kept {decided} decided)")

    # Delete notifications for students
    if student_ids:
        r5 = await db.notifications.delete_many({"user_id": {"$in": student_ids}})
        print(f"     Deleted {r5.deleted_count} notifications")

    # ────────────────────────────────────────────────────
    # STEP 1: Discover students
    # ────────────────────────────────────────────────────
    students = discover_students()
    print(f"\n  📁 STEP 1: Found {len(students)} PDF resumes")
    for s in students:
        print(f"     - {s['username']:<20s} → {s['pdf']}")

    # ────────────────────────────────────────────────────
    # STEP 2: Create student accounts
    # ────────────────────────────────────────────────────
    print(f"\n  👤 STEP 2: Creating {len(students)} student accounts...")

    now = datetime.utcnow()
    hashed_pw = hash_password(STUDENT_PASSWORD)
    student_role = await db.user_roles.find_one({"role_name": "Student"})
    student_id_map = {}

    for s in students:
        user_doc = {
            "username": s["username"],
            "email": s["email"],
            "password_hash": hashed_pw,
            "full_name": s["full_name"],
            "first_name": s["full_name"].split()[0] if s["full_name"] else "",
            "last_name": " ".join(s["full_name"].split()[1:]) if len(s["full_name"].split()) > 1 else "",
            "phone": None,
            "user_type": "Student",
            "company_id": None,
            "is_active": True,
            "is_verified": False,
            "created_at": now,
            "updated_at": now,
            "last_login": None,
        }

        result = await db.users.insert_one(user_doc)
        uid = str(result.inserted_id)
        student_id_map[s["username"]] = uid

        if student_role:
            await db.user_role_assignments.insert_one({
                "user_id": result.inserted_id,
                "role_id": student_role["_id"],
                "role_name": "Student",
                "assigned_at": now,
                "assigned_by": "reset_seed_script",
            })

        print(f"     ✅ {s['username']}")

    # ────────────────────────────────────────────────────
    # STEP 3: Upload + AI analyze resumes
    # ────────────────────────────────────────────────────
    print(f"\n  📄 STEP 3: Processing resumes with AI pipeline...")

    pdf_extractor = PDFExtractor()
    llm_service = LLMService()
    print(f"     LLM: {'✅ Ready' if llm_service.is_ready() else '❌ Not ready'}")

    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
    resume_features_map = {}
    processed = 0
    failed = 0

    for s in students:
        username = s["username"]
        uid = student_id_map[username]
        pdf_path = RESUME_SOURCE_DIR / s["pdf"]

        if not pdf_path.exists():
            print(f"     ❌ {username}: PDF not found")
            failed += 1
            continue

        # Copy file
        unique_name = f"{uid}_{uuid.uuid4()}.pdf"
        dest = UPLOAD_FOLDER / unique_name
        shutil.copy2(str(pdf_path), str(dest))
        file_path_rel = f"uploads/resumes/{unique_name}"

        # Extract text
        text, method = pdf_extractor.extract_text(str(pdf_path))
        if not text or method == "failed":
            print(f"     ⚠️ {username}: Text extraction failed (scan PDF?)")
            await db.resumes.insert_one({
                "user_id": uid, "file_name": s["pdf"],
                "file_path": file_path_rel, "file_type": "pdf",
                "file_size": pdf_path.stat().st_size, "extracted_text": "",
                "extracted_features": None, "uploaded_at": now,
                "status": "ocr_not_supported",
            })
            failed += 1
            continue

        # LLM analysis
        features = None
        if llm_service.is_ready():
            try:
                features = llm_service.extract_features(text)
                if features and "extraction_error" in features and not features["extraction_error"]:
                    del features["extraction_error"]
            except Exception as e:
                print(f"     ⚠️ {username}: LLM error — {e}")
            time.sleep(2)  # Rate limit

        await db.resumes.insert_one({
            "user_id": uid, "file_name": s["pdf"],
            "file_path": file_path_rel, "file_type": "pdf",
            "file_size": pdf_path.stat().st_size, "extracted_text": text,
            "extracted_features": features, "uploaded_at": now,
            "processed_at": datetime.utcnow(), "status": "processed",
        })

        resume_features_map[username] = features or {}
        processed += 1
        print(f"     ✅ {username} ({len(text)} chars)")

    print(f"     → Processed: {processed}, Failed: {failed}")

    # ────────────────────────────────────────────────────
    # STEP 4: Apply to ALL jobs with Model v4.2
    # ────────────────────────────────────────────────────
    print(f"\n  🎯 STEP 4: Applying to ALL jobs with Model v4.2...")

    matching_service = MatchingService()
    xgb_service = XGBoostService.get_instance()
    model_info = xgb_service.get_model_info()
    print(f"     Model: v{model_info.get('model_version', '?')} | Accuracy: {model_info.get('accuracy', 'N/A')}")
    print(f"     Threshold: {model_info.get('decision_threshold', 'N/A')}")

    jobs = await db.jobs.find({"is_active": True}).to_list(100)
    print(f"     Jobs: {len(jobs)}\n")

    total_apps = 0
    for s in students:
        username = s["username"]
        uid = student_id_map[username]
        features = resume_features_map.get(username)

        if not features or "error" in features:
            print(f"     ❌ {username}: No features, skipping")
            continue

        user = await db.users.find_one({"_id": ObjectId(uid)})
        resume = await db.resumes.find_one({"user_id": uid})
        resume_url = "/" + resume["file_path"].replace("\\", "/") if resume else ""

        apps_created = 0
        for job in jobs:
            job_req = convert_job_to_requirements(job)
            match_result = matching_service.calculate_ai_match(features, job_req)

            xgb_score = match_result.get("xgboost_score")
            if xgb_score is not None and match_result.get("model_available"):
                ai_score = round(xgb_score / 100, 2)
                xgb_decision = match_result.get("xgboost_decision", "")
                xgb_prob = match_result.get("xgboost_probability", 0)
                ai_method = "xgboost"
            else:
                ai_score = round(match_result["overall_score"] / 100, 2)
                xgb_decision = ""
                xgb_prob = 0
                ai_method = "rule_based"

            # XGBoost features for future training
            xgb_features = matching_service.extract_xgboost_features(features, job_req)

            app_doc = {
                "cover_letter": None,
                "portfolio_url": None,
                "available_start_date": None,
                "application_code": gen_id("APP"),
                "job_id": str(job["_id"]),
                "job_title": job.get("title", ""),
                "company_name": job.get("company_name", ""),
                "student_id": uid,
                "student_name": user.get("full_name", username),
                "student_email": user.get("email", ""),
                "resume_data": features,
                "resume_file_url": resume_url,
                "status": "pending",
                "ai_score": ai_score,
                "ai_method": ai_method,
                "ai_feedback": match_result.get("recommendation", ""),
                "matching_breakdown": match_result.get("breakdown", {}),
                "matching_zone": match_result.get("zone", ""),
                "xgboost_score": xgb_score,
                "xgboost_decision": xgb_decision,
                "xgboost_probability": xgb_prob,
                "xgboost_features": xgb_features,
                "submitted_at": now,
            }

            await db.applications.insert_one(app_doc)
            apps_created += 1
            total_apps += 1

        score_summary = f"{ai_method} | {apps_created} jobs"
        print(f"     ✅ {username:<20s} → {score_summary}")

    # ────────────────────────────────────────────────────
    # SUMMARY
    # ────────────────────────────────────────────────────
    print(f"\n{'=' * 70}")
    print(f"  ✅ DONE!")
    print(f"{'=' * 70}")
    print(f"  Students:      {len(student_id_map)} (password: {STUDENT_PASSWORD})")
    print(f"  Resumes:       {processed} processed")
    print(f"  New Apps:      {total_apps} (ALL pending)")
    print(f"  Training Data: {decided} old decisions kept")
    print(f"  Model:         v4.2 (91.4% accuracy)")
    print(f"")
    print(f"  → Login as HR to review AI scores and accept/reject!")
    print(f"{'=' * 70}")

    client.close()


asyncio.run(main())
