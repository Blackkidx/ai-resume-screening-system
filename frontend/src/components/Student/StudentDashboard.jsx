import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import jobService from '../../services/jobService';
import '../../styles/student-dashboard.css';

// Backend อาจส่ง score เป็น 0-1 (0.92) หรือ 0-100 (92)
const normalizeScore = (val) => {
    if (val === null || val === undefined) return 0;
    const num = Number(val);
    return num <= 1 ? Math.round(num * 100) : Math.round(num);
};

const ScoreRing = ({ score, zone }) => {
    const normalizedScore = normalizeScore(score);
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (normalizedScore / 100) * circumference;

    return (
        <div className="score-ring">
            <svg viewBox="0 0 56 56">
                <circle className="ring-bg" cx="28" cy="28" r={radius} />
                <circle
                    className={`ring-fill ${zone}`}
                    cx="28" cy="28" r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <span className="score-text">{normalizedScore}%</span>
        </div>
    );
};

const JobCard = ({ job, zone, onApply, applying }) => {
    const breakdown = job.matching_breakdown || {};

    return (
        <div className="job-card">
            <div className="job-card-header">
                <div className="job-card-info">
                    <h3>{job.title || 'ตำแหน่งงาน'}</h3>
                    <span className="job-card-company">{job.company_name || 'บริษัท'}</span>
                </div>
                <ScoreRing score={job.ai_match_score || 0} zone={zone} />
            </div>

            <div className={`zone-badge ${zone}`}>
                <span>{zone === 'green' ? '●' : '●'}</span>
                {zone === 'green' ? 'เหมาะสมมาก' : 'พิจารณาเพิ่มเติม'}
            </div>

            {Object.keys(breakdown).length > 0 && (
                <div className="score-breakdown">
                    {breakdown.skills !== undefined && (
                        <div className="breakdown-item">
                            <div className="breakdown-label">Skills</div>
                            <div className="breakdown-value">{normalizeScore(breakdown.skills)}%</div>
                        </div>
                    )}
                    {breakdown.education !== undefined && (
                        <div className="breakdown-item">
                            <div className="breakdown-label">Education</div>
                            <div className="breakdown-value">{normalizeScore(breakdown.education)}%</div>
                        </div>
                    )}
                    {breakdown.experience !== undefined && (
                        <div className="breakdown-item">
                            <div className="breakdown-label">Experience</div>
                            <div className="breakdown-value">{normalizeScore(breakdown.experience)}%</div>
                        </div>
                    )}
                </div>
            )}

            {job.recommendation_reason && (
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '8px 0 0', lineHeight: 1.5 }}>
                    {job.recommendation_reason}
                </p>
            )}

            <div className="job-card-actions">
                {job.already_applied ? (
                    <button className="btn-student applied sm" disabled>
                        สมัครแล้ว
                    </button>
                ) : (
                    <button
                        className="btn-student success sm"
                        onClick={() => onApply(job)}
                        disabled={applying}
                    >
                        {applying ? 'กำลังสมัคร...' : 'สมัครงาน'}
                    </button>
                )}
                <button
                    className="btn-student ghost sm"
                    onClick={() => window.open(`/jobs/${job.id || job._id}`, '_blank')}
                >
                    ดูรายละเอียด →
                </button>
            </div>
        </div>
    );
};

