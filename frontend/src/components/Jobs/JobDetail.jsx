// frontend/src/components/Jobs/JobDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  MatchHigh: <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  MatchMedium: <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>,
  MatchLow: <svg className="w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
  Warning: <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
};

const API_BASE_URL = 'http://172.18.148.97:8000';
const inputCls = "w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 outline-none bg-slate-50 focus:bg-white placeholder:text-slate-400 transition-all duration-300 hover:border-slate-400 shadow-sm";

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const notify = useNotification();
  const location = useLocation();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchAnalysis, setMatchAnalysis] = useState(null);
  const [analyzingMatch, setAnalyzingMatch] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [certFiles, setCertFiles] = useState([]);
  const [certUrls, setCertUrls] = useState([]);
  const [uploadingCerts, setUploadingCerts] = useState(false);
  const [certDragging, setCertDragging] = useState(false);
  const certInputRef = useRef(null);
  // ── Guards ──
  const [hasResumeAnalysis, setHasResumeAnalysis] = useState(null); // null=loading, true/false
  const [showNoAnalysisModal, setShowNoAnalysisModal] = useState(false);
  const [showRoleGuardModal, setShowRoleGuardModal] = useState(false);
  const [roleGuardMsg, setRoleGuardMsg] = useState('');
  const [linkedCertUrls, setLinkedCertUrls] = useState([]); // certs already uploaded in /student/resume

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login', { state: { from: { pathname: `/jobs/${jobId}` } } }); return; }
    loadJobDetail();
    // Check if student has a PROCESSED resume with extracted features
    if (user?.user_type === 'Student') {
      const token = sessionStorage.getItem('auth_token');
      fetch(`${API_BASE_URL}/api/resumes/my/list`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      })
        .then(r => r.ok ? r.json() : { resumes: [] })
        .then(d => {
          const resumes = d?.resumes || [];
          const hasProcessed = resumes.some(
            r => r.status === 'processed' && r.extracted_features
          );
          setHasResumeAnalysis(hasProcessed);
        })
        .catch(() => setHasResumeAnalysis(false));
    } else {
      // HR / Admin / other roles: set true so no modal fires for their role (role guard handles separately)
      setHasResumeAnalysis(true);
    }
  }, [jobId, isAuthenticated, navigate, user?.user_type]);

  // Guard functions
  const guardApply = () => {
    if (['HR', 'Admin'].includes(user?.user_type)) {
      setRoleGuardMsg('HR และ Admin ไม่สามารถสมัครงานได้');
      setShowRoleGuardModal(true);
      return false;
    }
    if (user?.user_type === 'Student' && !hasResumeAnalysis) {
      setShowNoAnalysisModal(true);
      return false;
    }
    return true;
  };

  const guardAnalyze = () => {
    if (['HR', 'Admin'].includes(user?.user_type)) {
      setRoleGuardMsg('HR และ Admin ไม่สามารถประมวลผล Resume ได้');
      setShowRoleGuardModal(true);
      return false;
    }
    return true;
  };

  useEffect(() => {
    // Auto-open apply panel if ?apply=true — but ONLY after guard check resolves
    if (job && location.search.includes('apply=true') && hasResumeAnalysis !== null) {
      // Clean up the URL first
      navigate(`/jobs/${jobId}`, { replace: true });
      // Run guard — will show modal or open panel based on role/analysis
      if (guardApply()) {
        loadLinkedCerts(); // fetch existing certs before opening modal
        setShowApplyModal(true);
      }
    }
  }, [job, location.search, hasResumeAnalysis]);

  const loadJobDetail = async () => {
    try { setLoading(true); setError(''); const r = await jobService.getJobById(jobId); if (r.success) setJob(r.data); else setError(r.error); }
    catch { setError('ไม่สามารถโหลดข้อมูลงานได้'); }
    finally { setLoading(false); }
  };

  const handleAnalyzeMatch = async () => {
    if (!hasResumeAnalysis) {
      notify.warning('คุณยังไม่มีผลการประมวลผล Resume กรุณาอัปโหลด Resume ก่อนครับ');
      return;
    }
    try {
      setAnalyzingMatch(true);
      const r = await jobService.analyzeMatch(jobId);
      if (r.success) setMatchAnalysis(r.data); else notify.error(r.error || 'ไม่สามารถวิเคราะห์ความเหมาะสมได้');
    } catch { notify.error('ไม่สามารถวิเคราะห์ความเหมาะสมได้'); }
    finally { setAnalyzingMatch(false); }
  };

  // Fetch existing cert URLs from student's certificate page when opening apply modal
  const loadLinkedCerts = async () => {
    if (user?.user_type !== 'Student') return;
    try {
      const token = sessionStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/api/certificates/my/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const urls = (data.certificates || []).map(c => c.file_url).filter(Boolean);
        setLinkedCertUrls(urls);
      }
    } catch { /* silent */ }
  };

  const addCertFiles = (files) => {
    const arr = Array.from(files).filter(f => { const ext = f.name.split('.').pop().toLowerCase(); return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext) && f.size <= 10 * 1024 * 1024; });
    if (certFiles.length + arr.length > 3) { notify.warning('สามารถแนบใบเซอร์ได้สูงสุด 3 ไฟล์'); return; }
    setCertFiles(prev => [...prev, ...arr]);
  };

  const removeCertFile = (i) => { setCertFiles(prev => prev.filter((_, x) => x !== i)); setCertUrls(prev => prev.filter((_, x) => x !== i)); };

  const uploadCerts = async () => {
    if (!certFiles.length) return [];
    setUploadingCerts(true);
    const token = sessionStorage.getItem('auth_token');
    const uploaded = [];
    for (const file of certFiles) {
      try {
        const fd = new FormData(); fd.append('file', file);
        const res = await fetch(`${API_BASE_URL}/api/resumes/upload-cert`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        if (res.ok) { const d = await res.json(); uploaded.push(d.file_url); }
      } catch (e) { console.error(e); }
    }
    setCertUrls(uploaded); setUploadingCerts(false); return uploaded;
  };

  const handleApply = async (e) => {
    e.preventDefault(); setApplying(true);
    try {
      const urls = await uploadCerts();
      // Merge newly uploaded files + pre-linked certs from /student/resume (de-duped)
      const allCertUrls = [...new Set([...linkedCertUrls, ...urls])];
      const r = await jobService.applyJob(jobId, { cover_letter: coverLetter, portfolio_url: portfolioUrl, certificate_urls: allCertUrls });
      if (r.success) { setApplySuccess(true); setTimeout(() => { setShowApplyModal(false); setApplySuccess(false); navigate('/student/applications'); }, 2000); }
      else notify.error(r.error || 'สมัครงานไม่สำเร็จ');
    } catch (err) { notify.error(err.message || 'เกิดข้อผิดพลาด'); }
    finally { setApplying(false); }
  };

  const formatSize = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  const isPdf = (name) => name.split('.').pop().toLowerCase() === 'pdf';

  const matchLevelStyle = matchAnalysis ? {
    high: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    medium: 'bg-amber-50 border-amber-200 text-amber-700',
    low: 'bg-rose-50 border-rose-200 text-rose-700'
  }[matchAnalysis.match_level] : '';

  const matchLabel = matchAnalysis ? ({
    high: <span className="flex items-center gap-2">{Icons.MatchHigh} เหมาะสมมาก</span>,
    medium: <span className="flex items-center gap-2">{Icons.MatchMedium} เหมาะสมพอใช้</span>,
    low: <span className="flex items-center gap-2">{Icons.MatchLow} ไม่ค่อยเหมาะสม</span>
  }[matchAnalysis.match_level]) : '';

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><LoadingSpinner /></div>;

  if (error || !job) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4">
      <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 p-10 text-center max-w-sm w-full animate-fadeInUp">
        {Icons.ErrorBig}
        <p className="text-slate-700 font-bold mb-6">{error || 'ไม่พบข้อมูลงาน'}</p>
        <button className="rounded-xl w-full bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 text-sm font-bold transition-all hover:shadow-lg hover:-translate-y-0.5" onClick={() => navigate('/companies')}>กลับรายการงาน</button>
      </div>
    </div>
  );

  const sectionTitle = (icon, text) => (
    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-3">{icon} {text}</h3>
  );

  return (
    <div className="min-h-screen font-sans pb-16 relative" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #f8fafc 40%, #f1f5f9 100%)' }}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      {/* Top accent bleed from hero */}
      <div className="absolute top-0 left-0 right-0 h-72 z-0" style={{ background: 'linear-gradient(180deg, #0f172a 0%, transparent 100%)', opacity: 0.04 }} />
      {/* ── Hero Banner (Option C) ── */}
      <div className="relative bg-slate-900 border-b border-slate-800 animate-fadeInUp overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
          <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-50%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">
          {/* Back Button */}
          <button className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold mb-8 transition-colors group" onClick={() => navigate('/companies')}>
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            กลับหน้ารายการงาน
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${job.is_active ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' : 'bg-slate-500/10 text-slate-400 ring-slate-500/20'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${job.is_active ? 'bg-emerald-500 animate-[pulseGlow_2s_ease-in-out_infinite]' : 'bg-slate-400'}`} />
                  {job.is_active ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold backdrop-blur-md">
                  {Icons.Detail} {job.job_type || 'ฝึกงาน'}
                </span>
              </div>

              {/* Company logo + title block */}
              <div className="flex items-start gap-5 mb-3">
                {/* Large company logo on the left */}
                <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center shadow-lg">
                  {job.company_logo ? (
                    <img
                      src={`http://172.18.148.97:8000${job.company_logo}`}
                      alt={job.company_name}
                      className="w-full h-full object-cover"
                      onError={e => {
                        e.target.style.display = 'none';
                        e.target.parentElement.querySelector('.logo-fallback').style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span
                    className="logo-fallback text-white text-2xl md:text-3xl font-black"
                    style={{ display: job.company_logo ? 'none' : 'flex' }}
                  >
                    {job.company_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>

                {/* Title + company name stacked */}
                <div className="min-w-0">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">{job.title}</h1>
                  <h2 className="text-lg md:text-xl font-medium text-slate-300 mt-1.5">{job.company_name}</h2>
                </div>
              </div>
            </div>

            {/* Quick action for Mobile (Desktop moved to sidebar) */}
            {user?.user_type === 'Student' && job.is_active && (
              <div className="lg:hidden mt-4">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white px-8 py-3.5 text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] hover:-translate-y-0.5" onClick={() => setShowApplyModal(true)}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  สมัครงานนี้
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content (Option B: Split View) ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-5">

            {/* Info Grid (Moved to Sidebar logically, keeping minimal here if desired, but better fully in right column. Let's just remove from left.) */}

            {/* Sections */}
            <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: '150ms' }}>
              {job.description && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow group">
                  {sectionTitle(Icons.Detail, 'รายละเอียดงาน')}
                  <div className="h-px bg-gradient-to-r from-slate-100 to-transparent w-full mb-4" />
                  <p className="text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                </div>
              )}
              {job.requirements?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow group">
                  {sectionTitle(Icons.Checklist, 'คุณสมบัติที่ต้องการ')}
                  <div className="h-px bg-gradient-to-r from-slate-100 to-transparent w-full mb-4" />
                  <ul className="space-y-3">{job.requirements.map((r, i) => <li key={i} className="flex gap-3 text-sm md:text-base text-slate-700"><span className="h-2 w-2 rounded-full bg-sky-500 shrink-0 mt-2 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />{r}</li>)}</ul>
                </div>
              )}
              {job.required_skills?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow group">
                  {sectionTitle(Icons.Target, 'ทักษะที่ต้องการ')}
                  <div className="h-px bg-gradient-to-r from-slate-100 to-transparent w-full mb-4" />
                  <div className="flex flex-wrap gap-2.5">{job.required_skills.map((s, i) => <span key={i} className="rounded-xl bg-sky-50 border border-sky-100/50 px-3.5 py-1.5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100 cursor-default">{s}</span>)}</div>
                </div>
              )}
              {job.responsibilities?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow group">
                  {sectionTitle(Icons.Pin, 'หน้าที่ความรับผิดชอบ')}
                  <div className="h-px bg-gradient-to-r from-slate-100 to-transparent w-full mb-4" />
                  <ul className="space-y-3">{job.responsibilities.map((r, i) => <li key={i} className="flex gap-3 text-sm md:text-base text-slate-700"><span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-2 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />{r}</li>)}</ul>
                </div>
              )}
              {job.benefits?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow group">
                  {sectionTitle(Icons.Gift, 'สวัสดิการ')}
                  <div className="h-px bg-gradient-to-r from-slate-100 to-transparent w-full mb-4" />
                  <ul className="space-y-3">{job.benefits.map((b, i) => <li key={i} className="flex gap-3 text-sm md:text-base text-slate-700"><span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />{b}</li>)}</ul>
                </div>
              )}
              {(job.contact_email || job.contact_phone) && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow group">
                  {sectionTitle(Icons.Contact, 'ติดต่อสอบถาม')}
                  <div className="h-px bg-gradient-to-r from-slate-100 to-transparent w-full mb-4" />
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {job.contact_email && <p className="text-sm font-medium text-slate-700 flex items-center bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">{Icons.Email} <a href={`mailto:${job.contact_email}`} className="text-sky-600 hover:text-sky-700 transition-colors ml-1.5">{job.contact_email}</a></p>}
                    {job.contact_phone && <p className="text-sm font-medium text-slate-700 flex items-center bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">{Icons.Phone} <a href={`tel:${job.contact_phone}`} className="text-sky-600 hover:text-sky-700 transition-colors ml-1.5">{job.contact_phone}</a></p>}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Sidebar Info & Actions */}
            <div className="lg:col-span-1 space-y-6">
              <div className="sticky top-24 space-y-6 animate-fadeInUp" style={{ animationDelay: '150ms' }}>

                {/* Quick Stats Grid */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white shadow-lg shadow-slate-200/40 p-1">
                  <div className="grid grid-cols-2 gap-px bg-slate-100/50 rounded-xl overflow-hidden">
                    {[
                      { label: 'สถานที่', value: job.location || 'ไม่ระบุ' },
                      { label: 'เบี้ยเลี้ยง', value: job.allowance_amount ? `${job.allowance_amount.toLocaleString()} บ.` : 'ตามตกลง', sub: job.allowance_type === 'daily' ? '/วัน' : job.allowance_amount ? '/เดือน' : '' },
                      { label: 'งานประเภท', value: job.job_type || 'ฝึกงาน' },
                      { label: 'รับตำแหน่งนี้', value: job.positions_available || 1, sub: 'คน' },
                      { label: 'สมัครมาแล้ว', value: job.applications_count || 0, sub: 'คน', colSpan: true },
                    ].map((stat, idx) => (
                      <div key={idx} className={`bg-white p-4 hover:bg-sky-50/30 transition-colors${stat.colSpan ? ' col-span-2' : ''}`}>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className="text-sm font-bold text-slate-900">{stat.value} <span className="text-xs font-medium text-slate-500">{stat.sub}</span></p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Application Section */}
                {user?.user_type === 'Student' && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center mb-4 ring-4 ring-white shadow-inner">
                      <svg className="w-8 h-8 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-1">สนใจร่วมงานกับเรา?</h3>
                    <p className="text-sm text-slate-500 mb-6">ยื่นเรซูเม่ให้ระบบ AI วิเคราะห์หาความเหมาะสมได้ทันที</p>

                    {job.is_active ? (
                      <div className="w-full space-y-3">
                        <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 text-sm font-bold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]" onClick={() => { if (guardApply()) { loadLinkedCerts(); setShowApplyModal(true); } }}>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          ยื่นใบสมัครเลย
                        </button>
                        <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 px-6 py-3 text-sm font-bold transition-all disabled:opacity-50" onClick={() => { if (guardAnalyze()) handleAnalyzeMatch(); }} disabled={analyzingMatch}>
                          {analyzingMatch ? (
                            <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>กำลังวิเคราะห์...</>
                          ) : (
                            <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg> เช็คเปอร์เซ็นต์ความเหมาะสม</>
                          )}
                        </button>
                        {error?.includes('404') && (
                          <p className="text-[11px] text-rose-500 font-medium text-center bg-rose-50 p-2 rounded-lg border border-rose-100 mt-2 flex items-center justify-center gap-1.5">
                            {Icons.Warning} ฟีเจอร์วิเคราะห์ความเหมาะสมกำลังปรับปรุง (Backend Error 404)
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="w-full py-4 bg-slate-100 rounded-xl text-slate-500 font-semibold text-sm border border-slate-200">
                        ตำแหน่งนี้ปิดรับสมัครแล้ว
                      </div>
                    )}
                  </div>
                )}

                {/* Match Result Display */}
                {matchAnalysis && (
                  <div className={`rounded-2xl border p-6 flex flex-col items-center text-center animate-fadeInUp shadow-sm ${matchLevelStyle}`} style={{ animationDelay: '50ms' }}>
                    <div className="relative w-24 h-24 mb-4">
                      {/* Decorative radial pulse matching the ring color */}
                      <div className="absolute inset-0 rounded-full blur-xl opacity-20 bg-current pattern-pulse" />
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="opacity-20" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${matchAnalysis.score * 2.827} 282.7`} strokeLinecap="round" className="animate-[drawRing_1.5s_ease-out_forwards]" style={{ '--offset': `${matchAnalysis.score * 2.827}`, '--circumference': '0' }} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-2xl font-black">{Math.round(matchAnalysis.score)}<span className="text-sm font-bold">%</span></span>
                      </div>
                    </div>
                    <h3 className="text-lg font-extrabold mb-1">{matchLabel}</h3>
                    <p className="text-sm font-medium opacity-90 leading-relaxed text-balance">{matchAnalysis.reason}</p>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Apply Panel (Option C) */}
      <div
        className={`fixed inset-0 z-[9999] transition-opacity duration-300 ${showApplyModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!showApplyModal}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => !applying && setShowApplyModal(false)}
        />

        {/* Sliding Panel */}
        <div
          className={`absolute inset-y-0 right-0 w-full md:w-[480px] max-w-full bg-white shadow-2xl flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${showApplyModal ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {applySuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center bg-emerald-50/50">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
                <svg className="w-12 h-12 text-emerald-500 animate-[drawRing_1s_ease-out_forwards]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" strokeDasharray="24" strokeDashoffset="0" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-4 tracking-tight">สมัครงานสำเร็จ!</h3>
              <p className="text-slate-500 text-base">ระบบส่งใบสมัครของคุณให้ HR เรียบร้อยแล้ว</p>
              <button
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 text-sm font-bold shadow-sm transition-all"
                onClick={() => { setShowApplyModal(false); setApplySuccess(false); }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-xl shrink-0 z-10 sticky top-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">สมัครงาน</h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                    <span className="truncate max-w-[200px] inline-block">{job.title}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-sky-600 font-medium">{job.company_name}</span>
                  </p>
                </div>
                <button
                  className="p-2 -mr-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                  onClick={() => setShowApplyModal(false)}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-slate-50/50">
                <form id="apply-form" onSubmit={handleApply} className="space-y-6">

                  {/* Match Banner (If analyzed) */}
                  {matchAnalysis && (
                    <div className={`p-4 rounded-xl border flex items-center gap-4 ${matchAnalysis.score >= 80 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : matchAnalysis.score >= 50 ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold text-lg bg-white shadow-sm ring-1 ${matchAnalysis.score >= 80 ? 'ring-emerald-200 text-emerald-600' : matchAnalysis.score >= 50 ? 'ring-amber-200 text-amber-600' : 'ring-rose-200 text-rose-600'}`}>
                        {Math.round(matchAnalysis.score)}%
                      </div>
                      <div>
                        <p className="font-bold text-sm tracking-tight">{matchAnalysis.score >= 80 ? 'ความเหมาะสมสูงมาก' : matchAnalysis.score >= 50 ? 'คุณสมบัติน่าสนใจ' : 'อาจมีประสบการณ์ไม่ตรงพอ'}</p>
                        <p className="text-xs opacity-80 mt-0.5" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{matchAnalysis.reason}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 group">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-widest flex justify-between items-baseline">
                      จดหมายแนะนำตัว
                      <span className="text-slate-400 normal-case font-medium tracking-normal text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
                    </label>
                    <div className="relative">
                      <textarea
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all resize-none group-hover:border-slate-300"
                        rows={5}
                        placeholder="ทำไมคุณถึงสนใจตำแหน่งนี้ เล่าให้เราฟังหน่อยสิ..."
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                        maxLength={1500}
                      />
                      <div className="absolute bottom-3 right-3 text-[10px] font-medium text-slate-400 bg-white/80 px-1 backdrop-blur-sm">
                        {coverLetter.length}/1500
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 group">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-widest flex justify-between items-baseline">
                      Portfolio URL
                      <span className="text-slate-400 normal-case font-medium tracking-normal text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-slate-400">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                      </div>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all group-hover:border-slate-300"
                        type="url"
                        placeholder="https://github.com/..."
                        value={portfolioUrl}
                        onChange={e => setPortfolioUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Linked Certs Banner */}
                  {linkedCertUrls.length > 0 && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                      <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>
                      <div>
                        <p className="text-xs font-bold text-amber-800">ตรวจพบใบรับรอง {linkedCertUrls.length} ใบ ที่อัปโหลดไว้แล้ว</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">ระบบจะนำใบรับรองเหล่านี้ส่งไปพร้อมใบสมัครโดยอัตโนมัติ — ไม่ต้องแนบซ้ำ!</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-widest flex justify-between items-baseline">
                      แนบใบ Certificate
                      <span className="text-slate-400 normal-case font-medium tracking-normal text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">Max 3 Files</span>
                    </label>
                    {certFiles.length < 3 && (
                      <div
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer py-8 px-4 transition-all duration-200 ${certDragging ? 'border-sky-400 bg-sky-50 scale-[0.98]' : 'border-slate-300 hover:border-sky-300 hover:bg-sky-50/50 bg-white'}`}
                        onDragEnter={e => { e.preventDefault(); setCertDragging(true); }}
                        onDragLeave={e => { e.preventDefault(); setCertDragging(false); }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); setCertDragging(false); addCertFiles(e.dataTransfer.files); }}
                        onClick={() => certInputRef.current?.click()}
                      >
                        <input ref={certInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple className="hidden" onChange={e => addCertFiles(e.target.files)} />
                        <div className={`p-3 rounded-full mb-1 ${certDragging ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400 group-hover:text-sky-500'}`}>
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        </div>
                        <p className="text-sm text-slate-600 font-medium">ลากไฟล์มาวาง หรือคลิกเบาๆ</p>
                        <p className="text-[11px] text-slate-400 font-medium tracking-wide">JPG, PNG, PDF (≤10MB)</p>
                      </div>
                    )}

                    {certFiles.length > 0 && (
                      <div className="mt-4 space-y-2.5">
                        {certFiles.map((file, i) => (
                          <div key={i} className="group relative flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm hover:border-sky-200 hover:shadow-md transition-all">
                            <div className="shrink-0 p-2 bg-slate-50 rounded-lg group-hover:bg-sky-50 transition-colors">
                              {isPdf(file.name) ? (
                                <svg className="w-5 h-5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
                              ) : (
                                <svg className="w-5 h-5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{formatSize(file.size)}</p>
                            </div>
                            <button type="button" className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0" onClick={() => removeCertFile(i)}>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* Footer Actions */}
              <div className="shrink-0 border-t border-slate-200 p-6 bg-white flex flex-col-reverse sm:flex-row gap-3 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-600 text-sm font-bold transition-all active:scale-[0.98]"
                  onClick={() => setShowApplyModal(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  form="apply-form"
                  className="w-full relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-8 py-3 text-sm font-bold transition-all shadow-lg shadow-sky-600/20 hover:shadow-sky-500/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                  disabled={applying || uploadingCerts}
                >
                  {applying || uploadingCerts ? (
                    <>
                      <div className="absolute inset-0 bg-sky-700/50 flex items-center justify-center backdrop-blur-sm z-10">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      </div>
                      <span className="opacity-0">กำลังดำเนินการ...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10 flex items-center gap-2">
                        <svg className="w-4 h-4 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        ยื่นใบสมัครเลย
                      </span>
                      {/* Subtly animated highlight line atop button */}
                      <div className="absolute top-0 inset-x-0 h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* ── No-Analysis Guard Modal (Student without resume) ── */}
      {showNoAnalysisModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={() => setShowNoAnalysisModal(false)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 text-center animate-fadeInUp" onClick={e => e.stopPropagation()}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">ยังไม่มีผลประมวลผล Resume</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              กรุณาอัปโหลดและประมวลผล Resume ก่อนสมัครงาน<br />ระบบจะวิเคราะห์ความเหมาะสมให้คุณโดยอัตโนมัติ
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="flex-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 text-sm font-bold transition-colors"
                onClick={() => setShowNoAnalysisModal(false)}
              >
                ยกเลิก
              </button>
              <button
                className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 text-sm font-bold transition-colors shadow-md"
                onClick={() => { setShowNoAnalysisModal(false); navigate('/student/resume'); }}
              >
                ไปประมวลผล Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Role Guard Modal (HR / Admin) ── */}
      {showRoleGuardModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={() => setShowRoleGuardModal(false)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 text-center animate-fadeInUp" onClick={e => e.stopPropagation()}>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 mx-auto mb-4">
              <svg className="w-8 h-8 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">ไม่สามารถดำเนินการได้</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">{roleGuardMsg}</p>
            <button
              className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-sm font-bold transition-colors"
              onClick={() => setShowRoleGuardModal(false)}
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;