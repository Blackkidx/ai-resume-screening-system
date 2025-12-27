// frontend/src/services/authService.js
import { API_BASE_URL } from '../config';

class AuthService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // ดึง token จาก localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // บันทึก token ลง localStorage
  setToken(token) {
    localStorage.setItem('token', token);
  }

  // ลบ token จาก localStorage
  removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // ดึงข้อมูล user จาก localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // บันทึกข้อมูล user ลง localStorage
  setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // สร้าง headers สำหรับ API requests
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // ✅ สมัครสมาชิก
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          full_name: `${userData.firstName} ${userData.lastName}`,
          phone: userData.phone || null,
          user_type: 'Student' // บังคับเป็น Student
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      return {
        success: true,
        data: data,
        message: 'สมัครสมาชิกสำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ เข้าสู่ระบบ
  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // บันทึก token และข้อมูล user
      this.setToken(data.access_token);
      this.setCurrentUser(data.user_info);

      return {
        success: true,
        data: data,
        message: 'เข้าสู่ระบบสำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ ออกจากระบบ
  async logout() {
    try {
      // เรียก API logout (ถ้ามี)
      const token = this.getToken();
      if (token) {
        await fetch(`${this.baseURL}/api/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // ลบข้อมูลจาก localStorage
      this.removeToken();
      return {
        success: true,
        message: 'ออกจากระบบแล้ว'
      };
    }
  }

  // ✅ ดูข้อมูลผู้ใช้ปัจจุบัน
  async getMe() {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch user data');
      }

      // อัปเดตข้อมูล user ใน localStorage
      this.setCurrentUser(data);

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ ตรวจสอบว่า login อยู่หรือไม่
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return token && user;
  }

  // ✅ เปลี่ยนรหัสผ่าน
  async changePassword(passwordData) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/change-password`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to change password');
      }

      return {
        success: true,
        message: 'เปลี่ยนรหัสผ่านสำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const authServiceInstance = new AuthService();

// Export singleton instance with named export
export default authServiceInstance;