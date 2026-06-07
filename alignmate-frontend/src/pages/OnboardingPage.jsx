// src/pages/OnboardingPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL } from "@/config";

const API = `${API_BASE_URL}/auth`;

const STEPS = [
  { id: "basics",    title: "Basic Info",       subtitle: "Tell us about yourself",           emoji: "👤" },
  { id: "lifestyle", title: "Your Lifestyle",   subtitle: "How would you describe yourself?", emoji: "🏃" },
  { id: "level",     title: "Experience Level", subtitle: "How experienced are you?",         emoji: "📊" },
  { id: "goal",      title: "Your Goals",       subtitle: "Select all that apply",            emoji: "🎯" },
  { id: "equipment", title: "Equipment Access", subtitle: "Where do you work out?",           emoji: "🏋️" },
  { id: "diet",      title: "Diet Preference",  subtitle: "What's your diet type?",           emoji: "🥗" },
];

const LIFESTYLE_OPTIONS = [
  { id: "athlete",  label: "Athlete",       icon: "🏅", desc: "Sports & training focused" },
  { id: "gym_goer", label: "Gym Goer",      icon: "💪", desc: "Regular gym sessions" },
  { id: "beginner", label: "Beginner",      icon: "🌱", desc: "Just getting started" },
  { id: "office",   label: "Office Worker", icon: "💼", desc: "Desk job, sedentary" },
  { id: "student",  label: "Student",       icon: "🎓", desc: "Student lifestyle" },
];

const LEVEL_OPTIONS = [
  { id: "beginner",     label: "Beginner",     icon: "🟢", desc: "0–1 year of training" },
  { id: "intermediate", label: "Intermediate", icon: "🟡", desc: "1–3 years of training" },
  { id: "advanced",     label: "Advanced",     icon: "🔴", desc: "3+ years of training" },
];

const GOAL_OPTIONS = [
  { id: "weight_loss", label: "Weight Loss", icon: "⚖️", desc: "Burn fat, slim down" },
  { id: "bulk",        label: "Bulk",        icon: "📈", desc: "Build mass & size" },
  { id: "cut",         label: "Cut",         icon: "✂️", desc: "Lean out, keep muscle" },
  { id: "strength",    label: "Strength",    icon: "🏋️", desc: "Get stronger" },
  { id: "flexibility", label: "Flexibility", icon: "🤸", desc: "Improve range of motion" },
  { id: "stamina",     label: "Stamina",     icon: "🏃", desc: "Build endurance" },
];

const EQUIPMENT_OPTIONS = [
  { id: "home", label: "Home", icon: "🏠", desc: "Bodyweight & minimal gear" },
  { id: "gym",  label: "Gym",  icon: "🏋️", desc: "Full gym access" },
  { id: "both", label: "Both", icon: "⚡", desc: "Home + gym" },
];

const DIET_OPTIONS = [
  { id: "non_veg", label: "Non-Veg", icon: "🍗", desc: "Includes meat & eggs" },
  { id: "veg",     label: "Veg",     icon: "🥦", desc: "No meat, includes dairy" },
  { id: "vegan",   label: "Vegan",   icon: "🌱", desc: "No animal products" },
];

// ── Single select card ────────────────────────────────────────────────────────
function OptionCard({ option, selected, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(option.id)}
      className={`flex flex-col items-center p-5 rounded-2xl border-2 text-center transition-all w-full font-sans
        ${selected === option.id
          ? "border-primary bg-primary/10 text-foreground shadow-neon"
          : "border-border hover:border-primary/50 text-foreground bg-card"}`}>
      <span className="text-3xl mb-2">{option.icon}</span>
      <span className="font-bold text-sm tracking-tight">{option.label}</span>
      {option.desc && <span className="text-[11px] text-muted-foreground mt-1 font-medium">{option.desc}</span>}
    </button>
  );
}

