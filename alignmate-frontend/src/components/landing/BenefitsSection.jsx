import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  "Reduces neck and lower back strain during long desk sessions",
  "Improves daily sitting and standing posture habits permanently",
  "Prevents spine misalignment and secondary orthopedic issues",
  "Boosts long-term focus, energy levels, and general productivity",
];

export default function BenefitsSection() {
  return (
    <section className="px-6 py-20 bg-[#08080a] text-white">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

        {/* LEFT SIDE (SCIENCE) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6 text-left"
        >
          <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">
            Posture Science
          </span>
          <h2 className="text-3xl md:text-5xl font-black leading-tight uppercase tracking-tighter">
            Science-Backed
            <br />
            Feedback Loops
          </h2>

          <p className="text-gray-400 text-sm leading-relaxed">
            Repeated poor posture (slouching, text neck) places extra load on the cervical spine and restricts diaphragmatic breathing. AlignMate uses predictive feedback to help you break bad sitting patterns before they solidify.
          </p>

          <p className="text-gray-400 text-sm leading-relaxed">
            Instead of reacting to pain, the program tracks metrics like shoulder slope and neck tilt to guide positive lifestyle habits seamlessly.
          </p>
        </motion.div>

        {/* RIGHT SIDE (BENEFITS LIST) */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4 text-left"
        >
          {benefits.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-[#12141c] border border-white/5 hover:border-primary/10 transition-colors"
            >
              <CheckCircle2 className="text-primary mt-0.5 flex-shrink-0" size={18} />
              <p className="text-xs text-gray-300 font-semibold leading-relaxed">
                {item}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}