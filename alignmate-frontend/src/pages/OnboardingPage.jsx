// src/pages/OnboardingPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000/auth";

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
      className={`flex flex-col items-center p-4 rounded-2xl border-2 text-center transition-all w-full
        ${selected === option.id
          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
          : "border-gray-200 hover:border-indigo-300 text-gray-700 bg-white"}`}>
      <span className="text-3xl mb-2">{option.icon}</span>
      <span className="font-semibold text-sm">{option.label}</span>
      {option.desc && <span className="text-xs text-gray-400 mt-0.5">{option.desc}</span>}
    </button>
  );
}

// ── Multi select card ✅ ──────────────────────────────────────────────────────
function MultiOptionCard({ option, selected, onToggle }) {
  const isSelected = selected.includes(option.id);
  return (
    <button type="button" onClick={() => onToggle(option.id)}
      className={`flex flex-col items-center p-4 rounded-2xl border-2 text-center transition-all w-full relative
        ${isSelected
          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
          : "border-gray-200 hover:border-indigo-300 text-gray-700 bg-white"}`}>
      {isSelected && (
        <span className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px]">
          ✓
        </span>
      )}
      <span className="text-3xl mb-2">{option.icon}</span>
      <span className="font-semibold text-sm">{option.label}</span>
      {option.desc && <span className="text-xs text-gray-400 mt-0.5">{option.desc}</span>}
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

          <div className="text-center mb-8">
            <span className="text-5xl">{current.emoji}</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-3">{current.title}</h2>
            <p className="text-gray-400 text-sm mt-1">{current.subtitle}</p>
          </div>

          {/* Step 0 — Basics */}
          {step === 0 && (
            <div className="space-y-4">
              {[
                { key: "age",       label: "Age",         min: 10,  max: 100, ph: "e.g. 22" },
                { key: "height_cm", label: "Height (cm)", min: 100, max: 250, ph: "e.g. 175" },
                { key: "weight_kg", label: "Weight (kg)", min: 30,  max: 300, ph: "e.g. 70" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-sm font-medium text-gray-700 block mb-1">{f.label}</label>
                  <input type="number" min={f.min} max={f.max}
                    value={profile[f.key]} onChange={e => set(f.key, e.target.value)}
                    placeholder={f.ph}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
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
                <p className="text-xs text-indigo-500 text-center mt-3">
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

          {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}

          {/* Nav buttons */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 border border-gray-200 rounded-xl py-3 text-sm text-gray-600 hover:bg-gray-50 transition">
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition
                  ${canProceed() ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                Continue →
              </button>
            ) : (
              <button onClick={handleFinish} disabled={!canProceed() || loading}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold transition
                  ${canProceed() && !loading ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                {loading ? "Saving..." : "Let's Go 🚀"}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          <button onClick={() => navigate("/dashboard")} className="hover:underline">
            Skip for now
          </button>
        </p>
      </div>
    </div>
  );
}