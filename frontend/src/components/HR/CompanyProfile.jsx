import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import companyService from '../../services/companyService';
import '../../styles/company-profile.css';

const CompanyProfile = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated() || !['HR', 'Admin'].includes(user?.user_type)) {
            navigate('/login');
            return;
        }
        loadCompany();
    }, [isAuthenticated, user, navigate]);

    const loadCompany = async () => {
        setLoading(true);
        const result = await companyService.getMyCompanyInfo();
        if (result.success && result.data?.company) {
            setCompany(result.data.company);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="company-profile-page">
                <div className="cp-container">
                    <div className="cp-loading">
                        <div className="loading-ring" />
                        <p>กำลังโหลดข้อมูลบริษัท...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="company-profile-page">
                <div className="cp-container">
                    <div className="cp-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><path d="M12 12v4" /><path d="M12 12h.01" /></svg>
                        <h3>ยังไม่มีข้อมูลบริษัท</h3>
                        <p>กรุณารอให้ Admin กำหนดบริษัทให้คุณ</p>
                        <button className="btn-back-cp" onClick={() => navigate('/hr/dashboard')}>กลับ Dashboard</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="company-profile-page">
            <div className="cp-container">
                {/* Header */}
                <div className="cp-header">
                    <button className="btn-back-cp" onClick={() => navigate('/hr/dashboard')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                        กลับ
                    </button>
                    <h1>ข้อมูลบริษัท</h1>
                </div>

                {/* Company Card */}
                <div className="cp-card-main">
                    <div className="cp-logo">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
                    </div>
                    <div className="cp-main-info">
                        <h2>{company.name}</h2>
                        {company.industry && (
                            <span className="cp-industry-badge">{company.industry}</span>
                        )}
                        {company.is_active !== undefined && (
                            <span className={`cp-status-badge ${company.is_active ? 'active' : 'inactive'}`}>
                                {company.is_active ? 'Active' : 'Inactive'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="cp-details-grid">
                    <div className="cp-detail-card">
                        <h3>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            ที่อยู่
                        </h3>
                        <p>{company.location || company.address || 'ไม่ได้ระบุ'}</p>
                    </div>

                    <div className="cp-detail-card">
                        <h3>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                            ติดต่อ
                        </h3>
                        <p>{company.contact_phone || company.phone || 'ไม่ได้ระบุ'}</p>
                    </div>

                    <div className="cp-detail-card">
                        <h3>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>
                            อีเมล
                        </h3>
                        <p>{company.contact_email || company.email || 'ไม่ได้ระบุ'}</p>
                    </div>

                    <div className="cp-detail-card">
                        <h3>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                            เว็บไซต์
                        </h3>
                        {company.website ? (
                            <a href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a>
                        ) : <p>ไม่ได้ระบุ</p>}
                    </div>
                </div>

                {/* Description */}
                {company.description && (
                    <div className="cp-description">
                        <h3>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
                            รายละเอียดบริษัท
                        </h3>
                        <p>{company.description}</p>
                    </div>
                )}

                <div className="cp-footer-note">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    หากต้องการแก้ไขข้อมูลบริษัท กรุณาติดต่อ Admin
                </div>
            </div>
        </div>
    );
};

export default CompanyProfile;
