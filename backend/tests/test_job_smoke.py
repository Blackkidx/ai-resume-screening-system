# -*- coding: utf-8 -*-
"""
Smoke Test for Job Routes - AI Resume Screening System

วิธีรัน:
    cd d:\\ai-resume-screening-system\\backend
    set PYTHONIOENCODING=utf-8
    python tests/test_job_smoke.py

Test Cases:
    1. Route Conflict  — GET /api/jobs/my-applications ต้องไม่ถูก /{job_id} แย่ง
    2. AI Score Logic   — GET /api/jobs/recommended/for-me ต้องได้ AI score จริง
    3. Error Handling   — GET /api/jobs/9999999 ต้องได้ 400 "Invalid job ID"
"""

import asyncio
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import httpx

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.auth import get_current_user_id, get_current_user_data
from core.database import get_database


# =============================================================================
# MOCK DATA
# =============================================================================

MOCK_USER_ID = "507f1f77bcf86cd799439011"
MOCK_USER_DATA = {
    "sub": MOCK_USER_ID,
    "email": "student@test.com",
    "user_type": "Student",
    "full_name": "Test Student",
}


def create_mock_db():
    """สร้าง Mock MongoDB — จำลอง resume (IT student) + 2 jobs"""
    db = MagicMock()

    # Resume features (AI extracted)
    mock_resume = {
        "user_id": MOCK_USER_ID,
        "extracted_features": {
            "education": {
                "major": "Information Technology",
                "gpa": 2.8,
                "university": "Test University",
                "level": "Bachelor",
            },
            "skills": {
                "technical_skills": ["Python", "JavaScript", "MySQL"],
                "soft_skills": ["Communication"],
            },
            "projects": [
                {"name": "Web App", "description": "REST API", "technologies": ["Python", "Flask"]}
            ],
            "experience_months": 6,
            "languages": ["Thai", "English"],
            "certifications": [],
        },
    }
    db.resumes.find_one = AsyncMock(return_value=mock_resume)

    # Jobs (1 ตรงสาขา, 1 ไม่ตรง)
    mock_jobs = [
        {
            "_id": MagicMock(__str__=lambda self: "aaaaaaaaaaaaaaaaaaaaaaaa"),
            "title": "Backend Developer",
            "company_name": "Test Corp",
            "department": "Engineering",
            "is_active": True,
            "skills_required": ["Python", "Node.js", "MySQL", "Docker"],
            "majors": ["Computer Science"],
            "min_gpa": 2.5,
            "experience_required": 0,
            "positions_available": 2,
            "applications_count": 0,
        },
        {
            "_id": MagicMock(__str__=lambda self: "bbbbbbbbbbbbbbbbbbbbbbbb"),
            "title": "Senior ML Engineer",
            "company_name": "AI Corp",
            "department": "Data Science",
            "is_active": True,
            "skills_required": ["TensorFlow", "PyTorch", "Kubernetes", "MLflow"],
            "majors": ["Computer Science"],
            "min_gpa": 3.5,
            "experience_required": 3,
            "positions_available": 1,
            "applications_count": 0,
        },
    ]
    jobs_cursor = MagicMock()
    jobs_cursor.to_list = AsyncMock(return_value=mock_jobs)
    db.jobs.find = MagicMock(return_value=jobs_cursor)
    db.jobs.find_one = AsyncMock(return_value=None)

    # Users
    db.users.find_one = AsyncMock(return_value={
        "_id": MOCK_USER_ID,
        "username": "teststudent",
        "email": "student@test.com",
        "full_name": "Test Student",
    })

    # Applications (empty)
    apps_cursor = MagicMock()
    apps_cursor.sort = MagicMock(return_value=apps_cursor)
    apps_cursor.to_list = AsyncMock(return_value=[])
    db.applications.find = MagicMock(return_value=apps_cursor)

    return db


def setup_app():
    """Override dependencies บน FastAPI app"""
    from main import app

    mock_db = create_mock_db()
    app.dependency_overrides[get_current_user_id] = lambda: MOCK_USER_ID
    app.dependency_overrides[get_current_user_data] = lambda: MOCK_USER_DATA
    app.dependency_overrides[get_database] = lambda: mock_db

    return app, mock_db


# =============================================================================
# TEST CASE 1: Route Conflict — /my-applications ต้องไม่ถูก /{job_id} แย่ง
# =============================================================================

