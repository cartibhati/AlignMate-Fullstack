// src/pages/CalendarPage.jsx
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

// ── localStorage helpers ──────────────────────────────────────────────────────
const KEY = (email) => `alignmate_calendar_${email}`;

function getCompletedDays(email) {
  try { return JSON.parse(localStorage.getItem(KEY(email)) ?? "[]"); }
  catch { return []; }
}

function saveCompletedDays(email, days) {
  localStorage.setItem(KEY(email), JSON.stringify(days));
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function calculateStreak(completed) {
  if (!completed.length) return 0;
  const sorted = [...completed].sort().reverse();
  const today  = new Date();
  let streak   = 0;
  let check    = new Date(today);

  for (let i = 0; i < 365; i++) {
    const key = dateKey(check.getFullYear(), check.getMonth(), check.getDate());
    if (sorted.includes(key)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function calculateLongestStreak(completed) {
  if (!completed.length) return 0;
  const sorted = [...completed].sort();
  let longest = 1, current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) { current++; longest = Math.max(longest, current); }
    else current = 1;
  }
  return longest;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { user }   = useContext(AuthContext);
  const navigate   = useNavigate();
  const email      = user?.email ?? "";

  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [completed, setCompleted] = useState(() => getCompletedDays(email));
  const [selected, setSelected]   = useState(null); // date key of clicked day

  // Load plan from cache
  const plan     = JSON.parse(localStorage.getItem(`alignmate_plan_${user?.id}`) ?? "null");
  const weekDays = plan?.weekly_plan ?? [];

  const streak        = calculateStreak(completed);
  const longestStreak = calculateLongestStreak(completed);
  const totalDone     = completed.length;

  const toggleDay = (key) => {
    const updated = completed.includes(key)
      ? completed.filter(d => d !== key)
      : [...completed, key];
    setCompleted(updated);
    saveCompletedDays(email, updated);
  };

  const daysInMonth  = getDaysInMonth(year, month);
  const firstDay     = getFirstDayOfMonth(year, month);
  const todayKey     = dateKey(now.getFullYear(), now.getMonth(), now.getDate());

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  // Get workout for a given calendar date
  const getWorkoutForDate = (key) => {
    const d    = new Date(key);
    const dayI = d.getDay(); // 0=Sun
    return weekDays[dayI] ?? null;
  };

  const selectedWorkout = selected ? getWorkoutForDate(selected) : null;

  return (
    <div className="min-h-screen bg-background bg-grid font-sans text-left">

      {/* Header */}
      <div className="bg-card border-b border-border px-6 md:px-10 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Workout Calendar</h1>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Track your consistency</p>
          </div>
          <button onClick={() => navigate("/plan")}
            className="text-xs bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold hover:opacity-90 shadow-neon transition uppercase tracking-wider">
            View Plan
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-6">

        {/* ── Streak stats ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl border border-border p-5 text-center shadow-sm hover:border-primary/20 transition duration-200">
            <p className="text-4xl mb-1">🔥</p>
            <p className="text-3xl font-black font-display text-orange-500">{streak}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Current Streak</p>
            <p className="text-xs text-muted-foreground font-medium">{streak === 0 ? "Start today!" : streak === 1 ? "1 day — keep going!" : `${streak} days strong!`}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 text-center shadow-sm hover:border-primary/20 transition duration-200">
            <p className="text-4xl mb-1">🏆</p>
            <p className="text-3xl font-black font-display text-yellow-500">{longestStreak}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Longest Streak</p>
            <p className="text-xs text-muted-foreground font-medium">Personal best</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 text-center shadow-sm hover:border-primary/20 transition duration-200">
            <p className="text-4xl mb-1">✅</p>
            <p className="text-3xl font-black font-display text-emerald-500">{totalDone}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Total Workouts</p>
            <p className="text-xs text-muted-foreground font-medium">All time</p>
          </div>
        </div>

        {/* ── Streak motivator ── */}
        {streak > 0 && (
          <div className={`rounded-2xl p-4 text-center text-sm font-bold uppercase tracking-wide
            ${streak >= 30 ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
            : streak >= 7  ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
            : "bg-primary/10 text-primary border border-primary/20"}`}>
            {streak >= 30 ? `🏅 ${streak} day streak — you're a legend!`
            : streak >= 14 ? `🔥 ${streak} days straight — incredible consistency!`
            : streak >= 7  ? `⚡ ${streak} day streak — you're on fire!`
            : `💪 ${streak} day streak — great start, keep it up!`}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">

          {/* ── Calendar ── */}
          <div className="md:col-span-2 bg-card rounded-2xl border border-border shadow-sm p-6">

            {/* Month nav */}
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth}
                className="p-2 hover:bg-accent rounded-xl border border-border transition text-foreground">
                ←
              </button>
              <h2 className="font-black text-foreground uppercase tracking-tight">{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth}
                className="p-2 hover:bg-accent rounded-xl border border-border transition text-foreground">
                →
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day   = i + 1;
                const key   = dateKey(year, month, day);
                const done  = completed.includes(key);
                const today = key === todayKey;
                const sel   = key === selected;
                const future = key > todayKey;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (!future) {
                        toggleDay(key);
                        setSelected(sel ? null : key);
                      }
                    }}
                    disabled={future}
                    className={`
                      aspect-square rounded-xl text-sm font-bold font-display transition-all flex flex-col items-center justify-center
                      ${future ? "text-muted/30 cursor-not-allowed"
                        : done  ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                        : today ? "bg-primary/10 text-primary border-2 border-primary/50 hover:bg-primary/20 shadow-neon"
                        : sel   ? "bg-accent text-foreground border border-primary/30"
                        : "hover:bg-accent text-foreground border border-border"}
                    `}
                  >
                    <span>{day}</span>
                    {done && <span className="text-[8px] leading-none">✓</span>}
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center mt-4">
              Click a day to mark as completed · Click again to unmark
            </p>
          </div>

          {/* ── Day detail panel ── */}
          <div className="space-y-4">

            {/* Today's workout */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5 text-left">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                {selected ? new Date(selected + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }) : "Today's Workout"}
              </p>

              {!plan ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3 font-semibold">No plan generated yet</p>
                  <button onClick={() => navigate("/plan")}
                    className="text-xs bg-primary text-primary-foreground font-bold shadow-neon px-4 py-2.5 rounded-xl uppercase tracking-wider">
                    Generate Plan
                  </button>
                </div>
              ) : selectedWorkout ? (
                <div>
                  <p className="font-extrabold text-foreground text-sm uppercase tracking-tight">{selectedWorkout.focus ?? "Rest Day"}</p>
                  {selectedWorkout.exercises?.length > 0 ? (
                    <ul className="mt-3 space-y-1">
                      {selectedWorkout.exercises.slice(0, 4).map((ex, i) => (
                        <li key={i} className="text-xs text-muted-foreground font-semibold flex justify-between">
                          <span>• {ex.name}</span>
                          <span className="text-foreground font-bold font-display">{ex.sets}×{ex.reps}</span>
                        </li>
                      ))}
                      {selectedWorkout.exercises.length > 4 && (
                        <li className="text-xs text-muted-foreground font-bold mt-1.5 uppercase tracking-wider">
                          +{selectedWorkout.exercises.length - 4} more exercises
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground font-medium mt-2">😴 Rest day — recovery time!</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-extrabold text-foreground text-sm uppercase tracking-tight">
                    {weekDays[now.getDay()]?.focus ?? "Rest Day"}
                  </p>
                  {weekDays[now.getDay()]?.exercises?.slice(0, 4).map((ex, i) => (
                    <div key={i} className="text-xs text-muted-foreground font-semibold flex justify-between mt-1">
                      <span>• {ex.name}</span>
                      <span className="text-foreground font-bold font-display">{ex.sets}×{ex.reps}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly completion */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5 text-left">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3.5">This Week</p>
              <div className="flex justify-between">
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - d.getDay() + i);
                  const k = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
                  const done = completed.includes(k);
                  const isToday = k === todayKey;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1 font-sans">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black
                        ${done ? "bg-emerald-500 text-white shadow-sm"
                          : isToday ? "bg-primary/10 text-primary border-2 border-primary/50 shadow-neon"
                          : "bg-muted text-muted-foreground border border-border/40"}`}>
                        {done ? "✓" : d.getDate()}
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">{DAYS[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5 text-left">
              {[
                { color: "bg-emerald-500 shadow-sm", label: "Completed Workout" },
                { color: "bg-primary/10 border-2 border-primary/50 shadow-neon", label: "Today's Target" },
                { color: "bg-muted border border-border/40", label: "Not completed / future" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <div className={`w-4 h-4 rounded-full ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}