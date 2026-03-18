import axios from "axios";
import supabase from "../config/supabase.js";

const AIR4THAI_API = "http://air4thai.pcd.go.th/services/getNewAQI_JSON.php";

function isPhayaoStation(station) {
  const text = `${station.areaTH || ""} ${station.nameTH || ""} ${station.areaEN || ""} ${station.nameEN || ""}`;
  return text.includes("พะเยา") || text.toLowerCase().includes("phayao");
}

function mapAirStation(station) {
  const date = station.AQILast?.date || null;
  const time = station.AQILast?.time || null;

  let measureTime = null;
  if (date && time) {
    measureTime = new Date(`${date}T${time}:00+07:00`).toISOString();
  }

  return {
    station_id: station.stationID || null,
    station_name_th: station.nameTH || null,
    station_name_en: station.nameEN || null,
    area_th: station.areaTH || null,
    area_en: station.areaEN || null,
    station_type: station.stationType || null,
    latitude: station.lat ? parseFloat(station.lat) : null,
    longitude: station.long ? parseFloat(station.long) : null,
    pm25_value: station.AQILast?.PM25?.value
      ? parseFloat(station.AQILast.PM25.value)
      : null,
    pm25_aqi: station.AQILast?.PM25?.aqi
      ? parseInt(station.AQILast.PM25.aqi, 10)
      : null,
    aqi: station.AQILast?.AQI?.aqi
      ? parseInt(station.AQILast.AQI.aqi, 10)
      : null,
    main_param: station.AQILast?.AQI?.param || null,
    measure_time: measureTime,
  };
}

export async function getAirQualityPhayao() {
  const res = await axios.get(AIR4THAI_API, {
    timeout: 15000,
  });

  const stations = res.data?.stations || res.data || [];

  if (!Array.isArray(stations)) {
    throw new Error("รูปแบบข้อมูล Air4Thai ไม่ถูกต้อง");
  }

  return stations
    .filter(isPhayaoStation)
    .map(mapAirStation)
    .filter((s) => s.station_id && s.measure_time);
}

export async function saveAirQualityToDatabase() {
  const stations = await getAirQualityPhayao();

  if (!stations.length) {
    return {
      success: true,
      inserted: 0,
      data: [],
      message: "ไม่พบสถานี Air4Thai ในพะเยา",
    };
  }

  const { data, error } = await supabase
    .from("air_quality")
    .upsert(stations, {
      onConflict: "station_id,measure_time",
    })
    .select();

  if (error) {
    throw new Error(`บันทึก air quality ไม่สำเร็จ: ${error.message}`);
  }

  return {
    success: true,
    inserted: data?.length || 0,
    data: data || [],
  };
}

export async function getSavedAirQuality() {
  const { data, error } = await supabase
    .from("air_quality")
    .select("*")
    .order("measure_time", { ascending: false });

  if (error) {
    throw new Error(`ดึง air quality จากฐานข้อมูลไม่สำเร็จ: ${error.message}`);
  }

  return data || [];
}