import fs from "fs";
import path from "path";
import axios from "axios";
import exifr from "exifr";

export function ensureImagesDir() {
  if (!fs.existsSync("images")) {
    fs.mkdirSync("images");
  }
}

export function saveBufferImage(buffer, prefix = "line", ext = ".jpg") {
  ensureImagesDir();
  const fileName = `${prefix}-${Date.now()}${ext}`;
  const filePath = path.join("images", fileName);
  fs.writeFileSync(filePath, buffer);
  return { fileName, filePath };
}

export function saveBase64Image(base64Image, prefix = "report") {
  ensureImagesDir();
  const fileName = `${prefix}-${Date.now()}.jpg`;
  const filePath = path.join("images", fileName);

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  fs.writeFileSync(filePath, base64Data, "base64");

  return { fileName, filePath };
}

export async function getImageContent(messageId) {
  const response = await axios.get(
    `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    {
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );

  return response.data;
}

export async function readImageMetadata(filePath) {
  try {
    const data = await exifr.parse(filePath, { gps: true });

    return {
      photoDate: data?.DateTimeOriginal || data?.CreateDate || null,
      latitude: data?.latitude || null,
      longitude: data?.longitude || null,
      make: data?.Make || null,
      model: data?.Model || null,
    };
  } catch (err) {
    console.error("EXIF read error:", err.message);
    return {
      photoDate: null,
      latitude: null,
      longitude: null,
      make: null,
      model: null,
    };
  }
}