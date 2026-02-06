# -*- coding: utf-8 -*-
# =============================================================================
# 📄 PDF SERVICE - ดึงข้อความจากไฟล์ PDF
# =============================================================================
"""
PDFExtractor Class:
- ใช้ PyPDF2 เป็นตัวหลัก (เร็ว)
- ถ้าไม่ได้ใช้ pdfplumber เป็น fallback (แม่นยำกว่า)
- Clean text (ลบอักขระพิเศษ, whitespace ซ้ำ)
"""

import re
import logging
from pathlib import Path
from typing import Optional, Tuple

# PDF Libraries
try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False
    
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PDFExtractor:
    """
    🔧 PDF Text Extraction Service
    
    วิธีใช้:
        extractor = PDFExtractor()
        text, method = extractor.extract_text("path/to/resume.pdf")
    """
    
    def __init__(self):
        """Initialize PDFExtractor"""
        self.min_text_length = 50  # ถ้าได้น้อยกว่านี้ = ไม่สำเร็จ
        logger.info(f"[PDFExtractor] PyPDF2: {PYPDF2_AVAILABLE}, pdfplumber: {PDFPLUMBER_AVAILABLE}")
    
    def extract_text(self, pdf_path: str) -> Tuple[Optional[str], str]:
        """
        📖 ดึงข้อความจาก PDF
        
        Args:
            pdf_path: path ไปยังไฟล์ PDF
            
        Returns:
            Tuple[text, method]: (ข้อความที่ดึงได้, วิธีที่ใช้)
            - method: "pypdf2", "pdfplumber", หรือ "failed"
        """
        # ตรวจสอบไฟล์
        path = Path(pdf_path)
        if not path.exists():
            logger.error(f"[PDFExtractor] File not found: {pdf_path}")
            return None, "file_not_found"
        
        if path.suffix.lower() != ".pdf":
            logger.error(f"[PDFExtractor] Not a PDF file: {pdf_path}")
            return None, "not_pdf"
        
        # วิธีที่ 1: ลอง PyPDF2 ก่อน (เร็ว)
        if PYPDF2_AVAILABLE:
            text = self._extract_with_pypdf2(pdf_path)
            if text and len(text) >= self.min_text_length:
                cleaned = self._clean_text(text)
                logger.info(f"[PDFExtractor] Success with PyPDF2 ({len(cleaned)} chars)")
                return cleaned, "pypdf2"
        
        # วิธีที่ 2: ใช้ pdfplumber (แม่นยำกว่า)
        if PDFPLUMBER_AVAILABLE:
            text = self._extract_with_pdfplumber(pdf_path)
            if text and len(text) >= self.min_text_length:
                cleaned = self._clean_text(text)
                logger.info(f"[PDFExtractor] Success with pdfplumber ({len(cleaned)} chars)")
                return cleaned, "pdfplumber"
        
        # ไม่สำเร็จทั้ง 2 วิธี
        logger.error(f"[PDFExtractor] Failed to extract text from: {pdf_path}")
        return None, "failed"
    
    def _extract_with_pypdf2(self, pdf_path: str) -> Optional[str]:
        """ดึงข้อความด้วย PyPDF2"""
        try:
            text_parts = []
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page_num, page in enumerate(reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text_parts.append(page_text)
                    except Exception as e:
                        logger.warning(f"[PyPDF2] Error on page {page_num + 1}: {e}")
                        continue
            
            return "\n".join(text_parts) if text_parts else None
            
        except Exception as e:
            logger.error(f"[PyPDF2] Error: {e}")
            return None
    
    def _extract_with_pdfplumber(self, pdf_path: str) -> Optional[str]:
        """ดึงข้อความด้วย pdfplumber"""
        try:
            text_parts = []
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text_parts.append(page_text)
                    except Exception as e:
                        logger.warning(f"[pdfplumber] Error on page {page_num + 1}: {e}")
                        continue
            
            return "\n".join(text_parts) if text_parts else None
            
        except Exception as e:
            logger.error(f"[pdfplumber] Error: {e}")
            return None
    
    def _clean_text(self, text: str) -> str:
        """
        🧹 ทำความสะอาดข้อความ
        - ลบอักขระพิเศษที่ไม่จำเป็น
        - ลบ whitespace ซ้ำ
        - ตัด text ที่ยาวเกินไป
        """
        if not text:
            return ""
        
        # ลบ null characters
        text = text.replace('\x00', '')
        
        # ลบอักขระพิเศษที่ไม่ต้องการ (เก็บ Thai, English, ตัวเลข, เครื่องหมายวรรคตอน)
        # text = re.sub(r'[^\u0E00-\u0E7Fa-zA-Z0-9\s\.\,\:\;\-\_\@\#\%\&\*\(\)\[\]\{\}\/\\\'\"\+\=]', ' ', text)
        
        # ลบ whitespace ซ้ำๆ
        text = re.sub(r'\s+', ' ', text)
        
        # ลบ newlines ซ้ำๆ
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # ตัดช่องว่างหน้า-หลัง
        text = text.strip()
        
        # จำกัดความยาว (สำหรับ AI ไม่ควรยาวเกิน 15000 chars)
        max_length = 15000
        if len(text) > max_length:
            text = text[:max_length] + "..."
            logger.warning(f"[PDFExtractor] Text truncated to {max_length} chars")
        
        return text
    
    def get_info(self, pdf_path: str) -> dict:
        """
        📊 ดึงข้อมูล metadata ของ PDF
        """
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                info = {
                    "num_pages": len(reader.pages),
                    "metadata": {}
                }
                if reader.metadata:
                    info["metadata"] = {
                        "title": reader.metadata.get("/Title", ""),
                        "author": reader.metadata.get("/Author", ""),
                        "creator": reader.metadata.get("/Creator", ""),
                    }
                return info
        except Exception as e:
            logger.error(f"[PDFExtractor] Error getting info: {e}")
            return {"error": str(e)}


# =============================================================================
# 🧪 TEST - รันไฟล์โดยตรงเพื่อทดสอบ
# =============================================================================
if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("🧪 PDF Extractor Test")
    print("=" * 60)
    
    # รับ path จาก command line หรือถามผู้ใช้
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    else:
        pdf_path = input("📁 Enter PDF path: ").strip()
    
    if not pdf_path:
        print("❌ No path provided")
        sys.exit(1)
    
    # ทดสอบ
    extractor = PDFExtractor()
    text, method = extractor.extract_text(pdf_path)
    
    if text:
        print(f"\n✅ Success! Method: {method}")
        print(f"📏 Text length: {len(text)} characters")
        print("\n" + "=" * 60)
        print("📄 Extracted Text (first 500 chars):")
        print("=" * 60)
        print(text[:500])
        print("...")
        
        # บันทึกเป็นไฟล์
        output_path = pdf_path.replace(".pdf", "_extracted.txt")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"\n💾 Saved to: {output_path}")
    else:
        print(f"\n❌ Failed! Method: {method}")
