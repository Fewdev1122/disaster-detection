import supabase from "../config/supabase.js";

export async function getFloodHistoryFromDb({
  period,
  pv_idn,
  days = 30,
  limit = 100,
  offset = 0,
} = {}) {
  let query = supabase
    .from("flood_areas")
    .select("*", { count: "exact" })
    .order("observed_at", { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (period) {
    query = query.eq("period", period);
  }

  if (pv_idn) {
    query = query.eq("pv_idn", String(pv_idn));
  }

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - Number(days));
    query = query.gte("observed_at", since.toISOString());
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Supabase history query error: ${error.message}`);
  }

  return {
    items: data || [],
    total: count || 0,
  };
}