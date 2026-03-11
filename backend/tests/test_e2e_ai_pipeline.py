# -*- coding: utf-8 -*-
"""
E2E AI Pipeline Test — ทดสอบระบบ AI แบบเหมือนจริง

ใช้ Resume Thanatan.pdf เป็น input จริง ผ่าน 3 ขั้นตอน:
    Stage 1: PDF → Text       (PDFExtractor)
    Stage 2: Text → Features   (LLMService / Groq AI)
    Stage 3: Features → Score   (MatchingService / SBERT)

วิธีรัน:
    cd d:\\ai-resume-screening-system\\backend
    set PYTHONIOENCODING=utf-8
    python tests/test_e2e_ai_pipeline.py
"""

import json
import os
import sys
import time
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Resume path
RESUME_PATH = str(Path(__file__).parent.parent.parent / "Resume Thanatan.pdf")

# Mock job postings (จำลอง 3 ตำแหน่ง ที่ความยากต่างกัน)
MOCK_JOBS = [
    {
        "title": "Junior Full-Stack Developer",
        "skills_required": ["JavaScript", "React", "Node.js", "MongoDB"],
        "major_required": "Computer Science",
        "min_gpa": 2.5,
        "min_experience_months": 0,
        "required_certifications": [],
        "preferred_certifications": [],
    },
    {
        "title": "Backend Python Developer",
        "skills_required": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "major_required": "Information Technology",
        "min_gpa": 2.75,
        "min_experience_months": 6,
        "required_certifications": [],
        "preferred_certifications": [],
    },
    {
        "title": "Senior ML Engineer",
        "skills_required": ["TensorFlow", "PyTorch", "Kubernetes", "MLflow", "Spark"],
        "major_required": "Data Science",
        "min_gpa": 3.5,
        "min_experience_months": 36,
        "required_certifications": ["AWS ML Specialty"],
        "preferred_certifications": [],
    },
]


def print_header(text):
    print(f"\n{'=' * 70}")
    print(f"  {text}")
    print(f"{'=' * 70}")


def print_section(text):
    print(f"\n{'─' * 70}")
    print(f"  {text}")
    print(f"{'─' * 70}")


def print_kv(key, value, indent=4):
    print(f"{' ' * indent}{key}: {value}")


# =============================================================================
# STAGE 1: PDF → Text
# =============================================================================
def test_pdf_extraction():
    """ทดสอบ PDFExtractor — ดึงข้อความจากไฟล์ PDF จริง"""
    print_section("STAGE 1: PDF Extraction (PDFExtractor)")

    from services.pdf_service import PDFExtractor

    if not os.path.exists(RESUME_PATH):
        print(f"    [SKIP] ไม่พบไฟล์: {RESUME_PATH}")
        return None

    extractor = PDFExtractor()
    print_kv("File", os.path.basename(RESUME_PATH))
    print_kv("Size", f"{os.path.getsize(RESUME_PATH):,} bytes")

    start = time.time()
    text, method = extractor.extract_text(RESUME_PATH)
    elapsed = time.time() - start

    if not text or method == "failed":
        print(f"\n    [FAIL] PDF extraction failed! method={method}")
        return None

    print_kv("Method", method)
    print_kv("Text Length", f"{len(text):,} chars")
    print_kv("Time", f"{elapsed:.2f}s")

    # แสดงตัวอย่าง 300 chars แรก
    preview = text[:300].replace("\n", " ").strip()
    print(f"\n    Preview: \"{preview}...\"")

    # Assertions
    assert len(text) > 100, "Text too short — extraction may have failed"
    assert method in ("pypdf2", "pdfplumber"), f"Unexpected method: {method}"

    print(f"\n    [PASS] PDF extracted: {len(text):,} chars via {method} in {elapsed:.2f}s")
    return text


# =============================================================================
# STAGE 2: Text → Features (LLM / Groq AI)
# =============================================================================
def test_llm_extraction(resume_text):
    """ทดสอบ LLMService — วิเคราะห์ Resume ด้วย Groq AI จริง"""
    print_section("STAGE 2: AI Feature Extraction (LLMService + Groq)")

    from services.llm_service import LLMService

    llm = LLMService()

    if not llm.is_ready():
        print("    [SKIP] LLM Service not ready (GROQ_API_KEY missing?)")
        return None

    print_kv("Model", llm.model)
    print_kv("Input Length", f"{len(resume_text):,} chars")

    start = time.time()
    features = llm.extract_features(resume_text)
    elapsed = time.time() - start

    print_kv("Time", f"{elapsed:.2f}s")

    # ตรวจสอบ error
    if features.get("error"):
        print(f"\n    [FAIL] LLM Error: {features['error']}")
        return None

    # แสดงผลลัพธ์ที่ AI ดึงออกมา
    education = features.get("education", {})
    skills = features.get("skills", {})
    projects = features.get("projects", [])
    experience_months = features.get("experience_months", 0)
    languages = features.get("languages", [])
    certifications = features.get("certifications", [])

    print_section("AI Extracted Features")

    # Education
    print("\n    Education:")
    print_kv("University", education.get("university", "N/A"), 8)
    print_kv("Major", education.get("major", "N/A"), 8)
    print_kv("GPA", education.get("gpa", "N/A"), 8)
    print_kv("Level", education.get("level", "N/A"), 8)

    # Skills
    tech_skills = skills.get("technical_skills", [])
    soft_skills = skills.get("soft_skills", [])
    print(f"\n    Skills:")
    print_kv("Technical", ", ".join(tech_skills) if tech_skills else "None", 8)
    print_kv("Soft", ", ".join(soft_skills) if soft_skills else "None", 8)

    # Projects
    print(f"\n    Projects ({len(projects)}):")
    for i, proj in enumerate(projects[:5], 1):
        name = proj.get("name", "Unknown")
        techs = ", ".join(proj.get("technologies", []))
        print(f"        {i}. {name} [{techs}]")

    # Experience & Others
    print(f"\n    Experience: {experience_months} months")
    print(f"    Languages: {', '.join(languages) if languages else 'N/A'}")
    print(f"    Certifications: {', '.join(certifications) if certifications else 'None'}")

    # Assertions
    assert education.get("major"), "AI didn't extract major"
    assert len(tech_skills) > 0, "AI didn't extract any technical skills"
    assert education.get("gpa") is not None, "AI didn't extract GPA"

    print(f"\n    [PASS] AI extracted: {len(tech_skills)} skills, "
          f"{len(projects)} projects, GPA={education.get('gpa')}")

    return features


# =============================================================================
# STAGE 3: Features → Score (MatchingService + SBERT)
# =============================================================================
def test_matching(resume_features):
    """ทดสอบ MatchingService — จับคู่กับ 3 ตำแหน่งงาน"""
    print_section("STAGE 3: Resume-Job Matching (MatchingService + SBERT)")

    from services.matching_service import MatchingService

    matcher = MatchingService()
    print_kv("SBERT Model", "all-MiniLM-L6-v2" if matcher.sbert_model else "Not available")
    print_kv("Jobs to Match", len(MOCK_JOBS))

    results = []

    for job in MOCK_JOBS:
        start = time.time()
        result = matcher.calculate_match(resume_features, job)
        elapsed = time.time() - start

        score = result["overall_score"]
        zone = result["zone"]
        breakdown = result["breakdown"]

        # Zone emoji
        zone_icon = {"green": "🟢", "yellow": "🟡", "red": "🔴"}.get(zone, "⚪")

        print(f"\n    {zone_icon} {job['title']}")
        print(f"        Score: {score:.1f}% ({zone.upper()}) [{elapsed:.2f}s]")
        print(f"        Breakdown:")
        print(f"            Skills:  {breakdown.get('skills', 0):.0f}%  |  "
              f"Major: {breakdown.get('major', 0):.0f}%  |  "
              f"Exp: {breakdown.get('experience', 0):.0f}%")
        print(f"            Projects: {breakdown.get('projects', 0):.0f}%  |  "
              f"Certs: {breakdown.get('certification', 0):.0f}%  |  "
              f"GPA: {breakdown.get('gpa', 0):.0f}%")
        print(f"        Recommendation: {result['recommendation']}")

        results.append({
            "job": job["title"],
            "score": score,
            "zone": zone,
        })

    # Assertions
    scores = [r["score"] for r in results]

    # Score ต้องไม่เท่ากันหมด (ถ้าเท่ากัน = mock)
    assert len(set(scores)) > 1, "All scores identical — likely mock!"

    # Junior job ควร score สูงกว่า Senior ML
    junior_score = results[0]["score"]
    senior_score = results[2]["score"]
    assert junior_score > senior_score, (
        f"Junior ({junior_score}) should score higher than Senior ML ({senior_score})"
    )

    # Gap Analysis สำหรับงาน Red Zone
    red_jobs = [r for r in results if r["zone"] == "red"]
    if red_jobs:
        print_section("Gap Analysis (Red Zone Jobs)")
        for job_info in red_jobs:
            job_req = next(j for j in MOCK_JOBS if j["title"] == job_info["job"])
            gap = matcher.get_gap_analysis(resume_features, job_req)

            print(f"\n    {job_info['job']}:")
            for g in gap.get("gaps", []):
                area = g.get("area", "Unknown")
                missing = g.get("missing", [])
                if missing:
                    print(f"        {area}: ขาด {', '.join(missing[:3])}")

            recs = gap.get("recommendations", [])
            if recs:
                print(f"        Recommendations:")
                for rec in recs[:3]:
                    print(f"            - {rec}")

    print(f"\n    [PASS] Matching completed: "
          f"{len([r for r in results if r['zone'] == 'green'])} green, "
          f"{len([r for r in results if r['zone'] == 'yellow'])} yellow, "
          f"{len([r for r in results if r['zone'] == 'red'])} red")

    return results


