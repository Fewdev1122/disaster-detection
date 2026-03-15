import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

router.get("/recent", async (req, res) => {
  try {
    const parsedLimit = Number(req.query.limit);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? parsedLimit
      : 5;

    const { data, error } = await supabase
      .from("incident_reports")
      .select(`
        id,
        disaster_type,
        confidence,
        image_url,
        created_at,
        event_lat,
        event_lng,
        photo_lat,
        photo_lng,
        rescue_unit_id,
        rescue_units (
          id,
          name,
          base_lat,
          base_lng
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (err) {
    console.error("GET /api/incidents/recent error:", err);
    return res.status(500).json({
      message: err.message || "โหลดเหตุล่าสุดไม่สำเร็จ",
    });
  }
});

export default router;