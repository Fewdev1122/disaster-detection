import express from "express";
import { getHotspotsThailand } from "../services/hotspotService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const hotspots = await getHotspotsThailand();

    return res.json({
      success: true,
      count: hotspots.length,
      hotspots: hotspots.slice(0, 20),
    });
  } catch (err) {
    console.error("Hotspot route error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;