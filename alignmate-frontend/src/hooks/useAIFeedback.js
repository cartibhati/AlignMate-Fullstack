import { useState, useEffect, useRef, useCallback } from "react";

const AI_FEEDBACK_URL = "http://localhost:8000/ai-feedback";

export default function useAIFeedback({
  mode,
  score,
  badDuration,
  sessionDuration,
  issues,
  enabled = true,
}) {
  const [aiFeedback, setAiFeedback]   = useState(null);
  const [loading, setLoading]         = useState(false);
  const intervalRef                   = useRef(null);

  const fetchFeedback = useCallback(async () => {
    if (!enabled || sessionDuration < 10) return; // skip if session too short
    setLoading(true);
    try {
      const res = await fetch(AI_FEEDBACK_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          score,
          bad_duration:     badDuration,
          session_duration: sessionDuration,
          issues,
        }),
      });
      const data = await res.json();
      if (data.feedback) setAiFeedback(data.feedback);
    } catch (e) {
      console.warn("AI feedback error:", e);
    } finally {
      setLoading(false);
    }
  }, [mode, score, badDuration, sessionDuration, issues, enabled]);

  // ── Poll every 30 seconds ────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(fetchFeedback, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchFeedback, enabled]);

  // ── fetchFeedback exposed so LivePosturePage can call it on session end ──
  return { aiFeedback, loading, fetchFeedback };
}