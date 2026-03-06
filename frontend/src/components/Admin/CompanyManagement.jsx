// frontend/src/components/Admin/CompanyManagement.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import companyService from '../../services/companyService';
import adminService from '../../services/adminService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

const CompanyManagement = () => {
  const { user } = useAuth();
  const notify = useNotification();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // สำหรับ pagination และ filter
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHRModal, setShowHRModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Real-time search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setCurrentPage(1);
      loadCompanies(1, searchTerm, industryFilter, statusFilter);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, industryFilter, statusFilter]);

  useEffect(() => {
    loadCompanies();
  }, []);

  // โหลดรายการ Companies
  const loadCompanies = async (page = 1, search = '', industry = '', status = '') => {
    try {
      setLoading(true);
      const result = await companyService.getCompanies({
        page,
        limit: 10,
        search,
        industry,
        is_active: status === '' ? null : status === 'active'
      });

      if (result.success) {
        setCompanies(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการโหลดรายการบริษัท');
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Company
  const handleEditCompany = async (companyId) => {
    try {
      const result = await companyService.getCompanyById(companyId);
      if (result.success) {
        setSelectedCompany(result.data);
        setShowEditModal(true);
      } else {
        notify.error('เกิดข้อผิดพลาดในการโหลดข้อมูลบริษัท: ' + result.error);
      }
    } catch (error) {
      notify.error('เกิดข้อผิดพลาดในการโหลดข้อมูลบริษัท');
    }
  };

  // Handle Delete Company
  const handleDeleteCompany = async (companyId, companyName) => {
    if (window.confirm(`คุณต้องการลบบริษัท "${companyName}" หรือไม่?`)) {
      try {
        const result = await companyService.deleteCompany(companyId);
        if (result.success) {
          notify.success('ลบบริษัทสำเร็จ');
          loadCompanies(currentPage, searchTerm, industryFilter, statusFilter);
        } else {
          notify.error(result.error);
        }
      } catch (error) {
        notify.error('เกิดข้อผิดพลาดในการลบบริษัท');
      }
    }
  };

  // Handle Manage HR
  const handleManageHR = (company) => {
    setSelectedCompany(company);
    setShowHRModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner size="large" message="กำลังโหลดข้อมูลบริษัท..." />;
  }

  return (
    <div className="company-management">
      <div className="section-header">
        <h2>🏢 จัดการบริษัท</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + เพิ่มบริษัทใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="ค้นหาชื่อบริษัท, อุตสาหกรรม..."
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
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">ทุกอุตสาหกรรม</option>
          <option value="Technology">Technology</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Finance">Finance</option>
          <option value="Education">Education</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Retail">Retail</option>
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
            setIndustryFilter('');
            setStatusFilter('');
            setCurrentPage(1);
            loadCompanies(1, '', '', '');
          }}
          className="btn btn-secondary"
        >
          ล้างตัวกรอง
        </button>
      </div>

      {/* Companies Table */}
      <div className="companies-table-container">
        {loading ? (
          <LoadingSpinner message="กำลังโหลดรายการบริษัท..." />
        ) : (
          <table className="companies-table">
            <thead>
              <tr>
                <th>บริษัท</th>
                <th>อุตสาหกรรม</th>
                <th>HR</th>
                <th>สถานะ</th>
                <th>วันที่สร้าง</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {companies.length > 0 ? (
                companies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <div className="company-info">
                        <div className="company-avatar">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="company-name">{company.name}</div>
                          {company.location && (
                            <div className="company-location">📍 {company.location}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="industry-badge">
                        {company.industry}
                      </span>
                    </td>
                    <td>
                      <div className="hr-count">
                        <span className="hr-active">{company.active_hr_count || 0} คนใช้งาน</span>
                        <span className="hr-total">/ {company.hr_count || 0} ทั้งหมด</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${company.is_active ? 'active' : 'inactive'}`}>
                        {company.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td>{formatDate(company.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action manage-hr"
                          onClick={() => handleManageHR(company)}
                          title="จัดการ HR"
                        >
                          👥
                        </button>
                        <button
                          className="btn-action edit"
                          onClick={() => handleEditCompany(company.id)}
                          title="แก้ไข"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action delete"
                          onClick={() => handleDeleteCompany(company.id, company.name)}
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
                    {searchTerm || industryFilter || statusFilter
                      ? 'ไม่พบบริษัทที่ตรงกับเงื่อนไขการค้นหา'
                      : 'ยังไม่มีบริษัทในระบบ'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {companies.length > 0 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            disabled={currentPage === 1}
            onClick={() => {
              const newPage = currentPage - 1;
              setCurrentPage(newPage);
              loadCompanies(newPage, searchTerm, industryFilter, statusFilter);
            }}
          >
            ← ก่อนหน้า
          </button>

          <span className="page-info">หน้า {currentPage}</span>

          <button
            className="btn btn-secondary"
            disabled={companies.length < 10}
            onClick={() => {
              const newPage = currentPage + 1;
              setCurrentPage(newPage);
              loadCompanies(newPage, searchTerm, industryFilter, statusFilter);
            }}
          >
            ถัดไป →
          </button>
        </div>
      )}

      {/* Create Company Modal */}
      {showCreateModal && (
        <CreateCompanyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadCompanies(currentPage, searchTerm, industryFilter, statusFilter);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Edit Company Modal */}
      {showEditModal && selectedCompany && (
        <EditCompanyModal
          company={selectedCompany}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCompany(null);
          }}
          onSuccess={() => {
            loadCompanies(currentPage, searchTerm, industryFilter, statusFilter);
            setShowEditModal(false);
            setSelectedCompany(null);
          }}
        />
      )}

      {/* HR Management Modal */}
      {showHRModal && selectedCompany && (
        <CompanyHRManagementModal
          company={selectedCompany}
          onClose={() => {
            setShowHRModal(false);
            setSelectedCompany(null);
          }}
          onSuccess={() => {
            loadCompanies(currentPage, searchTerm, industryFilter, statusFilter);
          }}
        />
      )}
    </div>
  );
};

// Create Company Modal Component
const CreateCompanyModal = ({ onClose, onSuccess }) => {
  const notify = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    location: '',
    website: '',
    contact_email: '',
    contact_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await companyService.createCompany({
        name: formData.name.trim(),
        industry: formData.industry,
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        website: formData.website.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null
      });

      if (result.success) {
        notify.success('สร้างบริษัทสำเร็จ');
        onSuccess();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการสร้างบริษัท');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal create-company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>เพิ่มบริษัทใหม่</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-company-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">ชื่อบริษัท *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
                placeholder="ชื่อบริษัท"
              />
            </div>

            <div className="form-group">
              <label htmlFor="industry">อุตสาหกรรม *</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
              >
                <option value="">เลือกอุตสาหกรรม</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Other">อื่นๆ</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">รายละเอียดบริษัท</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              className="form-input"
              placeholder="รายละเอียดเกี่ยวกับบริษัท..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">ที่ตั้ง</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
                placeholder="กรุงเทพมหานคร"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">เว็บไซต์</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contact_email">อีเมลติดต่อ</label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
                placeholder="contact@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_phone">เบอร์โทรติดต่อ</label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
                placeholder="02-xxx-xxxx"
              />
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
              {loading ? 'กำลังสร้าง...' : 'สร้างบริษัท'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Company Modal Component
const EditCompanyModal = ({ company, onClose, onSuccess }) => {
  const notify = useNotification();
  const [formData, setFormData] = useState({
    name: company.name || '',
    industry: company.industry || '',
    description: company.description || '',
    location: company.location || '',
    website: company.website || '',
    contact_email: company.contact_email || '',
    contact_phone: company.contact_phone || '',
    is_active: company.is_active !== undefined ? company.is_active : true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await companyService.updateCompany(company.id, {
        name: formData.name.trim(),
        industry: formData.industry,
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        website: formData.website.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        is_active: formData.is_active
      });

      if (result.success) {
        notify.success('อัปเดตข้อมูลบริษัทสำเร็จ');
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal edit-company-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>แก้ไขข้อมูลบริษัท: {company.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-company-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">ชื่อบริษัท *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="industry">อุตสาหกรรม *</label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                disabled={loading}
                className="form-input"
              >
                <option value="">เลือกอุตสาหกรรม</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Other">อื่นๆ</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">รายละเอียดบริษัท</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              className="form-input"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">ที่ตั้ง</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">เว็บไซต์</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contact_email">อีเมลติดต่อ</label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_phone">เบอร์โทรติดต่อ</label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                disabled={loading}
                className="form-input"
              />
            </div>
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
              เปิดใช้งานบริษัท
            </label>
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

// Company HR Management Modal Component
const CompanyHRManagementModal = ({ company, onClose, onSuccess }) => {
  const notify = useNotification();
  const [hrUsers, setHrUsers] = useState([]);
  const [availableHRUsers, setAvailableHRUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHRIds, setSelectedHRIds] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, [company.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // โหลด HR ของ company
      const hrResult = await companyService.getCompanyHRUsers(company.id);
      if (hrResult.success) {
        setHrUsers(hrResult.data);
      }

      // โหลด HR ที่ใช้ได้ทั้งหมด
      const availableResult = await companyService.getAvailableHRUsers();
      if (availableResult.success) {
        setAvailableHRUsers(availableResult.data);
      }

    } catch (error) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล HR');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignHR = async () => {
    if (selectedHRIds.length === 0) {
      notify.warning('กรุณาเลือก HR อย่างน้อย 1 คน');
      return;
    }

    try {
      setIsAssigning(true);
      const result = await companyService.assignHRToCompany(company.id, selectedHRIds);

      if (result.success) {
        notify.success(result.message);
        setSelectedHRIds([]);
        loadData();
        onSuccess();
      } else {
        notify.error(result.error);
      }
    } catch (error) {
      notify.error('เกิดข้อผิดพลาดในการเพิ่ม HR');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveHR = async (userId, username) => {
    if (window.confirm(`คุณต้องการลบ HR "${username}" จากบริษัทนี้หรือไม่?`)) {
      try {
        const result = await companyService.removeHRFromCompany(company.id, userId);
        if (result.success) {
          notify.success(result.message);
          loadData();
          onSuccess();
        } else {
          notify.error(result.error);
        }
      } catch (error) {
        notify.error('เกิดข้อผิดพลาดในการลบ HR');
      }
    }
  };

  const handleHRSelection = (userId) => {
    setSelectedHRIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

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

  // กรอง HR ที่ยังไม่ได้ assign
  const unassignedHRUsers = availableHRUsers.filter(user =>
    !hrUsers.some(hr => hr.id === user.id)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal hr-management-modal large-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>จัดการ HR: {company.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="hr-management-content">
          {loading ? (
            <LoadingSpinner message="กำลังโหลดข้อมูล HR..." />
          ) : (
            <div className="hr-sections">
              {/* Current HR Users */}
              <div className="hr-section">
                <h4>HR ปัจจุบัน ({hrUsers.length} คน)</h4>
                <div className="hr-list current-hr">
                  {hrUsers.length > 0 ? (
                    hrUsers.map((hr) => (
                      <div key={hr.id} className="hr-item">
                        <div className="hr-info">
                          <div className="hr-avatar">
                            {hr.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="hr-details">
                            <div className="hr-name">{hr.full_name}</div>
                            <div className="hr-email">{hr.email}</div>
                            <div className="hr-username">@{hr.username}</div>
                            <div className="hr-status">
                              <span className={`status-badge ${hr.is_active ? 'active' : 'inactive'}`}>
                                {hr.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                              </span>
                              <span className="last-login">
                                เข้าสู่ระบบล่าสุด: {formatDate(hr.last_login)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          className="btn-remove-hr"
                          onClick={() => handleRemoveHR(hr.id, hr.username)}
                          title="ลบ HR"
                        >
                          ลบ
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="no-hr-message">
                      ยังไม่มี HR ในบริษัทนี้
                    </div>
                  )}
                </div>
              </div>

              {/* Available HR Users */}
              <div className="hr-section">
                <h4>เพิ่ม HR ใหม่ ({unassignedHRUsers.length} คนที่ใช้ได้)</h4>
                <div className="hr-assignment-section">
                  {unassignedHRUsers.length > 0 ? (
                    <>
                      <div className="hr-list available-hr">
                        {unassignedHRUsers.map((hr) => (
                          <div key={hr.id} className="hr-item selectable">
                            <label className="hr-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedHRIds.includes(hr.id)}
                                onChange={() => handleHRSelection(hr.id)}
                              />
                              <div className="hr-info">
                                <div className="hr-avatar">
                                  {hr.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="hr-details">
                                  <div className="hr-name">{hr.full_name}</div>
                                  <div className="hr-email">{hr.email}</div>
                                  <div className="hr-username">@{hr.username}</div>
                                  <div className="hr-status">
                                    <span className={`status-badge ${hr.is_active ? 'active' : 'inactive'}`}>
                                      {hr.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>

                      {selectedHRIds.length > 0 && (
                        <div className="assign-hr-actions">
                          <button
                            className="btn btn-primary"
                            onClick={handleAssignHR}
                            disabled={isAssigning}
                          >
                            {isAssigning ? 'กำลังเพิ่ม...' : `เพิ่ม HR ${selectedHRIds.length} คน`}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="no-hr-message">
                      ไม่มี HR ที่ใช้ได้แล้ว (HR ทั้งหมดได้รับการ assign แล้ว)
                    </div>
                  )}
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
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyManagement;