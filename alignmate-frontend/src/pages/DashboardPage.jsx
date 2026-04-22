/**
 * src/pages/DashboardPage.jsx
 */

import { useContext, useState, useRef } from "react";
import { AuthContext } from "@/context/AuthContext";
import { getSessions, clearSessions } from "@/services/sessionStorage";
import SessionCard from "@/components/dashboard/SessionCard";
import { useNavigate } from "react-router-dom";

// ── Inline SVG Line Chart ─────────────────────────────────────────────────────
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

  const xPos = (i) => PAD.left + (i / (sessions.length - 1)) * chartW;
  const yPos = (v) => PAD.top  + chartH - ((v - minY) / (maxY - minY)) * chartH;

  // Build SVG path
  const linePath = sessions
    .map((s, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(s.avgScore)}`)
    .join(" ");

  // Fill area under line
  const areaPath =
    `M ${xPos(0)} ${PAD.top + chartH} ` +
    sessions.map((s, i) => `L ${xPos(i)} ${yPos(s.avgScore)}`).join(" ") +
    ` L ${xPos(sessions.length - 1)} ${PAD.top + chartH} Z`;

  const dotColor = (score) =>
    score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  const gridLines = [25, 50, 75, 100].filter(v => v >= minY && v <= maxY);

  const formatDur = (s) => {
    if (!s || s === 0) return "0s";
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="relative w-full" style={{ maxWidth: W }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto overflow-visible"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {gridLines.map(v => (
          <g key={v}>
            <line
              x1={PAD.left} y1={yPos(v)}
              x2={PAD.left + chartW} y2={yPos(v)}
              stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4"
            />
            <text
              x={PAD.left - 8} y={yPos(v)}
              textAnchor="end" dominantBaseline="middle"
              fontSize="10" fill="#9ca3af"
            >
              {v}%
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#glow)"
        />

        {/* Dots + hit targets */}
        {sessions.map((s, i) => {
          const cx = xPos(i);
          const cy = yPos(s.avgScore);
          const color = dotColor(s.avgScore);
          return (
            <g key={s.id}
               onMouseEnter={(e) => {
                 setTooltip({ i, session: s, cx, cy });
               }}
               style={{ cursor: "pointer" }}
            >
              {/* Hit area */}
              <circle cx={cx} cy={cy} r={16} fill="transparent" />
              {/* Outer ring */}
              <circle cx={cx} cy={cy} r={7} fill="white" stroke={color} strokeWidth="2.5" />
              {/* Inner dot */}
              <circle cx={cx} cy={cy} r={3.5} fill={color} />
              {/* X-axis label */}
              <text
                x={cx} y={PAD.top + chartH + 16}
                textAnchor="middle" fontSize="9" fill="#9ca3af"
              >
                #{i + 1}
              </text>
            </g>
          );
        })}

        {/* Vertical cursor line when hovering */}
        {tooltip && (
          <line
            x1={tooltip.cx} y1={PAD.top}
            x2={tooltip.cx} y2={PAD.top + chartH}
            stroke="#6366f1" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"
          />
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (() => {
        const s = tooltip.session;
        const goodPct = s.duration > 0
          ? Math.max(0, Math.round(((s.duration - s.badDuration) / s.duration) * 100))
          : 100;
        return (
          <div
            className="absolute z-10 bg-gray-900 text-white rounded-xl px-3 py-2.5 text-xs shadow-xl pointer-events-none"
            style={{
              left: `${(tooltip.cx / W) * 100}%`,
              top:  `${((tooltip.cy - 20) / H) * 100}%`,
              transform: "translate(-50%, -100%)",
              minWidth: 140,
            }}
          >
            <p className="font-bold text-sm mb-1">
              {s.avgScore}%
              <span className={`ml-1.5 text-xs font-normal ${
                s.avgScore >= 75 ? "text-emerald-400" : s.avgScore >= 50 ? "text-amber-400" : "text-red-400"
              }`}>
                {s.avgScore >= 75 ? "Good" : s.avgScore >= 50 ? "Fair" : "Poor"}
              </span>
            </p>
            <p className="text-gray-300">{s.date} · {s.time}</p>
            <div className="mt-1.5 pt-1.5 border-t border-gray-700 grid grid-cols-2 gap-x-3 gap-y-0.5">
              <span className="text-gray-400">Duration</span>
              <span className="text-right">{formatDur(s.duration)}</span>
              <span className="text-gray-400">Bad posture</span>
              <span className="text-right text-red-400">{formatDur(s.badDuration)}</span>
              <span className="text-gray-400">Good time</span>
              <span className="text-right text-emerald-400">{goodPct}%</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-1">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold ${color || "text-gray-800"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }  = useContext(AuthContext);
  const navigate  = useNavigate();

  const email    = user?.email ?? "";
  const sessions = getSessions(email);

  const [confirmClear, setConfirmClear] = useState(false);

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const totalSessions = sessions.length;

  // ✅ avgScore is already correctly stored per session (running average from LivePosturePage)
  const avgScore  = totalSessions
    ? Math.round(sessions.reduce((s, x) => s + x.avgScore, 0) / totalSessions)
    : 0;

  const bestScore = totalSessions
    ? Math.max(...sessions.map(x => x.avgScore))
    : 0;

  const totalMins = Math.round(
    sessions.reduce((s, x) => s + (x.duration ?? 0), 0) / 60
  );

  const totalBadMins = Math.round(
    sessions.reduce((s, x) => s + (x.badDuration ?? 0), 0) / 60
  );

  // Trend: last 7 sessions oldest → newest (for chart left→right)
  const chartData = [...sessions].reverse().slice(-7);

  // Improvement message
  const trendMsg = (() => {
    if (chartData.length < 2) return null;
    const diff = chartData[chartData.length - 1].avgScore - chartData[0].avgScore;
    if (diff > 5)  return { text: "📈 Improving — great work!", color: "text-emerald-600" };
    if (diff < -5) return { text: "📉 Scores dipping — focus on posture.", color: "text-red-500" };
    return         { text: "➡️ Scores are consistent.", color: "text-gray-500" };
  })();

  const scoreColor = (s) =>
    s >= 75 ? "text-emerald-600" : s >= 50 ? "text-amber-500" : "text-red-500";

  const handleClear = () => {
    clearSessions(email);
    setConfirmClear(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {user?.name ?? user?.email ?? "User"}'s Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Posture history &amp; progress</p>
          </div>
          <button
            onClick={() => navigate("/live")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
          >
            + New Session
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-8">

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Sessions"    value={totalSessions}      color="text-gray-800" />
          <StatCard label="Avg Score"   value={`${avgScore}%`}     color={scoreColor(avgScore)} />
          <StatCard label="Best Score"  value={`${bestScore}%`}    color={scoreColor(bestScore)} />
          <StatCard label="Total Time"  value={`${totalMins}m`}    color="text-gray-800"
                    sub={totalBadMins > 0 ? `${totalBadMins}m bad posture` : "No bad posture logged"} />
        </div>

        {/* ── Progress chart ── */}
        {chartData.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">
                  Score Progress
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Last {chartData.length} sessions · hover a dot to see details
                </p>
              </div>
              {trendMsg && (
                <span className={`text-xs font-medium ${trendMsg.color}`}>
                  {trendMsg.text}
                </span>
              )}
            </div>

            <ProgressChart sessions={chartData} />

            {/* Legend */}
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

        {/* ── Session history ── */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Session History</h2>
            {totalSessions > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-xs text-red-400 hover:text-red-600 transition"
              >
                Clear history
              </button>
            )}
          </div>

          {totalSessions === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <p className="text-4xl mb-3">🪑</p>
              <p className="font-semibold text-gray-600">No sessions yet</p>
              <p className="text-sm mt-1">Complete your first live session to see history.</p>
              <button
                onClick={() => navigate("/live")}
                className="mt-5 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl"
              >
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
      </div>

      {/* ── Confirm clear modal ── */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-1">Clear all history?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This permanently deletes all your session records. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium transition"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}