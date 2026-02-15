# -*- coding: utf-8 -*-
# =============================================================================
# 🧠 LLM SERVICE - วิเคราะห์ Resume ด้วย AI (Groq)
# =============================================================================
"""
LLMService Class:
- ใช้ Groq API กับ model qwen-2.5-72b-versatile
- วิเคราะห์ Resume และดึงข้อมูลสำคัญ
- Return ข้อมูลเป็น JSON structure
"""

import os
import json
import re
import logging
from typing import Optional, Dict, Any

# Groq Library
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

# Load environment variables from backend/.env
from pathlib import Path
from dotenv import load_dotenv

# หา path ไปยัง .env file (อยู่ใน backend/)
ENV_PATH = Path(__file__).parent.parent / ".env"
load_dotenv(ENV_PATH)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LLMService:
    """
    🧠 AI Resume Analysis Service
    
    วิธีใช้:
        llm = LLMService()
        features = llm.extract_features(resume_text)
    """
    
    def __init__(self):
        """Initialize LLMService with Groq"""
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = "qwen/qwen3-32b"  # Qwen3 - รองรับภาษาไทยดี
        self.temperature = 0.1  # Low temperature for consistent output
        self.max_tokens = 2048
        
        if not self.api_key:
            logger.warning("[LLMService] GROQ_API_KEY not found in environment!")
        
        if GROQ_AVAILABLE and self.api_key:
            self.client = Groq(api_key=self.api_key)
            logger.info(f"[LLMService] Initialized with model: {self.model}")
        else:
            self.client = None
            logger.warning("[LLMService] Groq client not initialized!")
    
    def extract_features(self, resume_text: str) -> Dict[str, Any]:
        """
        🔍 วิเคราะห์ Resume และดึงข้อมูลสำคัญ
        
        Args:
            resume_text: ข้อความที่ดึงได้จาก PDF
            
        Returns:
            Dict containing: education, skills, projects, experience_months, languages
        """
        if not self.client:
            logger.error("[LLMService] Client not initialized")
            return self._get_empty_features("Client not initialized")
        
        if not resume_text or len(resume_text.strip()) < 50:
            logger.error("[LLMService] Resume text too short")
            return self._get_empty_features("Resume text too short")
        
        try:
            # สร้าง prompt สำหรับ AI
            prompt = self._build_prompt(resume_text)
            
            # เรียก Groq API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a resume parser AI. Extract information from resumes and return ONLY valid JSON. Do not include any explanation or markdown formatting."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            # ดึง response
            ai_response = response.choices[0].message.content
            logger.info(f"[LLMService] AI Response length: {len(ai_response)} chars")
            
            # Parse JSON จาก response
            features = self._parse_json_response(ai_response)
            
            if features:
                logger.info("[LLMService] Successfully extracted features")
                return features
            else:
                logger.warning("[LLMService] Failed to parse AI response")
                return self._get_empty_features("Failed to parse AI response")
                
        except Exception as e:
            logger.error(f"[LLMService] Error: {str(e)}")
            return self._get_empty_features(str(e))
    
    def _build_prompt(self, resume_text: str) -> str:
        """สร้าง prompt สำหรับ AI"""
        
        # ตัดข้อความไม่ให้ยาวเกินไป
        max_text_length = 10000
        if len(resume_text) > max_text_length:
            resume_text = resume_text[:max_text_length] + "..."
        
        prompt = f"""Analyze this resume and extract the following information.
Return ONLY a valid JSON object with no additional text or markdown.

Resume Text:
{resume_text}

Extract and return JSON with this exact structure:
{{
  "education": {{
    "major": "string - major field of study from UNIVERSITY ONLY",
    "gpa": 0.0,
    "university": "string - university name ONLY (not high school)",
    "level": "string - Bachelor/Master/PhD"
  }},
  "skills": {{
    "technical_skills": ["list of technical skills like Python, React, SQL, etc."],
    "soft_skills": ["list of soft skills like Communication, Teamwork, etc."]
  }},
  "projects": [
    {{
      "name": "project name",
      "description": "brief project description",
      "technologies": ["list of technologies used"]
    }}
  ],
  "experience_months": 0,
  "languages": ["Thai", "English", "etc."],
  "certifications": [
    {{
      "name": "certification name (e.g., AWS Certified Cloud Practitioner)",
      "issuer": "issuing organization (e.g., Amazon Web Services)",
      "issue_date": "date if available (e.g., 2023-06 or 2023)"
    }}
  ]
}}

CRITICAL EDUCATION EXTRACTION RULES:
==============================================
For the "education" field, you MUST extract ONLY from UNIVERSITY-LEVEL education.

IGNORE these (they are NOT universities):
- Highschool / High School / มัธยม
- Polytechnic College / วิทยาลัยเทคนิค / วิทยาลัยอาชีวะ
- Vocational School / ปวช / ปวส
- Junior High School / มัธยมต้น
- Any school with "School" or "College" in the name that is NOT a university

LOOK FOR these (they ARE universities):
- University / มหาวิทยาลัย
- Institute of Technology / สถาบันเทคโนโลยี
- Current students with dates like "2022-Present" or "ปัจจุบัน"

EXAMPLE: If a resume shows:
- "Rajamangala University (2022-Present) GPX 2.59" 
- "Polytechnic College Highschool (2019-2023) GPX 3.10"
You MUST use GPA 2.59 from the University, NOT 3.10 from Polytechnic/Highschool.

OTHER RULES:
1. Do NOT extract personal information (name, email, phone, address) for privacy
2. Return ONLY the JSON object, no explanation
3. If information is not found, use empty string "" or empty array []
4. GPA should be a number (0.0 if not found). GPX means the same as GPA.
5. experience_months should be total work experience in months (0 if none or fresh graduate)
6. For Thai resumes, translate field values to English but keep university/skill names as-is
7. For certifications, extract professional certifications like:
   - AWS Certified (Cloud Practitioner, Solutions Architect, etc.)
   - Google Cloud Certified, Google Data Analytics, etc.
   - Microsoft Azure Certified, Microsoft Office Specialist, etc.
   - Oracle Certified Java Programmer, etc.
   - TOEIC, IELTS scores are language tests, NOT certifications
   - If no certifications found, return empty array []
"""
        return prompt
    
    def _parse_json_response(self, response: str) -> Optional[Dict[str, Any]]:
        """Parse JSON จาก AI response"""
        
        if not response:
            return None
        
        # ลอง parse โดยตรงก่อน
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            pass
        
        # ลองหา JSON block ใน response
        try:
            # หา JSON ที่อยู่ใน ```json ... ``` หรือ { ... }
            json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            # หา JSON ที่ขึ้นต้นด้วย {
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                return json.loads(json_match.group(0))
                
        except json.JSONDecodeError as e:
            logger.warning(f"[LLMService] JSON parse error: {e}")
        
        return None
    
    def _get_empty_features(self, error_message: str = "") -> Dict[str, Any]:
        """Return empty features structure with error"""
        return {
            "education": {
                "major": "",
                "gpa": 0.0,
                "university": "",
                "level": ""
            },
            "skills": {
                "technical_skills": [],
                "soft_skills": []
            },
            "projects": [],
            "experience_months": 0,
            "languages": [],
            "certifications": [],
            "extraction_error": error_message
        }
    
    def is_ready(self) -> bool:
        """ตรวจสอบว่า LLM Service พร้อมใช้งานหรือไม่"""
        return self.client is not None and self.api_key is not None


