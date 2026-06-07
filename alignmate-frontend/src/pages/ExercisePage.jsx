// src/pages/ExercisePage.jsx
import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import CameraFeed from "@/components/camera/CameraFeed";
import { AuthContext } from "@/context/AuthContext";

import { API_BASE_URL, WS_BASE_URL } from "@/config";

const API = `${API_BASE_URL}/auth`;

const EXERCISES = [
  { id: "squat",          label: "Squat",          icon: "🏋️", muscle: "Legs",          reps: 10, tip: "Side view, full body in frame",    category: "Compound",  restSecs: 90 },
  { id: "pushup",         label: "Pushup",          icon: "💪", muscle: "Chest",         reps: 10, tip: "Side view, full body visible",      category: "Compound",  restSecs: 60 },
  { id: "deadlift",       label: "Deadlift",        icon: "⚡", muscle: "Back & Legs",   reps: 8,  tip: "Side view essential",              category: "Compound",  restSecs: 120 },
  { id: "bench_press",    label: "Bench Press",     icon: "🏋️", muscle: "Chest",         reps: 10, tip: "Side view, lay flat",              category: "Compound",  restSecs: 90 },
  { id: "barbell_row",    label: "Barbell Row",     icon: "🔄", muscle: "Back",          reps: 10, tip: "Side view, hinge at hips",         category: "Compound",  restSecs: 90 },
  { id: "lunge",          label: "Lunge",           icon: "🦵", muscle: "Legs & Glutes", reps: 10, tip: "Side view, full body visible",      category: "Compound",  restSecs: 60 },
  { id: "hip_thrust",     label: "Hip Thrust",      icon: "🍑", muscle: "Glutes",        reps: 12, tip: "Side view, lay back on bench",     category: "Compound",  restSecs: 60 },
  { id: "bicep_curl",     label: "Bicep Curl",      icon: "💪", muscle: "Biceps",        reps: 12, tip: "Face camera or slight angle",      category: "Isolation", restSecs: 45 },
  { id: "lateral_raise",  label: "Lateral Raise",   icon: "🙌", muscle: "Shoulders",    reps: 12, tip: "Face camera directly",             category: "Isolation", restSecs: 45 },
  { id: "shoulder_press", label: "Shoulder Press",  icon: "🔝", muscle: "Shoulders",    reps: 10, tip: "Face camera or slight angle",      category: "Isolation", restSecs: 60 },
  { id: "tricep_dip",     label: "Tricep Dip",      icon: "💪", muscle: "Triceps",       reps: 10, tip: "Side view, bars on either side",   category: "Isolation", restSecs: 45 },
  { id: "plank",          label: "Plank",           icon: "🧘", muscle: "Core",          reps: 3,  tip: "Side view, hold 30s × 3 sets",     category: "Core",      restSecs: 30 },
];

const CATEGORIES    = ["All", "Compound", "Isolation", "Core"];
const WS_URL        = `${WS_BASE_URL}/ws/exercise`;
const VOICE_CD      = 4000;
const MOTIVATE_INTV = 18000;
const ACTIVE_PHASES = ["down", "up", "holding"];

const MOTIVATION = [
  "Keep pushing — you're almost there!",
  "Don't stop now — few more reps!",
  "You came here to grow — show up!",
  "Don't you get tired of looking the same every day?",
  "Get angry — use it as fuel!",
  "Pain is temporary — results are permanent!",
  "Your future self is watching — make them proud!",
  "No shortcuts — earn every rep!",
  "Every rep is a step closer to your goal!",
  "You started — don't you dare quit now!",
];

export default function ExercisePage() {
  const { user }       = useContext(AuthContext);
  const [searchParams] = useSearchParams();

  const urlId   = searchParams.get("id");
  const urlName = searchParams.get("name");
  const initialEx = urlId ? EXERCISES.find(e => e.id === urlId) ?? null : null;

  const [selected, setSelected]         = useState(initialEx);
  const [poseResults, setPoseResults]   = useState(null);
  const [wsData, setWsData]             = useState(null);
  const [connected, setConnected]       = useState(false);
  const [completed, setCompleted]       = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [filter, setFilter]             = useState("All");
  const [resting, setResting]           = useState(false);
  const [restLeft, setRestLeft]         = useState(0);
  const [setNumber, setSetNumber]       = useState(1);

  const restIntervalRef   = useRef(null);
  const formScoreSumRef   = useRef(0);
  const formScoreCountRef = useRef(0);
  const socketRef         = useRef(null);
  const lastVoiceRef      = useRef(0);
  const lastMotivateRef   = useRef(0);
  const lastFbRef         = useRef("");
  const motivateIdxRef    = useRef(0);
  const activePhaseRef    = useRef(false);

  // ✅ KEY FIX: refs so WS callbacks always have latest values without reconnecting
  const selectedRef       = useRef(selected);
  const restingRef        = useRef(resting);
  const voiceEnabledRef   = useRef(voiceEnabled);

  useEffect(() => { selectedRef.current     = selected; },     [selected]);
  useEffect(() => { restingRef.current      = resting; },      [resting]);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  // ── Voice ─────────────────────────────────────────────────────────────────
  const speak = useCallback((text, force = false) => {
    if (!voiceEnabledRef.current || !window.speechSynthesis) return;
    const now = Date.now();
    if (!force && now - lastVoiceRef.current < VOICE_CD) return;
    if (text === lastFbRef.current && !force) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0; u.pitch = 1.0; u.volume = 1.0;
    window.speechSynthesis.speak(u);
    lastVoiceRef.current = now;
    lastFbRef.current    = text;
  }, []); // ✅ no deps — uses ref

  // ── Motivation ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selected || completed || resting) return;
    const id = setInterval(() => {
      if (!activePhaseRef.current) return;
      const now = Date.now();
      if (now - lastMotivateRef.current < MOTIVATE_INTV) return;
      speak(MOTIVATION[motivateIdxRef.current % MOTIVATION.length], true);
      motivateIdxRef.current++;
      lastMotivateRef.current = now;
    }, 3000);
    return () => clearInterval(id);
  }, [selected, completed, resting, speak]);

  // ── Rest timer ────────────────────────────────────────────────────────────
  const startRest = useCallback((secs) => {
    setResting(true);
    setRestLeft(secs);
    speak(`Set complete! Rest for ${secs} seconds.`, true);
    restIntervalRef.current = setInterval(() => {
      setRestLeft(prev => {
        if (prev <= 1) {
          clearInterval(restIntervalRef.current);
          setResting(false);
          speak("Rest done — start your next set!", true);
          return 0;
        }
        if (prev === 10) speak("10 seconds left!", true);
        return prev - 1;
      });
    }, 1000);
  }, [speak]);

  const skipRest = () => {
    clearInterval(restIntervalRef.current);
    setResting(false);
    setRestLeft(0);
    speak("Starting next set!", true);
  };

  useEffect(() => () => clearInterval(restIntervalRef.current), []);

  // ── Save exercise history ─────────────────────────────────────────────────
  const saveExerciseHistory = useCallback(async (ex, reps, formScore) => {
    if (!user?.id) return;
    try {
      await fetch(`${API}/exercise-history`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          user_id:       user.id,
          exercise_id:   ex.id,
          exercise_name: urlName ? decodeURIComponent(urlName) : ex.label,
          reps_done:     reps,
          sets_done:     1,
          form_score:    formScore,
        }),
      });
    } catch (e) { console.warn("Exercise history save failed", e); }
  }, [user, urlName]);

  // ── WebSocket — created ONCE, never recreated on exercise change ──────────
  const connectWS = useCallback(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;
    socket.onopen    = () => setConnected(true);

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setWsData(data);
        activePhaseRef.current = ACTIVE_PHASES.includes(data.phase);

        if (data.status === "active") {
          formScoreSumRef.current   += data.form_ok ? 100 : 50;
          formScoreCountRef.current += 1;
        }

        if (data.completed) {
          setCompleted(true);
          activePhaseRef.current = false;
          const avgForm = formScoreCountRef.current > 0
            ? Math.round(formScoreSumRef.current / formScoreCountRef.current)
            : 80;
          // ✅ Use refs — not stale closures
          const ex = selectedRef.current;
          if (ex) saveExerciseHistory(ex, data.rep_count, avgForm);
          startRest(ex?.restSecs ?? 60);
        }
      } catch (err) {
        console.warn("WS parse error:", err);
      }
    };

    socket.onclose = () => { setConnected(false); socketRef.current = null; };
    socket.onerror = () => setConnected(false);
  }, [saveExerciseHistory, startRest]); // ✅ no selected/speak deps

  // ✅ Connect ONCE on mount only
  useEffect(() => {
    connectWS();
    if (initialEx) setTimeout(() => speak(`Starting ${initialEx.label}. ${initialEx.tip}`, true), 1000);
    return () => socketRef.current?.close();
  }, []); // ✅ EMPTY deps — never reconnect unless explicitly called

  // ── Send landmarks every frame ────────────────────────────────────────────
  useEffect(() => {
    const landmarks = poseResults?.poseLandmarks;
    const socket    = socketRef.current;
    if (!landmarks || !socket || socket.readyState !== WebSocket.OPEN || !selected || resting) return;
    socket.send(JSON.stringify({
      exercise:    selected.id,
      target_reps: selected.reps,
      landmarks:   landmarks.map(lm => ({ x: lm.x, y: lm.y, z: lm.z, visibility: lm.visibility ?? 1 })),
    }));
  }, [poseResults, selected, resting]);

  // ── Voice feedback on data ────────────────────────────────────────────────
  useEffect(() => {
    if (!wsData || !selected || resting) return;
    const fb    = wsData.feedback?.[0];
    const phase = wsData.phase;
    const reps  = wsData.rep_count ?? 0;
    const tgt   = wsData.target    ?? 0;

    if (!wsData.form_ok && phase !== "idle") { speak(fb); return; }
    if (ACTIVE_PHASES.includes(phase) && phase === "up") {
      const left = tgt - reps;
      if (left <= 3 && left > 0)            speak(`${left} more — finish strong!`, true);
      else if (reps > 0 && reps % 5 === 0)  speak(`${reps} reps! Keep it going!`, true);
    }
    if (selected.id === "plank" && phase === "holding") {
      const rem = (wsData.set_target ?? 30) - (wsData.elapsed ?? 0);
      if (Math.abs(rem - 15) < 1.2) speak("Halfway — hold your position!", true);
      if (Math.abs(rem - 5)  < 1.2) speak("5 seconds — don't quit now!", true);
    }
  }, [wsData, selected, resting, speak]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelect = (ex) => {
    setSelected(ex); setCompleted(false); setWsData(null); setResting(false);
    setSetNumber(1); formScoreSumRef.current = 0; formScoreCountRef.current = 0;
    lastFbRef.current = ""; lastMotivateRef.current = 0;
    motivateIdxRef.current = 0; activePhaseRef.current = false;
    speak(`Starting ${ex.label}. ${ex.tip}`, true);
    // ✅ No reconnect needed — backend resets analyzer when exercise changes
  };

  const handleNextSet = () => {
    setCompleted(false); setWsData(null); setResting(false);
    formScoreSumRef.current = 0; formScoreCountRef.current = 0;
    lastFbRef.current = ""; activePhaseRef.current = false;
    setSetNumber(s => s + 1);
    // ✅ Reconnect to reset backend analyzer for next set
    socketRef.current?.close();
    setTimeout(connectWS, 300);
  };

  const handleReset = () => {
    setCompleted(false); setWsData(null); setResting(false); setSetNumber(1);
    clearInterval(restIntervalRef.current);
    formScoreSumRef.current = 0; formScoreCountRef.current = 0;
    lastFbRef.current = ""; activePhaseRef.current = false;
    socketRef.current?.close();
    setTimeout(connectWS, 300);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const repCount   = wsData?.rep_count   ?? 0;
  const target     = wsData?.target      ?? selected?.reps ?? 0;
  const phase      = wsData?.phase       ?? "idle";
  const formOk     = wsData?.form_ok     ?? true;
  const feedback   = wsData?.feedback    ?? [];
  const angle      = wsData?.angle       ?? 0;
  const angleLabel = wsData?.angle_label ?? "";
  const elapsed    = wsData?.elapsed     ?? 0;
  const setTarget  = wsData?.set_target  ?? 30;
  const progress   = target > 0 ? Math.min(100, (repCount / target) * 100) : 0;
  const isPlank    = selected?.id === "plank";
  const timerPct   = isPlank && phase === "holding" ? Math.min(100, (elapsed / setTarget) * 100) : 0;
  const isActive   = ACTIVE_PHASES.includes(phase);
  const restPct    = selected ? Math.min(100, ((selected.restSecs - restLeft) / selected.restSecs) * 100) : 0;
  const phaseColor = phase === "down" || phase === "holding" ? "bg-blue-500/80"
    : phase === "up"   ? "bg-emerald-500/80"
    : phase === "rest" ? "bg-amber-500/80"
    : "bg-gray-500/60";
  const filtered   = filter === "All" ? EXERCISES : EXERCISES.filter(e => e.category === filter);

  return (
    <div className="h-screen flex bg-background overflow-hidden font-sans">

      {/* Camera */}
      <div className="w-2/3 flex items-center justify-center bg-black relative border-r border-border">
        <CameraFeed onPoseResults={setPoseResults} />

        {selected && wsData?.status === "active" && !resting && (
          <div className="absolute top-6 left-6 flex gap-2">
            {!isPlank && (
              <div className="bg-black/60 text-white text-xs px-3.5 py-2 rounded-xl backdrop-blur-md border border-white/10 font-bold">
                {angleLabel}: <span className="font-extrabold text-primary font-display">{angle}°</span>
              </div>
            )}
            {isPlank && phase === "holding" && (
              <div className="bg-black/60 text-white text-xs px-3.5 py-2 rounded-xl backdrop-blur-md border border-white/10 font-bold">
                ⏱ <span className="font-extrabold text-primary font-display">{Math.ceil(setTarget - elapsed)}s</span>
              </div>
            )}
            <div className={`text-xs px-3.5 py-2 rounded-xl font-black uppercase tracking-wider backdrop-blur-md text-white border border-white/10 shadow-neon ${phaseColor}`}>
              {phase}
            </div>
          </div>
        )}

        {selected && !resting && (
          <div className="absolute top-6 right-6 bg-black/60 text-white text-xs px-3.5 py-2 rounded-xl backdrop-blur-md border border-white/10 font-extrabold uppercase tracking-wide">
            Set {setNumber}
          </div>
        )}

        {resting && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <p className="text-primary text-8xl font-black font-display mb-2 animate-pulse shadow-neon">{restLeft}</p>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-6">Rest Time Left</p>
            <button onClick={skipRest}
              className="bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest px-8 py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-neon">
              Skip Rest →
            </button>
          </div>
        )}

        {urlName && selected && !resting && (
          <div className="absolute bottom-16 right-6 bg-primary/90 text-primary-foreground text-xs px-3.5 py-2 rounded-xl backdrop-blur-md font-bold uppercase tracking-wider">
            📋 {decodeURIComponent(urlName)}
          </div>
        )}

        {selected && !formOk && phase !== "idle" && !resting && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-xs px-5 py-2.5 rounded-xl backdrop-blur border border-red-500/30 shadow-lg font-bold uppercase tracking-wider">
            ⚠️ {feedback[0]}
          </div>
        )}
        {selected && phase === "idle" && wsData && !resting && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-5 py-2.5 rounded-xl backdrop-blur border border-white/10 font-bold uppercase tracking-wider">
            {feedback[0] ?? "Get into position to begin"}
          </div>
        )}
      </div>

      {/* Panel */}
      <div className="w-1/3 bg-card flex flex-col overflow-hidden">

        <div className="px-5 py-5 border-b border-border flex justify-between items-center">
          <div className="text-left">
            <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Exercises</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-ping" : "bg-red-400"}`} />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{connected ? "Live" : "Disconnected"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { if (voiceEnabled) window.speechSynthesis?.cancel(); setVoiceEnabled(v => !v); }}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all duration-200
                ${voiceEnabled ? "bg-primary text-primary-foreground border-primary shadow-neon font-bold" : "bg-transparent text-muted-foreground border-border hover:bg-accent"}`}>
              {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
            </button>
            {selected && (
              <button onClick={handleReset}
                className="text-xs border border-border px-3 py-1.5 rounded-xl text-foreground font-bold hover:bg-accent transition">
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {!selected ? (
            <div className="space-y-4">
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setFilter(c)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all font-bold uppercase tracking-wider
                      ${filter === c ? "bg-primary text-primary-foreground border-primary shadow-neon" : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="space-y-2.5">
                {filtered.map(ex => (
                  <button key={ex.id} onClick={() => handleSelect(ex)}
                    className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/60 hover:bg-primary/5 hover:-translate-y-0.5 transition-all duration-200 text-left group">
                    <span className="text-3xl bg-muted/40 p-2.5 rounded-xl flex items-center justify-center">{ex.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{ex.label}</p>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">{ex.category}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-1">
                        {ex.muscle} · {ex.id === "plank" ? `${ex.reps} sets × 30s` : `${ex.reps} reps`} · {ex.restSecs}s rest
                      </p>
                    </div>
                    <span className="text-muted-foreground group-hover:text-primary font-bold group-hover:translate-x-0.5 transition-all">→</span>
                  </button>
                ))}
              </div>
            </div>

          ) : resting ? (
            <div className="text-center py-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Rest Period — Set {setNumber} Done</p>
              <div className="relative w-36 h-36 mx-auto mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--border))" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${2 * Math.PI * 44 * (restPct / 100)}`}
                    className="transition-all duration-1000"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-4xl font-black font-display text-primary">{restLeft}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">seconds</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-6">Recover well to perform your best</p>
              <button onClick={skipRest}
                className="bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-xl hover:opacity-90 transition w-full shadow-neon">
                Start Set {setNumber + 1} Now →
              </button>
            </div>

          ) : completed ? (
            <div className="text-center py-8">
              <p className="text-6xl mb-4">🏆</p>
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-1">Set {setNumber} Complete!</h3>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight">{selected.label}</p>
              <p className="text-2xl font-black text-primary font-display mt-2 mb-6">
                {isPlank ? `${repCount} holds` : `${repCount} reps completed`}
              </p>
              <div className="flex flex-col gap-2.5">
                <button onClick={handleNextSet}
                  className="bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest py-3.5 rounded-xl hover:opacity-90 shadow-neon transition">
                  Next Set ({setNumber + 1})
                </button>
                <button onClick={() => { setSelected(null); handleReset(); }}
                  className="border border-border text-muted-foreground text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-accent transition">
                  Change Exercise
                </button>
              </div>
            </div>

          ) : (
            <div className="space-y-4 text-left font-sans">

              <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl p-4">
                <span className="text-3xl bg-card p-2 rounded-xl flex items-center justify-center border border-border/40">{selected.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-foreground uppercase tracking-tight text-sm truncate">{selected.label}</p>
                    <span className="text-[9px] font-bold bg-primary text-primary-foreground uppercase tracking-wider px-2 py-0.5 rounded-full shadow-neon">Set {setNumber}</span>
                  </div>
                  {urlName && <p className="text-[10px] text-primary/70 font-semibold uppercase tracking-wider mt-0.5">{decodeURIComponent(urlName)}</p>}
                  <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-normal">💡 {selected.tip}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-xs text-primary font-extrabold uppercase hover:underline">Change</button>
              </div>

              {isPlank ? (
                <div className="bg-card border border-border rounded-2xl p-5 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">SET {Math.min(repCount + 1, target)} OF {target}</p>
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--border))" strokeWidth="8"/>
                      <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 44}`}
                        strokeDashoffset={`${2 * Math.PI * 44 * (1 - timerPct / 100)}`}
                        className="transition-all duration-1000"/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-4xl font-black font-display text-primary">
                        {phase === "holding" ? Math.ceil(setTarget - elapsed) : setTarget}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">seconds</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground uppercase tracking-tight">
                    {phase === "rest" ? "Rest — get back in position" :
                     phase === "holding" ? "HOLD THE POSITION!" : "GET IN PLANK POSITION"}
                  </p>
                  <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: target }).map((_, i) => (
                      <div key={i} className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-black
                        ${i < repCount ? "bg-emerald-500 text-white"
                          : i === repCount ? "bg-primary text-primary-foreground shadow-neon"
                          : "bg-muted border border-border text-muted-foreground"}`}>
                        {i < repCount ? "✓" : i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-5 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">REPS COMPLETED</p>
                  <p className={`text-7xl font-black font-display tracking-tight transition-colors ${isActive ? "text-primary shadow-neon" : "text-muted-foreground"}`}>
                    {repCount}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground">of {target}</p>
                  <div className="mt-5 h-3 bg-muted rounded-full overflow-hidden border border-border/40">
                    <div className="h-full bg-primary rounded-full transition-all duration-300 shadow-neon"
                      style={{ width: `${progress}%` }} />
                  </div>
                  {isActive && target - repCount <= 3 && repCount > 0 && (
                    <p className="text-xs font-bold text-primary animate-bounce uppercase tracking-wider mt-3">🔥 {target - repCount} more to go!</p>
                  )}
                  {!isActive && <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-3">Ready to track form</p>}
                </div>
              )}

              <div className={`rounded-2xl p-4 border transition-colors ${
                !isActive ? "bg-muted/40 border-border text-muted-foreground"
                : formOk   ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                :             "bg-red-500/10 border-red-500/20 text-red-500"}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${
                  !isActive ? "text-muted-foreground" : formOk ? "text-emerald-500" : "text-red-500"}`}>
                  {!isActive ? "⏳ Waiting" : formOk ? "✓ Good Form" : "⚠️ Correction Required"}
                </p>
                {feedback.map((f, i) => (
                  <p key={i} className="text-sm font-semibold tracking-tight leading-relaxed">{f}</p>
                ))}
              </div>

              {!isPlank && angleLabel && isActive && (
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{angleLabel}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-black font-display text-foreground leading-none">{angle}°</p>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden border border-border/40">
                      <div className="h-full bg-primary rounded-full transition-all duration-200 shadow-neon"
                        style={{ width: `${Math.min(100, Math.abs(angle) / 1.8)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}