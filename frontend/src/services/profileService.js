// frontend/src/services/profileService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ProfileService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/profile`;
  }

  // Helper method สำหรับ headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Helper method สำหรับ file upload headers
  getFileUploadHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`
      // ไม่ใส่ Content-Type สำหรับ FormData
    };
  }

  // Helper method สำหรับจัดการ response
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  // ดึงข้อมูลโปรไฟล์
  async getProfile() {
    try {
      const response = await fetch(this.baseURL, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // อัปเดตข้อมูลโปรไฟล์
  async updateProfile(profileData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // อัปโหลดรูปโปรไฟล์
  async uploadProfileImage(imageFile) {
    try {
      // Validate file ก่อน
      this.validateImageFile(imageFile);

      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch(`${this.baseURL}/upload-image`, {
        method: 'POST',
        headers: this.getFileUploadHeaders(),
        body: formData
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  // ลบรูปโปรไฟล์
  async deleteProfileImage() {
    try {
      const response = await fetch(`${this.baseURL}/image`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error deleting profile image:', error);
      throw error;
    }
  }

  // เปลี่ยนรหัสผ่าน
  async changePassword(passwordData) {
    try {
      const response = await fetch(`${this.baseURL}/change-password`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(passwordData)
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // ตรวจสอบความแข็งแกร่งของรหัสผ่าน
  validatePassword(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength,
      strength: {
        length: password.length >= minLength,
        upperCase: hasUpperCase,
        lowerCase: hasLowerCase,
        numbers: hasNumbers,
        specialChar: hasSpecialChar
      },
      score: [
        password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      ].filter(Boolean).length
    };
  }

  // Format วันที่
  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Validate email
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number
  validatePhone(phone) {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[0-9-+\s()]+$/;
    return phoneRegex.test(phone) && phone.length >= 9;
  }

  // Validate image file
  validateImageFile(file) {
    if (!file) {
      throw new Error('กรุณาเลือกไฟล์รูปภาพ');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('รองรับเฉพาะไฟล์ JPG, JPEG, PNG เท่านั้น');
    }

    if (file.size > maxSize) {
      throw new Error('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
    }

    return true;
  }

  // สร้าง preview image URL
  createImagePreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // รวมอัปเดตโปรไฟล์ + อัปโหลดรูป
  async updateProfileWithImage(profileData, imageFile = null) {
    try {
      // อัปเดตข้อมูลโปรไฟล์ก่อน
      const profileResult = await this.updateProfile(profileData);

      // ถ้ามีรูปภาพ ให้อัปโหลด
      if (imageFile) {
        const imageResult = await this.uploadProfileImage(imageFile);
        return {
          ...profileResult,
          image_url: imageResult.image_url
        };
      }

      return profileResult;
    } catch (error) {
      console.error('Error updating profile with image:', error);
      throw error;
    }
  }
}

// Export single instance
export default new ProfileService();