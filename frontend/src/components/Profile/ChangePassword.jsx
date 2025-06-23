// frontend/src/components/Profile/ChangePassword.jsx
import React, { useState } from 'react';

const ChangePassword = ({ profileService }) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = () => {
    if (formData.new_password.length < 6) {
      alert('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return false;
    }

    if (formData.new_password !== formData.confirm_password) {
      alert('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      await profileService.changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password
      });

      alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

    } catch (error) {
      console.error('Error changing password:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-section">
      <div className="profile-section-header">
        <h2>เปลี่ยนรหัสผ่าน</h2>
      </div>

      <form onSubmit={handleSubmit} className="profile-password-form">
        <div className="profile-form-group">
          <label htmlFor="current_password">รหัสผ่านปัจจุบัน *</label>
          <div className="profile-password-input-wrapper">
            <input
              type={showPasswords.current ? "text" : "password"}
              id="current_password"
              name="current_password"
              value={formData.current_password}
              onChange={handleInputChange}
              required
              className="profile-form-input"
              disabled={loading}
              placeholder="กรอกรหัสผ่านปัจจุบัน"
            />
            <button
              type="button"
              className="profile-password-toggle"
              onClick={() => togglePasswordVisibility('current')}
            >
              {showPasswords.current ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="profile-form-group">
          <label htmlFor="new_password">รหัสผ่านใหม่ *</label>
          <div className="profile-password-input-wrapper">
            <input
              type={showPasswords.new ? "text" : "password"}
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleInputChange}
              required
              className="profile-form-input"
              disabled={loading}
              placeholder="กรอกรหัสผ่านใหม่"
            />
            <button
              type="button"
              className="profile-password-toggle"
              onClick={() => togglePasswordVisibility('new')}
            >
              {showPasswords.new ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <small className="profile-password-hint">รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร</small>
        </div>

        <div className="profile-form-group">
          <label htmlFor="confirm_password">ยืนยันรหัสผ่านใหม่ *</label>
          <div className="profile-password-input-wrapper">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleInputChange}
              required
              className="profile-form-input"
              disabled={loading}
              placeholder="ยืนยันรหัสผ่านใหม่"
            />
            <button
              type="button"
              className="profile-password-toggle"
              onClick={() => togglePasswordVisibility('confirm')}
            >
              {showPasswords.confirm ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="profile-form-actions">
          <button
            type="submit"
            className="profile-btn-change-password"
            disabled={loading}
          >
            {loading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </div>
      </form>

      <div className="profile-password-tips">
        <h3>⚠️ ข้อแนะนำในการตั้งรหัสผ่าน</h3>
        <ul>
          <li>ใช้รหัสผ่านที่มีความยาวอย่างน้อย 6 ตัวอักษร</li>
          <li>ผสมผสานตัวอักษรพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และสัญลักษณ์</li>
          <li>หลีกเลี่ยงการใช้ข้อมูลส่วนตัว เช่น ชื่อ วันเกิด</li>
          <li>ไม่ควรใช้รหัสผ่านเดียวกันในหลายบัญชี</li>
        </ul>
      </div>
    </div>
  );
};

export default ChangePassword;