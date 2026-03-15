import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import RescueUnitsMapPanel from "../../components/admin/RescueUnitsMapPanel";
import {
  getApprovedRescueUnits,
  getRescueRequests,
} from "../../services/adminRescueService";
import { getRecentIncidents } from "../../services/incidentService";

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
    case "slate":
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function disasterBadge(type) {
  switch (type) {
    case "fire":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "flood":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "smoke":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "fog":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "dust":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCoordinate(lat, lng) {
  if (lat == null || lng == null) return "-";
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}

function getIncidentCoordinate(item) {
  if (item?.event_lat != null && item?.event_lng != null) {
    return {
      lat: Number(item.event_lat),
      lng: Number(item.event_lng),
      source: "event",
    };
  }

  if (item?.photo_lat != null && item?.photo_lng != null) {
    return {
      lat: Number(item.photo_lat),
      lng: Number(item.photo_lng),
      source: "photo",
    };
  }

  return null;
}

function formatIncidentLocation(item) {
  const point = getIncidentCoordinate(item);
  if (!point) return "-";
  return formatCoordinate(point.lat, point.lng);
}

function getIncidentLocationLabel(item) {
  const point = getIncidentCoordinate(item);
  if (!point) return "";
  return point.source === "event" ? "Event" : "Photo";
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistanceToUnit(item) {
  const incidentPoint = getIncidentCoordinate(item);

  const unitLat =
    item?.rescue_units?.base_lat != null
      ? Number(item.rescue_units.base_lat)
      : null;
  const unitLng =
    item?.rescue_units?.base_lng != null
      ? Number(item.rescue_units.base_lng)
      : null;

  if (!incidentPoint || unitLat == null || unitLng == null) {
    return "-";
  }

  const distance = haversineKm(
    incidentPoint.lat,
    incidentPoint.lng,
    unitLat,
    unitLng
  );

  if (Number.isNaN(distance)) return "-";
  return `${distance.toFixed(1)} km`;
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
            <span
              className={cx(
                "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                toneBadge(item.tone)
              )}
            >
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
  const navigate = useNavigate();

  const actionRequired = [
    {
      id: 1,
      title: "Rescue applications awaiting approval",
      count: pendingCount,
      description: "มีคำขอสมัครใหม่ที่ยังไม่ได้ตรวจสอบ",
      action: "Review requests",
      tone: "amber",
      to: "/admin/requests",
    },
    {
      id: 2,
      title: "Units without LINE connection",
      count: unitsWithoutLine,
      description: "หน่วยที่อนุมัติแล้วแต่ยังเชื่อม LINE ไม่สมบูรณ์",
      action: "Check units",
      tone: "rose",
      to: "/admin/units",
    },
    {
      id: 3,
      title: "Inactive rescue units",
      count: inactiveUnits,
      description: "หน่วยที่ยังไม่พร้อมใช้งานหรือปิดอยู่",
      action: "View status",
      tone: "slate",
      to: "/admin/units",
    },
  ];

  return (
    <Panel
      title="Action required"
      subtitle="สิ่งที่ควรจัดการก่อน"
      right={
        <button
          type="button"
          onClick={() => navigate("/admin/requests")}
          className="text-xs font-medium text-blue-700 hover:text-blue-800"
        >
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
                  <span
                    className={cx(
                      "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                      toneBadge(item.tone)
                    )}
                  >
                    Open
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-800">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.description}</p>
              </div>

              <button
                type="button"
                onClick={() => navigate(item.to)}
                className="shrink-0 rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
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

function RecentIncidentsTable({ incidents }) {
  const columns = [
    { key: "type", label: "Type" },
    { key: "confidence", label: "Confidence" },
    { key: "unit", label: "Unit" },
    { key: "reportedAt", label: "Reported At" },
    { key: "location", label: "Location" },
    { key: "distance", label: "Distance to Unit" },
    { key: "image", label: "Image" },
  ];

  return (
    <Panel title="Recent Incidents" subtitle="เหตุล่าสุดที่ระบบตรวจพบ">
      <DataTable
        columns={columns}
        rows={incidents}
        emptyText="ยังไม่มีข้อมูลเหตุล่าสุด"
        renderRow={(item) => {
          const point = getIncidentCoordinate(item);
          const locationText = formatIncidentLocation(item);
          const locationLabel = getIncidentLocationLabel(item);

          return (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <span
                  className={cx(
                    "inline-flex rounded px-2 py-1 text-xs font-medium",
                    disasterBadge(item.disaster_type)
                  )}
                >
                  {item.disaster_type || "-"}
                </span>
              </td>

              <td className="px-4 py-3 text-sm text-slate-700">
                {item.confidence != null
                  ? `${(Number(item.confidence) * 100).toFixed(0)}%`
                  : "-"}
              </td>

              <td className="px-4 py-3 text-sm text-slate-700">
                {item.rescue_units?.name || item.rescue_unit_name || "-"}
              </td>

              <td className="px-4 py-3 text-sm text-slate-700">
                {formatDateTime(item.created_at)}
              </td>

              <td className="px-4 py-3 text-sm text-slate-700">
                {point ? (
                  <div className="flex flex-col">
                    <a
                      href={`https://www.google.com/maps?q=${point.lat},${point.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {locationText}
                    </a>
                    {locationLabel ? (
                      <span className="mt-0.5 text-xs text-slate-500">
                        {locationLabel} coordinates
                      </span>
                    ) : null}
                  </div>
                ) : (
                  "-"
                )}
              </td>

              <td className="px-4 py-3 text-sm text-slate-700">
                {formatDistanceToUnit(item)}
              </td>

              <td className="px-4 py-3 text-sm">
                {item.image_url ? (
                  <a
                    href={item.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </a>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          );
        }}
      />
    </Panel>
  );
}

export default function AdminDashboard() {
  const [units, setUnits] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [error, setError] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");

  const loadDashboardData = async () => {
    try {
      setError("");
      setLoading(true);
      setLoadingRequests(true);
      setLoadingIncidents(true);

      const [unitsData, requestsData, incidentsData] = await Promise.all([
        getApprovedRescueUnits(),
        getRescueRequests("pending_review"),
        getRecentIncidents(),
      ]);

      console.log("unitsData:", unitsData);
      console.log("requestsData:", requestsData);
      console.log("incidentsData:", incidentsData);

      setUnits(unitsData || []);
      setPendingRequests(requestsData || []);
      setRecentIncidents((incidentsData || []).slice(0, 5));
    } catch (err) {
      console.error(err);
      setError(err.message || "โหลดข้อมูล dashboard ไม่สำเร็จ");
    } finally {
      setLoading(false);
      setLoadingRequests(false);
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const provinces = useMemo(() => {
    return [...new Set(units.map((u) => u.province).filter(Boolean))].sort();
  }, [units]);

  const filteredUnits = useMemo(() => {
    if (!selectedProvince) return units;
    return units.filter((u) => u.province === selectedProvince);
  }, [units, selectedProvince]);

  const filteredPendingRequests = useMemo(() => {
    if (!selectedProvince) return pendingRequests;
    return pendingRequests.filter((item) => item.province === selectedProvince);
  }, [pendingRequests, selectedProvince]);

  const filteredRecentIncidents = useMemo(() => {
    if (!selectedProvince) return recentIncidents;

    return recentIncidents.filter((item) => {
      const unitProvince = item?.rescue_units?.province;
      return unitProvince === selectedProvince;
    });
  }, [recentIncidents, selectedProvince]);

  const summaryItems = useMemo(() => {
    const activeUnits = filteredUnits.filter((u) => u.status === "active").length;
    const pendingUnits = filteredUnits.filter((u) => u.status === "pending").length;
    const unitsWithoutLine = filteredUnits.filter((u) => !u.line_user_id).length;

    return [
      {
        label: "Pending approvals",
        value: filteredPendingRequests.length,
        tone: "amber",
        note: "Needs review",
      },
      {
        label: "Approved units",
        value: filteredUnits.length,
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
  }, [filteredUnits, filteredPendingRequests]);

  const refreshing = loading || loadingRequests || loadingIncidents;

  return (
    <AdminLayout
      title="แดชบอร์ดผู้ดูแลระบบ"
      onRefresh={loadDashboardData}
      refreshing={refreshing}
      provinces={provinces}
      selectedProvince={selectedProvince}
      onProvinceChange={setSelectedProvince}
    >
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
                <RescueUnitsMapPanel
                  units={filteredUnits}
                  incidents={filteredRecentIncidents}
                />
              )}
            </div>

            <div className="xl:col-span-4">
              <ActionRequiredPanel
                pendingCount={filteredPendingRequests.length}
                unitsWithoutLine={filteredUnits.filter((u) => !u.line_user_id).length}
                inactiveUnits={filteredUnits.filter((u) => u.status === "inactive").length}
              />
            </div>
          </div>

          <div className="mt-4">
            {loadingIncidents ? (
              <div className="border border-slate-200 bg-white px-4 py-10 text-sm text-slate-500">
                กำลังโหลดเหตุล่าสุด...
              </div>
            ) : (
              <RecentIncidentsTable incidents={filteredRecentIncidents} />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}