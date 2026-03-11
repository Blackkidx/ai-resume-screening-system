// frontend/src/components/HR/HRAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import jobService from '../../services/jobService';
import {
    Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const HRAnalytics = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    const adminCompanyId = searchParams.get('company_id');
    const isAdminView = user?.user_type === 'Admin' && !!adminCompanyId;
    const dashboardPath = isAdminView ? `/hr/dashboard?company_id=${adminCompanyId}` : '/hr/dashboard';

    useEffect(() => {
        if (!isAuthenticated() || !['HR', 'Admin'].includes(user?.user_type)) { navigate('/login'); return; }
        loadAnalytics();
    }, [isAuthenticated, user, navigate]);

    const loadAnalytics = async () => {
        setLoading(true);
        const result = await jobService.getDetailedAnalytics(isAdminView ? adminCompanyId : null);
        if (result.success) setAnalytics(result.data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-sky-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลสถิติ...</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <p className="text-slate-400">ไม่สามารถโหลดข้อมูลได้</p>
            </div>
        );
    }

    const { summary, per_job } = analytics;


    const renderIcon = (name, className = "w-5 h-5") => {
        switch (name) {
            case 'Briefcase': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>;
            case 'Files': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>;
            case 'CheckCircle': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>;
            case 'Target': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 12l4-4" /><circle cx="12" cy="12" r="2" /></svg>;
            case 'ArrowLeft': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
            default: return null;
        }
    };

    const statusDoughnutData = {
        labels: ['รับแล้ว', 'ปฏิเสธ', 'รอพิจารณา'],
        datasets: [{
            data: [summary.total_accepted, summary.total_rejected, summary.total_pending],
            backgroundColor: ['#10B981', '#F43F5E', '#F59E0B'],
            borderWidth: 0,
            hoverOffset: 8,
            cutout: '75%'
        }]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#64748B', padding: 20, usePointStyle: true, pointStyle: 'circle', font: { family: "'Sarabun', sans-serif", size: 13, weight: '500' } } },
            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#F8FAFC', bodyColor: '#F8FAFC', padding: 12, cornerRadius: 8, titleFont: { family: "'Sarabun', sans-serif" }, bodyFont: { family: "'Sarabun', sans-serif", size: 14 } }
        }
    };

    const jobLabels = per_job.map(j => j.title.length > 20 ? j.title.slice(0, 20) + '…' : j.title);

    const applicantsBarData = {
        labels: jobLabels,
        datasets: [
            { label: 'รับแล้ว', data: per_job.map(j => j.accepted), backgroundColor: '#10B981', borderRadius: 4, barPercentage: 0.6 },
            { label: 'ปฏิเสธ', data: per_job.map(j => j.rejected), backgroundColor: '#F43F5E', borderRadius: 4, barPercentage: 0.6 },
            { label: 'รอพิจารณา', data: per_job.map(j => j.pending), backgroundColor: '#F59E0B', borderRadius: 4, barPercentage: 0.6 }
        ]
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', align: 'end', labels: { color: '#64748B', usePointStyle: true, pointStyle: 'circle', padding: 20, font: { family: "'Sarabun', sans-serif", size: 12, weight: '500' } } },
            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#F8FAFC', bodyColor: '#F8FAFC', padding: 12, cornerRadius: 8, titleFont: { family: "'Sarabun', sans-serif" }, bodyFont: { family: "'Sarabun', sans-serif" } }
        },
        scales: {
            x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { color: '#64748B', font: { family: "'Sarabun', sans-serif", size: 12 } } },
            y: { stacked: true, beginAtZero: true, grid: { color: '#F1F5F9', drawBorder: false }, border: { display: false }, ticks: { color: '#94A3B8', stepSize: 1, font: { family: "'Sarabun', sans-serif" } } }
        }
    };

    const aiScoreBarData = {
        labels: jobLabels,
        datasets: [{
            label: 'AI Match เฉลี่ย (%)',
            data: per_job.map(j => j.avg_ai_score),
            backgroundColor: per_job.map(j => j.avg_ai_score >= 70 ? 'url(#emeraldGradient)' : j.avg_ai_score >= 40 ? 'url(#amberGradient)' : 'url(#roseGradient)'),
            borderRadius: 6,
            barPercentage: 0.5
        }]
    };

    const aiScoreOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#F8FAFC', bodyColor: '#F8FAFC', padding: 12, cornerRadius: 8, titleFont: { family: "'Sarabun', sans-serif" }, bodyFont: { family: "'Sarabun', sans-serif" }, callbacks: { label: ctx => `${ctx.raw}% Match` } }
        },
        scales: {
            x: { beginAtZero: true, max: 100, border: { display: false }, grid: { color: '#F1F5F9' }, ticks: { color: '#94A3B8', font: { family: "'Sarabun', sans-serif" }, callback: v => v + '%' } },
            y: { grid: { display: false }, border: { display: false }, ticks: { color: '#64748B', font: { family: "'Sarabun', sans-serif", size: 12 } } }
        }
    };

    const summaryCards = [
        { icon: renderIcon('Briefcase', 'w-6 h-6'), label: 'ตำแหน่งงาน', value: summary.total_jobs, color: 'text-sky-600', bg: 'bg-sky-50', gradient: 'from-sky-500/20 to-transparent' },
        { icon: renderIcon('Files', 'w-6 h-6'), label: 'ใบสมัครทั้งหมด', value: summary.total_applications, color: 'text-indigo-600', bg: 'bg-indigo-50', gradient: 'from-indigo-500/20 to-transparent' },
        { icon: renderIcon('CheckCircle', 'w-6 h-6'), label: 'อัตราการรับ', value: `${summary.acceptance_rate}%`, color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-500/20 to-transparent' },
        { icon: renderIcon('Target', 'w-6 h-6'), label: 'AI Score เฉลี่ย', value: `${summary.avg_ai_score}%`, color: 'text-violet-600', bg: 'bg-violet-50', gradient: 'from-violet-500/20 to-transparent' },
    ];

    const statusBlocks = [
        { label: 'รับแล้ว', count: summary.total_accepted, textColor: 'text-emerald-700', badgeColor: 'bg-emerald-100 text-emerald-800' },
        { label: 'ปฏิเสธ', count: summary.total_rejected, textColor: 'text-rose-700', badgeColor: 'bg-rose-100 text-rose-800' },
        { label: 'รอพิจารณา', count: summary.total_pending, textColor: 'text-amber-700', badgeColor: 'bg-amber-100 text-amber-800' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-16 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-400/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <div className="flex items-center gap-4">
                        <button
                            className="p-2.5 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                            onClick={() => navigate(dashboardPath)}
                            aria-label="Back to dashboard"
                        >
                            {renderIcon('ArrowLeft')}
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Overview</h1>
                            <p className="text-slate-500 text-sm mt-1 mb-0 font-medium">ภาพรวมผลการปฏิบัติงานด้านการสรรหา</p>
                        </div>
                    </div>
                </div>

                {/* KPI Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {summaryCards.map((card, i) => (
                        <div
                            key={card.label}
                            className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden animate-fadeInUp"
                            style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} rounded-bl-full translate-x-8 -translate-y-8 opacity-50 group-hover:scale-110 transition-transform duration-500 ease-out`} />

                            <div className="relative z-10">
                                <div className={`inline-flex items-center justify-center p-3 rounded-2xl ${card.bg} ${card.color} mb-4 shadow-sm ring-1 ring-inset ring-black/5`}>
                                    {card.icon}
                                </div>
                                <div className="text-slate-500 font-medium text-sm mb-1">{card.label}</div>
                                <div className="text-4xl font-black text-slate-900 tracking-tight">{card.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Middle Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">

                    {/* Status Doughnut & Mini KPIs */}
                    <div className="lg:col-span-4 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 animate-fadeInUp" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full inline-block"></span>
                            สัดส่วนสถานะผู้สมัคร
                        </h3>
                        <div className="h-[220px] relative">
                            <Doughnut data={statusDoughnutData} options={doughnutOptions} />
                            {/* Center Text overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                                <span className="text-3xl font-black text-slate-800">{summary.total_applications}</span>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total</span>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center gap-4">
                            {statusBlocks.map(block => (
                                <div key={block.label} className="text-center flex-1">
                                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mb-2 ${block.badgeColor}`}>
                                        {block.label}
                                    </div>
                                    <div className={`text-2xl font-black ${block.textColor}`}>{block.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Applicants per Job Bar Chart */}
                    <div className="lg:col-span-8 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 animate-fadeInUp" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block"></span>
                            อัตราการรับสมัครแต่ละตำแหน่ง
                        </h3>
                        <div className="h-[300px]">
                            <Bar data={applicantsBarData} options={barOptions} />
                        </div>
                    </div>
                </div>

                {/* Bottom Charts & Table Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeInUp" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>

                    {/* Detailed Data Table */}
                    <div className="lg:col-span-12 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-violet-500 rounded-full inline-block"></span>
                                รายละเอียดเชิงลึกแต่ละตำแหน่ง
                            </h3>
                        </div>

                        {per_job.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center">
                                <div className="text-slate-300 mb-4">{renderIcon('Files', 'w-16 h-16')}</div>
                                <p className="text-slate-500 font-medium tracking-wide">ยังไม่มีข้อมูลตำแหน่งงาน</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#F8FAFC]">
                                        <tr>
                                            {['ตำแหน่ง', 'สถานะ', 'ผู้สมัคร', 'รับ', 'ปฏิเสธ', 'รอ', 'AI Match เฉลี่ย', ''].map(h => (
                                                <th key={h} className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white/30">
                                        {per_job.map(job => (
                                            <tr key={job.job_id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-slate-800">{job.title}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${job.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-50 text-slate-600 ring-slate-500/20'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${job.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                        {job.is_active ? 'เปิดรับ' : 'ปิดแล้ว'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-black flex items-center gap-2">
                                                    <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">{job.total}</span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-emerald-600">{job.accepted > 0 ? job.accepted : '-'}</td>
                                                <td className="px-6 py-4 font-bold text-rose-600">{job.rejected > 0 ? job.rejected : '-'}</td>
                                                <td className="px-6 py-4 font-bold text-amber-500">{job.pending > 0 ? job.pending : '-'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-[100px] shadow-inner">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${job.avg_ai_score >= 70 ? 'bg-emerald-500' : job.avg_ai_score >= 40 ? 'bg-amber-400' : 'bg-rose-500'}`}
                                                                style={{ width: `${Math.min(job.avg_ai_score, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-black text-slate-700 w-8">{Math.round(job.avg_ai_score)}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm px-4 py-2 text-xs font-bold text-slate-600 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                        onClick={() => navigate(`/hr/jobs/${job.job_id}/applicants`)}
                                                    >
                                                        เปิดดู
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SVG Definitions for Gradients used in ChartJS */}
            <svg style={{ height: 0, width: 0, position: 'absolute' }}>
                <defs>
                    <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#34D399" />
                        <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                    <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                    <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FB7185" />
                        <stop offset="100%" stopColor="#E11D48" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};

export default HRAnalytics;
