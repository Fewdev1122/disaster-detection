import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../utils/loadGoogleMaps";

const DEFAULT_CENTER = { lat: 19.9105, lng: 99.8406 };

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

export default function MapPicker({ value, onChange, radiusKm = 10 }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const geocoderRef = useRef(null);
  const googleRef = useRef(null);

  const mapContainerRef = useRef(null);
  const autocompleteHostRef = useRef(null);

  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [error, setError] = useState("");

  const hasSelectedLocation =
    typeof value?.lat === "number" && typeof value?.lng === "number";

  async function updateLocation(lat, lng, shouldPan = false) {
    try {
      setLoadingAddress(true);
      setError("");

      if (
        !mapRef.current ||
        !markerRef.current ||
        !circleRef.current ||
        !geocoderRef.current
      ) {
        return;
      }

      const latLng = { lat, lng };

      if (!markerRef.current.map) {
        markerRef.current.map = mapRef.current;
      }

      if (!circleRef.current.getMap()) {
        circleRef.current.setMap(mapRef.current);
      }

      markerRef.current.position = latLng;
      circleRef.current.setCenter(latLng);

      if (shouldPan) {
        mapRef.current.panTo(latLng);
        mapRef.current.setZoom(15);
      }

      const res = await geocoderRef.current.geocode({ location: latLng });
      const result = res.results?.[0];

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
        result.address_components
      );

      onChange?.({
        lat,
        lng,
        province,
        district,
        address: result.formatted_address || "",
      });
    } catch (err) {
      console.error(err);
      setError("ดึงข้อมูลตำแหน่งไม่สำเร็จ");
    } finally {
      setLoadingAddress(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    let mapClickListener = null;
    let markerDragListener = null;
    let autocompleteElement = null;
    let handlePlaceSelect = null;

    async function init() {
      try {
        const google = await loadGoogleMaps();
        if (!isMounted) return;

        googleRef.current = google;

        const { Map } = await google.maps.importLibrary("maps");
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
          zoom: hasSelectedLocation ? 15 : 13,
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
        });

        circleRef.current = new google.maps.Circle({
          map: hasSelectedLocation ? mapRef.current : null,
          center: initialCenter,
          radius: Number(radiusKm || 0) * 1000,
          strokeColor: "#ef4444",
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: "#fca5a5",
          fillOpacity: 0.15,
          clickable: false,
        });

        markerDragListener = markerRef.current.addListener("dragend", async () => {
          const pos = markerRef.current.position;
          if (!pos) return;
          await updateLocation(pos.lat(), pos.lng(), false);
        });

        mapClickListener = mapRef.current.addListener("click", async (e) => {
          if (!e.latLng) return;
          await updateLocation(e.latLng.lat(), e.latLng.lng(), false);
        });

        autocompleteElement = new google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: ["th"] },
        });

        autocompleteElement.setAttribute(
          "placeholder",
          "ค้นหาสถานที่, ถนน, อำเภอ, จังหวัด"
        );

        autocompleteElement.className = "block w-full";

        if (autocompleteHostRef.current) {
          autocompleteHostRef.current.innerHTML = "";
          autocompleteHostRef.current.appendChild(autocompleteElement);
        }

        handlePlaceSelect = async (event) => {
          try {
            setError("");

            const prediction = event.placePrediction;
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

            const location = place.location;
            if (!location) {
              setError("ไม่พบพิกัดของสถานที่นี้");
              return;
            }

            const lat = location.lat();
            const lng = location.lng();

            if (!markerRef.current.map) {
              markerRef.current.map = mapRef.current;
            }

            if (!circleRef.current.getMap()) {
              circleRef.current.setMap(mapRef.current);
            }

            markerRef.current.position = { lat, lng };
            circleRef.current.setCenter({ lat, lng });

            mapRef.current.panTo({ lat, lng });
            mapRef.current.setZoom(15);

            const { province, district } = extractProvinceAndDistrict(
              place.addressComponents || []
            );

            onChange?.({
              lat,
              lng,
              province,
              district,
              address:
                place.formattedAddress ||
                place.displayName ||
                `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            });
          } catch (err) {
            console.error(err);
            setError("ค้นหาสถานที่ไม่สำเร็จ");
          }
        };

        autocompleteElement.addEventListener("gmp-select", handlePlaceSelect);
      } catch (err) {
        console.error(err);
        setError("โหลดแผนที่ไม่สำเร็จ");
      }
    }

    init();

    return () => {
      isMounted = false;

      if (mapClickListener && googleRef.current?.maps?.event) {
        googleRef.current.maps.event.removeListener(mapClickListener);
      }

      if (markerDragListener && googleRef.current?.maps?.event) {
        googleRef.current.maps.event.removeListener(markerDragListener);
      }

      if (autocompleteElement && handlePlaceSelect) {
        autocompleteElement.removeEventListener("gmp-select", handlePlaceSelect);
      }

      if (autocompleteHostRef.current) {
        autocompleteHostRef.current.innerHTML = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(Number(radiusKm || 0) * 1000);
  }, [radiusKm]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !circleRef.current) return;

    const hasValue =
      typeof value?.lat === "number" && typeof value?.lng === "number";

    if (!hasValue) {
      if (markerRef.current.map) {
        markerRef.current.map = null;
      }

      if (circleRef.current.getMap()) {
        circleRef.current.setMap(null);
      }
      return;
    }

    const latLng = { lat: value.lat, lng: value.lng };

    if (!markerRef.current.map) {
      markerRef.current.map = mapRef.current;
    }

    if (!circleRef.current.getMap()) {
      circleRef.current.setMap(mapRef.current);
    }

    markerRef.current.position = latLng;
    circleRef.current.setCenter(latLng);
  }, [value?.lat, value?.lng]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("อุปกรณ์นี้ไม่รองรับการดึงตำแหน่ง");
      return;
    }

    setLoadingLocation(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await updateLocation(pos.coords.latitude, pos.coords.longitude, true);
        setLoadingLocation(false);
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

    if (markerRef.current) {
      markerRef.current.map = null;
    }

    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    onChange?.({
      lat: null,
      lng: null,
      province: "",
      district: "",
      address: "",
    });
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative h-[520px] w-full overflow-hidden rounded-[22px] border border-gray-200 bg-gray-100">
        <div ref={mapContainerRef} className="h-full w-full" />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] p-4">
          <div className="pointer-events-auto mx-auto max-w-xl rounded-xl bg-white p-2 shadow-lg">
            <div ref={autocompleteHostRef} />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] flex gap-2">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="pointer-events-auto rounded-lg bg-white px-3 py-2 text-sm shadow"
          >
            {loadingLocation ? "กำลังหา..." : "ใช้ตำแหน่งปัจจุบัน"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="pointer-events-auto rounded-lg bg-white px-3 py-2 text-sm shadow"
          >
            ล้างหมุด
          </button>
        </div>

        {hasSelectedLocation && (
          <div className="pointer-events-none absolute bottom-4 right-4 z-[1000] rounded-lg bg-white px-3 py-2 text-xs shadow">
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </div>
        )}

        {loadingAddress && (
          <div className="absolute left-1/2 top-24 z-[1000] -translate-x-1/2 rounded-lg bg-white px-4 py-2 text-sm shadow">
            กำลังดึงข้อมูลพื้นที่...
          </div>
        )}

        {error && (
          <div className="absolute left-1/2 top-24 z-[1000] -translate-x-1/2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 shadow">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}