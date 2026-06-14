import { useMemo } from "react";

// Format date to YYYY-MM-DD
function formatYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Format date to dd MMM yyyy (e.g. 12 Jun 2026)
function formatDdMmmYyyy(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

export default function ActivityHeatmap({ sessions = [], completedWorkouts = [] }) {
  // Generate last 84 days (12 weeks)
  const gridData = useMemo(() => {
    const days = [];
    const today = new Date();
    
    // We want the grid to end on the current day, aligned so rows are Sunday - Saturday
    // To make it look like a standard contribution grid:
    // Columns are weeks, rows are Sunday (0) to Saturday (6).
    // Let's generate 12 weeks * 7 days = 84 days.
    // Start from 83 days ago.
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      const yyyymmdd = formatYYYYMMDD(d);
      const ddMmmYyyy = formatDdMmmYyyy(d);
      
      // Check for workout
      const hasWorkout = completedWorkouts.includes(yyyymmdd);
      
      // Check for posture sessions on this day
      const daySessions = sessions.filter(s => {
        // Handle variations in date comparison
        return s.date === ddMmmYyyy || s.date === d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      });
      
      let level = 0; // 0 to 4 intensity
      let tooltipText = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
      
      if (hasWorkout && daySessions.length > 0) {
        level = 4;
        const avgScore = Math.round(daySessions.reduce((acc, s) => acc + s.avgScore, 0) / daySessions.length);
        tooltipText += ` · Workout Completed & Posture tracked (${daySessions.length} sessions, avg score ${avgScore}%)`;
      } else if (hasWorkout) {
        level = 3;
        tooltipText += " · Workout Completed";
      } else if (daySessions.length > 0) {
        const avgScore = Math.round(daySessions.reduce((acc, s) => acc + s.avgScore, 0) / daySessions.length);
        if (avgScore >= 80) level = 3;
        else if (avgScore >= 65) level = 2;
        else level = 1;
        tooltipText += ` · Posture tracked (${daySessions.length} sessions, avg score ${avgScore}%)`;
      } else {
        tooltipText += " · No activity";
      }
      
      days.push({
        date: d,
        dayOfWeek: d.getDay(),
        yyyymmdd,
        level,
        tooltipText
      });
    }
    return days;
  }, [sessions, completedWorkouts]);

  // Group days into 12 columns (weeks)
  const weeks = useMemo(() => {
    const cols = [];
    let currentWeek = [];
    
    // Fill leading empty slots if the first day is not Sunday (to align columns)
    const firstDayOfWeek = gridData[0].dayOfWeek;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    for (const day of gridData) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        cols.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Fill trailing empty slots if the last week is not complete
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      cols.push(currentWeek);
    }
    
    return cols;
  }, [gridData]);

  const rowLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Return level color classes (Tailwind theme adaptive)
  const getCellColor = (level) => {
    if (level === 0) return "bg-[#18181b] border border-white/[0.03]"; // Dark zinc/gray
    
    // Gym Theme colors:
    // In dark mode: Neon Lime (#ccff00). In light mode: Crimson Red (#ef4444)
    // We can use primary colors or specific tailwind classes that map to the HSL variables
    if (level === 1) return "bg-primary/20 border border-primary/30 text-primary";
    if (level === 2) return "bg-primary/45 border border-primary/50 text-primary";
    if (level === 3) return "bg-primary/75 border border-primary/80 text-primary";
    return "bg-primary text-primary-foreground shadow-neon border border-primary";
  };

  return (
    <div className="bg-[#12141c] border border-white/5 rounded-3xl p-6 shadow-2xl">
      <div className="flex flex-col space-y-4">
        
        {/* Title and stats */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white text-sm font-black uppercase tracking-tight">Active Consistency Grid</h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Your last 12 weeks of posture checks & workouts</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded bg-[#18181b]" />
            <div className="w-2.5 h-2.5 rounded bg-primary/20" />
            <div className="w-2.5 h-2.5 rounded bg-primary/45" />
            <div className="w-2.5 h-2.5 rounded bg-primary/75" />
            <div className="w-2.5 h-2.5 rounded bg-primary" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-2 items-start overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          
          {/* Weekday labels */}
          <div className="grid grid-rows-7 gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-wider select-none pr-1 mt-1">
            {rowLabels.map((label, i) => (
              <div key={i} className="h-3.5 flex items-center justify-end leading-none">
                {i % 2 === 1 ? label : ""}
              </div>
            ))}
          </div>

          {/* Grid columns */}
          <div className="flex gap-1.5">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-rows-7 gap-1.5">
                {week.map((day, dayIdx) => {
                  if (!day) {
                    return <div key={`empty-${dayIdx}`} className="w-3.5 h-3.5 opacity-0" />;
                  }
                  
                  return (
                    <div
                      key={day.yyyymmdd}
                      className={`w-3.5 h-3.5 rounded-sm transition-all duration-200 cursor-pointer relative group ${getCellColor(day.level)}`}
                    >
                      {/* Tooltip popup */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-black/95 text-white text-[10px] font-semibold p-2 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-20 border border-white/10 text-center leading-normal">
                        {day.tooltipText}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/95" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
