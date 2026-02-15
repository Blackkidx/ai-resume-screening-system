# -*- coding: utf-8 -*-
# =============================================================================
# 🎯 MATCHING SERVICE - Resume-Job Matching with Weighted Scoring
# =============================================================================
"""
MatchingService Class:
- คำนวณคะแนน Matching ระหว่าง Resume กับ Job Requirements
- ใช้ Weighted Scoring System
- รองรับ Semantic Similarity ด้วย SBERT

Weights (Research-backed):
    - Skills: 30%
    - Major: 25%
    - Experience: 15%
    - Projects: 15%
    - Certification: 10%
    - GPA: 5%
"""

import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

# SBERT for semantic similarity
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    SBERT_AVAILABLE = True
except ImportError:
    SBERT_AVAILABLE = False

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MatchingService:
    """
    🎯 Resume-Job Matching Service with Weighted Scoring
    
    วิธีใช้:
        matcher = MatchingService()
        result = matcher.calculate_match(resume_features, job_requirements)
    
    Returns:
        {
            "overall_score": 85.5,
            "breakdown": {...},
            "zone": "green",
            "weights_used": {...},
            "recommendation": "..."
        }
    """
    
    # Research-backed weights
    DEFAULT_WEIGHTS = {
        "skills": 0.30,
        "major": 0.25,
        "experience": 0.15,
        "projects": 0.15,
        "certification": 0.10,
        "gpa": 0.05
    }
    
    # Major similarity mapping (IT/CS related fields)
    SIMILAR_MAJORS = {
        "computer science": ["computer science", "cs", "วิทยาการคอมพิวเตอร์"],
        "information technology": ["information technology", "it", "เทคโนโลยีสารสนเทศ"],
        "software engineering": ["software engineering", "se", "วิศวกรรมซอฟต์แวร์"],
        "computer engineering": ["computer engineering", "ce", "วิศวกรรมคอมพิวเตอร์"],
        "data science": ["data science", "ds", "วิทยาศาสตร์ข้อมูล"],
    }
    
    # Fields considered similar to IT/CS
    RELATED_KEYWORDS = ["computer", "engineering", "technology", "software", "data", "digital"]
    
    def __init__(self, weights: Optional[Dict[str, float]] = None):
        """
        Initialize MatchingService
        
        Args:
            weights: Optional custom weights (default uses research-backed weights)
        """
        self.weights = weights or self.DEFAULT_WEIGHTS.copy()
        
        # Load SBERT model for semantic similarity
        if SBERT_AVAILABLE:
            try:
                self.sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("[MatchingService] SBERT model loaded: all-MiniLM-L6-v2")
            except Exception as e:
                logger.warning(f"[MatchingService] Failed to load SBERT: {e}")
                self.sbert_model = None
        else:
            self.sbert_model = None
            logger.warning("[MatchingService] SBERT not available, using exact matching only")
        
        logger.info(f"[MatchingService] Initialized with weights: {self.weights}")
    
    def calculate_match(
        self, 
        resume_features: Dict[str, Any], 
        job_requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        🎯 คำนวณ Matching Score ระหว่าง Resume กับ Job
        
        Args:
            resume_features: ข้อมูลจาก AI extraction (education, skills, projects, etc.)
            job_requirements: ข้อมูลจาก Job posting (skills_required, major_required, etc.)
            
        Returns:
            Dict containing overall_score, breakdown, zone, weights_used, recommendation
        """
        logger.info("[MatchingService] Starting match calculation...")
        
        # Calculate individual scores
        breakdown = {
            "skills": self._calculate_skills_score(resume_features, job_requirements),
            "major": self._calculate_major_score(resume_features, job_requirements),
            "experience": self._calculate_experience_score(resume_features, job_requirements),
            "projects": self._calculate_projects_score(resume_features, job_requirements),
            "certification": self._calculate_certification_score(resume_features, job_requirements),
            "gpa": self._calculate_gpa_score(resume_features, job_requirements)
        }
        
        # Calculate weighted overall score
        overall_score = sum(
            breakdown[key] * self.weights[key] 
            for key in breakdown.keys()
        )
        
        # Determine zone and recommendation
        zone = self._calculate_zone(overall_score)
        recommendation = self._generate_recommendation(overall_score, zone, breakdown)
        
        result = {
            "overall_score": round(overall_score, 2),
            "breakdown": {k: round(v, 2) for k, v in breakdown.items()},
            "zone": zone,
            "weights_used": self.weights,
            "recommendation": recommendation
        }
        
        logger.info(f"[MatchingService] Result: {overall_score:.1f}% ({zone.upper()})")
        
        return result
    
    def _calculate_skills_score(
        self, 
        resume_features: Dict[str, Any], 
        job_requirements: Dict[str, Any]
    ) -> float:
        """
        💻 คำนวณคะแนน Skills (30% of total)
        
        Hybrid approach:
        - 60% Exact matching
        - 40% Semantic similarity (SBERT)
        """
        logger.info("[MatchingService] Calculating skills score...")
        
        # Get resume skills
        skills_data = resume_features.get("skills", {})
        resume_skills = skills_data.get("technical_skills", [])
        
        # Also include soft skills if available
        soft_skills = skills_data.get("soft_skills", [])
        all_resume_skills = resume_skills + soft_skills
        
        # Get job required skills
        job_skills = job_requirements.get("skills_required", [])
        
        if not job_skills:
            logger.info("[MatchingService] No required skills in job - returning 100%")
            return 100.0
        
        if not all_resume_skills:
            logger.info("[MatchingService] No skills in resume - returning 0%")
            return 0.0
        
        # Normalize skills (lowercase)
        resume_skills_lower = [s.lower().strip() for s in all_resume_skills if s]
        job_skills_lower = [s.lower().strip() for s in job_skills if s]
        
        # Calculate exact match score (60%)
        exact_matches = sum(1 for skill in job_skills_lower if skill in resume_skills_lower)
        exact_score = (exact_matches / len(job_skills_lower)) * 100
        
        logger.info(f"[MatchingService] Exact matches: {exact_matches}/{len(job_skills_lower)}")
        
        # Calculate semantic similarity score (40%)
        semantic_score = 0.0
        if self.sbert_model is not None:
            try:
                semantic_score = self._calculate_semantic_skills_score(
                    resume_skills_lower, 
                    job_skills_lower
                )
            except Exception as e:
                logger.warning(f"[MatchingService] Semantic matching failed: {e}")
                semantic_score = exact_score  # Fall back to exact score
        else:
            # If SBERT not available, use only exact matching
            semantic_score = exact_score
        
        # Combine: 60% exact + 40% semantic
        final_score = (exact_score * 0.6) + (semantic_score * 0.4)
        
        logger.info(f"[MatchingService] Skills score: {final_score:.1f}% (exact: {exact_score:.1f}%, semantic: {semantic_score:.1f}%)")
        
        return final_score
    
    def _calculate_semantic_skills_score(
        self, 
        resume_skills: List[str], 
        job_skills: List[str]
    ) -> float:
        """
        🧠 คำนวณ Semantic Similarity ด้วย SBERT
        
        ใช้ cosine similarity ระหว่าง skill embeddings
        """
        if not self.sbert_model:
            return 0.0
        
        # Encode all skills
        resume_embeddings = self.sbert_model.encode(resume_skills)
        job_embeddings = self.sbert_model.encode(job_skills)
        
        # Calculate similarity matrix
        similarity_matrix = cosine_similarity(job_embeddings, resume_embeddings)
        
        # For each job skill, find the max similarity with any resume skill
        max_similarities = similarity_matrix.max(axis=1)
        
        # Consider a "match" if similarity > 0.5
        threshold = 0.5
        semantic_matches = sum(1 for sim in max_similarities if sim > threshold)
        
        score = (semantic_matches / len(job_skills)) * 100
        
        logger.info(f"[MatchingService] Semantic matches (threshold {threshold}): {semantic_matches}/{len(job_skills)}")
        
        return score
    
    def _calculate_major_score(
        self, 
        resume_features: Dict[str, Any], 
        job_requirements: Dict[str, Any]
    ) -> float:
        """
        🎓 คำนวณคะแนน Major (25% of total)
        
        Scoring:
        - Exact match = 100%
        - Similar field (IT ≈ CS) = 80%
        - Related (has "computer" or "engineering") = 50%
        - Different = 30%
        """
        logger.info("[MatchingService] Calculating major score...")
        
        # Get resume major
        education = resume_features.get("education", {})
        resume_major = education.get("major", "").lower().strip()
        
        # Get job required major
        job_major = job_requirements.get("major_required", "").lower().strip()
        
        if not job_major:
            logger.info("[MatchingService] No major requirement - returning 100%")
            return 100.0
        
        if not resume_major:
            logger.info("[MatchingService] No major in resume - returning 30%")
            return 30.0
        
        # Exact match
        if resume_major == job_major or job_major in resume_major or resume_major in job_major:
            logger.info(f"[MatchingService] Exact major match: {resume_major}")
            return 100.0
        
        # Check similar fields
        for field, variations in self.SIMILAR_MAJORS.items():
            job_is_field = any(v in job_major for v in variations) or field in job_major
            resume_is_field = any(v in resume_major for v in variations) or field in resume_major
            
            if job_is_field and resume_is_field:
                logger.info(f"[MatchingService] Similar major match: {resume_major} ≈ {job_major}")
                return 80.0
        
        # Check if both are in IT/CS related fields
        job_keywords = any(kw in job_major for kw in self.RELATED_KEYWORDS)
        resume_keywords = any(kw in resume_major for kw in self.RELATED_KEYWORDS)
        
        if job_keywords and resume_keywords:
            logger.info(f"[MatchingService] Related major: {resume_major}")
            return 50.0
        
        # Different field
        logger.info(f"[MatchingService] Different major: {resume_major} vs {job_major}")
        return 30.0
    
    def _calculate_experience_score(
        self, 
        resume_features: Dict[str, Any], 
        job_requirements: Dict[str, Any]
    ) -> float:
        """
        ⏰ คำนวณคะแนน Experience (15% of total)
        
        Scoring based on months:
        - 12+ months = 100%
        - 6-11 months = 85%
        - 3-5 months = 70%
        - 1-2 months = 50%
        - 0 months (no requirement) = 30%
        """
        logger.info("[MatchingService] Calculating experience score...")
        
        resume_exp = resume_features.get("experience_months", 0)
        min_exp = job_requirements.get("min_experience_months", 0)
        
        # If no experience required, still give higher score for more experience
        if min_exp == 0:
            if resume_exp >= 12:
                logger.info(f"[MatchingService] No req, 12+ months exp = 100%")
                return 100.0
            elif resume_exp >= 6:
                logger.info(f"[MatchingService] No req, 6-11 months exp = 90%")
                return 90.0
            elif resume_exp >= 3:
                logger.info(f"[MatchingService] No req, 3-5 months exp = 80%")
                return 80.0
            elif resume_exp >= 1:
                logger.info(f"[MatchingService] No req, 1-2 months exp = 70%")
                return 70.0
            else:
                logger.info(f"[MatchingService] No req, no exp = 60%")
                return 60.0
        
        # Experience required - check if meets requirement
        if resume_exp >= min_exp:
            # Exceeds or meets requirement
            if resume_exp >= 12:
                return 100.0
            elif resume_exp >= 6:
                return 85.0
            elif resume_exp >= 3:
                return 70.0
            else:
                return 50.0
        else:
            # Below requirement
            ratio = resume_exp / min_exp if min_exp > 0 else 0
            score = max(30.0, ratio * 70)  # Minimum 30%
            logger.info(f"[MatchingService] Below req: {resume_exp}/{min_exp} months = {score:.1f}%")
            return score
    
    def _calculate_projects_score(
        self, 
        resume_features: Dict[str, Any], 
        job_requirements: Dict[str, Any]
    ) -> float:
        """
        📁 คำนวณคะแนน Projects (15% of total)
        
        Scoring:
        - 2+ relevant projects = 100%
        - 1 relevant project = 70%
        - Has projects but not relevant = 40%
        - No projects = 30%
        """
        logger.info("[MatchingService] Calculating projects score...")
        
        projects = resume_features.get("projects", [])
        job_skills = job_requirements.get("skills_required", [])
        job_skills_lower = [s.lower() for s in job_skills if s]
        
        if not projects:
            logger.info("[MatchingService] No projects - returning 30%")
            return 30.0
        
        if not job_skills_lower:
            # If no specific skills required, just having projects is good
            if len(projects) >= 2:
                return 100.0
            elif len(projects) == 1:
                return 70.0
            return 40.0
        
        # Count relevant projects
        relevant_count = 0
        for project in projects:
            project_techs = project.get("technologies", [])
            project_techs_lower = [t.lower() for t in project_techs if t]
            
            # Check if any project technology matches job skills
            if any(tech in job_skills_lower for tech in project_techs_lower):
                relevant_count += 1
                continue
            
            # Also check project name/description for keywords
            project_name = project.get("name", "").lower()
            project_desc = project.get("description", "").lower()
            project_text = f"{project_name} {project_desc}"
            
            if any(skill in project_text for skill in job_skills_lower):
                relevant_count += 1
        
        logger.info(f"[MatchingService] Relevant projects: {relevant_count}/{len(projects)}")
        
        if relevant_count >= 2:
            return 100.0
        elif relevant_count == 1:
            return 70.0
        else:
            return 40.0  # Has projects but not relevant
    
    def _calculate_certification_score(
        self, 
        resume_features: Dict[str, Any], 
        job_requirements: Dict[str, Any]
    ) -> float:
        """
        📜 คำนวณคะแนน Certification (10% of total)
        
        Scoring:
        - Has required cert = 100%
        - Has preferred cert = 70%
        - Has other certs = 40%
        - No certs (no requirement) = 100%
        - No certs (required) = 0%
        """
        logger.info("[MatchingService] Calculating certification score...")
        
        resume_certs = resume_features.get("certifications", [])
        required_certs = job_requirements.get("required_certifications", [])
        preferred_certs = job_requirements.get("preferred_certifications", [])
        
        # Normalize certificate names
        resume_cert_names = [
            c.get("name", "").lower() if isinstance(c, dict) else str(c).lower()
            for c in resume_certs if c
        ]
        required_certs_lower = [c.lower() for c in required_certs if c]
        preferred_certs_lower = [c.lower() for c in preferred_certs if c]
        
        # No certification requirement
        if not required_certs_lower and not preferred_certs_lower:
            if resume_cert_names:
                logger.info(f"[MatchingService] Has certs, no req = 100%")
                return 100.0
            else:
                logger.info(f"[MatchingService] No certs, no req = 100%")
                return 100.0
        
        # Check for required certifications
        if required_certs_lower:
            has_required = any(
                any(required in cert_name for cert_name in resume_cert_names)
                for required in required_certs_lower
            )
            if has_required:
                logger.info(f"[MatchingService] Has required cert = 100%")
                return 100.0
            elif not resume_cert_names:
                logger.info(f"[MatchingService] Required cert missing = 0%")
                return 0.0
        
        # Check for preferred certifications
        if preferred_certs_lower:
            has_preferred = any(
                any(preferred in cert_name for cert_name in resume_cert_names)
                for preferred in preferred_certs_lower
            )
            if has_preferred:
                logger.info(f"[MatchingService] Has preferred cert = 70%")
                return 70.0
        
        # Has other certifications
        if resume_cert_names:
            logger.info(f"[MatchingService] Has other certs = 40%")
            return 40.0
        
        # No certs when preferred (not required)
        logger.info(f"[MatchingService] No certs, preferred missing = 50%")
        return 50.0
    
    def _calculate_gpa_score(
        self, 
        resume_features: Dict[str, Any], 
        job_requirements: Dict[str, Any]
    ) -> float:
        """
        📊 คำนวณคะแนน GPA (5% of total)
        
        Scoring:
        - >= 3.5 = 100%
        - >= 3.0 = 85%
        - >= 2.75 = 70%
        - >= 2.5 = 50%
        - < 2.5 = 30%
        """
        logger.info("[MatchingService] Calculating GPA score...")
        
        education = resume_features.get("education", {})
        resume_gpa = education.get("gpa", 0.0)
        min_gpa = job_requirements.get("min_gpa", 0.0)
        
        # Ensure numeric
        try:
            resume_gpa = float(resume_gpa) if resume_gpa else 0.0
            min_gpa = float(min_gpa) if min_gpa else 0.0
        except (ValueError, TypeError):
            resume_gpa = 0.0
            min_gpa = 0.0
        
        # Check minimum requirement
        if min_gpa > 0 and resume_gpa < min_gpa:
            logger.info(f"[MatchingService] GPA {resume_gpa} below min {min_gpa} = 30%")
            return 30.0
        
        # Score based on GPA value
        if resume_gpa >= 3.5:
            score = 100.0
        elif resume_gpa >= 3.0:
            score = 85.0
        elif resume_gpa >= 2.75:
            score = 70.0
        elif resume_gpa >= 2.5:
            score = 50.0
        else:
            score = 30.0
        
        logger.info(f"[MatchingService] GPA {resume_gpa} = {score}%")
        return score
    
    def _calculate_zone(self, overall_score: float) -> str:
        """
        🚦 Traffic Light Classification
        
        - >= 80% = green (แนะนำ)
        - 50-79% = yellow (พิจารณา)
        - < 50% = red (ไม่แนะนำ)
        """
        if overall_score >= 80:
            return "green"
        elif overall_score >= 50:
            return "yellow"
        else:
            return "red"
    
    def _generate_recommendation(
        self, 
        overall_score: float, 
        zone: str, 
        breakdown: Dict[str, float]
    ) -> str:
        """
        📝 สร้างข้อความแนะนำ
        """
        if zone == "green":
            return f"Highly recommended - Strong match ({overall_score:.1f}%)"
        elif zone == "yellow":
            # Find weakest areas
            weak_areas = [k for k, v in breakdown.items() if v < 60]
            if weak_areas:
                return f"Consider for interview - Improve {', '.join(weak_areas)} ({overall_score:.1f}%)"
            return f"Consider for interview - Moderate match ({overall_score:.1f}%)"
        else:
            # Find critical gaps
            critical = [k for k, v in breakdown.items() if v < 40]
            if critical:
                return f"Not recommended - Significant gaps in {', '.join(critical)} ({overall_score:.1f}%)"
            return f"Not recommended - Overall mismatch ({overall_score:.1f}%)"
    
    def get_gap_analysis(
        self, 
        resume_features: Dict[str, Any], 
        job_requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        📊 วิเคราะห์ Gap Analysis
        
        Returns:
            {
                "overall_score": 75.5,
                "zone": "yellow",
                "gaps": [...],
                "recommendations": [...]
            }
        """
        # First calculate match
        match_result = self.calculate_match(resume_features, job_requirements)
        
        gaps = []
        recommendations = []
        
        breakdown = match_result["breakdown"]
        
        # Analyze each component
        if breakdown["skills"] < 70:
            job_skills = job_requirements.get("skills_required", [])
            resume_skills = resume_features.get("skills", {}).get("technical_skills", [])
            missing = [s for s in job_skills if s.lower() not in [r.lower() for r in resume_skills]]
            if missing:
                gaps.append({
                    "area": "skills",
                    "score": breakdown["skills"],
                    "missing": missing[:5]  # Top 5 missing
                })
                recommendations.append(f"Learn: {', '.join(missing[:3])}")
        
        if breakdown["major"] < 80:
            gaps.append({
                "area": "major",
                "score": breakdown["major"],
                "note": "Different field of study"
            })
            recommendations.append("Consider taking courses in the required field")
        
        if breakdown["experience"] < 70:
            gaps.append({
                "area": "experience",
                "score": breakdown["experience"],
                "note": "Need more hands-on experience"
            })
            recommendations.append("Gain internship or project experience")
        
        if breakdown["projects"] < 70:
            gaps.append({
                "area": "projects",
                "score": breakdown["projects"],
                "note": "Need more relevant projects"
            })
            recommendations.append("Build projects using required technologies")
        
        if breakdown["certification"] < 70:
            required_certs = job_requirements.get("required_certifications", [])
            preferred_certs = job_requirements.get("preferred_certifications", [])
            gaps.append({
                "area": "certification",
                "score": breakdown["certification"],
                "missing": required_certs + preferred_certs
            })
            if required_certs:
                recommendations.append(f"Get certified: {required_certs[0]}")
        
        if breakdown["gpa"] < 70:
            gaps.append({
                "area": "gpa",
                "score": breakdown["gpa"],
                "note": "GPA below preferred threshold"
            })
        
        return {
            "overall_score": match_result["overall_score"],
            "zone": match_result["zone"],
            "breakdown": match_result["breakdown"],
            "gaps": gaps,
            "recommendations": recommendations
        }


# =============================================================================
# 🧪 TEST - รันไฟล์โดยตรงเพื่อทดสอบ
# =============================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("🧪 Matching Service Test")
    print("=" * 60)
    
    # Initialize service
    matcher = MatchingService()
    
    # Sample resume features
    sample_resume = {
        "education": {
            "major": "Information Technology",
            "gpa": 2.59,
            "university": "Rajamangala University",
            "level": "Bachelor"
        },
        "skills": {
            "technical_skills": ["Python", "JavaScript", "MySQL", "Node.js", "Flutter"],
            "soft_skills": ["Communication", "Teamwork"]
        },
        "projects": [
            {
                "name": "Mobile App with Flutter",
                "description": "Cross-platform mobile application",
                "technologies": ["Flutter", "Dart", "Firebase"]
            },
            {
                "name": "Backend API",
                "description": "REST API service",
                "technologies": ["Node.js", "Express", "MongoDB"]
            }
        ],
        "experience_months": 8,
        "languages": ["Thai", "English"],
        "certifications": []
    }
    
    # Sample job requirements
    sample_job = {
        "title": "Backend Developer",
        "skills_required": ["Python", "Node.js", "MySQL", "React", "Docker"],
        "major_required": "Computer Science",
        "min_gpa": 2.5,
        "min_experience_months": 0,
        "required_certifications": [],
        "preferred_certifications": ["AWS Certified Cloud Practitioner"]
    }
    
    print("\n📄 Resume Summary:")
    print(f"   Major: {sample_resume['education']['major']}")
    print(f"   GPA: {sample_resume['education']['gpa']}")
    print(f"   Skills: {', '.join(sample_resume['skills']['technical_skills'])}")
    print(f"   Projects: {len(sample_resume['projects'])}")
    print(f"   Experience: {sample_resume['experience_months']} months")
    
    print("\n💼 Job Requirements:")
    print(f"   Title: {sample_job['title']}")
    print(f"   Skills: {', '.join(sample_job['skills_required'])}")
    print(f"   Major: {sample_job['major_required']}")
    print(f"   Min GPA: {sample_job['min_gpa']}")
    
    print("\n" + "-" * 60)
    print("🧮 Calculating Match Score...")
    print("-" * 60)
    
    # Calculate match
    result = matcher.calculate_match(sample_resume, sample_job)
    
    print("\n" + "=" * 60)
    print("📊 MATCHING RESULTS")
    print("=" * 60)
    print(f"\n🎯 Overall Score: {result['overall_score']}%")
    print(f"🚦 Zone: {result['zone'].upper()}")
    print(f"\n📈 Breakdown:")
    for key, value in result['breakdown'].items():
        bar = "█" * int(value / 10) + "░" * (10 - int(value / 10))
        print(f"   {key.capitalize():14}: {bar} {value}%")
    
    print(f"\n💡 Recommendation: {result['recommendation']}")
    print("=" * 60)
