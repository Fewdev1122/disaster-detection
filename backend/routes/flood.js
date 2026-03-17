import express from "express";
import { testFloodApi } from "../services/floodService.js";

const router = express.Router();

router.get("/test", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: "กรุณาส่ง lat และ lng",
      });
    }

    const data = await testFloodApi(lat, lng);

    res.json({
      success: true,
      input: { lat, lng },
      data,
    });
  } catch (error) {
    console.error(
      "Flood API error:",
      error.response?.status,
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "เชื่อม Flood API ไม่สำเร็จ",
      detail: error.response?.data || error.message,
    });
  }
});

export default router;