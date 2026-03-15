import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

const DEFAULT_CENTER = [19.9105, 99.8406];

const activeIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width:14px;
      height:14px;
      background:#e11d48;
      border:2px solid #fff;
      border-radius:9999px;
      box-shadow:0 0 0 2px rgba(225,29,72,0.18);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const pendingIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width:14px;
      height:14px;
      background:#f59e0b;
      border:2px solid #fff;
      border-radius:9999px;
      box-shadow:0 0 0 2px rgba(245,158,11,0.18);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const inactiveIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width:14px;
      height:14px;
      background:#94a3b8;
      border:2px solid #fff;
      border-radius:9999px;
      box-shadow:0 0 0 2px rgba(148,163,184,0.18);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const incidentIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width:14px;
      height:14px;
      background:#2563eb;
      border:2px solid #fff;
      border-radius:9999px;
      box-shadow:0 0 0 2px rgba(37,99,235,0.18);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function getMarkerIcon(status) {
  switch (status) {
    case "active":
      return activeIcon;
    case "pending":
      return pendingIcon;
    case "inactive":
      return inactiveIcon;
    default:
      return activeIcon;
  }
}

function getCircleStyle(status) {
  switch (status) {
    case "active":
      return {
        color: "#e11d48",
        fillColor: "#e11d48",
        fillOpacity: 0.05,
        weight: 1,
      };
    case "pending":
      return {
        color: "#f59e0b",
        fillColor: "#f59e0b",
        fillOpacity: 0.04,
        weight: 1,
      };
    case "inactive":
      return {
        color: "#94a3b8",
        fillColor: "#94a3b8",
        fillOpacity: 0.03,
        weight: 1,
      };
    default:
      return {
        color: "#e11d48",
        fillColor: "#e11d48",
        fillOpacity: 0.05,
        weight: 1,
      };
  }
}

function formatStatusLabel(status) {
  switch (status) {
    case "active":
      return "พร้อมใช้งาน";
    case "pending":
      return "รอดำเนินการ";
    case "inactive":
      return "ไม่พร้อมใช้งาน";
    default:
      return status || "-";
  }
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPercent(value) {
  if (value == null) return "-";
  return `${(Number(value) * 100).toFixed(0)}%`;
}

function getIncidentCoordinate(item) {
  if (item?.event_lat != null && item?.event_lng != null) {
    return {
      lat: Number(item.event_lat),
      lng: Number(item.event_lng),
      source: "event",
    };
  }

  if (item?.photo_lat != null && item?.photo_lng != null) {
    return {
      lat: Number(item.photo_lat),
      lng: Number(item.photo_lng),
      source: "photo",
    };
  }

  return null;
}

export default function RescueUnitsMapPanel({
  units = [],
  incidents = [],
  title = "แผนที่หน่วยกู้ภัยและเหตุล่าสุด",
  subtitle = "แสดงเฉพาะหน่วยที่พร้อมใช้งานและจุดเหตุล่าสุด",
  defaultShowRadius = true,
}) {
  const [showRadius, setShowRadius] = useState(defaultShowRadius);

  const validUnits = useMemo(() => {
    return units.filter((unit) => {
      const lat = unit.base_lat ?? unit.lat;
      const lng = unit.base_lng ?? unit.lng;

      return (
        unit.status === "active" &&
        lat != null &&
        lng != null &&
        !Number.isNaN(Number(lat)) &&
        !Number.isNaN(Number(lng))
      );
    });
  }, [units]);

  const validIncidents = useMemo(() => {
    return incidents.filter((item) => {
      const point = getIncidentCoordinate(item);
      return point && !Number.isNaN(point.lat) && !Number.isNaN(point.lng);
    });
  }, [incidents]);

  const center =
    validUnits.length > 0
      ? [
          Number(validUnits[0].base_lat ?? validUnits[0].lat),
          Number(validUnits[0].base_lng ?? validUnits[0].lng),
        ]
      : validIncidents.length > 0
      ? [
          getIncidentCoordinate(validIncidents[0]).lat,
          getIncidentCoordinate(validIncidents[0]).lng,
        ]
      : DEFAULT_CENTER;

  const activeCount = validUnits.length;
  const incidentCount = validIncidents.length;

  return (
    <section className="border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
            หน่วยพร้อมใช้งาน
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            เหตุล่าสุด
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <span>หน่วยพร้อม {activeCount} หน่วย</span>
          <span>เหตุล่าสุด {incidentCount} จุด</span>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showRadius}
            onChange={(e) => setShowRadius(e.target.checked)}
            className="h-4 w-4 border-slate-300"
          />
          แสดงรัศมีการครอบคลุม
        </label>
      </div>

      <div className="h-[420px]">
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validUnits.map((unit) => {
            const lat = Number(unit.base_lat ?? unit.lat);
            const lng = Number(unit.base_lng ?? unit.lng);
            const radiusKm = Number(unit.coverage_km || 0);

            return (
              <div key={`unit-${unit.id}`}>
                {showRadius && radiusKm > 0 ? (
                  <Circle
                    center={[lat, lng]}
                    radius={radiusKm * 1000}
                    pathOptions={getCircleStyle(unit.status)}
                  />
                ) : null}

                <Marker position={[lat, lng]} icon={getMarkerIcon(unit.status)}>
                  <Popup>
                    <div className="min-w-[220px] text-sm">
                      <p className="font-semibold text-slate-900">
                        {unit.name || "-"}
                      </p>

                      <div className="mt-2 space-y-1 text-slate-700">
                        <p>
                          <span className="font-medium">ผู้ประสานงาน:</span>{" "}
                          {unit.coordinator_name || "-"}
                        </p>
                        <p>
                          <span className="font-medium">เบอร์โทร:</span>{" "}
                          {unit.phone || "-"}
                        </p>
                        <p>
                          <span className="font-medium">จังหวัด:</span>{" "}
                          {unit.province || "-"}
                        </p>
                        <p>
                          <span className="font-medium">อำเภอ:</span>{" "}
                          {unit.district || "-"}
                        </p>
                        <p>
                          <span className="font-medium">สถานะ:</span>{" "}
                          {formatStatusLabel(unit.status)}
                        </p>
                        <p>
                          <span className="font-medium">รัศมี:</span>{" "}
                          {radiusKm || "-"} กม.
                        </p>
                        <p>
                          <span className="font-medium">LINE:</span>{" "}
                          {unit.line_user_id ? "เชื่อมแล้ว" : "ยังไม่ผูก"}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}

          {validIncidents.map((incident) => {
            const point = getIncidentCoordinate(incident);

            return (
              <Marker
                key={`incident-${incident.id}`}
                position={[point.lat, point.lng]}
                icon={incidentIcon}
              >
                <Popup>
                  <div className="min-w-[220px] text-sm">
                    <p className="font-semibold text-slate-900">เหตุล่าสุด</p>

                    <div className="mt-2 space-y-1 text-slate-700">
                      <p>
                        <span className="font-medium">ความมั่นใจ:</span>{" "}
                        {formatPercent(incident.confidence)}
                      </p>
                      <p>
                        <span className="font-medium">เวลา:</span>{" "}
                        {formatDateTime(incident.created_at)}
                      </p>
                      <p>
                        <span className="font-medium">หน่วยที่เกี่ยวข้อง:</span>{" "}
                        {incident.rescue_units?.name || "-"}
                      </p>
                      <p>
                        <span className="font-medium">พิกัด:</span>{" "}
                        {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                      </p>
                      {incident.image_url ? (
                        <p>
                          <a
                            href={incident.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            ดูรูป
                          </a>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}