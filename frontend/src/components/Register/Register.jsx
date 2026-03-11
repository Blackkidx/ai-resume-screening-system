// frontend/src/components/Register/Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/* ── Icons ── */
const Icons = {
  Eye: ({ open }) => open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
  ),
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>,
  CheckCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>,
  Logo: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

/* ── Password strength ── */
const getPasswordStrength = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-zA-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (pw.length >= 12) s++;
  return s;
};

const strengthConfig = [
  { bar: 'bg-slate-200 w-0', text: 'text-slate-400', label: '' },
  { bar: 'bg-rose-500 w-1/4', text: 'text-rose-500', label: 'อ่อน' },
  { bar: 'bg-amber-400 w-2/4', text: 'text-amber-500', label: 'พอใช้' },
  { bar: 'bg-emerald-400 w-3/4', text: 'text-emerald-500', label: 'ดี' },
  { bar: 'bg-blue-500 w-full', text: 'text-blue-600', label: 'แข็งแกร่ง' },
];

/* ── Feature bullets ── */
const features = [
  'ลงทะเบียนฟรี ไม่มีค่าใช้จ่าย',
  'AI วิเคราะห์ Resume โดยอัตโนมัติ',
  'ดูการจับคู่งานแบบ real-time',
];

/* ── Input styles ── */
const inputBase = "w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all focus:bg-white disabled:opacity-50";
const inputErr = `${inputBase} border-rose-300 focus:border-rose-400 focus:ring-rose-400/20`;

