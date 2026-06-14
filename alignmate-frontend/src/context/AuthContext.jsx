import { createContext, useState, useEffect } from "react";
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  getCurrentUserFromServer,
} from "@/services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const serverUser = await getCurrentUserFromServer();
      setUser(serverUser);
      setLoading(false);
    }
    checkAuth();
  }, []);

  // LOGIN
  const login = async (data) => {
    const result = await loginUser(data);

    if (result.success) {
      setUser(result.user);
    }

    return result;
  };

  // REGISTER
  const register = async (data) => {
    const result = await registerUser(data);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const updateUser = (newUser) => {
    if (newUser) {
      localStorage.setItem("currentUser", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("currentUser");
    }
    setUser(newUser);
  };

  // LOGOUT
  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-primary font-black uppercase tracking-widest text-xs">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin shadow-neon" />
          <span>Securing Session...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        updateUser,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };