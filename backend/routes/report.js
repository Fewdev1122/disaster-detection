import express from "express";
import sharp from "sharp";
import {
  saveBufferImage,
  readImageMetadata,
  getExtensionFromMime,
} from "../utils/image.js";
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

async function resizeBufferForAI(buffer) {
  return sharp(buffer)
    .rotate()
    .resize({
      width: 640,
      height: 640,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 80,
      mozjpeg: true,
    })
    .toBuffer();
}

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

    const { mimeType, base64Data } = extractBase64Parts(image);
    const imageBuffer = Buffer.from(base64Data, "base64");
    const imageExt = getExtensionFromMime(mimeType);

    const t2 = Date.now();
    const metadata = await readImageMetadata(imageBuffer);
    console.log("readImageMetadata:", Date.now() - t2, "ms");

    const t3 = Date.now();
    const aiBuffer = await resizeBufferForAI(imageBuffer);
    console.log("resizeBufferForAI:", Date.now() - t3, "ms");

    const t4 = Date.now();
    const prediction = await predictDisaster(aiBuffer);
    console.log("predictDisaster:", Date.now() - t4, "ms");
    console.log("Prediction:", prediction);

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

    const t1 = Date.now();
    const { imageUrl } = await saveBufferImage(imageBuffer, "report", imageExt);
    console.log("saveBufferImage:", Date.now() - t1, "ms");
    console.log("imageUrl:", imageUrl);

    if (!prediction || !shouldSendAlert(prediction)) {
      console.log("TOTAL:", Date.now() - t0, "ms");

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
        image_url: imageUrl,
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

    const baseText = buildReportText({
      title: "🚨 แจ้งเหตุภัยพิบัติ",
      reportTimestamp: Date.now(),
      reporterLat,
      reporterLng,
      photoLat: exifPhotoLat,
      photoLng: exifPhotoLng,
      photoDate: metadata.photoDate,
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

    pushToRescueGroup(nearestRescue.line_group_id, messages).catch((err) => {
      console.error("LINE push error:", err.message);
    });

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
    }).catch((err) => {
      console.error("saveIncident error:", err.message);
    });

    console.log("TOTAL:", Date.now() - t0, "ms");

    return res.json({
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