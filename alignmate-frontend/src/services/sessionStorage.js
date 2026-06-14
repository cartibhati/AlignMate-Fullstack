/**
 * src/services/sessionStorage.js
 * Now saves to MySQL via API. Falls back to localStorage for offline reads.
 */

import { API_BASE_URL } from "@/config";

const API     = `${API_BASE_URL}/auth`;
const LS_KEY  = (email) => `alignmate_sessions_${email}`;

// ── Save session to MySQL ─────────────────────────────────────────────────────
export async function saveSession(email, session) {
  if (!email) return;

  const user = JSON.parse(localStorage.getItem("currentUser") ?? "{}");
  if (!user?.id) return;

  try {
    const res = await fetch(`${API}/sessions`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body:    JSON.stringify({
        user_id:      user.id,
        duration:     Math.round(session.duration    ?? 0),
        bad_duration: Math.round(session.badDuration ?? 0),
        avg_score:    Math.round(session.score       ?? 0),
        mode:         session.mode       ?? "student",
        feedback:     session.feedback   ?? [],
        ai_feedback:  session.aiFeedback ?? null,
      }),
    });
    if (!res.ok) throw new Error("Failed to save session");
  } catch (e) {
    // ── Fallback: save to localStorage if API unreachable ──
    console.warn("API unavailable, saving to localStorage", e);
    _saveToLS(email, session);
  }
}

// ── Get sessions from MySQL ───────────────────────────────────────────────────
export async function getSessions(email) {
  if (!email) return [];

  const user = JSON.parse(localStorage.getItem("currentUser") ?? "{}");
  if (!user?.id) return _getFromLS(email);

  try {
    const res  = await fetch(`${API}/sessions/${user.id}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (e) {
    console.warn("Session fetch failed, falling back to localStorage", e);
    return _getFromLS(email);
  }
}

// ── Clear sessions ────────────────────────────────────────────────────────────
export async function clearSessions(email) {
  if (!email) return;
  // Clear localStorage cache
  localStorage.removeItem(LS_KEY(email));
  // Note: no DELETE endpoint yet — add later if needed
}

// ── localStorage fallbacks ────────────────────────────────────────────────────
function _saveToLS(email, session) {
  const existing = _getFromLS(email);
  const newSession = {
    id:          Date.now(),
    date:        new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time:        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    duration:    Math.round(session.duration    ?? 0),
    badDuration: Math.round(session.badDuration ?? 0),
    avgScore:    Math.round(session.score       ?? 0),
    feedback:    session.feedback   ?? [],
    aiFeedback:  session.aiFeedback ?? null,
    mode:        session.mode       ?? "student",
  };
  const updated = [newSession, ...existing].slice(0, 50);
  localStorage.setItem(LS_KEY(email), JSON.stringify(updated));
}

function _getFromLS(email) {
  try { return JSON.parse(localStorage.getItem(LS_KEY(email)) ?? "[]"); }
  catch { return []; }
}