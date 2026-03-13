/* eslint-disable no-undef */
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import * as line from "@line/bot-sdk";

if (!process.env.CHANNEL_ACCESS_TOKEN) {
  throw new Error("CHANNEL_ACCESS_TOKEN missing in .env");
}

if (!process.env.CHANNEL_SECRET) {
  throw new Error("CHANNEL_SECRET missing in .env");
}

export const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

export const lineClient = new line.Client(lineConfig);
export const lineMiddleware = line.middleware(lineConfig);