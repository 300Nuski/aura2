import { useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, User, ShieldCheck, Wallet, X, Star, LogOut, Bell, Crown } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useApp } from "@/context/AppContext";
import { GAMES } from "@/constants/games";
import { initials, fmt } from "@/lib/format";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export const INFO_LINKS = [
  { id: "about", label: "Über uns" },
  { id: "fairplay", label: "Fair Play" },
  { id: "responsible", label: "Verantwortung" },
  { id: "terms", label: "Nutzungsbedingungen" },
];

const NavItem = ({ item, active, onClick }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2 ${
        active ? "bg-brand text-white shadow-glow-brand" : "text-txt-2 hover:text-txt hover:bg-panel-2"
      }`}
      data-testid={`sidebar-nav-item-${item.id}`}
    >
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-white/15" : "bg-surface-2 border border-line-2"}`}>
        <Icon className="w-4 h-4" style={{ color: active ? "#fff" : item.color }} />
      </span>
      <span className="truncate">{item.name}</span>
      {item.tag === "Neu" && !active && <span className="ml-auto rounded-md bg-brand/20 border border-brand/40 text-brand-2 text-[9px] font-mono font-bold px-1.5 py-0.5">NEU</span>}
    </button>
  );
};

const SidebarBody = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { openDeposit, openAuth, balance } = useApp();
  const go = (route) => {
    navigate(route);
    onNavigate?.();
  };
  const lobby = { id: "lobby", name: "Startseite", icon: LayoutGrid, color: "#8B7CFF", route: "/" };

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 overflow-y-auto thin-scroll px-3 py-4" data-testid="sidebar-nav">
        <div className="rounded-2xl glass border border-line/80 p-2.5 mb-4">
          <div className="flex items-center justify-between px-2 pt-1 pb-2.5">
            <p className="text-[11px] font-bold tracking-wide text-txt-2 inline-flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-gold" fill="currentColor" />
              Royal Games
            </p>
            <span className="rounded-md bg-gold/15 border border-gold/40 text-gold text-[9px] font-mono font-bold px-1.5 py-0.5">{GAMES.length}</span>
          </div>
          <div className="space-y-1">
            <NavItem item={lobby} active={location.pathname === "/"} onClick={() => go("/")} />
            {GAMES.map((g) => (
              <NavItem key={g.id} item={g} active={location.pathname === g.route} onClick={() => go(g.route)} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl glass border border-line/80 p-3 mb-4" data-testid="sidebar-profile-card">
          {user ? (
            <>
              <div className="flex items-center gap-2.5 px-1 mb-3">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-aqua flex items-center justify-center text-[11px] font-extrabold text-white shrink-0">{initials(user.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold truncate">{user.name}</p>
                  <p className="text-[10px] font-mono text-dim truncate">{fmt(balance)}</p>
                </div>
                <button onClick={logout} className="inline-flex items-center gap-1 rounded-md bg-surface-2 border border-line-2 text-[10px] font-bold text-dim px-2 py-1 hover:text-danger hover:border-danger/40 transition-colors" data-testid="sidebar-logout-button">
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              </div>
              <div className="space-y-0.5">
                <button onClick={() => go("/profile")} className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${location.pathname === "/profile" ? "bg-panel-2 text-txt" : "text-txt-2 hover:bg-panel-2"}`} data-testid="sidebar-nav-item-profile">
                  <User className="w-3.5 h-3.5 text-aqua" /> Mein Profil
                </button>
                <button onClick={() => { openDeposit(); onNavigate?.(); }} className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-txt-2 hover:bg-panel-2 transition-colors" data-testid="sidebar-deposit-button">
                  <Wallet className="w-3.5 h-3.5 text-gold" /> Guthaben
                </button>
                <button onClick={() => go("/profile")} className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-txt-2 hover:bg-panel-2 transition-colors" data-testid="sidebar-history-button">
                  <Bell className="w-3.5 h-3.5 text-brand-2" /> Verlauf
                </button>
                {user.role === "admin" && (
                  <button onClick={() => go("/admin")} className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${location.pathname === "/admin" ? "bg-panel-2 text-txt" : "text-txt-2 hover:bg-panel-2"}`} data-testid="sidebar-nav-item-admin">
                    <ShieldCheck className="w-3.5 h-3.5 text-gold" /> Admin-Panel
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="px-1">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-9 h-9 rounded-full bg-surface-2 border border-line flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-dim" />
                </span>
                <div>
                  <p className="text-[13px] font-bold">Gast</p>
                  <p className="text-[10px] font-mono text-dim">{fmt(balance)} Demo</p>
                </div>
              </div>
              <button onClick={() => { openAuth(); onNavigate?.(); }} className="w-full rounded-lg bg-brand text-white text-xs font-bold py-2.5 hover:brightness-110 transition-[filter] shadow-glow-brand" data-testid="sidebar-nav-item-profile">
                Anmelden / Registrieren
              </button>
            </div>
          )}
        </div>

        <div className="px-2" data-testid="sidebar-info-links">
          <p className="text-[11px] font-bold text-txt-2 inline-flex items-center gap-1.5 mb-2">
            <Crown className="w-3.5 h-3.5 text-brand-2" />
            Weitere Infos
          </p>
          <div className="space-y-1">
            {INFO_LINKS.map((l) => (
              <button key={l.id} onClick={() => go(`/info/${l.id}`)} className={`block text-[11px] transition-colors ${location.pathname === `/info/${l.id}` ? "text-txt" : "text-dim hover:text-txt"}`} data-testid={`sidebar-info-${l.id}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useApp();
  return (
    <>
      <aside className="hidden lg:flex flex-col fixed top-16 left-0 bottom-0 w-64 z-30" data-testid="left-sidebar">
        <SidebarBody />
      </aside>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[290px] p-0 bg-surface border-line text-txt [&>button]:hidden" data-testid="mobile-sidebar">
          <div className="flex items-center justify-between px-4 h-16 border-b border-line-2">
            <SheetTitle className="font-display font-bold text-base text-txt">Navigation</SheetTitle>
            <button onClick={() => setSidebarOpen(false)} className="w-9 h-9 rounded-lg bg-panel border border-line flex items-center justify-center" aria-label="Schließen" data-testid="mobile-sidebar-close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-[calc(100%-4rem)]">
            <SidebarBody onNavigate={() => setSidebarOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
