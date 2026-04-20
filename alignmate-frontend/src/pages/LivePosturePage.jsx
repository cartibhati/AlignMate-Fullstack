import { useState, useEffect, useRef, useContext } from "react";
import CameraFeed from "@/components/camera/CameraFeed";
import FeedbackBanner from "@/components/posture/FeedBackBanner";
import AngleMetrics from "@/components/posture/AngleMetrics";
import PostureScoreRing from "@/components/posture/PostureScoreRing";
import usePostureAnalysis from "@/hooks/usePostureAnalysis";
import usePostureTimer from "@/hooks/usePostureTimer";
import SessionSummaryModel from "@/components/posture/SessionSummaryModel";
import ConnectionStatus from "@/components/common/ConnectionStatus";
import { AuthContext } from "@/context/AuthContext";
import { saveSession } from "@/services/sessionStorage";

export default function LivePosturePage() {
  const { user } = useContext(AuthContext);

  const [poseResults, setPoseResults] = useState(null);
  const [showSummary, setShowSummary]  = useState(false);

  const { data: rawAnalysis, connectionStatus } =
    usePostureAnalysis(poseResults);

  // ── Score smoothing ──────────────────────────────────────────────────────
  const score       = rawAnalysis?.score ?? 0;
  const smoothedRef = useRef(score);
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    const newScore = Math.round(smoothedRef.current * 0.7 + score * 0.3);
    smoothedRef.current = newScore;
    setDisplayScore(newScore);
  }, [score]);

  const normalisedStatus = (rawAnalysis?.status ?? "good").toLowerCase();

  const analysis = {
    status: normalisedStatus,
    feedback: Array.isArray(rawAnalysis?.feedback)
      ? rawAnalysis.feedback
      : rawAnalysis?.feedback ? [rawAnalysis.feedback] : [],
    metrics: {
      shoulderSlope: rawAnalysis?.angles?.shoulder !== undefined ? rawAnalysis.angles.shoulder : "-",
      torsoTilt:     rawAnalysis?.angles?.neck     !== undefined ? rawAnalysis.angles.neck     : "-",
      headOffsetX:   rawAnalysis?.issues?.length > 0 ? rawAnalysis.issues.join(", ") : "-",
      avgVisibility: rawAnalysis?.bad_prob !== undefined ? (1 - rawAnalysis.bad_prob).toFixed(2) : "-",
    },
    score: displayScore,
  };

  // Keep usePostureTimer for the live alert banner only
  const { duration, isBadPosture, reset } = usePostureTimer(analysis.status);

  // ── Total session time ───────────────────────────────────────────────────
  const sessionStartRef = useRef(Date.now());
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSessionSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Accumulated bad posture time ─────────────────────────────────────────
  // ✅ FIX: Track based on normalisedStatus directly — not isBadPosture.
  // isBadPosture only flips true after MIN_BAD_DURATION (15s), so short bad
  // streaks and the entire "drift" phase were silently ignored.
  // Now we count any frame where status is "bad" OR "drift" as bad posture.
  const accumulatedBadRef = useRef(0);
  const badStreakStartRef  = useRef(null);
  const [totalBadSecs, setTotalBadSecs] = useState(0);

  const isCurrentlyBad = normalisedStatus === "bad" || normalisedStatus === "drift";

  useEffect(() => {
    if (isCurrentlyBad) {
      // Start of a bad streak
      if (badStreakStartRef.current === null) {
        badStreakStartRef.current = Date.now();
      }
    } else {
      // End of a bad streak — flush to accumulator
      if (badStreakStartRef.current !== null) {
        const streakSecs = Math.floor(
          (Date.now() - badStreakStartRef.current) / 1000
        );
        accumulatedBadRef.current += streakSecs;
        badStreakStartRef.current  = null;
        setTotalBadSecs(accumulatedBadRef.current);
      }
    }
  }, [isCurrentlyBad]);

  // ── End session ──────────────────────────────────────────────────────────
  const handleEndSession = () => {
    // Close any open bad streak before saving
    let finalBadSecs = accumulatedBadRef.current;
    if (badStreakStartRef.current !== null) {
      finalBadSecs += Math.floor(
        (Date.now() - badStreakStartRef.current) / 1000
      );
    }

    if (user?.email) {
      saveSession(user.email, {
        duration:    sessionSeconds,
        badDuration: finalBadSecs,
        score:       analysis.score,
        feedback:    analysis.feedback,
      });
    }
    setShowSummary(true);
  };

  // ── New session reset ────────────────────────────────────────────────────
  const handleStartNewSession = () => {
    setShowSummary(false);
    setPoseResults(null);
    smoothedRef.current       = 0;
    setDisplayScore(0);
    sessionStartRef.current   = Date.now();
    accumulatedBadRef.current = 0;
    badStreakStartRef.current  = null;
    setSessionSeconds(0);
    setTotalBadSecs(0);
    reset();
  };

  const fmt = (s) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="h-screen flex bg-gray-50">

      {/* LEFT — camera */}
      <div className="w-2/3 flex items-center justify-center bg-black">
        <CameraFeed onPoseResults={setPoseResults} />
      </div>

      {/* RIGHT — panel */}
      <div className="w-1/3 p-6 flex flex-col gap-6 bg-white border-l overflow-y-auto">

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Live Analysis</h2>
          <ConnectionStatus status={connectionStatus} />
        </div>

        <button
          onClick={handleEndSession}
          className="bg-black text-white px-3 py-2 rounded"
        >
          End Session
        </button>

        {/* Alert banner — uses isBadPosture (only for visual alert after 15s) */}
        {isBadPosture && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm font-medium">
            ⚠️ Bad posture for {duration.toFixed(1)} sec
          </div>
        )}

        <PostureScoreRing score={analysis.score} />
        <FeedbackBanner feedback={analysis.feedback} />
        <AngleMetrics metrics={analysis.metrics} />

        {/* Live session stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-400">Session</p>
            <p className="font-semibold text-gray-700">{fmt(sessionSeconds)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <p className="text-red-400">Bad posture</p>
            <p className="font-semibold text-red-600">{fmt(totalBadSecs)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <p className="text-green-400">Good time</p>
            <p className="font-semibold text-green-600">
              {sessionSeconds > 0
                ? `${Math.max(0, Math.round(((sessionSeconds - totalBadSecs) / sessionSeconds) * 100))}%`
                : "100%"}
            </p>
          </div>
        </div>
      </div>

      <SessionSummaryModel
        open={showSummary}
        onClose={handleStartNewSession}
        duration={sessionSeconds}
        badDuration={totalBadSecs}
        score={analysis.score}
        feedback={analysis.feedback}
      />
    </div>
  );
}