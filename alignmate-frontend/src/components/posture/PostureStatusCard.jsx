function PostureStatusCard({ status, score }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "16px",
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <h2 style={{ margin: 0, marginBottom: "8px" }}>Posture Status</h2>
      <p style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>{status}</p>
      <p style={{ marginTop: "8px", marginBottom: 0 }}>Score: {score}/100</p>
    </div>
  );
}

export default PostureStatusCard;