import supabase from "../config/supabase.js";
import { haversine } from "../utils/geo.js";

export async function findNearestRescue(lat, lng) {
  if (lat == null || lng == null) {
    return null;
  }

  const { data, error } = await supabase
    .from("rescue_units")
    .select("*")
    .eq("status", "active");

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  for (const unit of data) {
    const unitLat = Number(unit.base_lat);
    const unitLng = Number(unit.base_lng);
    const coverageKm = Number(unit.coverage_km || 0);

    if (Number.isNaN(unitLat) || Number.isNaN(unitLng)) {
      continue;
    }

    const distance = haversine(Number(lat), Number(lng), unitLat, unitLng);

    if (distance <= coverageKm && distance < minDistance) {
      minDistance = distance;
      nearest = {
        ...unit,
        distance_km: Number(distance.toFixed(2)),
      };
    }
  }

  return nearest;
}