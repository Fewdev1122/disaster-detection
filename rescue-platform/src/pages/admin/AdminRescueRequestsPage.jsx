import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
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
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

export default function AdminRescueRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");

  const loadRequests = async (status = statusFilter) => {
    try {
      setLoading(true);
      setError("");

      const data = await getRescueRequests(status);
      setRequests(data);
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

  const handleReject = async (id) => {
    const reviewNote = window.prompt(
      "ระบุเหตุผลที่ปฏิเสธคำขอ",
      "ข้อมูลยังไม่ครบถ้วน"
    );

    if (reviewNote === null) return;

    try {
      setActionLoadingId(id);
      await rejectRescueRequest(id, reviewNote);
      await loadRequests(statusFilter);
    } catch (err) {
      console.error(err);
      alert(err.message || "ปฏิเสธคำขอไม่สำเร็จ");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f5f7fb] px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <h1 className="text-xl font-semibold text-gray-900">
                จัดการคำขอสมัครหน่วยกู้ภัย
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                ตรวจสอบและอนุมัติคำขอสมัครของหน่วยกู้ภัย
              </p>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "pending_review", label: "รอตรวจสอบ" },
                  { value: "approved", label: "อนุมัติแล้ว" },
                  { value: "rejected", label: "ไม่ผ่าน" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStatusFilter(item.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      statusFilter === item.value
                        ? "bg-red-500 text-white"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => loadRequests(statusFilter)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                รีเฟรช
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-[28px] border border-gray-200 bg-white px-6 py-8 text-sm text-gray-500 shadow-sm">
              กำลังโหลดรายการคำขอ...
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-[28px] border border-gray-200 bg-white px-6 py-8 text-sm text-gray-500 shadow-sm">
              ไม่พบรายการคำขอในสถานะนี้
            </div>
          ) : (
            <div className="grid gap-4">
              {requests.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {item.name || "-"}
                        </h2>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                        <p>
                          <span className="font-medium text-gray-800">
                            ผู้ประสานงาน:
                          </span>{" "}
                          {item.coordinator_name || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">
                            เบอร์โทร:
                          </span>{" "}
                          {item.phone || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">
                            จังหวัด:
                          </span>{" "}
                          {item.province || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">
                            อำเภอ:
                          </span>{" "}
                          {item.district || "-"}
                        </p>
                        <p className="md:col-span-2">
                          <span className="font-medium text-gray-800">
                            ที่อยู่:
                          </span>{" "}
                          {item.address || "-"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">
                            พิกัดฐาน:
                          </span>{" "}
                          {item.base_lat ?? "-"}, {item.base_lng ?? "-"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">
                            รัศมีรับผิดชอบ:
                          </span>{" "}
                          {item.coverage_km ?? "-"} กม.
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">
                            วันที่สมัคร:
                          </span>{" "}
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString("th-TH")
                            : "-"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">
                            LINE Group:
                          </span>{" "}
                          {item.line_group_id || "-"}
                        </p>
                        {item.review_note && (
                          <p className="md:col-span-2">
                            <span className="font-medium text-gray-800">
                              หมายเหตุ:
                            </span>{" "}
                            {item.review_note}
                          </p>
                        )}
                      </div>
                    </div>

                    {item.status === "pending_review" && (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={actionLoadingId === item.id}
                          onClick={() => handleReject(item.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {actionLoadingId === item.id
                            ? "กำลังดำเนินการ..."
                            : "ปฏิเสธ"}
                        </button>

                        <button
                          type="button"
                          disabled={actionLoadingId === item.id}
                          onClick={() => handleApprove(item.id)}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {actionLoadingId === item.id
                            ? "กำลังดำเนินการ..."
                            : "อนุมัติ"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}