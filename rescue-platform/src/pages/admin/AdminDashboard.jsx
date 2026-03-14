import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import RescueUnitsMapPanel from "../../components/admin/RescueUnitsMapPanel";
import {
  getApprovedRescueUnits,
  getRescueRequests,
} from "../../services/adminRescueService";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function toneBadge(tone) {
  switch (tone) {
    case "rose":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "amber":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "emerald":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function Panel({ title, subtitle, right, children, className = "" }) {
  return (
    <section className={cx("border border-slate-200 bg-white", className)}>
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

function SummaryBar({ items }) {
  return (
    <div className="grid grid-cols-2 border border-slate-200 bg-white lg:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cx(
            "px-4 py-3",
            index !== items.length - 1 && "border-r border-slate-200"
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {item.label}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-2xl font-semibold text-slate-900">{item.value}</span>
            <span className={cx("inline-flex rounded px-2 py-0.5 text-xs font-medium", toneBadge(item.tone))}>
              {item.note}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionRequiredPanel({
  pendingCount,
  unitsWithoutLine,
  inactiveUnits,
}) {
  const actionRequired = [
    {
      id: 1,
      title: "Rescue applications awaiting approval",
      count: pendingCount,
      description: "มีคำขอสมัครใหม่ที่ยังไม่ได้ตรวจสอบ",
      action: "Review requests",
      tone: "amber",
    },
    {
      id: 2,
      title: "Units without LINE connection",
      count: unitsWithoutLine,
      description: "หน่วยที่อนุมัติแล้วแต่ยังเชื่อม LINE ไม่สมบูรณ์",
      action: "Check units",
      tone: "rose",
    },
    {
      id: 3,
      title: "Inactive rescue units",
      count: inactiveUnits,
      description: "หน่วยที่ยังไม่พร้อมใช้งานหรือปิดอยู่",
      action: "View status",
      tone: "slate",
    },
  ];

  return (
    <Panel
      title="Action required"
      subtitle="สิ่งที่ควรจัดการก่อน"
      right={
        <button className="text-xs font-medium text-blue-700 hover:text-blue-800">
          View all
        </button>
      }
      className="h-full"
    >
      <div className="divide-y divide-slate-200">
        {actionRequired.map((item) => (
          <div key={item.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-900">{item.count}</span>
                  <span className={cx("inline-flex rounded px-2 py-0.5 text-xs font-medium", toneBadge(item.tone))}>
                    Open
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-800">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.description}</p>
              </div>

              <button className="shrink-0 rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                {item.action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DataTable({ columns, rows, renderRow, emptyText = "No data" }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-sm text-slate-500"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map(renderRow)
          )}
        </tbody>
      </table>
    </div>
  );
}

function PendingApplicationsTable({ requests }) {
  const columns = [
    { key: "unitName", label: "Unit name" },
    { key: "province", label: "Province" },
    { key: "district", label: "District" },
    { key: "coordinator", label: "Coordinator" },
    { key: "submittedAt", label: "Submitted at" },
    { key: "line", label: "LINE" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <Panel
      title="Pending applications"
      subtitle="รายการหน่วยกู้ภัยที่รออนุมัติ"
      right={
        <button className="border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
          Export
        </button>
      }
    >
      <DataTable
        columns={columns}
        rows={requests}
        renderRow={(item) => (
          <tr key={item.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 text-sm font-medium text-slate-900">
              {item.name || "-"}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">{item.province || "-"}</td>
            <td className="px-4 py-3 text-sm text-slate-700">{item.district || "-"}</td>
            <td className="px-4 py-3 text-sm text-slate-700">
              {item.coordinator_name || "-"}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">
              {item.created_at
                ? new Date(item.created_at).toLocaleString("th-TH")
                : "-"}
            </td>
            <td className="px-4 py-3">
              <span
                className={
                  item.line_user_id
                    ? "inline-flex rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                    : "inline-flex rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                }
              >
                {item.line_user_id ? "Connected" : "Not linked"}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <button className="border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  View
                </button>
                <button className="border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                  Approve
                </button>
              </div>
            </td>
          </tr>
        )}
      />
    </Panel>
  );
}

function MiniStatsPanel({ title, subtitle, items, formatter = (v) => v }) {
  return (
    <Panel title={title} subtitle={subtitle}>
      <div className="divide-y divide-slate-200">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-700">{item.label}</span>
            <span className="text-sm font-semibold text-slate-900">
              {formatter(item.value)}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function AdminDashboard() {
  const [units, setUnits] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState("");
  
 
  const loadDashboardData = async () => {
    try {
      setError("");
      setLoading(true);
      setLoadingRequests(true);

      const [unitsData, requestsData] = await Promise.all([
        getApprovedRescueUnits(),
        getRescueRequests("pending_review"),
      ]);
      const incidents = await getRecentIncidents();

      console.log("unitsData:", unitsData);
      console.log("requestsData:", requestsData);

      setUnits(unitsData || []);
      setPendingRequests(requestsData || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "โหลดข้อมูล dashboard ไม่สำเร็จ");
    } finally {
      setLoading(false);
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

  }, []);

  const summaryItems = useMemo(() => {
    const activeUnits = units.filter((u) => u.status === "active").length;
    const pendingUnits = units.filter((u) => u.status === "pending").length;
    const unitsWithoutLine = units.filter((u) => !u.line_user_id).length;

    return [
      {
        label: "Pending approvals",
        value: pendingRequests.length,
        tone: "amber",
        note: "Needs review",
      },
      {
        label: "Approved units",
        value: units.length,
        tone: "emerald",
        note: "Registered",
      },
      {
        label: "Active units",
        value: activeUnits,
        tone: "rose",
        note: "Operational",
      },
      {
        label: "No LINE connection",
        value: unitsWithoutLine,
        tone: "slate",
        note: pendingUnits > 0 ? `${pendingUnits} pending` : "Check setup",
      },
    ];
  }, [units, pendingRequests]);

  const unitStatusStats = useMemo(() => {
    return [
      { label: "Active", value: units.filter((u) => u.status === "active").length },
      { label: "Pending setup", value: units.filter((u) => u.status === "pending").length },
      { label: "Inactive", value: units.filter((u) => u.status === "inactive").length },
    ];
  }, [units]);

  const coverageStats = useMemo(() => {
    const provinceSet = new Set(units.map((u) => u.province).filter(Boolean));
    const districtSet = new Set(
      units.map((u) => `${u.province}-${u.district}`).filter(Boolean)
    );
    const lineConnected = units.filter((u) => u.line_user_id).length;
    const avgCoverage =
      units.length > 0
        ? (
          units.reduce((sum, u) => sum + Number(u.coverage_km || 0), 0) / units.length
        ).toFixed(1)
        : "0.0";

    return [
      { label: "Covered provinces", value: provinceSet.size },
      { label: "Covered districts", value: districtSet.size },
      { label: "LINE connected units", value: lineConnected },
      { label: "Average coverage radius", value: `${avgCoverage} กม.` },
    ];
  }, [units]);

  const networkReadinessStats = useMemo(() => {
    const total = units.length || 1;
    const active = units.filter((u) => u.status === "active").length;
    const lineConnected = units.filter((u) => u.line_user_id).length;
    const withCoordinates = units.filter(
      (u) => u.base_lat != null && u.base_lng != null
    ).length;

    return [
      {
        label: "Operational readiness",
        value: `${Math.round((active / total) * 100)}%`,
      },
      {
        label: "LINE setup completion",
        value: `${Math.round((lineConnected / total) * 100)}%`,
      },
      {
        label: "Map data completeness",
        value: `${Math.round((withCoordinates / total) * 100)}%`,
      },
    ];
  }, [units]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-100">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="mb-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mb-4">
            <SummaryBar items={summaryItems} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-8">
              {loading ? (
                <div className="border border-slate-200 bg-white px-4 py-10 text-sm text-slate-500">
                  กำลังโหลดข้อมูลแผนที่...
                </div>
              ) : (
                <RescueUnitsMapPanel units={units} />
              )}
            </div>

            <div className="xl:col-span-4">
              <ActionRequiredPanel
                pendingCount={pendingRequests.length}
                unitsWithoutLine={units.filter((u) => !u.line_user_id).length}
                inactiveUnits={units.filter((u) => u.status === "inactive").length}
              />
            </div>
          </div>

          <div className="mt-4">
            {loadingRequests ? (
              <div className="border border-slate-200 bg-white px-4 py-10 text-sm text-slate-500">
                กำลังโหลดรายการคำขอ...
              </div>
            ) : (
              <PendingApplicationsTable requests={pendingRequests} />
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MiniStatsPanel
              title="Unit status"
              subtitle="สถานะโดยรวมของหน่วยกู้ภัย"
              items={unitStatusStats}
            />
            <MiniStatsPanel
              title="Coverage summary"
              subtitle="ภาพรวมพื้นที่ที่ระบบครอบคลุม"
              items={coverageStats}
            />
            <MiniStatsPanel
              title="Network readiness"
              subtitle="ความพร้อมใช้งานของเครือข่าย"
              items={networkReadinessStats}
            />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={loadDashboardData}
              className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh dashboard
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}