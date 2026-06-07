// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/useTheme";
import {
  LayoutDashboard, Activity, CalendarDays, ClipboardList,
  FlaskConical, Info, Sun, Moon, LogOut, X, UserCircle, Dumbbell
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard",    icon: LayoutDashboard },
  { to: "/live",      label: "Live Posture", icon: Activity },
  { to: "/exercise",  label: "Exercises",    icon: Dumbbell },      // ✅ NEW
  { to: "/plan",      label: "My Plan",      icon: ClipboardList },
  { to: "/calendar",  label: "Calendar",     icon: CalendarDays },
  { to: "/profile",   label: "Profile",      icon: UserCircle },
  { to: "/research",  label: "Research",     icon: FlaskConical },
  { to: "/about",     label: "About",        icon: Info },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const { theme, toggleTheme }            = useTheme();
  const navigate                          = useNavigate();

  const calKey    = `alignmate_calendar_${user?.email ?? ""}`;
  const completed = JSON.parse(localStorage.getItem(calKey) ?? "[]");
  const streak    = (() => {
    if (!completed.length) return 0;
    const sorted = [...completed].sort().reverse();
    let s = 0, check = new Date();
    for (let i = 0; i < 365; i++) {
      const k = `${check.getFullYear()}-${String(check.getMonth()+1).padStart(2,"0")}-${String(check.getDate()).padStart(2,"0")}`;
      if (sorted.includes(k)) { s++; check.setDate(check.getDate()-1); }
      else break;
    }
    return s;
  })();

  const handleLogout = () => { logout(); onClose(); navigate("/login"); };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        bg-card border-r border-border shadow-xl
        transition-all duration-300 ease-in-out w-64
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:shadow-none md:z-auto
      `}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <span onClick={() => { navigate("/"); onClose(); }}
            className="text-xl font-black tracking-wider cursor-pointer text-foreground uppercase">
            Align<span className="text-primary">Mate</span>
          </span>
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-accent">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* User card */}
        {isAuthenticated && (
          <div className="px-4 py-4 border-b border-border">
            <button onClick={() => { navigate("/profile"); onClose(); }}
              className="w-full flex items-center gap-3 bg-muted/50 hover:bg-accent rounded-xl p-3 transition group border border-border/40">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-black flex-shrink-0">
                {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {user?.name ?? "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </button>

            {streak > 0 && (
              <div className="mt-2 flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2">
                <span className="text-base animate-pulse">🔥</span>
                <div>
                  <p className="text-xs font-bold text-orange-500">{streak} day streak</p>
                  <p className="text-[10px] text-orange-400/80">Keep pushing limits!</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                ${isActive
                  ? "bg-primary text-primary-foreground shadow-neon shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <button onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          {isAuthenticated && (
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 hover:text-red-600 transition">
              <LogOut size={18} />
              Logout
            </button>
          )}

          {!isAuthenticated && (
            <div className="space-y-1">
              <NavLink to="/login" onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition">
                Login
              </NavLink>
              <NavLink to="/register" onClick={onClose}
                className="w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition shadow-neon">
                Register
              </NavLink>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}