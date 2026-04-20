import { useState, useEffect } from "react";

export default function useMockPosture() {
  const [data, setData] = useState(() => ({
    posture: "good",
    neckAngle: 10,
    shoulderTilt: 2,
    timestamp: Date.now(),
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      const isBad = Math.random() > 0.6;

      setData({
        posture: isBad ? "bad" : "good",
        neckAngle: Math.floor(Math.random() * 30),
        shoulderTilt: Math.floor(Math.random() * 10),
        timestamp: Date.now(),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return data;
}