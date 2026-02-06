# AI Resume Screening System for Interns

ระบบคัดกรอง Resume อัตโนมัติด้วย AI สำหรับการรับสมัครนักศึกษาฝึกงาน

## 📋 Requirements

- **Python 3.11 - 3.13** (แนะนำ 3.13)
- **Node.js 16+** (สำหรับ Frontend)
- **MongoDB** (Local หรือ MongoDB Atlas)

## 🚀 Installation

### Backend Setup

1. เข้าไปที่โฟลเดอร์ backend:
```bash
cd backend
```

2. สร้าง Virtual Environment:
```bash
python -m venv venv
```

3. เปิดใช้งาน Virtual Environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. ติดตั้ง Dependencies:
```bash
pip install -r requirements.txt
```

5. สร้างไฟล์ `.env` ในโฟลเดอร์ backend:
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=resume_screening
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

6. รัน Backend Server:
```bash
python main.py
```

Backend จะรันที่ `http://localhost:8000`

### Frontend Setup

1. เข้าไปที่โฟลเดอร์ frontend:
```bash
cd frontend
```

2. ติดตั้ง Dependencies:
```bash
npm install
```

3. รัน Frontend Development Server:
```bash
npm run dev
```

Frontend จะรันที่ `http://localhost:5173`

## 👥 Default Users

ดูข้อมูล Username และ Password ได้ที่ไฟล์ `UserandPass.txt`

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
