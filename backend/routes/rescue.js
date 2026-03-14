import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

function generateConnectCode() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RCU-${randomPart}`;
}

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
      coverage_radius_km,
    } = req.body;

    if (!name || lat == null || lng == null) {
      return res.status(400).json({
        message: "ข้อมูลไม่ครบ",
      });
    }

    const connectCode = generateConnectCode();

    const { data, error } = await supabase
      .from("rescue_units")
      .insert([
        {
          name,
          coordinator_name: coordinator_name || null,
          phone: phone || null,
          province: province || null,
          district: district || null,
          address: address || null,
          base_lat: lat,
          base_lng: lng,
          coverage_km: coverage_radius_km || 10,
          status: "pending_review",
          line_group_id: null,
          line_user_id: null,
          review_note: null,
          connect_code: connectCode,
          connect_code_used: false,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      message: "สมัครสำเร็จ",
      status: "pending_review",
      connect_code: connectCode,
      data,
    });
  } catch (err) {
    console.error("REGISTER RESCUE ERROR:", err);
    return res.status(500).json({
      message: "สมัครไม่สำเร็จ",
      detail: err.message,
    });
  }
});

export default router;