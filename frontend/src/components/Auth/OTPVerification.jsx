// frontend/src/components/Auth/OTPVerification.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import '../../styles/auth.css';

const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes
const RESEND_COOLDOWN = 60;

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { verifyOTP, loginWithData } = useAuth();

    const email = location.state?.email || '';
    // purpose: 'register' | 'reset_password'
    const purpose = location.state?.purpose || 'reset_password';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef([]);

    // Redirect if no email
    useEffect(() => {
        if (!email) navigate('/register', { replace: true });
    }, [email, navigate]);

    // Countdown timer
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    // Resend cooldown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => setResendCooldown(t => t - 1), 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const maskedEmail = email
        ? email.replace(/(.{2}).+(@.+)/, (_, a, b) => `${a}${'*'.repeat(Math.max(1, email.indexOf('@') - 2))}${b}`)
        : '';

    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const updated = [...otp];
        updated[index] = value;
        setOtp(updated);
        setError('');
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!text) return;
        setOtp([...text.split(''), ...Array(6).fill('')].slice(0, 6));
        inputRefs.current[Math.min(text.length, 5)]?.focus();
    };

    // ===== SUBMIT =====
    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpStr = otp.join('');
        if (otpStr.length < 6) { setError('กรุณากรอก OTP ให้ครบ 6 หลัก'); return; }
        if (timeLeft <= 0) { setError('OTP หมดอายุแล้ว กรุณาขอ OTP ใหม่'); return; }

        setLoading(true);
        setError('');

        if (purpose === 'register') {
            // Call verify-register-otp → auto-login token returned
            const result = await authService.verifyRegisterOTP(email, otpStr);
            setLoading(false);
            if (result.success) {
                // loginWithData updates AuthContext React state immediately
                // → Navbar reflects login without refresh
                loginWithData(result.data);
                setSuccess('สร้างบัญชีสำเร็จ! กำลังเข้าสู่ระบบ...');
                setTimeout(() => navigate('/', { replace: true }), 1200);
            } else {
                setError(result.error || 'OTP ไม่ถูกต้อง');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } else {
            // Forgot-password flow: get reset_token then go to reset-password page
            const result = await verifyOTP(email, otpStr);
            setLoading(false);
            if (result.success) {
                const resetToken = result.data?.reset_token;
                navigate('/reset-password', { state: { email, reset_token: resetToken } });
            } else {
                setError(result.error || 'OTP ไม่ถูกต้อง');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        }
    };

    // ===== RESEND =====
    const handleResend = async () => {
        if (resendCooldown > 0 || resending) return;
        setResending(true);
        setError('');

        let result;
        if (purpose === 'register') {
            result = await authService.resendRegisterOTP(email);
        } else {
            result = await authService.resendOTP(email);
        }
        setResending(false);

        if (result.success) {
            setResendCooldown(RESEND_COOLDOWN);
            setTimeLeft(OTP_EXPIRY_SECONDS);
            setSuccess('ส่ง OTP ใหม่แล้ว กรุณาตรวจสอบอีเมล');
            setTimeout(() => setSuccess(''), 5000);
        } else {
            setError(result.error || 'ไม่สามารถส่ง OTP ใหม่ได้');
        }
    };

    return (
        <div className="auth-page otp-page">
            <div className="otp-card">
                <div className="otp-card-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                    </svg>
                </div>

                <h1>{purpose === 'register' ? 'ยืนยันการสร้างบัญชี' : 'ยืนยัน OTP'}</h1>
                <p className="otp-subtitle">
                    เราส่งรหัส OTP 6 หลักไปยัง<br />
                    <strong>{maskedEmail}</strong>
                </p>

                {success && <div className="auth-alert auth-alert-success">{success}</div>}
                {error && <div className="auth-alert auth-alert-error">{error}</div>}

                {/* Timer */}
                <div className={`otp-timer ${timeLeft <= 60 ? 'timer-warning' : ''} ${timeLeft <= 0 ? 'timer-expired' : ''}`}>
                    {timeLeft > 0 ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                            OTP หมดอายุใน {formatTime(timeLeft)}
                        </>
                    ) : 'OTP หมดอายุแล้ว กรุณาขอรหัสใหม่'}
                </div>

                {/* OTP Inputs */}
                <form onSubmit={handleSubmit}>
                    <div className="otp-inputs" onPaste={handlePaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => inputRefs.current[i] = el}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                className={`otp-input ${digit ? 'otp-input-filled' : ''} ${error ? 'otp-input-error' : ''}`}
                                value={digit}
                                onChange={e => handleOtpChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                disabled={loading || timeLeft <= 0}
                                autoFocus={i === 0}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="auth-btn-primary"
                        disabled={loading || timeLeft <= 0 || otp.join('').length < 6}
                    >
                        {loading
                            ? <span className="btn-loading"><span className="btn-spinner" />กำลังยืนยัน...</span>
                            : purpose === 'register' ? 'ยืนยันและสร้างบัญชี' : 'ยืนยัน OTP'}
                    </button>
                </form>

                {/* Resend */}
                <div className="otp-resend">
                    <span>ไม่ได้รับรหัส? </span>
                    <button
                        type="button"
                        className={`resend-btn ${resendCooldown > 0 ? 'resend-disabled' : ''}`}
                        onClick={handleResend}
                        disabled={resendCooldown > 0 || resending}
                    >
                        {resending ? 'กำลังส่ง...' : resendCooldown > 0 ? `ส่งใหม่ได้ใน ${resendCooldown}s` : 'ส่ง OTP อีกครั้ง'}
                    </button>
                </div>

                <Link to={purpose === 'register' ? '/register' : '/login'} className="otp-back-link">
                    ← {purpose === 'register' ? 'กลับไปหน้าสมัครสมาชิก' : 'กลับไปหน้าเข้าสู่ระบบ'}
                </Link>
            </div>
        </div>
    );
};

export default OTPVerification;
