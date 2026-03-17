import axios from "axios";

export async function testFloodApi(lat, lng) {
  const res = await axios.get("https://flood-api.open-meteo.com/v1/flood", {
    params: {
      latitude: lat,
      longitude: lng,
      daily: "river_discharge,river_discharge_mean,river_discharge_max",
      forecast_days: 7,
      past_days: 2,
    },
    timeout: 15000,
  });

  return res.data;
}