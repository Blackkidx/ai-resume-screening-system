# -*- coding: utf-8 -*-
"""
Seed Students Script
Create students + upload Resumes via real AI Pipeline
+ create Applications + simulate HR Decisions into MongoDB

Usage:
    python backend/scripts/seed_students.py
"""

import asyncio
import hashlib
import os
import random
import shutil
import sys
import time
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# Fix Windows encoding (cp1252 cannot handle Thai/emoji)
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import motor.motor_asyncio
from bson import ObjectId
from dotenv import load_dotenv
from passlib.context import CryptContext

# ---------------------------------------------------------------------------
# Setup paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent          # backend/scripts/
BACKEND_DIR = SCRIPT_DIR.parent                        # backend/
PROJECT_ROOT = BACKEND_DIR.parent                      # ai-resume-screening-system/

sys.path.insert(0, str(BACKEND_DIR))

load_dotenv(BACKEND_DIR / ".env")

# Import real AI services
from services.pdf_service import PDFExtractor
from services.llm_service import LLMService
from services.matching_service import MatchingService

# ---------------------------------------------------------------------------
# Password hashing — same as core/auth.py (SHA256 + bcrypt)
# ---------------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    password_sha = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(password_sha)


def generate_unique_id(prefix: str = "ID") -> str:
    year = datetime.utcnow().year
    random_part = str(uuid.uuid4())[:8].upper()
    return f"{prefix}-{year}-{random_part}"


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
RESUME_SOURCE_DIR = PROJECT_ROOT / "resume test"       # ที่เก็บ PDF ต้นทาง
UPLOAD_FOLDER = BACKEND_DIR / "uploads" / "resumes"    # ที่ระบบเก็บ PDF

STUDENT_PASSWORD = "student123"

random.seed(42)

# ---------------------------------------------------------------------------
# DATA DEFINITIONS
# ---------------------------------------------------------------------------
STUDENTS = [
    {"username": "chinatthawat", "email": "chinatthawat@student.example.com", "full_name": "จินัตถวัฒน์ อัครกิตติภาพัฒน์", "first_name": "จินัตถวัฒน์", "last_name": "อัครกิตติภาพัฒน์"},
    {"username": "isara",        "email": "isara@student.example.com",        "full_name": "อิสระ",        "first_name": "อิสระ",        "last_name": ""},
    {"username": "kanokchat",    "email": "kanokchat@student.example.com",    "full_name": "กนกชาติ",      "first_name": "กนกชาติ",      "last_name": ""},
    {"username": "kittawit",     "email": "kittawit@student.example.com",     "full_name": "กิตตะวิทย์",    "first_name": "กิตตะวิทย์",    "last_name": ""},
    {"username": "narathon",     "email": "narathon@student.example.com",     "full_name": "นราธร",        "first_name": "นราธร",        "last_name": ""},
    {"username": "phanudach",    "email": "phanudach@student.example.com",    "full_name": "ภานุดาช",      "first_name": "ภานุดาช",      "last_name": ""},
    {"username": "puridech",     "email": "puridech@student.example.com",     "full_name": "ภูริเดช",      "first_name": "ภูริเดช",      "last_name": ""},
    {"username": "sutaya",       "email": "sutaya@student.example.com",       "full_name": "สุทยา",        "first_name": "สุทยา",        "last_name": ""},
    {"username": "teerawat",     "email": "teerawat@student.example.com",     "full_name": "ธีรวัฒน์",      "first_name": "ธีรวัฒน์",      "last_name": ""},
    {"username": "thanakorn",    "email": "thanakorn@student.example.com",    "full_name": "ธนกร",         "first_name": "ธนกร",         "last_name": ""},
    {"username": "thanatan",     "email": "thanatan@student.example.com",     "full_name": "ธนาธาร",       "first_name": "ธนาธาร",       "last_name": ""},
    {"username": "theeraphat",   "email": "theeraphat@student.example.com",   "full_name": "ธีรภัทร",      "first_name": "ธีรภัทร",      "last_name": ""},
    {"username": "yanisa",       "email": "yanisa@student.example.com",       "full_name": "ญาณิสา",       "first_name": "ญาณิสา",       "last_name": ""},
    {"username": "pantharee",    "email": "pantharee@student.example.com",    "full_name": "พันธรี",       "first_name": "พันธรี",       "last_name": ""},
    {"username": "setthapong",   "email": "setthapong@student.example.com",   "full_name": "เศรษฐพงษ์",    "first_name": "เศรษฐพงษ์",    "last_name": ""},
]

