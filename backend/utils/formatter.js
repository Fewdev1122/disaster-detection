const DISASTER_LABEL_MAP = {
  fire: "Fire",
  flood: "Flood",
  smoke: "Smoke",
  fog: "Fog",
  dust: "Dust",
  normal: "Normal",
};

const LOCATION_SOURCE_MAP = {
  image_exif: "Photo GPS",
  device_gps: "Reporter GPS",
  unknown: "Unknown",
};

export function formatDateEN(dateValue) {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleString("en-US", {
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
    return "Type: Unknown";
  }

  return `Type: ${formatDisasterLabel(prediction.class)}`;
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
    lines.push(`Captured at: ${photoDate}`);
  }

  lines.push(`Reported at: ${formatDateEN(reportTimestamp)}`);

  if (locationSource) {
    lines.push(`Source: ${formatLocationSource(locationSource)}`);
  }

  // 📍 Incident (ใช้ location card อยู่แล้ว เลยไม่ต้องใส่ link)
  if (eventLat != null && eventLng != null) {
    lines.push("");
    lines.push("📍 Incident Location");
  }

  // 👤 Reporter (แสดงเฉพาะกรณีมี EXIF)
  if (
    photoLat != null &&
    photoLng != null &&
    reporterLat != null &&
    reporterLng != null
  ) {
    const rLat = Number(reporterLat).toFixed(5);
    const rLng = Number(reporterLng).toFixed(5);

    lines.push("");
    lines.push("👤 Reporter Location:");
    lines.push(`https://maps.google.com/?q=${rLat},${rLng}`);
  }

  return lines.join("\n");
}

export function buildRescueText(rescue) {
  if (!rescue) {
    return "Unit: Not available";
  }

  const lines = [`Unit: ${rescue.name}`];

  if (rescue.distance_km != null) {
    lines.push(`Distance: ${Number(rescue.distance_km).toFixed(2)} km`);
  }

  return lines.join("\n");
}

export function shouldSendAlert(prediction) {
  return true;
}