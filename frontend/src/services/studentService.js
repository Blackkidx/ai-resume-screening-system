import axios from 'axios';

// Base API URL - ปรับให้ตรงกับ backend ของคุณ
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Student Service Functions
export const studentService = {
  // Get student profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/student/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
    }
  },

  // Update student profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/student/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลได้');
    }
  },

  // แก้ไขใน studentService.js

// Upload profile image - แก้ไข field name
uploadProfileImage: async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile); // เปลี่ยนจาก 'profile_image' เป็น 'file'
    
    const response = await apiClient.post('/student/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error(error.response?.data?.message || 'ไม่สามารถอัปโหลดรูปภาพได้');
  }
},

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.post('/student/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    }
  },

  // Upload resume
  uploadResume: async (resumeFile, jobPositionId = null) => {
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      if (jobPositionId) {
        formData.append('job_position_id', jobPositionId);
      }
      
      const response = await apiClient.post('/student/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถอัปโหลดเรซูเม่ได้');
    }
  },

  // Get resume history
  getResumeHistory: async () => {
    try {
      const response = await apiClient.get('/student/resume/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching resume history:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดประวัติเรซูเม่ได้');
    }
  },

  // Get application results
  getApplicationResults: async () => {
    try {
      const response = await apiClient.get('/student/applications/results');
      return response.data;
    } catch (error) {
      console.error('Error fetching application results:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดผลการสมัครได้');
    }
  },

  // Get available job positions
  getJobPositions: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await apiClient.get(`/student/job-positions?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job positions:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดตำแหน่งงานได้');
    }
  },

  // Get job position details
  getJobPositionDetails: async (positionId) => {
    try {
      const response = await apiClient.get(`/student/job-positions/${positionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job position details:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดรายละเอียดตำแหน่งงานได้');
    }
  },

  // Apply for job position
  applyForJob: async (positionId, resumeId) => {
    try {
      const response = await apiClient.post('/student/applications', {
        job_position_id: positionId,
        resume_id: resumeId
      });
      return response.data;
    } catch (error) {
      console.error('Error applying for job:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถสมัครงานได้');
    }
  },

  // Get matching score for resume
  getMatchingScore: async (resumeId, positionId) => {
    try {
      const response = await apiClient.post('/student/matching-score', {
        resume_id: resumeId,
        job_position_id: positionId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting matching score:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถคำนวณคะแนนความเหมาะสมได้');
    }
  },

  // Get resume analysis
  getResumeAnalysis: async (resumeId) => {
    try {
      const response = await apiClient.get(`/student/resume/${resumeId}/analysis`);
      return response.data;
    } catch (error) {
      console.error('Error getting resume analysis:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถวิเคราะห์เรซูเม่ได้');
    }
  },

  // Get dashboard data
  getDashboardData: async () => {
    try {
      const response = await apiClient.get('/student/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    }
  },

  // Get notifications
  getNotifications: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get(`/student/notifications?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดการแจ้งเตือนได้');
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await apiClient.put(`/student/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถอัปเดตสถานะการแจ้งเตือนได้');
    }
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    try {
      const response = await apiClient.put('/student/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถอัปเดตการตั้งค่าได้');
    }
  },

  // Get user preferences
  getPreferences: async () => {
    try {
      const response = await apiClient.get('/student/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดการตั้งค่าได้');
    }
  },

  // Delete resume
  deleteResume: async (resumeId) => {
    try {
      const response = await apiClient.delete(`/student/resume/${resumeId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting resume:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถลบเรซูเม่ได้');
    }
  },

  // Get skills suggestions
  getSkillsSuggestions: async (query = '') => {
    try {
      const response = await apiClient.get(`/student/skills/suggestions?q=${query}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching skills suggestions:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดคำแนะนำทักษะได้');
    }
  },

  // Logout
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      // Still remove local data even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return true;
    }
  }
};

// Named exports for backward compatibility
export const getProfile = studentService.getProfile;
export const updateProfile = studentService.updateProfile;
export const uploadProfileImage = studentService.uploadProfileImage;
export const changePassword = studentService.changePassword;
export const uploadResume = studentService.uploadResume;
export const getResumeHistory = studentService.getResumeHistory;
export const getApplicationResults = studentService.getApplicationResults;
export const getJobPositions = studentService.getJobPositions;
export const getJobPositionDetails = studentService.getJobPositionDetails;
export const applyForJob = studentService.applyForJob;
export const getMatchingScore = studentService.getMatchingScore;
export const getResumeAnalysis = studentService.getResumeAnalysis;
export const getDashboardData = studentService.getDashboardData;
export const getNotifications = studentService.getNotifications;
export const markNotificationAsRead = studentService.markNotificationAsRead;
export const updatePreferences = studentService.updatePreferences;
export const getPreferences = studentService.getPreferences;
export const deleteResume = studentService.deleteResume;
export const getSkillsSuggestions = studentService.getSkillsSuggestions;
export const logout = studentService.logout;

export default studentService;