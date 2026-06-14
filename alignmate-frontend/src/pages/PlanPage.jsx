// src/pages/PlanPage.jsx
import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL } from "@/config";

const API = API_BASE_URL;

const GOAL_LABELS = {
  weight_loss: "Weight Loss", bulk: "Bulk", cut: "Cut",
  strength: "Strength", flexibility: "Flexibility", stamina: "Stamina",
};

// ── Client-side exercise mapper ───────────────────────────────────────────────
const KEYWORD_MAP = {
  "bench": "bench_press", "chest press": "bench_press", "incline press": "bench_press",
  "decline": "bench_press", "dumbbell press": "bench_press",
  "incline dumbbell press": "incline_dumbbell_press",
  "squat": "squat", "goblet": "squat", "box squat": "squat",
  "leg press": "leg_press",
  "bodyweight squat": "bodyweight_squat",
  "deadlift": "deadlift", "romanian": "deadlift", "rdl": "deadlift", "sumo": "deadlift",
  "single leg deadlift": "single_leg_deadlift",
  "row": "barbell_row", "bent over": "barbell_row", "cable row": "barbell_row",
  "lat pulldown": "lat_pulldown", "pulldown": "lat_pulldown",
  "face pull": "face_pulls", "facepull": "face_pulls",
  "overhead press": "shoulder_press", "shoulder press": "shoulder_press",
  "military press": "shoulder_press", "ohp": "shoulder_press", "arnold": "shoulder_press",
  "push-up": "pushup", "push up": "pushup", "pushup": "pushup",
  "pike pushup": "pike_pushup", "pike push-up": "pike_pushup",
  "incline pushup": "incline_pushup", "incline push-up": "incline_pushup",
  "lunge": "lunge", "split squat": "lunge", "bulgarian": "lunge", "step up": "lunge",
  "plank shoulder taps": "plank_shoulder_taps", "shoulder tap": "plank_shoulder_taps",
  "plank": "plank",
  "curl": "bicep_curl", "bicep": "bicep_curl", "hammer curl": "bicep_curl",
  "lateral": "lateral_raise", "side raise": "lateral_raise",
  "dip": "tricep_dip", "tricep": "tricep_dip", "skull crusher": "tricep_dip",
  "pushdown": "tricep_dip",
  "hip thrust": "hip_thrust", "glute bridge": "hip_thrust", "hip bridge": "hip_thrust",
};

function mapExerciseName(name) {
  const lower = name.toLowerCase().trim();
  let best = null, bestLen = 0;
  for (const [kw, id] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(kw) && kw.length > bestLen) { best = id; bestLen = kw.length; }
  }
  return best;
}

