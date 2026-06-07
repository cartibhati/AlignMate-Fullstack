// src/services/authService.js

import { API_BASE_URL } from "@/config";

const API = `${API_BASE_URL}/auth`;

// ── REGISTER ─────────────────────────────────────────────────────────────────
export const registerUser = async (data) => {
  try {
    const res = await fetch(`${API}/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
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

    // ✅ Save full user (including profile) to localStorage for session persistence
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

// ── LOGOUT ────────────────────────────────────────────────────────────────────
export const logoutUser = () => {
  localStorage.removeItem("currentUser");
};