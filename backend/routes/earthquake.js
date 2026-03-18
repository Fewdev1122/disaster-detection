import express from "express";
import {
  getRecentEarthquakes,
  saveEarthquakesToDatabase,
  getSavedEarthquakes,
} from "../services/earthquakeService.js";

const router = express.Router();

/*
ดึงแผ่นดินไหวสดจาก USGS
*/
router.get("/recent", async (req, res) => {
  try {
    const data = await getRecentEarthquakes();

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("Earthquake recent error:", err.message);

    res.status(500).json({
      success: false,
      message: "ดึงข้อมูลแผ่นดินไหวไม่สำเร็จ",
      detail: err.message,
    });
  }
});

/*
sync แผ่นดินไหวจาก USGS ลง database
*/
router.post("/sync", async (req, res) => {
  try {
    const result = await saveEarthquakesToDatabase();

    res.json({
      success: true,
      message: "sync earthquake สำเร็จ",
      inserted: result.inserted,
      data: result.data,
    });
  } catch (err) {
    console.error("Earthquake sync error:", err.message);

    res.status(500).json({
      success: false,
      message: "sync earthquake ไม่สำเร็จ",
      detail: err.message,
    });
  }
});

/*
อ่านแผ่นดินไหวจาก database
*/
router.get("/", async (req, res) => {
  try {
    const data = await getSavedEarthquakes();

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("Earthquake DB error:", err.message);

    res.status(500).json({
      success: false,
      message: "ดึงข้อมูลแผ่นดินไหวจากฐานข้อมูลไม่สำเร็จ",
      detail: err.message,
    });
  }
});

export default router;