// frontend/src/components/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
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

  // ตรวจสอบ permission
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!user || (user.user_type !== 'Admin' && !user.roles?.includes('Admin'))) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/');
      return;
    }

    loadDashboardData();
    loadUsers();
  }, [isAuthenticated, user, navigate]);

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

  // Handle Search
  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers(1, searchTerm, userTypeFilter, statusFilter);
  };

  // Handle Edit User
  const handleEditUser = async (userId) => {
    try {
      const result = await adminService.getUserById(userId);
      if (result.success) {
        setSelectedUser(result.data);
        setShowEditModal(true);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`คุณต้องการลบผู้ใช้ "${username}" หรือไม่?`)) {
      try {
        const result = await adminService.deleteUser(userId);
        if (result.success) {
          alert('ลบผู้ใช้สำเร็จ');
          loadUsers(currentPage, searchTerm, userTypeFilter, statusFilter);
          loadDashboardData(); // รีเฟรช stats
        } else {
          alert(result.error);
        }
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
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
          <p className="admin-subtitle">ระบบจัดการผู้ใช้และสิทธิ์การเข้าถึง</p>
        </div>

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

        {/* User Management Section */}
        <div className="user-management">
          <div className="section-header">
            <h2>จัดการผู้ใช้</h2>
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
            
            <button onClick={handleSearch} className="btn btn-secondary">
              ค้นหา
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
                  {users.map((user) => (
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
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
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
        </div>
      </div>

      {/* Modals จะเพิ่มในขั้นตอนถัดไป */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            loadUsers(currentPage, searchTerm, userTypeFilter, statusFilter);
            loadDashboardData();
            setShowEditModal(false);
          }}
        />
      )}

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

// Placeholder components for modals (จะสร้างในขั้นตอนถัดไป)
const EditUserModal = ({ user, onClose, onSuccess }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h3>แก้ไขผู้ใช้: {user.full_name}</h3>
      <p>Modal สำหรับแก้ไขผู้ใช้จะเพิ่มในขั้นตอนถัดไป</p>
      <button onClick={onClose}>ปิด</button>
    </div>
  </div>
);

const CreateUserModal = ({ onClose, onSuccess }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h3>เพิ่มผู้ใช้ใหม่</h3>
      <p>Modal สำหรับเพิ่มผู้ใช้ใหม่จะเพิ่มในขั้นตอนถัดไป</p>
      <button onClick={onClose}>ปิด</button>
    </div>
  </div>
);

export default AdminDashboard;