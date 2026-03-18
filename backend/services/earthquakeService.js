import axios from "axios";
import supabase from "../config/supabase.js";

const USGS_API =
  "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=50";

/*
  กรองเฉพาะเอเชียแบบคร่าว ๆ
  lat: -10 ถึง 60
  lng: 60 ถึง 150
*/
function isInAsia(lat, lng) {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  return (
    !Number.isNaN(latNum) &&
    !Number.isNaN(lngNum) &&
    latNum >= -10 &&
    latNum <= 60 &&
    lngNum >= 60 &&
    lngNum <= 150
  );
}

function mapEarthquakeFeature(feature) {
  return {
    id: feature.id,
    magnitude: feature.properties?.mag ?? null,
    place: feature.properties?.place ?? null,
    latitude: feature.geometry?.coordinates?.[1] ?? null,
    longitude: feature.geometry?.coordinates?.[0] ?? null,
    depth: feature.geometry?.coordinates?.[2] ?? null,
    event_time: feature.properties?.time
      ? new Date(feature.properties.time).toISOString()
      : null,
  };
}

export async function getRecentEarthquakes() {
  try {
    const res = await axios.get(USGS_API, {
      timeout: 15000,
    });

    const features = res.data?.features || [];

    const earthquakes = features
      .map(mapEarthquakeFeature)
      .filter(
        (q) =>
          q.latitude !== null &&
          q.longitude !== null &&
          isInAsia(q.latitude, q.longitude)
      );

    return earthquakes;
  } catch (err) {
    console.error("Earthquake API error:", err.message);
    throw err;
  }
}

export async function saveEarthquakesToDatabase() {
  const earthquakes = await getRecentEarthquakes();

  if (!earthquakes.length) {
    return {
      success: true,
      inserted: 0,
      data: [],
      message: "ไม่พบข้อมูลแผ่นดินไหวในเอเชีย",
    };
  }

  const { data, error } = await supabase
    .from("earthquakes")
    .upsert(earthquakes, {
      onConflict: "id",
    })
    .select();

  if (error) {
    throw new Error(`บันทึก earthquake ไม่สำเร็จ: ${error.message}`);
  }

  return {
    success: true,
    inserted: data?.length || 0,
    data: data || [],
  };
}

export async function getSavedEarthquakes() {
  const { data, error } = await supabase
    .from("earthquakes")
    .select("*")
    .order("event_time", { ascending: false });

  if (error) {
    throw new Error(`ดึง earthquake จากฐานข้อมูลไม่สำเร็จ: ${error.message}`);
  }

  return data || [];
}