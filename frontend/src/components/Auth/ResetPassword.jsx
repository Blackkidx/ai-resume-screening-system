// frontend/src/components/Auth/ResetPassword.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import authService from '../../services/authService';
import '../../styles/auth.css';

const EyeIcon = ({ open }) => open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
    </svg>
);

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email || '';
    const resetToken = location.state?.reset_token || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Guard: if no reset_token in state, redirect to forgot-password
    if (!resetToken && !success) {
        return (
            <div className="auth-page otp-page">
                <div className="otp-card">
                    <h1>เซสชันหมดอายุ</h1>
                    <p className="otp-subtitle">กรุณาเริ่มกระบวนการลืมรหัสผ่านใหม่อีกครั้ง</p>
                    <button className="auth-btn-primary" style={{ marginTop: '24px' }}
                        onClick={() => navigate('/forgot-password')}>
                        กลับหน้าลืมรหัสผ่าน
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8) { setError('รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร'); return; }
        if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
            setError('รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข'); return;
        }
        if (newPassword !== confirmPassword) { setError('รหัสผ่านไม่ตรงกัน'); return; }

        setLoading(true);
        setError('');

        // Call API directly with reset_token from route state
        const result = await authService.resetPassword(email, resetToken, newPassword);
        setLoading(false);

        if (result.success) {
            setSuccess(true);
        } else {
            setError(result.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        }
    };

    if (success) {
        return (
            <div className="auth-page otp-page">
                <div className="otp-card">
                    <div className="otp-card-icon success-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h1>เปลี่ยนรหัสผ่านสำเร็จ!</h1>
                    <p className="otp-subtitle">รหัสผ่านของคุณถูกเปลี่ยนแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่</p>
                    <button className="auth-btn-primary" style={{ marginTop: '24px' }}
                        onClick={() => navigate('/login')}>
                        ไปหน้าเข้าสู่ระบบ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page otp-page">
            <div className="otp-card">
                <div className="otp-card-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                </div>
                <h1>ตั้งรหัสผ่านใหม่</h1>
                <p className="otp-subtitle">กรอกรหัสผ่านใหม่สำหรับบัญชี <strong>{email}</strong></p>

                {error && <div className="auth-alert auth-alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: '20px' }}>
                    <div className="form-group">
                        <label>รหัสผ่านใหม่ <span className="label-hint">(8+ ตัว มีตัวอักษร+เลข)</span></label>
                        <div className="input-with-icon">
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="form-input"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={e => { setNewPassword(e.target.value); setError(''); }}
                                disabled={loading}
                                autoFocus
                            />
                            <button type="button" className="input-icon-btn"
                                onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                                <EyeIcon open={showPw} />
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>ยืนยันรหัสผ่านใหม่</label>
                        <input
                            type="password"
                            className={`form-input ${confirmPassword && confirmPassword !== newPassword ? 'input-error' : confirmPassword && confirmPassword === newPassword ? 'input-valid' : ''}`}
                            placeholder="ยืนยันรหัสผ่าน"
                            value={confirmPassword}
                            onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="auth-btn-primary" disabled={loading}>
                        {loading
                            ? <span className="btn-loading"><span className="btn-spinner" />กำลังบันทึก...</span>
                            : 'ตั้งรหัสผ่านใหม่'}
                    </button>
                </form>

                <Link to="/forgot-password" className="otp-back-link" style={{ marginTop: '16px' }}>
                    ← ขอ OTP ใหม่
                </Link>
            </div>
        </div>
    );
};

export default ResetPassword;
