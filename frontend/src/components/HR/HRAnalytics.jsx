import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import jobService from '../../services/jobService';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import '../../styles/hr-analytics.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const HRAnalytics = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated() || !['HR', 'Admin'].includes(user?.user_type)) {
            navigate('/login');
            return;
        }
        loadAnalytics();
    }, [isAuthenticated, user, navigate]);

    const loadAnalytics = async () => {
        setLoading(true);
        const result = await jobService.getDetailedAnalytics();
        if (result.success) setAnalytics(result.data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="analytics-page">
                <div className="analytics-container">
                    <div className="analytics-loading">
                        <div className="loading-ring" />
                        <p>กำลังโหลดข้อมูลสถิติ...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="analytics-page">
                <div className="analytics-container">
                    <div className="analytics-empty">
                        <p>ไม่สามารถโหลดข้อมูลได้</p>
                    </div>
                </div>
            </div>
        );
    }

    const { summary, per_job } = analytics;

    // --- Chart Data ---
    const statusDoughnutData = {
        labels: ['รับแล้ว', 'ปฏิเสธ', 'รอพิจารณา'],
        datasets: [{
            data: [summary.total_accepted, summary.total_rejected, summary.total_pending],
            backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(239,68,68,0.8)', 'rgba(251,191,36,0.8)'],
            borderColor: ['#22C55E', '#EF4444', '#FBBF24'],
            borderWidth: 2,
            hoverOffset: 6
        }]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#94A3B8', padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } }
            },
            tooltip: {
                backgroundColor: '#1E293B',
                titleColor: '#F1F5F9',
                bodyColor: '#CBD5E1',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8
            }
        }
    };

    const jobLabels = per_job.map(j => j.title.length > 18 ? j.title.slice(0, 18) + '…' : j.title);

    const applicantsBarData = {
        labels: jobLabels,
        datasets: [
            { label: 'รับ', data: per_job.map(j => j.accepted), backgroundColor: 'rgba(34,197,94,0.7)', borderRadius: 4, barPercentage: 0.6 },
            { label: 'ปฏิเสธ', data: per_job.map(j => j.rejected), backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 4, barPercentage: 0.6 },
            { label: 'รอ', data: per_job.map(j => j.pending), backgroundColor: 'rgba(251,191,36,0.7)', borderRadius: 4, barPercentage: 0.6 }
        ]
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: { color: '#94A3B8', usePointStyle: true, pointStyleWidth: 10, padding: 16, font: { size: 11 } }
            },
            tooltip: {
                backgroundColor: '#1E293B',
                titleColor: '#F1F5F9',
                bodyColor: '#CBD5E1',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                ticks: { color: '#64748B', font: { size: 11 } }
            },
            y: {
                stacked: true,
                beginAtZero: true,
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#64748B', stepSize: 1, font: { size: 11 } }
            }
        }
    };

    const aiScoreBarData = {
        labels: jobLabels,
        datasets: [{
            label: 'AI Score เฉลี่ย (%)',
            data: per_job.map(j => j.avg_ai_score),
            backgroundColor: per_job.map(j =>
                j.avg_ai_score >= 70 ? 'rgba(34,197,94,0.7)' :
                    j.avg_ai_score >= 40 ? 'rgba(251,191,36,0.7)' :
                        'rgba(239,68,68,0.7)'
            ),
            borderRadius: 4,
            barPercentage: 0.5
        }]
    };

    const aiScoreOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1E293B',
                titleColor: '#F1F5F9',
                bodyColor: '#CBD5E1',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                callbacks: { label: (ctx) => `${ctx.raw}%` }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#64748B', callback: v => v + '%', font: { size: 11 } }
            },
            y: {
                grid: { display: false },
                ticks: { color: '#CBD5E1', font: { size: 11 } }
            }
        }
    };

    return (
        <div className="analytics-page">
            <div className="analytics-container">
                {/* Header */}
                <div className="analytics-header">
                    <div className="analytics-header-left">
                        <button className="btn-back-analytics" onClick={() => navigate('/hr/dashboard')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                            กลับ
                        </button>
                        <div className="analytics-title">
                            <h1>สถิติและการวิเคราะห์</h1>
                            <p>ภาพรวมผลการสรรหาทั้งหมด</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="analytics-summary">
                    <div className="summary-card">
                        <div className="summary-icon jobs">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
                        </div>
                        <div className="summary-info">
                            <span className="summary-number">{summary.total_jobs}</span>
                            <span className="summary-label">ตำแหน่งงานทั้งหมด</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon apps">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                        </div>
                        <div className="summary-info">
                            <span className="summary-number">{summary.total_applications}</span>
                            <span className="summary-label">ใบสมัครทั้งหมด</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon rate">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                        </div>
                        <div className="summary-info">
                            <span className="summary-number">{summary.acceptance_rate}%</span>
                            <span className="summary-label">อัตราการรับ</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon ai">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 12l4-4" /><circle cx="12" cy="12" r="2" /></svg>
                        </div>
                        <div className="summary-info">
                            <span className="summary-number">{summary.avg_ai_score}%</span>
                            <span className="summary-label">AI Score เฉลี่ย</span>
                        </div>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="analytics-status-row">
                    <div className="status-block accepted">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                        <span className="status-count">{summary.total_accepted}</span>
                        <span className="status-text">รับแล้ว</span>
                    </div>
                    <div className="status-block rejected">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6" /><path d="M9 9l6 6" /></svg>
                        <span className="status-count">{summary.total_rejected}</span>
                        <span className="status-text">ปฏิเสธ</span>
                    </div>
                    <div className="status-block pending">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                        <span className="status-count">{summary.total_pending}</span>
                        <span className="status-text">รอพิจารณา</span>
                    </div>
                </div>

                {/* Charts Section */}
                {per_job.length > 0 && (
                    <div className="analytics-charts-section">
                        <div className="analytics-charts-row">
                            {/* Doughnut */}
                            <div className="chart-card chart-card-sm">
                                <h3>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                                    สัดส่วนสถานะ
                                </h3>
                                <div className="chart-wrap chart-doughnut">
                                    <Doughnut data={statusDoughnutData} options={doughnutOptions} />
                                </div>
                            </div>
                            {/* Stacked Bar */}
                            <div className="chart-card chart-card-lg">
                                <h3>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
                                    ผู้สมัครแต่ละตำแหน่ง
                                </h3>
                                <div className="chart-wrap chart-bar">
                                    <Bar data={applicantsBarData} options={barOptions} />
                                </div>
                            </div>
                        </div>

                        {/* AI Score Horizontal Bar */}
                        <div className="chart-card chart-card-full">
                            <h3>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 12l4-4" /><circle cx="12" cy="12" r="2" /></svg>
                                AI Score เฉลี่ยต่อตำแหน่ง
                            </h3>
                            <div className="chart-wrap chart-horizontal" style={{ height: Math.max(per_job.length * 48, 120) }}>
                                <Bar data={aiScoreBarData} options={aiScoreOptions} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Per-Job Table */}
                <div className="analytics-table-section">
                    <h2>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></svg>
                        รายละเอียดแต่ละตำแหน่ง
                    </h2>

                    {per_job.length === 0 ? (
                        <div className="analytics-empty"><p>ยังไม่มีตำแหน่งงาน</p></div>
                    ) : (
                        <div className="analytics-table-wrap">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>ตำแหน่ง</th>
                                        <th>สถานะ</th>
                                        <th>ผู้สมัคร</th>
                                        <th>รับ</th>
                                        <th>ปฏิเสธ</th>
                                        <th>รอ</th>
                                        <th>AI Score เฉลี่ย</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {per_job.map((job) => (
                                        <tr key={job.job_id}>
                                            <td className="td-title">{job.title}</td>
                                            <td>
                                                <span className={`table-badge ${job.is_active ? 'active' : 'inactive'}`}>
                                                    {job.is_active ? 'เปิดรับ' : 'ปิดแล้ว'}
                                                </span>
                                            </td>
                                            <td className="td-num">{job.total}</td>
                                            <td className="td-num td-green">{job.accepted}</td>
                                            <td className="td-num td-red">{job.rejected}</td>
                                            <td className="td-num td-yellow">{job.pending}</td>
                                            <td>
                                                <div className="table-score-bar">
                                                    <div className="table-score-fill" style={{ width: `${Math.min(job.avg_ai_score, 100)}%` }} />
                                                    <span>{job.avg_ai_score}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <button className="btn-view-applicants" onClick={() => navigate(`/hr/jobs/${job.job_id}/applicants`)}>
                                                    ดูผู้สมัคร
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HRAnalytics;
