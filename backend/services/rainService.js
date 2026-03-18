import axios from "axios";

export async function testRainApi(lat, lng) {
  const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
    params: {
      latitude: lat,
      longitude: lng,
      hourly: "precipitation,rain",
      daily: "precipitation_sum,rain_sum",
      timezone: "Asia/Bangkok",
    },
  });

  return response.data;
}