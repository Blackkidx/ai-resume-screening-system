import sys
import os
import json
import asyncio
from dotenv import load_dotenv

# เพิ่ม path ให้หา services เจอ
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.llm_service import LLMService

def test_manual_resume():
    print("="*60)
    print("🧪 ทดสอบระบบดึงข้อมูล Resume ด้วย AI (Manual Test)")
    print("="*60)

    # 1. โหลด Environment Variables
    load_dotenv()
    
    # 2. อ่านข้อความ Resume จากตัวแปร (หรือจะอ่านจากไฟล์ก็ได้)
    # สมมติเป็น Resume ที่มีประสบการณ์ทำงานชัดเจน
    sample_resume_text = """
    ประวัติส่วนตัว
    ชื่อ: นายสมชาย ใจดี
    การศึกษา:
    - ปริญญาตรี สาขาวิทยการคอมพิวเตอร์ มหาวิทยาลัยเทคโนโลยีราชมงคล (2018-2022) GPA 3.50
    ทักษะ:
    - Python, React, MongoDB, Next.js
    ประสบการณ์ทำงาน:
    1. บริษัท Tech Startup (มกราคม 2023 - ธันวาคม 2023)
       ตำแหน่ง: Backend Developer
       รายละเอียดงาน: พัฒนา REST API ด้วย Python (FastAPI) และเชื่อมต่อกับฐานข้อมูล MongoDB
    2. บริษัท ABC จำกัด (มกราคม 2024 - ปัจจุบัน)
       ตำแหน่ง: Fullstack Developer
       รายละเอียดงาน: ดูแลระบบเซิร์ฟเวอร์ และสร้าง Feature ใหม่ๆ 
    โปรเจค:
    - แอปพลิเคชันจองโต๊ะร้านอาหาร (React, Firebase)
    """

    print("\n📄 อ่านข้อมูล Resume (จำลองข้อความ)...")
    print(sample_resume_text)
    print("-" * 60)
    
    # 3. เรียกใช้ LLM Service
    llm_service = LLMService()
    if not llm_service.is_ready():
        print("❌ ไม่พบ API Key! กรุณาตรวจสอบไฟล์ .env (ต้องมี GROQ_API_KEY)")
        return

    print("⏳ กำลังให้ AI (Groq) อ่านและแยกข้อมูล (ใช้เวลาสักครู่)...")
    
    # ดึงค่าแบบ raw response เพื่อดูว่า AI ตอบอะไรมากันแน่ (เผื่อ error)
    try:
        raw_response = llm_service.client.chat.completions.create(
            model=llm_service.model,
            messages=[
                {"role": "system", "content": "You are a fast, strict data extraction API. You MUST output ONLY valid JSON. Do not output any thinking, explanations, or markdown formatting outside the JSON block. If you cannot calculate a value like experience_months, just guess or set it to 0."},
                {"role": "user", "content": llm_service._build_prompt(sample_resume_text) + "\n\nCRITICAL: OUTPUT ONLY VALID JSON. NO THINKING."}
            ],
            temperature=0.0,
            max_tokens=2048,
        )
        raw_text = raw_response.choices[0].message.content
        print("\n[DEBUG] Raw Response จาก AI:")
        print(raw_text)
        print("-" * 60)
    except Exception as e:
        print(f"Error fetching raw response: {e}")

    result = llm_service.extract_features(sample_resume_text)
    
    print("\n✅ ผลลัพธ์ที่ได้หลังจาก Parse JSON:")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print("="*60)

if __name__ == "__main__":
    test_manual_resume()
