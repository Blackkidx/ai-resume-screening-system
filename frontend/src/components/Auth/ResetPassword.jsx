// frontend/src/components/Auth/ResetPassword.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import authService from '../../services/authService';

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
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-sky-100 selection:text-sky-900">
                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-10 px-4 shadow-xl shadow-slate-200/40 sm:rounded-2xl sm:px-10 border border-slate-100 text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            เซสชันหมดอายุ
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 mb-8">
                            กรุณาเริ่มกระบวนการลืมรหัสผ่านใหม่อีกครั้ง
                        </p>
                        <button
                            className="flex w-full justify-center items-center rounded-lg bg-sky-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-all active:scale-[0.98]"
                            onClick={() => navigate('/forgot-password')}>
                            กลับหน้าลืมรหัสผ่าน
                        </button>
                    </div>
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
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-sky-100 selection:text-sky-900">
                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-10 px-4 shadow-xl shadow-slate-200/40 sm:rounded-2xl sm:px-10 border border-slate-100 text-center relative overflow-hidden">
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-inner">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            เปลี่ยนรหัสผ่านสำเร็จ!
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 mb-8">
                            รหัสผ่านของคุณถูกเปลี่ยนแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
                        </p>
                        <button
                            className="flex w-full justify-center items-center rounded-lg bg-sky-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-all active:scale-[0.98]"
                            onClick={() => navigate('/login')}>
                            ไปหน้าเข้าสู่ระบบ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-sky-100 selection:text-sky-900">
            {/* Animated Background */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-sky-100 to-sky-50 opacity-100 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-4 shadow-xl shadow-slate-200/40 sm:rounded-2xl sm:px-10 border border-slate-100 text-center relative overflow-hidden">
                    <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-sky-600 shadow-inner">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                        ตั้งรหัสผ่านใหม่
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 mb-8">
                        กรอกรหัสผ่านใหม่สำหรับบัญชี <strong className="text-slate-900 font-semibold">{email}</strong>
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
                            <label className="block text-sm font-medium text-slate-700">
                                รหัสผ่านใหม่ <span className="text-slate-400 font-normal">(8+ ตัว มีตัวอักษร+เลข)</span>
                            </label>
                            <div className="mt-2 relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    className="block w-full rounded-lg border-0 py-2.5 px-3 pr-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6 transition-all"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={e => { setNewPassword(e.target.value); setError(''); }}
                                    disabled={loading}
                                    autoFocus
                                    required
                                />
                                <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                                    onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                                    <EyeIcon open={showPw} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">ยืนยันรหัสผ่านใหม่</label>
                            <div className="mt-2">
                                <input
                                    type="password"
                                    className={`block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ${confirmPassword && confirmPassword !== newPassword ? 'ring-red-300 focus:ring-red-500' : confirmPassword && confirmPassword === newPassword ? 'ring-emerald-300 focus:ring-emerald-500' : 'ring-slate-300 focus:ring-sky-600'} placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all`}
                                    placeholder="ยืนยันรหัสผ่าน"
                                    value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                                    disabled={loading}
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
                                    กำลังบันทึก...
                                </>
                            ) : 'ตั้งรหัสผ่านใหม่'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <Link to="/forgot-password" className="font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            ขอ OTP ใหม่
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
