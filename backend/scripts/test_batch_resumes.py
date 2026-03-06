# -*- coding: utf-8 -*-
"""
🧪 Batch Resume Test — ทดสอบ XGBoost v4 กับ 16 Resume จริง

Pipeline: PDF → Text → LLM Features → MatchingService → XGBoost v4
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add backend to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

from services.pdf_service import PDFExtractor
from services.llm_service import LLMService
from services.matching_service import MatchingService
from services.xgboost_service import XGBoostService

RESUME_DIR = BACKEND_DIR.parent / "resume test"

# 3 Mock jobs — ง่าย / กลาง / ยาก
MOCK_JOBS = [
    {
        "title": "Junior Full-Stack Developer",
        "skills_required": ["JavaScript", "React", "Node.js", "MongoDB", "Python"],
        "major_required": "Computer Science",
        "min_gpa": 2.5,
        "min_experience_months": 0,
        "required_certifications": [],
        "preferred_certifications": [],
    },
    {
        "title": "Network & Security Engineer",
        "skills_required": ["Network", "Firewall", "Linux", "TCP/IP", "Cybersecurity"],
        "major_required": "Information Technology",
        "min_gpa": 2.75,
        "min_experience_months": 0,
        "required_certifications": ["CCNA"],
        "preferred_certifications": ["CompTIA Security+"],
    },
    {
        "title": "Data Analyst",
        "skills_required": ["Python", "SQL", "Power BI", "Excel", "Statistics"],
        "major_required": "Data Science",
        "min_gpa": 3.0,
        "min_experience_months": 0,
        "required_certifications": [],
        "preferred_certifications": ["Google Data Analytics"],
    },
]


def print_bar(value, max_val=100, width=20):
    filled = int(value / max_val * width) if max_val > 0 else 0
    return "█" * filled + "░" * (width - filled)


async def main():
    print()
    print("🧪 Batch Resume Test — XGBoost v4 (14 Features)")
    print("━" * 65)

    # Init services
    pdf_extractor = PDFExtractor()
    llm_service = LLMService()
    matching_service = MatchingService()
    xgboost_service = XGBoostService.get_instance()

    if not llm_service.is_ready():
        print("❌ LLM Service ไม่พร้อม — ตรวจสอบ GROQ_API_KEY ใน .env")
        return

    if not xgboost_service.is_model_available():
        print("❌ XGBoost model ยังไม่พร้อม")
        return

    print(f"✅ XGBoost model loaded (threshold: {xgboost_service.threshold})")
    print(f"📁 Resume dir: {RESUME_DIR}")

    # Find all PDFs
    pdfs = sorted(RESUME_DIR.glob("*.pdf"))
    print(f"📄 Found {len(pdfs)} resume PDFs\n")

    if not pdfs:
        print("❌ ไม่พบไฟล์ PDF ใน resume test/")
        return

    results = []

    for i, pdf_path in enumerate(pdfs, 1):
        name = pdf_path.stem.replace("Resume ", "").replace("resume ", "").strip()
        print(f"{'─' * 65}")
        print(f"[{i}/{len(pdfs)}] 📄 {name}")

        # Step 1: PDF → Text
        text, method = pdf_extractor.extract_text(str(pdf_path))
        if method == "failed" or not text or len(text) < 50:
            print(f"   ⚠️ PDF extraction failed (method: {method})")
            results.append({"name": name, "error": "PDF extraction failed"})
            continue

        text_preview = text[:80].replace("\n", " ")
        print(f"   📖 Text: {len(text)} chars ({method}) — {text_preview}...")

        # Step 2: Text → Features (LLM)
        try:
            features = llm_service.extract_features(text)
        except Exception as e:
            print(f"   ⚠️ LLM failed: {e}")
            results.append({"name": name, "error": f"LLM: {e}"})
            time.sleep(1)
            continue

        edu = features.get("education", {})
        skills = features.get("skills", {})
        tech = skills.get("technical_skills", [])
        soft = skills.get("soft_skills", [])
        projects = features.get("projects", [])
        certs = features.get("certifications", [])
        exp = features.get("experience_months", 0)

        print(f"   🎓 Major: {edu.get('major', 'N/A')} | GPA: {edu.get('gpa', 'N/A')}")
        print(f"   💻 Skills: {len(tech)} tech, {len(soft)} soft → {', '.join(tech[:5])}")
        print(f"   📁 Projects: {len(projects)} | Certs: {len(certs)} | Exp: {exp} months")

        # Step 3: Match against each job + XGBoost
        person_result = {"name": name, "jobs": []}

        for job in MOCK_JOBS:
            # Rule-based score
            match_result = matching_service.calculate_match(features, job)

            # XGBoost features + predict
            xgb_features = matching_service.extract_xgboost_features(features, job)
            xgb_result = xgboost_service.predict(xgb_features)

            rule_score = match_result["overall_score"]
            zone = match_result["zone"]
            xgb_score = xgb_result.get("xgboost_score", 0)
            xgb_decision = xgb_result.get("xgboost_decision", "N/A")
            xgb_prob = xgb_result.get("xgboost_probability", 0)

            emoji = {"accepted": "✅", "rejected": "❌"}.get(xgb_decision, "❓")
            zone_emoji = {"green": "🟢", "yellow": "🟡", "red": "🔴"}.get(zone, "⚪")

            print(f"   ┌─ {job['title']}")
            print(f"   │  Rule: {print_bar(rule_score)} {rule_score:.0f}% {zone_emoji}")
            print(f"   │  XGB:  {print_bar(xgb_score)} {xgb_score:.0f}% {emoji} {xgb_decision} (prob: {xgb_prob:.3f})")
            print(f"   └─ Features: skill_ratio={xgb_features['skills_match_ratio']:.2f} projects={xgb_features['relevant_projects']} gpa={xgb_features['gpa_value']}")

            person_result["jobs"].append({
                "job": job["title"],
                "rule_score": rule_score,
                "zone": zone,
                "xgb_score": xgb_score,
                "xgb_decision": xgb_decision,
                "xgb_probability": xgb_prob,
                "features": xgb_features,
            })

        results.append(person_result)

        # Rate limit for Groq API
        time.sleep(1.5)

    # ─────────────────────────────────────
    # Summary Table
    # ─────────────────────────────────────
    print(f"\n{'━' * 65}")
    print("📊 SUMMARY TABLE")
    print(f"{'━' * 65}")

    for job in MOCK_JOBS:
        job_title = job["title"]
        print(f"\n🏢 {job_title}")
        print(f"{'Name':20s} {'Rule':>6s} {'Zone':>6s} {'XGB':>6s} {'Decision':>10s}")
        print(f"{'─' * 55}")

        accepted = 0
        rejected = 0
        for r in results:
            if "error" in r:
                print(f"{r['name']:20s} {'ERROR':>6s}")
                continue

            for j in r["jobs"]:
                if j["job"] == job_title:
                    zone_icon = {"green": "🟢", "yellow": "🟡", "red": "🔴"}.get(j["zone"], "⚪")
                    dec_icon = "✅" if j["xgb_decision"] == "accepted" else "❌"
                    print(f"{r['name']:20s} {j['rule_score']:5.0f}% {zone_icon:>5s} {j['xgb_score']:5.0f}% {dec_icon} {j['xgb_decision']}")

                    if j["xgb_decision"] == "accepted":
                        accepted += 1
                    else:
                        rejected += 1

        print(f"{'─' * 55}")
        total = accepted + rejected
        print(f"Total: {total} | Accepted: {accepted} ({accepted/total*100:.0f}%) | Rejected: {rejected}" if total > 0 else "No results")

    # Save results
    output_path = BACKEND_DIR.parent / "resume test" / "batch_test_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Results saved: {output_path}")

    print(f"\n{'━' * 65}")
    print("✅ Batch test complete!")
    print(f"{'━' * 65}")


if __name__ == "__main__":
    asyncio.run(main())
