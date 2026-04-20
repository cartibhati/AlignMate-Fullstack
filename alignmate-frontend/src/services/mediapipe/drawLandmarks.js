export function drawPoseResults(canvasElement, videoElement, results) {
  if (!canvasElement || !videoElement || !results) return;

  const canvasCtx = canvasElement.getContext("2d");
  if (!canvasCtx) return;

  const { poseLandmarks} = results;

  canvasElement.width = videoElement.videoWidth || 640;
  canvasElement.height = videoElement.videoHeight || 480;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Mirror canvas so overlay matches mirrored selfie-view video
  canvasCtx.translate(canvasElement.width, 0);
  canvasCtx.scale(-1, 1);

  if (poseLandmarks) {
    // Draw connections
    if (window.drawConnectors && window.POSE_CONNECTIONS) {
      window.drawConnectors(canvasCtx, poseLandmarks, window.POSE_CONNECTIONS, {
        color: "#00E5FF",
        lineWidth: 3,
      });
    }

    // Draw landmark points
    if (window.drawLandmarks) {
      window.drawLandmarks(canvasCtx, poseLandmarks, {
        color: "#FF2D55",
        lineWidth: 2,
        radius: 4,
      });
    }
  }

  canvasCtx.restore();
}