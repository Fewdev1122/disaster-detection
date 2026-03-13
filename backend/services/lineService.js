import axios from "axios";

export async function pushToRescueGroup(groupId, messages) {
  await axios.post(
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
}