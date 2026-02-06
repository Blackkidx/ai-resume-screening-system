# -*- coding: utf-8 -*-
# =============================================================================
# 🧪 TEST PDF EXTRACTION - ทดสอบดึงข้อความจาก PDF
# =============================================================================
"""
ทดสอบ PDFExtractor class:
- ดึงข้อความจาก PDF ได้หรือไม่
- ทดสอบกับ PDF จริง
- บันทึกผลลัพธ์เป็น .txt
"""

import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.pdf_service import PDFExtractor


def test_pdf_extraction(pdf_path: str) -> bool:
    """
    ทดสอบดึงข้อความจาก PDF
    
    Args:
        pdf_path: path ไปยังไฟล์ PDF
        
    Returns:
        bool: True ถ้าสำเร็จ, False ถ้าไม่สำเร็จ
    """
    print("=" * 60)
    print("🧪 PDF Extraction Test")
    print("=" * 60)
    
    # ตรวจสอบไฟล์
    if not os.path.exists(pdf_path):
        print(f"❌ ไม่พบไฟล์: {pdf_path}")
        return False
    
    print(f"📁 File: {pdf_path}")
    print(f"📏 Size: {os.path.getsize(pdf_path):,} bytes")
    print("-" * 60)
    
    # ทดสอบ
    extractor = PDFExtractor()
    text, method = extractor.extract_text(pdf_path)
    
    if text:
        print(f"\n✅ สำเร็จ!")
        print(f"📖 Method: {method}")
        print(f"📏 Text length: {len(text):,} characters")
        print(f"📄 Words: ~{len(text.split()):,} words")
        
        # แสดงตัวอย่างข้อความ
        print("\n" + "=" * 60)
        print("📝 ตัวอย่างข้อความ (500 ตัวอักษรแรก):")
        print("=" * 60)
        print(text[:500])
        if len(text) > 500:
            print("...")
        
        # บันทึกเป็นไฟล์
        output_path = pdf_path.replace(".pdf", "_extracted.txt")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"\n💾 บันทึกไว้ที่: {output_path}")
        
        return True
    else:
        print(f"\n❌ ไม่สำเร็จ!")
        print(f"📖 Method: {method}")
        return False


def main():
    """Main function"""
    print("\n" + "=" * 60)
    print("🧪 PDF EXTRACTOR TEST")
    print("=" * 60)
    
    # รับ path จาก command line หรือถามผู้ใช้
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    else:
        print("\nวิธีใช้:")
        print("  python test_pdf_extraction.py <path_to_pdf>")
        print("\nหรือใส่ path โดยตรง:")
        pdf_path = input("📁 Path ไปยังไฟล์ PDF: ").strip()
    
    if not pdf_path:
        print("❌ ไม่ได้ระบุไฟล์")
        return
    
    # ลบ quotes ถ้ามี
    pdf_path = pdf_path.strip('"\'')
    
    # ทดสอบ
    success = test_pdf_extraction(pdf_path)
    
    print("\n" + "=" * 60)
    if success:
        print("✅ TEST PASSED")
    else:
        print("❌ TEST FAILED")
    print("=" * 60)


if __name__ == "__main__":
    main()
