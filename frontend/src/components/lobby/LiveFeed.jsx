import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { fmt, fmtMult, clockTime, initials } from "@/lib/format";
import { gameColor, GAME_BY_NAME } from "@/constants/games";
import { Panel, Pill, EmptyState, Skeleton } from "@/components/common/Bits";

const FILTERS = [
  { id: "all", label: "Alle" },
  { id: "wins", label: "Gewinne" },
  { id: "big", label: "≥ 5x" },
];


export const LiveFeed = ({ limit = 12, className = "", title = "Live Winners" }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/rounds/recent?limit=${limit * 2}`);
      setRows(r.data);
      setError(false);
    } catch {
      setError(true);
      setRows((x) => x ?? []);
    }
  }, [limit]);

  useEffect(() => {
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, [load]);

  const visible = (rows ?? [])
    .filter((r) => (filter === "wins" ? r.payout > r.bet : filter === "big" ? r.mult >= 5 : true))
    .slice(0, limit);

  return (
    <Panel className={`overflow-hidden ${className}`} data-testid="live-feed">
      <div className="flex items-center justify-between gap-3 px-5 py-4 flex-wrap">
        <h3 className="font-display font-extrabold text-base uppercase tracking-[0.2em] text-txt-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-win" />
          {title}
          <span className="w-1.5 h-1.5 rounded-full bg-win animate-pulse-dot" />
        </h3>
        <div className="flex gap-1 rounded-full bg-surface-2 border border-line p-1" data-testid="live-feed-filters">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors duration-200 ${filter === f.id ? "bg-brand text-white" : "text-dim hover:text-txt"}`} data-testid={`live-feed-filter-${f.id}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-[1.3fr_1.2fr_0.6fr_0.8fr_0.7fr_0.9fr] gap-2 px-5 py-2.5 border-y border-line-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-dim-2">
        <span>Spiel</span>
        <span>Spieler</span>
        <span>Zeit</span>
        <span className="text-right">Einsatz</span>
        <span className="text-right">Multi</span>
        <span className="text-right">Auszahlung</span>
      </div>

      {rows === null && (
        <div className="p-5 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      )}

      {rows && visible.length === 0 && (
        <EmptyState
          icon={Activity}
          title={error ? "Feed nicht erreichbar" : "Noch keine Runden"}
          text={error ? "Der Live-Feed konnte nicht geladen werden." : "Sobald jemand spielt, erscheinen die Runden hier in Echtzeit."}
          action={
            error ? (
              <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-raised border border-line px-4 py-2 text-xs font-bold hover:border-brand/60" data-testid="live-feed-retry-button">
                <RefreshCw className="w-3.5 h-3.5" /> Erneut laden
              </button>
            ) : (
              <button onClick={() => navigate("/crash")} className="rounded-lg bg-brand text-white px-4 py-2 text-xs font-bold hover:brightness-110" data-testid="live-feed-play-button">
                Erste Runde spielen
              </button>
            )
          }
        />
      )}

      <div className="divide-y divide-line-2" data-testid="live-feed-table">
        <AnimatePresence initial={false}>
          {visible.map((r) => {
            const won = r.payout > r.bet;
            const g = GAME_BY_NAME[r.game];
            const GIcon = g?.icon;
            const color = gameColor(r.game);
            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`grid grid-cols-[1.3fr_1fr_1fr] sm:grid-cols-[1.3fr_1.2fr_0.6fr_0.8fr_0.7fr_0.9fr] gap-2 px-5 py-2.5 items-center text-sm hover:bg-brand/[0.06] transition-colors duration-200`}
                data-testid="live-feed-row"
              >
                <span className="flex items-center gap-2.5 font-semibold text-[13px] min-w-0">
                  <span className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22`, borderColor: `${color}55` }}>
                    {GIcon ? <GIcon className="w-4 h-4" style={{ color }} /> : <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
                  </span>
                  <span className="truncate">{r.game}</span>
                </span>
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-raised border border-line flex items-center justify-center text-[10px] font-bold shrink-0">{initials(r.user_name)}</span>
                  <span className="text-[13px] text-txt-2 truncate">{r.user_name}</span>
                </span>
                <span className="hidden sm:block font-mono text-xs text-dim tabular">{clockTime(r.ts)}</span>
                <span className="hidden sm:block text-right font-mono text-xs text-txt-2 tabular">{fmt(r.bet)}</span>
                <span className="hidden sm:block text-right">
                  {r.mult > 0 ? <Pill tone={r.mult >= 5 ? "amber" : "neutral"}>{fmtMult(r.mult)}</Pill> : <span className="font-mono text-xs text-dim-2">—</span>}
                </span>
                <span className={`text-right font-mono text-xs font-semibold tabular ${won ? "text-win" : r.payout > 0 ? "text-txt-2" : "text-danger-2"}`}>
                  {r.payout > 0 ? `+${r.payout.toLocaleString("de-DE")} €` : `−${r.bet.toLocaleString("de-DE")} €`}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Panel>
  );
};
