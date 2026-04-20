import { useCallback, useRef } from "react";
import usePoseDetection from "../../hooks/usePoseDetection";
import { drawPoseResults } from "../../services/mediapipe/drawLandmarks";

function CameraFeed({ onPoseResults }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleResults = useCallback(
    (results) => {
      if (!videoRef.current || !canvasRef.current) return;

      drawPoseResults(canvasRef.current, videoRef.current, results);

      if (onPoseResults) {
        onPoseResults(results);
      }
    },
    [onPoseResults]
  );

  usePoseDetection(videoRef, handleResults);

  return (
    <div
      style={{
        position: "relative",
        width: "640px",
        height: "480px",
        margin: "0 auto",
        borderRadius: "12px",
        overflow: "hidden",
        border: "2px solid #ccc",
        backgroundColor: "#000",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)",
          display: "block",
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default CameraFeed;