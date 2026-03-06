# -*- coding: utf-8 -*-
"""
🤖 XGBoost Service — Singleton for model prediction

Loads model once at startup → predicts throughout app lifetime.
Graceful fallback when no model exists.
Feature names read dynamically from metadata.json.
"""

import json
import logging
from pathlib import Path
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

# Fallback feature names (will be overridden by metadata)
DEFAULT_FEATURE_NAMES = [
    "skills_match_ratio", "skills_match_count", "total_skills",
    "major_match_score", "relevant_projects", "total_projects",
    "gpa_value", "has_gpa", "has_relevant_exp", "has_cert",
    "soft_skills_count", "resume_completeness",
    "gpa_below_min", "cert_job_relevance", "gpa_gap",
    "skill_focus_ratio", "soft_skills_match_ratio",
]

DEFAULT_THRESHOLD = 0.45

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_PATH = MODELS_DIR / "xgboost_model.json"
METADATA_PATH = MODELS_DIR / "xgboost_metadata.json"


class XGBoostService:
    """Singleton XGBoost prediction service — reads features from metadata."""

    _instance: "XGBoostService | None" = None

    @classmethod
    def get_instance(cls) -> "XGBoostService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self) -> None:
        self.model = None
        self.metadata: dict[str, Any] = {}
        self.threshold: float = DEFAULT_THRESHOLD
        self.feature_names: list[str] = list(DEFAULT_FEATURE_NAMES)
        self.model_loaded: bool = False
        self._load_model()

    # ──────────────────────────────────────
    # Load / Reload
    # ──────────────────────────────────────
    def _load_model(self) -> None:
        """Load XGBoost JSON model + metadata."""
        try:
            if not MODEL_PATH.exists():
                logger.info("[XGBoost] Model not found — using rule-based fallback")
                self.model_loaded = False
                return

            from xgboost import XGBClassifier

            self.model = XGBClassifier()
            self.model.load_model(str(MODEL_PATH))

            if METADATA_PATH.exists():
                self.metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))

            self.threshold = self.metadata.get("decision_threshold", DEFAULT_THRESHOLD)
            self.feature_names = self.metadata.get("feature_names", DEFAULT_FEATURE_NAMES)
            self.model_loaded = True

            version = self.metadata.get("model_version", "?")
            accuracy = self.metadata.get("real_data_accuracy", self.metadata.get("accuracy", "N/A"))
            logger.info(f"[XGBoost] Model {version} loaded ({len(self.feature_names)} features, accuracy: {accuracy}, threshold: {self.threshold})")

        except Exception as e:
            logger.error(f"[XGBoost] Failed to load model: {e}")
            self.model_loaded = False

    def reload_model(self) -> bool:
        """Re-load model files after retrain."""
        self.model_loaded = False
        self._load_model()
        return self.model_loaded

    # ──────────────────────────────────────
    # Predict
    # ──────────────────────────────────────
    def predict(self, features: dict[str, float]) -> dict[str, Any]:
        """
        Predict from 14 granular features.

        Args:
            features: {"skills_match_ratio": 0.45, "relevant_projects": 2, ...}

        Returns:
            {"model_available": True, "xgboost_score": 87.0, ...}
        """
        if not self.model_loaded:
            return {"model_available": False, "fallback": "rule_based"}

        try:
            feature_array = np.array(
                [[float(features.get(name, 0.0)) for name in self.feature_names]]
            )

            probabilities = self.model.predict_proba(feature_array)[0]
            prob_accepted = float(probabilities[1])
            prob_rejected = float(probabilities[0])

            decision = "accepted" if prob_accepted >= self.threshold else "rejected"
            confidence = max(prob_accepted, prob_rejected)

            return {
                "model_available": True,
                "xgboost_probability": round(prob_accepted, 4),
                "xgboost_decision": decision,
                "xgboost_confidence": round(confidence, 4),
                "xgboost_score": round(prob_accepted * 100, 2),
            }

        except Exception as e:
            logger.error(f"[XGBoost] Prediction failed: {e}")
            return {"model_available": False, "fallback": "rule_based", "error": str(e)}

    # ──────────────────────────────────────
    # Info
    # ──────────────────────────────────────
    def is_model_available(self) -> bool:
        return self.model_loaded

    def get_model_info(self) -> dict[str, Any]:
        if not self.model_loaded:
            return {"model_available": False}
        return {"model_available": True, **self.metadata}

    def get_feature_importance(self) -> dict[str, float]:
        if not self.model_loaded:
            return {}
        importance = self.metadata.get("feature_importance", {})
        return dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
