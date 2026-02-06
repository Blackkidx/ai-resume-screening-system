// frontend/src/services/companyService.js
import { API_BASE_URL } from '../config';
import authService from './authService';

class CompanyService {
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

  // =============================================================================
  // ADMIN - COMPANY MANAGEMENT
  // =============================================================================

  // ✅ สร้าง Company ใหม่
  async createCompany(companyData) {
    try {
      const response = await fetch(`${this.baseURL}/api/companies`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.detail || 'Failed to create company';

        if (errorMessage.includes('Company name already exists')) {
          errorMessage = 'ชื่อบริษัทนี้มีอยู่แล้ว กรุณาเลือกชื่ออื่น';
        }

        throw new Error(errorMessage);
      }

      return {
        success: true,
        data: data,
        message: 'สร้างบริษัทสำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ ดึงรายการ Companies ทั้งหมด
  async getCompanies(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.industry) queryParams.append('industry', params.industry);
      if (params.is_active !== null && params.is_active !== undefined) {
        queryParams.append('is_active', params.is_active);
      }

      const response = await fetch(`${this.baseURL}/api/companies?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch companies');
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

  // ✅ ดึงข้อมูล Company ตาม ID
  async getCompanyById(companyId) {
    try {
      const response = await fetch(`${this.baseURL}/api/companies/${companyId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch company');
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

  // ✅ อัปเดต Company
  async updateCompany(companyId, companyData) {
    try {
      const response = await fetch(`${this.baseURL}/api/companies/${companyId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.detail || 'Failed to update company';

        if (errorMessage.includes('Company name already exists')) {
          errorMessage = 'ชื่อบริษัทนี้มีอยู่แล้ว กรุณาเลือกชื่ออื่น';
        }

        throw new Error(errorMessage);
      }

      return {
        success: true,
        data: data,
        message: 'อัปเดตข้อมูลบริษัทสำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ ลบ Company
  async deleteCompany(companyId) {
    try {
      const response = await fetch(`${this.baseURL}/api/companies/${companyId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to delete company');
      }

      return {
        success: true,
        data: data,
        message: 'ลบบริษัทสำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =============================================================================
  // COMPANY HR MANAGEMENT
  // =============================================================================

  // ✅ ดึงรายการ HR ของ Company
  async getCompanyHRUsers(companyId) {
    try {
      const response = await fetch(`${this.baseURL}/api/companies/${companyId}/hr`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch company HR users');
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

  // ✅ เพิ่ม HR Users ให้กับ Company
  async assignHRToCompany(companyId, userIds) {
    try {
      const response = await fetch(`${this.baseURL}/api/companies/${companyId}/hr`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          user_ids: userIds
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to assign HR to company');
      }

      return {
        success: true,
        data: data,
        message: data.message || 'เพิ่ม HR สำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ ลบ HR User จาก Company
  async removeHRFromCompany(companyId, userId) {
    try {
      const response = await fetch(`${this.baseURL}/api/companies/${companyId}/hr/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to remove HR from company');
      }

      return {
        success: true,
        data: data,
        message: data.message || 'ลบ HR สำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =============================================================================
  // HR DASHBOARD ACCESS
  // =============================================================================

  // ✅ ดึงข้อมูล Company ของ HR ปัจจุบัน
  async getMyCompanyInfo() {
    try {
      const response = await fetch(`${this.baseURL}/api/companies/my-company/info`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch company info');
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

  // ✅ ดึงรายการ HR Users ที่ยังไม่ได้ assign (สำหรับ dropdown)
  async getAvailableHRUsers() {
    try {
      const response = await fetch(`${this.baseURL}/api/admin/users/available-hr`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch available HR users');
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
}

// Create singleton instance
const companyServiceInstance = new CompanyService();

export default companyServiceInstance;