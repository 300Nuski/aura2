import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);

  const refresh = useCallback(async () => {
    try {
      const r = await api.get("/auth/me");
      setUser(r.data);
      return r.data;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    setUser(data);
    return data;
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
