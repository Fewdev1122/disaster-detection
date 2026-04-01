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
  if (!matches) throw new Error("Invalid base64");

  return {
    mimeType: matches[1],
    base64Data: matches[2],
  };
}

async function resizeBufferForAI(buffer) {
  return sharp(buffer)
    .rotate()
    .resize({
      width: 512,
      height: 512,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 60,
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

    // 🔥 decode
    const { mimeType, base64Data } = extractBase64Parts(image);
    const imageBuffer = Buffer.from(base64Data, "base64");
    const imageExt = getExtensionFromMime(mimeType);

    // 🔥 EXIF
    const metadata = await readImageMetadata(imageBuffer);

    // 🔥 resize for AI
    const aiBuffer = await resizeBufferForAI(imageBuffer);

    // 🔥 AI
    const prediction = await predictDisaster(aiBuffer);

    // -----------------------------
    // 📍 location logic
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

    // 🔥 ถ้าไม่ต้องแจ้งเตือน
    if (!prediction || !shouldSendAlert(prediction)) {
      return res.json({ success: true });
    }

    if (incidentLat == null || incidentLng == null) {
      return res.status(400).json({ error: "No location" });
    }

    // 🔥 หา rescue
    const nearestRescue = await findNearestRescue(incidentLat, incidentLng);

    if (!nearestRescue) {
      return res.status(404).json({ error: "No rescue unit" });
    }

    // 🔥 สร้างข้อความ
    const baseText = buildReportText({
      title: "🚨 Disaster Alert",
      reportTimestamp: Date.now(),
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
      { type: "text", text: finalText },
      {
        type: "location",
        title: "Location", // ✅ ห้ามว่าง
        address: "Reported location",
        latitude: Number(incidentLat),
        longitude: Number(incidentLng),
      },
    ];

    // 🚀 เริ่ม upload แต่ไม่รอ
    const uploadPromise = saveBufferImage(imageBuffer, "report", imageExt);

    // 🚀 ส่ง response ทันที
    res.json({
      success: true,
      prediction,
    });

    // -----------------------------
    // 🔥 background job
    // -----------------------------
    uploadPromise
      .then(({ imageUrl }) => {
        console.log("imageUrl:", imageUrl);

        // 📩 ส่ง LINE (text + map)
        pushToRescueGroup(nearestRescue.line_group_id, messages).catch(console.error);

        // 🖼️ ส่งรูปแยก
        if (imageUrl) {
          pushToRescueGroup(nearestRescue.line_group_id, [
            {
              type: "image",
              originalContentUrl: imageUrl,
              previewImageUrl: imageUrl,
            },
          ]).catch(console.error);
        }

        // 💾 save DB
        saveIncident({
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
        }).catch(console.error);
      })
      .catch(console.error);

    console.log("TOTAL:", Date.now() - t0, "ms");
  } catch (err) {
    console.error("ERROR:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;