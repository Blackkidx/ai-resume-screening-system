// frontend/src/components/Register/Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/register.css';

const EyeIcon = ({ open }) => open ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const getPasswordStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-zA-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (pw.length >= 12) score++;
  return score;
};

const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(p => ({ ...p, [name]: '' }));
    if (error) setError('');
  };

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = 'กรุณากรอกชื่อ';
    if (!formData.lastName.trim()) errs.lastName = 'กรุณากรอกนามสกุล';

    const uname = formData.username.trim();
    if (!uname) errs.username = 'กรุณากรอกชื่อผู้ใช้';
    else if (uname.length < 8 || uname.length > 20) errs.username = 'ชื่อผู้ใช้ต้อง 8–20 ตัวอักษร';
    else if (!/^[a-zA-Z0-9_-]+$/.test(uname)) errs.username = 'ใช้ได้เฉพาะ a-z, 0-9, _, -';

    if (!formData.email.trim()) errs.email = 'กรุณากรอกอีเมล';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'รูปแบบอีเมลไม่ถูกต้อง';

    if (formData.password.length < 8) errs.password = 'รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร';
    else if (!/[a-zA-Z]/.test(formData.password)) errs.password = 'ต้องมีตัวอักษรอย่างน้อย 1 ตัว';
    else if (!/\d/.test(formData.password)) errs.password = 'ต้องมีตัวเลขอย่างน้อย 1 ตัว';

    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setLoading(true);
    setError('');
    const result = await register({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      username: formData.username.trim().toLowerCase(),
      email: formData.email.trim(),
      password: formData.password,
    });
    setLoading(false);

    if (result.success) {
      navigate('/verify-otp', {
        state: {
          email: result.email || formData.email.trim(),
          purpose: 'register',
        }
      });
    } else {
      setError(result.error || 'เกิดข้อผิดพลาด');
    }

  };

  const strength = getPasswordStrength(formData.password);
  const strengthLabel = ['', 'อ่อน', 'พอใช้', 'ดี', 'แข็งแกร่ง'][strength];
  const strengthColor = ['', '#ef4444', '#f97316', '#22c55e', '#16a34a'][strength];

  return (
    <div className="auth-page">
      <div className="auth-split">
        {/* Left branding */}
        <div className="auth-brand">
          <div className="auth-brand-inner">
            <div className="auth-logo">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="12" fill="white" fillOpacity="0.15" />
                <path d="M10 28L20 12L30 28H10Z" fill="white" />
              </svg>
              <span>InternScreen</span>
            </div>
            <h2>เริ่มต้นการค้นหา<br />งานฝึกงานในฝัน</h2>
            <p>สมัครฟรี และเริ่มต้นใช้งาน AI วิเคราะห์ Resume ของคุณได้ทันที</p>
            <div className="auth-features">
              <div className="auth-feature-item"><CheckIcon /><span>ลงทะเบียนฟรี ไม่มีค่าใช้จ่าย</span></div>
              <div className="auth-feature-item"><CheckIcon /><span>AI วิเคราะห์ทักษะอัตโนมัติ</span></div>
              <div className="auth-feature-item"><CheckIcon /><span>ดูงานที่เหมาะสมแบบ real-time</span></div>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="auth-form-panel register-panel">
          <div className="auth-form-inner">
            <div className="auth-form-header">
              <h1>สร้างบัญชีใหม่</h1>
              <p>กรอกข้อมูลเพื่อเริ่มต้นใช้งาน</p>
            </div>

            {error && <div className="auth-alert auth-alert-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Name row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">ชื่อ *</label>
                  <input
                    type="text" id="firstName" name="firstName"
                    className={`form-input ${fieldErrors.firstName ? 'input-error' : ''}`}
                    placeholder="ชื่อ (ไทย/อังกฤษ)"
                    value={formData.firstName} onChange={handleChange}
                    disabled={loading} autoComplete="given-name"
                  />
                  {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">นามสกุล *</label>
                  <input
                    type="text" id="lastName" name="lastName"
                    className={`form-input ${fieldErrors.lastName ? 'input-error' : ''}`}
                    placeholder="นามสกุล"
                    value={formData.lastName} onChange={handleChange}
                    disabled={loading} autoComplete="family-name"
                  />
                  {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
                </div>
              </div>

              {/* Username */}
              <div className="form-group">
                <label htmlFor="username">
                  ชื่อผู้ใช้ *
                </label>
                <input
                  type="text" id="username" name="username"
                  className={`form-input ${fieldErrors.username ? 'input-error' : formData.username.length >= 8 ? 'input-valid' : ''}`}
                  placeholder="8–20 ตัวอักษร"
                  value={formData.username} onChange={handleChange}
                  disabled={loading} autoComplete="username"
                  maxLength={20}
                />
                {fieldErrors.username
                  ? <span className="field-error">{fieldErrors.username}</span>
                  : <span className="field-hint">{formData.username.length}/20</span>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">อีเมล *</label>
                <input
                  type="email" id="email" name="email"
                  className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                  placeholder="example@gmail.com"
                  value={formData.email} onChange={handleChange}
                  disabled={loading} autoComplete="email"
                />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password">รหัสผ่าน * <span className="label-hint">(อย่างน้อย 8 ตัว มีตัวอักษร+เลข)</span></label>
                <div className="input-with-icon">
                  <input
                    type={showPassword ? 'text' : 'password'} id="password" name="password"
                    className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={formData.password} onChange={handleChange}
                    disabled={loading} autoComplete="new-password"
                  />
                  <button type="button" className="input-icon-btn" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="strength-bar" style={{ background: i <= strength ? strengthColor : '#e2e8f0' }} />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน *</label>
                <div className="input-with-icon">
                  <input
                    type={showConfirm ? 'text' : 'password'} id="confirmPassword" name="confirmPassword"
                    className={`form-input ${fieldErrors.confirmPassword ? 'input-error' : formData.confirmPassword && formData.password === formData.confirmPassword ? 'input-valid' : ''}`}
                    placeholder="••••••••"
                    value={formData.confirmPassword} onChange={handleChange}
                    disabled={loading} autoComplete="new-password"
                  />
                  <button type="button" className="input-icon-btn" onClick={() => setShowConfirm(p => !p)} tabIndex={-1}>
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading
                  ? <span className="btn-loading"><span className="btn-spinner" />กำลังสร้างบัญชี...</span>
                  : 'สร้างบัญชีและรับ OTP'}
              </button>
            </form>

            <p className="auth-switch">
              มีบัญชีอยู่แล้ว? <Link to="/login" className="auth-link">เข้าสู่ระบบ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;