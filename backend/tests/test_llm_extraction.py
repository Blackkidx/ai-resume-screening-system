# -*- coding: utf-8 -*-
# =============================================================================
# 🧪 TEST LLM EXTRACTION - ทดสอบ AI วิเคราะห์ Resume
# =============================================================================
"""
ทดสอบ LLMService class:
- เชื่อมต่อ Groq API ได้หรือไม่
- วิเคราะห์ Resume ได้หรือไม่
- ได้ JSON structure ที่ถูกต้องหรือไม่
"""

import sys
import os
import json
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.llm_service import LLMService


# Sample resume text สำหรับทดสอบ
SAMPLE_RESUME_TH = """
ประวัติการศึกษา:
ปริญญาตรี สาขาเทคโนโลยีสารสนเทศ
มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี (RMUTT)
เกรดเฉลี่ย: 3.25
ปีที่จบ: 2567

ทักษะ:
- โปรแกรมมิ่ง: Python, JavaScript, TypeScript
- Frontend: React, Next.js, Vue.js
- Backend: FastAPI, Node.js, Express
- Database: MongoDB, PostgreSQL, MySQL
- DevOps: Docker, Git, CI/CD
- ภาษา: ไทย (Native), อังกฤษ (ดี)

โปรเจค:
1. ระบบคัดกรอง Resume อัจฉริยะ (AI Resume Screening)
   - พัฒนา Full-stack web application สำหรับ HR
   - ใช้ AI วิเคราะห์ Resume อัตโนมัติ
   - เทคโนโลยี: Python, FastAPI, React, MongoDB, Groq AI

2. เว็บไซต์ E-commerce
   - ระบบร้านค้าออนไลน์
   - เทคโนโลยี: React, Node.js, MongoDB

ประสบการณ์:
ฝึกงาน บริษัท Tech Startup (6 เดือน)
- พัฒนา Web Application
- ทำงานร่วมกับทีม Developer
"""

SAMPLE_RESUME_EN = """
Education:
Bachelor of Science in Computer Science
King Mongkut's University of Technology Thonburi (KMUTT)
GPA: 3.45
Graduation Year: 2024

Technical Skills:
- Programming Languages: Python, Java, JavaScript, C++
- Web Development: React, Angular, Node.js, Django
- Database: MySQL, MongoDB, Redis
- Cloud: AWS, Google Cloud Platform
- Tools: Git, Docker, Kubernetes, Jenkins

Soft Skills:
- Team Collaboration
- Problem Solving
- Communication
- Time Management

Projects:
1. Machine Learning Image Classifier
   - Developed CNN model for image classification
   - Achieved 95% accuracy on test dataset
   - Technologies: Python, TensorFlow, OpenCV

2. Real-time Chat Application
   - Built WebSocket-based chat system
   - Supports group and private messaging
   - Technologies: Node.js, Socket.io, React, MongoDB

Work Experience:
Software Engineer Intern at ABC Tech Company (4 months)
- Developed REST APIs for mobile application
- Collaborated with cross-functional teams
- Participated in code reviews and testing
"""


def test_llm_service() -> bool:
    """
    ทดสอบ LLM Service
    
    Returns:
        bool: True ถ้าสำเร็จ
    """
    print("=" * 60)
    print("🧪 LLM SERVICE TEST")
    print("=" * 60)
    
    # Initialize LLM Service
    llm = LLMService()
    
    # ตรวจสอบว่าพร้อมใช้งานหรือไม่
    if not llm.is_ready():
        print("❌ LLM Service ไม่พร้อม!")
        print("   ตรวจสอบ GROQ_API_KEY ใน .env")
        return False
    
    print("✅ LLM Service พร้อมใช้งาน")
    print(f"📊 Model: {llm.model}")
    print("-" * 60)
    
    # ทดสอบกับ Resume ภาษาไทย
    print("\n📝 ทดสอบ Resume ภาษาไทย...")
    features_th = llm.extract_features(SAMPLE_RESUME_TH)
    
    if features_th and "extraction_error" not in features_th:
        print("✅ วิเคราะห์ Resume ภาษาไทยสำเร็จ!")
        print(json.dumps(features_th, indent=2, ensure_ascii=False))
    else:
        print("❌ วิเคราะห์ Resume ภาษาไทยไม่สำเร็จ")
        print(features_th)
        return False
    
    print("\n" + "-" * 60)
    
    # ทดสอบกับ Resume ภาษาอังกฤษ
    print("\n📝 ทดสอบ Resume ภาษาอังกฤษ...")
    features_en = llm.extract_features(SAMPLE_RESUME_EN)
    
    if features_en and "extraction_error" not in features_en:
        print("✅ วิเคราะห์ Resume ภาษาอังกฤษสำเร็จ!")
        print(json.dumps(features_en, indent=2, ensure_ascii=False))
    else:
        print("❌ วิเคราะห์ Resume ภาษาอังกฤษไม่สำเร็จ")
        print(features_en)
        return False
    
    # ตรวจสอบ structure
    print("\n" + "-" * 60)
    print("🔍 ตรวจสอบ JSON Structure...")
    
    required_keys = ["education", "skills", "projects", "experience_months", "languages"]
    all_valid = True
    
    for key in required_keys:
        if key in features_th:
            print(f"  ✅ {key}")
        else:
            print(f"  ❌ {key} - ไม่พบ!")
            all_valid = False
    
    return all_valid


def main():
    """Main function"""
    print("\n" + "=" * 60)
    print("🧠 LLM SERVICE TEST")
    print("=" * 60)
    
    success = test_llm_service()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ ALL TESTS PASSED")
    else:
        print("❌ SOME TESTS FAILED")
    print("=" * 60)


if __name__ == "__main__":
    main()
