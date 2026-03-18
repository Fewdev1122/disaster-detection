import axios from "axios";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pushToRescueGroup(groupId, messages, retry = 0) {
  try {
    const res = await axios.post(
      "https://api.line.me/v2/bot/message/push",
      {
        to: groupId,
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (err) {
    const status = err.response?.status;

    // ถ้าโดน rate limit ให้รอแล้วลองใหม่
    if (status === 429 && retry < 2) {
      console.warn("LINE 429 rate limit → retrying...");
      await sleep(1500);
      return pushToRescueGroup(groupId, messages, retry + 1);
    }

    console.error(
      "LINE push error:",
      status,
      err.response?.data || err.message
    );

    throw err;
  }
}