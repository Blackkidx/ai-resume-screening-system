// frontend/src/components/Profile/NewProfileInfo.jsx
import React, { useState } from 'react';

const ProfileInfo = ({ profileData, onUpdateProfile, profileService }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profileData?.full_name || '',
    email: profileData?.email || '',
    phone: profileData?.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      full_name: profileData?.full_name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || ''
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImageFile(null);
    setPreviewImage(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Validate file ก่อน
        profileService.validateImageFile(file);
        
        setImageFile(file);
        
        // สร้าง preview
        const preview = await profileService.createImagePreview(file);
        setPreviewImage(preview);
      } catch (error) {
        alert(error.message);
        e.target.value = ''; // Reset file input
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!profileService.validateEmail(formData.email)) {
        throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
      }

      if (!profileService.validatePhone(formData.phone)) {
        throw new Error('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
      }

      // อัปเดตข้อมูลโปรไฟล์และรูปภาพพร้อมกัน
      await profileService.updateProfileWithImage(formData, imageFile);

      alert('อัปเดตข้อมูลเรียบร้อยแล้ว');
      setIsEditing(false);
      setImageFile(null);
      setPreviewImage(null);
      onUpdateProfile(); // รีเฟรชข้อมูล

    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isEditing ? (
        // แสดงข้อมูลแบบ Card Layout ใหม่ (รูปที่ 1)
        <div className="new-profile-info-section">
          <div className="new-profile-info-container">
            <div className="new-profile-info-header">
              <h2>ข้อมูลส่วนตัว</h2>
              <button 
                className="new-edit-btn"
                onClick={handleEdit}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                แก้ไข
              </button>
            </div>

            <div className="new-profile-cards-grid">
              <div className="new-profile-card">
                <div className="new-profile-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="new-profile-card-content">
                  <span className="new-profile-card-label">ชื่อ-นามสกุล</span>
                  <p className="new-profile-card-value">{profileData?.full_name || 'admin_test'}</p>
                </div>
              </div>

              <div className="new-profile-card">
                <div className="new-profile-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div className="new-profile-card-content">
                  <span className="new-profile-card-label">อีเมล</span>
                  <p className="new-profile-card-value">{profileData?.email || 'admin@internscreen.com'}</p>
                </div>
              </div>

              <div className="new-profile-card">
                <div className="new-profile-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div className="new-profile-card-content">
                  <span className="new-profile-card-label">เบอร์โทรศัพท์</span>
                  <p className="new-profile-card-value">{profileData?.phone || '098-999-9999'}</p>
                </div>
              </div>

              <div className="new-profile-card">
                <div className="new-profile-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <div className="new-profile-card-content">
                  <span className="new-profile-card-label">สถานะ</span>
                  <p className="new-profile-card-value status-active">ใช้งาน</p>
                </div>
              </div>

              <div className="new-profile-card single-card">
                <div className="new-profile-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div className="new-profile-card-content">
                  <span className="new-profile-card-label">วันที่สมัคร</span>
                  <p className="new-profile-card-value">{profileService?.formatDate(profileData?.created_at) || '5/6/2568'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ฟอร์มแก้ไขแบบใหม่ (ระบบเดิมแต่ใช้ style ใหม่)
        <div className="new-profile-edit-section">
          <div className="new-profile-edit-container">
            <div className="new-profile-edit-header">
              <h2>แก้ไขข้อมูลส่วนตัว</h2>
            </div>

            <form onSubmit={handleSubmit} className="new-profile-edit-form">
              {/* อัปโหลดรูปภาพ */}
              <div className="new-profile-edit-form-group image-upload">
                <label>รูปโปรไฟล์</label>
                <div className="new-profile-image-upload-area">
                  <div className="new-profile-current-image">
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" />
                    ) : profileData?.profile_image ? (
                      <img src={`http://localhost:8000${profileData.profile_image}`} alt="Current" />
                    ) : (
                      <div className="new-profile-no-image">ไม่มีรูปภาพ</div>
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

              <div className="new-profile-edit-form-row">
                <div className="new-profile-edit-form-group">
                  <label htmlFor="full_name">ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className="new-profile-edit-input"
                    disabled={loading}
                  />
                </div>

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
              </div>

              <div className="new-profile-edit-form-row">
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
                    placeholder="080-xxx-xxxx"
                  />
                </div>

                <div className="new-profile-edit-form-group">
                  <label htmlFor="created_at">วันที่สมัครสมาชิก</label>
                  <input
                    type="text"
                    value={profileService?.formatDate(profileData?.created_at) || '5/6/2568'}
                    readOnly
                    className="new-profile-edit-input readonly"
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