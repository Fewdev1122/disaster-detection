const BASE_URL = import.meta.env.VITE_BASE_URL || "https://superbusily-volitant-makenna.ngrok-free.dev";

export async function sendReport(image, location) {
  if (!image) {
    throw new Error("Image is required");
  }
  

  const res = await fetch(`${BASE_URL}/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image,
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Server error:", text);
    throw new Error("Server error");
  }

  return res.json();
}