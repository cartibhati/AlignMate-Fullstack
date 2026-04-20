import { useEffect, useState } from "react";

export default function PostureScoreRing({ score = 0 }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  //  Animate score
  useEffect(() => {
    let start = 0;
    const duration = 500;
    const increment = score / (duration / 16);

    const animate = () => {
      start += increment;
      if (start < score) {
        setAnimatedScore(Math.floor(start));
        requestAnimationFrame(animate);
      } else {
        setAnimatedScore(score);
      }
    };

    animate();
  }, [score]);

  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const progress = animatedScore / 100;
  const strokeDashoffset = circumference - progress * circumference;

  const color =
    animatedScore > 70
      ? "#16a34a" // green
      : animatedScore > 40
      ? "#f59e0b" // yellow
      : "#dc2626"; // red

  return (
  <div className="relative flex flex-col items-center justify-center p-4 border rounded-lg bg-white">
      
      <svg height={radius * 2} width={radius * 2}>
        
        {/* Background circle */}
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />

        {/* Progress circle */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + " " + circumference}
          style={{
            strokeDashoffset,
            transition: "stroke-dashoffset 0.3s ease",
          }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />

      </svg>

      {/* Text inside */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">
          {animatedScore}%
        </span>
        <span className="text-xs text-gray-500">
          {animatedScore > 70
            ? "Good"
            : animatedScore > 40
            ? "Average"
            : "Bad"}
        </span>
      </div>
    </div>
  );
}