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
    <section className="px-6">
  <div className="max-w-6xl mx-auto py-24">

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Fix Your Posture
            <br />
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              In Real-Time
            </span>
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400">
            AlignMate uses AI-powered posture detection to monitor,
            correct, and improve your posture instantly.
          </p>

          <Link to="/live">
            <button className="px-8 py-4 rounded-xl bg-primary text-primary-foreground shadow-lg hover:scale-[1.04] transition">
              Start Live Session
            </button>
          </Link>
        </motion.div>

        {/* RIGHT IMAGE */}
        <div className="relative w-full h-[420px]">

          {images.map((img, i) => (
            <motion.img
              key={i}
              src={img}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl border border-border shadow-2xl"
              initial={false}
              animate={{ opacity: i === index ? 1 : 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          ))}

          {/* UI OVERLAY PANEL */}
          <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white 
                          backdrop-blur-md rounded-xl p-4 shadow-lg">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm opacity-80">Posture Status</p>
                <p className="text-lg font-semibold text-green-400">
                  Good Alignment ✓
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs opacity-70">Score</p>
                <p className="text-lg font-bold">92%</p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
    </section>
  );
}