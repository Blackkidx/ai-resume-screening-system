# -*- coding: utf-8 -*-
"""
LLMService — Resume feature extraction via Groq API.
Supports Thai and English resumes with language-aware prompts.
"""

import os
import re
import json
import logging
from typing import ClassVar, Dict, Any, Optional
from pathlib import Path
from dotenv import load_dotenv

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

load_dotenv(Path(__file__).parent.parent / ".env")
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data Maps
# ---------------------------------------------------------------------------

THAI_SOFT_SKILLS: Dict[str, str] = {
    "ทักษะการแก้ไขปัญหา":              "Problem-Solving",
    "ทักษะการแก้ไขปญหา":               "Problem-Solving",
    "ทักษะการทํางานร่วมกับผู้อื่น":    "Teamwork",
    "ทักษะการทํางานร่วมกับผู้อน":      "Teamwork",
    "ทักษะการทํางานร่วมกับผูอืน":      "Teamwork",
    "ทักษะการสื่อสาร":                  "Communication",
    "ทักษะการสอสาร":                    "Communication",
    "ทักษะการสือสาร":                   "Communication",
    "ทักษะการปรับตัวและเรียนรู้":       "Adaptability",
    "ทักษะฉลาดในด้านอารมณ์":           "Emotional Intelligence",
    "สามารถจัดการเวลาได้ดี":            "Time Management",
    "สามารถเรียนรู้ด้วยตนเองได้":       "Self-Learning",
    "ความคิดสร้างสรรค์":                "Creativity",
    "ความใส่ใจในรายละเอียด":            "Attention to Detail",
    "ความเป็นผู้นํา":                   "Leadership",
    "การคิดวิเคราะห์":                  "Analytical Thinking",
    "การวางแผน":                        "Planning",
}

THAI_UNIVERSITIES: Dict[str, str] = {
    "ราชมงคลธัญบุรี":                                   "Rajamangala University of Technology Thanyaburi",
    "ราชมงคลธญั บุรี":                                   "Rajamangala University of Technology Thanyaburi",
    "มหาวิทยาลัยเทคโนโลยรี าชมงคลธญั บุรี":             "Rajamangala University of Technology Thanyaburi",
    "มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี":               "Rajamangala University of Technology Thanyaburi",
    "เกษตรศาสตร์":                                       "Kasetsart University",
    "จุฬาลงกรณ์":                                        "Chulalongkorn University",
    "มหิดล":                                             "Mahidol University",
    "ธรรมศาสตร์":                                        "Thammasat University",
    "เชียงใหม่":                                         "Chiang Mai University",
    "ขอนแก่น":                                           "Khon Kaen University",
    "สงขลานครินทร์":                                     "Prince of Songkla University",
    "บูรพา":                                             "Burapha University",
    "ศิลปากร":                                           "Silpakorn University",
    "ราชภัฏ":                                            "Rajabhat University",
    "สถาบันเทคโนโลยีพระจอมเกล้า":                       "King Mongkut's Institute of Technology",
    "พระจอมเกล้าลาดกระบัง":                              "King Mongkut's Institute of Technology Ladkrabang",
    "พระจอมเกล้าธนบุรี":                                 "King Mongkut's University of Technology Thonburi",
}

_JSON_SCHEMA = """
{
  "education": {
    "major": "string",
    "gpa": 0.0,
    "university": "string",
    "level": "string (Bachelor/Master/PhD or empty)"
  },
  "skills": {
    "technical_skills": ["array of strings"],
    "soft_skills": ["array of English strings"]
  },
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["array of strings"]
    }
  ],
  "experience_months": 0,
  "experience_details": [
    {
      "position": "string",
      "company": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "languages": ["array of strings"],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "issue_date": "string"
    }
  ]
}"""

_COMMON_RULES = """
RULES:
- Use EXACT keys from the schema above. Do NOT add extra fields.
- If a value is not found: use "" for strings, 0 / 0.0 for numbers, [] for arrays.
- Extract UNIVERSITY-LEVEL education only (ignore high school, vocational).
- For GPA: numeric float only. If not stated → 0.0.
- For experience_months: total months of actual work or internship.
- NEVER fabricate data. Only extract what is explicitly present in the text.
- Output ONLY the raw JSON object. No markdown, no explanation.
"""


# ---------------------------------------------------------------------------
# LLMService
# ---------------------------------------------------------------------------

