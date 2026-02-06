# -*- coding: utf-8 -*-
# =============================================================================
# 🧪 TEST MATCHING SERVICE - ทดสอบ Matching Algorithm
# =============================================================================
"""
ทดสอบ MatchingService:
1. Test Basic Matching (IT, GPA 2.59, 8 months exp) → Expected: Yellow zone
2. Test Perfect Match (CS, GPA 3.5, all skills) → Expected: Green zone
3. Test Poor Match (Business, no skills) → Expected: Red zone
"""

import sys
import json
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.matching_service import MatchingService


def print_result(title: str, result: dict, expected_zone: str = None):
    """พิมพ์ผลลัพธ์ในรูปแบบที่อ่านง่าย"""
    print("\n" + "━" * 60)
    print(f"📊 {title}")
    print("━" * 60)
    
    print(f"\n🎯 Overall Score: {result['overall_score']}%")
    print(f"🚦 Zone: {result['zone'].upper()}", end="")
    
    if expected_zone:
        if result['zone'] == expected_zone:
            print(" ✅ (Expected)")
        else:
            print(f" ❌ (Expected: {expected_zone.upper()})")
    else:
        print()
    
    print(f"\n📈 Breakdown:")
    for key, value in result['breakdown'].items():
        bar = "█" * int(value / 10) + "░" * (10 - int(value / 10))
        print(f"   {key.capitalize():14}: {bar} {value}%")
    
    print(f"\n💡 Recommendation: {result['recommendation']}")
    print("━" * 60)


def test_basic_matching():
    """
    Test Case 1: Basic Match
    
    Resume: IT, GPA 2.59, Skills [Python, JS, MySQL, Node.js], 
            2 projects (Flutter, Node.js), 8 months exp, no certs
            
    Job: Backend Dev, CS, requires [Python, Node.js, MySQL, React, Docker],
         min GPA 2.5, no exp required, no cert required
    
    Expected: Yellow zone (75-78%)
    """
    print("\n" + "=" * 60)
    print("🧪 TEST 1: Basic Match")
    print("=" * 60)
    
    resume = {
        "education": {
            "major": "Information Technology",
            "gpa": 2.59,
            "university": "Rajamangala University",
            "level": "Bachelor"
        },
        "skills": {
            "technical_skills": ["Python", "JavaScript", "MySQL", "Node.js"],
            "soft_skills": ["Communication", "Teamwork"]
        },
        "projects": [
            {
                "name": "Mobile App",
                "description": "Flutter application",
                "technologies": ["Flutter", "Dart"]
            },
            {
                "name": "Backend API",
                "description": "REST API",
                "technologies": ["Node.js", "Express"]
            }
        ],
        "experience_months": 8,
        "languages": ["Thai", "English"],
        "certifications": []
    }
    
    job = {
        "title": "Backend Developer",
        "skills_required": ["Python", "Node.js", "MySQL", "React", "Docker"],
        "major_required": "Computer Science",
        "min_gpa": 2.5,
        "min_experience_months": 0,
        "required_certifications": [],
        "preferred_certifications": []
    }
    
    print("\n📄 Resume:")
    print(f"   Major: {resume['education']['major']}")
    print(f"   GPA: {resume['education']['gpa']}")
    print(f"   Skills: {', '.join(resume['skills']['technical_skills'])}")
    print(f"   Projects: {len(resume['projects'])}")
    print(f"   Experience: {resume['experience_months']} months")
    
    print("\n💼 Job Requirements:")
    print(f"   Skills: {', '.join(job['skills_required'])}")
    print(f"   Major: {job['major_required']}")
    print(f"   Min GPA: {job['min_gpa']}")
    
    matcher = MatchingService()
    result = matcher.calculate_match(resume, job)
    
    print_result("Basic Match Result", result, "yellow")
    
    return result


def test_perfect_match():
    """
    Test Case 2: Perfect Match
    
    Resume: CS, GPA 3.5, All required skills, 3 projects, 12 months, AWS cert
    Job: Requires same
    
    Expected: Green zone (95-100%)
    """
    print("\n" + "=" * 60)
    print("🧪 TEST 2: Perfect Match")
    print("=" * 60)
    
    resume = {
        "education": {
            "major": "Computer Science",
            "gpa": 3.5,
            "university": "Chulalongkorn University",
            "level": "Bachelor"
        },
        "skills": {
            "technical_skills": ["Python", "Node.js", "MySQL", "React", "Docker", "AWS"],
            "soft_skills": ["Leadership", "Communication"]
        },
        "projects": [
            {
                "name": "Cloud Application",
                "description": "AWS deployed app",
                "technologies": ["Python", "Docker", "AWS"]
            },
            {
                "name": "Web Platform",
                "description": "Full-stack app",
                "technologies": ["React", "Node.js", "MySQL"]
            },
            {
                "name": "API Service",
                "description": "Microservices",
                "technologies": ["Python", "Docker"]
            }
        ],
        "experience_months": 12,
        "languages": ["Thai", "English"],
        "certifications": [
            {
                "name": "AWS Certified Cloud Practitioner",
                "issuer": "Amazon Web Services",
                "issue_date": "2024"
            }
        ]
    }
    
    job = {
        "title": "Backend Developer",
        "skills_required": ["Python", "Node.js", "MySQL", "React", "Docker"],
        "major_required": "Computer Science",
        "min_gpa": 3.0,
        "min_experience_months": 6,
        "required_certifications": [],
        "preferred_certifications": ["AWS Certified"]
    }
    
    print("\n📄 Resume:")
    print(f"   Major: {resume['education']['major']}")
    print(f"   GPA: {resume['education']['gpa']}")
    print(f"   Skills: {', '.join(resume['skills']['technical_skills'])}")
    print(f"   Projects: {len(resume['projects'])}")
    print(f"   Experience: {resume['experience_months']} months")
    print(f"   Certifications: {len(resume['certifications'])}")
    
    print("\n💼 Job Requirements:")
    print(f"   Skills: {', '.join(job['skills_required'])}")
    print(f"   Major: {job['major_required']}")
    print(f"   Min GPA: {job['min_gpa']}")
    print(f"   Preferred Cert: {job['preferred_certifications']}")
    
    matcher = MatchingService()
    result = matcher.calculate_match(resume, job)
    
    print_result("Perfect Match Result", result, "green")
    
    return result


