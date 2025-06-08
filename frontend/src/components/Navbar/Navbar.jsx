// frontend/src/components/Navbar/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout: authLogout, isAuthenticated } = useAuth();
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

  // ⭐ ฟังก์ชันไปหน้า Admin Dashboard
  const handleAdminDashboard = () => {
    setIsDropdownOpen(false);
    navigate('/admin/dashboard');
  };

  // ฟังก์ชันสำหรับแสดงชื่อย่อ
  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // ฟังก์ชันแสดงชื่อสั้น
  const getDisplayName = (fullName) => {
    if (!fullName) return 'User';
    
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return names[0]; // แสดงแค่ชื่อ
    }
    return fullName;
  };

  // ⭐ ตรวจสอบว่าเป็น Admin หรือไม่
  const isAdmin = () => {
    return user && (user.user_type === 'Admin' || (user.roles && user.roles.includes('Admin')));
  };

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
                  <div className="user-avatar">
                    {getInitials(user.full_name)}
                  </div>
                  <span className="user-name">
                    {getDisplayName(user.full_name)}
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

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <div className="user-info">
                        <p className="user-full-name">{user.full_name}</p>
                        <p className="user-email">{user.email}</p>
                        <span className="user-role">{user.user_type}</span>
                      </div>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <div className="dropdown-items">
                      {/* ⭐ แสดง Admin Dashboard สำหรับ Admin เท่านั้น */}
                      {isAdmin() && (
                        <button 
                          className="dropdown-item admin-item"
                          onClick={handleAdminDashboard}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="9" y1="9" x2="15" y2="9"></line>
                            <line x1="9" y1="13" x2="15" y2="13"></line>
                            <line x1="9" y1="17" x2="15" y2="17"></line>
                          </svg>
                          Admin Dashboard
                        </button>
                      )}
                      
                      <button 
                        className="dropdown-item"
                        onClick={handleProfile}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        แก้ไขโปรไฟล์
                      </button>
                      
                      <button 
                        className="dropdown-item logout"
                        onClick={handleLogout}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16,17 21,12 16,7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        ออกจากระบบ
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