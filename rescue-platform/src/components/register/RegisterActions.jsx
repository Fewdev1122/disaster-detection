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
        className="inline-flex h-10 items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ArrowLeftIcon />
        ย้อนกลับ
      </button>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-10 items-center justify-center gap-2 border border-slate-900 bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "กำลังส่งคำขอ..." : submitLabel}
        {!submitting && <ArrowRightIcon />}
      </button>
    </div>
  );
}