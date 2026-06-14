// src/components/layout/Header.jsx
import { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/useTheme";
import {
  LayoutDashboard, Activity, CalendarDays, ClipboardList,
  FlaskConical, Info, Sun, Moon, LogOut, UserCircle, Dumbbell, GraduationCap, Menu, X, ChevronDown
} from "lucide-react";

const NAV = [
  { to: "/dashboard",          label: "Dashboard",        icon: LayoutDashboard },
  { to: "/live?mode=student",  label: "Student Posture",  icon: GraduationCap },
  { to: "/live?mode=athlete",  label: "Athlete Posture",  icon: Activity },
  { to: "/exercise",           label: "Exercises Plan",   icon: Dumbbell },
  { to: "/plan",               label: "My Plan",          icon: ClipboardList },
  { to: "/calendar",           label: "Calendar",         icon: CalendarDays },
  { to: "/profile",            label: "Profile",          icon: UserCircle },
  { to: "/research",           label: "Research",         icon: FlaskConical },
  { to: "/about",              label: "About",            icon: Info },
];

export default function Header() {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const { theme, toggleTheme }            = useTheme();
  const navigate                          = useNavigate();
  const location                          = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen]       = useState(false);
  const dropdownRef                         = useRef(null);

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

  // Click outside listener for profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on navigate
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/login");
  };

  const isLinkActive = (to) => {
    const [pathname, search] = to.split("?");
    if (location.pathname !== pathname) return false;
    if (!search) return !location.search;
    return location.search.includes(search);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-card border-b border-border shadow-sm backdrop-blur-md bg-card/90 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-black tracking-wider text-foreground uppercase flex-shrink-0">
            Align<span className="text-primary">Mate</span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map(({ to, label }) => {
              const active = isLinkActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                    active
                      ? "text-primary bg-primary/5 border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3">
          
          {/* Streak Fire Badge */}
          {isAuthenticated && streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl animate-pulse">
              <span className="text-xs">🔥</span>
              <span className="text-xs font-black text-orange-500 font-display">{streak}d</span>
            </div>
          )}

          {/* Theme Toggle (Desktop Only) */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Profile Dropdown (Desktop Only) */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="hidden sm:flex items-center gap-2 bg-muted/60 hover:bg-accent rounded-xl p-1.5 pr-2.5 transition-all duration-200 border border-border/40"
              >
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-black flex-shrink-0 shadow-neon">
                  {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
                </div>
                <span className="text-xs font-bold text-foreground max-w-[100px] truncate">
                  {user?.name ?? "User"}
                </span>
                <ChevronDown size={12} className="text-muted-foreground" />
              </button>

              {/* Dropdown Card */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border p-4 shadow-xl text-left animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-black text-foreground uppercase tracking-tight truncate">
                    {user?.name ?? "User"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
                  
                  <div className="h-px bg-border my-3" />
                  
                  <div className="space-y-1.5">
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
                    >
                      <UserCircle size={14} /> Profile Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all duration-150"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground shadow-neon hover:opacity-90 transition-all"
              >
                Register
              </Link>
            </div>
          )}

          {/* Hamburger (Mobile Toggle) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl border border-border hover:bg-accent text-muted-foreground transition-all"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-card border-b border-border px-4 py-5 space-y-4 animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col gap-1.5">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = isLinkActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-neon"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="h-px bg-border" />

          {isAuthenticated ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3 px-2 py-1">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-black shadow-neon">
                  {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-black text-foreground uppercase truncate leading-none">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-1">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-xl text-xs font-bold transition-all"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="flex-1 text-center py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-accent transition-all"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider shadow-neon"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
