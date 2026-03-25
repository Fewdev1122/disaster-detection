 import express from "express";
import { getFloodFromApi, saveFloodToDatabase} from "../services/floodService.js";
import crypto from "crypto";
import supabase from "../config/supabase.js";
import { fetchFloodRecurrenceByPoint } from "../services/floodHistoryService.js";
const router = express.Router();
import { getFloodHistoryFromDb } from "../services/floodHistoryDbService.js";

router.post("/mock", async (req, res) => {
  try {
    const observedAt = new Date().toISOString();

    const row = {
      source: "mock",
      period: "test",
      pv_idn: "56",
      ap_idn: null,
      tb_idn: null,
      geom_type: "Polygon",
      geometry: {
        type: "Polygon",
        coordinates: [[[99.8, 19.1], [99.9, 19.1], [99.9, 19.2], [99.8, 19.2], [99.8, 19.1]]],
      },
      properties: {
        name: "mock flood area",
      },
      observed_at: observedAt,
      feature_hash: crypto
        .createHash("sha256")
        .update(`mock-${observedAt}`)
        .digest("hex"),
    };

    const { data, error } = await supabase
      .from("flood_areas")
      .insert([row])
      .select("id");

    if (error) throw new Error(error.message);

    res.json({
      ok: true,
      inserted: data?.length || 0,
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});
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

router.get("/history", async (req, res) => {
  try {
    const { lat, lng, lon } = req.query;

    const result = await fetchFloodRecurrenceByPoint({
      lat,
      lon: lon || lng,
    });

    res.json({
      ok: true,
      source: "gistda_flood_recurrence",
      result,
    });
  } catch (error) {
    console.error("Flood history error:", error.message);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});


router.get("/history-db", async (req, res) => {
  try {
    const {
      period,
      pv_idn,
      days = 30,
      limit = 100,
      offset = 0,
    } = req.query;

    const result = await getFloodHistoryFromDb({
      period,
      pv_idn,
      days: Number(days),
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Flood history DB error:", error.message);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

router.post("/sync-freq", async (req, res) => {
  try {
    const {
      pv_idn = "56",
      ap_idn,
      tb_idn,
      bbox,
      limit = 100,
      offset = 0,
    } = req.body || {};

    const result = await saveFloodToDatabase({
      period: "flood-freq",
      pv_idn,
      ap_idn,
      tb_idn,
      bbox,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({ ok: true, ...result });
  } catch (error) {
    console.error("Flood freq sync error:", error.message);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});
export default router;