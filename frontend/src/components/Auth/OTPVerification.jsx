// frontend/src/components/Auth/OTPVerification.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';

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
        <div className="min-h-screen font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-sky-100 selection:text-sky-900" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2347 40%, #132d5e 70%, #0d1f45 100%)' }}>
            {/* ── Modern Auth Background ── */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
                <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px]" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-4 shadow-xl shadow-slate-200/40 sm:rounded-2xl sm:px-10 border border-slate-100 text-center relative overflow-hidden">
                    <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-sky-600 shadow-inner">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                        {purpose === 'register' ? 'ยืนยันการสร้างบัญชี' : 'ยืนยัน OTP'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 mb-8">
                        เราส่งรหัส OTP 6 หลักไปยัง<br />
                        <strong className="text-slate-900 font-semibold">{maskedEmail}</strong>
                    </p>

                    {success && (
                        <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 mb-6 text-left">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3 text-sm font-medium text-emerald-800">
                                    {success}
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 border border-red-200 mb-6 text-left">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3 text-sm font-medium text-red-800">
                                    {error}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timer */}
                    <div className={`flex items-center justify-center gap-1.5 mb-6 text-sm font-medium transition-colors ${timeLeft <= 60 ? (timeLeft <= 0 ? 'text-red-500' : 'text-orange-500') : 'text-slate-600'}`}>
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
                    <form onSubmit={handleSubmit} className="space-y-6 text-left text-slate-900" noValidate>
                        <div className="flex justify-between gap-2" onPaste={handlePaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => inputRefs.current[i] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-0 shadow-sm ring-1 ring-inset ${error ? 'ring-red-300 focus:ring-red-500' : digit ? 'ring-sky-600 bg-sky-50' : 'ring-slate-300 focus:ring-sky-600'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:w-14 sm:h-16 transition-all`}
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
                            disabled={loading || timeLeft <= 0 || otp.join('').length < 6}
                            className="flex w-full justify-center items-center rounded-lg bg-sky-600 px-3 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    กำลังยืนยัน...
                                </>
                            ) : purpose === 'register' ? 'ยืนยันและสร้างบัญชี' : 'ยืนยัน OTP'}
                        </button>
                    </form>

                    {/* Resend */}
                    <div className="mt-6 text-sm text-slate-600">
                        <span>ไม่ได้รับรหัส? </span>
                        <button
                            type="button"
                            className={`font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-600 rounded px-1 ${resendCooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-sky-600 hover:text-sky-500'}`}
                            onClick={handleResend}
                            disabled={resendCooldown > 0 || resending}
                        >
                            {resending ? 'กำลังส่ง...' : resendCooldown > 0 ? `ส่งใหม่ได้ใน ${resendCooldown}s` : 'ส่ง OTP อีกครั้ง'}
                        </button>
                    </div>

                    <div className="mt-8 text-center text-sm">
                        <Link to={purpose === 'register' ? '/register' : '/login'} className="font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            {purpose === 'register' ? 'กลับไปหน้าสมัครสมาชิก' : 'กลับไปหน้าเข้าสู่ระบบ'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
