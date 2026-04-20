import { Button } from "@/components/ui/button";

export default function SessionSummaryModal({
  open,
  onClose,
  duration = 0,
  badDuration = 0,
  score = 0,
  feedback = [],
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
        
        <h2 className="text-xl font-semibold text-center">
          Session Complete 🎉
        </h2>

        {/* STATS */}
        <div className="text-sm text-gray-700 space-y-2">
          <p>Duration: {(duration / 60).toFixed(1)} min</p>
          <p>Bad Posture: {(badDuration / 60).toFixed(1)} min</p>
          <p className="font-medium">Score: {score}%</p>
        </div>

        {/* FEEDBACK */}
        {feedback.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-1">Tips</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              {feedback.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ACTION */}
        <Button className="w-full" onClick={onClose}>
          Start New Session
        </Button>
      </div>
    </div>
  );
}