// frontend/src/components/HR/JobCreation.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import '../../styles/job-creation.css';

const JobCreation = () => {
  const { user, isAuthenticated } = useAuth();

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('auth_token');
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
    allowance_amount: '',
    allowance_type: 'monthly',
    requirements: [],
    skills_required: [],
    majors: [],
    min_gpa: '',
    year_level: [],
    experience_required: 0,
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
  const [majorInput, setMajorInput] = useState('');

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
    'Front-End Developer',
    'Back-End Developer',
    'Full-Stack Developer',
    'Mobile Developer',
    'Game Developer',
    'Network Engineer',
    'System Administrator',
    'Cloud Engineer',
    'Cybersecurity',
    'IT Support',
    'Data Analyst',
    'AI / Machine Learning Engineer',
    'Project Manager',
    'Software Tester',
    'Business Analyst'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const addMajor = () => {
    if (majorInput.trim()) {
      setFormData(prev => ({
        ...prev,
        majors: [...prev.majors, majorInput.trim()]
      }));
      setMajorInput('');
    }
  };

  const removeMajor = (index) => {
    setFormData(prev => ({
      ...prev,
      majors: prev.majors.filter((_, i) => i !== index)
    }));
  };

  const handleYearLevelChange = (year) => {
    setFormData(prev => {
      const yearLevels = [...prev.year_level];
      const index = yearLevels.indexOf(year);
      if (index > -1) {
        yearLevels.splice(index, 1);
      } else {
        yearLevels.push(year);
      }
      return { ...prev, year_level: yearLevels.sort() };
    });
  };

  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('กรุณากรอกชื่อตำแหน่งงาน');
      return false;
    }
    if (formData.title.trim().length < 5) {
      setError('ชื่อตำแหน่งงานต้องมีอย่างน้อย 5 ตัวอักษร');
      return false;
    }
    if (!formData.description.trim()) {
      setError('กรุณากรอกรายละเอียดงาน');
      return false;
    }
    if (formData.description.trim().length < 20) {
      setError('รายละเอียดงานต้องมีอย่างน้อย 20 ตัวอักษร');
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
    if (formData.skills_required.length === 0) {
      setError('กรุณาเพิ่มทักษะที่ต้องการอย่างน้อย 1 ทักษะ');
      return false;
    }
    if (formData.min_gpa && (parseFloat(formData.min_gpa) < 0 || parseFloat(formData.min_gpa) > 4.0)) {
      setError('GPA ต้องอยู่ระหว่าง 0.00 - 4.00');
      return false;
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
        allowance_amount: formData.allowance_amount ? parseInt(formData.allowance_amount) : null,
        min_gpa: formData.min_gpa ? parseFloat(formData.min_gpa) : null,
        experience_required: parseInt(formData.experience_required) || 0,
        positions_available: parseInt(formData.positions_available),
        application_deadline: formData.application_deadline || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        // Convert year_level to student_levels for backend
        student_levels: formData.year_level.length > 0
          ? formData.year_level.map(y => `ปี ${y}`)
          : ["ปี 3", "ปี 4"]
      };

      // Remove year_level from jobData (backend doesn't use it)
      delete jobData.year_level;

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
          allowance_amount: '',
          allowance_type: 'monthly',
          requirements: [],
          skills_required: [],
          majors: [],
          min_gpa: '',
          year_level: [],
          experience_required: 0,
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
        // Handle error response

        // Extract error message
        let errorMessage = 'เกิดข้อผิดพลาดในการสร้างตำแหน่งงาน';

        if (result.detail) {
          // If detail is a string
          if (typeof result.detail === 'string') {
            errorMessage = result.detail;
          }
          // If detail is an array (validation errors)
          else if (Array.isArray(result.detail)) {
            errorMessage = result.detail.map(err => {
              if (typeof err === 'object' && err.msg) {
                return `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`;
              }
              return JSON.stringify(err);
            }).join(', ');
          }
          // If detail is an object
          else if (typeof result.detail === 'object') {
            errorMessage = JSON.stringify(result.detail);
          }
        }

        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error creating job:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์: ' + error.message);
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
                  placeholder="เช่น นักพัฒนาเว็บไซต์, นักวิเคราะห์ข้อมูล"
                  required
                />
                <small className={`job-form-hint ${formData.title.length < 5 ? 'text-warning' : 'text-success'}`}>
                  {formData.title.length}/5 ตัวอักษรขั้นต่ำ
                  {formData.title.length < 5 && formData.title.length > 0 && ' (ต้องการอีก ' + (5 - formData.title.length) + ' ตัวอักษร)'}
                </small>
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
                <small className={`job-form-hint ${formData.description.length < 20 ? 'text-warning' : 'text-success'}`}>
                  {formData.description.length}/20 ตัวอักษรขั้นต่ำ
                  {formData.description.length < 20 && formData.description.length > 0 && ' (ต้องการอีก ' + (20 - formData.description.length) + ' ตัวอักษร)'}
                </small>
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
                  <label className="job-form-label">เบี้ยเลี้ยง (Allowance)</label>
                  <input
                    type="number"
                    name="allowance_amount"
                    value={formData.allowance_amount}
                    onChange={handleInputChange}
                    className="job-form-input"
                    placeholder="5000"
                    min="0"
                  />
                  <small className="job-form-hint">ระบุจำนวนเบี้ยเลี้ยง หรือเว้นว่างไว้ถ้าไม่มี</small>
                </div>

                <div className="job-form-group">
                  <label className="job-form-label">ประเภทเบี้ยเลี้ยง</label>
                  <select
                    name="allowance_type"
                    value={formData.allowance_type}
                    onChange={handleInputChange}
                    className="job-form-select"
                  >
                    <option value="monthly">ต่อเดือน (Monthly)</option>
                    <option value="daily">ต่อวัน (Daily)</option>
                  </select>
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
                <label className="job-form-label">สาขาที่รับ (Majors)</label>
                <div className="job-input-with-button">
                  <input
                    type="text"
                    value={majorInput}
                    onChange={(e) => setMajorInput(e.target.value)}
                    className="job-form-input"
                    placeholder="เช่น วิศวกรรมคอมพิวเตอร์, วิทยาการคอมพิวเตอร์"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMajor())}
                  />
                  <button
                    type="button"
                    onClick={addMajor}
                    className="job-btn-add"
                    disabled={!majorInput.trim()}
                  >
                    เพิ่ม
                  </button>
                </div>

                {formData.majors.length > 0 && (
                  <div className="job-tag-list">
                    {formData.majors.map((major, index) => (
                      <div key={index} className="job-tag">
                        <span>{major}</span>
                        <button
                          type="button"
                          onClick={() => removeMajor(index)}
                          className="job-tag-remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <small className="job-form-hint">ระบุสาขาที่รับ หรือเว้นว่างไว้เพื่อรับทุกสาขา</small>
              </div>

              <div className="job-form-row">
                <div className="job-form-group">
                  <label className="job-form-label">GPA ขั้นต่ำ (Min GPA)</label>
                  <input
                    type="number"
                    name="min_gpa"
                    value={formData.min_gpa}
                    onChange={handleInputChange}
                    className="job-form-input"
                    placeholder="2.50"
                    min="0"
                    max="4"
                    step="0.01"
                  />
                  <small className="job-form-hint">ระบุ GPA ขั้นต่ำ (0.00 - 4.00) หรือเว้นว่างไว้</small>
                </div>

                <div className="job-form-group">
                  <label className="job-form-label">ประสบการณ์ที่ต้องการ (ปี)</label>
                  <input
                    type="number"
                    name="experience_required"
                    value={formData.experience_required}
                    onChange={handleInputChange}
                    className="job-form-input"
                    placeholder="0"
                    min="0"
                    max="10"
                  />
                  <small className="job-form-hint">จำนวนปีประสบการณ์ที่ต้องการ (0 = ไม่ต้องมีประสบการณ์)</small>
                </div>
              </div>

              <div className="job-form-group">
                <label className="job-form-label">ชั้นปีที่รับ (Year Level)</label>
                <div className="job-checkbox-group" style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  {[1, 2, 3, 4].map(year => (
                    <label key={year} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.year_level.includes(year)}
                        onChange={() => handleYearLevelChange(year)}
                        className="job-form-checkbox"
                      />
                      <span>ปี {year}</span>
                    </label>
                  ))}
                </div>
                <small className="job-form-hint">เลือกชั้นปีที่รับสมัคร (ไม่เลือก = รับทุกชั้นปี)</small>
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