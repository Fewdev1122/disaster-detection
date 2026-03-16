import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 border border-slate-200 bg-white">
          <div className="flex items-start gap-4 px-6 py-6">
            <div className="flex h-12 w-12 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700">
              <ShieldIcon />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Rescue Platform
              </p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900 lg:text-2xl">
                สมัครหน่วยกู้ภัย
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                เชื่อมต่อหน่วยของคุณเข้าสู่ระบบแจ้งเหตุภัยพิบัติอัตโนมัติ
                เพื่อให้ระบบสามารถส่งเหตุไปยังหน่วยที่เกี่ยวข้องได้อย่างเหมาะสม
              </p>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-sm font-semibold text-slate-900">
              ขั้นตอนการสมัคร
            </p>
            <p className="mt-1 text-xs text-slate-500">
              ดำเนินการตามลำดับเพื่อเริ่มใช้งานระบบ
            </p>
          </div>

          <div className="px-6 pt-5 pb-4">
            <Step
              number="1"
              title="สมัครหน่วยกู้ภัย"
              desc="กรอกข้อมูลหน่วย ตำแหน่งฐาน และพื้นที่รับผิดชอบ"
              showLine
            />
            <Step
              number="2"
              title="เชื่อม LINE กลุ่ม"
              desc="สร้าง LINE Group เพิ่มบอท และยืนยันรหัสเชื่อมต่อ"
              showLine
            />
            <Step
              number="3"
              title="เริ่มรับแจ้งเหตุ"
              desc="ระบบจะส่งแจ้งเหตุภัยพิบัติไปยัง LINE ของหน่วยโดยอัตโนมัติ"
            />
          </div>

          <div className="border-t border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex h-10 items-center justify-center border border-slate-900 bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                เริ่มสมัครหน่วยกู้ภัย
              </Link>

              <Link
                to="/register/pending"
                className="inline-flex h-10 items-center justify-center border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                ตรวจสอบสถานะคำขอ
              </Link>
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
}

function Step({ number, title, desc, showLine }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 items-center justify-center border border-slate-300 bg-white text-xs font-semibold text-slate-700">
          {number}
        </div>

        {showLine ? <div className="mt-2 h-10 w-px bg-slate-300" /> : null}
      </div>

      <div className="pb-5 pt-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function SystemBadge({ label }) {
  return (
    <div className="border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
      {label}
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
      <path d="M9.5 12l1.7 1.7L14.8 10" />
    </svg>
  );
}