import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Trophy, Users, Activity, Coins } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useApp } from "@/context/AppContext";
import { fmt, fmtNum, fmtMult, timeAgo } from "@/lib/format";
import { gameColor, GAMES } from "@/constants/games";
import { Panel, Pill } from "@/components/common/Bits";

export const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAuth, openDeposit } = useApp();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = () => api.get("/stats/public").then((r) => setStats(r.data)).catch(() => setStats((s) => s ?? { players: 0, rounds_24h: 0, wagered_24h: 0, biggest_win: null }));
    load();
    const i = setInterval(load, 20000);
    return () => clearInterval(i);
  }, []);

  const newGames = GAMES.filter((g) => g.tag === "Neu").slice(4, 8);

  return (
    <section className="grid grid-cols-12 gap-5 mb-8" data-testid="hero-section">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="col-span-12 lg:col-span-8 relative overflow-hidden rounded-3xl bg-panel border border-line shadow-card p-7 sm:p-10 grain"
      >
        <div className="absolute -right-24 -top-28 w-[420px] h-[420px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(231,199,122,0.16) 0%, rgba(231,199,122,0) 60%)" }} />
        <div className="absolute -right-12 -bottom-20 w-[360px] h-[360px] opacity-30 pointer-events-none animate-spin-slower" aria-hidden="true">
          <svg viewBox="0 0 300 300" className="w-full h-full">
            <circle cx="150" cy="150" r="140" fill="none" stroke="#E7C77A" strokeWidth="1" strokeDasharray="4 14" />
            <circle cx="150" cy="150" r="104" fill="none" stroke="#7FE7D6" strokeWidth="0.8" strokeDasharray="2 10" />
            <circle cx="150" cy="150" r="66" fill="none" stroke="#E7C77A" strokeWidth="0.8" />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl">
          <Pill tone="gold" className="mb-5" data-testid="hero-badge">
            <Sparkles className="w-3.5 h-3.5" />
            Originals · Spielgeld · 18+
          </Pill>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[3.6rem] tracking-[-0.03em] leading-[1.02]" data-testid="hero-headline">
            Sieben Spiele. <br />
            <span className="text-brand">Ein Guthaben.</span> Null Risiko.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-dim leading-relaxed max-w-lg">
            Crash, Dice, Mines, Coinflip und die Klassiker — alles mit einem gemeinsamen Spielgeld-Konto, echtem Live-Feed und Community-Chat. Kein Echtgeld, nur Spaß.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/crash")}
              className="group rounded-xl bg-brand text-brand-fg font-bold text-sm px-6 py-3.5 inline-flex items-center gap-2 hover:brightness-105 transition-[filter] duration-200 shadow-glow-brand active:scale-[0.98]"
              data-testid="hero-play-button"
            >
              Crash spielen
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            {user ? (
              <button onClick={openDeposit} className="rounded-xl border border-line bg-surface-2 text-sm font-semibold px-6 py-3.5 hover:border-aqua/50 hover:text-aqua transition-colors duration-200" data-testid="hero-deposit-button">
                Guthaben aufladen
              </button>
            ) : (
              <button onClick={openAuth} className="rounded-xl border border-line bg-surface-2 text-sm font-semibold px-6 py-3.5 hover:border-aqua/50 hover:text-aqua transition-colors duration-200" data-testid="hero-register-button">
                Kostenlos registrieren
              </button>
            )}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg" data-testid="hero-stats">
            {[
              { icon: Users, label: "Spieler", value: stats ? fmtNum(stats.players) : "—" },
              { icon: Activity, label: "Runden · 24h", value: stats ? fmtNum(stats.rounds_24h) : "—" },
              { icon: Coins, label: "Umsatz · 24h", value: stats ? fmt(stats.wagered_24h) : "—" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-surface-2 border border-line-2 px-3.5 py-3">
                <s.icon className="w-3.5 h-3.5 text-dim-2 mb-1.5" />
                <p className="font-mono font-semibold text-sm sm:text-base tabular leading-none">{s.value}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="col-span-12 lg:col-span-4 flex flex-col gap-5"
      >
        <Panel className="p-5" featured data-testid="hero-biggest-win">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-dim">
              <Trophy className="w-4 h-4 text-brand" />
              Größter Gewinn · 24h
            </span>
          </div>
          {stats?.biggest_win ? (
            <div>
              <p className="font-mono font-semibold text-3xl text-win tabular leading-none">{fmt(stats.biggest_win.payout)}</p>
              <p className="mt-2 text-sm text-txt-2">
                <span className="font-semibold text-txt">{stats.biggest_win.user_name}</span> · {stats.biggest_win.game}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Pill tone="gold">{fmtMult(stats.biggest_win.mult)}</Pill>
                <Pill tone="dim">Einsatz {fmt(stats.biggest_win.bet)}</Pill>
                <span className="text-[11px] text-dim-2 ml-auto">{timeAgo(stats.biggest_win.ts)}</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-mono font-semibold text-3xl text-dim-2 tabular leading-none">—</p>
              <p className="mt-2 text-sm text-dim">Noch kein Gewinn in den letzten 24 Stunden. Sei der Erste!</p>
            </div>
          )}
        </Panel>
        <Panel className="p-5 flex-1" data-testid="hero-new-games">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Neu im Haus</p>
          <div className="space-y-1.5">
            {newGames.map((g) => (
              <button key={g.id} onClick={() => navigate(g.route)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-panel-2 transition-colors duration-200 text-left group" data-testid={`hero-new-${g.id}`}>
                <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${gameColor(g.name)}1f` }}>
                  <g.icon className="w-4 h-4" style={{ color: g.color }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{g.name}</span>
                  <span className="block text-[11px] text-dim truncate">{g.maxWin}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-dim-2 group-hover:text-brand group-hover:translate-x-0.5 transition-all duration-200" />
              </button>
            ))}
          </div>
        </Panel>
      </motion.div>
    </section>
  );
};
