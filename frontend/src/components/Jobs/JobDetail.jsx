// frontend/src/components/Jobs/JobDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import jobService from '../../services/jobService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import '../../styles/jobDetail.css';

const API_BASE_URL = 'http://localhost:8000';

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchAnalysis, setMatchAnalysis] = useState(null);
  const [analyzingMatch, setAnalyzingMatch] = useState(false);

  // Apply Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Cert Upload State
  const [certFiles, setCertFiles] = useState([]);      // raw File objects
  const [certUrls, setCertUrls] = useState([]);         // uploaded URLs
  const [uploadingCerts, setUploadingCerts] = useState(false);
  const [certDragging, setCertDragging] = useState(false);
  const certInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: `/jobs/${jobId}` } } });
      return;
    }
    loadJobDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, isAuthenticated, navigate]);

  const loadJobDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await jobService.getJobById(jobId);
      if (result.success) setJob(result.data);
      else setError(result.error);
    } catch {
      setError('ไม่สามารถโหลดข้อมูลงานได้');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMatch = async () => {
    try {
      setAnalyzingMatch(true);
      const result = await jobService.analyzeMatch(jobId);
      if (result.success) setMatchAnalysis(result.data);
      else alert(result.error);
    } catch {
      alert('ไม่สามารถวิเคราะห์ความเหมาะสมได้');
    } finally {
      setAnalyzingMatch(false);
    }
  };

  // ─── Cert Upload Logic ────────────────────────────────────────────
  const addCertFiles = (files) => {
    const arr = Array.from(files);
    const valid = arr.filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext) && f.size <= 10 * 1024 * 1024;
    });
    if (certFiles.length + valid.length > 3) {
      alert('สามารถแนบใบเซอร์ได้สูงสุด 3 ไฟล์');
      return;
    }
    setCertFiles(prev => [...prev, ...valid]);
  };

  const removeCertFile = (index) => {
    setCertFiles(prev => prev.filter((_, i) => i !== index));
    setCertUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadCerts = async () => {
    if (!certFiles.length) return [];
    setUploadingCerts(true);
    const token = sessionStorage.getItem('auth_token');
    const uploaded = [];

    for (const file of certFiles) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API_BASE_URL}/api/resumes/upload-cert`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (res.ok) {
          const data = await res.json();
          uploaded.push(data.file_url);
        }
      } catch (e) {
        console.error('Cert upload error:', e);
      }
    }

    setCertUrls(uploaded);
    setUploadingCerts(false);
    return uploaded;
  };

  // ─── Apply Job ────────────────────────────────────────────────────
  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      const urls = await uploadCerts();
      const result = await jobService.applyJob(jobId, {
        cover_letter: coverLetter,
        portfolio_url: portfolioUrl,
        certificate_urls: urls,
      });
      if (result.success) {
        setApplySuccess(true);
        setTimeout(() => {
          setShowApplyModal(false);
          setApplySuccess(false);
          navigate('/student/applications');
        }, 2000);
      } else {
        alert(result.error || 'สมัครงานไม่สำเร็จ');
      }
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setApplying(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    );
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  };

  if (loading) return <div className="job-detail-page"><div className="job-detail-container"><LoadingSpinner /></div></div>;

  if (error || !job) return (
    <div className="job-detail-page">
      <div className="job-detail-container">
        <div className="error-message">
          <p>❌ {error || 'ไม่พบข้อมูลงาน'}</p>
          <button onClick={() => navigate('/companies')} className="back-button">กลับไปหน้ารายการงาน</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="job-detail-page">
      <div className="job-detail-container">
        <button onClick={() => navigate('/companies')} className="back-button">← กลับ</button>

        {/* Job Header */}
        <div className="job-header">
          <div className="job-header-content">
            <h1 className="job-title">{job.title}</h1>
            <h2 className="company-name">{job.company_name}</h2>
            <span className={`job-status ${job.is_active ? 'active' : 'inactive'}`}>
              {job.is_active ? '🟢 เปิดรับสมัคร' : '🔴 ปิดรับสมัคร'}
            </span>
          </div>

          {user?.user_type === 'Student' && job.is_active && (
            <div className="job-header-actions">
              <button onClick={handleAnalyzeMatch} className="analyze-button" disabled={analyzingMatch}>
                {analyzingMatch ? '⏳ กำลังวิเคราะห์...' : '🔍 วิเคราะห์ความเหมาะสม'}
              </button>
              <button onClick={() => setShowApplyModal(true)} className="apply-button-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                สมัครงานนี้
              </button>
            </div>
          )}
        </div>

        {/* Match Analysis */}
        {matchAnalysis && (
          <div className={`match-analysis ${matchAnalysis.match_level}`}>
            <h3>
              {matchAnalysis.match_level === 'high' && '🟢 เหมาะสมมาก'}
              {matchAnalysis.match_level === 'medium' && '🟡 เหมาะสมพอใช้'}
              {matchAnalysis.match_level === 'low' && '🔴 ไม่ค่อยเหมาะสม'}
            </h3>
            <p className="match-score">คะแนนความเหมาะสม: {matchAnalysis.score}%</p>
            <p className="match-reason">{matchAnalysis.reason}</p>
          </div>
        )}

        {/* Job Info Grid */}
        <div className="job-info-grid">
          <div className="info-card"><h3>📍 สถานที่ทำงาน</h3><p>{job.location || 'ไม่ระบุ'}</p></div>
          <div className="info-card">
            <h3>💰 เบี้ยเลี้ยง</h3>
            <p>{job.allowance_amount ? `${job.allowance_amount.toLocaleString()} ${job.allowance_type === 'daily' ? 'บาท/วัน' : 'บาท/เดือน'}` : 'ตามตกลง'}</p>
          </div>
          <div className="info-card"><h3>💼 ประเภทงาน</h3><p>{job.job_type || 'ฝึกงาน'}</p></div>
          <div className="info-card"><h3>👥 จำนวนผู้สมัคร</h3><p>{job.applications_count || 0} คน</p></div>
        </div>

        {job.description && <div className="job-section"><h3>📋 รายละเอียดงาน</h3><p>{job.description}</p></div>}
        {job.requirements?.length > 0 && (
          <div className="job-section"><h3>✅ คุณสมบัติที่ต้องการ</h3><ul>{job.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
        )}
        {job.required_skills?.length > 0 && (
          <div className="job-section"><h3>🎯 ทักษะที่ต้องการ</h3>
            <div className="skills-container">{job.required_skills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}</div>
          </div>
        )}
        {job.responsibilities?.length > 0 && (
          <div className="job-section"><h3>📌 หน้าที่ความรับผิดชอบ</h3><ul>{job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
        )}
        {job.benefits?.length > 0 && (
          <div className="job-section"><h3>🎁 สวัสดิการ</h3><ul>{job.benefits.map((b, i) => <li key={i}>{b}</li>)}</ul></div>
        )}
        {(job.contact_email || job.contact_phone) && (
          <div className="job-section contact-section"><h3>📞 ติดต่อสอบถาม</h3>
            {job.contact_email && <p>📧 Email: <a href={`mailto:${job.contact_email}`}>{job.contact_email}</a></p>}
            {job.contact_phone && <p>📱 โทร: <a href={`tel:${job.contact_phone}`}>{job.contact_phone}</a></p>}
          </div>
        )}

        {user?.user_type === 'Student' && job.is_active && (
          <div className="apply-section">
            <button onClick={() => setShowApplyModal(true)} className="apply-button-large">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              สมัครงานนี้เลย
            </button>
          </div>
        )}
      </div>

      {/* ─── APPLY MODAL ─────────────────────────────────────────── */}
      {showApplyModal && (
        <div className="apply-modal-overlay" onClick={() => !applying && setShowApplyModal(false)}>
          <div className="apply-modal" onClick={e => e.stopPropagation()}>

            {applySuccess ? (
              <div className="apply-success-state">
                <div className="success-icon-wrapper">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3>สมัครงานสำเร็จ!</h3>
                <p>AI กำลังประมวลผลใบสมัครของคุณ</p>
              </div>
            ) : (
              <>
                <div className="apply-modal-header">
                  <div>
                    <h3>สมัครงาน</h3>
                    <p className="apply-modal-subtitle">{job.title} · {job.company_name}</p>
                  </div>
                  <button className="apply-modal-close" onClick={() => setShowApplyModal(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleApply} className="apply-form">
                  {/* Cover Letter */}
                  <div className="apply-field">
                    <label>จดหมายแนะนำตัว <span className="optional-tag">ไม่บังคับ</span></label>
                    <textarea
                      rows={4}
                      placeholder="เล่าถึงแรงบันดาลใจในการสมัครงานนี้..."
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)}
                      maxLength={1500}
                    />
                    <span className="char-count">{coverLetter.length}/1500</span>
                  </div>

                  {/* Portfolio URL */}
                  <div className="apply-field">
                    <label>Portfolio URL <span className="optional-tag">ไม่บังคับ</span></label>
                    <input
                      type="url"
                      placeholder="https://github.com/yourname หรือ portfolio ของคุณ"
                      value={portfolioUrl}
                      onChange={e => setPortfolioUrl(e.target.value)}
                    />
                  </div>

                  {/* Certificate Upload */}
                  <div className="apply-field">
                    <label>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                        <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                      </svg>
                      แนบใบ Certificate
                      <span className="optional-tag">ไม่บังคับ · สูงสุด 3 ไฟล์</span>
                    </label>

                    {certFiles.length < 3 && (
                      <div
                        className={`cert-dropzone ${certDragging ? 'dragging' : ''}`}
                        onDragEnter={e => { e.preventDefault(); setCertDragging(true); }}
                        onDragLeave={e => { e.preventDefault(); setCertDragging(false); }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); setCertDragging(false); addCertFiles(e.dataTransfer.files); }}
                        onClick={() => certInputRef.current?.click()}
                      >
                        <input
                          ref={certInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          multiple
                          style={{ display: 'none' }}
                          onChange={e => addCertFiles(e.target.files)}
                        />
                        <div className="cert-dropzone-icon">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </div>
                        <p className="cert-dropzone-text">ลากไฟล์มาวาง หรือ <span>คลิกเลือกไฟล์</span></p>
                        <p className="cert-dropzone-hint">JPG · PNG · PDF · WEBP (สูงสุด 10MB/ไฟล์)</p>
                      </div>
                    )}

                    {certFiles.length > 0 && (
                      <div className="cert-file-list">
                        {certFiles.map((file, i) => (
                          <div key={i} className="cert-file-item">
                            <div className="cert-file-icon">{getFileIcon(file.name)}</div>
                            <div className="cert-file-info">
                              <span className="cert-file-name">{file.name}</span>
                              <span className="cert-file-size">{formatSize(file.size)}</span>
                            </div>
                            <button
                              type="button"
                              className="cert-file-remove"
                              onClick={() => removeCertFile(i)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="cert-hint-text">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      HR จะเห็นใบเซอร์ของคุณเมื่อตรวจสอบใบสมัคร คะแนนยังคำนวณจาก Resume เหมือนเดิม
                    </p>
                  </div>

                  <div className="apply-modal-actions">
                    <button type="button" className="btn-cancel-apply" onClick={() => setShowApplyModal(false)}>
                      ยกเลิก
                    </button>
                    <button type="submit" className="btn-submit-apply" disabled={applying || uploadingCerts}>
                      {applying || uploadingCerts ? (
                        <>
                          <div className="btn-spinner" />
                          {uploadingCerts ? 'กำลังอัปโหลดใบเซอร์...' : 'กำลังส่งใบสมัคร...'}
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                          ส่งใบสมัคร
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;