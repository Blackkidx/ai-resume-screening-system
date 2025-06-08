// frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
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
          const result = await authService.getMe();
          if (result.success) {
            setUser(result.data);
          } else {
            // Token หมดอายุ หรือไม่ valid - ลบข้อมูล
            authService.removeToken();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ฟังก์ชัน login
  const login = async (credentials) => {
    try {
      const result = await authService.login(credentials);
      if (result.success) {
        setUser(result.data.user_info);
        return result;
      }
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      };
    }
  };

  // ฟังก์ชัน register
  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      return result;
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
      };
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

  // ฟังก์ชันอัปเดตข้อมูลผู้ใช้
  const updateUser = (userData) => {
    setUser(userData);
    authService.setCurrentUser(userData);
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

  // Context value
  const value = {
    user,
    loading,
    isAuthenticated,
    hasRole,
    login,
    register,
    logout,
    updateUser
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