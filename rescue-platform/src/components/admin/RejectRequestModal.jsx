import { useEffect, useState } from "react";

const PRESET_REASONS = [
  "ข้อมูลยังไม่ครบถ้วน",
  "ยังไม่ผูก LINE ผู้ใช้",
  "พิกัดฐานปฏิบัติการไม่ถูกต้อง",
  "ข้อมูลผู้ประสานงานไม่ครบ",
  "ต้องการเอกสารเพิ่มเติม",
];

export default function RejectRequestModal({
  open,
  requestName,
  loading = false,
  onClose,
  onConfirm,
}) {
  const [reason, setReason] = useState("ข้อมูลยังไม่ครบถ้วน");

  useEffect(() => {
    if (open) {
      setReason("ข้อมูลยังไม่ครบถ้วน");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedReason = reason.trim();

    if (!trimmedReason) return;
    onConfirm?.(trimmedReason);
  };

  const canSubmit = reason.trim().length > 0 && !loading;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            ปฏิเสธคำขอสมัคร
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            กรุณาระบุเหตุผลในการปฏิเสธ
            {requestName ? ` สำหรับ "${requestName}"` : ""}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                เลือกเหตุผลอย่างรวดเร็ว
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_REASONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setReason(item)}
                    className={
                      reason === item
                        ? "border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                        : "border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="reject-reason"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                เหตุผลในการปฏิเสธ
              </label>
              <textarea
                id="reject-reason"
                rows={5}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ระบุเหตุผล..."
                className="w-full resize-none border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-500"
                disabled={loading}
                autoFocus
              />
              <p className="mt-2 text-xs text-slate-500">
                เหตุผลนี้จะถูกบันทึกไว้ในคำขอ เพื่อให้ตรวจสอบย้อนหลังได้
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="border border-rose-700 bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "กำลังปฏิเสธ..." : "ยืนยันการปฏิเสธ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}