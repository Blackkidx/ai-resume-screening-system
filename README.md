# AI Resume Screening System for Interns

ระบบคัดกรอง Resume อัตโนมัติด้วย AI สำหรับการรับสมัครนักศึกษาฝึกงาน

## 📋 Requirements

- **Python 3.11 - 3.13** (แนะนำ 3.13)
- **Node.js 16+** (สำหรับ Frontend)
- **MongoDB** (Local หรือ MongoDB Atlas)

## 🚀 วิธีการติดตั้งและรันระบบ (Deployment Guide)

ระบบสามารถรันได้ 2 วิธีหลัก:
1. **รันบนเครื่องตัวเอง (Localhost)** - สำหรับการพัฒนาและทดสอบ
2. **รันบนเครื่อง Server** - สำหรับนักศึกษา RMUTT ใช้งานจริง (ต้องต่อ VPN มหาวิทยาลัย)

---

### 💻 1. การรันบนเครื่องตัวเอง (Localhost Development)

**สิ่งแวดล้อม: `ENVIRONMENT=development`**

#### 🐍 Backend (FastAPI)
1. เปิด Command Prompt (CMD) เข้าไปที่โฟลเดอร์ `backend`
2. สร้างและเปิดใช้งาน Virtual Environment:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```
3. ติดตั้ง Dependencies:
   ```cmd
   pip install -r requirements.txt
   ```
4. ตรวจสอบตั้งค่าไฟล์ `backend/.env` ให้แน่ใจว่า:
   - `ENVIRONMENT=development`
   - `FRONTEND_URL=http://localhost:3000`
5. รัน Backend:
   ```cmd
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   *(Backend จะรันอยู่ที่ `http://localhost:8000`)*

#### ⚛️ Frontend (React)
1. เปิด Command Prompt (CMD) ใหม่ เข้าไปที่โฟลเดอร์ `frontend`
2. ติดตั้ง Node Modules:
   ```cmd
   npm install
   ```
3. ตรวจสอบไฟล์ `frontend/src/config.js` ให้ `API_BASE_URL = 'http://localhost:8000'`
4. รันโหมดนักพัฒนา:
   ```cmd
   npm start
   ```
   *(Frontend จะเปิดเว็บให้อัตโนมัติที่ `http://localhost:3000`)*

---

### 🌐 2. การรันบนเครื่อง Server (สำหรับนักศึกษา RMUTT)

**เข้าใช้งานระบบได้ที่ URL:** 👉 **http://172.18.148.97:3000/** 
> ⚠️ **ข้อสำคัญ:** การเข้าถึงจากภายนอกเครือข่ายมหาวิทยาลัย ผู้ใช้งาน**ต้องเชื่อมต่อระบบ VPN ของมหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี (RMUTT)** ก่อน จึงจะสามารถเข้าถึงเว็บไซต์ได้

**สิ่งแวดล้อม: `ENVIRONMENT=production`**

#### 🐍 Backend (FastAPI) - Server
เพื่อให้ API ทำงานได้ตลอด 24 ชั่วโมงแม้ปิดหน้าต่าง Command Prompt (CMD) เราจะรันผ่าน PM2
```cmd
cd C:\ai-resume-screening-system\backend
venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 
หรือ
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name "AI-Resume-Backend"
```
*(ทดสอบสถานะ API ได้ที่: `http://172.18.148.97:8000/api/health`)*

#### ⚛️ Frontend (React) - Server
การรัน Frontend โค้ดที่พร้อมใช้งานจริง (Production Build)
```cmd
# 1. รันในเครื่องที่มีโค้ด เพื่อสร้างโฟลเดอร์ build
cd frontend
npm run build

# 2. นำโฟลเดอร์ build ไปวางใน Server และเปิดใช้งานผ่าน PM2 (เปิดด้วย CMD)
cd C:\ai-resume-screening-system\frontend
pm2 serve build 3000 --spa --name "AI-Resume-Frontend"
```

## 🛠️ Tech Stack

### Backend
- FastAPI
- MongoDB (Motor)
- Pydantic
- JWT Authentication
- PDF Processing (PyPDF2, pdfplumber)

### Frontend
- React
- Vite
- React Router

## 📝 Notes

- ถ้าใช้ Python 3.13 และเจอปัญหา `pydantic_core` ให้รัน:
  ```bash
  pip install --upgrade pydantic pydantic-core
  ```
- ตรวจสอบให้แน่ใจว่า MongoDB กำลังรันอยู่ก่อนเริ่ม Backend
