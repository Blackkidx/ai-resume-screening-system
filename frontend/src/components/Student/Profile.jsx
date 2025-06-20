import React, { useState, useEffect, useCallback } from 'react';
import { getProfile, updateProfile, uploadProfileImage, changePassword } from '../../services/studentService';
import '../../styles/Profile.css';  

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  // Form data
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // Image upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      console.log('Profile data received:', data); // debug ข้อมูล profile
      console.log('Profile image path:', data.profile_image); // debug path รูป
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || ''
      });
    } catch (error) {
      showNotification('error', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
        return;
      }
      
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    
    try {
      setUploading(true);
      console.log('Uploading file:', imageFile.name, imageFile.size);
      await uploadProfileImage(imageFile);
      showNotification('success', 'อัปโหลดรูปภาพสำเร็จ!');
      setImageFile(null);
      setImagePreview(null);
      loadProfile();
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('error', error.message || 'ไม่สามารถอัปโหลดรูปภาพได้');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile(formData);
      showNotification('success', 'อัปเดตข้อมูลสำเร็จ!');
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      showNotification('error', 'ไม่สามารถอัปเดตข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showNotification('error', 'รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      showNotification('error', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      setSaving(true);
      await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      showNotification('success', 'เปลี่ยนรหัสผ่านสำเร็จ!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setActiveTab('profile');
    } catch (error) {
      showNotification('error', error.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setSaving(false);
    }
  };

  // ฟังก์ชันสำหรับสร้าง default avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ฟังก์ชันสำหรับ URL รูปโปรไฟล์
  const getProfileImageUrl = () => {
    if (imagePreview) return imagePreview;
    if (profile?.profile_image) {
      // ถ้าเป็น absolute URL
      if (profile.profile_image.startsWith('http')) {
        return profile.profile_image;
      }
      
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      
      // ใช้ static files mounting - ง่ายและเร็วที่สุด
      let imagePath = profile.profile_image;
      
      // ถ้า backend ส่งมาเป็น full path (/uploads/profiles/xxx.jpg)
      if (imagePath.startsWith('/uploads')) {
        imagePath = imagePath; // ใช้ตรงๆ
      } else {
        // ถ้าส่งมาแค่ชื่อไฟล์หรือ partial path
        imagePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        if (!imagePath.startsWith('/uploads')) {
          imagePath = `/uploads/profiles${imagePath}`;
        }
      }
      
      const fullURL = `${baseURL}${imagePath}`;
      console.log('Profile image URL:', fullURL);
      console.log('Original path from backend:', profile.profile_image);
      return fullURL;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="floating-elements"></div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Floating Background Elements */}
      <div className="floating-elements"></div>
      
      {/* Notification */}
      {notification.show && (
        <div className={`notification ${notification.type} slide-in`}>
          <div className="notification-content">
            <span>{notification.type === 'success' ? '✅' : '❌'}</span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="profile-header fade-in">
        <div className="header-content">
          <div className="profile-avatar-container">
            <div className="avatar-wrapper">
              {getProfileImageUrl() ? (
                <img 
                  src={getProfileImageUrl()} 
                  alt="Profile" 
                  className="profile-avatar"
                  onLoad={() => console.log('Image loaded successfully')}
                  onError={(e) => {
                    console.error('Image failed to load:', e.target.src);
                    // ถ้าโหลดรูปไม่ได้ ให้แสดง default avatar
                    e.target.style.display = 'none';
                    const defaultAvatar = e.target.parentNode.querySelector('.default-avatar');
                    if (defaultAvatar) {
                      defaultAvatar.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              
              {/* Default Avatar */}
              <div 
                className="default-avatar" 
                style={{ display: getProfileImageUrl() ? 'none' : 'flex' }}
              >
                {getInitials(profile?.full_name)}
              </div>
              
              {/* Upload Overlay */}
              <div className="avatar-overlay">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <label htmlFor="avatar-upload" className="avatar-upload-btn">
                  {uploading ? <div className="btn-spinner"></div> : '📷'}
                </label>
              </div>
            </div>
            
            {/* Upload Confirm Button */}
            {imageFile && (
              <button 
                onClick={handleImageUpload}
                disabled={uploading}
                className="upload-confirm-btn"
              >
                {uploading ? 'กำลังอัปโหลด...' : 'บันทึกรูป'}
              </button>
            )}
          </div>
          
          <div className="profile-info">
            <h1 className="profile-name">
              {profile?.full_name || 'ผู้ใช้งาน'}
            </h1>
            <p className="profile-email">{profile?.email}</p>
            <div className="profile-badge">
              <span className="badge student-badge">นักศึกษา</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs scale-in">
        <button 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="tab-icon">👤</span>
          ข้อมูลส่วนตัว
        </button>
        <button 
          className={`tab ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <span className="tab-icon">🔐</span>
          เปลี่ยนรหัสผ่าน
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="tab-icon">⚙️</span>
          ตั้งค่า
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div className="tab-content fade-in">
            <div className="content-header">
              <h2>ข้อมูลส่วนตัว</h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`edit-btn ${isEditing ? 'cancel' : ''}`}
              >
                {isEditing ? '❌ ยกเลิก' : '✏️ แก้ไข'}
              </button>
            </div>

            {isEditing ? (
              // Edit Form
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>ชื่อ-นามสกุล</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="กรอกชื่อ-นามสกุล"
                        required
                      />
                      <span className="input-icon">👤</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>อีเมล</label>
                    <div className="input-wrapper">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="กรอกอีเมล"
                        required
                      />
                      <span className="input-icon">📧</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>เบอร์โทร</label>
                    <div className="input-wrapper">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="กรอกเบอร์โทร"
                      />
                      <span className="input-icon">📱</span>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="save-btn"
                  >
                    {saving ? (
                      <>
                        <div className="btn-spinner"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        💾 บันทึกข้อมูล
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // Display Profile Info
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-icon">👤</div>
                  <div className="info-content">
                    <label>ชื่อผู้ใช้</label>
                    <span>{profile?.username || profile?.full_name || '-'}</span>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">📧</div>
                  <div className="info-content">
                    <label>อีเมล</label>
                    <span>{profile?.email || '-'}</span>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">📱</div>
                  <div className="info-content">
                    <label>เบอร์โทร</label>
                    <span>{profile?.phone || 'ไม่ได้ระบุ'}</span>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">📅</div>
                  <div className="info-content">
                    <label>วันที่สมัคร</label>
                    <span>
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString('th-TH')
                        : '-'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Password Change Tab */}
        {activeTab === 'password' && (
          <div className="tab-content fade-in">
            <div className="content-header">
              <h2>เปลี่ยนรหัสผ่าน</h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="form-group">
                <label>รหัสผ่านปัจจุบัน</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    placeholder="กรอกรหัสผ่านปัจจุบัน"
                    required
                  />
                  <span className="input-icon">🔒</span>
                </div>
              </div>

              <div className="form-group">
                <label>รหัสผ่านใหม่</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    placeholder="กรอกรหัสผ่านใหม่"
                    minLength="6"
                    required
                  />
                  <span className="input-icon">🔑</span>
                </div>
              </div>

              <div className="form-group">
                <label>ยืนยันรหัสผ่านใหม่</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordForm.confirm_password}
                    onChange={handlePasswordChange}
                    placeholder="ยืนยันรหัสผ่านใหม่"
                    minLength="6"
                    required
                  />
                  <span className="input-icon">✅</span>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="save-btn"
                >
                  {saving ? (
                    <>
                      <div className="btn-spinner"></div>
                      กำลังเปลี่ยน...
                    </>
                  ) : (
                    <>
                      🔐 เปลี่ยนรหัสผ่าน
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="password-tips">
              <h3>💡 ข้อแนะนำรหัสผ่าน</h3>
              <ul>
                <li>ใช้อย่างน้อย 6 ตัวอักษร</li>
                <li>ควรมีตัวเลขและตัวอักษร</li>
                <li>ไม่ควรใช้ข้อมูลส่วนตัว</li>
                <li>เปลี่ยนรหัสผ่านเป็นประจำ</li>
              </ul>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="tab-content fade-in">
            <div className="content-header">
              <h2>ตั้งค่า</h2>
            </div>

            <div className="settings-grid">
              <div className="setting-card">
                <div className="setting-icon">🔔</div>
                <div className="setting-content">
                  <h3>การแจ้งเตือน</h3>
                  <p>จัดการการแจ้งเตือนของระบบ</p>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-icon">🌙</div>
                <div className="setting-content">
                  <h3>โหมดมืด</h3>
                  <p>เปลี่ยนธีมเป็นโหมดมืด</p>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-icon">🌐</div>
                <div className="setting-content">
                  <h3>ภาษา</h3>
                  <p>เลือกภาษาที่ต้องการใช้</p>
                  <select className="language-select">
                    <option value="th">ไทย</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-icon">🔒</div>
                <div className="setting-content">
                  <h3>ความเป็นส่วนตัว</h3>
                  <p>ตั้งค่าความเป็นส่วนตัวของข้อมูล</p>
                  <button className="privacy-btn">
                    ตั้งค่า
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;