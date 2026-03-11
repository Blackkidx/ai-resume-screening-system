// frontend/src/components/Auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                    </div>

                    {!sent ? (
                        <>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                ลืมรหัสผ่าน?
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 mb-8">
                                กรอกอีเมลของคุณ เราจะส่งรหัส OTP สำหรับตั้งรหัสผ่านใหม่
                            </p>

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

                            <form onSubmit={handleSubmit} className="space-y-6 text-left" noValidate>
                                <div>
                                    <label htmlFor="fp-email" className="block text-sm font-medium text-slate-700">
                                        อีเมลที่ลงทะเบียนไว้
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            type="email" id="fp-email"
                                            className="block w-full rounded-lg border-0 px-4 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6 transition-all"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={e => { setEmail(e.target.value); setError(''); }}
                                            disabled={loading}
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full justify-center items-center rounded-lg bg-sky-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            กำลังส่ง...
                                        </>
                                    ) : 'ส่ง OTP ไปยังอีเมล'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                ตรวจสอบอีเมลของคุณ
                            </h2>
                            <p className="mt-3 text-sm text-slate-600">
                                เราส่งรหัส OTP ไปยัง <strong className="text-slate-900 font-semibold">{email}</strong> แล้ว<br />
                                กรุณาตรวจสอบในกล่องจดหมาย
                            </p>

                            <div className="mt-6 rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 text-sm font-medium text-emerald-800 text-left">
                                        ถ้าอีเมลนี้มีในระบบ คุณจะได้รับรหัส OTP ภายใน 1-2 นาที
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={() => navigate('/verify-otp', { state: { email, purpose: 'reset_password' } })}
                                    className="flex w-full justify-center items-center rounded-lg bg-sky-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-all active:scale-[0.98]"
                                >
                                    ไปยืนยัน OTP
                                </button>
                            </div>
                        </>
                    )}

                    <div className="mt-8 text-center text-sm">
                        <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-500 transition-colors flex items-center justify-center gap-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            กลับหน้าเข้าสู่ระบบ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
