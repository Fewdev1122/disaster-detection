/* eslint-disable no-undef */
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import hotspotRouter from "./routes/hotspot.js";
import webhookRouter from "./routes/webhook.js";
import reportRouter from "./routes/report.js";
import airRoute from "./routes/air.js";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

console.log(
  "CHANNEL_ACCESS_TOKEN:",
  process.env.CHANNEL_ACCESS_TOKEN ? "OK" : "MISSING"
);
console.log(
  "CHANNEL_SECRET:",
  process.env.CHANNEL_SECRET ? "OK" : "MISSING"
);
console.log("BASE_URL:", process.env.BASE_URL || "MISSING");
console.log("AI_SERVICE_URL:", process.env.AI_SERVICE_URL || "MISSING");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "OK" : "MISSING");
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? "OK" : "MISSING");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_KEY in .env");
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// สำคัญ: webhook ต้องมาก่อน express.json()
app.use("/webhook", webhookRouter);

app.use(express.json({ limit: "20mb" }));
app.use("/images", express.static(path.join(process.cwd(), "images")));

app.get("/", (req, res) => {
  res.send("server ok");
});

app.use("/report", reportRouter);
app.use("/api/hotspot", hotspotRouter);
app.use("/api/air", airRoute);

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.message);
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    detail: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});