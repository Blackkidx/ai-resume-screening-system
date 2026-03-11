import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import jobService from '../../services/jobService';

/* ── Modern 2026 Lucide SVGs ── */
const Icons = {
    FileText: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
        </svg>
    ),
    Search: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
    ),
    CheckCircle: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
        </svg>
    ),
    AlertCircle: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    XCircle: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
        </svg>
    ),
    ArrowRight: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
    ),
    Send: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
        </svg>
    ),
    Briefcase: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    TrendingUp: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
        </svg>
    ),
    Sparkles: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
        </svg>
    ),
};

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

    const ringColors = {
        green: '#10b981',
        yellow: '#f59e0b',
        red: '#f43f5e',
    };

    const glowColors = {
        green: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))',
        yellow: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.4))',
        red: 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.4))',
    };

    const textColors = {
        green: 'text-emerald-700',
        yellow: 'text-amber-700',
        red: 'text-rose-700',
    };

    return (
        <div className="relative flex items-center justify-center w-16 h-16">
            <svg viewBox="0 0 56 56" className="w-full h-full transform -rotate-90" style={{ filter: glowColors[zone] }}>
                <circle
                    className="fill-none"
                    stroke="#f1f5f9"
                    strokeWidth="4"
                    cx="28" cy="28" r={radius}
                />
                <circle
                    className="fill-none animate-drawRing"
                    stroke={ringColors[zone] || '#94a3b8'}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    cx="28" cy="28" r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        '--circumference': circumference,
                        '--offset': offset,
                    }}
                />
            </svg>
            <span className={`absolute text-sm font-bold ${textColors[zone] || 'text-slate-700'}`}>
                {normalizedScore}%
            </span>
        </div>
    );
};

