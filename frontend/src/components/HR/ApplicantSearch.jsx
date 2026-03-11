// frontend/src/components/HR/ApplicantSearch.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config';
import jobService from '../../services/jobService';

const normalizeScore = (s) => {
    if (s == null) return 0;
    return s <= 1 ? Math.round(s * 100) : Math.round(s);
};

const StatusBadge = ({ status }) => {
    const map = {
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        rejected: 'bg-rose-100 text-rose-700 border-rose-200',
    };
    const labels = { pending: 'รอพิจารณา', accepted: 'รับแล้ว', rejected: 'ปฏิเสธ' };
    return (
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            {labels[status] || status}
        </span>
    );
};

const ApplicantSearch = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('ai_score');
    const [expandedId, setExpandedId] = useState(null);
    const debounceRef = useRef(null);

    const adminCompanyId = searchParams.get('company_id');
    const isAdminView = user?.user_type === 'Admin' && !!adminCompanyId;
    const dashboardPath = isAdminView ? `/hr/dashboard?company_id=${adminCompanyId}` : '/hr/dashboard';

    useEffect(() => {
        if (!isAuthenticated() || !['HR', 'Admin'].includes(user?.user_type)) navigate('/login');
    }, [isAuthenticated, user, navigate]);

    const loadApplicants = useCallback(async (params = {}) => {
        setLoading(true);
        const result = await jobService.getAllApplicants({
            search: params.search !== undefined ? params.search : search,
            status: params.status !== undefined ? params.status : statusFilter,
            sortBy: params.sortBy || sortBy,
            ...(isAdminView && { company_id: adminCompanyId }),
        });
        if (result.success) setApplicants(result.data.applicants || []);
        setLoading(false);
    }, [search, statusFilter, sortBy, isAdminView, adminCompanyId]);

    useEffect(() => { loadApplicants(); }, [statusFilter, sortBy]);

    const handleSearch = (value) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => loadApplicants({ search: value }), 400);
    };

    const scoreColor = (pct) => pct >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : pct >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200';
    const barColor = (pct) => pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

    const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white";

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <button className="p-2 -ml-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0" onClick={() => navigate(dashboardPath)} aria-label="กลับ">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">ค้นหาผู้สมัคร</h1>
                        <p className="text-sm text-slate-500 mt-0.5">ค้นหาและกรองผู้สมัครทุกตำแหน่ง</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-3 animate-fadeInUp">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                        />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls + ' w-auto'}>
                        <option value="all">ทุกสถานะ</option>
                        <option value="pending">รอพิจารณา</option>
                        <option value="accepted">รับแล้ว</option>
                        <option value="rejected">ปฏิเสธ</option>
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={inputCls + ' w-auto'}>
                        <option value="ai_score">AI Score สูงสุด</option>
                        <option value="name">ชื่อ A-Z</option>
                        <option value="date">ล่าสุด</option>
                    </select>
                </div>

                {/* Result count */}
                <p className="text-sm text-slate-500 font-medium mb-4">
                    พบ <strong className="text-slate-800">{applicants.length}</strong> ผู้สมัคร
                </p>

                {/* Results */}
                {loading ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
                        <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-sm font-medium">กำลังค้นหา...</p>
                    </div>
                ) : applicants.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-400">
                        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                        </svg>
                        <h3 className="font-bold text-slate-900">ไม่พบผู้สมัคร</h3>
                        <p>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                    </div>
                ) : (
                    <div className="space-y-3 animate-fadeInUp" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                        {applicants.map((app, idx) => {
                            const pct = normalizeScore(app.ai_score);
                            const isExpanded = expandedId === (app.id || app._id);
                            const breakdown = app.matching_breakdown || {};
                            return (
                                <div key={app.id || app._id || idx} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${isExpanded ? 'border-sky-300' : 'border-slate-200'}`}>
                                    <div className="flex items-center gap-4 p-4">
                                        {/* Score Badge */}
                                        <div className={`flex h-12 w-14 items-center justify-center rounded-xl border text-sm font-bold shrink-0 ${scoreColor(pct)}`}>
                                            {pct}%
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-900">{app.student_name || 'ไม่ระบุชื่อ'}</span>
                                                <StatusBadge status={app.status} />
                                            </div>
                                            <div className="text-xs text-slate-500">{app.student_email}</div>
                                            <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
                                                    {app.job_title || '-'}
                                                </span>
                                                <span>{formatDate(app.submitted_at)}</span>
                                            </div>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <button
                                                className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                                                onClick={() => setExpandedId(isExpanded ? null : (app.id || app._id))}
                                            >
                                                {isExpanded ? '▲ ซ่อน' : '▼ ดูเพิ่มเติม'}
                                            </button>
                                            <button
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 text-xs font-semibold transition-colors"
                                                onClick={() => navigate(`/hr/jobs/${app.job_id}/applicants`)}
                                            >
                                                ไปที่ตำแหน่ง →
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4">
                                            {Object.keys(breakdown).length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI Score Breakdown</h4>
                                                    <div className="space-y-2">
                                                        {Object.entries(breakdown).map(([key, val]) => {
                                                            const bpct = normalizeScore(val);
                                                            return (
                                                                <div key={key} className="flex items-center gap-2 text-xs">
                                                                    <span className="w-16 shrink-0 text-slate-600 font-medium capitalize">{key}</span>
                                                                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                        <div className={`h-full rounded-full ${barColor(bpct)}`} style={{ width: `${bpct}%` }} />
                                                                    </div>
                                                                    <span className="w-8 text-right font-bold text-slate-600">{bpct}%</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-3">
                                                {app.ai_feedback && (
                                                    <div className="flex-1 min-w-[200px] bg-sky-50 border border-sky-100 rounded-lg p-3 text-xs text-sky-900 leading-relaxed">
                                                        <strong>AI Recommendation: </strong>{app.ai_feedback}
                                                    </div>
                                                )}
                                                {app.resume_file_url && (
                                                    <a
                                                        href={`${API_BASE_URL}${app.resume_file_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors self-start"
                                                    >
                                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                                                        ดู Resume PDF
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicantSearch;
