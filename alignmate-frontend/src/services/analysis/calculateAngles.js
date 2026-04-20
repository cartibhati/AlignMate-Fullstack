function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

export function calculateSlopeAngle(pointA, pointB) {
  if (!pointA || !pointB) return null;

  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;

  return toDegrees(Math.atan2(dy, dx));
}

export function calculateVerticalTiltAngle(pointA, pointB) {
  if (!pointA || !pointB) return null;

  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;

  // Angle relative to vertical axis
  return toDegrees(Math.atan2(dx, dy));
}

export function calculateDistance(pointA, pointB) {
  if (!pointA || !pointB) return null;

  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;

  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateShoulderTilt(leftShoulder, rightShoulder) {
  if (!leftShoulder || !rightShoulder) return null;

  const dx = rightShoulder.x - leftShoulder.x;
  const dy = rightShoulder.y - leftShoulder.y;

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  
  return Math.abs(angle);
}

export function calculateMidpoint(pointA, pointB) {
  if (!pointA || !pointB) return null;

  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
  };
}

export function calculateHorizontalOffset(pointA, pointB) {
  if (!pointA || !pointB) return null;
  return pointA.x - pointB.x;
}

export function getPoseKeypoints(landmarks) {
  if (!landmarks || landmarks.length < 25) return null;

  return {
    nose: landmarks[0],
    leftShoulder: landmarks[11],
    rightShoulder: landmarks[12],
    leftHip: landmarks[23],
    rightHip: landmarks[24],
  };
}

export function calculatePostureMetrics(landmarks) {
  const points = getPoseKeypoints(landmarks);
  if (!points) return null;

  const {
    nose,
    leftShoulder,
    rightShoulder,
    leftHip,
    rightHip,
  } = points;

  const shoulderCenter = calculateMidpoint(leftShoulder, rightShoulder);
  const hipCenter = calculateMidpoint(leftHip, rightHip);

  const shoulderSlope = calculateSlopeAngle(leftShoulder, rightShoulder);
  const torsoTilt = calculateVerticalTiltAngle(shoulderCenter, hipCenter);
  const headOffsetX = calculateHorizontalOffset(nose, shoulderCenter);

  const visibilityScore = [
    nose?.visibility,
    leftShoulder?.visibility,
    rightShoulder?.visibility,
    leftHip?.visibility,
    rightHip?.visibility,
  ].filter((v) => typeof v === "number");

  const avgVisibility =
    visibilityScore.length > 0
      ? visibilityScore.reduce((sum, value) => sum + value, 0) /
        visibilityScore.length
      : 0;

  return {
    shoulderSlope,
    torsoTilt,
    headOffsetX,
    avgVisibility,
    shoulderCenter,
    hipCenter,
  };
}