RESUME_FILES = {
    "chinatthawat": "Resume Chinatthawat.pdf",
    "isara":        "resume Isara.pdf",
    "kanokchat":    "Resume Kanokchat.pdf",
    "kittawit":     "Resume Kittawit.pdf",
    "narathon":     "Resume Narathon.pdf",
    "phanudach":    "Resume Phanudach.pdf",
    "puridech":     "Resume Puridech.pdf",
    "sutaya":       "Resume Sutaya.pdf",
    "teerawat":     "Resume Teerawat.pdf",
    "thanakorn":    "Resume Thanakorn.pdf",
    "thanatan":     "Resume Thanatan.pdf",
    "theeraphat":   "Resume Theeraphat.pdf",
    "yanisa":       "Resume Yanisa.pdf",
    "pantharee":    "Resume Pantharee.pdf",
    "setthapong":   "Resume Setthapong.pdf",
}

ACCEPT_REASONS = [
    "ทักษะตรงกับตำแหน่ง มีโปรเจคที่เกี่ยวข้อง",
    "สาขาตรง ทักษะพื้นฐานดี พร้อมเรียนรู้",
    "มีประสบการณ์ที่เกี่ยวข้อง Portfolio น่าสนใจ",
    "ทักษะครบถ้วน GPA ดี เหมาะกับตำแหน่ง",
    "มีพื้นฐานแข็งแรง มีโปรเจคจริงหลายชิ้น",
    "สาขาตรงกับงาน มีความกระตือรือร้น",
]

REJECT_REASONS = [
    "ทักษะไม่ตรงกับตำแหน่ง ขาดทักษะหลักที่ต้องการ",
    "ไม่มีประสบการณ์หรือโปรเจคที่เกี่ยวข้อง",
    "สาขาไม่ตรง ขาดพื้นฐานที่จำเป็น",
    "GPA ต่ำกว่าเกณฑ์ ขาดทักษะสำคัญ",
    "ไม่มี Portfolio หรือผลงานที่แสดงความสามารถ",
    "ตำแหน่งเต็มแล้ว มีผู้สมัครที่เหมาะสมกว่า",
]


# ---------------------------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------------------------
def convert_job_to_requirements(job: dict) -> dict:
    """Same logic as routes/job.py convert_job_to_requirements"""
    majors = job.get("majors", [])
    major_required = ""
    if majors and majors[0] != "ทุกสาขา":
        major_required = majors[0]

    experience_years = job.get("experience_required", 0) or 0

    return {
        "title": job.get("title", ""),
        "skills_required": job.get("skills_required", []),
        "major_required": major_required,
        "min_gpa": job.get("min_gpa", 0) or 0,
        "min_experience_months": experience_years * 12,
        "required_certifications": [],
        "preferred_certifications": [],
    }


def normalize_score(score_0_100: float) -> float:
    """Same as routes/job.py normalize_score — 0-100 → 0-1"""
    return round(score_0_100 / 100.0, 2)


def simulate_hr_decision(ai_score_0_1: float, breakdown: dict) -> str:
    """
    จำลอง HR decision — ไม่ตัดสินตาม score อย่างเดียว
    ai_score_0_1: score 0-1 (normalized)
    breakdown: dict with skills, major, experience, projects, certification, gpa (0-100)
    """
    ai_score = ai_score_0_1 * 100  # convert back to 0-100

    skills = breakdown.get("skills", 0)
    major = breakdown.get("major", 0)
    projects = breakdown.get("projects", 0)

    # Case 1: Score สูงมาก → Accept 95%
    if ai_score >= 80:
        return "accepted" if random.random() < 0.95 else "rejected"

    # Case 2: Score กลาง → ดู breakdown detail
    elif ai_score >= 60:
        if skills >= 70:
            return "accepted" if random.random() < 0.75 else "rejected"
        elif major >= 80:
            return "accepted" if random.random() < 0.55 else "rejected"
        else:
            return "accepted" if random.random() < 0.40 else "rejected"

    # Case 3: Score กลาง-ต่ำ → ดู projects เป็นหลัก
    elif ai_score >= 40:
        if projects >= 60:
            return "accepted" if random.random() < 0.50 else "rejected"
        else:
            return "accepted" if random.random() < 0.25 else "rejected"

    # Case 4: Score ต่ำมาก → Reject 90%
    else:
        return "accepted" if random.random() < 0.10 else "rejected"


