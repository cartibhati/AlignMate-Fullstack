import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { getSessions, clearSessions } from "@/services/sessionStorage";
import SessionCard from "@/components/dashboard/SessionCard";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000/auth";

// ── Chart ─────────────────────────────────────────────────────────────────────
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
  const fmt = (s) => !s ? "0s" : s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;

  return (
    <div className="relative w-full" style={{ maxWidth: W }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible"
        onMouseLeave={() => setTooltip(null)}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {gridLines.map(v => (
          <g key={v}>
            <line x1={PAD.left} y1={yPos(v)} x2={PAD.left+chartW} y2={yPos(v)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4"/>
            <text x={PAD.left-8} y={yPos(v)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#9ca3af">{v}%</text>
          </g>
        ))}
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)" />
        {sessions.map((s, i) => {
          const cx = xPos(i), cy = yPos(s.avgScore), color = dotColor(s.avgScore);
          return (
            <g key={s.id} onMouseEnter={() => setTooltip({ session: s, cx, cy })} style={{ cursor: "pointer" }}>
              <circle cx={cx} cy={cy} r={16} fill="transparent" />
              <circle cx={cx} cy={cy} r={7} fill="white" stroke={color} strokeWidth="2.5" />
              <circle cx={cx} cy={cy} r={3.5} fill={color} />
              <text x={cx} y={PAD.top+chartH+16} textAnchor="middle" fontSize="9" fill="#9ca3af">#{i+1}</text>
            </g>
          );
        })}
        {tooltip && <line x1={tooltip.cx} y1={PAD.top} x2={tooltip.cx} y2={PAD.top+chartH} stroke="#6366f1" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>}
      </svg>
      {tooltip && (() => {
        const s = tooltip.session;
        const goodPct = s.duration > 0 ? Math.max(0, Math.round(((s.duration - s.badDuration) / s.duration) * 100)) : 100;
        return (
          <div className="absolute z-10 bg-gray-900 text-white rounded-xl px-3 py-2.5 text-xs shadow-xl pointer-events-none"
            style={{ left: `${(tooltip.cx/W)*100}%`, top: `${((tooltip.cy-20)/H)*100}%`, transform: "translate(-50%,-100%)", minWidth: 140 }}>
            <p className="font-bold text-sm mb-1">{s.avgScore}%</p>
            <p className="text-gray-300">{s.date} · {s.time}</p>
            <div className="mt-1.5 pt-1.5 border-t border-gray-700 grid grid-cols-2 gap-x-3">
              <span className="text-gray-400">Good time</span>
              <span className="text-right text-emerald-400">{goodPct}%</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-1">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold ${color || "text-gray-800"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Exercise History Card ─────────────────────────────────────────────────────
function ExerciseHistoryCard({ record }) {
  const formColor = record.formScore >= 80 ? "text-emerald-600 bg-emerald-50"
    : record.formScore >= 60 ? "text-amber-500 bg-amber-50"
    : "text-red-500 bg-red-50";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
        💪
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{record.exerciseName}</p>
        <p className="text-xs text-gray-400">{record.date} · {record.time}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-700">{record.repsDone} reps</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${formColor}`}>
          {record.formScore}% form
        </span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }  = useContext(AuthContext);
  const navigate  = useNavigate();
  const email     = user?.email ?? "";

  const [sessions, setSessions]           = useState([]);
  const [sessionsLoading, setLoading]     = useState(true);
  const [exerciseHistory, setExHistory]   = useState([]);
  const [exLoading, setExLoading]         = useState(true);
  const [activeTab, setActiveTab]         = useState("posture"); // posture | exercise
  const [confirmClear, setConfirmClear]   = useState(false);

  useEffect(() => {
    getSessions(email).then(data => { setSessions(data); setLoading(false); });

    // ✅ Load exercise history
    if (user?.id) {
      fetch(`${API}/exercise-history/${user.id}`)
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
    if (diff > 5)  return { text: "📈 Improving!", color: "text-emerald-600" };
    if (diff < -5) return { text: "📉 Scores dipping.", color: "text-red-500" };
    return           { text: "➡️ Consistent.", color: "text-gray-500" };
  })();

  const scoreColor = (s) => s >= 75 ? "text-emerald-600" : s >= 50 ? "text-amber-500" : "text-red-500";

  const handleClear = async () => { await clearSessions(email); setSessions([]); setConfirmClear(false); };

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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.name ?? "User"}'s Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">Posture history &amp; progress</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/calendar")}
              className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition">
              📅 {streak > 0 && <span className="text-orange-500">🔥{streak}</span>}
            </button>
            <button onClick={() => navigate("/live")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
              + New Session
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-8">

        {/* Plan CTA */}
        {plan ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-indigo-800 text-sm">📋 Your workout plan is ready</p>
              <p className="text-xs text-indigo-500 mt-0.5">View your weekly split, exercises and diet</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate("/calendar")}
                className="text-xs border border-indigo-300 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100 transition">📅 Calendar</button>
              <button onClick={() => navigate("/plan")}
                className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">View Plan →</button>
            </div>
          </div>
        ) : !profile ? (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-amber-800 text-sm">👤 Complete your profile</p>
              <p className="text-xs text-amber-500 mt-0.5">Set your goals to get a personalized plan</p>
            </div>
            <button onClick={() => navigate("/onboarding")}
              className="text-xs bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition">
              Complete Profile →
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-indigo-800 text-sm">🤖 Get your AI workout + diet plan</p>
              <p className="text-xs text-indigo-500 mt-0.5">Personalized for your goals</p>
            </div>
            <button onClick={() => navigate("/plan")}
              className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
              Generate Plan 🚀
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: "posture",  label: "🧘 Posture Sessions" },
            { id: "exercise", label: "💪 Exercise History" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition
                ${activeTab === t.id ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── POSTURE TAB ── */}
        {activeTab === "posture" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Sessions"   value={totalSessions}   color="text-gray-800" />
              <StatCard label="Avg Score"  value={`${avgScore}%`}  color={scoreColor(avgScore)} />
              <StatCard label="Best Score" value={`${bestScore}%`} color={scoreColor(bestScore)} />
              <StatCard label="Total Time" value={`${totalMins}m`} color="text-gray-800"
                sub={totalBadMins > 0 ? `${totalBadMins}m bad posture` : "No bad posture logged"} />
            </div>

            {chartData.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800">Score Progress</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Last {chartData.length} sessions</p>
                  </div>
                  {trendMsg && <span className={`text-xs font-medium ${trendMsg.color}`}>{trendMsg.text}</span>}
                </div>
                <ProgressChart sessions={chartData} />
                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
                  {[
                    { color: "bg-emerald-400", label: "Good (75%+)" },
                    { color: "bg-amber-400",   label: "Fair (50–74%)" },
                    { color: "bg-red-400",     label: "Poor (<50%)" },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-xs text-gray-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-gray-800">Session History</h2>
                {totalSessions > 0 && (
                  <button onClick={() => setConfirmClear(true)} className="text-xs text-red-400 hover:text-red-600 transition">
                    Clear history
                  </button>
                )}
              </div>

              {sessionsLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Loading sessions...</p>
                </div>
              ) : totalSessions === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <p className="text-4xl mb-3">🪑</p>
                  <p className="font-semibold text-gray-600">No sessions yet</p>
                  <button onClick={() => navigate("/live")}
                    className="mt-5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl">
                    Start first session
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s, i) => (
                    <SessionCard key={s.id} session={s} index={i} total={totalSessions} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── EXERCISE TAB ── */}
        {activeTab === "exercise" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Sets"     value={totalExSets}       color="text-gray-800" />
              <StatCard label="Total Reps"     value={totalExReps}       color="text-indigo-600" />
              <StatCard label="Avg Form"       value={`${avgFormScore}%`} color={scoreColor(avgFormScore)} />
              <StatCard label="Exercises Done" value={uniqueEx}          color="text-gray-800" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-gray-800">Exercise Log</h2>
                <button onClick={() => navigate("/exercise")}
                  className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                  + New Exercise
                </button>
              </div>

              {exLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Loading history...</p>
                </div>
              ) : exerciseHistory.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <p className="text-4xl mb-3">🏋️</p>
                  <p className="font-semibold text-gray-600">No exercises logged yet</p>
                  <p className="text-sm text-gray-400 mt-1">Complete a tracked exercise to see history.</p>
                  <button onClick={() => navigate("/exercise")}
                    className="mt-5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl">
                    Start exercising
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {exerciseHistory.map(r => (
                    <ExerciseHistoryCard key={r.id} record={r} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirm clear */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-1">Clear all history?</h3>
            <p className="text-sm text-gray-500 mb-5">This permanently deletes all your session records.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClear(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600">Cancel</button>
              <button onClick={handleClear}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium">Clear all</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}