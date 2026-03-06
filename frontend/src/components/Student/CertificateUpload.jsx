import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/certificateUpload.css';

const API_BASE_URL = 'http://localhost:8000';

// Inline SVG Icons (no emojis)
const UploadIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const CertIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
);

const FileIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const ImageIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
);

const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
);

const CheckCircle = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const AlertCircle = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const ListIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);

const CertificateUpload = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [certificates, setCertificates] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchCertificates();
    }, [user, navigate]);

    const getAuthHeaders = () => {
        const token = sessionStorage.getItem('auth_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/certificates/my/list`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                setCertificates(data.certificates || []);
            }
        } catch (err) {
            console.error('Failed to fetch certificates:', err);
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async (file) => {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setMessage({ type: 'error', text: 'รองรับเฉพาะ PDF, JPG, PNG, WebP' });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'ไฟล์มีขนาดใหญ่เกิน 10MB' });
            return;
        }

        try {
            setUploading(true);
            setMessage(null);
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${API_BASE_URL}/api/certificates/upload`, {
                method: 'POST', headers: getAuthHeaders(), body: formData
            });

            if (res.ok) {
                setMessage({ type: 'success', text: `อัปโหลด "${file.name}" สำเร็จ` });
                fetchCertificates();
            } else {
                const err = await res.json();
                setMessage({ type: 'error', text: err.detail || 'อัปโหลดไม่สำเร็จ' });
            }
        } catch {
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
        } finally {
            setUploading(false);
        }
    };

    const deleteCertificate = async (id, name) => {
        if (!window.confirm(`ต้องการลบ "${name}" หรือไม่?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/certificates/${id}`, {
                method: 'DELETE', headers: getAuthHeaders()
            });
            if (res.ok) {
                setMessage({ type: 'success', text: `ลบ "${name}" สำเร็จ` });
                fetchCertificates();
            } else {
                setMessage({ type: 'error', text: 'ลบไม่สำเร็จ' });
            }
        } catch {
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' });
        }
    };

    const handleDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); };
    const handleDrop = (e) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files?.length) uploadFile(e.dataTransfer.files[0]);
    };
    const handleFileInput = (e) => {
        if (e.target.files?.length) uploadFile(e.target.files[0]);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    if (!user) return null;

    return (
        <div className="cert-upload-page">
            <div className="cert-upload-container">

                {/* Header */}
                <div className="cert-header">
                    <div className="cert-header-icon"><CertIcon /></div>
                    <h1>Certificates</h1>
                    <p>อัปโหลดใบรับรอง เพื่อเพิ่มคะแนน AI Matching Score</p>
                </div>

                {/* Messages */}
                {message && (
                    <div className={`cert-message ${message.type}`}>
                        {message.type === 'success' ? <CheckCircle /> : <AlertCircle />}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Uploading */}
                {uploading && (
                    <div className="cert-uploading">
                        <div className="cert-spinner" />
                        <span>กำลังอัปโหลด...</span>
                    </div>
                )}

                {/* Upload Zone */}
                <div
                    className={`cert-upload-zone ${isDragging ? 'dragging' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('cert-file-input').click()}
                >
                    <input
                        id="cert-file-input"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileInput}
                        style={{ display: 'none' }}
                    />
                    <div className="upload-icon-wrapper">
                        <UploadIcon />
                    </div>
                    <h3>Drag & Drop หรือคลิกเพื่ออัปโหลด</h3>
                    <p>PDF, JPG, PNG, WebP — สูงสุด 10MB ต่อไฟล์</p>
                </div>

                {/* Certificate List */}
                <div className="cert-list-section">
                    <h2 className="cert-list-title">
                        <ListIcon />
                        <span>ใบรับรองของฉัน ({certificates.length})</span>
                    </h2>

                    {loading ? (
                        <div className="cert-empty">
                            <div className="cert-spinner cert-spinner-lg" />
                            <p>กำลังโหลด...</p>
                        </div>
                    ) : certificates.length === 0 ? (
                        <div className="cert-empty">
                            <div className="cert-empty-icon"><CertIcon /></div>
                            <h3>ยังไม่มีใบรับรอง</h3>
                            <p>อัปโหลดใบรับรอง ใบประกาศ หรือเกียรติบัตร</p>
                        </div>
                    ) : (
                        <div className="cert-grid">
                            {certificates.map((cert, i) => (
                                <div key={cert.id} className="cert-card" style={{ animationDelay: `${i * 0.08}s` }}>
                                    <div className="cert-card-header">
                                        <div className={`cert-card-icon ${cert.file_type === 'pdf' ? 'pdf' : 'img'}`}>
                                            {cert.file_type === 'pdf' ? <FileIcon /> : <ImageIcon />}
                                        </div>
                                        <div className="cert-card-info">
                                            <h4 title={cert.certificate_name || cert.file_name}>
                                                {cert.certificate_name || cert.file_name}
                                            </h4>
                                            <p>{formatFileSize(cert.file_size)} · {formatDate(cert.uploaded_at)}</p>
                                        </div>
                                    </div>
                                    <div className="cert-card-actions">
                                        <button
                                            className="cert-btn-delete"
                                            onClick={() => deleteCertificate(cert.id, cert.certificate_name || cert.file_name)}
                                        >
                                            <TrashIcon />
                                            <span>ลบ</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CertificateUpload;
