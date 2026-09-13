import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, clearToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await api.get("/auth/me");
      setUser(u);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { token, user: u } = await api.post("/auth/login", { email, password });
    localStorage.setItem("lm_token", token);
    setUser(u);
    return u;
  };

  const logout = () => {
    clearToken();
    setUser(null);
    location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);