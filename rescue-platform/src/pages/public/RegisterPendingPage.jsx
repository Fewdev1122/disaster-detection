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
        badgeClass: "border-green-200 bg-green-50 text-green-700",
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
        badgeClass: "border-red-200 bg-red-50 text-red-700",
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
        badgeClass: "border-gray-300 bg-gray-100 text-gray-700",
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
        badgeClass: "border-gray-200 bg-gray-50 text-gray-700",
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

export default function RegisterPendingPage() {
  const navigate = useNavigate();
  const [pendingData] = useState(() => loadPendingData());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pendingData) {
      navigate("/rescue/register", { replace: true });
    }
  }, [pendingData, navigate]);

  if (!pendingData) return null;

  const { status = "pending_review", connectCode = "-" } = pendingData;
  const meta = getStatusMeta(status);
  const isActive = status === "active";

  const handleRegisterAnother = () => {
    localStorage.removeItem(REGISTER_PENDING_KEY);
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
      <div className="min-h-screen bg-slate-50 px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  สถานะการสมัครหน่วยกู้ภัย
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
                  {meta.title}
                </h1>
              </div>

              <div
                className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-medium ${meta.badgeClass}`}
              >
                {meta.badgeText}
              </div>
            </div>
          </div>

          <StepProgress currentStep={meta.currentStep} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isActive ? "สถานะปัจจุบัน" : "สิ่งที่ต้องทำตอนนี้"}
                </h2>

                <div className="mt-5 space-y-3">
                  {meta.nextSteps.map((step, index) => (
                    <div
                      key={step}
                      className="flex gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          isActive
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {isActive ? "✓" : index + 1}
                      </div>
                      <p className="text-sm leading-6 text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>

                {(status === "rejected" || status === "suspended") && (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={handleRegisterAnother}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      สมัครใหม่อีกครั้ง
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {isActive ? (
                <div className="rounded-3xl border border-green-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-green-800">
                    เชื่อมต่อสำเร็จแล้ว
                  </h2>

                  <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-600">
                      ✓
                    </div>
                    <p className="mt-3 text-base font-semibold text-green-800">
                      หน่วยของคุณพร้อมรับแจ้งเหตุ
                    </p>
                    <p className="mt-2 text-sm leading-6 text-green-700">
                      ระบบเชื่อม LINE เรียบร้อยแล้ว
                      สามารถใช้งานรับแจ้งเหตุอัตโนมัติได้ทันที
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-red-800">
                    รหัสผูก LINE
                  </h2>

                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-red-500">
                      Connect Code
                    </p>
                    <p className="mt-3 break-all text-2xl font-bold tracking-[0.18em] text-red-700">
                      {connectCode}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    {copied ? "คัดลอกแล้ว" : "คัดลอกรหัส"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}