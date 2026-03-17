import express from "express";
import { getRecentEarthquakes } from "../services/earthquakeService.js";

const router = express.Router();

router.get("/recent", async (req, res) => {
  try {
    const data = await getRecentEarthquakes();

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "ดึงข้อมูลแผ่นดินไหวไม่สำเร็จ",
    });
  }
});

export default router;