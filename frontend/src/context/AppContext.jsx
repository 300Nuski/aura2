import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import api from "@/lib/api";

export const GUEST_BALANCE = 1561;

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(GUEST_BALANCE);
  const [authOpen, setAuthOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const skipSync = useRef(false);

  // adopt server balance on login / reset on logout
  useEffect(() => {
    if (user) {
      skipSync.current = true;
      setBalance(user.balance ?? GUEST_BALANCE);
    }
    if (user === null) setBalance(GUEST_BALANCE);
  }, [user]);

  // debounced persistence of the play-money balance
  useEffect(() => {
    if (!user) return undefined;
    if (skipSync.current) {
      skipSync.current = false;
      return undefined;
    }
    const t = setTimeout(() => {
      api.put("/auth/balance", { balance: Math.max(0, Math.round(balance)) }).catch(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, [balance, user]);

  const openAuth = useCallback(() => setAuthOpen(true), []);
  const openDeposit = useCallback(() => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setDepositOpen(true);
  }, [user]);

  const value = useMemo(
    () => ({
      balance,
      setBalance,
      authOpen,
      setAuthOpen,
      openAuth,
      depositOpen,
      setDepositOpen,
      openDeposit,
      chatOpen,
      setChatOpen,
      sidebarOpen,
      setSidebarOpen,
    }),
    [balance, authOpen, depositOpen, chatOpen, sidebarOpen, openAuth, openDeposit]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
