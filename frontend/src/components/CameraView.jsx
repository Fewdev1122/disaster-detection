import { useEffect, useRef } from "react";

export default function CameraView({
  setPreview,
  setCurrentLocation,
  setPhotoLocation,
  closeCamera,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    openCamera();
    return () => stopCamera();
  }, []);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      alert("เปิดกล้องไม่ได้");
      closeCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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
          timeout: 8000,
          maximumAge: 0,
        }
      );
    });

  const formatTimestamp = (date = new Date()) => {
    return date.toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      dateStyle: "medium",
      timeStyle: "medium",
    });
  };

  const drawOverlay = (ctx, canvas, timestamp, location) => {
    const padding = 16;
    const lineHeight = 24;

    const lines = [`เวลา: ${timestamp}`];

    if (location?.lat != null && location?.lng != null) {
      lines.push(
        `พิกัด: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
      );
    } else {
      lines.push("พิกัด: ไม่พบ");
    }

    ctx.save();

    ctx.font = "bold 18px sans-serif";
    ctx.textBaseline = "top";

    let maxWidth = 0;
    for (const line of lines) {
      const width = ctx.measureText(line).width;
      if (width > maxWidth) maxWidth = width;
    }

    const boxWidth = maxWidth + padding * 2;
    const boxHeight = lines.length * lineHeight + padding * 2;

    const x = 16;
    const y = canvas.height - boxHeight - 16;

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(x, y, boxWidth, boxHeight);

    ctx.fillStyle = "#ffffff";

    lines.forEach((line, index) => {
      ctx.fillText(line, x + padding, y + padding + index * lineHeight);
    });

    ctx.restore();
  };

  const capture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== 4) return;

    let liveLocation = null;
    try {
      liveLocation = await getLocation();
    } catch (err) {
      console.warn("CAMERA LOCATION ERROR:", err.message);
    }

    const timestamp = formatTimestamp(new Date());

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // ฝังเวลา + พิกัดลงในภาพ
    drawOverlay(ctx, canvas, timestamp, liveLocation);

    // ใช้ jpeg เร็วกว่า png และไฟล์เล็กกว่า
    const imageData = canvas.toDataURL("image/jpeg", 0.9);

    setPreview(imageData);

    // ภาพจาก canvas ไม่มี EXIF จริง
    setPhotoLocation(null);

    if (liveLocation) {
      setCurrentLocation(liveLocation);
    } else {
      setCurrentLocation(null);
    }

    stopCamera();
    closeCamera();
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="flex-1 object-cover"
      />

      <div className="h-28 flex items-center justify-center relative bg-black">
        <button
          onClick={capture}
          className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 active:scale-95 transition"
        />

        <button
          onClick={() => {
            stopCamera();
            closeCamera();
          }}
          className="absolute right-6 top-6 text-white text-2xl"
        >
          ✕
        </button>
      </div>

      <canvas ref={canvasRef} hidden />
    </div>
  );
}