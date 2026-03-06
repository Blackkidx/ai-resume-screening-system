// frontend/src/components/HR/JobManagement.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import '../../styles/job-management.css';

const JobManagement = () => {
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const notify = useNotification();

  // States
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const jobsPerPage = 10;

  // Check permissions
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!user || (user.user_type !== 'HR' && user.user_type !== 'Admin')) {
      notify.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/');
      return;
    }

    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, navigate, currentPage, searchTerm, filterDepartment, filterStatus]);

  // Load jobs from API — ใช้ /my-company endpoint เพื่อกรองเฉพาะบริษัทตัวเอง
  const loadJobs = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        skip: ((currentPage - 1) * jobsPerPage).toString(),
        limit: jobsPerPage.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterDepartment) params.append('department', filterDepartment);
      if (filterStatus !== '') {
        params.append('is_active', filterStatus === 'active' ? 'true' : 'false');
      }

      const response = await fetch(`http://localhost:8000/api/jobs/my-company?${params}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        const jobsData = result.jobs || [];
        const totalCount = result.total_count || jobsData.length;

        setJobs(jobsData);
        setTotalJobs(totalCount);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'เกิดข้อผิดพลาดในการโหลดข้อมูลงาน');
        setJobs([]);
        setTotalJobs(0);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์: ' + error.message);
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId) => {
    try {
      setDeleteLoading(true);

      const response = await fetch(`http://localhost:8000/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setJobs(jobs.filter(job => job.id !== jobId));
        setShowDeleteModal(null);
        notify.success('ลบตำแหน่งงานเรียบร้อยแล้ว');
      } else {
        const errorData = await response.json();
        notify.error(errorData.detail || 'เกิดข้อผิดพลาดในการลบตำแหน่งงาน');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      notify.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle job status
  const toggleJobStatus = async (jobId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:8000/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          is_active: !currentStatus
        }),
      });

      if (response.ok) {
        setJobs(jobs.map(job =>
          job.id === jobId
            ? { ...job, is_active: !currentStatus }
            : job
        ));
      } else {
        const errorData = await response.json();
        notify.error(errorData.detail || 'เกิดข้อผิดพลาดในการอัพเดตสถานะ');
      }
    } catch (error) {
      console.error('Error toggling job status:', error);
      notify.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format allowance
  const formatAllowance = (amount, type) => {
    if (!amount) return 'ไม่ระบุ';
    const formattedAmount = amount.toLocaleString();
    const typeText = type === 'daily' ? 'บาท/วัน' : 'บาท/เดือน';
    return `${formattedAmount} ${typeText}`;
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  // Get unique departments for filter
  const departments = [...new Set(jobs.map(job => job.department))].filter(Boolean);

  return (
    <div className="job-management">
      <div className="job-management-container">

        {/* Header */}
        <div className="job-management-header">
          <div className="header-left">
            <button
              className="btn-back"
              onClick={() => navigate('/hr/dashboard')}
            >
              ← กลับ
            </button>
            <div>
              <h1 className="page-title">จัดการตำแหน่งงาน</h1>
              <p className="page-subtitle">จัดการตำแหน่งฝึกงานทั้งหมดของบริษัท</p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/hr/jobs/create')}
          >
            + สร้างตำแหน่งใหม่
          </button>
        </div>

        {/* Filters */}
        <div className="job-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="ค้นหาตำแหน่งงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="filter-select"
          >
            <option value="">ทุกแผนก</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">ทุกสถานะ</option>
            <option value="active">เปิดรับสมัคร</option>
            <option value="inactive">ปิดรับสมัคร</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner size="large" message="กำลังโหลดข้อมูลงาน..." />
          </div>
        ) : (
          <>
            {/* Jobs Table */}
            <div className="jobs-table-container">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>ตำแหน่งงาน</th>
                    <th>แผนก</th>
                    <th>ประเภท</th>
                    <th>เบี้ยเลี้ยง</th>
                    <th>จำนวนตำแหน่ง</th>
                    <th>ใบสมัคร</th>
                    <th>สถานะ</th>
                    <th>วันที่สร้าง</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="no-data">
                        <div className="no-data-content">
                          <span className="no-data-icon">📋</span>
                          <p>ยังไม่มีตำแหน่งงานที่สร้างไว้</p>
                          <button
                            className="btn btn-primary btn-small"
                            onClick={() => navigate('/hr/jobs/create')}
                          >
                            สร้างตำแหน่งแรก
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className={job.is_active ? '' : 'inactive'}>
                        <td>
                          <div className="job-title-cell">
                            <h4 className="job-title">{job.title}</h4>
                            <p className="job-location">{job.location}</p>
                          </div>
                        </td>
                        <td>{job.department}</td>
                        <td>
                          <span className={`job-type-badge ${job.job_type.toLowerCase().replace(/\s+/g, '-')}`}>
                            {job.job_type}
                          </span>
                        </td>
                        <td>{formatAllowance(job.allowance_amount, job.allowance_type)}</td>
                        <td>
                          <div className="positions-info">
                            <span className="positions-available">{job.positions_available}</span>
                            <span className="positions-separator">/</span>
                            <span className="positions-filled">{job.positions_filled} รับแล้ว</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className="applications-count"
                            style={{ cursor: 'pointer', textDecoration: 'underline', color: '#0369A1' }}
                            onClick={() => navigate(`/hr/jobs/${job.id}/applicants`)}
                            title="ดูผู้สมัคร"
                          >
                            {job.applications_count} ใบสมัคร
                          </span>
                        </td>
                        <td>
                          <button
                            className={`status-toggle ${job.is_active ? 'active' : 'inactive'}`}
                            onClick={() => toggleJobStatus(job.id, job.is_active)}
                            title={job.is_active ? 'คลิกเพื่อปิดรับสมัคร' : 'คลิกเพื่อเปิดรับสมัคร'}
                          >
                            <span className="status-dot"></span>
                            {job.is_active ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                          </button>
                        </td>
                        <td>{formatDate(job.created_at)}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-view"
                              onClick={() => navigate(`/hr/jobs/${job.id}/applicants`)}
                              title="ดูผู้สมัคร"
                            >
                              👥
                            </button>
                            <button
                              className="btn-action btn-view"
                              onClick={() => navigate(`/hr/jobs/${job.id}`)}
                              title="ดูรายละเอียด"
                            >
                              👁️
                            </button>
                            <button
                              className="btn-action btn-edit"
                              onClick={() => navigate(`/hr/jobs/${job.id}/edit`)}
                              title="แก้ไข"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() => setShowDeleteModal(job)}
                              title="ลบ"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ← ก่อนหน้า
                </button>

                <div className="pagination-info">
                  <span>หน้า {currentPage} จาก {totalPages}</span>
                  <span className="pagination-total">({totalJobs} รายการ)</span>
                </div>

                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  ถัดไป →
                </button>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>ยืนยันการลบ</h3>
              </div>
              <div className="modal-body">
                <p>คุณต้องการลบตำแหน่งงาน <strong>"{showDeleteModal.title}"</strong> ใช่หรือไม่?</p>
                <p className="modal-warning">การลบนี้ไม่สามารถกู้คืนได้</p>
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(null)}
                  disabled={deleteLoading}
                >
                  ยกเลิก
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteJob(showDeleteModal.id)}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <LoadingSpinner size="small" />
                      กำลังลบ...
                    </>
                  ) : (
                    'ลบตำแหน่งงาน'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobManagement;