// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function FinalCTA() {
  return (
    <section className="px-6">
  <div className="max-w-6xl mx-auto py-24">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto text-center rounded-3xl p-12 
                   bg-gradient-to-r from-indigo-500 to-purple-500 
                   text-white shadow-2xl space-y-6"
      >

        {/* HEADLINE */}
        <h2 className="text-3xl md:text-5xl font-bold leading-tight">
          Start Fixing Your Posture Today
        </h2>

        {/* SUBTEXT */}
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
          It takes just a few seconds to begin. No setup, no downloads —
          just open your camera and improve your posture instantly.
        </p>

        {/* CTA BUTTON */}
        <Link to="/live">
          <button className="mt-4 px-8 py-4 rounded-xl bg-white text-black font-semibold 
                             shadow-lg hover:scale-[1.05] hover:shadow-xl transition">
            Start Live Session
          </button>
        </Link>

      </motion.div>
    </div>
    </section>
  );
}