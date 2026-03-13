/* eslint-disable no-undef */
import express from "express";

import { lineClient, lineMiddleware } from "../config/line.js";
import { getImageContent, saveBufferImage, readImageMetadata } from "../utils/image.js";
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

router.post("/", lineMiddleware, async (req, res) => {
  try {
    const events = req.body?.events || [];
    console.log("Webhook body:", JSON.stringify(req.body));

    for (const event of events) {
      try {
        console.log("EVENT SOURCE:", event.source);
        console.log("EVENT TYPE:", event.type, event.message?.type);

        if (event.type === "join") {
          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: "บอทเข้ากลุ่มแล้ว พร้อมรับแจ้งเหตุ",
          });
          continue;
        }

        if (event.type !== "message") continue;

        if (event.message.type === "text") {
          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: "ส่งรูปแจ้งเหตุมาได้เลย",
          });
          continue;
        }

        if (event.message.type === "image") {
          console.log("STEP 1: reply loading");
          await lineClient.replyMessage(event.replyToken, {
            type: "text",
            text: "ได้รับรูปแล้ว กำลังวิเคราะห์...",
          });

          console.log("STEP 2: get image content");
          const imageBuffer = await getImageContent(event.message.id);

          console.log("STEP 3: save image");
          const { fileName, filePath } = saveBufferImage(imageBuffer, "line", ".jpg");
          const imageUrl = `${process.env.BASE_URL}/images/${fileName}`;
          console.log("imageUrl:", imageUrl);

          console.log("STEP 4: read metadata");
          const metadata = await readImageMetadata(filePath);
          console.log("metadata:", metadata);

          let prediction = null;
          try {
            console.log("STEP 5: predict disaster");
            prediction = await predictDisaster(filePath);
            console.log("prediction:", prediction);
          } catch (aiErr) {
            console.error("AI prediction error full:", aiErr.response?.data || aiErr.message);
          }

          if (!shouldSendAlert(prediction)) {
            console.log("Prediction normal → skip LINE alert");
            continue;
          }

          const incidentLat = metadata.latitude;
          const incidentLng = metadata.longitude;
          console.log("incidentLat/Lng:", incidentLat, incidentLng);

          console.log("STEP 6: find nearest rescue");
          const nearestRescue =
            incidentLat != null && incidentLng != null
              ? await findNearestRescue(incidentLat, incidentLng)
              : null;

          console.log("nearestRescue:", nearestRescue);

          if (!nearestRescue) {
            console.log("No rescue unit found for webhook image location");
            continue;
          }

          const baseText = buildReportText({
            title: "🚨 มีผู้ใช้ส่งรูปแจ้งเหตุเข้ามาทาง LINE OA",
            reportTimestamp: event.timestamp,
            reporterLat: null,
            reporterLng: null,
            photoLat: metadata.latitude,
            photoLng: metadata.longitude,
            photoDate: metadata.photoDate,
          });

          const reporterId =
            event.source?.userId ||
            event.source?.groupId ||
            event.source?.roomId ||
            "ไม่ทราบผู้แจ้ง";

          const finalText =
            `${baseText}\n` +
            `👤 ผู้แจ้ง: ${reporterId}\n` +
            `${buildRescueText(nearestRescue)}\n\n` +
            `${buildPredictionText(prediction)}`;

          console.log("STEP 7: build messages");
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

          console.log("messages:", JSON.stringify(messages, null, 2));

          console.log("STEP 8: push to rescue group");
          await pushToRescueGroup(nearestRescue.line_group_id, messages);

          console.log("STEP 9: save incident");
          await saveIncident({
            sourceType: "line_webhook",
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

          console.log("PUSH TO RESCUE GROUP SUCCESS");
        }
      } catch (eventErr) {
        console.error("EVENT ERROR MESSAGE:", eventErr.message);
        console.error("EVENT ERROR RESPONSE:", eventErr.response?.data);
        console.error("EVENT ERROR STACK:", eventErr.stack);
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook outer error:", err.message);
    console.error("Webhook outer response:", err.response?.data);
    console.error("Webhook outer stack:", err.stack);
    return res.sendStatus(200);
  }
});

export default router;