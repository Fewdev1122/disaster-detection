import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import RejectRequestModal from "../../components/admin/RejectRequestModal";
import {
  approveRescueRequest,
  getRescueRequests,
  rejectRescueRequest,
} from "../../services/adminRescueService";

function getStatusLabel(status) {
  switch (status) {
    case "pending_review":
      return "รอตรวจสอบ";
    case "approved":
      return "อนุมัติแล้ว";
    case "rejected":
      return "ไม่ผ่าน";
    default:
      return status || "-";
  }
}

function getStatusClasses(status) {
  switch (status) {
    case "pending_review":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function formatDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("th-TH");
  } catch {
    return value;
  }
}

function SummaryCard({ label, value, tone = "slate" }) {
  const toneClasses =
    tone === "amber"
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : tone === "emerald"
        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
        : tone === "rose"
          ? "text-rose-700 bg-rose-50 border-rose-200"
          : "text-slate-700 bg-slate-50 border-slate-200";

  return (
    <div className="border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-2xl font-semibold text-slate-900">{value}</span>
        <span className={`rounded border px-2 py-0.5 text-xs font-medium ${toneClasses}`}>
          Updated
        </span>
      </div>
    </div>
  );
}

function DetailItem({ label, value, full = false }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-700 break-words">{value || "-"}</p>
    </div>
  );
}

