// frontend/src/components/Student/NotReadyJobs.jsx
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
    Trophy: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    ),
    XCircle: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
        </svg>
    ),
    CheckCircle: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
        </svg>
    ),
    ArrowLeft: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
    ),
    Sparkles: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
        </svg>
    ),
    Briefcase: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    Lightbulb: (props) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6" /><path d="M10 22h4" />
        </svg>
    ),
};

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
            } else if (result.error?.toLowerCase().includes('resume')) {
                setNoResume(true);
            }
        } catch (err) {
            console.error('Error loading not-ready jobs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) { navigate('/login'); return; }
        loadNotReadyJobs();
    }, [isAuthenticated, navigate, loadNotReadyJobs]);

    const barColor = (pct) => pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
    const textColor = (pct) => pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-rose-600';
    const scoreRingColor = (pct) => pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
    const glowFilter = (pct) => pct >= 70
        ? 'drop-shadow(0 0 6px rgba(16,185,129,0.35))'
        : pct >= 40 ? 'drop-shadow(0 0 6px rgba(245,158,11,0.35))'
            : 'drop-shadow(0 0 6px rgba(244,63,94,0.35))';

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <div className="text-center animate-fadeInUp">
                    <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-5 animate-pulse">
                        <Icons.Sparkles className="w-8 h-8 text-sky-600" />
                    </div>
                    <p className="text-slate-600 font-semibold text-lg">กำลังวิเคราะห์ช่องว่างทักษะ</p>
                    <p className="text-slate-400 text-sm mt-1">AI กำลังเปรียบเทียบ Resume กับตำแหน่งงาน...</p>
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4">
                <div className="animate-fadeInUp bg-white rounded-2xl shadow-soft border border-slate-200 p-10 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-float">
                        <Icons.FileText className="w-8 h-8 text-sky-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">อัปโหลด Resume ก่อน</h2>
                    <p className="text-slate-500 mb-6">ระบบต้องวิเคราะห์ Resume ของคุณก่อนจึงจะแสดง Gap Analysis ได้</p>
                    <button
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 text-sm font-bold shadow-lg shadow-sky-600/20 hover:shadow-sky-700/25 active:scale-[0.98] transition-all"
                        onClick={() => navigate('/student/resume')}
                    >
                        <Icons.FileText className="w-4 h-4" />
                        อัปโหลด Resume
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12 relative overflow-hidden">
            {/* Background decorative */}
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-rose-400/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-20 right-0 w-[350px] h-[350px] bg-indigo-400/5 rounded-full blur-3xl translate-x-1/3 pointer-events-none" />

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Header */}
                <div className="animate-fadeInUp flex items-start gap-4 mb-8 bg-white rounded-2xl shadow-soft border border-slate-200 p-5 sm:p-6">
                    <button
                        className="p-2 -ml-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all shrink-0 mt-0.5 active:scale-95"
                        onClick={() => navigate('/student/dashboard')}
                        aria-label="กลับ"
                    >
                        <Icons.ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Gap Analysis</h1>
                        <p className="text-slate-500 text-sm mt-0.5">งานที่คุณยังต้องพัฒนาเพิ่มเติม พร้อมคำแนะนำจาก AI</p>
                    </div>
                </div>

                {/* Job Cards */}
                {jobs.length > 0 ? (
                    <div className="space-y-5">
                        {jobs.map((job, index) => {
                            const scorePct = Math.round(job.score || 0);
                            const radius = 28, circumference = 2 * Math.PI * radius;
                            const offset = circumference - (scorePct / 100) * circumference;
                            return (
                                <div
                                    key={job.job_id || index}
                                    className="animate-fadeInUp bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-300"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Top strip */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                                                <Icons.Briefcase className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">{job.job_title}</h3>
                                                <span className="text-sm text-slate-500">{job.company_name}</span>
                                            </div>
                                        </div>
                                        {/* Score Ring */}
                                        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                                            <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90" style={{ filter: glowFilter(scorePct) }}>
                                                <circle cx="36" cy="36" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                                                <circle
                                                    cx="36" cy="36" r={radius} fill="none"
                                                    stroke={scoreRingColor(scorePct)} strokeWidth="6"
                                                    strokeDasharray={circumference} strokeDashoffset={offset}
                                                    strokeLinecap="round"
                                                    className="animate-drawRing"
                                                    style={{
                                                        '--circumference': circumference,
                                                        '--offset': offset,
                                                    }}
                                                />
                                            </svg>
                                            <span className={`absolute text-sm font-bold ${textColor(scorePct)}`}>{scorePct}%</span>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-5">
                                        {/* Breakdown Bars */}
                                        {job.breakdown && Object.keys(job.breakdown).length > 0 && (
                                            <div className="space-y-2.5">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score Breakdown</h4>
                                                {Object.entries(job.breakdown).map(([key, value], barIdx) => {
                                                    const pct = Math.round(value);
                                                    return (
                                                        <div key={key} className="flex items-center gap-2 text-sm">
                                                            <span className="w-20 shrink-0 text-slate-600 font-medium capitalize">{key}</span>
                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full animate-barGrow ${barColor(pct)}`}
                                                                    style={{
                                                                        width: `${pct}%`,
                                                                        animationDelay: `${barIdx * 120 + 300}ms`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className={`w-10 text-right font-bold text-xs ${textColor(pct)}`}>{pct}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Missing Skills */}
                                        {job.missing_skills?.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <Icons.XCircle className="w-3.5 h-3.5" />
                                                    ทักษะที่ยังขาด
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {job.missing_skills.map((skill, i) => (
                                                        <span
                                                            key={i}
                                                            className="animate-fadeInUp rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-default"
                                                            style={{ animationDelay: `${i * 50 + 500}ms` }}
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Recommendations */}
                                        {job.recommendations?.length > 0 && (
                                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                                                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <Icons.Lightbulb className="w-3.5 h-3.5" />
                                                    คำแนะนำจาก AI
                                                </h4>
                                                <ul className="space-y-2">
                                                    {job.recommendations.map((rec, i) => (
                                                        <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                                                            <Icons.CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                            {rec}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="animate-fadeInUp bg-white rounded-2xl shadow-soft border border-slate-200 p-16 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-float">
                            <Icons.Trophy className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">คุณเหมาะกับทุกตำแหน่ง!</h3>
                        <p className="text-slate-500 mb-6">ไม่มีงานในโซนแดง — Resume ของคุณตรงกับทุกตำแหน่งที่เปิดรับ</p>
                        <button
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 text-sm font-bold shadow-lg shadow-sky-600/20 active:scale-[0.98] transition-all"
                            onClick={() => navigate('/student/dashboard')}
                        >
                            กลับ Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotReadyJobs;