def test_poor_match():
    """
    Test Case 3: Poor Match
    
    Resume: Business, GPA 2.3, No tech skills, No projects, No exp
    Job: Senior Developer, requires 2+ years
    
    Expected: Red zone (<50%)
    """
    print("\n" + "=" * 60)
    print("🧪 TEST 3: Poor Match")
    print("=" * 60)
    
    resume = {
        "education": {
            "major": "Business Administration",
            "gpa": 2.3,
            "university": "Unknown University",
            "level": "Bachelor"
        },
        "skills": {
            "technical_skills": [],
            "soft_skills": ["Communication"]
        },
        "projects": [],
        "experience_months": 0,
        "languages": ["Thai"],
        "certifications": []
    }
    
    job = {
        "title": "Senior Backend Developer",
        "skills_required": ["Python", "Java", "Kubernetes", "AWS", "PostgreSQL"],
        "major_required": "Computer Science",
        "min_gpa": 3.0,
        "min_experience_months": 24,
        "required_certifications": ["AWS Certified Solutions Architect"],
        "preferred_certifications": []
    }
    
    print("\n📄 Resume:")
    print(f"   Major: {resume['education']['major']}")
    print(f"   GPA: {resume['education']['gpa']}")
    print(f"   Skills: None")
    print(f"   Projects: 0")
    print(f"   Experience: 0 months")
    
    print("\n💼 Job Requirements:")
    print(f"   Skills: {', '.join(job['skills_required'])}")
    print(f"   Major: {job['major_required']}")
    print(f"   Min GPA: {job['min_gpa']}")
    print(f"   Min Experience: {job['min_experience_months']} months")
    print(f"   Required Cert: {job['required_certifications']}")
    
    matcher = MatchingService()
    result = matcher.calculate_match(resume, job)
    
    print_result("Poor Match Result", result, "red")
    
    return result


def test_gap_analysis():
    """Test Gap Analysis feature"""
    print("\n" + "=" * 60)
    print("🧪 TEST 4: Gap Analysis")
    print("=" * 60)
    
    resume = {
        "education": {
            "major": "Information Technology",
            "gpa": 2.8,
            "university": "Rajamangala University",
            "level": "Bachelor"
        },
        "skills": {
            "technical_skills": ["Python", "JavaScript"],
            "soft_skills": ["Teamwork"]
        },
        "projects": [
            {"name": "Web App", "technologies": ["JavaScript", "HTML"]}
        ],
        "experience_months": 3,
        "languages": ["Thai"],
        "certifications": []
    }
    
    job = {
        "title": "Full Stack Developer",
        "skills_required": ["Python", "React", "Node.js", "Docker", "AWS"],
        "major_required": "Computer Science",
        "min_gpa": 2.5,
        "min_experience_months": 6,
        "required_certifications": [],
        "preferred_certifications": ["AWS Certified"]
    }
    
    matcher = MatchingService()
    result = matcher.get_gap_analysis(resume, job)
    
    print(f"\n🎯 Overall Score: {result['overall_score']}%")
    print(f"🚦 Zone: {result['zone'].upper()}")
    
    print("\n📉 Gaps Found:")
    for gap in result['gaps']:
        print(f"   - {gap['area'].upper()}: {gap['score']}%")
        if 'missing' in gap:
            print(f"     Missing: {', '.join(gap['missing'][:3])}")
    
    print("\n💡 Recommendations:")
    for rec in result['recommendations']:
        print(f"   • {rec}")
    
    return result


def main():
    """Main test function"""
    print("\n" + "=" * 60)
    print("🧪 MATCHING SERVICE TEST SUITE")
    print("=" * 60)
    
    results = {
        "basic": None,
        "perfect": None,
        "poor": None
    }
    
    # Run tests
    results["basic"] = test_basic_matching()
    results["perfect"] = test_perfect_match()
    results["poor"] = test_poor_match()
    test_gap_analysis()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    all_passed = True
    
    # Check basic match (should be yellow)
    if results["basic"]["zone"] == "yellow":
        print("✅ Test 1 (Basic Match): PASSED - Yellow zone")
    else:
        print(f"❌ Test 1 (Basic Match): FAILED - Got {results['basic']['zone']}, expected yellow")
        all_passed = False
    
    # Check perfect match (should be green)
    if results["perfect"]["zone"] == "green":
        print("✅ Test 2 (Perfect Match): PASSED - Green zone")
    else:
        print(f"❌ Test 2 (Perfect Match): FAILED - Got {results['perfect']['zone']}, expected green")
        all_passed = False
    
    # Check poor match (should be red)
    if results["poor"]["zone"] == "red":
        print("✅ Test 3 (Poor Match): PASSED - Red zone")
    else:
        print(f"❌ Test 3 (Poor Match): FAILED - Got {results['poor']['zone']}, expected red")
        all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
    else:
        print("⚠️ SOME TESTS FAILED - Please check the results above")
    
    print("=" * 60 + "\n")
    
    return all_passed


if __name__ == "__main__":
    main()
