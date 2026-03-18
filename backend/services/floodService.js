import axios from "axios";

export async function testFloodApi(lat, lng) {
  const response = await axios.get("https://flood-api.open-meteo.com/v1/flood", {
    params: {
      latitude: lat,
      longitude: lng,
      daily: "river_discharge,river_discharge_mean,river_discharge_max",
      timezone: "Asia/Bangkok",
    },
  });

  return response.data;
}