export function formatThaiDate(dateValue) {
  if (!dateValue) return "-";

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

export function formatLocationSource(source) {
  const map = {
    image_exif: "พิกัดจากรูปภาพ",
    device_gps: "พิกัดปัจจุบันของผู้แจ้ง",
    unknown: "ไม่ทราบแหล่งพิกัด",
  };

  return map[source] || source || "-";
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
  const lines = [
    title,
    "",
  ];

  if (photoDate) {
    lines.push(`เวลาในรูป: ${photoDate}`);
  }

  lines.push(`เวลาแจ้งเหตุ: ${formatThaiDate(reportTimestamp)}`);
  lines.push("");

  if (eventLat != null && eventLng != null) {
    lines.push(
      `ตำแหน่งเหตุ: ${Number(eventLat).toFixed(5)}, ${Number(eventLng).toFixed(5)}`
    );
  }

  if (locationSource) {
    lines.push(`แหล่งพิกัด: ${formatLocationSource(locationSource)}`);
  }

  if (photoLat != null && photoLng != null) {
    lines.push(
      `พิกัดจากรูป: ${Number(photoLat).toFixed(5)}, ${Number(photoLng).toFixed(5)}`
    );
  }

  if (reporterLat != null && reporterLng != null) {
    lines.push(
      `พิกัดผู้แจ้ง: ${Number(reporterLat).toFixed(5)}, ${Number(reporterLng).toFixed(5)}`
    );
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