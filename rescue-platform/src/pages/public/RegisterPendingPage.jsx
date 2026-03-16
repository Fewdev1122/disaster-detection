import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import StepProgress from "../../components/register/StepProgress";
import { getRescueRegistrationStatus } from "../../services/rescueService";

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

function savePendingData(data) {
  try {
    localStorage.setItem(REGISTER_PENDING_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save pending data:", err);
  }
}

function StatusBadge({ text, className }) {
  return (
    <div
      className={`inline-flex border px-3 py-1.5 text-sm font-medium ${className}`}
    >
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchLatestStatus = useCallback(
    async ({ silent = false } = {}) => {
      const localData = loadPendingData();

      if (!localData?.requestId) {
        navigate("/rescue/register", { replace: true });
        return;
      }

      try {
        if (!silent) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const result = await getRescueRegistrationStatus(localData.requestId);
        const serverData = result?.data || result;

        const mergedData = {
          ...localData,
          requestId: serverData?.id || localData.requestId,
          status: serverData?.status || localData.status || "pending_review",
          connectCode:
            serverData?.connectCode ||
            serverData?.connect_code ||
            localData.connectCode ||
            "-",
          name: serverData?.name || localData.name || "",
          reviewNote:
            serverData?.reviewNote ||
            serverData?.review_note ||
            localData.reviewNote ||
            "",
          updatedAt: serverData?.updatedAt || localData.updatedAt || null,
          lineGroupId:
            serverData?.lineGroupId ||
            serverData?.line_group_id ||
            localData.lineGroupId ||
            null,
          lineUserId:
            serverData?.lineUserId ||
            serverData?.line_user_id ||
            localData.lineUserId ||
            null,
          connectCodeUsed:
            typeof serverData?.connectCodeUsed === "boolean"
              ? serverData.connectCodeUsed
              : typeof serverData?.connect_code_used === "boolean"
              ? serverData.connect_code_used
              : localData.connectCodeUsed || false,
        };

        setPendingData(mergedData);
        savePendingData(mergedData);
      } catch (err) {
        console.error("Fetch registration status failed:", err);
        setPendingData(localData);
        setError(err.message || "โหลดสถานะไม่สำเร็จ");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    const localData = loadPendingData();

    if (!localData?.requestId) {
      navigate("/rescue/register", { replace: true });
      return;
    }

    fetchLatestStatus();

    const interval = setInterval(() => {
      fetchLatestStatus({ silent: true });
    }, 5000);

    const handleFocus = () => {
      fetchLatestStatus({ silent: true });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchLatestStatus, navigate]);

  const handleRegisterAnother = () => {
    localStorage.removeItem(REGISTER_PENDING_KEY);
    setPendingData(null);
    navigate("/rescue/register");
  };

  const handleCopyCode = async () => {
    const code = pendingData?.connectCode || "-";

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-100">
          <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
            <div className="border border-slate-200 bg-white px-6 py-8">
              <p className="text-sm font-medium text-slate-900">
                กำลังตรวจสอบสถานะล่าสุด...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                กรุณารอสักครู่ ระบบกำลังดึงข้อมูลจากเซิร์ฟเวอร์
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!pendingData) return null;

  const {
    status = "pending_review",
    connectCode = "-",
    reviewNote = "",
    updatedAt,
  } = pendingData;

  const meta = getStatusMeta(status);
  const isActive = status === "active";
  const isApproved = status === "approved";
  const showConnectCodeCard =
    status === "pending_review" || status === "approved";

  return (
    <Layout>
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
          {error ? (
            <div className="mb-6 border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                โหลดสถานะล่าสุดไม่สำเร็จ
              </p>
              <p className="mt-1 text-sm text-amber-700">
                ตอนนี้กำลังแสดงข้อมูลล่าสุดที่มีอยู่ในเครื่อง
              </p>
            </div>
          ) : null}

          <div className="mb-6 border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  สถานะการสมัครหน่วยกู้ภัย
                </p>
                <h1 className="mt-1 text-xl font-semibold text-slate-900 lg:text-2xl">
                  {meta.title}
                </h1>

                {updatedAt ? (
                  <p className="mt-2 text-xs text-slate-500">
                    อัปเดตล่าสุด: {new Date(updatedAt).toLocaleString("th-TH")}
                    {refreshing ? " • กำลังรีเฟรช..." : ""}
                  </p>
                ) : refreshing ? (
                  <p className="mt-2 text-xs text-slate-500">กำลังรีเฟรช...</p>
                ) : null}
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

                {reviewNote ? (
                  <div className="border-t border-slate-200 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      หมายเหตุจากผู้ดูแล
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {reviewNote}
                    </p>
                  </div>
                ) : null}

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
              ) : showConnectCodeCard ? (
                <section className="border border-slate-200 bg-white">
                  <div
                    className={`border-b px-5 py-4 ${
                      isApproved
                        ? "border-blue-200 bg-blue-50"
                        : "border-slate-200"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        isApproved ? "text-blue-800" : "text-slate-900"
                      }`}
                    >
                      รหัสผูก LINE
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isApproved ? "text-blue-700" : "text-slate-500"
                      }`}
                    >
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
              ) : (
                <section className="border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      สถานะหน่วยกู้ภัย
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      ระบบจะแสดงข้อมูลตามสถานะล่าสุดของคำขอ
                    </p>
                  </div>

                  <div className="px-5 py-5">
                    <div className="border border-slate-200 bg-slate-50 px-4 py-5">
                      <p className="text-sm leading-6 text-slate-700">
                        โปรดติดตามสถานะจากหน้านี้อีกครั้ง หากมีการเปลี่ยนแปลงจากผู้ดูแล
                        ระบบจะอัปเดตให้อัตโนมัติ
                      </p>
                    </div>
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