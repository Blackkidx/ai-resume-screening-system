// frontend/src/components/Student/MyApplications.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import jobService from '../../services/jobService';

// Import decodeURIComponent properly
const decodeURIComponent = typeof window !== 'undefined' ? window.decodeURIComponent : (str) => str;

const STATUS_MAP = {
    pending: { label: 'รอพิจารณา', bg: 'bg-slate-100', text: 'text-slate-600', iconBg: 'bg-slate-100', iconColor: 'text-slate-500', icon: 'clock' },
    reviewing: { label: 'กำลังพิจารณา', bg: 'bg-sky-100', text: 'text-sky-700', iconBg: 'bg-sky-100', iconColor: 'text-sky-600', icon: 'eye' },
    accepted: { label: 'ผ่านการคัดเลือก', bg: 'bg-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', icon: 'check' },
    rejected: { label: 'ไม่ผ่านการคัดเลือก', bg: 'bg-rose-100', text: 'text-rose-700', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', icon: 'x' },
    interview: { label: 'นัดสัมภาษณ์', bg: 'bg-indigo-100', text: 'text-indigo-700', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', icon: 'calendar' },
};

/* ---------- SVG Icons ---------- */
const ClockIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);
const EyeIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
);
const CheckIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const XIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const CalendarIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
const BriefcaseIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

const iconMap = { clock: ClockIcon, eye: EyeIcon, check: CheckIcon, x: XIcon, calendar: CalendarIcon };

