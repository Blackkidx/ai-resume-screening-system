// frontend/src/components/Profile/ProfileInfo.jsx
import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';

const ProfileInfo = ({ profileData, onUpdateProfile, profileService }) => {
  const notify = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleEdit = () => {
    setIsEditing(true);
    // Split full_name into first/last if no separate fields exist
    let firstName = profileData?.first_name || '';
    let lastName = profileData?.last_name || '';
    if (!firstName && !lastName && profileData?.full_name) {
      const parts = profileData.full_name.split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }
    setFormData({
      username: profileData?.username || '',
      first_name: firstName,
      last_name: lastName,
      email: profileData?.email || '',
      phone: profileService?.autoFormatPhoneInput(profileData?.phone || '') || ''
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImageFile(null);
    setPreviewImage(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Auto-format Thai phone number as user types
      setFormData(prev => ({
        ...prev,
        phone: profileService.autoFormatPhoneInput(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        profileService.validateImageFile(file);
        setImageFile(file);
        const preview = await profileService.createImagePreview(file);
        setPreviewImage(preview);
      } catch (error) {
        notify.error(error.message);
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!profileService.validateEmail(formData.email)) {
        throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
      }

      const rawPhone = profileService.parsePhoneDigits(formData.phone);
      if (rawPhone && !profileService.validatePhone(rawPhone)) {
        throw new Error('เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นเลข 9-10 หลัก)');
      }

      const submitData = {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: rawPhone || ''
      };

      await profileService.updateProfileWithImage(submitData, imageFile);

      notify.success('อัปเดตข้อมูลเรียบร้อยแล้ว');
      setIsEditing(false);
      setImageFile(null);
      setPreviewImage(null);
      onUpdateProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      notify.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Format display phone number
  const displayPhone = profileService?.formatThaiPhone(profileData?.phone) || '-';

  // Get display full name
  const displayName = (() => {
    if (profileData?.first_name || profileData?.last_name) {
      return `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
    }
    return profileData?.full_name || '-';
  })();

  return (
    <>
      {!isEditing ? (
        <div className="new-profile-info-section">
          <div className="new-profile-info-container">
            <div className="new-profile-info-header">
              <h2>ข้อมูลส่วนตัว</h2>
              <button
                className="new-edit-btn"
                onClick={handleEdit}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                แก้ไข
              </button>
            </div>

            <div className="new-profile-cards-grid">
              {/* Username */}
              <div className="new-profile-card">
                <div className="new-profile-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="new-profile-card-content">
                  <span className="new-profile-card-label">Username</span>
                  <p className="new-profile-card-value">{profileData?.username || '-'}</p>
                </div>
              </div>

              {/* Email */}
              <div className="new-profile-card">
                <div className="new-profile-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div className="new-profile-card-content">
                  <span className="new-profile-card-label">อีเมล</span>
                  <p className="new-profile-card-value">{profileData?.email || '-'}</p>
                </div>
              </div>

              {/* Full Name */}
              <div className="new-profile-card">
                <div className="new-profile-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="new-profile-card-content">
                  <span className="new-profile-card-label">ชื่อ-นามสกุล</span>
                  <p className="new-profile-card-value">{displayName}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="new-profile-card">
                <div className="new-profile-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="new-profile-card-content">
                  <span className="new-profile-card-label">เบอร์โทรศัพท์</span>
                  <p className="new-profile-card-value">{displayPhone}</p>
                </div>
              </div>

              {/* Registration Date */}
              <div className="new-profile-card single-card">
                <div className="new-profile-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="new-profile-card-content">
                  <span className="new-profile-card-label">วันที่สมัคร</span>
                  <p className="new-profile-card-value">{profileService?.formatDate(profileData?.created_at) || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="new-profile-edit-section">
          <div className="new-profile-edit-container">
            <div className="new-profile-edit-header">
              <h2>แก้ไขข้อมูลส่วนตัว</h2>
            </div>

            <form onSubmit={handleSubmit} className="new-profile-edit-form">
              {/* Profile Image Upload */}
              <div className="new-profile-edit-form-group image-upload">
                <label>รูปโปรไฟล์</label>
                <div className="new-profile-image-upload-area">
                  <div className="new-profile-current-image">
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" />
                    ) : profileData?.profile_image ? (
                      <img src={`http://localhost:8000${profileData.profile_image}`} alt="Current" />
                    ) : (
                      <div className="new-profile-no-image avatar-anonymous-small">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                          <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5S7 4.24 7 7s2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="new-profile-upload-controls">
                    <input
                      type="file"
                      id="new-profile-image-edit"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageChange}
                      className="new-profile-file-input"
                    />
                    <label htmlFor="new-profile-image-edit" className="new-profile-btn-upload">
                      เลือกรูปภาพ
                    </label>
                    <small>รองรับ JPG, PNG ขนาดไม่เกิน 5MB</small>
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="new-profile-edit-form-row single-field">
                <div className="new-profile-edit-form-group">
                  <label htmlFor="username">Username *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="new-profile-edit-input"
                    disabled={loading}
                    placeholder="username"
                  />
                </div>
              </div>

              {/* First Name + Last Name row */}
              <div className="new-profile-edit-form-row">
                <div className="new-profile-edit-form-group">
                  <label htmlFor="first_name">ชื่อ *</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    className="new-profile-edit-input"
                    disabled={loading}
                    placeholder="ชื่อ"
                  />
                </div>

                <div className="new-profile-edit-form-group">
                  <label htmlFor="last_name">นามสกุล *</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    className="new-profile-edit-input"
                    disabled={loading}
                    placeholder="นามสกุล"
                  />
                </div>
              </div>

              {/* Email + Phone row */}
              <div className="new-profile-edit-form-row">
                <div className="new-profile-edit-form-group">
                  <label htmlFor="email">อีเมล *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="new-profile-edit-input"
                    disabled={loading}
                  />
                </div>

                <div className="new-profile-edit-form-group">
                  <label htmlFor="phone">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="new-profile-edit-input"
                    disabled={loading}
                    placeholder="0XX-XXX-XXXX"
                    maxLength={12}
                  />
                </div>
              </div>

              <div className="new-profile-edit-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="new-profile-btn-cancel"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="new-profile-btn-save"
                  disabled={loading}
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileInfo;