import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// ดึงรายการคำขอสมัครหน่วยกู้ภัย
// ใช้ได้ทั้งทั้งหมด หรือ filter status เช่น ?status=pending_review
router.get("/rescue-requests", async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from("rescue_units")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      message: "ดึงรายการคำขอสำเร็จ",
      data: data || [],
    });
  } catch (err) {
    console.error("GET RESCUE REQUESTS ERROR:", err);
    return res.status(500).json({
      message: "ดึงรายการคำขอไม่สำเร็จ",
      detail: err.message,
    });
  }
});

// ดึงรายละเอียดคำขอรายตัว
router.get("/rescue-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("rescue_units")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return res.json({
      message: "ดึงรายละเอียดคำขอสำเร็จ",
      data,
    });
  } catch (err) {
    console.error("GET RESCUE REQUEST DETAIL ERROR:", err);
    return res.status(500).json({
      message: "ดึงรายละเอียดคำขอไม่สำเร็จ",
      detail: err.message,
    });
  }
});

// อนุมัติคำขอ
router.patch("/rescue-requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { review_note = "อนุมัติเรียบร้อย" } = req.body || {};

    const payload = {
      status: "approved",
      review_note,
    };

    const { data, error } = await supabase
      .from("rescue_units")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({
      message: "อนุมัติคำขอสำเร็จ",
      data,
    });
  } catch (err) {
    console.error("APPROVE RESCUE REQUEST ERROR:", err);
    return res.status(500).json({
      message: "อนุมัติคำขอไม่สำเร็จ",
      detail: err.message,
    });
  }
});

// ปฏิเสธคำขอ
router.patch("/rescue-requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { review_note = "ไม่ผ่านการตรวจสอบ" } = req.body || {};

    const payload = {
      status: "rejected",
      review_note,
    };

    const { data, error } = await supabase
      .from("rescue_units")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({
      message: "ปฏิเสธคำขอสำเร็จ",
      data,
    });
  } catch (err) {
    console.error("REJECT RESCUE REQUEST ERROR:", err);
    return res.status(500).json({
      message: "ปฏิเสธคำขอไม่สำเร็จ",
      detail: err.message,
    });
  }
});

export default router;