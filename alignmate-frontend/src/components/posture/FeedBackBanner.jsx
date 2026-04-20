export default function FeedBackBanner({ feedback = [] }) {
  if (!feedback || feedback.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-green-50 text-green-700 text-sm">
        ✅ Great posture! Keep it up.
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="text-sm font-semibold mb-2">Feedback</h3>

      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
        {feedback.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}