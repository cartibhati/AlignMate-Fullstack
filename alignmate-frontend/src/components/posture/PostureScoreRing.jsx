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
      ? "#22c55e" // vibrant emerald green
      : animatedScore > 40
      ? "#eab308" // yellow
      : "#ef4444"; // red

  return (
    <div className="relative flex flex-col items-center justify-center p-5 border border-border rounded-2xl bg-card shadow-sm hover:border-primary/20 transition-all duration-300">
      
      <svg height={radius * 2} width={radius * 2}>
        
        {/* Background circle */}
        <circle
          className="text-muted/50 stroke-muted"
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
      <div className="absolute flex flex-col items-center justify-center mt-1">
        <span className="text-2xl font-black font-display text-foreground leading-none">
          {animatedScore}%
        </span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">
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