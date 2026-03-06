"""
Reset Applications Script
- ลบ applications เก่าทั้งหมด (72 ใบ)
- สมัครใหม่โดยคละนักศึกษา-ตำแหน่งงาน
- คำนวณ score ใหม่ด้วย Dynamic Weights

Usage: python reset_applications.py
"""
import random
import sys
from datetime import datetime, timedelta

from bson import ObjectId
from pymongo import MongoClient

# Direct import to avoid services/__init__.py pulling in all dependencies
sys.path.insert(0, ".")
import importlib
matching_module = importlib.import_module("services.matching_service")
MatchingService = matching_module.MatchingService

MONGO_URL = (
    "mongodb+srv://rakeiei244:rakeiei2444@resume-screening.knyxpww.mongodb.net"
    "/ai_resume_screening?retryWrites=true&w=majority"
    "&ssl=true&tlsAllowInvalidCertificates=true"
)

JOBS_PER_STUDENT = 5  # แต่ละคนสมัคร 5 ตำแหน่ง


def generate_app_code():
    import uuid
    return f"APP-{uuid.uuid4().hex[:8].upper()}"


def convert_job_to_requirements(job):
    """Convert job document to requirements dict for MatchingService."""
    return {
        "title": job.get("title", ""),
        "description": job.get("description", ""),
        "skills_required": job.get("skills_required", []),
        "major_required": job.get("major_required", ""),
        "min_gpa": job.get("min_gpa", 0),
        "min_experience_months": job.get("min_experience_months", 0),
        "required_certifications": job.get("required_certifications", []),
        "preferred_certifications": job.get("preferred_certifications", []),
    }


def get_resume_features(resume_doc):
    """Extract features from resume document for matching."""
    ai = resume_doc.get("ai_analysis", {})
    return {
        "education": ai.get("education", {}),
        "skills": ai.get("skills", {}),
        "projects": ai.get("projects", []),
        "experience_months": ai.get("experience_months", ai.get("total_experience_months", 0)),
        "certifications": ai.get("certifications", []),
        "languages": ai.get("languages", []),
    }


def main():
    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=15000)
    db = client["ai_resume_screening"]
    db.command("ping")
    print("Connected!\n")

    # Load all jobs and resumes
    jobs = list(db.jobs.find({}))
    resumes = list(db.resumes.find({"status": "processed"}))

    print(f"Jobs: {len(jobs)}")
    print(f"Resumes (processed): {len(resumes)}")

    if not jobs or not resumes:
        print("ERROR: No jobs or resumes found")
        return

    # Step 1: Delete old applications
    old_count = db.applications.count_documents({})
    print(f"\nDeleting {old_count} old applications...")
    db.applications.delete_many({})

    # Reset applications_count on all jobs
    db.jobs.update_many({}, {"$set": {"applications_count": 0}})
    print("Cleared!")

    # Step 2: Initialize MatchingService (without SBERT for speed)
    print("\nInitializing MatchingService...")
    matcher = MatchingService()

    # Step 3: For each resume, apply to random jobs (mixed)
    new_apps = []
    random.seed(42)  # Reproducible

    for resume in resumes:
        user_id = resume.get("user_id", "")
        user = db.users.find_one({"_id": ObjectId(user_id)}) if ObjectId.is_valid(user_id) else None
        if not user:
            continue

        student_name = user.get("full_name", user.get("username", "Unknown"))
        student_email = user.get("email", "")
        resume_features = get_resume_features(resume)

        # Get resume file URL
        fp = resume.get("file_path", "")
        resume_file_url = ("/" + fp.replace("\\", "/")) if fp else ""

        # Randomly select JOBS_PER_STUDENT jobs for this student
        selected_jobs = random.sample(jobs, min(JOBS_PER_STUDENT, len(jobs)))

        for job in selected_jobs:
            job_requirements = convert_job_to_requirements(job)
            match_result = matcher.calculate_match(resume_features, job_requirements)

            overall = match_result["overall_score"]
            # Normalize to 0-1 for consistency
            ai_score = round(overall / 100, 4) if overall > 1 else round(overall, 4)

            app_doc = {
                "application_code": generate_app_code(),
                "job_id": str(job["_id"]),
                "job_title": job.get("title", ""),
                "company_name": job.get("company_name", ""),
                "student_id": user_id,
                "student_name": student_name,
                "student_email": student_email,
                "resume_data": resume_features,
                "resume_file_url": resume_file_url,
                "status": "pending",
                "ai_score": ai_score,
                "ai_feedback": match_result.get("recommendation", ""),
                "matching_breakdown": match_result.get("breakdown", {}),
                "matching_zone": match_result.get("zone", ""),
                "weights_used": match_result.get("weights_used", {}),
                "job_category": match_result.get("job_category", "default"),
                "submitted_at": datetime.utcnow() - timedelta(days=random.randint(0, 7)),
            }

            new_apps.append(app_doc)

        print(f"  {student_name}: {len(selected_jobs)} jobs assigned")

    # Step 4: Insert all new applications
    if new_apps:
        db.applications.insert_many(new_apps)

        # Update applications_count per job
        for job in jobs:
            count = sum(1 for a in new_apps if a["job_id"] == str(job["_id"]))
            if count > 0:
                db.jobs.update_one(
                    {"_id": job["_id"]},
                    {"$set": {"applications_count": count}}
                )

    print(f"\nDone! Created {len(new_apps)} new applications")
    print(f"({len(resumes)} students x {JOBS_PER_STUDENT} jobs each)")

    # Summary by job category
    categories = {}
    for app in new_apps:
        cat = app.get("job_category", "default")
        categories[cat] = categories.get(cat, 0) + 1

    print(f"\nBy job category:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count} applications")

    client.close()


if __name__ == "__main__":
    main()
