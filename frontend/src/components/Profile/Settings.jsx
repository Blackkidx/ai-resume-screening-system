// frontend/src/components/Profile/NewSettings.jsx
import React, { useState } from 'react';

const Settings = ({ profileData, profileService }) => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'th',
    privacy: false
  });

  const handleToggleChange = (settingName) => {
    setSettings(prev => ({
      ...prev,
      [settingName]: !prev[settingName]
    }));
  };

  const handleLanguageChange = (e) => {
    setSettings(prev => ({
      ...prev,
      language: e.target.value
    }));
  };

  const handleDeleteAccount = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบบัญชี? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      if (window.confirm('กรุณายืนยันอีกครั้ง: คุณต้องการลบบัญชีนี้จริงหรือไม่?')) {
        alert('ฟีเจอร์นี้ยังไม่เปิดใช้งาน');
      }
    }
  };

  return (
    <div className="new-settings-section">
      <div className="new-settings-container">
        <div className="new-settings-header">
          <h2>ตั้งค่า</h2>
        </div>

        <div className="new-settings-grid">
          {/* การแจ้งเตือน */}
          <div className="new-settings-card">
            <div className="new-settings-card-header">
              <div className="new-settings-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <h3 className="new-settings-card-title">การแจ้งเตือน</h3>
            </div>
            <p className="new-settings-card-description">
              รับการแจ้งเตือนเกี่ยวกับกิจกรรมสำคัญ
            </p>
            <div className="new-settings-toggle-wrapper">
              <div 
                className={`new-settings-toggle ${settings.notifications ? 'active' : ''}`}
                onClick={() => handleToggleChange('notifications')}
              ></div>
            </div>
          </div>

          {/* โหมดกลางคืน */}
          <div className="new-settings-card">
            <div className="new-settings-card-header">
              <div className="new-settings-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </div>
              <h3 className="new-settings-card-title">โหมดกลางคืน</h3>
            </div>
            <p className="new-settings-card-description">
              เปลี่ยนธีมเป็นโทนสีเข้ม
            </p>
            <div className="new-settings-toggle-wrapper">
              <div 
                className={`new-settings-toggle ${settings.darkMode ? 'active' : ''}`}
                onClick={() => handleToggleChange('darkMode')}
              ></div>
            </div>
          </div>

          {/* ภาษา */}
          <div className="new-settings-card">
            <div className="new-settings-card-header">
              <div className="new-settings-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <h3 className="new-settings-card-title">ภาษา</h3>
            </div>
            <p className="new-settings-card-description">
              เลือกภาษาที่ใช้ในระบบ
            </p>
            <div className="new-settings-select-wrapper">
              <select 
                value={settings.language} 
                onChange={handleLanguageChange}
                className="new-settings-select"
              >
                <option value="th">ไทย</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* ความเป็นส่วนตัว */}
          <div className="new-settings-card">
            <div className="new-settings-card-header">
              <div className="new-settings-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 className="new-settings-card-title">ความเป็นส่วนตัว</h3>
            </div>
            <p className="new-settings-card-description">
              ปกป้องข้อมูลส่วนตัวของคุณ
            </p>
            <div className="new-settings-toggle-wrapper">
              <div 
                className={`new-settings-toggle ${settings.privacy ? 'active' : ''}`}
                onClick={() => handleToggleChange('privacy')}
              ></div>
            </div>
          </div>

          {/* การลบบัญชี */}
          <div className="new-settings-card new-settings-danger-card">
            <div className="new-settings-card-header">
              <div className="new-settings-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </div>
              <h3 className="new-settings-card-title">ลบบัญชี</h3>
            </div>
            <p className="new-settings-card-description">
              ลบบัญชีและข้อมูลทั้งหมดอย่างถาวร
            </p>
            <div className="new-settings-toggle-wrapper">
              <button 
                onClick={handleDeleteAccount}
                className="new-settings-danger-btn"
              >
                ลบบัญชี
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;