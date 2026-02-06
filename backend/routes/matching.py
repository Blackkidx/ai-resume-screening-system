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
        # 2. Get user's resume
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        resume = await db.resumes.find_one({
            "user_id": user_id,
            "status": "completed"
        })
        
        if not resume:
            raise HTTPException(
                status_code=404,
                detail="Resume not found. Please upload and process your resume first."
            )
        
        # Get extracted features
        resume_features = resume.get("extracted_features", {})
        if not resume_features or resume_features.get("extraction_error"):
            raise HTTPException(
                status_code=400,
                detail="Resume features not extracted. Please re-upload your resume."
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
        
        # Convert job to requirements format
        job_requirements = {
            "title": job.get("title", "Unknown"),
            "skills_required": job.get("skills_required", []),
            "major_required": job.get("major_required", ""),
            "min_gpa": job.get("min_gpa", 0),
            "min_experience_months": job.get("min_experience_months", 0),
            "required_certifications": job.get("required_certifications", []),
            "preferred_certifications": job.get("preferred_certifications", [])
        }
        
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
        # 1. Get user's resume
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━
        resume = await db.resumes.find_one({
            "user_id": user_id,
            "status": "completed"
        })
        
        if not resume:
            raise HTTPException(
                status_code=404,
                detail="Resume not found. Please upload and process your resume first."
            )
        
        resume_features = resume.get("extracted_features", {})
        if not resume_features or resume_features.get("extraction_error"):
            raise HTTPException(
                status_code=400,
                detail="Resume features not extracted. Please re-upload your resume."
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
            job_requirements = {
                "title": job.get("title", "Unknown"),
                "skills_required": job.get("skills_required", []),
                "major_required": job.get("major_required", ""),
                "min_gpa": job.get("min_gpa", 0),
                "min_experience_months": job.get("min_experience_months", 0),
                "required_certifications": job.get("required_certifications", []),
                "preferred_certifications": job.get("preferred_certifications", [])
            }
            
            result = matching_service.calculate_match(resume_features, job_requirements)
            
            job_recommendation = {
                "job_id": str(job["_id"]),
                "job_title": job.get("title", "Unknown"),
                "company_name": job.get("company_name", "Unknown"),
                "department": job.get("department", ""),
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
        
        # Get user's resume
        resume = await db.resumes.find_one({
            "user_id": user_id,
            "status": "completed"
        })
        
        if not resume:
            raise HTTPException(
                status_code=404,
                detail="Resume not found. Please upload and process your resume first."
            )
        
        resume_features = resume.get("extracted_features", {})
        if not resume_features or resume_features.get("extraction_error"):
            raise HTTPException(
                status_code=400,
                detail="Resume features not extracted. Please re-upload your resume."
            )
        
        # Get job
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )
        
        # Convert to requirements format
        job_requirements = {
            "title": job.get("title", "Unknown"),
            "skills_required": job.get("skills_required", []),
            "major_required": job.get("major_required", ""),
            "min_gpa": job.get("min_gpa", 0),
            "min_experience_months": job.get("min_experience_months", 0),
            "required_certifications": job.get("required_certifications", []),
            "preferred_certifications": job.get("preferred_certifications", [])
        }
        
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
