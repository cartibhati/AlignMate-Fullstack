/**
 * src/components/dashboard/SessionCard.jsx
 */

export default function SessionCard({ session, index, total }) {
  const goodPercent =
    session.duration > 0
      ? Math.max(0, Math.round(
          ((session.duration - session.badDuration) / session.duration) * 100
        ))
      : 100;

  const scoreColor =
    session.avgScore >= 75
      ? "text-emerald-600"
      : session.avgScore >= 50
        ? "text-amber-500"
        : "text-red-500";

  const scoreBorderColor =
    session.avgScore >= 75
      ? "border-emerald-200"
      : session.avgScore >= 50
        ? "border-amber-200"
        : "border-red-200";

  const scoreBg =
    session.avgScore >= 75
      ? "bg-emerald-50"
      : session.avgScore >= 50
        ? "bg-amber-50"
        : "bg-red-50";

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
    <div className={`border ${scoreBorderColor} rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-all duration-200`}>
      {/* Header row */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-medium text-gray-400 tracking-wide uppercase mb-0.5">
            Session #{total - index}
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {session.date}
          </p>
          <p className="text-xs text-gray-400">{session.time}</p>
        </div>

        {/* Score badge */}
        <div className={`${scoreBg} ${scoreBorderColor} border rounded-xl px-4 py-2 text-center min-w-[72px]`}>
          <p className={`text-2xl font-bold ${scoreColor}`}>{session.avgScore}%</p>
          <p className="text-[10px] text-gray-400 font-medium">avg score</p>
        </div>
      </div>

      {/* Progress bar — good vs bad ratio */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>Posture quality</span>
          <span>{goodPercent}% good</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
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
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Duration</p>
          <p className="font-bold text-gray-700 text-sm">{formatDuration(session.duration)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-2.5">
          <p className="text-red-400 text-[10px] uppercase tracking-wide mb-0.5">Bad posture</p>
          <p className="font-bold text-red-600 text-sm">{formatDuration(session.badDuration)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-2.5">
          <p className="text-emerald-500 text-[10px] uppercase tracking-wide mb-0.5">Good time</p>
          <p className="font-bold text-emerald-600 text-sm">{goodPercent}%</p>
        </div>
      </div>

      {/* Feedback */}
      {session.feedback?.length > 0 && (
        <p className="text-xs text-gray-400 italic mt-3 truncate">
          💬 {Array.isArray(session.feedback)
                ? session.feedback[0]
                : session.feedback}
        </p>
      )}
    </div>
  );
}