# -*- coding: utf-8 -*-
"""
🧪 Full Resume-Job Matrix Report
Every student × every job → XGBoost score + decision + HR comparison
"""
import asyncio, json, os, sys
from collections import defaultdict
from pathlib import Path
from datetime import datetime

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import motor.motor_asyncio
import numpy as np
from bson import ObjectId


async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DATABASE_NAME", "ai_resume_screening")]

    # Load services
    from services.matching_service import MatchingService
    from services.xgboost_service import XGBoostService
    from routes.job import convert_job_to_requirements

    matcher = MatchingService()
    xgb_svc = XGBoostService.get_instance()

    print("=" * 90)
    print("  🧪 Full Resume-Job Matching Matrix Report")
    print(f"  📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 90)

    # Get all active jobs
    jobs = await db.jobs.find({"is_active": True}).to_list(100)
    print(f"\n  Active jobs: {len(jobs)}")

    # Get all students with resumes
    students = await db.users.find({"user_type": "Student"}).to_list(200)
    print(f"  Students: {len(students)}")

    # Pre-load resume data for each student
    student_data = []
    for stu in students:
        uid = str(stu["_id"])
        features = None

        # Try 1: extracted_features from resumes collection
        resume = await db.resumes.find_one(
            {"user_id": uid, "status": "processed"},
            sort=[("created_at", -1)]
        )
        if resume and resume.get("extracted_features"):
            features = resume["extracted_features"]

        # Try 2: resume_data from most recent application
        if not features:
            app = await db.applications.find_one(
                {"student_id": uid, "resume_data": {"$exists": True, "$ne": {}}},
                sort=[("submitted_at", -1)]
            )
            if app and app.get("resume_data"):
                features = app["resume_data"]

        if not features:
            continue

        student_data.append({
            "id": uid,
            "name": stu.get("full_name", stu.get("username", "Unknown")),
            "username": stu.get("username", ""),
            "features": features,
        })

    print(f"  Students with processed resumes: {len(student_data)}")

    # Pre-load all HR decisions for comparison
    all_apps = await db.applications.find(
        {"hr_decision": {"$in": ["accepted", "rejected"]}},
    ).to_list(1000)
    hr_decisions = {}
    for app in all_apps:
        key = f"{app.get('student_id')}_{app.get('job_id')}"
        hr_decisions[key] = app.get("hr_decision")

    # Also get pending apps
    pending_apps = await db.applications.find({"status": "pending"}).to_list(1000)
    for app in pending_apps:
        key = f"{app.get('student_id')}_{app.get('job_id')}"
        if key not in hr_decisions:
            hr_decisions[key] = "pending"

    # Build matrix
    report_rows = []
    job_headers = []
    for job in sorted(jobs, key=lambda j: (j.get("company_name", ""), j.get("title", ""))):
        company = job.get("company_name", "Unknown")
        title = job.get("title", "Unknown")
        job_headers.append({"id": str(job["_id"]), "title": title, "company": company})

    for stu in sorted(student_data, key=lambda s: s["name"]):
        row = {"student": stu["name"], "username": stu["username"], "jobs": []}
        for jh in job_headers:
            job_doc = next(j for j in jobs if str(j["_id"]) == jh["id"])
            job_req = convert_job_to_requirements(job_doc)

            # XGBoost features + prediction
            xgb_features = matcher.extract_xgboost_features(stu["features"], job_req)
            xgb_result = xgb_svc.predict(xgb_features)

            # Rule-based score
            rule_result = matcher.calculate_match(stu["features"], job_req)

            xgb_score = xgb_result.get("xgboost_score", 0)
            xgb_decision = xgb_result.get("xgboost_decision", "N/A")
            rule_score = rule_result.get("overall_score", 0)
            zone = rule_result.get("zone", "")

            # HR decision
            key = f"{stu['id']}_{jh['id']}"
            hr = hr_decisions.get(key, "-")

            row["jobs"].append({
                "job_id": jh["id"],
                "xgb_score": round(xgb_score, 1),
                "xgb_decision": xgb_decision,
                "rule_score": round(rule_score, 1),
                "zone": zone,
                "hr_decision": hr,
            })
        report_rows.append(row)

    # ============================================================
    # PRINT: Per-Student View
    # ============================================================
    print(f"\n{'=' * 90}")
    print(f"  📋 PER-STUDENT REPORT")
    print(f"{'=' * 90}")

    overall_correct = 0
    overall_total = 0

    for row in report_rows:
        print(f"\n  👤 {row['student']} (@{row['username']})")
        print(f"     {'Job':<38s} {'XGB':>5s} {'Decision':>9s} {'Rule':>5s} {'Zone':>6s} {'HR':>9s} {'Match':>5s}")
        print(f"     {'─'*80}")

        top_jobs = sorted(row["jobs"], key=lambda x: x["xgb_score"], reverse=True)
        for j in top_jobs:
            jh = next(h for h in job_headers if h["id"] == j["job_id"])
            label = f"{jh['company'][:15]} — {jh['title'][:20]}"

            hr_str = j["hr_decision"]
            match_str = ""
            if hr_str in ["accepted", "rejected"]:
                correct = (j["xgb_decision"] == hr_str)
                match_str = "✅" if correct else "❌"
                overall_total += 1
                if correct:
                    overall_correct += 1

            zone_icon = {"green": "🟢", "yellow": "🟡", "red": "🔴"}.get(j["zone"], "⚪")

            print(f"     {label:<38s} {j['xgb_score']:>4.0f}% {j['xgb_decision']:>9s} {j['rule_score']:>4.0f}% {zone_icon:>5s} {hr_str:>9s} {match_str:>5s}")

    # ============================================================
    # MATRIX VIEW (compact)
    # ============================================================
    print(f"\n{'=' * 90}")
    print(f"  📊 SCORE MATRIX (XGBoost %)")
    print(f"{'=' * 90}")

    # Short job labels
    short_labels = []
    for jh in job_headers:
        short = jh["title"].replace(" Intern", "").replace("Developer", "Dev").replace("Engineer", "Eng")[:12]
        short_labels.append(short)

    # Header
    header = f"  {'Student':<16s}"
    for sl in short_labels:
        header += f" {sl:>12s}"
    header += f" {'Best Match':>14s}"
    print(header)
    print(f"  {'─'*16}" + "─" * (13 * len(short_labels)) + "─" * 15)

    for row in report_rows:
        line = f"  {row['student'][:15]:<16s}"
        best_score = 0
        best_job = ""
        for i, j in enumerate(row["jobs"]):
            score = j["xgb_score"]
            if score > best_score:
                best_score = score
                best_job = short_labels[i]

            # Color coding based on decision
            if j["hr_decision"] == "accepted":
                mark = f"{score:>4.0f}%✅"
            elif j["hr_decision"] == "rejected":
                mark = f"{score:>4.0f}%❌"
            elif j["hr_decision"] == "pending":
                mark = f"{score:>4.0f}%⏳"
            else:
                mark = f"{score:>4.0f}%  "
            line += f" {mark:>12s}"
        line += f" {best_job:>14s}"
        print(line)

    # ============================================================
    # SUMMARY STATS
    # ============================================================
    print(f"\n{'=' * 90}")
    print(f"  📊 SUMMARY")
    print(f"{'=' * 90}")

    if overall_total > 0:
        print(f"\n  Model vs HR Agreement: {overall_correct}/{overall_total} ({overall_correct/overall_total:.1%})")

    # Top 3 candidates per job
    print(f"\n  🏆 TOP 3 CANDIDATES PER JOB (by XGBoost Score):")
    print(f"  {'─'*80}")
    for jh in job_headers:
        scores = []
        for row in report_rows:
            j = next(x for x in row["jobs"] if x["job_id"] == jh["id"])
            scores.append({"student": row["student"], "score": j["xgb_score"], "decision": j["xgb_decision"], "hr": j["hr_decision"]})
        top3 = sorted(scores, key=lambda x: x["score"], reverse=True)[:3]
        print(f"\n  📌 {jh['company']} — {jh['title']}")
        for rank, s in enumerate(top3, 1):
            hr_mark = {"accepted": "✅HR", "rejected": "❌HR", "pending": "⏳", "-": ""}.get(s["hr"], "")
            print(f"     {rank}. {s['student']:<20s} {s['score']:>5.1f}% ({s['decision']}) {hr_mark}")

    # Save JSON report
    report_path = Path(__file__).resolve().parent.parent / "models" / "resume_job_matrix.json"
    json_report = {
        "generated_at": datetime.now().isoformat(),
        "students": len(student_data),
        "jobs": len(job_headers),
        "job_headers": job_headers,
        "matrix": [
            {
                "student": row["student"],
                "username": row["username"],
                "jobs": row["jobs"],
            }
            for row in report_rows
        ],
        "overall_accuracy": round(overall_correct / overall_total, 4) if overall_total > 0 else None,
    }
    report_path.write_text(json.dumps(json_report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n  💾 JSON saved: {report_path.name}")
    print(f"{'=' * 90}")

    client.close()


asyncio.run(main())
