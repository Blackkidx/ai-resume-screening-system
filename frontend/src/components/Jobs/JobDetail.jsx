// frontend/src/components/Jobs/JobDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import jobService from '../../services/jobService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import '../../styles/jobDetail.css';

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchAnalysis, setMatchAnalysis] = useState(null);
  const [analyzingMatch, setAnalyzingMatch] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: `/jobs/${jobId}` } } });
      return;
    }
    loadJobDetail();
  }, [jobId, isAuthenticated, navigate]);

  const loadJobDetail = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await jobService.getJobById(jobId);
      
      if (result.success) {
        setJob(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error loading job detail:', err);
      setError('ไม่สามารถโหลดข้อมูลงานได้');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMatch = async () => {
    try {
      setAnalyzingMatch(true);
      const result = await jobService.analyzeMatch(jobId);
      
      if (result.success) {
        setMatchAnalysis(result.data);
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error('Error analyzing match:', err);
      alert('ไม่สามารถวิเคราะห์ความเหมาะสมได้');
    } finally {
      setAnalyzingMatch(false);
    }
  };

  const handleApply = () => {
    navigate(`/jobs/${jobId}/apply`);
  };

  if (loading) {
    return (
      <div className="job-detail-page">
        <div className="job-detail-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-detail-page">
        <div className="job-detail-container">
          <div className="error-message">
            <p>❌ {error || 'ไม่พบข้อมูลงาน'}</p>
            <button onClick={() => navigate('/companies')} className="back-button">
              กลับไปหน้ารายการงาน
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      <div className="job-detail-container">
        {/* Back Button */}
        <button onClick={() => navigate('/companies')} className="back-button">
          ← กลับ
        </button>

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
              <button 
                onClick={handleAnalyzeMatch}
                className="analyze-button"
                disabled={analyzingMatch}
              >
                {analyzingMatch ? '⏳ กำลังวิเคราะห์...' : '🔍 วิเคราะห์ความเหมาะสม'}
              </button>
              <button 
                onClick={handleApply}
                className="apply-button-primary"
              >
                📝 สมัครงานนี้
              </button>
            </div>
          )}
        </div>

        {/* Match Analysis Result */}
        {matchAnalysis && (
          <div className={`match-analysis ${matchAnalysis.match_level}`}>
            <h3>
              {matchAnalysis.match_level === 'high' && '🟢 เหมาะสมมาก'}
              {matchAnalysis.match_level === 'medium' && '🟡 เหมาะสมพอใช้'}
              {matchAnalysis.match_level === 'low' && '🔴 ไม่ค่อยเหมาะสม'}
            </h3>
            <p className="match-score">คะแนนความเหมาะสม: {matchAnalysis.score}%</p>
            <p className="match-reason">{matchAnalysis.reason}</p>
            
            {matchAnalysis.missing_skills && matchAnalysis.missing_skills.length > 0 && (
              <div className="missing-skills">
                <h4>ทักษะที่ควรพัฒนา:</h4>
                <ul>
                  {matchAnalysis.missing_skills.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {matchAnalysis.recommendations && matchAnalysis.recommendations.length > 0 && (
              <div className="recommendations">
                <h4>คำแนะนำ:</h4>
                <ul>
                  {matchAnalysis.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Job Information Grid */}
        <div className="job-info-grid">
          <div className="info-card">
            <h3>📍 สถานที่ทำงาน</h3>
            <p>{job.location || 'ไม่ระบุ'}</p>
          </div>

          <div className="info-card">
            <h3>💰 เงินเดือน</h3>
            <p>
              {job.salary_min && job.salary_max
                ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} บาท/เดือน`
                : 'ตามตกลง'}
            </p>
          </div>

          <div className="info-card">
            <h3>💼 ประเภทงาน</h3>
            <p>{job.job_type || 'ฝึกงาน'}</p>
          </div>

          <div className="info-card">
            <h3>👥 จำนวนผู้สมัคร</h3>
            <p>{job.applications_count || 0} คน</p>
          </div>
        </div>

        {/* Job Description */}
        <div className="job-section">
          <h3>📋 รายละเอียดงาน</h3>
          <div className="job-description">
            {job.description ? (
              <p>{job.description}</p>
            ) : (
              <p className="no-data">ไม่มีรายละเอียด</p>
            )}
          </div>
        </div>

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="job-section">
            <h3>✅ คุณสมบัติที่ต้องการ</h3>
            <ul className="requirements-list">
              {job.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Required Skills */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div className="job-section">
            <h3>🎯 ทักษะที่ต้องการ</h3>
            <div className="skills-container">
              {job.required_skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <div className="job-section">
            <h3>📌 หน้าที่ความรับผิดชอบ</h3>
            <ul className="responsibilities-list">
              {job.responsibilities.map((resp, index) => (
                <li key={index}>{resp}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <div className="job-section">
            <h3>🎁 สวัสดิการ</h3>
            <ul className="benefits-list">
              {job.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact Information */}
        {(job.contact_email || job.contact_phone) && (
          <div className="job-section contact-section">
            <h3>📞 ติดต่อสอบถาม</h3>
            {job.contact_email && (
              <p>📧 Email: <a href={`mailto:${job.contact_email}`}>{job.contact_email}</a></p>
            )}
            {job.contact_phone && (
              <p>📱 โทร: <a href={`tel:${job.contact_phone}`}>{job.contact_phone}</a></p>
            )}
          </div>
        )}

        {/* Apply Button (Bottom) */}
        {user?.user_type === 'Student' && job.is_active && (
          <div className="apply-section">
            <button 
              onClick={handleApply}
              className="apply-button-large"
            >
              📝 สมัครงานนี้เลย
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail;