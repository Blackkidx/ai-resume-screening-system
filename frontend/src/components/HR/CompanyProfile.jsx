// frontend/src/components/HR/CompanyProfile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import companyService from '../../services/companyService';
import { API_BASE_URL } from '../../config';

const CompanyProfile = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const notify = useNotification();
    const logoInputRef = useRef(null);

    const adminCompanyId = searchParams.get('company_id');
    const isAdminView = user?.user_type === 'Admin' && !!adminCompanyId;
    const dashboardPath = isAdminView ? `/hr/dashboard?company_id=${adminCompanyId}` : '/hr/dashboard';

    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoTs, setLogoTs] = useState(Date.now()); // cache-buster
    const [form, setForm] = useState({});

    useEffect(() => {
        if (!isAuthenticated() || !['HR', 'Admin'].includes(user?.user_type)) {
            navigate('/login'); return;
        }
        loadCompany();
    }, [isAuthenticated, user, navigate]);

    const loadCompany = async () => {
        setLoading(true);
        let result;
        if (isAdminView) {
            result = await companyService.getCompanyById(adminCompanyId);
            if (result.success) {
                const c = result.data;
                setCompany(c);
                setForm({
                    name: c.name || '',
                    industry: c.industry || '',
                    description: c.description || '',
                    location: c.location || c.address || '',
                    website: c.website || '',
                    contact_email: c.contact_email || c.email || '',
                    contact_phone: c.contact_phone || c.phone || '',
                });
            }
        } else {
            result = await companyService.getMyCompanyInfo();
            if (result.success && result.data?.company) {
                const c = result.data.company;
                setCompany(c);
                setForm({
                    name: c.name || '',
                    industry: c.industry || '',
                    description: c.description || '',
                    location: c.location || c.address || '',
                    website: c.website || '',
                    contact_email: c.contact_email || c.email || '',
                    contact_phone: c.contact_phone || c.phone || '',
                });
            }
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const result = isAdminView
            ? await companyService.updateCompany(adminCompanyId, form)
            : await companyService.updateMyCompany(form);
        if (result.success) {
            notify.success('บันทึกข้อมูลบริษัทสำเร็จ');
            setEditMode(false);
            await loadCompany();
        } else {
            notify.error(result.error || 'บันทึกข้อมูลไม่สำเร็จ');
        }
        setSaving(false);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoUploading(true);
        const result = await companyService.uploadCompanyLogo(file);
        if (result.success) {
            notify.success('อัปโหลดโลโก้สำเร็จ');
            await loadCompany();
        } else {
            notify.error(result.error || 'อัปโหลดโลโก้ไม่สำเร็จ');
        }
        setLogoUploading(false);
        setLogoTs(Date.now()); // bust cache regardless so if failed we still show correct state
        if (logoInputRef.current) logoInputRef.current.value = '';
    };

    const handleDeleteLogo = async () => {
        if (!window.confirm('ลบโลโก้บริษัทออก?')) return;
        setLogoUploading(true);
        const result = await companyService.deleteCompanyLogo();
        if (result.success) {
            notify.success('ลบโลโก้สำเร็จ');
            await loadCompany();
        } else {
            notify.error(result.error || 'ลบโลโก้ไม่สำเร็จ');
        }
        setLogoUploading(false);
    };

    const logoSrc = company?.logo_url
        ? `${API_BASE_URL}${company.logo_url}?t=${logoTs}`
        : null;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-sky-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลบริษัท...</p>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center max-w-md w-full">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    </svg>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">ยังไม่มีข้อมูลบริษัท</h3>
                    <p className="text-slate-500 mb-6">กรุณารอให้ Admin กำหนดบริษัทให้คุณ</p>
                    <button className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors" onClick={() => navigate('/hr/dashboard')}>กลับ Dashboard</button>
                </div>
            </div>
        );
    }

    const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all";

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12">
            {/* Hidden file input */}
            <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoUpload} />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

                {/* Header nav */}
                <div className="flex items-center gap-4 mb-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <button className="p-2 -ml-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0" onClick={() => navigate(dashboardPath)} aria-label="กลับ">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </button>
                    <h1 className="text-xl font-bold text-slate-900 flex-1">ข้อมูลบริษัท</h1>
                    {!editMode ? (
                        <button
                            onClick={() => setEditMode(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 text-sm font-bold transition-all"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            แก้ไขข้อมูล
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => { setEditMode(false); setForm({ name: company.name || '', industry: company.industry || '', description: company.description || '', location: company.location || company.address || '', website: company.website || '', contact_email: company.contact_email || company.email || '', contact_phone: company.contact_phone || company.phone || '' }); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">ยกเลิก</button>
                            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-4 py-2 text-sm font-bold transition-all">
                                {saving ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                                บันทึก
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Company Hero / Logo Card ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-5 overflow-hidden animate-fadeInUp">
                    <div className="h-1.5 bg-gradient-to-r from-sky-500 to-indigo-500" />
                    <div className="p-6 flex items-center gap-5">

                        {/* Logo with upload overlay */}
                        <div className="relative shrink-0 group">
                            <div className="h-20 w-20 rounded-2xl overflow-hidden bg-sky-100 flex items-center justify-center border-2 border-white shadow-md ring-2 ring-sky-200">
                                {logoSrc ? (
                                    <img src={logoSrc} alt="Company Logo" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-sky-600 text-2xl font-black select-none">
                                        {company.name?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                )}
                            </div>

                            {/* Upload overlay */}
                            <button
                                onClick={() => logoInputRef.current?.click()}
                                disabled={logoUploading}
                                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                title="เปลี่ยนโลโก้"
                            >
                                {logoUploading ? (
                                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                ) : (
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                )}
                            </button>
                        </div>

                        <div className="min-w-0 flex-1">
                            {editMode ? (
                                <input
                                    type="text"
                                    className={inputCls + " text-lg font-bold"}
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="ชื่อบริษัท"
                                />
                            ) : (
                                <h2 className="text-xl font-bold text-slate-900">{company.name}</h2>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {editMode ? (
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={form.industry}
                                        onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                                        placeholder="อุตสาหกรรม / ประเภทธุรกิจ"
                                    />
                                ) : (
                                    <>
                                        {company.industry && <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-600">{company.industry}</span>}
                                        {company.is_active !== undefined && (
                                            <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${company.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                {company.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Logo action buttons */}
                            {!editMode && (
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => logoInputRef.current?.click()} disabled={logoUploading} className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                        {company.logo_url ? 'เปลี่ยนโลโก้' : 'อัปโหลดโลโก้'}
                                    </button>
                                    {company.logo_url && (
                                        <button onClick={handleDeleteLogo} disabled={logoUploading} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                                            ลบโลโก้
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Contact Details ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-5 p-5 animate-fadeInUp" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">ข้อมูลติดต่อ</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { key: 'location', label: 'ที่อยู่', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>, placeholder: 'กรอกที่อยู่บริษัท' },
                            { key: 'contact_phone', label: 'โทรศัพท์', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>, placeholder: 'เบอร์โทร' },
                            { key: 'contact_email', label: 'อีเมล', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>, placeholder: 'อีเมลติดต่อ' },
                            { key: 'website', label: 'เว็บไซต์', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>, placeholder: 'https://...' },
                        ].map(({ key, label, icon, placeholder }) => (
                            <div key={key}>
                                <div className="flex items-center gap-2 text-slate-400 mb-1.5 text-xs font-bold uppercase tracking-wider">{icon} {label}</div>
                                {editMode ? (
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={form[key] || ''}
                                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-slate-800 break-words">
                                        {key === 'website' && form[key]
                                            ? <a href={form[key]} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">{form[key]}</a>
                                            : (form[key] || <span className="text-slate-400 font-normal">ไม่ได้ระบุ</span>)
                                        }
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Description ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 animate-fadeInUp" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">รายละเอียดบริษัท</h3>
                    {editMode ? (
                        <textarea
                            className={inputCls + " resize-none h-32"}
                            value={form.description || ''}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="อธิบายเกี่ยวกับบริษัท ลักษณะงาน วัฒนธรรมองค์กร..."
                        />
                    ) : (
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {company.description || <span className="text-slate-400">ยังไม่มีรายละเอียด</span>}
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CompanyProfile;
