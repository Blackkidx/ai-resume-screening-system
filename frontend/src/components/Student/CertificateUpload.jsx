// frontend/src/components/Student/CertificateUpload.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://172.18.148.97:8000';

/* ── Modern 2026 Lucide SVGs ── */
const Icons = {
    Award: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
    ),
    UploadCloud: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" /><path d="m16 16-4-4-4 4" />
        </svg>
    ),
    CheckCircle: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
        </svg>
    ),
    XCircle: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
        </svg>
    ),
    FileText: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    ImageIcon: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
        </svg>
    ),
    Trash2: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
    ),
    ArrowLeft: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
        </svg>
    ),
    Refresh: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
        </svg>
    ),
    AlertTriangle: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
    ),
    Loader: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    ),
};

/* ── Glassmorphism Modal ── */
const Modal = ({ children, onClose }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
    >
        <div
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

const CertificateUpload = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [certificates, setCertificates] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Popup states
    const [successModal, setSuccessModal] = useState(null);  // { fileName }
    const [confirmModal, setConfirmModal] = useState(null);   // { id, name }
    const [deletingModal, setDeletingModal] = useState(null); // { name } — shows while deleting
    const [deleteSuccessModal, setDeleteSuccessModal] = useState(null); // { name }
    const [errorBanner, setErrorBanner] = useState(null);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchCertificates();
    }, [user, navigate]);

    const getAuthHeaders = () => {
        const token = sessionStorage.getItem('auth_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/certificates/my/list`, { headers: getAuthHeaders() });
            if (res.ok) { const data = await res.json(); setCertificates(data.certificates || []); }
        } catch (err) { console.error('Failed to fetch certificates:', err); }
        finally { setLoading(false); }
    };

    const uploadFile = async (file) => {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) { setErrorBanner('รองรับเฉพาะ PDF, JPG, PNG, WebP'); return; }
        if (file.size > 10 * 1024 * 1024) { setErrorBanner('ไฟล์มีขนาดใหญ่เกิน 10MB'); return; }

        setErrorBanner(null);
        setUploading(true);
        try {
            const formData = new FormData(); formData.append('file', file);
            const res = await fetch(`${API_BASE_URL}/api/certificates/upload`, {
                method: 'POST', headers: getAuthHeaders(), body: formData
            });
            if (res.ok) {
                setSuccessModal({ fileName: file.name });
                fetchCertificates();
            } else {
                const err = await res.json();
                setErrorBanner(err.detail || 'อัปโหลดไม่สำเร็จ');
            }
        } catch { setErrorBanner('เกิดข้อผิดพลาดในการเชื่อมต่อ'); }
        finally { setUploading(false); }
    };

    // Step 1: Show confirm modal
    const handleDeleteClick = (id, name) => {
        setConfirmModal({ id, name });
    };

    // Step 2: User confirms → show deleting modal → delete → show success
    const confirmDelete = async () => {
        const { id, name } = confirmModal;
        setConfirmModal(null);
        setDeletingModal({ name });
        try {
            const res = await fetch(`${API_BASE_URL}/api/certificates/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            setDeletingModal(null);
            if (res.ok) {
                setDeleteSuccessModal({ name });
                fetchCertificates();
            } else {
                setErrorBanner('ลบไม่สำเร็จ กรุณาลองใหม่');
            }
        } catch {
            setDeletingModal(null);
            setErrorBanner('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files?.length) uploadFile(e.dataTransfer.files[0]); };
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleFileInput = (e) => { if (e.target.files?.length) uploadFile(e.target.files[0]); };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12 overflow-hidden selection:bg-amber-200 selection:text-amber-900 relative">

            {/* ── MODALS ── */}

            {/* Upload Success Modal */}
            {successModal && (
                <Modal onClose={() => setSuccessModal(null)}>
                    <div className="p-8 text-center">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                            <div className="text-emerald-500 scale-150"><Icons.CheckCircle /></div>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">อัปโหลดสำเร็จ!</h3>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-1">
                            <span className="font-bold text-slate-700 break-all">"{successModal.fileName}"</span>
                        </p>
                        <p className="text-sm text-slate-400 mb-8">AI กำลังวิเคราะห์ใบรับรองของคุณ เพื่อเพิ่ม Match Score 🚀</p>
                        <button
                            onClick={() => setSuccessModal(null)}
                            className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 transition-colors"
                        >
                            เยี่ยม! ปิดได้เลย
                        </button>
                    </div>
                </Modal>
            )}

            {/* Delete Confirm Modal */}
            {confirmModal && (
                <Modal onClose={() => setConfirmModal(null)}>
                    <div className="p-8 text-center">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
                            <div className="text-rose-500 scale-150"><Icons.Trash2 /></div>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">ยืนยันการลบ</h3>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                            ต้องการลบ <span className="font-bold text-slate-800 break-all">"{confirmModal.name}"</span> ออกจากระบบ?<br />
                            <span className="text-xs text-slate-400">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="flex-1 rounded-2xl border border-slate-200 text-slate-700 font-bold py-3 hover:bg-slate-50 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 transition-colors"
                            >
                                ลบเลย
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Deleting Progress Modal */}
            {deletingModal && (
                <Modal onClose={() => { }}>
                    <div className="p-8 text-center">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                            <div className="text-slate-500"><Icons.Loader /></div>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">กำลังลบ...</h3>
                        <p className="text-sm font-medium text-slate-400 break-all">"{deletingModal.name}"</p>
                    </div>
                </Modal>
            )}

            {/* Delete Success Modal */}
            {deleteSuccessModal && (
                <Modal onClose={() => setDeleteSuccessModal(null)}>
                    <div className="p-8 text-center">
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-sky-100">
                            <div className="text-sky-500 scale-150"><Icons.CheckCircle /></div>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">ลบสำเร็จแล้ว</h3>
                        <p className="text-sm font-medium text-slate-500 mb-8 break-all">
                            "{deleteSuccessModal.name}" ถูกลบออกเรียบร้อยแล้ว
                        </p>
                        <button
                            onClick={() => setDeleteSuccessModal(null)}
                            className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 transition-colors"
                        >
                            ปิด
                        </button>
                    </div>
                </Modal>
            )}

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-80" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-200/20 rounded-full blur-[100px] pointer-events-none" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-xl transition-all duration-200 mb-6 cursor-pointer"
                >
                    <Icons.ArrowLeft />
                    ย้อนกลับ
                </button>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-200/60">
                    <div className="flex items-center gap-5">
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shrink-0 border border-amber-100 shadow-sm overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-transparent" />
                            <div className="relative z-10"><Icons.Award /></div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Certificates</h1>
                            <p className="text-slate-500 font-medium mt-1">อัปโหลดใบรับรองทักษะ เพื่อให้ AI คำนวณเพิ่มคะแนนความเหมาะสมของคุณ</p>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {errorBanner && (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold mb-8 shadow-sm animate-in fade-in slide-in-from-top-4">
                        <div className="mt-0.5 shrink-0 text-rose-500"><Icons.AlertTriangle /></div>
                        <span className="leading-relaxed text-rose-800">{errorBanner}</span>
                        <button onClick={() => setErrorBanner(null)} className="ml-auto opacity-50 hover:opacity-100 transition-opacity text-rose-500">
                            <Icons.XCircle />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left Column: Upload */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Drop Zone */}
                        <div
                            className={`relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden group min-h-[300px] ${isDragging ? 'border-amber-400 bg-amber-50/80 shadow-inner' : 'border-slate-300 bg-white hover:border-amber-400 hover:bg-amber-50/30 hover:shadow-lg hover:shadow-amber-100/50'
                                } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => !uploading && document.getElementById('cert-file-input').click()}
                        >
                            <input id="cert-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileInput} className="hidden" disabled={uploading} />

                            {uploading ? (
                                <div className="flex flex-col items-center gap-4 text-amber-600">
                                    <div className="relative w-16 h-16">
                                        <div className="absolute inset-0 rounded-full border-4 border-amber-100" />
                                        <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-6 h-6"><Icons.UploadCloud /></div>
                                        </div>
                                    </div>
                                    <p className="font-bold animate-pulse">กำลังอัปโหลด...</p>
                                </div>
                            ) : (
                                <>
                                    <div className={`flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300 ${isDragging ? 'bg-amber-500 text-white scale-110 shadow-lg shadow-amber-500/20' : 'bg-slate-50 text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500'}`}>
                                        <div className="scale-125"><Icons.UploadCloud /></div>
                                    </div>
                                    <div className="text-center px-6">
                                        <h3 className="font-bold text-slate-900 text-lg mb-2">ลากไฟล์มาวางตรงนี้</h3>
                                        <p className="text-slate-500 font-medium text-sm">หรือคลิกเพื่อเลือกไฟล์</p>
                                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200">
                                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">PDF, JPG, PNG, WEBP</span>
                                        </div>
                                        <p className="text-slate-400 text-xs mt-2 font-mono">Max 10MB per file</p>
                                    </div>
                                </>
                            )}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-[2px]" />
                        </div>

                        {/* Info Box */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-start gap-4">
                            <div className="text-amber-500 shrink-0 mt-1"><Icons.Award /></div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm mb-1">ทำไมต้องอัปโหลดใบรับรอง?</h4>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed text-balance">
                                    AI จะนำข้อมูลทักษะในเกียรติบัตรหรือใบประกาศไปคำนวณรวมกับทักษะในเรซูเม่ ช่วยเสริมความน่าเชื่อถือและเพิ่ม <strong>Match Score</strong> ของคุณ
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: List */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 min-h-[500px] flex flex-col">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                                <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900">
                                    <Icons.FileText />
                                    รายการใบรับรองของฉัน
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs">{certificates.length}</span>
                                </h2>
                                <button onClick={fetchCertificates} disabled={loading} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer" title="รีเฟรช">
                                    <div className={loading ? 'animate-spin' : ''}><Icons.Refresh /></div>
                                </button>
                            </div>

                            <div className="flex-1">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 text-slate-400">
                                        <div className="animate-spin text-amber-500"><Icons.Refresh /></div>
                                        <p className="font-medium animate-pulse">กำลังโหลดข้อมูล...</p>
                                    </div>
                                ) : certificates.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 text-center">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-300 border border-slate-100 shadow-inner">
                                            <div className="scale-150"><Icons.Award /></div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg mb-1">ยังไม่มีใบรับรองในระบบ</h3>
                                            <p className="text-slate-500 font-medium text-sm">อัปโหลดไฟล์แรกของคุณในช่องด้านซ้ายมือ</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {certificates.map((cert) => {
                                            const isPdf = cert.file_type === 'pdf';
                                            return (
                                                <div key={cert.id} className="group bg-slate-50 hover:bg-white rounded-2xl border border-slate-200/60 hover:border-slate-300 p-4 flex items-center gap-4 hover:shadow-md transition-all">
                                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 border transition-colors ${isPdf ? 'bg-rose-50 text-rose-500 border-rose-100/50 group-hover:border-rose-200' : 'bg-sky-50 text-sky-500 border-sky-100/50 group-hover:border-sky-200'}`}>
                                                        {isPdf ? <Icons.FileText /> : <Icons.ImageIcon />}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <h4 className="font-bold text-slate-700 group-hover:text-slate-900 text-sm truncate transition-colors" title={cert.certificate_name || cert.file_name}>
                                                            {cert.certificate_name || cert.file_name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-medium text-slate-500">{formatFileSize(cert.file_size)}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <span className="text-xs font-medium text-slate-400">{formatDate(cert.uploaded_at)}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all shrink-0 focus:opacity-100 focus:translate-x-0 cursor-pointer"
                                                        onClick={() => handleDeleteClick(cert.id, cert.certificate_name || cert.file_name)}
                                                        title="ลบใบรับรอง"
                                                    >
                                                        <Icons.Trash2 />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateUpload;
