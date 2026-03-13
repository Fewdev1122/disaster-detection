const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function sendReport(image, location) {
  if (!image) {
    throw new Error("Image is required");
  }

  const payload = {
    image,
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,

    // เพิ่มข้อมูลพิกัดแยก
    photo_lat: location?.photo_lat ?? null,
    photo_lng: location?.photo_lng ?? null,

    current_lat: location?.current_lat ?? null,
    current_lng: location?.current_lng ?? null,

    location_source: location?.location_source ?? "unknown",
  };

  const res = await fetch(`${BASE_URL}/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Server error:", text);
    throw new Error("Server error");
  }

  return res.json();
}