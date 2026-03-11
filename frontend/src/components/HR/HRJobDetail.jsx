import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import jobService from '../../services/jobService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

const Icons = {
    Detail: <svg className="w-5 h-5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
    Checklist: <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
    Target: <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    Pin: <svg className="w-5 h-5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    Gift: <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>,
    Contact: <svg className="w-5 h-5 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
    Email: <svg className="w-4 h-4 inline-block mr-1 text-sky-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    Phone: <svg className="w-4 h-4 inline-block mr-1 text-sky-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
    ErrorBig: <svg className="w-6 h-6 text-rose-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
    Share: <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>,
    Users: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    Edit: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
};

const HRJobDetail = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated } = useAuth();
    const notify = useNotification();

    const adminCompanyId = searchParams.get('company_id');
    const isAdminView = user?.user_type === 'Admin' && !!adminCompanyId;
    const jobsPath = isAdminView ? `/hr/jobs?company_id=${adminCompanyId}` : '/hr/jobs';

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) { navigate('/login'); return; }
        if (!user || (user.user_type !== 'HR' && user.user_type !== 'Admin')) {
            navigate('/dashboard');
            return;
        }
        loadJobDetail();
    }, [jobId, isAuthenticated, navigate, user]);

    const loadJobDetail = async () => {
        try {
            setLoading(true);
            setError('');
            const r = await jobService.getJobById(jobId);
            if (r.success) setJob(r.data);
            else setError(r.error);
        } catch {
            setError('ไม่สามารถโหลดข้อมูลงานได้');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        const studentUrl = `${window.location.origin}/jobs/${jobId}`;
        navigator.clipboard.writeText(studentUrl).then(() => {
            notify.success('คัดลอกลิงก์สำเร็จ นำไปแชร์ต่อได้เลย!');
        }).catch(() => {
            notify.error('ไม่สามารถคัดลอกลิงก์ได้');
        });
    };

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><LoadingSpinner /></div>;

    if (error || !job) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4">
            <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 p-10 text-center max-w-sm w-full animate-fadeInUp">
                {Icons.ErrorBig}
                <p className="text-slate-700 font-bold mb-6">{error || 'ไม่พบข้อมูลงาน'}</p>
                <button className="rounded-xl w-full bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 text-sm font-bold transition-all" onClick={() => navigate('/hr/jobs')}>กลับรายการงาน</button>
            </div>
        </div>
    );

    const sectionTitle = (icon, text) => (
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-3">{icon} {text}</h3>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            {/* ── HR Top Banner ── */}
            <div className="bg-indigo-600 px-4 py-2 flex items-center justify-center text-indigo-50 text-sm font-bold tracking-wide">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                โหมดผู้ดูแลระบบ (HR): พรีวิวประกาศงานมุมมองนักศึกษา
            </div>

            {/* ── Candidate Preview Header (Option A) ── */}
            <div className="relative bg-slate-900 border-b border-slate-800 overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
                    <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-50%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
                    <button className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold mb-6 transition-colors group" onClick={() => navigate(jobsPath)}>
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                        กลับจัดการตำแหน่งงาน
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${job.is_active ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' : 'bg-rose-500/10 text-rose-400 ring-rose-500/20'}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${job.is_active ? 'bg-emerald-500 animate-[pulseGlow_2s_ease-in-out_infinite]' : 'bg-rose-500'}`} />
                                    {job.is_active ? 'กำลังเปิดรับสมัคร' : 'ปิดรับสมัคร'}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold backdrop-blur-md">
                                    {Icons.Detail} {job.job_type || 'ฝึกงาน'}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-3 leading-tight">{job.title}</h1>
                            <h2 className="text-xl md:text-2xl font-medium text-slate-300 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                {job.company_name}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Layout: Preview (Left) + Marketing Hub (Right) ── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Job Preview (Option A) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden opacity-95">
                            <div className="bg-slate-100/50 border-b border-slate-200 px-6 py-3 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-rose-400/80"></span>
                                    <span className="w-3 h-3 rounded-full bg-amber-400/80"></span>
                                    <span className="w-3 h-3 rounded-full bg-emerald-400/80"></span>
                                </div>
                                <span className="ml-3 text-xs font-bold text-slate-400 uppercase tracking-widest">พรีวิวมุมมองนักศึกษา</span>
                            </div>

                            <div className="p-6 md:p-8 space-y-8">
                                {job.description && (
                                    <div>
                                        {sectionTitle(Icons.Detail, 'รายละเอียดงาน')}
                                        <div className="h-px bg-gradient-to-r from-slate-100 to-transparent w-full mb-4" />
                                        <p className="text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                                    </div>
                                )}
                                {job.requirements?.length > 0 && (
                                    <div>
                                        {sectionTitle(Icons.Checklist, 'คุณสมบัติที่ต้องการ')}
                                        <div className="h-px bg-gradient-to-r from-slate-100 to-transparent w-full mb-4" />
                                        <ul className="space-y-3">{job.requirements.map((r, i) => <li key={i} className="flex gap-3 text-sm md:text-base text-slate-700"><span className="h-2 w-2 rounded-full bg-sky-500 shrink-0 mt-2 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />{r}</li>)}</ul>
                                    </div>
                                )}
                                {job.required_skills?.length > 0 && (
                                    <div>
                                        {sectionTitle(Icons.Target, 'ทักษะที่ต้องการ')}
                                        <div className="h-px bg-gradient-to-r from-slate-100 to-transparent w-full mb-4" />
                                        <div className="flex flex-wrap gap-2.5">{job.required_skills.map((s, i) => <span key={i} className="rounded-xl bg-sky-50 border border-sky-100/50 px-3.5 py-1.5 text-sm font-semibold text-sky-700 transition-colors">{s}</span>)}</div>
                                    </div>
                                )}
                                {job.responsibilities?.length > 0 && (
                                    <div>
                                        {sectionTitle(Icons.Pin, 'หน้าที่ความรับผิดชอบ')}
                                        <div className="h-px bg-gradient-to-r from-slate-100 to-transparent w-full mb-4" />
                                        <ul className="space-y-3">{job.responsibilities.map((r, i) => <li key={i} className="flex gap-3 text-sm md:text-base text-slate-700"><span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-2 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />{r}</li>)}</ul>
                                    </div>
                                )}
                                {job.benefits?.length > 0 && (
                                    <div>
                                        {sectionTitle(Icons.Gift, 'สวัสดิการ')}
                                        <div className="h-px bg-gradient-to-r from-slate-100 to-transparent w-full mb-4" />
                                        <ul className="space-y-3">{job.benefits.map((b, i) => <li key={i} className="flex gap-3 text-sm md:text-base text-slate-700"><span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />{b}</li>)}</ul>
                                    </div>
                                )}
                                {(job.contact_email || job.contact_phone) && (
                                    <div>
                                        {sectionTitle(Icons.Contact, 'ติดต่อสอบถาม')}
                                        <div className="h-px bg-gradient-to-r from-slate-100 to-transparent w-full mb-4" />
                                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            {job.contact_email && <p className="text-sm font-medium text-slate-700 flex items-center bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">{Icons.Email} <a href={`mailto:${job.contact_email}`} className="text-sky-600 hover:text-sky-700 transition-colors ml-1.5">{job.contact_email}</a></p>}
                                            {job.contact_phone && <p className="text-sm font-medium text-slate-700 flex items-center bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">{Icons.Phone} <a href={`tel:${job.contact_phone}`} className="text-sky-600 hover:text-sky-700 transition-colors ml-1.5">{job.contact_phone}</a></p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: HR Share Hub (Option C) */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="sticky top-24 space-y-6">

                            {/* Marketing Action Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 animate-fadeInUp">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-fuchsia-100 flex items-center justify-center mb-5 ring-4 ring-white shadow-inner">
                                    <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                                </div>
                                <h3 className="font-extrabold text-xl text-slate-900 mb-2">เริ่มหาตัวท็อปกันเลย!</h3>
                                <p className="text-sm text-slate-500 mb-6 font-medium">แชร์ประกาศงานของคุณให้เข้าถึงนิสิตนักศึกษา เพื่อรับเรซูเม่จากแคนดิเดตที่ดีที่สุด</p>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleCopyLink}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 text-sm font-bold shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 active:scale-[0.98] group"
                                    >
                                        {Icons.Share} คัดลอกลิงก์รับสมัคร (URL)
                                    </button>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => notify.info('ฟีเจอร์ QR Code กำลังพัฒนาระบบ Generator ครับ')}
                                            className="flex-1 rounded-xl bg-slate-50 border-2 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700 px-4 py-3 text-xs font-bold transition-all flex flex-col items-center gap-1.5 justify-center group"
                                        >
                                            <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><rect x="7" y="7" width="3" height="3" /><rect x="14" y="7" width="3" height="3" /><rect x="7" y="14" width="3" height="3" /><rect x="14" y="14" width="3" height="3" /></svg>
                                            โหลด QR Code
                                        </button>
                                        <button
                                            onClick={() => navigate(isAdminView ? `/hr/jobs/${job.id}/edit?company_id=${adminCompanyId}` : `/hr/jobs/${job.id}/edit`)}
                                            className="flex-1 rounded-xl bg-slate-50 border-2 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700 px-4 py-3 text-xs font-bold transition-all flex flex-col items-center gap-1.5 justify-center group"
                                        >
                                            {React.cloneElement(Icons.Edit, { className: 'w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors' })}
                                            แก้ไขประกาศ
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Applicants Card */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg shadow-slate-900/20 relative overflow-hidden animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                </div>

                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">สถิติปัจจุบัน</h4>

                                <div className="flex justify-between items-end mb-6 relative z-10">
                                    <div>
                                        <div className="text-4xl font-black text-white tracking-tight">{job.applications_count}</div>
                                        <div className="text-sm font-medium text-slate-400 mt-1">ใบสมัครรอพิจารณา</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-emerald-400">{job.positions_filled} <span className="text-sm text-slate-400">/ {job.positions_available}</span></div>
                                        <div className="text-sm font-medium text-slate-400 mt-1">รับเข้าทำงานแล้ว</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate(isAdminView ? `/hr/jobs/${job.id}/applicants?company_id=${adminCompanyId}` : `/hr/jobs/${job.id}/applicants`)}
                                    className="w-full relative z-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-3 text-sm font-bold text-white transition-all backdrop-blur-md flex items-center justify-center gap-2"
                                >
                                    {React.cloneElement(Icons.Users, { className: 'w-4 h-4' })}
                                    คัดกรองเรซูเม่เลย
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRJobDetail;
