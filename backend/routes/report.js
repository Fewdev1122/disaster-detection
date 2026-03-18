import express from "express";
import fs from "fs/promises";
import path from "path";
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

function extractBase64Parts(base64Image) {
  const matches = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!matches) {
    throw new Error("รูปแบบ base64 ไม่ถูกต้อง");
  }

  return {
    mimeType: matches[1],
    base64Data: matches[2],
  };
}

function getExtensionFromMime(mimeType = "") {
  const type = mimeType.toLowerCase();

  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  return ".jpg";
}

async function safeDelete(filePath) {
  if (!filePath) return;
  try {
    await deleteTempImage(filePath);
  } catch (err) {
    console.error("deleteTempImage error:", err.message);
  }
}

router.post("/", async (req, res) => {
  const totalStart = Date.now();

  let tempOriginalPath = null;
  let aiImagePath = null;

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

    const parseStart = Date.now();
    const { mimeType, base64Data } = extractBase64Parts(image);
    const imageBuffer = Buffer.from(base64Data, "base64");
    const fileExt = getExtensionFromMime(mimeType);
    console.log("parseBase64:", Date.now() - parseStart, "ms");

    const metadataPromise = (async () => {
      const started = Date.now();
      const metadata = await readImageMetadata(imageBuffer);
      console.log("readImageMetadata:", Date.now() - started, "ms");
      return metadata;
    })();

    const predictionPromise = (async () => {
      const writeStart = Date.now();
      tempOriginalPath = path.join("/tmp", `report-${Date.now()}${fileExt}`);
      await fs.writeFile(tempOriginalPath, imageBuffer);
      console.log("writeTempFile:", Date.now() - writeStart, "ms");

      const resizeStart = Date.now();
      aiImagePath = await resizeImageForAI(tempOriginalPath);
      console.log("resizeImageForAI:", Date.now() - resizeStart, "ms");

      const predictStart = Date.now();
      const prediction = await predictDisaster(aiImagePath);
      console.log("predictDisaster:", Date.now() - predictStart, "ms");
      return prediction;
    })();

    let metadata;
    let prediction;

    try {
      [metadata, prediction] = await Promise.all([metadataPromise, predictionPromise]);
      console.log("Prediction:", prediction);
    } catch (err) {
      console.error("AI / metadata error:", err.response?.data || err.message);

      return res.status(500).json({
        error: "AI prediction failed",
        details: err.response?.data || err.message,
      });
    } finally {
      await safeDelete(aiImagePath);
      await safeDelete(tempOriginalPath);
    }

    const exifPhotoLat = photo_lat ?? metadata?.latitude ?? null;
    const exifPhotoLng = photo_lng ?? metadata?.longitude ?? null;

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
      const uploadStart = Date.now();
      const { imageUrl } = await saveBase64Image(image, "report");
      console.log("saveBase64Image:", Date.now() - uploadStart, "ms");
      console.log("TOTAL:", Date.now() - totalStart, "ms");

      return res.json({
        success: true,
        message: "normal detected, no alert sent",
        prediction,
        image_url: imageUrl,
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

    const nearestStart = Date.now();
    const nearestRescue = await findNearestRescue(incidentLat, incidentLng);
    console.log("findNearestRescue:", Date.now() - nearestStart, "ms");

    if (!nearestRescue) {
      console.log("TOTAL:", Date.now() - totalStart, "ms");

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

    const uploadStart = Date.now();
    const { imageUrl } = await saveBase64Image(image, "report");
    console.log("saveBase64Image:", Date.now() - uploadStart, "ms");

    const responsePayload = {
      success: true,
      prediction,
      image_url: imageUrl,
      nearest_rescue: nearestRescue,
      event_lat: incidentLat,
      event_lng: incidentLng,
      photo_lat: exifPhotoLat,
      photo_lng: exifPhotoLng,
      reporter_lat: reporterLat,
      reporter_lng: reporterLng,
      location_source: finalLocationSource,
    };

    console.log("TOTAL:", Date.now() - totalStart, "ms");
    res.json(responsePayload);

    const baseText = buildReportText({
      title: "🚨 แจ้งเหตุภัยพิบัติ",
      reportTimestamp: Date.now(),
      reporterLat,
      reporterLng,
      photoLat: exifPhotoLat,
      photoLng: exifPhotoLng,
      photoDate: metadata?.photoDate,
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

    if (imageUrl) {
      messages.push({
        type: "image",
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl,
      });
    }

    const bgStart = Date.now();

    Promise.allSettled([
      (async () => {
        const started = Date.now();
        await saveIncident({
          sourceType: "web_report",
          imageUrl,
          disasterType: prediction?.class || null,
          confidence: prediction?.confidence ?? null,
          eventLat: incidentLat,
          eventLng: incidentLng,
          photoLat: exifPhotoLat,
          photoLng: exifPhotoLng,
          rescueUnitId: nearestRescue.id,
          rawPrediction: {
            ...prediction,
            location_source: finalLocationSource,
            reporter_lat: reporterLat,
            reporter_lng: reporterLng,
          },
        });
        console.log("saveIncident:", Date.now() - started, "ms");
      })(),

      (async () => {
        const started = Date.now();
        await pushToRescueGroup(nearestRescue.line_group_id, messages);
        console.log("pushToRescueGroup:", Date.now() - started, "ms");
      })(),
    ]).then((results) => {
      const [saveResult, pushResult] = results;

      if (saveResult.status === "rejected") {
        console.error("saveIncident error:", saveResult.reason?.message || saveResult.reason);
      }

      if (pushResult.status === "rejected") {
        console.error("LINE push error:", pushResult.reason?.message || pushResult.reason);
      }

      console.log("backgroundTasks:", Date.now() - bgStart, "ms");
    });
  } catch (err) {
    console.error("FULL ERROR:", err.response?.data || err.message);

    await safeDelete(aiImagePath);
    await safeDelete(tempOriginalPath);

    return res.status(500).json({
      error: "Push failed",
      details: err.response?.data || err.message,
    });
  }
});

export default router;