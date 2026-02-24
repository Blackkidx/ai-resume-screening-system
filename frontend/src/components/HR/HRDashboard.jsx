// frontend/src/components/HR/HRDashboard.jsx — Premium Redesign
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import companyService from '../../services/companyService';
import jobService from '../../services/jobService';
import '../../styles/hr.css';

const HRDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [companyInfo, setCompanyInfo] = useState(null);
  const [jobStats, setJobStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return; }
    if (!user || (user.user_type !== 'HR' && user.user_type !== 'Admin')) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const companyResult = await companyService.getMyCompanyInfo();
      if (companyResult.success) setCompanyInfo(companyResult.data);
      else setError(companyResult.error);

      const statsResult = await jobService.getDetailedAnalytics();
      if (statsResult.success) setJobStats(statsResult.data);
    } catch {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="hr-dashboard">
        <div className="hr-container">
          <div className="hr-loading">
            <div className="loading-ring" />
            <p>กำลังโหลดข้อมูล Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hr-dashboard">
        <div className="hr-container">
          <div className="hr-error-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
            <h2>เกิดข้อผิดพลาด</h2>
            <p>{error}</p>
            <button className="hr-btn primary" onClick={() => navigate('/')}>กลับหน้าหลัก</button>
          </div>
        </div>
      </div>
    );
  }

  const summary = jobStats?.summary;
  const isAdmin = companyInfo?.user_type === 'Admin';
  const company = companyInfo?.company;

  return (
    <div className="hr-dashboard">
      <div className="hr-container">
        {/* Hero Header */}
        <div className="hr-hero">
          <div className="hr-hero-content">
            <div className="hr-hero-icon">
              {isAdmin ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
              )}
            </div>
            <div className="hr-hero-text">
              <h1>{isAdmin ? 'Admin Dashboard' : 'HR Dashboard'}</h1>
              <p>{isAdmin ? 'คุณมีสิทธิ์เข้าถึงฟีเจอร์ทั้งหมดของระบบ' : company ? `${company.name} — ${company.industry || ''}` : 'ระบบจัดการตำแหน่งฝึกงาน'}</p>
            </div>
          </div>
          {isAdmin && (
            <button className="hr-btn primary" onClick={() => navigate('/admin/dashboard')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              Admin Panel
            </button>
          )}
        </div>

        {/* Stats Row */}
        {summary && (
          <div className="hr-stats-row">
            <div className="hr-stat-card">
              <div className="hr-stat-icon jobs">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
              </div>
              <div className="hr-stat-info">
                <span className="hr-stat-num">{summary.total_jobs}</span>
                <span className="hr-stat-label">ตำแหน่งงาน</span>
              </div>
            </div>

            <div className="hr-stat-card">
              <div className="hr-stat-icon apps">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
              </div>
              <div className="hr-stat-info">
                <span className="hr-stat-num">{summary.total_applications}</span>
                <span className="hr-stat-label">ใบสมัครทั้งหมด</span>
              </div>
            </div>

            <div className="hr-stat-card">
              <div className="hr-stat-icon pending">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              </div>
              <div className="hr-stat-info">
                <span className="hr-stat-num">{summary.total_pending}</span>
                <span className="hr-stat-label">รอพิจารณา</span>
              </div>
            </div>

            <div className="hr-stat-card">
              <div className="hr-stat-icon rate">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
              </div>
              <div className="hr-stat-info">
                <span className="hr-stat-num">{summary.acceptance_rate}%</span>
                <span className="hr-stat-label">อัตราการรับ</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {(company || isAdmin) && (
          <div className="hr-actions-section">
            <h2 className="hr-section-title">เมนูหลัก</h2>
            <div className="hr-actions-grid">
              <div className="hr-action-card" onClick={() => navigate('/hr/jobs/create')}>
                <div className="hr-action-icon create">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
                </div>
                <h3>สร้างตำแหน่งใหม่</h3>
                <p>เพิ่มตำแหน่งฝึกงานใหม่</p>
              </div>

              <div className="hr-action-card" onClick={() => navigate('/hr/jobs')}>
                <div className="hr-action-icon manage">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                </div>
                <h3>จัดการตำแหน่งงาน</h3>
                <p>ดู แก้ไข และจัดการทั้งหมด</p>
              </div>

              <div className="hr-action-card" onClick={() => navigate('/hr/analytics')}>
                <div className="hr-action-icon stats">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
                </div>
                <h3>ดูสถิติ</h3>
                <p>ติดตามผลการสรรหาเชิงลึก</p>
              </div>

              <div className="hr-action-card" onClick={() => navigate('/hr/search')}>
                <div className="hr-action-icon search">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                </div>
                <h3>ค้นหาผู้สมัคร</h3>
                <p>ค้นหาและกรองทุกตำแหน่ง</p>
              </div>

              <div className="hr-action-card" onClick={() => navigate('/hr/company')}>
                <div className="hr-action-icon company">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /><path d="M9 9h1" /><path d="M9 13h1" /><path d="M9 17h1" /></svg>
                </div>
                <h3>ข้อมูลบริษัท</h3>
                <p>ดูข้อมูลพื้นฐานของบริษัท</p>
              </div>

              <div className="hr-action-card" onClick={() => navigate('/hr/jobs')}>
                <div className="hr-action-icon applicants">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <h3>จัดการผู้สมัคร</h3>
                <p>ดูและจัดการใบสมัคร</p>
              </div>
            </div>
          </div>
        )}

        {/* Activity / Alerts */}
        {summary && (company || isAdmin) && summary.total_pending > 0 && (
          <div className="hr-alert-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            <span>มีใบสมัคร <strong>{summary.total_pending}</strong> ใบรอการพิจารณา</span>
            <button className="hr-btn small outline" onClick={() => navigate('/hr/jobs')}>ดูใบสมัคร →</button>
          </div>
        )}

        {/* Getting Started */}
        {companyInfo && companyInfo.user_type === 'HR' && !company && (
          <div className="hr-getting-started">
            <div className="hr-gs-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            </div>
            <h3>เริ่มต้นใช้งาน</h3>
            <p>Admin จะต้องกำหนดให้คุณเป็น HR ของบริษัทก่อน จึงจะสามารถใช้งานฟีเจอร์ต่างๆ ได้</p>
            <div className="hr-gs-steps">
              <div className="hr-gs-step"><span>1</span> รอการกำหนดบริษัท</div>
              <div className="hr-gs-step"><span>2</span> เข้าถึงฟีเจอร์ HR</div>
              <div className="hr-gs-step"><span>3</span> เริ่มจัดการตำแหน่งงาน</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRDashboard;