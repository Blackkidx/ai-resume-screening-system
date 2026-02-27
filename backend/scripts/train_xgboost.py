# -*- coding: utf-8 -*-
"""
🤖 XGBoost Training Pipeline — AI Resume Screening System

รัน: python backend/scripts/train_xgboost.py

ดึงข้อมูล HR decisions จาก MongoDB → Train XGBoost → บันทึก model
"""

import asyncio
import json
import os
import sys
import traceback
from datetime import datetime
from pathlib import Path

# Fix Windows encoding (cp1252 → utf-8) for emoji support
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
    accuracy_score,
    auc,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
FEATURE_NAMES = ["skills", "major", "experience", "projects", "certification", "gpa"]
MIN_SAMPLES = 20
TEST_SIZE = 0.2
RANDOM_STATE = 42
CV_FOLDS = 5

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT_DIR / "models"
ENV_PATH = ROOT_DIR / ".env"

MODEL_PATH = MODELS_DIR / "xgboost_model.pkl"
SCALER_PATH = MODELS_DIR / "xgboost_scaler.pkl"
METADATA_PATH = MODELS_DIR / "xgboost_metadata.json"
CHART_PATH = MODELS_DIR / "feature_importance.png"


def print_header():
    """แสดง header ตอนเริ่ม script"""
    print()
    print("🚀 XGBoost Training Pipeline")
    print("━" * 50)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📁 Models dir: {MODELS_DIR}")
    print("━" * 50)
    print()


# ─────────────────────────────────────────────
# Step 1: Load data from MongoDB
# ─────────────────────────────────────────────
async def load_data_from_mongodb() -> list[dict]:
    """ดึงข้อมูล applications ที่ HR ตัดสินแล้วจาก MongoDB"""
    import motor.motor_asyncio

    load_dotenv(ENV_PATH)
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "ai_resume_screening")

    print("📊 Loading data from MongoDB...")
    print(f"   Database: {db_name}")

    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # Query applications ที่มี hr_decision
    cursor = db.applications.find(
        {"hr_decision": {"$in": ["accepted", "rejected"]}},
        {
            "hr_decision": 1,
            "ai_breakdown_at_decision": 1,
            "ai_breakdown": 1,
            "matching_breakdown": 1,
            "ai_score_at_decision": 1,
            "ai_overall_score": 1,
        },
    )
    applications = await cursor.to_list(length=None)
    client.close()

    return applications


def extract_features(applications: list[dict]) -> tuple[pd.DataFrame, pd.Series]:
    """แปลง application documents → features DataFrame + labels"""
    rows = []
    skipped = 0

    for app in applications:
        # ดึง breakdown: ai_breakdown_at_decision → matching_breakdown → ai_breakdown
        breakdown = (
            app.get("ai_breakdown_at_decision")
            or app.get("matching_breakdown")
            or app.get("ai_breakdown")
        )
        if not breakdown:
            skipped += 1
            continue

        # ดึง 6 features
        features = {}
        valid = True
        for name in FEATURE_NAMES:
            value = breakdown.get(name)
            if value is None:
                valid = False
                break
            try:
                features[name] = float(value)
            except (ValueError, TypeError):
                valid = False
                break

        if not valid:
            skipped += 1
            continue

        # Label
        label = 1 if app["hr_decision"] == "accepted" else 0
        features["label"] = label
        rows.append(features)

    if skipped > 0:
        print(f"   ⚠️ Skipped {skipped} applications (missing breakdown data)")

    if not rows:
        return pd.DataFrame(), pd.Series(dtype=int)

    df = pd.DataFrame(rows)
    X = df[FEATURE_NAMES]
    y = df["label"]
    return X, y


# ─────────────────────────────────────────────
# Step 2-3: Validate data
# ─────────────────────────────────────────────
def validate_data(X: pd.DataFrame, y: pd.Series) -> bool:
    """ตรวจสอบจำนวนและสมดุลของข้อมูล"""
    total = len(y)
    accepted = int(y.sum())
    rejected = total - accepted

    print(f"✅ Found {total} applications ({accepted} accepted, {rejected} rejected)")

    if total < MIN_SAMPLES:
        print(f"\n⚠️  Not enough data! Need at least {MIN_SAMPLES}, got {total}")
        print("   → ให้ HR ตัดสินใจเพิ่มแล้วค่อย train ใหม่")
        return False

    # Check class balance
    ratio = min(accepted, rejected) / max(accepted, rejected) if max(accepted, rejected) > 0 else 0
    if ratio < 0.2:
        print(f"   ⚠️ Class imbalance warning: ratio = {ratio:.2f}")
        print(f"      Accepted: {accepted}, Rejected: {rejected}")
        print("      → จะใช้ scale_pos_weight เพื่อชดเชย")

    return True


# ─────────────────────────────────────────────
# Step 4-10: Train & Evaluate
# ─────────────────────────────────────────────
def train_and_evaluate(
    X: pd.DataFrame, y: pd.Series
) -> dict:
    """Train XGBoost + evaluate + return metrics"""

    accepted_count = int(y.sum())
    rejected_count = len(y) - accepted_count

    # Step 5: StandardScaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Step 6: Train/Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=TEST_SIZE, stratify=y, random_state=RANDOM_STATE
    )

    # Step 7: Train XGBClassifier
    spw = rejected_count / accepted_count if accepted_count > 0 else 1.0

    print("\n📈 Training XGBoost...")
    print(f"   Train size: {len(X_train)}, Test size: {len(X_test)}")
    print(f"   scale_pos_weight: {spw:.2f}")

    model = XGBClassifier(
        objective="binary:logistic",
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=RANDOM_STATE,
        scale_pos_weight=spw,
        eval_metric="logloss",
        use_label_encoder=False,
    )
    model.fit(X_train, y_train, verbose=False)
    print("✅ Training complete!")

    # Step 8: Evaluate
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    try:
        auc_roc = roc_auc_score(y_test, y_prob)
    except ValueError:
        auc_roc = 0.0

    print("\n📊 Evaluation Results:")
    print(f"   Accuracy:  {acc:.1%}")
    print(f"   Precision: {prec:.1%}")
    print(f"   Recall:    {rec:.1%}")
    print(f"   F1-Score:  {f1:.1%}")
    print(f"   AUC-ROC:   {auc_roc:.3f}")

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    print(f"\n📋 Confusion Matrix:")
    print(f"   {cm}")

    # Classification Report
    print(f"\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["rejected", "accepted"]))

    # Step 9: Cross-Validation
    print(f"📊 Cross-Validation ({CV_FOLDS}-fold):")
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(model, X_scaled, y, cv=cv, scoring="accuracy")
    cv_mean = cv_scores.mean()
    cv_std = cv_scores.std()
    print(f"   Mean Accuracy: {cv_mean:.1%} (± {cv_std:.1%})")

    # Step 10: Feature Importance
    importance = model.feature_importances_
    importance_dict = {
        name: round(float(imp), 4)
        for name, imp in sorted(
            zip(FEATURE_NAMES, importance), key=lambda x: x[1], reverse=True
        )
    }

    print("\n🏆 Feature Importance:")
    for name, imp in importance_dict.items():
        bar = "█" * int(imp * 30)
        print(f"   {name:14s}: {bar} {imp:.4f}")

    return {
        "model": model,
        "scaler": scaler,
        "metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "auc_roc": round(float(auc_roc), 4),
            "cv_mean_accuracy": round(float(cv_mean), 4),
            "cv_std": round(float(cv_std), 4),
        },
        "feature_importance": importance_dict,
        "total_samples": len(y),
        "accepted_count": accepted_count,
        "rejected_count": rejected_count,
    }


# ─────────────────────────────────────────────
# Step 11-13: Save model & artifacts
# ─────────────────────────────────────────────
def save_model(result: dict):
    """บันทึก model, scaler, metadata, chart"""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # Step 11: Save model + scaler
    joblib.dump(result["model"], MODEL_PATH)
    joblib.dump(result["scaler"], SCALER_PATH)
    print(f"\n💾 Model saved: {MODEL_PATH.name}")
    print(f"💾 Scaler saved: {SCALER_PATH.name}")

    # Step 12: Save metadata
    metadata = {
        "trained_at": datetime.now().isoformat(),
        "total_samples": result["total_samples"],
        "accepted_count": result["accepted_count"],
        "rejected_count": result["rejected_count"],
        **result["metrics"],
        "feature_names": FEATURE_NAMES,
        "feature_importance": result["feature_importance"],
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"💾 Metadata saved: {METADATA_PATH.name}")

    # Step 13: Feature importance chart
    save_feature_importance_chart(result["feature_importance"])
    print(f"💾 Chart saved: {CHART_PATH.name}")


def save_feature_importance_chart(importance: dict):
    """สร้าง horizontal bar chart แสดง feature importance"""
    names = list(importance.keys())
    values = list(importance.values())

    # Reverse เพื่อให้ feature สำคัญสุดอยู่บน
    names.reverse()
    values.reverse()

    fig, ax = plt.subplots(figsize=(8, 5))
    colors = plt.cm.viridis(np.linspace(0.3, 0.9, len(names)))
    ax.barh(names, values, color=colors, height=0.6)

    ax.set_xlabel("Importance Score")
    ax.set_title("Feature Importance — XGBoost Model")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    for i, v in enumerate(values):
        ax.text(v + 0.005, i, f"{v:.4f}", va="center", fontsize=9)

    plt.tight_layout()
    plt.savefig(CHART_PATH, dpi=150, bbox_inches="tight")
    plt.close(fig)


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
async def main():
    print_header()

    try:
        # Load from MongoDB
        applications = await load_data_from_mongodb()
        if not applications:
            print("❌ No applications with HR decisions found")
            print("   → ให้ HR Accept/Reject ผู้สมัครก่อน แล้วค่อย train")
            return

        # Extract features
        X, y = extract_features(applications)
        if X.empty:
            print("❌ Could not extract features from applications")
            return

        # Validate
        if not validate_data(X, y):
            return

        # Train & evaluate
        result = train_and_evaluate(X, y)

        # Save
        save_model(result)

        print("\n" + "━" * 50)
        print("✅ Done! XGBoost model is ready.")
        print("━" * 50)

    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
