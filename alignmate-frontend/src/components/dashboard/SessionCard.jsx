/**
 * src/components/dashboard/SessionCard.jsx
 */

export default function SessionCard({ session, index, total }) {
  const goodPercent =
    session.duration > 0
      ? Math.round(
          ((session.duration - session.badDuration) / session.duration) * 100
        )
      : 100;

  const scoreColor =
    session.avgScore >= 75
      ? "text-green-600"
      : session.avgScore >= 50
        ? "text-yellow-600"
        : "text-red-600";

  const formatDuration = (secs) => {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-gray-400 font-medium">
            Session #{total - index}
          </p>
          <p className="text-sm font-semibold text-gray-700">
            {session.date} · {session.time}
          </p>
        </div>
        <span
          className={`text-xl font-bold ${scoreColor}`}
        >
          {session.avgScore}%
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-400">Duration</p>
          <p className="font-semibold text-gray-700">
            {formatDuration(session.duration)}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-2">
          <p className="text-red-400">Bad posture</p>
          <p className="font-semibold text-red-600">
            {formatDuration(session.badDuration)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <p className="text-green-400">Good time</p>
          <p className="font-semibold text-green-600">{goodPercent}%</p>
        </div>
      </div>

      {/* Feedback */}
      {session.feedback?.length > 0 && (
        <p className="text-xs text-gray-500 italic truncate">
          💬 {Array.isArray(session.feedback)
                ? session.feedback[0]
                : session.feedback}
        </p>
      )}
    </div>
  );
}