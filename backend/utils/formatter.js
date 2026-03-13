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

export function buildPredictionText(prediction) {
  if (!prediction || !prediction.class) {
    return "ไม่สามารถวิเคราะห์ภาพได้";
  }

  const lines = [
    `ประเภทเหตุ: ${formatDisasterLabel(prediction.class)}`,
  ];

  if (prediction.confidence != null) {
    const confidence =
      typeof prediction.confidence === "number"
        ? (prediction.confidence * 100).toFixed(2)
        : prediction.confidence;

    lines.push(`ความมั่นใจ: ${confidence}%`);
  }

  return lines.join("\n");
}

export function buildMapLink(lat, lng) {
  if (lat == null || lng == null) {
    return null;
  }

  return `https://maps.google.com/?q=${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
}

export function formatLocationLine(label, lat, lng) {
  if (lat == null || lng == null) {
    return `${label}: -`;
  }

  return `${label}: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}

export function formatLocationSource(source) {
  const map = {
    image_exif: "พิกัดจากรูปภาพ",
    device_gps: "พิกัดปัจจุบันของผู้แจ้ง",
    unknown: "ไม่ทราบแหล่งพิกัด",
  };

  return map[source] || source || "-";
}

export function buildReportText({
  title,
  reportTimestamp,
  reporterLat,
  reporterLng,
  photoLat,
  photoLng,
  photoDate,
}) {
  const finalDate = photoDate ? new Date(photoDate) : new Date(reportTimestamp);

  const lines = [
    title,
    "",
    `เวลาเหตุการณ์: ${formatThaiDate(finalDate)}`,
  ];

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
    return "ยังไม่พบหน่วยกู้ภัยที่เหมาะสม";
  }

  const lines = [
    "หน่วยที่รับแจ้ง",
    `${rescue.name}`,
  ];

  if (rescue.distance_km != null) {
    lines.push(`ระยะห่าง: ${Number(rescue.distance_km).toFixed(2)} กม.`);
  }

  return lines.join("\n");
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