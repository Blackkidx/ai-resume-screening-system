import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import jobService from '../../services/jobService';
import '../../styles/student-dashboard.css';
import '../../styles/my-applications.css';

const STATUS_MAP = {
    pending: { label: 'รอพิจารณา', className: 'pending', icon: 'clock' },
    reviewing: { label: 'กำลังพิจารณา', className: 'reviewing', icon: 'eye' },
    accepted: { label: 'ผ่านการคัดเลือก', className: 'accepted', icon: 'check' },
    rejected: { label: 'ไม่ผ่านการคัดเลือก', className: 'rejected', icon: 'x' },
    interview: { label: 'นัดสัมภาษณ์', className: 'accepted', icon: 'calendar' },
};

/* ---------- SVG Icons ---------- */
const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);
const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
);
const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const CalendarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
const ChevronDown = ({ open }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`chevron-icon ${open ? 'chevron-open' : ''}`}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
const BackArrow = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);
const BriefcaseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

const iconMap = { clock: ClockIcon, eye: EyeIcon, check: CheckIcon, x: XIcon, calendar: CalendarIcon };

/* ---------- Timeline Component ---------- */
const StatusTimeline = ({ app }) => {
    const history = app.status_history || [];
    const currentStatus = app.status || 'pending';

    // Build timeline steps
    const steps = [
        {
            status: 'submitted',
            label: 'ส่งใบสมัครแล้ว',
            at: app.submitted_at,
            done: true,
        },
    ];

    // Add history entries
    history.forEach((h) => {
        const statusInfo = STATUS_MAP[h.status] || {};
        steps.push({
            status: h.status,
            label: statusInfo.label || h.status,
            at: h.at,
            by: h.by,
            reason: h.reason,
            done: true,
        });
    });

    // If no history but status is decided, add it
    if (history.length === 0 && (currentStatus === 'accepted' || currentStatus === 'rejected')) {
        const statusInfo = STATUS_MAP[currentStatus];
        steps.push({
            status: currentStatus,
            label: statusInfo.label,
            at: app.decided_at,
            reason: app.hr_reason,
            done: true,
        });
    }

    // If still pending and no reviewing step, show pending
    if (currentStatus === 'pending' && history.length === 0) {
        steps.push({ status: 'pending', label: 'รอ HR พิจารณา', done: false });
    }

    return (
        <div className="timeline-container">
            {steps.map((step, i) => (
                <div key={i} className={`timeline-step ${step.done ? 'timeline-done' : 'timeline-waiting'} timeline-${step.status}`}>
                    <div className="timeline-dot-container">
                        <div className={`timeline-dot dot-${step.status}`}>
                            {step.status === 'submitted' && <CheckIcon />}
                            {step.status === 'accepted' && <CheckIcon />}
                            {step.status === 'rejected' && <XIcon />}
                            {step.status === 'reviewing' && <EyeIcon />}
                            {step.status === 'pending' && <ClockIcon />}
                        </div>
                        {i < steps.length - 1 && <div className={`timeline-line ${step.done ? 'line-done' : ''}`} />}
                    </div>
                    <div className="timeline-content">
                        <span className="timeline-label">{step.label}</span>
                        {step.at && (
                            <span className="timeline-time">{formatDate(step.at)}</span>
                        )}
                        {step.reason && (
                            <div className="timeline-reason">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                {step.reason}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ---------- Score Bar ---------- */
const ScoreBar = ({ label, value }) => {
    const pct = Math.min(100, Math.max(0, value));
    const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
    return (
        <div className="score-bar-row">
            <span className="score-bar-label">{label}</span>
            <div className="score-bar-track">
                <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="score-bar-value">{pct}%</span>
        </div>
    );
};

/* ---------- Helper ---------- */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '—';
    }
}

function normalizeAiScore(val) {
    if (val == null) return null;
    return val <= 1 ? Math.round(val * 100) : Math.round(val);
}

/* ========== Main Component ========== */
const MyApplications = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [rescheduleData, setRescheduleData] = useState({ reason: '', preferred_date: '' });
    const [showRescheduleForm, setShowRescheduleForm] = useState(null);

    const handleConfirmInterview = async (appId) => {
        try {
            const result = await jobService.respondInterview(appId, { action: 'confirm' });
            if (result.success) {
                loadApplications();
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Error confirming interview', error);
        }
    };

    const handleRequestReschedule = async (appId) => {
        try {
            if (!rescheduleData.reason) {
                alert('กรุณาระบุเหตุผลในการขอเลื่อน');
                return;
            }
            const result = await jobService.respondInterview(appId, {
                action: 'reschedule',
                reason: rescheduleData.reason,
                preferred_date: rescheduleData.preferred_date || ''
            });
            if (result.success) {
                setShowRescheduleForm(null);
                setRescheduleData({ reason: '', preferred_date: '' });
                loadApplications();
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Error requesting reschedule', error);
        }
    };

    const loadApplications = useCallback(async () => {
        try {
            setLoading(true);
            const result = await jobService.getMyApplications();
            if (result.success) {
                setApplications(Array.isArray(result.data) ? result.data : []);
            }
        } catch (error) {
            console.error('Error loading applications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        loadApplications();
    }, [isAuthenticated, navigate, loadApplications]);

    const filteredApps = filter === 'all'
        ? applications
        : applications.filter((app) => app.status === filter);

    const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="my-applications-page">
                <div className="dashboard-loading">
                    <div className="loading-spinner-ring" />
                    <p>กำลังโหลดรายการสมัครงาน...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="my-applications-page">
            <div className="applications-container">
                {/* Header */}
                <div className="applications-header">
                    <button className="gap-back-btn" onClick={() => navigate('/student/dashboard')} aria-label="กลับ">
                        <BackArrow />
                    </button>
                    <h1>ใบสมัครของฉัน</h1>
                    <span className="applications-count-badge">{applications.length} รายการ</span>
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    {[
                        { key: 'all', label: 'ทั้งหมด', count: applications.length },
                        { key: 'pending', label: 'รอพิจารณา', count: statusCounts.pending || 0 },
                        { key: 'accepted', label: 'ผ่าน', count: statusCounts.accepted || 0 },
                        { key: 'rejected', label: 'ไม่ผ่าน', count: statusCounts.rejected || 0 },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
                            onClick={() => setFilter(tab.key)}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {/* Application List */}
                {filteredApps.length > 0 ? (
                    filteredApps.map((app, index) => {
                        const status = STATUS_MAP[app.status] || STATUS_MAP.pending;
                        const Icon = iconMap[status.icon] || ClockIcon;
                        const isExpanded = expandedId === (app.id || app._id);
                        const aiScore = normalizeAiScore(app.ai_score);
                        const breakdown = app.matching_breakdown || {};

                        return (
                            <div
                                className={`application-card app-card-enhanced ${isExpanded ? 'app-expanded' : ''}`}
                                key={app.id || app._id || index}
                                style={{ animationDelay: `${index * 0.06}s` }}
                            >
                                {/* Card Header — click to expand */}
                                <button
                                    className="app-card-header"
                                    onClick={() => setExpandedId(isExpanded ? null : (app.id || app._id))}
                                    aria-expanded={isExpanded}
                                >
                                    <div className={`app-status-icon status-${status.className}`}>
                                        <Icon />
                                    </div>

                                    <div className="application-info">
                                        <h3>{app.job_title || 'ตำแหน่งงาน'}</h3>
                                        <div className="application-company">
                                            <BriefcaseIcon />
                                            {app.company_name || 'บริษัท'}
                                        </div>
                                    </div>

                                    <div className="application-right">
                                        {aiScore !== null && (
                                            <div className={`app-ai-score score-${app.matching_zone || ''}`}>
                                                {aiScore}%
                                            </div>
                                        )}
                                        <span className={`app-status-badge ${status.className}`}>
                                            {status.label}
                                        </span>
                                        <ChevronDown open={isExpanded} />
                                    </div>
                                </button>

                                {/* Expandable Detail */}
                                {isExpanded && (
                                    <div className="app-card-detail app-detail-enter">
                                        {/* Timeline */}
                                        <div className="app-detail-section">
                                            <h4 className="detail-section-title">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
                                                สถานะการสมัคร
                                            </h4>
                                            <StatusTimeline app={app} />
                                        </div>

                                        {/* Interview Detail */}
                                        {app.interview && (
                                            <div className={`app-detail-section interview-section status-${app.interview.status}`}>
                                                <h4 className="detail-section-title">
                                                    <CalendarIcon />
                                                    รายละเอียดนัดสัมภาษณ์
                                                </h4>

                                                <div className="interview-info-grid">
                                                    <div className="interview-info-item">
                                                        <span className="i-label">วันที่</span>
                                                        <span className="i-value">{formatDate(app.interview.date)}</span>
                                                    </div>
                                                    <div className="interview-info-item">
                                                        <span className="i-label">เวลา</span>
                                                        <span className="i-value">{app.interview.time} น.</span>
                                                    </div>
                                                    <div className="interview-info-item">
                                                        <span className="i-label">รูปแบบ</span>
                                                        <span className="i-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {app.interview.method === 'online' ? (
                                                                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> Online</>
                                                            ) : app.interview.method === 'phone' ? (
                                                                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg> โทรศัพท์</>
                                                            ) : (
                                                                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg> On-site</>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="interview-info-item">
                                                        <span className="i-label">สถานที่ / ลิงก์</span>
                                                        <span className="i-value">
                                                            {app.interview.method === 'online' && app.interview.link ? (
                                                                <a href={app.interview.link} target="_blank" rel="noopener noreferrer" className="interview-link">คลิกเพื่อเข้าร่วม</a>
                                                            ) : (
                                                                app.interview.location || '-'
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                {app.interview.note && (
                                                    <div className="interview-note">
                                                        <strong>หมายเหตุ / สิ่งที่ต้องเตรียม: </strong>{app.interview.note}
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                {(app.interview.status === 'scheduled' || app.interview.status === 'rescheduled') && (
                                                    <div className="interview-actions-student">
                                                        <button
                                                            className="btn-student ai"
                                                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                                            onClick={() => handleConfirmInterview(app.id || app._id)}
                                                        >
                                                            <CheckIcon /> ยืนยันนัดหมาย
                                                        </button>
                                                        <button
                                                            className="btn-student secondary"
                                                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                                            onClick={() => setShowRescheduleForm(app.id || app._id)}
                                                        >
                                                            <ClockIcon /> ขอเลื่อนนัด (ก่อน 4 วัน)
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Reschedule Form */}
                                                {showRescheduleForm === (app.id || app._id) && (
                                                    <div className="reschedule-form-box">
                                                        <div className="form-group">
                                                            <label>เหตุผลความจำเป็น *</label>
                                                            <textarea
                                                                value={rescheduleData.reason}
                                                                onChange={e => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                                                                placeholder="เช่น ติดสอบ, ป่วยกะทันหัน..."
                                                                rows={2}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>วัน/เวลา ที่สะดวก (ไม่บังคับ)</label>
                                                            <input
                                                                type="text"
                                                                value={rescheduleData.preferred_date}
                                                                onChange={e => setRescheduleData({ ...rescheduleData, preferred_date: e.target.value })}
                                                                placeholder="เช่น วันศุกร์ที่ 15 ก.พ. ช่วงบ่าย"
                                                            />
                                                        </div>
                                                        <div className="reschedule-actions">
                                                            <button className="btn-cancel-small" onClick={() => setShowRescheduleForm(null)}>ยกเลิก</button>
                                                            <button className="btn-submit-small" onClick={() => handleRequestReschedule(app.id || app._id)}>ส่งคำขอ</button>
                                                        </div>
                                                    </div>
                                                )}

                                                {app.interview.status === 'reschedule_requested' && (
                                                    <div className="interview-pending-msg">
                                                        ⚠️ คำขอเลื่อนนัดถูกส่งแล้ว รอการอนุมัติจากบริษัท ({app.interview.reschedule_reason})
                                                    </div>
                                                )}
                                                {app.interview.status === 'confirmed' && (
                                                    <div className="interview-confirmed-msg">
                                                        ✅ คุณได้ยืนยันการนัดสัมภาษณ์เรียบร้อยแล้ว เตรียมตัวให้พร้อม!
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* AI Score Breakdown */}
                                        {Object.keys(breakdown).length > 0 && (
                                            <div className="app-detail-section">
                                                <h4 className="detail-section-title">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                                    AI Matching Score
                                                </h4>
                                                <div className="score-breakdown">
                                                    {breakdown.skills != null && <ScoreBar label="ทักษะ" value={breakdown.skills} />}
                                                    {breakdown.major != null && <ScoreBar label="สาขา" value={breakdown.major} />}
                                                    {breakdown.experience != null && <ScoreBar label="ประสบการณ์" value={breakdown.experience} />}
                                                    {breakdown.projects != null && <ScoreBar label="โปรเจค" value={breakdown.projects} />}
                                                    {breakdown.gpa != null && <ScoreBar label="GPA" value={breakdown.gpa} />}
                                                    {breakdown.certification != null && <ScoreBar label="ใบรับรอง" value={breakdown.certification} />}
                                                </div>
                                            </div>
                                        )}

                                        {/* HR Reason */}
                                        {app.hr_reason && (
                                            <div className="app-detail-section">
                                                <h4 className="detail-section-title">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                    ความเห็นจาก HR
                                                </h4>
                                                <div className={`hr-reason-card reason-${app.status}`}>
                                                    <p>{app.hr_reason}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Feedback */}
                                        {app.ai_feedback && (
                                            <div className="app-detail-section">
                                                <h4 className="detail-section-title">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                    คำแนะนำจาก AI
                                                </h4>
                                                <p className="ai-feedback-text">{app.ai_feedback}</p>
                                            </div>
                                        )}

                                        {/* Meta info */}
                                        <div className="app-card-meta">
                                            <span>สมัครเมื่อ: {formatDate(app.submitted_at)}</span>
                                            {app.application_code && <span>รหัส: {app.application_code}</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="dashboard-section">
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                            </div>
                            <h3>{filter === 'all' ? 'ยังไม่มีการสมัครงาน' : 'ไม่มีรายการในหมวดนี้'}</h3>
                            <p>
                                {filter === 'all'
                                    ? 'เริ่มสมัครงานได้จากหน้า Dashboard เพื่อเริ่มต้นเส้นทางอาชีพของคุณ'
                                    : 'ลองเลือกดูหมวดอื่น'}
                            </p>
                            {filter === 'all' && (
                                <button className="btn-student primary" style={{ marginTop: '16px' }} onClick={() => navigate('/student/dashboard')}>
                                    ไป Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyApplications;
