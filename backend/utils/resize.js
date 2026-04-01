import sharp from "sharp";
import fs from "fs/promises";

export async function resizeImageForAI(input) {
  const transformer = sharp(input)
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
    });

  return transformer.toBuffer();
}

export async function deleteTempImage(filePath) {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.warn("temp image delete failed:", err.message);
  }
}