import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
            <ShieldIcon />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              Rescue Platform
            </p>
            <p className="text-xs text-gray-400">
              AI Disaster Detection System
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <div className="bg-red-500 px-7 py-7">
            <h1 className="text-white text-xl font-medium mb-1">
              สมัครหน่วยกู้ภัย
            </h1>
            <p className="text-red-100 text-sm">
              เชื่อมต่อหน่วยของคุณเข้าสู่ระบบแจ้งเหตุภัยพิบัติอัตโนมัติ
            </p>
          </div>

          <div className="px-7 pt-6 pb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">
              ขั้นตอนการสมัคร
            </p>

            <Step
              number="1"
              title="สมัครหน่วยกู้ภัย"
              desc="กรอกข้อมูลหน่วย ตำแหน่งฐาน และพื้นที่รับผิดชอบ"
              showLine
            />
            <Step
              number="2"
              title="เชื่อม LINE กลุ่ม"
              desc="สร้าง LINE Group เพิ่มบอท และยืนยันรหัส"
              showLine
            />
            <Step
              number="3"
              title="เริ่มรับแจ้งเหตุ"
              desc="ระบบส่งแจ้งเหตุภัยพิบัติไปยัง LINE ของหน่วยโดยอัตโนมัติ"
            />
          </div>

          <div className="h-px bg-gray-100 mx-7" />

          <div className="px-7 py-5">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3.5 rounded-xl transition text-sm"
            >
              เริ่มสมัครหน่วยกู้ภัย
            </Link>

            <p className="text-center text-xs text-gray-400 mt-3">
              มีบัญชีอยู่แล้ว?{" "}
              <Link to="/login" className="text-red-500 hover:underline">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-4 flex-wrap">
          <TrustBadge label="ข้อมูลปลอดภัย" />
          <TrustBadge label="แจ้งเหตุ 24/7" />
          <TrustBadge label="ทีมสนับสนุน" />
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, desc, showLine }) {
  return (
    <div className="flex gap-3.5 mb-5">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500 text-xs font-medium">
          {number}
        </div>
        {showLine && (
          <div className="w-px flex-1 bg-gray-100 mt-1" style={{ minHeight: 28 }} />
        )}
      </div>

      <div className="pt-1.5">
        <p className="text-sm font-medium text-gray-800 mb-0.5">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function TrustBadge({ label }) {
  return (
    <div className="rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs text-gray-500">
      {label}
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-5 h-5 text-white"
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