async def test_route_conflict():
    """
    GET /api/jobs/my-applications ต้อง:
    - Status 200 (ไม่ใช่ 400 "Invalid job ID")
    - Response เป็น list
    """
    app, _ = setup_app()
    transport = httpx.ASGITransport(app=app)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/jobs/my-applications")

    assert response.status_code == 200, (
        f"Expected 200 but got {response.status_code}: {response.text}. "
        "Route /my-applications ถูก /{job_id} แย่ง!"
    )

    data = response.json()
    assert isinstance(data, list), f"Expected list but got {type(data).__name__}"

    print(f"  [PASS] GET /my-applications -> 200, returned {len(data)} items")


# =============================================================================
# TEST CASE 2: AI Score Logic — Score ต้องมาจาก MatchingService จริง
# =============================================================================

async def test_ai_score_logic():
    """
    GET /api/jobs/recommended/for-me ต้อง:
    - Status 200
    - มี green/yellow arrays
    - Score เป็น float 0.01-0.99 (ไม่ใช่ 0 หรือ 1 เป๊ะ = mock)
    - มี matching_breakdown (สัญญาณว่าใช้ MatchingService จริง)
    """
    app, _ = setup_app()
    transport = httpx.ASGITransport(app=app)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/jobs/recommended/for-me")

    assert response.status_code == 200, (
        f"Expected 200 but got {response.status_code}: {response.text}"
    )

    data = response.json()
    assert "green" in data, "Missing 'green' key"
    assert "yellow" in data, "Missing 'yellow' key"

    all_jobs = data["green"] + data["yellow"]

    if not all_jobs:
        print("  [PASS] No green/yellow jobs (all red zone — AI working correctly)")
        return

    for job in all_jobs:
        score = job.get("ai_match_score")

        assert isinstance(score, (int, float)), (
            f"Score should be numeric, got {type(score).__name__}"
        )
        assert score != 0.0, f"Score 0.0 for '{job.get('title')}' — likely mock!"
        assert score != 1.0, f"Score 1.0 for '{job.get('title')}' — likely mock!"
        assert 0.0 < score < 1.0, f"Score {score} out of range for '{job.get('title')}'"

        assert job.get("matching_breakdown") is not None, (
            f"Missing 'matching_breakdown' for '{job.get('title')}'"
        )

        zone = job.get("matching_zone")
        assert zone in ("green", "yellow", "red"), f"Invalid zone '{zone}'"

        print(f"  [PASS] '{job.get('title')}': score={score}, zone={zone}")


# =============================================================================
# TEST CASE 3: Error Handling — Invalid ID → 400
# =============================================================================

async def test_error_handling():
    """
    GET /api/jobs/9999999 ต้อง:
    - Status 400
    - detail มีคำว่า "Invalid job ID"
    """
    app, _ = setup_app()
    transport = httpx.ASGITransport(app=app)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/jobs/9999999")

    assert response.status_code == 400, (
        f"Expected 400 but got {response.status_code}: {response.text}"
    )

    data = response.json()
    assert "detail" in data, f"Missing 'detail': {data}"
    assert "invalid" in data["detail"].lower(), (
        f"Expected 'Invalid job ID' but got: '{data['detail']}'"
    )

    print(f"  [PASS] GET /jobs/9999999 -> 400: {data['detail']}")


# =============================================================================
# MAIN
# =============================================================================

async def run_all_tests():
    tests = [
        ("Test 1: Route Conflict (/my-applications)", test_route_conflict),
        ("Test 2: AI Score Logic (real, not mock)", test_ai_score_logic),
        ("Test 3: Error Handling (invalid ID)", test_error_handling),
    ]

    passed = 0
    failed = 0

    for name, test_fn in tests:
        print(f"\n{'─' * 60}")
        print(f"  {name}")
        print(f"{'─' * 60}")

        try:
            await test_fn()
            passed += 1
        except AssertionError as e:
            print(f"  [FAIL] {e}")
            failed += 1
        except Exception as e:
            print(f"  [ERROR] {type(e).__name__}: {e}")
            failed += 1

    return passed, failed


def main():
    print("\n" + "=" * 60)
    print("  SMOKE TEST: Job Routes")
    print("=" * 60)

    passed, failed = asyncio.run(run_all_tests())

    print(f"\n{'=' * 60}")
    print(f"  RESULTS: {passed} passed, {failed} failed")
    print(f"{'=' * 60}")

    if failed == 0:
        print("  ALL SMOKE TESTS PASSED!")
    else:
        print("  SOME TESTS FAILED!")

    print(f"{'=' * 60}\n")
    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
