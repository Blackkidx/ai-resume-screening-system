# -*- coding: utf-8 -*-
"""
Seed New Students (Batch 2)
Create 9 new student accounts + upload Resume/CV via real AI Pipeline
+ apply to ALL open jobs (pending) — for HR to accept/reject

Usage:
    python backend/scripts/seed_new_students.py
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

def hash_password(password: str) -> str:
    password_sha = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(password_sha)

def generate_unique_id(prefix: str = "ID") -> str:
    year = datetime.utcnow().year
    random_part = str(uuid.uuid4())[:8].upper()
    return f"{prefix}-{year}-{random_part}"

RESUME_SOURCE_DIR = PROJECT_ROOT / "resume test"
UPLOAD_FOLDER = BACKEND_DIR / "uploads" / "resumes"
STUDENT_PASSWORD = "student123"

# 9 new students
NEW_STUDENTS = [
    {"username": "chiranat",   "email": "chiranat@student.example.com",   "full_name": "Chiranat",       "first_name": "Chiranat",   "last_name": "",   "pdf": "resume - Chiranat.pdf"},
    {"username": "chonticha",  "email": "chonticha@student.example.com",  "full_name": "Chonticha",      "first_name": "Chonticha",  "last_name": "",   "pdf": "Resume - chonticha.pdf"},
    {"username": "lada",       "email": "lada@student.example.com",       "full_name": "Lada",           "first_name": "Lada",       "last_name": "",   "pdf": "Resume - Lada.pdf"},
    {"username": "natthaphat", "email": "natthaphat@student.example.com", "full_name": "Natthaphat",     "first_name": "Natthaphat", "last_name": "",   "pdf": "resume - natthaphat.pdf"},
    {"username": "choklap",    "email": "choklap@student.example.com",    "full_name": "Choklap",        "first_name": "Choklap",    "last_name": "",   "pdf": "Resume-\u0e42\u0e0a\u0e04\u0e25\u0e32\u0e20-Choklap.pdf"},
    {"username": "jenwat",     "email": "jenwat@student.example.com",     "full_name": "Jenwat",         "first_name": "Jenwat",     "last_name": "",   "pdf": "Resume_Jenwat.pdf"},
    {"username": "apisit",     "email": "apisit@student.example.com",     "full_name": "Apisit Tekijnda","first_name": "Apisit",     "last_name": "Tekijnda","pdf": "resume-Apisit Tekijnda.pdf"},
    {"username": "saksit",     "email": "saksit@student.example.com",     "full_name": "Saksit",         "first_name": "Saksit",     "last_name": "",   "pdf": "resume-saksit.pdf"},
    {"username": "piruntam",   "email": "piruntam@student.example.com",   "full_name": "Piruntam S.",    "first_name": "Piruntam",   "last_name": "S.", "pdf": "CV_Piruntam_2026_NETWORK SECURITY - Piruntam S.pdf"},
]


def convert_job_to_requirements(job: dict) -> dict:
    majors = job.get("majors", [])
    major_required = ""
    if majors and majors[0] != "\u0e17\u0e38\u0e01\u0e2a\u0e32\u0e02\u0e32":
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


async def seed():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "ai_resume_screening")

    print("=" * 60)
    print(" SEED NEW STUDENTS (Batch 2) — 9 new resumes")
    print("=" * 60)

    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)
    db = client[db_name]

    try:
        await client.admin.command("ping")
        print(f"[OK] Connected to {db_name}\n")
    except Exception as exc:
        print(f"[ERROR] Cannot connect: {exc}")
        sys.exit(1)

    now = datetime.utcnow()

    print("[INFO] Initializing AI services...")
    pdf_extractor = PDFExtractor()
    llm_service = LLMService()
    matching_service = MatchingService()
    xgb_service = XGBoostService.get_instance()

    if llm_service.is_ready():
        print("[OK] LLM Service (Groq) ready")
    else:
        print("[WARN] LLM Service NOT ready")

    print(f"[INFO] XGBoost model: {'loaded' if xgb_service.model else 'not loaded'}\n")

    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

    hashed_pw = hash_password(STUDENT_PASSWORD)
    student_role = await db.user_roles.find_one({"role_name": "Student"})

    # ===== STEP 1: Create student accounts =====
    print(f"{'='*60}")
    print(f" STEP 1: Creating {len(NEW_STUDENTS)} student accounts...")
    print(f"{'='*60}")

    student_ids = {}
    created = 0

    for s in NEW_STUDENTS:
        existing = await db.users.find_one({"username": s["username"]})
        if existing:
            print(f"  [SKIP] {s['username']} (exists)")
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
        created += 1

        if student_role:
            await db.user_role_assignments.insert_one({
                "user_id": user_oid,
                "role_id": student_role["_id"],
                "role_name": "Student",
                "assigned_at": now,
                "assigned_by": "seed_script",
            })

        print(f"  [OK] {s['username']} ({s['full_name']})")

    print(f"\n  -> Created: {created}, Skipped: {len(NEW_STUDENTS) - created}\n")

    # ===== STEP 2: Upload Resumes =====
    print(f"{'='*60}")
    print(f" STEP 2: Uploading resumes via AI pipeline...")
    print(f"{'='*60}")

    resume_data_map = {}  # username -> extracted_features
    created_resumes = 0

    for s in NEW_STUDENTS:
        username = s["username"]
        pdf_filename = s["pdf"]
        user_id = student_ids.get(username)
        if not user_id:
            continue

        existing_resume = await db.resumes.find_one({"user_id": user_id})
        if existing_resume:
            print(f"  [SKIP] {username} — resume exists")
            resume_data_map[username] = existing_resume.get("extracted_features") or {}
            continue

        source_path = RESUME_SOURCE_DIR / pdf_filename
        if not source_path.exists():
            print(f"  [ERROR] {pdf_filename} not found")
            continue

        unique_filename = f"{user_id}_{uuid.uuid4()}.pdf"
        dest_path = UPLOAD_FOLDER / unique_filename
        shutil.copy2(str(source_path), str(dest_path))

        file_size = source_path.stat().st_size
        file_path_rel = f"uploads/resumes/{unique_filename}"

        # Extract text
        print(f"  [{username}] Extracting text...", end=" ")
        extracted_text, method = pdf_extractor.extract_text(str(source_path))

        if not extracted_text or method == "failed":
            print(f"FAILED (OCR not supported)")
            resume_doc = {
                "user_id": user_id, "file_name": pdf_filename,
                "file_path": file_path_rel, "file_type": "pdf",
                "file_size": file_size, "extracted_text": "",
                "extracted_features": None, "uploaded_at": now,
                "processed_at": None, "status": "ocr_not_supported",
                "error_message": "PDF scan - OCR not supported",
            }
            await db.resumes.insert_one(resume_doc)
            continue

        print(f"OK ({len(extracted_text)} chars)")

        # LLM analysis
        extracted_features = None
        if llm_service.is_ready():
            print(f"  [{username}] AI analyzing...", end=" ")
            try:
                extracted_features = llm_service.extract_features(extracted_text)
                if extracted_features and "extraction_error" in extracted_features:
                    if not extracted_features["extraction_error"]:
                        del extracted_features["extraction_error"]
                print("OK")
            except Exception as e:
                print(f"ERROR: {e}")
                extracted_features = {"error": str(e)}
            time.sleep(2)

        resume_doc = {
            "user_id": user_id, "file_name": pdf_filename,
            "file_path": file_path_rel, "file_type": "pdf",
            "file_size": file_size, "extracted_text": extracted_text,
            "extracted_features": extracted_features, "uploaded_at": now,
            "processed_at": datetime.utcnow(), "status": "processed",
        }
        await db.resumes.insert_one(resume_doc)
        resume_data_map[username] = extracted_features or {}
        created_resumes += 1

    print(f"\n  -> Resumes created: {created_resumes}\n")

    # ===== STEP 3: Apply to ALL open jobs =====
    print(f"{'='*60}")
    print(f" STEP 3: Applying to ALL open jobs (pending)...")
    print(f"{'='*60}")

    jobs = await db.jobs.find({"is_active": True}).to_list(length=100)
    if not jobs:
        print("  [ERROR] No active jobs found!")
        client.close()
        return

    print(f"  Found {len(jobs)} active jobs\n")

    total_apps = 0
    for s in NEW_STUDENTS:
        username = s["username"]
        user_id = student_ids.get(username)
        if not user_id:
            continue

        resume_features = resume_data_map.get(username, {})
        if not resume_features or "error" in resume_features:
            print(f"  [{username}] No features — skipping applications")
            continue

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        resume = await db.resumes.find_one({"user_id": user_id})
        if not user or not resume:
            continue

        resume_file_url = ""
        fp = resume.get("file_path", "")
        if fp:
            resume_file_url = "/" + fp.replace("\\", "/")

        print(f"  [{username}] Applying to {len(jobs)} jobs:")

        for job in jobs:
            job_id = str(job["_id"])

            existing_app = await db.applications.find_one({
                "job_id": job_id, "student_id": user_id
            })
            if existing_app:
                print(f"    [SKIP] {job['title']} (already applied)")
                continue

            # Calculate AI match
            job_requirements = convert_job_to_requirements(job)
            match_result = matching_service.calculate_ai_match(resume_features, job_requirements)

            # Use XGBoost score if available
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
                "status": "pending",
                "ai_score": ai_score,
                "ai_method": ai_method,
                "ai_feedback": match_result.get("recommendation", ""),
                "matching_breakdown": breakdown,
                "matching_zone": zone,
                "xgboost_score": xgb_score,
                "xgboost_decision": xgb_decision,
                "xgboost_probability": xgb_prob,
                "submitted_at": now,
            }

            await db.applications.insert_one(app_doc)
            await db.jobs.update_one({"_id": job["_id"]}, {"$inc": {"applications_count": 1}})

            total_apps += 1
            score_pct = ai_score * 100
            print(f"    [OK] {job['title']} — {score_pct:.1f}% ({ai_method})")

    # ===== Summary =====
    print(f"\n{'='*60}")
    print(f"[DONE] Seeding Complete!")
    print(f"{'='*60}")
    print(f"  Students:      {created} new accounts (password: {STUDENT_PASSWORD})")
    print(f"  Resumes:       {created_resumes} uploaded + AI extracted")
    print(f"  Applications:  {total_apps} created (ALL pending)")
    print(f"  -> HR can now login and accept/reject to train AI!")
    print(f"{'='*60}")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
