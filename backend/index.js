/* eslint-disable no-undef */
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import rescueRouter from "./routes/rescue.js";
import hotspotRouter from "./routes/hotspot.js";
import webhookRouter from "./routes/webhook.js";
import reportRouter from "./routes/report.js";
import airRoute from "./routes/air.js";
import adminRescueRouter from "./routes/adminRescue.js";
import incidentsRouter from "./routes/incidents.js";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, "images");

console.log("imagesDir =", imagesDir);

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

app.get("/debug/images", (req, res) => {
  try {
    const files = fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir) : [];
    res.json({
      imagesDir,
      exists: fs.existsSync(imagesDir),
      files,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.use("/images", express.static(imagesDir));

app.get("/", (req, res) => {
  res.send("server ok");
});

app.use("/report", reportRouter);
app.use("/api/hotspot", hotspotRouter);
app.use("/api/air", airRoute);
app.use("/api/admin", adminRescueRouter);
app.use("/api/rescue", rescueRouter);
app.use("/api/incidents", incidentsRouter);

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