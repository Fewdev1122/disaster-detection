import axios from "axios";

const USGS_API =
  "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=20";

export async function getRecentEarthquakes() {
  try {
    const res = await axios.get(USGS_API);

    const earthquakes = res.data.features.map((q) => ({
      id: q.id,
      magnitude: q.properties.mag,
      place: q.properties.place,
      time: q.properties.time,
      lat: q.geometry.coordinates[1],
      lng: q.geometry.coordinates[0],
      depth: q.geometry.coordinates[2],
    }));

    return earthquakes;
  } catch (err) {
    console.error("Earthquake API error:", err.message);
    throw err;
  }
}