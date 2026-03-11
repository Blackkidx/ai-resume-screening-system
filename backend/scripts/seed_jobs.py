# -*- coding: utf-8 -*-
"""
Seed Jobs Script — สร้างข้อมูลบริษัท, HR accounts, และตำแหน่งงานฝึกงานลง MongoDB

Usage:
    python backend/scripts/seed_jobs.py
"""

import asyncio
import hashlib
import os
import sys
import uuid
from datetime import datetime, timedelta

import motor.motor_asyncio
from dotenv import load_dotenv
from passlib.context import CryptContext

# Load .env from backend directory
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, ".env"))

# Password hashing — same as core/auth.py (SHA256 + bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    password_sha = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(password_sha)


def generate_unique_id(prefix: str = "ID") -> str:
    year = datetime.utcnow().year
    random_part = str(uuid.uuid4())[:8].upper()
    return f"{prefix}-{year}-{random_part}"


# =========================================================================
# DATA DEFINITIONS
# =========================================================================

COMPANIES = [
    {
        "name": "TechVision Solutions Co., Ltd.",
        "industry": "Software Development",
        "description": "บริษัทพัฒนาซอฟต์แวร์และแอปพลิเคชันครบวงจร เชี่ยวชาญด้าน Web Application, Mobile App และ Cloud Solutions",
        "location": "อาคารสยามพิวรรธน์ ชั้น 15 ถนนพระราม 1 ปทุมวัน กรุงเทพฯ 10330",
        "website": "https://techvision.example.com",
        "contact_email": "hr@techvision.example.com",
        "contact_phone": "02-123-4567",
    },
    {
        "name": "DataPro Analytics Co., Ltd.",
        "industry": "Data Analytics",
        "description": "บริษัทที่ปรึกษาด้าน Data Analytics และ Business Intelligence ให้บริการวิเคราะห์ข้อมูลเชิงลึกสำหรับองค์กร",
        "location": "อาคาร FYI Center ชั้น 10 ถนนพระราม 4 คลองเตย กรุงเทพฯ 10110",
        "website": "https://datapro.example.com",
        "contact_email": "hr@datapro.example.com",
        "contact_phone": "02-234-5678",
    },
    {
        "name": "NetSecure Systems Co., Ltd.",
        "industry": "Network & Cybersecurity",
        "description": "บริษัทผู้เชี่ยวชาญด้านระบบเครือข่ายและความปลอดภัยไซเบอร์ ให้บริการออกแบบ ติดตั้ง และดูแลระบบ Network Infrastructure",
        "location": "อาคารซอฟต์แวร์ปาร์ค ชั้น 8 ถนนแจ้งวัฒนะ ปากเกร็ด นนทบุรี 11120",
        "website": "https://netsecure.example.com",
        "contact_email": "hr@netsecure.example.com",
        "contact_phone": "02-345-6789",
    },
    {
        "name": "AppNova Digital Co., Ltd.",
        "industry": "Mobile & Digital",
        "description": "สตาร์ทอัพพัฒนา Mobile Application และ Digital Platform นวัตกรรม เน้น UX/UI Design และ Cross-platform Development",
        "location": "True Digital Park ชั้น 6 ถนนสุขุมวิท 101 บางจาก กรุงเทพฯ 10260",
        "website": "https://appnova.example.com",
        "contact_email": "hr@appnova.example.com",
        "contact_phone": "02-456-7890",
    },
]

HR_ACCOUNTS = [
    {"username": "hr_techvision", "email": "hr1@techvision.example.com", "full_name": "สมศรี ใจดี", "first_name": "สมศรี", "last_name": "ใจดี", "company_index": 0},
    {"username": "hr_datapro", "email": "hr2@datapro.example.com", "full_name": "วิชัย สุขสันต์", "first_name": "วิชัย", "last_name": "สุขสันต์", "company_index": 1},
    {"username": "hr_netsecure", "email": "hr3@netsecure.example.com", "full_name": "พิมพ์ใจ รักงาน", "first_name": "พิมพ์ใจ", "last_name": "รักงาน", "company_index": 2},
    {"username": "hr_appnova", "email": "hr4@appnova.example.com", "full_name": "ธนกร นวัตกรรม", "first_name": "ธนกร", "last_name": "นวัตกรรม", "company_index": 3},
]

