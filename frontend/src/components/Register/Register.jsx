import React, { useState } from 'react';
import '../../styles/register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'student',
    agreeToTerms: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ตรวจสอบรหัสผ่าน
    if (formData.password !== formData.confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน');
      return;
    }
    
    if (!formData.agreeToTerms) {
      alert('กรุณายอมรับเงื่อนไขการใช้งาน');
      return;
    }
    
    console.log('Register attempt:', formData);
    // ในอนาคตจะเชื่อมต่อกับ API
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1 className="register-title">สร้างบัญชีใหม่</h1>
          <p className="register-subtitle">เริ่มต้นใช้งาน InternScreen วันนี้</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">ชื่อ</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="form-input"
                placeholder="ชื่อ"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">นามสกุล</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="form-input"
                placeholder="นามสกุล"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">อีเมล</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">รหัสผ่าน</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="terms-checkbox">
            <input
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              required
            />
            <label htmlFor="agreeToTerms">
              ฉันยอมรับ <a href="/terms">เงื่อนไขการใช้งาน</a> และ 
              <a href="/privacy"> นโยบายความเป็นส่วนตัว</a>
            </label>
          </div>

          <button type="submit" className="register-button">
            สร้างบัญชี
          </button>
        </form>

        <div className="divider">หรือ</div>

        <a href="/auth/google" className="google-login">
          <div className="google-icon"></div>
          สมัครด้วย Google
        </a>

        <div className="login-link">
          มีบัญชีอยู่แล้ว? <a href="/login">เข้าสู่ระบบ</a>
        </div>
      </div>
    </div>
  );
};

export default Register;