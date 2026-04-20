// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const benefits = [
  "Reduces neck and back strain",
  "Improves sitting posture over time",
  "Prevents long-term spinal issues",
  "Boosts focus and productivity",
];

export default function BenefitsSection() {
  return (
    <section className="px-6 py-24 bg-muted/40">

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

        {/* LEFT SIDE (SCIENCE) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >

          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Built on Real Posture Science
          </h2>

          <p className="text-muted-foreground">
            Poor posture over time can lead to chronic neck pain, spinal
            misalignment, and reduced productivity. AlignMate continuously
            monitors your posture using AI-based pose estimation and helps
            correct it before it becomes a long-term issue.
          </p>

          <p className="text-gray-600 dark:text-gray-400">
            Instead of reacting to pain, AlignMate focuses on prevention —
            guiding you toward healthier posture habits throughout your day.
          </p>

        </motion.div>

        {/* RIGHT SIDE (BENEFITS LIST) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >

          {benefits.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-start gap-4"
            >

              <CheckCircle className="text-green-500 mt-1" />

              <p className="text-gray-700 dark:text-gray-300">
                {item}
              </p>

            </motion.div>
          ))}

        </motion.div>

      </div>

    </section>
  );
}