# company_index: 0=TechVision, 1=DataPro, 2=NetSecure, 3=AppNova
JOBS = [
    # === TechVision Solutions ===
    {
        "title": "Backend Developer Intern",
        "description": "ฝึกงานพัฒนาระบบ Backend ด้วย Python/Node.js ร่วมออกแบบ REST API และจัดการฐานข้อมูล ได้เรียนรู้ระบบจริงในโปรเจคขนาดใหญ่ มีพี่เลี้ยงดูแลตลอดการฝึกงาน",
        "department": "Back-End Developer",
        "job_type": "Internship",
        "work_mode": "Hybrid",
        "location": "สยามพิวรรธน์ ปทุมวัน กรุงเทพฯ",
        "allowance_amount": 8000,
        "allowance_type": "monthly",
        "positions_available": 3,
        "requirements": [
            "กำลังศึกษาชั้นปี 3-4 สาขาที่เกี่ยวข้อง",
            "มีพื้นฐาน Programming อย่างน้อย 1 ภาษา",
            "เข้าใจหลักการ OOP เบื้องต้น",
            "สามารถฝึกงานได้อย่างน้อย 4 เดือน",
        ],
        "skills_required": ["Python", "SQL", "REST API", "Git"],
        "majors": ["วิทยาการคอมพิวเตอร์", "เทคโนโลยีสารสนเทศ", "วิศวกรรมซอฟต์แวร์", "Computer Science", "Information Technology", "Software Engineering"],
        "min_gpa": 2.50,
        "experience_required": 0,
        "student_levels": ["ปี 3", "ปี 4"],
        "start_date": "2026-05-01",
        "end_date": "2026-08-31",
        "company_index": 0,
    },
    {
        "title": "Frontend Developer Intern",
        "description": "ฝึกงานพัฒนา Frontend ด้วย React สร้าง UI/UX ที่สวยงามและใช้งานง่าย ได้ทำงานร่วมกับทีม Designer และ Backend Developer มีโอกาสได้ทำโปรเจคจริง",
        "department": "Front-End Developer",
        "job_type": "Internship",
        "work_mode": "Hybrid",
        "location": "สยามพิวรรธน์ ปทุมวัน กรุงเทพฯ",
        "allowance_amount": 8000,
        "allowance_type": "monthly",
        "positions_available": 2,
        "requirements": [
            "กำลังศึกษาชั้นปี 3-4 สาขาที่เกี่ยวข้อง",
            "มีพื้นฐาน HTML/CSS/JavaScript",
            "มีผลงานหรือ Portfolio จะพิจารณาเป็นพิเศษ",
            "สามารถฝึกงานได้อย่างน้อย 4 เดือน",
        ],
        "skills_required": ["HTML", "CSS", "JavaScript", "React"],
        "majors": ["วิทยาการคอมพิวเตอร์", "เทคโนโลยีสารสนเทศ", "วิศวกรรมซอฟต์แวร์", "Computer Science", "Information Technology", "Software Engineering"],
        "min_gpa": 2.50,
        "experience_required": 0,
        "student_levels": ["ปี 3", "ปี 4"],
        "start_date": "2026-05-01",
        "end_date": "2026-08-31",
        "company_index": 0,
    },
    # === DataPro Analytics ===
    {
        "title": "Data Analyst Intern",
        "description": "ฝึกงานวิเคราะห์ข้อมูลด้วย Python และ SQL สร้าง Dashboard และรายงานเชิงลึก ได้เรียนรู้ Machine Learning เบื้องต้น ทำงานกับข้อมูลจริงจากลูกค้าองค์กรขนาดใหญ่",
        "department": "Data Analyst",
        "job_type": "Internship",
        "work_mode": "Onsite",
        "location": "FYI Center พระราม 4 คลองเตย กรุงเทพฯ",
        "allowance_amount": 10000,
        "allowance_type": "monthly",
        "positions_available": 2,
        "requirements": [
            "กำลังศึกษาชั้นปี 3-4 สาขาที่เกี่ยวข้อง",
            "มีพื้นฐาน Python หรือ R",
            "เข้าใจ Statistics พื้นฐาน",
            "สามารถฝึกงานได้อย่างน้อย 4 เดือน",
        ],
        "skills_required": ["Python", "SQL", "Excel", "Data Visualization"],
        "majors": ["วิทยาการคอมพิวเตอร์", "เทคโนโลยีสารสนเทศ", "สถิติ", "Computer Science", "Information Technology", "Statistics"],
        "min_gpa": 2.75,
        "experience_required": 0,
        "student_levels": ["ปี 3", "ปี 4"],
        "start_date": "2026-05-01",
        "end_date": "2026-08-31",
        "company_index": 1,
    },
    {
        "title": "Full-Stack Developer Intern",
        "description": "ฝึกงานพัฒนาเว็บแบบ Full-Stack ทั้ง Frontend และ Backend สร้าง Data Platform ภายในองค์กร ได้เรียนรู้ Agile/Scrum และ Cloud Services",
        "department": "Full-Stack Developer",
        "job_type": "Internship",
        "work_mode": "Hybrid",
        "location": "FYI Center พระราม 4 คลองเตย กรุงเทพฯ",
        "allowance_amount": 8000,
        "allowance_type": "monthly",
        "positions_available": 2,
        "requirements": [
            "กำลังศึกษาชั้นปี 3-4 สาขาที่เกี่ยวข้อง",
            "มีพื้นฐานทั้ง Frontend และ Backend",
            "เคยทำ Web Project มาก่อนจะพิจารณาเป็นพิเศษ",
            "สามารถฝึกงานได้อย่างน้อย 4 เดือน",
        ],
        "skills_required": ["JavaScript", "React", "Node.js", "SQL"],
        "majors": ["วิทยาการคอมพิวเตอร์", "เทคโนโลยีสารสนเทศ", "วิศวกรรมซอฟต์แวร์", "Computer Science", "Information Technology", "Software Engineering"],
        "min_gpa": 2.50,
        "experience_required": 0,
        "student_levels": ["ปี 3", "ปี 4"],
        "start_date": "2026-05-01",
        "end_date": "2026-08-31",
        "company_index": 1,
    },
    # === NetSecure Systems ===
    {
        "title": "Network Engineer Intern",
        "description": "ฝึกงานดูแลระบบเครือข่ายและ Server ได้เรียนรู้การ Configuration Router, Switch และระบบ Firewall จริง สนับสนุนการสอบ CCNA",
        "department": "Network Engineer",
        "job_type": "Internship",
        "work_mode": "Onsite",
        "location": "ซอฟต์แวร์ปาร์ค แจ้งวัฒนะ ปากเกร็ด นนทบุรี",
        "allowance_amount": 7000,
        "allowance_type": "monthly",
        "positions_available": 2,
        "requirements": [
            "กำลังศึกษาชั้นปี 3-4 สาขาที่เกี่ยวข้อง",
            "มีพื้นฐาน Networking (TCP/IP, OSI Model)",
            "ใช้ Linux command line ได้",
            "สามารถฝึกงานได้อย่างน้อย 4 เดือน",
        ],
        "skills_required": ["Networking", "TCP/IP", "Linux", "Troubleshooting"],
        "majors": ["วิทยาการคอมพิวเตอร์", "เทคโนโลยีสารสนเทศ", "วิศวกรรมคอมพิวเตอร์", "Computer Science", "Information Technology", "Computer Engineering"],
        "min_gpa": 2.50,
        "experience_required": 0,
        "student_levels": ["ปี 3", "ปี 4"],
        "start_date": "2026-05-01",
        "end_date": "2026-08-31",
        "company_index": 2,
    },
    {
        "title": "Cybersecurity Intern",
        "description": "ฝึกงานด้านความปลอดภัยไซเบอร์ เรียนรู้ Penetration Testing, Security Monitoring และการป้องกันภัยคุกคาม สนับสนุนการสอบ CompTIA Security+",
        "department": "Cybersecurity",
        "job_type": "Internship",
        "work_mode": "Onsite",
        "location": "ซอฟต์แวร์ปาร์ค แจ้งวัฒนะ ปากเกร็ด นนทบุรี",
        "allowance_amount": 9000,
        "allowance_type": "monthly",
        "positions_available": 1,
        "requirements": [
            "กำลังศึกษาชั้นปี 3-4 สาขาที่เกี่ยวข้อง",
            "มีพื้นฐาน Networking และ Linux",
            "สนใจด้าน Cybersecurity เป็นพิเศษ",
            "สามารถฝึกงานได้อย่างน้อย 4 เดือน",
        ],
        "skills_required": ["Networking", "Linux", "Security Fundamentals", "Problem Solving"],
        "majors": ["วิทยาการคอมพิวเตอร์", "เทคโนโลยีสารสนเทศ", "ความมั่นคงไซเบอร์", "Computer Science", "Information Technology", "Cybersecurity"],
        "min_gpa": 2.75,
        "experience_required": 0,
        "student_levels": ["ปี 3", "ปี 4"],
        "start_date": "2026-05-01",
        "end_date": "2026-08-31",
        "company_index": 2,
    },
    # === AppNova Digital ===
    {
        "title": "Mobile Developer Intern",
        "description": "ฝึกงานพัฒนา Mobile App ด้วย Flutter สร้างแอปที่ใช้งานจริงบน iOS และ Android มี MacBook ให้ใช้ระหว่างฝึกงาน",
        "department": "Mobile Developer",
        "job_type": "Internship",
        "work_mode": "Hybrid",
        "location": "True Digital Park สุขุมวิท 101 บางจาก กรุงเทพฯ",
        "allowance_amount": 8000,
        "allowance_type": "monthly",
        "positions_available": 2,
        "requirements": [
            "กำลังศึกษาชั้นปี 3-4 สาขาที่เกี่ยวข้อง",
            "มีพื้นฐาน Mobile Development (Flutter/React Native/Swift/Kotlin)",
            "มีผลงาน App ใน Portfolio จะพิจารณาเป็นพิเศษ",
            "สามารถฝึกงานได้อย่างน้อย 4 เดือน",
        ],
        "skills_required": ["Flutter", "Dart", "Mobile Development", "Git"],
        "majors": ["วิทยาการคอมพิวเตอร์", "เทคโนโลยีสารสนเทศ", "วิศวกรรมซอฟต์แวร์", "Computer Science", "Information Technology", "Software Engineering"],
        "min_gpa": 2.50,
        "experience_required": 0,
        "student_levels": ["ปี 3", "ปี 4"],
        "start_date": "2026-05-01",
        "end_date": "2026-08-31",
        "company_index": 3,
    },
    {
        "title": "QA/Software Tester Intern",
        "description": "ฝึกงานทดสอบซอฟต์แวร์ เรียนรู้ Manual Testing และ Automated Testing ด้วย Selenium/Cypress ได้ทำงานร่วมกับทีม Dev ใน Sprint",
        "department": "Software Tester",
        "job_type": "Internship",
        "work_mode": "Hybrid",
        "location": "True Digital Park สุขุมวิท 101 บางจาก กรุงเทพฯ",
        "allowance_amount": 7000,
        "allowance_type": "monthly",
        "positions_available": 2,
        "requirements": [
            "กำลังศึกษาชั้นปี 3-4 สาขาที่เกี่ยวข้อง",
            "มีความละเอียดรอบคอบ ช่างสังเกต",
            "มีพื้นฐาน Programming จะพิจารณาเป็นพิเศษ",
            "สามารถฝึกงานได้อย่างน้อย 4 เดือน",
        ],
        "skills_required": ["Software Testing", "Test Cases", "Bug Reporting", "Problem Solving"],
        "majors": ["วิทยาการคอมพิวเตอร์", "เทคโนโลยีสารสนเทศ", "วิศวกรรมซอฟต์แวร์", "Computer Science", "Information Technology", "Software Engineering"],
        "min_gpa": 2.50,
        "experience_required": 0,
        "student_levels": ["ปี 3", "ปี 4"],
        "start_date": "2026-05-01",
        "end_date": "2026-08-31",
        "company_index": 3,
    },
]


