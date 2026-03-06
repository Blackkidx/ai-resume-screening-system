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
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_BASE_URL}/api/profile/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'ไม่สามารถลบบัญชีได้');
      }

      notify.success('บัญชีของคุณถูกลบเรียบร้อยแล้ว');
      await authLogout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error deleting account:', error);
      notify.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="new-settings-section">
      <div className="new-settings-container">
        <div className="new-settings-header">
          <h2>ตั้งค่า</h2>
        </div>

        {/* Delete Account Section */}
        <div className="delete-account-section">
          <div className="delete-account-card">
            <div className="delete-account-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="delete-account-content">
              <h3>ลบบัญชีผู้ใช้</h3>
              <p>เมื่อลบบัญชีแล้ว ข้อมูลทุกอย่างจะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้</p>
              <ul className="delete-account-warnings">
                <li>ข้อมูลส่วนตัว, รูปโปรไฟล์ และการตั้งค่าทั้งหมดจะหายไป</li>
                <li>Resume ที่เคยอัปโหลดและผลการประมวลผล AI จะถูกลบ</li>
                <li>ประวัติการสมัครงานทั้งหมดจะถูกลบ</li>
                <li>ไม่สามารถใช้ Username และ Email เดิมสมัครใหม่ได้ทันที</li>
              </ul>
            </div>
            <button
              className="delete-account-btn"
              onClick={() => setShowDeleteModal(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              ลบบัญชี
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="delete-modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-modal-header">
                <div className="delete-modal-warning-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h3>คุณแน่ใจหรือไม่?</h3>
              </div>

              <div className="delete-modal-body">
                <p className="delete-modal-warning-text">
                  ⚠️ <strong>การลบบัญชีเป็นการดำเนินการถาวร</strong> ไม่สามารถย้อนกลับได้
                </p>
                <div className="delete-modal-impact">
                  <p>สิ่งที่จะถูกลบทั้งหมด:</p>
                  <ul>
                    <li>🗑️ บัญชีผู้ใช้และข้อมูลส่วนตัว</li>
                    <li>📄 Resume ทั้งหมดที่เคยอัปโหลด</li>
                    <li>🤖 ผลการประมวลผล AI ที่เคยทำไว้</li>
                    <li>📋 ประวัติการสมัครงานทุกตำแหน่ง</li>
                    <li>🖼️ รูปโปรไฟล์</li>
                  </ul>
                </div>

                <div className="delete-modal-confirm-input">
                  <label>พิมพ์ <strong>"ลบบัญชีของฉัน"</strong> เพื่อยืนยัน</label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="ลบบัญชีของฉัน"
                    disabled={deleting}
                    className="delete-confirm-input"
                  />
                </div>
              </div>

              <div className="delete-modal-actions">
                <button
                  className="delete-modal-cancel"
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                  disabled={deleting}
                >
                  ยกเลิก
                </button>
                <button
                  className="delete-modal-confirm"
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== 'ลบบัญชีของฉัน'}
                >
                  {deleting ? 'กำลังลบบัญชี...' : 'ยืนยันลบบัญชี'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;