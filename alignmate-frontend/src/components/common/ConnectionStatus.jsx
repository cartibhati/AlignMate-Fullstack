export default function ConnectionStatus({ status = "connecting" }) {
  const config = {
    connected: {
      text: "Live Tracking",
      color: "text-green-600",
      dot: "bg-green-500",
    },
    connecting: {
      text: "Connecting...",
      color: "text-yellow-600",
      dot: "bg-yellow-500",
    },
    disconnected: {
      text: "Disconnected",
      color: "text-red-600",
      dot: "bg-red-500",
    },
  };

  const current = config[status] || config.connecting;

  return (
    <div className={`flex items-center gap-2 text-sm ${current.color}`}>
      <span className={`w-2 h-2 rounded-full ${current.dot}`} />
      {current.text}
    </div>
  );
}