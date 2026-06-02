// src/pages/PlanPage.jsx
import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";

const GOAL_LABELS = {
  weight_loss: "Weight Loss", bulk: "Bulk", cut: "Cut",
  strength: "Strength", flexibility: "Flexibility", stamina: "Stamina",
};

// ── Client-side exercise mapper ───────────────────────────────────────────────
const KEYWORD_MAP = {
  "bench": "bench_press", "chest press": "bench_press", "incline": "bench_press",
  "decline": "bench_press", "dumbbell press": "bench_press",
  "squat": "squat", "goblet": "squat", "leg press": "squat", "box squat": "squat",
  "deadlift": "deadlift", "romanian": "deadlift", "rdl": "deadlift", "sumo": "deadlift",
  "row": "barbell_row", "bent over": "barbell_row", "cable row": "barbell_row",
  "overhead press": "shoulder_press", "shoulder press": "shoulder_press",
  "military press": "shoulder_press", "ohp": "shoulder_press", "arnold": "shoulder_press",
  "push-up": "pushup", "push up": "pushup", "pushup": "pushup",
  "lunge": "lunge", "split squat": "lunge", "bulgarian": "lunge", "step up": "lunge",
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-5xl mb-4">📋</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Complete your profile first</h2>
        <button onClick={() => navigate("/onboarding")}
          className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm">Complete Profile</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Building your plan...</h2>
        <p className="text-gray-300 text-xs mt-2">This takes ~20-30 seconds</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-5xl mb-4">⚠️</p>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button onClick={fetchPlan} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm">Try Again</button>
      </div>
    </div>
  );

  if (!plan) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl mb-4">🤖</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to generate your plan?</h2>
        <p className="text-gray-400 text-sm mb-6">
          Goal: <strong>{GOAL_LABELS[profile.goal] ?? profile.goal}</strong> · Level: <strong>{profile.level}</strong>
        </p>
        <button onClick={fetchPlan}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
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
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your Plan</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {GOAL_LABELS[profile.goal] ?? profile.goal} · {profile.level} · {profile.equipment}
            </p>
          </div>
          <button onClick={handleRegenerate}
            className="text-xs border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition">
            🔄 Regenerate
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-6">

        {plan.summary && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <p className="text-sm text-indigo-700 leading-relaxed">🤖 {plan.summary}</p>
          </div>
        )}

        <div className="flex gap-2">
          {["workout", "diet"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition
                ${activeTab === tab ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
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
                className={`flex flex-col items-center py-3 px-1 rounded-xl border transition text-center
                  ${activeDay === i ? "bg-indigo-600 text-white border-indigo-600"
                    : rest ? "bg-gray-50 border-gray-200 text-gray-400"
                    : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300"}`}>
                <p className="font-semibold text-xs">{d.day?.slice(0, 3)}</p>
                <p className={`text-[10px] mt-0.5 ${activeDay === i ? "text-indigo-200" : "text-gray-400"}`}>
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
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <p className="text-4xl mb-3">😴</p>
                <p className="font-semibold text-gray-700">Rest Day — {today?.day}</p>
                <p className="text-sm text-gray-400 mt-1">Recovery is where the gains happen.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl border border-indigo-100 px-5 py-4">
                  <p className="font-bold text-gray-800">{today?.day}</p>
                  <p className="text-sm text-indigo-600 mt-0.5">{today?.focus}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{today?.exercises?.length} exercises</p>
                </div>

                {today?.exercises?.map((ex, i) => {
                  const exerciseId = mapExerciseName(ex.name);
                  return (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">{ex.name}</p>
                          {i === 0 && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full mt-1 inline-block">
                              Compound
                            </span>
                          )}
                        </div>
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium">
                          {ex.sets} × {ex.reps}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">⏱ Rest: {ex.rest}</p>
                      {ex.tip && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                          💡 {ex.tip}
                        </p>
                      )}

                      {/* ✅ Track Posture button */}
                      {exerciseId ? (
                        <button
                          onClick={() => navigate(`/exercise?id=${exerciseId}&name=${encodeURIComponent(ex.name)}`)}
                          className="flex items-center gap-2 text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition font-medium w-fit">
                          📷 Track Posture
                        </button>
                      ) : (
                        <p className="text-xs text-gray-300 italic">Posture tracking not available for this exercise</p>
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
                <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                  <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-gray-400">{m.unit}</p>
                </div>
              ))}
            </div>

            {todayDiet ? (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl border border-indigo-100 px-5 py-3">
                  <p className="font-bold text-gray-800">{today?.day}'s Meals</p>
                </div>
                {todayDiet.meals?.map((meal, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{meal.name}</p>
                        <p className="text-xs text-gray-400">{meal.time}</p>
                      </div>
                      <span className="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">
                        {meal.calories} kcal
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {meal.foods?.map((food, j) => (
                        <span key={j} className="text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full border border-gray-100">
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-gray-400 text-sm">No diet data for this day.</p>
              </div>
            )}
          </div>
        )}

        {tips.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">💡 Coach Tips</p>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-indigo-400 mt-0.5">→</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}