export default function AdminRescueRequestsPage() {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");

  const loadRequests = async (status = statusFilter) => {
    try {
      setLoading(true);
      setError("");
      const data = await getRescueRequests(status);
      setRequests(data || []);
      if (selectedRequest) {
        const updated = (data || []).find((item) => item.id === selectedRequest.id);
        setSelectedRequest(updated || null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "โหลดรายการคำขอไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return requests;

    return requests.filter((item) => {
      return [
        item.name,
        item.coordinator_name,
        item.phone,
        item.province,
        item.district,
        item.address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [requests, search]);

  const summary = useMemo(() => {
    const pending = requests.filter((item) => item.status === "pending_review").length;
    const approved = requests.filter((item) => item.status === "approved").length;
    const rejected = requests.filter((item) => item.status === "rejected").length;
    const lineLinked = requests.filter((item) => item.line_user_id).length;

    return { pending, approved, rejected, lineLinked };
  }, [requests]);

  const handleApprove = async (id) => {
    try {
      setActionLoadingId(id);
      await approveRescueRequest(id, "ข้อมูลครบถ้วน อนุมัติเรียบร้อย");
      await loadRequests(statusFilter);
    } catch (err) {
      console.error(err);
      alert(err.message || "อนุมัติคำขอไม่สำเร็จ");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (requestItem) => {
    setRejectTarget(requestItem);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async (reviewNote) => {
    if (!rejectTarget) return;

    try {
      setActionLoadingId(rejectTarget.id);
      await rejectRescueRequest(rejectTarget.id, reviewNote);
      setRejectModalOpen(false);
      setRejectTarget(null);
      await loadRequests(statusFilter);
    } catch (err) {
      console.error(err);
      alert(err.message || "ปฏิเสธคำขอไม่สำเร็จ");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-100">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-4 border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Rescue Requests
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  ตรวจสอบ อนุมัติ หรือปฏิเสธคำขอสมัครหน่วยกู้ภัย
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาชื่อหน่วย, ผู้ประสานงาน, จังหวัด..."
                  className="border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => loadRequests(statusFilter)}
                  className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  รีเฟรช
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">
              <SummaryCard label="Pending" value={summary.pending} tone="amber" />
              <SummaryCard label="Approved" value={summary.approved} tone="emerald" />
              <SummaryCard label="Rejected" value={summary.rejected} tone="rose" />
              <SummaryCard label="LINE Linked" value={summary.lineLinked} tone="slate" />
            </div>
          </div>

          <div className="mb-4 border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "pending_review", label: "รอตรวจสอบ" },
                  { value: "approved", label: "อนุมัติแล้ว" },
                  { value: "rejected", label: "ไม่ผ่าน" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(item.value);
                      setSelectedRequest(null);
                    }}
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
                ทั้งหมด {filteredRequests.length} รายการ
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <div className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Request list
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      เลือกรายการเพื่อดูรายละเอียดและดำเนินการ
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="px-4 py-8 text-sm text-slate-500">
                    กำลังโหลดรายการคำขอ...
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-slate-500">
                    ไม่พบรายการคำขอในสถานะนี้
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            หน่วยกู้ภัย
                          </th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            พื้นที่
                          </th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            ผู้ประสานงาน
                          </th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            LINE
                          </th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            สถานะ
                          </th>
                          <th className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            วันที่สมัคร
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredRequests.map((item) => {
                          const isSelected = selectedRequest?.id === item.id;

                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedRequest(item)}
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
                                  className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${getStatusClasses(
                                    item.status
                                  )}`}
                                >
                                  {getStatusLabel(item.status)}
                                </span>
                              </td>

                              <td className="px-4 py-3 align-top text-sm text-slate-700">
                                {formatDateTime(item.created_at)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="xl:col-span-5">
              <div className="border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Request details
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    รายละเอียดคำขอที่เลือก
                  </p>
                </div>

                {!selectedRequest ? (
                  <div className="px-4 py-10 text-sm text-slate-500">
                    เลือกรายการจากตารางด้านซ้ายเพื่อดูรายละเอียด
                  </div>
                ) : (
                  <div>
                    <div className="border-b border-slate-200 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {selectedRequest.name || "-"}
                        </h3>
                        <span
                          className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${getStatusClasses(
                            selectedRequest.status
                          )}`}
                        >
                          {getStatusLabel(selectedRequest.status)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        ตรวจสอบความครบถ้วนของข้อมูลก่อนอนุมัติ
                      </p>
                    </div>

                    <div className="grid gap-4 px-4 py-4 md:grid-cols-2">
                      <DetailItem
                        label="ผู้ประสานงาน"
                        value={selectedRequest.coordinator_name}
                      />
                      <DetailItem label="เบอร์โทร" value={selectedRequest.phone} />
                      <DetailItem label="จังหวัด" value={selectedRequest.province} />
                      <DetailItem label="อำเภอ" value={selectedRequest.district} />

                      <DetailItem
                        label="ผูก LINE"
                        value={selectedRequest.line_user_id ? "ใช่" : "ยังไม่ผูก"}
                      />
                      <DetailItem
                        label="พิกัด"
                        value={`${selectedRequest.base_lat ?? "-"}, ${selectedRequest.base_lng ?? "-"
                          }`}
                      />
                      <DetailItem
                        label="รัศมีรับผิดชอบ"
                        value={
                          selectedRequest.coverage_km
                            ? `${selectedRequest.coverage_km} กม.`
                            : "-"
                        }
                      />
                      <DetailItem
                        label="วันที่สมัคร"
                        value={formatDateTime(selectedRequest.created_at)}
                      />
                      <DetailItem
                        label="หมายเหตุการตรวจสอบ"
                        value={selectedRequest.review_note || "-"}
                      />
                      <DetailItem
                        label="ที่อยู่"
                        value={selectedRequest.address}
                        full
                      />
                    </div>

                    {selectedRequest.status === "pending_review" && (
                      <div className="border-t border-slate-200 px-4 py-4">
                        {!selectedRequest.line_user_id && (
                          <div className="mb-4 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            ยังไม่ผูก LINE ผู้ใช้ จึงยังไม่ควรอนุมัติ
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={actionLoadingId === selectedRequest.id}
                            onClick={() => openRejectModal(selectedRequest)}
                            className="border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {actionLoadingId === selectedRequest.id
                              ? "กำลังดำเนินการ..."
                              : "ปฏิเสธคำขอ"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              actionLoadingId === selectedRequest.id ||
                              !selectedRequest.line_user_id
                            }
                            onClick={() => handleApprove(selectedRequest.id)}
                            className="border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {actionLoadingId === selectedRequest.id
                              ? "กำลังดำเนินการ..."
                              : "อนุมัติคำขอ"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <RejectRequestModal
        open={rejectModalOpen}
        requestName={rejectTarget?.name || ""}
        loading={actionLoadingId === rejectTarget?.id}
        onClose={() => {
          if (actionLoadingId) return;
          setRejectModalOpen(false);
          setRejectTarget(null);
        }}
        onConfirm={handleRejectConfirm}
      />
    </AdminLayout>
  );
}