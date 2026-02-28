# PLAN: Notification System (SSE + Timeline)

> ระบบแจ้งเตือนสถานะใบสมัครงานแบบ Real-time สำหรับนักศึกษา

## สรุปภาพรวม

เมื่อ HR ตัดสิน (accepted/rejected) → ระบบสร้าง notification + push ผ่าน SSE ทันที → นักศึกษาเห็น 🔔 bell icon + badge + Timeline สถานะ

```
HR กดตัดสิน
   ↓
Backend: insert notification doc + push SSE event
   ↓
Frontend: 🔔 badge อัพเดท + popup แจ้งเตือน
   ↓
Student คลิกดู → เห็น Timeline + เหตุผล HR
```

---

## Phase 1: Backend — Notification Service + SSE

### 1.1 [NEW] `backend/services/notification_service.py`

Notification service class ที่จัดการ:
- สร้าง notification document ลง MongoDB
- จัดการ SSE connections (เก็บ connection per user_id)
- broadcast event ไปหา student ที่ online

**Notification Document Structure:**
```python
{
    "user_id": "student_id",
    "type": "application_status",     # ประเภท
    "title": "ผลการสมัครงาน",
    "message": "ใบสมัคร Backend Dev — ผ่านการคัดเลือก!",
    "data": {
        "application_id": "...",
        "job_title": "Backend Developer",
        "company_name": "TechVision",
        "new_status": "accepted",
        "hr_reason": "ทักษะตรงกับตำแหน่ง"
    },
    "is_read": False,
    "created_at": datetime.utcnow()
}
```

**SSE Connection Manager:**
```python
class ConnectionManager:
    # dict: user_id → asyncio.Queue
    # เมื่อ student เปิดหน้าเว็บ → เพิ่ม queue
    # เมื่อ HR ตัดสิน → put event เข้า queue ของ student
    # SSE endpoint ดึงจาก queue → yield event
```

### 1.2 [MODIFY] `backend/routes/student.py`

- เพิ่ม **SSE endpoint**: `GET /student/notifications/stream` → `StreamingResponse`
- เพิ่ม **Mark as read**: `PUT /student/notifications/{id}/read`
- เพิ่ม **Mark all read**: `PUT /student/notifications/read-all`
- ปรับ `GET /student/notifications` ให้ serialize ObjectId ถูกต้อง

### 1.3 [MODIFY] `backend/routes/job.py`

ใน `update_application_status()` (L975-1036):
- เพิ่มการสร้าง notification doc หลัง update application สำเร็จ
- เพิ่มการ push SSE event ไปหา student
- เพิ่ม `status_history` entry สำหรับ Timeline

### 1.4 [MODIFY] `backend/main.py`

- import + include notification router (ถ้าแยก router)

---

## Phase 2: Frontend — Bell Icon + Notification Panel

### 2.1 [NEW] `frontend/src/services/notificationService.js`

Service class ที่จัดการ:
- `EventSource` connection สำหรับ SSE
- `fetchNotifications()` — ดึง notifications ครั้งแรก
- `markAsRead(id)` / `markAllAsRead()`
- Auto-reconnect เมื่อ connection หลุด

### 2.2 [NEW] `frontend/src/components/Navbar/NotificationBell.jsx`

- 🔔 Bell icon + badge ตัวเลข (unread count)
- คลิก → dropdown แสดง notifications ล่าสุด
- แต่ละ item: icon สถานะ + ชื่อตำแหน่ง + เวลา
- ปุ่ม "อ่านทั้งหมด"

### 2.3 [NEW] `frontend/src/styles/notification.css`

CSS สำหรับ bell icon, dropdown panel, notification items, animations

### 2.4 [MODIFY] `frontend/src/components/Navbar/Navbar.jsx`

- เพิ่ม `<NotificationBell />` component (แสดงเฉพาะ Student)

---

## Phase 3: Frontend — Status Timeline

### 3.1 [MODIFY] `frontend/src/components/Student/MyApplications.jsx`

ปรับ application card ให้มี:
- **Timeline component** — แสดง progress: สมัครแล้ว → HR กำลังพิจารณา → ผลลัพธ์
- **HR Reason** — แสดงเหตุผลที่ HR ให้มา
- **AI Score breakdown** — แสดง matching score 6 มิติ
- **Click to expand** — กดเพื่อดูรายละเอียด

### 3.2 [MODIFY] `frontend/src/styles/my-applications.css`

เพิ่ม styles สำหรับ:
- Timeline dots + lines
- Status colors (pending=เหลือง, accepted=เขียว, rejected=แดง)
- Expand animation
- HR reason card

---

## Phase 4: Integration + Polish

### 4.1 เพิ่ม `status_history` ใน Application Document

```python
"status_history": [
    {"status": "pending",  "at": "2026-02-26T...", "by": "system"},
    {"status": "reviewed", "at": "2026-02-27T...", "by": "hr_techvision"},
    {"status": "accepted", "at": "2026-02-28T...", "by": "hr_techvision",
     "reason": "ทักษะตรงกับตำแหน่ง"}
]
```

### 4.2 Toast Notification

เมื่อ SSE event เข้ามา → แสดง toast popup มุมขวาบน พร้อม animation

---

## สรุปไฟล์ที่ต้องทำ

| ประเภท | ไฟล์ | งาน |
|--------|------|-----|
| 🆕 NEW | `services/notification_service.py` | SSE manager + notification creation |
| 🆕 NEW | `services/notificationService.js` | Frontend SSE client |
| 🆕 NEW | `components/Navbar/NotificationBell.jsx` | Bell icon + dropdown |
| 🆕 NEW | `styles/notification.css` | Notification styles |
| ✏️ MODIFY | `routes/student.py` | SSE endpoint + mark-read APIs |
| ✏️ MODIFY | `routes/job.py` | Create notification on HR decision |
| ✏️ MODIFY | `main.py` | Include routes |
| ✏️ MODIFY | `Navbar.jsx` | Add bell component |
| ✏️ MODIFY | `MyApplications.jsx` | Timeline + HR reason |
| ✏️ MODIFY | `my-applications.css` | Timeline styles |

**Total: 4 new files, 6 modified files**

---

## Verification Checklist

- [ ] HR กดตัดสิน → notification สร้างใน DB ทันที
- [ ] Student ที่ online เห็น 🔔 badge อัพเดท real-time
- [ ] คลิก bell → เห็น dropdown รายการแจ้งเตือน
- [ ] คลิก notification → เปิดหน้า MyApplications
- [ ] MyApplications แสดง Timeline + HR reason ถูกต้อง
- [ ] Mark as read ทำงาน (badge ลดลง)
- [ ] SSE reconnect เมื่อ connection หลุด
- [ ] ไม่แสดง bell สำหรับ HR user (เฉพาะ Student)
