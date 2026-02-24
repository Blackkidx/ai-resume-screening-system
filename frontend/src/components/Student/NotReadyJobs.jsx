import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import jobService from '../../services/jobService';
import '../../styles/student-dashboard.css';
import '../../styles/not-ready.css';

const NotReadyJobs = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noResume, setNoResume] = useState(false);

    const loadNotReadyJobs = useCallback(async () => {
        try {
            setLoading(true);
            const result = await jobService.getNotReadyJobs();

            if (result.success) {
                setJobs(result.data.jobs || []);
            } else {
                if (result.error?.includes('resume') || result.error?.includes('Resume')) {
                    setNoResume(true);
                }
            }
        } catch (error) {
            console.error('Error loading not-ready jobs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        loadNotReadyJobs();
    }, [isAuthenticated, navigate, loadNotReadyJobs]);

    const getBarLevel = (score) => {
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    };

    if (loading) {
        return (
            <div className="gap-analysis-page">
                <div className="dashboard-loading">
                    <div className="loading-spinner-ring" />
                    <p>กำลังวิเคราะห์ช่องว่างทักษะ...</p>
                </div>
            </div>
        );
    }

    if (noResume) {
        return (
            <div className="gap-analysis-page">
                <div className="gap-container">
                    <div className="dashboard-section">
                        <div className="no-resume-state">
                            <div className="no-resume-icon">📄</div>
                            <h2>อัปโหลด Resume ก่อน</h2>
                            <p>ระบบต้องวิเคราะห์ Resume ของคุณก่อนจึงจะแสดง Gap Analysis ได้</p>
                            <button className="btn-student primary" onClick={() => navigate('/student/resume')}>
                                อัปโหลด Resume
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="gap-analysis-page">
            <div className="gap-container">
                {/* Header */}
                <div className="gap-header">
                    <div className="gap-header-content">
                        <button className="gap-back-btn" onClick={() => navigate('/student/dashboard')}>
                            ←
                        </button>
                        <h1>Gap Analysis</h1>
                    </div>
                    <p>งานที่คุณยังต้องพัฒนาเพิ่มเติม พร้อมคำแนะนำจาก AI</p>
                </div>

                {/* Job Cards */}
                {jobs.length > 0 ? (
                    jobs.map((job, index) => (
                        <div className="gap-job-card" key={job.job_id || index} style={{ animationDelay: `${index * 0.1}s` }}>
                            {/* Top: Job Info + Score */}
                            <div className="gap-job-top">
                                <div className="gap-job-info">
                                    <h3>{job.job_title}</h3>
                                    <span className="gap-company">{job.company_name}</span>
                                </div>
                                <div className="gap-score-badge">
                                    <span className="gap-score-value">{job.score}%</span>
                                    <span className="gap-score-label">match</span>
                                </div>
                            </div>

                            {/* Breakdown Bars */}
                            {job.breakdown && Object.keys(job.breakdown).length > 0 && (
                                <div className="gap-breakdown">
                                    {Object.entries(job.breakdown).map(([key, value]) => {
                                        const pct = Math.round(value);
                                        return (
                                            <div className="gap-breakdown-item" key={key}>
                                                <div className="gap-breakdown-label">{key}</div>
                                                <div className="gap-breakdown-bar">
                                                    <div
                                                        className={`gap-breakdown-fill ${getBarLevel(pct)}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <div className="gap-breakdown-value">{pct}%</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Missing Skills */}
                            {job.missing_skills && job.missing_skills.length > 0 && (
                                <div className="gap-skills-section">
                                    <div className="gap-skills-title">
                                        ✕ ทักษะที่ยังขาด
                                    </div>
                                    <div className="missing-skills-list">
                                        {job.missing_skills.map((skill, i) => (
                                            <span className="missing-skill-tag" key={i}>{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {job.recommendations && job.recommendations.length > 0 && (
                                <div className="gap-recommendations">
                                    <div className="gap-recommendations-title">
                                        ✓ คำแนะนำจาก AI
                                    </div>
                                    <ul className="recommendation-list">
                                        {job.recommendations.map((rec, i) => (
                                            <li className="recommendation-item" key={i}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="dashboard-section">
                        <div className="empty-state">
                            <div className="empty-state-icon">🎉</div>
                            <h3>คุณเหมาะกับทุกตำแหน่ง!</h3>
                            <p>ไม่มีงานในโซนแดง — Resume ของคุณตรงกับทุกตำแหน่งที่เปิดรับ</p>
                            <button className="btn-student primary" style={{ marginTop: '16px' }} onClick={() => navigate('/student/dashboard')}>
                                กลับ Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotReadyJobs;