class LLMService:
    """AI Resume Analysis Service. Supports Thai and English resumes."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = "llama-3.3-70b-versatile"
        self.temperature = 0.0
        self.max_tokens = 2048

        if not self.api_key:
            logger.warning("[LLMService] GROQ_API_KEY not set")

        self.client = (
            Groq(api_key=self.api_key)
            if GROQ_AVAILABLE and self.api_key
            else None
        )
        if self.client:
            logger.info(f"[LLMService] Initialized: {self.model}")
        else:
            logger.warning("[LLMService] Groq client unavailable")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def extract_features(self, resume_text: str) -> Dict[str, Any]:
        """Extract structured features from resume text (Thai or English)."""
        if not self.client:
            return self._empty("Client not initialized")
        if not resume_text or len(resume_text.strip()) < 50:
            return self._empty("Resume text too short")

        lang = self.detect_language(resume_text)
        logger.info(f"[LLMService] Detected language: {lang}")

        try:
            prompt = self._build_prompt(resume_text, lang)
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a strict data extraction API. Output ONLY valid JSON."},
                    {"role": "user",   "content": prompt},
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
            )
            raw = response.choices[0].message.content
            logger.info(f"[LLMService] Response: {len(raw)} chars")

            features = self._parse_json(raw)
            if not features:
                logger.warning("[LLMService] JSON parse failed")
                return self._empty("JSON parse failed")

            return self._post_process(features)

        except Exception as e:
            logger.error(f"[LLMService] Error: {e}")
            return self._empty(str(e))

    def is_ready(self) -> bool:
        return self.client is not None

    def analyze_certificate(self, cert_text: str) -> Optional[Dict[str, Any]]:
        """Analyze certificate text and return structured info via LLM.

        Returns dict with keys:
            cert_name       — official name of the certificate
            domain          — domain/field (e.g. "Data Science", "Web Development")
            skills_covered  — list of skills this cert covers
            relevance_tags  — short keyword tags for job matching
            is_valid_cert   — bool, True if this looks like a legitimate cert
        """
        if not self.client:
            return None
        if not cert_text or len(cert_text.strip()) < 10:
            return None

        prompt = f"""You are a certificate analysis API. Analyze the certificate text below and extract structured data.

Return ONLY valid JSON with this exact schema:
{{
  "cert_name": "Official certificate name (string)",
  "domain": "Field/domain of this certificate (e.g. Data Science, Web Dev, Networking)",
  "skills_covered": ["skill1", "skill2"],
  "relevance_tags": ["tag1", "tag2"],
  "is_valid_cert": true
}}

RULES:
- cert_name: the main title/name of the certificate
- domain: 1-3 word category of the certificate
- skills_covered: specific technical skills this cert validates (max 8)
- relevance_tags: short keywords useful for job matching (max 6)
- is_valid_cert: true if it's a legitimate academic/professional certificate, false if unknown
- Output ONLY the raw JSON object. No markdown, no explanation.

Certificate Text:
{cert_text[:4000]}

