// frontend/src/components/HR/JobEdit.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';

const JOB_TYPES = [
    { value: 'Internship', label: 'Internship (ฝึกงาน)' },
    { value: 'Cooperative Education', label: 'Cooperative Education (สหกิจ)' },
    { value: 'Part-time', label: 'Part-time (พาร์ทไทม์)' },
    { value: 'Full-time', label: 'Full-time (เต็มเวลา)' },
    { value: 'Contract', label: 'Contract (สัญญาจ้าง)' }
];
const WORK_MODES = [
    { value: 'Onsite', label: 'Onsite (ที่บริษัท)' },
    { value: 'Remote', label: 'Remote (ที่บ้าน)' },
    { value: 'Hybrid', label: 'Hybrid (ผสมผสาน)' }
];
const DEPARTMENTS = ['Front-End Developer', 'Back-End Developer', 'Full-Stack Developer', 'Mobile Developer', 'Game Developer', 'Network Engineer', 'System Administrator', 'Cloud Engineer', 'Cybersecurity', 'IT Support', 'Data Analyst', 'AI / Machine Learning Engineer', 'Project Manager', 'Software Tester', 'Business Analyst'];

const inputCls = "w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white placeholder:text-slate-400 disabled:opacity-50";
const labelCls = "block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5";
const hintCls = "text-xs text-slate-400 mt-1";
const sectionCls = "bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5";

