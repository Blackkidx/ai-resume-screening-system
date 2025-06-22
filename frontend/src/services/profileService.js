// frontend/src/services/profileService.js - ไฟล์ใหม่สำหรับจัดการโปรไฟล์ทุก Role
import axios from 'axios';

// Base API URL
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

// Profile Service Functions (ทุก Role สามารถใช้ได้)
export const profileService = {
  // Get profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error(error.response?.data?.detail || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.detail || 'ไม่สามารถอัปเดตข้อมูลได้');
    }
  },

  // Upload profile image
  uploadProfileImage: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const response = await apiClient.post('/profile/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw new Error(error.response?.data?.detail || 'ไม่สามารถอัปโหลดรูปภาพได้');
    }
  },

  // Delete profile image
  deleteProfileImage: async () => {
    try {
      const response = await apiClient.delete('/profile/image');
      return response.data;
    } catch (error) {
      console.error('Error deleting profile image:', error);
      throw new Error(error.response?.data?.detail || 'ไม่สามารถลบรูปภาพได้');
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.post('/profile/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw new Error(error.response?.data?.detail || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    }
  },

  // Get dashboard data (ข้อมูลต่างกันตาม Role)
  getDashboardData: async () => {
    try {
      const response = await apiClient.get('/profile/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(error.response?.data?.detail || 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    }
  },
};

// Named exports for backward compatibility
export const getProfile = profileService.getProfile;
export const updateProfile = profileService.updateProfile;
export const uploadProfileImage = profileService.uploadProfileImage;
export const deleteProfileImage = profileService.deleteProfileImage;
export const changePassword = profileService.changePassword;
export const getDashboardData = profileService.getDashboardData;

export default profileService;