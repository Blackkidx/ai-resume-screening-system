# 🎯 แผนงาน: ปรับปรุง AI Scoring + Synthetic Data + XGBoost Training ✅ COMPLETED

> **วันที่สร้าง:** 28 ก.พ. 2026 (ทำพรุ่งนี้ 1 มี.ค. 2026)
> **เป้าหมาย:** ให้ XGBoost เทรนจากข้อมูลที่มีคุณภาพ และ AI Score สะท้อนมุมมอง HR จริง
> **สถานะ:** Retrained เป็น v5.0 เรียบร้อยแล้ว

---

## Phase 1: แก้ Certification Score (Dynamic Weighting)

### ปัญหา
- `certification: 50.0` ทุกคน ทั้งที่ resume ไม่มี cert
- กิน weight 10% เป็น noise

### แนวทาง
- แก้ `matching_service.py` → ถ้า resume ไม่มี cert **และ** job ไม่ได้ขอ cert → re-distribute weight 10% ให้ skills (+5%) กับ projects (+5%)
- ถ้า job ขอ cert แต่ resume ไม่มี → ให้ cert score = 0 (ลงโทษจริง)
- ถ้า resume มี cert ตรงกับ job → ให้ cert score ตามปกติ

### ไฟล์ที่แก้
- `backend/services/matching_service.py` → method `calculate_match`

---

## Phase 2: วิเคราะห์ Resume จริง 14 คน + สร้าง Synthetic Data

### 2.1 วิเคราะห์ Resume จริง

Sprint goal: อ่าน resume 14 คน แล้วสกัด pattern ออกมา

**สิ่งที่ต้องดู (ต่อคน):**
- สาขาเรียน (major) — ชื่อเป๊ะๆ ตามมหาวิทยาลัย
- ทักษะ (technical skills)
- มี project อะไร
- มี cert ไหม
- GPA

**ประเด็นสำคัญ — สาขาเรียนในไทย:**

มหาวิทยาลัยในไทยตั้งชื่อสาขาต่างกันแต่เนื้อหาคล้ายกัน เช่น:

| ชื่อสาขา | เทียบเท่ากับ |
|----------|-------------|
| วิทยาการคอมพิวเตอร์ (Computer Science) | CS มาตรฐาน |
| เทคโนโลยีสารสนเทศ (IT) | IT กว้างกว่า CS |
| เทคโนโลยีสารสนเทศและการสื่อสารดิจิทัล (ITDC) | IT + Digital Media |
| วิศวกรรมซอฟต์แวร์ (Software Engineering) | SE เน้น Dev Process |
| วิศวกรรมคอมพิวเตอร์ (Computer Engineering) | CE ลึกกว่า CS (hardware+software) |
| วิทยาศาสตร์ข้อมูล / Big Data | Data Science |
| ธุรกิจดิจิทัล (Digital Business) | IT + Business |
| สารสนเทศศาสตร์ | Library Science + IT |
| เทคโนโลยีเครือข่าย (Network Technology) | Network/Infra เน้น |
| ความมั่นคงไซเบอร์ (Cybersecurity) | Security เน้น |
| วิศวกรรมเครือข่าย (Network Engineering) | Network + Hardware |
| เทคโนโลยีสารสนเทศและระบบเครือข่าย | IT + Network ผสม |

**หลักการจับคู่สาขา:**
- ต้องใช้ **semantic matching** ไม่ใช่ exact match
- "ITDC" ควรตรงกับ job ที่ขอ "IT" หรือ "CS"
- "Big Data" ควรตรงกับ "Data Analytics"
- MatchingService ปัจจุบันใช้ SBERT ซึ่งรองรับอยู่แล้ว แต่ต้องตรวจว่า prompt ใน LLM สกัดชื่อสาขาออกมาถูกต้องหรือไม่

### 2.2 สร้าง Synthetic Data

**แนวคิด:**
1. ดึง 16 HR decisions จริง → วิเคราะห์ว่า HR accept/reject ตาม pattern ไหน
2. สร้าง script `generate_synthetic_data.py` ที่:
   - Random breakdown scores (skills, major, exp, projects, gpa) ตาม distribution ที่คล้ายจริง
   - Label accepted/rejected ตาม HR pattern + noise 10-15%
   - ใช้ชื่อสาขาจริงจากมหาวิทยาลัยในไทย (ไม่ใช่แค่ "CS", "IT")
   - Skills pool ดึงจาก resume จริง 14 คน + เพิ่มเติม (เช่น Python, React, SQL, Flutter ฯลฯ)
3. จำนวนเป้าหมาย: **250-300 records**
4. สัดส่วน: accepted ~45%, rejected ~55% (คล้ายจริง)

**ไฟล์ที่สร้าง:**
- `backend/scripts/generate_synthetic_data.py` → สร้าง CSV/JSON
- `backend/data/synthetic_training_data.json` → ข้อมูลที่สร้างได้

---

## Phase 3: เทรน XGBoost

**แนวคิด:**
1. รวม 16 records จริง + 250 synthetic → ~266 records
2. Features: skills_score, major_score, experience_score, projects_score, gpa_score (5 ตัว, ไม่รวม cert)
3. Label: accepted (1) / rejected (0)
4. Train/Test split: 80/20
5. Hyperparameter tuning: GridSearch เบื้องต้น
6. Metrics: Accuracy, Precision, Recall, F1, AUC-ROC
7. เป้าหมาย: **Accuracy ≥80%**

**ไฟล์ที่แก้/สร้าง:**
- `backend/scripts/train_xgboost.py` → ปรับให้รับ data ใหม่
- `backend/models/xgboost_model.json` → model file

---

## Phase 4: ทดสอบ + ตรวจสอบ

### Automated Tests
```
# รัน test_manual_resume.py ตรวจว่า cert score ปรับแล้ว
python backend/scripts/test_manual_resume.py

# รัน train_xgboost.py แล้วดูผล metrics
python backend/scripts/train_xgboost.py
```

### Manual Verification
1. เปิดหน้าเว็บ → ล็อกอิน HR → ดูคะแนน AI ของผู้สมัคร ว่า cert score เปลี่ยนไหม
2. เปรียบเทียบ AI score ก่อน/หลัง XGBoost ว่าสมเหตุสมผลกว่าเดิมไหม
3. ตรวจ confusion matrix ว่า model ไม่ bias ไปทาง accept หรือ reject มากเกินไป

---

## สรุป Task List

- [x] **Phase 1:** แก้ Dynamic Weighting ใน `matching_service.py` (เพิ่ม cert weight redistribution)
- [x] **Phase 2.1:** วิเคราะห์ resume 14 คน → สกัด pattern สาขา/skills
- [x] **Phase 2.2:** สร้าง synthetic data (`generate_synthetic_v5.py`)
- [x] **Phase 3:** เทรน XGBoost v5.0 — 805 samples, Accuracy 86.3%, AUC-ROC 0.954
- [x] **Phase 4:** ทดสอบ + ตรวจผล

---

## ผลลัพธ์ Model v5.0

| Metric | ค่า |
|--------|-----|
| Accuracy | 86.34% |
| Precision | 84.06% |
| Recall | 84.06% |
| F1 Score | 84.06% |
| AUC-ROC | 0.954 |
| CV Mean | 87.58% ± 2.2% |
| Samples | 805 (343 accepted / 462 rejected) |
| Features | 17 |
| Threshold | 0.5 |

**Top Features:** `skills_match_count` (49%), `skills_match_ratio` (10%), `relevant_projects` (5.3%)
