import express from "express";
import {
  getHotspotsPhayao,
  saveHotspotsToDatabase,
  getSavedHotspotsFromDatabase,
} from "../services/hotspotService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const hotspots = await getSavedHotspotsFromDatabase();

    res.json({
      success: true,
      count: hotspots.length,
      data: hotspots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "ดึง hotspot จากฐานข้อมูลไม่สำเร็จ",
      detail: error.message,
    });
  }
});

router.get("/live", async (req, res) => {
  try {
    const hotspots = await getHotspotsPhayao();

    res.json({
      success: true,
      count: hotspots.length,
      data: hotspots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "ดึง hotspot สดไม่สำเร็จ",
      detail: error.message,
    });
  }
});

router.post("/sync", async (req, res) => {
  try {
    const result = await saveHotspotsToDatabase();

    res.json({
      success: true,
      message: "sync hotspot สำเร็จ",
      inserted: result.inserted,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "sync hotspot ไม่สำเร็จ",
      detail: error.message,
    });
  }
});

export default router;