// ── Multi select card ✅ ──────────────────────────────────────────────────────
function MultiOptionCard({ option, selected, onToggle }) {
  const isSelected = selected.includes(option.id);
  return (
    <button type="button" onClick={() => onToggle(option.id)}
      className={`flex flex-col items-center p-5 rounded-2xl border-2 text-center transition-all w-full relative font-sans
        ${isSelected
          ? "border-primary bg-primary/10 text-foreground shadow-neon"
          : "border-border hover:border-primary/50 text-foreground bg-card"}`}>
      {isSelected && (
        <span className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-black text-[10px]">
          ✓
        </span>
      )}
      <span className="text-3xl mb-2">{option.icon}</span>
      <span className="font-bold text-sm tracking-tight">{option.label}</span>
      {option.desc && <span className="text-[11px] text-muted-foreground mt-1 font-medium">{option.desc}</span>}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem("currentUser") || "{}");

  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [profile, setProfile] = useState({
    age: "", height_cm: "", weight_kg: "",
    lifestyle: "", level: "",
    goals:     [],        // ✅ array
    equipment: "", diet: "",
  });

  const set = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  // ✅ Toggle goal in/out of selection
  const toggleGoal = (id) => {
    setProfile(p => ({
      ...p,
      goals: p.goals.includes(id)
        ? p.goals.filter(g => g !== id)
        : [...p.goals, id],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return profile.age && profile.height_cm && profile.weight_kg;
      case 1: return !!profile.lifestyle;
      case 2: return !!profile.level;
      case 3: return profile.goals.length > 0;   // ✅ at least 1
      case 4: return !!profile.equipment;
      case 5: return !!profile.diet;
      default: return true;
    }
  };

  const handleFinish = async () => {
    if (!user?.id) { navigate("/login"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/profile/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age:       parseInt(profile.age),
          height_cm: parseFloat(profile.height_cm),
          weight_kg: parseFloat(profile.weight_kg),
          lifestyle: profile.lifestyle,
          level:     profile.level,
          goal:      profile.goals.join(","),   // ✅ "bulk,strength,stamina"
          equipment: profile.equipment,
          diet:      profile.diet,
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");

      localStorage.setItem("currentUser", JSON.stringify({
        ...user,
        profile: { ...profile, goal: profile.goals.join(",") },
      }));
      navigate("/dashboard");
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const current  = STEPS[step];

  return (
    <div className="min-h-screen bg-background bg-grid flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Progress */}
        <div className="mb-8 font-sans">
          <div className="flex justify-between text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500 shadow-neon"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-3xl shadow-lg border border-border p-8">

          <div className="text-center mb-8">
            <span className="text-5xl">{current.emoji}</span>
            <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mt-4 font-sans">{current.title}</h2>
            <p className="text-muted-foreground text-sm font-medium mt-1.5">{current.subtitle}</p>
          </div>

          {/* Step 0 — Basics */}
          {step === 0 && (
            <div className="space-y-4">
              {[
                { key: "age",       label: "Age",         min: 10,  max: 100, ph: "e.g. 22" },
                { key: "height_cm", label: "Height (cm)", min: 100, max: 250, ph: "e.g. 175" },
                { key: "weight_kg", label: "Weight (kg)", min: 30,  max: 300, ph: "e.g. 70" },
              ].map(f => (
                <div key={f.key} className="text-left font-sans">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">{f.label}</label>
                  <input type="number" min={f.min} max={f.max}
                    value={profile[f.key]} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.ph}
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium" />
                </div>
              ))}
            </div>
          )}

          {/* Step 1 — Lifestyle */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {LIFESTYLE_OPTIONS.map(o => (
                <OptionCard key={o.id} option={o} selected={profile.lifestyle} onSelect={v => set("lifestyle", v)} />
              ))}
            </div>
          )}

          {/* Step 2 — Level */}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              {LEVEL_OPTIONS.map(o => (
                <OptionCard key={o.id} option={o} selected={profile.level} onSelect={v => set("level", v)} />
              ))}
            </div>
          )}

          {/* Step 3 — Goals (multi-select) ✅ */}
          {step === 3 && (
            <div>
              <div className="grid grid-cols-2 gap-3">
                {GOAL_OPTIONS.map(o => (
                  <MultiOptionCard key={o.id} option={o} selected={profile.goals} onToggle={toggleGoal} />
                ))}
              </div>
              {profile.goals.length > 0 && (
                <p className="text-xs text-primary font-bold uppercase tracking-wider text-center mt-4 animate-pulse">
                  {profile.goals.length} goal{profile.goals.length > 1 ? "s" : ""} selected ✓
                </p>
              )}
            </div>
          )}

          {/* Step 4 — Equipment */}
          {step === 4 && (
            <div className="grid grid-cols-3 gap-3">
              {EQUIPMENT_OPTIONS.map(o => (
                <OptionCard key={o.id} option={o} selected={profile.equipment} onSelect={v => set("equipment", v)} />
              ))}
            </div>
          )}

          {/* Step 5 — Diet */}
          {step === 5 && (
            <div className="grid grid-cols-3 gap-3">
              {DIET_OPTIONS.map(o => (
                <OptionCard key={o.id} option={o} selected={profile.diet} onSelect={v => set("diet", v)} />
              ))}
            </div>
          )}

          {error && <p className="text-sm font-bold text-red-500 mt-4 text-center">{error}</p>}

          {/* Nav buttons */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 border border-border rounded-xl py-3 text-sm font-bold text-muted-foreground bg-transparent hover:bg-accent transition-all duration-200">
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                className={`flex-1 rounded-xl py-3 text-sm font-black uppercase tracking-wider transition-all duration-200
                  ${canProceed() ? "bg-primary text-primary-foreground hover:opacity-90 shadow-neon" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                Continue →
              </button>
            ) : (
              <button onClick={handleFinish} disabled={!canProceed() || loading}
                className={`flex-1 rounded-xl py-3 text-sm font-black uppercase tracking-wider transition-all duration-200
                  ${canProceed() && !loading ? "bg-primary text-primary-foreground hover:opacity-90 shadow-neon" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                {loading ? "Saving..." : "Let's Go 🚀"}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4 font-medium">
          <button onClick={() => navigate("/dashboard")} className="hover:text-foreground hover:underline transition">
            Skip for now
          </button>
        </p>
      </div>
    </div>
  );
}