import React, { useRef, useState } from "react";
import exifr from "exifr";
import UploadArea from "../components/UploadArea";
import CameraView from "../components/CameraView";
import CameraButton from "../components/CameraButton";
import { sendReport } from "../services/api";

export default function UploadPage() {
  const [preview, setPreview] = useState(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [photoLocation, setPhotoLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const fileRef = useRef(null);

  const resetUploadState = () => {
    setPreview(null);
    setPhotoLocation(null);
    setCurrentLocation(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => reject(err),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });

  const readImageGPS = async (file) => {
    try {
      const gps = await exifr.gps(file);

      if (!gps || gps.latitude == null || gps.longitude == null) {
        return null;
      }

      return {
        lat: gps.latitude,
        lng: gps.longitude,
      };
    } catch (error) {
      console.error("EXIF READ ERROR:", error);
      return null;
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const gpsFromImage = await readImageGPS(file);
    setPhotoLocation(gpsFromImage);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    try {
      const liveLocation = await getLocation();
      setCurrentLocation(liveLocation);
    } catch (err) {
      console.warn("CURRENT LOCATION ERROR:", err.message);
      setCurrentLocation(null);
    }
  };

  const handleSubmit = async () => {
    if (!preview) return;

    try {
      setLoading(true);

      let finalLocation = photoLocation;

      if (!finalLocation) {
        finalLocation = currentLocation || (await getLocation());
      }

      if (!finalLocation) {
        throw new Error("ไม่พบพิกัดจากรูปและไม่สามารถดึงพิกัดปัจจุบันได้");
      }

      await sendReport(preview, {
        lat: finalLocation.lat,
        lng: finalLocation.lng,
        photo_lat: photoLocation?.lat ?? null,
        photo_lng: photoLocation?.lng ?? null,
        current_lat: currentLocation?.lat ?? null,
        current_lng: currentLocation?.lng ?? null,
        location_source: photoLocation ? "image_exif" : "device_gps",
      });

      alert("Incident reported successfully");

      resetUploadState();
    } catch (err) {
      console.error("FULL ERROR:", err);

      if (err.code === 1) {
        alert("คุณปฏิเสธการอนุญาตตำแหน่ง");
      } else if (err.code === 2) {
        alert("ไม่สามารถระบุตำแหน่งได้");
      } else if (err.code === 3) {
        alert("หมดเวลาค้นหาตำแหน่ง");
      } else {
        alert("ERROR: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-5 relative">
      {loading && (
        <div className="absolute inset-0 bg-black/40 z-50 flex flex-col items-center justify-center">
          <div className="bg-white rounded-2xl px-6 py-5 shadow-lg text-center">
            <div className="w-10 h-10 mx-auto border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>

            <p className="mt-4 text-gray-800 font-semibold">
              Processing image...
            </p>

            <p className="text-sm text-gray-500 mt-1">
              "Please wait..."
            </p>
          </div>
        </div>
      )}

      {!cameraMode ? (
        <>
          <UploadArea
            preview={preview}
            onClick={() => !loading && fileRef.current.click()}
          />

          {preview && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={resetUploadState}
                disabled={loading}
                className="w-1/3 py-4 bg-gray-200 text-gray-800 rounded-xl font-semibold disabled:opacity-50"
              >
                Cencel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-2/3 py-4 bg-red-600 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {loading ? "Sending..." : "Report Incident"}
              </button>
            </div>
          )}

          {!preview && (
            <CameraButton
              onClick={() => setCameraMode(true)}
            />
          )}

          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileRef}
            onChange={handleFileUpload}
          />
        </>
      ) : (
        <CameraView
          setPreview={setPreview}
          setCurrentLocation={setCurrentLocation}
          setPhotoLocation={setPhotoLocation}
          closeCamera={() => setCameraMode(false)}
        />
      )}
    </div>
  );
}