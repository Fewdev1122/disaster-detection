const DISASTER_LABEL_MAP = {
  fire: "ไฟไหม้",
  flood: "น้ำท่วม",
  smoke: "ควัน",
  fog: "หมอก",
  dust: "ฝุ่น",
  normal: "ปกติ",
};

const LOCATION_SOURCE_MAP = {
  image_exif: "พิกัดจากรูปภาพ",
  device_gps: "พิกัดปัจจุบันของผู้แจ้ง",
  unknown: "ไม่ทราบแหล่งพิกัด",
};

export function formatThaiDate(dateValue) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDisasterLabel(label) {
  return DISASTER_LABEL_MAP[label] || label;
}

export function formatLocationSource(source) {
  return LOCATION_SOURCE_MAP[source] || source || "-";
}

export function buildPredictionText(prediction) {
  if (!prediction || !prediction.class) {
    return "ประเภทเหตุ: ไม่สามารถวิเคราะห์ได้";
  }

  return `ประเภทเหตุ: ${formatDisasterLabel(prediction.class)}`;
}

export function buildReportText({
  title,
  reportTimestamp,
  reporterLat,
  reporterLng,
  photoLat,
  photoLng,
  photoDate,
  eventLat,
  eventLng,
  locationSource,
}) {
  const lines = [title, ""];

  if (photoDate) {
    lines.push(`เวลาในรูป: ${photoDate}`);
  }

  lines.push(`เวลาแจ้งเหตุ: ${formatThaiDate(reportTimestamp)}`);

  if (locationSource) {
    lines.push(`แหล่งพิกัด: ${formatLocationSource(locationSource)}`);
  }

  if (eventLat != null && eventLng != null) {

    lines.push("");
    lines.push("📍 จุดเกิดเหตุ:");

  }

  if (
    photoLat != null &&
    photoLng != null &&
    reporterLat != null &&
    reporterLng != null
  ) {
    const rLat = Number(reporterLat).toFixed(5);
    const rLng = Number(reporterLng).toFixed(5);

    lines.push("");
    lines.push("👤 ตำแหน่งผู้แจ้ง:");
    lines.push(`https://maps.google.com/?q=${rLat},${rLng}`);
  }

  return lines.join("\n");
}

export function buildRescueText(rescue) {
  if (!rescue) {
    return "หน่วยที่รับแจ้ง: ไม่พบหน่วยที่เหมาะสม";
  }

  const lines = [`หน่วยที่รับแจ้ง: ${rescue.name}`];

  if (rescue.distance_km != null) {
    lines.push(`ระยะห่าง: ${Number(rescue.distance_km).toFixed(2)} กม.`);
  }

  return lines.join("\n");
}

export function shouldSendAlert(prediction) {
  return true;
}