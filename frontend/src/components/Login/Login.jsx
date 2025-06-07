// frontend/src/components/Login/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import '../../styles/login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
    // ล้าง error เมื่อผู้ใช้เริ่มพิมพ์ใหม่
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ เรียก API login
      const result = await authService.login({
        username: formData.username,
        password: formData.password
      });

      if (result.success) {
        // ✅ Login สำเร็จ
        console.log('Login successful:', result.data.user_info);
        
        // แสดงข้อความสำเร็จ (ถ้าต้องการ)
        alert(`ยินดีต้อนรับ ${result.data.user_info.full_name}!`);
        
        // เปลี่ยนเส้นทางไปหน้าหลัก
        navigate('/', { replace: true });
      } else {
        // ✅ Login ไม่สำเร็จ
        setError(result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">ยินดีต้อนรับกลับ</h1>
          <p className="login-subtitle">เข้าสู่ระบบเพื่อใช้งาน InternScreen</p>
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

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">ชื่อผู้ใช้</label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              placeholder="ชื่อผู้ใช้"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

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
              disabled={loading}
            />
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={loading}
              />
              จดจำฉัน
            </label>
            <a href="/forgot-password" className="forgot-password">
              ลืมรหัสผ่าน?
            </a>
          </div>

          {/* ✅ ปุ่ม submit แสดง loading state */}
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
            style={{
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="divider">หรือ</div>

        <a href="/auth/google" className="google-login">
          <div className="google-icon"></div>
          เข้าสู่ระบบด้วย Google
        </a>

        <div className="register-link">
          ยังไม่มีบัญชี? <a href="/register">สมัครสมาชิก</a>
        </div>
      </div>
    </div>
  );
};

export default Login;