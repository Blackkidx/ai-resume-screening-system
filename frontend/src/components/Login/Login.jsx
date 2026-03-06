// frontend/src/components/Login/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/login.css';

const EyeIcon = ({ open }) => open ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({ identifier: '', password: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (location.state?.message) setSuccessMsg(location.state.message);
    if (location.state?.identifier) setFormData(p => ({ ...p, identifier: location.state.identifier }));
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated()) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.identifier.trim()) { setError('กรุณากรอกชื่อผู้ใช้หรืออีเมล'); return; }
    if (!formData.password) { setError('กรุณากรอกรหัสผ่าน'); return; }

    setLoading(true);
    setError('');
    setUnverifiedEmail('');

    const result = await login({ identifier: formData.identifier.trim(), password: formData.password });
    setLoading(false);

    if (result.success) {
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.error);
      if (result.needsVerification) setUnverifiedEmail(result.email || formData.identifier);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split">
        {/* Left branding panel */}
        <div className="auth-brand">
          <div className="auth-brand-inner">
            <div className="auth-logo">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="12" fill="white" fillOpacity="0.15" />
                <path d="M10 28L20 12L30 28H10Z" fill="white" />
              </svg>
              <span>InternScreen</span>
            </div>
            <h2>ยินดีต้อนรับกลับสู่<br />ระบบ InternScreen</h2>
            <p>แพลตฟอร์ม AI สำหรับการคัดกรองนักศึกษาฝึกงาน พร้อมวิเคราะห์ Resume อัตโนมัติ</p>
            <div className="auth-features">
              <div className="auth-feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>วิเคราะห์ Resume ด้วย AI</span>
              </div>
              <div className="auth-feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>จับคู่งานที่เหมาะสม</span>
              </div>
              <div className="auth-feature-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>ระบบคัดกรองอัจฉริยะ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-form-header">
              <h1>เข้าสู่ระบบ</h1>
              <p>ใช้ชื่อผู้ใช้หรืออีเมลของคุณ</p>
            </div>

            {successMsg && <div className="auth-alert auth-alert-success">{successMsg}</div>}
            {error && (
              <div className="auth-alert auth-alert-error">
                {error}
                {unverifiedEmail && (
                  <div style={{ marginTop: '8px' }}>
                    <Link
                      to="/verify-otp"
                      state={{ email: unverifiedEmail }}
                      className="auth-inline-link"
                    >
                      ไปยืนยัน OTP →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="identifier">ชื่อผู้ใช้ หรือ อีเมล</label>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  className="form-input"
                  placeholder="username หรือ your@email.com"
                  value={formData.identifier}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">รหัสผ่าน</label>
                <div className="input-with-icon">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowPassword(p => !p)}
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>จดจำฉัน</span>
                </label>
                <Link to="/forgot-password" className="auth-link">ลืมรหัสผ่าน?</Link>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? <span className="btn-loading"><span className="btn-spinner" />กำลังเข้าสู่ระบบ...</span> : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <p className="auth-switch">
              ยังไม่มีบัญชี? <Link to="/register" className="auth-link">สมัครสมาชิกฟรี</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;