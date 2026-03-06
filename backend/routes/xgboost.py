# -*- coding: utf-8 -*-
"""
🤖 XGBoost API Routes — AI Resume Screening System

Endpoints:
    POST /api/xgboost/predict      → ทำนายจาก resume + job features
    GET  /api/xgboost/model-info   → ข้อมูล model
    POST /api/xgboost/retrain      → Train ใหม่ (Admin only)
"""

import logging
import subprocess
import sys
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from core.auth import get_current_user_data
from services.xgboost_service import XGBoostService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["XGBoost AI"])


# ─────────────────────────────────────
# Request/Response Models
# ─────────────────────────────────────
class PredictRequest(BaseModel):
    """14 granular features for XGBoost v4 prediction."""
    skills_match_ratio: float = Field(0.0, ge=0, le=1.0)
    skills_match_count: int = Field(0, ge=0)
    total_skills: int = Field(0, ge=0)
    major_match_score: float = Field(0.0, ge=0, le=1.0)
    relevant_projects: int = Field(0, ge=0)
    total_projects: int = Field(0, ge=0)
    gpa_value: float = Field(0.0, ge=0, le=4.0)
    has_gpa: int = Field(0, ge=0, le=1)
    has_relevant_exp: int = Field(0, ge=0, le=1)
    has_cert: int = Field(0, ge=0, le=1)
    soft_skills_count: int = Field(0, ge=0)
    resume_completeness: float = Field(0.0, ge=0, le=1.0)
    gpa_below_min: int = Field(0, ge=0, le=1)
    cert_job_relevance: int = Field(0, ge=0, le=1)
    gpa_gap: float = Field(0.0)


# ─────────────────────────────────────
# POST /predict
# ─────────────────────────────────────
@router.post("/predict")
async def predict(
    body: PredictRequest,
    current_user: dict = Depends(get_current_user_data),
) -> dict[str, Any]:
    """🤖 ทำนายด้วย 14 granular features (XGBoost v4)."""
    service = XGBoostService.get_instance()
    return service.predict(body.model_dump())


# ─────────────────────────────────────
# GET /model-info
# ─────────────────────────────────────
@router.get("/model-info")
async def get_model_info(
    current_user: dict = Depends(get_current_user_data),
) -> dict[str, Any]:
    """📊 ดูข้อมูล model — accuracy, features, threshold."""
    service = XGBoostService.get_instance()
    info = service.get_model_info()
    info["feature_importance"] = service.get_feature_importance()
    return info


# ─────────────────────────────────────
# POST /retrain
# ─────────────────────────────────────
@router.post("/retrain")
async def retrain_model(
    current_user: dict = Depends(get_current_user_data),
) -> dict[str, Any]:
    """🔄 Train XGBoost ใหม่จาก HR decisions ล่าสุด (Admin only)."""
    if current_user.get("user_type") != "Admin":
        raise HTTPException(status_code=403, detail="Admin only")

    script_path = Path(__file__).resolve().parent.parent / "scripts" / "train_xgboost.py"
    if not script_path.exists():
        raise HTTPException(status_code=500, detail="Training script not found")

    logger.info("[RETRAIN] Starting XGBoost v4 retraining...")

    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(script_path.parent.parent),
        )

        if result.returncode != 0:
            logger.error(f"[ERROR] Training failed:\n{result.stderr}")
            return {
                "success": False,
                "message": "Training failed",
                "error": result.stderr[-500:] if result.stderr else "Unknown error",
                "output": result.stdout[-500:] if result.stdout else "",
            }

        service = XGBoostService.get_instance()
        reloaded = service.reload_model()

        return {
            "success": True,
            "message": "Model retrained" if reloaded else "Training done but reload failed",
            "model_available": reloaded,
            "model_info": service.get_model_info() if reloaded else {},
            "output": result.stdout[-1000:] if result.stdout else "",
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Training timed out (120s)")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Retrain failed")
