import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import jobService from '../../services/jobService';
import '../../styles/student-dashboard.css';
import '../../styles/my-applications.css';

const STATUS_MAP = {
    pending: { label: 'รอพิจารณา', className: 'pending' },
    reviewing: { label: 'กำลังรีวิว', className: 'reviewing' },
    accepted: { label: 'ผ่านการคัดเลือก', className: 'accepted' },
    rejected: { label: 'ไม่ผ่าน', className: 'rejected' },
    interview: { label: 'นัดสัมภาษณ์', className: 'accepted' },
};

const MyApplications = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const loadApplications = useCallback(async () => {
        try {
            setLoading(true);
            const result = await jobService.getMyApplications();
            if (result.success) {
                setApplications(Array.isArray(result.data) ? result.data : []);
            }
        } catch (error) {
            console.error('Error loading applications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        loadApplications();
    }, [isAuthenticated, navigate, loadApplications]);

    const filteredApps = filter === 'all'
        ? applications
        : applications.filter(app => app.status === filter);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return '—';
        }
    };

    const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="my-applications-page">
                <div className="dashboard-loading">
                    <div className="loading-spinner-ring" />
                    <p>กำลังโหลดรายการสมัครงาน...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="my-applications-page">
            <div className="applications-container">
                {/* Header */}
                <div className="applications-header">
                    <button className="gap-back-btn" onClick={() => navigate('/student/dashboard')}>
                        ←
                    </button>
                    <h1>ใบสมัครของฉัน</h1>
                    <span className="applications-count-badge">{applications.length} รายการ</span>
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        ทั้งหมด ({applications.length})
                    </button>
                    <button
                        className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        รอพิจารณา ({statusCounts.pending || 0})
                    </button>
                    <button
                        className={`filter-tab ${filter === 'accepted' ? 'active' : ''}`}
                        onClick={() => setFilter('accepted')}
                    >
                        ผ่าน ({statusCounts.accepted || 0})
                    </button>
                    <button
                        className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
                        onClick={() => setFilter('rejected')}
                    >
                        ไม่ผ่าน ({statusCounts.rejected || 0})
                    </button>
                </div>

                {/* Application List */}
                {filteredApps.length > 0 ? (
                    filteredApps.map((app, index) => {
                        const status = STATUS_MAP[app.status] || STATUS_MAP.pending;
                        return (
                            <div
                                className="application-card"
                                key={app.id || app._id || index}
                                style={{ animationDelay: `${index * 0.08}s` }}
                            >
                                <div className={`app-status-dot ${status.className}`} />

                                <div className="application-info">
                                    <h3>{app.job_title || 'ตำแหน่งงาน'}</h3>
                                    <div className="application-company">{app.company_name || 'บริษัท'}</div>
                                    <div className="application-meta">
                                        <span className="meta-item">
                                            📅 {formatDate(app.submitted_at)}
                                        </span>
                                        {app.ai_feedback && (
                                            <span className="meta-item">
                                                💬 {app.ai_feedback.substring(0, 50)}...
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="application-right">
                                    {app.ai_score !== undefined && (
                                        <div className="app-ai-score">
                                            {app.ai_score}% <span>AI Score</span>
                                        </div>
                                    )}
                                    <span className={`app-status-badge ${status.className}`}>
                                        {status.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="dashboard-section">
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <h3>{filter === 'all' ? 'ยังไม่มีการสมัครงาน' : 'ไม่มีรายการในหมวดนี้'}</h3>
                            <p>
                                {filter === 'all'
                                    ? 'เริ่มสมัครงานได้จากหน้า Dashboard เพื่อเริ่มต้นเส้นทางอาชีพของคุณ'
                                    : 'ลองเลือกดูหมวดอื่น'}
                            </p>
                            {filter === 'all' && (
                                <button
                                    className="btn-student primary"
                                    style={{ marginTop: '16px' }}
                                    onClick={() => navigate('/student/dashboard')}
                                >
                                    ไป Dashboard
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyApplications;
