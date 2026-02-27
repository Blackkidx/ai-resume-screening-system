# -*- coding: utf-8 -*-
"""
🤖 XGBoost Service — Singleton สำหรับ predict ด้วย trained model

โหลด model ครั้งเดียวตอน app เริ่ม → ใช้ predict ตลอดอายุ app
ถ้าไม่มี model → graceful fallback (model_available = False)
"""

import json
import logging
from pathlib import Path
from typing import Any

import joblib
import numpy as np

logger = logging.getLogger(__name__)

# Feature order ต้องตรงกับตอน train
FEATURE_NAMES = ["skills", "major", "experience", "projects", "certification", "gpa"]

# Model file paths
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_PATH = MODELS_DIR / "xgboost_model.pkl"
SCALER_PATH = MODELS_DIR / "xgboost_scaler.pkl"
METADATA_PATH = MODELS_DIR / "xgboost_metadata.json"


class XGBoostService:
    """
    Singleton service สำหรับ XGBoost prediction

    Usage:
        svc = XGBoostService.get_instance()
        result = svc.predict({"skills": 90, "major": 100, ...})
    """

    _instance: "XGBoostService | None" = None

    @classmethod
    def get_instance(cls) -> "XGBoostService":
        """Get or create singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self) -> None:
        self.model = None
        self.scaler = None
        self.metadata: dict[str, Any] = {}
        self.model_loaded: bool = False
        self._load_model()

    # ──────────────────────────────────────
    # Load / Reload
    # ──────────────────────────────────────
    def _load_model(self) -> None:
        """โหลด model, scaler, metadata จากไฟล์"""
        try:
            if not MODEL_PATH.exists() or not SCALER_PATH.exists():
                logger.info("[WARN] XGBoost model files not found - using rule-based fallback")
                self.model_loaded = False
                return

            self.model = joblib.load(MODEL_PATH)
            self.scaler = joblib.load(SCALER_PATH)

            if METADATA_PATH.exists():
                self.metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))

            self.model_loaded = True
            accuracy = self.metadata.get("accuracy", "N/A")
            samples = self.metadata.get("total_samples", "N/A")
            logger.info(f"[OK] XGBoost model loaded (accuracy: {accuracy}, samples: {samples})")

        except Exception as e:
            logger.error(f"[ERROR] Failed to load XGBoost model: {e}")
            self.model_loaded = False

    def reload_model(self) -> bool:
        """Re-load model files (เรียกหลัง retrain)"""
        self.model_loaded = False
        self._load_model()
        return self.model_loaded

    # ──────────────────────────────────────
    # Predict
    # ──────────────────────────────────────
    def predict(self, ai_breakdown: dict[str, float]) -> dict[str, Any]:
        """
        ทำนายผลจาก 6 dimension scores

        Args:
            ai_breakdown: {"skills": 90.0, "major": 100.0, ...}

        Returns:
            {"model_available": True, "xgboost_score": 87.0, ...}
            หรือ {"model_available": False, "fallback": "rule_based"}
        """
        if not self.model_loaded:
            return {"model_available": False, "fallback": "rule_based"}

        try:
            # สร้าง feature array ตาม order ที่ถูกต้อง
            features = np.array(
                [[float(ai_breakdown.get(name, 0.0)) for name in FEATURE_NAMES]]
            )

            # Scale
            features_scaled = self.scaler.transform(features)

            # Predict
            probabilities = self.model.predict_proba(features_scaled)[0]
            prob_rejected = float(probabilities[0])
            prob_accepted = float(probabilities[1])

            decision = "accepted" if prob_accepted >= 0.5 else "rejected"
            confidence = max(prob_accepted, prob_rejected)

            return {
                "model_available": True,
                "xgboost_probability": round(prob_accepted, 4),
                "xgboost_decision": decision,
                "xgboost_confidence": round(confidence, 4),
                "xgboost_score": round(prob_accepted * 100, 2),
            }

        except Exception as e:
            logger.error(f"[ERROR] XGBoost prediction failed: {e}")
            return {"model_available": False, "fallback": "rule_based", "error": str(e)}

    # ──────────────────────────────────────
    # Info
    # ──────────────────────────────────────
    def is_model_available(self) -> bool:
        """ตรวจสอบว่า model พร้อมใช้หรือไม่"""
        return self.model_loaded

    def get_model_info(self) -> dict[str, Any]:
        """ดู training metadata"""
        if not self.model_loaded:
            return {"model_available": False}
        return {"model_available": True, **self.metadata}

    def get_feature_importance(self) -> dict[str, float]:
        """ดู feature importance (sorted desc)"""
        if not self.model_loaded:
            return {}
        importance = self.metadata.get("feature_importance", {})
        return dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
