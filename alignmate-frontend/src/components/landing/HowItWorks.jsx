// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Camera, Brain, Activity } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Capture",
    desc: "Use your webcam to track your posture in real-time.",
  },
  {
    icon: Brain,
    title: "Analyze",
    desc: "AI detects posture issues instantly using pose estimation.",
  },
  {
    icon: Activity,
    title: "Improve",
    desc: "Get live feedback and correct your posture immediately.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-6">
  <div className="max-w-6xl mx-auto py-24">

      <div className="max-w-6xl mx-auto text-center">

        {/* SECTION TITLE */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold mb-12"
        >
          How It Works
        </motion.h2>

        {/* STEPS */}
        <div className="grid md:grid-cols-3 gap-10 relative">

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative flex flex-col items-center text-center"
              >

                {/* ICON */}
                <div className="w-16 h-16 flex items-center justify-center 
                                rounded-full bg-primary/10 text-primary mb-4">
                  <Icon size={28} />
                </div>

                {/* TITLE */}
                <h3 className="text-lg font-semibold mb-2">
                  {step.title}
                </h3>

                {/* DESCRIPTION */}
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs">
                  {step.desc}
                </p>

                {/* CONNECTOR LINE (only for first 2 items) */}
                {index !== steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-[2px] bg-border" />
                )}

              </motion.div>
            );
          })}

        </div>

      </div>
    </div>
    </section>
  );
}