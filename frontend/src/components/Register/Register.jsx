// frontend/src/components/Register/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import '../../styles/register.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
    // ล้าง error เมื่อผู้ใช้เริ่มพิมพ์ใหม่
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    // ตรวจสอบฟิลด์ที่จำเป็น
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('กรุณากรอกชื่อและนามสกุล');
      return false;
    }

    if (!formData.username.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้');
      return false;
    }

    if (formData.username.length < 3) {
      setError('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
      return false;
    }

    if (!formData.email.trim()) {
      setError('กรุณากรอกอีเมล');
      return false;
    }

    // ตรวจสอบรหัสผ่าน
    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return false;
    }
    
    if (!formData.agreeToTerms) {
      setError('กรุณายอมรับเงื่อนไขการใช้งาน');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูล
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ เรียก API register
      const result = await authService.register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || null
      });

      if (result.success) {
        // ✅ สมัครสมาชิกสำเร็จ
        setSuccess('สมัครสมาชิกสำเร็จ! กำลังเปลี่ยนเส้นทางไปหน้า Login...');
        
        // รอ 2 วินาทีแล้วไปหน้า login
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ',
              username: formData.username 
            }
          });
        }, 2000);
      } else {
        // ✅ สมัครสมาชิกไม่สำเร็จ
        setError(result.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1 className="register-title">สร้างบัญชีใหม่</h1>
          <p className="register-subtitle">เริ่มต้นใช้งาน InternScreen วันนี้</p>
        </div>

        {/* ✅ แสดง error message */}
        {error && (
          <div className="error-message" style={{
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* ✅ แสดง success message */}
        {success && (
          <div className="success-message" style={{
            backgroundColor: '#D1FAE5',
            color: '#065F46',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            {success}
          </div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">ชื่อ *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="form-input"
                placeholder="ชื่อ"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">นามสกุล *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="form-input"
                placeholder="นามสกุล"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">ชื่อผู้ใช้ *</label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              placeholder="ชื่อผู้ใช้ (อย่างน้อย 3 ตัวอักษร)"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">อีเมล *</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-input"
              placeholder="080-xxx-xxxx (ไม่บังคับ)"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">รหัสผ่าน *</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">ยืนยันรหัสผ่าน *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="ยืนยันรหัสผ่าน"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
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
              disabled={loading}
            />
            <label htmlFor="agreeToTerms">
              ฉันยอมรับ <a href="/terms">เงื่อนไขการใช้งาน</a> และ 
              <a href="/privacy"> นโยบายความเป็นส่วนตัว</a>
            </label>
          </div>

          {/* ✅ ปุ่ม submit แสดง loading state */}
          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
            style={{
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
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