# -*- coding: utf-8 -*-
"""
🤖 XGBoost Training Pipeline v5 — Final Retrain

รัน: python backend/scripts/train_xgboost.py

584 real HR decisions + 220 synthetic → Train → Save JSON model
"""

import asyncio
import json
import os
import sys
import traceback
from datetime import datetime
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    f1_score, precision_score, recall_score, roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from xgboost import XGBClassifier

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
FEATURE_NAMES = [
    "skills_match_ratio", "skills_match_count", "total_skills",
    "major_match_score", "relevant_projects", "total_projects",
    "gpa_value", "has_gpa", "has_relevant_exp", "has_cert",
    "soft_skills_count", "resume_completeness",
    "gpa_below_min", "cert_job_relevance", "gpa_gap",
    "skill_focus_ratio", "soft_skills_match_ratio",
]
LABEL_COL = "label"

MIN_SAMPLES = 20
TEST_SIZE = 0.2
RANDOM_STATE = 42
CV_FOLDS = 5
DECISION_THRESHOLD = 0.50

# v5 hyperparameters (will be tuned via GridSearch)
MODEL_PARAMS = {
    "n_estimators": 150,
    "max_depth": 4,
    "learning_rate": 0.08,
    "min_child_weight": 3,
    "subsample": 0.85,
    "colsample_bytree": 0.85,
    "reg_alpha": 0.1,
    "reg_lambda": 1.0,
}

ROOT_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT_DIR / "models"
ENV_PATH = ROOT_DIR / ".env"
SYNTHETIC_DATA = ROOT_DIR.parent / "test model" / "merged_features_v5.csv"

MODEL_PATH = MODELS_DIR / "xgboost_model.json"
METADATA_PATH = MODELS_DIR / "xgboost_metadata.json"
CHART_PATH = MODELS_DIR / "feature_importance.png"

# Legacy pkl paths for cleanup
LEGACY_MODEL_PKL = MODELS_DIR / "xgboost_model.pkl"
LEGACY_SCALER_PKL = MODELS_DIR / "xgboost_scaler.pkl"


def print_header():
    print()
    print("🚀 XGBoost Training Pipeline v5 — FINAL RETRAIN")
    print("━" * 50)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📁 Models dir: {MODELS_DIR}")
    print("━" * 50)
    print()


# ─────────────────────────────────────────────
# Step 1: Load data from MongoDB
# ─────────────────────────────────────────────
async def load_data_from_mongodb() -> list[dict]:
    """ดึง applications ที่ HR ตัดสินแล้ว พร้อม resume_data."""
    import motor.motor_asyncio

    load_dotenv(ENV_PATH)
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "ai_resume_screening")

    print("📊 Loading data from MongoDB...")
    print(f"   Database: {db_name}")

    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    cursor = db.applications.find(
        {"hr_decision": {"$in": ["accepted", "rejected"]}},
        {
            "hr_decision": 1,
            "resume_data": 1,
            "matching_breakdown": 1,
            "job_id": 1,
            "xgboost_features_at_decision": 1,
        },
    )
    applications = await cursor.to_list(length=None)
    client.close()

    return applications


def extract_features_from_app(app: dict) -> dict | None:
    """Extract 17 features from a single application document."""
    # Prefer pre-computed features saved at HR decision time
    xgb_features = app.get("xgboost_features_at_decision")
    if xgb_features:
        # Compute missing features from pre-stored data
        if "skill_focus_ratio" not in xgb_features:
            smc = float(xgb_features.get("skills_match_count", 0))
            ts = float(xgb_features.get("total_skills", 0))
            xgb_features["skill_focus_ratio"] = round(smc / ts, 4) if ts > 0 else 0.0
        if "soft_skills_match_ratio" not in xgb_features:
            xgb_features["soft_skills_match_ratio"] = 0.0

        if all(name in xgb_features for name in FEATURE_NAMES):
            label = 1 if app["hr_decision"] == "accepted" else 0
            return {name: float(xgb_features.get(name, 0)) for name in FEATURE_NAMES} | {"label": label}

    # Fallback: extract from resume_data + matching_breakdown
    resume_data = app.get("resume_data", {})
    breakdown = app.get("matching_breakdown", {})
    if not resume_data and not breakdown:
        return None

    skills_data = resume_data.get("skills", {})
    tech_skills = skills_data.get("technical_skills", [])
    soft_skills = skills_data.get("soft_skills", [])
    projects = resume_data.get("projects", [])
    education = resume_data.get("education", {})
    certs = resume_data.get("certifications", [])

    # Skills match ratio from breakdown
    skills_score = breakdown.get("skills", 50.0)
    skills_match_ratio = skills_score / 100.0

    # GPA
    gpa_value = 0.0
    try:
        gpa_value = float(education.get("gpa", 0)) or 0.0
    except (ValueError, TypeError):
        pass

    exp_months = resume_data.get("experience_months", 0) or 0
    skills_match_count = max(1, int(skills_match_ratio * len(tech_skills)))
    total_skills = len(tech_skills)

    label = 1 if app["hr_decision"] == "accepted" else 0

    return {
        "skills_match_ratio": round(skills_match_ratio, 4),
        "skills_match_count": skills_match_count,
        "total_skills": total_skills,
        "major_match_score": round(breakdown.get("major", 50.0) / 100.0, 2),
        "relevant_projects": min(len(projects), int(breakdown.get("projects", 30.0) / 35)),
        "total_projects": len(projects),
        "gpa_value": round(gpa_value, 2),
        "has_gpa": 1 if gpa_value > 0 else 0,
        "has_relevant_exp": 1 if exp_months > 0 else 0,
        "has_cert": 1 if certs else 0,
        "soft_skills_count": len(soft_skills),
        "resume_completeness": round(sum(1 for s in ["education", "skills", "projects", "certifications"] if resume_data.get(s)) / 4, 2),
        "gpa_below_min": 1 if gpa_value > 0 and gpa_value < 2.5 else 0,
        "cert_job_relevance": 0,
        "gpa_gap": round(gpa_value - 2.5, 2) if gpa_value > 0 else -2.5,
        "skill_focus_ratio": round(skills_match_count / total_skills, 4) if total_skills > 0 else 0.0,
        "soft_skills_match_ratio": 0.0,
        "label": label,
    }


