// src/pages/ProfilePage.jsx
import { useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000/auth";

const LIFESTYLE_OPTIONS = [
  { id: "athlete",  label: "Athlete",       icon: "🏅" },
  { id: "gym_goer", label: "Gym Goer",      icon: "💪" },
  { id: "beginner", label: "Beginner",      icon: "🌱" },
  { id: "office",   label: "Office Worker", icon: "💼" },
  { id: "student",  label: "Student",       icon: "🎓" },
];

const LEVEL_OPTIONS = [
  { id: "beginner",     label: "Beginner",     icon: "🟢" },
  { id: "intermediate", label: "Intermediate", icon: "🟡" },
  { id: "advanced",     label: "Advanced",     icon: "🔴" },
];

const GOAL_OPTIONS = [
  { id: "weight_loss", label: "Weight Loss", icon: "⚖️" },
  { id: "bulk",        label: "Bulk",        icon: "📈" },
  { id: "cut",         label: "Cut",         icon: "✂️" },
  { id: "strength",    label: "Strength",    icon: "🏋️" },
  { id: "flexibility", label: "Flexibility", icon: "🤸" },
  { id: "stamina",     label: "Stamina",     icon: "🏃" },
];

const EQUIPMENT_OPTIONS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "gym",  label: "Gym",  icon: "🏋️" },
  { id: "both", label: "Both", icon: "⚡" },
];

const DIET_OPTIONS = [
  { id: "non_veg", label: "Non-Veg", icon: "🍗" },
  { id: "veg",     label: "Veg",     icon: "🥦" },
  { id: "vegan",   label: "Vegan",   icon: "🌱" },
];

