import React, { useState } from 'react';
import '../../styles/login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
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
    console.log('Login attempt:', formData);
    // ในอนาคตจะเชื่อมต่อกับ API
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">ยินดีต้อนรับกลับ</h1>
          <p className="login-subtitle">เข้าสู่ระบบเพื่อใช้งาน InternScreen</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
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

          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              จดจำฉัน
            </label>
            <a href="/forgot-password" className="forgot-password">
              ลืมรหัสผ่าน?
            </a>
          </div>

          <button type="submit" className="login-button">
            เข้าสู่ระบบ
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