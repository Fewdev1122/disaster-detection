import { NavLink } from "react-router-dom";

const primaryMenus = [
  { label: "Dashboard", to: "/admin" },
  { label: "Rescue Requests", to: "/admin/requests", badge: 8 },
  { label: "Rescue Units", to: "/admin/units" },
  { label: "Incidents", to: "/admin/incidents", badge: 3 },
  { label: "Live Map", to: "/admin/live-map" },
  { label: "Reports", to: "/admin/reports" },
];

const systemMenus = [
  { label: "Admins", to: "/admin/admins" },
  { label: "Settings", to: "/admin/settings" },
  { label: "Logs", to: "/admin/logs" },
];

function SidebarLink({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/admin"}
      className={({ isActive }) =>
        [
          "group flex items-center justify-between border-l-2 px-4 py-2.5 text-sm transition",
          isActive
            ? "border-blue-600 bg-blue-50 text-blue-700"
            : "border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={[
                "h-2 w-2 rounded-full",
                isActive ? "bg-blue-600" : "bg-slate-300 group-hover:bg-slate-400",
              ].join(" ")}
            />
            <span className="truncate font-medium">{item.label}</span>
          </div>

          {item.badge ? (
            <span
              className={[
                "ml-3 inline-flex min-w-6 items-center justify-center rounded px-1.5 py-0.5 text-xs font-semibold",
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
              ].join(" ")}
            >
              {item.badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

function SidebarSection({ title, items }) {
  return (
    <div>
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-slate-900 text-sm font-bold text-white">
            R
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              Rescue Admin
            </p>
            <p className="truncate text-xs text-slate-500">
              Disaster Management System
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-6">
          <SidebarSection title="Operations" items={primaryMenus} />
          <SidebarSection title="System" items={systemMenus} />
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold text-slate-900">System status</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600">All services operational</span>
          </div>
        </div>

        <button className="mt-3 w-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Logout
        </button>
      </div>
    </aside>
  );
}