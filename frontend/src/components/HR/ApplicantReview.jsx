// frontend/src/components/HR/ApplicantReview.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config';
import jobService from '../../services/jobService';

const renderIcon = (name, className = "w-5 h-5") => {
    switch (name) {
        case 'Users': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
        case 'Hourglass': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>;
        case 'CheckCircle': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>;
        case 'XCircle': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>;
        case 'Code': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
        case 'GraduationCap': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.42 10.922a2 2 0 0 1-.01 1.838L12.83 21H11.2l-8.6-8.24a2 2 0 0 1-.01-1.838l8.6-8.24a2 2 0 0 1 2.02 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>;
        case 'Briefcase': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
        case 'Folder': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></svg>;
        case 'Scroll': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" /><path d="M19 17V5a2 2 0 0 0-2-2H4" /></svg>;
        case 'BarChart': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>;
        case 'AlertCircle': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
        default: return null;
    }
};

/* ---------- Helpers ---------- */
const normalizeScore = (val) => {
    if (val === null || val === undefined) return 0;
    const num = Number(val);
    return num <= 1 ? Math.round(num * 100) : Math.round(num);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ScoreRing = ({ score }) => {
    const pct = normalizeScore(score);
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    const colorClass = pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-500';
    const strokeColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
    const [dash, setDash] = useState(circumference);
    useEffect(() => { setTimeout(() => setDash(offset), 100); }, [offset]);

    return (
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90 drop-shadow-sm">
                <circle cx="36" cy="36" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle
                    cx="36" cy="36" r={radius} fill="none"
                    stroke={strokeColor} strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={dash}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <span className={`absolute text-sm font-bold ${colorClass} animate-fadeIn`}>{pct}%</span>
        </div>
    );
};

/* ---------- Breakdown Bar ---------- */
const BreakdownBar = ({ label, iconInfo, score }) => {
    const pct = normalizeScore(score);
    const colorClass = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
    const textClass = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600';
    const [w, setW] = useState(0);
    useEffect(() => { setTimeout(() => setW(pct), 100); }, [pct]);
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="w-5 shrink-0 flex justify-center text-slate-500">{renderIcon(iconInfo, 'w-4 h-4')}</span>
            <span className="w-20 shrink-0 text-slate-600 font-medium">{label}</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`} style={{ width: `${w}%` }} />
            </div>
            <span className={`w-10 text-right font-bold ${textClass}`}>{pct}%</span>
        </div>
    );
};

/* ---------- Interactive Form Input ---------- */
const FormField = ({ label, required, children }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {children}
    </div>
);

const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow bg-white";

/* ========== Main Component ========== */
const ApplicantReview = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated } = useAuth();

    const adminCompanyId = searchParams.get('company_id');
    const isAdminView = user?.user_type === 'Admin' && !!adminCompanyId;
    const jobsPath = isAdminView ? `/hr/jobs?company_id=${adminCompanyId}` : '/hr/jobs';

    const [jobInfo, setJobInfo] = useState({});
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [processing, setProcessing] = useState(null);
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState(null);
    const [reason, setReason] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [scheduleModal, setScheduleModal] = useState(null);
    const [rescheduleModal, setRescheduleModal] = useState(null);
    const [interviewData, setInterviewData] = useState({
        interview_date: '', interview_time: '', interview_location: '',
        interview_method: 'onsite', interview_link: '', interview_note: ''
    });

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
        } catch {
            showToast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        if (!isAuthenticated()) { navigate('/login'); return; }
        if (user && user.user_type !== 'HR' && user.user_type !== 'Admin') { navigate('/'); return; }
        loadApplicants();
    }, [isAuthenticated, user, navigate, loadApplicants]);

    const openModal = (applicant, action) => { setModal({ applicant, action }); setReason(''); };

    const handleDecision = async () => {
        if (!modal) return;
        const { applicant, action } = modal;
        const appId = applicant.id || applicant._id;
        setProcessing(appId); setModal(null);
        const result = await jobService.updateApplicationStatus(appId, action, reason);
        if (result.success) {
            showToast(action === 'accepted' ? 'รับผู้สมัครเรียบร้อย ✓' : 'ปฏิเสธผู้สมัครแล้ว', 'success');
            loadApplicants();
        } else {
            showToast(result.error || 'เกิดข้อผิดพลาด', 'error');
        }
        setProcessing(null); setReason('');
    };

    const handleScheduleInterview = async (e) => {
        e.preventDefault();
        if (!scheduleModal) return;
        const appId = scheduleModal.id || scheduleModal._id;
        setProcessing(`schedule-${appId}`);
        const result = await jobService.scheduleInterview(appId, interviewData);
        if (result.success) {
            showToast('นัดสัมภาษณ์เรียบร้อย', 'success');
            setScheduleModal(null); loadApplicants();
        } else {
            showToast(result.error, 'error');
        }
        setProcessing(null);
    };

    const handleApproveReschedule = async (action) => {
        if (!rescheduleModal) return;
        const appId = rescheduleModal.id || rescheduleModal._id;
        setProcessing(`reschedule-${appId}`);
        const data = { action };
        if (action === 'approve') {
            if (!interviewData.interview_date || !interviewData.interview_time) {
                showToast('กรุณาระบุวันที่และเวลาใหม่', 'error'); setProcessing(null); return;
            }
            Object.assign(data, {
                interview_date: interviewData.interview_date, interview_time: interviewData.interview_time,
                interview_location: interviewData.interview_location, interview_method: interviewData.interview_method,
                interview_link: interviewData.interview_link,
            });
        }
        const result = await jobService.approveReschedule(appId, data);
        if (result.success) {
            showToast(action === 'approve' ? 'อนุมัติเลื่อนนัดสัมภาษณ์แล้ว' : 'ไม่อนุมัติการเลื่อนนัด', 'success');
            setRescheduleModal(null); loadApplicants();
        } else {
            showToast(result.error, 'error');
        }
        setProcessing(null);
    };

    const extractEducation = (r) => {
        if (!r?.education) return null;
        if (Array.isArray(r.education) && r.education.length > 0) return r.education[0];
        if (typeof r.education === 'object') return r.education;
        return null;
    };
    const extractProjects = (r) => (Array.isArray(r?.projects) ? r.projects : []);
    const extractExperience = (r) => (Array.isArray(r?.experience_details) ? r.experience_details : []);
    const extractCertifications = (resumeData, app) => {
        // Priority 1: LLM-analyzed names from uploaded cert files
        const certAnalyses = app?.cert_llm_analyses || [];
        if (certAnalyses.length > 0) {
            return certAnalyses
                .filter(a => a?.cert_name)
                .map(a => ({ name: a.cert_name, domain: a.domain || '' }));
        }
        // Priority 2: cert names from resume text extraction
        const fromResume = resumeData?.certifications || resumeData?.certificates;
        if (Array.isArray(fromResume) && fromResume.length > 0) return fromResume;
        // Priority 3: fallback — just show file count
        const certUrls = app?.certificate_urls || [];
        if (certUrls.length > 0) return [`ไฟล์แนบ ${certUrls.length} ใบ (รอ HR ตรวจสอบ)`];
        return [];
    };
    const getStrengths = (bd) => {
        if (!bd) return [];
        const labels = { skills: 'ทักษะตรงกับตำแหน่ง', major: 'สาขาตรงกับตำแหน่ง', experience: 'มีประสบการณ์เพียงพอ', projects: 'มีโปรเจคที่เกี่ยวข้อง', certification: 'มี Certification', gpa: 'ผลการเรียนดี' };
        return Object.entries(bd).filter(([, v]) => normalizeScore(v) >= 75).map(([k]) => labels[k] || k);
    };
    const getWeaknesses = (bd, r, app) => {
        if (!bd) return [];
        const hasCertUploaded = (app?.cert_llm_analyses?.length > 0) || (app?.certificate_urls?.length > 0);
        const labels = {
            skills: 'ทักษะยังไม่ครบ', major: 'สาขาไม่ตรง', experience: 'ประสบการณ์ยังน้อย',
            projects: 'โปรเจคยังน้อย',
            certification: hasCertUploaded ? 'Certification ไม่ตรงกับตำแหน่ง' : 'ไม่มี Certification',
            gpa: 'GPA ค่อนข้างต่ำ'
        };
        return Object.entries(bd).filter(([, v]) => normalizeScore(v) < 60).map(([k, v]) => {
            let label = labels[k] || k;
            if (k === 'gpa' && r?.education) {
                const edu = Array.isArray(r.education) ? r.education[0] : r.education;
                if (edu?.gpa) label = `GPA ค่อนข้างต่ำ (${edu.gpa})`;
            }
            return label;
        });
    };


    const filteredApplicants = filter === 'all' ? applicants : applicants.filter(a => (a.status || 'pending') === filter);
    const counts = {
        all: applicants.length,
        pending: applicants.filter(a => !a.status || a.status === 'pending').length,
        accepted: applicants.filter(a => a.status === 'accepted').length,
        rejected: applicants.filter(a => a.status === 'rejected').length,
    };

    const statusBadge = (status) => {
        if (status === 'accepted') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (status === 'rejected') return 'bg-rose-100 text-rose-700 border-rose-200';
        return 'bg-slate-100 text-slate-600 border-slate-200';
    };
    const statusLabel = (status) => {
        if (status === 'accepted') return 'รับแล้ว';
        if (status === 'rejected') return 'ปฏิเสธ';
        return 'รอพิจารณา';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-sky-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-slate-600 font-medium">กำลังโหลดข้อมูลผู้สมัคร...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

                {/* Header */}
                <div className="sticky top-4 z-40 flex flex-col sm:flex-row sm:items-center gap-4 mb-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 transition-all drop-shadow-sm">
                    <button className="p-2 -ml-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0" onClick={() => navigate(jobsPath)} aria-label="กลับ">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                        </svg>
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-slate-900 truncate">{jobInfo.title || 'ตำแหน่งงาน'}</h1>
                        <p className="text-sm text-slate-500 mt-0.5">{jobInfo.company_name}{jobInfo.department ? ` · ${jobInfo.department}` : ''}</p>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[
                        { key: 'all', icon: 'Users', label: 'ผู้สมัครทั้งหมด', count: counts.all, cls: 'text-slate-700' },
                        { key: 'pending', icon: 'Hourglass', label: 'รอพิจารณา', count: counts.pending, cls: 'text-amber-700' },
                        { key: 'accepted', icon: 'CheckCircle', label: 'รับแล้ว', count: counts.accepted, cls: 'text-emerald-700' },
                        { key: 'rejected', icon: 'XCircle', label: 'ปฏิเสธ', count: counts.rejected, cls: 'text-rose-700' },
                    ].map(s => (
                        <div key={s.key} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-3">
                            <span className={`text-slate-400 opacity-80`}>{renderIcon(s.icon, 'w-7 h-7')}</span>
                            <div>
                                <div className={`text-xl font-bold ${s.cls}`}>{s.count}</div>
                                <div className="text-xs text-slate-500 font-medium">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {[
                        { key: 'all', label: 'ทั้งหมด' }, { key: 'pending', label: 'รอพิจารณา' },
                        { key: 'accepted', label: 'รับแล้ว' }, { key: 'rejected', label: 'ปฏิเสธ' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors shrink-0 ${filter === tab.key ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                            onClick={() => setFilter(tab.key)}
                        >
                            {tab.label}
                            <span className={`ml-2 text-xs font-bold ${filter === tab.key ? 'text-white/80' : 'text-slate-400'}`}>{counts[tab.key]}</span>
                        </button>
                    ))}
                </div>

                {/* Applicant List */}
                {filteredApplicants.length > 0 ? (
                    <div className="space-y-4">
                        {filteredApplicants.map((app, index) => {
                            const isPending = !app.status || app.status === 'pending';
                            const isExpanded = expandedId === (app.id || index);
                            const skills = app.resume_data?.skills?.technical_skills || app.resume_data?.skills || [];
                            const displaySkills = Array.isArray(skills) ? skills.slice(0, 6) : [];
                            const remainingSkills = Array.isArray(skills) ? Math.max(0, skills.length - 6) : 0;
                            const breakdown = app.matching_breakdown || {};
                            const education = extractEducation(app.resume_data);
                            const experienceDetails = extractExperience(app.resume_data);
                            const projects = extractProjects(app.resume_data);
                            const certifications = extractCertifications(app.resume_data, app);
                            const expMonths = app.resume_data?.experience_months || app.resume_data?.total_experience_months || 0;
                            const strengths = getStrengths(breakdown);
                            const weaknesses = getWeaknesses(breakdown, app.resume_data, app);

                            return (
                                <div key={app.id || index} className={`bg-white rounded-xl shadow-sm border transition-all overflow-hidden ${isExpanded ? 'border-sky-300' : 'border-slate-200'}`}>
                                    {/* Compact Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                                        <ScoreRing score={app.ai_score} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-900">{app.student_name || 'ผู้สมัคร'}</span>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge(app.status)}`}>
                                                    {isPending && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
                                                    {statusLabel(app.status)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-500">{app.student_email || ''}</div>
                                            <div className="flex flex-wrap gap-3 text-xs text-slate-400 font-medium mt-1">
                                                <span>สมัครเมื่อ {formatDate(app.submitted_at)}</span>
                                                {app.application_code && <span className="font-mono text-slate-500">#{app.application_code}</span>}
                                            </div>
                                            {displaySkills.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {displaySkills.map((skill, i) => (
                                                        <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-medium">
                                                            {typeof skill === 'string' ? skill : skill.name || skill}
                                                        </span>
                                                    ))}
                                                    {remainingSkills > 0 && <span className="bg-sky-50 text-sky-600 px-2 py-0.5 rounded-md text-xs font-medium">+{remainingSkills}</span>}
                                                </div>
                                            )}
                                            <button
                                                className="mt-2 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                                                onClick={() => setExpandedId(isExpanded ? null : (app.id || index))}
                                            >
                                                {isExpanded ? '▲ ซ่อนรายละเอียด' : '▼ ดูรายละเอียดเพิ่มเติม'}
                                            </button>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                                            {isPending ? (
                                                <>
                                                    <button
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                                                        onClick={() => openModal(app, 'accepted')}
                                                        disabled={processing === (app.id || app._id)}
                                                    >
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                        รับ
                                                    </button>
                                                    <button
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                                                        onClick={() => openModal(app, 'rejected')}
                                                        disabled={processing === (app.id || app._id)}
                                                    >
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                        ปฏิเสธ
                                                    </button>
                                                </>
                                            ) : app.status === 'accepted' ? (
                                                <div>
                                                    {app.interview ? (
                                                        <div className="text-xs font-semibold text-center p-2 rounded-lg border">
                                                            {app.interview.status === 'scheduled' && <span className="text-indigo-600 bg-indigo-50 border-indigo-200 rounded-md px-2 py-1">นัดสัมภาษณ์แล้ว (รอตอบ)</span>}
                                                            {app.interview.status === 'confirmed' && <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border-emerald-200 rounded-md px-2 py-1">{renderIcon('CheckCircle', 'w-3 h-3')} ยืนยันแล้ว</span>}
                                                            {app.interview.status === 'rescheduled' && <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border-amber-200 rounded-md px-2 py-1">{renderIcon('AlertCircle', 'w-3 h-3')} เลื่อนนัด</span>}
                                                            {app.interview.status === 'reschedule_requested' && (
                                                                <button className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 hover:bg-amber-100 cursor-pointer" onClick={() => {
                                                                    setRescheduleModal(app);
                                                                    setInterviewData({ ...interviewData, interview_date: app.interview?.preferred_date || '', interview_time: '', interview_location: app.interview?.location || '', interview_method: app.interview?.method || 'onsite', interview_link: app.interview?.link || '' });
                                                                }}>
                                                                    {renderIcon('AlertCircle', 'w-3 h-3')} ขอเลื่อนนัด (จัดการ)
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                                                            onClick={() => { setScheduleModal(app); setInterviewData({ interview_date: '', interview_time: '', interview_location: '', interview_method: 'onsite', interview_link: '', interview_note: '' }); }}
                                                            disabled={processing === (app.id || app._id)}
                                                        >
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                                            นัดสัมภาษณ์
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-lg text-center">
                                                    ปฏิเสธแล้ว
                                                    {app.decided_at && <span className="block text-xs text-rose-400">{formatDate(app.decided_at)}</span>}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Detail */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/40 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Left Col */}
                                            <div className="space-y-6">
                                                {/* AI Breakdown */}
                                                {Object.keys(breakdown).length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI Score Breakdown</h4>
                                                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                                                            <BreakdownBar label="Skills" iconInfo="Code" score={breakdown.skills} />
                                                            <BreakdownBar label="Major" iconInfo="GraduationCap" score={breakdown.major} />
                                                            <BreakdownBar label="Experience" iconInfo="Briefcase" score={breakdown.experience} />
                                                            <BreakdownBar label="Projects" iconInfo="Folder" score={breakdown.projects} />
                                                            <BreakdownBar label="Cert" iconInfo="Scroll" score={breakdown.certification} />
                                                            <BreakdownBar label="GPA" iconInfo="BarChart" score={breakdown.gpa} />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Education */}
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">การศึกษา</h4>
                                                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm">
                                                        {education ? (
                                                            <div className="space-y-2">
                                                                {(education.institution || education.university) && (
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-slate-500 shrink-0">มหาวิทยาลัย</span>
                                                                        <span className="font-semibold text-slate-800 text-right">{education.institution || education.university}</span>
                                                                    </div>
                                                                )}
                                                                {(education.major || education.field || education.degree) && (
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-slate-500 shrink-0">สาขา</span>
                                                                        <span className="font-semibold text-slate-800 text-right">{education.major || education.field || education.degree}</span>
                                                                    </div>
                                                                )}
                                                                {education.gpa && (
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-slate-500 shrink-0">GPA</span>
                                                                        <span className={`font-bold text-right ${Number(education.gpa) >= 3.0 ? 'text-emerald-600' : Number(education.gpa) >= 2.5 ? 'text-amber-600' : 'text-rose-600'}`}>{education.gpa}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : <p className="text-slate-400 italic">ไม่มีข้อมูลการศึกษา</p>}
                                                    </div>
                                                </div>

                                                {/* Strengths & Weaknesses */}
                                                {(strengths.length > 0 || weaknesses.length > 0) && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {strengths.length > 0 && (
                                                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                                                <h5 className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase mb-2">{renderIcon('CheckCircle', 'w-4 h-4')} จุดแข็ง</h5>
                                                                <ul className="space-y-1">
                                                                    {strengths.map((s, i) => <li key={i} className="text-sm text-emerald-800 flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-emerald-500 shrink-0" />{s}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {weaknesses.length > 0 && (
                                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                                                <h5 className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase mb-2">{renderIcon('AlertCircle', 'w-4 h-4')} ควรพิจารณา</h5>
                                                                <ul className="space-y-1">
                                                                    {weaknesses.map((w, i) => <li key={i} className="text-sm text-amber-800 flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />{w}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Col */}
                                            <div className="space-y-6">
                                                {/* Experience + Projects */}
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ประสบการณ์ / โปรเจค</h4>
                                                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm">
                                                        {expMonths > 0 && <p className="font-semibold text-slate-700 mb-3">ประสบการณ์ {expMonths} เดือน</p>}
                                                        {experienceDetails.length > 0 && (
                                                            <div className="space-y-3 mb-3">
                                                                {experienceDetails.map((exp, i) => (
                                                                    <div key={i} className={`${i < experienceDetails.length - 1 ? 'pb-3 border-b border-slate-100' : ''}`}>
                                                                        <div className="font-semibold text-slate-900">{exp.position}</div>
                                                                        <div className="flex justify-between text-xs text-slate-500 mt-0.5 mb-1"><span>{exp.company}</span><span>{exp.duration}</span></div>
                                                                        {exp.description && <p className="text-xs text-slate-500">{exp.description}</p>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {projects.length > 0 ? (
                                                            <ul className="space-y-2">
                                                                {projects.slice(0, 5).map((p, i) => (
                                                                    <li key={i} className="flex items-start gap-1.5">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
                                                                        <div>
                                                                            <strong className="text-slate-800">{typeof p === 'string' ? p : p.name || p.title || ''}</strong>
                                                                            {p.description && <p className="text-xs text-slate-500 mt-0.5">{p.description.length > 80 ? p.description.slice(0, 80) + '...' : p.description}</p>}
                                                                            {p.technologies?.length > 0 && <p className="text-xs text-indigo-600 mt-0.5">{p.technologies.join(', ')}</p>}
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                                {projects.length > 5 && <li className="text-xs text-slate-400">+{projects.length - 5} อื่นๆ</li>}
                                                            </ul>
                                                        ) : experienceDetails.length === 0 && (
                                                            <p className="text-slate-400 italic">ไม่มีข้อมูลประสบการณ์หรือโปรเจค</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Certifications */}
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Certifications</h4>
                                                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm">
                                                        {certifications.length > 0 ? (
                                                            <ul className="space-y-1">
                                                                {certifications.map((c, i) => (
                                                                    <li key={i} className="flex items-center gap-2 text-slate-700">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                                                                        {typeof c === 'string' ? c : c.name || c.title || JSON.stringify(c)}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : <p className="text-slate-400 italic">(ไม่มี)</p>}
                                                    </div>
                                                </div>

                                                {/* Certificate Files */}
                                                {app.certificate_urls?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ไฟล์ Certificate แนบ ({app.certificate_urls.length} ไฟล์)</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {app.certificate_urls.map((url, i) => {
                                                                const filename = url.split('/').pop() || `Certificate-${i + 1}`;
                                                                return (
                                                                    <a key={i} href={`${API_BASE_URL}${url}?token=${sessionStorage.getItem('auth_token') || ''}`} target="_blank" rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-indigo-100 transition-colors">
                                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                                        {filename.length > 18 ? filename.substring(0, 13) + '...' + filename.split('.').pop() : filename}
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Interview Details */}
                                                {app.interview && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            {renderIcon('Calendar', 'w-4 h-4')} รายละเอียดนัดสัมภาษณ์
                                                        </h4>
                                                        <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm relative overflow-hidden">
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
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
                                                                            <a href={app.interview.link} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline inline-flex items-center gap-1">คลิกเพื่อเข้าร่วม {renderIcon('ExternalLink', 'w-3 h-3')}</a>
                                                                        ) : (app.interview.location || '-')}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {app.interview.note && (
                                                                <div className="mt-4 text-sm text-indigo-800 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                                                    <strong>หมายเหตุ: </strong>{app.interview.note}
                                                                </div>
                                                            )}

                                                            {app.interview.status === 'reschedule_requested' && (
                                                                <div className="mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                                                                    {renderIcon('AlertCircle', 'w-4 h-4 mt-0.5 shrink-0')}
                                                                    <div>
                                                                        <strong>ผู้สมัครขอเลื่อนนัด!</strong><br />
                                                                        เหตุผล: {app.interview.reschedule_reason}<br />
                                                                        {app.interview.preferred_date && <span>สะดวก: {app.interview.preferred_date}</span>}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {app.interview.status === 'confirmed' && (
                                                                <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                                                                    {renderIcon('CheckCircle', 'w-4 h-4 inline-block mr-1')} <strong>ผู้สมัครยืนยันนัดสัมภาษณ์แล้ว</strong>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* AI Feedback */}
                                                {app.ai_feedback && (
                                                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-sm text-sky-900 leading-relaxed">
                                                        <strong>AI Recommendation: </strong>{app.ai_feedback}
                                                    </div>
                                                )}

                                                {/* HR Reason */}
                                                {app.hr_reason && (
                                                    <div className={`p-4 rounded-xl border text-sm leading-relaxed ${app.status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                                                        <strong>เหตุผล HR: </strong>{app.hr_reason}
                                                    </div>
                                                )}

                                                {/* Resume PDF */}
                                                {app.resume_file_url && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <a href={`${API_BASE_URL}${app.resume_file_url}?token=${sessionStorage.getItem('auth_token') || ''}`} target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-200 transition-colors">
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                            ดู Resume PDF
                                                        </a>
                                                        {app.portfolio_url && (
                                                            <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-200 transition-colors">
                                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                                                ดู Portfolio
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-dashed border-slate-200 p-16 text-center">
                        <svg className="h-12 w-12 text-slate-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            {filter === 'all' ? 'ยังไม่มีผู้สมัครตำแหน่งนี้' : `ไม่มีผู้สมัครที่${filter === 'pending' ? 'รอพิจารณา' : filter === 'accepted' ? 'รับแล้ว' : 'ปฏิเสธ'}`}
                        </h3>
                        <p className="text-slate-500">ผู้สมัครจะปรากฏที่นี่หลังจากนักศึกษาส่งใบสมัคร</p>
                    </div>
                )}
            </div>

            {/* Decision Modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setModal(null)}>
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className={`flex h-14 w-14 items-center justify-center rounded-full mx-auto mb-4 ${modal.action === 'accepted' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                            {modal.action === 'accepted' ? (
                                <svg className="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                                <svg className="w-7 h-7 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 text-center mb-1">
                            {modal.action === 'accepted' ? 'ยืนยันรับผู้สมัคร?' : 'ยืนยันปฏิเสธผู้สมัคร?'}
                        </h3>
                        <p className="text-sm text-slate-500 text-center mb-4">{modal.applicant.student_name || 'ผู้สมัคร'} · AI Score {normalizeScore(modal.applicant.ai_score)}%</p>
                        {modal.action === 'rejected' && (
                            <p className="text-xs text-rose-600 text-center font-medium bg-rose-50 rounded-lg p-2 mb-4">การปฏิเสธไม่สามารถเปลี่ยนกลับได้</p>
                        )}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">เหตุผล (ไม่บังคับ — ช่วยให้ AI เรียนรู้ได้ดีขึ้น)</label>
                            <textarea
                                className={inputCls}
                                placeholder={modal.action === 'accepted' ? 'เช่น ทักษะตรง, Portfolio ดี...' : 'เช่น ขาด experience, ทักษะไม่ตรง...'}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors" onClick={() => setModal(null)}>ยกเลิก</button>
                            <button
                                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${modal.action === 'accepted' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                                onClick={handleDecision}
                                disabled={!!processing}
                            >
                                {processing ? 'กำลังดำเนินการ...' : modal.action === 'accepted' ? 'ยืนยันรับ' : 'ยืนยันปฏิเสธ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Interview Modal */}
            {scheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setScheduleModal(null)}>
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shrink-0">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">นัดสัมภาษณ์</h3>
                                <p className="text-sm text-slate-500">{scheduleModal.student_name}</p>
                            </div>
                        </div>
                        <form onSubmit={handleScheduleInterview} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="วันที่" required>
                                    <input type="date" required className={inputCls} value={interviewData.interview_date} onChange={e => setInterviewData({ ...interviewData, interview_date: e.target.value })} />
                                </FormField>
                                <FormField label="เวลา" required>
                                    <input type="time" required className={inputCls} value={interviewData.interview_time} onChange={e => setInterviewData({ ...interviewData, interview_time: e.target.value })} />
                                </FormField>
                            </div>
                            <FormField label="รูปแบบ">
                                <select className={inputCls} value={interviewData.interview_method} onChange={e => setInterviewData({ ...interviewData, interview_method: e.target.value })}>
                                    <option value="onsite">On-site (ที่บริษัท)</option>
                                    <option value="online">Online</option>
                                    <option value="phone">Phone</option>
                                </select>
                            </FormField>
                            {interviewData.interview_method === 'onsite' && (
                                <FormField label="สถานที่">
                                    <input type="text" placeholder="ระบุห้องหรือชั้น..." className={inputCls} value={interviewData.interview_location} onChange={e => setInterviewData({ ...interviewData, interview_location: e.target.value })} />
                                </FormField>
                            )}
                            {interviewData.interview_method === 'online' && (
                                <FormField label="ลิงก์ประชุม">
                                    <input type="url" placeholder="https://..." className={inputCls} value={interviewData.interview_link} onChange={e => setInterviewData({ ...interviewData, interview_link: e.target.value })} />
                                </FormField>
                            )}
                            <FormField label="หมายเหตุ / สิ่งที่ต้องเตรียม">
                                <textarea rows={2} placeholder="เช่น เตรียม Resume ตัวจริง..." className={inputCls} value={interviewData.interview_note} onChange={e => setInterviewData({ ...interviewData, interview_note: e.target.value })} />
                            </FormField>
                            <div className="flex gap-3 pt-2">
                                <button type="button" className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => setScheduleModal(null)}>ยกเลิก</button>
                                <button type="submit" className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60" disabled={!!processing}>
                                    {processing ? 'กำลังบันทึก...' : 'ยืนยันการนัดหมาย'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reschedule Approval Modal */}
            {rescheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setRescheduleModal(null)}>
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shrink-0">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">จัดการคำขอเลื่อนนัด</h3>
                                <p className="text-sm text-slate-500">{rescheduleModal.student_name}</p>
                            </div>
                        </div>
                        <div className="space-y-3 mb-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
                                <strong className="text-slate-700">เหตุผลที่ขอเลื่อน:</strong>
                                <p className="text-slate-600 mt-1">{rescheduleModal.interview?.reschedule_reason}</p>
                            </div>
                            {rescheduleModal.interview?.preferred_date && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
                                    <strong className="text-slate-700">วัน/เวลา ที่สะดวก:</strong>
                                    <p className="text-slate-600 mt-1">{rescheduleModal.interview.preferred_date}</p>
                                </div>
                            )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">กำหนดวันนัดหมายใหม่</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <FormField label="วันที่" required>
                                <input type="date" className={inputCls} value={interviewData.interview_date} onChange={e => setInterviewData({ ...interviewData, interview_date: e.target.value })} />
                            </FormField>
                            <FormField label="เวลา" required>
                                <input type="time" className={inputCls} value={interviewData.interview_time} onChange={e => setInterviewData({ ...interviewData, interview_time: e.target.value })} />
                            </FormField>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => setRescheduleModal(null)}>ปิด</button>
                            <button className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60" onClick={() => handleApproveReschedule('deny')} disabled={!!processing}>ไม่อนุมัติ</button>
                            <button className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60" onClick={() => handleApproveReschedule('approve')} disabled={!!processing}>
                                {processing ? 'กำลังบันทึก...' : 'อนุมัติวันใหม่'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl shadow-lg border px-5 py-3.5 text-sm font-semibold transition-all animate-fadeInUp ${toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-rose-600 text-white border-rose-700'}`}>
                    {toast.type === 'success' ? renderIcon('CheckCircle', 'w-5 h-5') : renderIcon('XCircle', 'w-5 h-5')} {toast.message}
                </div>
            )}
        </div>
    );
};

export default ApplicantReview;
