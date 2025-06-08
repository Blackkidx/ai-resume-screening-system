// frontend/src/components/HR/HRDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import companyService from '../../services/companyService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import '../../styles/hr.css';

const HRDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [companyInfo, setCompanyInfo] = useState(null);
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

    loadCompanyInfo();
  }, [isAuthenticated, user, navigate]);

  // โหลดข้อมูลบริษัท
  const loadCompanyInfo = async () => {
    try {
      setLoading(true);
      const result = await companyService.getMyCompanyInfo();
      
      if (result.success) {
        setCompanyInfo(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูลบริษัท');
    } finally {
      setLoading(false);
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
          <p className="hr-subtitle">ระบบจัดการสำหรับ HR</p>
        </div>

        {/* Company Info Card */}
        {companyInfo && (
          <div className="company-info-card">
            {companyInfo.user_type === 'Admin' ? (
              // แสดงสำหรับ Admin
              <div className="admin-access-info">
                <div className="company-icon admin">
                  👑
                </div>
                <div className="company-details">
                  <h2>Admin Access</h2>
                  <p>คุณมีสิทธิ์ Admin - สามารถเข้าถึงข้อมูลของบริษัททั้งหมดได้</p>
                  <div className="admin-features">
                    <span className="feature-badge">✅ จัดการบริษัททั้งหมด</span>
                    <span className="feature-badge">✅ จัดการผู้ใช้ทั้งหมด</span>
                    <span className="feature-badge">✅ สิทธิ์ระดับสูงสุด</span>
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
            ) : (
              // แสดงสำหรับ HR
              <div className="company-access-info">
                <div className="company-icon">
                  {companyInfo.company?.name?.charAt(0)?.toUpperCase() || '🏢'}
                </div>
                <div className="company-details">
                  <h2>ยินดีต้อนรับ {user.full_name}</h2>
                  <p>คุณเป็น HR ของบริษัท</p>
                  
                  {companyInfo.company ? (
                    <div className="company-info">
                      <div className="company-name-section">
                        <h3 className="company-name">{companyInfo.company.name}</h3>
                        <span className="company-industry">{companyInfo.company.industry}</span>
                      </div>
                      
                      {companyInfo.company.location && (
                        <div className="company-location">
                          📍 {companyInfo.company.location}
                        </div>
                      )}
                      
                      <div className="company-status">
                        <span className={`status-badge ${companyInfo.company.is_active ? 'active' : 'inactive'}`}>
                          {companyInfo.company.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </div>
                      
                      <div className="hr-features">
                        <span className="feature-badge">✅ จัดการตำแหน่งงาน</span>
                        <span className="feature-badge">✅ คัดกรองเรซูเม่</span>
                        <span className="feature-badge">✅ จัดการผู้สมัคร</span>
                      </div>
                    </div>
                  ) : (
                    <div className="no-company-assigned">
                      <p>⚠️ คุณยังไม่ได้รับการกำหนดให้เป็น HR ของบริษัทใด</p>
                      <p>กรุณาติดต่อ Admin เพื่อกำหนดบริษัทให้กับบัญชีของคุณ</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Features - สำหรับ HR ที่มีบริษัท */}
        {companyInfo && companyInfo.user_type === 'HR' && companyInfo.company && (
          <div className="dashboard-features">
            <h3>ฟีเจอร์ที่ใช้ได้</h3>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">📋</div>
                <h4>จัดการตำแหน่งงาน</h4>
                <p>สร้างและจัดการตำแหน่งงานฝึกงาน</p>
                <button className="btn btn-outline" disabled>
                  เร็วๆ นี้
                </button>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">📄</div>
                <h4>คัดกรองเรซูเม่</h4>
                <p>ใช้ AI ในการคัดกรองและจัดอันดับผู้สมัคร</p>
                <button className="btn btn-outline" disabled>
                  เร็วๆ นี้
                </button>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">👥</div>
                <h4>จัดการผู้สมัคร</h4>
                <p>ดูรายชื่อผู้สมัครและสถานะการสมัคร</p>
                <button className="btn btn-outline" disabled>
                  เร็วๆ นี้
                </button>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h4>รายงานสถิติ</h4>
                <p>ดูสถิติการสมัครงานและผลการคัดเลือก</p>
                <button className="btn btn-outline" disabled>
                  เร็วๆ นี้
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats - สำหรับ HR ที่มีบริษัท */}
        {companyInfo && companyInfo.user_type === 'HR' && companyInfo.company && (
          <div className="quick-stats">
            <h3>สถิติด่วน</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <div className="stat-number">0</div>
                  <div className="stat-label">ตำแหน่งงานเปิด</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📄</div>
                <div className="stat-content">
                  <div className="stat-number">0</div>
                  <div className="stat-label">เรซูเม่ใหม่</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">0</div>
                  <div className="stat-label">ผู้สมัครผ่านเลือก</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-number">0</div>
                  <div className="stat-label">รอการสัมภาษณ์</div>
                </div>
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
      </div>
    </div>
  );
};

export default HRDashboard;