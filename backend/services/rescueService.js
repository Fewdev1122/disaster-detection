import supabase from "../config/supabase.js";
import { haversine } from "../utils/geo.js";

let rescueCache = [];
let lastFetch = 0;

const CACHE_TTL = 5 * 60 * 1000; // 5 นาที

export function clearRescueCache() {
  rescueCache = [];
  lastFetch = 0;
}

async function getRescueUnits() {
  const now = Date.now();

  if (rescueCache.length && now - lastFetch < CACHE_TTL) {
    console.log("getRescueUnits: cache hit");
    return rescueCache;
  }

  const t0 = Date.now();

  const { data, error } = await supabase
    .from("rescue_units")
    .select("id,name,line_group_id,base_lat,base_lng,coverage_km,status")
    .eq("status", "active")
    .not("line_group_id", "is", null);

  console.log("getRescueUnits query:", Date.now() - t0, "ms");

  if (error) {
    throw new Error(error.message);
  }

  rescueCache = data || [];
  lastFetch = now;

  return rescueCache;
}

export async function findNearestRescue(lat, lng) {
  if (lat == null || lng == null) return null;

  const t0 = Date.now();
  const data = await getRescueUnits();
  console.log("findNearestRescue getRescueUnits:", Date.now() - t0, "ms");

  const t1 = Date.now();

  let nearest = null;
  let minDistance = Infinity;

  for (const unit of data) {
    if (unit.base_lat == null || unit.base_lng == null) continue;
    if (!unit.line_group_id) continue;

    const distance = haversine(
      Number(lat),
      Number(lng),
      Number(unit.base_lat),
      Number(unit.base_lng)
    );

    const coverageKm = Number(unit.coverage_km || 0);

    if (distance <= coverageKm && distance < minDistance) {
      minDistance = distance;
      nearest = {
        ...unit,
        distance_km: Number(distance.toFixed(2)),
      };
    }
  }

  console.log("findNearestRescue compute:", Date.now() - t1, "ms");

  return nearest;
}

export async function bindRescueGroupByCode({ connectCode, groupId }) {
  const normalizedCode = String(connectCode || "").trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("ไม่พบรหัสเชื่อมกลุ่ม");
  }

  if (!groupId) {
    throw new Error("ไม่พบ groupId");
  }

  const { data: rescueUnit, error: findError } = await supabase
    .from("rescue_units")
    .select("*")
    .eq("connect_code", normalizedCode)
    .eq("connect_code_used", false)
    .single();

  if (findError || !rescueUnit) {
    throw new Error("ไม่พบรหัสเชื่อมกลุ่ม หรือรหัสถูกใช้ไปแล้ว");
  }

  if (rescueUnit.line_group_id) {
    throw new Error("หน่วยนี้เชื่อมกลุ่มไปแล้ว");
  }

  const { data, error } = await supabase
    .from("rescue_units")
    .update({
      line_group_id: groupId,
      status: "active",
      connect_code_used: true,
    })
    .eq("id", rescueUnit.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  clearRescueCache();
  return data;
}

export async function bindRescueUserByCode({ connectCode, lineUserId }) {
  const normalizedCode = String(connectCode || "").trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("ไม่พบรหัสผูก LINE");
  }

  if (!lineUserId) {
    throw new Error("ไม่พบ lineUserId");
  }

  const { data: rescueUnit, error: findError } = await supabase
    .from("rescue_units")
    .select("*")
    .eq("connect_code", normalizedCode)
    .single();

  if (findError || !rescueUnit) {
    throw new Error("ไม่พบรหัสผูก LINE");
  }

  if (rescueUnit.line_group_id) {
    throw new Error("รหัสนี้ถูกใช้ไปแล้ว");
  }

  const { data, error } = await supabase
    .from("rescue_units")
    .update({
      line_user_id: lineUserId,
    })
    .eq("id", rescueUnit.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  clearRescueCache();
  return data;
}