const TagInput = ({ label, hint, placeholder, required, tags, onAdd, onRemove, tagColor = 'sky' }) => {
    const [val, setVal] = useState('');
    const colors = { sky: 'bg-sky-50 border-sky-200 text-sky-700', indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700', emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700' };
    const cls = colors[tagColor] || colors.sky;
    return (
        <div>
            <label className={labelCls}>{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
            <div className="flex gap-2">
                <input className={inputCls} type="text" value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder}
                    onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); if (val.trim()) { onAdd(val.trim()); setVal(''); } } }} />
                <button type="button" className="shrink-0 rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-4 text-sm font-bold transition-colors disabled:opacity-40" disabled={!val.trim()} onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}>เพิ่ม</button>
            </div>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((t, i) => (
                        <span key={i} className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${cls}`}>
                            {t}
                            <button type="button" className="opacity-60 hover:opacity-100 leading-none" onClick={() => onRemove(i)}>×</button>
                        </span>
                    ))}
                </div>
            )}
            {hint && <p className={hintCls}>{hint}</p>}
        </div>
    );
};

const JobEdit = () => {
    const { jobId } = useParams();
    const { user, isAuthenticated } = useAuth();
    const notify = useNotification();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const adminCompanyId = searchParams.get('company_id');
    const isAdminView = user?.user_type === 'Admin' && !!adminCompanyId;
    const jobsPath = isAdminView ? `/hr/jobs?company_id=${adminCompanyId}` : '/hr/jobs';

    const getAuthHeaders = () => {
        const token = sessionStorage.getItem('auth_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const [formData, setFormData] = useState({
        title: '', description: '', department: '', job_type: 'Internship', work_mode: 'Onsite',
        location: '', allowance_amount: '', allowance_type: 'monthly', requirements: [],
        skills_required: [], majors: [], min_gpa: '', year_level: [], experience_required: 0,
        positions_available: 1, application_deadline: '', start_date: '', end_date: '', is_active: true
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) { navigate('/login'); return; }
        if (!user || !['HR', 'Admin'].includes(user.user_type)) { notify.error('ไม่มีสิทธิ์เข้าถึง'); navigate('/'); return; }
        loadJobData();
    }, [isAuthenticated, user, navigate, jobId]);

    const loadJobData = async () => {
        try {
            setLoading(true); setError('');
            const res = await fetch(`http://172.18.148.97:8000/api/jobs/${jobId}`, { headers: getAuthHeaders() });
            if (res.ok) {
                const job = await res.json();
                setFormData({
                    title: job.title || '', description: job.description || '', department: job.department || '',
                    job_type: job.job_type || 'Internship', work_mode: job.work_mode || 'Onsite', location: job.location || '',
                    allowance_amount: job.allowance_amount || '', allowance_type: job.allowance_type || 'monthly',
                    requirements: job.requirements || [], skills_required: job.skills_required || [], majors: job.majors || [],
                    min_gpa: job.min_gpa || '', year_level: job.year_level || [], experience_required: job.experience_required || 0,
                    positions_available: job.positions_available || 1,
                    application_deadline: job.application_deadline ? job.application_deadline.slice(0, 16) : '',
                    start_date: job.start_date ? job.start_date.split('T')[0] : '',
                    end_date: job.end_date ? job.end_date.split('T')[0] : '',
                    is_active: job.is_active !== undefined ? job.is_active : true
                });
            } else {
                const d = await res.json();
                setError(d.detail || 'ไม่สามารถโหลดข้อมูลงานได้');
            }
        } catch (err) { setError('เกิดข้อผิดพลาดในการโหลดข้อมูลงาน'); }
        finally { setLoading(false); }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleYearLevelChange = (year) => {
        setFormData(prev => {
            const arr = [...prev.year_level]; const i = arr.indexOf(year);
            if (i > -1) arr.splice(i, 1); else arr.push(year);
            return { ...prev, year_level: arr.sort() };
        });
    };

    const validateForm = () => {
        if (!formData.title.trim() || formData.title.trim().length < 5) { setError('ชื่อตำแหน่งงานต้องมีอย่างน้อย 5 ตัวอักษร'); return false; }
        if (!formData.description.trim() || formData.description.trim().length < 20) { setError('รายละเอียดงานต้องมีอย่างน้อย 20 ตัวอักษร'); return false; }
        if (!formData.department) { setError('กรุณาเลือกแผนกงาน'); return false; }
        if (!formData.location.trim()) { setError('กรุณากรอกสถานที่ทำงาน'); return false; }
        if (!formData.skills_required.length) { setError('กรุณาเพิ่มทักษะที่ต้องการอย่างน้อย 1 ทักษะ'); return false; }
        if (formData.min_gpa && (parseFloat(formData.min_gpa) < 0 || parseFloat(formData.min_gpa) > 4.0)) { setError('GPA ต้องอยู่ระหว่าง 0.00 - 4.00'); return false; }
        if (formData.application_deadline && new Date(formData.application_deadline) <= new Date()) { setError('วันสุดท้ายของการสมัครต้องเป็นวันในอนาคต'); return false; }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSubmitting(true); setError('');
        try {
            const student_levels = formData.year_level.map(y => `ปี ${y}`);
            const jobData = {
                title: formData.title.trim(), description: formData.description.trim(), department: formData.department,
                job_type: formData.job_type, work_mode: formData.work_mode, location: formData.location.trim(),
                allowance_amount: formData.allowance_amount ? parseInt(formData.allowance_amount) : null,
                allowance_type: formData.allowance_type, requirements: formData.requirements,
                majors: formData.majors.length > 0 ? formData.majors : ['ทุกสาขา'],
                min_gpa: formData.min_gpa ? parseFloat(formData.min_gpa) : null,
                student_levels: student_levels.length > 0 ? student_levels : ['ปี 3', 'ปี 4'],
                experience_required: parseInt(formData.experience_required) || 0,
                positions_available: parseInt(formData.positions_available) || 1,
                application_deadline: formData.application_deadline || null,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null
            };
            if (formData.skills_required?.length > 0) jobData.skills_required = formData.skills_required;

            const res = await fetch(`http://172.18.148.97:8000/api/jobs/${jobId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(jobData) });
            const result = await res.json();

            if (res.ok) {
                setSuccess('อัปเดตตำแหน่งงานเรียบร้อยแล้ว');
                setTimeout(() => navigate(jobsPath), 1500);
            } else {
                let msg = 'เกิดข้อผิดพลาด';
                if (result.detail) {
                    if (typeof result.detail === 'string') msg = result.detail;
                    else if (Array.isArray(result.detail)) msg = result.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
                    else msg = JSON.stringify(result.detail);
                }
                setError(msg);
            }
        } catch (err) { setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message); }
        finally { setSubmitting(false); }
    };

    const Field = ({ label, required, hint, children }) => (
        <div>
            <label className={labelCls}>{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
            {children}
            {hint && <p className={hintCls}>{hint}</p>}
        </div>
    );

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <LoadingSpinner size="large" message="กำลังโหลดข้อมูลงาน..." />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <button className="p-2 -ml-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0 mt-0.5" onClick={() => navigate(jobsPath)} disabled={submitting}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">แก้ไขตำแหน่งงาน</h1>
                        <p className="text-sm text-slate-500 mt-0.5">แก้ไขรายละเอียดตำแหน่งฝึกงานของบริษัท</p>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5 text-sm text-rose-700 animate-fadeInUp" style={{ animationFillMode: 'both' }}>
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        <span className="flex-1">{error}</span>
                        <button className="text-rose-500 hover:text-rose-700 shrink-0" onClick={() => setError('')}>×</button>
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5 text-sm text-emerald-700 animate-fadeInUp" style={{ animationFillMode: 'both' }}>
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Basic Info */}
                    <div className={sectionCls}>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">ข้อมูลพื้นฐาน</h3>
                        <Field label="ชื่อตำแหน่งงาน" required hint={`${formData.title.length}/5 ตัวอักษรขั้นต่ำ${formData.title.length > 0 && formData.title.length < 5 ? ` (ต้องการอีก ${5 - formData.title.length} ตัว)` : ''}`}>
                            <input className={inputCls} type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="เช่น นักพัฒนาเว็บไซต์" required />
                        </Field>
                        <Field label="รายละเอียดงาน" required hint={`${formData.description.length}/20 ตัวอักษรขั้นต่ำ`}>
                            <textarea className={inputCls + ' resize-none'} name="description" value={formData.description} onChange={handleInputChange} rows={5} placeholder="อธิบายรายละเอียดงาน หน้าที่ความรับผิดชอบ..." required />
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="แผนกงาน" required>
                                <select className={inputCls} name="department" value={formData.department} onChange={handleInputChange} required>
                                    <option value="">เลือกแผนก</option>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </Field>
                            <Field label="ประเภทงาน">
                                <select className={inputCls} name="job_type" value={formData.job_type} onChange={handleInputChange}>
                                    {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </Field>
                            <Field label="รูปแบบการทำงาน">
                                <select className={inputCls} name="work_mode" value={formData.work_mode} onChange={handleInputChange}>
                                    {WORK_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </Field>
                            <Field label="สถานที่ทำงาน" required>
                                <input className={inputCls} type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="เช่น กรุงเทพฯ, เชียงใหม่" required />
                            </Field>
                            <Field label="เบี้ยเลี้ยง" hint="เว้นว่างถ้าไม่มี">
                                <input className={inputCls} type="number" name="allowance_amount" value={formData.allowance_amount} onChange={handleInputChange} placeholder="5000" min="0" />
                            </Field>
                            <Field label="ประเภทเบี้ยเลี้ยง">
                                <select className={inputCls} name="allowance_type" value={formData.allowance_type} onChange={handleInputChange}>
                                    <option value="monthly">ต่อเดือน (Monthly)</option>
                                    <option value="daily">ต่อวัน (Daily)</option>
                                </select>
                            </Field>
                            <Field label="จำนวนตำแหน่ง">
                                <input className={inputCls} type="number" name="positions_available" value={formData.positions_available} onChange={handleInputChange} min="1" max="100" required />
                            </Field>
                        </div>
                    </div>

                    {/* Requirements */}
                    <div className={sectionCls}>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">คุณสมบัติที่ต้องการ</h3>
                        <TagInput label="ข้อกำหนด/คุณสมบัติ" placeholder="เช่น ปริญญาตรี สาขาวิทยาการคอมพิวเตอร์" tags={formData.requirements} onAdd={v => setFormData(p => ({ ...p, requirements: [...p.requirements, v] }))} onRemove={i => setFormData(p => ({ ...p, requirements: p.requirements.filter((_, x) => x !== i) }))} tagColor="indigo" />
                        <TagInput label="ทักษะที่ต้องการ" required placeholder="เช่น Python, JavaScript, React" tags={formData.skills_required} onAdd={v => setFormData(p => ({ ...p, skills_required: [...p.skills_required, v] }))} onRemove={i => setFormData(p => ({ ...p, skills_required: p.skills_required.filter((_, x) => x !== i) }))} hint={formData.skills_required.length === 0 ? 'ต้องเพิ่มอย่างน้อย 1 ทักษะ' : ''} tagColor="sky" />
                        <TagInput label="สาขาที่รับ" hint="เว้นว่างเพื่อรับทุกสาขา" placeholder="เช่น วิศวกรรมคอมพิวเตอร์" tags={formData.majors} onAdd={v => setFormData(p => ({ ...p, majors: [...p.majors, v] }))} onRemove={i => setFormData(p => ({ ...p, majors: p.majors.filter((_, x) => x !== i) }))} tagColor="emerald" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="GPA ขั้นต่ำ" hint="0.00 - 4.00 (เว้นว่างถ้าไม่กำหนด)">
                                <input className={inputCls} type="number" name="min_gpa" value={formData.min_gpa} onChange={handleInputChange} placeholder="2.50" min="0" max="4" step="0.01" />
                            </Field>
                            <Field label="ประสบการณ์ (ปี)" hint="0 = ไม่ต้องมีประสบการณ์">
                                <input className={inputCls} type="number" name="experience_required" value={formData.experience_required} onChange={handleInputChange} min="0" max="10" />
                            </Field>
                        </div>
                        <div>
                            <label className={labelCls}>ชั้นปีที่รับ <span className="text-slate-400 normal-case font-normal">(ไม่เลือก = รับทุกชั้นปี)</span></label>
                            <div className="flex flex-wrap gap-3">
                                {[1, 2, 3, 4].map(year => (
                                    <label key={year} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                        <input type="checkbox" checked={formData.year_level.includes(year)} onChange={() => handleYearLevelChange(year)} className="h-4 w-4 accent-sky-600 rounded" />
                                        ปี {year}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className={sectionCls}>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">วันที่สำคัญ</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Field label="วันสุดท้ายรับสมัคร">
                                <input className={inputCls} type="datetime-local" name="application_deadline" value={formData.application_deadline} onChange={handleInputChange} min={new Date().toISOString().slice(0, 16)} />
                            </Field>
                            <Field label="วันเริ่มงาน">
                                <input className={inputCls} type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} />
                            </Field>
                            <Field label="วันสิ้นสุดงาน">
                                <input className={inputCls} type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} min={formData.start_date} />
                            </Field>
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none font-medium text-slate-700">
                            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="h-4 w-4 accent-sky-600 rounded" />
                            เปิดรับสมัครทันที
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button type="button" className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50" disabled={submitting} onClick={() => navigate('/hr/jobs')}>ยกเลิก</button>
                        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 text-sm font-bold transition-colors disabled:opacity-50" disabled={submitting}>
                            {submitting ? <><LoadingSpinner size="small" /> กำลังบันทึก...</> : 'บันทึกการเปลี่ยนแปลง'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobEdit;
