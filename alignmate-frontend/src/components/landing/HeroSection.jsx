import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { assets } from "@/assets";
import { Activity, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

const images = [
  assets.hero1_am,
  assets.hero2_am,
  assets.hero3_am,
];

const STATS = [
  { label: "AI Accuracy", value: "98.4%", icon: ShieldCheck },
  { label: "Active Exercises", value: "12+", icon: Activity },
  { label: "Daily Users", value: "8,500+", icon: TrendingUp },
];

export default function HeroSection() {
  const [index, setIndex] = useState(0);

  // smooth image change
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="px-6 relative overflow-hidden bg-grid py-16 md:py-24 bg-[#08080a] text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">

          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-primary shadow-sm">
              <Sparkles size={12} className="animate-spin" /> Perfect Form, Zero Guesswork
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-none uppercase tracking-tighter">
              Perfect Your
              <br />
              <span className="bg-gradient-to-r from-primary via-emerald-400 to-sky-400 bg-clip-text text-transparent animate-pulse">
                Workout Form
              </span>
            </h1>

            <p className="text-base md:text-lg text-gray-400 font-medium leading-relaxed max-w-lg">
              AlignMate uses real-time computer vision AI to correct posture, track repetitions, and provide instant coaching feedback. Train safely with no wearables required.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/live?mode=student">
                <button className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-wider shadow-neon hover:scale-[1.03] active:scale-[0.98] transition-all duration-300">
                  Live Posture Monitor
                </button>
              </Link>
              <Link to="/exercise">
                <button className="px-8 py-4 rounded-xl border-2 border-white/10 bg-white/5 text-white font-black uppercase tracking-wider hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all duration-300">
                  Exercises Routine
                </button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5">
              {STATS.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="text-left">
                    <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                      <Icon size={12} className="text-primary/70" />
                      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-black font-display text-white">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* RIGHT VIEWPORT (Mock Dashboard Card) */}
          <div className="relative w-full h-[480px]">
            {images.map((img, i) => (
              <motion.img
                key={i}
                src={img}
                className="absolute inset-0 w-full h-full object-cover rounded-3xl border border-white/5 shadow-2xl shadow-black/80"
                initial={false}
                animate={{ opacity: i === index ? 1 : 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            ))}

            {/* UI OVERLAY PANEL (Sleek Glassmorphic Widget) */}
            <div className="absolute bottom-6 left-6 right-6 bg-black/80 text-white 
                            backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-neon-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Live Pose Estimation</p>
                  <p className="text-xl font-extrabold text-white mt-1.5">
                    Spinal Alignment: <span className="text-emerald-400 font-display">94.8%</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/50">Form status</p>
                  <p className="text-xs font-black text-emerald-400 mt-1.5 bg-emerald-500/10 px-3 py-1 rounded-full inline-block border border-emerald-500/20">
                    Perfect Alignment ✓
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}