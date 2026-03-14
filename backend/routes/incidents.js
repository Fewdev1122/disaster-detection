import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

router.get("/recent", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);

    const { data, error } = await supabase
      .from("incident_reports")
      .select(`
        id,
        disaster_type,
        confidence,
        image_url,
        created_at,
        rescue_units (
          name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});