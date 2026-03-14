import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      coordinator_name,
      phone,
      province,
      district,
      address,
      lat,
      lng,
      coverage_radius_km
    } = req.body;

    if (!name || !lat || !lng) {
      return res.status(400).json({
        message: "ข้อมูลไม่ครบ"
      });
    }

    const { data, error } = await supabase
      .from("rescue_units")
      .insert([
        {
          name,
          coordinator_name,
          phone,
          province,
          district,
          address,
          base_lat: lat,
          base_lng: lng,
          coverage_km: coverage_radius_km || 10,
          status: "pending_review",
          line_group_id: ""
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: "สมัครสำเร็จ",
      status: "pending_review",
      data: data[0]
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      message: "สมัครไม่สำเร็จ",
      detail: err.message
    });
  }
});

export default router;