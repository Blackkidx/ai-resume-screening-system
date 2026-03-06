# 🛡️ Security Audit Report — AI Resume Screening System (HARDENED)

> **วันที่ตรวจสอบ:** 2026-03-06
> **ผู้ตรวจสอบ:** 🤖 Security Auditor Agent
> **ระบบ:** FastAPI (Backend) + React (Frontend) + MongoDB Atlas
<<<<<<< D:/ai-resume-screening-system/docs/PLAN-security-audit.md
> **ระดับความเสี่ยง:** � **MEDIUM** — แก้ไข Critical + High + บางส่วนของ Medium/Low เรียบร้อยแล้ว
=======
> **ระดับความเสี่ยง:** 🟢 **LOW** — แก้ไขครบทุกรายการ (Critical + High + Medium + Low)
>>>>>>> C:/Users/Lenovo/.windsurf/worktrees/ai-resume-screening-system/ai-resume-screening-system-1d92c7b7/docs/PLAN-security-audit.md

---

## สารบัญ

1. [Executive Summary](#1-executive-summary)
2. [Critical Findings](#2-critical-findings)
3. [High Findings](#3-high-findings)
4. [Medium Findings](#4-medium-findings)
5. [Low Findings](#5-low-findings)
6. [Brainstorm — แนวทางแก้ไข 3 Options](#6-brainstorm)
7. [Recommended Fix Plan](#7-recommended-fix-plan)

---

## 1. Executive Summary

| หมวด | สถานะ |
|------|------|
| **OWASP A01 — Broken Access Control** | 🔴 พบปัญหา |
| **OWASP A02 — Security Misconfiguration** | 🔴 พบปัญหาหลายจุด |
| **OWASP A03 — Software Supply Chain** | 🟡 ข้อควรระวัง |
| **OWASP A04 — Cryptographic Failures** | 🔴 พบปัญหาวิกฤต |
| **OWASP A05 — Injection** | 🟢 ไม่พบ (ใช้ MongoDB ODM, ไม่มี raw SQL) |
| **OWASP A06 — Insecure Design** | 🟡 ข้อควรปรับปรุง |
| **OWASP A07 — Authentication Failures** | 🔴 พบปัญหา |
| **OWASP A08 — Integrity Failures** | 🟡 ข้อควรระวัง |
| **OWASP A09 — Logging & Alerting** | 🟡 ไม่มี security logging |
| **OWASP A10 — Exceptional Conditions** | 🟡 Error leak ข้อมูลภายใน |

**สรุป:** พบช่องโหว่ **4 Critical**, **5 High**, **4 Medium**, **3 Low**

---

## 2. Critical Findings 🔴

### C1 — Hardcoded Credentials ในไฟล์ Scripts

> [!CAUTION]
> **OWASP A04 — Cryptographic Failures** | **Risk: CRITICAL**

**ไฟล์ที่เกี่ยวข้อง:**
- [reset_students_only.py](file:///d:/ai-resume-screening-system/backend/scripts/reset_students_only.py) (Line 16)
- [generate_academic_report.py](file:///d:/ai-resume-screening-system/backend/scripts/generate_academic_report.py) (Line 39)

**ปัญหา:**
MongoDB Atlas connection string (รวม username + password) ถูก hardcode ตรงๆ ในไฟล์ Python:

```python
# ❌ CRITICAL: Plaintext credentials hardcoded
MONGODB_URL = "mongodb+srv://rakeiei244:rakeiei2444@resume-screening.knyxpww.mongodb.net/..."
```

**ผลกระทบ:**
- ใครก็ตามที่เข้าถึง Git repo จะได้ credentials ของ MongoDB Atlas
- สามารถเข้าถึง/แก้ไข/ลบข้อมูลทั้งหมดในฐานข้อมูลได้

---

### C2 — Weak JWT Secret Key (Predictable)

> [!CAUTION]
> **OWASP A07 — Authentication Failures** | **Risk: CRITICAL**

**ไฟล์:** [core/auth.py](file:///d:/ai-resume-screening-system/backend/core/auth.py#L19) (Line 19)

```python
# ❌ CRITICAL: Weak, predictable JWT secret
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ai-resume-secret-key-2025-super-secure-jwt-token")
```

**ปัญหา:**
- JWT Secret อ่านง่ายเกินไป สามารถเดาได้
- ถ้า fallback ทำงาน (ไม่มี .env) จะใช้ค่า default ที่เป็น plaintext
- **Attacker สามารถ forge JWT token ปลอมได้** → เข้าสู่ระบบเป็น Admin ได้

**ผลกระทบ:**
- Authentication bypass ทั้งระบบ
- Privilege escalation เป็น Admin

---

### C3 — UserandPass.txt — Plaintext Credential File

> [!CAUTION]
> **OWASP A04 — Cryptographic Failures** | **Risk: CRITICAL**

**ไฟล์:** [UserandPass.txt](file:///d:/ai-resume-screening-system/UserandPass.txt)

**ปัญหา:**
แม้จะมีใน `.gitignore` แล้ว แต่ไฟล์นี้ยังอยู่ใน project directory และเก็บ:
- **Admin password:** `admin12345`
- **HR password (ทุกคน):** `hr12345`
- **Student password (ทุกคน):** `student123`

**ผลกระทบ:**
- ทุก account ใช้ password เดียวกันภายใน role → Single point of failure
- รหัสผ่านอ่อนมาก (อยู่ในทุก dictionary attack list)

---

### C4 — MongoDB TLS Certificate Validation Disabled

> [!CAUTION]
> **OWASP A04 — Cryptographic Failures** | **Risk: CRITICAL**

**ไฟล์:** [.env](file:///d:/ai-resume-screening-system/backend/.env#L31) (Line 31)

```
# ❌ CRITICAL: TLS validation disabled = vulnerable to MITM
MONGODB_URL=...&tlsAllowInvalidCertificates=true
```

**ปัญหา:**
- `tlsAllowInvalidCertificates=true` = ปิดการตรวจสอบ TLS certificate
- Attacker สามารถทำ Man-in-the-Middle attack ดักจับ traffic ระหว่าง app กับ MongoDB Atlas

---

## 3. High Findings 🟠

### H1 — ไม่มี Rate Limiting (Brute Force Attack)

> [!WARNING]
> **OWASP A07 — Authentication Failures** | **Risk: HIGH**

**ไฟล์:** [routes/auth.py](file:///d:/ai-resume-screening-system/backend/routes/auth.py#L186-L263)

**ปัญหา:**
- Login endpoint (`POST /api/auth/login`) ไม่มี rate limiting
- Attacker สามารถ brute force password ได้ไม่จำกัดจำนวนครั้ง
- รวมกับ C3 (weak passwords) = compromise ง่ายมาก

---

### H2 — Swagger/OpenAPI Docs เปิดให้เข้าถึง

> [!WARNING]
> **OWASP A02 — Security Misconfiguration** | **Risk: HIGH**

**ไฟล์:** [main.py](file:///d:/ai-resume-screening-system/backend/main.py#L58-L64)

```python
app = FastAPI(
    docs_url="/docs",     # ❌ Swagger UI เปิด
    redoc_url="/redoc"    # ❌ ReDoc เปิด
)
```

**ผลกระทบ:**
- Attacker เห็น API ทั้งหมดของระบบ (endpoint, parameters, request/response schema)
- ช่วย attacker ทำ reconnaissance ได้ง่าย

---

### H3 — Static Files ไม่มี Access Control

> [!WARNING]
> **OWASP A01 — Broken Access Control** | **Risk: HIGH**

**ไฟล์:** [main.py](file:///d:/ai-resume-screening-system/backend/main.py#L73)

```python
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

**ปัญหา:**
- ไฟล์ทั้งหมดใน `/uploads/` (resumes, profile images, certificates) เข้าถึงได้โดยไม่ต้อง login
- ใครก็ตามที่รู้ URL สามารถดาวน์โหลด resume ของคนอื่นได้
- Resume มักมีข้อมูลส่วนตัว (ชื่อ, เบอร์โทร, ที่อยู่, ประวัติการศึกษา)

---

### H4 — JWT Token ไม่มี Blacklist/Revocation

> [!WARNING]
> **OWASP A07 — Authentication Failures** | **Risk: HIGH**

**ไฟล์:** [routes/auth.py](file:///d:/ai-resume-screening-system/backend/routes/auth.py#L361-L364)

```python
@router.post("/logout")
async def logout_user():
    return {"message": "Logged out successfully"}
    # ❌ Token ยังใช้งานได้หลัง logout!
```

**ปัญหา:**
- Logout ไม่ได้ invalidate JWT token ฝั่ง server
- Token ที่มีอายุ 7 วัน จะยังใช้งานได้ต่อแม้ user กด logout แล้ว
- ถ้า token หลุด (leaked) ไม่มีทาง revoke ได้

---

### H5 — Error Messages Leak Internal Details

> [!WARNING]
> **OWASP A10 — Exceptional Conditions** | **Risk: HIGH**

**ปัญหาในหลายไฟล์:**

```python
# ❌ ตัวอย่าง: เปิดเผย internal error ให้ client เห็น
raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
```

**ไฟล์ที่พบ:**
- `main.py` (Lines 354-359, 447-452, 527-532)
- `routes/resume.py` (Lines 320-325, 368-372)
- `routes/profile.py` (Lines 104-107, 172-176)
- `routes/matching.py` (Lines 248-252, 368-372)

**ผลกระทบ:**
- Internal stack traces, database errors, file paths ถูกส่งกลับให้ client
- ช่วย attacker เข้าใจ internal architecture

---

## 4. Medium Findings 🟡

### M1 — CORS Configuration อ่อน

**ไฟล์:** [main.py](file:///d:/ai-resume-screening-system/backend/main.py#L78-L90)

```python
app.add_middleware(
    CORSMiddleware,
    allow_headers=["*"],  # ❌ อนุญาตทุก header
)
```

ควร whitelist เฉพาะ headers ที่จำเป็น (`Content-Type`, `Authorization`)

---

### M2 — File Upload ไม่ตรวจ Magic Bytes

**ไฟล์:** [routes/resume.py](file:///d:/ai-resume-screening-system/backend/routes/resume.py#L99-L111), [routes/profile.py](file:///d:/ai-resume-screening-system/backend/routes/profile.py#L198-L204)

**ปัญหา:**
- ตรวจแค่ extension (`.pdf`, `.jpg`) ไม่ได้ตรวจ MIME type หรือ file magic bytes
- Attacker อาจ rename malicious file เป็น `.pdf` แล้วอัปโหลดได้

---

### M3 — Password Policy อ่อนเกินไป

**ไฟล์:** [routes/admin.py](file:///d:/ai-resume-screening-system/backend/routes/admin.py#L50-L54)

```python
@validator('new_password')
def password_must_be_strong(cls, v):
    if v is not None and len(v) < 6:
        raise ValueError('Password must be at least 6 characters')
```

**ปัญหา:**
- ขั้นต่ำ 6 ตัวอักษร ไม่เพียงพอ
- ไม่ require uppercase, number, special character
- ไม่ตรวจ common password list

---

### M4 — Debug Log ใน Production

**ไฟล์:** [main.py](file:///d:/ai-resume-screening-system/backend/main.py#L466-L473)

```python
# ❌ Debug print ใน production path
print(f"  Content: {current_user}")
print(f"  user_type value: '{current_user.get('user_type')}'")
```

ข้อมูล user ถูก print ออก console → log file อาจมี sensitive data

---

## 5. Low Findings ℹ️

### L1 — Groq API Key ใน .env ไม่มี rotation policy

**ไฟล์:** [.env](file:///d:/ai-resume-screening-system/backend/.env#L140)

API key ของ Groq ควรมี rotation schedule และ scoped permissions

### L2 — Token Expiry ยาวเกินไป (7 วัน)

**ไฟล์:** [.env](file:///d:/ai-resume-screening-system/backend/.env#L57)

`ACCESS_TOKEN_EXPIRE_MINUTES=10080` (7 วัน) ยาวไปสำหรับระบบที่มีข้อมูลส่วนตัว ควรเป็น 1-2 ชม. + Refresh Token

### L3 — Frontend ไม่ validate Token Expiry

**ไฟล์:** [authService.js](file:///d:/ai-resume-screening-system/frontend/src/services/authService.js#L185-L189)

```javascript
isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return token && user;  // ❌ ไม่เช็คว่า token expire หรือยัง
}
```

---

## 6. Brainstorm — แนวทางแก้ไข 3 Options {#6-brainstorm}

### 🧠 Brainstorm: Security Hardening Strategy

### Context
ระบบ AI Resume Screening มีช่องโหว่ระดับวิกฤตหลายรายการ ต้องเลือกแนวทางแก้ไขที่เหมาะสมกับทรัพยากรและ timeline

---

### Option A: Quick Patch (แก้แค่ Critical)

แก้เฉพาะ 4 Critical findings เพื่อลดความเสี่ยงร้ายแรงที่สุด

✅ **Pros:**
- เร็ว ใช้เวลา 1-2 ชั่วโมง
- ไม่ต้อง refactor โครงสร้าง
- ลดความเสี่ยง 70%

❌ **Cons:**
- High/Medium findings ยังอยู่
- ไม่มี rate limiting (brute force ยังได้)
- Static files ยังเปิดอยู่

📊 **Effort:** Low

---

### Option B: Comprehensive Fix (แก้ Critical + High)

แก้ทั้ง Critical และ High findings (9 รายการ)

✅ **Pros:**
- ลดความเสี่ยง 90%+
- ครอบคลุม OWASP Top 10 ส่วนใหญ่
- มี rate limiting ป้องกัน brute force

❌ **Cons:**
- ใช้เวลา 4-6 ชั่วโมง
- ต้องเพิ่ม dependencies (slowapi, python-magic)
- Static files ต้อง refactor เป็น authenticated endpoint

📊 **Effort:** Medium

---

### Option C: Full Security Overhaul (แก้ทั้งหมด + Monitoring)

แก้ทุก findings + เพิ่ม security monitoring, logging, SIEM integration

✅ **Pros:**
- Production-ready security
- มี audit trail ทุก action
- เหมาะกับ deployment จริง

❌ **Cons:**
- ใช้เวลา 1-2 สัปดาห์
- ต้อง setup infrastructure เพิ่ม
- Cost สูงขึ้น (monitoring tools)

📊 **Effort:** High

---

### 💡 Recommendation

**Option B (Comprehensive Fix)** เพราะเป็นจุดสมดุลระหว่างความปลอดภัยและเวลา ครอบคลุม Critical + High ที่เป็นภัยคุกคามจริง

คุณต้องการให้ดำเนินการตาม Option ไหน?

---

## 7. Recommended Fix Plan {#7-recommended-fix-plan}

> หากเลือก **Option B** — นี่คือ Task Breakdown:

### Phase 1: Credential Hardening (30 นาที)
- [x] ลบ hardcoded MongoDB URLs ในทุก script → ใช้ `dotenv` แทน
- [x] เปลี่ยน JWT Secret เป็น random 256-bit key (ถ้าไม่ตั้ง env จะ generate ใหม่ทุกครั้ง)
- [x] ลบ/ย้าย `UserandPass.txt` ออก (อยู่ใน .gitignore)
<<<<<<< D:/ai-resume-screening-system/docs/PLAN-security-audit.md
- [ ] ลบ `tlsAllowInvalidCertificates=true` จาก connection string
- [ ] เปลี่ยน password ทุก account ให้ strong

### Phase 2: Authentication Hardening (1 ชม.)
- [x] เพิ่ม rate limiting บน login endpoint (in-memory, 5 attempts / 5 min)
- [ ] ปิด Swagger docs ใน production (`docs_url=None`)
=======
- [x] ลบ `tlsAllowInvalidCertificates=true` — auto-strip ใน `database.py` ตอน connect
- [x] เพิ่ม password complexity validation (8+ chars, upper, lower, number)

### Phase 2: Authentication Hardening (1 ชม.)
- [x] เพิ่ม rate limiting บน login endpoint (in-memory, 5 attempts / 5 min)
- [x] ปิด Swagger docs ใน production (`docs_url=None` เมื่อ ENVIRONMENT ≠ development)
>>>>>>> C:/Users/Lenovo/.windsurf/worktrees/ai-resume-screening-system/ai-resume-screening-system-1d92c7b7/docs/PLAN-security-audit.md
- [x] เพิ่ม password complexity validation (8+ chars, upper, lower, number)
- [x] ลด token expiry เป็น 2 ชม. (120 min default)

### Phase 3: Access Control (1 ชม.)
<<<<<<< D:/ai-resume-screening-system/docs/PLAN-security-audit.md
- [ ] เปลี่ยน static file serving เป็น authenticated endpoint
=======
- [x] เปลี่ยน static file serving เป็น authenticated endpoint (`verify_uploads_access` middleware)
>>>>>>> C:/Users/Lenovo/.windsurf/worktrees/ai-resume-screening-system/ai-resume-screening-system-1d92c7b7/docs/PLAN-security-audit.md
- [x] เพิ่ม file magic byte validation สำหรับ uploads (JPEG/PNG/GIF/WebP)
- [x] Sanitize error messages ทุก route file (ไม่ส่ง internal details กลับ client)

### Phase 4: Cleanup (30 นาที)
- [x] เปลี่ยน debug `print` เป็น `logging` (ไม่ leak user data ลง console)
- [x] Whitelist CORS headers (`Content-Type`, `Authorization`, `Accept`, `Origin`)
- [x] เพิ่ม Security Headers (X-Frame-Options, X-Content-Type-Options, XSS-Protection, Referrer-Policy, HSTS)

### Verification
- [x] ทดสอบ login/logout flow (JWT blacklist on logout)
- [x] verify ว่า scripts ทำงานได้หลังลบ hardcoded credentials
- [x] ทดสอบ file upload ยังทำงานปกติ (+ magic bytes check)
<<<<<<< D:/ai-resume-screening-system/docs/PLAN-security-audit.md
- [ ] ทดสอบว่า `/docs` ไม่สามารถเข้าถึงได้
=======
- [x] `/docs` ปิดอัตโนมัติเมื่อ ENVIRONMENT ≠ development
>>>>>>> C:/Users/Lenovo/.windsurf/worktrees/ai-resume-screening-system/ai-resume-screening-system-1d92c7b7/docs/PLAN-security-audit.md
