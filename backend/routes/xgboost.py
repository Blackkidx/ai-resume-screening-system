# -*- coding: utf-8 -*-
"""
🤖 XGBoost API Routes — AI Resume Screening System

Endpoints:
    POST /api/xgboost/predict     → ทำนายจาก 6 dimension scores
    GET  /api/xgboost/model-info  → ข้อมูล model
    POST /api/xgboost/retrain     → Train ใหม่ (Admin only)
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
    """Request body สำหรับ predict"""
    skills: float = Field(..., ge=0, le=100, description="Skills score (0-100)")
    major: float = Field(..., ge=0, le=100, description="Major score (0-100)")
    experience: float = Field(..., ge=0, le=100, description="Experience score (0-100)")
    projects: float = Field(..., ge=0, le=100, description="Projects score (0-100)")
    certification: float = Field(..., ge=0, le=100, description="Certification score (0-100)")
    gpa: float = Field(..., ge=0, le=100, description="GPA score (0-100)")


# ─────────────────────────────────────
# POST /predict
# ─────────────────────────────────────
@router.post("/predict")
async def predict(
    body: PredictRequest,
    current_user: dict = Depends(get_current_user_data),
) -> dict[str, Any]:
    """
    🤖 ทำนายผลจาก 6 dimension scores ด้วย XGBoost

    ส่ง skills, major, experience, projects, certification, gpa (0-100)
    → ได้ผลทำนาย + ความมั่นใจ
    """
    breakdown = body.model_dump()

    service = XGBoostService.get_instance()
    result = service.predict(breakdown)

    return result


# ─────────────────────────────────────
# GET /model-info
# ─────────────────────────────────────
@router.get("/model-info")
async def get_model_info(
    current_user: dict = Depends(get_current_user_data),
) -> dict[str, Any]:
    """
    📊 ดูข้อมูล model — accuracy, จำนวน data, feature importance ฯลฯ
    """
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
    """
    🔄 Train XGBoost ใหม่จาก HR decisions ล่าสุด (Admin only)
    """
    # Auth check — Admin only
    user_type = current_user.get("user_type", "")
    if user_type != "Admin":
        raise HTTPException(status_code=403, detail="Admin only")

    # Run training script
    script_path = Path(__file__).resolve().parent.parent / "scripts" / "train_xgboost.py"
    if not script_path.exists():
        raise HTTPException(status_code=500, detail="Training script not found")

    logger.info("[RETRAIN] Starting XGBoost retraining...")

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

        # Reload model
        service = XGBoostService.get_instance()
        reloaded = service.reload_model()

        return {
            "success": True,
            "message": "Model retrained successfully" if reloaded else "Training completed but model reload failed",
            "model_available": reloaded,
            "model_info": service.get_model_info() if reloaded else {},
            "output": result.stdout[-1000:] if result.stdout else "",
        }

    except subprocess.TimeoutExpired:
        logger.error("[ERROR] Training timed out (120s)")
        raise HTTPException(status_code=504, detail="Training timed out")
    except Exception as e:
        logger.error(f"[ERROR] Retrain error: {e}")
        raise HTTPException(status_code=500, detail=f"Retrain failed: {str(e)}")