OUTPUT ONLY VALID JSON:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a strict data extraction API. Output ONLY valid JSON."},
                    {"role": "user",   "content": prompt},
                ],
                temperature=0.0,
                max_tokens=512,
            )
            raw = response.choices[0].message.content
            result = self._parse_json(raw)
            if result:
                logger.info(f"[LLMService] Certificate analyzed: {result.get('cert_name')} | domain={result.get('domain')}")
            return result
        except Exception as e:
            logger.error(f"[LLMService] analyze_certificate error: {e}")
            return None


    # ------------------------------------------------------------------
    # Static Utilities (used by other modules)
    # ------------------------------------------------------------------

    @staticmethod
    def detect_language(text: str) -> str:
        """Return 'th' if >10% Thai Unicode chars, else 'en'."""
        thai_count = sum(1 for c in text if "\u0e00" <= c <= "\u0e7f")
        return "th" if thai_count / max(len(text), 1) > 0.1 else "en"

    @staticmethod
    def sanitize_text(text: str) -> str:
        """Remove null bytes and control characters; normalize whitespace."""
        text = text.replace("\x00", "")
        text = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"[ \t]{2,}", " ", text)
        return text.strip()

    # ------------------------------------------------------------------
    # Prompt Builders
    # ------------------------------------------------------------------

    def _build_prompt(self, text: str, lang: str) -> str:
        text = text[:12000]  # guard token limit
        return (
            self._build_prompt_th(text)
            if lang == "th"
            else self._build_prompt_en(text)
        )

    @staticmethod
    def _build_prompt_th(text: str) -> str:
        return f"""Extract resume data into this EXACT JSON schema. The resume is written in Thai.

JSON SCHEMA:
{_JSON_SCHEMA}

{_COMMON_RULES}

THAI LANGUAGE GLOSSARY:
- มหาวิทยาลัย = University | สาขาวิชา / สาขา = Major
- เกรดเฉลี่ย / GPA = GPA | ปริญญาตรี = Bachelor
- ผลงาน / โปรเจกต์ = Projects | ทักษะ / Hard Skills / Soft Skills = Skills
- ประสบการณ์ = Experience | ใบรับรอง = Certifications
- เครื่องมือที่ใช้ออกแบบ = tools used (extract as technologies)

MAJOR TRANSLATION (Thai → English):
- เทคโนโลยีสารสนเทศ → Information Technology
- วิทยาการคอมพิวเตอร์ → Computer Science
- วิศวกรรมคอมพิวเตอร์ → Computer Engineering
- วิศวกรรมซอฟต์แวร์ → Software Engineering
- วิทยาศาสตร์ข้อมูล → Data Science
- เครือข่ายคอมพิวเตอร์ → Computer Networks

SOFT SKILLS: Output English translations (e.g. "Problem-Solving", "Teamwork", "Communication").
NOTE: Thai PDF text may have missing characters due to column layout encoding — parse best-effort.

Resume Text:
{text}

OUTPUT ONLY VALID JSON:"""

    @staticmethod
    def _build_prompt_en(text: str) -> str:
        return f"""Extract resume data into this EXACT JSON schema.

JSON SCHEMA:
{_JSON_SCHEMA}

{_COMMON_RULES}

Resume Text:
{text}

OUTPUT ONLY VALID JSON:"""

    # ------------------------------------------------------------------
    # Post-Processing
    # ------------------------------------------------------------------

    def _post_process(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Translate Thai soft skills and normalize university names."""
        skills = features.get("skills", {})
        if isinstance(skills, dict):
            translated, seen = [], set()
            for s in skills.get("soft_skills", []):
                eng = THAI_SOFT_SKILLS.get(s.strip(), s)
                if eng.lower() not in seen:
                    seen.add(eng.lower())
                    translated.append(eng)
            skills["soft_skills"] = translated
            features["skills"] = skills

        edu = features.get("education", {})
        if isinstance(edu, dict):
            uni = edu.get("university", "")
            for th, en in THAI_UNIVERSITIES.items():
                if th in uni:
                    edu["university"] = en
                    break
            features["education"] = edu

        return features

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_json(response: str) -> Optional[Dict[str, Any]]:
        """Try to parse JSON from LLM response, with markdown-fence fallback."""
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            pass
        # Try ```json ... ``` fence
        try:
            m = re.search(r"```json\s*(.*?)\s*```", response, re.DOTALL)
            if m:
                return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
        # Try bare { ... } block
        try:
            m = re.search(r"\{[\s\S]*\}", response)
            if m:
                return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass
        return None

    @staticmethod
    def _empty(reason: str = "") -> Dict[str, Any]:
        return {
            "education": {"major": "", "gpa": 0.0, "university": "", "level": ""},
            "skills": {"technical_skills": [], "soft_skills": []},
            "projects": [],
            "experience_months": 0,
            "experience_details": [],
            "languages": [],
            "certifications": [],
            "extraction_error": reason,
        }


# ---------------------------------------------------------------------------
# CLI test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    llm = LLMService()
    if not llm.is_ready():
        print("LLM not ready — check GROQ_API_KEY")
        raise SystemExit(1)

    sample = """
    ประวัติการศึกษา:
    ปริญญาตรี สาขาเทคโนโลยีสารสนเทศ
    มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี
    เกรดเฉลี่ย: 3.25

    ทักษะ:
    Hard Skills: Python, JavaScript, React, MySQL
    Soft Skills: ทักษะการสื่อสาร, ทักษะการแก้ไขปัญหา

    โปรเจค:
    1. ระบบจัดการร้านอาหาร
       เครื่องมือที่ใช้ออกแบบ Node.js, MySQL, Firebase
    """
    result = llm.extract_features(sample)
    print(json.dumps(result, indent=2, ensure_ascii=False))
