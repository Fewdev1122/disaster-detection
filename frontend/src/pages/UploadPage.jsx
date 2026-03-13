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

  // เก็บ file จริงไว้ เผื่ออ่าน EXIF
  const [selectedFile, setSelectedFile] = useState(null);

  // พิกัดจากรูป
  const [photoLocation, setPhotoLocation] = useState(null);

  // พิกัดปัจจุบันของเครื่อง
  const [currentLocation, setCurrentLocation] = useState(null);

  const fileRef = useRef(null);

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
        (err) => {
          console.log("GEO ERROR CODE:", err.code);
          console.log("GEO ERROR MSG:", err.message);
          reject(err);
        },
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

    setSelectedFile(file);

    // 1) อ่าน GPS จากรูปก่อน
    const gpsFromImage = await readImageGPS(file);
    setPhotoLocation(gpsFromImage);

    // 2) preview รูป
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // 3) ลองดึง GPS ปัจจุบันของเครื่องไว้ด้วย
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

      // ถ้ามีพิกัดจากรูป ใช้พิกัดจากรูปเป็นตำแหน่งเหตุ
      // ถ้าไม่มี ค่อย fallback ไปใช้พิกัดปัจจุบัน
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

        // ส่งข้อมูลแยกไว้ด้วย เผื่อ backend อยากเก็บ
        photo_lat: photoLocation?.lat ?? null,
        photo_lng: photoLocation?.lng ?? null,
        current_lat: currentLocation?.lat ?? null,
        current_lng: currentLocation?.lng ?? null,
        location_source: photoLocation ? "image_exif" : "device_gps",
      });

      alert("แจ้งเหตุเรียบร้อย");

      setPreview(null);
      setSelectedFile(null);
      setPhotoLocation(null);
      setCurrentLocation(null);
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
      {!cameraMode ? (
        <>
          <UploadArea
            preview={preview}
            onClick={() => fileRef.current.click()}
          />

          {preview && (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                {photoLocation ? (
                  <>
                    <div className="font-medium text-green-700">
                      ใช้พิกัดจากรูปภาพ
                    </div>
                    <div>
                      lat: {photoLocation.lat}, lng: {photoLocation.lng}
                    </div>
                  </>
                ) : currentLocation ? (
                  <>
                    <div className="font-medium text-orange-600">
                      ไม่พบพิกัดในรูป จะใช้พิกัดปัจจุบันของเครื่อง
                    </div>
                    <div>
                      lat: {currentLocation.lat}, lng: {currentLocation.lng}
                    </div>
                    {currentLocation.accuracy && (
                      <div>accuracy: ±{Math.round(currentLocation.accuracy)} m</div>
                    )}
                  </>
                ) : (
                  <div className="font-medium text-red-600">
                    ไม่พบพิกัดจากรูป และยังดึงพิกัดปัจจุบันไม่ได้
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {loading ? "กำลังส่ง..." : "แจ้งเหตุ"}
              </button>
            </div>
          )}

          <CameraButton onClick={() => setCameraMode(true)} />

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
          closeCamera={() => setCameraMode(false)}
        />
      )}
    </div>
  );
}