# =========================================================================
# MAIN SEED FUNCTION
# =========================================================================
async def seed():
    # --- Connect ---
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "ai_resume_screening")

    print("=" * 60)
    print("🌱 SEED STUDENTS — AI Resume Screening System")
    print("=" * 60)
    print(f"\n[INFO] Connecting to MongoDB...")

    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)
    db = client[db_name]

    try:
        await client.admin.command("ping")
        print(f"[OK] Connected to {db_name}\n")
    except Exception as exc:
        print(f"[ERROR] Cannot connect to MongoDB: {exc}")
        sys.exit(1)

    now = datetime.utcnow()

    # Initialize AI services
    print("[INFO] Initializing AI services...")
    pdf_extractor = PDFExtractor()
    llm_service = LLMService()
    matching_service = MatchingService()

    if llm_service.is_ready():
        print("[OK] LLM Service (Groq) ready")
    else:
        print("[WARN] LLM Service NOT ready — extracted_features will be empty")

    print()

    # Ensure upload folder exists
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

    # =================================================================
    # STEP 1 — Create 13 Student Accounts
    # =================================================================
    print(f"{'='*60}")
    print(f"📝 STEP 1: Creating {len(STUDENTS)} student accounts...")
    print(f"{'='*60}")

    hashed_pw = hash_password(STUDENT_PASSWORD)
    student_ids = {}  # username → ObjectId (str)
    created_students = 0

    # Get Student role
    student_role = await db.user_roles.find_one({"role_name": "Student"})

    for s in STUDENTS:
        existing = await db.users.find_one({"username": s["username"]})
        if existing:
            print(f"  [SKIP] {s['username']} (already exists)")
            student_ids[s["username"]] = str(existing["_id"])
            continue

        # Document structure from routes/auth.py register_user (L122-137)
        user_doc = {
            "username": s["username"],
            "email": s["email"],
            "password_hash": hashed_pw,
            "full_name": s["full_name"],
            "first_name": s["first_name"],
            "last_name": s["last_name"],
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
        user_oid = result.inserted_id
        student_ids[s["username"]] = str(user_oid)
        created_students += 1

        # Create user_role_assignments (same as auth.py L150-159)
        if student_role:
            role_mapping = {
                "user_id": user_oid,
                "role_id": student_role["_id"],
                "role_name": "Student",
                "assigned_at": now,
                "assigned_by": "seed_script",
            }
            await db.user_role_assignments.insert_one(role_mapping)

        print(f"  [OK] {s['username']} ({s['full_name']})")

    print(f"\n  → Created: {created_students}, Skipped: {len(STUDENTS) - created_students}\n")

    # =================================================================
    # STEP 2 — Upload Resumes via Real AI Pipeline
    # =================================================================
    print(f"{'='*60}")
    print(f"📄 STEP 2: Uploading resumes via AI pipeline...")
    print(f"{'='*60}")

    created_resumes = 0
    resume_ids = {}  # username → resume ObjectId (str)

    for username, pdf_filename in RESUME_FILES.items():
        user_id = student_ids.get(username)
        if not user_id:
            print(f"  [SKIP] {username} — user not found")
            continue

        # Check if resume already exists
        existing_resume = await db.resumes.find_one({"user_id": user_id})
        if existing_resume:
            print(f"  [SKIP] {username} — resume already exists")
            resume_ids[username] = str(existing_resume["_id"])
            continue

        # Read PDF from resume test directory
        source_path = RESUME_SOURCE_DIR / pdf_filename
        if not source_path.exists():
            print(f"  [ERROR] {pdf_filename} not found at {source_path}")
            continue

        # Copy PDF to uploads folder (same naming as resume.py)
        unique_filename = f"{user_id}_{uuid.uuid4()}.pdf"
        dest_path = UPLOAD_FOLDER / unique_filename
        shutil.copy2(str(source_path), str(dest_path))

        file_size = source_path.stat().st_size
        file_path_rel = f"uploads/resumes/{unique_filename}"

        # Step 2a: Extract text from PDF
        print(f"  [{username}] Extracting text from PDF...", end=" ")
        extracted_text, method = pdf_extractor.extract_text(str(source_path))

        if not extracted_text or method == "failed":
            print(f"FAILED (method: {method})")
            # Still save the resume doc with error status
            resume_doc = {
                "user_id": user_id,
                "file_name": pdf_filename,
                "file_path": file_path_rel,
                "file_type": "pdf",
                "file_size": file_size,
                "extracted_text": "",
                "extracted_features": None,
                "uploaded_at": now,
                "processed_at": None,
                "status": "error",
                "error_message": f"Text extraction failed (method: {method})",
            }
            result = await db.resumes.insert_one(resume_doc)
            resume_ids[username] = str(result.inserted_id)
            continue

        print(f"OK ({len(extracted_text)} chars, method: {method})")

        # Step 2b: Extract features via LLM (Groq)
        extracted_features = None
        if llm_service.is_ready():
            print(f"  [{username}] AI analyzing resume...", end=" ")
            try:
                extracted_features = llm_service.extract_features(extracted_text)

                # Clean up error field if empty
                if extracted_features and "extraction_error" in extracted_features:
                    if not extracted_features["extraction_error"]:
                        del extracted_features["extraction_error"]

                print("OK ✨")
            except Exception as e:
                print(f"ERROR: {e}")
                extracted_features = {"error": str(e)}

            # Rate limit delay (2 seconds)
            time.sleep(2)
        else:
            print(f"  [{username}] LLM not ready — skipping AI analysis")

        # Step 2c: Save resume document (same structure as resume.py upload_resume)
        resume_doc = {
            "user_id": user_id,
            "file_name": pdf_filename,
            "file_path": file_path_rel,
            "file_type": "pdf",
            "file_size": file_size,
            "extracted_text": extracted_text,
            "extracted_features": extracted_features,
            "uploaded_at": now,
            "processed_at": datetime.utcnow(),
            "status": "processed",
        }

        result = await db.resumes.insert_one(resume_doc)
        resume_ids[username] = str(result.inserted_id)
        created_resumes += 1

    print(f"\n  → Created: {created_resumes}, Skipped: {len(RESUME_FILES) - created_resumes}\n")

    # =================================================================
    # STEP 3 & 4 — Calculate Matching + Create Applications
    # =================================================================
    print(f"{'='*60}")
    print(f"📊 STEP 3-4: Calculating AI scores & creating applications...")
    print(f"{'='*60}")

    # Load all jobs
    jobs = await db.jobs.find({"is_active": True}).to_list(length=100)
    if not jobs:
        print("  [ERROR] No jobs found! Run seed_jobs.py first.")
        client.close()
        return

    print(f"  Found {len(jobs)} active jobs\n")

    total_applications = 0
    app_records = []  # for HR decision step

    for username, user_id in student_ids.items():
        # Get resume features
        resume = await db.resumes.find_one({"user_id": user_id})
        resume_features = {}
        if resume:
            resume_features = resume.get("extracted_features") or resume.get("extracted_data") or {}

        # Get user info
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            continue

        # Calculate match scores for ALL jobs
        job_scores = []
        for job in jobs:
            job_requirements = convert_job_to_requirements(job)
            match_result = matching_service.calculate_match(resume_features, job_requirements)
            job_scores.append((job, match_result))

        # Sort by score descending
        job_scores.sort(key=lambda x: x[1]["overall_score"], reverse=True)

        # Select 4-5 jobs: top 2-3 + bottom 1-2 (mix of good and bad matches)
        num_apps = random.randint(4, 5)
        num_top = random.randint(2, 3)
        num_bottom = num_apps - num_top

        selected = []
        # Top matches
        for js in job_scores[:num_top]:
            selected.append(js)
        # Bottom matches (from the end)
        bottom_pool = job_scores[num_top:]
        random.shuffle(bottom_pool)
        for js in bottom_pool[:num_bottom]:
            selected.append(js)

        print(f"  [{username}] Applying to {len(selected)} jobs:")

        for job, match_result in selected:
            job_id = str(job["_id"])

            # Check duplicate application
            existing_app = await db.applications.find_one({
                "job_id": job_id,
                "student_id": user_id,
            })
            if existing_app:
                print(f"    [SKIP] {job['title']} (already applied)")
                continue

            # Build resume_file_url
            resume_file_url = ""
            if resume:
                fp = resume.get("file_path", "")
                if fp:
                    resume_file_url = "/" + fp.replace("\\", "/")

            ai_score = normalize_score(match_result["overall_score"])
            ai_feedback = match_result["recommendation"]
            breakdown = match_result.get("breakdown", {})
            zone = match_result.get("zone", "")

            # Application document — same as routes/job.py apply_job (L810-830)
            app_doc = {
                "cover_letter": None,
                "portfolio_url": None,
                "available_start_date": None,
                "application_code": generate_unique_id("APP"),
                "job_id": job_id,
                "job_title": job.get("title", "Unknown"),
                "company_name": job.get("company_name", "Unknown"),
                "student_id": user_id,
                "student_name": user.get("full_name", user.get("username", "Unknown")),
                "student_email": user.get("email", ""),
                "resume_data": resume_features,
                "resume_file_url": resume_file_url,
                "status": "pending",
                "ai_score": ai_score,
                "ai_feedback": ai_feedback,
                "matching_breakdown": breakdown,
                "matching_zone": zone,
                "submitted_at": now,
            }

            result = await db.applications.insert_one(app_doc)

            # Increment applications_count on job
            await db.jobs.update_one(
                {"_id": job["_id"]},
                {"$inc": {"applications_count": 1}},
            )

            app_records.append({
                "app_id": result.inserted_id,
                "job": job,
                "ai_score": ai_score,
                "breakdown": breakdown,
            })

            total_applications += 1
            score_pct = match_result["overall_score"]
            print(f"    [OK] {job['title']} — {score_pct:.1f}% ({zone})")

    print(f"\n  → Total applications created: {total_applications}\n")

    # =================================================================
    # STEP 5 — Simulate HR Decisions
    # =================================================================
    print(f"{'='*60}")
    print(f"🤝 STEP 5: Simulating HR decisions...")
    print(f"{'='*60}")

    accepted_count = 0
    rejected_count = 0

    for rec in app_records:
        app_id = rec["app_id"]
        job = rec["job"]
        ai_score = rec["ai_score"]
        breakdown = rec["breakdown"]

        # Simulate decision
        decision = simulate_hr_decision(ai_score, breakdown)

        if decision == "accepted":
            reason = random.choice(ACCEPT_REASONS)
            accepted_count += 1
        else:
            reason = random.choice(REJECT_REASONS)
            rejected_count += 1

        # Find the HR user who owns this job's company
        hr_user = await db.users.find_one({
            "user_type": "HR",
            "company_id": ObjectId(job["company_id"]) if ObjectId.is_valid(job.get("company_id", "")) else None,
        })
        # Fallback: try by created_by
        if not hr_user:
            hr_user = await db.users.find_one({"_id": ObjectId(job["created_by"])}) if ObjectId.is_valid(job.get("created_by", "")) else None

        decided_by = str(hr_user["_id"]) if hr_user else "seed_script"

        # Update application — same fields as routes/job.py update_application_status
        update_data = {
            "status": decision,
            "hr_decision": decision,
            "hr_reason": reason,
            "decided_at": datetime.utcnow(),
            "decided_by": decided_by,
            "ai_score_at_decision": ai_score,
        }

        # ai_breakdown_at_decision — use matching_breakdown
        if breakdown:
            update_data["ai_breakdown_at_decision"] = breakdown

        await db.applications.update_one(
            {"_id": app_id},
            {"$set": update_data},
        )

    total_decided = accepted_count + rejected_count
    print(f"  Accepted: {accepted_count}")
    print(f"  Rejected: {rejected_count}")
    if total_decided > 0:
        print(f"  Balance:  {accepted_count/total_decided*100:.1f}% / {rejected_count/total_decided*100:.1f}%")
    print()

    # =================================================================
    # STEP 6 — Summary
    # =================================================================
    print("=" * 60)
    print("✅ [DONE] Seeding Complete!")
    print("=" * 60)
    print(f"  Students:      {len(STUDENTS)} accounts")
    print(f"  Resumes:       {created_resumes} uploaded + AI extracted")
    print(f"  Applications:  {total_applications} created")
    print(f"  HR Decisions:  {total_decided} ({accepted_count} accepted, {rejected_count} rejected)")
    print()
    if total_decided > 0:
        print(f"  Class Balance:")
        print(f"    Accepted: {accepted_count/total_decided*100:.1f}% ({accepted_count})")
        print(f"    Rejected: {rejected_count/total_decided*100:.1f}% ({rejected_count})")
    print()
    print("  Ready for XGBoost training!")
    print("  Run: python backend/scripts/train_xgboost.py")
    print("=" * 60)

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
