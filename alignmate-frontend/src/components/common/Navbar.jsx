import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { useTheme } from "@/context/useTheme";
import { Sun, Moon, Menu, X } from "lucide-react";

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login");
  };

  const closeMenu = () => setOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border 
                    bg-background backdrop-blur 
                    supports-[backdrop-filter]:bg-background/80">

      {/* TOP BAR */}
      <div className="flex justify-between items-center px-4 sm:px-6 md:px-8 py-4">

        {/* LOGO */}
        <h2
          onClick={() => {
            closeMenu();
            navigate("/");
          }}
          className="text-lg sm:text-xl font-semibold tracking-tight cursor-pointer"
        >
          AlignMate
        </h2>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-6">

          <NavItem to="/" label="Home" />
          <NavItem to="/about" label="About" />
          <NavItem to="/research" label="Research" />

          {isAuthenticated && <NavItem to="/live" label="Live" />}
          {isAuthenticated && <NavItem to="/dashboard" label="Dashboard" />}

          {/* THEME */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border 
                       hover:bg-muted transition"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* AUTH */}
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground max-w-[120px] truncate">
                👤 {user?.name || user?.email}
              </span>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="text-muted-foreground hover:text-foreground transition"
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition"
              >
                Register
              </NavLink>
            </>
          )}
        </div>

        {/* MOBILE RIGHT */}
        <div className="flex items-center gap-2 md:hidden">

          {/* THEME */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border hover:bg-muted transition"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* MENU BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-xl border border-border hover:bg-muted transition"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>

        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          open ? "max-h-[400px] border-t border-border" : "max-h-0"
        }`}
      >
        <div className="flex flex-col px-4 py-4 gap-3">

          <MobileItem to="/" label="Home" onClick={closeMenu} />
          <MobileItem to="/about" label="About" onClick={closeMenu} />
          <MobileItem to="/research" label="Research" onClick={closeMenu} />

          {isAuthenticated && (
            <MobileItem to="/live" label="Live" onClick={closeMenu} />
          )}
          {isAuthenticated && (
            <MobileItem to="/dashboard" label="Dashboard" onClick={closeMenu} />
          )}

          {/* AUTH */}
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">
                👤 {user?.name || user?.email}
              </span>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                onClick={closeMenu}
                className="text-muted-foreground"
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                onClick={closeMenu}
                className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm text-center"
              >
                Register
              </NavLink>
            </>
          )}

        </div>
      </div>
    </nav>
  );
}

export default Navbar;

/* DESKTOP NAV ITEM */
function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `text-sm transition ${
          isActive
            ? "text-foreground font-semibold"
            : "text-muted-foreground"
        } hover:text-foreground`
      }
    >
      {label}
    </NavLink>
  );
}

/* MOBILE ITEM */
function MobileItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `text-sm px-2 py-2 rounded-md ${
          isActive
            ? "text-foreground font-semibold bg-muted"
            : "text-muted-foreground"
        }`
      }
    >
      {label}
    </NavLink>
  );
}