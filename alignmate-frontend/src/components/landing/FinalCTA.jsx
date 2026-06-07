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
                   bg-gradient-to-r from-red-500 to-orange-600 dark:from-card dark:to-neutral-900/80
                   border border-transparent dark:border-primary/20
                   text-white dark:text-foreground shadow-2xl dark:shadow-neon/5 space-y-6"
      >

        {/* HEADLINE */}
        <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
          Start Fixing Your Posture Today
        </h2>

        {/* SUBTEXT */}
        <p className="text-lg md:text-xl text-white/90 dark:text-muted-foreground max-w-2xl mx-auto">
          It takes just a few seconds to begin. No setup, no downloads —
          just open your camera and improve your posture instantly.
        </p>

        {/* CTA BUTTON */}
        <Link to="/live">
          <button className="mt-4 px-8 py-4 rounded-xl bg-white text-black dark:bg-primary dark:text-primary-foreground font-semibold 
                             shadow-lg hover:scale-[1.05] hover:shadow-xl dark:hover:shadow-neon/10 transition">
            Start Live Session
          </button>
        </Link>

      </motion.div>
    </div>
    </section>
  );
}