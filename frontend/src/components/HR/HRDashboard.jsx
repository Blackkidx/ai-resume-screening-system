// frontend/src/components/HR/HRDashboard.jsx - Updated with Job Management
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import companyService from '../../services/companyService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import '../../styles/hr.css';

const HRDashboard = () => {
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  
  const [companyInfo, setCompanyInfo] = useState(null);
  const [jobStats, setJobStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ตรวจสอบ permission
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!user || (user.user_type !== 'HR' && user.user_type !== 'Admin')) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, user, navigate]);

  // โหลดข้อมูล Dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // โหลดข้อมูลบริษัท
      const companyResult = await companyService.getMyCompanyInfo();
      if (companyResult.success) {
        setCompanyInfo(companyResult.data);
      } else {
        setError(companyResult.error);
      }

      // โหลดสถิติงาน
      await loadJobStatistics();
      
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard');
    } finally {
      setLoading(false);
    }
  };

  // โหลดสถิติงาน
  const loadJobStatistics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/jobs/statistics/overview', {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const stats = await response.json();
        setJobStats(stats);
      }
    } catch (error) {
      console.error('Error loading job statistics:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" message="กำลังโหลดข้อมูล Dashboard..." />;
  }

  if (error) {
    return (
      <div className="hr-dashboard">
        <div className="hr-container">
          <div className="error-state">
            <h2>เกิดข้อผิดพลาด</h2>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-dashboard">
      <div className="hr-container">
        {/* Header */}
        <div className="hr-header">
          <h1 className="hr-title">HR Dashboard</h1>
          <p className="hr-subtitle">ระบบจัดการตำแหน่งฝึกงานสำหรับ HR</p>
        </div>

        {/* Company Info Card */}
        {companyInfo && (
          <div className="company-info-card">
            {companyInfo.user_type === 'Admin' ? (
              <div className="admin-access-info">
                <div className="company-icon admin">👑</div>
                <div className="company-details">
                  <h2>ผู้ดูแลระบบ (Admin)</h2>
                  <p>คุณมีสิทธิ์เข้าถึงฟีเจอร์ทั้งหมดของระบบ</p>
                  
                  <div className="admin-features">
                    <span className="feature-badge">จัดการผู้ใช้</span>
                    <span className="feature-badge">จัดการบริษัท</span>
                    <span className="feature-badge">จัดการงานทั้งหมด</span>
                    <span className="feature-badge">ดูสถิติระบบ</span>
                  </div>

                  <div className="dashboard-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigate('/admin/dashboard')}
                    >
                      ไปยัง Admin Dashboard
                    </button>
                  </div>
                </div>
              </div>
            ) : companyInfo.company ? (
              <div className="company-access-info">
                <div className="company-icon">🏢</div>
                <div className="company-details">
                  <h2>HR Dashboard</h2>
                  <p>จัดการตำแหน่งงานฝึกงานของบริษัท</p>
                  
                  <div className="company-name-section">
                    <div className="company-name">{companyInfo.company.name}</div>
                    <span className="company-industry">{companyInfo.company.industry}</span>
                  </div>
                  
                  <div className="company-location">{companyInfo.company.location}</div>
                  
                  <div className="hr-features">
                    <span className="feature-badge">สร้างตำแหน่งงาน</span>
                    <span className="feature-badge">คัดกรองผู้สมัคร</span>
                    <span className="feature-badge">จัดการใบสมัคร</span>
                    <span className="feature-badge">ดูสถิติบริษัท</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-company-assigned">
                <p><strong>ยังไม่ได้รับการกำหนดบริษัท</strong></p>
                <p>กรุณารอให้ Admin กำหนดให้คุณเป็น HR ของบริษัทใดบริษัทหนึ่ง</p>
              </div>
            )}
          </div>
        )}

        {/* Job Statistics */}
        {jobStats && companyInfo?.company && (
          <div className="dashboard-stats">
            <h3>สถิติตำแหน่งงาน</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <div className="stat-number">{jobStats.overview?.total_jobs || 0}</div>
                  <div className="stat-label">ตำแหน่งงานทั้งหมด</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">{jobStats.overview?.active_jobs || 0}</div>
                  <div className="stat-label">เปิดรับสมัคร</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <div className="stat-number">{jobStats.overview?.total_applications || 0}</div>
                  <div className="stat-label">ใบสมัครทั้งหมด</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-number">{jobStats.overview?.pending_applications || 0}</div>
                  <div className="stat-label">รอการพิจารณา</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {companyInfo?.company && (
          <div className="dashboard-features">
            <h3>การจัดการตำแหน่งงาน</h3>
            <div className="features-grid">
              
              <div className="feature-card">
                <span className="feature-icon">➕</span>
                <h4>สร้างตำแหน่งใหม่</h4>
                <p>เพิ่มตำแหน่งฝึกงานใหม่สำหรับนักศึกษา</p>
                <button 
                  className="btn btn-outline"
                  onClick={() => navigate('/hr/jobs/create')}
                >
                  สร้างตำแหน่งงาน
                </button>
              </div>

              <div className="feature-card">
                <span className="feature-icon">📋</span>
                <h4>จัดการตำแหน่งงาน</h4>
                <p>ดู แก้ไข และจัดการตำแหน่งงานทั้งหมด</p>
                <button 
                  className="btn btn-outline"
                  onClick={() => navigate('/hr/jobs')}
                >
                  จัดการงาน
                </button>
              </div>

              <div className="feature-card">
                <span className="feature-icon">📊</span>
                <h4>ดูสถิติ</h4>
                <p>ติดตามสถิติการสมัครและผลการคัดเลือก</p>
                <button 
                  className="btn btn-outline"
                  onClick={() => navigate('/hr/analytics')}
                >
                  ดูสถิติ
                </button>
              </div>

              <div className="feature-card">
                <span className="feature-icon">👥</span>
                <h4>จัดการผู้สมัคร</h4>
                <p>ดูและจัดการใบสมัครจากนักศึกษา</p>
                <button 
                  className="btn btn-outline"
                  onClick={() => navigate('/hr/applications')}
                >
                  ดูผู้สมัคร
                </button>
              </div>

              <div className="feature-card">
                <span className="feature-icon">🏢</span>
                <h4>ข้อมูลบริษัท</h4>
                <p>ดูและแก้ไขข้อมูลพื้นฐานของบริษัท</p>
                <button 
                  className="btn btn-outline"
                  onClick={() => navigate('/hr/company')}
                >
                  จัดการบริษัท
                </button>
              </div>

              <div className="feature-card">
                <span className="feature-icon">🔍</span>
                <h4>ค้นหาผู้สมัคร</h4>
                <p>ค้นหาและกรองผู้สมัครตามเกณฑ์</p>
                <button 
                  className="btn btn-outline"
                  onClick={() => navigate('/hr/search')}
                >
                  ค้นหา
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Getting Started - สำหรับ HR ที่ไม่มีบริษัท */}
        {companyInfo && companyInfo.user_type === 'HR' && !companyInfo.company && (
          <div className="getting-started">
            <h3>เริ่มต้นใช้งาน</h3>
            <div className="steps-container">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>รอการกำหนดบริษัท</h4>
                  <p>Admin จะต้องกำหนดให้คุณเป็น HR ของบริษัทใดบริษัทหนึ่ง</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>เข้าถึงฟีเจอร์ HR</h4>
                  <p>หลังจากได้รับการกำหนดแล้ว คุณจะสามารถใช้ฟีเจอร์ต่างๆ ได้</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>เริ่มจัดการตำแหน่งงาน</h4>
                  <p>สร้างตำแหน่งงานฝึกงานและคัดกรองผู้สมัคร</p>
                </div>
              </div>
            </div>
            
            <div className="contact-admin">
              <p>หากมีคำถาม กรุณาติดต่อ Admin ผ่านช่องทางที่กำหนด</p>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {jobStats && companyInfo?.company && (
          <div className="recent-activity">
            <h3>กิจกรรมล่าสุด</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">📋</div>
                <div className="activity-content">
                  <p>มีตำแหน่งงาน <strong>{jobStats.overview?.active_jobs || 0}</strong> ตำแหน่งเปิดรับสมัครอยู่</p>
                  <span className="activity-time">อัพเดตล่าสุด</span>
                </div>
              </div>
              
              {jobStats.overview?.pending_applications > 0 && (
                <div className="activity-item">
                  <div className="activity-icon">⏳</div>
                  <div className="activity-content">
                    <p>มีใบสมัคร <strong>{jobStats.overview.pending_applications}</strong> ใบรอการพิจารณา</p>
                    <span className="activity-time">ต้องการการดำเนินการ</span>
                  </div>
                  <button 
                    className="btn btn-small btn-primary"
                    onClick={() => navigate('/hr/applications')}
                  >
                    ดูใบสมัคร
                  </button>
                </div>
              )}
              
              <div className="activity-item">
                <div className="activity-icon">📊</div>
                <div className="activity-content">
                  <p>รวมใบสมัครทั้งหมด <strong>{jobStats.overview?.total_applications || 0}</strong> ใบ</p>
                  <span className="activity-time">สถิติรวม</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRDashboard;