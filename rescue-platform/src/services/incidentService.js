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

export async function getRecentIncidents(limit = 10) {
  const url = buildUrl(`/incidents/recent?limit=${limit}`);
  const response = await fetch(url);
  const data = await parseJsonResponse(response, "ดึงเหตุล่าสุดไม่สำเร็จ");
  return data?.data || [];
}