import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { assets } from "@/assets";

const images = [
  assets.hero1_am,
  assets.hero2_am,
  assets.hero3_am,
];

export default function HeroSection() {
  const [index, setIndex] = useState(0);

  // smooth image change
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="px-6 relative overflow-hidden bg-grid py-12 md:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 text-left"
          >
            <h1 className="text-5xl md:text-7xl font-black leading-none uppercase tracking-tighter">
              Master Your
              <br />
              <span className="bg-gradient-to-r from-primary to-emerald-500 dark:to-lime-300 bg-clip-text text-transparent">
                Workout Form
              </span>
            </h1>

            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              AlignMate uses real-time AI computer vision to analyze posture, 
              track workout reps, and perfect your training form instantly. 
              No wearables required.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/live">
                <button className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-extrabold uppercase tracking-wider shadow-neon hover:scale-[1.03] active:scale-[0.98] transition-all duration-300">
                  Start Live Session
                </button>
              </Link>
              <Link to="/exercise">
                <button className="px-8 py-4 rounded-xl border-2 border-border bg-transparent text-foreground font-extrabold uppercase tracking-wider hover:bg-accent hover:border-accent active:scale-[0.98] transition-all duration-300">
                  Explore Exercises
                </button>
              </Link>
            </div>
          </motion.div>

          {/* RIGHT IMAGE */}
          <div className="relative w-full h-[450px]">
            {images.map((img, i) => (
              <motion.img
                key={i}
                src={img}
                className="absolute inset-0 w-full h-full object-cover rounded-3xl border border-border shadow-2xl"
                initial={false}
                animate={{ opacity: i === index ? 1 : 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            ))}

            {/* UI OVERLAY PANEL */}
            <div className="absolute bottom-6 left-6 right-6 bg-black/60 text-white 
                            backdrop-blur-lg rounded-2xl p-5 border border-white/10 shadow-neon-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Live Tracker</p>
                  <p className="text-xl font-extrabold text-white mt-0.5">
                    Form Score: <span className="text-emerald-400">92%</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/60">Status</p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5 bg-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block border border-emerald-500/30">
                    Perfect Form ✓
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