def extract_features(applications: list[dict]) -> tuple[pd.DataFrame, pd.Series]:
    """Extract 14 features from all applications."""
    rows = []
    skipped = 0

    for app in applications:
        result = extract_features_from_app(app)
        if result:
            rows.append(result)
        else:
            skipped += 1

    if skipped > 0:
        print(f"   ⚠️ Skipped {skipped} applications (missing data)")

    if not rows:
        return pd.DataFrame(), pd.Series(dtype=int)

    df = pd.DataFrame(rows)
    return df[FEATURE_NAMES], df[LABEL_COL]


def load_synthetic_data() -> tuple[pd.DataFrame, pd.Series] | None:
    """Load synthetic data as supplement when real data is insufficient."""
    if not SYNTHETIC_DATA.exists():
        return None

    df = pd.read_csv(SYNTHETIC_DATA)

    # Auto-compute gpa_gap if missing (derived from gpa_value)
    if "gpa_gap" not in df.columns and "gpa_value" in df.columns:
        df["gpa_gap"] = df["gpa_value"].apply(lambda g: round(g - 2.5, 2) if g > 0 else -2.5)
        print("   📐 Auto-computed gpa_gap from gpa_value")

    # Validate columns
    missing = [c for c in FEATURE_NAMES if c not in df.columns]
    if missing:
        print(f"   ⚠️ Synthetic data missing columns: {missing}")
        return None

    return df[FEATURE_NAMES], df[LABEL_COL]


# ─────────────────────────────────────────────
# Step 2: Validate
# ─────────────────────────────────────────────
def validate_data(X: pd.DataFrame, y: pd.Series) -> bool:
    total = len(y)
    accepted = int(y.sum())
    rejected = total - accepted

    print(f"✅ Total: {total} ({accepted} accepted, {rejected} rejected)")

    if total < MIN_SAMPLES:
        print(f"\n⚠️  Not enough data ({total} < {MIN_SAMPLES})")
        return False

    ratio = min(accepted, rejected) / max(accepted, rejected) if max(accepted, rejected) > 0 else 0
    if ratio < 0.2:
        print(f"   ⚠️ Class imbalance: ratio = {ratio:.2f}")

    return True


