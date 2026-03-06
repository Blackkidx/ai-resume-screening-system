# -*- coding: utf-8 -*-
"""
🧠 Generate Synthetic Training Data v5 — Fix AI Scoring Bias

สร้าง edge cases ที่ real data ขาด เพื่อแก้ปัญหา:
1. Network students ได้คะแนนสูงในตำแหน่ง QA/Mobile/Frontend
2. Software devs ที่มี testing mindset ได้คะแนนต่ำใน QA
3. Cross-domain confusion (SOC ≠ QA, Network ≠ Mobile)
4. Missing GPA bias
"""

import random
import pandas as pd
import numpy as np

random.seed(42)
np.random.seed(42)

FEATURE_NAMES = [
    "skills_match_ratio", "skills_match_count", "total_skills",
    "major_match_score", "relevant_projects", "total_projects",
    "gpa_value", "has_gpa", "has_relevant_exp", "has_cert",
    "soft_skills_count", "resume_completeness",
    "gpa_below_min", "cert_job_relevance", "gpa_gap",
    "skill_focus_ratio", "soft_skills_match_ratio",
]

def generate_records():
    records = []

    # ═══════════════════════════════════════════════
    # Pattern 1: HIGH skills match → ACCEPTED (obvious)
    # ═══════════════════════════════════════════════
    for _ in range(25):
        smr = round(random.uniform(0.6, 1.0), 4)
        ts = random.randint(8, 22)
        smc = max(2, int(smr * ts))
        gpa = round(random.uniform(2.8, 3.8), 2)
        records.append({
            "skills_match_ratio": smr,
            "skills_match_count": smc,
            "total_skills": ts,
            "major_match_score": round(random.uniform(0.5, 0.8), 2),
            "relevant_projects": random.randint(2, 5),
            "total_projects": random.randint(3, 6),
            "gpa_value": gpa,
            "has_gpa": 1,
            "has_relevant_exp": random.choice([0, 1]),
            "has_cert": random.choice([0, 1]),
            "soft_skills_count": random.randint(3, 8),
            "resume_completeness": round(random.uniform(0.75, 1.0), 2),
            "gpa_below_min": 0,
            "cert_job_relevance": random.choice([0, 0, 1]),
            "gpa_gap": round(gpa - 2.5, 2),
            "skill_focus_ratio": round(smc / ts, 4) if ts > 0 else 0,
            "soft_skills_match_ratio": round(random.uniform(0.0, 0.5), 4),
            "label": 1,
        })

    # ═══════════════════════════════════════════════
    # Pattern 2: LOW skills match → REJECTED (obvious)
    # ═══════════════════════════════════════════════
    for _ in range(25):
        smr = round(random.uniform(0.0, 0.15), 4)
        ts = random.randint(4, 12)
        smc = max(0, int(smr * ts))
        gpa = round(random.uniform(2.0, 3.5), 2)
        records.append({
            "skills_match_ratio": smr,
            "skills_match_count": smc,
            "total_skills": ts,
            "major_match_score": round(random.uniform(0.3, 0.5), 2),
            "relevant_projects": 0,
            "total_projects": random.randint(1, 3),
            "gpa_value": gpa,
            "has_gpa": 1 if gpa > 0 else 0,
            "has_relevant_exp": 0,
            "has_cert": 0,
            "soft_skills_count": random.randint(2, 4),
            "resume_completeness": 0.75,
            "gpa_below_min": 1 if gpa < 2.5 else 0,
            "cert_job_relevance": 0,
            "gpa_gap": round(gpa - 2.5, 2) if gpa > 0 else -2.5,
            "skill_focus_ratio": round(smc / ts, 4) if ts > 0 else 0,
            "soft_skills_match_ratio": round(random.uniform(0.0, 0.2), 4),
            "label": 0,
        })

    # ═══════════════════════════════════════════════
    # Pattern 3: Network student applies for QA/Mobile/Frontend → REJECTED
    # (แก้ bias: AI ให้คะแนนสูงเกินไปสำหรับ network students ในตำแหน่งที่ไม่เกี่ยว)
    # ═══════════════════════════════════════════════
    for _ in range(30):
        gpa = round(random.uniform(2.8, 3.8), 2)
        records.append({
            "skills_match_ratio": round(random.uniform(0.0, 0.25), 4),
            "skills_match_count": random.choice([0, 1]),
            "total_skills": random.randint(5, 10),
            "major_match_score": 0.3,
            "relevant_projects": 0,
            "total_projects": random.randint(1, 3),
            "gpa_value": gpa,
            "has_gpa": 1,
            "has_relevant_exp": 0,
            "has_cert": random.choice([0, 1]),
            "soft_skills_count": random.randint(2, 5),
            "resume_completeness": round(random.uniform(0.75, 1.0), 2),
            "gpa_below_min": 0,
            "cert_job_relevance": 0,
            "gpa_gap": round(gpa - 2.5, 2),
            "skill_focus_ratio": round(random.uniform(0.0, 0.1), 4),
            "soft_skills_match_ratio": round(random.uniform(0.0, 0.15), 4),
            "label": 0,  # REJECT: high GPA but wrong domain
        })

    # ═══════════════════════════════════════════════
    # Pattern 4: Multi-project developer with Problem Solving → ACCEPTED for QA
    # (แก้ bias: devs with testing mindset ได้คะแนนต่ำ)
    # ═══════════════════════════════════════════════
    for _ in range(20):
        gpa = round(random.uniform(2.5, 3.5), 2)
        ts = random.randint(8, 18)
        smc = random.choice([0, 1])
        records.append({
            "skills_match_ratio": round(random.uniform(0.0, 0.25), 4),
            "skills_match_count": smc,
            "total_skills": ts,
            "major_match_score": 0.3,
            "relevant_projects": random.randint(0, 1),
            "total_projects": random.randint(3, 6),
            "gpa_value": gpa,
            "has_gpa": 1,
            "has_relevant_exp": random.choice([0, 1]),
            "has_cert": 0,
            "soft_skills_count": random.randint(5, 10),
            "resume_completeness": 0.75,
            "gpa_below_min": 0,
            "cert_job_relevance": 0,
            "gpa_gap": round(gpa - 2.5, 2),
            "skill_focus_ratio": round(smc / ts, 4) if ts > 0 else 0,
            "soft_skills_match_ratio": round(random.uniform(0.1, 0.35), 4),
            "label": 1,  # ACCEPT: many projects + soft skills = testing mindset
        })

    # ═══════════════════════════════════════════════
    # Pattern 5: GPA below min but strong skills → ACCEPTED (Case 2)
    # ═══════════════════════════════════════════════
    for _ in range(15):
        gpa = round(random.uniform(2.0, 2.49), 2)
        smr = round(random.uniform(0.4, 0.8), 4)
        ts = random.randint(8, 18)
        smc = max(2, int(smr * ts))
        records.append({
            "skills_match_ratio": smr,
            "skills_match_count": smc,
            "total_skills": ts,
            "major_match_score": round(random.uniform(0.3, 0.8), 2),
            "relevant_projects": random.randint(1, 3),
            "total_projects": random.randint(2, 5),
            "gpa_value": gpa,
            "has_gpa": 1,
            "has_relevant_exp": random.choice([0, 1]),
            "has_cert": 0,
            "soft_skills_count": random.randint(4, 8),
            "resume_completeness": 0.75,
            "gpa_below_min": 1,
            "cert_job_relevance": 0,
            "gpa_gap": round(gpa - 2.5, 2),
            "skill_focus_ratio": round(smc / ts, 4) if ts > 0 else 0,
            "soft_skills_match_ratio": round(random.uniform(0.0, 0.3), 4),
            "label": 1,  # ACCEPT: low GPA but strong skills
        })

    # ═══════════════════════════════════════════════
    # Pattern 6: GPA below min AND no skills → REJECTED
    # ═══════════════════════════════════════════════
    for _ in range(15):
        gpa = round(random.uniform(1.8, 2.49), 2)
        records.append({
            "skills_match_ratio": round(random.uniform(0.0, 0.25), 4),
            "skills_match_count": random.choice([0, 1]),
            "total_skills": random.randint(4, 9),
            "major_match_score": 0.3,
            "relevant_projects": 0,
            "total_projects": random.randint(1, 2),
            "gpa_value": gpa,
            "has_gpa": 1,
            "has_relevant_exp": 0,
            "has_cert": 0,
            "soft_skills_count": random.randint(2, 4),
            "resume_completeness": 0.75,
            "gpa_below_min": 1,
            "cert_job_relevance": 0,
            "gpa_gap": round(gpa - 2.5, 2),
            "skill_focus_ratio": 0.0,
            "soft_skills_match_ratio": 0.0,
            "label": 0,
        })

    # ═══════════════════════════════════════════════
    # Pattern 7: Missing GPA + strong skills → ACCEPTED (Case 1)
    # ═══════════════════════════════════════════════
    for _ in range(15):
        smr = round(random.uniform(0.3, 0.7), 4)
        ts = random.randint(8, 18)
        smc = max(1, int(smr * ts))
        records.append({
            "skills_match_ratio": smr,
            "skills_match_count": smc,
            "total_skills": ts,
            "major_match_score": 0.3,
            "relevant_projects": random.randint(1, 3),
            "total_projects": random.randint(2, 5),
            "gpa_value": 0.0,
            "has_gpa": 0,
            "has_relevant_exp": random.choice([0, 1]),
            "has_cert": 0,
            "soft_skills_count": random.randint(3, 7),
            "resume_completeness": 0.75,
            "gpa_below_min": 1,
            "cert_job_relevance": 0,
            "gpa_gap": -2.5,
            "skill_focus_ratio": round(smc / ts, 4) if ts > 0 else 0,
            "soft_skills_match_ratio": round(random.uniform(0.0, 0.2), 4),
            "label": 1,  # ACCEPT: no GPA but has skills
        })

    # ═══════════════════════════════════════════════
    # Pattern 8: Missing GPA + no skills → REJECTED
    # ═══════════════════════════════════════════════
    for _ in range(15):
        records.append({
            "skills_match_ratio": round(random.uniform(0.0, 0.1), 4),
            "skills_match_count": 0,
            "total_skills": random.randint(3, 8),
            "major_match_score": 0.3,
            "relevant_projects": 0,
            "total_projects": random.randint(0, 2),
            "gpa_value": 0.0,
            "has_gpa": 0,
            "has_relevant_exp": 0,
            "has_cert": 0,
            "soft_skills_count": random.randint(1, 3),
            "resume_completeness": round(random.uniform(0.5, 0.75), 2),
            "gpa_below_min": 1,
            "cert_job_relevance": 0,
            "gpa_gap": -2.5,
            "skill_focus_ratio": 0.0,
            "soft_skills_match_ratio": 0.0,
            "label": 0,
        })

    # ═══════════════════════════════════════════════
    # Pattern 9: High GPA + high major match but NO skills match → REJECTED
    # (แก้ bias: GPA alone shouldn't accept)
    # ═══════════════════════════════════════════════
    for _ in range(20):
        gpa = round(random.uniform(3.2, 3.9), 2)
        records.append({
            "skills_match_ratio": 0.0,
            "skills_match_count": 0,
            "total_skills": random.randint(5, 12),
            "major_match_score": 0.8,
            "relevant_projects": 0,
            "total_projects": random.randint(1, 4),
            "gpa_value": gpa,
            "has_gpa": 1,
            "has_relevant_exp": 0,
            "has_cert": 0,
            "soft_skills_count": random.randint(2, 5),
            "resume_completeness": 0.75,
            "gpa_below_min": 0,
            "cert_job_relevance": 0,
            "gpa_gap": round(gpa - 2.5, 2),
            "skill_focus_ratio": 0.0,
            "soft_skills_match_ratio": round(random.uniform(0.0, 0.15), 4),
            "label": 0,  # REJECT: great GPA but wrong skills entirely
        })

    # ═══════════════════════════════════════════════
    # Pattern 10: Cert + Experience + moderate skills → ACCEPTED
    # ═══════════════════════════════════════════════
    for _ in range(15):
        smr = round(random.uniform(0.2, 0.5), 4)
        ts = random.randint(10, 20)
        smc = max(1, int(smr * ts))
        gpa = round(random.uniform(2.8, 3.5), 2)
        records.append({
            "skills_match_ratio": smr,
            "skills_match_count": smc,
            "total_skills": ts,
            "major_match_score": round(random.uniform(0.3, 0.8), 2),
            "relevant_projects": random.randint(0, 2),
            "total_projects": random.randint(1, 3),
            "gpa_value": gpa,
            "has_gpa": 1,
            "has_relevant_exp": 1,
            "has_cert": 1,
            "soft_skills_count": random.randint(3, 6),
            "resume_completeness": 1.0,
            "gpa_below_min": 0,
            "cert_job_relevance": 1,
            "gpa_gap": round(gpa - 2.5, 2),
            "skill_focus_ratio": round(smc / ts, 4) if ts > 0 else 0,
            "soft_skills_match_ratio": round(random.uniform(0.1, 0.3), 4),
            "label": 1,
        })

    # ═══════════════════════════════════════════════
    # Pattern 11: Non-IT background (Office/Design) → REJECTED
    # ═══════════════════════════════════════════════
    for _ in range(15):
        gpa = round(random.uniform(2.5, 3.2), 2)
        records.append({
            "skills_match_ratio": 0.0,
            "skills_match_count": 0,
            "total_skills": random.randint(3, 6),
            "major_match_score": 0.3,
            "relevant_projects": 0,
            "total_projects": random.randint(0, 2),
            "gpa_value": gpa,
            "has_gpa": 1,
            "has_relevant_exp": 0,
            "has_cert": random.choice([0, 1]),
            "soft_skills_count": random.randint(1, 3),
            "resume_completeness": round(random.uniform(0.5, 1.0), 2),
            "gpa_below_min": 0,
            "cert_job_relevance": 0,
            "gpa_gap": round(gpa - 2.5, 2),
            "skill_focus_ratio": 0.0,
            "soft_skills_match_ratio": 0.0,
            "label": 0,
        })

    # ═══════════════════════════════════════════════
    # Pattern 12: Moderate skills + high soft skills → borderline ACCEPTED
    # (QA-type candidates that should pass)
    # ═══════════════════════════════════════════════
    for _ in range(10):
        gpa = round(random.uniform(2.6, 3.3), 2)
        ts = random.randint(6, 14)
        smc = random.choice([0, 1])
        records.append({
            "skills_match_ratio": round(random.uniform(0.1, 0.25), 4),
            "skills_match_count": smc,
            "total_skills": ts,
            "major_match_score": 0.3,
            "relevant_projects": random.randint(0, 1),
            "total_projects": random.randint(3, 6),
            "gpa_value": gpa,
            "has_gpa": 1,
            "has_relevant_exp": 1,
            "has_cert": random.choice([0, 1]),
            "soft_skills_count": random.randint(6, 10),
            "resume_completeness": 0.75,
            "gpa_below_min": 0,
            "cert_job_relevance": 0,
            "gpa_gap": round(gpa - 2.5, 2),
            "skill_focus_ratio": round(smc / ts, 4) if ts > 0 else 0,
            "soft_skills_match_ratio": round(random.uniform(0.15, 0.5), 4),
            "label": 1,
        })

    return records


def main():
    records = generate_records()
    df = pd.DataFrame(records, columns=FEATURE_NAMES + ["label"])

    accepted = df["label"].sum()
    rejected = len(df) - accepted
    print(f"🧪 Generated {len(df)} synthetic records")
    print(f"   ✅ Accepted: {accepted} ({accepted/len(df)*100:.1f}%)")
    print(f"   ❌ Rejected: {rejected} ({rejected/len(df)*100:.1f}%)")

    output_path = "d:/ai-resume-screening-system/test model/merged_features_v5.csv"
    import os
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"💾 Saved to: {output_path}")


if __name__ == "__main__":
    main()
