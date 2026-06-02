import { useState, useEffect, useRef, useContext } from "react";
import CameraFeed from "@/components/camera/CameraFeed";
import FeedbackBanner from "@/components/posture/FeedBackBanner";
import AngleMetrics from "@/components/posture/AngleMetrics";
import PostureScoreRing from "@/components/posture/PostureScoreRing";
import usePostureAnalysis from "@/hooks/usePostureAnalysis";
import usePostureTimer from "@/hooks/usePostureTimer";
import useVoiceAlert from "@/hooks/useVoiceAlert";
import useAIFeedback from "@/hooks/useAIFeedback";
import SessionSummaryModel from "@/components/posture/SessionSummaryModel";
import ConnectionStatus from "@/components/common/ConnectionStatus";
import { AuthContext } from "@/context/AuthContext";
import { saveSession } from "@/services/sessionStorage";

const MODE_STYLES = {
  student: { bg: "bg-blue-100",   text: "text-blue-700",   label: "🎓 Student" },
  athlete: { bg: "bg-orange-100", text: "text-orange-700", label: "🏋️ Athlete" },
  both:    { bg: "bg-purple-100", text: "text-purple-700", label: "⚡ Both"    },
};

export default function LivePosturePage() {
  const { user } = useContext(AuthContext);

  const [mode] = useState(
    () => localStorage.getItem("alignmate_mode") || "student"
  );

  const [poseResults, setPoseResults] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const { speak, cancel } = useVoiceAlert(mode);

  const { data: rawAnalysis, connectionStatus } =
    usePostureAnalysis(poseResults, mode);

  // ── Score smoothing ──────────────────────────────────────────────────────
  const score       = rawAnalysis?.score ?? 0;
  const smoothedRef = useRef(score);
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    const newScore = Math.round(smoothedRef.current * 0.7 + score * 0.3);
    smoothedRef.current = newScore;
    setDisplayScore(newScore);
  }, [score]);

  const scoreSumRef   = useRef(0);
  const scoreCountRef = useRef(0);

  useEffect(() => {
    if (displayScore > 0) {
      scoreSumRef.current   += displayScore;
      scoreCountRef.current += 1;
    }
  }, [displayScore]);

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

  const { duration, isBadPosture, reset } = usePostureTimer(analysis.status);

  useEffect(() => {
    if (voiceEnabled) speak(normalisedStatus);
  }, [normalisedStatus, voiceEnabled, speak]);

  // ── Session timer ────────────────────────────────────────────────────────
  const sessionStartRef = useRef(Date.now());
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSessionSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Bad posture accumulator ───────────────────────────────────────────────
  const accumulatedBadRef = useRef(0);
  const badStreakStartRef = useRef(null);
  const [totalBadSecs, setTotalBadSecs] = useState(0);

  const isCurrentlyBad = normalisedStatus === "bad" || normalisedStatus === "drift";

  useEffect(() => {
    if (isCurrentlyBad) {
      if (badStreakStartRef.current === null) badStreakStartRef.current = Date.now();
    } else {
      if (badStreakStartRef.current !== null) {
        const streakSecs = Math.floor((Date.now() - badStreakStartRef.current) / 1000);
        accumulatedBadRef.current += streakSecs;
        badStreakStartRef.current  = null;
        setTotalBadSecs(accumulatedBadRef.current);
      }
    }
  }, [isCurrentlyBad]);

  // ── AI Feedback ───────────────────────────────────────────────────────────
  const { aiFeedback, loading: aiLoading, fetchFeedback } = useAIFeedback({
    mode,
    score:           displayScore,
    badDuration:     totalBadSecs,
    sessionDuration: sessionSeconds,
    issues:          rawAnalysis?.issues ?? [],
    enabled:         connectionStatus === "connected",
  });

  // ── End session ──────────────────────────────────────────────────────────
  const handleEndSession = async () => {
    cancel();
    await fetchFeedback();

    let finalBadSecs = accumulatedBadRef.current;
    if (badStreakStartRef.current !== null) {
      finalBadSecs += Math.floor((Date.now() - badStreakStartRef.current) / 1000);
    }

    const finalAvgScore =
      scoreCountRef.current > 0
        ? Math.round(scoreSumRef.current / scoreCountRef.current)
        : analysis.score;

    if (user?.email) {
      saveSession(user.email, {
        duration:    sessionSeconds,
        badDuration: finalBadSecs,
        score:       finalAvgScore,
        feedback:    analysis.feedback,
        aiFeedback,                    // ✅ save AI summary
        mode,
      });
    }
    setShowSummary(true);
  };

  // ── New session reset ────────────────────────────────────────────────────
  const handleStartNewSession = () => {
    cancel();
    setShowSummary(false);
    setPoseResults(null);
    smoothedRef.current       = 0;
    setDisplayScore(0);
    sessionStartRef.current   = Date.now();
    accumulatedBadRef.current = 0;
    badStreakStartRef.current  = null;
    scoreSumRef.current        = 0;
    scoreCountRef.current      = 0;
    setSessionSeconds(0);
    setTotalBadSecs(0);
    reset();
  };

  const fmt = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  const modeStyle = MODE_STYLES[mode] || MODE_STYLES.student;

  return (
    <div className="h-screen flex bg-gray-50">

      <div className="w-2/3 flex items-center justify-center bg-black">
        <CameraFeed onPoseResults={setPoseResults} />
      </div>

      <div className="w-1/3 p-6 flex flex-col gap-6 bg-white border-l overflow-y-auto">

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Live Analysis</h2>
          <ConnectionStatus status={connectionStatus} />
        </div>

        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${modeStyle.bg} ${modeStyle.text}`}>
            {modeStyle.label} mode
          </div>
          <button
            onClick={() => { if (voiceEnabled) cancel(); setVoiceEnabled((v) => !v); }}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              voiceEnabled ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-300"
            }`}
          >
            {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
          </button>
        </div>

        <button onClick={handleEndSession} className="bg-black text-white px-3 py-2 rounded">
          End Session
        </button>

        {isBadPosture && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm font-medium">
            ⚠️ Bad posture for {duration.toFixed(1)} sec
          </div>
        )}

        <PostureScoreRing score={analysis.score} />
        <FeedbackBanner feedback={analysis.feedback} />
        <AngleMetrics metrics={analysis.metrics} />

        {/* AI Coach panel */}
        <div className="bg-gray-50 rounded-xl p-4 border">
          <p className="text-xs font-semibold text-gray-400 mb-1">🤖 AI Coach</p>
          {aiLoading ? (
            <p className="text-sm text-gray-400 animate-pulse">Analysing your session...</p>
          ) : aiFeedback ? (
            <p className="text-sm text-gray-700 leading-relaxed">{aiFeedback}</p>
          ) : (
            <p className="text-sm text-gray-400">AI feedback appears every 30s</p>
          )}
        </div>

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
        aiFeedback={aiFeedback}
      />
    </div>
  );
}