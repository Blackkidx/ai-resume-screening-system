// frontend/src/components/Auth/PrivacyPolicy.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ArrowLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
    </svg>
);

const LockIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
);

const Section = ({ number, title, children }) => (
    <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">
                {number}
            </span>
            {title}
        </h2>
        <div className="text-slate-600 text-sm leading-relaxed space-y-2 pl-9">
            {children}
        </div>
    </section>
);

const InfoCard = ({ icon, title, desc }) => (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <span className="text-indigo-500 mt-0.5 shrink-0">{icon}</span>
        <div>
            <p className="font-semibold text-slate-700 text-sm">{title}</p>
            <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
        </div>
    </div>
);

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                    >
                        <ArrowLeftIcon />
                        กลับ
                    </button>
                    <div className="h-5 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 text-indigo-600">
                        <LockIcon />
                        <span className="font-semibold text-slate-700 text-sm">นโยบายความเป็นส่วนตัว InternScreen</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-10">
                {/* Title Block */}
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 border border-indigo-100">
                        <LockIcon />
                        ฉบับปัจจุบัน · มีผลบังคับใช้ตั้งแต่ 1 มกราคม 2568
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                        นโยบายความเป็นส่วนตัว
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        InternScreen ให้ความสำคัญกับความเป็นส่วนตัวของคุณอย่างยิ่ง นโยบายนี้อธิบายถึงวิธีที่เราเก็บรวบรวม
                        ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณ ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
                    </p>
                </div>

                {/* Quick Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                    <InfoCard
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
                        title="ปลอดภัย 100%"
                        desc="เข้ารหัสด้วย TLS/SSL ทุกการรับส่งข้อมูล"
                    />
                    <InfoCard
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>}
                        title="ไม่ขายข้อมูล"
                        desc="เราไม่เคยขายข้อมูลส่วนตัวให้บุคคลที่สาม"
                    />
                    <InfoCard
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" /></svg>}
                        title="คุณควบคุมได้"
                        desc="ขอดู, แก้ไข หรือลบข้อมูลได้ตลอดเวลา"
                    />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

                    <Section number="1" title="ข้อมูลที่เราเก็บรวบรวม">
                        <p><strong>ข้อมูลที่คุณให้แก่เรา:</strong></p>
                        <ul className="list-disc list-inside space-y-1.5">
                            <li>ข้อมูลบัญชี: ชื่อ-นามสกุล, Username, อีเมล, รหัสผ่าน (เข้ารหัสด้วย bcrypt)</li>
                            <li>ข้อมูลโปรไฟล์: รายละเอียดการศึกษา, ทักษะ, ประสบการณ์</li>
                            <li>เอกสาร Resume และ Certificate ที่อัปโหลด</li>
                            <li>ข้อมูลการสมัครงาน: ตำแหน่งที่สมัคร, สถานะการสมัคร</li>
                        </ul>
                        <p className="mt-2"><strong>ข้อมูลที่เก็บโดยอัตโนมัติ:</strong></p>
                        <ul className="list-disc list-inside space-y-1.5">
                            <li>Log การเข้าใช้งาน: IP address, เวลา, หน้าที่เข้าชม</li>
                            <li>ข้อมูลอุปกรณ์: ประเภทเบราว์เซอร์, ระบบปฏิบัติการ</li>
                            <li>Cookies สำหรับการรักษา session และปรับปรุงประสบการณ์</li>
                        </ul>
                    </Section>

                    <Section number="2" title="วัตถุประสงค์การใช้ข้อมูล">
                        <p>เราใช้ข้อมูลของคุณเพื่อ:</p>
                        <ul className="list-disc list-inside space-y-1.5">
                            <li><strong>ให้บริการหลัก:</strong> จัดการบัญชี, วิเคราะห์ Resume ด้วย AI, จับคู่งานฝึกงาน</li>
                            <li><strong>ความปลอดภัย:</strong> ยืนยันตัวตน, ป้องกันการฉ้อโกง, ตรวจจับการเข้าถึงที่ผิดปกติ</li>
                            <li><strong>ปรับปรุงบริการ:</strong> วิเคราะห์การใช้งานเพื่อพัฒนาระบบ AI และ UX</li>
                            <li><strong>การสื่อสาร:</strong> แจ้งเตือนสถานะการสมัคร, อีเมล OTP, ข้อมูลสำคัญ</li>
                            <li><strong>การปฏิบัติตามกฎหมาย:</strong> เก็บข้อมูลตามที่กฎหมายกำหนด</li>
                        </ul>
                    </Section>

                    <Section number="3" title="การเปิดเผยข้อมูลแก่บุคคลที่สาม">
                        <p>InternScreen จะเปิดเผยข้อมูลของคุณเฉพาะในกรณีต่อไปนี้เท่านั้น:</p>
                        <ul className="list-disc list-inside space-y-1.5">
                            <li><strong>บริษัทที่คุณสมัครงาน:</strong> ข้อมูลที่ระบุในใบสมัครและ Resume เมื่อคุณสมัครงาน</li>
                            <li><strong>ผู้ให้บริการ Cloud (MongoDB Atlas, AWS):</strong> เพื่อจัดเก็บข้อมูลอย่างปลอดภัย</li>
                            <li><strong>ผู้ให้บริการอีเมล:</strong> สำหรับส่ง OTP และการแจ้งเตือน</li>
                            <li><strong>หน่วยงานกฎหมาย:</strong> เมื่อมีคำสั่งศาลหรือหน่วยงานรัฐที่มีอำนาจ</li>
                        </ul>
                        <p className="mt-2 text-indigo-700 font-medium">เราไม่ขาย ให้เช่า หรือแลกเปลี่ยนข้อมูลส่วนตัวของคุณเพื่อวัตถุประสงค์ทางการค้า</p>
                    </Section>

                    <Section number="4" title="สิทธิ์ของคุณตาม PDPA">
                        <p>ภายใต้ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล คุณมีสิทธิ์ดังนี้:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {[
                                ['สิทธิ์เข้าถึงข้อมูล', 'ขอดูข้อมูลที่เราเก็บเกี่ยวกับคุณ'],
                                ['สิทธิ์แก้ไขข้อมูล', 'ขอแก้ไขข้อมูลที่ไม่ถูกต้อง'],
                                ['สิทธิ์ลบข้อมูล', 'ขอให้ลบข้อมูลในกรณีที่กำหนด'],
                                ['สิทธิ์โอนย้ายข้อมูล', 'รับข้อมูลของตนในรูปแบบ machine-readable'],
                                ['สิทธิ์คัดค้าน', 'ปฏิเสธการประมวลผลในบางกรณี'],
                                ['สิทธิ์ถอนความยินยอม', 'ถอนความยินยอมได้ตลอดเวลา'],
                            ].map(([title, desc]) => (
                                <div key={title} className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <p className="font-semibold text-indigo-700 text-xs">{title}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3">ในการใช้สิทธิ์ กรุณาติดต่อ DPO ของเราที่ <a href="mailto:puridech.fluke@gmail.com" className="text-indigo-600 hover:underline">puridech.fluke@gmail.com</a></p>
                    </Section>

                    <Section number="5" title="Cookies และ Tracking Technologies">
                        <p>เราใช้ Cookies ประเภทต่อไปนี้:</p>
                        <ul className="list-disc list-inside space-y-1.5">
                            <li><strong>Cookies จำเป็น (Essential):</strong> รักษา session login, ความปลอดภัย ไม่สามารถปิดได้</li>
                            <li><strong>Cookies วิเคราะห์ (Analytics):</strong> วิเคราะห์วิธีการใช้งาน เพื่อปรับปรุงบริการ</li>
                            <li><strong>Cookies ความชอบ (Preference):</strong> จดจำการตั้งค่าของคุณ เช่น ภาษา</li>
                        </ul>
                        <p>คุณสามารถจัดการ Cookies ได้ผ่านการตั้งค่าเบราว์เซอร์ของคุณ</p>
                    </Section>

                    <Section number="6" title="การรักษาความปลอดภัยของข้อมูล">
                        <p>เราใช้มาตรการรักษาความปลอดภัยหลายชั้น ได้แก่:</p>
                        <ul className="list-disc list-inside space-y-1.5">
                            <li>การเข้ารหัสข้อมูลด้วย TLS 1.3 สำหรับการรับส่งข้อมูลทั้งหมด</li>
                            <li>รหัสผ่านถูก hash ด้วย bcrypt ก่อนจัดเก็บ (ไม่เก็บรหัสผ่านจริง)</li>
                            <li>ระบบ OTP 2-Factor Authentication สำหรับการลงทะเบียนและการรีเซ็ตรหัสผ่าน</li>
                            <li>JWT Token มีอายุจำกัดและ Refresh Token Rotation</li>
                            <li>การตรวจสอบระบบความปลอดภัยสม่ำเสมอ</li>
                        </ul>
                    </Section>

                    <Section number="7" title="การเก็บรักษาข้อมูล">
                        <p>เราเก็บข้อมูลของคุณตามระยะเวลาต่อไปนี้:</p>
                        <ul className="list-disc list-inside space-y-1.5">
                            <li>ข้อมูลบัญชีที่ใช้งานอยู่: จนกว่าคุณจะยกเลิกบัญชี</li>
                            <li>ข้อมูลหลังยกเลิกบัญชี: ลบถาวรภายใน 30 วัน</li>
                            <li>Log ความปลอดภัย: เก็บไว้ 12 เดือนตามข้อกำหนดด้านความปลอดภัย</li>
                            <li>ข้อมูลทางบัญชีที่กฎหมายกำหนด: ตามระยะเวลาที่กฎหมายกำหนด</li>
                        </ul>
                    </Section>

                    <Section number="8" title="ข้อมูลเด็กและผู้เยาว์">
                        <p>InternScreen ไม่รับสมัครผู้ใช้ที่มีอายุต่ำกว่า 16 ปี หากเราพบว่าได้เก็บข้อมูลของผู้เยาว์โดยไม่ได้รับความยินยอมจากผู้ปกครอง เราจะดำเนินการลบข้อมูลนั้นทันที</p>
                    </Section>

                    <Section number="9" title="การเปลี่ยนแปลงนโยบาย">
                        <p>เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว และจะแจ้งผ่านอีเมลหรือหน้าเว็บไซต์อย่างน้อย 7 วันก่อนมีผลบังคับใช้</p>
                    </Section>

                    <Section number="10" title="ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO)">
                        <p>หากมีคำถามหรือต้องการใช้สิทธิ์ตาม PDPA กรุณาติดต่อ:</p>
                        <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <p><strong>เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO) — InternScreen</strong></p>
                            <p>อีเมล: <a href="mailto:puridech.fluke@gmail.com" className="text-indigo-600 hover:underline">puridech.fluke@gmail.com</a></p>
                            <p>เวลาทำการ: จันทร์–ศุกร์ 9:00–18:00 น.</p>
                            <p>เราจะตอบกลับภายใน 30 วันนับจากวันที่ได้รับคำร้อง</p>
                        </div>
                    </Section>

                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-slate-400">
                    นโยบายความเป็นส่วนตัวนี้มีผลบังคับใช้ตั้งแต่วันที่ 1 มกราคม 2568 · InternScreen © 2568
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <ArrowLeftIcon />
                        กลับหน้าสมัครสมาชิก
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
