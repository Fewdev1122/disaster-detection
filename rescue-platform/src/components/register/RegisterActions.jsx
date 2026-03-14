import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

export default function RegisterActions({
  submitting = false,
  onBack,
  submitLabel = "สมัครหน่วยกู้ภัย",
}) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ArrowLeftIcon />
        ย้อนกลับ
      </button>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "กำลังส่งคำขอ..." : submitLabel}
        {!submitting && <ArrowRightIcon />}
      </button>
    </div>
  );
}