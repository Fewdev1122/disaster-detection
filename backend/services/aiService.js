import axios from "axios";
import fs from "fs";
import FormData from "form-data";

export async function predictDisaster(imagePath) {
  const form = new FormData();
  form.append("image", fs.createReadStream(imagePath));

  const aiBaseUrl = process.env.AI_SERVICE_URL;
  if (!aiBaseUrl) {
    throw new Error("Missing AI_SERVICE_URL in environment variables");
  }

  const response = await axios.post(
    `${aiBaseUrl}/predict`,
    form,
    {
      headers: {
        ...form.getHeaders(),
      },
      maxBodyLength: Infinity,
    }
  );

  return response.data;
}