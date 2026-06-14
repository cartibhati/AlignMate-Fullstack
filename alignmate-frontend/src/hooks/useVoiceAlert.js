import { useRef, useCallback } from "react";

const VOICE_MESSAGES = {
  student: {
    bad:   "Sit straight! Your back will thank you.",
    drift: "Posture drifting, adjust your position.",
  },
  athlete: {
    bad:   "Fix your form! Posture affects performance.",
    drift: "Stay aligned, keep your form tight.",
  },
  both: {
    bad:   "Posture check — straighten up!",
    drift: "Posture drifting, correct your position.",
  },
};

const COOLDOWN_MS = 8000;

export default function useVoiceAlert(mode = "student") {
  const lastSpokenRef = useRef(0);
  const utteranceRef  = useRef(null);

  const speak = useCallback((status) => {
    if (!window.speechSynthesis) return;
    if (status !== "bad" && status !== "drift") return;

    const now = Date.now();
    if (now - lastSpokenRef.current < COOLDOWN_MS) return;

    const saved = localStorage.getItem("alignmate_voice_settings");
    let settings = { rate: 0.95, pitch: 1.0, volume: 1.0, voiceName: "" };
    if (saved) {
      try {
        settings = JSON.parse(saved);
      } catch (e) {}
    }

    const messages = VOICE_MESSAGES[mode] || VOICE_MESSAGES.student;
    const text     = messages[status];
    if (!text) return;

    window.speechSynthesis.cancel();

    const utterance      = new SpeechSynthesisUtterance(text);
    utterance.rate       = settings.rate ?? 0.95;
    utterance.pitch      = settings.pitch ?? 1.0;
    utterance.volume     = settings.volume ?? 1.0;

    if (settings.voiceName && window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === settings.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
    lastSpokenRef.current = now;
  }, [mode]);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, cancel };
}