# XGBoost AI Pipeline — AI Resume Screening System

## 📌 Project Context
ระบบคัดกรอง Resume นักศึกษาฝึกงานสายเทค ใช้ AI จับคู่งาน
- Backend: FastAPI + Python (async)
- Database: MongoDB (motor async driver)
- AI ที่ทำงานอยู่แล้ว: Groq LLM extract features → SBERT semantic matching → Weighted scoring 6 มิติ
- Project path: ทำงานใน root ของ project

## 📌 AI Pipeline ที่ทำงานอยู่แล้ว (อย่าแก้)
PDF Upload → Groq LLM Extract → 6 Dimension Scores → Rule-based Weighted Score → Traffic Light (🟢🟡🔴)
- Skills (30%), Major (25%), Experience (15%), Projects (15%), Certification (10%), GPA (5%)
- Zone: 🟢 ≥80% | 🟡 50-79% | 🔴 <50%
- **อย่าแก้ไข matching_service.calculate_match() เดิม**

## 📌 สิ่งที่ต้องทำ — สร้าง XGBoost Pipeline

### Architecture:
```
นักศึกษาสมัครงาน
    ↓
AI วิเคราะห์ Resume (มีอยู่แล้ว)
    ↓
คำนวณ 6 มิติ scores (มีอยู่แล้ว)
    ↓
┌─ มี XGBoost Model? ─────────────────────┐
│  ✅ มี  → XGBoost ตัดสิน (AI หลัก)       │
│  ❌ ไม่  → ใช้ Rule-based แทน (สำรอง)    │
└───────────────────────────────────────────┘
    ↓
แสดงผล: Score + Zone + AI decision
    ↓
HR Accept/Reject → เก็บเป็น Training Data → Retrain → AI ฉลาดขึ้น
```

---

## 🆕 FILE 1: `backend/scripts/train_xgboost.py`

Training script — รัน `python backend/scripts/train_xgboost.py` แล้วได้ model

### MongoDB Connection:
- ใช้ `motor.motor_asyncio.AsyncIOMotorClient`
- อ่าน connection string จาก `MONGODB_URL` ใน `.env` (fallback: `mongodb://localhost:27017`)
- Database name: `ai_resume_screening`

### Data Source:
Query collection `applications` where `hr_decision` is not null:
```python
# MongoDB application document structure:
{
    "_id": ObjectId,
    "student_id": ObjectId,
    "job_id": ObjectId,
    "resume_id": ObjectId,
    "ai_overall_score": 85.5,
    "ai_zone": "green",
    "ai_breakdown": {
        "skills": 90.0,
        "major": 100.0,
        "experience": 70.0,
        "projects": 80.0,
        "certification": 60.0,
        "gpa": 75.0
    },
    "ai_breakdown_at_decision": {   # snapshot ตอน HR ตัดสิน
        "skills": 90.0,
        "major": 100.0,
        "experience": 70.0,
        "projects": 80.0,
        "certification": 60.0,
        "gpa": 75.0
    },
    "hr_decision": "accepted",  # or "rejected"
    "hr_reason": "ทักษะตรงกับตำแหน่ง",
    "decided_at": datetime,
    "decided_by": ObjectId
}
```

### Features (X) — 6 columns only (ไม่มี overall score):
```python
FEATURE_NAMES = ["skills", "major", "experience", "projects", "certification", "gpa"]
```
ดึงจาก `ai_breakdown_at_decision` (ถ้าไม่มีให้ fallback ใช้ `ai_breakdown`)

### Label (y) — binary:
- `hr_decision == "accepted"` → 1
- `hr_decision == "rejected"` → 0

### Training Pipeline:
1. Load data from MongoDB (async)
2. Validate — ต้องมีอย่างน้อย 20 samples
3. Check class balance — warn if ratio > 80/20
4. Create pandas DataFrame
5. StandardScaler on features
6. Train/Test split 80/20 (stratify=y, random_state=42)
7. Train XGBClassifier:
   - objective='binary:logistic'
   - n_estimators=100
   - max_depth=4
   - learning_rate=0.1
   - random_state=42
   - scale_pos_weight=auto (rejected_count / accepted_count)
   - eval_metric='logloss'
8. Evaluate on test set: Accuracy, Precision, Recall, F1-Score, AUC-ROC, Confusion Matrix, Classification Report
9. 5-fold Cross-Validation (print mean ± std)
10. Feature Importance (print ranking)
11. Save: model.pkl, scaler.pkl (joblib)
12. Save metadata.json
13. Save feature_importance.png (matplotlib bar chart)

### Console Output:
```
🚀 XGBoost Training Pipeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Loading data from MongoDB...
✅ Found 42 applications (18 accepted, 24 rejected)
📈 Training XGBoost...
✅ Training complete!
📊 Evaluation Results:
   Accuracy:  88.9%
   F1-Score:  87.5%
   AUC-ROC:   91.2%
📊 Cross-Validation (5-fold):
   Mean Accuracy: 85.6% (± 4.2%)
🏆 Feature Importance:
   skills:        0.35
   major:         0.25
   experience:    0.15
   projects:      0.12
   gpa:           0.08
   certification: 0.05
💾 Model saved to backend/models/
✅ Done!
```

