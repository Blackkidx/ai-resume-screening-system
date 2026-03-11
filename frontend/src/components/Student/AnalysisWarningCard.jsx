// frontend/src/components/Student/AnalysisWarningCard.jsx
import React from 'react';

/* ── SVG Icons ── */
const ScanSlashIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
);
const BrainOffIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.3 21a7 7 0 0 1-3.3-1" /><path d="M9 10.5V10a3 3 0 0 0-1.8-2.7" />
        <path d="M6 6.3A3 3 0 0 1 9 4a3 3 0 0 1 3 3v2" />
        <line x1="2" y1="2" x2="22" y2="22" />
        <path d="M19.9 12a4 4 0 0 0-3.9-4" /><path d="M15 13a4 4 0 0 1-4 4H9" />
    </svg>
);
const InfoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
);
const LinkIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);
const RefreshIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
    </svg>
);

/* ── Variant config ── */
const VARIANTS = {
    image_only_pdf: {
        icon: <ScanSlashIcon />,
        iconColors: 'bg-orange-100 text-orange-600',
        badgeColors: 'bg-orange-100 text-orange-700 border border-orange-200',
        borderColor: 'border-orange-200',
        topBar: 'bg-gradient-to-r from-orange-500 to-amber-400',
        bg: 'bg-orange-50',
        badge: 'Scanned PDF Detected',
        title: 'ไม่สามารถอ่านไฟล์ Resume ได้',
        subtitle: 'ไฟล์นี้เป็น PDF แบบรูปภาพ (Scanned Image) ซึ่ง AI ไม่สามารถดึงข้อความออกมาได้ กรุณาใช้ PDF ที่สร้างจากโปรแกรมโดยตรง',
        steps: [
            { no: '1', title: 'เปิด Resume ต้นฉบับ', sub: 'ใช้ Canva, Microsoft Word หรือ Google Docs' },
            { no: '2', title: 'Export เป็น PDF', sub: 'File → Download as PDF (ข้อความต้องคลุมดำได้)' },
            { no: '3', title: 'อัปโหลดไฟล์ใหม่', sub: 'นำ PDF ที่ Export แล้วมาอัปโหลดอีกครั้ง' },
        ],
        tools: [
            { name: 'iLovePDF OCR', url: 'https://www.ilovepdf.com/ocr-pdf' },
            { name: 'Smallpdf', url: 'https://smallpdf.com/pdf-to-word' },
            { name: 'Canva Resume', url: 'https://www.canva.com/resumes/' },
        ],
        showRetry: true,
    },
    ai_failed: {
        icon: <BrainOffIcon />,
        iconColors: 'bg-rose-100 text-rose-600',
        badgeColors: 'bg-rose-100 text-rose-700 border border-rose-200',
        borderColor: 'border-rose-200',
        topBar: 'bg-gradient-to-r from-rose-500 to-pink-500',
        bg: 'bg-rose-50',
        badge: 'AI Analysis Failed',
        title: 'AI วิเคราะห์ไม่สำเร็จ',
        subtitle: 'เกิดข้อผิดพลาดระหว่างการวิเคราะห์ข้อมูล กรุณาตรวจสอบว่า PDF ไม่ใช่ภาพสแกน และไม่มีกราฟหรือ Progress Bar ที่ AI อ่านไม่ออก',
        steps: [
            { no: '1', title: 'ตรวจสอบว่าคลุมดำข้อความได้', sub: 'ยืนยันว่า PDF ไม่ใช่รูปภาพ' },
            { no: '2', title: 'ลบกราฟ / Progress bar', sub: 'ใช้ข้อความธรรมดาแทนกราฟทักษะ' },
            { no: '3', title: 'ลองอัปโหลดใหม่', sub: 'ระบบจะวิเคราะห์ใหม่อัตโนมัติ' },
        ],
        tools: [],
        showRetry: true,
    },
    partial_extraction: {
        icon: <InfoIcon />,
        iconColors: 'bg-amber-100 text-amber-600',
        badgeColors: 'bg-amber-100 text-amber-700 border border-amber-200',
        borderColor: 'border-amber-200',
        topBar: 'bg-gradient-to-r from-amber-400 to-yellow-400',
        bg: 'bg-amber-50',
        badge: 'ข้อมูลไม่สมบูรณ์',
        title: 'AI วิเคราะห์ได้บางส่วน',
        subtitle: 'ดึงข้อมูลได้ไม่ครบ เนื่องจาก Resume อาจไม่มีหัวข้อมาตรฐาน เช่น Education, Skills, Projects — ผลลัพธ์ด้านล่างอาจไม่ถูกต้องทั้งหมด',
        steps: [
            { no: '1', title: 'เพิ่มหัวข้อมาตรฐาน', sub: 'Education, Skills, Projects, Experience' },
            { no: '2', title: 'ระบุชื่อมหาวิทยาลัยและ GPA', sub: 'ให้ชัดเจนและครบถ้วน' },
            { no: '3', title: 'อัปโหลดใหม่หลังแก้ไข', sub: 'ระบบจะอัปเดตข้อมูลอัตโนมัติ' },
        ],
        tools: [],
        showRetry: false,
    },
};

/* ── Main Component ── */
const AnalysisWarningCard = ({ type, onRetry }) => {
    const v = VARIANTS[type];
    if (!v) return null;

    return (
        <div className={`relative rounded-2xl border overflow-hidden shadow-sm ${v.borderColor} ${v.bg}`}>
            {/* Colored top bar */}
            <div className={`h-1 w-full ${v.topBar}`} />

            <div className="p-6">
                {/* Header row */}
                <div className="flex items-start gap-4 mb-5">
                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${v.iconColors}`}>
                        {v.icon}
                    </div>
                    <div className="flex-1">
                        <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mb-2 ${v.badgeColors}`}>
                            {v.badge}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">{v.title}</h3>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{v.subtitle}</p>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 my-4" />

                {/* Steps */}
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">วิธีแก้ไข</p>
                <div className="space-y-3 mb-5">
                    {v.steps.map((s) => (
                        <div key={s.no} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                                {s.no}
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tool links */}
                {v.tools.length > 0 && (
                    <div className="mb-5">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">เครื่องมือแนะนำ</p>
                        <div className="flex flex-wrap gap-2">
                            {v.tools.map((t) => (
                                <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-400 hover:text-slate-900 transition-all shadow-sm">
                                    {t.name} <LinkIcon />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA Button */}
                {v.showRetry && (
                    <button onClick={onRetry}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
                        <RefreshIcon />
                        อัปโหลด Resume ใหม่
                    </button>
                )}
            </div>
        </div>
    );
};

/* Banner variant — shown above results for partial_extraction */
export const PartialExtractionBanner = ({ onRetry }) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 mb-2">
        <InfoIcon />
        <p className="text-sm text-amber-800 font-medium flex-1">
            ข้อมูลที่แสดงอาจไม่สมบูรณ์ — AI ดึงข้อมูลได้บางส่วน
        </p>
        <button onClick={onRetry}
            className="shrink-0 text-xs font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2 whitespace-nowrap">
            แก้ไขและ Upload ใหม่
        </button>
    </div>
);

export default AnalysisWarningCard;
