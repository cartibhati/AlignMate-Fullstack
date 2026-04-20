function roundMetric(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return Number(value.toFixed(2));
}

export function evaluatePosture(metrics) {
  if (!metrics) {
    return {
      status: "No Pose",
      score: 0,
      feedback: ["Unable to detect full upper body."],
      issues: [],
      metrics: {},
    };
  }

  const {
    shoulderSlope,
    torsoTilt,
    headOffsetX,
    avgVisibility,
  } = metrics;

  const issues = [];
  const feedback = [];

  if (avgVisibility < 0.55) {
    return {
      status: "Low Confidence",
      score: 0,
      feedback: ["Move fully into frame and keep shoulders and hips visible."],
      issues: ["pose_visibility_low"],
      metrics: {
        shoulderSlope: roundMetric(shoulderSlope),
        torsoTilt: roundMetric(torsoTilt),
        headOffsetX: roundMetric(headOffsetX),
        avgVisibility: roundMetric(avgVisibility),
      },
    };
  }

  if (Math.abs(shoulderSlope) > 7) {
    issues.push("uneven_shoulders");
    feedback.push("Keep both shoulders level.");
  }

  if (Math.abs(torsoTilt) > 8) {
    issues.push("torso_lean");
    feedback.push("Sit upright and avoid leaning sideways.");
  }

  if (Math.abs(headOffsetX) > 0.035) {
    issues.push("head_off_center");
    feedback.push("Bring your head back to the center.");
  }

  let score = 100;

  if (issues.includes("uneven_shoulders")) score -= 20;
  if (issues.includes("torso_lean")) score -= 25;
  if (issues.includes("head_off_center")) score -= 20;

  score = Math.max(score, 0);

  return {
    status: issues.length === 0 ? "Good Posture" : "Needs Correction",
    score,
    feedback:
      issues.length === 0
        ? ["Posture looks stable. Keep it up."]
        : feedback,
    issues,
    metrics: {
      shoulderSlope: roundMetric(shoulderSlope),
      torsoTilt: roundMetric(torsoTilt),
      headOffsetX: roundMetric(headOffsetX),
      avgVisibility: roundMetric(avgVisibility),
    },
  };
}