import supabase from "../config/supabase.js";
import { haversine } from "../utils/geo.js";

let rescueCache = [];
let lastFetch = 0;

const CACHE_TTL = 60000; // 1 นาที

async function getRescueUnits() {
  const now = Date.now();

  if (rescueCache.length && now - lastFetch < CACHE_TTL) {
    return rescueCache;
  }

  const { data, error } = await supabase
    .from("rescue_units")
    .select("id,name,line_group_id,base_lat,base_lng,coverage_km")
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  rescueCache = data;
  lastFetch = now;

  return data;
}

export async function findNearestRescue(lat, lng) {
  if (lat == null || lng == null) return null;

  const data = await getRescueUnits();

  let nearest = null;
  let minDistance = Infinity;

  for (const unit of data) {
    const distance = haversine(
      lat,
      lng,
      Number(unit.base_lat),
      Number(unit.base_lng)
    );

    if (distance <= unit.coverage_km && distance < minDistance) {
      minDistance = distance;
      nearest = {
        ...unit,
        distance_km: Number(distance.toFixed(2)),
      };
    }
  }

  return nearest;
}