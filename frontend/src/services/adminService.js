// frontend/src/services/adminService.js
import { API_BASE_URL } from '../config';
import authService from './authService';

class AdminService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // สร้าง headers สำหรับ API requests
  getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // ✅ ดึงข้อมูล Dashboard Stats
  async getDashboardStats() {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/dashboard`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch dashboard stats');
      }

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

  // ✅ ดึงรายการผู้ใช้ทั้งหมด
  async getUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.user_type) queryParams.append('user_type', params.user_type);
      if (params.is_active !== null && params.is_active !== undefined) {
        queryParams.append('is_active', params.is_active);
      }

      const response = await fetch(`${this.baseURL}/api/admin/users?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch users');
      }

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

  // ✅ ดึงข้อมูลผู้ใช้ตาม ID
  async getUserById(userId) {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/users/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch user');
      }

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

  // ✅ อัปเดตข้อมูลผู้ใช้
  async updateUser(userId, userData) {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update user');
      }

      return {
        success: true,
        data: data,
        message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ ลบผู้ใช้
  async deleteUser(userId) {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to delete user');
      }

      return {
        success: true,
        data: data,
        message: 'ลบผู้ใช้สำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ สร้างผู้ใช้ใหม่
  async createUser(userData) {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create user');
      }

      return {
        success: true,
        data: data,
        message: 'สร้างผู้ใช้ใหม่สำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ ตรวจสอบสิทธิ์ Admin
  isAdmin(user) {
    if (!user) return false;
    return user.user_type === 'Admin' || (user.roles && user.roles.includes('Admin'));
  }

  // ✅ ดึงข้อมูลสถิติเพิ่มเติม (ถ้าต้องการ)
  async getAdvancedStats() {
    try {
      // สามารถเพิ่ม endpoint อื่นๆ ได้ตามต้องการ
      // เช่น สถิติการ login, การใช้งานระบบ, etc.
      
      return {
        success: true,
        data: {
          // placeholder data
        }
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
const adminServiceInstance = new AdminService();

export default adminServiceInstance;