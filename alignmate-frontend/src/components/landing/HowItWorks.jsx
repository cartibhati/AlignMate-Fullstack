import { motion } from "framer-motion";
import { Camera, Brain, Activity } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "1. Capture",
    desc: "Turn on your webcam. The app handles everything else with client-side detection.",
  },
  {
    icon: Brain,
    title: "2. Analyze",
    desc: "AI extracts skeletal keypoints and verifies alignment angles instantly.",
  },
  {
    icon: Activity,
    title: "3. Improve",
    desc: "Receive real-time audio corrections to fix your form and prevent injuries.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-6 bg-[#08080a] py-20 text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* SECTION TITLE */}
        <div className="text-center mb-16">
          <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mt-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-sm mt-3 max-w-lg mx-auto">
            Get started in seconds. No setup, calibration, or external sensors required.
          </p>
        </div>

        {/* STEPS */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="bg-[#12141c] border border-white/5 rounded-3xl p-8 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 relative group"
              >
                {/* ICON */}
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon size={24} />
                </div>

                {/* TITLE */}
                <h3 className="text-lg font-black uppercase tracking-tight mb-3 text-white">
                  {step.title}
                </h3>

                {/* DESCRIPTION */}
                <p className="text-gray-400 text-xs font-medium leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}