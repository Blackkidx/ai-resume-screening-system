# =============================================================================
# 🧠 SERVICES MODULE - AI Resume Analysis Services
# =============================================================================
"""
Services สำหรับ AI Resume Screening System:
- PDFExtractor: ดึงข้อความจาก PDF
- LLMService: วิเคราะห์ Resume ด้วย AI (Groq)
"""

from .pdf_service import PDFExtractor
from .llm_service import LLMService

__all__ = ['PDFExtractor', 'LLMService']
