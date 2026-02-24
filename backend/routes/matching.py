# -*- coding: utf-8 -*-
# =============================================================================
# 📊 MATCHING API ROUTES - Resume-Job Matching Endpoints
# =============================================================================
"""
Matching API Endpoints:
- POST /matching/jobs/{job_id}/calculate - คำนวณคะแนน Matching
- GET /matching/recommendations - ดึงรายการงานที่แนะนำ
- GET /matching/jobs/{job_id}/gap-analysis - วิเคราะห์ Gap Analysis
"""

import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from pydantic import BaseModel

# Database
from core.database import get_database

# Authentication
from core.auth import get_current_user_id, get_current_user_data

# Matching Service
from services.matching_service import MatchingService

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/matching", tags=["Matching"])

# Initialize matching service (singleton)
matching_service = MatchingService()


# =============================================================================
# 🔧 HELPER FUNCTIONS
# =============================================================================
def convert_job_to_requirements(job: dict) -> dict:
    """
    แปลง Job model ของเราให้ตรงกับ format ที่ Matching Service ต้องการ
    
    Our Job Model:
        - majors: List[str]
        - experience_required: int (years)
        - skills_required: List[str]
        - min_gpa: float
    
    Matching Service expects:
        - major_required: str
        - min_experience_months: int (months)
        - skills_required: List[str]
        - min_gpa: float
        - required_certifications: List[str]
        - preferred_certifications: List[str]
    """
    # แปลง majors (array) เป็น major_required (string)
    # ใช้ตัวแรกถ้ามี หรือ empty string
    majors = job.get("majors", [])
    major_required = ""
    if majors and len(majors) > 0:
        # ถ้าไม่ใช่ "ทุกสาขา" ให้ใช้สาขาแรก
        if majors[0] != "ทุกสาขา":
            major_required = majors[0]
    
    # แปลง experience_required (years) เป็น months
    experience_years = job.get("experience_required", 0) or 0
    min_experience_months = experience_years * 12
    
    return {
        "title": job.get("title", ""),
        "skills_required": job.get("skills_required", []),
        "major_required": major_required,
        "min_gpa": job.get("min_gpa", 0) or 0,
        "min_experience_months": min_experience_months,
        "required_certifications": [],  # ยังไม่มีใน Job model ของเรา
        "preferred_certifications": []  # ยังไม่มีใน Job model ของเรา
    }


# =============================================================================
# 📋 PYDANTIC MODELS
# =============================================================================
class MatchScoreResponse(BaseModel):
    """Response model for match score calculation"""
    job_id: str
    job_title: str
    overall_score: float
    breakdown: dict
    zone: str
    recommendation: str
    weights_used: dict


class JobRecommendation(BaseModel):
    """Individual job recommendation"""
    job_id: str
    job_title: str
    company_name: str
    overall_score: float
    zone: str
    recommendation: str


class RecommendationsResponse(BaseModel):
    """Response model for job recommendations"""
    green: list
    yellow: list
    total_jobs: int
    matched_jobs: int


