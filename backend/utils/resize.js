import path from "path";
import sharp from "sharp";
import fs from "fs/promises";

export async function resizeImageForAI(inputPath) {
  const ext = path.extname(inputPath);
  const base = inputPath.slice(0, -ext.length);
  const outputPath = `${base}-ai.jpg`;

  await sharp(inputPath)
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
    .toFile(outputPath);

  return outputPath;
}

export async function deleteTempImage(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.warn("temp image delete failed:", err.message);
  }
}