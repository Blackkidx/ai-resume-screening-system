// frontend/src/components/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import CompanyManagement from './CompanyManagement';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import { API_BASE_URL } from '../../config';

/* ─── Shared style tokens ─── */
const AnimatedNumber = ({ end, isPercent }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const numEnd = parseFloat(end);
    if (isNaN(numEnd) || numEnd === 0) { setCount(0); return; }
    const steps = 60;
    const stepTime = Math.abs(Math.floor(1200 / steps));
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      const progress = currentStep / steps;
      setCount(numEnd * (progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)));
      if (currentStep >= steps) { setCount(numEnd); clearInterval(interval); }
    }, stepTime);
    return () => clearInterval(interval);
  }, [end]);
  return <>{isPercent ? count.toFixed(1) : Math.round(count)}{isPercent ? '%' : ''}</>;
};

const renderIcon = (name, className = "w-6 h-6") => {
  switch (name) {
    case 'Users': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'GraduationCap': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>;
    case 'Briefcase': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>;
    case 'Crown': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" /></svg>;
    case 'Building2': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>;
    case 'Plus': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
    case 'BarChart': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>;
    case 'Edit': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>;
    case 'Trash': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;
    default: return null;
  }
};

const inputCls = "w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white placeholder:text-slate-400 disabled:opacity-50 transition-shadow";
const btnPrimary = "inline-flex items-center justify-center rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white px-4 py-2 text-sm font-bold transition-colors";
const btnSecondary = "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50";
const btnOutline = "inline-flex items-center justify-center rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50";

const RoleBadge = ({ role }) => {
  const map = { student: 'bg-sky-100 text-sky-700 border-sky-200', hr: 'bg-indigo-100 text-indigo-700 border-indigo-200', admin: 'bg-amber-100 text-amber-700 border-amber-200' };
  const cls = map[role?.toLowerCase()] || 'bg-slate-100 text-slate-600 border-slate-200';
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${cls}`}>{role}</span>;
};

const StatusBadge = ({ active }) => active ? (
  <span className="inline-flex rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold">เปิดใช้งาน</span>
) : (
  <span className="inline-flex rounded-full bg-slate-100 border border-slate-200 text-slate-500 px-2.5 py-0.5 text-xs font-semibold">ปิดใช้งาน</span>
);

/* ─── Modal Base ─── */
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" onClick={onClose}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

/* ─── Field ─── */
const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

/* ─── EditUserModal (2-step: info | password) ─── */
const EditUserModal = ({ user, onClose, onSuccess }) => {
  const notify = useNotification();
  const [step, setStep] = useState('info');
  const [formData, setFormData] = useState({
    username: user.username || '',
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    user_type: user.user_type || 'Student',
    is_active: user.is_active !== undefined ? user.is_active : true,
  });
  const [pwdData, setPwdData] = useState({ new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  // Thai phone formatter
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    let formatted = raw;
    if (raw.length <= 2) { formatted = raw; }
    else if (raw.startsWith('02')) {
      if (raw.length <= 5) formatted = raw.slice(0, 2) + '-' + raw.slice(2);
      else formatted = raw.slice(0, 2) + '-' + raw.slice(2, 5) + '-' + raw.slice(5);
    } else {
      if (raw.length <= 6) formatted = raw.slice(0, 3) + '-' + raw.slice(3);
      else formatted = raw.slice(0, 3) + '-' + raw.slice(3, 6) + '-' + raw.slice(6);
    }
    setFormData(prev => ({ ...prev, phone: formatted }));
    if (error) setError('');
  };

  // Submit info
  const handleSubmitInfo = async (e) => {
    e.preventDefault();
    if (formData.username.trim().length < 3) { setError('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'); return; }
    setLoading(true); setError('');
    try {
      const result = await adminService.updateUser(user.id, {
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        user_type: formData.user_type,
        is_active: formData.is_active,
      });
      if (result.success) { notify.success('อัปเดตข้อมูลผู้ใช้สำเร็จ'); onSuccess(); }
      else setError(result.error);
    } catch { setError('เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  };

  // Submit password (≥8 chars + 1 special char)
  const handleSubmitPwd = async (e) => {
    e.preventDefault();
    if (!pwdData.new_password) { setError('กรุณากรอกรหัสผ่านใหม่'); return; }
    if (pwdData.new_password.length < 8) { setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    if (!/[^A-Za-z0-9]/.test(pwdData.new_password)) { setError('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว เช่น !@#$%'); return; }
    if (pwdData.new_password !== pwdData.confirm_password) { setError('รหัสผ่านไม่ตรงกัน'); return; }
    setLoading(true); setError('');
    try {
      const result = await adminService.updateUser(user.id, { new_password: pwdData.new_password });
      if (result.success) {
        notify.success('เปลี่ยนรหัสผ่านสำเร็จ');
        setStep('info');
        setPwdData({ new_password: '', confirm_password: '' });
      } else setError(result.error);
    } catch { setError('เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  };

  const ErrorBanner = () => error ? (
    <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 font-medium">
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {error}
    </div>
  ) : null;

  // ─── INFO STEP ───
  if (step === 'info') return (
    <Modal title={`แก้ไข: ${user.full_name}`} onClose={onClose}>
      <ErrorBanner />
      <form onSubmit={handleSubmitInfo} className="space-y-5" noValidate>
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ข้อมูลบัญชี</p>
          <Field label="ชื่อผู้ใช้ *">
            <input className={inputCls} type="text" name="username" value={formData.username} onChange={handleChange} disabled={loading} placeholder="อย่างน้อย 3 ตัว (a-z, 0-9, -, _)" />
          </Field>
          <Field label="ชื่อ-นามสกุล *">
            <input className={inputCls} type="text" name="full_name" value={formData.full_name} onChange={handleChange} disabled={loading} />
          </Field>
          <Field label="อีเมล *">
            <input className={inputCls} type="email" name="email" value={formData.email} onChange={handleChange} disabled={loading} />
          </Field>
          <Field label="เบอร์โทร">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <input className={inputCls + ' pl-9'} type="tel" name="phone" value={formData.phone} onChange={handlePhoneChange} disabled={loading} placeholder="064-691-1144" maxLength={12} />
            </div>
          </Field>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">บทบาท & สถานะ</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ประเภท *">
              <select className={inputCls} name="user_type" value={formData.user_type} onChange={handleChange} disabled={loading}>
                <option value="Student">Student</option>
                <option value="HR">HR</option>
                <option value="Admin">Admin</option>
              </select>
            </Field>
            <Field label="สถานะ">
              <label className="flex items-center gap-2.5 h-[42px] cursor-pointer select-none">
                <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} disabled={loading} className="sr-only" />
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${formData.is_active ? 'left-5' : 'left-1'}`} />
                </div>
                <span className={`text-sm font-semibold ${formData.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {formData.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </label>
            </Field>
          </div>
        </div>

        {/* Change Password nav row */}
        <button
          type="button"
          onClick={() => { setStep('password'); setError(''); }}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-sky-300 text-sm font-semibold text-slate-700 transition-all group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            เปลี่ยนรหัสผ่าน
          </span>
          <svg className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" className={btnSecondary} disabled={loading} onClick={onClose}>ยกเลิก</button>
          <button type="submit" className={btnPrimary} disabled={loading}>{loading ? 'กำลังบันทึก...' : 'บันทึก'}</button>
        </div>
      </form>
    </Modal>
  );

  // ─── PASSWORD STEP ───
  return (
    <Modal title="เปลี่ยนรหัสผ่าน" onClose={onClose}>
      <button
        type="button"
        onClick={() => { setStep('info'); setError(''); setPwdData({ new_password: '', confirm_password: '' }); }}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 font-semibold mb-5 transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        กลับไปแก้ไขผู้ใช้
      </button>

      <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-5 border border-slate-200">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-sky-100">
            {user.profile_image ? (
              <img src={`${API_BASE_URL}${user.profile_image}`} alt={user.full_name} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            ) : null}
            <span className="text-sky-700 font-bold text-sm" style={{ display: user.profile_image ? 'none' : 'flex' }}>
              {user.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{user.full_name}</p>
          <p className="text-xs text-slate-400">@{user.username}</p>
        </div>
      </div>

      <ErrorBanner />
      <form onSubmit={handleSubmitPwd} className="space-y-4" noValidate>
        <Field label="รหัสผ่านใหม่">
          <input
            className={inputCls}
            type="password"
            value={pwdData.new_password}
            onChange={e => { setPwdData(p => ({ ...p, new_password: e.target.value })); if (error) setError(''); }}
            disabled={loading}
            placeholder="อย่างน้อย 8 ตัว + อักขระพิเศษ (!@#$%...)"
            autoComplete="new-password"
          />
        </Field>
        <Field label="ยืนยันรหัสผ่าน">
          <input
            className={inputCls}
            type="password"
            value={pwdData.confirm_password}
            onChange={e => { setPwdData(p => ({ ...p, confirm_password: e.target.value })); if (error) setError(''); }}
            disabled={loading}
            placeholder="พิมพ์อีกครั้ง"
            autoComplete="new-password"
          />
        </Field>

        <div className="rounded-lg bg-sky-50 border border-sky-200 px-3 py-2.5 text-xs text-sky-700 space-y-1">
          <p className="font-semibold">เงื่อนไขรหัสผ่าน:</p>
          <p className={`flex items-center gap-1.5 ${pwdData.new_password.length >= 8 ? 'text-emerald-600 font-semibold' : ''}`}>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            อย่างน้อย 8 ตัวอักษร
          </p>
          <p className={`flex items-center gap-1.5 ${/[^A-Za-z0-9]/.test(pwdData.new_password) ? 'text-emerald-600 font-semibold' : ''}`}>
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            มีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$%^&*)
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" className={btnSecondary} disabled={loading} onClick={() => { setStep('info'); setError(''); setPwdData({ new_password: '', confirm_password: '' }); }}>ยกเลิก</button>
          <button type="submit" className={btnPrimary} disabled={loading}>{loading ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}</button>
        </div>
      </form>
    </Modal>
  );
};

/* ─── CreateUserModal ─── */
const CreateUserModal = ({ onClose, onSuccess }) => {
  const notify = useNotification();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', full_name: '', phone: '', user_type: 'Student', is_active: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    setLoading(true); setError('');
    try {
      const result = await adminService.createUser({ username: formData.username.trim(), email: formData.email.trim(), password: formData.password, full_name: formData.full_name.trim(), phone: formData.phone.trim() || null, user_type: formData.user_type, is_active: formData.is_active });
      if (result.success) { notify.success('สร้างผู้ใช้ใหม่สำเร็จ'); onSuccess(); }
      else setError(result.error);
    } catch { setError('เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="เพิ่มผู้ใช้ใหม่" onClose={onClose}>
      {error && <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 font-medium">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="ชื่อผู้ใช้ *"><input className={inputCls} type="text" name="username" value={formData.username} onChange={handleChange} required disabled={loading} placeholder="username" /></Field>
          <Field label="รหัสผ่าน *"><input className={inputCls} type="password" name="password" value={formData.password} onChange={handleChange} required disabled={loading} placeholder="อย่างน้อย 6 ตัว" /></Field>
        </div>
        <Field label="ชื่อ-นามสกุล *"><input className={inputCls} type="text" name="full_name" value={formData.full_name} onChange={handleChange} required disabled={loading} /></Field>
        <Field label="อีเมล *"><input className={inputCls} type="email" name="email" value={formData.email} onChange={handleChange} required disabled={loading} /></Field>
        <Field label="เบอร์โทร"><input className={inputCls} type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={loading} placeholder="080-xxx-xxxx" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="ประเภท *">
            <select className={inputCls} name="user_type" value={formData.user_type} onChange={handleChange} required disabled={loading}>
              <option value="Student">Student</option><option value="HR">HR</option><option value="Admin">Admin</option>
            </select>
          </Field>
          <Field label="สถานะ">
            <label className="flex items-center gap-2 mt-2 text-sm cursor-pointer select-none">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} disabled={loading} className="accent-sky-600 h-4 w-4" />
              เปิดใช้งาน
            </label>
          </Field>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={btnSecondary} disabled={loading} onClick={onClose}>ยกเลิก</button>
          <button type="submit" className={btnPrimary} disabled={loading}>{loading ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}</button>
        </div>
      </form>
    </Modal>
  );
};

/* ─── AdminDashboard ─── */
const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const notify = useNotification();

  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') {
      const t = setTimeout(() => { setCurrentPage(1); loadUsers(1, searchTerm, userTypeFilter, statusFilter); }, 500);
      return () => clearTimeout(t);
    }
  }, [searchTerm, userTypeFilter, statusFilter, activeTab]);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return; }
    if (!user || (user.user_type !== 'Admin' && !user.roles?.includes('Admin'))) { notify.error('ไม่มีสิทธิ์เข้าถึง'); navigate('/'); return; }
    loadDashboardData();
    if (activeTab === 'users') loadUsers();
  }, [isAuthenticated, user, navigate, activeTab]);

  const loadDashboardData = async () => {
    try { setLoading(true); const r = await adminService.getDashboardStats(); if (r.success) setDashboardData(r.data); }
    catch { } finally { setLoading(false); }
  };

  const loadUsers = async (page = 1, search = '', userType = '', status = '') => {
    try {
      setUsersLoading(true);
      const r = await adminService.getUsers({ page, limit: 10, search, user_type: userType, is_active: status === '' ? null : status === 'active' });
      if (r.success) setUsers(r.data);
    } catch { } finally { setUsersLoading(false); }
  };

  const handleEditUser = async (userId) => {
    try {
      setModalLoading(true);
      const r = await adminService.getUserById(userId);
      if (r.success) { setSelectedUser(r.data); setShowEditModal(true); }
      else notify.error('โหลดข้อมูลผู้ใช้ไม่สำเร็จ: ' + r.error);
    } catch { notify.error('โหลดข้อมูลผู้ใช้ไม่สำเร็จ'); }
    finally { setModalLoading(false); }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`ลบ "${username}" ?`)) {
      const r = await adminService.deleteUser(userId);
      if (r.success) { notify.success('ลบสำเร็จ'); loadUsers(currentPage, searchTerm, userTypeFilter, statusFilter); loadDashboardData(); }
      else notify.error(r.error);
    }
  };

  const formatDate = (ds) => ds ? new Date(ds).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ไม่เคยเข้าสู่ระบบ';

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <LoadingSpinner size="large" message="กำลังโหลด Admin Dashboard..." />
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'ภาพรวม', icon: 'BarChart' },
    { id: 'users', label: 'จัดการผู้ใช้', icon: 'Users' },
    { id: 'companies', label: 'จัดการบริษัท', icon: 'Building2' },
  ];

  const statCards = dashboardData ? [
    { icon: 'Users', label: 'ผู้ใช้ทั้งหมด', value: dashboardData.total_users, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
    { icon: 'GraduationCap', label: 'นักศึกษา', value: dashboardData.student_count, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { icon: 'Briefcase', label: 'HR', value: dashboardData.hr_count, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    { icon: 'Crown', label: 'Admin', value: dashboardData.admin_count, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">ระบบจัดการผู้ใช้และบริษัท</p>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto pb-1 mb-6">
          <div className="flex gap-1 bg-white rounded-xl border border-slate-200 shadow-sm p-1 animate-fadeInDown w-fit min-w-full sm:min-w-0">
          {tabs.map((tab) => (
            <button key={tab.id}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-sky-600 text-white shadow-sm scale-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 scale-95 hover:scale-100'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {renderIcon(tab.icon, 'w-4 h-4')}
              {tab.label}
            </button>
          ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {dashboardData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {statCards.map((c, i) => (
                  <div key={c.label} className={`rounded-2xl border bg-white shadow-sm p-5 animate-fadeInUp hover:shadow-md transition-shadow`} style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.bg} ${c.color} mb-3 border ${c.border}`}>
                      {renderIcon(c.icon, 'w-6 h-6')}
                    </div>
                    <div className="text-3xl font-black text-slate-900 border-none bg-transparent m-0 p-0">
                      <AnimatedNumber end={c.value} />
                    </div>
                    <div className="text-sm font-medium mt-1 text-slate-500">{c.label}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fadeInUp" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
              <h3 className="font-bold text-slate-900 mb-4">การดำเนินการด่วน</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: 'Users', title: 'จัดการผู้ใช้', desc: 'เพิ่ม แก้ไข ลบผู้ใช้', action: () => setActiveTab('users') },
                  { icon: 'Building2', title: 'จัดการบริษัท', desc: 'เพิ่มบริษัทและกำหนด HR', action: () => setActiveTab('companies') },
                  { icon: 'Plus', title: 'เพิ่มผู้ใช้ใหม่', desc: 'สร้างบัญชีผู้ใช้ใหม่', action: () => setShowCreateModal(true) },
                ].map((a) => (
                  <button key={a.title} onClick={a.action} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md hover:border-sky-300 p-4 text-left transition-all group duration-300">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-sky-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {renderIcon(a.icon, 'w-6 h-6')}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-sky-700 text-sm transition-colors">{a.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{a.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                {renderIcon('Users', 'w-5 h-5 text-indigo-500')}
                จัดการผู้ใช้
              </h2>
              <button className={btnPrimary} onClick={() => setShowCreateModal(true)}>+ เพิ่มผู้ใช้ใหม่</button>
            </div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100 items-center">
              <div className="relative flex-1 min-w-0">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, อีเมล, username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={inputCls + ' pl-9 w-full'}
                />
              </div>
              <select value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)} className={inputCls + ' sm:w-36 shrink-0'}>
                <option value="">ทุก Role</option>
                <option value="Student">Student</option><option value="HR">HR</option><option value="Admin">Admin</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls + ' sm:w-36 shrink-0'}>
                <option value="">ทุกสถานะ</option>
                <option value="active">เปิดใช้งาน</option><option value="inactive">ปิดใช้งาน</option>
              </select>
              <button className={btnSecondary + ' shrink-0'} onClick={() => { setSearchTerm(''); setUserTypeFilter(''); setStatusFilter(''); setCurrentPage(1); loadUsers(1, '', '', ''); }}>ล้าง</button>
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              {usersLoading ? (
                <div className="p-8 text-center"><LoadingSpinner message="กำลังโหลดรายการผู้ใช้..." /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      {['ผู้ใช้', 'อีเมล', 'Role', 'สถานะ', 'เข้าสู่ระบบล่าสุด', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.length > 0 ? users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar: real photo → fallback letter */}
                            {u.profile_image ? (
                              <img
                                src={`${API_BASE_URL}${u.profile_image}`}
                                alt={u.full_name}
                                className="flex h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                              />
                            ) : null}
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-sm"
                              style={{ display: u.profile_image ? 'none' : 'flex' }}
                            >
                              {u.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{u.full_name}</div>
                              <div className="text-xs text-slate-400">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{u.email}</td>
                        <td className="px-4 py-3"><RoleBadge role={u.user_type} /></td>
                        <td className="px-4 py-3"><StatusBadge active={u.is_active} /></td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(u.last_login)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors group" onClick={() => handleEditUser(u.id)} disabled={modalLoading} title="แก้ไข">{renderIcon('Edit', 'w-4 h-4 group-hover:scale-110 transition-transform')}</button>
                            <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors group" onClick={() => handleDeleteUser(u.id, u.username)} title="ลบ">{renderIcon('Trash', 'w-4 h-4 group-hover:scale-110 transition-transform')}</button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">{searchTerm || userTypeFilter || statusFilter ? 'ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข' : 'ไม่มีข้อมูลผู้ใช้'}</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {/* Pagination */}
            {users.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100">
                <button className={btnSecondary} disabled={currentPage === 1} onClick={() => { const p = currentPage - 1; setCurrentPage(p); loadUsers(p, searchTerm, userTypeFilter, statusFilter); }}>← ก่อนหน้า</button>
                <span className="text-sm text-slate-500 font-medium">หน้า {currentPage}</span>
                <button className={btnSecondary} disabled={users.length < 10} onClick={() => { const p = currentPage + 1; setCurrentPage(p); loadUsers(p, searchTerm, userTypeFilter, statusFilter); }}>ถัดไป →</button>
              </div>
            )}
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && <CompanyManagement />}
      </div>

      {/* Modals */}
      {showEditModal && selectedUser && (
        <EditUserModal user={selectedUser} onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
          onSuccess={() => { loadUsers(currentPage, searchTerm, userTypeFilter, statusFilter); loadDashboardData(); setShowEditModal(false); setSelectedUser(null); }} />
      )}
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)}
          onSuccess={() => { loadUsers(currentPage, searchTerm, userTypeFilter, statusFilter); loadDashboardData(); setShowCreateModal(false); }} />
      )}
    </div>
  );
};

export default AdminDashboard;