import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config';
import jobService from '../../services/jobService';
import '../../styles/applicant-search.css';

const normalizeScore = (s) => {
    if (s == null) return 0;
    return s <= 1 ? Math.round(s * 100) : Math.round(s);
};

const ApplicantSearch = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('ai_score');
    const [expandedId, setExpandedId] = useState(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated() || !['HR', 'Admin'].includes(user?.user_type)) {
            navigate('/login');
        }
    }, [isAuthenticated, user, navigate]);

    const loadApplicants = useCallback(async (params = {}) => {
        setLoading(true);
        const result = await jobService.getAllApplicants({
            search: params.search || search,
            status: params.status !== undefined ? params.status : statusFilter,
            sortBy: params.sortBy || sortBy,
        });
        if (result.success) setApplicants(result.data.applicants || []);
        setLoading(false);
    }, [search, statusFilter, sortBy]);

    useEffect(() => {
        loadApplicants();
    }, [statusFilter, sortBy]);

    const handleSearch = (value) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            loadApplicants({ search: value });
        }, 400);
    };

    const getZone = (score) => {
        const pct = normalizeScore(score);
        return pct >= 80 ? 'high' : pct >= 50 ? 'medium' : 'low';
    };

    const statusBadge = (status) => {
        const map = {
            pending: { label: 'รอพิจารณา', cls: 'pending' },
            accepted: { label: 'รับแล้ว', cls: 'accepted' },
            rejected: { label: 'ปฏิเสธ', cls: 'rejected' },
        };
        const s = map[status] || { label: status, cls: 'pending' };
        return <span className={`search-badge ${s.cls}`}>{s.label}</span>;
    };

    const formatDate = (d) => {
        if (!d) return '-';
        return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="applicant-search-page">
            <div className="search-container">
                {/* Header */}
                <div className="search-header">
                    <div className="search-header-left">
                        <button className="btn-back-search" onClick={() => navigate('/hr/dashboard')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                            กลับ
                        </button>
                        <div className="search-title">
                            <h1>ค้นหาผู้สมัคร</h1>
                            <p>ค้นหาและกรองผู้สมัครทุกตำแหน่ง</p>
                        </div>
                    </div>
                </div>

                {/* Search + Filters */}
                <div className="search-controls">
                    <div className="search-input-wrap">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    <div className="search-filters">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">ทุกสถานะ</option>
                            <option value="pending">รอพิจารณา</option>
                            <option value="accepted">รับแล้ว</option>
                            <option value="rejected">ปฏิเสธ</option>
                        </select>

                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="ai_score">AI Score สูงสุด</option>
                            <option value="name">ชื่อ A-Z</option>
                            <option value="date">ล่าสุด</option>
                        </select>
                    </div>
                </div>

                {/* Results count */}
                <div className="search-result-count">
                    พบ <strong>{applicants.length}</strong> ผู้สมัคร
                </div>

                {/* Results */}
                {loading ? (
                    <div className="search-loading">
                        <div className="loading-ring" />
                        <p>กำลังค้นหา...</p>
                    </div>
                ) : applicants.length === 0 ? (
                    <div className="search-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                        <h3>ไม่พบผู้สมัคร</h3>
                        <p>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                    </div>
                ) : (
                    <div className="search-results-list">
                        {applicants.map((app, idx) => {
                            const pct = normalizeScore(app.ai_score);
                            const zone = getZone(app.ai_score);
                            const isExpanded = expandedId === (app.id || app._id);
                            const breakdown = app.matching_breakdown || {};

                            return (
                                <div
                                    key={app.id || app._id || idx}
                                    className={`search-result-card ${isExpanded ? 'expanded' : ''}`}
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    <div className="search-card-row">
                                        {/* Score */}
                                        <div className={`search-score ${zone}`}>{pct}%</div>

                                        {/* Info */}
                                        <div className="search-card-info">
                                            <div className="search-card-name-row">
                                                <span className="search-card-name">{app.student_name || 'ไม่ระบุชื่อ'}</span>
                                                {statusBadge(app.status)}
                                            </div>
                                            <div className="search-card-email">{app.student_email}</div>
                                            <div className="search-card-meta">
                                                <span>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
                                                    {app.job_title || '-'}
                                                </span>
                                                <span>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>
                                                    {formatDate(app.submitted_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="search-card-actions">
                                            <button
                                                className="btn-expand-search"
                                                onClick={() => setExpandedId(isExpanded ? null : (app.id || app._id))}
                                            >
                                                {isExpanded ? '▲ ซ่อน' : '▼ ดูเพิ่มเติม'}
                                            </button>
                                            <button
                                                className="btn-goto-job"
                                                onClick={() => navigate(`/hr/jobs/${app.job_id}/applicants`)}
                                            >
                                                ไปที่ตำแหน่ง →
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded */}
                                    {isExpanded && (
                                        <div className="search-detail-section">
                                            {/* Breakdown Bars */}
                                            {Object.keys(breakdown).length > 0 && (
                                                <div className="search-breakdown">
                                                    <h4>AI Score Breakdown</h4>
                                                    {Object.entries(breakdown).map(([key, val]) => {
                                                        const bpct = normalizeScore(val);
                                                        const bzone = bpct >= 80 ? 'high' : bpct >= 50 ? 'medium' : 'low';
                                                        return (
                                                            <div key={key} className="search-bar-row">
                                                                <span className="search-bar-label">{key}</span>
                                                                <div className="search-bar-track">
                                                                    <div className={`search-bar-fill ${bzone}`} style={{ width: `${bpct}%` }} />
                                                                </div>
                                                                <span className={`search-bar-pct ${bzone}`}>{bpct}%</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Quick Info */}
                                            <div className="search-quick-info">
                                                {app.ai_feedback && (
                                                    <div className="search-feedback">
                                                        <strong>AI Recommendation:</strong> {app.ai_feedback}
                                                    </div>
                                                )}
                                                {app.resume_file_url && (
                                                    <a
                                                        href={`${API_BASE_URL}${app.resume_file_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-view-resume"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                                                        ดู Resume PDF
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicantSearch;
