// frontend/src/components/Auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setError('กรุณากรอกอีเมล'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('รูปแบบอีเมลไม่ถูกต้อง'); return; }

        setLoading(true);
        setError('');
        const result = await forgotPassword(email.trim());
        setLoading(false);

        if (result.success) {
            setSent(true);
        } else {
            setError(result.error || 'เกิดข้อผิดพลาด');
        }
    };

    return (
        <div className="auth-page otp-page">
            <div className="otp-card">
                <div className="otp-card-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                </div>

                {!sent ? (
                    <>
                        <h1>ลืมรหัสผ่าน?</h1>
                        <p className="otp-subtitle">กรอกอีเมลของคุณ เราจะส่งรหัส OTP สำหรับตั้งรหัสผ่านใหม่</p>

                        {error && <div className="auth-alert auth-alert-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: '24px' }}>
                            <div className="form-group">
                                <label htmlFor="fp-email">อีเมลที่ลงทะเบียนไว้</label>
                                <input
                                    type="email" id="fp-email"
                                    className="form-input"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setError(''); }}
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="auth-btn-primary" disabled={loading}>
                                {loading
                                    ? <span className="btn-loading"><span className="btn-spinner" />กำลังส่ง...</span>
                                    : 'ส่ง OTP ไปยังอีเมล'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h1>ตรวจสอบอีเมลของคุณ</h1>
                        <p className="otp-subtitle">
                            เราส่งรหัส OTP ไปยัง <strong>{email}</strong> แล้ว<br />
                            กรุณาตรวจสอบในกล่องจดหมาย
                        </p>
                        <div className="auth-alert auth-alert-success" style={{ marginTop: '16px' }}>
                            ถ้าอีเมลนี้มีในระบบ คุณจะได้รับรหัส OTP ภายใน 1-2 นาที
                        </div>
                        <button
                            className="auth-btn-primary"
                            style={{ marginTop: '24px' }}
                            onClick={() => navigate('/verify-otp', { state: { email, purpose: 'reset_password' } })}
                        >
                            ไปยืนยัน OTP
                        </button>
                    </>
                )}

                <Link to="/login" className="otp-back-link" style={{ marginTop: '20px' }}>← กลับหน้าเข้าสู่ระบบ</Link>
            </div>
        </div>
    );
};

export default ForgotPassword;
