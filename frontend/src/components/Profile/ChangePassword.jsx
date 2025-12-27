// frontend/src/components/Profile/NewChangePassword.jsx
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
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    isValid: false
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Check password strength for new password
    if (name === 'new_password') {
      checkPasswordStrength(value);
    }

    // Check confirm password match
    if (name === 'confirm_password' || (name === 'new_password' && formData.confirm_password)) {
      const newPass = name === 'new_password' ? value : formData.new_password;
      const confirmPass = name === 'confirm_password' ? value : formData.confirm_password;
      
      if (confirmPass && newPass !== confirmPass) {
        setErrors(prev => ({
          ...prev,
          confirm_password: 'รหัสผ่านไม่ตรงกัน'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          confirm_password: ''
        }));
      }
    }
  };

  const checkPasswordStrength = (password) => {
    if (!profileService?.validatePassword) {
      // Simple validation if service method not available
      const score = password.length >= 8 ? 4 : password.length >= 6 ? 2 : password.length >= 1 ? 1 : 0;
      setPasswordStrength({
        score,
        isValid: score >= 2,
        feedback: score < 2 ? ['รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'] : []
      });
      return;
    }

    const validation = profileService.validatePassword(password);
    setPasswordStrength({
      score: validation.score,
      isValid: validation.isValid,
      feedback: generatePasswordFeedback(validation.strength)
    });
  };

  const generatePasswordFeedback = (strength) => {
    const feedback = [];
    if (!strength.length) feedback.push('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    if (!strength.upperCase) feedback.push('ควรมีตัวอักษรพิมพ์ใหญ่');
    if (!strength.lowerCase) feedback.push('ควรมีตัวอักษรพิมพ์เล็ก');
    if (!strength.numbers) feedback.push('ควรมีตัวเลข');
    if (!strength.specialChar) feedback.push('ควรมีสัญลักษณ์พิเศษ');
    return feedback;
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return '#f44336'; // แดง
      case 2:
        return '#ff9800'; // ส้ม
      case 3:
        return '#ffc107'; // เหลือง
      case 4:
      case 5:
        return '#4caf50'; // เขียว
      default:
        return '#f44336';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength.score) {
      case 0:
        return '';
      case 1:
        return 'อ่อนมาก';
      case 2:
        return 'อ่อน';
      case 3:
        return 'ปานกลาง';
      case 4:
        return 'แข็งแกร่ง';
      case 5:
        return 'แข็งแกร่งมาก';
      default:
        return '';
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.current_password) {
      newErrors.current_password = 'กรุณากรอกรหัสผ่านปัจจุบัน';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'กรุณากรอกรหัสผ่านใหม่';
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'กรุณายืนยันรหัสผ่านใหม่';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน';
    }

    if (formData.current_password === formData.new_password) {
      newErrors.new_password = 'รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // เปลี่ยนรหัสผ่าน
      await profileService.changePassword(formData);

      alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      
      // Reset form
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setErrors({});
      setPasswordStrength({ score: 0, feedback: [], isValid: false });

    } catch (error) {
      console.error('Error changing password:', error);
      if (error.message.includes('current password')) {
        setErrors({ current_password: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      } else {
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-password-section">
      <div className="new-password-container">
        <div className="new-password-header">
          <h2>เปลี่ยนรหัสผ่าน</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* รหัสผ่านปัจจุบัน */}
          <div className="new-password-form-group">
            <label htmlFor="current_password">รหัสผ่านปัจจุบัน</label>
            <div className="new-password-input-wrapper">
              <input
                type={showPasswords.current ? "text" : "password"}
                id="current_password"
                name="current_password"
                value={formData.current_password}
                onChange={handleInputChange}
                className={`new-password-input ${errors.current_password ? 'error' : ''}`}
                disabled={loading}
                placeholder="กรอกรหัสผ่านปัจจุบัน"
              />
              <button
                type="button"
                className="new-password-toggle"
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
            {errors.current_password && (
              <div className="new-password-error">{errors.current_password}</div>
            )}
          </div>

          {/* รหัสผ่านใหม่ */}
          <div className="new-password-form-group">
            <label htmlFor="new_password">รหัสผ่านใหม่</label>
            <div className="new-password-input-wrapper">
              <input
                type={showPasswords.new ? "text" : "password"}
                id="new_password"
                name="new_password"
                value={formData.new_password}
                onChange={handleInputChange}
                className={`new-password-input ${errors.new_password ? 'error' : ''}`}
                disabled={loading}
                placeholder="กรอกรหัสผ่านใหม่"
              />
              <button
                type="button"
                className="new-password-toggle"
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
            {errors.new_password && (
              <div className="new-password-error">{errors.new_password}</div>
            )}
            
            {/* Password Strength Indicator */}
            {formData.new_password && (
              <div className="password-strength-indicator">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor()
                    }}
                  ></div>
                </div>
                <div className="strength-text" style={{ color: getPasswordStrengthColor() }}>
                  ความแข็งแกร่ง: {getPasswordStrengthText()}
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div className="strength-feedback">
                    {passwordStrength.feedback.map((feedback, index) => (
                      <div key={index} className="feedback-item">• {feedback}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ยืนยันรหัสผ่านใหม่ */}
          <div className="new-password-form-group">
            <label htmlFor="confirm_password">ยืนยันรหัสผ่านใหม่</label>
            <div className="new-password-input-wrapper">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                className={`new-password-input ${errors.confirm_password ? 'error' : ''}`}
                disabled={loading}
                placeholder="ยืนยันรหัสผ่านใหม่"
              />
              <button
                type="button"
                className="new-password-toggle"
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
            {errors.confirm_password && (
              <div className="new-password-error">{errors.confirm_password}</div>
            )}
            
            {/* Password Match Indicator */}
            {formData.confirm_password && (
              <div className="password-match-indicator">
                {formData.new_password === formData.confirm_password ? (
                  <div className="match-success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    รหัสผ่านตรงกัน
                  </div>
                ) : (
                  <div className="match-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    รหัสผ่านไม่ตรงกัน
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="new-password-actions">
            <button
              type="submit"
              className="new-password-submit-btn"
              disabled={loading || !passwordStrength.isValid || formData.new_password !== formData.confirm_password}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              {loading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>

        <div className="new-password-tips">
          <h3>
            ⚠️ ข้อแนะนำในการตั้งรหัสผ่าน
          </h3>
          <ul>
            <li>ใช้รหัสผ่านที่มีความยาวอย่างน้อย 8 ตัวอักษร</li>
            <li>ผสมผสานตัวอักษรพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และสัญลักษณ์</li>
            <li>หลีกเลี่ยงการใช้ข้อมูลส่วนตัว เช่น ชื่อ วันเกิด</li>
            <li>ไม่ควรใช้รหัสผ่านเดียวกันในหลายบัญชี</li>
            <li>เปลี่ยนรหัสผ่านเป็นประจำเพื่อความปลอดภัย</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;