// frontend/src/components/ForCompanies/ForCompanies.jsx
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ── SVG Icons ── */
const Icons = {
  Users: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Brain: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Building: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="1" /><path d="M3 9h18" /><path d="M9 21V9" />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Megaphone: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m3 11 19-9-9 19-2-8-8-2z" />
    </svg>
  ),
  Mail: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  ChevronRight: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
};

const FEATURES = [
  {
    icon: Icons.Brain,
    title: 'AI คัดกรองอัตโนมัติ',
    desc: 'ระบบ AI วิเคราะห์ Resume และจับคู่กับตำแหน่งงาน โดยประเมินทักษะ การศึกษา และประสบการณ์ ได้อย่างแม่นยำโดยไม่ต้องใช้เวลาของ HR',
    accent: 'sky',
  },
  {
    icon: Icons.Clock,
    title: 'ประกาศงานได้ทันที ไม่มีค่าใช้จ่าย',
    desc: 'สร้างประกาศรับสมัครงาน แก้ไขรายละเอียด และปิด-เปิดรับสมัครได้ทุกเวลา ระบบจะจัดการคิวผู้สมัครให้โดยอัตโนมัติ',
    accent: 'emerald',
  },
  {
    icon: Icons.Search,
    title: 'ค้นหา Candidate ได้ง่าย',
    desc: 'ดูโปรไฟล์ผู้สมัคร เปรียบเทียบ Match Score รายบุคคล และเรียกดูใบ Certificate ที่ผู้สมัครแนบมาได้ในที่เดียว โดยไม่ต้องเปิดอีเมล',
    accent: 'amber',
  },
  {
    icon: Icons.Building,
    title: 'Company Profile พร้อมใช้งาน',
    desc: 'สร้างหน้าบริษัทที่น่าเชื่อถือ บอกเล่าวัฒนธรรมองค์กร และดึงดูด Candidate ที่ Match กับค่านิยมของบริษัทคุณ',
    accent: 'rose',
  },
  {
    icon: Icons.Users,
    title: 'เข้าถึง Candidate คุณภาพสูง',
    desc: 'นักศึกษาและบัณฑิตที่อัปโหลด Resume ผ่านระบบทุกคน ได้รับการวิเคราะห์ทักษะโดย AI แล้ว คุณจึงเห็นข้อมูลที่กลั่นกรองมาแล้ว',
    accent: 'sky',
  },
  {
    icon: Icons.Megaphone,
    title: 'ทีมงานพร้อมดูแลและช่วยเหลือ',
    desc: 'หากพบปัญหาหรือต้องการความช่วยเหลือในการตั้งค่าบัญชีบริษัท ทีมงานพร้อมตอบคำถามทางอีเมลภายใน 1–2 วันทำการ',
    accent: 'emerald',
  },
];

const accentMap = {
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
};

/* ── Intersection-observer hook for scroll reveal ── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-visible'); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, delay = 0, className = '' }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal-section ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function ForCompanies() {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ── Scroll-reveal styles injected inline ── */}
      <style>{`
        .reveal-section { opacity: 0; transform: translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal-section.is-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) { .reveal-section { opacity: 1 !important; transform: none !important; } }
      `}</style>

      {/* ── Hero ── */}
      <section className="relative bg-slate-900 overflow-hidden">
        {/* Diagonal accent stripe */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, transparent 60%)',
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px), repeating-linear-gradient(90deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          {/* Eyebrow */}
          <RevealSection>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-sky-400 mb-7">
              <svg className="w-3 h-3" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3" /></svg>
              สำหรับบริษัทและองค์กร
            </span>
          </RevealSection>

          <RevealSection delay={80}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight max-w-3xl">
              ลงประกาศงาน<br />
              <span className="text-sky-400">กับ InternScreen</span><br />
              <span className="text-slate-300 text-3xl sm:text-4xl lg:text-5xl font-bold">เข้าถึง Candidate คุณภาพสูง</span>
            </h1>
          </RevealSection>

          <RevealSection delay={160}>
            <p className="mt-6 text-slate-400 text-lg max-w-xl leading-relaxed">
              ระบบ AI ช่วยคัดกรองผู้สมัครตอบโจทย์ทุกช่องทาง ลดภาระ HR และเพิ่มคุณภาพการสรรหา
            </p>
          </RevealSection>

          <RevealSection delay={240}>
            <div className="mt-10">
              <a
                href="mailto:purideh.fluke@gmail.com?subject=สนใจลงประกาศงานกับ InternScreen"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white px-8 py-3.5 text-sm font-bold transition-all hover:shadow-lg hover:shadow-sky-500/25 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Icons.Mail className="w-4 h-4" />
                ติดต่อเราได้เลย — purideh.fluke@gmail.com
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <RevealSection>
        <section className="bg-white border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '100%', label: 'ฟรี ไม่มีค่าใช้จ่าย' },
              { value: 'AI', label: 'คัดกรองอัตโนมัติ' },
              { value: '1 – 2', label: 'นาทีในการสร้างประกาศ' },
              { value: '24/7', label: 'ระบบออนไลน์ตลอดเวลา' },
            ].map((s) => (
              <div key={s.label} className="space-y-1">
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      </RevealSection>

      {/* ── Features grid ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <RevealSection>
          <div className="mb-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
              ทำไมต้องเลือก <span className="text-sky-600">InternScreen</span>?
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              คุณสมบัติที่ออกแบบมาเพื่อทีม HR โดยเฉพาะ
            </p>
          </div>
        </RevealSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => {
            const ac = accentMap[feat.accent];
            return (
              <RevealSection key={feat.title} delay={i * 60}>
                <div className="h-full bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${ac.border} ${ac.bg}`}>
                    <feat.icon className={`w-5 h-5 ${ac.text}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-1.5 leading-snug">{feat.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              </RevealSection>
            );
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <h2 className="text-3xl font-black text-white text-center mb-14">
              เริ่มใช้งานง่าย ใน <span className="text-sky-400">3 ขั้นตอน</span>
            </h2>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'สมัครบัญชี HR', desc: 'ลงทะเบียนบัญชีองค์กรพร้อมระบุข้อมูลบริษัท ใช้เวลาไม่ถึง 2 นาที' },
              { step: '02', title: 'สร้างประกาศงาน', desc: 'กรอกรายละเอียดตำแหน่ง ทักษะที่ต้องการ และเงื่อนไขการรับสมัคร ระบบพร้อมใช้งานทันที' },
              { step: '03', title: 'รับ Candidate ที่ Match', desc: 'AI จะจัดอันดับผู้สมัครตาม Match Score ให้คุณดูโปรไฟล์และใบเซอร์ได้ทันที' },
            ].map((s, i) => (
              <RevealSection key={s.step} delay={i * 100}>
                <div className="relative">
                  <span className="block text-7xl font-black text-slate-800 leading-none mb-3 select-none">{s.step}</span>
                  <div className="absolute top-3 left-0 w-14 h-1 bg-sky-500 rounded-full" />
                  <h3 className="text-white font-bold text-lg mb-2 mt-2">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / Contact ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <RevealSection>
          <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-14 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 mb-6">
              <Icons.Mail className="w-7 h-7 text-sky-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
              พร้อมเริ่มต้นแล้วใช่ไหม?
            </h2>
            <p className="text-slate-500 mb-2 max-w-md mx-auto">
              ติดต่อทีมงานของเราผ่านอีเมลด้านล่าง เราจะตอบกลับภายใน 1–2 วันทำการ
            </p>

            <div className="flex justify-center mt-6">
              <a
                href="mailto:purideh.fluke@gmail.com?subject=สนใจลงประกาศงานกับ InternScreen"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-white px-8 py-3.5 text-sm font-bold transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Icons.Mail className="w-4 h-4" />
                purideh.fluke@gmail.com
              </a>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ── Footer back-link ── */}
      <div className="border-t border-slate-200 py-6 text-center">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 transition-colors font-medium">
          <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
