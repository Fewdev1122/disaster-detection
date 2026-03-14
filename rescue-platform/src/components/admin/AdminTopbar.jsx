export default function AdminTopbar() {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between px-6">

        {/* LEFT */}
        <div className="flex items-center gap-4">

          <h1 className="text-sm font-semibold text-slate-900">
            Admin Dashboard
          </h1>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500">
              Disaster Management System
            </span>
          </div>

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {/* SEARCH */}
          <div className="hidden lg:block">
            <input
              type="text"
              placeholder="Search unit, incident..."
              className="w-[240px] border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>

          {/* PROVINCE FILTER */}
          <select className="border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none">
            <option>All provinces</option>
            <option>Chiang Rai</option>
            <option>Chiang Mai</option>
            <option>Phayao</option>
          </select>

          {/* REFRESH */}
          <button className="border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Refresh
          </button>

          {/* NOTIFICATION */}
          <button className="relative border border-slate-300 px-2 py-1.5 text-sm hover:bg-slate-50">
            Alerts
            <span className="absolute -right-1 -top-1 rounded bg-rose-600 px-1 text-[10px] text-white">
              3
            </span>
          </button>

          {/* ADMIN */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">

            <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-xs font-semibold text-white">
              A
            </div>

            <div className="hidden text-left lg:block">
              <p className="text-xs font-semibold text-slate-900">
                Admin
              </p>
              <p className="text-[11px] text-slate-500">
                system admin
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}