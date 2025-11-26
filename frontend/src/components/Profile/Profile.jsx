// frontend/src/components/Profile/Profile.jsx - ระบบใหม่ทั้งหมด
import React, { useState, useEffect } from 'react';
// ✅ ลบ import useAuth ออก เพราะไม่ได้ใช้
import profileService from '../../services/profileService';
import NewProfileInfo from './ProfileInfo';
import NewChangePassword from './ChangePassword';
import NewSettings from './Settings';
import '../../styles/profile.css'; // CSS ใหม่

const Profile = () => {
  // ✅ ลบ const { user } = useAuth(); ออก
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลโปรไฟล์
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันอัปโหลดรูปโปรไฟล์ทันที
  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      setLoading(true);
      await profileService.uploadProfileImage(file);
      
      // รีเฟรชข้อมูลโปรไฟล์
      await fetchProfile();
      alert('อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="new-profile-container">
        <div className="profile-loading">
          <div className="profile-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="new-profile-container">
      {/* Header Section ใหม่ - เพิ่มปุ่มแก้ไขรูปกลับมา */}
      <div className="new-profile-header">
        <div className="new-profile-avatar">
          {profileData?.profile_image ? (
            <img 
              src={`http://localhost:8000${profileData.profile_image}`} 
              alt="Profile" 
              className="avatar-image"
            />
          ) : (
            <div className="avatar-placeholder">
              {getInitials(profileData?.full_name)}
            </div>
          )}
          
          {/* ปุ่มแก้ไขรูปโปรไฟล์ - เปลี่ยน icon เป็นกล้อง */}
          <div className="new-profile-edit-avatar-btn">
            <input
              type="file"
              id="new-avatar-upload"
              accept="image/jpeg,image/jpg,image/png"
              onChange={(e) => handleImageUpload(e.target.files[0])}
              style={{ display: 'none' }}
            />
            <label htmlFor="new-avatar-upload" style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%', 
              height: '100%' 
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </label>
          </div>

        </div>
        
        <div className="new-profile-header-info">
          <h1>{profileData?.full_name || 'System Administrator'}</h1>
          <p className="new-profile-email">{profileData?.email}</p>
          <span className="new-profile-role">{profileData?.user_type || 'ผู้ดูแลระบบ'}</span>
        </div>
      </div>

      {/* Tab Navigation ใหม่ */}
      <div className="new-profile-tabs">
        <button 
          className={`new-profile-tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          ข้อมูลส่วนตัว
        </button>

        <button 
          className={`new-profile-tab-button ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <circle cx="12" cy="16" r="1"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          เปลี่ยนรหัสผ่าน
        </button>

        <button 
          className={`new-profile-tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          ตั้งค่า
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <NewProfileInfo 
          profileData={profileData}
          onUpdateProfile={fetchProfile}
          profileService={profileService}
        />
      )}

      {activeTab === 'password' && (
        <NewChangePassword 
          profileService={profileService}
        />
      )}

      {activeTab === 'settings' && (
        <NewSettings 
          profileData={profileData}
          profileService={profileService}
        />
      )}
    </div>
  );
};

export default Profile;