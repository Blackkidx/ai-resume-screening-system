# 🎓 ReIntern — AI Resume Screening System

> ระบบคัดกรอง Resume อัตโนมัติด้วย AI สำหรับการรับนักศึกษาฝึกงาน  
> พัฒนาเป็นโปรเจกต์สหกิจศึกษา คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี (RMUTT)

🌐 **เข้าใช้งานระบบ:** [http://reintern.web.sit.rmutt.ac.th/](http://reintern.web.sit.rmutt.ac.th/)

---

## 📖 ภาพรวมระบบ

**ReIntern** คือ Web Application สำหรับช่วยฝ่ายทรัพยากรบุคคล (HR) ในการคัดกรอง Resume ของนักศึกษาฝึกงานแบบอัตโนมัติ โดยใช้เทคโนโลยี AI วิเคราะห์และจับคู่ (Matching) คุณสมบัติของผู้สมัครกับตำแหน่งงานที่เปิดรับ ช่วยลดเวลาในการคัดกรองเอกสารจากหลายชั่วโมงเหลือไม่กี่นาที

### ปัญหาที่แก้ไข

| ปัญหา | วิธีแก้ของ ReIntern |
|-------|---------------------|
| HR ใช้เวลานานในการอ่าน Resume ทีละฉบับ | AI อ่านและดึงข้อมูลจาก PDF อัตโนมัติ |
| การตัดสินใจคัดกรองขึ้นอยู่กับอคติบุคคล | ระบบให้คะแนนตามเกณฑ์ที่กำหนดไว้ชัดเจน |
| ยากที่จะเปรียบเทียบผู้สมัครจำนวนมาก | Dashboard แสดงผลเปรียบเทียบ + จัดอันดับอัตโนมัติ |
| ไม่มีระบบติดตามสถานะใบสมัคร | นักศึกษาเห็นสถานะแบบ Real-time ผ่าน Notification |

---

## ✨ ฟีเจอร์หลัก

### 🤖 AI Resume Analysis
- **อ่าน Resume PDF อัตโนมัติ** — ดึงข้อมูลการศึกษา, ทักษะ, โปรเจกต์, ประสบการณ์, ใบรับรอง ออกมาเป็นข้อมูลโครงสร้าง
- **รองรับภาษาไทยและอังกฤษ** — ใช้ LLM (Llama 3.3 70B ผ่าน Groq API) ที่เข้าใจ Resume ทั้งสองภาษา
- **วิเคราะห์ใบรับรอง (Certificate)** — AI ตรวจสอบความถูกต้องและความเกี่ยวข้องของใบ Cert กับตำแหน่งงาน

### 🎯 Weighted Matching Score
ระบบคำนวณคะแนนความเหมาะสมระหว่าง Resume กับตำแหน่งงาน ด้วยน้ำหนักที่วิจัยแล้ว:

| เกณฑ์ | น้ำหนัก | วิธีคำนวณ |
|-------|---------|-----------|
| ทักษะ (Skills) | **30%** | Exact Matching (60%) + Semantic Similarity via SBERT (40%) |
| สาขาวิชา (Major) | **25%** | Exact → Similar Field → Related Keywords |
| ประสบการณ์ (Experience) | **15%** | จำนวนเดือนของประสบการณ์จริง |
| โปรเจกต์ (Projects) | **15%** | จำนวนโปรเจกต์ที่เกี่ยวข้องกับงาน |
| ใบรับรอง (Certifications) | **10%** | ตรวจสอบ domain และ skills ที่ครอบคลุม |
| เกรดเฉลี่ย (GPA) | **5%** | แบ่งช่วงตามเกณฑ์ (≥3.5 → 100%) |

### 🧠 XGBoost Machine Learning
- โมเดล XGBoost ที่เทรนจากข้อมูลจริง ช่วยพยากรณ์ว่าผู้สมัครควร "ผ่าน" หรือ "ไม่ผ่าน"
- ใช้ 17 features (skills_match_ratio, major_match_score, relevant_projects ฯลฯ)
- มี Graceful Fallback — ถ้าโมเดลไม่พร้อม จะใช้ Rule-based Scoring แทน

### 👥 ระบบบทบาทผู้ใช้งาน (Role-Based Access)

| บทบาท | ความสามารถ |
|-------|-----------|
| **นักศึกษา (Student)** | อัปโหลด Resume/Cert, ดูตำแหน่งงาน, สมัครงาน, ติดตามสถานะ, รับ Notification |
| **HR** | สร้าง/แก้ไขตำแหน่งงาน, ดูผลวิเคราะห์ AI, คัดเลือก/ปฏิเสธผู้สมัคร, ดู Analytics, ค้นหาผู้สมัคร |
| **Admin** | จัดการ User ทั้งหมด, จัดการบริษัท, Dashboard ภาพรวมระบบ |

### 🔔 Real-time Notification
- ระบบแจ้งเตือนแบบ Server-Sent Events (SSE)
- นักศึกษาเห็นผลการคัดเลือกทันทีที่ HR อัปเดตสถานะ

### 📧 Email OTP Verification
- ยืนยันตัวตนผ่าน Email OTP ตอนสมัครสมาชิก
- รองรับ Forgot Password / Reset Password

---

## 🏗️ สถาปัตยกรรมระบบ (System Architecture)

```
┌──────────────────────┐      HTTP/REST API       ┌──────────────────────┐
│                      │  ◄──────────────────────► │                      │
│    Frontend (React)  │                           │   Backend (FastAPI)  │
│                      │                           │                      │
│  • Homepage          │                           │  Routes:             │
│  • Student Dashboard │                           │  • /api/auth         │
│  • HR Dashboard      │                           │  • /api/jobs         │
│  • Admin Dashboard   │                           │  • /api/resume       │
│  • Job Management    │                           │  • /api/matching     │
│  • Resume Upload     │                           │  • /api/certificate  │
│  • Analytics         │                           │  • /api/admin        │
│                      │                           │  • /api/company      │
└──────────────────────┘                           └──────────┬───────────┘
                                                              │
                              ┌────────────────────────────────┼───────────────┐
                              │                                │               │
                     ┌────────▼────────┐             ┌─────────▼──────┐  ┌─────▼──────┐
                     │    MongoDB      │             │   Groq API     │  │   SMTP     │
                     │  (Database)     │             │  (Llama 3.3)   │  │  (Email)   │
                     │                 │             │                │  │            │
                     │ • users         │             │ Resume Extract │  │ OTP Email  │
                     │ • jobs          │             │ Cert Analysis  │  │ Reset PWD  │
                     │ • applications  │             └────────────────┘  └────────────┘
                     │ • companies     │
                     │ • notifications │             ┌────────────────┐
                     └─────────────────┘             │  SBERT Model   │
                                                     │ (all-MiniLM)   │
                                                     │                │
                                                     │ Semantic Skill │
                                                     │ Matching       │
                                                     └────────────────┘
                                                     ┌────────────────┐
                                                     │  XGBoost Model │
                                                     │                │
                                                     │ Accept/Reject  │
                                                     │ Prediction     │
                                                     └────────────────┘
```

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Backend
| เทคโนโลยี | หน้าที่ |
|-----------|---------|
| **FastAPI** | Web Framework (Python) |
| **MongoDB + Motor** | ฐานข้อมูล NoSQL (Async Driver) |
| **Pydantic** | Data Validation & Serialization |
| **JWT (python-jose)** | Authentication & Authorization |
| **PyPDF2 + pdfplumber** | อ่านและ Extract ข้อความจาก PDF |
| **Groq API (Llama 3.3 70B)** | LLM สำหรับวิเคราะห์ Resume |
| **Sentence-Transformers (SBERT)** | Semantic Similarity สำหรับจับคู่ Skills |
| **XGBoost** | Machine Learning Model สำหรับพยากรณ์ผล |
| **scikit-learn** | เครื่องมือ ML เสริม (cosine_similarity) |
| **SlowAPI** | Rate Limiting (100 req/min per IP) |

### Frontend
| เทคโนโลยี | หน้าที่ |
|-----------|---------|
| **React 19** | UI Framework |
| **React Router v7** | Client-side Routing |
| **Tailwind CSS 3** | Utility-first CSS Styling |
| **Chart.js + react-chartjs-2** | กราฟและ Data Visualization |
| **Axios** | HTTP Client สำหรับเรียก API |
| **SweetAlert2** | UI Alerts & Confirmations |

### Infrastructure
| เทคโนโลยี | หน้าที่ |
|-----------|---------|
| **PM2** | Process Manager (Production) |
| **SMTP (Gmail)** | ส่ง OTP Email |
| **SSE (Server-Sent Events)** | Real-time Notifications |

---

## 📂 โครงสร้างโปรเจกต์

```
ai-resume-screening-system/
├── backend/
│   ├── main.py                 # FastAPI Application Entry Point
│   ├── requirements.txt        # Python Dependencies
│   ├── core/                   # Database & Auth Configuration
│   ├── routes/                 # API Endpoints
│   │   ├── auth.py             #   └─ Register, Login, OTP, Reset Password
│   │   ├── admin.py            #   └─ Admin Dashboard, User Management
│   │   ├── company.py          #   └─ Company CRUD, HR Assignment
│   │   ├── student.py          #   └─ Student Dashboard
│   │   ├── profile.py          #   └─ User Profile, Upload Image
│   │   ├── resume.py           #   └─ Resume Upload & AI Analysis
│   │   ├── job.py              #   └─ Job CRUD, Search, Filter
│   │   ├── matching.py         #   └─ AI Matching & Scoring
│   │   ├── certificate.py      #   └─ Certificate Upload & AI Analysis
│   │   └── xgboost.py          #   └─ XGBoost Model API
│   ├── services/               # Business Logic
│   │   ├── llm_service.py      #   └─ Groq LLM Integration (TH/EN)
│   │   ├── matching_service.py #   └─ Weighted Scoring Algorithm
│   │   ├── xgboost_service.py  #   └─ ML Model Prediction
│   │   ├── pdf_service.py      #   └─ PDF Text Extraction
│   │   ├── email_service.py    #   └─ OTP Email via SMTP
│   │   └── notification_service.py # └─ SSE Real-time Notifications
│   ├── models/                 # XGBoost Trained Model Files
│   └── uploads/                # Uploaded Files (Resume, Profile, Cert)
│
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   └── src/
│       ├── App.js              # Routes & App Structure
│       ├── components/
│       │   ├── Homepage/       # Landing Page
│       │   ├── Auth/           # OTP, Forgot/Reset Password
│       │   ├── Login/          # Login Page
│       │   ├── Register/       # Registration Page
│       │   ├── Student/        # Student Features
│       │   │   ├── StudentDashboard.jsx
│       │   │   ├── ResumeUpload.jsx
│       │   │   ├── CertificateUpload.jsx
│       │   │   ├── MyApplications.jsx
│       │   │   └── NotReadyJobs.jsx
│       │   ├── HR/             # HR Features
│       │   │   ├── HRDashboard.jsx
│       │   │   ├── JobCreation.jsx
│       │   │   ├── JobManagement.jsx
│       │   │   ├── ApplicantReview.jsx  # ← หน้าหลักดูผล AI
│       │   │   ├── HRAnalytics.jsx
│       │   │   └── ApplicantSearch.jsx
│       │   ├── Admin/          # Admin Features
│       │   │   ├── AdminDashboard.jsx
│       │   │   └── CompanyManagement.jsx
│       │   ├── Profile/        # User Profile
│       │   ├── Jobs/           # Job Detail Page
│       │   ├── Companies/      # Company Listing
│       │   └── Navbar/         # Navigation Bar
│       ├── contexts/           # React Context (Auth, Notification)
│       ├── hooks/              # Custom React Hooks
│       └── services/           # API Service Layer
│
└── README.md
```

---

## 🔄 ขั้นตอนการทำงานของระบบ (User Flow)

### สำหรับนักศึกษา
```
สมัครสมาชิก → ยืนยัน OTP → เข้าสู่ระบบ → อัปโหลด Resume (PDF)
    → AI วิเคราะห์ Resume อัตโนมัติ → อัปโหลดใบ Cert (ถ้ามี)
    → ดูตำแหน่งงานที่เปิดรับ → สมัครงาน
    → ติดตามสถานะ → รับ Notification เมื่อ HR อัปเดต
```

### สำหรับ HR
```
เข้าสู่ระบบ → สร้างตำแหน่งงาน (กำหนด Skills, สาขา, เงื่อนไข)
    → ระบบรับใบสมัคร → AI คำนวณ Matching Score อัตโนมัติ
    → ดูผลวิเคราะห์ (คะแนน, Breakdown, Zone สี)
    → คัดเลือก/ปฏิเสธ → นักศึกษาได้รับ Notification ทันที
    → ดู Analytics ภาพรวม
```

### Zone การจัดระดับ
| Zone | คะแนน | ความหมาย |
|------|-------|----------|
| 🟢 Green | 70–100% | เหมาะสมมาก — แนะนำเรียกสัมภาษณ์ |
| 🟡 Yellow | 40–69% | พอใช้ได้ — ควรพิจารณาเพิ่มเติม |
| 🔴 Red | 0–39% | ไม่ตรงเกณฑ์ — ไม่แนะนำ |

---

## 🚀 วิธีรันระบบ (Development)

### สิ่งที่ต้องมี
- **Python 3.11–3.13** (แนะนำ 3.13)
- **Node.js 16+**
- **MongoDB** (Local หรือ MongoDB Atlas)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Backend รันที่ → `http://localhost:8000`  
API Docs (dev only) → `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm start
```
Frontend รันที่ → `http://localhost:3000`

---

## 🔐 Security

- **JWT Authentication** — Token-based Authentication พร้อม Expiration
- **Password Hashing** — bcrypt + passlib
- **Rate Limiting** — 100 requests/minute per IP (SlowAPI)
- **Security Headers** — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS
- **File Access Control** — Resume/Certificate ต้อง Login ถึงจะเข้าถึงได้
- **CORS Protection** — อนุญาตเฉพาะ Origin ที่กำหนด
- **OTP Verification** — ยืนยันอีเมลก่อนเข้าใช้งาน

---

## 📄 License

โปรเจกต์นี้เผยแพร่ภายใต้ [MIT License](LICENSE)

---

<p align="center">
  พัฒนาโดยนักศึกษาสาขาเทคโนโลยีสารสนเทศและการสื่อสารดิจิทัล<br>
  คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี
</p>
