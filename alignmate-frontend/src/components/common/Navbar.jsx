// src/components/common/Navbar.jsx
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { AuthContext } from "@/context/AuthContext";

export default function Navbar({ onMenuClick }) {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between md:hidden">

      {/* Hamburger (mobile only) */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
      >
        <Menu size={18} className="text-gray-600" />
      </button>

      {/* Logo */}
      <span
        onClick={() => navigate("/")}
        className="text-lg font-bold tracking-tight cursor-pointer"
      >
        Align<span className="text-indigo-600">Mate</span>
      </span>

      {/* Avatar */}
      {isAuthenticated ? (
        <button
          onClick={onMenuClick}
          className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold"
        >
          {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
        </button>
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-xl"
        >
          Login
        </button>
      )}
    </header>
  );
}