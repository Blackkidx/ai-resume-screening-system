// frontend/src/components/HR/JobCreation.jsx - Fixed CSS classes
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import '../../styles/job-creation.css';

const JobCreation = () => {
  const { user, isAuthenticated } = useAuth();

// เพิ่มฟังก์ชันนี้
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? {
    'Authorization': `Bearer ${token}`
  } : {};
};
  const navigate = useNavigate();

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    job_type: 'Internship',
    work_mode: 'Onsite',
    location: '',
    salary_min: '',
    salary_max: '',
    requirements: [],
    skills_required: [],
    benefits: [],
    positions_available: 1,
    application_deadline: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [departments, setDepartments] = useState([]);
  
  // Input states for arrays
  const [requirementInput, setRequirementInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');

  // Constants
  const JOB_TYPES = [
    { value: 'Internship', label: 'Internship (ฝึกงาน)' },
    { value: 'Cooperative Education', label: 'Cooperative Education (สหกิจศึกษา)' },
    { value: 'Part-time', label: 'Part-time (งานพาร์ทไทม์)' },
    { value: 'Full-time', label: 'Full-time (งานเต็มเวลา)' },
    { value: 'Contract', label: 'Contract (งานสัญญาจ้าง)' }
  ];

  const WORK_MODES = [
    { value: 'Onsite', label: 'Onsite (ทำงานที่บริษัท)' },
    { value: 'Remote', label: 'Remote (ทำงานที่บ้าน)' },
    { value: 'Hybrid', label: 'Hybrid (ผสมผสาน)' }
  ];

  const DEPARTMENTS = [
    'Information Technology',
    'Marketing',
    'Sales', 
    'Human Resources',
    'Finance',
    'Engineering',
    'Design',
    'Operations'
  ];

  // Check permissions
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!user || (user.user_type !== 'HR' && user.user_type !== 'Admin')) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/');
      return;
    }

    setDepartments(DEPARTMENTS);
  }, [isAuthenticated, user, navigate]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle array inputs
  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementInput.trim()]
      }));
      setRequirementInput('');
    }
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        skills_required: [...prev.skills_required, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills_required: prev.skills_required.filter((_, i) => i !== index)
    }));
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()]
      }));
      setBenefitInput('');
    }
  };

  const removeBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('กรุณากรอกชื่อตำแหน่งงาน');
      return false;
    }
    if (!formData.description.trim()) {
      setError('กรุณากรอกรายละเอียดงาน');
      return false;
    }
    if (!formData.department) {
      setError('กรุณาเลือกแผนกงาน');
      return false;
    }
    if (!formData.location.trim()) {
      setError('กรุณากรอกสถานที่ทำงาน');
      return false;
    }
    if (formData.salary_min && formData.salary_max) {
      if (parseInt(formData.salary_min) > parseInt(formData.salary_max)) {
        setError('เงินเดือนขั้นต่ำต้องไม่มากกว่าเงินเดือนสูงสุด');
        return false;
      }
    }
    if (formData.application_deadline) {
      const deadline = new Date(formData.application_deadline);
      const now = new Date();
      if (deadline <= now) {
        setError('วันสุดท้ายของการสมัครต้องเป็นวันในอนาคต');
        return false;
      }
    }
    return true;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data for API
      const jobData = {
        ...formData,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        positions_available: parseInt(formData.positions_available),
        application_deadline: formData.application_deadline || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      const response = await fetch('http://localhost:8000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(jobData)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('สร้างตำแหน่งงานเรียบร้อยแล้ว!');
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          department: '',
          job_type: 'Internship',
          work_mode: 'Onsite',
          location: '',
          salary_min: '',
          salary_max: '',
          requirements: [],
          skills_required: [],
          benefits: [],
          positions_available: 1,
          application_deadline: '',
          start_date: '',
          end_date: '',
          is_active: true
        });

        // Auto navigate after 2 seconds
        setTimeout(() => {
          navigate('/hr/jobs');
        }, 2000);
      } else {
        setError(result.detail || 'เกิดข้อผิดพลาดในการสร้างตำแหน่งงาน');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-creation">
      <div className="job-creation-container">
        {/* Header */}
        <div className="job-creation-header">
          <button 
            className="btn-back"
            onClick={() => navigate('/hr/dashboard')}
            disabled={loading}
          >
            ← กลับ
          </button>
          <h1 className="job-creation-title">สร้างตำแหน่งฝึกงานใหม่</h1>
          <p className="job-creation-subtitle">กรอกข้อมูลตำแหน่งงานที่ต้องการเปิดรับสมัคร</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="message message-error">
            <span className="message-icon">⚠️</span>
            <span className="message-text">{error}</span>
            <button 
              className="message-close"
              onClick={() => setError('')}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="message message-success">
            <span className="message-icon">✅</span>
            <span className="message-text">{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="job-creation-form">
          <div className="form-sections">
            
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">ข้อมูลพื้นฐาน</h3>
              
              <div className="job-form-group">
                <label className="job-form-label required">ชื่อตำแหน่งงาน</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="job-form-input"
                  placeholder="เช่น Backend Developer Intern"
                  required
                />
              </div>

              <div className="job-form-group">
                <label className="job-form-label required">รายละเอียดงาน</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="job-form-textarea"
                  rows="6"
                  placeholder="อธิบายรายละเอียดงาน หน้าที่ความรับผิดชอบ และสิ่งที่นักศึกษาจะได้เรียนรู้..."
                  required
                />
              </div>

              <div className="job-form-row">
                <div className="job-form-group">
                  <label className="job-form-label required">แผนกงาน</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="job-form-select"
                    required
                  >
                    <option value="">เลือกแผนก</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="job-form-group">
                  <label className="job-form-label">ประเภทงาน</label>
                  <select
                    name="job_type"
                    value={formData.job_type}
                    onChange={handleInputChange}
                    className="job-form-select"
                  >
                    {JOB_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="job-form-row">
                <div className="job-form-group">
                  <label className="job-form-label">รูปแบบการทำงาน</label>
                  <select
                    name="work_mode"
                    value={formData.work_mode}
                    onChange={handleInputChange}
                    className="job-form-select"
                  >
                    {WORK_MODES.map(mode => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="job-form-group">
                  <label className="job-form-label required">สถานที่ทำงาน</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="job-form-input"
                    placeholder="เช่น กรุงเทพฯ, เชียงใหม่, ทำงานที่บ้าน"
                    required
                  />
                </div>
              </div>

              <div className="job-form-row">
                <div className="job-form-group">
                  <label className="job-form-label">เงินเดือนขั้นต่ำ (บาท)</label>
                  <input
                    type="number"
                    name="salary_min"
                    value={formData.salary_min}
                    onChange={handleInputChange}
                    className="job-form-input"
                    placeholder="15000"
                    min="0"
                  />
                </div>

                <div className="job-form-group">
                  <label className="job-form-label">เงินเดือนสูงสุด (บาท)</label>
                  <input
                    type="number"
                    name="salary_max"
                    value={formData.salary_max}
                    onChange={handleInputChange}
                    className="job-form-input"
                    placeholder="25000"
                    min="0"
                  />
                </div>

                <div className="job-form-group">
                  <label className="job-form-label">จำนวนตำแหน่ง</label>
                  <input
                    type="number"
                    name="positions_available"
                    value={formData.positions_available}
                    onChange={handleInputChange}
                    className="job-form-input"
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Requirements Section */}
            <div className="form-section">
              <h3 className="section-title">คุณสมบัติที่ต้องการ</h3>
              
              <div className="job-form-group">
                <label className="job-form-label">ข้อกำหนด/คุณสมบัติ</label>
                <div className="job-input-with-button">
                  <input
                    type="text"
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    className="job-form-input"
                    placeholder="เช่น ปริญญาตรี สาขาวิทยาการคอมพิวเตอร์หรือที่เกี่ยวข้อง"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  />
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="job-btn-add"
                    disabled={!requirementInput.trim()}
                  >
                    เพิ่ม
                  </button>
                </div>
                
                {formData.requirements.length > 0 && (
                  <div className="job-tag-list">
                    {formData.requirements.map((req, index) => (
                      <div key={index} className="job-tag">
                        <span>{req}</span>
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="job-tag-remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="job-form-group">
                <label className="job-form-label">ทักษะที่ต้องการ</label>
                <div className="job-input-with-button">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="job-form-input"
                    placeholder="เช่น Python, JavaScript, React, Communication"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="job-btn-add"
                    disabled={!skillInput.trim()}
                  >
                    เพิ่ม
                  </button>
                </div>
                
                {formData.skills_required.length > 0 && (
                  <div className="job-tag-list">
                    {formData.skills_required.map((skill, index) => (
                      <div key={index} className="job-tag job-tag-skill">
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="job-tag-remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="job-form-group">
                <label className="job-form-label">สวัสดิการ/ผลประโยชน์</label>
                <div className="job-input-with-button">
                  <input
                    type="text"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    className="job-form-input"
                    placeholder="เช่น ประกันสุขภาพ, ค่าเดินทาง, ฝึกอบรม"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  />
                  <button
                    type="button"
                    onClick={addBenefit}
                    className="job-btn-add"
                    disabled={!benefitInput.trim()}
                  >
                    เพิ่ม
                  </button>
                </div>
                
                {formData.benefits.length > 0 && (
                  <div className="job-tag-list">
                    {formData.benefits.map((benefit, index) => (
                      <div key={index} className="job-tag job-tag-benefit">
                        <span>{benefit}</span>
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="job-tag-remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dates Section */}
            <div className="form-section">
              <h3 className="section-title">วันที่สำคัญ</h3>
              
              <div className="job-form-row">
                <div className="job-form-group">
                  <label className="job-form-label">วันสุดท้ายของการสมัคร</label>
                  <input
                    type="datetime-local"
                    name="application_deadline"
                    value={formData.application_deadline}
                    onChange={handleInputChange}
                    className="job-form-input"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="job-form-group">
                  <label className="job-form-label">วันเริ่มงาน</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="job-form-input"
                  />
                </div>

                <div className="job-form-group">
                  <label className="job-form-label">วันสิ้นสุดงาน</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="job-form-input"
                    min={formData.start_date}
                  />
                </div>
              </div>

              <div className="job-form-group">
                <div className="job-checkbox-group">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="job-form-checkbox"
                  />
                  <label htmlFor="is_active" className="job-checkbox-label">
                    เปิดรับสมัครทันที
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="job-form-actions">
            <button
              type="button"
              onClick={() => navigate('/hr/dashboard')}
              className="job-btn job-btn-secondary"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="job-btn job-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>กำลังสร้าง...</span>
                </>
              ) : (
                'สร้างตำแหน่งงาน'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobCreation;