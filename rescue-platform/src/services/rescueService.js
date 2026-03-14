const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://disaster-detection-gmv9.onrender.com";

export async function registerRescueUnit(form) {

  const payload = {
    name: form.name.trim(),
    coordinator_name: form.coordinatorName,
    phone: form.phone,
    province: form.province,
    district: form.district,
    address: form.address,
    lat: form.baseLat,
    lng: form.baseLng,
    coverage_radius_km: Number(form.coverageRadiusKm || 10)
  };

  const res = await fetch(`${API_BASE_URL}/rescue/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "สมัครไม่สำเร็จ");
  }

  return data;
}