# =============================================================================
# MAIN
# =============================================================================
def main():
    print_header("E2E AI PIPELINE TEST")
    print(f"    Resume: {os.path.basename(RESUME_PATH)}")
    print(f"    Pipeline: PDF -> LLM (Groq) -> Matching (SBERT)")

    total_start = time.time()
    stages_passed = 0
    stages_total = 3

    # ── Stage 1: PDF Extraction ──
    try:
        resume_text = test_pdf_extraction()
        if resume_text:
            stages_passed += 1
        else:
            print("\n    [SKIP] Cannot continue without PDF text")
            return False
    except Exception as e:
        print(f"\n    [ERROR] Stage 1 failed: {type(e).__name__}: {e}")
        return False

    # ── Stage 2: LLM Feature Extraction ──
    try:
        features = test_llm_extraction(resume_text)
        if features:
            stages_passed += 1
        else:
            print("\n    [SKIP] LLM extraction failed — using fallback features for Stage 3")
            # Fallback: ดึงข้อมูลพื้นฐานจาก text
            features = {
                "education": {"major": "Unknown", "gpa": 0, "university": "Unknown", "level": "Bachelor"},
                "skills": {"technical_skills": [], "soft_skills": []},
                "projects": [],
                "experience_months": 0,
                "languages": [],
                "certifications": [],
            }
    except Exception as e:
        print(f"\n    [ERROR] Stage 2 failed: {type(e).__name__}: {e}")
        features = {
            "education": {"major": "Unknown", "gpa": 0},
            "skills": {"technical_skills": [], "soft_skills": []},
            "projects": [], "experience_months": 0,
            "languages": [], "certifications": [],
        }

    # ── Stage 3: Matching ──
    try:
        results = test_matching(features)
        if results:
            stages_passed += 1
    except Exception as e:
        print(f"\n    [ERROR] Stage 3 failed: {type(e).__name__}: {e}")

    # ── Summary ──
    total_elapsed = time.time() - total_start

    print_header("TEST RESULTS")
    print(f"    Stages Passed: {stages_passed}/{stages_total}")
    print(f"    Total Time:    {total_elapsed:.2f}s")

    if stages_passed == 3:
        print(f"\n    ALL 3 STAGES PASSED — AI PIPELINE IS FULLY OPERATIONAL!")
    elif stages_passed >= 2:
        print(f"\n    PARTIAL PASS — Some stages need attention")
    else:
        print(f"\n    FAILED — AI Pipeline has critical issues")

    print(f"{'=' * 70}\n")
    return stages_passed == stages_total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
