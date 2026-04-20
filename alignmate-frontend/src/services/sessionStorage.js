/**
 * src/services/sessionStorage.js
 *
 * Saves and retrieves posture session history per user.
 * Keyed by user email so each account has its own history.
 * Uses localStorage — no backend needed.
 */

const KEY = (email) => `alignmate_sessions_${email}`;

/**
 * Save a completed session for a user.
 * @param {string} email      - from AuthContext user.email
 * @param {object} session    - session data object
 */
export function saveSession(email, session) {
  if (!email) return;

  const existing = getSessions(email);

  const newSession = {
    id:          Date.now(),
    date:        new Date().toLocaleDateString("en-IN", {
                   day: "2-digit", month: "short", year: "numeric"
                 }),
    time:        new Date().toLocaleTimeString("en-IN", {
                   hour: "2-digit", minute: "2-digit"
                 }),
    duration:    Math.round(session.duration   ?? 0),   // total seconds
    badDuration: Math.round(session.badDuration ?? 0),  // seconds in bad posture
    avgScore:    Math.round(session.score       ?? 0),  // 0-100
    feedback:    session.feedback ?? [],
  };

  const updated = [newSession, ...existing].slice(0, 50); // keep last 50
  localStorage.setItem(KEY(email), JSON.stringify(updated));
}

/**
 * Get all sessions for a user, newest first.
 * @param {string} email
 * @returns {Array}
 */
export function getSessions(email) {
  if (!email) return [];
  try {
    return JSON.parse(localStorage.getItem(KEY(email)) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Clear all sessions for a user.
 * @param {string} email
 */
export function clearSessions(email) {
  if (!email) return;
  localStorage.removeItem(KEY(email));
}