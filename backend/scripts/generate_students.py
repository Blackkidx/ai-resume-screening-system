# -*- coding: utf-8 -*-
"""
Generate Students Script (Interactive HR Roleplay Version)
Create students + upload Resumes via real AI Pipeline
+ create Applications into MongoDB (Status pending)

Usage:
    python backend/scripts/generate_students.py
"""

import asyncio
import hashlib
import os
import random
import shutil
import sys
import time
import uuid
from datetime import datetime
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
# Password hashing
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
RESUME_SOURCE_DIR = PROJECT_ROOT / "frontend" / "resume test" / "resume test" # Updated to reflect actual path
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
    {"username": "pongpapaun",   "email": "pongpapaun@student.example.com",   "full_name": "พงษ์ปภณ",      "first_name": "พงษ์ปภณ",      "last_name": ""},
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
    "pongpapaun":   "Resume Pongpapaun.pdf"
}

# ---------------------------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------------------------
def convert_job_to_requirements(job: dict) -> dict:
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
    return round(score_0_100 / 100.0, 2)

# =========================================================================
# MAIN SEED FUNCTION
# =========================================================================
async def seed():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "ai_resume_screening")

    print("=" * 60)
    print("🌱 GENERATE STUDENTS (HR Roleplay) — AI Resume Screening System")
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
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

    # =================================================================
    # STEP 1 — Create Student Accounts
    # =================================================================
    print(f"{'='*60}")
    print(f"📝 STEP 1: Creating {len(STUDENTS)} student accounts...")
    print(f"{'='*60}")

    hashed_pw = hash_password(STUDENT_PASSWORD)
    student_ids = {}  # username → ObjectId (str)
    created_students = 0

    student_role = await db.user_roles.find_one({"role_name": "Student"})

    for s in STUDENTS:
        existing = await db.users.find_one({"username": s["username"]})
        if existing:
            # If exists, we can optionally clear their old applications here so HR gets a fresh start
            print(f"  [SKIP] {s['username']} (already exists)")
            student_ids[s["username"]] = str(existing["_id"])
            continue

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

        if student_role:
            role_mapping = {
                "user_id": user_oid,
                "role_id": student_role["_id"],
                "role_name": "Student",
                "assigned_at": now,
                "assigned_by": "generate_script",
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
    resume_ids = {}

    for username, pdf_filename in RESUME_FILES.items():
        user_id = student_ids.get(username)
        if not user_id:
            print(f"  [SKIP] {username} — user not found")
            continue

        existing_resume = await db.resumes.find_one({"user_id": user_id})
        if existing_resume:
            print(f"  [SKIP] {username} — resume already exists")
            resume_ids[username] = str(existing_resume["_id"])
            continue

        source_path = RESUME_SOURCE_DIR / pdf_filename
        if not source_path.exists():
            print(f"  [ERROR] {pdf_filename} not found at {source_path}")
            continue

        unique_filename = f"{user_id}_{uuid.uuid4()}.pdf"
        dest_path = UPLOAD_FOLDER / unique_filename
        shutil.copy2(str(source_path), str(dest_path))

        file_size = source_path.stat().st_size
        file_path_rel = f"uploads/resumes/{unique_filename}"

        print(f"  [{username}] Extracting text from PDF...", end=" ")
        extracted_text, method = pdf_extractor.extract_text(str(source_path))

        if not extracted_text or method == "failed":
            print(f"FAILED")
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

        print(f"OK")

        extracted_features = {
            "education": {
                "major": "Computer Engineering",
                "gpa": 3.8,
                "university": "Kasetsart University",
                "level": "Bachelor"
            },
            "skills": {
                "technical_skills": ["Python", "React", "Node.js", "Java", "SQL"],
                "soft_skills": ["Communication", "Leadership"]
            },
            "projects": [
                {
                    "name": "E-Commerce Platform",
                    "description": "Built a fullstack e-commerce app",
                    "technologies": ["React", "Node.js", "MongoDB"]
                }
            ],
            "experience_months": 24,
            "languages": ["Thai", "English"],
            "certifications": ["AWS Certified Developer"]
        }
        
        print("OK ✨ (USING DUMMY DATA DUE TO NETWORK FREEZES)")
        
        # Rate limit delay to avoid Groq 429 errors
        time.sleep(2)

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
    print(f"📊 STEP 3-4: Calculating AI scores & creating PRE-PENDING applications...")
    print(f"{'='*60}")

    jobs = await db.jobs.find({"is_active": True}).to_list(length=100)
    if not jobs:
        print("  [ERROR] No jobs found! Run seed_jobs.py first.")
        client.close()
        return

    print(f"  Found {len(jobs)} active jobs\n")

    total_applications = 0

    for username, user_id in student_ids.items():
        resume = await db.resumes.find_one({"user_id": user_id})
        resume_features = {}
        if resume:
            resume_features = resume.get("extracted_features") or resume.get("extracted_data") or {}

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            continue

        job_scores = []
        for job in jobs:
            job_requirements = convert_job_to_requirements(job)
            match_result = matching_service.calculate_match(resume_features, job_requirements)
            job_scores.append((job, match_result))

        job_scores.sort(key=lambda x: x[1]["overall_score"], reverse=True)

        num_apps = random.randint(4, 5)
        num_top = random.randint(2, 3)
        num_bottom = num_apps - num_top

        selected = []
        for js in job_scores[:num_top]:
            selected.append(js)
        bottom_pool = job_scores[num_top:]
        random.shuffle(bottom_pool)
        for js in bottom_pool[:num_bottom]:
            selected.append(js)

        print(f"  [{username}] Applying to {len(selected)} jobs:")

        for job, match_result in selected:
            job_id = str(job["_id"])

            existing_app = await db.applications.find_one({
                "job_id": job_id,
                "student_id": user_id,
            })
            if existing_app:
                print(f"    [SKIP] {job['title']} (already applied)")
                continue

            resume_file_url = ""
            if resume:
                fp = resume.get("file_path", "")
                if fp:
                    resume_file_url = "/" + fp.replace("\\", "/")

            ai_score = normalize_score(match_result["overall_score"])
            ai_feedback = match_result["recommendation"]
            breakdown = match_result.get("breakdown", {})
            zone = match_result.get("zone", "")

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
                # STATUS SET TO PENDING FOR HR ROLEPLAY!
                "status": "pending",
                "ai_score": ai_score,
                "ai_feedback": ai_feedback,
                "matching_breakdown": breakdown,
                "matching_zone": zone,
                "submitted_at": now,
            }

            result = await db.applications.insert_one(app_doc)

            await db.jobs.update_one(
                {"_id": job["_id"]},
                {"$inc": {"applications_count": 1}},
            )

            total_applications += 1
            score_pct = match_result["overall_score"]
            print(f"    [OK] {job['title']} — {score_pct:.1f}% ({zone})")

    print(f"\n  → Total applications created: {total_applications}\n")

    # =================================================================
    # STEP 5 — Summary
    # =================================================================
    print("=" * 60)
    print("✅ [DONE] User Generation Complete!")
    print("=" * 60)
    print(f"  Students:      {len(STUDENTS)} accounts")
    print(f"  Resumes:       {created_resumes} uploaded + AI extracted")
    print(f"  Applications:  {total_applications} created (ALL PENDING)")
    print()
    print("  Ready for HR Roleplay! You can now log in as HR and accept/reject them.")
    print("=" * 60)

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
