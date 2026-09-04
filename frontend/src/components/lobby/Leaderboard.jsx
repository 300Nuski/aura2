import { useCallback, useEffect, useState } from "react";
import { Trophy, Crown } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { fmtSigned, fmtMult, initials } from "@/lib/format";
import { Panel, EmptyState, Skeleton } from "@/components/common/Bits";

const RANGES = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7 Tage" },
  { id: "all", label: "Gesamt" },
];

const rankCls = (i) => (i === 0 ? "bg-brand text-brand-fg" : i === 1 ? "bg-txt-2 text-ink" : i === 2 ? "bg-[#C98A4B] text-ink" : "bg-raised text-dim border border-line");

export const Leaderboard = ({ className = "" }) => {
  const { user } = useAuth();
  const [range, setRange] = useState("all");
  const [rows, setRows] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/leaderboard?range=${range}&limit=8`);
      setRows(r.data);
    } catch {
      setRows((x) => x ?? []);
    }
  }, [range]);

  useEffect(() => {
    setRows(null);
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, [load]);

  return (
    <Panel className={`overflow-hidden ${className}`} data-testid="leaderboard">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line-2 flex-wrap">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <Trophy className="w-4 h-4 text-brand" />
          Bestenliste
        </h3>
        <div className="flex gap-1 rounded-full bg-surface-2 border border-line p-1" data-testid="leaderboard-range-tabs">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)} className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors duration-200 ${range === r.id ? "bg-raised text-txt" : "text-dim hover:text-txt"}`} data-testid={`leaderboard-range-${r.id}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {rows === null && (
        <div className="p-5 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      )}
      {rows && rows.length === 0 && <EmptyState icon={Crown} title="Noch keine Platzierungen" text="Spiele eine Runde und sichere dir Platz 1." />}

      <div className="divide-y divide-line-2">
        {rows?.map((r, i) => {
          const me = user && r.user_id === user.id;
          return (
            <div key={r.user_id} className={`flex items-center gap-3 px-5 py-3 ${me ? "bg-brand/[0.06]" : "hover:bg-aqua/[0.04]"} transition-colors duration-200`} data-testid="leaderboard-row">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${rankCls(i)}`}>{i + 1}</span>
              <span className="w-8 h-8 rounded-full bg-raised border border-line flex items-center justify-center text-[10px] font-bold shrink-0">{initials(r.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">
                  {r.name}
                  {me && <span className="ml-2 text-[9px] font-mono text-brand">DU</span>}
                </p>
                <p className="text-[11px] text-dim font-mono">
                  {r.rounds} Runden · best {fmtMult(r.best_mult)}
                </p>
              </div>
              <span className={`font-mono text-sm font-semibold tabular ${r.profit >= 0 ? "text-win" : "text-danger-2"}`}>{fmtSigned(r.profit)}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};
