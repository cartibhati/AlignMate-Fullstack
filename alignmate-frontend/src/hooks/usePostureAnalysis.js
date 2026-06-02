import { useEffect, useState, useRef, useMemo } from "react";

// ✅ Accept mode as a parameter
export default function usePostureAnalysis(results, mode = "student") {
  const [wsData, setWsData]                     = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const socketRef = useRef(null);

  // ── 1. WebSocket connection ──────────────────────────────────────────────
  useEffect(() => {
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

    socket.onerror = (event) => {
      setConnectionStatus("disconnected");
      console.warn("WS error:", event);
    };

    socket.onclose = () => {
      setConnectionStatus("disconnected");
      socketRef.current = null;
      console.log("❌ WebSocket closed");
    };

    return () => socket.close();
  }, []);

  // ── 2. Send landmarks + mode on every new pose frame ────────────────────
  useEffect(() => {
    const landmarks = results?.poseLandmarks;
    const socket    = socketRef.current;

    if (!landmarks || !socket || socket.readyState !== WebSocket.OPEN) return;

    const payload = {
      mode,                          // ✅ send mode to backend
      landmarks: landmarks.map((lm) => ({
        x:          lm.x,
        y:          lm.y,
        z:          lm.z,
        visibility: lm.visibility ?? 1,
      })),
    };

    socket.send(JSON.stringify(payload));
  }, [results, mode]);              // ✅ re-send if mode changes

  // ── 3. Derive display data ───────────────────────────────────────────────
  const data = useMemo(() => {
    if (wsData) return wsData;

    const landmarks = results?.poseLandmarks;
    if (!landmarks || landmarks.length === 0) {
      return {
        status:   "good",
        score:    0,
        feedback: ["Waiting for pose detection..."],
        issues:   [],
        metrics:  {},
      };
    }

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