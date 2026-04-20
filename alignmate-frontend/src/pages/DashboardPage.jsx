/**
 * src/pages/DashboardPage.jsx
 */

import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { getSessions, clearSessions } from "@/services/sessionStorage";
import SessionCard from "@/components/dashboard/SessionCard";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const navigate  = useNavigate();

  const email    = user?.email ?? "";
  const sessions = getSessions(email);

  const [confirmClear, setConfirmClear] = useState(false);

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const totalSessions  = sessions.length;
  const avgScore       = totalSessions
    ? Math.round(sessions.reduce((s, x) => s + x.avgScore, 0) / totalSessions)
    : 0;
  const bestScore      = totalSessions
    ? Math.max(...sessions.map((x) => x.avgScore))
    : 0;
  const totalBadSecs   = sessions.reduce((s, x) => s + x.badDuration, 0);
  const totalMins      = Math.round(
    sessions.reduce((s, x) => s + x.duration, 0) / 60
  );

  // ── Improvement trend (last 7 sessions, oldest → newest) ────────────────
  const trend = [...sessions].reverse().slice(-7);

  // ── Clear history ────────────────────────────────────────────────────────
  const handleClear = () => {
    clearSessions(email);
    setConfirmClear(false);
    window.location.reload();
  };

  // ── Score colour helper ──────────────────────────────────────────────────
  const scoreColor = (s) =>
    s >= 75 ? "text-green-600" : s >= 50 ? "text-yellow-500" : "text-red-500";

  const scoreBg = (s) =>
    s >= 75 ? "bg-green-100" : s >= 50 ? "bg-yellow-100" : "bg-red-100";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-10">

      {/* ── Header ── */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.name ?? user?.email ?? "User"} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Your posture history &amp; progress
          </p>
        </div>
        <button
          onClick={() => navigate("/live")}
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          + New Session
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Sessions",        value: totalSessions,        unit: "",    bg: "bg-white" },
            { label: "Avg Score",        value: `${avgScore}%`,       unit: "",    bg: scoreBg(avgScore) },
            { label: "Best Score",       value: `${bestScore}%`,      unit: "",    bg: scoreBg(bestScore) },
            { label: "Total Time",       value: totalMins,            unit: "min", bg: "bg-white" },
          ].map(({ label, value, unit, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-4 border shadow-sm text-center`}>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-800">
                {value}{unit && <span className="text-sm font-normal text-gray-500"> {unit}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* ── Improvement trend ── */}
        {trend.length > 1 && (
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Score Trend (last {trend.length} sessions)
            </h2>
            <div className="flex items-end gap-2 h-24">
              {trend.map((s, i) => {
                const heightPct = Math.max(s.avgScore, 5);
                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                    <span className={`text-xs font-bold ${scoreColor(s.avgScore)}`}>
                      {s.avgScore}%
                    </span>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        s.avgScore >= 75
                          ? "bg-green-400"
                          : s.avgScore >= 50
                            ? "bg-yellow-400"
                            : "bg-red-400"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-gray-400">
                      #{i + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Trend message */}
            {(() => {
              const first = trend[0].avgScore;
              const last  = trend[trend.length - 1].avgScore;
              const diff  = last - first;
              if (diff > 5)  return <p className="text-xs text-green-600 mt-3">📈 You're improving! Keep it up.</p>;
              if (diff < -5) return <p className="text-xs text-red-500 mt-3">📉 Scores dropping — try to sit straighter.</p>;
              return              <p className="text-xs text-gray-400 mt-3">➡️ Scores are consistent.</p>;
            })()}
          </div>
        )}

        {/* ── Session history ── */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Session History
            </h2>
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
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🪑</p>
              <p className="font-medium">No sessions yet</p>
              <p className="text-sm mt-1">
                Complete a live session to see your history here.
              </p>
              <button
                onClick={() => navigate("/live")}
                className="mt-4 bg-black text-white text-sm px-4 py-2 rounded-lg"
              >
                Start first session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s, i) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  index={i}
                  total={totalSessions}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm clear modal ── */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-2">Clear all history?</h3>
            <p className="text-sm text-gray-500 mb-4">
              This will permanently delete all your session records.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm hover:bg-red-600"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}