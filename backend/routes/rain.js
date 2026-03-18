import express from "express";
import { testRainApi } from "../services/rainService.js";

const router = express.Router();

router.get("/test", async (req, res) => {
  try {
    const lat = Number(req.query.lat) || 19.9105;
    const lng = Number(req.query.lng) || 99.8406;

    const data = await testRainApi(lat, lng);

    res.json({
      success: true,
      location: { lat, lng },
      data
    });

  } catch (error) {
    console.error("Rain API error:", error);

    res.status(500).json({
      success: false,
      message: "Rain API error",
      detail: error.message
    });
  }
});

export default router;