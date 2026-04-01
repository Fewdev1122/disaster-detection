import axios from "axios";
import FormData from "form-data";

export async function predictDisaster(imageBuffer) {
  if (!imageBuffer) {
    throw new Error("Image buffer is required");
  }

  const aiUrl = process.env.AI_SERVICE_URL;

  if (!aiUrl) {
    throw new Error("Missing AI_SERVICE_URL in environment variables");
  }

  const form = new FormData();
  form.append("image", imageBuffer, {
    filename: "image.jpg",
    contentType: "image/jpeg",
  });

  const startedAt = Date.now();

  const response = await axios.post(aiUrl, form, {
    headers: {
      ...form.getHeaders(),
    },
    maxBodyLength: Infinity,
    timeout: 30000,
  });

  console.log("predictDisaster axios total:", Date.now() - startedAt, "ms");

  return response.data;
}