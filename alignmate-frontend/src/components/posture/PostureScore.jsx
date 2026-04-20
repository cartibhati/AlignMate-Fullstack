export default function PostureScore({ posture }) {
  return (
    <div className="p-4 rounded-lg border">
      <h3 className="text-sm text-gray-500">Posture Status</h3>

      <p
        className={`text-2xl font-bold mt-1 ${
          posture === "good" ? "text-green-600" : "text-red-600"
        }`}
      >
        {posture === "good" ? "Good ✅" : "Bad ❌"}
      </p>
    </div>
  );
}