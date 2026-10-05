import { createContext, useContext, useEffect, useState } from "react";
import { fetchMe, loginUser, registerUser } from "../services/authService";

const AuthContext = createContext(null);

export const roleHome = (role) => {
  if (role === "admin") return "/admin";
  if (role === "instructor") return "/instructor";
  return "/my-learning";
};

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("ls_user"));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [loading, setLoading] = useState(!!localStorage.getItem("ls_token"));

  const saveSession = ({ token, user: u }) => {
    localStorage.setItem("ls_token", token);
    localStorage.setItem("ls_user", JSON.stringify(u));
    setUser(u);
    return u;
  };

  const clearSession = () => {
    localStorage.removeItem("ls_token");
    localStorage.removeItem("ls_user");
    setUser(null);
  };

  useEffect(() => {
    if (!localStorage.getItem("ls_token")) return;
    fetchMe()
      .then(({ user: u }) => {
        localStorage.setItem("ls_user", JSON.stringify(u));
        setUser(u);
      })
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => saveSession(await loginUser(credentials));
  const register = async (data) => saveSession(await registerUser(data));
  const logout = () => clearSession();

  // Used by the Profile page after the name or email is changed
  const updateUser = (u) => {
    localStorage.setItem("ls_user", JSON.stringify(u));
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};