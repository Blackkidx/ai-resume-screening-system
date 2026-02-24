// frontend/src/components/Navbar/Navbar.jsx - Enhanced Dropdown Design
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const {
    user,
    logout: authLogout,
    isAuthenticated,
    getInitials,
    getDisplayName,
    getProfileImageUrl
  } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ฟังก์ชัน logout
  const handleLogout = async () => {
    try {
      const result = await authLogout();
      setIsDropdownOpen(false);

      if (result.success) {
        alert('ออกจากระบบเรียบร้อยแล้ว');
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  // ฟังก์ชันไปหน้า profile
  const handleProfile = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  // ⭐ ฟังก์ชันไปหน้า Dashboard (รวม Admin & HR & Student)
  const handleDashboard = () => {
    setIsDropdownOpen(false);

    if (user?.user_type === 'Admin') {
      navigate('/admin/dashboard');
    } else if (user?.user_type === 'HR') {
      navigate('/hr/dashboard');
    } else if (user?.user_type === 'Student') {
      navigate('/student/dashboard');
    }
  };

  // ⭐ ตรวจสอบว่าเป็น Admin, HR หรือ Student
  const hasSpecialRole = () => {
    return user && (user.user_type === 'Admin' || user.user_type === 'HR' || user.user_type === 'Student');
  };

  // 🎯 ได้รับ URL รูปโปรไฟล์จาก AuthContext
  const profileImageUrl = getProfileImageUrl();

  // 🎨 ฟังก์ชันกำหนดสีและไอคอนตาม role
  const getDashboardConfig = () => {
    if (user?.user_type === 'Admin') {
      return {
        title: 'Admin Dashboard',
        icon: '👑',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textColor: '#667eea',
        bgColor: '#f0f4ff'
      };
    } else if (user?.user_type === 'HR') {
      return {
        title: 'HR Dashboard',
        icon: '💼',
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        textColor: '#059669',
        bgColor: '#ecfdf5'
      };
    } else if (user?.user_type === 'Student') {
      return {
        title: 'Student Dashboard',
        icon: '🎓',
        gradient: 'linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)',
        textColor: '#0369A1',
        bgColor: '#F0F9FF'
      };
    }
    return null;
  };

  const dashboardConfig = getDashboardConfig();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="/" className="navbar-logo">
          InternScreen
        </a>

        <div className="navbar-menu">
          <div className="navbar-links">
            <a href="/" className="navbar-link">หน้าหลัก</a>
            <a href="/companies" className="navbar-link">บริษัททั้งหมด</a>
          </div>

          <div className="navbar-auth">
            {isAuthenticated() ? (
              // แสดง User Menu เมื่อ login แล้ว
              <div className="user-menu" ref={dropdownRef}>
                <button
                  className="user-button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {/* 🎯 แสดงรูปโปรไฟล์จริงหรือ Avatar placeholder */}
                  <div className="user-avatar">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="user-avatar-image"
                        onError={(e) => {
                          // ถ้าโหลดรูปไม่ได้ ซ่อนรูปและแสดง initials
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="user-avatar-placeholder"
                      style={{
                        display: profileImageUrl ? 'none' : 'flex'
                      }}
                    >
                      {getInitials(user?.full_name)}
                    </div>
                  </div>
                  <span className="user-name">
                    {getDisplayName(user?.full_name)}
                  </span>
                  <svg
                    className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>

                {/* 🎨 Enhanced Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="dropdown-menu enhanced">

                    {/* User Info Header */}
                    <div className="dropdown-header">
                      <div className="user-info-card">
                        <div className="user-avatar-large">
                          {profileImageUrl ? (
                            <img
                              src={profileImageUrl}
                              alt="Profile"
                              className="user-avatar-large-image"
                            />
                          ) : (
                            <div className="user-avatar-large-placeholder">
                              {getInitials(user?.full_name)}
                            </div>
                          )}
                        </div>
                        <div className="user-details">
                          <h4 className="user-full-name">{user?.full_name}</h4>
                          <p className="user-email">{user?.email}</p>
                          <span className="user-role-badge">{user?.user_type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard Section - เน้นพิเศษ */}
                    {hasSpecialRole() && dashboardConfig && (
                      <>
                        <div className="dropdown-section dashboard-section">
                          <button
                            className="dropdown-item dashboard-item"
                            onClick={handleDashboard}
                            style={{
                              background: dashboardConfig.bgColor,
                              borderLeft: `4px solid ${dashboardConfig.textColor}`
                            }}
                          >
                            <div className="dashboard-icon" style={{
                              background: dashboardConfig.gradient
                            }}>
                              <span className="dashboard-emoji">{dashboardConfig.icon}</span>
                            </div>
                            <div className="dashboard-content">
                              <span className="dashboard-title" style={{
                                color: dashboardConfig.textColor
                              }}>
                                {dashboardConfig.title}
                              </span>
                              <span className="dashboard-subtitle">
                                จัดการระบบและข้อมูล
                              </span>
                            </div>
                            <svg
                              className="dashboard-arrow"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              style={{ color: dashboardConfig.textColor }}
                            >
                              <polyline points="9,18 15,12 9,6"></polyline>
                            </svg>
                          </button>
                        </div>

                        <div className="dropdown-divider"></div>
                      </>
                    )}

                    {/* Regular Menu Items */}
                    <div className="dropdown-section">
                      <button
                        className="dropdown-item regular-item"
                        onClick={handleProfile}
                      >
                        <div className="item-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <div className="item-content">
                          <span className="item-title">แก้ไขโปรไฟล์</span>
                          <span className="item-subtitle">จัดการข้อมูลส่วนตัว</span>
                        </div>
                      </button>

                      <button
                        className="dropdown-item regular-item logout-item"
                        onClick={handleLogout}
                      >
                        <div className="item-icon logout-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16,17 21,12 16,7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                          </svg>
                        </div>
                        <div className="item-content">
                          <span className="item-title">ออกจากระบบ</span>
                          <span className="item-subtitle">ปิดเซสชันปัจจุบัน</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // แสดง Login/Register เมื่อยังไม่ login
              <>
                <a href="/login" className="btn btn-secondary">Login</a>
                <a href="/register" className="btn btn-primary">Register</a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;