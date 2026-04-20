import { motion } from "framer-motion";
import { BarChart, Activity, ShieldCheck } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ResearchPage() {
  return (
    <div className="bg-background text-foreground">

      {/* HERO */}
      <section className="px-4 sm:px-6">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="max-w-5xl mx-auto py-16 text-center"
        >
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-bold">
            Research & Insights
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-4 text-muted-foreground">
            Data-backed insights on posture, health, and productivity.
          </motion.p>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="px-4 sm:px-6">
        <div className="max-w-6xl mx-auto py-16 grid md:grid-cols-3 gap-8">

          <StatCard icon={BarChart} value="70%" text="report discomfort" />
          <StatCard icon={Activity} value="72%" text="sit 7+ hrs/day" />
          <StatCard icon={ShieldCheck} value="80%" text="experience pain" />

        </div>
      </section>

      {/* GRAPH UI */}
      <section className="px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto py-16">

          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            className="text-2xl sm:text-3xl font-bold mb-10 text-center"
          >
            Posture Risk Analysis
          </motion.h2>

          <div className="space-y-6">

            <GraphBar label="Neck Strain Risk" value={80} />
            <GraphBar label="Back Pain Risk" value={70} />
            <GraphBar label="Productivity Loss" value={60} />
            <GraphBar label="Fatigue Increase" value={75} />

          </div>

        </div>
      </section>

      {/* CONTENT */}
      <section className="px-4 sm:px-6">
        <div className="max-w-6xl mx-auto py-16 grid md:grid-cols-2 gap-10">

          <motion.div variants={fadeUp} initial="hidden" whileInView="show">
            <h2 className="text-2xl font-bold mb-4">
              Impact of Poor Posture
            </h2>

            <p className="text-muted-foreground">
              Poor posture increases spinal stress, causes fatigue,
              and reduces productivity. Long-term effects include chronic pain
              and musculoskeletal disorders.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show">
            <h2 className="text-2xl font-bold mb-4">
              Key Findings
            </h2>

            <ul className="space-y-3 text-muted-foreground">
              <li>• 70%+ users report discomfort</li>
              <li>• Sitting long hours increases risk</li>
              <li>• Early correction reduces pain</li>
              <li>• AI feedback improves posture habits</li>
            </ul>
          </motion.div>

        </div>
      </section>

      {/* REFERENCES */}
      <section className="px-4 sm:px-6 bg-muted/30">
        <motion.div
          initial="hidden"
          whileInView="show"
          variants={fadeUp}
          className="max-w-4xl mx-auto py-16"
        >
          <h2 className="text-xl font-bold mb-6">
            References
          </h2>

          <ul className="space-y-4 text-sm">

            <li>
              <a
                href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10548303/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                PMC Study – Spinal Stress & Posture
              </a>
            </li>

            <li>
              <a
                href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9556879/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                PMC Study – Musculoskeletal Discomfort
              </a>
            </li>

            <li>
              <a
                href="https://f1000research.com/articles/13-1379"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                F1000 Research – Sitting Time Study
              </a>
            </li>

            <li>
              <a
                href="https://www.mdpi.com/1660-4601/20/24/7191"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                MDPI – Posture Study
              </a>
            </li>

          </ul>
        </motion.div>
      </section>

    </div>
  );
}

/* STAT CARD */
function StatCard({ icon: Icon, value, text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="p-6 border border-border rounded-xl text-center bg-card"
    >
      <Icon className="mx-auto mb-3 text-primary" />
      <h3 className="text-2xl font-bold">{value}</h3>
      <p className="text-muted-foreground text-sm mt-2">{text}</p>
    </motion.div>
  );
}

/* GRAPH BAR */
function GraphBar({ label, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, width: 0 }}
      whileInView={{ opacity: 1, width: "100%" }}
      className="space-y-2"
    >
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
          className="h-full bg-primary"
        />
      </div>
    </motion.div>
  );
}