// frontend/src/services/jobService.js
import { API_BASE_URL } from '../config';
import authService from './authService';

class JobService {
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
  // PUBLIC ENDPOINTS - ไม่ต้อง login
  // =============================================================================

  // ✅ ดึงรายการงานทั้งหมด (Public)
  async getJobs(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.skip !== undefined) queryParams.append('skip', params.skip);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);

      const response = await fetch(`${this.baseURL}/api/jobs?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
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

  // ✅ ดึงรายการงานของบริษัทตัวเอง (HR/Admin only)
  async getMyCompanyJobs(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.skip !== undefined) queryParams.append('skip', params.skip);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.department) queryParams.append('department', params.department);
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active);

      const response = await fetch(`${this.baseURL}/api/jobs/my-company?${queryParams.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to fetch company jobs');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ✅ ดึงรายละเอียดงาน (ต้อง login)
  async getJobById(jobId) {
    try {
      const response = await fetch(`${this.baseURL}/api/jobs/${jobId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('กรุณาเข้าสู่ระบบเพื่อดูรายละเอียด');
        }
        throw new Error('Failed to fetch job details');
      }

      const data = await response.json();
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

  // =============================================================================
  // HR/ADMIN ENDPOINTS - ต้องมี role HR หรือ Admin
  // =============================================================================

  // ✅ สร้างงานใหม่ (HR/Admin only)
  async createJob(jobData) {
    try {
      const response = await fetch(`${this.baseURL}/api/jobs`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create job');
      }

      return {
        success: true,
        data: data,
        message: 'สร้างงานสำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ แก้ไขงาน (HR/Admin only)
  async updateJob(jobId, updates) {
    try {
      const response = await fetch(`${this.baseURL}/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update job');
      }

      return {
        success: true,
        data: data,
        message: 'แก้ไขงานสำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ ลบงาน (เปลี่ยนเป็น inactive) (HR/Admin only)
  async deleteJob(jobId) {
    try {
      const response = await fetch(`${this.baseURL}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to delete job');
      }

      return {
        success: true,
        data: data,
        message: 'ลบงานสำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =============================================================================
  // STUDENT ENDPOINTS
  // =============================================================================

  // ✅ ดึงงานที่แนะนำ (Student only)
  async getRecommendedJobs() {
    try {
      const response = await fetch(`${this.baseURL}/api/jobs/recommended/for-me`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('กรุณาเข้าสู่ระบบเพื่อดูงานแนะนำ');
        }
        throw new Error('Failed to fetch recommended jobs');
      }

      const data = await response.json();
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

  // ✅ ดูว่าตรงกับงานแค่ไหน (Student only)
  async analyzeMatch(jobId) {
    try {
      const response = await fetch(`${this.baseURL}/api/jobs/${jobId}/analyze`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('กรุณาเข้าสู่ระบบเพื่อวิเคราะห์');
        }
        throw new Error('Failed to analyze match');
      }

      const data = await response.json();
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

  // ✅ สมัครงาน (Student only)
  async applyJob(jobId, applicationData) {
    try {
      const response = await fetch(`${this.baseURL}/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(applicationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to apply for job');
      }

      return {
        success: true,
        data: data,
        message: 'สมัครงานสำเร็จ'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ ดูงานที่ยังไม่เหมาะสม + Gap Analysis (Student only)
  async getNotReadyJobs() {
    try {
      const response = await fetch(`${this.baseURL}/api/jobs/not-ready/for-me`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('กรุณาอัปโหลด Resume ก่อนดูงานที่ยังไม่เหมาะสม');
        }
        throw new Error('Failed to fetch not-ready jobs');
      }

      const data = await response.json();
      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ✅ ดูรายการงานที่สมัครไว้ (Student only)
  async getMyApplications() {
    try {
      const response = await fetch(`${this.baseURL}/api/jobs/my-applications`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ✅ ดูผู้สมัครของตำแหน่งงาน (HR/Admin only)
  async getApplicants(jobId) {
    try {
      const response = await fetch(`${this.baseURL}/api/jobs/${jobId}/applicants`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to fetch applicants');
      }

      const data = await response.json();
      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ✅ Accept/Reject ผู้สมัคร (HR/Admin only) — JSON body + reason สำหรับ XGBoost
  async updateApplicationStatus(appId, status, reason = '') {
    try {
      const response = await fetch(`${this.baseURL}/api/jobs/applications/${appId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, reason })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to update status');
      }

      const data = await response.json();
      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ✅ สถิติเชิงลึก (HR/Admin only)
  async getDetailedAnalytics() {
    try {
      const response = await fetch(`${this.baseURL}/api/jobs/analytics/detailed`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ✅ ดูผู้สมัครทุกตำแหน่ง (HR/Admin only)
  async getAllApplicants(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status_filter', params.status);
      if (params.sortBy) queryParams.append('sort_by', params.sortBy);

      const response = await fetch(
        `${this.baseURL}/api/jobs/all-applicants?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      if (!response.ok) throw new Error('Failed to fetch applicants');
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new JobService();