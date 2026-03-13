import express from "express";

import { saveBase64Image, readImageMetadata } from "../utils/image.js";
import {
  buildPredictionText,
  buildReportText,
  buildRescueText,
  shouldSendAlert,
} from "../utils/formatter.js";
import { predictDisaster } from "../services/aiService.js";
import { findNearestRescue } from "../services/rescueService.js";
import { pushToRescueGroup } from "../services/lineService.js";
import { saveIncident } from "../services/incidentService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const t0 = Date.now();

  try {
    const { image, lat, lng } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image missing" });
    }

    const t1 = Date.now();
    const { fileName, filePath } = saveBase64Image(image, "report");
    console.log("saveBase64Image:", Date.now() - t1, "ms");

    const imageUrl = `${process.env.BASE_URL}/images/${fileName}`;

    const t2 = Date.now();
    const metadata = await readImageMetadata(filePath);
    console.log("readImageMetadata:", Date.now() - t2, "ms");

    let prediction = null;
    const t3 = Date.now();
    try {
      prediction = await predictDisaster(filePath);
      console.log("predictDisaster:", Date.now() - t3, "ms");
      console.log("Prediction:", prediction);
    } catch (aiErr) {
      console.error(
        "AI prediction error:",
        aiErr.response?.data || aiErr.message
      );

      return res.status(500).json({
        error: "AI prediction failed",
        details: aiErr.response?.data || aiErr.message,
      });
    }

    if (!prediction || !shouldSendAlert(prediction)) {
      console.log("TOTAL:", Date.now() - t0, "ms");
      return res.json({
        success: true,
        message: "normal detected, no alert sent",
        prediction,
      });
    }

    const incidentLat = lat ?? metadata.latitude;
    const incidentLng = lng ?? metadata.longitude;

    const t4 = Date.now();
    const nearestRescue = await findNearestRescue(incidentLat, incidentLng);
    console.log("findNearestRescue:", Date.now() - t4, "ms");

    if (!nearestRescue) {
      console.log("TOTAL:", Date.now() - t0, "ms");
      return res.status(404).json({
        error: "ไม่พบหน่วยกู้ภัยที่ครอบคลุมพื้นที่นี้",
        prediction,
        event_lat: incidentLat,
        event_lng: incidentLng,
      });
    }

    const baseText = buildReportText({
      title: "🚨 แจ้งเหตุภัยพิบัติ",
      reportTimestamp: Date.now(),
      reporterLat: lat,
      reporterLng: lng,
      photoLat: metadata.latitude,
      photoLng: metadata.longitude,
      photoDate: metadata.photoDate,
    });

    const finalText =
      `${baseText}\n\n` +
      `${buildPredictionText(prediction)}\n\n` +
      `${buildRescueText(nearestRescue)}`;

    const messages = [
      {
        type: "text",
        text: finalText,
      },
    ];

    if (incidentLat != null && incidentLng != null) {
      messages.push({
        type: "location",
        title: "ตำแหน่งเหตุการณ์",
        address: "จุดเกิดเหตุ",
        latitude: Number(incidentLat),
        longitude: Number(incidentLng),
      });
    }

    messages.push({
      type: "image",
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl,
    });

    const t5 = Date.now();
    await pushToRescueGroup(nearestRescue.line_group_id, messages);
    console.log("pushToRescueGroup:", Date.now() - t5, "ms");

    const t6 = Date.now();
    await saveIncident({
      sourceType: "web_report",
      imageUrl,
      disasterType: prediction?.class || null,
      confidence: prediction?.confidence ?? null,
      eventLat: incidentLat,
      eventLng: incidentLng,
      photoLat: metadata.latitude,
      photoLng: metadata.longitude,
      rescueUnitId: nearestRescue.id,
      rawPrediction: prediction,
    });
    console.log("saveIncident:", Date.now() - t6, "ms");

    console.log("TOTAL:", Date.now() - t0, "ms");

    return res.json({
      success: true,
      prediction,
      nearest_rescue: nearestRescue,
    });
  } catch (err) {
    console.error("FULL ERROR:", err.response?.data || err.message);
    return res.status(500).json({
      error: "Push failed",
      details: err.response?.data || err.message,
    });
  }
});

export default router;