# =============================================================================
# 🧪 TEST - รันไฟล์โดยตรงเพื่อทดสอบ
# =============================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("🧪 LLM Service Test")
    print("=" * 60)
    
    # ทดสอบ LLMService
    llm = LLMService()
    
    if not llm.is_ready():
        print("❌ LLMService not ready! Check GROQ_API_KEY in .env")
        exit(1)
    
    # Sample resume text สำหรับทดสอบ
    sample_resume = """
    Education:
    Bachelor of Science in Computer Science
    Rajamangala University of Technology Thanyaburi (RMUTT)
    GPA: 3.45
    Graduated: 2024
    
    Skills:
    - Programming: Python, JavaScript, React, Node.js
    - Database: MongoDB, MySQL, PostgreSQL
    - Tools: Git, Docker, VS Code
    - Languages: Thai (Native), English (Good)
    
    Projects:
    1. AI Resume Screening System
       - Full-stack web application for HR
       - Technologies: Python, FastAPI, React, MongoDB, Groq AI
       
    2. E-commerce Website
       - Online shopping platform
       - Technologies: React, Node.js, Express, MongoDB
    
    Experience:
    Internship at Tech Company (3 months)
    - Developed web applications
    - Collaborated with team members
    """
    
    print("\n📄 Testing with sample resume...")
    print("-" * 60)
    
    features = llm.extract_features(sample_resume)
    
    print("\n✅ Extracted Features:")
    print(json.dumps(features, indent=2, ensure_ascii=False))
