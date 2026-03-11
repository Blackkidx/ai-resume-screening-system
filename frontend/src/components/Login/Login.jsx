// frontend/src/components/Login/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/* ── Icons ── */
const Icons = {
  Eye: ({ open }) => open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
  ),
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>,
  CheckCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>,
  Logo: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" opacity="0.15" />
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Check: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

/* ── Feature bullets ── */
const features = [
  'วิเคราะห์ Resume ด้วย AI',
  'รับผลการคัดกรองทันที',
  'ประกาศงานคุณภาพสูง',
];

/* ── Input style for right panel ── */
const inputBase = "w-full px-4 py-2.5 rounded-lg text-sm bg-slate-50 text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all focus:bg-white disabled:opacity-50";

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

    setLoading(true); setError(''); setUnverifiedEmail('');
    const result = await login({ identifier: formData.identifier.trim(), password: formData.password });
    setLoading(false);

    if (result.success) {
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } else {
      setError(result.error);
      if (result.needsVerification) setUnverifiedEmail(result.email || formData.identifier);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-sky-200 selection:text-sky-900"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2347 40%, #132d5e 70%, #0d1f45 100%)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* ── Animated Background ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 animate-dotFlicker" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] animate-orbFloat1" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px] animate-orbFloat2" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10 blur-[100px] animate-orbFloat3" style={{ background: 'radial-gradient(ellipse, #1d4ed8, transparent 70%)' }} />
      </div>

      {/* ── Split-Panel Card ── */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-3xl my-4 sm:my-6 animate-cardReveal">
        <div className="flex rounded-2xl overflow-hidden auth-card-glow">

          {/* ── LEFT PANEL: Dark Navy ── */}
          <div
            className="hidden md:flex flex-col justify-between w-[42%] shrink-0 p-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #0f1c3f 0%, #1a3159 60%, #0d2b5e 100%)' }}
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 80%, #6366f1 0%, transparent 50%)' }} />

            {/* Logo */}
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-8">
                <img
                  src="/logo-internscreen.png"
                  alt="InternScreen"
                  className="h-9 w-auto object-contain drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]"
                />
                <span className="text-white font-bold text-base tracking-wide">InternScreen</span>
              </div>

              <h2 className="text-white text-2xl font-extrabold leading-snug mb-3">
                ยินดีต้อนรับ<br />กลับสู่ระบบ<br />
                <span
                  className="animate-gradientShift"
                  style={{ background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #38bdf8, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  InternScreen
                </span>
              </h2>
              <p className="text-blue-200/70 text-xs leading-relaxed">
                แพลตฟอร์ม AI สำหรับการคัดกรองนักศึกษา<br />ฝึกงาน พร้อมวิเคราะห์ Resume อัตโนมัติ
              </p>
            </div>

            {/* Features */}
            <div className="relative z-10 space-y-3 my-6">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-400/30 border border-blue-400/50 flex items-center justify-center shrink-0">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-blue-100/80 text-xs font-medium">{f}</span>
                </div>
              ))}
            </div>

            {/* Bottom */}
            <div className="relative z-10">
              <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent mb-4" />
              <p className="text-blue-300/40 text-[10px] font-medium">AI Resume Screening · Enterprise Grade</p>
            </div>
          </div>

          {/* ── RIGHT PANEL: White Form ── */}
          <div className="flex-1 bg-white p-5 sm:p-8 lg:p-10">

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-5 md:hidden">
                <img
                  src="/logo-internscreen.png"
                  alt="InternScreen"
                  className="h-8 w-auto object-contain"
                />
                <span className="font-bold text-slate-800 text-sm">InternScreen</span>
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">เข้าสู่ระบบ</h1>
              <p className="text-sm text-slate-400">ใช้ชื่อผู้ใช้หรืออีเมลของคุณ</p>
            </div>

            {/* Alerts */}
            {successMsg && (
              <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 mb-5 text-sm text-emerald-700 font-medium">
                <Icons.CheckCircle />
                {successMsg}
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 mb-5 text-sm text-rose-600">
                <div className="flex items-center gap-2 font-medium mb-1"><Icons.Alert /> {error}</div>
                {unverifiedEmail && (
                  <Link to="/verify-otp" state={{ email: unverifiedEmail }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-rose-500 px-2 py-1 rounded hover:bg-rose-600 transition-colors">
                    ยืนยัน OTP ตอนนี้ &rarr;
                  </Link>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Identifier */}
              <div className="space-y-1">
                <label htmlFor="identifier" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ชื่อผู้ใช้ หรือ อีเมล
                </label>
                <input
                  id="identifier" name="identifier" type="text" autoComplete="username"
                  placeholder="username หรือ your@email.com"
                  value={formData.identifier} onChange={handleChange} disabled={loading}
                  className={inputBase}
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    id="password" name="password" type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password" placeholder="••••••••"
                    value={formData.password} onChange={handleChange} disabled={loading}
                    className={`${inputBase} pr-11`}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer">
                    <Icons.Eye open={showPassword} />
                  </button>
                </div>
              </div>

              {/* Remember Me + Forgot Password — same row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div className="relative flex items-center justify-center w-4 h-4">
                    <input
                      type="checkbox" name="rememberMe" checked={formData.rememberMe}
                      onChange={handleChange} disabled={loading}
                      className="peer appearance-none w-4 h-4 border-2 border-slate-300 rounded bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                    />
                    <span className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none flex items-center justify-center">
                      <Icons.Check />
                    </span>
                  </div>
                  <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">จดจำฉัน</span>
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">ลืมรหัสผ่าน?</Link>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="btn-shimmer w-full mt-1 h-11 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-900/40 cursor-pointer">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    กำลังเข้าสู่ระบบ...
                  </span>
                ) : 'เข้าสู่ระบบ'}
              </button>
            </form>

            {/* Footer Link */}
            <p className="text-center text-sm text-slate-400 mt-6">
              ยังไม่มีบัญชี?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                สมัครสมาชิกตอนนี้
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;