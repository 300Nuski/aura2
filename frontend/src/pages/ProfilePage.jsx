import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Activity, Coins, TrendingUp, Percent, Sparkles, Wallet, RefreshCw, History } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useApp } from "@/context/AppContext";
import { fmt, fmtSigned, fmtMult, fmtNum, timeAgo, initials } from "@/lib/format";
import { gameColor } from "@/constants/games";
import { Panel, StatCard, Pill, EmptyState, Skeleton, PrimaryButton } from "@/components/common/Bits";

export default function ProfilePage() {
  const { user } = useAuth();
  const { openAuth, openDeposit, balance, depositOpen } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    api
      .get("/me/stats")
      .then((r) => setData(r.data))
      .catch(() => setError(true));
  };

  useEffect(() => {
    if (user) load();
  }, [user, depositOpen]);

  if (user === null) {
    return (
      <Panel className="p-10" data-testid="profile-no-auth">
        <EmptyState
          icon={User}
          title="Bitte anmelden"
          text="Dein Profil zeigt Statistiken, Verlauf und Guthaben — dazu brauchst du ein Konto."
          action={
            <PrimaryButton onClick={openAuth} data-testid="profile-login-button">
              Anmelden oder registrieren
            </PrimaryButton>
          }
        />
      </Panel>
    );
  }

  const t = data?.total;

  return (
    <div data-testid="profile-page">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-2xl bg-raised border border-line flex items-center justify-center font-display font-bold text-lg text-brand">{initials(user?.name)}</span>
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-[-0.02em] leading-none" data-testid="profile-name">
              {user?.name}
            </h1>
            <p className="text-sm text-dim mt-1.5">
              {user?.email}
              {user?.role === "admin" && <span className="ml-2 rounded bg-brand/15 border border-brand/30 text-brand text-[9px] font-mono font-bold px-1.5 py-0.5">ADMIN</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="w-10 h-10 rounded-xl bg-panel border border-line flex items-center justify-center hover:border-aqua/50 transition-colors duration-200" aria-label="Aktualisieren" data-testid="profile-refresh-button">
            <RefreshCw className="w-4 h-4" />
          </button>
          <PrimaryButton onClick={openDeposit} data-testid="profile-deposit-button">
            <Wallet className="w-4 h-4" /> Aufladen
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6" data-testid="profile-stats">
        <StatCard icon={Wallet} label="Guthaben" value={fmt(balance)} tone="gold" />
        <StatCard icon={Activity} label="Runden" value={t ? fmtNum(t.rounds) : "—"} />
        <StatCard icon={Coins} label="Einsatz gesamt" value={t ? fmt(t.wagered) : "—"} />
        <StatCard icon={TrendingUp} label="Netto" value={t ? fmtSigned(t.profit) : "—"} tone={t && t.profit >= 0 ? "win" : "danger"} />
        <StatCard icon={Percent} label="Gewinnquote" value={t ? `${t.win_rate} %` : "—"} tone="aqua" />
        <StatCard icon={Sparkles} label="Bester Multi" value={t ? fmtMult(t.best_mult) : "—"} tone="gold" />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <Panel className="col-span-12 xl:col-span-5 overflow-hidden" data-testid="profile-games">
          <div className="px-5 py-4 border-b border-line-2">
            <h3 className="font-display font-bold text-lg">Nach Spiel</h3>
          </div>
          {!data && !error && (
            <div className="p-5 space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          )}
          {error && (
            <EmptyState
              title="Statistiken nicht geladen"
              text="Bitte versuche es erneut."
              action={
                <button onClick={load} className="rounded-lg bg-raised border border-line px-4 py-2 text-xs font-bold" data-testid="profile-retry-button">
                  Erneut laden
                </button>
              }
            />
          )}
          {data && data.games.length === 0 && (
            <EmptyState
              icon={Activity}
              title="Noch nichts gespielt"
              text="Deine Statistiken füllen sich mit der ersten Runde."
              action={
                <button onClick={() => navigate("/")} className="rounded-lg bg-brand text-brand-fg px-4 py-2 text-xs font-bold" data-testid="profile-go-lobby-button">
                  Zur Lobby
                </button>
              }
            />
          )}
          <div className="divide-y divide-line-2">
            {data?.games.map((g) => (
              <div key={g.game} className="px-5 py-3.5 flex items-center gap-3" data-testid="profile-game-row">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: gameColor(g.game) }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{g.game}</p>
                  <p className="text-[11px] font-mono text-dim">
                    {g.rounds} Runden · {g.wins} Gewinne · best {fmtMult(g.best_mult)}
                  </p>
                </div>
                <span className={`font-mono text-sm font-semibold tabular ${g.profit >= 0 ? "text-win" : "text-danger-2"}`}>{fmtSigned(g.profit)}</span>
              </div>
            ))}
          </div>
          {data && (
            <div className="px-5 py-3.5 border-t border-line-2 flex items-center justify-between text-xs text-dim">
              <span>
                Aufladungen: <span className="font-mono text-txt">{data.deposits.count}</span>
              </span>
              <span className="font-mono text-txt">{fmt(data.deposits.sum)}</span>
            </div>
          )}
        </Panel>

        <Panel className="col-span-12 xl:col-span-7 overflow-hidden" data-testid="profile-history">
          <div className="px-5 py-4 border-b border-line-2 flex items-center gap-2">
            <History className="w-4 h-4 text-aqua" />
            <h3 className="font-display font-bold text-lg">Letzte Runden</h3>
          </div>
          {data && data.recent.length === 0 && <EmptyState icon={History} title="Noch keine Runden" text="Spiele eine Runde — sie erscheint hier sofort." />}
          <div className="divide-y divide-line-2 max-h-[520px] overflow-y-auto thin-scroll">
            {data?.recent.map((r) => {
              const won = r.payout > r.bet;
              return (
                <div key={r.id} className="px-5 py-3 grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center" data-testid="profile-round-row">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: gameColor(r.game) }} />
                    <span className="text-sm font-semibold truncate">{r.game}</span>
                    <span className="text-[11px] text-dim-2 font-mono hidden sm:inline">{timeAgo(r.ts)}</span>
                  </span>
                  <span className="font-mono text-xs text-dim tabular">{fmt(r.bet)}</span>
                  <span>{r.mult > 0 ? <Pill tone={r.mult >= 5 ? "gold" : "neutral"}>{fmtMult(r.mult)}</Pill> : <Pill tone="loss">—</Pill>}</span>
                  <span className={`font-mono text-sm font-semibold tabular text-right ${won ? "text-win" : r.payout > 0 ? "text-txt-2" : "text-danger-2"}`}>{r.payout > 0 ? `+${fmtNum(r.payout)} €` : `−${fmtNum(r.bet)} €`}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