# =============================================================================
# 📊 ENDPOINT 1: Calculate Match Score
# =============================================================================
@router.post("/jobs/{job_id}/calculate")
async def calculate_match_score(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_database)
):
    """
    📊 คำนวณ Matching Score ระหว่าง Resume ของผู้ใช้กับงานที่เลือก
    
    Args:
        job_id: ID ของงานที่ต้องการคำนวณ
        
    Returns:
        {
            "job_id": "...",
            "job_title": "...",
            "overall_score": 85.5,
            "breakdown": {...},
            "zone": "green",
            "recommendation": "..."
        }
    """
    logger.info(f"[Matching API] Calculate match for job {job_id}, user {user_id}")
    
    try:
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 1. Validate job_id
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        if not ObjectId.is_valid(job_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid job ID format"
            )
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 2. Get user's resume (latest processed resume without error)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        resume = await db.resumes.find_one(
            {
                "user_id": user_id,
                "status": "processed",
                "extracted_features.extraction_error": {"$exists": False}
            },
            sort=[("uploaded_at", -1)]  # Get the latest one
        )
        
        # Fallback: try any processed resume if above query fails
        if not resume:
            resume = await db.resumes.find_one(
                {"user_id": user_id, "status": "processed"},
                sort=[("uploaded_at", -1)]
            )
        
        if not resume:
            raise HTTPException(
                status_code=404,
                detail="ไม่พบ Resume ที่ต้องการ กรุณาอัปโหลด Resume ก่อน"
            )
        
        # Get extracted features
        resume_features = resume.get("extracted_features", {})
        if not resume_features:
            raise HTTPException(
                status_code=400,
                detail="Resume ยังไม่ได้ถูกวิเคราะห์ กรุณาอัปโหลดใหม่"
            )
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 3. Get job requirements
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        
        if not job:
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )
        
        # Convert job to requirements format using adapter
        job_requirements = convert_job_to_requirements(job)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 4. Calculate matching score
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        result = matching_service.calculate_match(resume_features, job_requirements)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 5. Save result to database
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        matching_record = {
            "user_id": user_id,
            "job_id": job_id,
            "overall_score": result["overall_score"],
            "breakdown": result["breakdown"],
            "zone": result["zone"],
            "weights_used": result["weights_used"],
            "recommendation": result["recommendation"],
            "hr_decision": "pending",
            "hr_notes": "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Upsert (update or insert)
        await db.matching_results.update_one(
            {"user_id": user_id, "job_id": job_id},
            {"$set": matching_record},
            upsert=True
        )
        
        logger.info(f"[Matching API] Result saved: {result['overall_score']}% ({result['zone']})")
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 6. Return response
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        return {
            "job_id": job_id,
            "job_title": job.get("title", "Unknown"),
            "company_name": job.get("company_name", "Unknown"),
            "overall_score": result["overall_score"],
            "breakdown": result["breakdown"],
            "zone": result["zone"],
            "recommendation": result["recommendation"],
            "weights_used": result["weights_used"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Matching API] Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating match score: {str(e)}"
        )


# =============================================================================
# 📋 ENDPOINT 2: Get Job Recommendations
# =============================================================================
@router.get("/recommendations")
async def get_recommendations(
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_database)
):
    """
    📋 ดึงรายการงานที่แนะนำสำหรับผู้ใช้
    
    Returns:
        {
            "green": [...],  // งานที่แนะนำ (score >= 80%)
            "yellow": [...], // งานที่ควรพิจารณา (50-79%)
            "total_jobs": 10,
            "matched_jobs": 7
        }
    """
    logger.info(f"[Matching API] Get recommendations for user {user_id}")
    
    try:
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 1. Get user's resume (latest without error)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        resume = await db.resumes.find_one(
            {
                "user_id": user_id,
                "status": "processed",
                "extracted_features.extraction_error": {"$exists": False}
            },
            sort=[("uploaded_at", -1)]
        )
        
        if not resume:
            resume = await db.resumes.find_one(
                {"user_id": user_id, "status": "processed"},
                sort=[("uploaded_at", -1)]
            )
        
        if not resume:
            raise HTTPException(
                status_code=404,
                detail="ไม่พบ Resume กรุณาอัปโหลด Resume ก่อน"
            )
        
        resume_features = resume.get("extracted_features", {})
        if not resume_features:
            raise HTTPException(
                status_code=400,
                detail="Resume ยังไม่ถูกวิเคราะห์ กรุณาอัปโหลดใหม่"
            )
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 2. Get all active jobs
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        cursor = db.jobs.find({"is_active": True})
        jobs = await cursor.to_list(length=100)  # Limit to 100 jobs
        
        if not jobs:
            return {
                "green": [],
                "yellow": [],
                "total_jobs": 0,
                "matched_jobs": 0
            }
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        # 3. Calculate match for each job
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        green_jobs = []
        yellow_jobs = []
        
        for job in jobs:
            # Convert job to requirements format using adapter
            job_requirements = convert_job_to_requirements(job)
            
            result = matching_service.calculate_match(resume_features, job_requirements)
            
            job_recommendation = {
                "job_id": str(job["_id"]),
                "job_title": job.get("title", "Unknown"),
                "company_name": job.get("company_name", "Unknown"),
                "department": job.get("department", ""),
                "skills_required": job.get("skills_required", []),  # เพิ่ม skills
                "overall_score": result["overall_score"],
                "zone": result["zone"],
                "recommendation": result["recommendation"],
                "breakdown": result["breakdown"]
            }
            
            if result["zone"] == "green":
                green_jobs.append(job_recommendation)
            elif result["zone"] == "yellow":
                yellow_jobs.append(job_recommendation)
            # Red jobs are excluded from recommendations
        
        # Sort by score (highest first)
        green_jobs.sort(key=lambda x: x["overall_score"], reverse=True)
        yellow_jobs.sort(key=lambda x: x["overall_score"], reverse=True)
        
        logger.info(f"[Matching API] Recommendations: {len(green_jobs)} green, {len(yellow_jobs)} yellow")
        
        return {
            "green": green_jobs,
            "yellow": yellow_jobs,
            "total_jobs": len(jobs),
            "matched_jobs": len(green_jobs) + len(yellow_jobs)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Matching API] Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting recommendations: {str(e)}"
        )


