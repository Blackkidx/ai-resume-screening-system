// frontend/src/components/Student/ResumeUpload.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/resumeUpload.css';

const API_BASE_URL = 'http://localhost:8000';

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

    // ⭐ NEW: States สำหรับ Resume ที่มีอยู่แล้ว
    const [existingResume, setExistingResume] = useState(null);
    const [isLoadingExisting, setIsLoadingExisting] = useState(true);
    const [showUploadForm, setShowUploadForm] = useState(false);

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    // ⭐ NEW: ตรวจสอบ Resume ที่มีอยู่แล้วตอนเปิดหน้า
    useEffect(() => {
        const fetchExistingResume = async () => {
            try {
                const token = sessionStorage.getItem('auth_token');
                if (!token) {
                    setIsLoadingExisting(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/resumes/my/list`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.resumes && data.resumes.length > 0) {
                        // เอา Resume ล่าสุด (อันแรกเพราะเรียงตาม uploaded_at desc)
                        const latestResume = data.resumes[0];
                        if (latestResume.status === 'processed' && latestResume.extracted_features) {
                            setExistingResume(latestResume);

                            // แปลง extracted_features → analysisResult format
                            const features = latestResume.extracted_features;
                            const allSkills = [
                                ...(features.skills?.technical_skills || []),
                                ...(features.skills?.soft_skills || [])
                            ];
                            const projects = (features.projects || []).map(proj => ({
                                title: proj.name || 'Unnamed Project',
                                type: 'Project',
                                duration: proj.duration || 'N/A',
                                description: proj.description || ''
                            }));

                            setAnalysisResult({
                                skills: allSkills,
                                experience: projects,
                                education: {
                                    degree: features.education?.level || 'N/A',
                                    university: features.education?.university || 'N/A',
                                    year: features.education?.graduation_year || 'N/A',
                                    major: features.education?.major || 'N/A',
                                    gpa: features.education?.gpa || 'N/A'
                                },
                                experience_months: features.experience_months || 0,
                                languages: features.languages || [],
                                certifications: features.certifications || []
                            });

                            setResumeId(latestResume.id);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch existing resume:', err);
            } finally {
                setIsLoadingExisting(false);
            }
        };

        if (user) {
            fetchExistingResume();
        }
    }, [user]);

    // 🚀 Real AI Analysis Function - เชื่อมกับ Backend
    const analyzeResume = async (file) => {
        setIsAnalyzing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = sessionStorage.getItem('auth_token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const uploadResponse = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.detail || 'อัปโหลด Resume ไม่สำเร็จ');
            }

            const uploadResult = await uploadResponse.json();
            setResumeId(uploadResult.id);

            // ⚠️ ตรวจจับ OCR — PDF สแกนจากรูปภาพ
            if (uploadResult.status === 'ocr_not_supported') {
                setError(
                    '⚠️ ไม่สามารถอ่านข้อความจาก PDF ได้ — ไฟล์อาจเป็น PDF ที่สแกนจากเอกสาร (รูปภาพ)\n\n' +
                    '🔧 ระบบยังไม่รองรับ OCR (การอ่านข้อความจากรูปภาพ) ในขณะนี้\n\n' +
                    '✅ กรุณาอัปโหลด PDF ที่สร้างจากโปรแกรม เช่น Microsoft Word, Canva, Google Docs หรือ Overleaf'
                );
                setIsAnalyzing(false);
                setUploadedFile(null);
                return;
            }

            // แปลง extracted_features เป็นรูปแบบที่ UI ต้องการ
            const features = uploadResult.extracted_features || {};
            const allSkills = [
                ...(features.skills?.technical_skills || []),
                ...(features.skills?.soft_skills || [])
            ];
            const projects = (features.projects || []).map(proj => ({
                title: proj.name || 'Unnamed Project',
                type: 'Project',
                duration: proj.duration || 'N/A',
                description: proj.description || ''
            }));

            const analysisData = {
                skills: allSkills,
                experience: projects,
                education: {
                    degree: features.education?.level || 'N/A',
                    university: features.education?.university || 'N/A',
                    year: features.education?.graduation_year || 'N/A',
                    major: features.education?.major || 'N/A',
                    gpa: features.education?.gpa || 'N/A'
                },
                experience_months: features.experience_months || 0,
                languages: features.languages || [],
                certifications: features.certifications || []
            };

            setAnalysisResult(analysisData);
            setExistingResume({ file_name: file.name, file_size: file.size, uploaded_at: new Date().toISOString() });
            setShowUploadForm(false);

            // ดึงงานที่แนะนำ
            try {
                const matchingHeaders = { 'Content-Type': 'application/json' };
                if (token) matchingHeaders['Authorization'] = `Bearer ${token}`;

                const matchingResponse = await fetch(`${API_BASE_URL}/api/matching/recommendations`, {
                    method: 'GET',
                    headers: matchingHeaders
                });

                if (matchingResponse.ok) {
                    const matchingResult = await matchingResponse.json();
                    const greenJobs = (matchingResult.green || []).map(job => ({
                        id: job.job_id, title: job.job_title, company: job.company_name,
                        location: job.department || 'N/A', matchScore: Math.round(job.overall_score),
                        requiredSkills: job.skills_required || [], description: job.recommendation || '',
                        salary: 'ติดต่อสอบถาม'
                    }));
                    const yellowJobs = (matchingResult.yellow || []).map(job => ({
                        id: job.job_id, title: job.job_title, company: job.company_name,
                        location: job.department || 'N/A', matchScore: Math.round(job.overall_score),
                        requiredSkills: job.skills_required || [], description: job.recommendation || '',
                        salary: 'ติดต่อสอบถาม'
                    }));
                    setJobRecommendations([...greenJobs, ...yellowJobs]);
                } else {
                    setJobRecommendations([]);
                }
            } catch (matchingError) {
                console.error('Matching Error:', matchingError);
                setJobRecommendations([]);
            }

            setIsAnalyzing(false);

        } catch (error) {
            console.error('❌ Analysis Error:', error);
            setError(error.message);
            setIsAnalyzing(false);
            setAnalysisResult(null);
            setJobRecommendations([]);
        }
    };

    // Handle file upload
    const handleFileUpload = (file) => {
        if (!file) return;
        const validTypes = ['application/pdf'];
        if (!validTypes.includes(file.type)) {
            setError('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
            return;
        }
        const maxSize = 15 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('ไฟล์มีขนาดใหญ่เกิน 15MB');
            return;
        }
        setUploadedFile(file);
        analyzeResume(file);
    };

    // Drag and drop handlers
    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) handleFileUpload(files[0]);
    };
    const handleFileInputChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) handleFileUpload(files[0]);
    };

    // Match indicator
    const getMatchIndicator = (score) => {
        if (score >= 80) return { emoji: '🟢', label: 'เหมาะสมมาก', color: '#10B981' };
        if (score >= 50) return { emoji: '🟡', label: 'พิจารณาได้', color: '#F59E0B' };
        return { emoji: '🔴', label: 'ไม่เหมาะสม', color: '#EF4444' };
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (!user) return null;

    // ⭐ Loading state
    if (isLoadingExisting) {
        return (
            <div className="resume-upload-page">
                <div className="resume-upload-container">
                    <div className="analyzing-indicator">
                        <div className="spinner"></div>
                        <p>กำลังโหลดข้อมูล Resume...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ⭐ ตัดสินใจว่าแสดงอะไร: มี Resume อยู่แล้ว + ไม่ได้กด "อัปโหลดใหม่"
    const shouldShowExistingResume = existingResume && analysisResult && !showUploadForm && !isAnalyzing;

    return (
        <div className="resume-upload-page">
            <div className="resume-upload-container">
                {/* Header */}
                <div className="page-header">
                    <h1>{shouldShowExistingResume ? '📄 Resume ของฉัน' : '📄 อัปโหลด Resume ของคุณ'}</h1>
                    <p>{shouldShowExistingResume
                        ? 'ข้อมูล Resume ที่ AI วิเคราะห์ไว้แล้ว'
                        : 'ให้ AI วิเคราะห์และแนะนำงานที่เหมาะสมกับคุณ'
                    }</p>
                </div>

                {/* ⭐ Existing Resume Info Card */}
                {shouldShowExistingResume && (
                    <div className="existing-resume-card">
                        <div className="resume-file-info">
                            <div className="file-icon">📎</div>
                            <div className="file-details">
                                <h3>{existingResume.file_name}</h3>
                                <p>ขนาด: {formatFileSize(existingResume.file_size)} • อัปโหลดเมื่อ: {formatDate(existingResume.uploaded_at)}</p>
                            </div>
                            <button
                                className="btn-reupload"
                                onClick={() => {
                                    setShowUploadForm(true);
                                    setUploadedFile(null);
                                }}
                            >
                                📤 อัปโหลดใหม่
                            </button>
                        </div>
                    </div>
                )}

                {/* Upload Section — แสดงเมื่อยังไม่มี Resume หรือกด "อัปโหลดใหม่" */}
                {(!existingResume || showUploadForm || isAnalyzing) && (
                    <div className="upload-section">
                        {showUploadForm && (
                            <button
                                className="btn-back-to-resume"
                                onClick={() => setShowUploadForm(false)}
                            >
                                ← กลับไปดู Resume เดิม
                            </button>
                        )}
                        <div
                            className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'uploaded' : ''}`}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-input').click()}
                        >
                            <input
                                id="file-input"
                                type="file"
                                accept=".pdf"
                                onChange={handleFileInputChange}
                                style={{ display: 'none' }}
                            />

                            {!uploadedFile ? (
                                <>
                                    <div className="upload-icon">📤</div>
                                    <h3>Drag & Drop หรือคลิกเพื่ออัปโหลด</h3>
                                    <p>รองรับ PDF เท่านั้น (สูงสุด 15MB)</p>
                                </>
                            ) : (
                                <>
                                    <div className="upload-icon">✅</div>
                                    <h3>{uploadedFile.name}</h3>
                                    <p>ขนาด: {formatFileSize(uploadedFile.size)}</p>
                                </>
                            )}
                        </div>

                        {error && (
                            <div className={`notification-banner ${error.includes('OCR') ? 'notification-warning' : 'notification-error'}`}>
                                <div className="notification-icon">
                                    {error.includes('OCR') ? (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                            <line x1="12" y1="9" x2="12" y2="13" />
                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                        </svg>
                                    ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="15" y1="9" x2="9" y2="15" />
                                            <line x1="9" y1="9" x2="15" y2="15" />
                                        </svg>
                                    )}
                                </div>
                                <div className="notification-content">
                                    <h4>{error.includes('OCR') ? 'ไม่รองรับ OCR' : 'เกิดข้อผิดพลาด'}</h4>
                                    <p>{error.includes('OCR')
                                        ? 'ไฟล์อาจเป็น PDF ที่สแกนจากเอกสาร (รูปภาพ) — ระบบยังไม่รองรับการอ่านข้อความจากรูปภาพ (OCR) ในขณะนี้'
                                        : error
                                    }</p>
                                    {error.includes('OCR') && (
                                        <p className="notification-suggestion">
                                            กรุณาอัปโหลด PDF ที่สร้างจากโปรแกรม เช่น Microsoft Word, Canva, Google Docs หรือ Overleaf
                                        </p>
                                    )}
                                </div>
                                <button className="notification-close" onClick={() => setError(null)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* OCR Info Hint */}
                        <div className="notification-hint">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <span>รองรับเฉพาะ PDF ดิจิทัล (Word, Canva, Google Docs) — ยังไม่รองรับ PDF สแกน (OCR)</span>
                        </div>

                        {isAnalyzing && (
                            <div className="analyzing-indicator">
                                <div className="spinner"></div>
                                <p>AI กำลังวิเคราะห์ Resume ของคุณ...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* AI Analysis Results */}
                {analysisResult && !isAnalyzing && (
                    <div className="analysis-section">
                        <h2>🤖 ผลการวิเคราะห์จาก AI</h2>

                        <div className="analysis-cards">
                            {/* Skills Card */}
                            <div className="analysis-card">
                                <h3>💼 Skills ที่พบ</h3>
                                <div className="skills-list">
                                    {analysisResult.skills.map((skill, index) => (
                                        <span key={index} className="skill-tag">{skill}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Experience Card */}
                            <div className="analysis-card">
                                <h3>📊 ประสบการณ์</h3>
                                <div className="experience-list">
                                    {analysisResult.experience.map((exp, index) => (
                                        <div key={index} className="experience-item">
                                            <h4>{exp.title}</h4>
                                            <p className="experience-company">{exp.company || exp.type} • {exp.duration}</p>
                                            <p className="experience-desc">{exp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Education Card */}
                            <div className="analysis-card">
                                <h3>🎓 การศึกษา</h3>
                                <div className="education-info">
                                    <h4>{analysisResult.education.degree}</h4>
                                    <p>{analysisResult.education.university}</p>
                                    <p>สาขา: {analysisResult.education.major}</p>
                                    <p>GPA: {analysisResult.education.gpa}</p>
                                    <p>ปีที่จบการศึกษา: {analysisResult.education.year}</p>
                                </div>
                            </div>

                            {/* Languages Card */}
                            {analysisResult.languages && analysisResult.languages.length > 0 && (
                                <div className="analysis-card">
                                    <h3>🌐 ภาษา</h3>
                                    <div className="skills-list">
                                        {analysisResult.languages.map((lang, index) => (
                                            <span key={index} className="skill-tag">{typeof lang === 'string' ? lang : lang.language}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Certifications Card */}
                            {analysisResult.certifications && analysisResult.certifications.length > 0 && (
                                <div className="analysis-card">
                                    <h3>🏆 ใบรับรอง</h3>
                                    <div className="skills-list">
                                        {analysisResult.certifications.map((cert, index) => (
                                            <span key={index} className="skill-tag">{cert}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Job Recommendations */}
                {jobRecommendations.length > 0 && !isAnalyzing && (
                    <div className="recommendations-section">
                        <h2>🎯 งานที่แนะนำสำหรับคุณ</h2>
                        <p className="recommendations-subtitle">
                            แสดงเฉพาะงานที่มีความเหมาะสม 50% ขึ้นไป เรียงตามความเหมาะสม
                        </p>

                        <div className="jobs-list">
                            {jobRecommendations.map((job) => {
                                const indicator = getMatchIndicator(job.matchScore);
                                return (
                                    <div key={job.id} className="job-card">
                                        <div className="job-header">
                                            <div className="job-match">
                                                <span className="match-emoji">{indicator.emoji}</span>
                                                <span className="match-score" style={{ color: indicator.color }}>
                                                    {job.matchScore}%
                                                </span>
                                                <span className="match-label">{indicator.label}</span>
                                            </div>
                                        </div>

                                        <div className="job-content">
                                            <h3>{job.title}</h3>
                                            <div className="job-meta">
                                                <span>🏢 {job.company}</span>
                                                <span>📍 {job.location}</span>
                                                <span>💰 {job.salary}</span>
                                            </div>
                                            <p className="job-description">{job.description}</p>

                                            <div className="job-skills">
                                                <strong>ทักษะที่ต้องการ:</strong>
                                                <div className="skills-tags">
                                                    {job.requiredSkills.map((skill, index) => (
                                                        <span key={index} className="skill-tag-small">{skill}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="job-actions">
                                            <button className="btn-view-details">ดูรายละเอียด</button>
                                            <button className="btn-apply">สมัครงาน</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Empty State — ไม่มี Resume และไม่ได้อัปโหลด */}
                {!existingResume && !uploadedFile && !showUploadForm && (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>เริ่มต้นด้วยการอัปโหลด Resume</h3>
                        <p>AI จะวิเคราะห์ทักษะและประสบการณ์ของคุณ<br />แล้วแนะนำงานที่เหมาะสมที่สุด</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeUpload;
