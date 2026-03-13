import axios from "axios";
import fs from "fs";
import FormData from "form-data";

export async function predictDisaster(imagePath) {
  const form = new FormData();
  form.append("image", fs.createReadStream(imagePath));

  const response = await axios.post(
    process.env.AI_URL || "http://127.0.0.1:5000/predict",
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