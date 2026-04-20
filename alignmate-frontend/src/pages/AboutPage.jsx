import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Target, Eye, Brain } from "lucide-react";
import { assets } from "@/assets";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground">

      {/* HERO */}
      <section className="px-4 sm:px-6">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="max-w-5xl mx-auto py-16 sm:py-20 text-center"
        >
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
          >
            About AlignMate
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-muted-foreground max-w-2xl mx-auto"
          >
            A smarter way to build better posture habits using real-time AI feedback.
          </motion.p>
        </motion.div>
      </section>

      {/* IMAGE + INTRO */}
      <section className="px-4 sm:px-6">
        <div className="max-w-6xl mx-auto py-16 grid md:grid-cols-2 gap-10 items-center">

          {/* IMAGE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="w-full h-[260px] sm:h-[320px] lg:h-[360px] rounded-2xl overflow-hidden border border-border shadow-sm"
          >
            <img
              src={assets.about1_am}
              alt="Posture awareness"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* TEXT */}
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            className="space-y-4 text-center md:text-left"
          >
            <h2 className="text-3xl font-bold tracking-tight">
              Why AlignMate Exists
            </h2>

            <p className="text-muted-foreground">
              Long hours of sitting, poor posture habits, and lack of awareness
              are leading causes of chronic pain today.
            </p>

            <p className="text-muted-foreground">
              AlignMate was built to solve this problem in real-time — not after
              damage is done.
            </p>
          </motion.div>

        </div>
      </section>

      {/* MISSION */}
      <section className="px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto py-16 grid md:grid-cols-2 gap-10 items-start">

          {/* LEFT */}
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <Target className="text-primary" />
              <h2 className="text-3xl font-bold tracking-tight">
                Our Mission
              </h2>
            </div>

            <p className="text-muted-foreground">
              To prevent posture-related health issues by making awareness
              effortless and real-time.
            </p>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            className="space-y-4 text-muted-foreground"
          >
            <p>
              Instead of reacting to pain, AlignMate focuses on prevention —
              guiding users toward healthier posture habits throughout the day.
            </p>

            <p>
              Our goal is to integrate posture correction seamlessly into daily
              routines without requiring extra effort.
            </p>
          </motion.div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 sm:px-6">
        <div className="max-w-6xl mx-auto py-16 text-center">

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12">
            What Makes Us Different
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            {[ 
              { icon: Eye, title: "Real-Time Feedback", desc: "Instant posture correction while you work." },
              { icon: Brain, title: "AI-Powered Analysis", desc: "Smart posture detection using AI." },
              { icon: Target, title: "Habit Building", desc: "Focus on long-term improvement." }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="show"
                  variants={fadeUp}
                  className="space-y-3"
                >
                  <Icon className="mx-auto text-primary" />
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}

          </div>
        </div>
      </section>

      {/* SECOND IMAGE SECTION */}
      <section className="px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto py-16 grid md:grid-cols-2 gap-10 items-center">

          {/* TEXT */}
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            className="space-y-4 text-center md:text-left"
          >
            <h2 className="text-3xl font-bold tracking-tight">
              Built with Modern Technology
            </h2>

            <p className="text-muted-foreground">
              AlignMate uses computer vision and AI to analyze posture in real-time,
              directly in your browser.
            </p>
          </motion.div>

          {/* IMAGE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="w-full h-[260px] sm:h-[320px] lg:h-[360px] rounded-2xl overflow-hidden border border-border shadow-sm"
          >
            <img
              src={assets.about2_am}
              alt="AI posture detection"
              className="w-full h-full object-cover"
            />
          </motion.div>

        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto py-16 text-center bg-card border border-border rounded-2xl p-8 space-y-4"
        >
          <h2 className="text-2xl sm:text-3xl font-bold">
            Start Improving Your Posture Today
          </h2>

          <Link to="/live">
            <button className="px-6 py-3 rounded-xl bg-primary text-primary-foreground">
              Start Live Session
            </button>
          </Link>
        </motion.div>
      </section>

    </div>
  );
}