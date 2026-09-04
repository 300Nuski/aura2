import { useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Rocket, Dices, Bomb, User } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useApp } from "@/context/AppContext";

const ITEMS = [
  { id: "lobby", label: "Lobby", icon: LayoutGrid, route: "/" },
  { id: "crash", label: "Crash", icon: Rocket, route: "/crash" },
  { id: "dice", label: "Dice", icon: Dices, route: "/dice" },
  { id: "mines", label: "Mines", icon: Bomb, route: "/mines" },
  { id: "profile", label: "Profil", icon: User, route: "/profile" },
];

export const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { openAuth } = useApp();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-line grid grid-cols-5 h-16" data-testid="mobile-bottom-nav">
      {ITEMS.map((it) => {
        const active = location.pathname === it.route;
        return (
          <button
            key={it.id}
            onClick={() => (it.id === "profile" && !user ? openAuth() : navigate(it.route))}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors duration-200 ${active ? "text-brand" : "text-dim hover:text-txt"}`}
            data-testid={`mobile-nav-${it.id}`}
          >
            <it.icon className="w-5 h-5" />
            {it.label}
          </button>
        );
      })}
    </nav>
  );
};
