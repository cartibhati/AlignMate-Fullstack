import { createContext, useState } from "react";
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
} from "@/services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getCurrentUser());

  // LOGIN
  const login = async (data) => {
    const result = await loginUser(data);

    if (result.success) {
      localStorage.setItem("currentUser", JSON.stringify(result.user));
      setUser(result.user);
    }

    return result;
  };

  // REGISTER
  const register = async (data) => {
    const result = await registerUser(data);
    return result;
  };

  // LOGOUT
  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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