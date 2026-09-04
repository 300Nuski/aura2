import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { animate } from "framer-motion";
import { Crown, Plus, Wallet, LogOut, ShieldCheck, User, MessageSquare, Menu, ChevronDown } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useApp } from "@/context/AppContext";
import { initials } from "@/lib/format";
import { GAME_BY_ROUTE } from "@/constants/games";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AnimatedBalance = ({ value }) => {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState(null);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    if (from === value) return undefined;
    setFlash(value > from ? "up" : "down");
    prev.current = value;
    const c = animate(from, value, { duration: 0.7, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setDisplay(Math.round(v)) });
    const t = setTimeout(() => setFlash(null), 600);
    return () => {
      c.stop();
      clearTimeout(t);
    };
  }, [value]);
  return (
    <span
      className={`font-mono font-semibold text-sm tabular transition-colors duration-300 ${flash === "up" ? "text-win" : flash === "down" ? "text-danger-2" : "text-txt"}`}
      data-testid="topbar-balance"
    >
      {display.toLocaleString("de-DE")} €
    </span>
  );
};

export const Topbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { balance, openAuth, openDeposit, setChatOpen, setSidebarOpen } = useApp();
  const game = GAME_BY_ROUTE[location.pathname];
  const crumb = game?.name || (location.pathname === "/profile" ? "Profil" : location.pathname === "/admin" ? "Admin" : "Lobby");

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 glass border-b border-line-2 flex items-center" data-testid="topbar">
      <div className="flex items-center gap-3 px-4 sm:px-6 w-full lg:w-64 h-full shrink-0">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 rounded-lg bg-panel border border-line flex items-center justify-center text-txt-2" aria-label="Menü" data-testid="topbar-menu-button">
          <Menu className="w-4 h-4" />
        </button>
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group" data-testid="topbar-logo">
          <span className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shadow-glow-brand group-hover:brightness-105 transition-[filter] duration-200">
            <Crown className="w-5 h-5 text-brand-fg" strokeWidth={2.4} />
          </span>
          <span className="font-display font-extrabold text-lg leading-none">
            Aura <span className="text-brand">Royale</span>
          </span>
        </button>
      </div>

      <div className="hidden lg:flex items-center gap-2 px-6 text-sm text-dim">
        <span className="text-dim-2">/</span>
        <span className="font-semibold text-txt-2" data-testid="topbar-breadcrumb">{crumb}</span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2 rounded-full bg-panel border border-line pl-3 pr-3.5 py-2" data-testid="topbar-balance-pill">
          <Wallet className="w-4 h-4 text-brand" />
          <AnimatedBalance value={balance} />
        </div>
        <button
          onClick={openDeposit}
          className="animate-deposit-glow rounded-full bg-brand text-brand-fg text-[13px] font-bold px-3.5 sm:px-5 py-2.5 inline-flex items-center gap-1.5 hover:brightness-105 transition-[filter] duration-200 active:scale-[0.98]"
          data-testid="topbar-deposit-button"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          <span className="hidden sm:inline">Aufladen</span>
        </button>
        <button
          onClick={() => setChatOpen(true)}
          className="2xl:hidden w-10 h-10 rounded-full bg-panel border border-line flex items-center justify-center text-txt-2 hover:border-aqua/50 hover:text-aqua transition-colors duration-200"
          aria-label="Chat öffnen"
          data-testid="topbar-chat-button"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full bg-panel border border-line pl-1 pr-2.5 py-1 hover:border-brand/40 transition-colors duration-200" data-testid="topbar-account-menu">
                <span className="w-8 h-8 rounded-full bg-raised border border-line flex items-center justify-center font-display font-bold text-xs text-brand">{initials(user.name)}</span>
                <span className="hidden md:inline text-sm font-semibold max-w-[110px] truncate">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-dim" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 bg-panel border-line text-txt shadow-raised" data-testid="account-menu">
              <DropdownMenuLabel className="font-normal">
                <p className="font-display font-bold text-sm truncate" data-testid="account-name">{user.name}</p>
                <p className="text-xs text-dim truncate">{user.email}</p>
                {user.role === "admin" && <span className="inline-block mt-1.5 rounded bg-brand/15 border border-brand/30 text-brand text-[9px] font-mono font-bold px-1.5 py-0.5">ADMIN</span>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-line-2" />
              <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 focus:bg-raised focus:text-txt cursor-pointer" data-testid="account-profile-link">
                <User className="w-4 h-4 text-aqua" /> Profil & Verlauf
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openDeposit} className="gap-2 focus:bg-raised focus:text-txt cursor-pointer" data-testid="account-deposit-link">
                <Wallet className="w-4 h-4 text-brand" /> Guthaben aufladen
              </DropdownMenuItem>
              {user.role === "admin" && (
                <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2 focus:bg-raised focus:text-txt cursor-pointer" data-testid="account-admin-link">
                  <ShieldCheck className="w-4 h-4 text-brand" /> Admin-Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-line-2" />
              <DropdownMenuItem onClick={logout} className="gap-2 text-danger-2 focus:bg-danger/10 focus:text-danger cursor-pointer" data-testid="logout-button">
                <LogOut className="w-4 h-4" /> Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={openAuth}
            className="rounded-full border border-aqua/50 text-aqua text-[13px] font-bold px-4 sm:px-5 py-2.5 hover:bg-aqua hover:text-aqua-fg transition-colors duration-200"
            data-testid="topbar-login-button"
          >
            Anmelden
          </button>
        )}
      </div>
    </header>
  );
};
