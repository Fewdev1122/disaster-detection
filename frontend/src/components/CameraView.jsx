import { useEffect, useRef } from "react";

export default function CameraView({ setPreview, closeCamera }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    openCamera();
    // eslint-disable-next-line react-hooks/immutability
    return () => stopCamera();
  }, []);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
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

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || video.readyState !== 4) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/png");
    setPreview(imageData);

    stopCamera();
    closeCamera();
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
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
          className="w-16 h-16 rounded-full bg-white border-4 border-gray-300"
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