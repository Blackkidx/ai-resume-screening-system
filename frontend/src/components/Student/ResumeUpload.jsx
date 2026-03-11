// frontend/src/components/Student/ResumeUpload.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AnalysisWarningCard, { PartialExtractionBanner } from './AnalysisWarningCard';
const API_BASE_URL = 'http://172.18.148.97:8000';

/* ── Modern 2026 Lucide SVGs ── */
const Icons = {
    UploadCloud: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" />
            <path d="m16 16-4-4-4 4" />
        </svg>
    ),
    FileText: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
        </svg>
    ),
    BrainCircuit: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
            <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
            <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
            <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
            <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
            <path d="M6 18a4 4 0 0 1-1.967-.516" />
            <path d="M19.967 17.484A4 4 0 0 1 18 18" />
        </svg>
    ),
    CheckCircle: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
        </svg>
    ),
    XCircle: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </svg>
    ),
    Award: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
    ),
    Refresh: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    ),
    Briefcase: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    GraduationCap: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
        </svg>
    ),
    Globe: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <path d="M2 12h20" />
        </svg>
    ),
    AlertTriangle: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
    ),
    ArrowRight: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    ),
    Network: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="16" y="16" width="6" height="6" rx="1" />
            <rect x="2" y="16" width="6" height="6" rx="1" />
            <rect x="9" y="2" width="6" height="6" rx="1" />
            <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
            <path d="M12 12V8" />
        </svg>
    )
};