# ─────────────────────────────────────────────
# Step 3: Train & Evaluate
# ─────────────────────────────────────────────
def train_and_evaluate(X: pd.DataFrame, y: pd.Series) -> dict:
    accepted_count = int(y.sum())
    rejected_count = len(y) - accepted_count
    spw = round(rejected_count / accepted_count, 2) if accepted_count > 0 else 1.0

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, stratify=y, random_state=RANDOM_STATE
    )

    print(f"\n📈 Training XGBoost v5 (FINAL)...")
    print(f"   Train: {len(X_train)}, Test: {len(X_test)}")
    print(f"   scale_pos_weight: {spw:.2f}")

    model = XGBClassifier(
        objective="binary:logistic",
        **MODEL_PARAMS,
        random_state=RANDOM_STATE,
        scale_pos_weight=spw,
        eval_metric="logloss",
    )
    model.fit(X_train, y_train, verbose=False)
    print("✅ Training complete!")

    # Evaluate with threshold
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= DECISION_THRESHOLD).astype(int)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    try:
        auc_roc = roc_auc_score(y_test, y_prob)
    except ValueError:
        auc_roc = 0.0

    print(f"\n📊 Evaluation (threshold={DECISION_THRESHOLD}):")
    print(f"   Accuracy:  {acc:.1%}")
    print(f"   Precision: {prec:.1%}")
    print(f"   Recall:    {rec:.1%}")
    print(f"   F1-Score:  {f1:.1%}")
    print(f"   AUC-ROC:   {auc_roc:.3f}")

    cm = confusion_matrix(y_test, y_pred)
    print(f"\n📋 Confusion Matrix:\n   {cm}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['rejected', 'accepted'])}")

    # Cross-validation
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")
    print(f"📊 {CV_FOLDS}-Fold CV: {cv_scores.mean():.1%} ± {cv_scores.std():.1%}")

    # Feature importance
    importance_dict = {
        name: round(float(imp), 4)
        for name, imp in sorted(
            zip(FEATURE_NAMES, model.feature_importances_),
            key=lambda x: x[1], reverse=True,
        )
    }

    print("\n🏆 Feature Importance:")
    for name, imp in importance_dict.items():
        bar = "█" * int(imp * 30)
        print(f"   {name:22s}: {bar} {imp:.4f}")

    return {
        "model": model,
        "metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "auc_roc": round(float(auc_roc), 4),
            "cv_mean_accuracy": round(float(cv_scores.mean()), 4),
            "cv_std": round(float(cv_scores.std()), 4),
        },
        "feature_importance": importance_dict,
        "total_samples": len(y),
        "accepted_count": accepted_count,
        "rejected_count": rejected_count,
    }


# ─────────────────────────────────────────────
# Step 4: Save
# ─────────────────────────────────────────────
def save_model(result: dict):
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # Save XGBoost JSON model (native format — no pkl/scaler needed)
    result["model"].save_model(str(MODEL_PATH))
    print(f"\n💾 Model saved: {MODEL_PATH.name}")

    # Clean up legacy pkl files
    for legacy in [LEGACY_MODEL_PKL, LEGACY_SCALER_PKL]:
        if legacy.exists():
            legacy.unlink()
            print(f"🗑️  Removed legacy: {legacy.name}")

    # Save metadata
    metadata = {
        "trained_at": datetime.now().isoformat(),
        "model_version": "v5.0",
        "feature_count": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "decision_threshold": DECISION_THRESHOLD,
        "hyperparameters": MODEL_PARAMS,
        "total_samples": result["total_samples"],
        "accepted_count": result["accepted_count"],
        "rejected_count": result["rejected_count"],
        **result["metrics"],
        "feature_importance": result["feature_importance"],
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"💾 Metadata saved: {METADATA_PATH.name}")

    # Feature importance chart
    save_feature_importance_chart(result["feature_importance"])


def save_feature_importance_chart(importance: dict):
    names = list(reversed(importance.keys()))
    values = list(reversed(importance.values()))

    fig, ax = plt.subplots(figsize=(9, 6))
    colors = plt.cm.viridis(np.linspace(0.3, 0.9, len(names)))
    ax.barh(names, values, color=colors, height=0.6)
    ax.set_xlabel("Importance Score")
    ax.set_title("Feature Importance — XGBoost v5 (17 Features)")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    for i, v in enumerate(values):
        ax.text(v + 0.003, i, f"{v:.4f}", va="center", fontsize=8)

    plt.tight_layout()
    plt.savefig(CHART_PATH, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"💾 Chart saved: {CHART_PATH.name}")


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
async def main():
    print_header()

    try:
        # Load from MongoDB
        applications = await load_data_from_mongodb()
        real_count = len(applications) if applications else 0
        print(f"   Found {real_count} HR decisions in MongoDB")

        # Extract features from real data
        X_real, y_real = pd.DataFrame(), pd.Series(dtype=int)
        if applications:
            X_real, y_real = extract_features(applications)
            print(f"   Extracted {len(X_real)} usable records")

        # Always combine real + synthetic for v5
        synthetic = load_synthetic_data()
        if synthetic:
            X_syn, y_syn = synthetic
            print(f"   Synthetic data: {len(X_syn)} records")

            if not X_real.empty:
                X = pd.concat([X_real, X_syn], ignore_index=True)
                y = pd.concat([y_real, y_syn], ignore_index=True)
                print(f"   Combined: {len(X)} records ({len(X_real)} real + {len(X_syn)} synthetic)")
            else:
                X, y = X_syn, y_syn
        else:
            print("⚠️ No synthetic data found, using real data only")
            X, y = X_real, y_real

        if not validate_data(X, y):
            return

        result = train_and_evaluate(X, y)
        save_model(result)

        print("\n" + "━" * 50)
        print("✅ Done! XGBoost v5 FINAL model ready.")
        print("━" * 50)

    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
