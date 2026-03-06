# -*- coding: utf-8 -*-
"""
🧪 XGBoost Model Accuracy Test — Real Resume Validation
Runs retrained model on ALL HR-decided applications and compares predictions vs actual decisions.
Outputs per-record results + aggregated metrics.
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

FEATURE_NAMES = [
    "skills_match_ratio", "skills_match_count", "total_skills",
    "major_match_score", "relevant_projects", "total_projects",
    "gpa_value", "has_gpa", "has_relevant_exp", "has_cert",
    "soft_skills_count", "resume_completeness",
    "gpa_below_min", "cert_job_relevance", "gpa_gap",
    "skill_focus_ratio",
]

THRESHOLD = 0.50


async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DATABASE_NAME", "ai_resume_screening")]

    # Load retrained model
    from xgboost import XGBClassifier
    model_path = Path(__file__).resolve().parent.parent / "models" / "xgboost_model.json"
    meta_path = Path(__file__).resolve().parent.parent / "models" / "xgboost_metadata.json"

    model = XGBClassifier()
    model.load_model(str(model_path))
    meta = json.loads(meta_path.read_text(encoding="utf-8"))

    print("=" * 80)
    print(f"  🧪 XGBoost Model Accuracy Test — Real Resume Validation")
    print(f"  📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  🤖 Model: v{meta.get('model_version','?')} | Trained: {meta.get('trained_at','?')[:19]}")
    print(f"  🎯 Threshold: {THRESHOLD}")
    print("=" * 80)

    # Load ALL decided applications with features
    apps = await db.applications.find(
        {"hr_decision": {"$in": ["accepted", "rejected"]}},
        {
            "hr_decision": 1, "status": 1, "student_name": 1,
            "job_title": 1, "company_name": 1, "ai_score": 1,
            "resume_data": 1, "matching_breakdown": 1,
            "xgboost_features_at_decision": 1,
        }
    ).to_list(length=None)

    print(f"\n  Total applications with HR decisions: {len(apps)}")

    # Load matching service for feature re-extraction
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from services.matching_service import MatchingService
    matcher = MatchingService()

    # Cache job docs
    job_cache = {}

    results = []
    skipped = 0

    for app in apps:
        student = app.get("student_name", "Unknown")
        job_title = app.get("job_title", "Unknown")
        company = app.get("company_name", "Unknown")
        hr_decision = app["hr_decision"]
        actual_label = 1 if hr_decision == "accepted" else 0

        # Use pre-computed features if available
        xgb_features = app.get("xgboost_features_at_decision")

        if not xgb_features or not all(name in xgb_features for name in FEATURE_NAMES):
            # Fallback: re-extract from resume_data + matching_breakdown
            resume_data = app.get("resume_data", {})
            breakdown = app.get("matching_breakdown", {})
            if not resume_data and not breakdown:
                skipped += 1
                continue

            # Re-compute features from breakdown (simpler approach)
            skills_data = resume_data.get("skills", {})
            tech_skills = skills_data.get("technical_skills", [])
            soft_skills = skills_data.get("soft_skills", [])
            projects = resume_data.get("projects", [])
            education = resume_data.get("education", {})
            certs = resume_data.get("certifications", [])

            skills_score = breakdown.get("skills", 50.0)
            skills_match_ratio = skills_score / 100.0

            gpa_value = 0.0
            try:
                gpa_value = float(education.get("gpa", 0)) or 0.0
            except (ValueError, TypeError):
                pass

            exp_months = resume_data.get("experience_months", 0) or 0

            xgb_features = {
                "skills_match_ratio": round(skills_match_ratio, 4),
                "skills_match_count": max(1, int(skills_match_ratio * len(tech_skills))),
                "total_skills": len(tech_skills),
                "major_match_score": round(breakdown.get("major", 50.0) / 100.0, 2),
                "relevant_projects": min(len(projects), int(breakdown.get("projects", 30.0) / 35)),
                "total_projects": len(projects),
                "gpa_value": round(gpa_value, 2),
                "has_gpa": 1 if gpa_value > 0 else 0,
                "has_relevant_exp": 1 if exp_months > 0 else 0,
                "has_cert": 1 if certs else 0,
                "soft_skills_count": len(soft_skills),
                "resume_completeness": round(sum(1 for s in ["education", "skills", "projects", "certifications"] if resume_data.get(s)) / 4, 2),
                "gpa_below_min": 1 if gpa_value > 0 and gpa_value < 2.5 else 0,
                "cert_job_relevance": 0,
                "gpa_gap": round(gpa_value - 2.5, 2) if gpa_value > 0 else -2.5,
            }

        # Predict
        feature_array = np.array(
            [[float(xgb_features.get(name, 0.0)) for name in FEATURE_NAMES]]
        )
        probabilities = model.predict_proba(feature_array)[0]
        prob_accepted = float(probabilities[1])
        predicted_label = 1 if prob_accepted >= THRESHOLD else 0
        predicted_decision = "accepted" if predicted_label == 1 else "rejected"
        confidence = max(prob_accepted, 1 - prob_accepted)

        correct = predicted_label == actual_label
        results.append({
            "student": student,
            "job": job_title,
            "company": company,
            "hr_decision": hr_decision,
            "model_decision": predicted_decision,
            "probability": round(prob_accepted, 4),
            "confidence": round(confidence, 4),
            "correct": correct,
            "actual_label": actual_label,
            "predicted_label": predicted_label,
        })

    if skipped > 0:
        print(f"  ⚠️ Skipped {skipped} (missing data)")

    # ============================================================
    # PER-RECORD RESULTS
    # ============================================================
    print(f"\n{'=' * 80}")
    print(f"  📋 PER-RECORD RESULTS ({len(results)} applications)")
    print(f"{'=' * 80}")

    # Group by company
    by_company = defaultdict(list)
    for r in results:
        by_company[r["company"]].append(r)

    for company, records in sorted(by_company.items()):
        print(f"\n  🏢 {company}")
        print(f"  {'Student':<22s} {'Job':<30s} {'HR':>8s} {'Model':>8s} {'Prob':>6s} {'':>4s}")
        print(f"  {'-'*78}")
        for r in sorted(records, key=lambda x: x["job"]):
            icon = "✅" if r["correct"] else "❌"
            print(f"  {r['student']:<22s} {r['job'][:29]:<30s} {r['hr_decision']:>8s} {r['model_decision']:>8s} {r['probability']:>5.1%} {icon:>4s}")

    # ============================================================
    # AGGREGATED METRICS
    # ============================================================
    total = len(results)
    correct_count = sum(1 for r in results if r["correct"])
    wrong_count = total - correct_count

    # Confusion matrix
    tp = sum(1 for r in results if r["actual_label"] == 1 and r["predicted_label"] == 1)
    tn = sum(1 for r in results if r["actual_label"] == 0 and r["predicted_label"] == 0)
    fp = sum(1 for r in results if r["actual_label"] == 0 and r["predicted_label"] == 1)
    fn = sum(1 for r in results if r["actual_label"] == 1 and r["predicted_label"] == 0)

    accuracy = correct_count / total if total > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0

    print(f"\n{'=' * 80}")
    print(f"  📊 AGGREGATED METRICS")
    print(f"{'=' * 80}")
    print(f"\n  Total Applications:  {total}")
    print(f"  Correct Predictions: {correct_count}")
    print(f"  Wrong Predictions:   {wrong_count}")
    print()
    print(f"  ┌────────────────────────────────────────┐")
    print(f"  │ Accuracy:    {accuracy:.1%} ({correct_count}/{total}){' ':>14s}│")
    print(f"  │ Precision:   {precision:.1%} (accepted ถูกจริง){' ':>5s}│")
    print(f"  │ Recall:      {recall:.1%} (หา accepted ได้ครบ){' ':>3s}│")
    print(f"  │ F1-Score:    {f1:.1%}{' ':>24s}│")
    print(f"  │ Specificity: {specificity:.1%} (rejected ถูกจริง){' ':>5s}│")
    print(f"  └────────────────────────────────────────┘")

    print(f"\n  📋 Confusion Matrix:")
    print(f"                    Predicted")
    print(f"                    Reject  Accept")
    print(f"  Actual Reject      {tn:>3d}     {fp:>3d}")
    print(f"  Actual Accept      {fn:>3d}     {tp:>3d}")

    # ============================================================
    # PER-COMPANY ACCURACY
    # ============================================================
    print(f"\n{'=' * 80}")
    print(f"  📊 PER-COMPANY ACCURACY")
    print(f"{'=' * 80}")
    print(f"\n  {'Company':<35s} {'Total':>5s} {'Correct':>7s} {'Accuracy':>8s}")
    print(f"  {'-'*60}")
    for company, records in sorted(by_company.items()):
        c = sum(1 for r in records if r["correct"])
        t = len(records)
        a = c / t if t > 0 else 0
        print(f"  {company[:34]:<35s} {t:>5d} {c:>7d} {a:>7.1%}")

    # ============================================================
    # PER-JOB ACCURACY
    # ============================================================
    by_job = defaultdict(list)
    for r in results:
        by_job[f"{r['company']} — {r['job']}"].append(r)

    print(f"\n{'=' * 80}")
    print(f"  📊 PER-JOB ACCURACY")
    print(f"{'=' * 80}")
    print(f"\n  {'Job':<55s} {'Total':>5s} {'Acc':>5s}")
    print(f"  {'-'*68}")
    for job_key, records in sorted(by_job.items()):
        c = sum(1 for r in records if r["correct"])
        t = len(records)
        a = c / t if t > 0 else 0
        print(f"  {job_key[:54]:<55s} {t:>5d} {a:>4.0%}")

    # ============================================================
    # WRONG PREDICTIONS DETAIL
    # ============================================================
    wrong = [r for r in results if not r["correct"]]
    if wrong:
        print(f"\n{'=' * 80}")
        print(f"  ❌ WRONG PREDICTIONS DETAIL ({len(wrong)})")
        print(f"{'=' * 80}")
        for i, r in enumerate(wrong, 1):
            print(f"\n  [{i}] {r['student']}")
            print(f"      Job:        {r['job']} ({r['company']})")
            print(f"      HR said:    {r['hr_decision']}")
            print(f"      Model said: {r['model_decision']} (prob: {r['probability']:.1%}, conf: {r['confidence']:.1%})")
            margin = abs(r["probability"] - THRESHOLD)
            print(f"      Margin:     {margin:.1%} {'(close call)' if margin < 0.15 else '(confident but wrong)'}")

    # ============================================================
    # SUMMARY JSON for report
    # ============================================================
    report_dir = Path(__file__).resolve().parent.parent / "models"
    report_data = {
        "test_date": datetime.now().isoformat(),
        "model_version": meta.get("model_version"),
        "trained_at": meta.get("trained_at"),
        "threshold": THRESHOLD,
        "total_tested": total,
        "skipped": skipped,
        "metrics": {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "specificity": round(specificity, 4),
        },
        "confusion_matrix": {"tp": tp, "tn": tn, "fp": fp, "fn": fn},
        "per_company": {
            company: {
                "total": len(records),
                "correct": sum(1 for r in records if r["correct"]),
                "accuracy": round(sum(1 for r in records if r["correct"]) / len(records), 4),
            }
            for company, records in by_company.items()
        },
        "wrong_predictions": [
            {
                "student": r["student"],
                "job": r["job"],
                "company": r["company"],
                "hr_decision": r["hr_decision"],
                "model_decision": r["model_decision"],
                "probability": r["probability"],
            }
            for r in wrong
        ],
    }
    report_path = report_dir / "test_report.json"
    report_path.write_text(json.dumps(report_data, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n{'=' * 80}")
    print(f"  💾 Report saved: {report_path.name}")
    print(f"{'=' * 80}")

    client.close()


asyncio.run(main())
