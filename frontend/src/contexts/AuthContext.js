// frontend/src/contexts/AuthContext.js - Fixed Version
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import profileService from '../services/profileService';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';

// สร้าง Context
const AuthContext = createContext();

// Hook สำหรับใช้ AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบสถานะ authentication เมื่อแอพเริ่มต้น
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        const token = authService.getToken();

        if (currentUser && token) {
          // ตรวจสอบว่า token ยังใช้ได้หรือไม่
          try {
            const result = await authService.getMe();
            if (result.success) {
              setUser(result.data);

              // 🎯 ดึงข้อมูลโปรไฟล์ล่าสุดจาก API
              try {
                const profileData = await profileService.getProfile();
                const updatedUser = {
                  ...result.data,
                  full_name: profileData.full_name,
                  email: profileData.email,
                  phone: profileData.phone,
                  profile_image: profileData.profile_image,
                  updated_at: profileData.updated_at
                };
                setUser(updatedUser);
                authService.setCurrentUser(updatedUser);
              } catch (profileError) {
                console.warn('Failed to fetch profile on initialization:', profileError);
                // ถ้าดึงโปรไฟล์ไม่ได้ ใช้ข้อมูลจาก getMe
                setUser(result.data);
              }
            } else {
              // Token หมดอายุ หรือไม่ valid - ลบข้อมูล
              authService.removeToken();
              authService.removeCurrentUser();
              setUser(null);
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            authService.removeToken();
            authService.removeCurrentUser();
            setUser(null);
          }
        } else {
          // ไม่มี token หรือ user data
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.removeToken();
        authService.removeCurrentUser();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ✅ ใช้สำหรับ auto-login หลังยืนยัน OTP — อัปเดท React state ทันที
  const loginWithData = (tokenData) => {
    authService.setToken(tokenData.access_token);
    authService.setCurrentUser(tokenData.user_info);
    setUser(tokenData.user_info);
  };

  const login = async (credentials) => {
    try {
      const result = await authService.login(credentials);

      if (result.success) {
        setUser(result.data.user_info);

        try {
          const profileData = await profileService.getProfile();
          const updatedUser = {
            ...result.data.user_info,
            full_name: profileData.full_name,
            email: profileData.email,
            phone: profileData.phone,
            profile_image: profileData.profile_image,
            updated_at: profileData.updated_at
          };
          setUser(updatedUser);
          authService.setCurrentUser(updatedUser);
        } catch (profileError) {
          console.warn('Failed to fetch profile after login:', profileError);
        }

        return { success: true, message: 'เข้าสู่ระบบเรียบร้อยแล้ว', data: result.data };
      }

      return {
        success: false,
        error: result.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
        needsVerification: result.needsVerification || false,
        email: result.email || ''
      };
    } catch (error) {
      return { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const result = await authService.verifyOTP(email, otp);
      if (result.success) {
        setUser(result.data.user_info);
        authService.setCurrentUser(result.data.user_info);
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'เกิดข้อผิดพลาดในการยืนยัน OTP' };
    }
  };

  const resendOTP = async (email) => {
    try {
      const result = await authService.resendOTP(email);
      return result.success
        ? { success: true }
        : { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'เกิดข้อผิดพลาด' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const result = await authService.forgotPassword(email);
      return result.success ? { success: true } : { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'เกิดข้อผิดพลาด' };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const result = await authService.resetPassword(email, otp, newPassword);
      return result.success ? { success: true } : { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'เกิดข้อผิดพลาด' };
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      if (result.success) {
        return { success: true, email: result.email, data: result.data };
      }
      return { success: false, error: result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก' };
    } catch (error) {
      return { success: false, error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' };
    }
  };

  // ฟังก์ชัน logout
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      return {
        success: true,
        message: 'ออกจากระบบเรียบร้อยแล้ว'
      };
    } catch (error) {
      console.error('Logout error:', error);
      // ยังคงลบข้อมูลผู้ใช้ถึงแม้จะมี error
      setUser(null);
      return {
        success: true,
        message: 'ออกจากระบบเรียบร้อยแล้ว'
      };
    }
  };

  // 🎯 ฟังก์ชันอัปเดตข้อมูลผู้ใช้ (ใช้เมื่อแก้ไขโปรไฟล์)
  const updateUser = (userData) => {
    const updatedUser = {
      ...user,
      ...userData
    };
    setUser(updatedUser);
    authService.setCurrentUser(updatedUser);
  };

  // 🎯 ฟังก์ชัน sync ข้อมูลโปรไฟล์ล่าสุด
  const syncProfile = async () => {
    if (!isAuthenticated()) return;

    try {
      const profileData = await profileService.getProfile();
      const updatedUser = {
        ...user,
        full_name: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone,
        profile_image: profileData.profile_image,
        updated_at: profileData.updated_at
      };
      setUser(updatedUser);
      authService.setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Failed to sync profile:', error);
      throw error;
    }
  };

  // ตรวจสอบว่า user login อยู่หรือไม่
  const isAuthenticated = () => {
    return user !== null && authService.getToken() !== null;
  };

  // ตรวจสอบ role ของผู้ใช้
  const hasRole = (role) => {
    if (!user) return false;
    return user.user_type === role || (user.roles && user.roles.includes(role));
  };

  // 🎯 ฟังก์ชันช่วยเหลือสำหรับโปรไฟล์
  const getInitials = (fullName) => {
    if (!fullName) return 'U';

    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const getDisplayName = (fullName) => {
    if (!fullName) return 'User';

    const names = fullName.split(' ');
    if (names.length >= 2) {
      return names[0]; // แสดงแค่ชื่อ
    }
    return fullName;
  };

  const getProfileImageUrl = () => {
    const imageUrl = user?.profile_image;

    if (imageUrl) {
      // ถ้าเป็น URL เต็ม ใช้เลย
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      }
      // ถ้าเป็น path สัมพัทธ์ เพิ่ม base URL
      return `http://localhost:8000${imageUrl}`;
    }

    return null;
  };

  // Get authentication headers for API calls
  const getAuthHeaders = () => {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    hasRole,
    login,
    loginWithData,
    register,
    logout,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    updateUser,
    syncProfile,
    getInitials,
    getDisplayName,
    getProfileImageUrl,
    getAuthHeaders,
    hasProfileImage: !!getProfileImageUrl(),
    fullName: user?.full_name || '',
    email: user?.email || '',
    userType: user?.user_type || ''
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="auth-loading">
          <LoadingSpinner size="large" message="กำลังตรวจสอบสถานะการเข้าสู่ระบบ..." />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;