# =============================================================================
# 📊 ENDPOINT 3: Gap Analysis
# =============================================================================
@router.get("/jobs/{job_id}/gap-analysis")
async def get_gap_analysis(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    db = Depends(get_database)
):
    """
    📊 วิเคราะห์ Gap Analysis - ดูว่าขาดอะไร และแนะนำวิธีพัฒนา
    
    Returns:
        {
            "overall_score": 75.5,
            "zone": "yellow",
            "breakdown": {...},
            "gaps": [...],
            "recommendations": [...]
        }
    """
    logger.info(f"[Matching API] Gap analysis for job {job_id}, user {user_id}")
    
    try:
        # Validate job_id
        if not ObjectId.is_valid(job_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid job ID format"
            )
        
        # Get user's resume (latest without error)
        resume = await db.resumes.find_one(
            {
                "user_id": user_id,
                "status": "processed",
                "extracted_features.extraction_error": {"$exists": False}
            },
            sort=[("uploaded_at", -1)]
        )
        
        if not resume:
            resume = await db.resumes.find_one(
                {"user_id": user_id, "status": "processed"},
                sort=[("uploaded_at", -1)]
            )
        
        if not resume:
            raise HTTPException(
                status_code=404,
                detail="ไม่พบ Resume กรุณาอัปโหลด Resume ก่อน"
            )
        
        resume_features = resume.get("extracted_features", {})
        if not resume_features:
            raise HTTPException(
                status_code=400,
                detail="Resume ยังไม่ถูกวิเคราะห์ กรุณาอัปโหลดใหม่"
            )
        
        # Get job
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )
        
        # Convert to requirements format using adapter
        job_requirements = convert_job_to_requirements(job)
        
        # Get gap analysis
        result = matching_service.get_gap_analysis(resume_features, job_requirements)
        
        return {
            "job_id": job_id,
            "job_title": job.get("title", "Unknown"),
            "overall_score": result["overall_score"],
            "zone": result["zone"],
            "breakdown": result["breakdown"],
            "gaps": result["gaps"],
            "recommendations": result["recommendations"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Matching API] Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting gap analysis: {str(e)}"
        )


# =============================================================================
# 🏥 HEALTH CHECK
# =============================================================================
@router.get("/health")
async def matching_health_check():
    """
    🏥 Health check for matching service
    """
    return {
        "status": "healthy",
        "service": "matching",
        "sbert_available": matching_service.sbert_model is not None,
        "weights": matching_service.weights
    }
