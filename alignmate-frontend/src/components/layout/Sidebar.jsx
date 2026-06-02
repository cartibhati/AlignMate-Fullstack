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
        bg-white border-r border-gray-100 shadow-xl
        transition-all duration-300 ease-in-out w-64
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:shadow-none md:z-auto
      `}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <span onClick={() => { navigate("/"); onClose(); }}
            className="text-lg font-bold tracking-tight cursor-pointer text-gray-900">
            Align<span className="text-indigo-600">Mate</span>
          </span>
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* User card */}
        {isAuthenticated && (
          <div className="px-4 py-4 border-b border-gray-100">
            <button onClick={() => { navigate("/profile"); onClose(); }}
              className="w-full flex items-center gap-3 bg-gray-50 hover:bg-indigo-50 rounded-xl p-3 transition group">
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-700">
                  {user?.name ?? "User"}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </button>

            {streak > 0 && (
              <div className="mt-2 flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                <span className="text-base">🔥</span>
                <div>
                  <p className="text-xs font-semibold text-orange-600">{streak} day streak</p>
                  <p className="text-[10px] text-orange-400">Keep it going!</p>
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
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <button onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          {isAuthenticated && (
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition">
              <LogOut size={18} />
              Logout
            </button>
          )}

          {!isAuthenticated && (
            <div className="space-y-1">
              <NavLink to="/login" onClick={onClose}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
                Login
              </NavLink>
              <NavLink to="/register" onClick={onClose}
                className="w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition">
                Register
              </NavLink>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}