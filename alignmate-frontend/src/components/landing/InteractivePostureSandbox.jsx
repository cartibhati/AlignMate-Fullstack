import { useState, useEffect } from "react";
import { Volume2, VolumeX, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

export default function InteractivePostureSandbox() {
  const [postureState, setPostureState] = useState("good"); // good | bad
  const [score, setScore] = useState(98);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [feedback, setFeedback] = useState(["Perfect spinal alignment detected", "Shoulder levels balanced"]);

  const simulate = (state) => {
    setPostureState(state);
    if (state === "good") {
      setScore(98);
      setFeedback(["Perfect spinal alignment detected", "Shoulder levels balanced"]);
      if (voiceEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance("Good posture maintained. Keep it up!");
        window.speechSynthesis.speak(u);
      }
    } else {
      setScore(42);
      setFeedback(["⚠️ Warning: Neck tilt detected (Forward Head)", "⚠️ Warning: Slouched shoulders"]);
      if (voiceEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance("Sit straight! Neck tilt detected. Roll your shoulders back.");
        window.speechSynthesis.speak(u);
      }
    }
  };

  // Turn voice on/off
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance("Voice feedback enabled");
      window.speechSynthesis.speak(u);
    }
  };

  // Draw simulated skeleton joints based on state
  const neckY = postureState === "good" ? 90 : 105;
  const neckX = postureState === "good" ? 150 : 180; // Forward neck position
  const leftShoulderY = postureState === "good" ? 140 : 155;
  const leftShoulderX = 110;
  const rightShoulderY = postureState === "good" ? 140 : 155;
  const rightShoulderX = postureState === "good" ? 190 : 205;

  const skeletonColor = postureState === "good" ? "stroke-emerald-400" : "stroke-red-500";
  const jointColor = postureState === "good" ? "fill-emerald-400" : "fill-red-500";

  return (
    <div className="bg-[#0b0c10] border border-white/5 rounded-3xl p-6 md:p-8 max-w-5xl mx-auto shadow-2xl relative overflow-hidden my-16 font-sans">
      
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -z-10" />

      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">
          Interactive Sandbox
        </span>
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mt-4">
          Try the AI Engine
        </h2>
        <p className="text-gray-400 text-sm mt-3 leading-relaxed">
          Experience our real-time posture analysis algorithms right in your browser. Click the buttons below to simulate sitting states and see how the AI responds.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-center">
        
        {/* Left Control Panel: Buttons & Feedback */}
        <div className="md:col-span-5 space-y-6 text-left">
          
          {/* Simulation Switches */}
          <div className="bg-[#12141c] border border-white/5 p-4 rounded-2xl space-y-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Posture State</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => simulate("good")}
                className={`py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border ${
                  postureState === "good"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] font-black"
                    : "bg-transparent text-gray-400 border-white/5 hover:border-white/10"
                }`}
              >
                <CheckCircle2 size={14} /> Good Posture
              </button>
              <button
                onClick={() => simulate("bad")}
                className={`py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 border ${
                  postureState === "bad"
                    ? "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)] font-black"
                    : "bg-transparent text-gray-400 border-white/5 hover:border-white/10"
                }`}
              >
                <ShieldAlert size={14} /> Bad Posture
              </button>
            </div>
          </div>

          {/* Voice Switch */}
          <div className="flex justify-between items-center bg-[#12141c] border border-white/5 p-4 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-tight">Audio Voice Feedback</p>
              <p className="text-[10px] text-gray-400 mt-1">AI speaks posture alerts in real time</p>
            </div>
            <button
              onClick={toggleVoice}
              className={`p-3 rounded-xl border transition-all ${
                voiceEnabled
                  ? "bg-primary text-primary-foreground border-primary shadow-neon"
                  : "bg-transparent text-gray-400 border-white/10 hover:bg-white/5"
              }`}
            >
              {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>

          {/* AI Feedback Alerts */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Real-time correction cues</p>
            {feedback.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border text-xs font-semibold leading-relaxed transition-all duration-300 ${
                  postureState === "good"
                    ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                    : "bg-red-500/5 border-red-500/10 text-red-400"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right Sandbox Visualization (Skeletal View & Score Ring) */}
        <div className="md:col-span-7 bg-[#12141c] border border-white/5 rounded-3xl p-6 relative flex flex-col items-center justify-center min-h-[360px] overflow-hidden shadow-inner">
          
          {/* Technical Grid Accent */}
          <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

          {/* Posture Score Ring Overlay */}
          <div className="absolute top-4 right-4 bg-[#0b0c10]/95 border border-white/5 px-4 py-3 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all duration-300 z-10">
            <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Score</p>
            <span className={`text-2xl font-black font-display leading-none mt-1 ${postureState === "good" ? "text-emerald-400" : "text-red-400"}`}>
              {score}%
            </span>
            <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase">
              {postureState === "good" ? "Balanced" : "Slouching"}
            </span>
          </div>

          {/* Camera Mockup Header */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
            <div className={`w-1.5 h-1.5 rounded-full animate-ping ${postureState === "good" ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Webcam Sandbox</span>
          </div>

          {/* Skeleton Overlay */}
          <svg viewBox="0 0 300 300" className="w-64 h-64 relative z-0">
            {/* Background Human Form Reference (Faint Outline) */}
            <circle cx="150" cy="90" r="30" className="fill-white/[0.02] stroke-white/[0.04] stroke-2" />
            <path d="M100,140 Q150,135 200,140 L210,240 Q150,250 90,240 Z" className="fill-white/[0.01] stroke-white/[0.03] stroke-2" />

            {/* Spine Connection Line (Crucial Posture Indicator) */}
            <path
              d={postureState === "good" 
                ? "M150,120 Q150,170 150,220" 
                : "M180,120 Q165,170 150,220"} 
              className={`fill-none stroke-4 stroke-dashed transition-all duration-500 ${skeletonColor}`}
              strokeDasharray="4 4"
            />

            {/* Head to Neck connection */}
            <line x1={neckX} y1={neckY - 30} x2={neckX} y2={neckY} className={`stroke-3 transition-all duration-500 ${skeletonColor}`} />

            {/* Collar/Shoulders line */}
            <line x1={leftShoulderX} y1={leftShoulderY} x2={rightShoulderX} y2={rightShoulderY} className={`stroke-4 transition-all duration-500 ${skeletonColor}`} />

            {/* Left Arm joints */}
            <line x1={leftShoulderX} y1={leftShoulderY} x2="80" y2="200" className={`stroke-3 transition-all duration-500 ${skeletonColor}`} />
            
            {/* Right Arm joints */}
            <line x1={rightShoulderX} y1={rightShoulderY} x2={postureState === "good" ? "220" : "235"} y2="200" className={`stroke-3 transition-all duration-500 ${skeletonColor}`} />

            {/* Spine Center Joint Dots */}
            {/* Head */}
            <circle cx={neckX} cy={neckY - 30} r="10" className={`transition-all duration-500 ${jointColor}`} />
            
            {/* Neck Joint */}
            <circle cx={neckX} cy={neckY} r="5" className={`transition-all duration-500 ${jointColor}`} />
            
            {/* Shoulders */}
            <circle cx={leftShoulderX} cy={leftShoulderY} r="5" className={`transition-all duration-500 ${jointColor}`} />
            <circle cx={rightShoulderX} cy={rightShoulderY} r="5" className={`transition-all duration-500 ${jointColor}`} />

            {/* Elbows */}
            <circle cx="80" cy="200" r="4" className={`transition-all duration-500 ${jointColor}`} />
            <circle cx={postureState === "good" ? "220" : "235"} cy="200" r="4" className={`transition-all duration-500 ${jointColor}`} />

            {/* Base Hip point */}
            <circle cx="150" cy="220" r="6" className={`transition-all duration-500 ${jointColor}`} />
          </svg>

          {/* Overlay Status Badge */}
          <div className="absolute bottom-4 flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all duration-300 ${
              postureState === "good"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]"
                : "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]"
            }`}>
              {postureState === "good" ? "✓ Balanced Spine" : "⚠️ Posture Slouched"}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