const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({ firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
    if (!formData.firstName.trim()) errs.firstName = 'ระบุชื่อ';
    if (!formData.lastName.trim()) errs.lastName = 'ระบุนามสกุล';
    const u = formData.username.trim();
    if (!u) errs.username = 'ระบุ Username';
    else if (u.length < 8 || u.length > 20) errs.username = 'ต้อง 8–20 ตัวอักษร';
    else if (!/^[a-zA-Z0-9_-]+$/.test(u)) errs.username = 'a-z, 0-9, _, - เท่านั้น';
    if (!formData.email.trim()) errs.email = 'ระบุอีเมล';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'รูปแบบอีเมลผิด';
    if (formData.password.length < 8) errs.password = 'ขั้นต่ำ 8 ตัวอักษร';
    else if (!/[a-zA-Z]/.test(formData.password)) errs.password = 'ต้องมีตัวอักษร 1 ตัว';
    else if (!/\d/.test(formData.password)) errs.password = 'ต้องมีตัวเลข 1 ตัว';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) { setError('กรุณายอมรับเงื่อนไขข้อตกลงก่อนสมัครสมาชิก'); return; }
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setLoading(true); setError('');
    const result = await register({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      username: formData.username.trim().toLowerCase(),
      email: formData.email.trim(),
      password: formData.password,
    });
    setLoading(false);
    if (result.success) {
      navigate('/verify-otp', { state: { email: result.email || formData.email.trim(), purpose: 'register' } });
    } else {
      setError(result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
  };

  const strength = getPasswordStrength(formData.password);
  const sc = strengthConfig[strength];
  const pwMatchOk = formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-sky-200 selection:text-sky-900" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2347 40%, #132d5e 70%, #0d1f45 100%)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* ── Animated Background ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 animate-dotFlicker" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] animate-orbFloat1" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px] animate-orbFloat2" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10 blur-[100px] animate-orbFloat3" style={{ background: 'radial-gradient(ellipse, #1d4ed8, transparent 70%)' }} />
      </div>

      {/* ── Split-Panel Card ── */}
      <div className="relative z-10 w-full max-w-3xl my-6 animate-cardReveal">
        <div className="flex rounded-2xl overflow-hidden auth-card-glow">

          {/* ── LEFT PANEL: Dark Navy ── */}
          <div className="hidden md:flex flex-col justify-between w-[38%] shrink-0 p-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #0f1c3f 0%, #1a3159 60%, #0d2b5e 100%)' }}>

            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 80%, #6366f1 0%, transparent 50%)' }} />

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

              <h2 className="text-white text-xl font-extrabold leading-snug mb-3">
                เริ่มต้นการค้นหา<br />งานฝึกงาน<br />
                <span
                  className="animate-gradientShift"
                  style={{ background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #38bdf8, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  ในฝัน
                </span>
              </h2>
              <p className="text-blue-200/70 text-xs leading-relaxed">
                สมัครฟรี และเริ่มต้นให้ AI วิเคราะห์<br />Resume ของคุณได้ทันที
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
          <div className="flex-1 bg-white p-7 lg:p-8 overflow-y-auto max-h-[90vh]">

            {/* Header */}
            <div className="mb-5">
              {/* Mobile logo */}
              <div className="flex items-center gap-2 mb-4 md:hidden">
                <img
                  src="/logo-internscreen.png"
                  alt="InternScreen"
                  className="h-8 w-auto object-contain"
                />
                <span className="font-bold text-slate-800 text-sm">InternScreen</span>
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">สร้างบัญชีใหม่</h1>
              <p className="text-sm text-slate-400">กรอกข้อมูลเพื่อเริ่มต้นใช้งาน</p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 mb-4 text-sm text-rose-600 flex items-start gap-2">
                <span className="mt-0.5"><Icons.Alert /></span>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* First + Last name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ชื่อ <span className="text-rose-400">*</span></label>
                  <input name="firstName" type="text" placeholder="ชื่อจริง" value={formData.firstName} onChange={handleChange} disabled={loading} className={fieldErrors.firstName ? inputErr : inputBase} />
                  {fieldErrors.firstName && <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.firstName}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">นามสกุล <span className="text-rose-400">*</span></label>
                  <input name="lastName" type="text" placeholder="นามสกุล" value={formData.lastName} onChange={handleChange} disabled={loading} className={fieldErrors.lastName ? inputErr : inputBase} />
                  {fieldErrors.lastName && <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.lastName}</p>}
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ชื่อผู้ใช้ <span className="text-rose-400">*</span></label>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{formData.username.length}/20</span>
                </div>
                <input name="username" type="text" maxLength={20} placeholder="8-20 ตัวอักษรภาษาอังกฤษ" value={formData.username} onChange={handleChange} disabled={loading} className={fieldErrors.username ? inputErr : inputBase} />
                {fieldErrors.username && <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.username}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">อีเมล <span className="text-rose-400">*</span></label>
                <input name="email" type="email" placeholder="example@gmail.com" value={formData.email} onChange={handleChange} disabled={loading} className={fieldErrors.email ? inputErr : inputBase} />
                {fieldErrors.email && <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.email}</p>}
              </div>

              {/* Password + Confirm side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    รหัสผ่าน <span className="text-rose-400">*</span>
                    <span className="normal-case font-normal text-slate-400 ml-1"></span>
                  </label>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleChange} disabled={loading} className={`${fieldErrors.password ? inputErr : inputBase} pr-10`} />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"><Icons.Eye open={showPassword} /></button>
                  </div>
                  {/* Strength */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${sc.bar}`} />
                    </div>
                    {formData.password && <span className={`text-[10px] font-bold uppercase w-14 text-right shrink-0 ${sc.text}`}>{sc.label}</span>}
                  </div>
                  {fieldErrors.password && <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.password}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ยืนยันรหัสผ่าน <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} disabled={loading} className={`${fieldErrors.confirmPassword ? inputErr : inputBase} pr-10`} />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"><Icons.Eye open={showConfirm} /></button>
                  </div>
                  <div className="mt-1 min-h-[18px]">
                    {fieldErrors.confirmPassword ? (
                      <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.confirmPassword}</p>
                    ) : pwMatchOk ? (
                      <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1"><Icons.CheckCircle /> รหัสผ่านตรงกัน</p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* ── Terms & Privacy Checkbox ── */}
              <div className="pt-1">
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  {/* Custom circular checkbox */}
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (error && e.target.checked) setError('');
                      }}
                      disabled={loading}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-all flex items-center justify-center">
                      <svg
                        className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ opacity: agreedToTerms ? 1 : 0 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                    ยอมรับ
                    {' '}
                    <Link
                      to="/terms-of-service"
                      className="text-blue-400 font-semibold underline underline-offset-2 hover:text-blue-300 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      เงื่อนไขข้อตกลงการใช้บริการ
                    </Link>
                    {' '}และ
                    {' '}
                    <Link
                      to="/privacy-policy"
                      className="text-blue-400 font-semibold underline underline-offset-2 hover:text-blue-300 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      นโยบายความเป็นส่วนตัว
                    </Link>
                    {' '}ของ InternScreen
                  </p>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading || !agreedToTerms}
                  className="w-full h-11 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      กำลังสมัครสมาชิก...
                    </span>
                  ) : 'สร้างบัญชีผ่านระบบ OTP'}
                </button>
              </div>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-slate-400 mt-5">
              มีบัญชีอยู่แล้ว?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                เข้าสู่ระบบที่นี่
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;