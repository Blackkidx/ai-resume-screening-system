// frontend/src/components/HR/HRDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import companyService from '../../services/companyService';
import jobService from '../../services/jobService';
import { useNotification } from '../../contexts/NotificationContext';
import { API_BASE_URL } from '../../config';

const AnimatedNumber = ({ end, isPercent }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const numEnd = parseFloat(end);
    if (isNaN(numEnd) || numEnd === 0) {
      setCount(0);
      return;
    }
    const duration = 1200;
    const steps = 60;
    const stepTime = Math.abs(Math.floor(duration / steps));
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep += 1;
      const progress = currentStep / steps;
      // easeOut function
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(numEnd * easing);

      if (currentStep >= steps) {
        setCount(numEnd);
        clearInterval(interval);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [end]);

  return <>{isPercent ? count.toFixed(1) : Math.round(count)}{isPercent ? '%' : ''}</>;
};

const HRDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notify = useNotification();

  // Admin อาจส่ง ?company_id=xxx มาเพื่อดู Dashboard ของบริษัทอื่น
  const adminCompanyId = searchParams.get('company_id');
  const isAdminView = user?.user_type === 'Admin' && !!adminCompanyId;

  const [companyInfo, setCompanyInfo] = useState(null);
  const [jobStats, setJobStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return; }
    if (!user || (user.user_type !== 'HR' && user.user_type !== 'Admin')) {
      notify.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, user, navigate, adminCompanyId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // ถ้า Admin ส่ง company_id มา → โหลดข้อมูลบริษัทนั้น
      if (isAdminView) {
        const companyResult = await companyService.getCompanyById(adminCompanyId);
        if (companyResult.success) setCompanyInfo(companyResult.data);
        else setError(companyResult.error || 'ไม่พบข้อมูลบริษัท');
      } else {
        const companyResult = await companyService.getMyCompanyInfo();
        if (companyResult.success) setCompanyInfo(companyResult.data);
        else setError(companyResult.error);
      }
      const statsResult = await jobService.getDetailedAnalytics(isAdminView ? adminCompanyId : null);
      if (statsResult.success) setJobStats(statsResult.data);
    } catch {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-sky-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
          <svg className="h-12 w-12 text-rose-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
          <h2 className="text-xl font-bold text-slate-900 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-500 transition-colors" onClick={() => navigate('/')}>
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const summary = jobStats?.summary;
  const isAdmin = user?.user_type === 'Admin';
  const company = isAdminView ? companyInfo : companyInfo?.company;

  const stats = [
    { label: 'ตำแหน่งงาน', value: summary?.total_jobs ?? 0, icon: 'briefcase', color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'ใบสมัครทั้งหมด', value: summary?.total_applications ?? 0, icon: 'file', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'รอพิจารณา', value: summary?.total_pending ?? 0, icon: 'clock', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'อัตราการรับ', value: summary ? summary.acceptance_rate : 0, isPercent: true, icon: 'check', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const buildPath = (base) => isAdminView ? `${base}?company_id=${adminCompanyId}` : base;

  const quickActions = [
    { label: 'สร้างตำแหน่งใหม่', desc: 'เพิ่มตำแหน่งฝึกงานใหม่', path: buildPath('/hr/jobs/create'), icon: 'Plus' },
    { label: 'จัดการตำแหน่งงาน', desc: 'ดู แก้ไข และจัดการทั้งหมด', path: buildPath('/hr/jobs'), icon: 'FolderDot' },
    { label: 'ดูสถิติ', desc: 'ติดตามผลการสรรหาเชิงลึก', path: buildPath('/hr/analytics'), icon: 'BarChart' },
    { label: 'ค้นหาผู้สมัคร', desc: 'ค้นหาและกรองทุกตำแหน่ง', path: buildPath('/hr/search'), icon: 'Search' },
    { label: 'ข้อมูลบริษัท', desc: 'ดูข้อมูลพื้นฐานของบริษัท', path: buildPath('/hr/company'), icon: 'Building2' },
    { label: 'จัดการผู้สมัคร', desc: 'ดูและจัดการใบสมัคร', path: buildPath('/hr/jobs'), icon: 'Users' },
  ];

  const renderIcon = (name) => {
    switch (name) {
      case 'Plus': return <svg className="w-7 h-7 text-sky-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
      case 'FolderDot': return <svg className="w-7 h-7 text-indigo-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /><circle cx="12" cy="13" r="2" /></svg>;
      case 'BarChart': return <svg className="w-7 h-7 text-amber-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>;
      case 'Search': return <svg className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
      case 'Building2': return <svg className="w-7 h-7 text-purple-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>;
      case 'Users': return <svg className="w-7 h-7 text-rose-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 relative overflow-hidden">
      {/* Background SVG grid pattern for 2026 feel */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-sky-200/20 blur-3xl z-0 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">

        {/* Admin-View Banner */}
        {isAdminView && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 animate-fadeInDown">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">Admin Mode — กำลังดู Dashboard ของ</p>
                <p className="text-sm text-amber-700 font-semibold">{companyInfo?.name || companyInfo?.company?.name || 'บริษัทนี้'}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              กลับ Admin Dashboard
            </button>
          </div>
        )}

        {/* Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-fadeInDown">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 shrink-0 overflow-hidden">
              {isAdmin && !isAdminView ? (
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ) : company?.logo_url ? (
                <img
                  src={`${API_BASE_URL}${company.logo_url}`}
                  alt={company.name}
                  className="h-full w-full object-cover"
                  onError={e => e.target.style.display = 'none'}
                />
              ) : (
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{isAdmin && !isAdminView ? 'Admin Dashboard' : 'HR Dashboard'}</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {isAdmin && !isAdminView ? 'คุณมีสิทธิ์เข้าถึงฟีเจอร์ทั้งหมดของระบบ' : company ? `${company.name} — ${company.industry || ''}` : 'ระบบจัดการตำแหน่งฝึกงาน'}
              </p>
            </div>
          </div>
          {isAdmin && !isAdminView && (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-500 transition-colors whitespace-nowrap"
              onClick={() => navigate('/admin/dashboard')}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Admin Panel
            </button>
          )}
        </div>

        {/* Stats Row */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 animate-fadeInUp hover:shadow-md transition-shadow" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg} ${s.color} shrink-0`}>
                  {s.icon === 'briefcase' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>}
                  {s.icon === 'file' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>}
                  {s.icon === 'clock' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                  {s.icon === 'check' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>}
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold text-slate-900">
                    <AnimatedNumber end={s.value} isPercent={s.isPercent} />
                  </div>
                  <div className="text-sm text-slate-500 truncate">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Alert Banner */}
        {summary && (company || isAdmin) && summary.total_pending > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3 text-amber-800 font-medium">
              <svg className="w-5 h-5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <span>มีใบสมัคร <strong className="font-bold">{summary.total_pending}</strong> ใบรอการพิจารณา</span>
            </div>
            <button
              className="whitespace-nowrap rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 px-4 py-2 text-sm font-semibold transition-colors"
              onClick={() => navigate(buildPath('/hr/jobs'))}
            >
              ดูใบสมัคร →
            </button>
          </div>
        )}

        {/* Quick Actions */}
        {(company || isAdmin) && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">เมนูหลัก</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  className="group bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-left hover:shadow-md hover:border-sky-300 transition-all cursor-pointer animate-fadeInUp"
                  style={{ animationDelay: `${0.3 + (i * 0.1)}s`, animationFillMode: 'both' }}
                  onClick={() => navigate(action.path)}
                >
                  <div className="mb-4 bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 group-hover:border-sky-200 group-hover:bg-sky-50 transition-colors">
                    {renderIcon(action.icon)}
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{action.label}</h3>
                  <p className="text-sm text-slate-500 mt-1">{action.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Getting Started - no company assigned yet */}
        {companyInfo && companyInfo.user_type === 'HR' && !company && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center mt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
              <svg className="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">เริ่มต้นใช้งาน</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Admin จะต้องกำหนดให้คุณเป็น HR ของบริษัทก่อน จึงจะสามารถใช้งานฟีเจอร์ต่างๆ ได้</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xs mx-auto">
              {['1. รอการกำหนดบริษัท', '2. เข้าถึงฟีเจอร์ HR', '3. เริ่มจัดการตำแหน่งงาน'].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xs font-bold shrink-0">{i + 1}</span>
                  {step.split('. ')[1]}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRDashboard;