import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../utils/loadGoogleMaps";

const DEFAULT_CENTER = { lat: 19.9105, lng: 99.8406 };
const DEFAULT_ZOOM = 13;
const SELECTED_ZOOM = 15;

function extractProvinceAndDistrict(addressComponents = []) {
  let province = "";
  let district = "";

  for (const component of addressComponents) {
    const types = component.types || [];
    const name = component.long_name || "";

    if (!province && types.includes("administrative_area_level_1")) {
      province = name;
    }

    if (
      !district &&
      (types.includes("administrative_area_level_2") ||
        types.includes("administrative_area_level_3") ||
        types.includes("locality") ||
        types.includes("sublocality_level_1"))
    ) {
      district = name;
    }
  }

  return { province, district };
}

function isValidNumber(value) {
  return typeof value === "number" && !Number.isNaN(value);
}

function normalizeLatLng(latOrObject, lngMaybe) {
  if (isValidNumber(latOrObject) && isValidNumber(lngMaybe)) {
    return { lat: latOrObject, lng: lngMaybe };
  }

  if (!latOrObject) return null;

  if (
    typeof latOrObject.lat === "function" &&
    typeof latOrObject.lng === "function"
  ) {
    return {
      lat: latOrObject.lat(),
      lng: latOrObject.lng(),
    };
  }

  if (isValidNumber(latOrObject.lat) && isValidNumber(latOrObject.lng)) {
    return {
      lat: latOrObject.lat,
      lng: latOrObject.lng,
    };
  }

  return null;
}

