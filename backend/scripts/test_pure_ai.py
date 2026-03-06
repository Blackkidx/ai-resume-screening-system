# -*- coding: utf-8 -*-
"""
🧪 Pure AI Test — ทดสอบ XGBoost v4 เพียวๆ (ไม่มี rule-based)

Pipeline: PDF → LLM → 14 Features (fuzzy matched) → XGBoost → Decision
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

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

import logging
logging.disable(logging.INFO)  # ปิด log เพื่อให้ output สะอาด

from services.pdf_service import PDFExtractor
from services.llm_service import LLMService
from services.matching_service import MatchingService
from services.xgboost_service import XGBoostService

RESUME_DIR = BACKEND_DIR.parent / "resume test"

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


def bar(value, width=15):
    filled = int(value / 100 * width) if value else 0
    return "█" * filled + "░" * (width - filled)


async def main():
    print()
    print("🤖 Pure AI Test — XGBoost v4 Only (No Rule-Based)")
    print("━" * 65)

    pdf = PDFExtractor()
    llm = LLMService()
    matcher = MatchingService()
    xgb = XGBoostService.get_instance()

    if not llm.is_ready():
        print("❌ LLM ไม่พร้อม"); return
    if not xgb.is_model_available():
        print("❌ XGBoost model ไม่พร้อม"); return

    print(f"✅ Model: v4 | Features: 14 | Threshold: {xgb.threshold}")
    print(f"✅ Fuzzy skill matching: ON ({len(MatchingService.SKILL_ALIASES)} aliases)")
    print(f"📁 {RESUME_DIR}\n")

    pdfs = sorted(RESUME_DIR.glob("*.pdf"))
    results = {job["title"]: [] for job in MOCK_JOBS}

    for i, pdf_path in enumerate(pdfs, 1):
        name = pdf_path.stem.replace("Resume ", "").replace("resume ", "").strip()

        # PDF → Text
        text, method = pdf.extract_text(str(pdf_path))
        if method == "failed" or not text or len(text) < 50:
            print(f"[{i:2d}] ⚠️ {name} — PDF failed")
            for job in MOCK_JOBS:
                results[job["title"]].append({"name": name, "error": True})
            continue

        # Text → Features (LLM)
        try:
            features = llm.extract_features(text)
        except Exception as e:
            print(f"[{i:2d}] ⚠️ {name} — LLM: {e}")
            for job in MOCK_JOBS:
                results[job["title"]].append({"name": name, "error": True})
            time.sleep(2)
            continue

        skills = features.get("skills", {})
        tech = skills.get("technical_skills", [])
        gpa = features.get("education", {}).get("gpa", 0)
        print(f"[{i:2d}] 📄 {name:15s} | Skills: {', '.join(tech[:4]):35s} | GPA: {gpa}")

        # Match against each job — XGBoost ONLY
        for job in MOCK_JOBS:
            xgb_features = matcher.extract_xgboost_features(features, job)
            pred = xgb.predict(xgb_features)

            results[job["title"]].append({
                "name": name,
                "score": pred.get("xgboost_score", 0),
                "decision": pred.get("xgboost_decision", "N/A"),
                "prob": pred.get("xgboost_probability", 0),
                "skill_ratio": xgb_features["skills_match_ratio"],
                "projects": xgb_features["relevant_projects"],
                "gpa": xgb_features["gpa_value"],
            })

        time.sleep(1.5)

    # ─────────────────────────────────────
    # Summary Tables — Pure AI Only
    # ─────────────────────────────────────
    print(f"\n{'━' * 65}")
    print("📊 PURE AI RESULTS (XGBoost v4 — No Rule-Based)")
    print(f"{'━' * 65}")

    for job in MOCK_JOBS:
        title = job["title"]
        items = results[title]
        valid = [r for r in items if not r.get("error")]

        print(f"\n🏢 {title}")
        print(f"   Skills: {', '.join(job['skills_required'])}")
        print(f"{'─' * 65}")
        print(f"   {'Name':15s} {'AI Score':>9s}  {'Bar':15s}  {'Decision':>8s}  {'skill%':>6s} {'proj':>4s} {'gpa':>5s}")
        print(f"{'─' * 65}")

        for r in sorted(valid, key=lambda x: x["score"], reverse=True):
            emoji = "✅" if r["decision"] == "accepted" else "❌"
            print(f"   {r['name']:15s} {r['score']:7.1f}%  {bar(r['score'])}  {emoji} {r['decision']:8s}  {r['skill_ratio']:.2f}  {r['projects']:>4d}  {r['gpa']:.2f}")

        for r in [x for x in items if x.get("error")]:
            print(f"   {r['name']:15s}    ERROR")

        accepted = sum(1 for r in valid if r["decision"] == "accepted")
        total = len(valid)
        print(f"{'─' * 65}")
        print(f"   ✅ Accepted: {accepted}/{total} ({accepted/total*100:.0f}%)" if total else "   No data")

    # Save
    out = BACKEND_DIR.parent / "resume test" / "pure_ai_results.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Saved: {out}")
    print(f"{'━' * 65}")
    print("✅ Pure AI test complete!")


if __name__ == "__main__":
    asyncio.run(main())
