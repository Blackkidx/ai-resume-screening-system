// frontend/src/components/Profile/Settings.jsx
import React, { useState } from 'react';

const Settings = ({ profileData, profileService }) => {
  const [settings, setSettings] = useState({
    email_notifications: true,
    browser_notifications: false,
    sms_notifications: false,
    security_alerts: true
  });

  const handleSettingChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleClearData = () => {
    if (window.confirm('คุณต้องการล้างประวัติข้อมูลทั้งหมดหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
      alert('ฟังก์ชันนี้อยู่ระหว่างการพัฒนา');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('คุณต้องการลบบัญชีหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
      if (window.confirm('กรุณายืนยันอีกครั้ง: ลบบัญชีผู้ใช้นี้ถาวร?')) {
        alert('ฟังก์ชันนี้อยู่ระหว่างการพัฒนา');
      }
    }
  };

  return (
    <div className="settings-section">
      <div className="profile-section-header">
        <h2>ตั้งค่า</h2>
      </div>

      <div className="profile-settings-grid">
        {/* การแจ้งเตือน */}
        <div className="profile-settings-card">
          <div className="profile-settings-card-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span>การแจ้งเตือน</span>
          </div>
          <p>จัดการการแจ้งเตือนต่างๆ ของระบบ</p>
          
          <div className="profile-setting-item">
            <div className="profile-setting-info">
              <h4>แจ้งเตือนทางอีเมล</h4>
              <p>รับการแจ้งเตือนสำคัญทางอีเมล</p>
            </div>
            <label className="profile-toggle-switch">
              <input
                type="checkbox"
                checked={settings.email_notifications}
                onChange={() => handleSettingChange('email_notifications')}
              />
              <span className="profile-slider"></span>
            </label>
          </div>

          <div className="profile-setting-item">
            <div className="profile-setting-info">
              <h4>แจ้งเตือนในเบราว์เซอร์</h4>
              <p>แสดงการแจ้งเตือนในเบราว์เซอร์</p>
            </div>
            <label className="profile-toggle-switch">
              <input
                type="checkbox"
                checked={settings.browser_notifications}
                onChange={() => handleSettingChange('browser_notifications')}
              />
              <span className="profile-slider"></span>
            </label>
          </div>
        </div>

        {/* ความปลอดภัย */}
        <div className="profile-settings-card">
          <div className="profile-settings-card-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>ความปลอดภัย</span>
          </div>
          <p>การตั้งค่าเกี่ยวกับความปลอดภัยบัญชี</p>
          
          <div className="profile-setting-item">
            <div className="profile-setting-info">
              <h4>การแจ้งเตือนความปลอดภัย</h4>
              <p>แจ้งเตือนเมื่อมีการเข้าสู่ระบบผิดปกติ</p>
            </div>
            <label className="profile-toggle-switch">
              <input
                type="checkbox"
                checked={settings.security_alerts}
                onChange={() => handleSettingChange('security_alerts')}
              />
              <span className="profile-slider"></span>
            </label>
          </div>

          <div className="profile-setting-item">
            <div className="profile-setting-info">
              <h4>SMS แจ้งเตือน</h4>
              <p>รับ SMS แจ้งเตือนสำหรับกิจกรรมสำคัญ</p>
            </div>
            <label className="profile-toggle-switch">
              <input
                type="checkbox"
                checked={settings.sms_notifications}
                onChange={() => handleSettingChange('sms_notifications')}
              />
              <span className="profile-slider"></span>
            </label>
          </div>
        </div>

        {/* ข้อมูลบัญชี */}
        <div className="profile-settings-card">
          <div className="profile-settings-card-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c.552 0 1-.448 1-1V8c0-.552-.448-1-1-1h-1V6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v1H3c-.552 0-1 .448-1 1v3c0 .552.448 1 1 1h1v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1h1z"/>
            </svg>
            <span>ข้อมูลบัญชี</span>
          </div>
          <p>ข้อมูลสถิติและการใช้งานบัญชี</p>
          
          <div className="profile-account-stats">
            <div className="profile-stat-item">
              <div className="profile-stat-label">สถานะบัญชี</div>
              <div className="profile-stat-value active">
                <span className="profile-status-dot"></span>
                ใช้งานอยู่
              </div>
            </div>
            
            <div className="profile-stat-item">
              <div className="profile-stat-label">ประเภทผู้ใช้</div>
              <div className="profile-stat-value">{profileData?.user_type || 'Admin'}</div>
            </div>
            
            <div className="profile-stat-item">
              <div className="profile-stat-label">การเข้าสู่ระบบล่าสุด</div>
              <div className="profile-stat-value">วันนี้ 14:30</div>
            </div>
          </div>
        </div>

        {/* การดำเนินการต่างๆ */}
        <div className="profile-settings-card danger-zone">
          <div className="profile-settings-card-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>ภูมิภาคอันตราย</span>
          </div>
          <p>การดำเนินการที่ไม่สามารถย้อนกลับได้</p>
          
          <div className="profile-danger-actions">
            <button className="profile-btn-danger-secondary" onClick={handleClearData}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              ล้างประวัติข้อมูล
            </button>
            
            <button className="profile-btn-danger" onClick={handleDeleteAccount}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              ลบบัญชี
            </button>
          </div>
        </div>
      </div>

      <div className="profile-settings-actions">
        <button className="profile-btn-save-settings">
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
};

export default Settings;