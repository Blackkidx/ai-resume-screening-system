// frontend/src/components/Profile/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import profileService from '../../services/profileService';
import ProfileInfo from './ProfileInfo';
import ChangePassword from './ChangePassword';
import Settings from './Settings';

const API_BASE = 'http://172.18.148.97:8000';

/* ── Tab definitions ── */
const TABS = [
  {
    id: 'profile', label: 'ข้อมูลส่วนตัว',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  },
  {
    id: 'password', label: 'รหัสผ่าน',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><circle cx="12" cy="16" r="1" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
  },
  {
    id: 'settings', label: 'ตั้งค่า',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
  },
];

/* ── Role badge ── */
const roleBadgeConfig = {
  Admin: { bg: 'bg-rose-500', text: 'Admin' },
  HR: { bg: 'bg-amber-500', text: 'HR' },
  Student: { bg: 'bg-blue-500', text: 'Student' },
};

const Profile = () => {
  const { syncProfile } = useAuth();
  const notify = useNotification();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setProfileData(await profileService.getProfile());
    } catch (error) {
      notify.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      setLoading(true);
      await profileService.uploadProfileImage(file);
      await fetchProfile();
      await syncProfile();
      notify.success('อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว');
    } catch (error) {
      notify.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </div>
          <p className="text-sm text-slate-400 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const avatarSrc = profileData?.profile_image ? `${API_BASE}${profileData.profile_image}` : null;
  const displayName = (() => {
    if (profileData?.first_name || profileData?.last_name)
      return `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
    return profileData?.full_name || profileData?.username || 'User';
  })();
  const role = roleBadgeConfig[profileData?.user_type] || { bg: 'bg-slate-500', text: 'User' };
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      className="min-h-screen pb-16 relative"
      style={{
        background: 'linear-gradient(145deg, #0f1e3a 0%, #1a2f5e 25%, #1e3a7a 45%, #1d3461 65%, #1e293b 100%)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}
    >
      {/* Background pattern — white dots on dark bg */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      {/* Subtle light flare top-left */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

          {/* ── LEFT: Profile Sidebar ── */}
          <div className="lg:sticky lg:top-24 space-y-4 animate-fadeInUp">

            {/* Profile Card */}
            <div className="rounded-2xl overflow-hidden shadow-xl shadow-black/30 border border-white/10 bg-white">
              {/* Banner */}
              <div className="relative h-24 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #4f46e5 100%)' }}>
                {/* Pattern overlay */}
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }} />
                {/* Glow orbs */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-40" style={{ background: '#818cf8' }} />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full blur-xl opacity-30" style={{ background: '#38bdf8' }} />
              </div>

              {/* Avatar area */}
              <div className="px-6 pb-6">
                <div className="-mt-10 flex items-end justify-between mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-white">{initials || '?'}</span>
                      )}
                    </div>
                    <label htmlFor="hero-avatar-upload"
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white cursor-pointer shadow-md transition-all hover:scale-110"
                      title="เปลี่ยนรูปโปรไฟล์">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                      <input id="hero-avatar-upload" type="file" accept="image/jpeg,image/png" className="hidden"
                        onChange={e => handleImageUpload(e.target.files[0])} />
                    </label>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold text-white ${role.bg}`}>
                    {role.text}
                  </span>
                </div>

                {/* Name */}
                <div>
                  <h1 className="text-lg font-extrabold text-slate-900 leading-tight">{displayName}</h1>
                  <p className="text-sm text-slate-500 mt-0.5">@{profileData?.username}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{profileData?.email}</p>
                </div>

                {/* Stats strip */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Tab Nav (vertical on desktop) ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 space-y-1">
              {TABS.map(tab => (
                <button key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}>
                  {tab.icon}
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <svg className="w-4 h-4 ml-auto opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Tab Content ── */}
          <div className="animate-fadeInUp" style={{ animationDelay: '80ms' }}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8 min-h-[400px]">
              {activeTab === 'profile' && (
                <ProfileInfo
                  profileData={profileData}
                  onUpdateProfile={async () => { await fetchProfile(); await syncProfile(); }}
                  profileService={profileService}
                />
              )}
              {activeTab === 'password' && <ChangePassword profileService={profileService} />}
              {activeTab === 'settings' && <Settings profileData={profileData} profileService={profileService} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;