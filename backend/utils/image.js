import axios from "axios";
import exifr from "exifr";
import path from "path";
import supabase from "../config/supabase.js";

const BUCKET_NAME = "incident-images";

function getExtensionFromMime(mimeType = "") {
  const type = String(mimeType).toLowerCase();

  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/jpeg") return ".jpg";
  if (type === "image/jpg") return ".jpg";

  return ".jpg";
}

function getContentTypeFromExt(ext = ".jpg") {
  const value = String(ext).toLowerCase();

  if (value === ".png") return "image/png";
  if (value === ".webp") return "image/webp";
  return "image/jpeg";
}

function buildFileName(prefix = "report", ext = ".jpg") {
  const safePrefix = String(prefix).replace(/[^a-zA-Z0-9-_]/g, "") || "report";
  return `${safePrefix}-${Date.now()}${ext}`;
}

function extractBase64Parts(base64Image) {
  const matches = String(base64Image).match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
  );

  if (!matches) {
    throw new Error("รูปแบบ base64 ไม่ถูกต้อง");
  }

  return {
    mimeType: matches[1],
    base64Data: matches[2],
  };
}

async function uploadBufferToSupabase(buffer, fileName, contentType) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Image buffer is required");
  }

  const filePathInBucket = fileName;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePathInBucket, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `อัปโหลดรูปไป Supabase Storage ไม่สำเร็จ: ${uploadError.message}`
    );
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePathInBucket);

  return {
    fileName,
    filePath: filePathInBucket,
    imageUrl: data?.publicUrl || null,
  };
}

export async function saveBufferImage(
  buffer,
  prefix = "line",
  ext = ".jpg",
  contentType
) {
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  const finalContentType =
    contentType || getContentTypeFromExt(normalizedExt);
  const fileName = buildFileName(prefix, normalizedExt);

  return uploadBufferToSupabase(buffer, fileName, finalContentType);
}

export async function saveBase64Image(base64Image, prefix = "report") {
  if (!base64Image) {
    throw new Error("Base64 image is required");
  }

  const { mimeType, base64Data } = extractBase64Parts(base64Image);
  const ext = getExtensionFromMime(mimeType);
  const buffer = Buffer.from(base64Data, "base64");

  return saveBufferImage(buffer, prefix, ext, mimeType);
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

export async function readImageMetadata(input) {
  try {
    const data = await exifr.parse(input, { gps: true });

    return {
      photoDate:
        data?.DateTimeOriginal?.toLocaleString?.("th-TH", {
          dateStyle: "medium",
          timeStyle: "short",
        }) ||
        data?.CreateDate?.toLocaleString?.("th-TH", {
          dateStyle: "medium",
          timeStyle: "short",
        }) ||
        null,
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

export function getImageFileNameFromUrl(imageUrl = "") {
  try {
    return path.basename(new URL(imageUrl).pathname);
  } catch {
    return null;
  }
}

export { getExtensionFromMime, getContentTypeFromExt, extractBase64Parts };