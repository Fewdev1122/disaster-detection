import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

router.get("/recent", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);

    const { data, error } = await supabase
      .from("incident_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return res.json({ data });
  } catch (err) {
    console.error("GET /incidents/recent error:", err);
    return res.status(500).json({
      message: err.message || "โหลดเหตุล่าสุดไม่สำเร็จ",
    });
  }
});

export default router;