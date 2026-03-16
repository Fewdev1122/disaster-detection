import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import StepProgress from "../../components/register/StepProgress";

const REGISTER_PENDING_KEY = "rescue_register_pending_v1";

function getStatusMeta(status) {
  switch (status) {
    case "pending_review":
      return {
        currentStep: 1,
        badgeText: "รอตรวจสอบ",
        badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
        title: "ส่งคำขอสำเร็จแล้ว",
        nextSteps: [
          "แอด LINE OA ของระบบ @109yveoe",
          "ส่งรหัสผูก LINE ในแชตส่วนตัวกับบอท",
          "รอผู้ดูแลตรวจสอบ",
        ],
      };

    case "approved":
      return {
        currentStep: 2,
        badgeText: "อนุมัติแล้ว",
        badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
        title: "คำขอได้รับการอนุมัติแล้ว",
        nextSteps: [
          "เชิญบอทเข้ากลุ่ม LINE ของหน่วย",
          "ส่งรหัสผูกเดิมในกลุ่ม",
          "รอระบบยืนยันการเชื่อมต่อ",
        ],
      };

    case "active":
      return {
        currentStep: 3,
        badgeText: "พร้อมใช้งาน",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
        title: "หน่วยของคุณพร้อมใช้งานแล้ว",
        nextSteps: [
          "ระบบพร้อมรับแจ้งเหตุแล้ว",
          "ตรวจสอบว่ากลุ่ม LINE รับข้อความได้ปกติ",
        ],
      };

    case "rejected":
      return {
        currentStep: 1,
        badgeText: "ไม่ผ่านการอนุมัติ",
        badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
        title: "คำขอของคุณยังไม่ผ่านการอนุมัติ",
        nextSteps: [
          "ตรวจสอบข้อมูลที่ใช้สมัคร",
          "สมัครใหม่อีกครั้ง",
          "หากมีปัญหา ให้ติดต่อผู้ดูแลระบบ",
        ],
      };

    case "suspended":
      return {
        currentStep: 2,
        badgeText: "ระงับชั่วคราว",
        badgeClass: "border-slate-300 bg-slate-100 text-slate-700",
        title: "หน่วยของคุณถูกระงับชั่วคราว",
        nextSteps: [
          "ติดต่อผู้ดูแลระบบ",
          "ตรวจสอบสาเหตุการระงับ",
          "รอเปิดใช้งานอีกครั้ง",
        ],
      };

    default:
      return {
        currentStep: 1,
        badgeText: "ไม่ทราบสถานะ",
        badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
        title: "สถานะคำขอ",
        nextSteps: [
          "ตรวจสอบสถานะอีกครั้ง",
          "ติดต่อผู้ดูแลระบบหากมีปัญหา",
        ],
      };
  }
}

function loadPendingData() {
  try {
    const raw = localStorage.getItem(REGISTER_PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load pending data:", err);
    return null;
  }
}

function StatusBadge({ text, className }) {
  return (
    <div className={`inline-flex border px-3 py-1.5 text-sm font-medium ${className}`}>
      {text}
    </div>
  );
}

function StepItem({ index, text, done = false }) {
  return (
    <div className="flex gap-4 border border-slate-200 bg-white px-4 py-3">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center text-xs font-semibold ${
          done
            ? "border border-emerald-600 bg-emerald-600 text-white"
            : "border border-slate-300 bg-slate-50 text-slate-700"
        }`}
      >
        {done ? "✓" : index}
      </div>

      <p className="text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

export default function RegisterPendingPage() {
  const navigate = useNavigate();
  const [pendingData, setPendingData] = useState(() => loadPendingData());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pendingData) {
      navigate("/rescue/register", { replace: true });
    }
  }, [pendingData, navigate]);

  useEffect(() => {
    const syncPendingData = () => {
      setPendingData(loadPendingData());
    };

    // กรณี localStorage เปลี่ยนจาก tab อื่น
    window.addEventListener("storage", syncPendingData);

    // กรณีกลับเข้าหน้านี้อีกครั้ง
    window.addEventListener("focus", syncPendingData);

    // กันเหนียว: polling ทุก 3 วิ
    const interval = setInterval(syncPendingData, 3000);

    return () => {
      window.removeEventListener("storage", syncPendingData);
      window.removeEventListener("focus", syncPendingData);
      clearInterval(interval);
    };
  }, []);

  if (!pendingData) return null;

  const { status = "pending_review", connectCode = "-" } = pendingData;
  const meta = getStatusMeta(status);
  const isActive = status === "active";

  const handleRegisterAnother = () => {
    localStorage.removeItem(REGISTER_PENDING_KEY);
    setPendingData(null);
    navigate("/rescue/register");
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(connectCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
          <div className="mb-6 border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  สถานะการสมัครหน่วยกู้ภัย
                </p>
                <h1 className="mt-1 text-xl font-semibold text-slate-900 lg:text-2xl">
                  {meta.title}
                </h1>
              </div>

              <StatusBadge text={meta.badgeText} className={meta.badgeClass} />
            </div>
          </div>

          <div className="mb-6">
            <StepProgress currentStep={meta.currentStep} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <section className="border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {isActive ? "สถานะปัจจุบัน" : "สิ่งที่ต้องทำตอนนี้"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    ติดตามขั้นตอนถัดไปเพื่อให้หน่วยพร้อมใช้งานในระบบ
                  </p>
                </div>

                <div className="space-y-3 px-5 py-5">
                  {meta.nextSteps.map((step, index) => (
                    <StepItem
                      key={step}
                      index={index + 1}
                      text={step}
                      done={isActive}
                    />
                  ))}
                </div>

                {(status === "rejected" || status === "suspended") && (
                  <div className="border-t border-slate-200 px-5 py-4">
                    <button
                      type="button"
                      onClick={handleRegisterAnother}
                      className="inline-flex h-10 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      สมัครใหม่อีกครั้ง
                    </button>
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-5">
              {isActive ? (
                <section className="border border-emerald-200 bg-white">
                  <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-4">
                    <p className="text-sm font-semibold text-emerald-800">
                      เชื่อมต่อสำเร็จแล้ว
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      หน่วยของคุณพร้อมรับแจ้งเหตุจากระบบ
                    </p>
                  </div>

                  <div className="px-5 py-5">
                    <div className="border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-emerald-600 bg-emerald-600 text-xl font-semibold text-white">
                        ✓
                      </div>

                      <p className="mt-3 text-base font-semibold text-emerald-900">
                        หน่วยของคุณพร้อมใช้งาน
                      </p>

                      <p className="mt-2 text-sm leading-6 text-emerald-700">
                        ระบบเชื่อม LINE เรียบร้อยแล้ว
                        สามารถรับแจ้งเหตุอัตโนมัติได้ทันที
                      </p>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      รหัสผูก LINE
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      ใช้รหัสนี้เพื่อผูกบัญชีหรือเชื่อม LINE กลุ่มกับระบบ
                    </p>
                  </div>

                  <div className="px-5 py-5">
                    <div className="border border-slate-200 bg-slate-50 px-4 py-5 text-center">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        Connect Code
                      </p>
                      <p className="mt-3 break-all text-2xl font-semibold tracking-wide text-slate-900">
                        {connectCode}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="mt-4 inline-flex h-10 w-full items-center justify-center border border-slate-900 bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      {copied ? "คัดลอกแล้ว" : "คัดลอกรหัส"}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}