const StudentDashboard = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [greenJobs, setGreenJobs] = useState([]);
    const [yellowJobs, setYellowJobs] = useState([]);
    const [applicationsCount, setApplicationsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [noResume, setNoResume] = useState(false);
    const [applying, setApplying] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);

            const [recResult, appResult] = await Promise.all([
                jobService.getRecommendedJobs(),
                jobService.getMyApplications()
            ]);

            if (recResult.success) {
                setGreenJobs(recResult.data.green || []);
                setYellowJobs(recResult.data.yellow || []);
                setNoResume(false);
            } else {
                if (recResult.error?.includes('resume') || recResult.error?.includes('Resume')) {
                    setNoResume(true);
                }
            }

            if (appResult.success) {
                setApplicationsCount(Array.isArray(appResult.data) ? appResult.data.length : 0);
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        loadDashboard();
    }, [isAuthenticated, navigate, loadDashboard]);

    const handleApply = async (job) => {
        const jobId = job.id || job._id;
        setApplying(jobId);
        try {
            const result = await jobService.applyJob(jobId, {
                cover_letter: '',
                expected_start_date: new Date().toISOString().split('T')[0]
            });

            if (result.success) {
                showToast('สมัครงานสำเร็จ! 🎉');
                loadDashboard();
            } else if (result.error?.includes('PHONE_REQUIRED')) {
                const goToProfile = window.confirm(
                    '⚠️ กรุณาเพิ่มเบอร์โทรศัพท์ก่อนสมัครงาน\n\nกดตกลงเพื่อไปหน้าโปรไฟล์'
                );
                if (goToProfile) navigate('/profile');
            } else {
                showToast(result.error || 'เกิดข้อผิดพลาด', 'error');
            }
        } catch (error) {
            showToast('เกิดข้อผิดพลาดในการสมัคร', 'error');
        } finally {
            setApplying(null);
        }
    };

    const displayName = user?.full_name || user?.username || 'นักศึกษา';

    if (loading) {
        return (
            <div className="student-dashboard">
                <div className="dashboard-loading">
                    <div className="loading-spinner-ring" />
                    <p>กำลังวิเคราะห์งานที่เหมาะกับคุณ...</p>
                </div>
            </div>
        );
    }

    if (noResume) {
        return (
            <div className="student-dashboard">
                <div className="student-container">
                    <div className="dashboard-section">
                        <div className="no-resume-state">
                            <div className="no-resume-icon">📄</div>
                            <h2>อัปโหลด Resume ก่อนเริ่มต้น</h2>
                            <p>ระบบ AI จะวิเคราะห์ Resume ของคุณเพื่อแนะนำงานที่เหมาะสมที่สุด</p>
                            <button
                                className="btn-student primary"
                                onClick={() => navigate('/student/resume')}
                            >
                                อัปโหลด Resume
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="student-dashboard">
            <div className="student-container">
                {/* Welcome */}
                <div className="welcome-section">
                    <div className="welcome-content">
                        <div className="welcome-text">
                            <h1>สวัสดี, <span>{displayName}</span></h1>
                            <p>ระบบ AI ได้วิเคราะห์งานที่เหมาะกับคุณแล้ว</p>
                        </div>
                        <div className="welcome-actions">
                            <button className="btn-student outline" onClick={() => navigate('/student/resume')}>
                                จัดการ Resume
                            </button>
                            <button className="btn-student primary" onClick={() => navigate('/student/applications')}>
                                ใบสมัครของฉัน
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="stats-overview">
                    <div className="overview-card green">
                        <div className="overview-card-icon">✓</div>
                        <div className="overview-card-number">{greenJobs.length}</div>
                        <div className="overview-card-label">งานที่เหมาะสม</div>
                    </div>
                    <div className="overview-card yellow">
                        <div className="overview-card-icon">!</div>
                        <div className="overview-card-number">{yellowJobs.length}</div>
                        <div className="overview-card-label">พิจารณาเพิ่มเติม</div>
                    </div>
                    <div className="overview-card red" style={{ cursor: 'pointer' }} onClick={() => navigate('/student/not-ready')}>
                        <div className="overview-card-icon">✕</div>
                        <div className="overview-card-number">—</div>
                        <div className="overview-card-label">ยังไม่เหมาะสม</div>
                    </div>
                    <div className="overview-card blue" style={{ cursor: 'pointer' }} onClick={() => navigate('/student/applications')}>
                        <div className="overview-card-icon">▸</div>
                        <div className="overview-card-number">{applicationsCount}</div>
                        <div className="overview-card-label">สมัครแล้ว</div>
                    </div>
                </div>

                {/* Green Zone */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>
                            งานที่เหมาะกับคุณ
                            <span className="section-badge green">{greenJobs.length} ตำแหน่ง</span>
                        </h2>
                    </div>

                    {greenJobs.length > 0 ? (
                        <div className="job-cards-grid">
                            {greenJobs.map(job => (
                                <JobCard
                                    key={job.id || job._id}
                                    job={job}
                                    zone="green"
                                    onApply={handleApply}
                                    applying={applying === (job.id || job._id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">🔍</div>
                            <h3>ยังไม่มีงานที่เหมาะสมมาก</h3>
                            <p>ลองอัปเดต Resume เพื่อเพิ่มโอกาสในการจับคู่</p>
                        </div>
                    )}
                </div>

                {/* Yellow Zone */}
                {yellowJobs.length > 0 && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>
                                งานที่น่าสนใจ
                                <span className="section-badge yellow">{yellowJobs.length} ตำแหน่ง</span>
                            </h2>
                        </div>

                        <div className="job-cards-grid">
                            {yellowJobs.map(job => (
                                <JobCard
                                    key={job.id || job._id}
                                    job={job}
                                    zone="yellow"
                                    onApply={handleApply}
                                    applying={applying === (job.id || job._id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Links */}
                <div className="dashboard-section" style={{ textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '16px', color: '#0F172A', fontWeight: 700 }}>
                        ต้องการพัฒนาตัวเอง?
                    </h2>
                    <p style={{ color: '#64748B', marginBottom: '24px' }}>
                        ดูรายละเอียดงานที่ยังไม่เหมาะกับคุณ พร้อมคำแนะนำสิ่งที่ต้องพัฒนา
                    </p>
                    <button className="btn-student primary" onClick={() => navigate('/student/not-ready')}>
                        ดู Gap Analysis →
                    </button>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`toast-message ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