const ResumeUpload = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // States
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [jobRecommendations, setJobRecommendations] = useState([]);
    const [resumeId, setResumeId] = useState(null);
    const [error, setError] = useState(null);
    const [analysisWarning, setAnalysisWarning] = useState(null); // failure_type from backend

    // Existing Resume States
    const [existingResume, setExistingResume] = useState(null);
    const [isLoadingExisting, setIsLoadingExisting] = useState(true);
    const [showUploadForm, setShowUploadForm] = useState(false);

    // Uploaded certificates count (from /student/certificates page)
    const [uploadedCertsCount, setUploadedCertsCount] = useState(0);

    // AI Scanner Progress State
    const [scanProgress, setScanProgress] = useState(0);

    // Redirect if not logged in
    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    // Fetch Existing Resume + Job Recommendations on page load
    useEffect(() => {
        const fetchExistingResume = async () => {
            try {
                const token = sessionStorage.getItem('auth_token');
                if (!token) { setIsLoadingExisting(false); return; }

                const response = await fetch(`${API_BASE_URL}/api/resumes/my/list`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.resumes && data.resumes.length > 0) {
                        const latestResume = data.resumes[0];
                        if (latestResume.status === 'processed' && latestResume.extracted_features) {
                            setExistingResume(latestResume);
                            const f = latestResume.extracted_features;
                            setAnalysisResult({
                                skills: [...(f.skills?.technical_skills || []), ...(f.skills?.soft_skills || [])],
                                experience: (f.projects || []).map(p => ({
                                    title: p.name || 'Unnamed Project',
                                    type: 'Project',
                                    duration: p.duration || null,
                                    description: p.description || ''
                                })),
                                education: {
                                    degree: f.education?.level || null,
                                    university: f.education?.university || null,
                                    year: f.education?.graduation_year || null,
                                    major: f.education?.major || null,
                                    gpa: f.education?.gpa > 0 ? f.education.gpa : null,
                                },
                                experience_months: f.experience_months || 0,
                                languages: f.languages || [],
                                certifications: f.certifications || []
                            });
                            setResumeId(latestResume.id);

                            // Fetch job recommendations (so they persist on refresh)
                            try {
                                const matchRes = await fetch(`${API_BASE_URL}/api/matching/recommendations`, {
                                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                                });
                                if (matchRes.ok) {
                                    const matchData = await matchRes.json();
                                    const parseJobs = (jobs) => (jobs || []).map(j => ({
                                        id: j.job_id, title: j.job_title, company: j.company_name,
                                        location: j.department || 'N/A', matchScore: Math.round(j.overall_score),
                                        requiredSkills: j.skills_required || [], description: j.recommendation || ''
                                    }));
                                    setJobRecommendations([...parseJobs(matchData.green), ...parseJobs(matchData.yellow)]);
                                }
                            } catch (matchErr) {
                                console.error('Failed to fetch recommendations:', matchErr);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch existing resume:', err);
            } finally {
                setIsLoadingExisting(false);
            }
        };
        if (user) fetchExistingResume();
    }, [user]);

    // Fetch uploaded certs count
    useEffect(() => {
        const fetchCertsCount = async () => {
            try {
                const token = sessionStorage.getItem('auth_token');
                if (!token) return;
                const res = await fetch(`${API_BASE_URL}/api/certificates/my/list`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUploadedCertsCount((data.certificates || []).length);
                }
            } catch { /* silent */ }
        };
        if (user) fetchCertsCount();
    }, [user]);

    // 🚀 Real AI Analysis Function
    const analyzeResume = async (file) => {
        setIsAnalyzing(true);
        setError(null);
        setAnalysisWarning(null);
        setScanProgress(0);

        // Simulate progress steps for UX
        const progressInterval = setInterval(() => {
            setScanProgress(prev => (prev < 90 ? prev + 10 : prev));
        }, 500);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = sessionStorage.getItem('auth_token');

            const uploadResponse = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.detail || 'อัปโหลด Resume ไม่สำเร็จ');
            }

            const uploadResult = await uploadResponse.json();
            setResumeId(uploadResult.id);

            // Parse failure_type from backend diagnosis
            const ft = uploadResult.failure_type || null;
            if (ft === 'image_only_pdf') {
                setAnalysisWarning({ type: ft });
                setIsAnalyzing(false);
                setUploadedFile(null);
                clearInterval(progressInterval);
                return;
            }
            if (ft === 'ai_failed') {
                setAnalysisWarning({ type: ft });
                setIsAnalyzing(false);
                clearInterval(progressInterval);
                return;
            }
            if (ft) setAnalysisWarning({ type: ft }); // partial_extraction — continue showing results

            const features = uploadResult.extracted_features || {};
            const analysisData = {
                skills: [...(features.skills?.technical_skills || []), ...(features.skills?.soft_skills || [])],
                experience: (features.projects || []).map(proj => ({
                    title: proj.name || 'Unnamed Project',
                    type: 'Project',
                    duration: proj.duration || null,
                    description: proj.description || ''
                })),
                education: {
                    degree: features.education?.level || null,
                    university: features.education?.university || null,
                    year: features.education?.graduation_year || null,
                    major: features.education?.major || null,
                    gpa: features.education?.gpa > 0 ? features.education.gpa : null
                },
                experience_months: features.experience_months || 0,
                languages: features.languages || [],
                certifications: features.certifications || []
            };

            setAnalysisResult(analysisData);
            setExistingResume({ file_name: file.name, file_size: file.size, uploaded_at: new Date().toISOString() });
            setShowUploadForm(false);

            // Fetch Job Recommendations
            try {
                const reqHeaders = { 'Content-Type': 'application/json' };
                if (token) reqHeaders['Authorization'] = `Bearer ${token}`;
                const matchingResponse = await fetch(`${API_BASE_URL}/api/matching/recommendations`, { headers: reqHeaders });
                if (matchingResponse.ok) {
                    const res = await matchingResponse.json();
                    const parseJobs = (jobs) => (jobs || []).map(j => ({
                        id: j.job_id, title: j.job_title, company: j.company_name,
                        location: j.department || 'N/A', matchScore: Math.round(j.overall_score),
                        requiredSkills: j.skills_required || [], description: j.recommendation || ''
                    }));
                    setJobRecommendations([...parseJobs(res.green), ...parseJobs(res.yellow)]);
                }
            } catch (err) {
                console.error('Matching Error:', err);
            }

            setScanProgress(100);
            setTimeout(() => setIsAnalyzing(false), 500); // Small delay to show 100%

        } catch (error) {
            setError(error.message);
            setIsAnalyzing(false);
            setAnalysisResult(null);
            setJobRecommendations([]);
        } finally {
            clearInterval(progressInterval);
        }
    };

    // Upload Handlers
    const handleFileUpload = (file) => {
        if (!file) return;
        if (file.type !== 'application/pdf') return setError('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
        if (file.size > 15 * 1024 * 1024) return setError('ไฟล์มีขนาดใหญ่เกิน 15MB');
        setUploadedFile(file);
        analyzeResume(file);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) handleFileUpload(e.dataTransfer.files[0]);
    };

    const getMatchIndicator = (score) => {
        if (score >= 80) return { icon: <Icons.CheckCircle />, label: 'เหมาะสมมาก', class: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
        if (score >= 50) return { icon: <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>, label: 'พิจารณาได้', class: 'bg-amber-50 text-amber-600 border-amber-200' };
        return { icon: <Icons.XCircle />, label: 'ไม่เหมาะสม', class: 'bg-rose-50 text-rose-600 border-rose-200' };
    };

    const formatFileSize = (bytes) => (bytes < 1024 * 1024) ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    if (!user) return null;

    // ── HR / Admin role guard ──
    if (['HR', 'Admin'].includes(user?.user_type)) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md w-full p-10 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 mx-auto mb-5">
                        <svg className="w-8 h-8 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 mb-2">ไม่สามารถเข้าถึงได้</h2>
                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                        Role <strong>{user.user_type}</strong> ไม่สามารถประมวลผล Resume ได้<br />
                        ฟีเจอร์นี้สำหรับนักศึกษาเท่านั้น
                    </p>
                    <button
                        className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 text-sm font-bold transition-colors"
                        onClick={() => navigate(-1)}
                    >
                        กลับหน้าเดิม
                    </button>
                </div>
            </div>
        );
    }

    const shouldShowExistingResume = existingResume && analysisResult && !showUploadForm && !isAnalyzing;

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-sky-100 selection:text-sky-900 flex flex-col lg:flex-row">

            {/* ── LEFT COLUMN: EDUCATIONAL GUIDE (The AI Manual) ── */}
            <div className="lg:w-1/3 bg-slate-900 text-white p-8 lg:p-12 relative overflow-hidden flex flex-col">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-500 rounded-full blur-[100px] opacity-20 transform translate-x-1/2 -translate-y-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                            <Icons.BrainCircuit />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">AI Screening</h1>
                    </div>

                    <h2 className="text-3xl font-bold mb-4 leading-tight">เพิ่มโอกาสได้งาน<br /><span className="text-sky-400">ด้วยเรซูเม่ที่ใช่</span></h2>
                    <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                        ระบบใช้ Natural Language Processing (NLP) เพื่อสกัดข้อมูลทักษะและประสบการณ์ โปรดทำตามคำแนะนำเพื่อให้ AI อ่านข้อมูลของคุณได้ถูกต้องที่สุด
                    </p>

                    <div className="space-y-6">
                        <div className="flex gap-4 items-start">
                            <div className="mt-1 text-emerald-400"><Icons.CheckCircle /></div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">ใช้ Text-based PDF</h3>
                                <p className="text-sm text-slate-400">ส่งออกจาก Word, Google Docs หรือเว็บสร้างเรซูเม่ เพื่อให้สามารถคลุมดำข้อความได้ (ไม่ใช้รูปสแกน)</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="mt-1 text-emerald-400"><Icons.CheckCircle /></div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">โครงสร้างมาตรฐาน</h3>
                                <p className="text-sm text-slate-400">แยกหัวข้อชัดเจน เช่น Education, Experience, Skills เพื่อความแม่นยำในการดึงข้อมูล</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="mt-1 text-rose-400"><Icons.XCircle /></div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">หลีกเลี่ยงกราฟ หรือ Progress Bar</h3>
                                <p className="text-sm text-slate-400">เทกเจอร์ที่ประเมินทักษะด้วยดาวหรือกราฟ ทำให้ AI ประเมินความเชี่ยวชาญจริงได้ยาก</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-800">
                        <Link to="/student/certificates" className="flex gap-4 items-start bg-slate-800/50 hover:bg-slate-700/80 p-5 rounded-2xl border border-slate-700/50 transition-all cursor-pointer group">
                            <div className="text-amber-400 shrink-0 group-hover:scale-110 transition-transform"><Icons.Award /></div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-white text-sm">การแนบ Certificate (ใบรับรอง)</h3>
                                    <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition-colors">
                                        <Icons.ArrowRight />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                                    หากคุณมีใบรับรองให้ข้ามไปที่ <strong>เมนูอัพโหลดใบรับรองแยกต่างหาก</strong> ระบบจะนำไปคำนวณคะแนนรวมกับเรซูเม่โดยอัตโนมัติ <strong>คลิกที่นี่ 👆</strong>
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── RIGHT COLUMN: INTERACTIVE ZONE ── */}
            <div className="lg:w-2/3 flex-1 flex flex-col bg-slate-50 relative min-h-screen">
                <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* Loading State Initial */}
                        {isLoadingExisting && (
                            <div className="flex flex-col items-center justify-center py-32 opacity-70">
                                <Icons.Refresh />
                                <p className="mt-4 font-medium text-slate-500 animate-pulse">กำลังตรวจสอบข้อมูล...</p>
                            </div>
                        )}

                        {/* Existing Resume Notice */}
                        {shouldShowExistingResume && (
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shrink-0">
                                        <Icons.FileText />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{existingResume.file_name}</h3>
                                        <p className="text-sm text-slate-500 font-medium">ขนาด: {formatFileSize(existingResume.file_size)}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowUploadForm(true); setUploadedFile(null); }}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shrink-0">
                                    <Icons.UploadCloud /> อัพโหลดไฟล์ใหม่
                                </button>
                            </div>
                        )}

                        {/* Upload Form Zone */}
                        {(!existingResume || showUploadForm || isAnalyzing) && !isLoadingExisting && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {showUploadForm && (
                                    <button onClick={() => setShowUploadForm(false)} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                                        <Icons.XCircle /> ยกเลิกการอัพโหลดใหม่
                                    </button>
                                )}

                                {!isAnalyzing ? (
                                    <div
                                        className={`relative group rounded-3xl border-2 border-dashed p-16 text-center transition-all cursor-pointer overflow-hidden ${isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-white hover:border-sky-400 hover:bg-sky-50/50 hover:shadow-lg hover:shadow-sky-100'
                                            }`}
                                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById('file-upload-input').click()}
                                    >
                                        <input id="file-upload-input" type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.length && handleFileUpload(e.target.files[0])} />

                                        <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${isDragging ? 'bg-sky-500 text-white scale-110 shadow-lg shadow-sky-500/30' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-sky-500 group-hover:shadow-md'}`}>
                                            <Icons.UploadCloud />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">ลากไฟล์มาวางตรงนี้ หรือคลิกเพื่อเลือกไฟล์</h3>
                                        <p className="text-slate-500 font-medium font-mono text-sm">PDF (max 15MB)</p>

                                        {/* Decorative scanning line on hover */}
                                        <div className="absolute top-0 left-0 w-full h-1 bg-sky-400 opacity-0 group-hover:opacity-100 group-hover:animate-[scan_3s_ease-in-out_infinite]" />
                                    </div>
                                ) : (
                                    /* AI Scanner Loading State */
                                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm relative overflow-hidden">
                                        {/* Scanner Line */}
                                        <div className="absolute top-0 left-0 w-full h-[2px] bg-sky-500 shadow-[0_0_10px_#0ea5e9] animate-[scan_2s_ease-in-out_infinite]" />

                                        <div className="w-24 h-24 mx-auto relative mb-8">
                                            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                                            <div className="absolute inset-0 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center text-sky-500">
                                                <Icons.BrainCircuit />
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-900 mb-3">AI is analyzing your resume</h3>

                                        <div className="flex justify-center items-center gap-2 text-sm font-mono text-slate-500 mb-8">
                                            <span>[</span>
                                            <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-sky-500 transition-all duration-300 ease-out" style={{ width: `${scanProgress}%` }} />
                                            </div>
                                            <span>] {scanProgress}%</span>
                                        </div>

                                        <div className="flex flex-col items-center gap-2 text-xs font-mono text-sky-600">
                                            {scanProgress < 30 && <p className="animate-pulse">Reading document structure...</p>}
                                            {scanProgress >= 30 && scanProgress < 60 && <p className="animate-pulse">Extracting explicitly stated skills...</p>}
                                            {scanProgress >= 60 && scanProgress < 90 && <p className="animate-pulse">Mapping semantic relationships...</p>}
                                            {scanProgress >= 90 && <p className="animate-pulse">Finalizing profile match scores...</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Analysis Warning Alert */}
                                {analysisWarning && <AnalysisWarningCard type={analysisWarning.type} onRetry={() => { setAnalysisWarning(null); setUploadedFile(null); setShowUploadForm(true); }} />}

                                {/* Legacy error fallback */}
                                {error && (
                                    <div className="mt-6 bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-start gap-4">
                                        <div className="text-rose-500 shrink-0"><Icons.AlertTriangle /></div>
                                        <div>
                                            <h4 className="font-bold text-rose-900 mb-1">เกิดข้อผิดพลาด</h4>
                                            <p className="text-sm font-medium text-rose-700 whitespace-pre-line leading-relaxed">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Analysis Results - Bento Grid */}
                        {analysisResult && !isAnalyzing && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 space-y-6">
                                {/* Partial extraction inline banner */}
                                {analysisWarning?.type === 'partial_extraction' && (
                                    <PartialExtractionBanner onRetry={() => { setAnalysisWarning(null); setShowUploadForm(true); }} />
                                )}
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                                        <Icons.BrainCircuit />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">AI Data Extraction</h2>
                                        <p className="text-sm font-medium text-slate-500">ข้อมูลที่ระบบประมวลผลได้จากเรซูเม่ของคุณ</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Skills Bento */}
                                    <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold mb-4">
                                            <Icons.BrainCircuit /> Skills (ทักษะ)
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {analysisResult.skills.length > 0 ? analysisResult.skills.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200">
                                                    {skill}
                                                </span>
                                            )) : <span className="text-slate-400 text-sm italic">Not found</span>}
                                        </div>
                                    </div>

                                    {/* Education Bento */}
                                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold mb-4">
                                            <Icons.GraduationCap /> Education
                                        </div>
                                        <div className="space-y-1.5">
                                            {analysisResult.education.degree && (
                                                <p className="font-bold text-slate-800 line-clamp-1">{analysisResult.education.degree}</p>
                                            )}
                                            {analysisResult.education.major && (
                                                <p className="text-sm font-semibold text-slate-700">{analysisResult.education.major}</p>
                                            )}
                                            {analysisResult.education.university && (
                                                <p className="text-sm text-slate-500">{analysisResult.education.university}</p>
                                            )}
                                            {analysisResult.education.gpa && (
                                                <p className="text-sm font-medium text-slate-500 pt-1">GPA: <span className="text-slate-800 font-bold">{analysisResult.education.gpa}</span></p>
                                            )}
                                            {analysisResult.education.year && (
                                                <p className="text-xs text-slate-400">{analysisResult.education.year}</p>
                                            )}
                                            {!analysisResult.education.university && !analysisResult.education.major && (
                                                <p className="text-sm text-slate-400 italic">ไม่พบข้อมูลการศึกษา</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Experience Bento */}
                                    <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:col-span-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2 text-slate-900 font-bold">
                                                <Icons.Briefcase /> Experience & Projects
                                            </div>
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                                                {analysisResult.experience_months} Months Total
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {analysisResult.experience.length > 0 ? analysisResult.experience.map((exp, i) => (
                                                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <h4 className="font-bold text-slate-800 line-clamp-1" title={exp.title}>{exp.title}</h4>
                                                    <p className="text-xs font-semibold text-sky-600 mt-1">
                                                        {exp.company || exp.type}{exp.duration ? ` • ${exp.duration}` : ''}
                                                    </p>
                                                    {exp.description && (
                                                        <p className="text-sm text-slate-600 mt-3 line-clamp-2 leading-relaxed">{exp.description}</p>
                                                    )}
                                                </div>
                                            )) : <p className="text-slate-400 text-sm italic col-span-full">ไม่พบข้อมูล Project</p>}
                                        </div>
                                    </div>

                                    {/* Lang & Certs Bento */}
                                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold mb-4">
                                            <Icons.Globe /> Languages
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {analysisResult.languages?.length > 0 ? analysisResult.languages.map((l, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-sky-50 text-sky-700 text-sm font-semibold rounded-lg border border-sky-100">
                                                    {typeof l === 'string' ? l : l.language}
                                                </span>
                                            )) : <span className="text-slate-400 text-sm italic">Not found</span>}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:col-span-2 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                        {/* Header: title + badge on top row, link on second row (mobile-friendly) */}
                                        <div className="flex flex-col gap-2 mb-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <div className="flex items-center gap-2 text-slate-900 font-bold">
                                                    <Icons.Award /> Extracted Certificates
                                                </div>
                                                {uploadedCertsCount > 0 && (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                                                        +{uploadedCertsCount} อัปโหลดแล้ว
                                                    </span>
                                                )}
                                            </div>
                                            <Link to="/student/certificates" className="self-start text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-amber-200/50">
                                                เพิ่มใบรับรองแยกต่างหาก <Icons.ArrowRight />
                                            </Link>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {analysisResult.certifications?.length > 0
                                                ? analysisResult.certifications.map((c, i) => (
                                                    <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 text-sm font-semibold rounded-lg border border-amber-100">
                                                        {typeof c === 'object' ? c.name : c}
                                                    </span>
                                                ))
                                                : uploadedCertsCount > 0
                                                    ? (
                                                        <div className="flex items-center gap-3 w-full p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                                            <div className="text-emerald-500 shrink-0"><Icons.CheckCircle /></div>
                                                            <div>
                                                                <p className="text-sm font-bold text-emerald-800">มีใบรับรอง {uploadedCertsCount} ใบในระบบ</p>
                                                                <p className="text-xs text-emerald-600 font-medium">AI ได้นำไปคำนวณ Match Score แล้ว ✓</p>
                                                            </div>
                                                        </div>
                                                    )
                                                    : <span className="text-slate-400 text-sm font-medium leading-relaxed">ยังตรวจไม่พบ Certificate ในเรซูเม่นี้ แต่ระบบของเรามีหน้าอัพโหลด Certificate แยกโดยเฉพาะ เพื่อให้คะแนนของคุณสูงที่สุด! (คลิกปุ่มด้านบน 👆)</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Job Matches */}
                        {jobRecommendations.length > 0 && !isAnalyzing && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 space-y-6 pt-12">
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Icons.Network />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">High Matching Jobs</h2>
                                            <p className="text-sm font-medium text-slate-500">ตำแหน่งงานที่มีความเกี่ยวข้องสูง (Score 50%+)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {jobRecommendations.map((job) => {
                                        const indicator = getMatchIndicator(job.matchScore);
                                        return (
                                        <div key={job.id} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all group">
                                            {/* Top: Title */}
                                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 group-hover:text-sky-600 transition-colors">{job.title}</h3>

                                            {/* Company + Location — stack on mobile */}
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-slate-500 mb-4">
                                                <span className="flex items-center gap-1">&#x1F3E2; {job.company}</span>
                                                <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="flex items-center gap-1">&#x1F4CD; {job.location}</span>
                                            </div>

                                            {/* Skills (hidden on mobile) */}
                                            <div className="hidden md:flex flex-wrap gap-1.5 mb-4">
                                                {job.requiredSkills.slice(0, 5).map((skill, i) => (
                                                    <span key={i} className="px-2 py-1 bg-slate-50 text-slate-600 text-xs font-semibold rounded-md border border-slate-100">{skill}</span>
                                                ))}
                                                {job.requiredSkills.length > 5 && <span className="px-2 py-1 bg-slate-50 text-slate-400 text-xs font-semibold rounded-md border border-slate-100">+{job.requiredSkills.length - 5}</span>}
                                            </div>

                                            {/* Bottom: Score + Action — always side-by-side */}
                                            <div className="flex items-center gap-3">
                                                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shrink-0 ${indicator.class}`}>
                                                    <span className="flex items-center gap-1 text-base font-black">{indicator.icon} {job.matchScore}%</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{indicator.label}</span>
                                                </div>
                                                <button
                                                    onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                                                    className="flex-1 h-11 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-700 transition-colors"
                                                >
                                                    ดูสเปคงาน
                                                </button>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { transform: translateY(0); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateY(120px); opacity: 0; }
                }
            `}</style>
        </div >
    );
};

export default ResumeUpload;