function Chip({ option, selected, onSelect }) {
  const isSelected = Array.isArray(selected)
    ? selected.includes(option.id)
    : selected === option.id;

  return (
    <button type="button" onClick={() => onSelect(option.id)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all
        ${isSelected
          ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-medium"
          : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300"}`}>
      <span>{option.icon}</span>
      <span>{option.label}</span>
      {isSelected && <span className="text-indigo-500 text-xs">✓</span>}
    </button>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useContext(AuthContext);
  const navigate              = useNavigate();
  const profile         = user?.profile ?? {};

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  const existingGoals = profile.goal
    ? profile.goal.split(",").map(g => g.trim()).filter(Boolean)
    : [];

  const [form, setForm] = useState({
    age:       profile.age       ?? "",
    height_cm: profile.height_cm ?? "",
    weight_kg: profile.weight_kg ?? "",
    lifestyle: profile.lifestyle ?? "",
    level:     profile.level     ?? "",
    goals:     existingGoals,
    equipment: profile.equipment ?? "",
    diet:      profile.diet      ?? "",
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const toggleGoal = (id) => {
    setForm(p => ({
      ...p,
      goals: p.goals.includes(id)
        ? p.goals.filter(g => g !== id)
        : [...p.goals, id],
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true); setError(""); setSuccess(false);
    try {
      const res = await fetch(`${API}/profile/${user.id}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          age:       parseInt(form.age),
          height_cm: parseFloat(form.height_cm),
          weight_kg: parseFloat(form.weight_kg),
          lifestyle: form.lifestyle,
          level:     form.level,
          goal:      form.goals.join(","),
          equipment: form.equipment,
          diet:      form.diet,
        }),
      });
      if (!res.ok) throw new Error();

      const updated = {
        ...user,
        profile: { ...form, goal: form.goals.join(",") },
      };
      updateUser(updated);

      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── BMI calculator ────────────────────────────────────────────────────────
  const bmi = form.height_cm && form.weight_kg
    ? (parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)).toFixed(1)
    : null;

  const bmiLabel = bmi
    ? bmi < 18.5 ? { text: "Underweight", color: "text-blue-500" }
    : bmi < 25   ? { text: "Normal",      color: "text-emerald-500" }
    : bmi < 30   ? { text: "Overweight",  color: "text-amber-500" }
    : { text: "Obese", color: "text-red-500" }
    : null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-5">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage your fitness profile</p>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); setError(""); }}
                  className="text-sm border border-gray-200 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={loading}
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50">
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-8 space-y-6">

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
            ✅ Profile updated successfully!
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* ── User info card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {(user?.name ?? "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            {profile.lifestyle && (
              <p className="text-xs text-indigo-500 mt-1 capitalize">
                {LIFESTYLE_OPTIONS.find(l => l.id === profile.lifestyle)?.icon} {profile.lifestyle.replace("_", " ")} ·{" "}
                {LEVEL_OPTIONS.find(l => l.id === profile.level)?.label ?? profile.level}
              </p>
            )}
          </div>
        </div>

        {/* ── Body stats ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Body Stats</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { key: "age",       label: "Age",    unit: "yrs", min: 10,  max: 100 },
              { key: "height_cm", label: "Height", unit: "cm",  min: 100, max: 250 },
              { key: "weight_kg", label: "Weight", unit: "kg",  min: 30,  max: 300 },
            ].map(f => (
              <div key={f.key}>
                <p className="text-xs text-gray-400 mb-1">{f.label}</p>
                {editing ? (
                  <div className="flex items-center gap-1">
                    <input type="number" min={f.min} max={f.max}
                      value={form[f.key]}
                      onChange={e => set(f.key, e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    <span className="text-xs text-gray-400">{f.unit}</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-800">
                    {form[f.key] || "—"}
                    <span className="text-xs text-gray-400 ml-1 font-normal">{f.unit}</span>
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* BMI */}
          {bmi && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <p className="text-xs text-gray-500">BMI</p>
              <div className="text-right">
                <p className={`text-lg font-bold ${bmiLabel?.color}`}>{bmi}</p>
                <p className={`text-xs ${bmiLabel?.color}`}>{bmiLabel?.text}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Lifestyle & Level ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Lifestyle & Level</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">Lifestyle</p>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {LIFESTYLE_OPTIONS.map(o => (
                    <Chip key={o.id} option={o} selected={form.lifestyle} onSelect={v => set("lifestyle", v)} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  {LIFESTYLE_OPTIONS.find(l => l.id === form.lifestyle)?.icon}{" "}
                  {LIFESTYLE_OPTIONS.find(l => l.id === form.lifestyle)?.label ?? "—"}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Experience Level</p>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {LEVEL_OPTIONS.map(o => (
                    <Chip key={o.id} option={o} selected={form.level} onSelect={v => set("level", v)} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  {LEVEL_OPTIONS.find(l => l.id === form.level)?.icon}{" "}
                  {LEVEL_OPTIONS.find(l => l.id === form.level)?.label ?? "—"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Goals ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Goals</h2>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map(o => (
                <Chip key={o.id} option={o} selected={form.goals} onSelect={toggleGoal} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {form.goals.length > 0 ? form.goals.map(g => {
                const opt = GOAL_OPTIONS.find(o => o.id === g);
                return opt ? (
                  <span key={g} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm border border-indigo-100">
                    {opt.icon} {opt.label}
                  </span>
                ) : null;
              }) : <p className="text-sm text-gray-400">No goals set</p>}
            </div>
          )}
        </div>

        {/* ── Equipment & Diet ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Equipment</h2>
            {editing ? (
              <div className="flex flex-col gap-2">
                {EQUIPMENT_OPTIONS.map(o => (
                  <Chip key={o.id} option={o} selected={form.equipment} onSelect={v => set("equipment", v)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700">
                {EQUIPMENT_OPTIONS.find(e => e.id === form.equipment)?.icon}{" "}
                {EQUIPMENT_OPTIONS.find(e => e.id === form.equipment)?.label ?? "—"}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Diet</h2>
            {editing ? (
              <div className="flex flex-col gap-2">
                {DIET_OPTIONS.map(o => (
                  <Chip key={o.id} option={o} selected={form.diet} onSelect={v => set("diet", v)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700">
                {DIET_OPTIONS.find(d => d.id === form.diet)?.icon}{" "}
                {DIET_OPTIONS.find(d => d.id === form.diet)?.label ?? "—"}
              </p>
            )}
          </div>
        </div>

        {/* Regenerate plan hint */}
        {!editing && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
            <p className="text-xs text-amber-600">
              Changed your goals or stats?{" "}
              <button onClick={() => {
                localStorage.removeItem(`alignmate_plan_${user?.id}`);
                navigate("/plan");
              }} className="font-semibold underline">
                Regenerate your plan
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}