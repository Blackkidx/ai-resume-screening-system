import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import companyService from '../../services/companyService';
import adminService from '../../services/adminService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import { API_BASE_URL } from '../../config';

const renderIcon = (name, className = "w-5 h-5") => {
  switch (name) {
    case 'Building2': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>;
    case 'Search': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
    case 'MapPin': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>;
    case 'Users': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'Edit': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>;
    case 'Trash': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;
    case 'Dashboard': return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    default: return null;
  }
};

const CompanyManagement = () => {
  const { user } = useAuth();
  const notify = useNotification();
  const navigate = useNavigate();

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeInDown">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          {renderIcon('Building2', 'w-6 h-6 text-sky-600')}
          จัดการบริษัท
        </h2>
        <button
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 text-sm font-bold transition-colors"
          onClick={() => setShowCreateModal(true)}
        >
          + เพิ่มบริษัทใหม่
        </button>
      </div>

      {/* Filters */}
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-fadeInUp flex flex-col sm:flex-row gap-3" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {renderIcon('Search', 'w-4 h-4')}
          </span>
          <input
            type="text"
            placeholder="ค้นหาชื่อบริษัท, อุตสาหกรรม..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white transition-shadow"
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
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 text-sm font-semibold transition-colors w-full sm:w-auto"
        >
          ล้างตัวกรอง
        </button>
      </div>

      {/* Companies Table */}
      {/* Companies Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeInUp" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-sky-500 mb-2"></div>
              <p className="text-sm font-medium">กำลังโหลดรายงาน...</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4 w-[280px]">บริษัท</th>
                  <th className="px-5 py-4 w-[160px]">อุตสาหกรรม</th>
                  <th className="px-5 py-4 w-[120px]">HR</th>
                  <th className="px-5 py-4 w-[100px]">สถานะ</th>
                  <th className="px-5 py-4 w-[120px]">วันที่สร้าง</th>
                  <th className="px-5 py-4 w-[120px] text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {companies.length > 0 ? (
                  companies.map((company, index) => (
                    <tr key={company.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* Company logo → fallback initial */}
                          {company.logo_url ? (
                            <img
                              src={`${API_BASE_URL}${company.logo_url}`}
                              alt={company.name}
                              className="h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-lg" style={{ display: company.logo_url ? 'none' : 'flex' }}>
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 max-w-[240px]">
                            <div className="font-bold text-slate-900 truncate" title={company.name}>{company.name}</div>
                            {company.location && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 truncate" title={company.location}>
                                {renderIcon('MapPin', 'w-3.5 h-3.5 shrink-0')} {company.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                          {company.industry}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-slate-700">{company.active_hr_count || 0} คนใช้งาน</span>
                          <span className="text-xs font-medium text-slate-400">/ {company.hr_count || 0} ทั้งหมด</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${company.is_active ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                          {company.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500">
                        {formatDate(company.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-200 bg-white"
                            onClick={() => handleManageHR(company)}
                            title="จัดการ HR"
                          >
                            {renderIcon('Users', 'w-4 h-4')}
                          </button>
                          <button
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200 bg-white"
                            onClick={() => navigate(`/hr/dashboard?company_id=${company.id}`)}
                            title="ดู Dashboard"
                          >
                            {renderIcon('Dashboard', 'w-4 h-4')}
                          </button>
                          <button
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors border border-transparent hover:border-sky-200 bg-white"
                            onClick={() => handleEditCompany(company.id)}
                            title="แก้ไข"
                          >
                            {renderIcon('Edit', 'w-4 h-4')}
                          </button>
                          <button
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 bg-white"
                            onClick={() => handleDeleteCompany(company.id, company.name)}
                            title="ลบ"
                          >
                            {renderIcon('Trash', 'w-4 h-4')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center border-t border-slate-50">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        {renderIcon('Building2', 'w-10 h-10 mb-2 opacity-50 text-slate-300')}
                        <p className="text-sm font-medium text-slate-500">
                          {searchTerm || industryFilter || statusFilter
                            ? 'ไม่พบบริษัทที่ตรงกับเงื่อนไขการค้นหา'
                            : 'ยังไม่มีข้อมูลบริษัทในระบบ'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination inside the table card */}
        {!loading && companies.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => {
                const newPage = currentPage - 1;
                setCurrentPage(newPage);
                loadCompanies(newPage, searchTerm, industryFilter, statusFilter);
              }}
            >
              ← ก่อนหน้า
            </button>

            <span className="text-xs font-semibold text-slate-500">หน้า {currentPage}</span>

            <button
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
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
      </div>

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

  // Thai phone formatter
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    let formatted = raw;
    if (raw.length <= 2) { formatted = raw; }
    else if (raw.startsWith('02')) {
      if (raw.length <= 5) formatted = raw.slice(0, 2) + '-' + raw.slice(2);
      else formatted = raw.slice(0, 2) + '-' + raw.slice(2, 5) + '-' + raw.slice(5);
    } else {
      if (raw.length <= 6) formatted = raw.slice(0, 3) + '-' + raw.slice(3);
      else formatted = raw.slice(0, 3) + '-' + raw.slice(3, 6) + '-' + raw.slice(6);
    }
    setFormData(prev => ({ ...prev, contact_phone: formatted }));
    if (error) setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-900 text-lg">เพิ่มบริษัทใหม่</h3>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-bold text-slate-700">ชื่อบริษัท *</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow" placeholder="ชื่อบริษัท" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="industry" className="text-sm font-bold text-slate-700">อุตสาหกรรม *</label>
                <input type="text" id="industry" name="industry" value={formData.industry} onChange={handleChange} required disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow" placeholder="เช่น Technology, Software Development..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-bold text-slate-700">รายละเอียดบริษัท</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow min-h-[100px]" placeholder="รายละเอียดเกี่ยวกับบริษัท..." rows="3" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="location" className="text-sm font-bold text-slate-700">ที่ตั้ง</label>
                <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow" placeholder="กรุงเทพมหานคร" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="website" className="text-sm font-bold text-slate-700">เว็บไซต์</label>
                <input type="url" id="website" name="website" value={formData.website} onChange={handleChange} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow" placeholder="https://example.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="contact_email" className="text-sm font-bold text-slate-700">อีเมลติดต่อ</label>
                <input type="email" id="contact_email" name="contact_email" value={formData.contact_email} onChange={handleChange} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow" placeholder="contact@example.com" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact_phone" className="text-sm font-bold text-slate-700">เบอร์โทรติดต่อ</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <input type="tel" id="contact_phone" name="contact_phone" value={formData.contact_phone} onChange={handlePhoneChange} disabled={loading} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow" placeholder="064-691-1144 หรือ 02-959-6347" maxLength={12} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
              <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50" disabled={loading}>
                ยกเลิก
              </button>
              <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white px-4 py-2 text-sm font-bold transition-colors" disabled={loading}>
                {loading ? 'กำลังสร้าง...' : 'สร้างบริษัท'}
              </button>
            </div>
          </form>
        </div>
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

  // Thai phone formatter
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    let formatted = raw;
    if (raw.length <= 2) { formatted = raw; }
    else if (raw.startsWith('02')) {
      if (raw.length <= 5) formatted = raw.slice(0, 2) + '-' + raw.slice(2);
      else formatted = raw.slice(0, 2) + '-' + raw.slice(2, 5) + '-' + raw.slice(5);
    } else {
      if (raw.length <= 6) formatted = raw.slice(0, 3) + '-' + raw.slice(3);
      else formatted = raw.slice(0, 3) + '-' + raw.slice(3, 6) + '-' + raw.slice(6);
    }
    setFormData(prev => ({ ...prev, contact_phone: formatted }));
    if (error) setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-900 text-lg">แก้ไขข้อมูลบริษัท: {company.name}</h3>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-bold text-slate-700">ชื่อบริษัท *</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="industry" className="text-sm font-bold text-slate-700">อุตสาหกรรม *</label>
                <input type="text" id="industry" name="industry" value={formData.industry} onChange={handleChange} required disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow" placeholder="เช่น Technology, Software Development..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-bold text-slate-700">รายละเอียดบริษัท</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow min-h-[100px]" rows="3" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="location" className="text-sm font-bold text-slate-700">ที่ตั้ง</label>
                <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="website" className="text-sm font-bold text-slate-700">เว็บไซต์</label>
                <input type="url" id="website" name="website" value={formData.website} onChange={handleChange} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="contact_email" className="text-sm font-bold text-slate-700">อีเมลติดต่อ</label>
                <input type="email" id="contact_email" name="contact_email" value={formData.contact_email} onChange={handleChange} disabled={loading} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact_phone" className="text-sm font-bold text-slate-700">เบอร์โทรติดต่อ</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <input type="tel" id="contact_phone" name="contact_phone" value={formData.contact_phone} onChange={handlePhoneChange} disabled={loading} className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow" placeholder="064-691-1144 หรือ 02-959-6347" maxLength={12} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 mt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none py-2">
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} disabled={loading} className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 accent-sky-600" />
                <span className="text-sm font-bold text-slate-700">เปิดใช้งานบริษัท</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50" disabled={loading}>
                ยกเลิก
              </button>
              <button type="submit" className="inline-flex items-center justify-center rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white px-4 py-2 text-sm font-bold transition-colors" disabled={loading}>
                {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>
          </form>
        </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-slate-900 text-lg">จัดการ HR: {company.name}</h3>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" onClick={onClose}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-sky-500 mb-2"></div>
              <p className="text-sm font-medium">กำลังโหลดข้อมูล HR...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current HR Users */}
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">HR ปัจจุบัน ({hrUsers.length} คน)</h4>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 h-[400px] overflow-y-auto">
                  {hrUsers.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {hrUsers.map((hr) => (
                        <div key={hr.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* HR avatar: real photo → fallback initial */}
                            {hr.profile_image ? (
                              <img src={`${API_BASE_URL}${hr.profile_image}`} alt={hr.full_name} className="shrink-0 h-10 w-10 rounded-full object-cover border border-slate-200" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                            ) : null}
                            <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg" style={{ display: hr.profile_image ? 'none' : 'flex' }}>
                              {hr.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{hr.full_name}</div>
                              <div className="text-xs text-slate-500 truncate">@{hr.username} · {hr.email}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${hr.is_active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                  {hr.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  เข้าระบบ: {formatDate(hr.last_login)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            className="shrink-0 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                            onClick={() => handleRemoveHR(hr.id, hr.username)}
                            title="ลบ HR"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                      <svg className="w-12 h-12 mb-2 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                      <p className="text-sm font-medium text-slate-500 mt-2">ยังไม่มี HR ในบริษัทนี้</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Available HR Users */}
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">เพิ่ม HR ใหม่ ({unassignedHRUsers.length} คน)</h4>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 h-[400px] flex flex-col overflow-hidden">
                  {unassignedHRUsers.length > 0 ? (
                    <>
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
                        {unassignedHRUsers.map((hr) => (
                          <label key={hr.id} className="cursor-pointer flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 ml-1 accent-sky-600"
                              checked={selectedHRIds.includes(hr.id)}
                              onChange={() => handleHRSelection(hr.id)}
                            />
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* HR avatar: real photo → fallback initial */}
                              {hr.profile_image ? (
                                <img src={`${API_BASE_URL}${hr.profile_image}`} alt={hr.full_name} className="shrink-0 h-10 w-10 rounded-full object-cover border border-slate-200" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                              ) : null}
                              <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-lg" style={{ display: hr.profile_image ? 'none' : 'flex' }}>
                                {hr.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">{hr.full_name}</div>
                                <div className="text-xs text-slate-500 truncate">@{hr.username} · {hr.email}</div>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>

                      {selectedHRIds.length > 0 && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                          <button
                            className="w-full inline-flex items-center justify-center rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white px-4 py-2.5 text-sm font-bold transition-colors"
                            onClick={handleAssignHR}
                            disabled={isAssigning}
                          >
                            {isAssigning ? 'กำลังเพิ่ม...' : `+ เพิ่ม HR ${selectedHRIds.length} คนเข้าบริษัท`}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                      <svg className="w-12 h-12 mb-2 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                      <p className="text-sm font-medium text-slate-500 mt-2">ไม่มีบัญชี HR ที่ว่างให้เพิ่ม</p>
                      <p className="text-xs mt-1">HR ทุกคนถูกผูกกับบริษัทแล้ว</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4 bg-white rounded-b-2xl flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-5 py-2.5 text-sm font-semibold transition-colors shrink-0"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyManagement;