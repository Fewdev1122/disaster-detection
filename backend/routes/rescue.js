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
      line_user_id,
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
          line_user_id: line_user_id || null,
          review_note: null,
          connect_code: connectCode,
          connect_code_used: false,
        },
      ])
      .select()
      .single();
    console.log("REGISTERED RESCUE:", data);

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "สมัครสำเร็จ",
      data: {
        id: data.id,
        name: data.name,
        status: data.status,
        connectCode: data.connect_code,
        lineUserId: data.line_user_id,
      },
    });
  } catch (err) {
    console.error("REGISTER RESCUE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "สมัครไม่สำเร็จ",
      detail: err.message,
    });
  }
});

router.get("/registration-status/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log("STATUS requestId:", requestId, "type:", typeof requestId);

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุ requestId",
      });
    }

    const { data, error } = await supabase
      .from("rescue_units")
      .select(`
        id,
        name,
        status,
        connect_code,
        connect_code_used,
        line_group_id,
        line_user_id,
        review_note,
        updated_at
      `)
      .eq("id", requestId)
      .maybeSingle();

    console.log("STATUS data:", data);
    console.log("STATUS error:", error);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "ค้นหาสถานะไม่สำเร็จ",
        detail: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบคำขอสมัครนี้",
      });
    }

    return res.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        status: data.status,
        connectCode: data.connect_code,
        connectCodeUsed: data.connect_code_used,
        lineGroupId: data.line_group_id,
        lineUserId: data.line_user_id,
        reviewNote: data.review_note,
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    console.error("GET REGISTRATION STATUS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "ดึงสถานะไม่สำเร็จ",
      detail: err.message,
    });
  }
});

export default router;