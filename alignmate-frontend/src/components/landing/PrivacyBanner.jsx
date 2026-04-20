// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function PrivacyBanner() {
  return (
    <section className="px-6">
  <div className="max-w-6xl mx-auto py-24">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-card border border-border 
                   rounded-2xl p-8 shadow-md"
      >

        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">

          {/* ICON */}
          <div className="w-16 h-16 flex items-center justify-center 
                          rounded-full bg-green-100 dark:bg-green-900/30">
            <ShieldCheck className="text-green-600" size={28} />
          </div>

          {/* TEXT */}
          <div className="space-y-2">

            <h3 className="text-xl font-semibold">
              Your Camera Stays Private
            </h3>

            <p className="text-gray-600 dark:text-gray-400 text-sm">
              AlignMate processes posture data in real-time. Your video is never
              recorded, stored, or shared.
            </p>

            {/* TRUST POINTS */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm mt-2 text-gray-700 dark:text-gray-300">

              <span>🔒 No recording</span>
              <span>⚡ Runs locally</span>
              <span>🚫 No data storage</span>

            </div>

          </div>

        </div>

      </motion.div>
    </div>
    </section>
  );
}