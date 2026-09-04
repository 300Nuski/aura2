import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Castle, Gem, Skull, HandCoins, Shuffle } from "lucide-react";
import { playReveal, playExplosion, playWinChime } from "@/lib/sounds";
import { recordRound } from "@/lib/rounds";
import { fmt } from "@/lib/format";
import { Panel, Label, PrimaryButton, SmallButton, Pill } from "@/components/common/Bits";
import { BetInput } from "@/components/game/BetInput";

const LEVELS = 8;
const DIFFS = [
  { id: "easy", label: "Leicht", tiles: 4, traps: 1 },
  { id: "medium", label: "Mittel", tiles: 3, traps: 1 },
  { id: "hard", label: "Schwer", tiles: 2, traps: 1 },
  { id: "expert", label: "Experte", tiles: 3, traps: 2 },
];
export const towerMult = (d, k) => (k <= 0 ? 1 : Math.floor(0.99 * Math.pow(d.tiles / (d.tiles - d.traps), k) * 100) / 100);

const genTraps = (d) =>
  Array.from({ length: LEVELS }, () => {
    const s = new Set();
    while (s.size < d.traps) s.add(Math.floor(Math.random() * d.tiles));
    return s;
  });

export const TowerGame = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(100);
  const [diffId, setDiffId] = useState("medium");
  const [phase, setPhase] = useState("idle"); // idle | playing | busted | cashed
  const [traps, setTraps] = useState([]);
  const [picks, setPicks] = useState([]); // chosen tile per level
  const [level, setLevel] = useState(0);
  const [stake, setStake] = useState(0);
  const [lastWin, setLastWin] = useState(null);
  const [history, setHistory] = useState([]);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;
  const d = useMemo(() => DIFFS.find((x) => x.id === diffId), [diffId]);
  const playing = phase === "playing";
  const mult = towerMult(d, level);
  const next = towerMult(d, level + 1);
  const payout = Math.floor(stake * mult);

  const start = () => {
    const amount = Math.floor(Math.min(Math.max(1, bet), balanceRef.current));
    if (amount < 1) {
      toast.error("Nicht genügend Guthaben.");
      return;
    }
    setBalance((b) => b - amount);
    setStake(amount);
    setTraps(genTraps(d));
    setPicks([]);
    setLevel(0);
    setLastWin(null);
    setPhase("playing");
  };

  const finish = (k) => {
    const m = towerMult(d, k);
    const win = Math.floor(stake * m);
    setBalance((b) => b + win);
    setLastWin({ mult: m, win });
    setPhase("cashed");
    playWinChime();
    recordRound({ game: "Tower", bet: stake, mult: m, payout: win, meta: { difficulty: diffId, level: k } });
    setHistory((h) => [{ id: Date.now(), won: true, mult: m }, ...h].slice(0, 12));
    toast.success(`Tower: ${k} Etagen · ${m.toFixed(2)}x · +${win.toLocaleString("de-DE")} €`);
  };

  const pick = (tile) => {
    if (!playing) return;
    const isTrap = traps[level].has(tile);
    setPicks((p) => [...p, tile]);
    if (isTrap) {
      setPhase("busted");
      playExplosion();
      recordRound({ game: "Tower", bet: stake, mult: 0, payout: 0, meta: { difficulty: diffId, level } });
      setHistory((h) => [{ id: Date.now(), won: false, mult: 0 }, ...h].slice(0, 12));
      toast.error(`Falle auf Etage ${level + 1} — ${fmt(stake)} verloren.`);
      return;
    }
    playReveal();
    const nl = level + 1;
    setLevel(nl);
    if (nl >= LEVELS) finish(nl);
  };

  const showAll = phase === "busted" || phase === "cashed";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4" data-testid="tower-game">
      <div className="order-2 lg:order-1 flex flex-col gap-4">
        <Panel className="p-5">
          <BetInput value={bet} onChange={setBet} disabled={playing} balance={balance} testId="tower" />
          <Label className="mt-5">Schwierigkeit</Label>
          <div className="grid grid-cols-2 gap-2" data-testid="tower-difficulty-select">
            {DIFFS.map((x) => (
              <SmallButton key={x.id} active={diffId === x.id} onClick={() => setDiffId(x.id)} disabled={playing} className="text-left px-3" data-testid={`tower-diff-${x.id}`}>
                <span className="block">{x.label}</span>
                <span className="block text-[9px] text-dim-2 font-normal">
                  {x.tiles} Felder · {x.traps} Falle{x.traps > 1 ? "n" : ""}
                </span>
              </SmallButton>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1">Nächste Etage</p>
              <p className="font-mono font-semibold text-base tabular text-gold" data-testid="tower-next-multiplier">
                {level < LEVELS ? `${next.toFixed(2)}x` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1">Auszahlung jetzt</p>
              <p className="font-mono font-semibold text-base tabular text-win" data-testid="tower-payout">
                {playing ? fmt(payout) : "—"}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {!playing ? (
              <PrimaryButton onClick={start} disabled={bet < 1} className="w-full py-4 text-base" data-testid="tower-start-button">
                <Castle className="w-4 h-4" /> {phase === "idle" ? `Aufstieg starten · ${fmt(bet)}` : `Neuer Aufstieg · ${fmt(bet)}`}
              </PrimaryButton>
            ) : (
              <>
                <PrimaryButton tone={level > 0 ? "win" : "secondary"} onClick={() => finish(level)} disabled={level < 1} className={`w-full py-4 text-base ${level > 0 ? "animate-win-pulse" : ""}`} data-testid="tower-cashout-button">
                  <HandCoins className="w-4 h-4" /> {level > 0 ? `Cashout · ${fmt(payout)}` : "Wähle ein Feld"}
                </PrimaryButton>
                <PrimaryButton tone="secondary" onClick={() => pick(Math.floor(Math.random() * d.tiles))} className="w-full py-3" data-testid="tower-random-button">
                  <Shuffle className="w-4 h-4" /> Zufälliges Feld
                </PrimaryButton>
              </>
            )}
          </div>
        </Panel>
        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Letzte Aufstiege</p>
          <div className="flex gap-2 flex-wrap min-h-[32px]" data-testid="tower-history">
            {history.length === 0 && <span className="text-xs text-dim-2">Noch keine Runde.</span>}
            {history.map((h) => (
              <Pill key={h.id} tone={h.won ? "win" : "loss"}>
                {h.won ? `${h.mult.toFixed(2)}x` : "Falle"}
              </Pill>
            ))}
          </div>
        </Panel>
      </div>

      <div className="order-1 lg:order-2 min-w-0">
        <Panel className="p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(251,191,36,0.14) 0%, rgba(251,191,36,0) 60%)" }} />
          <div className="relative flex items-center justify-between mb-4">
            <Pill tone="amber">
              <Castle className="w-3 h-3" /> {d.label} · {d.tiles} Felder
            </Pill>
            <div className="text-right">
              <p className={`font-mono font-bold text-2xl tabular leading-none ${phase === "busted" ? "text-danger" : phase === "cashed" ? "text-win" : "text-gold"}`} data-testid="tower-current-multiplier">
                {phase === "cashed" && lastWin ? `${lastWin.mult.toFixed(2)}x` : `${mult.toFixed(2)}x`}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mt-1">
                Etage {Math.min(level, LEVELS)} / {LEVELS}
              </p>
            </div>
          </div>
          <div className="relative flex flex-col gap-2 max-w-[520px] mx-auto" data-testid="tower-grid">
            {Array.from({ length: LEVELS }, (_, i) => LEVELS - 1 - i).map((lv) => {
              const isActive = playing && lv === level;
              const done = lv < level;
              const rowMult = towerMult(d, lv + 1);
              return (
                <div key={lv} className={`flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors ${isActive ? "bg-gold/10 ring-1 ring-gold/50" : ""}`} data-testid={`tower-row-${lv}`} data-active={isActive}>
                  <span className={`w-14 shrink-0 font-mono text-[11px] font-semibold tabular text-right ${done ? "text-win" : isActive ? "text-gold" : "text-dim-2"}`}>{rowMult.toFixed(2)}x</span>
                  <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${d.tiles}, minmax(0, 1fr))` }}>
                    {Array.from({ length: d.tiles }, (_, t) => {
                      const picked = picks[lv] === t;
                      const isTrap = traps[lv]?.has(t);
                      const revealTrap = (showAll || done || picked) && isTrap;
                      const revealGem = (done && picked) || (showAll && !isTrap && (done || phase === "cashed"));
                      let cls = "bg-panel-2 border-line-2";
                      if (isActive) cls = "bg-raised border-gold/40 hover:border-gold hover:shadow-glow-gold cursor-pointer";
                      if (revealGem) cls = picked ? "bg-win/20 border-win/60" : "bg-win/8 border-win/25";
                      if (revealTrap) cls = picked ? "bg-danger/30 border-danger/70 shadow-glow-danger" : "bg-danger/10 border-danger/30";
                      if (!isActive && !revealGem && !revealTrap && !playing) cls += " opacity-60";
                      return (
                        <motion.button
                          key={t}
                          whileHover={isActive ? { scale: 1.03 } : {}}
                          whileTap={isActive ? { scale: 0.96 } : {}}
                          onClick={() => isActive && pick(t)}
                          disabled={!isActive}
                          className={`h-11 sm:h-12 rounded-lg border-2 flex items-center justify-center transition-colors duration-200 ${cls}`}
                          data-testid={`tower-tile-${lv}-${t}`}
                        >
                          {revealGem && <Gem className={`w-5 h-5 animate-tile-pop ${picked ? "text-win" : "text-win/50"}`} />}
                          {revealTrap && <Skull className={`w-5 h-5 animate-tile-pop ${picked ? "text-danger" : "text-danger-2/60"}`} />}
                          {isActive && <span className="w-2 h-2 rounded-full bg-gold/60" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <AnimatePresence>
            {phase === "busted" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-5 rounded-xl bg-danger/10 border border-danger/40 px-4 py-3 text-center" data-testid="tower-busted-banner">
                <p className="font-display font-bold text-danger">Falle auf Etage {level + 1}</p>
                <p className="text-xs text-dim mt-0.5">Einsatz {fmt(stake)} verloren</p>
              </motion.div>
            )}
            {phase === "cashed" && lastWin && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-5 rounded-xl bg-win/10 border border-win/40 px-4 py-3 text-center" data-testid="tower-cashed-banner">
                <p className="font-display font-bold text-win">Ausgezahlt · {lastWin.mult.toFixed(2)}x</p>
                <p className="text-xs text-dim mt-0.5">+{lastWin.win.toLocaleString("de-DE")} € gutgeschrieben</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
      </div>
    </div>
  );
};