### Error Handling:
- MongoDB ต่อไม่ได้ → print error + exit
- Data < 20 → print warning + exit
- Any training error → print traceback + exit

---

## 🆕 FILE 2: `backend/services/xgboost_service.py`

Singleton service — โหลด model ครั้งเดียวตอน app เริ่ม

### Singleton Pattern:
```python
class XGBoostService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
```

### Constructor `__init__()`:
- Try load: model.pkl, scaler.pkl, metadata.json
- If any missing → `self.model_loaded = False` (ไม่ crash)
- If all loaded → `self.model_loaded = True`
- ใช้ `pathlib.Path` + `logging`

### Methods:

| Method | Input | Output |
|--------|-------|--------|
| `predict(breakdown)` | `{"skills": 90, ...}` | `{"model_available": True, "xgboost_score": 87.0, "xgboost_decision": "accepted", "xgboost_confidence": 0.87}` |
| `is_model_available()` | — | `bool` |
| `get_model_info()` | — | metadata dict |
| `get_feature_importance()` | — | `{"skills": 0.35, ...}` sorted desc |
| `reload_model()` | — | Re-load files (หลัง retrain) |

---

## 🆕 FILE 3: `backend/routes/xgboost.py`

```python
router = APIRouter(tags=["XGBoost AI"])
```

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/predict` | POST | ทุกคน | ส่ง 6 คะแนน → ได้ AI prediction |
| `/model-info` | GET | ทุกคน | ดูข้อมูล model |
| `/retrain` | POST | Admin only | Train ใหม่ + reload model |

---

## 🆕 FILE 4: `backend/models/.gitkeep`
Empty file — สร้างโฟลเดอร์สำหรับเก็บ model

---

## ✏️ FILE 5: `backend/services/matching_service.py` (MODIFY)

**เพิ่ม** `calculate_ai_match()` — **อย่าแก้** `calculate_match()` เดิม

```python
def calculate_ai_match(self, resume_features, job_requirements):
    # 1. Rule-based score (เรียก method เดิม)
    rule_result = self.calculate_match(resume_features, job_requirements)

    # 2. XGBoost (ถ้ามี)
    xgb = XGBoostService.get_instance().predict(rule_result["breakdown"])

    if xgb.get("model_available"):
        return {**rule_result, "ai_method": "xgboost", **xgb}
    else:
        return {**rule_result, "ai_method": "rule_based", "model_available": False}
```

---

## ✏️ FILE 6: `backend/main.py` (MODIFY)
- Import + register: `app.include_router(xgboost_router, prefix="/api/xgboost")`
- Init XGBoostService on startup

---

## ✏️ FILE 7: `backend/requirements.txt` (MODIFY)
เพิ่ม: `xgboost`, `pandas`, `matplotlib`, `joblib`

---

## ⚠️ CRITICAL RULES

1. **อย่าแก้** `calculate_match()` เดิม — แค่เพิ่ม method ใหม่
2. **Graceful fallback** — ถ้าไม่มี model ระบบต้องทำงานปกติ
3. **motor async** สำหรับ MongoDB (ไม่ใช่ pymongo sync)
4. **อ่าน MONGODB_URL จาก .env** — ไม่ hardcode
5. **6 features เท่านั้น**: skills, major, experience, projects, certification, gpa
6. **Type hints + docstrings** ทุก function
7. **Logging module** (ยกเว้น train script ใช้ print ได้)
8. **ไม่สร้าง frontend** — backend เท่านั้น
9. **pathlib.Path** สำหรับ file paths

---

## File Structure หลังเสร็จ:
```
backend/
├── models/                      # 🆕
│   ├── .gitkeep                 # 🆕
│   ├── xgboost_model.pkl        # สร้างตอน train
│   ├── xgboost_scaler.pkl       # สร้างตอน train
│   ├── xgboost_metadata.json    # สร้างตอน train
│   └── feature_importance.png   # สร้างตอน train
├── scripts/
│   └── train_xgboost.py         # 🆕
├── services/
│   ├── matching_service.py      # ✏️ เพิ่ม calculate_ai_match()
│   ├── llm_service.py           # ไม่แก้
│   └── xgboost_service.py       # 🆕
├── routes/
│   ├── job.py                   # ไม่แก้
│   ├── auth.py                  # ไม่แก้
│   └── xgboost.py               # 🆕
├── main.py                      # ✏️ register router + init service
└── requirements.txt             # ✏️ +4 packages
```

## Checklist:
- [ ] สร้าง `backend/models/.gitkeep`
- [ ] สร้าง `backend/scripts/train_xgboost.py`
- [ ] สร้าง `backend/services/xgboost_service.py`
- [ ] สร้าง `backend/routes/xgboost.py`
- [ ] แก้ `backend/services/matching_service.py`
- [ ] แก้ `backend/main.py`
- [ ] แก้ `backend/requirements.txt`
- [ ] ทดสอบ API
- [ ] Commit & Push
