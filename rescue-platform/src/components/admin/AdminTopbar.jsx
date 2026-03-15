export default function AdminTopbar({
  title = "แดชบอร์ดผู้ดูแลระบบ",
  onRefresh,
  refreshing = false,
  provinces = [],
  selectedProvince = "",
  onProvinceChange,
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-slate-900">{title}</h1>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500">ระบบจัดการภัยพิบัติ</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProvince}
            onChange={(e) => onProvinceChange?.(e.target.value)}
            className="border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none"
          >
            <option value="">ทุกจังหวัด</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onRefresh}
            disabled={!onRefresh || refreshing}
            className="border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}
          </button>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-xs font-semibold text-white">
              A
            </div>

            <div className="hidden text-left lg:block">
              <p className="text-xs font-semibold text-slate-900">ผู้ดูแลระบบ</p>
              <p className="text-[11px] text-slate-500">system admin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}