export default function PlanPage() {
  const { user }  = useContext(AuthContext);
  const navigate  = useNavigate();
  const profile   = user?.profile;

  const [plan, setPlan]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [activeDay, setActiveDay] = useState(0);
  const [activeTab, setActiveTab] = useState("workout");

  const fetchPlan = useCallback(async () => {
    if (!profile) { navigate("/onboarding"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/generate-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: profile.age ?? 25,
          height_cm: profile.height_cm ?? 170,
          weight_kg: profile.weight_kg ?? 70,
          lifestyle: profile.lifestyle ?? "beginner",
          level: profile.level ?? "beginner",
          goal: profile.goal ?? "weight_loss",
          equipment: profile.equipment ?? "home",
          diet: profile.diet ?? "non_veg",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data);
      localStorage.setItem(`alignmate_plan_${user?.id}`, JSON.stringify(data));
    } catch (err) {
      console.warn("Plan generation failed", err);
      setError("Failed to generate plan. Make sure Ollama is running.");
    } finally {
      setLoading(false);
    }
  }, [navigate, profile, user?.id]);

  useEffect(() => {
    const cached = localStorage.getItem(`alignmate_plan_${user?.id}`);
    if (cached) {
      try {
        setPlan(JSON.parse(cached));
        return;
      } catch {
        localStorage.removeItem(`alignmate_plan_${user?.id}`);
      }
    }

    if (profile) {
      fetchPlan();
    }
  }, [profile, user?.id, fetchPlan]);

  const handleRegenerate = async () => {
    localStorage.removeItem(`alignmate_plan_${user?.id}`);
    setPlan(null);
    await fetchPlan();
  };

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid font-sans">
      <div className="text-center">
        <p className="text-5xl mb-4">📋</p>
        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">Complete your profile first</h2>
        <button onClick={() => navigate("/onboarding")}
          className="mt-4 bg-primary text-primary-foreground font-bold shadow-neon px-6 py-2.5 rounded-xl text-sm uppercase tracking-wider">Complete Profile</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid font-sans">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">Building your plan...</h2>
        <p className="text-muted-foreground text-xs font-semibold mt-2">This takes ~20-30 seconds</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid font-sans">
      <div className="text-center">
        <p className="text-5xl mb-4">⚠️</p>
        <p className="text-red-500 font-bold text-sm mb-4">{error}</p>
        <button onClick={fetchPlan} className="bg-primary text-primary-foreground font-bold shadow-neon px-6 py-2.5 rounded-xl text-sm uppercase tracking-wider">Try Again</button>
      </div>
    </div>
  );

  if (!plan) return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid font-sans">
      <div className="text-center">
        <p className="text-6xl mb-4">🤖</p>
        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">Ready to generate your plan?</h2>
        <p className="text-muted-foreground text-sm font-medium mb-6">
          Goal: <strong className="text-foreground">{GOAL_LABELS[profile.goal] ?? profile.goal}</strong> · Level: <strong className="text-foreground">{profile.level}</strong>
        </p>
        <button onClick={fetchPlan}
          className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-black uppercase tracking-widest hover:opacity-90 shadow-neon transition duration-200">
          Generate My Plan 🚀
        </button>
      </div>
    </div>
  );

  const days      = plan.weekly_plan ?? [];
  const tips      = plan.tips ?? [];
  const today     = days[activeDay];
  const isRest    = !today?.exercises?.length;
  const dietDays  = plan.diet_plan?.days ?? [];
  const macros    = plan.diet_plan?.macros ?? {};
  const todayDiet = dietDays.find(d => d.day?.toLowerCase() === today?.day?.toLowerCase())
    ?? dietDays[activeDay] ?? null;

  return (
    <div className="min-h-screen bg-background bg-grid font-sans text-left">

      <div className="bg-card border-b border-border px-6 md:px-10 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Your Plan</h1>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
              {GOAL_LABELS[profile.goal] ?? profile.goal} · {profile.level} · {profile.equipment}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/profile")}
              className="text-xs border border-border px-4 py-2 rounded-xl text-foreground font-bold hover:bg-accent transition">
              ✏️ Edit Profile Settings
            </button>
            <button onClick={handleRegenerate}
              className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:opacity-90 shadow-neon transition">
              🔄 Regenerate Plan
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-6">

        {plan.summary && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5">
            <p className="text-sm font-semibold text-foreground leading-relaxed">🤖 {plan.summary}</p>
          </div>
        )}

        <div className="flex gap-2">
          {["workout", "diet"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200
                ${activeTab === tab ? "bg-primary text-primary-foreground shadow-neon" : "bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
              {tab === "workout" ? "💪 Workout" : "🥗 Diet"}
            </button>
          ))}
        </div>

        {/* Day selector */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => {
            const rest = !d.exercises?.length;
            return (
              <button key={i} onClick={() => setActiveDay(i)}
                className={`flex flex-col items-center py-3 px-1 rounded-xl border transition-all text-center duration-200
                  ${activeDay === i ? "bg-primary text-primary-foreground border-primary shadow-neon"
                    : rest ? "bg-muted/30 border-border text-muted-foreground/60"
                    : "bg-card border-border text-foreground hover:border-primary/50 hover:text-foreground"}`}>
                <p className="font-bold text-xs uppercase">{d.day?.slice(0, 3)}</p>
                <p className={`text-[9px] font-bold uppercase tracking-tighter mt-0.5 ${activeDay === i ? "text-primary-foreground" : "text-muted-foreground/80"}`}>
                  {rest ? "Rest" : d.focus?.split(" ")[0]}
                </p>
              </button>
            );
          })}
        </div>

        {/* Workout tab */}
        {activeTab === "workout" && (
          <div>
            {isRest ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <p className="text-5xl mb-4">😴</p>
                <p className="text-lg font-black text-foreground uppercase tracking-tight">Rest Day — {today?.day}</p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Recovery is where the muscles grow. Enjoy the rest!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-card rounded-2xl border border-primary/20 px-5 py-4">
                  <p className="font-extrabold text-foreground uppercase tracking-tight">{today?.day}</p>
                  <p className="text-xs text-primary font-bold uppercase tracking-wider mt-0.5">{today?.focus}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{today?.exercises?.length} exercises structured</p>
                </div>

                {today?.exercises?.map((ex, i) => {
                  const exerciseId = mapExerciseName(ex.name);
                  return (
                    <div key={i} className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 transition-all duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-foreground text-sm uppercase tracking-tight">{ex.name}</p>
                          {i === 0 && (
                            <span className="text-[9px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border mt-1 inline-block uppercase tracking-wider">
                              Compound
                            </span>
                          )}
                        </div>
                        <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-black font-display shadow-neon">
                          {ex.sets} × {ex.reps}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-semibold mb-2">⏱ Rest period: {ex.rest}</p>
                      {ex.tip && (
                        <p className="text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2.5 mb-3 font-medium border border-border/40">
                          💡 {ex.tip}
                        </p>
                      )}

                      {/* ✅ Track Posture button */}
                      {exerciseId ? (
                        <button
                          onClick={() => navigate(`/exercise?id=${exerciseId}&name=${encodeURIComponent(ex.name)}`)}
                          className="flex items-center gap-2 text-xs bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:opacity-90 shadow-neon transition font-black uppercase tracking-wider w-fit">
                          📷 Track Posture
                        </button>
                      ) : (
                        <p className="text-xs text-muted-foreground italic font-medium mt-2">Posture tracking not available for this exercise</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Diet tab */}
        {activeTab === "diet" && (
          <div className="space-y-5">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Calories", value: plan.diet_plan?.daily_calories ?? "-", unit: "kcal", color: "text-orange-500" },
                { label: "Protein",  value: macros.protein_g ?? "-", unit: "g", color: "text-red-500" },
                { label: "Carbs",    value: macros.carbs_g   ?? "-", unit: "g", color: "text-yellow-500" },
                { label: "Fats",     value: macros.fats_g    ?? "-", unit: "g", color: "text-blue-500" },
              ].map(m => (
                <div key={m.label} className="bg-card rounded-2xl border border-border p-4 text-center hover:border-primary/20 transition duration-200">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                  <p className={`text-2xl font-black font-display ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{m.unit}</p>
                </div>
              ))}
            </div>

            {todayDiet ? (
              <div className="space-y-3">
                <div className="bg-card rounded-2xl border border-primary/20 px-5 py-3.5">
                  <p className="font-extrabold text-foreground uppercase tracking-tight">{today?.day}'s MealsSplit</p>
                </div>
                {todayDiet.meals?.map((meal, i) => (
                  <div key={i} className="bg-card rounded-2xl border border-border p-5 hover:border-primary/20 transition Duration-200">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="font-bold text-foreground text-sm uppercase tracking-tight">{meal.name}</p>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">{meal.time}</p>
                      </div>
                      <span className="text-xs bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2.5 py-0.5 rounded-full font-black font-display shadow-sm">
                        {meal.calories} kcal
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {meal.foods?.map((food, j) => (
                        <span key={j} className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full border border-border/40 font-bold uppercase tracking-tight text-[10px]">
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <p className="text-muted-foreground font-medium text-sm">No diet splits logged for this day.</p>
              </div>
            )}
          </div>
        )}

        {tips.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-5">
            <p className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">💡 Coach Tips</p>
            <ul className="space-y-2.5">
              {tips.map((tip, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2 font-medium">
                  <span className="text-primary font-black mt-0.5">→</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}