// frontend/src/components/Admin/AdminDashboard.jsx - Updated with Company Management Tab
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
//import companyService from '../../services/companyService';
import CompanyManagement from './CompanyManagement';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import '../../styles/admin.css';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const notify = useNotification();

  const [activeTab, setActiveTab] = useState('overview'); // overview, users, companies
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination และ Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Real-time search
  useEffect(() => {
    if (activeTab === 'users') {
      const delayedSearch = setTimeout(() => {
        if (users.length > 0 || searchTerm || userTypeFilter || statusFilter) {
          setCurrentPage(1);
          loadUsers(1, searchTerm, userTypeFilter, statusFilter);
        }
      }, 500);

      return () => clearTimeout(delayedSearch);
    }
  }, [searchTerm, userTypeFilter, statusFilter, activeTab]);

  // ตรวจสอบ permission
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!user || (user.user_type !== 'Admin' && !user.roles?.includes('Admin'))) {
      notify.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/');
      return;
    }

    loadDashboardData();
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [isAuthenticated, user, navigate, activeTab]);

  // โหลดข้อมูล Dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const result = await adminService.getDashboardStats();

      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // โหลดรายการ Users
  const loadUsers = async (page = 1, search = '', userType = '', status = '') => {
    try {
      setUsersLoading(true);
      const result = await adminService.getUsers({
        page,
        limit: 10,
        search,
        user_type: userType,
        is_active: status === '' ? null : status === 'active'
      });

      if (result.success) {
        setUsers(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการโหลดรายการผู้ใช้');
    } finally {
      setUsersLoading(false);
    }
  };

  // Handle Edit User
  const handleEditUser = async (userId) => {
    try {
      setModalLoading(true);
      const result = await adminService.getUserById(userId);
      if (result.success) {
        setSelectedUser(result.data);
        setShowEditModal(true);
      } else {
        notify.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้: ' + result.error);
      }
    } catch (error) {
      notify.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`คุณต้องการลบผู้ใช้ "${username}" หรือไม่?`)) {
      try {
        const result = await adminService.deleteUser(userId);
        if (result.success) {
          notify.success('ลบผู้ใช้สำเร็จ');
          loadUsers(currentPage, searchTerm, userTypeFilter, statusFilter);
          loadDashboardData();
        } else {
          notify.error(result.error);
        }
      } catch (error) {
        notify.error('เกิดข้อผิดพลาดในการลบผู้ใช้');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่เคยเข้าสู่ระบบ';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner size="large" message="กำลังโหลดข้อมูล Dashboard..." />;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">ระบบจัดการผู้ใช้และบริษัท</p>
        </div>

        {/* Tabs Navigation */}
        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 ภาพรวม
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 จัดการผู้ใช้
          </button>
          <button
            className={`tab-button ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            🏢 จัดการบริษัท
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Stats Cards */}
              {dashboardData && (
                <div className="stats-grid">
                  <div className="stat-card total">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <h3>ผู้ใช้ทั้งหมด</h3>
                      <div className="stat-number">{dashboardData.total_users}</div>
                    </div>
                  </div>

                  <div className="stat-card students">
                    <div className="stat-icon">🎓</div>
                    <div className="stat-content">
                      <h3>นักศึกษา</h3>
                      <div className="stat-number">{dashboardData.student_count}</div>
                    </div>
                  </div>

                  <div className="stat-card hr">
                    <div className="stat-icon">💼</div>
                    <div className="stat-content">
                      <h3>HR</h3>
                      <div className="stat-number">{dashboardData.hr_count}</div>
                    </div>
                  </div>

                  <div className="stat-card admins">
                    <div className="stat-icon">👑</div>
                    <div className="stat-content">
                      <h3>Admin</h3>
                      <div className="stat-number">{dashboardData.admin_count}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="quick-actions">
                <h3>การดำเนินการด่วน</h3>
                <div className="actions-grid">
                  <button
                    className="action-card"
                    onClick={() => setActiveTab('users')}
                  >
                    <div className="action-icon">👥</div>
                    <div className="action-text">
                      <h4>จัดการผู้ใช้</h4>
                      <p>เพิ่ม แก้ไข ลบผู้ใช้</p>
                    </div>
                  </button>

                  <button
                    className="action-card"
                    onClick={() => setActiveTab('companies')}
                  >
                    <div className="action-icon">🏢</div>
                    <div className="action-text">
                      <h4>จัดการบริษัท</h4>
                      <p>เพิ่มบริษัทและกำหนด HR</p>
                    </div>
                  </button>

                  <button
                    className="action-card"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <div className="action-icon">➕</div>
                    <div className="action-text">
                      <h4>เพิ่มผู้ใช้ใหม่</h4>
                      <p>สร้างบัญชีผู้ใช้ใหม่</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users Management Tab */}
          {activeTab === 'users' && (
            <div className="users-tab">
              <div className="section-header">
                <h2>👥 จัดการผู้ใช้</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  + เพิ่มผู้ใช้ใหม่
                </button>
              </div>

              {/* Filters */}
              <div className="filters">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, อีเมล, หรือ username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <div className="search-indicator">
                      🔍 กำลังค้นหา "{searchTerm}"
                    </div>
                  )}
                </div>

                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">ทุก Role</option>
                  <option value="Student">Student</option>
                  <option value="HR">HR</option>
                  <option value="Admin">Admin</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="active">เปิดใช้งาน</option>
                  <option value="inactive">ปิดใช้งาน</option>
                </select>

                <button
                  onClick={() => {
                    setSearchTerm('');
                    setUserTypeFilter('');
                    setStatusFilter('');
                    setCurrentPage(1);
                    loadUsers(1, '', '', '');
                  }}
                  className="btn btn-secondary"
                >
                  ล้างตัวกรอง
                </button>
              </div>

              {/* Users Table */}
              <div className="users-table-container">
                {usersLoading ? (
                  <LoadingSpinner message="กำลังโหลดรายการผู้ใช้..." />
                ) : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>ผู้ใช้</th>
                        <th>อีเมล</th>
                        <th>Role</th>
                        <th>สถานะ</th>
                        <th>เข้าสู่ระบบล่าสุด</th>
                        <th>การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length > 0 ? (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <div className="user-info">
                                <div className="user-avatar-small">
                                  {user.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="user-name">{user.full_name}</div>
                                  <div className="username">@{user.username}</div>
                                </div>
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`role-badge ${user.user_type.toLowerCase()}`}>
                                {user.user_type}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                {user.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                              </span>
                            </td>
                            <td>{formatDate(user.last_login)}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-action edit"
                                  onClick={() => handleEditUser(user.id)}
                                  title="แก้ไข"
                                  disabled={modalLoading}
                                >
                                  ✏️
                                </button>
                                <button
                                  className="btn-action delete"
                                  onClick={() => handleDeleteUser(user.id, user.username)}
                                  title="ลบ"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                            {searchTerm || userTypeFilter || statusFilter
                              ? 'ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา'
                              : 'ไม่มีข้อมูลผู้ใช้'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {users.length > 0 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary"
                    disabled={currentPage === 1}
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      loadUsers(newPage, searchTerm, userTypeFilter, statusFilter);
                    }}
                  >
                    ← ก่อนหน้า
                  </button>

                  <span className="page-info">หน้า {currentPage}</span>

                  <button
                    className="btn btn-secondary"
                    disabled={users.length < 10}
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      loadUsers(newPage, searchTerm, userTypeFilter, statusFilter);
                    }}
                  >
                    ถัดไป →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Companies Management Tab */}
          {activeTab === 'companies' && (
            <div className="companies-tab">
              <CompanyManagement />
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            loadUsers(currentPage, searchTerm, userTypeFilter, statusFilter);
            loadDashboardData();
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadUsers(currentPage, searchTerm, userTypeFilter, statusFilter);
            loadDashboardData();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

// Edit User Modal Component (same as before)
const EditUserModal = ({ user, onClose, onSuccess }) => {
  const notify = useNotification();
  const [formData, setFormData] = useState({
    username: user.username || '',
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    user_type: user.user_type || 'Student',
    is_active: user.is_active !== undefined ? user.is_active : true,
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.username.trim().length < 3) {
        setError('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
        setLoading(false);
        return;
      }

      if (showPasswordFields && formData.new_password) {
        if (formData.new_password.length < 6) {
          setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
          setLoading(false);
          return;
        }

        if (formData.new_password !== formData.confirm_password) {
          setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
          setLoading(false);
          return;
        }
      }

      const updateData = {
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        user_type: formData.user_type,
        is_active: formData.is_active
      };

      if (showPasswordFields && formData.new_password) {
        updateData.new_password = formData.new_password;
      }

      const result = await adminService.updateUser(user.id, updateData);

      if (result.success) {
        notify.success('อัปเดตข้อมูลผู้ใช้สำเร็จ');
        onSuccess();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const togglePasswordFields = () => {
    setShowPasswordFields(!showPasswordFields);
    if (showPasswordFields) {
      setFormData(prev => ({
        ...prev,
        new_password: '',
        confirm_password: ''
      }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal edit-user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>แก้ไขข้อมูลผู้ใช้: {user.full_name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-user-form">
          <div className="form-group">
            <label htmlFor="username">ชื่อผู้ใช้ *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-input"
              placeholder="ชื่อผู้ใช้ (อย่างน้อย 3 ตัวอักษร)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="full_name">ชื่อ-นามสกุล *</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">อีเมล *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className="form-input"
              placeholder="080-xxx-xxxx"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="user_type">ประเภทผู้ใช้ *</label>
              <select
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
              >
                <option value="Student">Student</option>
                <option value="HR">HR</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={loading}
                />
                เปิดใช้งานบัญชี
              </label>
            </div>
          </div>

          <div className="password-section">
            <div className="password-toggle">
              <button
                type="button"
                onClick={togglePasswordFields}
                className="btn btn-outline"
                disabled={loading}
              >
                {showPasswordFields ? '🔒 ยกเลิกการเปลี่ยนรหัสผ่าน' : '🔓 เปลี่ยนรหัสผ่าน'}
              </button>
            </div>

            {showPasswordFields && (
              <div className="password-fields">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="new_password">รหัสผ่านใหม่ *</label>
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleChange}
                      required={showPasswordFields}
                      disabled={loading}
                      className="form-input"
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirm_password">ยืนยันรหัสผ่าน *</label>
                    <input
                      type="password"
                      id="confirm_password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required={showPasswordFields}
                      disabled={loading}
                      className="form-input"
                      placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create User Modal Component (same as before)
const CreateUserModal = ({ onClose, onSuccess }) => {
  const notify = useNotification();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    user_type: 'Student',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.password.length < 6) {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        setLoading(false);
        return;
      }

      const result = await adminService.createUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        user_type: formData.user_type,
        is_active: formData.is_active
      });

      if (result.success) {
        notify.success('สร้างผู้ใช้ใหม่สำเร็จ');
        onSuccess();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการสร้างผู้ใช้');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal create-user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>เพิ่มผู้ใช้ใหม่</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-user-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">ชื่อผู้ใช้ *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
                placeholder="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">รหัสผ่าน *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="full_name">ชื่อ-นามสกุล *</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">อีเมล *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className="form-input"
              placeholder="080-xxx-xxxx"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="user_type">ประเภทผู้ใช้ *</label>
              <select
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
              >
                <option value="Student">Student</option>
                <option value="HR">HR</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={loading}
                />
                เปิดใช้งานบัญชี
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;