const JobCard = ({ job, zone, onApply, applying, index = 0 }) => {
    const breakdown = job.matching_breakdown || {};

    const zoneStyles = {
        green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        yellow: 'bg-amber-50 text-amber-700 ring-amber-600/20',
        red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    };

    const zoneBorderHover = {
        green: 'hover:border-emerald-200',
        yellow: 'hover:border-amber-200',
        red: 'hover:border-rose-200',
    };

    const zoneLabels = {
        green: 'เหมาะสมมาก',
        yellow: 'พิจารณาเพิ่มเติม',
        red: 'ยังไม่เหมาะสม',
    };

    return (
        <div
            className={`animate-fadeInUp bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col
                hover:shadow-lg hover:scale-[1.015] ${zoneBorderHover[zone]}
                transition-all duration-300 ease-out cursor-pointer group`}
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 mr-4">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-sky-700 transition-colors">
                        {job.title || 'ตำแหน่งงาน'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <Icons.Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-500 line-clamp-1">{job.company_name || 'บริษัท'}</span>
                    </div>
                </div>
                <ScoreRing score={job.ai_match_score || 0} zone={zone} />
            </div>

            <div className="mb-4">
                <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${zoneStyles[zone]}`}>
                    <svg className="h-1.5 w-1.5 fill-current" viewBox="0 0 6 6" aria-hidden="true">
                        <circle cx="3" cy="3" r="3" />
                    </svg>
                    {zoneLabels[zone]}
                </span>
            </div>

            {Object.keys(breakdown).length > 0 && (
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-100 mb-2">
                    {breakdown.skills !== undefined && (
                        <div className="text-center">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Skills</div>
                            <div className="text-sm font-bold text-slate-700">{normalizeScore(breakdown.skills)}%</div>
                        </div>
                    )}
                    {(breakdown.major !== undefined || breakdown.education !== undefined) && (
                        <div className="text-center">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Education</div>
                            <div className="text-sm font-bold text-slate-700">{normalizeScore(breakdown.major ?? breakdown.education)}%</div>
                        </div>
                    )}
                    {breakdown.experience !== undefined && (
                        <div className="text-center">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Experience</div>
                            <div className="text-sm font-bold text-slate-700">{normalizeScore(breakdown.experience)}%</div>
                        </div>
                    )}
                </div>
            )}

            {job.recommendation_reason && (
                <p className="text-sm text-slate-600 leading-relaxed mb-6 mt-2 line-clamp-3">
                    {job.recommendation_reason}
                </p>
            )}

            <div className="mt-auto flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                {job.already_applied ? (
                    <button className="flex-1 bg-slate-100 text-slate-400 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2" disabled>
                        <Icons.CheckCircle className="w-4 h-4" />
                        สมัครแล้ว
                    </button>
                ) : (
                    <button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
                        onClick={() => onApply(job)}
                        disabled={applying}
                    >
                        {applying ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                กำลังสมัคร...
                            </>
                        ) : (
                            <>
                                <Icons.Send className="w-4 h-4" />
                                สมัครงาน
                            </>
                        )}
                    </button>
                )}
                <button
                    className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:border-slate-400 active:scale-[0.98]"
                    onClick={() => window.open(`/jobs/${job.id || job._id}`, '_blank')}
                >
                    ดูรายละเอียด
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
    const [redJobsCount, setRedJobsCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noResume, setNoResume] = useState(false);
    const [applying, setApplying] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);

            const [recResult, appResult, notReadyResult] = await Promise.all([
                jobService.getRecommendedJobs(),
                jobService.getMyApplications(),
                jobService.getNotReadyJobs()
            ]);

            if (recResult.success) {
                setGreenJobs(recResult.data.green || []);
                setYellowJobs(recResult.data.yellow || []);
                setNoResume(false);
            } else {
                if (recResult.noResume || recResult.error?.includes('resume') || recResult.error?.includes('Resume')) {
                    setNoResume(true);
                }
            }

            if (appResult.success) {
                setApplicationsCount(Array.isArray(appResult.data) ? appResult.data.length : 0);
            }

            if (notReadyResult.success) {
                setRedJobsCount((notReadyResult.data.jobs || []).length);
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
            showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        loadDashboard();
    }, [isAuthenticated, navigate, loadDashboard]);

    const handleApply = (job) => {
        const jobId = job.id || job._id;
        navigate(`/jobs/${jobId}?apply=true`);
    };

    const displayName = user?.full_name || user?.username || 'นักศึกษา';

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <div className="text-center animate-fadeInUp">
                    <div className="relative mx-auto mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto animate-pulse">
                            <Icons.Sparkles className="w-8 h-8 text-sky-600" />
                        </div>
                    </div>
                    <p className="text-slate-600 font-semibold text-lg">กำลังวิเคราะห์งานที่เหมาะกับคุณ</p>
                    <p className="text-slate-400 text-sm mt-1">AI กำลังจับคู่ทักษะของคุณกับตำแหน่งงาน...</p>
                    <div className="flex justify-center gap-1.5 mt-5">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (noResume) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="max-w-3xl mx-auto mt-10 animate-fadeInUp">
                    <div className="bg-white rounded-2xl shadow-soft border border-slate-200 p-12 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 mb-6 animate-float">
                            <Icons.FileText className="w-10 h-10 text-sky-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">อัปโหลด Resume ก่อนเริ่มต้น</h2>
                        <p className="text-slate-600 mb-8 max-w-md mx-auto">
                            ระบบ AI จะวิเคราะห์ Resume ของคุณเพื่อเปรียบเทียบและแนะนำงานที่เหมาะสมที่สุดกับทักษะของคุณ
                        </p>
                        <button
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700 hover:shadow-sky-700/25 active:scale-[0.98] transition-all"
                            onClick={() => navigate('/student/resume')}
                        >
                            <Icons.FileText className="w-4 h-4" />
                            อัปโหลด Resume
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-40 left-0 w-[400px] h-[400px] bg-indigo-400/5 rounded-full blur-3xl -translate-x-1/3 pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-left">

                {/* Welcome Banner */}
                <div className="animate-fadeInUp bg-white rounded-2xl shadow-soft border border-slate-200 p-6 sm:p-10 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    {/* Decorative gradient */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                    <div className="relative">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-xs font-semibold text-sky-600 mb-4">
                            <Icons.Sparkles className="w-3.5 h-3.5" />
                            AI Analysis Complete
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl mb-2">
                            สวัสดี, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">{displayName}</span>
                        </h1>
                        <p className="text-lg text-slate-500">
                            ระบบ AI ได้วิเคราะห์งานที่เหมาะกับคุณแล้ว
                        </p>
                    </div>
                    <div className="relative flex flex-col sm:flex-row gap-3 md:min-w-fit mt-4 md:mt-0">
                        <button
                            className="bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                            onClick={() => navigate('/student/resume')}
                        >
                            จัดการ Resume
                        </button>
                        <button
                            className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-sky-600/20 hover:shadow-sky-700/25 transition-all active:scale-[0.98]"
                            onClick={() => navigate('/student/applications')}
                        >
                            ใบสมัครของฉัน
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {/* Green/Suitable */}
                    <div className="animate-fadeInUp delay-100 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:shadow-md hover:border-emerald-200 transition-all duration-300 cursor-default group">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-3 group-hover:bg-emerald-100 transition-colors">
                            <Icons.CheckCircle className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-extrabold text-slate-900 mb-1 animate-countUp delay-300">{greenJobs.length}</div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">งานที่เหมาะสม</div>
                    </div>

                    {/* Yellow/Consider */}
                    <div className="animate-fadeInUp delay-200 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:shadow-md hover:border-amber-200 transition-all duration-300 cursor-default group">
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-3 group-hover:bg-amber-100 transition-colors">
                            <Icons.AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-extrabold text-slate-900 mb-1 animate-countUp delay-400">{yellowJobs.length}</div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">พิจารณาเพิ่มเติม</div>
                    </div>

                    {/* Red/Not Ready */}
                    <div
                        className="animate-fadeInUp delay-300 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center cursor-pointer hover:border-rose-200 hover:shadow-md transition-all duration-300 group"
                        onClick={() => navigate('/student/not-ready')}
                    >
                        <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mb-3 group-hover:bg-rose-100 transition-colors">
                            <Icons.XCircle className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-extrabold text-slate-900 mb-1 animate-countUp delay-500">{redJobsCount !== null ? redJobsCount : '—'}</div>
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">ยังไม่เหมาะสม</div>
                    </div>

                    {/* Applications */}
                    <div
                        className="animate-fadeInUp delay-400 bg-gradient-to-br from-sky-600 to-indigo-600 rounded-2xl shadow-lg shadow-sky-600/15 p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:shadow-sky-600/20 hover:scale-[1.02] transition-all duration-300 text-white group"
                        onClick={() => navigate('/student/applications')}
                    >
                        <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-white mb-3 group-hover:bg-white/25 transition-colors">
                            <Icons.ArrowRight className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-extrabold mb-1 animate-countUp delay-600">{applicationsCount}</div>
                        <div className="text-xs font-medium text-sky-100 uppercase tracking-wide">สมัครแล้ว</div>
                    </div>
                </div>

                {/* Green Zone */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6 animate-fadeInUp delay-200">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">งานที่เหมาะกับคุณ</h2>
                        <span className="inline-flex items-center gap-x-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                            {greenJobs.length} ตำแหน่ง
                        </span>
                    </div>

                    {greenJobs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {greenJobs.map((job, i) => (
                                <JobCard
                                    key={job.id || job._id}
                                    job={job}
                                    zone="green"
                                    onApply={handleApply}
                                    applying={applying === (job.id || job._id)}
                                    index={i}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="animate-fadeInUp bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 mb-4">
                                <Icons.Search className="w-7 h-7 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">ยังไม่มีงานที่เหมาะสมมาก</h3>
                            <p className="text-slate-500">ลองอัปเดต Resume เพื่อเพิ่มโอกาสในการจับคู่กับตำแหน่งงาน</p>
                        </div>
                    )}
                </div>

                {/* Yellow Zone */}
                {yellowJobs.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6 animate-fadeInUp">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">งานที่น่าสนใจ</h2>
                            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                                {yellowJobs.length} ตำแหน่ง
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {yellowJobs.map((job, i) => (
                                <JobCard
                                    key={job.id || job._id}
                                    job={job}
                                    zone="yellow"
                                    onApply={handleApply}
                                    applying={applying === (job.id || job._id)}
                                    index={i}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA: Gap Analysis */}
                <div className="animate-fadeInUp bg-slate-900 rounded-2xl p-8 sm:p-12 text-center text-white mt-16 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-sky-500 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700" />
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-indigo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700" />

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-white/15 transition-colors">
                            <Icons.TrendingUp className="w-7 h-7 text-sky-300" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-4">ต้องการพัฒนาตัวเอง?</h2>
                        <p className="text-slate-300 mb-8 max-w-xl mx-auto text-lg">
                            ดูรายละเอียดงานที่ยังไม่เหมาะกับคุณ พร้อมคำแนะนำสิ่งที่ต้องพัฒนาเพิ่มเติมจากระบบ AI
                        </p>
                        <button
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 hover:shadow-sky-400/30 active:scale-[0.98] transition-all"
                            onClick={() => navigate('/student/not-ready')}
                        >
                            ดู Gap Analysis
                            <Icons.ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-5 right-5 z-50 rounded-xl px-5 py-3.5 text-sm font-semibold shadow-2xl animate-slideInRight ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                    }`}>
                    <div className="flex items-center gap-2.5">
                        {toast.type === 'error' ? (
                            <Icons.XCircle className="w-5 h-5" />
                        ) : (
                            <Icons.CheckCircle className="w-5 h-5" />
                        )}
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
