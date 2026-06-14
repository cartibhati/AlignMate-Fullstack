import { useState, useEffect, useRef, useContext } from "react";
import { useSearchParams } from "react-router-dom";
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
import VoiceCoachSettings from "@/components/posture/VoiceCoachSettings";
import { Play, Pause, RotateCcw, CheckSquare, Square } from "lucide-react";

const MODE_THEMES = {
  student: {
    accent: "text-blue-500 dark:text-sky-400",
    bg: "bg-blue-500/10 border-blue-500/20 dark:bg-sky-500/10 dark:border-sky-sky-500/20",
    border: "border-blue-500/30 dark:border-sky-400/20",
    btn: "bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_15px_-3px_rgba(59,130,246,0.4)]",
    bullet: "bg-blue-500",
    label: "🎓 Student Study",
  },
  athlete: {
    accent: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    border: "border-primary/20",
    btn: "bg-primary text-primary-foreground shadow-neon",
    bullet: "bg-primary",
    label: "🏋️ Athlete Performance",
  },
};

export default function LivePosturePage() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "athlete" ? "athlete" : "student";

  const [poseResults, setPoseResults] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const { speak, cancel } = useVoiceAlert(mode);
  const { data: rawAnalysis, connectionStatus } = usePostureAnalysis(poseResults, mode);

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

  // ── Pomodoro Timer (Student Mode Widget) ──────────────────────────────────
  const [pomoTime, setPomoTime] = useState(25 * 60);
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState("study"); // study | break

  useEffect(() => {
    let id = null;
    if (pomoActive && pomoTime > 0) {
      id = setInterval(() => setPomoTime(t => t - 1), 1000);
    } else if (pomoTime === 0) {
      setPomoActive(false);
      if (pomoMode === "study") {
        setPomoMode("break");
        setPomoTime(5 * 60);
        if (window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance("Great focus session! Take a 5 minute break to stretch your back.");
          window.speechSynthesis.speak(u);
        }
      } else {
        setPomoMode("study");
        setPomoTime(25 * 60);
        if (window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance("Break is over. Ready to focus? Let's check your sitting posture.");
          window.speechSynthesis.speak(u);
        }
      }
    }
    return () => clearInterval(id);
  }, [pomoActive, pomoTime, pomoMode]);

  const togglePomo = () => setPomoActive(!pomoActive);
  const resetPomo = () => {
    setPomoActive(false);
    setPomoTime(pomoMode === "study" ? 25 * 60 : 5 * 60);
  };

  const formatPomo = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ── Ergonomics Checklist (Student Mode Widget) ────────────────────────────
  const [ergoChecklist, setErgoChecklist] = useState([
    { id: 1, label: "Screen at eye level (no neck tilting)", checked: false },
    { id: 2, label: "Lower back fully supported by chair", checked: false },
    { id: 3, label: "Feet flat on the floor, hips pushed back", checked: false },
    { id: 4, label: "Shoulders relaxed, elbows at 90° angle", checked: false },
    { id: 5, label: "Keep study area bright & glare-free", checked: false },
  ]);

  const toggleCheck = (id) => {
    setErgoChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const checkedCount = ergoChecklist.filter(item => item.checked).length;
  const ergoProgress = Math.round((checkedCount / ergoChecklist.length) * 100);

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
        aiFeedback,
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
  const theme = MODE_THEMES[mode] || MODE_THEMES.student;

  return (
    <div className="h-screen flex bg-background overflow-hidden font-sans">
      {/* Camera feed */}
      <div className="w-2/3 flex items-center justify-center bg-black border-r border-border">
        <CameraFeed onPoseResults={setPoseResults} />
      </div>

      {/* Control panel */}
      <div className="w-1/3 p-6 flex flex-col gap-6 bg-card border-l border-border overflow-y-auto text-left">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Live Analysis</h2>
          <ConnectionStatus status={connectionStatus} />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${theme.bg} ${theme.accent}`}>
            {theme.label} Mode
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => { if (voiceEnabled) cancel(); setVoiceEnabled((v) => !v); }}
            className={`text-xs px-3.5 py-2.5 rounded-xl border transition-all duration-200 flex-1 ${
              voiceEnabled ? theme.btn + " font-bold" : "bg-transparent text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
          </button>
          <VoiceCoachSettings />
        </div>

        <button onClick={handleEndSession} className="bg-red-500 hover:bg-red-600 text-white font-extrabold uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-red-500/15 transition-all">
          End Session
        </button>

        {isBadPosture && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-xs font-bold uppercase tracking-wide">
            ⚠️ Bad posture alert: {duration.toFixed(1)} sec
          </div>
        )}

        {/* Double Dashboard Grid: Score Ring + Dynamic Mode Widget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PostureScoreRing score={analysis.score} />
          
          {/* Dynamic mode-specific widgets */}
          {mode === "student" ? (
            <div className="border border-border rounded-2xl bg-card p-4 flex flex-col justify-between hover:border-primary/20 transition-all duration-300">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Pomodoro Focus</p>
                <p className="text-3xl font-black font-display text-foreground leading-none mt-1">
                  {formatPomo(pomoTime)}
                </p>
                <p className="text-[10px] font-bold text-blue-500 dark:text-sky-400 uppercase mt-2">
                  {pomoMode === "study" ? "📝 Study Session" : "☕ Short Break"}
                </p>
              </div>
              
              <div className="flex gap-2 mt-3">
                <button onClick={togglePomo} className="flex-1 bg-muted/60 hover:bg-accent p-2 rounded-lg flex items-center justify-center text-foreground transition-all">
                  {pomoActive ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button onClick={resetPomo} className="flex-1 bg-muted/60 hover:bg-accent p-2 rounded-lg flex items-center justify-center text-foreground transition-all">
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-border rounded-2xl bg-card p-4 flex flex-col justify-between hover:border-primary/20 transition-all duration-300">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Precision Target</p>
                <p className="text-3xl font-black font-display text-primary leading-none mt-1">Stricter</p>
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  Posture thresholds are adjusted to keep your back fully aligned during intensive training sessions.
                </p>
              </div>
            </div>
          )}
        </div>

        <FeedbackBanner feedback={analysis.feedback} />
        <AngleMetrics metrics={analysis.metrics} />

        {/* Ergonomics widget (Student mode only) */}
        {mode === "student" && (
          <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">📐 Desk Ergonomics</p>
              <span className="text-xs font-black font-display text-blue-500 dark:text-sky-400">{ergoProgress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 dark:bg-sky-400 rounded-full transition-all duration-300" style={{ width: `${ergoProgress}%` }} />
            </div>
            <div className="space-y-2 mt-2">
              {ergoChecklist.map((item) => (
                <button key={item.id} onClick={() => toggleCheck(item.id)} className="w-full flex items-start gap-2.5 text-left text-xs text-foreground hover:bg-muted/30 p-1.5 rounded-lg transition-colors font-medium">
                  {item.checked ? (
                    <CheckSquare size={14} className="text-blue-500 dark:text-sky-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Square size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <span className={item.checked ? "line-through text-muted-foreground/75" : ""}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Coach panel */}
        <div className="bg-muted/40 rounded-2xl p-5 border border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">🤖 AI Coach</p>
          {aiLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse font-medium">Analysing your session posture...</p>
          ) : aiFeedback ? (
            <p className="text-sm text-foreground font-medium leading-relaxed">{aiFeedback}</p>
          ) : (
            <p className="text-sm text-muted-foreground font-medium">AI feedback appears every 30s</p>
          )}
        </div>

        {/* Session Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-muted/50 border border-border rounded-xl p-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Session</p>
            <p className="font-extrabold text-foreground font-display text-sm">{fmt(sessionSeconds)}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Bad posture</p>
            <p className="font-extrabold text-red-500 font-display text-sm">{fmt(totalBadSecs)}</p>
          </div>
          <div className={`border rounded-xl p-3 ${
            mode === "student" ? "bg-blue-500/10 border-blue-500/20 text-blue-500 dark:text-sky-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Good time</p>
            <p className="font-extrabold font-display text-sm">
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