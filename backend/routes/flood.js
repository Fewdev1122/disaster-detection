import express from "express";
import { testFloodApi } from "../services/floodService.js";

const router = express.Router();

router.get("/test", async (req, res) => {
  try {
    // ถ้าไม่มี lat lng ให้ใช้ค่า default
    const lat = req.query.lat || 19.9105;
    const lng = req.query.lng || 99.8406;

    const data = await testFloodApi(lat, lng);

    res.json({
      success: true,
      location: { lat, lng },
      data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Flood API error",
      detail: error.message
    });
  }
});

export default router;