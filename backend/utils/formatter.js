export function formatThaiDate(dateValue) {
  return new Date(dateValue).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDisasterLabel(label) {
  const map = {
    fire: "ไฟไหม้",
    flood: "น้ำท่วม",
    smoke: "ควัน",
    fog: "หมอก",
    dust: "ฝุ่น",
    normal: "ปกติ",
  };

  return map[label] || label;
}

export function buildPredictionText(prediction) {
  if (!prediction || !prediction.class) {
    return "ไม่สามารถวิเคราะห์ภาพได้";
  }

  

  return [
    `ประเภทเหตุ: ${formatDisasterLabel(prediction.class).replace(/^[^\s]+\s/, "")}`,
  ].join("\n");
}

export function buildMapLink(lat, lng) {
  if (lat == null || lng == null) {
    return null;
  }

  return `https://maps.google.com/?q=${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
}

export function buildReportText({
  title,
  reportTimestamp,
  photoDate,
}) {
  const finalDate = photoDate ? new Date(photoDate) : new Date(reportTimestamp);

  const lines = [
    title,
    "",
    `เวลาเหตุการณ์: ${formatThaiDate(finalDate)}`,
  ];

  return lines.join("\n");
}

export function buildRescueText(rescue) {
  if (!rescue) {
    return "ยังไม่พบหน่วยกู้ภัยที่เหมาะสม";
  }

  return [
    "หน่วยที่รับแจ้ง",
    `${rescue.name}`,
  ].join("\n");
}

export function shouldSendAlert(prediction) {
  if (!prediction || !prediction.class) {
    return true;
  }

  if (prediction.class === "normal") {
    return false;
  }

  return true;
}