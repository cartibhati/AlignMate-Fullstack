// src/services/authService.js

import { API_BASE_URL } from "@/config";

const API = `${API_BASE_URL}/auth`;

// ── REGISTER ─────────────────────────────────────────────────────────────────
export const registerUser = async (data) => {
  try {
    const res = await fetch(`${API}/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body:    JSON.stringify({
        name:     data.name,
        email:    data.email,
        password: data.password,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: json.detail ?? "Registration failed",
      };
    }

    return { success: true, user: json.user };

  } catch {
    return { success: false, message: "Server unreachable. Is the backend running?" };
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export const loginUser = async (data) => {
  try {
    const res = await fetch(`${API}/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body:    JSON.stringify({
        email:    data.email,
        password: data.password,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: json.detail ?? "Invalid email or password",
      };
    }

    // Save full user (including profile) to localStorage for offline cache
    localStorage.setItem("currentUser", JSON.stringify(json.user));

    return { success: true, user: json.user };

  } catch {
    return { success: false, message: "Server unreachable. Is the backend running?" };
  }
};

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
export const getCurrentUser = () => {
  const stored = localStorage.getItem("currentUser");
  return stored ? JSON.parse(stored) : null;
};

// ── GET CURRENT USER FROM SERVER (SECURE) ──────────────────────────────────────
export const getCurrentUserFromServer = async () => {
  try {
    const res = await fetch(`${API}/me`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.user) {
      localStorage.setItem("currentUser", JSON.stringify(json.user));
      return json.user;
    }
    return null;
  } catch {
    return null;
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
export const logoutUser = async () => {
  localStorage.removeItem("currentUser");
  try {
    await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (e) {
    console.warn("Logout request failed", e);
  }
};