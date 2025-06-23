// frontend/src/components/Profile/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import profileService from '../../services/profileService'; // 🔗 Import Service
import ProfileInfo from './ProfileInfo';
import ChangePassword from './ChangePassword';
import Settings from './Settings';
import '../../styles/profile.css';

const Profile = () => {
  const { user } = useAuth();
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
      const data = await profileService.getProfile(); // 🔗 ใช้ Service
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

  // ฟังก์ชันลบรูปโปรไฟล์
  const handleImageDelete = async () => {
    if (!profileData?.profile_image) return;

    if (window.confirm('คุณต้องการลบรูปโปรไฟล์หรือไม่?')) {
      try {
        setLoading(true);
        await profileService.deleteProfileImage();
        
        // รีเฟรชข้อมูลโปรไฟล์
        await fetchProfile();
        alert('ลบรูปโปรไฟล์เรียบร้อยแล้ว');
      } catch (error) {
        console.error('Error deleting image:', error);
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
      } finally {
        setLoading(false);
      }
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
      <div className="profile-container">
        <div className="profile-loading">
          <div className="profile-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header Section */}
      <div className="profile-header">
        <div className="profile-avatar">
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
          
          {/* ปุ่มแก้ไขรูปโปรไฟล์ */}
          <div className="profile-edit-avatar-btn">
            <input
              type="file"
              id="avatar-upload"
              accept="image/jpeg,image/jpg,image/png"
              onChange={(e) => handleImageUpload(e.target.files[0])}
              style={{ display: 'none' }}
            />
            <label htmlFor="avatar-upload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </label>
          </div>

          {/* ปุ่มลบรูป (แสดงเฉพาะเมื่อมีรูป) */}
          {profileData?.profile_image && (
            <button 
              className="profile-delete-avatar-btn"
              onClick={handleImageDelete}
              title="ลบรูปโปรไฟล์"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          )}
        </div>
        
        <div className="profile-header-info">
          <h1>{profileData?.full_name || 'System Administrator'}</h1>
          <p className="profile-email">{profileData?.email}</p>
          <span className="profile-role">{profileData?.user_type}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="profile-tabs">
        <button 
          className={`profile-tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          ข้อมูลส่วนตัว
        </button>

        <button 
          className={`profile-tab-button ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <circle cx="12" cy="16" r="1"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          แก้ไขรหัสผ่าน
        </button>

        <button 
          className={`profile-tab-button ${activeTab === 'settings' ? 'active' : ''}`}
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
      <div className="profile-content">
        {activeTab === 'profile' && (
          <ProfileInfo 
            profileData={profileData} 
            onUpdateProfile={fetchProfile}
            profileService={profileService} // 🔗 ส่ง Service ให้ Child
          />
        )}
        {activeTab === 'password' && (
          <ChangePassword 
            profileService={profileService} // 🔗 ส่ง Service ให้ Child
          />
        )}
        {activeTab === 'settings' && (
          <Settings 
            profileData={profileData}
            profileService={profileService} // 🔗 ส่ง Service ให้ Child
          />
        )}
      </div>
    </div>
  );
};

export default Profile;