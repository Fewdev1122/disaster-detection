import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { getApprovedRescueUnits } from "../../services/adminRescueService";
import { getRecentIncidents } from "../../services/incidentService";
import { loadGoogleMaps } from "../../utils/loadGoogleMaps";

const DEFAULT_CENTER = { lat: 19.9105, lng: 99.8406 };
const DEFAULT_ZOOM = 8;

function formatTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function formatPercent(value) {
  if (value == null) return "-";
  return `${(Number(value) * 100).toFixed(0)}%`;
}

function getRelativeCutoff(hours) {
  if (!hours || hours === "all") return null;
  const now = Date.now();
  return now - Number(hours) * 60 * 60 * 1000;
}

export default function AdminLiveMapPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const infoWindowRef = useRef(null);

  const unitMarkersRef = useRef([]);
  const incidentMarkersRef = useRef([]);
  const circlesRef = useRef([]);
  const incidentMarkerMapRef = useRef(new Map());

  const hasAutoFittedRef = useRef(false);
  const intervalRef = useRef(null);

  const [units, setUnits] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [showUnits, setShowUnits] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showCoverage, setShowCoverage] = useState(false);
  const [timeRangeHours, setTimeRangeHours] = useState("24");

  const [imageModal, setImageModal] = useState({
    open: false,
    url: "",
    time: "",
    unitName: "",
  });

  const clearUnitOverlays = useCallback(() => {
    unitMarkersRef.current.forEach((marker) => marker.setMap(null));
    circlesRef.current.forEach((circle) => circle.setMap(null));
    unitMarkersRef.current = [];
    circlesRef.current = [];
  }, []);

  const clearIncidentOverlays = useCallback(() => {
    incidentMarkersRef.current.forEach((marker) => marker.setMap(null));
    incidentMarkersRef.current = [];
    incidentMarkerMapRef.current = new Map();
  }, []);

  const openImageModal = useCallback((incident) => {
    if (!incident?.image_url) return;
    setImageModal({
      open: true,
      url: incident.image_url,
      time: formatTime(incident.created_at),
      unitName: incident.rescue_units?.name || incident.rescue_unit_name || "-",
    });
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModal({
      open: false,
      url: "",
      time: "",
      unitName: "",
    });
  }, []);

  const loadData = useCallback(async (isBackground = false) => {
    try {
      setError("");

      if (isBackground) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }

      const [unitsData, incidentsData] = await Promise.all([
        getApprovedRescueUnits(),
        getRecentIncidents(50),
      ]);

      setUnits(unitsData || []);
      setIncidents(
        (incidentsData || []).filter(
          (incident) => (incident.disaster_type || "").toLowerCase() !== "normal"
        )
      );
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError(err.message || "โหลดข้อมูล live map ไม่สำเร็จ");
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  const filteredIncidents = useMemo(() => {
    const cutoff = getRelativeCutoff(timeRangeHours);

    return incidents.filter((incident) => {
      if (cutoff) {
        const createdAt = new Date(incident.created_at).getTime();
        if (!Number.isNaN(createdAt) && createdAt < cutoff) return false;
      }
      return true;
    });
  }, [incidents, timeRangeHours]);

  const latestIncidents = useMemo(() => {
    return [...filteredIncidents]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 12);
  }, [filteredIncidents]);

  const createUnitInfoHtml = (unit) => `
    <div style="min-width:240px;font-size:13px;line-height:1.5;">
      <div style="font-weight:700;font-size:14px;color:#0f172a;">
        ${unit.name || "-"}
      </div>
      <div style="margin-top:6px;color:#334155;">
        <div><strong>ประเภท:</strong> หน่วยกู้ภัย</div>
        <div><strong>ผู้ประสานงาน:</strong> ${unit.coordinator_name || "-"}</div>
        <div><strong>เบอร์โทร:</strong> ${unit.phone || "-"}</div>
        <div><strong>จังหวัด:</strong> ${unit.province || "-"}</div>
        <div><strong>อำเภอ:</strong> ${unit.district || "-"}</div>
        <div><strong>รัศมี:</strong> ${unit.coverage_km || "-"} กม.</div>
        <div><strong>LINE:</strong> ${unit.line_user_id ? "เชื่อมแล้ว" : "ยังไม่ผูก"}</div>
      </div>
    </div>
  `;

  const renderUnits = useCallback(() => {
    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !window.google) return;

    clearUnitOverlays();

    if (!showUnits) return;

    units.forEach((unit) => {
      const lat = Number(unit.base_lat ?? unit.lat);
      const lng = Number(unit.base_lng ?? unit.lng);

      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title: unit.name || "Rescue Unit",
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        },
      });

      marker.addListener("click", () => {
        infoWindow.setContent(createUnitInfoHtml(unit));
        infoWindow.open(map, marker);
      });

      unitMarkersRef.current.push(marker);

      if (showCoverage && Number(unit.coverage_km) > 0) {
        const circle = new window.google.maps.Circle({
          strokeColor: "#2563eb",
          strokeOpacity: 0.45,
          strokeWeight: 1,
          fillColor: "#2563eb",
          fillOpacity: 0.08,
          map,
          center: { lat, lng },
          radius: Number(unit.coverage_km) * 1000,
        });

        circlesRef.current.push(circle);
      }
    });
  }, [clearUnitOverlays, showUnits, showCoverage, units]);

  const renderIncidents = useCallback(() => {
    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !window.google) return;

    clearIncidentOverlays();

    if (!showIncidents) return;

    filteredIncidents.forEach((incident, index) => {
      const lat = Number(incident.event_lat ?? incident.photo_lat);
      const lng = Number(incident.event_lng ?? incident.photo_lng);

      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const markerKey =
        incident.id ||
        incident.incident_id ||
        `${incident.created_at || "incident"}-${lat}-${lng}-${index}`;

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title: "Detected Incident",
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        },
      });

      marker.addListener("click", () => {
        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        infoWindow.setContent(`
          <div style="min-width:240px;font-size:13px;line-height:1.5;">
            <div style="font-weight:700;font-size:14px;color:#0f172a;">
              เหตุที่ตรวจพบ
            </div>
            <div style="margin-top:6px;color:#334155;">
              <div><strong>ความมั่นใจ:</strong> ${formatPercent(incident.confidence)}</div>
              <div><strong>หน่วยที่แจ้ง:</strong> ${
                incident.rescue_units?.name || incident.rescue_unit_name || "-"
              }</div>
              <div><strong>เวลา:</strong> ${formatTime(incident.created_at)}</div>
              <div><strong>Source:</strong> ${incident.source_type || "-"}</div>
              <div><strong>พิกัด:</strong> ${lat}, ${lng}</div>
              ${
                incident.image_url
                  ? `<div style="margin-top:8px;"><a href="#" id="incident-image-link-${index}">View image</a></div>`
                  : ""
              }
              <div style="margin-top:6px;">
                <a href="${googleMapsUrl}" target="_blank" rel="noreferrer">Open in Google Maps</a>
              </div>
            </div>
          </div>
        `);

        infoWindow.open(map, marker);

        if (incident.image_url) {
          window.google.maps.event.addListenerOnce(infoWindow, "domready", () => {
            const el = document.getElementById(`incident-image-link-${index}`);
            if (el) {
              el.addEventListener("click", (e) => {
                e.preventDefault();
                openImageModal(incident);
              });
            }
          });
        }
      });

      incidentMarkersRef.current.push(marker);
      incidentMarkerMapRef.current.set(markerKey, marker);
    });
  }, [clearIncidentOverlays, filteredIncidents, openImageModal, showIncidents]);

  const fitInitialBounds = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google || hasAutoFittedRef.current) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoint = false;

    if (showUnits) {
      units.forEach((unit) => {
        const lat = Number(unit.base_lat ?? unit.lat);
        const lng = Number(unit.base_lng ?? unit.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return;
        bounds.extend({ lat, lng });
        hasPoint = true;
      });
    }

    if (showIncidents) {
      filteredIncidents.forEach((incident) => {
        const lat = Number(incident.event_lat ?? incident.photo_lat);
        const lng = Number(incident.event_lng ?? incident.photo_lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return;
        bounds.extend({ lat, lng });
        hasPoint = true;
      });
    }

    if (!hasPoint) {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
      hasAutoFittedRef.current = true;
      return;
    }

    map.fitBounds(bounds);

    window.google.maps.event.addListenerOnce(map, "bounds_changed", () => {
      if (map.getZoom() > 11) {
        map.setZoom(11);
      }
      hasAutoFittedRef.current = true;
    });
  }, [filteredIncidents, showIncidents, showUnits, units]);

  const focusIncident = useCallback((incident, index = 0) => {
    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !window.google) return;

    const lat = Number(incident.event_lat ?? incident.photo_lat);
    const lng = Number(incident.event_lng ?? incident.photo_lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const markerKey =
      incident.id ||
      incident.incident_id ||
      `${incident.created_at || "incident"}-${lat}-${lng}-${index}`;

    const marker = incidentMarkerMapRef.current.get(markerKey);

    map.panTo({ lat, lng });
    map.setZoom(Math.max(map.getZoom() || 0, 12));

    if (marker && infoWindow) {
      const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      infoWindow.setContent(`
        <div style="min-width:240px;font-size:13px;line-height:1.5;">
          <div style="font-weight:700;font-size:14px;color:#0f172a;">
            เหตุที่ตรวจพบ
          </div>
          <div style="margin-top:6px;color:#334155;">
            <div><strong>ความมั่นใจ:</strong> ${formatPercent(incident.confidence)}</div>
            <div><strong>หน่วยที่แจ้ง:</strong> ${
              incident.rescue_units?.name || incident.rescue_unit_name || "-"
            }</div>
            <div><strong>เวลา:</strong> ${formatTime(incident.created_at)}</div>
            <div><strong>Source:</strong> ${incident.source_type || "-"}</div>
            <div><strong>พิกัด:</strong> ${lat}, ${lng}</div>
            ${
              incident.image_url
                ? `<div style="margin-top:8px;"><a href="#" id="focus-incident-image-link-${index}">View image</a></div>`
                : ""
            }
            <div style="margin-top:6px;">
              <a href="${googleMapsUrl}" target="_blank" rel="noreferrer">Open in Google Maps</a>
            </div>
          </div>
        </div>
      `);

      infoWindow.open(map, marker);

      if (incident.image_url) {
        window.google.maps.event.addListenerOnce(infoWindow, "domready", () => {
          const el = document.getElementById(`focus-incident-image-link-${index}`);
          if (el) {
            el.addEventListener("click", (e) => {
              e.preventDefault();
              openImageModal(incident);
            });
          }
        });
      }
    }
  }, [openImageModal]);

  const resetView = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoint = false;

    if (showUnits) {
      units.forEach((unit) => {
        const lat = Number(unit.base_lat ?? unit.lat);
        const lng = Number(unit.base_lng ?? unit.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return;
        bounds.extend({ lat, lng });
        hasPoint = true;
      });
    }

    if (showIncidents) {
      filteredIncidents.forEach((incident) => {
        const lat = Number(incident.event_lat ?? incident.photo_lat);
        const lng = Number(incident.event_lng ?? incident.photo_lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return;
        bounds.extend({ lat, lng });
        hasPoint = true;
      });
    }

    if (hasPoint) {
      map.fitBounds(bounds);
      window.google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        if (map.getZoom() > 11) {
          map.setZoom(11);
        }
      });
    } else {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
    }
  }, [filteredIncidents, showIncidents, showUnits, units]);

  useEffect(() => {
    let mounted = true;

    loadGoogleMaps()
      .then(() => {
        if (!mounted || !mapRef.current) return;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            gestureHandling: "greedy",
          });

          infoWindowRef.current = new window.google.maps.InfoWindow();
        }

        loadData(false);
      })
      .catch((err) => {
        console.error(err);
        setError("โหลด Google Maps ไม่สำเร็จ");
        setInitialLoading(false);
      });

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    renderUnits();
  }, [renderUnits]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    renderIncidents();
  }, [renderIncidents]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    fitInitialBounds();
  }, [fitInitialBounds]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadData(true);
    }, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeImageModal();
    };

    if (imageModal.open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imageModal.open, closeImageModal]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-100">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-4 overflow-hidden border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Live Map</h1>
                <p className="mt-1 text-sm text-slate-500">
                  ดูจุดเหตุล่าสุดและตำแหน่งหน่วยกู้ภัยแบบเรียลไทม์
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-2 text-xs text-slate-500">
                  {lastUpdated ? `อัปเดตล่าสุด ${formatTime(lastUpdated)}` : "ยังไม่มีข้อมูล"}
                </div>

                <button
                  type="button"
                  onClick={() => loadData(true)}
                  className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  รีเฟรช
                </button>

                <button
                  type="button"
                  onClick={resetView}
                  className="border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  รีเซ็ตมุมมอง
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showUnits}
                    onChange={(e) => setShowUnits(e.target.checked)}
                    className="h-4 w-4"
                  />
                  แสดงหน่วยกู้ภัย
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showIncidents}
                    onChange={(e) => setShowIncidents(e.target.checked)}
                    className="h-4 w-4"
                  />
                  แสดงจุดเหตุ
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showCoverage}
                    onChange={(e) => setShowCoverage(e.target.checked)}
                    className="h-4 w-4"
                    disabled={!showUnits}
                  />
                  แสดงรัศมีครอบคลุม
                </label>

                <select
                  value={timeRangeHours}
                  onChange={(e) => setTimeRangeHours(e.target.value)}
                  className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                >
                  <option value="1">1 ชั่วโมงล่าสุด</option>
                  <option value="6">6 ชั่วโมงล่าสุด</option>
                  <option value="24">24 ชั่วโมงล่าสุด</option>
                  <option value="all">ทั้งหมด</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  หน่วยกู้ภัย
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                  จุดเหตุ
                </span>
                {refreshing ? <span>กำลังอัปเดตข้อมูล...</span> : null}
              </div>
            </div>
          </div>

          {error ? (
            <div className="mb-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Rescue Units
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{units.length}</p>
            </div>

            <div className="border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Recent Incidents
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {filteredIncidents.length}
              </p>
            </div>

            <div className="border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Coverage Display
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {showCoverage ? "ON" : "OFF"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div className="overflow-hidden border border-slate-200 bg-white">
                <div className="relative">
                  <div ref={mapRef} className="h-[680px] w-full" />
                  {initialLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/85 text-sm text-slate-500">
                      กำลังโหลดข้อมูลแผนที่...
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="xl:col-span-4">
              <div className="overflow-hidden border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-4">
                  <h2 className="text-base font-semibold text-slate-900">เหตุล่าสุด</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    กดที่รายการเพื่อโฟกัสบนแผนที่
                  </p>
                </div>

                <div className="max-h-[680px] overflow-y-auto">
                  {!showIncidents ? (
                    <div className="px-4 py-8 text-sm text-slate-500">
                      ปิดการแสดงจุดเหตุอยู่
                    </div>
                  ) : latestIncidents.length === 0 ? (
                    <div className="px-4 py-8 text-sm text-slate-500">
                      ยังไม่พบเหตุในช่วงเวลาที่เลือก
                    </div>
                  ) : (
                    latestIncidents.map((incident, index) => {
                      const lat = Number(incident.event_lat ?? incident.photo_lat);
                      const lng = Number(incident.event_lng ?? incident.photo_lng);

                      return (
                        <div
                          key={
                            incident.id ||
                            incident.incident_id ||
                            `${incident.created_at}-${lat}-${lng}-${index}`
                          }
                          className="border-b border-slate-200 px-4 py-4"
                        >
                          <button
                            type="button"
                            onClick={() => focusIncident(incident, index)}
                            className="block w-full text-left transition hover:bg-slate-50"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  เหตุล่าสุด
                                </p>

                                <p className="mt-1 text-sm text-slate-600">
                                  เวลา {formatTime(incident.created_at)}
                                </p>

                                <p className="mt-1 text-sm text-slate-600">
                                  ความมั่นใจ {formatPercent(incident.confidence)}
                                </p>

                                <p className="mt-1 text-sm text-slate-600">
                                  หน่วยที่แจ้ง{" "}
                                  {incident.rescue_units?.name ||
                                    incident.rescue_unit_name ||
                                    "-"}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  {Number.isNaN(lat) || Number.isNaN(lng)
                                    ? "ไม่พบพิกัด"
                                    : `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
                                </p>
                              </div>

                              <div className="shrink-0 text-xs font-medium text-blue-600">
                                ดูบนแผนที่
                              </div>
                            </div>
                          </button>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {incident.image_url ? (
                              <button
                                type="button"
                                onClick={() => openImageModal(incident)}
                                className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                ดูรูป
                              </button>
                            ) : null}

                            {!Number.isNaN(lat) && !Number.isNaN(lng) ? (
                              <a
                                href={`https://www.google.com/maps?q=${lat},${lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                เปิด Google Maps
                              </a>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {imageModal.open ? (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4"
            onClick={closeImageModal}
          >
            <div
              className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">ภาพเหตุล่าสุด</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    เวลา {imageModal.time} • หน่วยที่แจ้ง {imageModal.unitName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeImageModal}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ปิด
                </button>
              </div>

              <div className="flex max-h-[80vh] items-center justify-center bg-slate-100 p-4">
                <img
                  src={imageModal.url}
                  alt="Incident"
                  className="max-h-[72vh] w-auto max-w-full rounded-lg object-contain"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}