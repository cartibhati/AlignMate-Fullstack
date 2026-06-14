import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { getSessions, clearSessions } from "@/services/sessionStorage";
import SessionCard from "@/components/dashboard/SessionCard";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/config";
import {
  GraduationCap, Activity, Dumbbell, ClipboardList, Calendar,
  User, FlaskConical, Info, Flame, ChevronRight, BarChart2, History, Trash2, ShieldAlert
} from "lucide-react";

const API = `${API_BASE_URL}/auth`;

// ── Progress Chart Component ────────────────────────────────────────────────
function ProgressChart({ sessions }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);
  if (sessions.length < 2) return null;

  const W = 600, H = 200;
  const PAD = { top: 20, right: 24, bottom: 40, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;
  const scores = sessions.map(s => s.avgScore);
  const minY   = Math.max(0,   Math.min(...scores) - 10);
  const maxY   = Math.min(100, Math.max(...scores) + 10);
  const xPos   = (i) => PAD.left + (i / (sessions.length - 1)) * chartW;
  const yPos   = (v) => PAD.top  + chartH - ((v - minY) / (maxY - minY)) * chartH;
  const linePath = sessions.map((s, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(s.avgScore)}`).join(" ");
  const areaPath = `M ${xPos(0)} ${PAD.top + chartH} ` +
    sessions.map((s, i) => `L ${xPos(i)} ${yPos(s.avgScore)}`).join(" ") +
    ` L ${xPos(sessions.length - 1)} ${PAD.top + chartH} Z`;
  const dotColor = (s) => s >= 75 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444";
  const gridLines = [25, 50, 75, 100].filter(v => v >= minY && v <= maxY);

  return (
    <div className="relative w-full" style={{ maxWidth: W }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible"
        onMouseLeave={() => setTooltip(null)}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {gridLines.map(v => (
          <g key={v}>
            <line x1={PAD.left} y1={yPos(v)} x2={PAD.left+chartW} y2={yPos(v)} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4"/>
            <text x={PAD.left-8} y={yPos(v)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="hsl(var(--muted-foreground))" className="font-semibold font-sans">{v}%</text>
          </g>
        ))}
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)" />
        {sessions.map((s, i) => {
          const cx = xPos(i), cy = yPos(s.avgScore), color = dotColor(s.avgScore);
          return (
            <g key={s.id} onMouseEnter={() => setTooltip({ session: s, cx, cy })} style={{ cursor: "pointer" }}>
              <circle cx={cx} cy={cy} r={16} fill="transparent" />
              <circle cx={cx} cy={cy} r={7} fill="hsl(var(--card))" stroke={color} strokeWidth="2.5" />
              <circle cx={cx} cy={cy} r={3.5} fill={color} />
              <text x={cx} y={PAD.top+chartH+16} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" className="font-bold font-sans">#{i+1}</text>
            </g>
          );
        })}
        {tooltip && <line x1={tooltip.cx} y1={PAD.top} x2={tooltip.cx} y2={PAD.top+chartH} stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"/>}
      </svg>
      {tooltip && (() => {
        const s = tooltip.session;
        const goodPct = s.duration > 0 ? Math.max(0, Math.round(((s.duration - s.badDuration) / s.duration) * 100)) : 100;
        return (
          <div className="absolute z-10 bg-black/90 border border-white/10 text-white rounded-xl px-3 py-2.5 text-xs shadow-neon pointer-events-none backdrop-blur-md"
            style={{ left: `${(tooltip.cx/W)*100}%`, top: `${((tooltip.cy-20)/H)*100}%`, transform: "translate(-50%,-100%)", minWidth: 150 }}>
            <p className="font-black text-sm mb-1 text-primary">{s.avgScore}%</p>
            <p className="text-gray-300 font-medium text-[11px]">{s.date} · {s.time}</p>
            <div className="mt-1.5 pt-1.5 border-t border-white/10 grid grid-cols-2 gap-x-3 font-semibold text-[10px]">
              <span className="text-gray-400">Good alignment</span>
              <span className="text-right text-emerald-400">{goodPct}%</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Exercise History Card Component ──────────────────────────────────────────
function ExerciseHistoryCard({ record }) {
  const formColor = record.formScore >= 80 ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : record.formScore >= 60 ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
    : "text-red-500 bg-red-500/10 border-red-500/20";

  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 transition-all duration-200 hover:border-primary/45 hover:scale-[1.01]">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
        💪
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-bold text-foreground text-sm truncate uppercase tracking-tight">{record.exerciseName}</p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">{record.date} · {record.time}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-black text-foreground font-display">{record.repsDone} reps</p>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border mt-1 inline-block ${formColor}`}>
          {record.formScore}% form
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user }  = useContext(AuthContext);
  const navigate  = useNavigate();
  const email     = user?.email ?? "";

  const [sessions, setSessions]           = useState([]);
  const [sessionsLoading, setLoading]     = useState(true);
  const [exerciseHistory, setExHistory]   = useState([]);
  const [exLoading, setExLoading]         = useState(true);
  
  const [isChartsOpen, setIsChartsOpen]   = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab]         = useState("posture"); // posture | exercise
  const [confirmClear, setConfirmClear]   = useState(false);
  const [isSeeding, setIsSeeding]         = useState(false);

  const handleLoadDemoData = async () => {
    if (!user?.id) return;
    setIsSeeding(true);
    try {
      const response = await fetch(`${API}/seed-demo-data/${user.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      if (response.ok) {
        // Seed local storage calendar streak dates as well (to keep UI aligned)
        const mockCalendarDates = [1, 2, 4, 6, 7, 10, 11, 13, 14].map(daysAgo => {
          const d = new Date();
          d.setDate(d.getDate() - daysAgo);
          return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        });
        localStorage.setItem(`alignmate_calendar_${email}`, JSON.stringify(mockCalendarDates));

        // Re-fetch data
        setLoading(true);
        setExLoading(true);
        const data = await getSessions(email);
        setSessions(data);
        setLoading(false);
        
        const exRes = await fetch(`${API}/exercise-history/${user.id}`, { credentials: "include" });
        const exData = await exRes.json();
        setExHistory(Array.isArray(exData) ? exData : []);
        setExLoading(false);
      }
    } catch (e) {
      console.error("Failed to seed demo data", e);
      setLoading(false);
      setExLoading(false);
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    getSessions(email).then(data => { setSessions(data); setLoading(false); });

    if (user?.id) {
      fetch(`${API}/exercise-history/${user.id}`, { credentials: "include" })
        .then(r => r.json())
        .then(data => { setExHistory(Array.isArray(data) ? data : []); setExLoading(false); })
        .catch(() => setExLoading(false));
    } else {
      setExLoading(false);
    }
  }, [email, user?.id]);

  const totalSessions = sessions.length;
  const avgScore      = totalSessions ? Math.round(sessions.reduce((s, x) => s + x.avgScore, 0) / totalSessions) : 0;
  const bestScore     = totalSessions ? Math.max(...sessions.map(x => x.avgScore)) : 0;
  const totalMins     = Math.round(sessions.reduce((s, x) => s + (x.duration ?? 0), 0) / 60);
  const totalBadMins  = Math.round(sessions.reduce((s, x) => s + (x.badDuration ?? 0), 0) / 60);
  const chartData     = [...sessions].reverse().slice(-7);

  // Exercise stats
  const totalExSets   = exerciseHistory.length;
  const totalExReps   = exerciseHistory.reduce((s, x) => s + x.repsDone, 0);
  const avgFormScore  = totalExSets
    ? Math.round(exerciseHistory.reduce((s, x) => s + x.formScore, 0) / totalExSets)
    : 0;
  const uniqueEx      = [...new Set(exerciseHistory.map(x => x.exerciseId))].length;

  const trendMsg = (() => {
    if (chartData.length < 2) return null;
    const diff = chartData[chartData.length-1].avgScore - chartData[0].avgScore;
    if (diff > 5)  return { text: "📈 Improving!", color: "text-emerald-500" };
    if (diff < -5) return { text: "📉 Scores dipping", color: "text-red-500" };
    return           { text: "➡️ Consistent", color: "text-gray-400" };
  })();

  const plan      = JSON.parse(localStorage.getItem(`alignmate_plan_${user?.id}`) ?? "null");
  const profile   = user?.profile;
  const calKey    = `alignmate_calendar_${email}`;
  const completed = JSON.parse(localStorage.getItem(calKey) ?? "[]");
  const streak    = (() => {
    if (!completed.length) return 0;
    const sorted = [...completed].sort().reverse();
    let s = 0, check = new Date();
    for (let i = 0; i < 365; i++) {
      const k = `${check.getFullYear()}-${String(check.getMonth()+1).padStart(2,"0")}-${String(check.getDate()).padStart(2,"0")}`;
      if (sorted.includes(k)) { s++; check.setDate(check.getDate()-1); } else break;
    }
    return s;
  })();

  const handleClear = async () => { await clearSessions(email); setSessions([]); setConfirmClear(false); };

  // ── Workspace widgets specifications ──────────────────────────────────────
  const WIDGETS = [
    {
      title: "Student Posture",
      desc: "Sitting & desk posture tracking with ergonomics checklists and Pomodoro timers.",
      icon: GraduationCap,
      color: "border-sky-500/20 text-sky-400 hover:border-sky-400/45 shadow-[0_0_15px_-4px_rgba(56,189,248,0.25)]",
      action: () => navigate("/live?mode=student"),
      badge: "🎓 Study Mode",
      status: `Checklist completed: ${completed.length > 0 ? "Active" : "Ready"}`
    },
    {
      title: "Athlete Posture",
      desc: "High-precision athletic posture checks tailored to movement form calibration.",
      icon: Activity,
      color: "border-primary/20 text-primary hover:border-primary/45 shadow-[0_0_15px_-4px_rgba(204,255,0,0.25)]",
      action: () => navigate("/live?mode=athlete"),
      badge: "🏋️ Athlete Mode",
      status: `Avg Score: ${avgScore > 0 ? `${avgScore}%` : "No data"}`
    },
    {
      title: "Exercises Routine",
      desc: "Check off your daily plan exercises and track posture form via camera.",
      icon: Dumbbell,
      color: "border-red-500/20 text-red-400 hover:border-red-400/45 shadow-[0_0_15px_-4px_rgba(239,68,68,0.25)]",
      action: () => navigate("/exercise"),
      badge: "💪 Workout Hinge",
      status: `${totalExSets} sets tracked`
    },
    {
      title: "My AI Plan",
      desc: "Personalized weekly splits, target reps, sets, and macro nutritional breakdowns.",
      icon: ClipboardList,
      color: "border-orange-500/20 text-orange-400 hover:border-orange-400/45 shadow-[0_0_15px_-4px_rgba(249,115,22,0.25)]",
      action: () => navigate("/plan"),
      badge: "📋 AI Coach Split",
      status: plan ? "Plan generated" : "Plan not generated"
    },
    {
      title: "Streaks & Calendar",
      desc: "Track completed daily workouts, view streaks fire, and review consistency grids.",
      icon: Calendar,
      color: "border-purple-500/20 text-purple-400 hover:border-purple-400/45 shadow-[0_0_15px_-4px_rgba(168,85,247,0.25)]",
      action: () => navigate("/calendar"),
      badge: "🔥 Streak Grid",
      status: `${streak} day streak`
    },
    {
      title: "Body Profile Stats",
      desc: "Manage height, weight, experience levels, and calculated body mass index.",
      icon: User,
      color: "border-slate-500/20 text-slate-300 hover:border-slate-400/45 shadow-[0_0_15px_-4px_rgba(148,163,184,0.25)]",
      action: () => navigate("/profile"),
      badge: "👤 Parameters",
      status: profile ? `Height: ${profile.height_cm}cm` : "Profile incomplete"
    },
    {
      title: "Research Science",
      desc: "Understand postural biomechanics, ergonomics, and long-term spinal science studies.",
      icon: FlaskConical,
      color: "border-emerald-500/20 text-emerald-400 hover:border-emerald-400/45 shadow-[0_0_15px_-4px_rgba(16,185,129,0.25)]",
      action: () => navigate("/research"),
      badge: "🔬 Biomechanics",
      status: "3 journals loaded"
    },
    {
      title: "About Coach",
      desc: "Meet AlignMate computer vision algorithms and offline fallback triggers.",
      icon: Info,
      color: "border-pink-500/20 text-pink-400 hover:border-pink-400/45 shadow-[0_0_15px_-4px_rgba(236,72,153,0.25)]",
      action: () => navigate("/about"),
      badge: "ℹ️ Overview",
      status: "Version 3.2.0"
    }
  ];

  return (
    <div className="min-h-screen bg-[#08080a] bg-grid font-sans text-white text-left pb-16">
      
      {/* Ambient background glows */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header section */}
      <div className="bg-[#12141c]/50 border-b border-white/5 px-6 md:px-10 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                Workspace Portal
              </span>
              {streak > 0 && (
                <span className="text-xs bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                  <Flame size={12} /> {streak} Day Streak
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mt-3">
              Welcome Back, {user?.name ?? "User"}
            </h1>
            <p className="text-xs text-gray-400 font-semibold mt-1">
              Select an interactive widget below to launch posture diagnostics, workout logs, or AI planning.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Seeding Demo Data Banner */}
        {sessions.length === 0 && exerciseHistory.length === 0 && !sessionsLoading && !exLoading && (
          <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-neon shadow-sm">
            <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
            
            <div className="relative z-10 space-y-2 max-w-xl text-left">
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-primary">
                ⚡ Demo Workspace Mode
              </div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                Seed Realistic Workout & Posture Data
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                AlignMate runs state-of-the-art computer vision models. To see how your biomechanics charts, weekly performance heatmaps, and streak grids animate, seed 15 days of mock fitness records instantly!
              </p>
            </div>
            
            <button
              onClick={handleLoadDemoData}
              disabled={isSeeding}
              className="relative z-10 w-full md:w-auto bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl shadow-neon hover:scale-[1.03] transition-all flex-shrink-0 disabled:opacity-50"
            >
              {isSeeding ? "Generative Seeding..." : "Load Demo Data ⚡"}
            </button>
          </div>
        )}

        {/* ── SPORTY STATS SUMMARY GRID ── */}
        {(totalSessions > 0 || totalExSets > 0) && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            
            {/* Posture Card */}
            <div className="bg-[#121216]/80 border border-white/5 rounded-3xl p-5 md:p-6 relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Avg Posture</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl md:text-4xl font-black text-primary font-display text-neon-glow">{avgScore > 0 ? `${avgScore}%` : "0%"}</span>
                <span className="text-xs text-emerald-400 font-bold">Good</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-semibold">Best session: {bestScore}%</p>
            </div>

            {/* Time Card */}
            <div className="bg-[#121216]/80 border border-white/5 rounded-3xl p-5 md:p-6 relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Focused Sitting</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl md:text-4xl font-black text-white font-display">{totalMins}m</span>
                <span className="text-xs text-gray-400 font-bold">total</span>
              </div>
              <p className="text-[10px] text-red-400 mt-2 font-semibold">{totalBadMins}m slouching detected</p>
            </div>

            {/* Exercise Card */}
            <div className="bg-[#121216]/80 border border-white/5 rounded-3xl p-5 md:p-6 relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors pointer-events-none" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Training Form</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl md:text-4xl font-black text-white font-display text-neon-glow" style={{ textShadow: "0 0 10px rgba(239,68,68,0.2)" }}>{avgFormScore}%</span>
                <span className="text-xs text-primary font-bold">Form</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-semibold">{totalExSets} sets · {totalExReps} reps</p>
            </div>

            {/* Streak Card */}
            <div className="bg-[#121216]/80 border border-white/5 rounded-3xl p-5 md:p-6 relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors pointer-events-none" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Streak</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl md:text-4xl font-black text-orange-500 font-display animate-pulse">🔥 {streak}d</span>
                <span className="text-xs text-orange-400 font-bold">streak</span>
              </div>
              <p className="text-[10px] text-orange-300 mt-2 font-semibold">Keep pushing limits!</p>
            </div>

          </div>
        )}

        {/* Dynamic AI Plan Prompt Banner */}
        {!plan && (
          <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-left shadow-2xl">
            <div>
              <p className="font-extrabold text-white text-sm uppercase tracking-tight">🤖 No active AI workout plan generated</p>
              <p className="text-xs text-gray-400 mt-1">Complete your onboarding parameters to unlock structured posture routines.</p>
            </div>
            <button
              onClick={() => navigate(profile ? "/plan" : "/onboarding")}
              className="bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-neon hover:opacity-90 transition-all flex-shrink-0"
            >
              Configure Plan 🚀
            </button>
          </div>
        )}

        {/* Dynamic Activity Heatmap */}
        <ActivityHeatmap sessions={sessions} completedWorkouts={completed} />

        {/* ── INTERACTIVE WORKSPACE WIDGETS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WIDGETS.map((widget, i) => {
            const Icon = widget.icon;
            return (
              <motion.button
                key={i}
                onClick={widget.action}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`flex flex-col justify-between p-6 bg-[#12141c] border rounded-3xl text-left transition-all duration-300 relative group cursor-pointer ${widget.color}`}
              >
                {/* Accent glow on hover */}
                <div className="absolute inset-0 bg-white/[0.01] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-3 bg-[#08080a] border border-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <Icon size={20} />
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-white/5 bg-black/40 text-gray-400">
                      {widget.badge}
                    </span>
                  </div>

                  <h3 className="font-black text-white uppercase tracking-tight text-sm mb-1.5 flex items-center gap-1 group-hover:text-primary transition-colors">
                    {widget.title} <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </h3>
                  
                  <p className="text-gray-400 text-xs font-semibold leading-relaxed">
                    {widget.desc}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-3.5 mt-5 flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  <span>Status</span>
                  <span className="text-white/80">{widget.status}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* ── EXPANDABLE PROGRESS CHARTS WIDGET ── */}
        {chartData.length > 1 && (
          <div className="border border-white/5 rounded-3xl bg-[#12141c] overflow-hidden">
            <button
              onClick={() => setIsChartsOpen(!isChartsOpen)}
              className="w-full flex justify-between items-center px-6 py-4 bg-black/20 hover:bg-black/40 text-left transition-all border-b border-white/5"
            >
              <div className="flex items-center gap-2.5">
                <BarChart2 size={18} className="text-primary" />
                <span className="font-black uppercase tracking-wider text-xs text-white">View Biomechanics Analytics Charts</span>
              </div>
              <span className="text-xs text-gray-400">{isChartsOpen ? "Close ▲" : "Expand ▼"}</span>
            </button>

            {isChartsOpen && (
              <div className="p-6 space-y-6 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-white">Score Progress Timeline</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Last {chartData.length} sessions diagnostic history</p>
                  </div>
                  {trendMsg && (
                    <span className={`text-xs font-bold uppercase tracking-wider ${trendMsg.color}`}>
                      Trend: {trendMsg.text}
                    </span>
                  )}
                </div>

                <div className="flex justify-center bg-[#08080a] border border-white/5 p-6 rounded-2xl">
                  <ProgressChart sessions={chartData} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EXPANDABLE DETAILED HISTORY LOGS ── */}
        <div className="border border-white/5 rounded-3xl bg-[#12141c] overflow-hidden">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="w-full flex justify-between items-center px-6 py-4 bg-black/20 hover:bg-black/40 text-left transition-all border-b border-white/5"
          >
            <div className="flex items-center gap-2.5">
              <History size={18} className="text-primary" />
              <span className="font-black uppercase tracking-wider text-xs text-white">View Full History & Logs</span>
            </div>
            <span className="text-xs text-gray-400">{isHistoryOpen ? "Close ▲" : "Expand ▼"}</span>
          </button>

          {isHistoryOpen && (
            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex gap-2.5 border-b border-white/5 pb-4">
                {[
                  { id: "posture",  label: "🧘 Posture Log" },
                  { id: "exercise", label: "💪 Exercise Log" },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200
                      ${activeTab === t.id 
                        ? "bg-primary text-primary-foreground shadow-neon" 
                        : "bg-[#08080a] border border-white/5 text-gray-400 hover:border-primary/45 hover:text-white"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Posture logs history */}
              {activeTab === "posture" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Diagnostic Records</p>
                    {totalSessions > 0 && (
                      <button
                        onClick={() => setConfirmClear(true)}
                        className="text-xs text-red-500 hover:text-red-400 font-bold transition flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Clear all history
                      </button>
                    )}
                  </div>

                  {sessionsLoading ? (
                    <div className="text-center py-6">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    </div>
                  ) : totalSessions === 0 ? (
                    <div className="text-center py-10 bg-[#08080a] rounded-2xl border border-white/5">
                      <p className="text-3xl mb-2">🪑</p>
                      <p className="text-xs font-bold text-gray-400">No sessions recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-2">
                      {sessions.map((s, idx) => (
                        <SessionCard key={s.id} session={s} index={idx} total={totalSessions} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Exercise logs history */}
              {activeTab === "exercise" && (
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Training Reps Logs</p>
                  
                  {exLoading ? (
                    <div className="text-center py-6">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    </div>
                  ) : exerciseHistory.length === 0 ? (
                    <div className="text-center py-10 bg-[#08080a] rounded-2xl border border-white/5">
                      <p className="text-3xl mb-2">🏋️</p>
                      <p className="text-xs font-bold text-gray-400">No training sets recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-2">
                      {exerciseHistory.map(r => (
                        <ExerciseHistoryCard key={r.id} record={r} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Clear Confirmation Modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#12141c] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-left">
            <h3 className="font-black text-white text-lg mb-1.5 uppercase tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-red-500" /> Clear all history?
            </h3>
            <p className="text-xs text-gray-400 font-semibold mb-6">This action is permanent. All posture tracking logs will be deleted from your database.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClear(false)}
                className="flex-1 border border-white/5 hover:bg-white/5 rounded-xl py-3 text-xs font-bold text-gray-400 transition-all">Cancel</button>
              <button onClick={handleClear}
                className="flex-1 bg-red-500 text-white hover:bg-red-600 rounded-xl py-3 text-xs font-bold shadow-lg shadow-red-500/20 transition-all">Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}