// frontend/src/components/Navbar/Navbar.jsx - Tailwind White Minimalist (Responsive)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    logout: authLogout,
    isAuthenticated,
    getDisplayName,
    getProfileImageUrl
  } = useAuth();

  const notify = useNotification();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  // ปิด mobile menu เมื่อ route เปลี่ยน
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // ล็อค body scroll เมื่อ mobile menu เปิด
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      const result = await authLogout();
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
      if (result.success) {
        notify.success('ออกจากระบบเรียบร้อยแล้ว');
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Logout error:', error);
      notify.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  const handleProfile = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/profile');
  };

  const handleDashboard = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (user?.user_type === 'Admin') navigate('/admin/dashboard');
    else if (user?.user_type === 'HR') navigate('/hr/dashboard');
    else if (user?.user_type === 'Student') navigate('/student/dashboard');
  };

  const hasSpecialRole = () =>
    user && (user.user_type === 'Admin' || user.user_type === 'HR' || user.user_type === 'Student');

  const profileImageUrl = getProfileImageUrl();

  const getDashboardConfig = () => {
    if (user?.user_type === 'Admin') return {
      title: 'Admin Dashboard',
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>),
      bgClass: 'bg-amber-50', textClass: 'text-amber-600', iconBgClass: 'bg-amber-500 text-white'
    };
    if (user?.user_type === 'HR') return {
      title: 'HR Dashboard',
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>),
      bgClass: 'bg-emerald-50', textClass: 'text-emerald-600', iconBgClass: 'bg-emerald-500 text-white'
    };
    if (user?.user_type === 'Student') return {
      title: 'Student Dashboard',
      icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" /></svg>),
      bgClass: 'bg-sky-50', textClass: 'text-sky-600', iconBgClass: 'bg-sky-500 text-white'
    };
    return null;
  };

  const dashboardConfig = getDashboardConfig();

  return (
    <>
      <nav className="sticky top-0 z-[1000] bg-white/90 backdrop-blur-md border-b border-slate-200 h-16 w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center max-w-7xl mx-auto h-full">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img
              src="/logo-internscreen.png"
              alt="InternScreen"
              className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-sky-600 transition-all duration-300 group-hover:from-sky-500 group-hover:to-indigo-600">
              InternScreen
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link to="/" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">
                หน้าหลัก
              </Link>
              <Link to="/companies" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors">
                บริษัททั้งหมด
              </Link>
            </div>

            {/* Auth / User Section */}
            <div className="flex items-center gap-2">
              {isAuthenticated() ? (
                <>
                  {user?.user_type === 'Student' && <div className="mr-1"><NotificationBell /></div>}

                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 px-2 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100 flex items-center justify-center text-slate-400">
                        {profileImageUrl ? (
                          <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center" style={{ display: profileImageUrl ? 'none' : 'flex' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5S7 4.24 7 7s2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" />
                          </svg>
                        </div>
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
                        {getDisplayName(user?.full_name)}
                      </span>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-[min(288px,calc(100vw-1rem))] sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden origin-top-right animate-fadeInDown">
                        {/* User Info Header */}
                        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex items-center gap-3 sm:gap-4">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-slate-200 flex items-center justify-center text-slate-400">
                            {profileImageUrl ? (
                              <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-7 sm:h-7">
                                <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5S7 4.24 7 7s2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-semibold text-slate-900 truncate">{user?.full_name}</h4>
                            <p className="text-xs sm:text-sm text-slate-500 truncate">{user?.email}</p>
                            <span className="inline-block mt-1 px-2.5 py-0.5 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full">
                              {user?.user_type}
                            </span>
                          </div>
                        </div>

                        {/* Dashboard Link */}
                        {hasSpecialRole() && dashboardConfig && (
                          <div className="p-2">
                            <button
                              onClick={handleDashboard}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg border-l-4 border-transparent hover:border-current transition-all group ${dashboardConfig.bgClass}`}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${dashboardConfig.iconBgClass} shadow-sm group-hover:scale-105 transition-transform`}>
                                {dashboardConfig.icon}
                              </div>
                              <div className="flex-1 text-left">
                                <div className={`text-sm font-semibold ${dashboardConfig.textClass}`}>{dashboardConfig.title}</div>
                                <div className="text-xs text-slate-500 mt-0.5">จัดการระบบและข้อมูล</div>
                              </div>
                              <svg className={`w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${dashboardConfig.textClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            <div className="h-px bg-slate-100 mx-2 mt-2" />
                          </div>
                        )}

                        {/* Menu Items */}
                        <div className="p-2">
                          <button onClick={handleProfile} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors group">
                            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-white group-hover:text-sky-600 group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-700 group-hover:text-slate-900">แก้ไขโปรไฟล์</div>
                              <div className="text-xs text-slate-500 mt-0.5">จัดการข้อมูลส่วนตัว</div>
                            </div>
                          </button>

                          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 text-left transition-colors group mt-1">
                            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-all">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-700 group-hover:text-red-600">ออกจากระบบ</div>
                              <div className="text-xs text-slate-500 mt-0.5 group-hover:text-red-500/80">ปิดเซสชันปัจจุบัน</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="hidden sm:block px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50">
                    Login
                  </Link>
                  <Link to="/register" className="px-3 py-2 sm:px-4 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 border border-transparent rounded-lg shadow-sm hover:shadow transition-all">
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Hamburger Button — Mobile Only */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label={isMobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[999] bg-slate-900/20 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 z-[1000] bg-white border-b border-slate-200 shadow-lg md:hidden animate-fadeInDown">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                หน้าหลัก
              </Link>
              <Link to="/companies" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                บริษัททั้งหมด
              </Link>

              {!isAuthenticated() && (
                <div className="pt-2 mt-1 border-t border-slate-100">
                  <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    เข้าสู่ระบบ
                  </Link>
                </div>
              )}

              {isAuthenticated() && hasSpecialRole() && dashboardConfig && (
                <div className="pt-2 mt-1 border-t border-slate-100">
                  <button
                    onClick={handleDashboard}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${dashboardConfig.bgClass} ${dashboardConfig.textClass}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${dashboardConfig.iconBgClass}`}>
                      {dashboardConfig.icon}
                    </div>
                    {dashboardConfig.title}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
