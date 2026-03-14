const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://disaster-detection-gmv9.onrender.com";

export async function registerRescueUnit(form) {
  const payload = {
    name: form.name.trim(),
    coordinator_name: form.coordinatorName.trim(),
    phone: form.phone.trim(),
    province: form.province.trim(),
    district: form.district.trim(),
    address: form.address.trim(),
    line_user_id: form.lineUserId.trim(),
    lat: form.baseLat,
    lng: form.baseLng,
    coverage_radius_km: Number(form.coverageRadiusKm || 10),
  };

  const url = `${API_BASE_URL}/api/rescue/register`;

  console.log("REGISTER URL:", url);
  console.log("REGISTER PAYLOAD:", payload);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();

  console.log("REGISTER STATUS:", response.status);
  console.log("REGISTER RAW RESPONSE:", rawText);

  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error(`Server ไม่ได้ส่ง JSON กลับมา (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.detail ||
        data?.error ||
        `สมัครไม่สำเร็จ (${response.status})`
    );
  }

  return data;
}