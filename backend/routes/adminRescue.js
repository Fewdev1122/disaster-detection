import express from "express";
import supabase from "../config/supabase.js";
import { clearRescueCache } from "../services/rescueService.js";

const router = express.Router();

function generateConnectCode() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RCU-${randomPart}`;
}

async function pushLineMessage(to, messages) {
  const channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    return {
      ok: false,
      skipped: true,
      reason: "CHANNEL_ACCESS_TOKEN missing",
    };
  }

  if (!to) {
    return {
      ok: false,
      skipped: true,
      reason: "line_user_id missing",
    };
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to,
      messages,
    }),
  });

  const rawText = await response.text();

  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = { raw: rawText };
  }

  if (!response.ok) {
    return {
      ok: false,
      skipped: false,
      status: response.status,
      data,
    };
  }

  return {
    ok: true,
    skipped: false,
    status: response.status,
    data,
  };
}

// ดึงรายการคำขอสมัครหน่วยกู้ภัย
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

// อนุมัติคำขอ + สร้าง connect code + แจ้ง LINE
router.patch("/rescue-requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { review_note = "อนุมัติเรียบร้อย" } = req.body || {};

    const connectCode = generateConnectCode();

    const payload = {
      status: "approved",
      review_note,
      connect_code: connectCode,
      connect_code_used: false,
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

    clearRescueCache();

    let lineNotifyResult = {
      ok: false,
      skipped: true,
      reason: "line_user_id missing",
    };

    if (data?.line_user_id) {
      lineNotifyResult = await pushLineMessage(data.line_user_id, [
        {
          type: "text",
          text:
            `✅ คำขอสมัครหน่วยกู้ภัยของคุณได้รับการอนุมัติแล้ว\n\n` +
            `หน่วย: ${data.name || "-"}\n` +
            `สถานะ: approved\n\n` +
            `ขั้นตอนถัดไป:\n` +
            `1) เชิญบอทเข้ากลุ่ม LINE ของหน่วยกู้ภัย\n` +
            `2) พิมพ์รหัสนี้ในกลุ่มเพื่อเชื่อมระบบ\n\n` +
            `รหัสเชื่อมกลุ่ม: ${connectCode}`,
        },
      ]);
    }

    return res.json({
      message: "อนุมัติคำขอสำเร็จ",
      data,
      line_notify: lineNotifyResult,
    });
  } catch (err) {
    console.error("APPROVE RESCUE REQUEST ERROR:", err);
    return res.status(500).json({
      message: "อนุมัติคำขอไม่สำเร็จ",
      detail: err.message,
    });
  }
});

// ปฏิเสธคำขอ + แจ้ง LINE
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

    clearRescueCache();

    let lineNotifyResult = {
      ok: false,
      skipped: true,
      reason: "line_user_id missing",
    };

    if (data?.line_user_id) {
      lineNotifyResult = await pushLineMessage(data.line_user_id, [
        {
          type: "text",
          text:
            `❌ คำขอสมัครหน่วยกู้ภัยของคุณยังไม่ผ่านการตรวจสอบ\n\n` +
            `หน่วย: ${data.name || "-"}\n` +
            `สถานะ: rejected\n` +
            `หมายเหตุ: ${review_note}`,
        },
      ]);
    }

    return res.json({
      message: "ปฏิเสธคำขอสำเร็จ",
      data,
      line_notify: lineNotifyResult,
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