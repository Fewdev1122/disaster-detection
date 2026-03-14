const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://disaster-detection-gmv9.onrender.com";

export async function getRescueRequests(status = "pending_review") {
  const url = `${API_BASE_URL}/api/admin/rescue-requests?status=${encodeURIComponent(
    status
  )}`;

  const response = await fetch(url);
  const rawText = await response.text();

  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error("Server ไม่ได้ส่ง JSON กลับมา");
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.detail || "ดึงรายการคำขอไม่สำเร็จ"
    );
  }

  return data?.data || [];
}

export async function approveRescueRequest(id, reviewNote = "อนุมัติเรียบร้อย") {
  const url = `${API_BASE_URL}/api/admin/rescue-requests/${id}/approve`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      review_note: reviewNote,
    }),
  });

  const rawText = await response.text();

  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error("Server ไม่ได้ส่ง JSON กลับมา");
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.detail || "อนุมัติคำขอไม่สำเร็จ"
    );
  }

  return data?.data;
}

export async function rejectRescueRequest(id, reviewNote = "ข้อมูลยังไม่ครบถ้วน") {
  const url = `${API_BASE_URL}/api/admin/rescue-requests/${id}/reject`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      review_note: reviewNote,
    }),
  });

  const rawText = await response.text();

  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error("Server ไม่ได้ส่ง JSON กลับมา");
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.detail || "ปฏิเสธคำขอไม่สำเร็จ"
    );
  }

  return data?.data;
}