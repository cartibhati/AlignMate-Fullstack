/**
 * src/components/dashboard/SessionCard.jsx
 */
import { useState } from "react";

const MODE_LABELS = {
  student: "🎓 Student",
  athlete: "🏋️ Athlete",
  both:    "⚡ Both",
};

export default function SessionCard({ session, index, total }) {
  const [showAI, setShowAI] = useState(false);

  const goodPercent =
    session.duration > 0
      ? Math.max(0, Math.round(
          ((session.duration - session.badDuration) / session.duration) * 100
        ))
      : 100;

  const scoreColor =
    session.avgScore >= 75 ? "text-emerald-600 dark:text-emerald-400"
    : session.avgScore >= 50 ? "text-amber-500 dark:text-amber-400"
    : "text-red-500 dark:text-red-400";

  const scoreBorderColor =
    session.avgScore >= 75 ? "border-emerald-200 dark:border-emerald-500/20"
    : session.avgScore >= 50 ? "border-amber-200 dark:border-amber-500/20"
    : "border-red-200 dark:border-red-500/20";

  const scoreBg =
    session.avgScore >= 75 ? "bg-emerald-50 dark:bg-emerald-500/10"
    : session.avgScore >= 50 ? "bg-amber-50 dark:bg-amber-500/10"
    : "bg-red-50 dark:bg-red-500/10";

  const formatDuration = (secs) => {
    if (!secs || secs === 0) return "0s";
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  const badPercent = session.duration > 0
    ? Math.round((session.badDuration / session.duration) * 100)
    : 0;

  return (
    <div className={`border border-border/80 dark:border-border rounded-2xl p-5 bg-card shadow-sm hover:shadow-md hover:border-primary/30 dark:hover:shadow-neon/5 transition-all duration-200`}>

      {/* Header row */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground/75 tracking-wide uppercase mb-0.5">
            Session #{total - index}
            {session.mode && (
              <span className="ml-2 normal-case font-normal text-muted-foreground/60">
                · {MODE_LABELS[session.mode] ?? session.mode}
              </span>
            )}
          </p>
          <p className="text-sm font-semibold text-foreground">{session.date}</p>
          <p className="text-xs text-muted-foreground">{session.time}</p>
        </div>

        <div className={`${scoreBg} ${scoreBorderColor} border rounded-xl px-4 py-2 text-center min-w-[72px]`}>
          <p className={`text-2xl font-bold ${scoreColor}`}>{session.avgScore}%</p>
          <p className="text-[10px] text-muted-foreground/70 font-medium">avg score</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>Posture quality</span>
          <span>{goodPercent}% good</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${goodPercent}%` }}
          />
        </div>
        {badPercent > 0 && (
          <div className="flex justify-end mt-0.5">
            <span className="text-[10px] text-red-400">{badPercent}% bad</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-muted/50 rounded-xl p-2.5">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wide mb-0.5">Duration</p>
          <p className="font-bold text-foreground text-sm">{formatDuration(session.duration)}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/10 dark:border-red-500/20 rounded-xl p-2.5">
          <p className="text-red-500 dark:text-red-400 text-[10px] uppercase tracking-wide mb-0.5">Bad posture</p>
          <p className="font-bold text-red-600 dark:text-red-400 text-sm">{formatDuration(session.badDuration)}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 rounded-xl p-2.5">
          <p className="text-emerald-500 dark:text-emerald-400 text-[10px] uppercase tracking-wide mb-0.5">Good time</p>
          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{goodPercent}%</p>
        </div>
      </div>

      {/* ✅ AI Summary — expandable */}
      {session.aiFeedback && (
        <div className="mt-3 border-t border-border/80 pt-3">
          <button
            onClick={() => setShowAI((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition"
          >
            🤖 AI Coach Summary
            <span className="text-muted-foreground/60">{showAI ? "▲" : "▼"}</span>
          </button>
          {showAI && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-2 bg-muted/60 rounded-xl p-3 border border-border/40">
              {session.aiFeedback}
            </p>
          )}
        </div>
      )}

      {/* Regular feedback */}
      {!session.aiFeedback && session.feedback?.length > 0 && (
        <p className="text-xs text-muted-foreground italic mt-3 truncate">
          💬 {Array.isArray(session.feedback)
                ? session.feedback[0]
                : session.feedback}
        </p>
      )}
    </div>
  );
}