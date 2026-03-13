import React, { useRef, useState } from "react";
import UploadArea from "../components/UploadArea";
import CameraView from "../components/CameraView";
import CameraButton from "../components/CameraButton";
import { sendReport } from "../services/api";

export default function UploadPage() {
  const [preview, setPreview] = useState(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
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

  const handleSubmit = async () => {
  if (!preview) return;

  try {
    setLoading(true);

    const location = await getLocation();

    await sendReport(preview, location);

    alert("แจ้งเหตุเรียบร้อย");
    setPreview(null);

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
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold mt-4 disabled:opacity-50"
          >
            {loading ? "กำลังส่ง..." : "แจ้งเหตุ"}
          </button>
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