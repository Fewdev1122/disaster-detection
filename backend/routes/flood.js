 import express from "express";
import { getFloodFromApi, saveFloodToDatabase } from "../services/floodService.js";

const router = express.Router();

// ดึงสดจาก API
router.get("/", async (req, res) => {
  try {
    const {
      period = "1day",
      pv_idn,
      ap_idn,
      tb_idn,
      bbox,
      limit = 100,
      offset = 0,
    } = req.query;

    const data = await getFloodFromApi({
      period,
      pv_idn,
      ap_idn,
      tb_idn,
      bbox,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      ok: true,
      source: "gistda_api",
      count: data.features?.length || 0,
      data,
    });
  } catch (error) {
    console.error("Flood route error:", error.message);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

// sync เข้า DB
router.post("/sync", async (req, res) => {
  try {
    const {
      period = "1day",
      pv_idn,
      ap_idn,
      tb_idn,
      bbox,
      limit = 100,
      offset = 0,
    } = req.body || {};

    const result = await saveFloodToDatabase({
      period,
      pv_idn,
      ap_idn,
      tb_idn,
      bbox,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Flood sync error:", error.message);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

export default router;