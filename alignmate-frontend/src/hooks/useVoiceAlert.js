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

    const messages = VOICE_MESSAGES[mode] || VOICE_MESSAGES.student;
    const text     = messages[status];
    if (!text) return;

    window.speechSynthesis.cancel();

    const utterance      = new SpeechSynthesisUtterance(text);
    utterance.rate       = 0.95;
    utterance.pitch      = 1;
    utterance.volume     = 1;
    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
    lastSpokenRef.current = now;
  }, [mode]);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, cancel };
}