# =========================================================================
# MAIN SEED FUNCTION
# =========================================================================
async def seed():
    # --- Connect ---
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "ai_resume_screening")

    print("[INFO] Connecting to MongoDB...")
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)
    db = client[db_name]

    try:
        await client.admin.command("ping")
        print(f"[OK] Connected to {db_name}\n")
    except Exception as exc:
        print(f"[ERROR] Cannot connect to MongoDB: {exc}")
        sys.exit(1)

    now = datetime.utcnow()
    deadline = now + timedelta(days=60)  # 2 เดือนข้างหน้า

    # =====================================================================
    # STEP 1 — Companies
    # =====================================================================
    print(f"[INFO] Creating {len(COMPANIES)} companies...")
    company_ids = []

    for comp in COMPANIES:
        existing = await db.companies.find_one({"name": comp["name"]})
        if existing:
            print(f"[SKIP] {comp['name']} (already exists)")
            company_ids.append(existing["_id"])
            continue

        # Match document structure from routes/company.py line 41-53
        doc = {
            "name": comp["name"],
            "industry": comp["industry"],
            "description": comp["description"],
            "location": comp["location"],
            "website": comp["website"],
            "contact_email": comp["contact_email"],
            "contact_phone": comp["contact_phone"],
            "is_active": True,
            "created_at": now,
            "updated_at": now,
            "created_by": "seed_script",
        }
        result = await db.companies.insert_one(doc)
        company_ids.append(result.inserted_id)
        print(f"[OK] {comp['name']}")

    created_companies = len(COMPANIES)
    print()

    # =====================================================================
    # STEP 2 — HR Accounts
    # =====================================================================
    hr_password = "hr12345"
    hashed = hash_password(hr_password)

    print(f"[INFO] Creating {len(HR_ACCOUNTS)} HR accounts (password: {hr_password})")
    hr_user_ids = []

    for hr in HR_ACCOUNTS:
        existing = await db.users.find_one({"username": hr["username"]})
        if existing:
            print(f"[SKIP] {hr['username']} (already exists)")
            hr_user_ids.append(existing["_id"])
            continue

        company_oid = company_ids[hr["company_index"]]

        # Match document structure from routes/auth.py line 122-137
        user_doc = {
            "username": hr["username"],
            "email": hr["email"],
            "password_hash": hashed,
            "full_name": hr["full_name"],
            "first_name": hr["first_name"],
            "last_name": hr["last_name"],
            "phone": None,
            "user_type": "HR",
            "company_id": company_oid,
            "is_active": True,
            "is_verified": True,
            "created_at": now,
            "updated_at": now,
            "last_login": None,
        }
        result = await db.users.insert_one(user_doc)
        user_oid = result.inserted_id
        hr_user_ids.append(user_oid)

        # Create company_hr_assignments (same as routes/company.py line 497-504)
        assignment_doc = {
            "company_id": company_oid,
            "user_id": user_oid,
            "assigned_at": now,
            "assigned_by": "seed_script",
        }
        await db.company_hr_assignments.insert_one(assignment_doc)

        # Create user_role_assignments (same as routes/auth.py line 150-159)
        hr_role = await db.user_roles.find_one({"role_name": "HR"})
        if hr_role:
            role_mapping = {
                "user_id": user_oid,
                "role_id": hr_role["_id"],
                "role_name": "HR",
                "assigned_at": now,
                "assigned_by": "seed_script",
            }
            await db.user_role_assignments.insert_one(role_mapping)

        short_company = COMPANIES[hr["company_index"]]["name"].split(" Co.")[0]
        print(f"[OK] {hr['username']} -> {short_company}")

    created_hr = len(HR_ACCOUNTS)
    print()

    # =====================================================================
    # STEP 3 — Job Positions
    # =====================================================================
    print(f"[INFO] Creating {len(JOBS)} job positions...")
    created_jobs = 0

    for job_data in JOBS:
        existing = await db.jobs.find_one({"title": job_data["title"], "company_id": str(company_ids[job_data["company_index"]])})
        if existing:
            short_company = COMPANIES[job_data["company_index"]]["name"].split(" Co.")[0]
            print(f"[SKIP] {job_data['title']} ({short_company}) — already exists")
            continue

        ci = job_data["company_index"]
        company_oid = company_ids[ci]
        hr_oid = hr_user_ids[ci]

        # Match document structure from routes/job.py line 624-633
        # job.dict() fields + metadata
        job_doc = {
            # Section 1: Basic Information (from JobCreate schema)
            "title": job_data["title"],
            "description": job_data["description"],
            "department": job_data["department"],
            "job_type": job_data["job_type"],
            "work_mode": job_data["work_mode"],
            "location": job_data["location"],
            "allowance_amount": job_data["allowance_amount"],
            "allowance_type": job_data["allowance_type"],
            "positions_available": job_data["positions_available"],
            # Section 2: Requirements
            "requirements": job_data["requirements"],
            "skills_required": job_data["skills_required"],
            "majors": job_data["majors"],
            "min_gpa": job_data["min_gpa"],
            "experience_required": job_data["experience_required"],
            "student_levels": job_data["student_levels"],
            # Section 3: Dates
            "application_deadline": deadline.isoformat(),
            "start_date": job_data["start_date"],
            "end_date": job_data["end_date"],
            "is_active": True,
            # Legacy fields (backward compatibility, from JobCreate schema)
            "compensation_amount": None,
            "salary_min": None,
            "salary_max": None,
            "duration_months": 4,
            # Metadata (auto-generated, same as routes/job.py line 626-632)
            "job_code": generate_unique_id("JOB"),
            "company_id": str(company_oid),
            "company_name": COMPANIES[ci]["name"],
            "applications_count": 0,
            "created_by": str(hr_oid),
            "created_at": now,
        }

        await db.jobs.insert_one(job_doc)
        created_jobs += 1
        short_company = COMPANIES[ci]["name"].split(" Co.")[0]
        print(f"[OK] {job_data['title']} ({short_company})")

    # =====================================================================
    # SUMMARY
    # =====================================================================
    print()
    print("=" * 40)
    total = created_companies + created_hr + created_jobs
    print(f"[DONE] Summary:")
    print(f"  Companies:     {created_companies} created")
    print(f"  HR Accounts:   {created_hr} created")
    print(f"  Job Positions: {created_jobs} created")
    print(f"  Total:         {total} records")
    print("=" * 40)

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
