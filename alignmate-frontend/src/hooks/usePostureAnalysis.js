import { useEffect, useState, useRef, useMemo } from "react";

export default function usePostureAnalysis(results) {
  const [wsData, setWsData]               = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const socketRef = useRef(null);

  // ── 1. WebSocket connection ──────────────────────────────────────────────
  useEffect(() => {
    // ✅ FIX 1: Correct endpoint — was "/ws/posture", server only has "/ws"
    const socket = new WebSocket("ws://localhost:8000/ws");
    socketRef.current = socket;

    socket.onopen = () => {
      setConnectionStatus("connected");
      console.log("✅ WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setWsData(parsed);
      } catch (e) {
        console.warn("WS parse error:", e);
      }
    };

    socket.onerror = () => {
      setConnectionStatus("disconnected");
    };

    socket.onclose = () => {
      setConnectionStatus("disconnected");
      socketRef.current = null;
      console.log("❌ WebSocket closed");
    };

    return () => {
      socket.close();
    };
  }, []);

  // ── 2. Send landmarks to server on every new pose frame ─────────────────
  // ✅ FIX 2: The old hook NEVER sent any data to the server.
  // The server does `await websocket.receive_text()` and waits indefinitely.
  // This effect fires whenever MediaPipe produces new results and pushes
  // the 33 landmark points to the backend for analysis.
  useEffect(() => {
    const landmarks = results?.poseLandmarks;
    const socket    = socketRef.current;

    if (!landmarks || !socket || socket.readyState !== WebSocket.OPEN) return;

    const payload = {
      landmarks: landmarks.map((lm) => ({
        x:          lm.x,
        y:          lm.y,
        z:          lm.z,
        visibility: lm.visibility ?? 1,
      })),
    };

    socket.send(JSON.stringify(payload));
  }, [results]);

  // ── 3. Derive display data ───────────────────────────────────────────────
  const data = useMemo(() => {
    // If server has responded, always prefer that data
    if (wsData) return wsData;

    // No pose detected yet
    const landmarks = results?.poseLandmarks;
    if (!landmarks || landmarks.length === 0) {
      return {
        // ✅ FIX 3: Use lowercase "good" to match server output and
        // usePostureTimer's comparisons. The old fallback "Good" (capital G)
        // caused the bad-posture timer to never reset when WS was offline.
        status:   "good",
        score:    0,
        feedback: ["Waiting for pose detection..."],
        issues:   [],
        metrics:  {},
      };
    }

    // Pose is visible but backend isn't responding yet — show neutral state
    // instead of running a broken local calculation (was producing -178° slope).
    return {
      status:   "good",
      score:    50,
      feedback: ["Connecting to backend for analysis…"],
      issues:   [],
      metrics:  {},
    };
  }, [results, wsData]);

  return { data, connectionStatus };
}