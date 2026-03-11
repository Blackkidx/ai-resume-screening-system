// frontend/src/components/Profile/ProfileInfo.jsx
import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';

const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 font-medium";
const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5";

/* Info display row */
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 py-3.5 px-4 rounded-xl hover:bg-slate-50 transition-colors group cursor-default border border-transparent hover:border-slate-100">
    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-100">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{value || '—'}</p>
    </div>
  </div>
);

const ProfileInfo = ({ profileData, onUpdateProfile, profileService }) => {
  const notify = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ username: '', first_name: '', last_name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleEdit = () => {
    setIsEditing(true);
    let firstName = profileData?.first_name || '';
    let lastName = profileData?.last_name || '';
    if (!firstName && !lastName && profileData?.full_name) {
      const parts = profileData.full_name.split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }
    setFormData({
      username: profileData?.username || '',
      first_name: firstName, last_name: lastName,
      email: profileData?.email || '',
      phone: profileService?.autoFormatPhoneInput(profileData?.phone || '') || ''
    });
  };

  const handleCancel = () => { setIsEditing(false); setImageFile(null); setPreviewImage(null); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData(p => ({ ...p, phone: profileService.autoFormatPhoneInput(value) }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        profileService.validateImageFile(file);
        setImageFile(file);
        setPreviewImage(await profileService.createImagePreview(file));
      } catch (error) {
        notify.error(error.message);
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!profileService.validateEmail(formData.email)) throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
      const rawPhone = profileService.parsePhoneDigits(formData.phone);
      if (rawPhone && !profileService.validatePhone(rawPhone)) throw new Error('เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นเลข 9-10 หลัก)');
      await profileService.updateProfileWithImage({
        username: formData.username, first_name: formData.first_name,
        last_name: formData.last_name, email: formData.email, phone: rawPhone || ''
      }, imageFile);
      notify.success('อัปเดตข้อมูลเรียบร้อยแล้ว');
      setIsEditing(false); setImageFile(null); setPreviewImage(null);
      onUpdateProfile();
    } catch (error) {
      notify.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const displayPhone = profileService?.formatThaiPhone(profileData?.phone) || '—';
  const displayName = (() => {
    if (profileData?.first_name || profileData?.last_name)
      return `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
    return profileData?.full_name || '—';
  })();
  const avatarSrc = previewImage || (profileData?.profile_image ? `http://172.18.148.97:8000${profileData.profile_image}` : null);
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const icons = {
    user: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    email: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    name: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    phone: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
    calendar: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    camera: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
    edit: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  };

  /* ── VIEW MODE ── */
  if (!isEditing) {
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">ข้อมูลส่วนตัว</h2>
            <p className="text-sm text-slate-500 mt-0.5">รายละเอียดบัญชีและข้อมูลการติดต่อ</p>
          </div>
          <button onClick={handleEdit}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm px-4 py-2.5 transition-all duration-200 cursor-pointer hover:shadow-sm border border-blue-100">
            {icons.edit} แก้ไข
          </button>
        </div>

        <div className="space-y-1">
          <InfoRow icon={icons.user} label="Username" value={profileData?.username} />
          <InfoRow icon={icons.name} label="ชื่อ-นามสกุล" value={displayName} />
          <InfoRow icon={icons.email} label="อีเมล" value={profileData?.email} />
          <InfoRow icon={icons.phone} label="เบอร์โทรศัพท์" value={displayPhone} />
          <InfoRow icon={icons.calendar} label="วันที่สมัคร" value={profileService?.formatDate(profileData?.created_at)} />
        </div>
      </div>
    );
  }

  /* ── EDIT MODE ── */
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">แก้ไขข้อมูลส่วนตัว</h2>
        <p className="text-sm text-slate-500 mt-0.5">แก้ไขข้อมูลแล้วกดบันทึกการเปลี่ยนแปลง</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar upload */}
        <div className="flex items-center gap-5 pb-5 border-b border-slate-100">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl shadow-md overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-white">{initials || '?'}</span>
              )}
            </div>
            <label htmlFor="profile-img-edit"
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white cursor-pointer shadow-sm transition-all hover:scale-110">
              {icons.camera}
              <input id="profile-img-edit" type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">รูปโปรไฟล์</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">รองรับ JPG, PNG<br />ขนาดไม่เกิน 5MB</p>
          </div>
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className={labelCls}>Username <span className="text-rose-400">*</span></label>
          <input id="username" name="username" type="text" value={formData.username}
            onChange={handleInputChange} required disabled={loading} placeholder="username" className={inputCls} />
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className={labelCls}>ชื่อ <span className="text-rose-400">*</span></label>
            <input id="first_name" name="first_name" type="text" value={formData.first_name}
              onChange={handleInputChange} required disabled={loading} placeholder="ชื่อ" className={inputCls} />
          </div>
          <div>
            <label htmlFor="last_name" className={labelCls}>นามสกุล <span className="text-rose-400">*</span></label>
            <input id="last_name" name="last_name" type="text" value={formData.last_name}
              onChange={handleInputChange} required disabled={loading} placeholder="นามสกุล" className={inputCls} />
          </div>
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className={labelCls}>อีเมล <span className="text-rose-400">*</span></label>
            <input id="email" name="email" type="email" value={formData.email}
              onChange={handleInputChange} required disabled={loading} className={inputCls} />
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>เบอร์โทรศัพท์</label>
            <input id="phone" name="phone" type="tel" value={formData.phone}
              onChange={handleInputChange} disabled={loading} placeholder="0XX-XXX-XXXX" maxLength={12} className={inputCls} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <button type="button" onClick={handleCancel} disabled={loading}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer">
            ยกเลิก
          </button>
          <button type="submit" disabled={loading}
            className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-blue-600/20">
            {loading ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>กำลังบันทึก...</>
            ) : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileInfo;