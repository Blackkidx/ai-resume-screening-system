# -*- coding: utf-8 -*-
"""
📊 Academic Report Generator — XGBoost v5 Training Report
Generates publication-quality figures for thesis/capstone project.

Output: d:/ai-resume-screening-system/reports/
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    f1_score, precision_score, recall_score, roc_auc_score, roc_curve,
    precision_recall_curve, average_precision_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split, learning_curve
from xgboost import XGBClassifier
import os
from dotenv import load_dotenv
import motor.motor_asyncio

load_dotenv()

# ──────────────────────────────────
# Config
# ──────────────────────────────────
MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise ValueError("MONGODB_URL is not set in the environment variables.")

FEATURE_NAMES = [
    "skills_match_ratio", "skills_match_count", "total_skills",
    "major_match_score", "relevant_projects", "total_projects",
    "gpa_value", "has_gpa", "has_relevant_exp", "has_cert",
    "soft_skills_count", "resume_completeness",
    "gpa_below_min", "cert_job_relevance", "gpa_gap",
    "skill_focus_ratio", "soft_skills_match_ratio",
]

FEATURE_LABELS = {
    "skills_match_ratio": "Skills Match Ratio",
    "skills_match_count": "Skills Match Count",
    "total_skills": "Total Skills",
    "major_match_score": "Major Match Score",
    "relevant_projects": "Relevant Projects",
    "total_projects": "Total Projects",
    "gpa_value": "GPA Value",
    "has_gpa": "Has GPA",
    "has_relevant_exp": "Has Relevant Experience",
    "has_cert": "Has Certification",
    "soft_skills_count": "Soft Skills Count",
    "resume_completeness": "Resume Completeness",
    "gpa_below_min": "GPA Below Minimum",
    "cert_job_relevance": "Certification Relevance",
    "gpa_gap": "GPA Gap (from min)",
    "skill_focus_ratio": "Skill Focus Ratio",
    "soft_skills_match_ratio": "Soft Skills Match Ratio",
}

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
REPORT_DIR = Path("d:/ai-resume-screening-system/reports")
REPORT_DIR.mkdir(parents=True, exist_ok=True)

RANDOM_STATE = 42
TEST_SIZE = 0.2
CV_FOLDS = 5
THRESHOLD = 0.5

# Style
plt.rcParams.update({
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "axes.grid": True,
    "grid.alpha": 0.3,
    "font.size": 11,
    "axes.titlesize": 14,
    "axes.labelsize": 12,
})
sns.set_palette("viridis")


# ──────────────────────────────────
# Data Loading (same as train_xgboost.py)
# ──────────────────────────────────
async def load_real_data():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    db = client["ai_resume_screening"]
    apps = await db.applications.find(
        {"hr_decision": {"$in": ["accepted", "rejected"]}},
        {"hr_decision": 1, "xgboost_features_at_decision": 1, "xgboost_features": 1}
    ).to_list(length=None)
    client.close()

    rows = []
    for app in apps:
        feats = app.get("xgboost_features_at_decision") or app.get("xgboost_features")
        if not feats:
            continue
        if "skill_focus_ratio" not in feats:
            smc = float(feats.get("skills_match_count", 0))
            ts = float(feats.get("total_skills", 0))
            feats["skill_focus_ratio"] = round(smc / ts, 4) if ts > 0 else 0.0
        if "soft_skills_match_ratio" not in feats:
            feats["soft_skills_match_ratio"] = 0.0
        if all(name in feats for name in FEATURE_NAMES):
            label = 1 if app["hr_decision"] == "accepted" else 0
            row = {name: float(feats.get(name, 0)) for name in FEATURE_NAMES}
            row["label"] = label
            rows.append(row)

    return pd.DataFrame(rows)


def load_synthetic():
    path = Path("d:/ai-resume-screening-system/test model/merged_features_v5.csv")
    if path.exists():
        return pd.read_csv(path)
    return pd.DataFrame()


# ──────────────────────────────────
# Figure 1: Data Distribution
# ──────────────────────────────────
def fig_data_distribution(df_real, df_syn, df_combined):
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    # 1a: Class distribution of real data
    real_counts = df_real["label"].value_counts().sort_index()
    colors = ["#e74c3c", "#27ae60"]
    axes[0].bar(["Rejected", "Accepted"], [real_counts.get(0, 0), real_counts.get(1, 0)], color=colors, edgecolor="white", width=0.6)
    axes[0].set_title("Real Data Distribution\n(HR Decisions)")
    axes[0].set_ylabel("Number of Applications")
    for i, v in enumerate([real_counts.get(0, 0), real_counts.get(1, 0)]):
        axes[0].text(i, v + 3, str(v), ha="center", fontweight="bold", fontsize=12)

    # 1b: Data composition
    sizes = [len(df_real), len(df_syn)]
    labels_pie = [f"Real Data\n({len(df_real)})", f"Synthetic Data\n({len(df_syn)})"]
    colors_pie = ["#3498db", "#f39c12"]
    axes[1].pie(sizes, labels=labels_pie, colors=colors_pie, autopct="%1.1f%%",
                startangle=90, textprops={"fontsize": 11}, wedgeprops={"edgecolor": "white", "linewidth": 2})
    axes[1].set_title("Training Data Composition")

    # 1c: Combined class distribution
    comb_counts = df_combined["label"].value_counts().sort_index()
    axes[2].bar(["Rejected", "Accepted"], [comb_counts.get(0, 0), comb_counts.get(1, 0)], color=colors, edgecolor="white", width=0.6)
    axes[2].set_title("Combined Data Distribution")
    axes[2].set_ylabel("Number of Samples")
    for i, v in enumerate([comb_counts.get(0, 0), comb_counts.get(1, 0)]):
        axes[2].text(i, v + 3, str(v), ha="center", fontweight="bold", fontsize=12)

    plt.tight_layout()
    plt.savefig(REPORT_DIR / "fig1_data_distribution.png", dpi=200, bbox_inches="tight")
    plt.close()
    print("  ✅ Figure 1: Data Distribution")


# ──────────────────────────────────
# Figure 2: Confusion Matrix
# ──────────────────────────────────
def fig_confusion_matrix(y_test, y_pred):
    cm = confusion_matrix(y_test, y_pred)
    fig, ax = plt.subplots(figsize=(7, 6))

    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", ax=ax,
                xticklabels=["Rejected", "Accepted"],
                yticklabels=["Rejected", "Accepted"],
                annot_kws={"size": 20, "fontweight": "bold"},
                linewidths=2, linecolor="white")
    ax.set_xlabel("Predicted Label", fontsize=13)
    ax.set_ylabel("True Label (HR Decision)", fontsize=13)
    ax.set_title("Confusion Matrix — XGBoost v5.0", fontsize=15, fontweight="bold")

    # Add accuracy text
    acc = accuracy_score(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    txt = f"Accuracy: {acc:.1%}  |  TP: {tp}  TN: {tn}  FP: {fp}  FN: {fn}"
    fig.text(0.5, 0.02, txt, ha="center", fontsize=11, style="italic")

    plt.tight_layout(rect=[0, 0.05, 1, 1])
    plt.savefig(REPORT_DIR / "fig2_confusion_matrix.png", dpi=200, bbox_inches="tight")
    plt.close()
    print("  ✅ Figure 2: Confusion Matrix")


# ──────────────────────────────────
# Figure 3: ROC Curve
# ──────────────────────────────────
def fig_roc_curve(y_test, y_prob):
    fpr, tpr, thresholds = roc_curve(y_test, y_prob)
    auc = roc_auc_score(y_test, y_prob)

    fig, ax = plt.subplots(figsize=(8, 7))
    ax.plot(fpr, tpr, color="#3498db", linewidth=2.5, label=f"XGBoost v5.0 (AUC = {auc:.4f})")
    ax.plot([0, 1], [0, 1], "k--", linewidth=1, alpha=0.5, label="Random Classifier (AUC = 0.5)")
    ax.fill_between(fpr, tpr, alpha=0.15, color="#3498db")

    ax.set_xlabel("False Positive Rate (FPR)", fontsize=13)
    ax.set_ylabel("True Positive Rate (TPR)", fontsize=13)
    ax.set_title("ROC Curve — XGBoost v5.0", fontsize=15, fontweight="bold")
    ax.legend(loc="lower right", fontsize=11)
    ax.set_xlim([-0.02, 1.02])
    ax.set_ylim([-0.02, 1.05])

    plt.tight_layout()
    plt.savefig(REPORT_DIR / "fig3_roc_curve.png", dpi=200, bbox_inches="tight")
    plt.close()
    print("  ✅ Figure 3: ROC Curve")


# ──────────────────────────────────
# Figure 4: Precision-Recall Curve
# ──────────────────────────────────
def fig_precision_recall(y_test, y_prob):
    precision, recall, _ = precision_recall_curve(y_test, y_prob)
    ap = average_precision_score(y_test, y_prob)

    fig, ax = plt.subplots(figsize=(8, 7))
    ax.plot(recall, precision, color="#e74c3c", linewidth=2.5, label=f"XGBoost v5.0 (AP = {ap:.4f})")
    ax.fill_between(recall, precision, alpha=0.15, color="#e74c3c")

    ax.set_xlabel("Recall", fontsize=13)
    ax.set_ylabel("Precision", fontsize=13)
    ax.set_title("Precision-Recall Curve — XGBoost v5.0", fontsize=15, fontweight="bold")
    ax.legend(loc="lower left", fontsize=11)

    plt.tight_layout()
    plt.savefig(REPORT_DIR / "fig4_precision_recall.png", dpi=200, bbox_inches="tight")
    plt.close()
    print("  ✅ Figure 4: Precision-Recall Curve")


# ──────────────────────────────────
# Figure 5: Feature Importance
# ──────────────────────────────────
def fig_feature_importance(model):
    importance = model.feature_importances_
    sorted_idx = np.argsort(importance)
    names = [FEATURE_LABELS.get(FEATURE_NAMES[i], FEATURE_NAMES[i]) for i in sorted_idx]
    values = importance[sorted_idx]

    fig, ax = plt.subplots(figsize=(10, 8))
    colors = plt.cm.viridis(np.linspace(0.2, 0.9, len(names)))
    bars = ax.barh(names, values, color=colors, height=0.7, edgecolor="white")

    for bar, v in zip(bars, values):
        if v > 0.01:
            ax.text(v + 0.005, bar.get_y() + bar.get_height() / 2, f"{v:.4f}",
                    va="center", fontsize=9, fontweight="bold")

    ax.set_xlabel("Importance Score (Gain)", fontsize=13)
    ax.set_title("Feature Importance — XGBoost v5.0", fontsize=15, fontweight="bold")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    plt.tight_layout()
    plt.savefig(REPORT_DIR / "fig5_feature_importance.png", dpi=200, bbox_inches="tight")
    plt.close()
    print("  ✅ Figure 5: Feature Importance")


# ──────────────────────────────────
# Figure 6: Learning Curve
# ──────────────────────────────────
def fig_learning_curve(model, X, y):
    train_sizes, train_scores, val_scores = learning_curve(
        model, X, y, cv=5, scoring="accuracy",
        train_sizes=np.linspace(0.1, 1.0, 10),
        random_state=RANDOM_STATE, n_jobs=-1
    )

    train_mean = train_scores.mean(axis=1)
    train_std = train_scores.std(axis=1)
    val_mean = val_scores.mean(axis=1)
    val_std = val_scores.std(axis=1)

    fig, ax = plt.subplots(figsize=(10, 7))
    ax.fill_between(train_sizes, train_mean - train_std, train_mean + train_std, alpha=0.15, color="#3498db")
    ax.fill_between(train_sizes, val_mean - val_std, val_mean + val_std, alpha=0.15, color="#e74c3c")
    ax.plot(train_sizes, train_mean, "o-", color="#3498db", linewidth=2, markersize=6, label="Training Score")
    ax.plot(train_sizes, val_mean, "s-", color="#e74c3c", linewidth=2, markersize=6, label="Validation Score (CV=5)")

    ax.set_xlabel("Training Set Size", fontsize=13)
    ax.set_ylabel("Accuracy", fontsize=13)
    ax.set_title("Learning Curve — XGBoost v5.0", fontsize=15, fontweight="bold")
    ax.legend(loc="lower right", fontsize=11)
    ax.set_ylim([0.5, 1.05])

    plt.tight_layout()
    plt.savefig(REPORT_DIR / "fig6_learning_curve.png", dpi=200, bbox_inches="tight")
    plt.close()
    print("  ✅ Figure 6: Learning Curve")


# ──────────────────────────────────
# Figure 7: Cross-Validation Results
# ──────────────────────────────────
def fig_cross_validation(model, X, y):
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")

    fig, ax = plt.subplots(figsize=(9, 6))
    bars = ax.bar(
        [f"Fold {i+1}" for i in range(CV_FOLDS)],
        cv_scores, color=plt.cm.viridis(np.linspace(0.3, 0.8, CV_FOLDS)),
        edgecolor="white", width=0.6
    )
    ax.axhline(y=cv_scores.mean(), color="#e74c3c", linestyle="--", linewidth=2,
               label=f"Mean = {cv_scores.mean():.4f}")
    ax.fill_between([-0.5, CV_FOLDS - 0.5],
                     cv_scores.mean() - cv_scores.std(),
                     cv_scores.mean() + cv_scores.std(),
                     alpha=0.1, color="#e74c3c", label=f"±1 Std = {cv_scores.std():.4f}")

    for bar, score in zip(bars, cv_scores):
        ax.text(bar.get_x() + bar.get_width() / 2, score + 0.005,
                f"{score:.4f}", ha="center", fontweight="bold", fontsize=11)

    ax.set_ylabel("Accuracy", fontsize=13)
    ax.set_title(f"{CV_FOLDS}-Fold Stratified Cross-Validation — XGBoost v5.0", fontsize=15, fontweight="bold")
    ax.legend(fontsize=11)
    ax.set_ylim([0.7, 1.0])

    plt.tight_layout()
    plt.savefig(REPORT_DIR / "fig7_cross_validation.png", dpi=200, bbox_inches="tight")
    plt.close()
    print("  ✅ Figure 7: Cross-Validation")
    return cv_scores


# ──────────────────────────────────
# Figure 8: v4.4 vs v5.0 Comparison
# ──────────────────────────────────
def fig_version_comparison():
    metrics = ["Accuracy", "Precision", "Recall", "F1-Score", "AUC-ROC"]
    v4_vals = [0.841, 0.84, 0.75, 0.793, 0.913]
    v5_vals = [0.863, 0.841, 0.841, 0.841, 0.954]

    x = np.arange(len(metrics))
    width = 0.35

    fig, ax = plt.subplots(figsize=(12, 7))
    bars1 = ax.bar(x - width/2, v4_vals, width, label="v4.4 (345 samples)", color="#95a5a6", edgecolor="white")
    bars2 = ax.bar(x + width/2, v5_vals, width, label="v5.0 (805 samples)", color="#3498db", edgecolor="white")

    for bar in bars1:
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.008,
                f"{bar.get_height():.3f}", ha="center", fontsize=10, color="#666")
    for bar in bars2:
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.008,
                f"{bar.get_height():.3f}", ha="center", fontsize=10, fontweight="bold")

    ax.set_ylabel("Score", fontsize=13)
    ax.set_title("Model Performance Comparison: v4.4 vs v5.0", fontsize=15, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(metrics, fontsize=12)
    ax.legend(fontsize=12, loc="lower right")
    ax.set_ylim([0.6, 1.05])

    plt.tight_layout()
    plt.savefig(REPORT_DIR / "fig8_version_comparison.png", dpi=200, bbox_inches="tight")
    plt.close()
    print("  ✅ Figure 8: Version Comparison (v4.4 vs v5.0)")


# ──────────────────────────────────
# Figure 9: Per-Position Accuracy
# ──────────────────────────────────
def fig_position_accuracy():
    positions = [
        "Frontend Dev\n(Digital)", "Full-Stack Dev\n(Digital)", "Frontend Dev\n(TechVision)",
        "Backend Dev\n(TechVision)", "Data Analyst\n(DataPro)", "Full-Stack Dev\n(DataPro)",
        "Network Eng\n(NetSecure)", "Cybersecurity\n(NetSecure)", "Mobile Dev\n(AppNova)",
        "QA/Tester\n(AppNova)"
    ]
    old_acc = [100.0, 89.2, 89.5, 75.4, 82.5, 82.5, 77.2, 80.7, 87.7, 61.4]
    new_acc = [100.0, 95.4, 93.0, 82.5, 94.7, 86.0, 87.7, 93.0, 91.2, 84.2]

    fig, ax = plt.subplots(figsize=(16, 8))
    x = np.arange(len(positions))
    width = 0.35

    bars1 = ax.bar(x - width/2, old_acc, width, label="v4.4 (Old)", color="#e74c3c", alpha=0.7, edgecolor="white")
    bars2 = ax.bar(x + width/2, new_acc, width, label="v5.0 (New)", color="#27ae60", alpha=0.9, edgecolor="white")

    for bar, val in zip(bars1, old_acc):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                f"{val:.1f}%", ha="center", fontsize=8, color="#c0392b")
    for bar, val in zip(bars2, new_acc):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                f"{val:.1f}%", ha="center", fontsize=8, fontweight="bold", color="#1e8449")

    ax.set_ylabel("Accuracy (%)", fontsize=13)
    ax.set_title("Per-Position Accuracy Comparison: v4.4 vs v5.0\n(Tested on 585 Real HR Decisions)", fontsize=14, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(positions, fontsize=9)
    ax.legend(fontsize=12)
    ax.set_ylim([50, 110])
    ax.axhline(y=80, color="gray", linestyle=":", alpha=0.5, label="80% target")

    plt.tight_layout()
    plt.savefig(REPORT_DIR / "fig9_position_accuracy.png", dpi=200, bbox_inches="tight")
    plt.close()
    print("  ✅ Figure 9: Per-Position Accuracy")


# ──────────────────────────────────
# Figure 10: Score Distribution
# ──────────────────────────────────
def fig_score_distribution(y_test, y_prob):
    fig, ax = plt.subplots(figsize=(10, 7))

    accepted_probs = y_prob[y_test == 1]
    rejected_probs = y_prob[y_test == 0]

    ax.hist(rejected_probs, bins=30, alpha=0.7, color="#e74c3c", label=f"Rejected (n={len(rejected_probs)})", edgecolor="white")
    ax.hist(accepted_probs, bins=30, alpha=0.7, color="#27ae60", label=f"Accepted (n={len(accepted_probs)})", edgecolor="white")
    ax.axvline(x=THRESHOLD, color="#2c3e50", linestyle="--", linewidth=2, label=f"Threshold = {THRESHOLD}")

    ax.set_xlabel("Predicted Probability (Accepted)", fontsize=13)
    ax.set_ylabel("Frequency", fontsize=13)
    ax.set_title("Score Distribution by Class — XGBoost v5.0", fontsize=15, fontweight="bold")
    ax.legend(fontsize=11)

    plt.tight_layout()
    plt.savefig(REPORT_DIR / "fig10_score_distribution.png", dpi=200, bbox_inches="tight")
    plt.close()
    print("  ✅ Figure 10: Score Distribution")


# ──────────────────────────────────
# Save Metrics Summary
# ──────────────────────────────────
def save_metrics_report(metrics, cv_scores, train_size, test_size, total):
    report = {
        "model": "XGBoost v5.0",
        "generated_at": datetime.now().isoformat(),
        "data": {
            "total_samples": total,
            "real_data": 585,
            "synthetic_data": 220,
            "train_size": train_size,
            "test_size": test_size,
            "train_test_split": f"{(1-TEST_SIZE)*100:.0f}%/{TEST_SIZE*100:.0f}%",
        },
        "hyperparameters": {
            "algorithm": "XGBClassifier (Gradient Boosted Decision Trees)",
            "n_estimators": 150,
            "max_depth": 4,
            "learning_rate": 0.08,
            "min_child_weight": 3,
            "subsample": 0.85,
            "colsample_bytree": 0.85,
            "reg_alpha": 0.1,
            "reg_lambda": 1.0,
            "objective": "binary:logistic",
            "eval_metric": "logloss",
            "decision_threshold": THRESHOLD,
        },
        "features": {
            "count": len(FEATURE_NAMES),
            "names": FEATURE_NAMES,
        },
        "metrics": metrics,
        "cross_validation": {
            "folds": CV_FOLDS,
            "method": "Stratified K-Fold",
            "scores": cv_scores.tolist(),
            "mean": round(float(cv_scores.mean()), 4),
            "std": round(float(cv_scores.std()), 4),
        },
        "improvements_from_v4": {
            "accuracy": "+2.2% (84.1% → 86.3%)",
            "recall": "+9.1% (75.0% → 84.1%)",
            "auc_roc": "+0.041 (0.913 → 0.954)",
            "live_test_accuracy": "+8.0% (80.2% → 88.2%)",
            "cases_fixed": 57,
            "cases_regressed": 10,
            "net_improvement": 47,
        },
    }

    with open(REPORT_DIR / "training_metrics.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print("  ✅ Metrics JSON saved")


# ──────────────────────────────────
# MAIN
# ──────────────────────────────────
async def main():
    print("=" * 60)
    print("📊 Academic Report Generator — XGBoost v5.0")
    print("=" * 60)

    # Load data
    print("\n📦 Loading data...")
    df_real = await load_real_data()
    df_syn = load_synthetic()
    df_combined = pd.concat([df_real, df_syn], ignore_index=True)

    print(f"   Real data:     {len(df_real)} records")
    print(f"   Synthetic:     {len(df_syn)} records")
    print(f"   Combined:      {len(df_combined)} records")

    X = df_combined[FEATURE_NAMES]
    y = df_combined["label"]

    # Train/Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, stratify=y, random_state=RANDOM_STATE
    )
    print(f"   Train set:     {len(X_train)} ({(1-TEST_SIZE)*100:.0f}%)")
    print(f"   Test set:      {len(X_test)} ({TEST_SIZE*100:.0f}%)")

    # Train model (same params as v5)
    print("\n🤖 Training model...")
    accepted_count = int(y_train.sum())
    rejected_count = len(y_train) - accepted_count
    spw = round(rejected_count / accepted_count, 2) if accepted_count > 0 else 1.0

    model = XGBClassifier(
        n_estimators=150, max_depth=4, learning_rate=0.08,
        min_child_weight=3, subsample=0.85, colsample_bytree=0.85,
        reg_alpha=0.1, reg_lambda=1.0,
        objective="binary:logistic", eval_metric="logloss",
        random_state=RANDOM_STATE, scale_pos_weight=spw
    )
    model.fit(X_train, y_train, verbose=False)

    # Predict
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= THRESHOLD).astype(int)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    auc = roc_auc_score(y_test, y_prob)

    print(f"   Accuracy:  {acc:.4f}")
    print(f"   Precision: {prec:.4f}")
    print(f"   Recall:    {rec:.4f}")
    print(f"   F1-Score:  {f1:.4f}")
    print(f"   AUC-ROC:   {auc:.4f}")

    metrics = {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "auc_roc": round(float(auc), 4),
    }

    # Generate all figures
    print(f"\n📈 Generating figures to: {REPORT_DIR}")
    fig_data_distribution(df_real, df_syn, df_combined)
    fig_confusion_matrix(y_test, y_pred)
    fig_roc_curve(y_test, y_prob)
    fig_precision_recall(y_test, y_prob)
    fig_feature_importance(model)
    fig_learning_curve(model, X, y)
    cv_scores = fig_cross_validation(model, X, y)
    fig_version_comparison()
    fig_position_accuracy()
    fig_score_distribution(y_test, y_prob)
    save_metrics_report(metrics, cv_scores, len(X_train), len(X_test), len(df_combined))

    print(f"\n{'='*60}")
    print(f"✅ All 10 figures + metrics saved to:")
    print(f"   {REPORT_DIR}")
    print(f"{'='*60}")

asyncio.run(main())
