# -*- coding: utf-8 -*-
# =============================================================================
# 🧪 TEST END-TO-END - ทดสอบ Full Flow
# =============================================================================
"""
ทดสอบ Complete Pipeline:
1. Upload PDF
2. ดึงข้อความ (PDFExtractor)
3. วิเคราะห์ด้วย AI (LLMService)
4. แสดงผลลัพธ์
5. วัดเวลา
"""

import sys
import os
import json
import time
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.pdf_service import PDFExtractor
from services.llm_service import LLMService


def test_end_to_end(pdf_path: str) -> bool:
    """
    ทดสอบ Full Pipeline
    
    Args:
        pdf_path: path ไปยังไฟล์ PDF
        
    Returns:
        bool: True ถ้าสำเร็จ
    """
    print("=" * 60)
    print("🧪 END-TO-END TEST")
    print("=" * 60)
    
    total_start = time.time()
    
    # ตรวจสอบไฟล์
    if not os.path.exists(pdf_path):
        print(f"❌ ไม่พบไฟล์: {pdf_path}")
        return False
    
    file_size = os.path.getsize(pdf_path)
    print(f"📁 File: {pdf_path}")
    print(f"📏 Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
    print("-" * 60)
    
    # ========== STEP 1: PDF Extraction ==========
    print("\n🔹 STEP 1: PDF Extraction")
    step1_start = time.time()
    
    extractor = PDFExtractor()
    text, method = extractor.extract_text(pdf_path)
    
    step1_time = time.time() - step1_start
    
    if not text:
        print(f"  ❌ ล้มเหลว! Method: {method}")
        return False
    
    print(f"  ✅ สำเร็จ! Method: {method}")
    print(f"  📏 Text: {len(text):,} chars")
    print(f"  ⏱️  Time: {step1_time:.2f}s")
    
    # ========== STEP 2: LLM Analysis ==========
    print("\n🔹 STEP 2: AI Analysis (Groq)")
    step2_start = time.time()
    
    llm = LLMService()
    
    if not llm.is_ready():
        print("  ❌ LLM Service ไม่พร้อม!")
        print("     ตรวจสอบ GROQ_API_KEY ใน .env")
        return False
    
    print(f"  🧠 Model: {llm.model}")
    print(f"  📤 Sending to AI...")
    
    features = llm.extract_features(text)
    
    step2_time = time.time() - step2_start
    
    if not features or "extraction_error" in features:
        error = features.get("extraction_error", "Unknown error") if features else "No response"
        print(f"  ❌ ล้มเหลว! Error: {error}")
        return False
    
    print(f"  ✅ สำเร็จ!")
    print(f"  ⏱️  Time: {step2_time:.2f}s")
    
    # ========== RESULTS ==========
    total_time = time.time() - total_start
    
    print("\n" + "=" * 60)
    print("📊 EXTRACTED FEATURES")
    print("=" * 60)
    print(json.dumps(features, indent=2, ensure_ascii=False))
    
    # ========== SUMMARY ==========
    print("\n" + "=" * 60)
    print("📈 SUMMARY")
    print("=" * 60)
    
    # Education
    edu = features.get("education", {})
    print(f"\n🎓 Education:")
    print(f"   Major: {edu.get('major', 'N/A')}")
    print(f"   University: {edu.get('university', 'N/A')}")
    print(f"   GPA: {edu.get('gpa', 'N/A')}")
    print(f"   Level: {edu.get('level', 'N/A')}")
    
    # Skills
    skills = features.get("skills", {})
    tech_skills = skills.get("technical_skills", [])
    soft_skills = skills.get("soft_skills", [])
    print(f"\n💻 Technical Skills ({len(tech_skills)}):")
    print(f"   {', '.join(tech_skills[:10])}")
    print(f"\n🤝 Soft Skills ({len(soft_skills)}):")
    print(f"   {', '.join(soft_skills[:5])}")
    
    # Projects
    projects = features.get("projects", [])
    print(f"\n📁 Projects ({len(projects)}):")
    for i, proj in enumerate(projects[:3], 1):
        name = proj.get("name", "Unnamed")
        techs = proj.get("technologies", [])
        print(f"   {i}. {name}")
        if techs:
            print(f"      Tech: {', '.join(techs[:5])}")
    
    # Experience
    exp_months = features.get("experience_months", 0)
    print(f"\n⏰ Experience: {exp_months} months")
    
    # Languages
    langs = features.get("languages", [])
    print(f"\n🌐 Languages: {', '.join(langs)}")
    
    # ========== TIMING ==========
    print("\n" + "=" * 60)
    print("⏱️  TIMING")
    print("=" * 60)
    print(f"   PDF Extraction: {step1_time:.2f}s")
    print(f"   AI Analysis:    {step2_time:.2f}s")
    print(f"   TOTAL:          {total_time:.2f}s")
    
    # ตรวจสอบว่าเร็วพอหรือไม่
    if total_time > 15:
        print(f"   ⚠️  ช้าเกินไป! (ควร < 15s)")
    elif total_time > 10:
        print(f"   ⚡ OK แต่ช้าหน่อย")
    else:
        print(f"   🚀 เร็วดีมาก!")
    
    # บันทึกผลลัพธ์
    output_path = pdf_path.replace(".pdf", "_features.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            "file_path": pdf_path,
            "file_size": file_size,
            "text_length": len(text),
            "extraction_method": method,
            "features": features,
            "timing": {
                "pdf_extraction_seconds": step1_time,
                "ai_analysis_seconds": step2_time,
                "total_seconds": total_time
            }
        }, f, indent=2, ensure_ascii=False)
    print(f"\n💾 บันทึกผลลัพธ์: {output_path}")
    
    return True


def main():
    """Main function"""
    print("\n" + "=" * 60)
    print("🧪 END-TO-END PIPELINE TEST")
    print("=" * 60)
    
    # รับ path จาก command line หรือถามผู้ใช้
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    else:
        print("\nวิธีใช้:")
        print("  python test_end_to_end.py <path_to_pdf>")
        print("\nหรือใส่ path โดยตรง:")
        pdf_path = input("📁 Path ไปยังไฟล์ PDF: ").strip()
    
    if not pdf_path:
        print("❌ ไม่ได้ระบุไฟล์")
        return
    
    # ลบ quotes ถ้ามี
    pdf_path = pdf_path.strip('"\'')
    
    # ทดสอบ
    success = test_end_to_end(pdf_path)
    
    print("\n" + "=" * 60)
    if success:
        print("✅ TEST PASSED - Pipeline ทำงานได้!")
    else:
        print("❌ TEST FAILED - มีปัญหา!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
