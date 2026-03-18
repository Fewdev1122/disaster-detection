import express from "express";
import { testFloodApi } from "../services/floodService.js";

const router = express.Router();

router.get("/test", async (req, res) => {
  try {
    const lat = Number(req.query.lat) || 19.9105;
    const lng = Number(req.query.lng) || 99.8406;

    const data = await testFloodApi(lat, lng);

    res.json({
      success: true,
      location: { lat, lng },
      data,
    });
  } catch (error) {
    console.error("Flood API route error:", error);

    res.status(500).json({
      success: false,
      message: "Flood API error",
      detail: error.message,
    });
  }
});

export default router;