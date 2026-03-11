// frontend/src/components/Companies/Companies.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';

const Companies = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const notify = useNotification();

  const isHROrAdmin = ['HR', 'Admin'].includes(user?.user_type);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Search-as-you-type: debounce 400ms
  useEffect(() => {
    const timer = setTimeout(() => { loadJobs(searchInput); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Initial load on mount
  useEffect(() => { loadJobs(''); }, []);

  const loadJobs = async (q = '') => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ skip: '0', limit: '50' });
      if (q) params.append('search', q);
      const res = await fetch(`${API_BASE_URL}/api/jobs?${params}`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลงานได้');
      setJobs(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requireAuth = (path, cb) => {
    if (!isAuthenticated()) { notify.warning('กรุณาเข้าสู่ระบบก่อน'); navigate('/login', { state: { from: { pathname: path } } }); return; }
    cb();
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-sky-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-500 font-medium">กำลังโหลดตำแหน่งงาน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 animate-fadeInUp">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 border border-sky-200 px-4 py-1.5 text-sm font-semibold text-sky-700 mb-5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            ตำแหน่งฝึกงานทั้งหมด
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            ค้นหา<span className="text-sky-600">ตำแหน่งฝึกงาน</span>ที่ใช่สำหรับคุณ
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            เรียกดูตำแหน่งงานจากบริษัทชั้นนำ พร้อมระบบ AI จับคู่อัตโนมัติ
          </p>

          {/* Search Bar — search as you type */}
          <div className="mt-8 max-w-xl mx-auto relative group/search">
            <div className="relative flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 focus-within:ring-4 focus-within:ring-sky-500/20 focus-within:border-sky-500 focus-within:shadow-md transition-all duration-300 overflow-hidden pr-2">
              <svg className="absolute left-4 text-slate-400 w-5 h-5 group-focus-within/search:text-sky-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="ค้นหาบริษัท, ตำแหน่งงาน, ทักษะ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 pl-11 pr-4 py-3.5 text-sm outline-none bg-transparent text-slate-800 placeholder:text-slate-400"
              />
              {searchInput && (
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  onClick={() => setSearchInput('')}
                  title="ล้างการค้นหา"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              )}
            </div>
            {searchInput && (
              <p className="mt-2 text-center text-xs text-slate-400 font-medium">
                ผลการค้นหา: <strong className="text-slate-700">"{searchInput}"</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
        {/* Result count */}
        {!error && jobs.length > 0 && (
          <p className="text-sm text-slate-500 font-medium mb-5">
            พบ <strong className="text-slate-900">{jobs.length}</strong> ตำแหน่ง
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-4 bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
            <svg className="w-5 h-5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="flex-1 text-sm text-rose-700 font-medium">{error}</p>
            <button
              className="text-sm font-bold text-rose-600 hover:text-rose-800 transition-colors"
              onClick={loadJobs}
            >ลองอีกครั้ง</button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && jobs.length === 0 && (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-5">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">ไม่พบตำแหน่งงาน</h3>
            <p className="text-slate-500 mb-6">ลองค้นหาด้วยคำอื่น หรือดูตำแหน่งงานทั้งหมด</p>
            {searchInput && (
              <button
                className="rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 text-sm font-bold transition-colors"
                onClick={() => { setSearchInput(''); }}
              >
                แสดงทั้งหมด
              </button>
            )}
          </div>
        )}

        {/* Job Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job, idx) => (
            <div
              key={job.id}
              className={`animate-fadeInUp group bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 ${!job.is_active ? 'opacity-60' : 'border-slate-200 hover:border-sky-200'}`}
              style={{ animationDelay: `${Math.min(150 + idx * 50, 400)}ms` }}
            >
              {/* Top accent bar */}
              <div className={`h-1 w-full ${job.is_active ? 'bg-sky-500' : 'bg-slate-300'}`} />

              {/* Card Top */}
              <div className="p-5 pb-3 flex items-center gap-3">
                {/* Company Logo / Initial */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-sky-100">
                  {job.company_logo ? (
                    <img
                      src={`${API_BASE_URL}${job.company_logo}`}
                      alt={job.company_name}
                      className="h-full w-full object-cover"
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <span
                    className="text-sky-700 text-lg font-black"
                    style={{ display: job.company_logo ? 'none' : 'flex' }}
                  >
                    {job.company_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{job.company_name}</h3>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-0.5 ${job.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${job.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    {job.is_active ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 pb-4 flex-1 flex flex-col gap-3">
                <h4 className="font-bold text-slate-900 text-base leading-snug group-hover:text-sky-600 transition-colors">{job.title}</h4>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-2">
                  {job.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      {job.location}
                    </span>
                  )}
                  {job.job_type && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 border border-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      {job.job_type}
                    </span>
                  )}
                </div>

                {/* Description */}
                {job.description && (
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                    {job.description}
                  </p>
                )}

                {/* Stats: positions available + applicants */}
                <div className="mt-auto pt-2 border-t border-slate-100 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <svg className="w-3.5 h-3.5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    รับ <strong className="text-slate-700">{job.positions_available || 1}</strong> คน
                  </span>
                  <span className="text-slate-200">|</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                    สมัครแล้ว <strong className="text-slate-700">{job.applications_count || 0}</strong> คน
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:scale-[1.02] hover:border-slate-300 text-slate-700 px-3 py-2 text-xs font-semibold transition-all duration-300"
                  onClick={() => requireAuth(`/jobs/${job.id}`, () => navigate(`/jobs/${job.id}`))}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                  ดูรายละเอียด
                </button>
                {/* Show apply button only for Students */}
                {!isHROrAdmin && (
                  job.is_active ? (
                    <button
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 hover:shadow-md hover:-translate-y-0.5 text-white px-3 py-2 text-xs font-bold transition-all duration-300"
                      onClick={() => requireAuth(`/jobs/${job.id}?apply=true`, () => navigate(`/jobs/${job.id}?apply=true`))}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      สมัครงาน
                    </button>
                  ) : (
                    <button className="flex-1 rounded-xl bg-slate-100 text-slate-400 px-3 py-2 text-xs font-semibold cursor-not-allowed" disabled>
                      ปิดรับสมัคร
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Companies;