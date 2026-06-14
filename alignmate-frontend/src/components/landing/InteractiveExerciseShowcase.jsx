import { useState } from "react";
import { Dumbbell, Info, Star } from "lucide-react";

const SHOWCASE_EXERCISES = [
  {
    id: "squat",
    label: "Squat",
    icon: "🏋️",
    muscle: "Quads & Glutes",
    difficulty: "Intermediate",
    rating: 4,
    angleLabel: "Knee Hinge Angle",
    targetAngle: "90° - 110°",
    tips: [
      "Keep thighs parallel to floor at bottom",
      "Ensure knees do not cave inward",
      "Maintain a flat lower back structure"
    ],
    jointPositions: { kneeX: 110, kneeY: 220, hipX: 150, hipY: 170, ankleX: 110, ankleY: 270 }
  },
  {
    id: "pushup",
    label: "Pushup",
    icon: "💪",
    muscle: "Chest & Triceps",
    difficulty: "Beginner",
    rating: 3,
    angleLabel: "Elbow Extension",
    targetAngle: "90° - 180°",
    tips: [
      "Keep body aligned in straight plank",
      "Avoid letting hips drop or sag",
      "Tuck elbows slightly toward torso"
    ],
    jointPositions: { kneeX: 90, kneeY: 240, hipX: 130, hipY: 210, ankleX: 50, ankleY: 260 }
  },
  {
    id: "deadlift",
    label: "Deadlift",
    icon: "⚡",
    muscle: "Lower Back & Hamstrings",
    difficulty: "Advanced",
    rating: 5,
    angleLabel: "Hip Hinge Slope",
    targetAngle: "45° - 60°",
    tips: [
      "Hinge at hips, pushing them back",
      "Keep barbell close to shins",
      "Brace core and lock shoulder blades"
    ],
    jointPositions: { kneeX: 135, kneeY: 230, hipX: 160, hipY: 180, ankleX: 135, ankleY: 275 }
  },
  {
    id: "bicep_curl",
    label: "Bicep Curl",
    icon: "💪",
    muscle: "Biceps",
    difficulty: "Beginner",
    rating: 2,
    angleLabel: "Elbow Flexion",
    targetAngle: "30° - 160°",
    tips: [
      "Keep elbows pinned to your sides",
      "Prevent swinging or using momentum",
      "Squeeze biceps fully at peak of rep"
    ],
    jointPositions: { kneeX: 150, kneeY: 230, hipX: 150, hipY: 180, ankleX: 150, ankleY: 280 }
  }
];

export default function InteractiveExerciseShowcase() {
  const [selectedEx, setSelectedEx] = useState(SHOWCASE_EXERCISES[0]);

  return (
    <div className="bg-[#0b0c10] border border-white/5 rounded-3xl p-6 md:p-8 max-w-5xl mx-auto shadow-2xl relative overflow-hidden my-16 font-sans">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs bg-blue-500/10 text-blue-500 dark:text-sky-400 border border-blue-500/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">
          Exercise Catalog
        </span>
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mt-4">
          Interactive Form Guides
        </h2>
        <p className="text-gray-400 text-sm mt-3 leading-relaxed">
          AlignMate guides your posture for multiple exercises. Select an activity below to explore targeted muscles, joint angles, and AI coaching criteria.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        
        {/* Left Side: Exercise List Selector */}
        <div className="md:col-span-5 space-y-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-left mb-1">Select Activity</p>
          {SHOWCASE_EXERCISES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedEx(ex)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left group ${
                selectedEx.id === ex.id
                  ? "bg-primary/10 border-primary/30 text-white shadow-[0_0_15px_-5px_rgba(204,255,0,0.2)]"
                  : "bg-[#12141c] border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
              }`}
            >
              <span className="text-3xl bg-[#0b0c10] p-2.5 rounded-xl border border-white/5 flex items-center justify-center">
                {ex.icon}
              </span>
              <div className="flex-1">
                <p className={`font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors ${
                  selectedEx.id === ex.id ? "text-primary" : "text-white"
                }`}>
                  {ex.label}
                </p>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Target: {ex.muscle}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Right Side: Visual schematic and metrics card */}
        <div className="md:col-span-7 bg-[#12141c] border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-inner text-left">
          
          <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">{selectedEx.label} Details</h3>
                <span className="text-[9px] font-black uppercase bg-primary/25 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full leading-relaxed">
                  {selectedEx.difficulty}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                ⚙️ Tracks: <span className="text-primary font-bold">{selectedEx.angleLabel}</span> ({selectedEx.targetAngle})
              </p>
            </div>
            
            {/* Difficulty Stars */}
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < selectedEx.rating ? "text-primary fill-primary" : "text-white/10"}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            
            {/* Schematic Overlay (Interactive SVG) */}
            <div className="bg-[#0b0c10] border border-white/5 rounded-2xl p-4 flex items-center justify-center relative min-h-[180px]">
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/5">
                <Dumbbell size={10} className="text-primary" />
                <span className="text-[8px] font-bold text-white/50 uppercase tracking-wide">Joint Node map</span>
              </div>
              
              <svg viewBox="0 0 300 300" className="w-40 h-40">
                {/* Reference Grid */}
                <circle cx="150" cy="180" r="100" className="fill-none stroke-white/[0.02] stroke-1" />
                
                {/* Skeleton Overlay */}
                <line x1="150" y1="180" x2={selectedEx.jointPositions.hipX} y2={selectedEx.jointPositions.hipY} className="stroke-white/10 stroke-3" />
                <line x1={selectedEx.jointPositions.hipX} y1={selectedEx.jointPositions.hipY} x2={selectedEx.jointPositions.kneeX} y2={selectedEx.jointPositions.kneeY} className="stroke-primary stroke-4" />
                <line x1={selectedEx.jointPositions.kneeX} y1={selectedEx.jointPositions.kneeY} x2={selectedEx.jointPositions.ankleX} y2={selectedEx.jointPositions.ankleY} className="stroke-primary stroke-4" />
                
                {/* Node Points */}
                <circle cx={selectedEx.jointPositions.hipX} cy={selectedEx.jointPositions.hipY} r="5" className="fill-white/60" />
                <circle cx={selectedEx.jointPositions.kneeX} cy={selectedEx.jointPositions.kneeY} r="6" className="fill-primary" />
                <circle cx={selectedEx.jointPositions.ankleX} cy={selectedEx.jointPositions.ankleY} r="5" className="fill-white/60" />
                
                {/* Angle Radar Indicator (around knee/target hinge) */}
                <circle cx={selectedEx.jointPositions.kneeX} cy={selectedEx.jointPositions.kneeY} r="18" className="fill-primary/15 stroke-primary/30 stroke-1 stroke-dashed animate-pulse" />
              </svg>
            </div>

            {/* Coach Tips */}
            <div className="space-y-3.5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <Info size={12} className="text-primary" /> AI Form Checklist
              </p>
              <ul className="space-y-2.5">
                {selectedEx.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-gray-300 flex items-start gap-2 leading-relaxed">
                    <span className="text-primary font-black mt-0.5">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
