const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://disaster-detection-gmv9.onrender.com";

function buildUrl(path) {
  return `${API_BASE_URL}/api${path}`;
}

async function parseJsonResponse(response, defaultErrorMessage) {
  const rawText = await response.text();

  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error("Server ไม่ได้ส่ง JSON กลับมา");
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.detail || defaultErrorMessage
    );
  }

  return data;
}

// =========================
// RESCUE REQUESTS
// =========================
export async function getRescueRequests(status = "pending_review") {
  const url = buildUrl(
    `/admin/rescue-requests?status=${encodeURIComponent(status)}`
  );

  const response = await fetch(url);
  const data = await parseJsonResponse(response, "ดึงรายการคำขอไม่สำเร็จ");

  return data?.data || [];
}

export async function approveRescueRequest(
  id,
  reviewNote = "อนุมัติเรียบร้อย"
) {
  const url = buildUrl(`/admin/rescue-requests/${id}/approve`);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      review_note: reviewNote,
    }),
  });

  const data = await parseJsonResponse(response, "อนุมัติคำขอไม่สำเร็จ");
  return data?.data;
}

export async function rejectRescueRequest(
  id,
  reviewNote = "ข้อมูลยังไม่ครบถ้วน"
) {
  const url = buildUrl(`/admin/rescue-requests/${id}/reject`);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      review_note: reviewNote,
    }),
  });

  const data = await parseJsonResponse(response, "ปฏิเสธคำขอไม่สำเร็จ");
  return data?.data;
}

// =========================
// APPROVED RESCUE UNITS FOR DASHBOARD / MAP
// ใช้ approved requests ไปก่อนตรง ๆ
// =========================
export async function getApprovedRescueUnits() {
  const activeRequests = await getRescueRequests("active");
  console.log("activeRequests for map:", activeRequests);
  return activeRequests.map(mapApprovedRequestToUnit);
}

function mapApprovedRequestToUnit(item) {
  const lat = item.base_lat ?? item.lat ?? null;
  const lng = item.base_lng ?? item.lng ?? null;

  return {
    id: item.id,
    name: item.name || "-",
    coordinator_name: item.coordinator_name || "-",
    phone: item.phone || "-",
    province: item.province || "-",
    district: item.district || "-",
    address: item.address || "-",
    base_lat: lat,
    base_lng: lng,
    coverage_km:
      item.coverage_km ??
      item.coverage_radius_km ??
      item.coverageRadiusKm ??
      0,
    status: mapUnitStatusFromApprovedRequest(item),
    line_user_id: item.line_user_id || null,
    line_group_id: item.line_group_id || null,
    created_at: item.created_at || null,
  };
}

function mapUnitStatusFromApprovedRequest(item) {
  if (item.status === "active") return "active";
  if (item.status === "pending_review") return "pending";
  if (item.status === "rejected") return "inactive";
  return "inactive";
}


export async function autoRejectExpiredRescueRequests(expireDays = 3) {
  const url = buildUrl("/admin/rescue-requests/auto-reject-expired");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expire_days: expireDays,
    }),
  });

  return await parseJsonResponse(response, "ปฏิเสธอัตโนมัติไม่สำเร็จ");
}