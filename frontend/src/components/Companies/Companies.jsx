// frontend/src/components/Companies/Companies.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import '../../styles/companies.css';

const Companies = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Load jobs on mount and when search changes
  useEffect(() => {
    loadJobs();
  }, [searchTerm]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = new URLSearchParams();
      queryParams.append('skip', '0');
      queryParams.append('limit', '50');
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/jobs?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลงานได้');
      }

      const data = await response.json();
      setJobs(data);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  const handleViewDetails = (jobId) => {
    if (!isAuthenticated()) {
      alert('กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดงาน');
      navigate('/login', { state: { from: { pathname: `/jobs/${jobId}` } } });
      return;
    }
    // Navigate to job details
    navigate(`/jobs/${jobId}`);
  };

  const handleApply = (jobId) => {
    if (!isAuthenticated()) {
      alert('กรุณาเข้าสู่ระบบเพื่อสมัครงาน');
      navigate('/login', { state: { from: { pathname: '/companies' } } });
      return;
    }
    // Navigate to application page
    navigate(`/jobs/${jobId}/apply`);
  };

  const handleContact = (jobId) => {
    if (!isAuthenticated()) {
      alert('กรุณาเข้าสู่ระบบเพื่อติดต่อบริษัท');
      navigate('/login', { state: { from: { pathname: '/companies' } } });
      return;
    }
    // Show contact information or open modal
    alert('ฟีเจอร์ติดต่อบริษัทกำลังพัฒนา');
  };

  if (loading) {
    return (
      <div className="companies-page">
        <div className="companies-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="companies-page">
      <div className="companies-container">
        <div className="companies-header">
          <h1 className="companies-title">บริษัททั้งหมด</h1>
          <p className="companies-subtitle">ค้นหาตำแหน่งงานฝึกงานที่เหมาะกับคุณ</p>
        </div>

        <form onSubmit={handleSearch} className="search-section">
          <input
            type="text"
            placeholder="ค้นหาบริษัท, ตำแหน่งงาน..."
            className="search-input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="search-button">
            ค้นหา
          </button>
        </form>

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={loadJobs} className="retry-button">
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="no-results">
            <p>😕 ไม่พบตำแหน่งงานที่คุณค้นหา</p>
            {searchTerm && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSearchInput('');
                }}
                className="clear-search-button"
              >
                แสดงทั้งหมด
              </button>
            )}
          </div>
        )}

        <div className="companies-grid">
          {jobs.map((job) => (
            <div key={job.id} className="company-card">
              <div className="company-header">
                <h3 className="company-name">{job.company_name}</h3>
                <span className={`status ${job.is_active ? 'open' : 'closed'}`}>
                  {job.is_active ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                </span>
              </div>
              
              <div className="company-details">
                <h4 className="position">{job.title}</h4>
                
                {job.location && (
                  <p className="location">📍 {job.location}</p>
                )}
                
                {job.salary_min && job.salary_max && (
                  <p className="salary">
                    💰 {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} บาท/เดือน
                  </p>
                )}
                
                {job.job_type && (
                  <p className="job-type">
                    💼 {job.job_type}
                  </p>
                )}
                
                {job.description && (
                  <p className="description">
                    {job.description.length > 100 
                      ? `${job.description.substring(0, 100)}...` 
                      : job.description}
                  </p>
                )}
                
                {job.applications_count !== undefined && (
                  <p className="applications">
                    👥 ผู้สมัคร: {job.applications_count} คน
                  </p>
                )}
              </div>
              
              <div className="company-actions">
                <button 
                  className="view-details-button"
                  onClick={() => handleViewDetails(job.id)}
                >
                  ดูรายละเอียด
                </button>
                
                {job.is_active ? (
                  <button 
                    className="apply-button"
                    onClick={() => handleApply(job.id)}
                  >
                    สมัครงาน
                  </button>
                ) : (
                  <button className="apply-button disabled" disabled>
                    ปิดรับสมัคร
                  </button>
                )}
                
                <button 
                  className="contact-button"
                  onClick={() => handleContact(job.id)}
                >
                  ติดต่อ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Companies;