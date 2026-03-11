// frontend/src/components/Homepage/Homepage.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/* ── Modern 2026 Lucide SVGs (Clean, Consistent 24x24 viewBox) ── */
const Icons = {
  Brain: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  ),
  Network: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </svg>
  ),
  Chart: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  Target: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Cpu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" />
      <path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
    </svg>
  ),
  FileText: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
    </svg>
  ),
};

const Homepage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => navigate(user ? '/student/resume' : '/login');

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-sky-100 selection:text-sky-900">

      {/* ── HERO SECTION (2026 Modern Minimal) ── */}
      <section className="relative pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-36 lg:pb-28 overflow-hidden border-b border-slate-100">
        {/* Glow Effects - Soft and Technical */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top, #38bdf8 0%, transparent 60%)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">

          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 mb-8 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            Powered by Advanced NLP & XGBoost
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Find the right talent with<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">
              Semantic Intelligence
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed px-2 sm:px-0">
            ระบบคัดกรองเรซูเม่ที่เข้าใจบริบทและความหมายเชิงลึก (Semantic) ของทักษะ
            ไม่จำกัดแค่คีย์เวิร์ด เพื่อความแม่นยำสูงสุดในการจับคู่คนกับงาน
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={handleGetStarted}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/10 hover:bg-slate-800 hover:shadow-slate-900/20 active:scale-[0.98] transition-all">
              เริ่มต้นใช้งานฟรี
              <Icons.ArrowRight />
            </button>
            <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto rounded-xl bg-white border border-slate-200 px-8 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">
              ดูการทำงานของระบบ
            </button>
          </div>

          <p className="mt-6 text-xs font-medium text-slate-400">
            วิเคราะห์ความเหมาะสมด้วยโมเดล Machine Learning ล่าสุด
          </p>
        </div>
      </section>

      {/* ── INTELLIGENT WORKFLOW (Show, Don't Just Tell) ── */}
      <section className="py-24 bg-slate-50" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold tracking-widest text-sky-600 uppercase mb-3">Under the Hood</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              ทำไมเราถึงเหนือกว่า OCR ทั่วไป?
            </h3>
            <p className="mt-4 text-lg text-slate-500 leading-relaxed font-medium">
              เราไม่ได้แค่อ่านตัวอักษร แต่เราใช้เทคโนโลยี <strong>Natural Language Processing (NLP)</strong> เพื่อทำความเข้าใจประวัติของคุณเหมือนที่มนุษย์ทำ
            </p>
          </div>

          {/* Code/Analysis Mockup Window */}
          <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl shadow-2xl overflow-hidden mb-20">
            {/* Window Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
              <div className="flex gap-1.5 flex-1">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="text-xs font-mono text-slate-400 flex-1 text-center">analysis-engine.ts</div>
              <div className="flex-1" />
            </div>

            {/* Window Body - Single column on mobile, split on md+ */}
            <div className="flex flex-col md:flex-row text-sm font-mono">
              {/* Left: Input - hidden on mobile */}
              <div className="hidden md:flex flex-1 p-6 border-r border-slate-800 bg-slate-900/80 overflow-hidden relative h-[280px]">
                <div>
                  <div className="text-slate-500 mb-4 flex items-center gap-2">
                    <Icons.FileText /> <span>Resume_John_Doe.pdf</span>
                  </div>
                  <div className="text-slate-300 space-y-2 opacity-70">
                    <p>"Developed full-stack web applications using React and Node.js..."</p>
                    <p className="blur-[2px]">"Led a team of 4 engineers to deliver the project..."</p>
                    <p className="blur-[3px]">"Improved database query performance by 40%..."</p>
                  </div>
                </div>
                {/* Scanner line effect */}
                <div className="absolute left-0 top-0 w-full h-1 bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)] animate-[scan_3s_ease-in-out_infinite]" />
              </div>

              {/* Right: AI Output */}
              <div className="flex-1 p-4 sm:p-6 bg-slate-950 overflow-hidden h-[220px] md:h-[280px]">
                <div className="text-sky-400 mb-3 sm:mb-4 flex items-center gap-2">
                  <Icons.Brain /> <span>NLP Extraction &amp; Matching</span>
                </div>
                <div className="space-y-2 sm:space-y-3 font-mono text-xs">
                  <p><span className="text-indigo-400">const</span> <span className="text-yellow-300">hard_skills</span> = [<span className="text-emerald-300">'React'</span>, <span className="text-emerald-300">'Node.js'</span>];</p>
                  <p className="text-slate-500">// Semantic similarity matching...</p>
                  <p><span className="text-slate-300">matchScore</span>({'{'} <span className="text-sky-300">req</span>: <span className="text-emerald-300">'Frontend Dev'</span> {'}'}) <span className="text-sky-400">=&gt;</span> <span className="text-rose-300">92%</span></p>
                  <p className="mt-4 text-emerald-400 flex items-center gap-2">
                    <Icons.CheckCircle /> Analysis Complete
                  </p>
                </div>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes scan {
              0%, 100% { transform: translateY(0); opacity: 0; }
              10% { opacity: 1; }
              50% { transform: translateY(280px); }
              90% { opacity: 1; }
            }
          `}</style>

        </div>
      </section>

      {/* ── BENTO GRID FEATURES ── */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              เทคโนโลยีเบื้องหลังการคัดกรอง
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">

            {/* Box 1: SBERT (Spans 2 columns on desktop) */}
            <div className="sm:col-span-2 md:col-span-2 group relative p-6 sm:p-8 bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden transition-all hover:bg-white hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/5">
              <div className="absolute top-0 right-0 p-8 text-slate-200 group-hover:text-sky-50 group-hover:scale-110 transition-all duration-500 -z-10">
                <Icons.Network />
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-6 shadow-sm border border-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
                <Icons.Brain />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">SBERT Semantic Matching</h3>
              <p className="text-slate-600 leading-relaxed font-medium max-w-md">
                เราใช้แบบจำลอง SBERT (Sentence-BERT) เพื่อวิเคราะห์ "ความหมาย" ของประโยคในเรซูเม่
                แม้คุณเขียนทักษะด้วยคำที่ต่างออกไป AI ของเราก็ยังเข้าใจและให้คะแนนได้อย่างแม่นยำ
              </p>
            </div>

            {/* Box 2: XGBoost */}
            <div className="group relative p-6 sm:p-8 bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden transition-all hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/5">
              <div className="absolute top-0 right-0 p-6 text-slate-200 group-hover:text-indigo-50 group-hover:scale-110 transition-all duration-500 -z-10">
                <Icons.Target />
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 shadow-sm border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <Icons.Chart />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">XGBoost Prediction</h3>
              <p className="text-slate-600 leading-relaxed font-medium">
                ประเมินโอกาสความเหมาะสม (Probability) ด้วยโมเดล Machine Learning ชั้นนำ
                ที่เรียนรู้จากข้อมูลการตัดสินใจของ HR จริง
              </p>
            </div>

            {/* Box 3: Certificate Weighting */}
            <div className="group relative p-6 sm:p-8 bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden transition-all hover:bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5">
              <div className="absolute top-0 right-0 p-6 text-slate-200 group-hover:text-emerald-50 group-hover:scale-110 transition-all duration-500 -z-10">
                <Icons.FileText />
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-sm border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <Icons.FileText />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">สมดุลระหว่าง Skills & Certs</h3>
              <p className="text-slate-600 leading-relaxed font-medium">
                ระบบเปิดรับ Certificate เพื่อนำมาถ่วงน้ำหนัก (Dynamic Weighting) เพิ่มคะแนนความน่าเชื่อถือให้กับทักษะที่คุณมี
              </p>
            </div>

            {/* Box 4: Architecture (Spans 2 columns) */}
            <div className="sm:col-span-2 md:col-span-2 group relative p-6 sm:p-8 bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden transition-all hover:bg-white hover:border-amber-200 hover:shadow-xl hover:shadow-amber-900/5 flex flex-col justify-center">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 p-8 text-slate-200 group-hover:text-amber-50 group-hover:scale-110 transition-all duration-500 -z-10">
                <Icons.Cpu />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                  <Icons.Cpu />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Modern Architecture</h3>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium max-w-lg">
                ประมวลผลรวดเร็ว ปลอดภัย รองรับการขยายตัวในอนาคต ทำให้กระบวนการสรรหาง่ายสำหรับทุกคน
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── MODERN FOOTER ── */}
      <footer className="bg-slate-900 py-16 text-sm text-slate-400 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-12">

            {/* Brand */}
            <div className="sm:col-span-2 space-y-4">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <Icons.Brain /> InternScreen
              </h4>
              <p className="max-w-xs leading-relaxed text-slate-400">
                ระบบคัดกรองเรซูเม่ด้วยปัญญาประดิษฐ์ ที่สร้างขึ้นเพื่อทลายขีดจำกัดของระบบสรรหาแบบเดิมๆ
              </p>
            </div>

            {/* Business Hours */}
            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-xs flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                เวลาทำการ
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <svg className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
                  </svg>
                  <span>จันทร์ – ศุกร์</span>
                </li>
                <li className="flex items-start gap-2.5 pl-6">
                  <span className="text-slate-300 font-semibold">09:00 – 17:00 น.</span>
                </li>
                <li className="flex items-start gap-2.5 mt-1">
                  <svg className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
                  </svg>
                  <span>เสาร์ – อาทิตย์</span>
                </li>
                <li className="flex items-start gap-2.5 pl-6">
                  <span className="text-slate-500 text-xs italic">ปิดทำการ</span>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-xs flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                ติดต่อเรา
              </h4>
              <ul className="space-y-4">
                <li>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">ขอความช่วยเหลือ</p>
                  <a
                    href="mailto:purideh.fluke@gmail.com"
                    className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors font-medium break-all"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                    purideh.fluke@gmail.com
                  </a>
                </li>
                <li className="pt-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">ตอบกลับภายใน</p>
                  <p className="text-slate-300 font-medium">1 – 2 วันทำการ</p>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <p>© {new Date().getFullYear()} AI Resume Screening System. All rights reserved.</p>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-xs font-semibold">
              <Link to="/for-companies" className="hover:text-white transition-colors text-sky-400">สำหรับบริษัท</Link>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</Link>
              <Link to="/terms-of-service" className="hover:text-white transition-colors">ข้อกำหนดการใช้งาน</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;