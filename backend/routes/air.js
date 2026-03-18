import express from "express";
import {
  getAirQualityPhayao,
  saveAirQualityToDatabase,
  getSavedAirQuality,
} from "../services/airService.js";

const router = express.Router();

router.get("/live", async (req, res) => {
  try {
    const data = await getAirQualityPhayao();

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "ดึงข้อมูลคุณภาพอากาศไม่สำเร็จ",
      detail: err.message,
    });
  }
});

router.post("/sync", async (req, res) => {
  try {
    const result = await saveAirQualityToDatabase();

    res.json({
      success: true,
      message: "sync air quality สำเร็จ",
      inserted: result.inserted,
      data: result.data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "sync air quality ไม่สำเร็จ",
      detail: err.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const data = await getSavedAirQuality();

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "ดึงข้อมูลคุณภาพอากาศจากฐานข้อมูลไม่สำเร็จ",
      detail: err.message,
    });
  }
});

export default router;