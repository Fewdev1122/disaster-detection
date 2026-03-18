import axios from "axios";
import supabase from "../config/supabase.js";

function isPhayao(lat, lng) {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  return (
    !Number.isNaN(latNum) &&
    !Number.isNaN(lngNum) &&
    latNum >= 19.0 &&
    latNum <= 20.1 &&
    lngNum >= 99.6 &&
    lngNum <= 100.5
  );
}

function mapHotspotRow(row) {
  return {
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    brightness: row.bright_ti4 ? parseFloat(row.bright_ti4) : null,
    confidence: row.confidence || null,
    satellite: row.satellite || null,
    acq_date: row.acq_date || null,
    acq_time: row.acq_time || null,
  };
}

export async function getHotspotsThailand() {
  const apiKey = process.env.FIRMS_API_KEY;

  if (!apiKey) {
    throw new Error("FIRMS_API_KEY missing in .env");
  }

  const bbox = "97,5,106,21";
  const dataset = "VIIRS_SNPP_NRT";
  const days = 1;

  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/json/${apiKey}/${dataset}/${bbox}/${days}`;

  const response = await axios.get(url, {
    timeout: 15000,
  });

  const hotspots = response.data?.hotspots || response.data || [];

  if (!Array.isArray(hotspots)) {
    throw new Error("รูปแบบข้อมูล hotspot ไม่ถูกต้อง");
  }

  return hotspots;
}

export async function getHotspotsPhayao() {
  const rows = await getHotspotsThailand();

  return rows
    .filter((row) => isPhayao(row.latitude, row.longitude))
    .map(mapHotspotRow)
    .filter((row) => row.latitude !== null && row.longitude !== null);
}

export async function saveHotspotsToDatabase() {
  const hotspots = await getHotspotsPhayao();

  if (!hotspots.length) {
    return {
      success: true,
      inserted: 0,
      data: [],
      message: "ไม่พบ hotspot ในพะเยา",
    };
  }

  const { data, error } = await supabase
    .from("hotspots")
    .upsert(hotspots, {
      onConflict: "latitude,longitude,acq_date,acq_time",
    })
    .select();

  if (error) {
    throw new Error(`บันทึก hotspot ไม่สำเร็จ: ${error.message}`);
  }

  return {
    success: true,
    inserted: data?.length || 0,
    data: data || [],
  };
}

export async function getSavedHotspotsFromDatabase() {
  const { data, error } = await supabase
    .from("hotspots")
    .select("*")
    .order("acq_date", { ascending: false })
    .order("acq_time", { ascending: false });

  if (error) {
    throw new Error(`ดึง hotspot จากฐานข้อมูลไม่สำเร็จ: ${error.message}`);
  }

  return data || [];
}