export default function MapPicker({ value, onChange, radiusKm = 10 }) {
  const googleRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const geocoderRef = useRef(null);

  const mapContainerRef = useRef(null);
  const listenersRef = useRef([]);
  const latestGeocodeRequestRef = useRef(0);
  const searchDebounceRef = useRef(null);
  const sessionTokenRef = useRef(null);

  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const hasSelectedLocation =
    isValidNumber(value?.lat) && isValidNumber(value?.lng);

  const getRadiusMeters = () => Math.max(0, Number(radiusKm || 0)) * 1000;

  const clearAllListeners = () => {
    const google = googleRef.current;
    if (google?.maps?.event) {
      listenersRef.current.forEach((listener) => {
        google.maps.event.removeListener(listener);
      });
    }
    listenersRef.current = [];
  };

  const showMarkerAndCircle = () => {
    if (!mapRef.current || !markerRef.current || !circleRef.current) return;

    if (!markerRef.current.map) {
      markerRef.current.map = mapRef.current;
    }

    if (!circleRef.current.getMap()) {
      circleRef.current.setMap(mapRef.current);
    }
  };

  const hideMarkerAndCircle = () => {
    if (markerRef.current) markerRef.current.map = null;
    if (circleRef.current) circleRef.current.setMap(null);
  };

  const syncVisualPosition = (latLng) => {
    if (!latLng || !markerRef.current || !circleRef.current) return;

    showMarkerAndCircle();
    markerRef.current.position = latLng;
    circleRef.current.setCenter(latLng);
  };

  const reverseGeocodeAndEmit = async (lat, lng) => {
    if (!geocoderRef.current) return;

    const requestId = ++latestGeocodeRequestRef.current;

    try {
      setLoadingAddress(true);
      setError("");

      const response = await geocoderRef.current.geocode({
        location: { lat, lng },
      });

      if (requestId !== latestGeocodeRequestRef.current) return;

      const result = response.results?.[0];

      if (!result) {
        onChange?.({
          lat,
          lng,
          province: "",
          district: "",
          address: "",
        });
        return;
      }

      const { province, district } = extractProvinceAndDistrict(
        result.address_components || []
      );

      setSearchText(result.formatted_address || "");

      onChange?.({
        lat,
        lng,
        province,
        district,
        address: result.formatted_address || "",
      });
    } catch (err) {
      console.error(err);
      if (requestId === latestGeocodeRequestRef.current) {
        setError("ดึงข้อมูลตำแหน่งไม่สำเร็จ");
      }
    } finally {
      if (requestId === latestGeocodeRequestRef.current) {
        setLoadingAddress(false);
      }
    }
  };

  const updateLocation = async (lat, lng, options = {}) => {
    const { pan = false, zoom = true, reverseGeocode = true } = options;

    if (!mapRef.current || !markerRef.current || !circleRef.current) return;

    const latLng = normalizeLatLng(lat, lng);
    if (!latLng) return;

    syncVisualPosition(latLng);

    if (pan) {
      mapRef.current.panTo(latLng);
      if (zoom) mapRef.current.setZoom(SELECTED_ZOOM);
    }

    if (reverseGeocode) {
      await reverseGeocodeAndEmit(latLng.lat, latLng.lng);
    } else {
      onChange?.({
        lat: latLng.lat,
        lng: latLng.lng,
        province: value?.province || "",
        district: value?.district || "",
        address: value?.address || "",
      });
    }
  };

  const fetchSuggestions = async (input) => {
    const google = googleRef.current;
    if (!google || !input.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setLoadingSuggestions(true);
      setError("");

      const { AutocompleteSuggestion, AutocompleteSessionToken } =
        await google.maps.importLibrary("places");

      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new AutocompleteSessionToken();
      }

      const request = {
        input,
        sessionToken: sessionTokenRef.current,
        includedRegionCodes: ["th"],
        language: "th",
      };

      const bounds = mapRef.current?.getBounds?.();
      if (bounds) {
        request.locationBias = bounds;
      }

      const { suggestions: result = [] } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      setSuggestions(result);
      setShowSuggestions(true);
      setActiveIndex(-1);
    } catch (err) {
      console.error(err);
      setError("ค้นหาสถานที่ไม่สำเร็จ");
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    try {
      setError("");
      setLoadingAddress(true);

      const prediction = suggestion?.placePrediction;
      if (!prediction) {
        setError("ไม่พบสถานที่ที่ค้นหา");
        return;
      }

      const place = prediction.toPlace();

      await place.fetchFields({
        fields: [
          "displayName",
          "formattedAddress",
          "location",
          "addressComponents",
        ],
      });

      const location = normalizeLatLng(place.location);
      if (!location) {
        setError("ไม่พบพิกัดของสถานที่นี้");
        return;
      }

      syncVisualPosition(location);
      mapRef.current?.panTo(location);
      mapRef.current?.setZoom(SELECTED_ZOOM);

      const { province, district } = extractProvinceAndDistrict(
        place.addressComponents || []
      );

      const address =
        place.formattedAddress ||
        place.displayName ||
        `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;

      setSearchText(address);
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveIndex(-1);

      onChange?.({
        lat: location.lat,
        lng: location.lng,
        province,
        district,
        address,
      });

      sessionTokenRef.current = null;
    } catch (err) {
      console.error(err);
      setError("เลือกสถานที่ไม่สำเร็จ");
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const google = await loadGoogleMaps();
        if (!isMounted) return;

        googleRef.current = google;

        const { Map, Circle } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary(
          "marker"
        );
        await google.maps.importLibrary("places");

        geocoderRef.current = new google.maps.Geocoder();

        const initialCenter = hasSelectedLocation
          ? { lat: value.lat, lng: value.lng }
          : DEFAULT_CENTER;

        mapRef.current = new Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: hasSelectedLocation ? SELECTED_ZOOM : DEFAULT_ZOOM,
          mapId: "DEMO_MAP_ID",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        });

        markerRef.current = new AdvancedMarkerElement({
          map: hasSelectedLocation ? mapRef.current : null,
          position: initialCenter,
          gmpDraggable: true,
          title: "ตำแหน่งหน่วยกู้ภัย",
        });

        circleRef.current = new Circle({
          map: hasSelectedLocation ? mapRef.current : null,
          center: initialCenter,
          radius: getRadiusMeters(),
          strokeColor: "#2563eb",
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: "#60a5fa",
          fillOpacity: 0.12,
          clickable: false,
        });

        const dragListener = markerRef.current.addListener("drag", () => {
          const pos = normalizeLatLng(markerRef.current.position);
          if (!pos) return;
          circleRef.current?.setCenter(pos);
        });

        const dragEndListener = markerRef.current.addListener("dragend", async () => {
          const pos = normalizeLatLng(markerRef.current.position);
          if (!pos) return;
          await updateLocation(pos.lat, pos.lng, {
            pan: false,
            zoom: false,
            reverseGeocode: true,
          });
        });

        const mapClickListener = mapRef.current.addListener("click", async (e) => {
          const pos = normalizeLatLng(e.latLng);
          if (!pos) return;
          await updateLocation(pos.lat, pos.lng, {
            pan: false,
            zoom: false,
            reverseGeocode: true,
          });
        });

        const idleListener = mapRef.current.addListener("idle", () => {
          if (searchText.trim()) {
            if (searchDebounceRef.current) {
              clearTimeout(searchDebounceRef.current);
            }
            searchDebounceRef.current = setTimeout(() => {
              fetchSuggestions(searchText);
            }, 250);
          }
        });

        listenersRef.current.push(
          dragListener,
          dragEndListener,
          mapClickListener,
          idleListener
        );
      } catch (err) {
        console.error(err);
        setError("โหลดแผนที่ไม่สำเร็จ");
      }
    }

    init();

    return () => {
      isMounted = false;
      clearAllListeners();
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(getRadiusMeters());
  }, [radiusKm]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !circleRef.current) return;

    if (!hasSelectedLocation) {
      hideMarkerAndCircle();
      return;
    }

    const latLng = { lat: value.lat, lng: value.lng };
    syncVisualPosition(latLng);
  }, [hasSelectedLocation, value?.lat, value?.lng]);

  useEffect(() => {
    if (!searchText.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      fetchSuggestions(searchText);
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchText]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("อุปกรณ์นี้ไม่รองรับการดึงตำแหน่ง");
      return;
    }

    setLoadingLocation(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await updateLocation(pos.coords.latitude, pos.coords.longitude, {
            pan: true,
            zoom: true,
            reverseGeocode: true,
          });
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        setError("ไม่สามารถดึงตำแหน่งได้");
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleClear = () => {
    setError("");
    latestGeocodeRequestRef.current += 1;
    setLoadingAddress(false);
    setSearchText("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    sessionTokenRef.current = null;

    hideMarkerAndCircle();

    if (mapRef.current) {
      mapRef.current.panTo(DEFAULT_CENTER);
      mapRef.current.setZoom(DEFAULT_ZOOM);
    }

    onChange?.({
      lat: null,
      lng: null,
      province: "",
      district: "",
      address: "",
    });
  };

  const handleKeyDown = async (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const picked =
        activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0];
      if (picked) {
        await handleSelectSuggestion(picked);
      }
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative h-[520px] w-full overflow-hidden border border-slate-200 bg-slate-100">
        <div ref={mapContainerRef} className="h-full w-full" />

        <div className="absolute inset-x-0 top-0 z-[1000] p-3">
          <div className="mx-auto max-w-xl">
            <div className="border border-slate-200 bg-white">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                onKeyDown={handleKeyDown}
                placeholder="ค้นหาสถานที่ ถนน อำเภอ หรือจังหวัด"
                className="w-full border-0 bg-transparent px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="max-h-72 overflow-auto border-t border-slate-200 py-1">
                  {suggestions.map((item, index) => {
                    const prediction = item.placePrediction;
                    const main =
                      prediction?.mainText?.text ||
                      prediction?.text?.text ||
                      "ไม่ทราบชื่อสถานที่";
                    const secondary =
                      prediction?.secondaryText?.text || "";

                    return (
                      <button
                        key={prediction?.placeId || `${main}-${index}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectSuggestion(item)}
                        className={`block w-full px-4 py-3 text-left transition ${
                          index === activeIndex
                            ? "bg-slate-100"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-sm font-medium text-slate-800">
                          {main}
                        </div>
                        {secondary ? (
                          <div className="mt-1 text-xs text-slate-500">
                            {secondary}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {showSuggestions &&
                !loadingSuggestions &&
                searchText.trim() &&
                suggestions.length === 0 ? (
                  <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
                    ไม่พบสถานที่ที่ใกล้เคียง
                  </div>
                ) : null}
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-[1000] flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            {loadingLocation ? "กำลังหา..." : "ใช้ตำแหน่งปัจจุบัน"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            ล้างหมุด
          </button>
        </div>

        {hasSelectedLocation ? (
          <div className="absolute bottom-4 right-4 z-[1000] border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </div>
        ) : null}

        {loadingAddress || loadingSuggestions ? (
          <div className="absolute left-1/2 top-24 z-[1000] -translate-x-1/2 border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
            กำลังค้นหา...
          </div>
        ) : null}

        {error ? (
          <div className="absolute left-1/2 top-24 z-[1000] -translate-x-1/2 border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}