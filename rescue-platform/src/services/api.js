const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function registerRescueUnit(payload) {
  const res = await fetch(`${BASE_URL}/rescue/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Register failed");
  }

  return res.json();
}