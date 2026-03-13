import express from "express";
import { resizeImageForAI, deleteTempImage } from "../utils/resize.js";
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
    const {
      image,
      lat,
      lng,
      photo_lat,
      photo_lng,
      current_lat,
      current_lng,
      location_source,
    } = req.body;

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
    let aiImagePath = null;

    try {
      const t3 = Date.now();
      aiImagePath = await resizeImageForAI(filePath);
      console.log("resizeImageForAI:", Date.now() - t3, "ms");

      const t4 = Date.now();
      prediction = await predictDisaster(aiImagePath);
      console.log("predictDisaster:", Date.now() - t4, "ms");
      console.log("Prediction:", prediction);

      await deleteTempImage(aiImagePath);
    } catch (aiErr) {
      console.error(
        "AI prediction error:",
        aiErr.response?.data || aiErr.message
      );

      if (aiImagePath) {
        await deleteTempImage(aiImagePath);
      }

      return res.status(500).json({
        error: "AI prediction failed",
        details: aiErr.response?.data || aiErr.message,
      });
    }

    // -----------------------------
    // เลือกพิกัดเหตุการณ์
    // priority:
    // 1) พิกัดจาก frontend ที่อ่านจากรูป
    // 2) พิกัด EXIF ที่ backend อ่านเอง
    // 3) พิกัดปัจจุบันของเครื่อง / ตอนกดแจ้ง
    // -----------------------------
    const exifPhotoLat = photo_lat ?? metadata.latitude ?? null;
    const exifPhotoLng = photo_lng ?? metadata.longitude ?? null;

    const reporterLat = current_lat ?? lat ?? null;
    const reporterLng = current_lng ?? lng ?? null;

    let incidentLat = null;
    let incidentLng = null;
    let finalLocationSource = "unknown";

    if (exifPhotoLat != null && exifPhotoLng != null) {
      incidentLat = exifPhotoLat;
      incidentLng = exifPhotoLng;
      finalLocationSource = "image_exif";
    } else if (reporterLat != null && reporterLng != null) {
      incidentLat = reporterLat;
      incidentLng = reporterLng;
      finalLocationSource = location_source || "device_gps";
    }

    if (!prediction || !shouldSendAlert(prediction)) {
      console.log("TOTAL:", Date.now() - t0, "ms");

      return res.json({
        success: true,
        message: "normal detected, no alert sent",
        prediction,
        event_lat: incidentLat,
        event_lng: incidentLng,
        photo_lat: exifPhotoLat,
        photo_lng: exifPhotoLng,
        reporter_lat: reporterLat,
        reporter_lng: reporterLng,
        location_source: finalLocationSource,
      });
    }

    if (incidentLat == null || incidentLng == null) {
      return res.status(400).json({
        error: "ไม่พบพิกัดเหตุการณ์",
        prediction,
      });
    }

    const t5 = Date.now();
    const nearestRescue = await findNearestRescue(incidentLat, incidentLng);
    console.log("findNearestRescue:", Date.now() - t5, "ms");

    if (!nearestRescue) {
      console.log("TOTAL:", Date.now() - t0, "ms");

      return res.status(404).json({
        error: "ไม่พบหน่วยกู้ภัยที่ครอบคลุมพื้นที่นี้",
        prediction,
        event_lat: incidentLat,
        event_lng: incidentLng,
        photo_lat: exifPhotoLat,
        photo_lng: exifPhotoLng,
        reporter_lat: reporterLat,
        reporter_lng: reporterLng,
        location_source: finalLocationSource,
      });
    }

    const baseText = buildReportText({
      title: "🚨 แจ้งเหตุภัยพิบัติ",
      reportTimestamp: Date.now(),

      // พิกัดคนแจ้ง
      reporterLat,
      reporterLng,

      // พิกัดจากรูป
      photoLat: exifPhotoLat,
      photoLng: exifPhotoLng,

      // เวลาในรูป
      photoDate: metadata.photoDate,

      // พิกัดเหตุที่ระบบใช้จริง
      eventLat: incidentLat,
      eventLng: incidentLng,
      locationSource: finalLocationSource,
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

    const t6 = Date.now();
    pushToRescueGroup(nearestRescue.line_group_id, messages)
      .then(() => {
        console.log("pushToRescueGroup:", Date.now() - t6, "ms");
      })
      .catch((err) => {
        console.error("LINE push error:", err.message);
      });

    const t7 = Date.now();
    saveIncident({
      sourceType: "web_report",
      imageUrl,
      disasterType: prediction?.class || null,
      confidence: prediction?.confidence ?? null,

      // พิกัดเหตุที่ระบบใช้จริง
      eventLat: incidentLat,
      eventLng: incidentLng,

      // พิกัดจากรูป
      photoLat: exifPhotoLat,
      photoLng: exifPhotoLng,

      // ถ้า saveIncident รองรับ เพิ่มเก็บพิกัดคนแจ้งด้วย
      reportLat: reporterLat,
      reportLng: reporterLng,

      rescueUnitId: nearestRescue.id,
      rawPrediction: {
        ...prediction,
        location_source: finalLocationSource,
        reporter_lat: reporterLat,
        reporter_lng: reporterLng,
      },
    })
      .then(() => {
        console.log("saveIncident:", Date.now() - t7, "ms");
      })
      .catch((err) => {
        console.error("saveIncident error:", err.message);
      });

    console.log("TOTAL:", Date.now() - t0, "ms");

    return res.json({
      success: true,
      prediction,
      nearest_rescue: nearestRescue,
      event_lat: incidentLat,
      event_lng: incidentLng,
      photo_lat: exifPhotoLat,
      photo_lng: exifPhotoLng,
      reporter_lat: reporterLat,
      reporter_lng: reporterLng,
      location_source: finalLocationSource,
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