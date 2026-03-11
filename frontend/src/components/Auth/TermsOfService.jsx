// frontend/src/components/Auth/TermsOfService.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const Section = ({ number, title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
        {number}
      </span>
      {title}
    </h2>
    <div className="text-slate-600 text-sm leading-relaxed space-y-2 pl-9">
      {children}
    </div>
  </section>
);

const TermsOfService = () => {
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
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeftIcon />
            กลับ
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2 text-blue-600">
            <ShieldIcon />
            <span className="font-semibold text-slate-700 text-sm">เงื่อนไขข้อตกลงการใช้บริการ InternScreen</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Title Block */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 border border-blue-100">
            <ShieldIcon />
            ฉบับปัจจุบัน · มีผลบังคับใช้ตั้งแต่ 1 มกราคม 2568
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            เงื่อนไขข้อตกลงการใช้บริการ
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            โปรดอ่านเงื่อนไขเหล่านี้อย่างละเอียดก่อนใช้บริการ InternScreen
            การใช้งานแพลตฟอร์มนี้ถือว่าคุณได้อ่านและยอมรับข้อตกลงทั้งหมด
          </p>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            <strong>สำคัญ:</strong> หากคุณไม่ยอมรับเงื่อนไขเหล่านี้ กรุณางดใช้บริการ InternScreen
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          <Section number="1" title="คำนิยามและขอบเขต">
            <p><strong>"InternScreen"</strong> หมายถึง แพลตฟอร์มระบบคัดกรองผู้สมัครฝึกงานด้วย AI ซึ่งดำเนินงานโดยทีมพัฒนา InternScreen</p>
            <p><strong>"ผู้ใช้"</strong> หมายถึง บุคคลใดก็ตามที่ลงทะเบียนและใช้บริการ ไม่ว่าจะในฐานะนักศึกษา (Student) หรือผู้ประกอบการ/HR</p>
            <p><strong>"บริการ"</strong> หมายถึง ฟังก์ชันทั้งหมดบนแพลตฟอร์ม เช่น การอัปโหลด Resume, ระบบวิเคราะห์ด้วย AI, การจัดหางาน และการสื่อสารระหว่างผู้ใช้</p>
            <p><strong>"เนื้อหา"</strong> หมายถึง ข้อมูล ข้อความ ภาพ เอกสาร Resume และข้อมูลส่วนบุคคลที่ผู้ใช้อัปโหลดหรือนำเข้าสู่ระบบ</p>
          </Section>

          <Section number="2" title="การลงทะเบียนและบัญชีผู้ใช้">
            <p>คุณต้องมีอายุไม่ต่ำกว่า 16 ปีบริบูรณ์ในการใช้บริการ InternScreen</p>
            <p>คุณต้องให้ข้อมูลที่ถูกต้อง ครบถ้วน และเป็นจริงในการลงทะเบียน และรับผิดชอบในการอัปเดตข้อมูลให้ทันสมัยอยู่เสมอ</p>
            <p>คุณมีหน้าที่รักษาความลับของรหัสผ่านและบัญชีของตนเอง และไม่อนุญาตให้ผู้อื่นเข้าใช้บัญชีแทน</p>
            <p>หากพบการเข้าถึงบัญชีโดยไม่ได้รับอนุญาต กรุณาแจ้งเราทันทีผ่านช่องทางการติดต่อที่ระบุไว้</p>
          </Section>

          <Section number="3" title="การใช้บริการที่ได้รับอนุญาต">
            <p>ผู้ใช้ในฐานะ <strong>นักศึกษา</strong> สามารถ: อัปโหลด Resume เพื่อรับการวิเคราะห์ด้วย AI, ค้นหาและสมัครตำแหน่งงานฝึกงาน, ดูผลการจับคู่และคะแนนความเหมาะสมได้</p>
            <p>ผู้ใช้ในฐานะ <strong>HR/ผู้ประกอบการ</strong> สามารถ: ลงประกาศตำแหน่งงานฝึกงาน, ดูรายชื่อผู้สมัคร, ใช้ระบบคัดกรองอัตโนมัติ และติดต่อผู้สมัครได้</p>
            <p>การใช้บริการทั้งหมดต้องอยู่ในขอบเขตของกฎหมายไทยและกฎหมายระหว่างประเทศที่บังคับใช้</p>
          </Section>

          <Section number="4" title="สิ่งที่ห้ามกระทำ">
            <p>ห้ามผู้ใช้กระทำการดังต่อไปนี้อย่างเด็ดขาด:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>อัปโหลดเนื้อหาที่เป็นเท็จ ทำให้เข้าใจผิด หรือหลอกลวง</li>
              <li>แอบอ้างเป็นบุคคลอื่นหรือองค์กรอื่น</li>
              <li>พยายาม hack, reverse engineer หรือแทรกแซงระบบ</li>
              <li>ใช้บอทหรือสคริปต์อัตโนมัติในการขูดข้อมูล (scraping)</li>
              <li>ลงประกาศตำแหน่งงานปลอมหรือที่ไม่เป็นความจริง</li>
              <li>เผยแพร่เนื้อหาที่ผิดกฎหมาย ลามกอนาจาร หรือละเมิดสิทธิ์ผู้อื่น</li>
              <li>พยายามเข้าถึงข้อมูลของผู้ใช้รายอื่นโดยไม่ได้รับอนุญาต</li>
            </ul>
          </Section>

          <Section number="5" title="ทรัพย์สินทางปัญญา">
            <p>แพลตฟอร์ม InternScreen รวมถึงโค้ด ดีไซน์ โลโก้ และเนื้อหาต้นฉบับทั้งหมดเป็นทรัพย์สินของ InternScreen และได้รับการคุ้มครองตาม พ.ร.บ. ลิขสิทธิ์</p>
            <p>ผู้ใช้ยังคงเป็นเจ้าของเนื้อหาที่ตนอัปโหลด แต่ให้สิทธิ์แก่ InternScreen ในการประมวลผลเนื้อหาดังกล่าวเพื่อวัตถุประสงค์ของการให้บริการ</p>
            <p>ห้ามทำซ้ำ ดัดแปลง หรือเผยแพร่ส่วนใดส่วนหนึ่งของแพลตฟอร์มโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร</p>
          </Section>

          <Section number="6" title="ความรับผิดชอบและข้อจำกัด">
            <p>InternScreen ให้บริการในสภาพ "ตามที่เป็น" (as-is) โดยไม่ให้การรับประกันใดๆ ว่าจะเหมาะสมกับวัตถุประสงค์เฉพาะของคุณ</p>
            <p>InternScreen ไม่รับประกันผลลัพธ์ของการจับคู่งาน ความแม่นยำของ AI วิเคราะห์ Resume หรือการได้รับการว่าจ้างงานฝึกงาน</p>
            <p>InternScreen ไม่รับผิดชอบต่อความเสียหายทางอ้อม พิเศษ หรือที่เป็นผลตามมา ไม่ว่ากรณีใด เกินกว่าที่กฎหมายกำหนด</p>
            <p>ความรับผิดชอบสูงสุดของ InternScreen ต่อผู้ใช้แต่ละรายจะไม่เกินจำนวนเงินที่ผู้ใช้ชำระให้แก่ InternScreen ในช่วง 3 เดือนก่อนเกิดเหตุ</p>
          </Section>

          <Section number="7" title="การระงับและยกเลิกบัญชี">
            <p>InternScreen ขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีที่ละเมิดข้อตกลงนี้ โดยอาจไม่แจ้งล่วงหน้า</p>
            <p>ผู้ใช้สามารถยกเลิกบัญชีได้ตลอดเวลาโดยติดต่อทีมสนับสนุน หรือผ่านการตั้งค่าบัญชี</p>
            <p>เมื่อยกเลิกบัญชี ข้อมูลของคุณจะถูกลบตามนโยบายความเป็นส่วนตัวภายใน 30 วัน</p>
          </Section>

          <Section number="8" title="การเปลี่ยนแปลงข้อตกลง">
            <p>InternScreen ขอสงวนสิทธิ์ปรับปรุงข้อตกลงนี้ได้ตลอดเวลา โดยจะแจ้งผู้ใช้ผ่านอีเมลหรือการแจ้งเตือนในระบบอย่างน้อย 7 วันก่อนมีผล</p>
            <p>การใช้บริการต่อหลังจากข้อตกลงมีผลบังคับ ถือว่าคุณยอมรับข้อตกลงฉบับใหม่</p>
          </Section>

          <Section number="9" title="กฎหมายที่บังคับใช้">
            <p>ข้อตกลงนี้อยู่ภายใต้บังคับและตีความตามกฎหมายแห่งราชอาณาจักรไทย</p>
            <p>ข้อพิพาทใดๆ ที่เกิดขึ้นจะอยู่ในเขตอำนาจศาลไทย</p>
          </Section>

          <Section number="10" title="ติดต่อเรา">
            <p>หากมีคำถามเกี่ยวกับข้อตกลงนี้ กรุณาติดต่อ:</p>
            <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p><strong>InternScreen Support Team</strong></p>
              <p>อีเมล: <a href="mailto:puridech.fluke@gmail.com" className="text-blue-600 hover:underline">puridech.fluke@gmail.com</a></p>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          เงื่อนไขข้อตกลงนี้มีผลบังคับใช้ตั้งแต่วันที่ 1 มกราคม 2568 · InternScreen © 2568
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ArrowLeftIcon />
            กลับหน้าสมัครสมาชิก
          </button>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
