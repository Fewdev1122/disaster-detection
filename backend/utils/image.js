import fs from "fs";
import path from "path";
import axios from "axios";
import exifr from "exifr";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// utils อยู่ใน backend/utils
// images อยู่ใน backend/images
const IMAGES_DIR = path.join(__dirname, "..", "images");

export function ensureImagesDir() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
}

export function saveBufferImage(buffer, prefix = "line", ext = ".jpg") {
  ensureImagesDir();

  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  const fileName = `${prefix}-${Date.now()}${normalizedExt}`;
  const filePath = path.join(IMAGES_DIR, fileName);

  fs.writeFileSync(filePath, buffer);

  return { fileName, filePath };
}

export function saveBase64Image(base64Image, prefix = "report") {
  ensureImagesDir();

  if (!base64Image) {
    throw new Error("Base64 image is required");
  }

  const matches = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!matches) {
    throw new Error("รูปแบบ base64 ไม่ถูกต้อง");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  let ext = ".jpg";
  if (mimeType === "image/png") ext = ".png";
  else if (mimeType === "image/webp") ext = ".webp";
  else if (mimeType === "image/jpeg") ext = ".jpg";
  else if (mimeType === "image/jpg") ext = ".jpg";

  const fileName = `${prefix}-${Date.now()}${ext}`;
  const filePath = path.join(IMAGES_DIR, fileName);

  fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

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