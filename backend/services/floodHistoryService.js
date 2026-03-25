async function fetchFloodRecurrenceByPoint({ lat, lon }) {
  if (!process.env.GISTDA_API_KEY) {
    throw new Error("Missing GISTDA_API_KEY");
  }

  if (!lat || !lon) {
    throw new Error("lat and lon are required");
  }

  const url = new URL(
    "https://api-gateway.gistda.or.th/api/2.0/resources/gi-service/v1.0/disasters/flood-recurrence"
  );

  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("api_key", process.env.GISTDA_API_KEY);

  const response = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Flood recurrence API error ${response.status}: ${text}`);
  }

  return response.json();
}

export { fetchFloodRecurrenceByPoint };