/* ---------- Timeline Component ---------- */
const StatusTimeline = ({ app }) => {
    const history = app.status_history || [];
    const currentStatus = app.status || 'pending';

    const steps = [
        { status: 'submitted', label: 'ส่งใบสมัครแล้ว', at: app.submitted_at, done: true },
    ];

    history.forEach((h) => {
        const statusInfo = STATUS_MAP[h.status] || {};
        steps.push({ status: h.status, label: statusInfo.label || h.status, at: h.at, by: h.by, reason: h.reason, done: true });
    });

    if (history.length === 0 && (currentStatus === 'accepted' || currentStatus === 'rejected')) {
        const statusInfo = STATUS_MAP[currentStatus];
        steps.push({ status: currentStatus, label: statusInfo.label, at: app.decided_at, reason: app.hr_reason, done: true });
    }

    if (currentStatus === 'pending' && history.length === 0) {
        steps.push({ status: 'pending', label: 'รอ HR พิจารณา', done: false });
    }

    const getDotClass = (step) => {
        if (!step.done) return 'bg-slate-300';
        if (step.status === 'rejected') return 'bg-rose-500';
        if (step.status === 'reviewing') return 'bg-sky-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="space-y-4">
            {steps.map((step, i) => (
                <div key={i} className={`relative pl-8 ${i !== steps.length - 1 ? 'pb-4' : ''}`}>
                    {i < steps.length - 1 && (
                        <div className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${step.done ? 'bg-emerald-200' : 'bg-slate-200'}`} />
                    )}
                    <div className={`absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${getDotClass(step)}`}>
                        {step.status === 'submitted' && <CheckIcon className="w-3 h-3 text-white" />}
                        {step.status === 'accepted' && <CheckIcon className="w-3 h-3 text-white" />}
                        {step.status === 'rejected' && <XIcon className="w-3 h-3 text-white" />}
                        {step.status === 'reviewing' && <EyeIcon className="w-3 h-3 text-white" />}
                        {step.status === 'pending' && <ClockIcon className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex flex-col">
                        <span className={`font-semibold text-sm ${step.done ? 'text-slate-900' : 'text-slate-500'}`}>{step.label}</span>
                        {step.at && <span className="text-xs text-slate-500 mt-0.5">{formatDate(step.at)}</span>}
                        {step.reason && (
                            <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
                                <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                <span>{step.reason}</span>
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
    const colorClass = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
    return (
        <div className="flex items-center gap-3">
            <span className="w-24 text-sm font-medium text-slate-600 truncate">{label}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-10 text-right text-sm font-bold text-slate-700">{pct}%</span>
        </div>
    );
};

/* ---------- Helpers ---------- */
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
    const notify = useNotification();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [rescheduleData, setRescheduleData] = useState({ reason: '', preferred_date: '' });
    const [showRescheduleForm, setShowRescheduleForm] = useState(null);

    const handleConfirmInterview = async (appId) => {
        try {
            const result = await jobService.respondInterview(appId, { action: 'confirm' });
            if (result.success) loadApplications();
            else notify.error(result.error);
        } catch (error) {
            console.error('Error confirming interview', error);
        }
    };

    const handleRequestReschedule = async (appId) => {
        try {
            if (!rescheduleData.reason) { notify.warning('กรุณาระบุเหตุผลในการขอเลื่อน'); return; }
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
                notify.error(result.error);
            }
        } catch (error) {
            console.error('Error requesting reschedule', error);
        }
    };

    const loadApplications = useCallback(async () => {
        try {
            setLoading(true);
            const result = await jobService.getMyApplications();
            if (result.success) setApplications(Array.isArray(result.data) ? result.data : []);
        } catch (error) {
            console.error('Error loading applications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) { navigate('/login'); return; }
        loadApplications();
    }, [isAuthenticated, navigate, loadApplications]);

    const filteredApps = filter === 'all' ? applications : applications.filter((app) => app.status === filter);
    const statusCounts = applications.reduce((acc, app) => { acc[app.status] = (acc[app.status] || 0) + 1; return acc; }, {});

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-sky-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-slate-600 font-medium">กำลังโหลดรายการสมัครงาน...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
                            onClick={() => navigate('/student/dashboard')}
                            aria-label="กลับ"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-slate-900">ใบสมัครของฉัน</h1>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600 border border-slate-200 shadow-sm">
                        {applications.length} รายการ
                    </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex overflow-x-auto gap-2 mb-6 pb-1">
                    {[
                        { key: 'all', label: 'ทั้งหมด', count: applications.length },
                        { key: 'pending', label: 'รอพิจารณา', count: statusCounts.pending || 0 },
                        { key: 'accepted', label: 'ผ่าน', count: statusCounts.accepted || 0 },
                        { key: 'rejected', label: 'ไม่ผ่าน', count: statusCounts.rejected || 0 },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${filter === tab.key
                                    ? 'bg-sky-600 text-white shadow-sm'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                            onClick={() => setFilter(tab.key)}
                        >
                            {tab.label}
                            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-xs font-bold ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Application Cards */}
                <div className="space-y-4">
                    {filteredApps.length > 0 ? (
                        filteredApps.map((app, index) => {
                            const status = STATUS_MAP[app.status] || STATUS_MAP.pending;
                            const Icon = iconMap[status.icon] || ClockIcon;
                            const isExpanded = expandedId === (app.id || app._id);
                            const aiScore = normalizeAiScore(app.ai_score);
                            const scoreBadgeClass = aiScore != null
                                ? (aiScore >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                    : aiScore >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200'
                                        : 'text-rose-600 bg-rose-50 border-rose-200')
                                : '';
                            const breakdown = app.matching_breakdown || {};

                            return (
                                <div
                                    key={app.id || app._id || index}
                                    className={`bg-white rounded-xl shadow-sm border transition-all overflow-hidden ${isExpanded ? 'border-sky-300' : 'border-slate-200'}`}
                                >
                                    {/* Card Header */}
                                    <button
                                        className="w-full text-left p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/60 transition-colors focus:outline-none"
                                        onClick={() => setExpandedId(isExpanded ? null : (app.id || app._id))}
                                        aria-expanded={isExpanded}
                                    >
                                        <div className="flex flex-1 items-center gap-4 min-w-0">
                                            <div className={`p-3 rounded-xl shrink-0 ${status.iconBg} ${status.iconColor}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-base font-bold text-slate-900 truncate">{app.job_title || 'ตำแหน่งงาน'}</h3>
                                                <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                                                    <BriefcaseIcon className="w-4 h-4 shrink-0" />
                                                    <span className="truncate">{app.company_name || 'บริษัท'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                            <div className="flex items-center gap-2">
                                                {aiScore != null && (
                                                    <span className={`hidden sm:inline-flex rounded-md px-2 py-1 text-xs font-bold border ${scoreBadgeClass}`}>
                                                        AI {aiScore}%
                                                    </span>
                                                )}
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            <svg
                                                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Expanded Detail */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/40 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">

                                            {/* Left: Status Timeline + Interview */}
                                            <div className="space-y-8">
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
                                                        สถานะการสมัคร
                                                    </h4>
                                                    <div className="bg-white p-5 rounded-xl border border-slate-200">
                                                        <StatusTimeline app={app} />
                                                    </div>
                                                </div>

                                                {app.interview && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                            <CalendarIcon className="w-4 h-4" />
                                                            รายละเอียดนัดสัมภาษณ์
                                                        </h4>
                                                        <div className="bg-white p-5 rounded-xl border border-indigo-200">
                                                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                                                <div>
                                                                    <span className="block text-xs text-slate-400 mb-1">วันที่</span>
                                                                    <span className="font-semibold text-slate-800">{formatDate(app.interview.date)}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="block text-xs text-slate-400 mb-1">เวลา</span>
                                                                    <span className="font-semibold text-slate-800">{app.interview.time} น.</span>
                                                                </div>
                                                                <div>
                                                                    <span className="block text-xs text-slate-400 mb-1">รูปแบบ</span>
                                                                    <span className="font-semibold text-slate-800">
                                                                        {app.interview.method === 'online' ? 'Online' : app.interview.method === 'phone' ? 'โทรศัพท์' : 'On-site'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="block text-xs text-slate-400 mb-1">สถานที่ / ลิงก์</span>
                                                                    <span className="font-semibold text-slate-800">
                                                                        {app.interview.method === 'online' && app.interview.link ? (
                                                                            <a href={app.interview.link} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">คลิกเพื่อเข้าร่วม</a>
                                                                        ) : (app.interview.location || '-')}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {app.interview.note && (
                                                                <div className="mb-4 text-sm text-indigo-800 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                                                    <strong>หมายเหตุ: </strong>{app.interview.note}
                                                                </div>
                                                            )}

                                                            {(app.interview.status === 'scheduled' || app.interview.status === 'rescheduled') && (
                                                                <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-slate-100">
                                                                    <button
                                                                        className="flex-1 inline-flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                                                        onClick={() => handleConfirmInterview(app.id || app._id)}
                                                                    >
                                                                        <CheckIcon className="w-4 h-4" /> ยืนยันนัดหมาย
                                                                    </button>
                                                                    <button
                                                                        className="flex-1 inline-flex justify-center items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                                                        onClick={() => setShowRescheduleForm(app.id || app._id)}
                                                                    >
                                                                        <ClockIcon className="w-4 h-4" /> ขอเลื่อนนัด
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {showRescheduleForm === (app.id || app._id) && (
                                                                <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                                    <div className="mb-3">
                                                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">เหตุผลความจำเป็น *</label>
                                                                        <textarea
                                                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm"
                                                                            value={rescheduleData.reason}
                                                                            onChange={e => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                                                                            placeholder="เช่น ติดสอบ, ป่วยกะทันหัน..."
                                                                            rows={2}
                                                                        />
                                                                    </div>
                                                                    <div className="mb-4">
                                                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">วัน/เวลา ที่สะดวก (ไม่บังคับ)</label>
                                                                        <input
                                                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm"
                                                                            type="text"
                                                                            value={rescheduleData.preferred_date}
                                                                            onChange={e => setRescheduleData({ ...rescheduleData, preferred_date: e.target.value })}
                                                                            placeholder="เช่น วันศุกร์ที่ 15 ก.พ. ช่วงบ่าย"
                                                                        />
                                                                    </div>
                                                                    <div className="flex justify-end gap-2 text-sm font-semibold">
                                                                        <button className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg" onClick={() => setShowRescheduleForm(null)}>ยกเลิก</button>
                                                                        <button className="px-4 py-2 bg-sky-600 text-white hover:bg-sky-700 rounded-lg transition-colors" onClick={() => handleRequestReschedule(app.id || app._id)}>ส่งคำขอ</button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {app.interview.status === 'reschedule_requested' && (
                                                                <div className="mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 font-medium">
                                                                    ⚠️ คำขอเลื่อนนัดถูกส่งแล้ว รอการอนุมัติจากบริษัท ({app.interview.reschedule_reason})
                                                                </div>
                                                            )}
                                                            {app.interview.status === 'confirmed' && (
                                                                <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200 font-medium">
                                                                    ✅ คุณได้ยืนยันการนัดสัมภาษณ์เรียบร้อยแล้ว เตรียมตัวให้พร้อม!
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: AI Score, HR Reason, AI Feedback */}
                                            <div className="space-y-8">
                                                {Object.keys(breakdown).length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                                            AI Matching Score
                                                        </h4>
                                                        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                                                            {breakdown.skills != null && <ScoreBar label="ทักษะ" value={breakdown.skills} />}
                                                            {breakdown.major != null && <ScoreBar label="สาขา" value={breakdown.major} />}
                                                            {breakdown.experience != null && <ScoreBar label="ประสบการณ์" value={breakdown.experience} />}
                                                            {breakdown.projects != null && <ScoreBar label="โปรเจค" value={breakdown.projects} />}
                                                            {breakdown.gpa != null && <ScoreBar label="GPA" value={breakdown.gpa} />}
                                                            {breakdown.certification != null && <ScoreBar label="ใบรับรอง" value={breakdown.certification} />}
                                                        </div>
                                                    </div>
                                                )}

                                                {app.resume_data?.experience_details?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                            <BriefcaseIcon className="w-4 h-4" />
                                                            ประสบการณ์การทำงาน
                                                        </h4>
                                                        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                                                            {app.resume_data.experience_details.map((exp, i) => (
                                                                <div key={i} className={`${i < app.resume_data.experience_details.length - 1 ? 'pb-4 border-b border-slate-100' : ''}`}>
                                                                    <div className="font-semibold text-slate-800">{exp.position}</div>
                                                                    <div className="flex justify-between text-sm text-slate-500 mt-1 mb-1">
                                                                        <span>{exp.company}</span>
                                                                        <span>{exp.duration}</span>
                                                                    </div>
                                                                    {exp.description && <p className="text-sm text-slate-500">{exp.description}</p>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {app.hr_reason && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                            ความเห็นจาก HR
                                                        </h4>
                                                        <div className={`p-4 rounded-xl border text-sm font-medium whitespace-pre-wrap ${app.status === 'accepted' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                                                            {app.hr_reason}
                                                        </div>
                                                    </div>
                                                )}

                                                {app.ai_feedback && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                            คำแนะนำจาก AI
                                                        </h4>
                                                        <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl text-sky-900 text-sm leading-relaxed whitespace-pre-wrap">
                                                            {app.ai_feedback}
                                                        </div>
                                                    </div>
                                                )}

                                                {app.certificate_urls && app.certificate_urls.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                            อัปโหลดสมาชิกใบรอง (Certificates)
                                                        </h4>
                                                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                            <div className="text-xs text-slate-500 mb-3 font-medium">
                                                                อัปโหลดไปแล้ว {app.certificate_urls.length} ไฟล์
                                                            </div>
                                                            <div className="space-y-2">
                                                                {app.certificate_urls.map((certUrl, idx) => {
                                                                    if (!certUrl) return null;
                                                                    const fileName = certUrl.split('/').pop() || `Certificate ${idx + 1}`;
                                                                    const isPdf = fileName.toLowerCase().endsWith('.pdf');
                                                                    return (
                                                                        <a
                                                                            key={idx}
                                                                            href={`${process.env.REACT_APP_API_URL || 'http://172.18.148.97:8000'}${certUrl}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 hover:border-sky-300 transition-all group"
                                                                        >
                                                                            <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isPdf ? 'bg-rose-100' : 'bg-sky-100'}`}>
                                                                                <svg className={`w-5 h-5 ${isPdf ? 'text-rose-600' : 'text-sky-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                                    <polyline points="14 2 14 8 20 8" />
                                                                                </svg>
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="text-sm font-semibold text-slate-800 truncate group-hover:text-sky-600 transition-colors">
                                                                                    {decodeURIComponent(fileName)}
                                                                                </div>
                                                                                <div className="text-xs text-slate-500 mt-0.5">
                                                                                    {isPdf ? 'PDF Document' : 'Image File'}
                                                                                </div>
                                                                            </div>
                                                                            <svg className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                                <polyline points="15 3 21 3 21 9" />
                                                                                <line x1="10" y1="14" x2="21" y2="3" />
                                                                            </svg>
                                                                        </a>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold pt-2 border-t border-slate-100">
                                                    <span>สมัครเมื่อ: {formatDate(app.submitted_at)}</span>
                                                    {app.application_code && (
                                                        <span className="font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded select-all">#{app.application_code}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-dashed border-slate-200 p-12 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
                                <BriefcaseIcon className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{filter === 'all' ? 'ยังไม่มีการสมัครงาน' : 'ไม่มีรายการในหมวดนี้'}</h3>
                            <p className="text-slate-500 mb-6">
                                {filter === 'all' ? 'เริ่มสมัครงานได้จากหน้า Dashboard เพื่อเริ่มต้นเส้นทางอาชีพของคุณ' : 'ลองเลือกดูหมวดอื่น'}
                            </p>
                            {filter === 'all' && (
                                <button
                                    className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-500 transition-colors"
                                    onClick={() => navigate('/student/dashboard')}
                                >
                                    ไปค้นหางาน
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyApplications;
