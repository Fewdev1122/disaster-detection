import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { getApprovedRescueUnits, getRescueRequests } from "../../services/adminRescueService";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
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

function SummaryCard({ label, value, tone = "slate" }) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-2xl font-semibold text-slate-900">{value}</span>
        <span className={cx("rounded border px-2 py-0.5 text-xs font-medium", toneClasses)}>
          Updated
        </span>
      </div>
    </div>
  );
}

function getStatusLabel(status) {
  switch (status) {
    case "active":
      return "พร้อมใช้งาน";
    case "pending":
      return "รอดำเนินการ";
    case "inactive":
      return "ไม่พร้อม";
    default:
      return status || "-";
  }
}

function getStatusClasses(status) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "inactive":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function DetailItem({ label, value, full = false }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-slate-700">{value || "-"}</p>
    </div>
  );
}

export default function AdminRescueUnitsPage() {
  const [units, setUnits] = useState([]);
  const [pendingUnits, setPendingUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUnits = async () => {
    try {
      setLoading(true);
      setError("");

      const [activeData, pendingData] = await Promise.all([
        getApprovedRescueUnits(),
        getRescueRequests("pending_review"),
      ]);

      const normalizedPending = (pendingData || []).map((item) => ({
        id: item.id,
        name: item.name || "-",
        coordinator_name: item.coordinator_name || "-",
        phone: item.phone || "-",
        province: item.province || "-",
        district: item.district || "-",
        address: item.address || "-",
        base_lat: item.base_lat ?? item.lat ?? null,
        base_lng: item.base_lng ?? item.lng ?? null,
        coverage_km:
          item.coverage_km ??
          item.coverage_radius_km ??
          item.coverageRadiusKm ??
          0,
        status: "pending",
        line_user_id: item.line_user_id || null,
        line_group_id: item.line_group_id || null,
        created_at: item.created_at || null,
      }));

      setUnits(activeData || []);
      setPendingUnits(normalizedPending);

      const allUnits = [...(activeData || []), ...normalizedPending];
      setSelectedUnit(allUnits[0] || null);
    } catch (err) {
      console.error(err);
      setError(err.message || "โหลดข้อมูลหน่วยกู้ภัยไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const allUnits = useMemo(() => [...units, ...pendingUnits], [units, pendingUnits]);

  const filteredUnits = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return allUnits.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;

      const matchesSearch = keyword
        ? [
            item.name,
            item.coordinator_name,
            item.phone,
            item.province,
            item.district,
            item.address,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword))
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [allUnits, search, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: allUnits.length,
      active: allUnits.filter((u) => u.status === "active").length,
      pending: allUnits.filter((u) => u.status === "pending").length,
      noLine: allUnits.filter((u) => !u.line_user_id).length,
    };
  }, [allUnits]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-100">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-4 border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Rescue Units</h1>
                <p className="mt-1 text-sm text-slate-500">
                  จัดการข้อมูลหน่วยกู้ภัยที่อยู่ในระบบ
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาชื่อหน่วย, จังหวัด, ผู้ประสานงาน..."
                  className="border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={loadUnits}
                  className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  รีเฟรช
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
              <SummaryCard label="Total Units" value={summary.total} />
              <SummaryCard label="Active Units" value={summary.active} tone="emerald" />
              <SummaryCard label="Pending Review" value={summary.pending} tone="amber" />
              <SummaryCard label="No LINE Linked" value={summary.noLine} tone="rose" />
            </div>
          </div>

          <div className="mb-4 border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "ทั้งหมด" },
                  { value: "active", label: "พร้อมใช้งาน" },
                  { value: "pending", label: "รอดำเนินการ" },
                  { value: "inactive", label: "ไม่พร้อม" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStatusFilter(item.value)}
                    className={
                      statusFilter === item.value
                        ? "border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                        : "border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="text-sm text-slate-500">
                ทั้งหมด {filteredUnits.length} รายการ
              </div>
            </div>
          </div>

          {error ? (
            <div className="mb-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <Panel
                title="Units list"
                subtitle="เลือกรายการเพื่อดูรายละเอียด"
              >
                {loading ? (
                  <div className="px-4 py-8 text-sm text-slate-500">
                    กำลังโหลดข้อมูลหน่วยกู้ภัย...
                  </div>
                ) : filteredUnits.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-slate-500">
                    ไม่พบข้อมูลหน่วยกู้ภัย
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Unit
                          </th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Area
                          </th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Coordinator
                          </th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            LINE
                          </th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredUnits.map((item) => {
                          const isSelected = selectedUnit?.id === item.id;

                          return (
                            <tr
                              key={`${item.status}-${item.id}`}
                              onClick={() => setSelectedUnit(item)}
                              className={
                                isSelected
                                  ? "cursor-pointer bg-blue-50"
                                  : "cursor-pointer hover:bg-slate-50"
                              }
                            >
                              <td className="px-4 py-3 align-top">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    {item.name || "-"}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    โทร: {item.phone || "-"}
                                  </p>
                                </div>
                              </td>

                              <td className="px-4 py-3 align-top text-sm text-slate-700">
                                <div>
                                  <p>{item.district || "-"}</p>
                                  <p className="text-xs text-slate-500">
                                    {item.province || "-"}
                                  </p>
                                </div>
                              </td>

                              <td className="px-4 py-3 align-top text-sm text-slate-700">
                                {item.coordinator_name || "-"}
                              </td>

                              <td className="px-4 py-3 align-top">
                                <span
                                  className={
                                    item.line_user_id
                                      ? "inline-flex rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                                      : "inline-flex rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                                  }
                                >
                                  {item.line_user_id ? "เชื่อมแล้ว" : "ยังไม่ผูก"}
                                </span>
                              </td>

                              <td className="px-4 py-3 align-top">
                                <span
                                  className={cx(
                                    "inline-flex rounded border px-2 py-1 text-xs font-medium",
                                    getStatusClasses(item.status)
                                  )}
                                >
                                  {getStatusLabel(item.status)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>

            <div className="xl:col-span-5">
              <Panel
                title="Unit details"
                subtitle="รายละเอียดหน่วยกู้ภัยที่เลือก"
              >
                {!selectedUnit ? (
                  <div className="px-4 py-10 text-sm text-slate-500">
                    เลือกรายการจากตารางด้านซ้ายเพื่อดูรายละเอียด
                  </div>
                ) : (
                  <div>
                    <div className="border-b border-slate-200 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {selectedUnit.name || "-"}
                        </h3>
                        <span
                          className={cx(
                            "inline-flex rounded border px-2 py-1 text-xs font-medium",
                            getStatusClasses(selectedUnit.status)
                          )}
                        >
                          {getStatusLabel(selectedUnit.status)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        ตรวจสอบข้อมูลพื้นฐานและสถานะการเชื่อมต่อ
                      </p>
                    </div>

                    <div className="grid gap-4 px-4 py-4 md:grid-cols-2">
                      <DetailItem label="ผู้ประสานงาน" value={selectedUnit.coordinator_name} />
                      <DetailItem label="เบอร์โทร" value={selectedUnit.phone} />
                      <DetailItem label="จังหวัด" value={selectedUnit.province} />
                      <DetailItem label="อำเภอ" value={selectedUnit.district} />
                      <DetailItem label="LINE Group ID" value={selectedUnit.line_group_id} />
                      <DetailItem
                        label="ผูก LINE"
                        value={selectedUnit.line_user_id ? "ใช่" : "ยังไม่ผูก"}
                      />
                      <DetailItem
                        label="พิกัดฐาน"
                        value={`${selectedUnit.base_lat ?? "-"}, ${selectedUnit.base_lng ?? "-"}`}
                      />
                      <DetailItem
                        label="รัศมีรับผิดชอบ"
                        value={
                          selectedUnit.coverage_km
                            ? `${selectedUnit.coverage_km} กม.`
                            : "-"
                        }
                      />
                      <DetailItem
                        label="วันที่สร้าง"
                        value={
                          selectedUnit.created_at
                            ? new Date(selectedUnit.created_at).toLocaleString("th-TH")
                            : "-"
                        }
                      />
                      <DetailItem label="สถานะระบบ" value={getStatusLabel(selectedUnit.status)} />
                      <DetailItem label="ที่อยู่" value={selectedUnit.address} full />
                    </div>

                    <div className="border-t border-slate-200 px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                          View on map
                        </button>
                        <button className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                          Edit unit
                        </button>
                        <button className="border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100">
                          Disable
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}