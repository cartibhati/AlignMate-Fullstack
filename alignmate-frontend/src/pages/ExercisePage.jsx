// src/pages/ExercisePage.jsx
import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import CameraFeed from "@/components/camera/CameraFeed";
import { AuthContext } from "@/context/AuthContext";

const API = "http://localhost:8000/auth";

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
const WS_URL        = "ws://localhost:8000/ws/exercise";
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
    <div className="h-screen flex bg-gray-50 overflow-hidden">

      {/* Camera */}
      <div className="w-2/3 flex items-center justify-center bg-black relative">
        <CameraFeed onPoseResults={setPoseResults} />

        {selected && wsData?.status === "active" && !resting && (
          <div className="absolute top-4 left-4 flex gap-2">
            {!isPlank && (
              <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-xl backdrop-blur">
                {angleLabel}: <span className="font-bold">{angle}</span>
              </div>
            )}
            {isPlank && phase === "holding" && (
              <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-xl backdrop-blur">
                ⏱ <span className="font-bold">{Math.ceil(setTarget - elapsed)}s</span>
              </div>
            )}
            <div className={`text-xs px-3 py-1.5 rounded-xl font-semibold backdrop-blur text-white ${phaseColor}`}>
              {phase.toUpperCase()}
            </div>
          </div>
        )}

        {selected && !resting && (
          <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-xl backdrop-blur">
            Set {setNumber}
          </div>
        )}

        {resting && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <p className="text-white text-6xl font-black mb-2">{restLeft}</p>
            <p className="text-white/70 text-sm mb-6">Rest time</p>
            <button onClick={skipRest}
              className="bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-100 transition">
              Skip Rest →
            </button>
          </div>
        )}

        {urlName && selected && !resting && (
          <div className="absolute bottom-16 right-4 bg-indigo-600/80 text-white text-xs px-3 py-1.5 rounded-xl backdrop-blur">
            📋 {decodeURIComponent(urlName)}
          </div>
        )}

        {selected && !formOk && phase !== "idle" && !resting && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-sm px-5 py-2 rounded-xl backdrop-blur font-medium">
            ⚠️ {feedback[0]}
          </div>
        )}
        {selected && phase === "idle" && wsData && !resting && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800/80 text-white text-sm px-5 py-2 rounded-xl backdrop-blur">
            {feedback[0] ?? "Get into position to begin"}
          </div>
        )}
      </div>

      {/* Panel */}
      <div className="w-1/3 bg-white border-l border-gray-100 flex flex-col overflow-hidden">

        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Exercises</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-400"}`} />
              <span className="text-xs text-gray-400">{connected ? "Live" : "Disconnected"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { if (voiceEnabled) window.speechSynthesis?.cancel(); setVoiceEnabled(v => !v); }}
              className={`text-xs px-3 py-1.5 rounded-xl border transition
                ${voiceEnabled ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-300"}`}>
              {voiceEnabled ? "🔊" : "🔇"}
            </button>
            {selected && (
              <button onClick={handleReset}
                className="text-xs border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition">
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {!selected ? (
            <div>
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setFilter(c)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition font-medium
                      ${filter === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {filtered.map(ex => (
                  <button key={ex.id} onClick={() => handleSelect(ex)}
                    className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition text-left group">
                    <span className="text-2xl">{ex.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm group-hover:text-indigo-700">{ex.label}</p>
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">{ex.category}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {ex.muscle} · {ex.id === "plank" ? `${ex.reps} sets × 30s` : `${ex.reps} reps`} · {ex.restSecs}s rest
                      </p>
                    </div>
                    <span className="text-gray-300 group-hover:text-indigo-400">→</span>
                  </button>
                ))}
              </div>
            </div>

          ) : resting ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Rest Period — Set {setNumber} Done</p>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#f59e0b" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${2 * Math.PI * 44 * (restPct / 100)}`}
                    className="transition-all duration-1000"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-black text-amber-500">{restLeft}</p>
                  <p className="text-xs text-gray-400">sec</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">Recover — next set starts when you're ready</p>
              <button onClick={skipRest}
                className="bg-indigo-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition w-full">
                I'm Ready — Start Set {setNumber + 1} →
              </button>
            </div>

          ) : completed ? (
            <div className="text-center py-8">
              <p className="text-5xl mb-4">✅</p>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Set {setNumber} Complete!</h3>
              <p className="text-sm text-gray-500 mb-1">{selected.label}</p>
              <p className="text-xs text-gray-400 mb-6">
                {isPlank ? `${repCount} holds` : `${repCount} reps`}
              </p>
              <div className="flex gap-2 justify-center">
                <button onClick={handleNextSet}
                  className="bg-indigo-600 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition">
                  Next Set ({setNumber + 1})
                </button>
                <button onClick={() => { setSelected(null); handleReset(); }}
                  className="border border-gray-200 text-gray-600 text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 transition">
                  Change Exercise
                </button>
              </div>
            </div>

          ) : (
            <div className="space-y-4">

              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                <span className="text-3xl">{selected.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-indigo-800">{selected.label}</p>
                    <span className="text-xs bg-indigo-100 text-indigo-500 px-2 py-0.5 rounded-full">Set {setNumber}</span>
                  </div>
                  {urlName && <p className="text-xs text-indigo-300">{decodeURIComponent(urlName)}</p>}
                  <p className="text-xs text-indigo-400">{selected.tip}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-xs text-indigo-400 hover:text-indigo-600">Change</button>
              </div>

              {isPlank ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
                  <p className="text-xs text-gray-400 mb-3">SET {Math.min(repCount + 1, target)} OF {target}</p>
                  <div className="relative w-28 h-28 mx-auto mb-3">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="44" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                      <circle cx="50" cy="50" r="44" fill="none" stroke="#6366f1" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 44}`}
                        strokeDashoffset={`${2 * Math.PI * 44 * (1 - timerPct / 100)}`}
                        className="transition-all duration-1000"/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-3xl font-black text-indigo-600">
                        {phase === "holding" ? Math.ceil(setTarget - elapsed) : setTarget}
                      </p>
                      <p className="text-xs text-gray-400">sec</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {phase === "rest" ? "Rest — get back in position" :
                     phase === "holding" ? "Hold your plank!" : "Get into plank position"}
                  </p>
                  <div className="flex justify-center gap-2 mt-3">
                    {Array.from({ length: target }).map((_, i) => (
                      <div key={i} className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold
                        ${i < repCount ? "bg-emerald-500 text-white"
                          : i === repCount ? "bg-indigo-200 text-indigo-700"
                          : "bg-gray-100 text-gray-400"}`}>
                        {i < repCount ? "✓" : i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
                  <p className="text-xs text-gray-400 mb-2">REPS</p>
                  <p className={`text-6xl font-black transition-colors ${isActive ? "text-indigo-600" : "text-gray-300"}`}>
                    {repCount}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">of {target}</p>
                  <div className="mt-4 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }} />
                  </div>
                  {isActive && target - repCount <= 3 && repCount > 0 && (
                    <p className="text-xs text-indigo-500 font-semibold mt-2">🔥 {target - repCount} more!</p>
                  )}
                  {!isActive && <p className="text-xs text-gray-400 mt-2">Get into position to begin</p>}
                </div>
              )}

              <div className={`rounded-2xl p-4 border ${
                !isActive ? "bg-gray-50 border-gray-100"
                : formOk   ? "bg-emerald-50 border-emerald-100"
                :             "bg-red-50 border-red-100"}`}>
                <p className={`text-xs font-semibold mb-2 ${
                  !isActive ? "text-gray-500" : formOk ? "text-emerald-600" : "text-red-600"}`}>
                  {!isActive ? "⏳ Waiting" : formOk ? "✅ Form" : "⚠️ Fix Form"}
                </p>
                {feedback.map((f, i) => (
                  <p key={i} className={`text-sm ${
                    !isActive ? "text-gray-500" : formOk ? "text-emerald-700" : "text-red-700"}`}>{f}</p>
                ))}
              </div>

              {!isPlank && angleLabel && isActive && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">{angleLabel}</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-bold text-gray-800">{angle}</p>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-indigo-500 rounded-full transition-all"
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