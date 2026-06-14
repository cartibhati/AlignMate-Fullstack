// src/pages/ExercisePage.jsx
import { useState, useEffect, useRef, useCallback, useContext, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import CameraFeed from "@/components/camera/CameraFeed";
import { AuthContext } from "@/context/AuthContext";
import VoiceCoachSettings from "@/components/posture/VoiceCoachSettings";
import InteractiveJointSimulator from "@/components/posture/InteractiveJointSimulator";

import { API_BASE_URL, WS_BASE_URL } from "@/config";

const API = `${API_BASE_URL}/auth`;

const EXERCISES = [
  { id: "squat",          label: "Back Squat",      icon: "🏋️", muscle: "Legs",          reps: 10, tip: "Side view, full body in frame",    category: "Compound",  restSecs: 90 },
  { id: "goblet_squat",   label: "Goblet Squat",    icon: "🏋️", muscle: "Legs & Glutes",   reps: 10, tip: "Hold weight at chest, full body in frame", category: "Compound", restSecs: 90, baseId: "squat" },
  { id: "sumo_squat",     label: "Sumo Squat",      icon: "🏋️", muscle: "Legs & Adductors", reps: 10, tip: "Wide stance, toes pointed out", category: "Compound", restSecs: 90, baseId: "squat" },
  { id: "bodyweight_squat", label: "Bodyweight Squat", icon: "🏋️", muscle: "Legs", reps: 15, tip: "No weights, hands forward, squat deep", category: "Compound", restSecs: 45, baseId: "squat" },
  { id: "pushup",         label: "Pushup",          icon: "💪", muscle: "Chest",         reps: 10, tip: "Side view, full body visible",      category: "Compound",  restSecs: 60 },
  { id: "diamond_pushup", label: "Diamond Pushup",  icon: "💪", muscle: "Triceps & Chest",   reps: 10, tip: "Hands close together forming a diamond", category: "Compound", restSecs: 60, baseId: "pushup" },
  { id: "decline_pushup", label: "Decline Pushup",  icon: "💪", muscle: "Upper Chest",     reps: 10, tip: "Feet elevated, hands on floor", category: "Compound", restSecs: 60, baseId: "pushup" },
  { id: "pike_pushup",      label: "Pike Pushup",      icon: "💪", muscle: "Shoulders & Chest", reps: 10, tip: "Hips high, head down towards floor", category: "Compound", restSecs: 60, baseId: "pushup" },
  { id: "incline_pushup",   label: "Incline Pushup",   icon: "💪", muscle: "Lower Chest", reps: 12, tip: "Hands elevated on surface, body straight", category: "Compound", restSecs: 60, baseId: "pushup" },
  { id: "deadlift",       label: "Deadlift",        icon: "⚡", muscle: "Back & Legs",   reps: 8,  tip: "Side view essential",              category: "Compound",  restSecs: 120 },
  { id: "romanian_deadlift", label: "Romanian Deadlift", icon: "⚡", muscle: "Hamstrings & Glutes", reps: 8, tip: "Hinge at hips, keep back straight", category: "Compound", restSecs: 120, baseId: "deadlift" },
  { id: "single_leg_deadlift", label: "Single Leg Deadlift", icon: "⚡", muscle: "Hamstrings & Balance", reps: 10, tip: "Hinge on one leg, keep hips square", category: "Compound", restSecs: 60, baseId: "deadlift" },
  { id: "bench_press",    label: "Bench Press",     icon: "🏋️", muscle: "Chest",         reps: 10, tip: "Side view, lay flat",              category: "Compound",  restSecs: 90 },
  { id: "incline_press",  label: "Incline Press",   icon: "🏋️", muscle: "Upper Chest",     reps: 10, tip: "30-45 degree incline, lay back", category: "Compound", restSecs: 90, baseId: "bench_press" },
  { id: "incline_dumbbell_press", label: "Incline Dumbbell Press", icon: "🏋️", muscle: "Upper Chest", reps: 10, tip: "Dumbbells in hands, incline bench", category: "Compound", restSecs: 90, baseId: "bench_press" },
  { id: "barbell_row",    label: "Barbell Row",     icon: "🔄", muscle: "Back",          reps: 10, tip: "Side view, hinge at hips",         category: "Compound",  restSecs: 90 },
  { id: "dumbbell_row",   label: "Dumbbell Row",    icon: "🔄", muscle: "Back & Lats",   reps: 10, tip: "Hinge forward, pull weight to ribcage", category: "Compound", restSecs: 90, baseId: "barbell_row" },
  { id: "lat_pulldown",     label: "Lat Pulldown",     icon: "🔄", muscle: "Lats & Back", reps: 10, tip: "Pull bar to upper chest, squeeze lats", category: "Compound", restSecs: 90, baseId: "barbell_row" },
  { id: "face_pulls",       label: "Face Pulls",       icon: "🔄", muscle: "Rear Delts & Upper Back", reps: 15, tip: "Pull rope towards ears and squeeze", category: "Isolation", restSecs: 45 },
  { id: "lunge",          label: "Lunge",           icon: "🦵", muscle: "Legs & Glutes", reps: 10, tip: "Side view, full body visible",      category: "Compound",  restSecs: 60 },
  { id: "reverse_lunge",  label: "Reverse Lunge",   icon: "🦵", muscle: "Legs & Hips",   reps: 10, tip: "Step backward, keep front knee stable", category: "Compound", restSecs: 60, baseId: "lunge" },
  { id: "hip_thrust",     label: "Hip Thrust",      icon: "🍑", muscle: "Glutes",        reps: 12, tip: "Side view, lay back on bench",     category: "Compound",  restSecs: 60 },
  { id: "glute_bridge",   label: "Glute Bridge",    icon: "🍑", muscle: "Glutes & Core",   reps: 12, tip: "Squeeze glutes at top, lay on floor", category: "Compound", restSecs: 60, baseId: "hip_thrust" },
  { id: "bicep_curl",     label: "Bicep Curl",      icon: "💪", muscle: "Biceps",        reps: 12, tip: "Face camera or slight angle",      category: "Isolation", restSecs: 45 },
  { id: "hammer_curl",    label: "Hammer Curl",     icon: "💪", muscle: "Biceps & Forearms", reps: 12, tip: "Neutral grip, palms facing inward", category: "Isolation", restSecs: 45, baseId: "bicep_curl" },
  { id: "lateral_raise",  label: "Lateral Raise",   icon: "🙌", muscle: "Shoulders",    reps: 12, tip: "Face camera directly",             category: "Isolation", restSecs: 45 },
  { id: "shoulder_press", label: "Shoulder Press",  icon: "🔝", muscle: "Shoulders",    reps: 10, tip: "Face camera or slight angle",      category: "Isolation", restSecs: 60 },
  { id: "arnold_press",   label: "Arnold Press",    icon: "🔝", muscle: "Shoulders",    reps: 10, tip: "Rotate palms from facing you to facing away", category: "Isolation", restSecs: 60, baseId: "shoulder_press" },
  { id: "tricep_dip",     label: "Tricep Dip",      icon: "💪", muscle: "Triceps",       reps: 10, tip: "Side view, bars on either side",   category: "Isolation", restSecs: 45 },
  { id: "tricep_extension", label: "Tricep Extension", icon: "💪", muscle: "Triceps",       reps: 10, tip: "Keep elbows close to head, extend overhead", category: "Isolation", restSecs: 45, baseId: "tricep_dip" },
  { id: "plank_shoulder_taps", label: "Plank Shoulder Taps", icon: "🧘", muscle: "Core & Shoulders", reps: 20, tip: "Tap opposite shoulder in plank position", category: "Core", restSecs: 45, baseId: "plank" },
  { id: "plank",          label: "Plank",           icon: "🧘", muscle: "Core",          reps: 3,  tip: "Side view, hold 30s × 3 sets",     category: "Core",      restSecs: 30 },
  { id: "leg_press",        label: "Leg Press",        icon: "🏋️", muscle: "Quads & Glutes", reps: 10, tip: "Push platform away, don't lock knees", category: "Compound", restSecs: 90, baseId: "squat" },
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

const KEYWORD_MAP = {
  "bench": "bench_press", "chest press": "bench_press", "incline press": "bench_press",
  "decline": "bench_press", "dumbbell press": "bench_press",
  "incline dumbbell press": "incline_dumbbell_press",
  "squat": "squat", "goblet": "squat", "box squat": "squat",
  "leg press": "leg_press",
  "bodyweight squat": "bodyweight_squat",
  "deadlift": "deadlift", "romanian": "deadlift", "rdl": "deadlift", "sumo": "deadlift",
  "single leg deadlift": "single_leg_deadlift",
  "row": "barbell_row", "bent over": "barbell_row", "cable row": "barbell_row",
  "lat pulldown": "lat_pulldown", "pulldown": "lat_pulldown",
  "face pull": "face_pulls", "facepull": "face_pulls",
  "overhead press": "shoulder_press", "shoulder press": "shoulder_press",
  "military press": "shoulder_press", "ohp": "shoulder_press", "arnold": "shoulder_press",
  "push-up": "pushup", "push up": "pushup", "pushup": "pushup",
  "pike pushup": "pike_pushup", "pike push-up": "pike_pushup",
  "incline pushup": "incline_pushup", "incline push-up": "incline_pushup",
  "lunge": "lunge", "split squat": "lunge", "bulgarian": "lunge", "step up": "lunge",
  "plank shoulder taps": "plank_shoulder_taps", "shoulder tap": "plank_shoulder_taps",
  "plank": "plank",
  "curl": "bicep_curl", "bicep": "bicep_curl", "hammer curl": "bicep_curl",
  "lateral": "lateral_raise", "side raise": "lateral_raise",
  "dip": "tricep_dip", "tricep": "tricep_dip", "skull crusher": "tricep_dip",
  "pushdown": "tricep_dip",
  "hip thrust": "hip_thrust", "glute bridge": "hip_thrust", "hip bridge": "hip_thrust",
};

function mapExerciseName(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  let best = null, bestLen = 0;
  for (const [kw, id] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(kw) && kw.length > bestLen) {
      best = id;
      bestLen = kw.length;
    }
  }
  return best;
}

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

  const [plan, setPlan]                 = useState(null);
  const [selectedDay, setSelectedDay]   = useState(0);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // ── Circuit Playback States ──
  const [circuitMode, setCircuitMode]     = useState(false);
  const [circuitIndex, setCircuitIndex]   = useState(0);
  const [circuitState, setCircuitState]   = useState("prep"); // prep | active | rest | complete
  const [circuitTimer, setCircuitTimer]   = useState(5);

  // Compute daily exercise list from AI plan
  const circuitExercises = useMemo(() => {
    if (!plan) return [];
    const list = plan.weekly_plan?.[selectedDay]?.exercises ?? [];
    return list.map(item => {
      const mappedId = mapExerciseName(item.name);
      const exDef = mappedId ? EXERCISES.find(e => e.id === mappedId) : null;
      if (!exDef) return null;
      return { 
        ...exDef, 
        reps: parseInt(item.reps) || 10, 
        sets: parseInt(item.sets) || 3,
        restSecs: 10 // Force 10 seconds rest for fast circuit transitions
      };
    }).filter(Boolean);
  }, [plan, selectedDay]);

  useEffect(() => {
    if (user?.id) {
      const cached = localStorage.getItem(`alignmate_plan_${user.id}`);
      if (cached) {
        try {
          const parsedPlan = JSON.parse(cached);
          setPlan(parsedPlan);
          const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
          const days = parsedPlan.weekly_plan ?? [];
          const idx = days.findIndex(d => d.day?.toLowerCase() === todayName);
          if (idx !== -1) {
            setSelectedDay(idx);
          }
        } catch (e) {
          console.warn("Error loading cached plan:", e);
        }
      }
    }
  }, [user?.id]);

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
  const completedRef      = useRef(completed);

  useEffect(() => { selectedRef.current     = selected; },     [selected]);
  useEffect(() => { restingRef.current      = resting; },      [resting]);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);
  useEffect(() => { completedRef.current    = completed; },    [completed]);

  // ── Voice ─────────────────────────────────────────────────────────────────
  const speak = useCallback((text, force = false) => {
    if (!voiceEnabledRef.current || !window.speechSynthesis) return;
    const now = Date.now();
    if (!force && now - lastVoiceRef.current < VOICE_CD) return;
    if (text === lastFbRef.current && !force) return;
    const saved = localStorage.getItem("alignmate_voice_settings");
    let settings = { rate: 1.0, pitch: 1.0, volume: 1.0, voiceName: "" };
    if (saved) {
      try { settings = JSON.parse(saved); } catch (e) {}
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = settings.rate ?? 1.0;
    u.pitch = settings.pitch ?? 1.0;
    u.volume = settings.volume ?? 1.0;
    if (settings.voiceName && window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === settings.voiceName);
      if (selectedVoice) u.voice = selectedVoice;
    }
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
        credentials: "include",
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

  // ── Circuit Playback Handlers ──
  const handleCircuitTransition = useCallback(() => {
    setCircuitState(currState => {
      if (currState === "prep") {
        setCircuitTimer(30);
        speak(`Go! Perform ${selectedRef.current?.label || "the exercise"} for 30 seconds.`, true);
        setCompleted(false);
        setWsData(null);
        formScoreSumRef.current = 0;
        formScoreCountRef.current = 0;
        activePhaseRef.current = true;
        return "active";
      } else if (currState === "active") {
        const reps = wsData?.rep_count ?? 0;
        const avgForm = formScoreCountRef.current > 0
          ? Math.round(formScoreSumRef.current / formScoreCountRef.current)
          : 90;
        
        if (selectedRef.current) {
          saveExerciseHistory(selectedRef.current, reps, avgForm);
        }
        
        setCircuitTimer(10);
        speak("Time is up. Rest for 10 seconds.", true);
        activePhaseRef.current = false;
        return "rest";
      } else if (currState === "rest") {
        // Find next exercise
        let foundNext = false;
        let nextIdx = 0;
        
        setCircuitIndex(currIdx => {
          if (currIdx + 1 < circuitExercises.length) {
            foundNext = true;
            nextIdx = currIdx + 1;
            return nextIdx;
          }
          return currIdx;
        });

        if (foundNext) {
          setSelected(circuitExercises[nextIdx]);
          setCircuitTimer(5);
          speak(`Next exercise: ${circuitExercises[nextIdx].label}. Get ready.`, true);
          return "prep";
        } else {
          setCircuitTimer(0);
          speak("Congratulations! You have completed your daily workout circuit. Great job!", true);
          
          // Mark today as completed in calendar
          const todayStr = new Date().toISOString().split('T')[0];
          const calKey = `alignmate_calendar_${user?.email}`;
          try {
            const completedDays = JSON.parse(localStorage.getItem(calKey) ?? "[]");
            if (!completedDays.includes(todayStr)) {
              completedDays.push(todayStr);
              localStorage.setItem(calKey, JSON.stringify(completedDays));
            }
          } catch (e) {}
          return "complete";
        }
      }
      return currState;
    });
  }, [circuitExercises, user?.email, saveExerciseHistory, speak, wsData]);

  useEffect(() => {
    if (!circuitMode) return;
    
    const interval = setInterval(() => {
      setCircuitTimer(prev => {
        if (prev <= 1) {
          handleCircuitTransition();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [circuitMode, handleCircuitTransition]);

  const startCircuit = () => {
    if (circuitExercises.length === 0) return;
    setCircuitMode(true);
    setCircuitIndex(0);
    setSelected(circuitExercises[0]);
    setCircuitState("prep");
    setCircuitTimer(5);
    speak(`Starting daily circuit. First exercise: ${circuitExercises[0].label}. Get ready.`, true);
  };

  const exitCircuit = () => {
    setCircuitMode(false);
    setSelected(null);
    handleReset();
  };

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

        if (data.completed && !completedRef.current) {
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
      exercise:    selected.baseId || selected.id,
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

        {circuitMode && circuitState === "prep" && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
            <p className="text-primary text-8xl font-black font-display mb-2 animate-pulse shadow-neon">{circuitTimer}</p>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-6">Preparing Next Exercise</p>
            {selected && (
              <div className="max-w-md bg-white/5 border border-white/10 rounded-2xl p-6">
                <span className="text-4xl mb-3 block">{selected.icon}</span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{selected.label}</h3>
                <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">{selected.muscle}</p>
                <p className="text-xs text-white/70 mt-3 leading-relaxed">💡 {selected.tip}</p>
              </div>
            )}
            <button
              onClick={handleCircuitTransition}
              className="mt-8 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest px-8 py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-neon"
            >
              Skip Prep →
            </button>
          </div>
        )}

        {circuitMode && circuitState === "rest" && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
            <p className="text-amber-500 text-8xl font-black font-display mb-2 animate-pulse shadow-neon">{circuitTimer}</p>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-6">Rest Time Left</p>
            
            {circuitIndex + 1 < circuitExercises.length && circuitExercises[circuitIndex + 1] ? (
              <div className="max-w-md bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-2">Up Next</p>
                <span className="text-4xl mb-3 block">{circuitExercises[circuitIndex + 1].icon}</span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{circuitExercises[circuitIndex + 1].label}</h3>
                <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">{circuitExercises[circuitIndex + 1].muscle}</p>
              </div>
            ) : (
              <p className="text-sm font-semibold text-white/60">Final exercise complete! Getting ready to finish.</p>
            )}

            <button
              onClick={handleCircuitTransition}
              className="mt-8 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest px-8 py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-neon"
            >
              Skip Rest →
            </button>
          </div>
        )}

        {circuitMode && circuitState === "complete" && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
            <p className="text-6xl mb-4 animate-bounce">🏆</p>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Circuit Complete!</h3>
            <p className="text-sm text-white/60 max-w-md mb-8 leading-relaxed">
              Fantastic work! You successfully powered through today's daily exercise circuit split and completed your training session.
            </p>
            <button
              onClick={exitCircuit}
              className="bg-emerald-500 text-white text-xs font-black uppercase tracking-widest px-8 py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-neon"
            >
              Finish & Return to Catalog
            </button>
          </div>
        )}

        {circuitMode && circuitState === "active" && (
          <div className="absolute top-6 left-6 flex gap-2 z-10">
            <div className="bg-emerald-500 text-white text-xs px-3.5 py-2 rounded-xl backdrop-blur-md border border-emerald-500/30 font-black animate-pulse shadow-neon">
              ⏱ {circuitTimer}s
            </div>
            <div className="bg-black/60 text-white text-xs px-3.5 py-2 rounded-xl backdrop-blur-md border border-white/10 font-black">
              Exercise {circuitIndex + 1}/{circuitExercises.length}
            </div>
          </div>
        )}

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
        {circuitMode ? (
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Circuit Header */}
            <div className="px-5 py-5 border-b border-border flex justify-between items-center bg-card">
              <div className="text-left">
                <h2 className="text-sm font-black uppercase tracking-widest text-primary">Daily Circuit</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-ping" : "bg-red-400"}`} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Exercise {circuitIndex + 1} of {circuitExercises.length}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5 items-center">
                <button onClick={() => { if (voiceEnabled) window.speechSynthesis?.cancel(); setVoiceEnabled(v => !v); }}
                  className={`text-xs px-3 py-2.5 rounded-xl border transition-all duration-200
                    ${voiceEnabled ? "bg-primary text-primary-foreground border-primary shadow-neon font-bold" : "bg-transparent text-muted-foreground border-border hover:bg-accent"}`}>
                  {voiceEnabled ? "🔊 On" : "🔇 Off"}
                </button>
                <VoiceCoachSettings />
                <button
                  onClick={exitCircuit}
                  className="text-xs border border-red-500/30 hover:border-red-500/80 px-3.5 py-2.5 rounded-xl text-red-500 font-extrabold uppercase transition"
                >
                  Exit Circuit ✕
                </button>
              </div>
            </div>

            {/* Circuit Panel Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {circuitState === "prep" && selected && (
                <div className="space-y-4 text-left">
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Up Next</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl bg-card p-2 rounded-xl flex items-center justify-center border border-border/40">{selected.icon}</span>
                      <div>
                        <p className="font-extrabold text-foreground uppercase tracking-tight text-sm">{selected.label}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">{selected.muscle}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium mt-3 leading-relaxed">💡 {selected.tip}</p>
                  </div>

                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preview Form</p>
                  <InteractiveJointSimulator exerciseId={selected.baseId || selected.id} />
                  
                  <button
                    onClick={handleCircuitTransition}
                    className="w-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:opacity-90 transition shadow-neon animate-bounce"
                  >
                    Start Exercise Now →
                  </button>
                </div>
              )}

              {circuitState === "active" && selected && (
                <div className="space-y-4 text-left">
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl bg-card p-2 rounded-xl flex items-center justify-center border border-border/40">{selected.icon}</span>
                      <div>
                        <p className="font-extrabold text-foreground uppercase tracking-tight text-sm">{selected.label}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">{selected.muscle}</p>
                      </div>
                    </div>
                  </div>

                  <InteractiveJointSimulator exerciseId={selected.baseId || selected.id} />

                  <div className="bg-card border border-border rounded-2xl p-5 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">REPS DETECTED</p>
                    <p className="text-7xl font-black font-display tracking-tight text-primary shadow-neon">
                      {repCount}
                    </p>
                    <div className="mt-5 h-3 bg-muted rounded-full overflow-hidden border border-border/40">
                      <div className="h-full bg-primary rounded-full transition-all duration-300 shadow-neon"
                        style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className={`rounded-2xl p-4 border transition-colors ${
                    !isActive ? "bg-muted/40 border-border text-muted-foreground"
                    : formOk   ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    :             "bg-red-500/10 border-red-500/20 text-red-500"}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${
                      !isActive ? "text-muted-foreground" : formOk ? "text-emerald-500" : "text-red-500"}`}>
                      {!isActive ? "⏳ Get into Position" : formOk ? "✓ Good Form" : "⚠️ Correction"}
                    </p>
                    {feedback.map((f, i) => (
                      <p key={i} className="text-sm font-semibold tracking-tight leading-relaxed">{f}</p>
                    ))}
                  </div>
                </div>
              )}

              {circuitState === "rest" && (
                <div className="space-y-4 text-left">
                  {circuitIndex + 1 < circuitExercises.length ? (
                    <>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Resting</p>
                        <p className="text-sm font-semibold text-foreground leading-normal">
                          Catch your breath. Grab some water if you need it.
                        </p>
                      </div>

                      {circuitExercises[circuitIndex + 1] && (
                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Coming Up Next</p>
                          <div className="flex items-center gap-3">
                            <span className="text-3xl bg-card p-2 rounded-xl flex items-center justify-center border border-border/40">
                              {circuitExercises[circuitIndex + 1].icon}
                            </span>
                            <div>
                              <p className="font-extrabold text-foreground uppercase tracking-tight text-sm">
                                {circuitExercises[circuitIndex + 1].label}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">
                                {circuitExercises[circuitIndex + 1].muscle}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Next Form Preview</p>
                      {circuitExercises[circuitIndex + 1] && (
                        <InteractiveJointSimulator exerciseId={circuitExercises[circuitIndex + 1].baseId || circuitExercises[circuitIndex + 1].id} />
                      )}

                      <button
                        onClick={handleCircuitTransition}
                        className="w-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:opacity-90 transition shadow-neon"
                      >
                        Skip Rest →
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-6xl mb-3">🔥</p>
                      <p className="font-bold text-foreground text-sm uppercase tracking-tight">Last Rest Period</p>
                      <p className="text-xs text-muted-foreground mt-2">Finish this rest and your session will be saved!</p>
                    </div>
                  )}
                </div>
              )}

              {circuitState === "complete" && (
                <div className="space-y-4 text-center py-6">
                  <p className="text-6xl animate-bounce">🎉</p>
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Workout Complete!</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You have successfully completed today's daily circuit workout splits. All exercises have been saved to your progress dashboard.
                  </p>
                  <button
                    onClick={exitCircuit}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:opacity-90 transition shadow-neon"
                  >
                    Finish & Return to Catalog
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col overflow-hidden">
            <div className="px-5 py-5 border-b border-border flex justify-between items-center">
              <div className="text-left">
                <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Exercises</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-ping" : "bg-red-400"}`} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{connected ? "Live" : "Disconnected"}</span>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap items-center">
                <button onClick={() => { if (voiceEnabled) window.speechSynthesis?.cancel(); setVoiceEnabled(v => !v); }}
                  className={`text-xs px-3 py-2.5 rounded-xl border transition-all duration-200
                    ${voiceEnabled ? "bg-primary text-primary-foreground border-primary shadow-neon font-bold" : "bg-transparent text-muted-foreground border-border hover:bg-accent"}`}>
                  {voiceEnabled ? "🔊 On" : "🔇 Off"}
                </button>
                <VoiceCoachSettings />
                {selected && (
                  <button onClick={handleReset}
                    className="text-xs border border-border px-3 py-2.5 rounded-xl text-foreground font-bold hover:bg-accent transition">
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {!selected ? (
                <div className="space-y-5">
                  {/* AI Plan Section */}
                  {plan ? (
                    <div className="space-y-4">
                      {/* Horizontal Day Switcher */}
                      <div className="grid grid-cols-7 gap-1">
                        {(plan.weekly_plan ?? []).map((d, i) => {
                          const isToday = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === d.day?.toLowerCase();
                          const rest = !d.exercises?.length;
                          return (
                            <button
                              key={i}
                              onClick={() => setSelectedDay(i)}
                              className={`flex flex-col items-center py-2.5 px-0.5 rounded-xl border transition-all text-center duration-200
                                ${selectedDay === i 
                                  ? "bg-primary text-primary-foreground border-primary shadow-neon" 
                                  : rest 
                                  ? "bg-muted/20 border-border text-muted-foreground/50" 
                                  : "bg-card border-border text-foreground hover:border-primary/40"}`}
                            >
                              <p className="font-extrabold text-[10px] uppercase leading-none">{d.day?.slice(0, 3)}</p>
                              {isToday && (
                                <span className="text-[7px] font-black uppercase tracking-tight text-primary mt-1 px-1 bg-primary-foreground/90 rounded leading-tight">Today</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Day Info */}
                      {plan.weekly_plan?.[selectedDay] && (
                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
                          <p className="font-black text-foreground uppercase text-sm tracking-tight">
                            {plan.weekly_plan[selectedDay].day} Routine
                          </p>
                          <p className="text-xs text-primary font-bold uppercase tracking-wider mt-0.5">
                            Focus: {plan.weekly_plan[selectedDay].focus || "Rest Day"}
                          </p>
                        </div>
                      )}

                      {/* Start Daily Circuit Button */}
                      {circuitExercises.length > 0 && (
                        <button
                          onClick={startCircuit}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:opacity-90 transition shadow-neon"
                        >
                          🔥 Start Daily Circuit ({circuitExercises.length} Exercises)
                        </button>
                      )}

                      {/* Scheduled Exercises */}
                      <div className="space-y-2.5">
                        {!plan.weekly_plan?.[selectedDay]?.exercises?.length ? (
                          <div className="bg-card rounded-2xl border border-border p-8 text-center">
                            <p className="text-4xl mb-2">😴</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rest Day Recovery</p>
                          </div>
                        ) : (
                          plan.weekly_plan[selectedDay].exercises.map((planEx, idx) => {
                            const mappedId = mapExerciseName(planEx.name);
                            const exDef = mappedId ? EXERCISES.find(e => e.id === mappedId) : null;

                            return (
                              <div
                                key={idx}
                                className="bg-card rounded-2xl border border-border p-4 hover:border-primary/30 transition-all duration-200 text-left"
                              >
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl bg-muted/40 p-2 rounded-xl flex items-center justify-center">
                                      {exDef?.icon ?? "🏋️"}
                                    </span>
                                    <div>
                                      <p className="font-extrabold text-foreground text-sm uppercase tracking-tight">
                                        {planEx.name}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">
                                        {planEx.sets} sets · {planEx.reps} reps · {planEx.rest} rest
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                {planEx.tip && (
                                  <p className="text-[10px] text-muted-foreground bg-muted/20 rounded-lg p-2 mt-2 leading-relaxed">
                                    💡 {planEx.tip}
                                  </p>
                                )}

                                {exDef ? (
                                  <button
                                    onClick={() => handleSelect(exDef)}
                                    className="w-full mt-3 bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider py-2.5 rounded-xl hover:opacity-90 transition shadow-neon"
                                  >
                                    📷 Start Posture Tracker
                                  </button>
                                ) : (
                                  <p className="text-[10px] text-muted-foreground italic mt-2.5 px-1 font-medium">
                                    Posture tracking not supported for this activity
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    /* No Plan Banner */
                    <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-5 text-center">
                      <span className="text-4xl">🤖</span>
                      <h3 className="text-sm font-black text-foreground uppercase tracking-tight mt-2.5">Personalized AI Workout Plan</h3>
                      <p className="text-xs text-muted-foreground mt-1.5 mb-4 leading-relaxed">
                        Generate a full weekly training and nutrition plan customized for your goals.
                      </p>
                      <a
                        href="/plan"
                        className="inline-block bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl shadow-neon hover:opacity-95 transition"
                      >
                        Generate Plan 🚀
                      </a>
                    </div>
                  )}

                  {/* Collapsible Catalog Divider */}
                  <div className="border-t border-border/60 pt-4">
                    <button
                      onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                      className="w-full flex justify-between items-center bg-muted/40 hover:bg-muted/80 px-4 py-3 rounded-xl border border-border/50 text-xs font-black uppercase tracking-wider text-muted-foreground transition-all"
                    >
                      <span>{isCatalogOpen ? "▼" : "▶"} Explore All Catalog Exercises ({EXERCISES.length})</span>
                    </button>
                  </div>

                  {/* General exercises list */}
                  {(!plan || isCatalogOpen) && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex gap-1 mb-1 flex-wrap">
                        {CATEGORIES.map(c => (
                          <button
                            key={c}
                            onClick={() => setFilter(c)}
                            className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-all font-bold uppercase tracking-wider
                              ${filter === c 
                                ? "bg-primary text-primary-foreground border-primary shadow-neon" 
                                : "bg-transparent border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2.5">
                        {filtered.map(ex => (
                          <button
                            key={ex.id}
                            onClick={() => handleSelect(ex)}
                            className="w-full flex items-center gap-3.5 p-3.5 bg-card border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-left group"
                          >
                            <span className="text-2xl bg-muted/30 p-2 rounded-xl flex items-center justify-center">{ex.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-foreground text-xs uppercase tracking-tight group-hover:text-primary transition-colors">{ex.label}</p>
                                <span className="text-[8px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">{ex.category}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-medium mt-1">
                                {ex.muscle} · {ex.id === "plank" ? `${ex.reps} sets × 30s` : `${ex.reps} reps`} · {ex.restSecs}s rest
                              </p>
                            </div>
                            <span className="text-muted-foreground group-hover:text-primary font-bold group-hover:translate-x-0.5 transition-all">→</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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

                  {/* 3D Rotatable Skeleton Biomechanics Simulation */}
                  <InteractiveJointSimulator exerciseId={selected.baseId || selected.id} />

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
        )}
      </div>
    </div>
  );
}