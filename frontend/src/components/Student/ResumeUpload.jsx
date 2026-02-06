// frontend/src/components/Student/ResumeUpload.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/resumeUpload.css';

const ResumeUpload = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [uploadedFile, setUploadedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [jobRecommendations, setJobRecommendations] = useState([]);

    // Redirect if not logged in
    React.useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    // Mock AI Analysis Function
    const analyzeResume = (file) => {
        setIsAnalyzing(true);

        // Simulate AI processing delay
        setTimeout(() => {
            // Mock analysis result
            const mockAnalysis = {
                skills: [
                    "Python", "JavaScript", "React", "Node.js",
                    "Machine Learning", "Data Analysis", "SQL",
                    "Git", "Docker", "AWS"
                ],
                experience: [
                    {
                        title: "Software Development Intern",
                        company: "Tech Startup Co.",
                        duration: "6 months",
                        description: "Developed web applications using React and Node.js"
                    },
                    {
                        title: "Academic Project: AI Resume Screening",
                        type: "University Project",
                        duration: "3 months",
                        description: "Built an AI-powered resume screening system"
                    }
                ],
                education: {
                    degree: "Bachelor of Computer Science",
                    university: "Example University",
                    year: "2024"
                }
            };

            // Mock job recommendations with match scores
            const mockJobs = [
                {
                    id: "1",
                    title: "Software Engineer Intern",
                    company: "ABC Technology",
                    location: "Bangkok",
                    matchScore: 95,
                    requiredSkills: ["Python", "React", "Machine Learning"],
                    description: "Looking for passionate software engineering intern to join our AI team.",
                    salary: "15,000 - 20,000 THB/month"
                },
                {
                    id: "2",
                    title: "Data Analyst Intern",
                    company: "Digital Solutions Ltd.",
                    location: "Bangkok",
                    matchScore: 87,
                    requiredSkills: ["Python", "Data Analysis", "SQL"],
                    description: "Join our data analytics team and work on exciting projects.",
                    salary: "12,000 - 18,000 THB/month"
                },
                {
                    id: "3",
                    title: "Full Stack Developer Intern",
                    company: "Innovation Hub",
                    location: "Chiang Mai",
                    matchScore: 82,
                    requiredSkills: ["JavaScript", "React", "Node.js", "SQL"],
                    description: "Build modern web applications with cutting-edge technologies.",
                    salary: "14,000 - 19,000 THB/month"
                },
                {
                    id: "4",
                    title: "Frontend Developer Intern",
                    company: "Creative Agency",
                    location: "Bangkok",
                    matchScore: 75,
                    requiredSkills: ["JavaScript", "React", "CSS"],
                    description: "Create beautiful user interfaces for our clients.",
                    salary: "10,000 - 15,000 THB/month"
                },
                {
                    id: "5",
                    title: "Backend Developer Intern",
                    company: "FinTech Startup",
                    location: "Bangkok",
                    matchScore: 68,
                    requiredSkills: ["Python", "Node.js", "SQL", "Docker"],
                    description: "Work on scalable backend systems for financial applications.",
                    salary: "13,000 - 17,000 THB/month"
                },
                {
                    id: "6",
                    title: "DevOps Intern",
                    company: "Cloud Services Co.",
                    location: "Bangkok",
                    matchScore: 55,
                    requiredSkills: ["Docker", "AWS", "Git", "Linux"],
                    description: "Learn DevOps practices and cloud infrastructure management.",
                    salary: "11,000 - 16,000 THB/month"
                }
            ];

            // Filter jobs: only show >= 50% match
            const filteredJobs = mockJobs.filter(job => job.matchScore >= 50);

            setAnalysisResult(mockAnalysis);
            setJobRecommendations(filteredJobs);
            setIsAnalyzing(false);
        }, 2000);
    };

    // Handle file upload
    const handleFileUpload = (file) => {
        if (!file) return;

        // Validate file type
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
            alert('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('ไฟล์มีขนาดใหญ่เกิน 5MB');
            return;
        }

        setUploadedFile(file);
        analyzeResume(file);
    };

    // Drag and drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    // File input change handler
    const handleFileInputChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    // Get match indicator
    const getMatchIndicator = (score) => {
        if (score >= 80) return { emoji: '🟢', label: 'เหมาะสมมาก', color: '#10B981' };
        if (score >= 50) return { emoji: '🟡', label: 'พิจารณาได้', color: '#F59E0B' };
        return { emoji: '🔴', label: 'ไม่เหมาะสม', color: '#EF4444' };
    };

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="resume-upload-page">
            <div className="resume-upload-container">
                {/* Header */}
                <div className="page-header">
                    <h1>📄 อัปโหลด Resume ของคุณ</h1>
                    <p>ให้ AI วิเคราะห์และแนะนำงานที่เหมาะสมกับคุณ</p>
                </div>

                {/* Upload Section */}
                <div className="upload-section">
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
                            accept=".pdf,.docx"
                            onChange={handleFileInputChange}
                            style={{ display: 'none' }}
                        />

                        {!uploadedFile ? (
                            <>
                                <div className="upload-icon">📤</div>
                                <h3>Drag & Drop หรือคลิกเพื่ออัปโหลด</h3>
                                <p>รองรับ PDF เท่านั้น (สูงสุด 5MB)</p>
                            </>
                        ) : (
                            <>
                                <div className="upload-icon">✅</div>
                                <h3>{uploadedFile.name}</h3>
                                <p>ขนาด: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
                                <button
                                    className="btn-change-file"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setUploadedFile(null);
                                        setAnalysisResult(null);
                                        setJobRecommendations([]);
                                    }}
                                >
                                    เปลี่ยนไฟล์
                                </button>
                            </>
                        )}
                    </div>

                    {isAnalyzing && (
                        <div className="analyzing-indicator">
                            <div className="spinner"></div>
                            <p>🤖 AI กำลังวิเคราะห์ Resume ของคุณ...</p>
                        </div>
                    )}
                </div>

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
                                    <p>ปีที่จบการศึกษา: {analysisResult.education.year}</p>
                                </div>
                            </div>
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

                {/* Empty State */}
                {!uploadedFile && (
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
