export default function AngleMetrics({ metrics = {} }) {
  const {
    shoulderSlope = "-",
    torsoTilt = "-",
    headOffsetX = "-",
    avgVisibility = "-",
  } = metrics || {};

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="text-sm font-semibold mb-2">Metrics</h3>

      <div className="text-sm text-gray-700 space-y-1">
        <p>Shoulder Slope: {shoulderSlope}</p>
        <p>Torso Tilt: {torsoTilt}</p>
        <p>Head Offset X: {headOffsetX}</p>
        <p>Visibility: {avgVisibility}</p>
      </div>
    </div>
  );
}