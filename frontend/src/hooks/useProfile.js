// frontend/src/hooks/useProfile.js - Custom Hook สำหรับจัดการโปรไฟล์
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import profileService from '../services/profileService';

/**
 * Custom hook สำหรับจัดการข้อมูลโปรไฟล์
 * ใช้สำหรับ sync ข้อมูลโปรไฟล์ระหว่าง components
 */
export const useProfile = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ดึงข้อมูลโปรไฟล์
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated()) {
      setProfileData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await profileService.getProfile();
      setProfileData(data);
      
      // อัปเดต user context ด้วยข้อมูลใหม่
      if (data && user) {
        updateUser({
          ...user,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          profile_image: data.profile_image
        });
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
      // ถ้าดึงไม่ได้ ใช้ข้อมูลจาก user context
      setProfileData(user);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, updateUser]);

  // อัปเดตโปรไฟล์
  const updateProfile = useCallback(async (profileDataToUpdate) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedData = await profileService.updateProfile(profileDataToUpdate);
      
      // รีเฟรชข้อมูลหลังอัปเดต
      await fetchProfile();
      
      return updatedData;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  // อัปโหลดรูปโปรไฟล์
  const uploadProfileImage = useCallback(async (imageFile) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await profileService.uploadProfileImage(imageFile);
      
      // รีเฟรชข้อมูลหลังอัปโหลด
      await fetchProfile();
      
      return result;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  // ลบรูปโปรไฟล์
  const deleteProfileImage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await profileService.deleteProfileImage();
      
      // รีเฟรชข้อมูลหลังลบ
      await fetchProfile();
      
      return result;
    } catch (error) {
      console.error('Error deleting profile image:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  // เปลี่ยนรหัสผ่าน
  const changePassword = useCallback(async (passwordData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await profileService.changePassword(passwordData);
      
      return result;
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ฟังก์ชันช่วยเหลือ
  const getInitials = useCallback((fullName) => {
    if (!fullName) return 'U';
    
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }, []);

  const getDisplayName = useCallback((fullName) => {
    if (!fullName) return 'User';
    
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return names[0]; // แสดงแค่ชื่อ
    }
    return fullName;
  }, []);

  const getProfileImageUrl = useCallback(() => {
    // ลำดับความสำคัญ: profileData > user context
    const imageUrl = profileData?.profile_image || user?.profile_image;
    
    if (imageUrl) {
      // ถ้าเป็น URL เต็ม ใช้เลย
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      }
      // ถ้าเป็น path สัมพัทธ์ เพิ่ม base URL
      return `http://localhost:8000${imageUrl}`;
    }
    
    return null;
  }, [profileData, user]);

  // Auto-fetch เมื่อ user เปลี่ยน
  useEffect(() => {
    if (isAuthenticated() && user && !profileData) {
      fetchProfile();
    }
  }, [user, isAuthenticated, profileData, fetchProfile]);

  // Reset เมื่อ logout
  useEffect(() => {
    if (!isAuthenticated()) {
      setProfileData(null);
      setError(null);
    }
  }, [isAuthenticated]);

  return {
    // Data
    profileData,
    user,
    loading,
    error,
    
    // Actions
    fetchProfile,
    updateProfile,
    uploadProfileImage,
    deleteProfileImage,
    changePassword,
    
    // Helpers
    getInitials,
    getDisplayName,
    getProfileImageUrl,
    
    // Computed
    hasProfileImage: !!getProfileImageUrl(),
    fullName: profileData?.full_name || user?.full_name || '',
    email: profileData?.email || user?.email || '',
    userType: profileData?.user_type || user?.user_type || ''
  };
};

export default useProfile;