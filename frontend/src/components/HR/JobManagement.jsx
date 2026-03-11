// frontend/src/components/HR/JobManagement.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

const renderIcon = (name, className = "w-5 h-5") => {
  switch (name) {
    case 'ClipboardList': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>;
    case 'Users': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'Eye': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'Edit': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>;
    case 'Trash': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;
    case 'X': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
    case 'MoreHorizontal': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>;
    default: return null;
  }
};

const JobManagement = () => {
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notify = useNotification();

  const adminCompanyId = searchParams.get('company_id');
  const isAdminView = user?.user_type === 'Admin' && !!adminCompanyId;
  const buildPath = (base) => isAdminView ? `${base}?company_id=${adminCompanyId}` : base;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const jobsPerPage = 10;

  const [selectedJob, setSelectedJob] = useState(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  const openSlideOver = (job) => { setSelectedJob(job); setIsSlideOverOpen(true); };
  const closeSlideOver = () => { setIsSlideOverOpen(false); setTimeout(() => setSelectedJob(null), 300); };

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return; }
    if (!user || (user.user_type !== 'HR' && user.user_type !== 'Admin')) {
      notify.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/');
      return;
    }
    loadJobs(true);

    // Option B: Background Poll every 30 seconds (Silent Update)
    const intervalId = setInterval(() => {
      loadJobs(false);
    }, 30000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, navigate, currentPage, searchTerm, filterDepartment, filterStatus]);

  const loadJobs = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
        setError('');
      }
      const params = new URLSearchParams({ skip: ((currentPage - 1) * jobsPerPage).toString(), limit: jobsPerPage.toString() });
      if (searchTerm) params.append('search', searchTerm);
      if (filterDepartment) params.append('department', filterDepartment);
      if (filterStatus !== '') params.append('is_active', filterStatus === 'active' ? 'true' : 'false');
      if (isAdminView) params.append('company_id', adminCompanyId);

      const response = await fetch(`http://172.18.148.97:8000/api/jobs/my-company?${params}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const result = await response.json();
        setJobs(result.jobs || []);
        setTotalJobs(result.total_count || (result.jobs || []).length);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'เกิดข้อผิดพลาดในการโหลดข้อมูลงาน');
        setJobs([]); setTotalJobs(0);
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์: ' + error.message);
      setJobs([]); setTotalJobs(0);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      setDeleteLoading(true);
      const response = await fetch(`http://172.18.148.97:8000/api/jobs/${jobId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (response.ok) {
        setJobs(jobs.filter(job => job.id !== jobId));
        setShowDeleteModal(null);
        notify.success('ลบตำแหน่งงานเรียบร้อยแล้ว');
      } else {
        const errorData = await response.json();
        notify.error(errorData.detail || 'เกิดข้อผิดพลาดในการลบตำแหน่งงาน');
      }
    } catch (error) {
      notify.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleJobStatus = async (jobId, currentStatus) => {
    try {
      const response = await fetch(`http://172.18.148.97:8000/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (response.ok) {
        const updatedJobs = jobs.map(job => job.id === jobId ? { ...job, is_active: !currentStatus } : job);
        setJobs(updatedJobs);
        if (selectedJob && selectedJob.id === jobId) setSelectedJob({ ...selectedJob, is_active: !currentStatus });
      } else {
        const errorData = await response.json();
        notify.error(errorData.detail || 'เกิดข้อผิดพลาดในการอัพเดตสถานะ');
      }
    } catch (error) {
      notify.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatAllowance = (amount, type) => {
    if (!amount) return 'ไม่ระบุ';
    return `${amount.toLocaleString()} ${type === 'daily' ? 'บาท/วัน' : 'บาท/เดือน'}`;
  };

  const totalPages = Math.ceil(totalJobs / jobsPerPage);
  const departments = [...new Set(jobs.map(job => job.department))].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors" onClick={() => navigate(isAdminView ? `/hr/dashboard?company_id=${adminCompanyId}` : '/hr/dashboard')} aria-label="กลับ">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">จัดการตำแหน่งงาน</h1>
              <p className="text-slate-500 text-sm mt-0.5">จัดการตำแหน่งฝึกงานทั้งหมดของบริษัท</p>
            </div>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-500 transition-colors whitespace-nowrap"
            onClick={() => navigate(buildPath('/hr/jobs/create'))}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14m-7-7h14" /></svg>
            สร้างตำแหน่งใหม่
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-5 mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            </span>
            <input
              type="text"
              placeholder="ค้นหาตำแหน่งงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/50 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700 hover:border-slate-300"
            />
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/50 focus:bg-white outline-none text-slate-600 font-medium cursor-pointer transition-all hover:border-slate-300"
          >
            <option value="">ทุกแผนก</option>
            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/50 focus:bg-white outline-none text-slate-600 font-medium cursor-pointer transition-all hover:border-slate-300"
          >
            <option value="">ทุกสถานะ</option>
            <option value="active">เปิดรับสมัคร</option>
            <option value="inactive">ปิดรับสมัคร</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm font-medium animate-fadeInUp">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            {error}
          </div>
        )}

        {/* Table / Loading */}
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="large" message="กำลังโหลดข้อมูลงาน..." /></div>
        ) : (
          <>
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden mb-6 relative">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      {['ตำแหน่งงาน', 'ประเภท/สถานที่', 'จำนวนแอป', 'สถานะ', ''].map((h, i) => (
                        <th key={i} className={`px-3 sm:px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap
                          ${i === 1 ? 'hidden sm:table-cell' : ''}
                          ${i === 2 ? 'hidden md:table-cell' : ''}
                          ${i === 4 ? 'w-16' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 shadow-inner">
                              {renderIcon('ClipboardList', 'w-10 h-10')}
                            </div>
                            <div>
                              <p className="text-slate-600 font-bold text-lg mb-1">ยังไม่มีตำแหน่งงานเปิดรับ</p>
                              <p className="text-slate-400 font-medium text-sm">เริ่มสร้างประกาศรับสมัครงานใบแรกเพื่อค้นหาผู้สมัครที่ใช่</p>
                            </div>
                            <button className="mt-2 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-500 transition-colors" onClick={() => navigate(buildPath('/hr/jobs/create'))}>
                              สร้างตำแหน่งใหม่คลิกที่นี่
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job, index) => (
                        <tr
                          key={job.id}
                          className={`group hover:bg-sky-50/40 transition-all cursor-pointer animate-fadeInUp ${!job.is_active ? 'opacity-70' : ''} ${selectedJob?.id === job.id ? 'bg-sky-50/60 ring-1 ring-inset ring-sky-200' : ''}`}
                          style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                          onClick={() => openSlideOver(job)}
                        >
                          <td className="px-3 sm:px-6 py-5">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-colors group-hover:bg-white ${job.is_active ? 'bg-sky-50/80 text-sky-600 border border-sky-100' : 'bg-slate-50 border border-slate-200 text-slate-500'}`}>
                                <span className="font-bold text-base sm:text-lg leading-none pt-0.5">{job.title.charAt(0)}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-sky-700 transition-colors truncate max-w-[140px] sm:max-w-none">{job.title}</div>
                                <div className="text-sm font-medium text-slate-500 mt-1">{job.department}</div>
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-5">
                            <div className="text-slate-800 font-bold mb-1">{job.job_type}</div>
                            <div className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                              {job.location}
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-6 py-5">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-black tracking-tight text-slate-800">{job.applications_count}</span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">ใบสมัคร</span>
                                {job.applications_count > 0 && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1"></span>}
                              </div>
                              <div className="text-sm font-medium text-slate-600">
                                รับแล้ว <span className="text-emerald-600 font-extrabold">{job.positions_filled}</span> / {job.positions_available} ตำแหน่ง
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5" onClick={(e) => e.stopPropagation() /* Prevent opening drawer when clicking toggle */}>
                            <button
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-2 ${job.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                              role="switch"
                              aria-checked={job.is_active}
                              title={job.is_active ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                              onClick={() => toggleJobStatus(job.id, job.is_active)}
                            >
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${job.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span className="ml-3 text-sm font-bold text-slate-600 select-none hidden sm:inline-block">
                              {job.is_active ? 'เปิดอยู่' : 'ปิดรับ'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right w-16">
                            <div className="p-2 -mr-2 rounded-xl text-sky-600 bg-sky-50 border border-sky-100 group-hover:bg-sky-100 group-hover:text-sky-700 group-hover:border-sky-200 transition-all shadow-sm flex items-center justify-center">
                              {renderIcon('ChevronRight', 'w-5 h-5')}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-3">
                <button
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >← ก่อนหน้า</button>
                <span className="text-sm text-slate-600 font-medium">หน้า {currentPage} จาก {totalPages} <span className="text-slate-400">({totalJobs} รายการ)</span></span>
                <button
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >ถัดไป →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Slide-over Panel (Drawer) for Job Details */}
      <div className={`relative z-50 ${isSlideOverOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
        {/* Dark overlay backdrop — starts below navbar */}
        <div
          className={`fixed top-16 inset-x-0 bottom-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ease-out ${isSlideOverOpen ? 'opacity-100 block' : 'opacity-0 hidden delay-300'}`}
        />

        <div className="fixed top-16 inset-x-0 bottom-0 overflow-hidden" onClick={closeSlideOver}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed top-16 bottom-0 right-0 flex max-w-full pl-10 sm:pl-16">

              {/* Drawer Content */}
              <div
                className={`pointer-events-auto w-screen max-w-md transform transition duration-300 ease-in-out ${isSlideOverOpen ? 'translate-x-0' : 'translate-x-full'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex h-full flex-col overflow-y-scroll bg-white/95 backdrop-blur-xl shadow-2xl border-l border-white/60">

                  {/* Header */}
                  <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-start justify-between">
                      <div className="pr-4">
                        <h2 className="text-xl font-black text-slate-900 leading-tight" id="slide-over-title">
                          {selectedJob?.title || 'Loading...'}
                        </h2>
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 font-medium">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${selectedJob?.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-50 text-slate-600 ring-slate-500/20'}`}>
                            {selectedJob?.is_active ? 'กำลังเปิดรับสมัคร' : 'ปิดรับสมัครชั่วคราว'}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          <span className="text-xs font-bold">{selectedJob?.department}</span>
                        </div>
                      </div>
                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          className="relative rounded-full p-2 bg-white text-slate-400 hover:text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 transition-all focus:outline-none focus:ring-sky-500/50 cursor-pointer"
                          onClick={closeSlideOver}
                        >
                          <span className="absolute -inset-2.5" />
                          <span className="sr-only">Close panel</span>
                          {renderIcon('X', 'w-5 h-5')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="relative flex-1 px-6 py-8">
                    {selectedJob && (
                      <div className="flex flex-col h-full gap-8">

                        {/* Core Stats Overview */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-100/50 flex flex-col justify-between min-w-0">
                            <div className="flex items-center gap-1.5 mb-2 text-sky-700">
                              {renderIcon('Users', 'w-4 h-4')}
                              <span className="text-[11px] font-bold uppercase tracking-widest leading-tight">ใบสมัครงาน</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{selectedJob.applications_count}</div>
                          </div>

                          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50 flex flex-col justify-between min-w-0">
                            <div className="flex items-center gap-1.5 mb-2 text-emerald-700">
                              {renderIcon('ClipboardList', 'w-4 h-4')}
                              <span className="text-[11px] font-bold uppercase tracking-widest leading-tight">จำนวนที่รับ</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1 tracking-tight">
                              <span>{selectedJob.positions_filled}</span>
                              <span className="text-sm text-slate-500 font-bold tracking-normal">/ {selectedJob.positions_available}</span>
                            </div>
                          </div>
                        </div>

                        {/* Details List */}
                        <div>
                          <h3 className="text-xs font-black text-slate-400 mb-5 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1 h-3 bg-slate-200 rounded-full inline-block"></span>
                            รายละเอียดงานพื้นฐาน
                          </h3>
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-5 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                            <div className="sm:col-span-1">
                              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide">ประเภทงาน</dt>
                              <dd className="mt-1.5 text-sm font-bold text-slate-800">{selectedJob.job_type}</dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide">เบี้ยเลี้ยง</dt>
                              <dd className="mt-1.5 text-sm font-bold text-slate-800">{formatAllowance(selectedJob.allowance_amount, selectedJob.allowance_type)}</dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide">สถานที่ทำงาน</dt>
                              <dd className="mt-1.5 text-sm font-bold text-slate-800">{selectedJob.location}</dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-xs font-bold text-slate-400 uppercase tracking-wide">วันที่ประกาศ</dt>
                              <dd className="mt-1.5 text-sm font-bold text-slate-800">{formatDate(selectedJob.created_at)}</dd>
                            </div>
                          </dl>
                        </div>

                        {/* Action Buttons Hub */}
                        <div className="mt-auto">
                          <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1 h-3 bg-indigo-200 rounded-full inline-block"></span>
                            การดำเนินการ (Actions)
                          </h3>
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => navigate(isAdminView ? `/hr/jobs/${selectedJob.id}/applicants?company_id=${adminCompanyId}` : `/hr/jobs/${selectedJob.id}/applicants`)}
                              className="w-full flex justify-between items-center px-5 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-md hover:shadow-lg cursor-pointer group"
                            >
                              <div className="flex items-center gap-3">
                                {renderIcon('Users', 'w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform')}
                                คัดกรองผู้สมัครด่วน
                              </div>
                              {selectedJob.applications_count > 0 ? (
                                <span className="bg-indigo-500/30 text-indigo-100 text-xs px-2.5 py-1 rounded-lg border border-indigo-400/20">{selectedJob.applications_count} รายการ</span>
                              ) : (
                                <span className="text-slate-400">{renderIcon('ChevronRight', 'w-5 h-5')}</span>
                              )}
                            </button>

                            <div className="grid grid-cols-2 gap-3 mt-1">
                              <button
                                onClick={() => navigate(isAdminView ? `/hr/jobs/${selectedJob.id}?company_id=${adminCompanyId}` : `/hr/jobs/${selectedJob.id}`)}
                                className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-2xl font-bold transition-all shadow-sm cursor-pointer"
                              >
                                {renderIcon('Eye', 'w-4 h-4')}
                                ดูประกาศ
                              </button>
                              <button
                                onClick={() => navigate(isAdminView ? `/hr/jobs/${selectedJob.id}/edit?company_id=${adminCompanyId}` : `/hr/jobs/${selectedJob.id}/edit`)}
                                className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-2xl font-bold transition-all shadow-sm cursor-pointer"
                              >
                                {renderIcon('Edit', 'w-4 h-4')}
                                แก้ไขข้อมูล
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                closeSlideOver();
                                setTimeout(() => setShowDeleteModal(selectedJob), 300);
                              }}
                              className="w-full mt-4 flex justify-center items-center gap-2 px-4 py-3 bg-transparent border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl font-bold transition-all cursor-pointer"
                            >
                              {renderIcon('Trash', 'w-4 h-4')}
                              ลบตำแหน่งงานนี้อย่างถาวร
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setShowDeleteModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">ยืนยันการลบ</h3>
            <p className="text-slate-600 text-center text-sm mb-1">คุณต้องการลบตำแหน่งงาน <strong>"{showDeleteModal.title}"</strong> ใช่หรือไม่?</p>
            <p className="text-rose-600 text-center text-xs font-medium mb-6">การลบนี้ไม่สามารถกู้คืนได้</p>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                onClick={() => setShowDeleteModal(null)}
                disabled={deleteLoading}
              >ยกเลิก</button>
              <button
                className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                onClick={() => handleDeleteJob(showDeleteModal.id)}
                disabled={deleteLoading}
              >
                {deleteLoading ? <><LoadingSpinner size="small" /> กำลังลบ...</> : 'ลบตำแหน่งงาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagement;