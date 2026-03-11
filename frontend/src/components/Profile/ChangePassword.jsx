// frontend/src/components/Profile/ChangePassword.jsx
import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';

const EyeIcon = ({ open }) => open ? (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
  </svg>
);

const strengthConfig = [
  null,
  { bar: 'bg-rose-400', text: 'text-rose-500', label: 'อ่อนมาก', glow: 'shadow-rose-200' },
  { bar: 'bg-orange-400', text: 'text-orange-500', label: 'อ่อน', glow: 'shadow-orange-200' },
  { bar: 'bg-amber-400', text: 'text-amber-500', label: 'ปานกลาง', glow: 'shadow-amber-200' },
  { bar: 'bg-emerald-400', text: 'text-emerald-500', label: 'แข็งแกร่ง', glow: 'shadow-emerald-200' },
  { bar: 'bg-emerald-600', text: 'text-emerald-600', label: 'แข็งแกร่งมาก', glow: 'shadow-emerald-300' },
];

const inputBase = "w-full px-4 py-3 border rounded-xl text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 pr-11 font-medium";

const ChangePassword = ({ profileService }) => {
  const notify = useNotification();
  const [formData, setFormData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [strength, setStrength] = useState({ score: 0, feedback: [], isValid: false });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));

    if (name === 'new_password') {
      if (profileService?.validatePassword) {
        const v = profileService.validatePassword(value);
        const fb = [];
        if (!v.strength?.length) fb.push('ต้องมีอย่างน้อย 6 ตัวอักษร');
        if (!v.strength?.upperCase) fb.push('ควรมีตัวพิมพ์ใหญ่');
        if (!v.strength?.lowerCase) fb.push('ควรมีตัวพิมพ์เล็ก');
        if (!v.strength?.numbers) fb.push('ควรมีตัวเลข');
        if (!v.strength?.specialChar) fb.push('ควรมีสัญลักษณ์พิเศษ');
        setStrength({ score: v.score, isValid: v.isValid, feedback: fb });
      } else {
        const s = value.length >= 8 ? 4 : value.length >= 6 ? 2 : value.length >= 1 ? 1 : 0;
        setStrength({ score: s, isValid: s >= 2, feedback: s < 2 ? ['ต้องมีอย่างน้อย 6 ตัวอักษร'] : [] });
      }
    }

    if (name === 'confirm_password' || (name === 'new_password' && formData.confirm_password)) {
      const np = name === 'new_password' ? value : formData.new_password;
      const cp = name === 'confirm_password' ? value : formData.confirm_password;
      if (cp && np !== cp) setErrors(p => ({ ...p, confirm_password: 'รหัสผ่านไม่ตรงกัน' }));
      else setErrors(p => ({ ...p, confirm_password: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.current_password) errs.current_password = 'กรุณากรอกรหัสผ่านปัจจุบัน';
    if (!formData.new_password) errs.new_password = 'กรุณากรอกรหัสผ่านใหม่';
    else if (formData.new_password.length < 6) errs.new_password = 'ต้องมีอย่างน้อย 6 ตัวอักษร';
    if (!formData.confirm_password) errs.confirm_password = 'กรุณายืนยันรหัสผ่านใหม่';
    else if (formData.new_password !== formData.confirm_password) errs.confirm_password = 'รหัสผ่านไม่ตรงกัน';
    if (formData.current_password === formData.new_password) errs.new_password = 'รหัสผ่านใหม่ต้องแตกต่างจากปัจจุบัน';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await profileService.changePassword(formData);
      notify.success('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
      setErrors({}); setStrength({ score: 0, feedback: [], isValid: false });
    } catch (error) {
      if (error.message.includes('current password'))
        setErrors({ current_password: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      else notify.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally { setLoading(false); }
  };

  const sc = strengthConfig[Math.min(strength.score, 5)];
  const pwMatch = formData.confirm_password && formData.new_password === formData.confirm_password;

  const fieldCls = (name) => `${inputBase} ${errors[name]
      ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-400/30 focus:border-rose-400'
      : name === 'confirm_password' && pwMatch
        ? 'border-emerald-300 bg-emerald-50/30 focus:ring-emerald-400/30 focus:border-emerald-400'
        : 'border-slate-200 focus:ring-blue-400/30 focus:border-blue-400 hover:border-slate-300'
    }`;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">เปลี่ยนรหัสผ่าน</h2>
        <p className="text-sm text-slate-500 mt-0.5">ตั้งรหัสผ่านใหม่ที่คาดเดาได้ยากเพื่อความปลอดภัย</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Current Password */}
        <div className="space-y-1.5">
          <label htmlFor="current_password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            รหัสผ่านปัจจุบัน <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              id="current_password"
              name="current_password"
              type={show.current ? 'text' : 'password'}
              value={formData.current_password}
              onChange={handleChange}
              disabled={loading}
              placeholder="กรอกรหัสผ่านปัจจุบัน"
              className={fieldCls('current_password')}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShow(p => ({ ...p, current: !p.current }))}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-blue-500 transition-colors focus:outline-none cursor-pointer">
              <EyeIcon open={show.current} />
            </button>
          </div>
          {errors.current_password && (
            <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {errors.current_password}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* New Password + strength */}
        <div className="space-y-1.5">
          <label htmlFor="new_password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            รหัสผ่านใหม่ <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              id="new_password" name="new_password"
              type={show.new ? 'text' : 'password'}
              value={formData.new_password} onChange={handleChange} disabled={loading}
              placeholder="กรอกรหัสผ่านใหม่"
              className={fieldCls('new_password')}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShow(p => ({ ...p, new: !p.new }))}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-blue-500 transition-colors focus:outline-none cursor-pointer">
              <EyeIcon open={show.new} />
            </button>
          </div>
          {errors.new_password && (
            <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {errors.new_password}
            </p>
          )}

          {/* Strength meter */}
          {formData.new_password && !errors.new_password && (
            <div className="mt-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1 h-1.5 rounded-full overflow-hidden">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`flex-1 h-full rounded-full transition-all duration-500 ${i <= strength.score && sc ? sc.bar : 'bg-slate-200'}`} />
                  ))}
                </div>
                {sc && <span className={`text-[10px] font-bold uppercase shrink-0 ${sc.text}`}>{sc.label}</span>}
              </div>
              {strength.feedback.length > 0 && (
                <div className="grid grid-cols-2 gap-1">
                  {strength.feedback.map((f, i) => (
                    <p key={i} className="text-[11px] text-slate-400 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" /> {f}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label htmlFor="confirm_password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            ยืนยันรหัสผ่านใหม่ <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              id="confirm_password" name="confirm_password"
              type={show.confirm ? 'text' : 'password'}
              value={formData.confirm_password} onChange={handleChange} disabled={loading}
              placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
              className={fieldCls('confirm_password')}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShow(p => ({ ...p, confirm: !p.confirm }))}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-blue-500 transition-colors focus:outline-none cursor-pointer">
              <EyeIcon open={show.confirm} />
            </button>
          </div>
          <div className="h-4 mt-1">
            {errors.confirm_password
              ? <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {errors.confirm_password}
              </p>
              : pwMatch
                ? <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  รหัสผ่านตรงกัน
                </p>
                : null
            }
          </div>
        </div>

        {/* Submit */}
        <button type="submit"
          disabled={loading || !strength.isValid || formData.new_password !== formData.confirm_password}
          className="btn-shimmer w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-blue-600/20">
          {loading ? (
            <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>กำลังบันทึก...</>
          ) : (
            <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><circle cx="12" cy="16" r="1" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>บันทึกรหัสผ่านใหม่</>
          )}
        </button>
      </form>

      {/* Tips */}
      <div className="mt-6 rounded-xl bg-blue-50/60 border border-blue-100 p-4">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          เคล็ดลับความปลอดภัย
        </p>
        <ul className="space-y-1.5">
          {['ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร', 'ผสมพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และสัญลักษณ์', 'หลีกเลี่ยงข้อมูลส่วนตัว เช่น ชื่อ วันเกิด', 'ไม่ใช้รหัสผ่านเดียวกันในหลายบัญชี'].map((tip, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-blue-600/80">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />{tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChangePassword;