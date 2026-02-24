import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config';
import jobService from '../../services/jobService';
import '../../styles/applicant-review.css';

const normalizeScore = (val) => {
    if (val === null || val === undefined) return 0;
    const num = Number(val);
    return num <= 1 ? Math.round(num * 100) : Math.round(num);
};

const ScoreRing = ({ score }) => {
    const normalized = normalizeScore(score);
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (normalized / 100) * circumference;
    const zone = normalized >= 80 ? 'high' : normalized >= 50 ? 'medium' : 'low';

    return (
        <div className="applicant-score-ring">
            <svg viewBox="0 0 72 72">
                <circle className="ring-bg" cx="36" cy="36" r={radius} />
                <circle
                    className={`ring-fill ${zone}`}
                    cx="36" cy="36" r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <span className="applicant-score-text">{normalized}%</span>
        </div>
    );
};

const BreakdownBar = ({ label, icon, score }) => {
    const pct = normalizeScore(score);
    const zone = pct >= 80 ? 'high' : pct >= 50 ? 'medium' : 'low';
    return (
        <div className="breakdown-row">
            <span className="breakdown-icon">{icon}</span>
            <span className="breakdown-label">{label}</span>
            <div className="breakdown-bar-track">
                <div
                    className={`breakdown-bar-fill ${zone}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className={`breakdown-pct ${zone}`}>{pct}%</span>
        </div>
    );
};

const ApplicantReview = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [jobInfo, setJobInfo] = useState({});
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [processing, setProcessing] = useState(null);
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState(null);
    const [reason, setReason] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadApplicants = useCallback(async () => {
        try {
            setLoading(true);
            const result = await jobService.getApplicants(jobId);
            if (result.success) {
                setJobInfo(result.data.job || {});
                setApplicants(result.data.applicants || []);
            } else {
                showToast(result.error || 'โหลดข้อมูลผิดพลาด', 'error');
            }
        } catch (error) {
            showToast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        if (user && user.user_type !== 'HR' && user.user_type !== 'Admin') {
            navigate('/');
            return;
        }
        loadApplicants();
    }, [isAuthenticated, user, navigate, loadApplicants]);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const openModal = (applicant, action) => {
        setModal({ applicant, action });
        setReason('');
    };

    const handleDecision = async () => {
        if (!modal) return;
        const { applicant, action } = modal;
        const appId = applicant.id || applicant._id;

        setProcessing(appId);
        setModal(null);

        const result = await jobService.updateApplicationStatus(appId, action, reason);

        if (result.success) {
            showToast(
                action === 'accepted' ? 'รับผู้สมัครเรียบร้อย ✓' : 'ปฏิเสธผู้สมัครแล้ว',
                'success'
            );
            loadApplicants();
        } else {
            showToast(result.error || 'เกิดข้อผิดพลาด', 'error');
        }

        setProcessing(null);
        setReason('');
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'accepted':
                return { label: 'รับแล้ว', className: 'accepted' };
            case 'rejected':
                return { label: 'ปฏิเสธ', className: 'rejected' };
            default:
                return { label: 'รอพิจารณา', className: 'pending' };
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('th-TH', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const extractEducation = (resumeData) => {
        if (!resumeData) return null;
        const edu = resumeData.education;
        if (!edu) return null;
        if (Array.isArray(edu) && edu.length > 0) return edu[0];
        if (typeof edu === 'object' && !Array.isArray(edu)) return edu;
        return null;
    };

    const extractProjects = (resumeData) => {
        if (!resumeData) return [];
        const projects = resumeData.projects;
        if (Array.isArray(projects)) return projects;
        return [];
    };

    const extractCertifications = (resumeData) => {
        if (!resumeData) return [];
        const certs = resumeData.certifications || resumeData.certificates;
        if (Array.isArray(certs)) return certs;
        return [];
    };

    const getStrengths = (breakdown) => {
        if (!breakdown) return [];
        const strengths = [];
        const labels = {
            skills: 'ทักษะตรงกับตำแหน่ง',
            major: 'สาขาตรงกับตำแหน่ง',
            experience: 'มีประสบการณ์เพียงพอ',
            projects: 'มีโปรเจคที่เกี่ยวข้อง',
            certification: 'มี Certification',
            gpa: 'ผลการเรียนดี',
        };
        Object.entries(breakdown).forEach(([key, val]) => {
            const pct = normalizeScore(val);
            if (pct >= 75) strengths.push(labels[key] || key);
        });
        return strengths;
    };

    const getWeaknesses = (breakdown, resumeData) => {
        if (!breakdown) return [];
        const weak = [];
        const labels = {
            skills: 'ทักษะยังไม่ครบ',
            major: 'สาขาไม่ตรง',
            experience: 'ประสบการณ์ยังน้อย',
            projects: 'โปรเจคยังน้อย',
            certification: 'ไม่มี Certification',
            gpa: `GPA ค่อนข้างต่ำ`,
        };
        Object.entries(breakdown).forEach(([key, val]) => {
            const pct = normalizeScore(val);
            if (pct < 60) {
                let label = labels[key] || key;
                if (key === 'gpa' && resumeData?.education) {
                    const edu = Array.isArray(resumeData.education) ? resumeData.education[0] : resumeData.education;
                    if (edu?.gpa) label = `GPA ค่อนข้างต่ำ (${edu.gpa})`;
                }
                weak.push(label);
            }
        });
        return weak;
    };

    const filteredApplicants = filter === 'all'
        ? applicants
        : applicants.filter(a => (a.status || 'pending') === filter);

    const counts = {
        all: applicants.length,
        pending: applicants.filter(a => !a.status || a.status === 'pending').length,
        accepted: applicants.filter(a => a.status === 'accepted').length,
        rejected: applicants.filter(a => a.status === 'rejected').length,
    };

    if (loading) {
        return (
            <div className="applicant-review-page">
                <div className="review-loading">
                    <div className="loading-ring" />
                    <p>กำลังโหลดข้อมูลผู้สมัคร...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="applicant-review-page">
            <div className="review-container">
                {/* Header */}
                <div className="review-header">
                    <div className="review-header-left">
                        <button className="btn-back-review" onClick={() => navigate('/hr/jobs')}>
                            ← กลับ
                        </button>
                        <div className="review-title">
                            <h1>{jobInfo.title || 'ตำแหน่งงาน'}</h1>
                            <p>{jobInfo.company_name}{jobInfo.department ? ` · ${jobInfo.department}` : ''}</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="review-stats">
                    {[
                        { key: 'total', icon: '👥', label: 'ผู้สมัครทั้งหมด', count: counts.all },
                        { key: 'pending', icon: '⏳', label: 'รอพิจารณา', count: counts.pending },
                        { key: 'accepted', icon: '✅', label: 'รับแล้ว', count: counts.accepted },
                        { key: 'rejected', icon: '❌', label: 'ปฏิเสธ', count: counts.rejected },
                    ].map(s => (
                        <div className="review-stat" key={s.key}>
                            <div className={`stat-icon ${s.key}`}>{s.icon}</div>
                            <div className="stat-info">
                                <span className="stat-number">{s.count}</span>
                                <span className="stat-label">{s.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter Tabs */}
                <div className="review-filter-tabs">
                    {[
                        { key: 'all', label: 'ทั้งหมด' },
                        { key: 'pending', label: 'รอพิจารณา' },
                        { key: 'accepted', label: 'รับแล้ว' },
                        { key: 'rejected', label: 'ปฏิเสธ' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
                            onClick={() => setFilter(tab.key)}
                        >
                            {tab.label}
                            <span className="tab-count">{counts[tab.key]}</span>
                        </button>
                    ))}
                </div>

                {/* Applicant List */}
                {filteredApplicants.length > 0 ? (
                    <div className="applicant-list">
                        {filteredApplicants.map((app, index) => {
                            const status = getStatusConfig(app.status);
                            const isPending = !app.status || app.status === 'pending';
                            const isExpanded = expandedId === (app.id || index);
                            const skills = app.resume_data?.skills?.technical_skills || app.resume_data?.skills || [];
                            const displaySkills = Array.isArray(skills) ? skills.slice(0, 5) : [];
                            const remainingSkills = Array.isArray(skills) ? Math.max(0, skills.length - 5) : 0;

                            const breakdown = app.matching_breakdown || {};
                            const education = extractEducation(app.resume_data);
                            const projects = extractProjects(app.resume_data);
                            const certifications = extractCertifications(app.resume_data);
                            const expMonths = app.resume_data?.experience_months || app.resume_data?.total_experience_months || 0;
                            const strengths = getStrengths(breakdown);
                            const weaknesses = getWeaknesses(breakdown, app.resume_data);

                            return (
                                <div
                                    className={`applicant-card ${isPending ? '' : 'decided'} ${isExpanded ? 'expanded' : ''}`}
                                    key={app.id || index}
                                    style={{ animationDelay: `${index * 0.08}s` }}
                                >
                                    {/* ── Compact Row ── */}
                                    <div className="card-compact-row">
                                        <ScoreRing score={app.ai_score} />

                                        <div className="applicant-info">
                                            <div className="applicant-name-row">
                                                <span className="applicant-name">
                                                    {app.student_name || 'ผู้สมัคร'}
                                                </span>
                                                <span className={`applicant-status-badge ${status.className}`}>
                                                    {isPending && <span className="status-dot-pulse" />}
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div className="applicant-email">{app.student_email || ''}</div>

                                            <div className="applicant-meta">
                                                <span>
                                                    สมัครเมื่อ {formatDate(app.submitted_at)}
                                                </span>
                                                {app.application_code && (
                                                    <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.78rem' }}>
                                                        #{app.application_code}
                                                    </span>
                                                )}
                                            </div>

                                            {displaySkills.length > 0 && (
                                                <div className="resume-summary">
                                                    {displaySkills.map((skill, i) => (
                                                        <span className="resume-skill-tag" key={i}>
                                                            {typeof skill === 'string' ? skill : skill.name || skill}
                                                        </span>
                                                    ))}
                                                    {remainingSkills > 0 && (
                                                        <span className="resume-skill-tag more">+{remainingSkills} อื่นๆ</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Expand Toggle */}
                                            <button
                                                className="btn-expand-toggle"
                                                onClick={() => toggleExpand(app.id || index)}
                                            >
                                                {isExpanded ? '▲ ซ่อนรายละเอียด' : '▼ ดูรายละเอียดเพิ่มเติม'}
                                            </button>
                                        </div>

                                        <div className="applicant-actions">
                                            {isPending ? (
                                                <>
                                                    <button
                                                        className="btn-accept"
                                                        onClick={() => openModal(app, 'accepted')}
                                                        disabled={processing === (app.id || app._id)}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        รับ
                                                    </button>
                                                    <button
                                                        className="btn-reject"
                                                        onClick={() => openModal(app, 'rejected')}
                                                        disabled={processing === (app.id || app._id)}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <line x1="18" y1="6" x2="6" y2="18" />
                                                            <line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                        ปฏิเสธ
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="decided-label">
                                                    ตัดสินใจแล้ว
                                                    {app.decided_at && <><br />{formatDate(app.decided_at)}</>}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── Expandable Detail Section ── */}
                                    {isExpanded && (
                                        <div className="card-detail-section">
                                            <div className="detail-grid">
                                                {/* AI Breakdown */}
                                                {Object.keys(breakdown).length > 0 && (
                                                    <div className="detail-block">
                                                        <h4 className="detail-block-title">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                                                            AI Score Breakdown
                                                        </h4>
                                                        <div className="breakdown-list">
                                                            <BreakdownBar label="Skills" icon="💻" score={breakdown.skills} />
                                                            <BreakdownBar label="Major" icon="🎓" score={breakdown.major} />
                                                            <BreakdownBar label="Experience" icon="💼" score={breakdown.experience} />
                                                            <BreakdownBar label="Projects" icon="📁" score={breakdown.projects} />
                                                            <BreakdownBar label="Certification" icon="📜" score={breakdown.certification} />
                                                            <BreakdownBar label="GPA" icon="📊" score={breakdown.gpa} />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Education */}
                                                <div className="detail-block">
                                                    <h4 className="detail-block-title">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                                                        การศึกษา
                                                    </h4>
                                                    {education ? (
                                                        <div className="detail-info-list">
                                                            {(education.institution || education.university) && (
                                                                <div className="detail-info-row">
                                                                    <span className="detail-key">มหาวิทยาลัย</span>
                                                                    <span className="detail-value">{education.institution || education.university}</span>
                                                                </div>
                                                            )}
                                                            {(education.major || education.field || education.degree) && (
                                                                <div className="detail-info-row">
                                                                    <span className="detail-key">สาขา</span>
                                                                    <span className="detail-value">{education.major || education.field || education.degree}</span>
                                                                </div>
                                                            )}
                                                            {education.gpa && (
                                                                <div className="detail-info-row">
                                                                    <span className="detail-key">GPA</span>
                                                                    <span className={`detail-value gpa ${Number(education.gpa) >= 3.0 ? 'good' : Number(education.gpa) >= 2.5 ? 'ok' : 'low'}`}>
                                                                        {education.gpa}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="detail-empty">ไม่มีข้อมูลการศึกษา</p>
                                                    )}
                                                </div>

                                                {/* Experience */}
                                                <div className="detail-block">
                                                    <h4 className="detail-block-title">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                                        ประสบการณ์
                                                    </h4>
                                                    <p className="detail-value-large">
                                                        {expMonths > 0 ? `${expMonths} เดือน` : 'ไม่มีประสบการณ์'}
                                                    </p>
                                                </div>

                                                {/* Projects */}
                                                <div className="detail-block">
                                                    <h4 className="detail-block-title">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                                        โปรเจค ({projects.length} โปรเจค)
                                                    </h4>
                                                    {projects.length > 0 ? (
                                                        <ul className="detail-project-list">
                                                            {projects.slice(0, 4).map((p, i) => (
                                                                <li key={i}>{typeof p === 'string' ? p : p.name || p.title || JSON.stringify(p)}</li>
                                                            ))}
                                                            {projects.length > 4 && <li className="more">+{projects.length - 4} อื่นๆ</li>}
                                                        </ul>
                                                    ) : (
                                                        <p className="detail-empty">ไม่มีโปรเจค</p>
                                                    )}
                                                </div>

                                                {/* Certifications */}
                                                <div className="detail-block">
                                                    <h4 className="detail-block-title">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
                                                        Certifications
                                                    </h4>
                                                    {certifications.length > 0 ? (
                                                        <ul className="detail-project-list">
                                                            {certifications.map((c, i) => (
                                                                <li key={i}>{typeof c === 'string' ? c : c.name || c.title || JSON.stringify(c)}</li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="detail-empty">(ไม่มี)</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Strengths / Weaknesses */}
                                            <div className="strengths-weaknesses">
                                                {strengths.length > 0 && (
                                                    <div className="sw-block sw-strengths">
                                                        <h5>✅ จุดแข็ง</h5>
                                                        <ul>
                                                            {strengths.map((s, i) => <li key={i}>{s}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {weaknesses.length > 0 && (
                                                    <div className="sw-block sw-weaknesses">
                                                        <h5>⚠️ จุดที่ควรพิจารณา</h5>
                                                        <ul>
                                                            {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {/* AI Feedback */}
                                            {app.ai_feedback && (
                                                <div className="ai-feedback">
                                                    <strong>AI Recommendation:</strong> {app.ai_feedback}
                                                </div>
                                            )}

                                            {/* HR Reason (if already decided) */}
                                            {app.hr_reason && (
                                                <div className={`hr-reason-display ${app.status === 'rejected' ? 'rejected-reason' : ''}`}>
                                                    <strong>เหตุผล HR:</strong> {app.hr_reason}
                                                </div>
                                            )}

                                            {/* Resume PDF link */}
                                            {app.resume_file_url && (
                                                <div className="detail-links">
                                                    <a
                                                        href={`${API_BASE_URL}${app.resume_file_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-resume-link"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                                                        ดู Resume PDF
                                                    </a>
                                                    {app.portfolio_url && (
                                                        <a
                                                            href={app.portfolio_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn-resume-link"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                                            ดู Portfolio
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="review-empty">
                        <div className="review-empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="23" y1="11" x2="17" y2="11" />
                            </svg>
                        </div>
                        <h3>
                            {filter === 'all'
                                ? 'ยังไม่มีผู้สมัครตำแหน่งนี้'
                                : `ไม่มีผู้สมัครที่${filter === 'pending' ? 'รอพิจารณา' : filter === 'accepted' ? 'รับแล้ว' : 'ปฏิเสธ'}`
                            }
                        </h3>
                        <p>ผู้สมัครจะปรากฏที่นี่หลังจากนักศึกษาส่งใบสมัคร</p>
                    </div>
                )}
            </div>

            {/* Decision Modal */}
            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="decision-modal" onClick={e => e.stopPropagation()}>
                        <div className={`modal-icon ${modal.action === 'accepted' ? 'accept' : 'reject'}`}>
                            {modal.action === 'accepted' ? (
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            )}
                        </div>

                        <h3>
                            {modal.action === 'accepted' ? 'ยืนยันรับผู้สมัคร?' : 'ยืนยันปฏิเสธผู้สมัคร?'}
                        </h3>
                        <p className="modal-subtitle">
                            {modal.applicant.student_name || 'ผู้สมัคร'} · AI Score {normalizeScore(modal.applicant.ai_score)}%
                        </p>

                        {modal.action === 'rejected' && (
                            <div className="modal-warning">
                                การปฏิเสธไม่สามารถเปลี่ยนกลับได้
                            </div>
                        )}

                        <label className="reason-label">
                            เหตุผล (ไม่บังคับ — แต่ช่วยให้ AI เรียนรู้ได้ดีขึ้น)
                        </label>
                        <textarea
                            className="reason-textarea"
                            placeholder={
                                modal.action === 'accepted'
                                    ? 'เช่น ทักษะตรง, Portfolio ดี, ประสบการณ์ตรง...'
                                    : 'เช่น ขาด experience, ทักษะไม่ตรง, GPA ต่ำ...'
                            }
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={3}
                        />

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setModal(null)}>
                                ยกเลิก
                            </button>
                            <button
                                className={`btn-confirm ${modal.action === 'accepted' ? 'accept' : 'reject'}`}
                                onClick={handleDecision}
                                disabled={processing}
                            >
                                {processing
                                    ? 'กำลังดำเนินการ...'
                                    : modal.action === 'accepted' ? 'ยืนยันรับ' : 'ยืนยันปฏิเสธ'
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`review-toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default ApplicantReview;
