import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useApp } from "@/context/AppContext";
import { Pill } from "@/components/common/Bits";

export const PageHeader = ({ game, title, subtitle, icon: IconProp, color = "#6E5BFF", pills = [], right, testId = "page", compact = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAuth } = useApp();
  const Icon = IconProp || game?.icon;
  const c = game?.color || color;

  if (compact) {
    return (
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3" data-testid={`${testId}-header`}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate("/")} className="w-9 h-9 rounded-xl glass border border-line flex items-center justify-center text-dim hover:text-txt transition-colors duration-200 shrink-0" aria-label="Zur Lobby" data-testid={`${testId}-back-button`}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          {Icon && (
            <span className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0" style={{ backgroundColor: `${c}1f`, borderColor: `${c}44` }}>
              <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: c }} />
            </span>
          )}
          <h1 className="font-display font-extrabold text-xl sm:text-2xl leading-none truncate">{title || game?.name}</h1>
          {game?.edge && <Pill tone="dim" className="hidden md:inline-flex">{game.edge}</Pill>}
          {game?.maxWin && <Pill tone="gold" className="hidden md:inline-flex">{game.maxWin}</Pill>}
        </div>
        {user === null && (
          <div className="sm:ml-auto flex items-center gap-3 rounded-xl glass border border-line px-3.5 py-2" data-testid={`${testId}-guest-banner`}>
            <p className="text-xs text-dim">
              <span className="text-txt font-semibold">Gastmodus</span> — Guthaben wird nicht gespeichert.
            </p>
            <button onClick={openAuth} className="shrink-0 rounded-lg bg-brand text-brand-fg text-xs font-bold px-3 py-1.5 hover:brightness-110 transition-[filter] duration-200" data-testid={`${testId}-guest-login-button`}>
              Anmelden
            </button>
          </div>
        )}
        {right}
      </div>
    );
  }

  return (
    <div className="mb-6" data-testid={`${testId}-header`}>
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-dim hover:text-txt transition-colors duration-200 mb-4"
        data-testid={`${testId}-back-button`}
      >
        <ArrowLeft className="w-4 h-4" />
        Lobby
      </button>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <span className="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0" style={{ backgroundColor: `${c}1f`, borderColor: `${c}44` }}>
              <Icon className="w-6 h-6" style={{ color: c }} />
            </span>
          )}
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl leading-none">{title || game?.name}</h1>
            {(subtitle || game?.tagline) && <p className="text-sm text-dim mt-1.5 max-w-xl">{subtitle || game?.tagline}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {game?.edge && <Pill tone="dim">{game.edge}</Pill>}
          {game?.maxWin && <Pill tone="gold">{game.maxWin}</Pill>}
          {pills.map((p, i) => (
            <Pill key={i} tone={p.tone || "neutral"}>
              {p.label}
            </Pill>
          ))}
          {right}
        </div>
      </div>
      {user === null && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl glass border border-line px-4 py-3" data-testid={`${testId}-guest-banner`}>
          <p className="text-xs text-dim">
            <span className="text-txt font-semibold">Gastmodus</span> — du spielst mit Demo-Guthaben, das nicht gespeichert wird.
          </p>
          <button onClick={openAuth} className="shrink-0 rounded-lg bg-brand text-brand-fg text-xs font-bold px-3 py-2 hover:brightness-110 transition-[filter] duration-200" data-testid={`${testId}-guest-login-button`}>
            Anmelden
          </button>
        </div>
      )}
    </div>
  );
};
