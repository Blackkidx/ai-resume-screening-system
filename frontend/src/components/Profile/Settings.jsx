// frontend/src/components/Profile/Settings.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const Settings = ({ profileData, profileService }) => {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const notify = useNotification();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ลบบัญชีของฉัน') {
      notify.warning('กรุณาพิมพ์ "ลบบัญชีของฉัน" เพื่อยืนยัน');
      return;
    }
    setDeleting(true);
    try {
      const token = sessionStorage.getItem('auth_token');
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://172.18.148.97:8000';
      const res = await fetch(`${API_BASE_URL}/api/profile/delete-account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'ไม่สามารถลบบัญชีได้'); }
      notify.success('บัญชีของคุณถูกลบเรียบร้อยแล้ว');
      await authLogout();
      navigate('/', { replace: true });
    } catch (error) {
      notify.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally { setDeleting(false); }
  };

  const confirmed = deleteConfirmText === 'ลบบัญชีของฉัน';

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">ตั้งค่าบัญชี</h2>
        <p className="text-sm text-slate-500 mt-0.5">การตั้งค่าและความปลอดภัยของบัญชี</p>
      </div>

      {/* Account Info Section */}
      <div className="mb-6 rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ข้อมูลบัญชี</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Username', value: profileData?.username || '—' },
            { label: 'บทบาท', value: profileData?.user_type || '—' },
            { label: 'อีเมล', value: profileData?.email || '—' },
            { label: 'วันที่สมัคร', value: profileService?.formatDate?.(profileData?.created_at) || '—' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl px-3 py-2.5 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 overflow-hidden">
        {/* Danger header strip */}
        <div className="h-1 bg-gradient-to-r from-rose-400 to-rose-600" />
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-rose-800">ลบบัญชีผู้ใช้</h3>
              <p className="text-xs text-rose-600 mt-1 leading-relaxed">การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดจะถูกลบถาวร</p>
              <ul className="mt-2 space-y-0.5">
                {['ข้อมูลส่วนตัวและรูปโปรไฟล์', 'Resume ทั้งหมดที่เคยอัปโหลด', 'ประวัติการสมัครงาน', 'ผลการประมวลผล AI'].map((item, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-rose-500">
                    <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => setShowDeleteModal(true)}
              className="shrink-0 rounded-xl bg-white border border-rose-300 hover:bg-rose-600 hover:border-rose-600 hover:text-white text-rose-600 px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer hover:shadow-md">
              ลบบัญชี
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fadeInUp" style={{ animationDuration: '0.15s' }} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-cardReveal"
            onClick={e => e.stopPropagation()}>
            {/* Danger strip */}
            <div className="h-1.5 bg-gradient-to-r from-rose-400 to-rose-600" />
            <div className="p-6">
              {/* Warning icon */}
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-500">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 text-center">คุณแน่ใจหรือไม่?</h3>
              <p className="text-sm text-slate-500 text-center mt-2 leading-relaxed">
                การลบบัญชีเป็นการดำเนินการถาวร ข้อมูลทั้งหมดจะหายไปและ<strong className="text-slate-700">ไม่สามารถกู้คืนได้</strong>
              </p>

              <div className="mt-5 rounded-xl bg-rose-50 border border-rose-100 p-3.5">
                <p className="text-xs font-bold text-rose-700 mb-2">สิ่งที่จะถูกลบทั้งหมด:</p>
                <div className="grid grid-cols-2 gap-1">
                  {['บัญชีผู้ใช้', 'ข้อมูลส่วนตัว', 'Resume ทั้งหมด', 'ผลการประมวลผล AI', 'รูปโปรไฟล์', 'ประวัติการสมัครงาน'].map((item, i) => (
                    <p key={i} className="text-xs text-rose-600 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />{item}
                    </p>
                  ))}
                </div>
              </div>

              {/* Confirm input */}
              <div className="mt-5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  พิมพ์ <span className="font-mono text-rose-600 normal-case">"ลบบัญชีของฉัน"</span> เพื่อยืนยัน
                </label>
                <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="ลบบัญชีของฉัน" disabled={deleting}
                  className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 font-medium" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} disabled={deleting}
                  className="flex-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer">
                  ยกเลิก
                </button>
                <button onClick={handleDeleteAccount} disabled={deleting || !confirmed}
                  className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-rose-600/20">
                  {deleting ? 'กำลังลบ...' : 'ยืนยันลบบัญชี'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;