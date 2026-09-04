import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Bomb, Gem, Shuffle, HandCoins } from "lucide-react";
import { playReveal, playExplosion, playWinChime } from "@/lib/sounds";
import { recordRound } from "@/lib/rounds";
import { fmt } from "@/lib/format";
import { Panel, Label, PrimaryButton, SmallButton, Pill } from "@/components/common/Bits";
import { BetInput } from "@/components/game/BetInput";

const TILES = 25;
const EDGE = 0.99;

// multiplier after k safe picks with n mines: 0.99 * C(25,k) / C(25-n,k)
export const minesMult = (n, k) => {
  if (k <= 0) return 1;
  let m = EDGE;
  for (let i = 0; i < k; i++) m *= (TILES - i) / (TILES - n - i);
  return Math.floor(m * 100) / 100;
};

const pickMines = (n) => {
  const s = new Set();
  while (s.size < n) s.add(Math.floor(Math.random() * TILES));
  return s;
};

export const MinesGame = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(100);
  const [minesCount, setMinesCount] = useState(3);
  const [phase, setPhase] = useState("idle"); // idle | playing | busted | cashed
  const [mines, setMines] = useState(new Set());
  const [revealed, setRevealed] = useState(new Set());
  const [hit, setHit] = useState(null);
  const [stake, setStake] = useState(0);
  const [lastWin, setLastWin] = useState(null);
  const [history, setHistory] = useState([]);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  const k = revealed.size;
  const currentMult = useMemo(() => minesMult(minesCount, k), [minesCount, k]);
  const nextMult = useMemo(() => minesMult(minesCount, k + 1), [minesCount, k]);
  const safeLeft = TILES - minesCount - k;
  const payout = Math.floor(stake * currentMult);

  const start = () => {
    const amount = Math.floor(Math.min(Math.max(1, bet), balanceRef.current));
    if (amount < 1) {
      toast.error("Nicht genügend Guthaben.");
      return;
    }
    setBalance((b) => b - amount);
    setStake(amount);
    setMines(pickMines(minesCount));
    setRevealed(new Set());
    setHit(null);
    setLastWin(null);
    setPhase("playing");
  };

  const finishWin = (kFinal, amount) => {
    const m = minesMult(minesCount, kFinal);
    const win = Math.floor(amount * m);
    setBalance((b) => b + win);
    setLastWin({ mult: m, win });
    setPhase("cashed");
    playWinChime();
    recordRound({ game: "Mines", bet: amount, mult: m, payout: win, meta: { mines: minesCount, gems: kFinal } });
    setHistory((h) => [{ id: Date.now(), won: true, mult: m }, ...h].slice(0, 12));
    toast.success(`Cashout bei ${m.toFixed(2)}x · +${win.toLocaleString("de-DE")} €`);
  };

  const reveal = (i) => {
    if (phase !== "playing" || revealed.has(i)) return;
    if (mines.has(i)) {
      setHit(i);
      setPhase("busted");
      playExplosion();
      recordRound({ game: "Mines", bet: stake, mult: 0, payout: 0, meta: { mines: minesCount, gems: k } });
      setHistory((h) => [{ id: Date.now(), won: false, mult: 0 }, ...h].slice(0, 12));
      toast.error(`Mine getroffen — ${fmt(stake)} verloren.`);
      return;
    }
    const next = new Set(revealed);
    next.add(i);
    setRevealed(next);
    playReveal();
    if (next.size >= TILES - minesCount) finishWin(next.size, stake);
  };

  const randomPick = () => {
    if (phase !== "playing") return;
    const candidates = [];
    for (let i = 0; i < TILES; i++) if (!revealed.has(i)) candidates.push(i);
    if (!candidates.length) return;
    reveal(candidates[Math.floor(Math.random() * candidates.length)]);
  };

  const cashout = () => {
    if (phase !== "playing" || k < 1) return;
    finishWin(k, stake);
  };

  const showAll = phase === "busted" || phase === "cashed";
  const playing = phase === "playing";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" data-testid="mines-game">
      <div className="lg:col-span-8 flex flex-col gap-5">
        <Panel className="p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(127,231,214,0.14) 0%, rgba(127,231,214,0) 60%)" }} />
          <div className="relative flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Pill tone="aqua">
                <Bomb className="w-3 h-3" /> {minesCount} Minen
              </Pill>
              <Pill tone="win">
                <Gem className="w-3 h-3" /> {TILES - minesCount} Edelsteine
              </Pill>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={`${phase}-${k}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-right">
                <p className={`font-mono font-bold text-2xl tabular leading-none ${phase === "busted" ? "text-danger" : phase === "cashed" ? "text-win" : "text-brand"}`} data-testid="mines-current-multiplier">
                  {phase === "cashed" && lastWin ? `${lastWin.mult.toFixed(2)}x` : `${currentMult.toFixed(2)}x`}
                </p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mt-1">{phase === "busted" ? "Gesprengt" : phase === "cashed" ? "Ausgezahlt" : `${k} aufgedeckt`}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative grid grid-cols-5 gap-2 sm:gap-3 max-w-[560px] mx-auto" data-testid="mines-grid">
            {Array.from({ length: TILES }, (_, i) => {
              const isRevealed = revealed.has(i);
              const isMine = mines.has(i);
              const isHit = hit === i;
              const show = isRevealed || (showAll && isMine);
              let cls = "bg-panel-2 border-line-2 hover:border-aqua/40 hover:shadow-glow-aqua";
              if (isRevealed) cls = "bg-win/15 border-win/40";
              else if (show && isMine) cls = isHit ? "bg-danger/25 border-danger/60 shadow-glow-danger" : "bg-danger/10 border-danger/30";
              else if (!playing) cls = "bg-panel-2 border-line-2 opacity-70";
              return (
                <motion.button
                  key={i}
                  whileHover={playing && !isRevealed ? { scale: 1.04 } : {}}
                  whileTap={playing && !isRevealed ? { scale: 0.95 } : {}}
                  onClick={() => reveal(i)}
                  disabled={!playing || isRevealed}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-[border-color,background-color,box-shadow] duration-200 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-2 ${cls}`}
                  data-testid={`mines-tile-${i}`}
                  data-state={isRevealed ? "gem" : show && isMine ? "mine" : "hidden"}
                  aria-label={`Feld ${i + 1}`}
                >
                  {isRevealed && <Gem className="w-6 h-6 sm:w-8 sm:h-8 text-win animate-tile-pop drop-shadow-[0_0_12px_rgba(46,242,165,0.6)]" />}
                  {show && isMine && <Bomb className={`w-6 h-6 sm:w-8 sm:h-8 animate-tile-pop ${isHit ? "text-danger drop-shadow-[0_0_14px_rgba(255,77,109,0.8)]" : "text-danger-2/70"}`} />}
                  {!show && playing && <span className="w-2 h-2 rounded-full bg-line" />}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {phase === "busted" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-5 rounded-xl bg-danger/10 border border-danger/40 px-4 py-3 text-center" data-testid="mines-busted-banner">
                <p className="font-display font-bold text-danger">Mine getroffen</p>
                <p className="text-xs text-dim mt-0.5">
                  {k} Edelstein{k === 1 ? "" : "e"} gefunden · Einsatz {fmt(stake)} verloren
                </p>
              </motion.div>
            )}
            {phase === "cashed" && lastWin && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-5 rounded-xl bg-win/10 border border-win/40 px-4 py-3 text-center" data-testid="mines-cashed-banner">
                <p className="font-display font-bold text-win">Ausgezahlt · {lastWin.mult.toFixed(2)}x</p>
                <p className="text-xs text-dim mt-0.5">+{lastWin.win.toLocaleString("de-DE")} € gutgeschrieben</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>

        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Letzte Runden</p>
          <div className="flex gap-2 flex-wrap min-h-[32px]" data-testid="mines-history">
            {history.length === 0 && <span className="text-xs text-dim-2">Noch keine Runden.</span>}
            {history.map((h) => (
              <Pill key={h.id} tone={h.won ? "win" : "loss"}>
                {h.won ? `${h.mult.toFixed(2)}x` : "Mine"}
              </Pill>
            ))}
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-5">
        <Panel className="p-5">
          <BetInput value={bet} onChange={setBet} disabled={playing} balance={balance} testId="mines" />

          <Label className="mt-5">Minen ({minesCount})</Label>
          <div className="grid grid-cols-6 gap-1.5" data-testid="mines-count-select">
            {[1, 2, 3, 5, 8, 10, 12, 15, 18, 20, 22, 24].map((n) => (
              <SmallButton key={n} active={minesCount === n} onClick={() => setMinesCount(n)} disabled={playing} className="px-0 py-2" data-testid={`mines-count-${n}`}>
                {n}
              </SmallButton>
            ))}
          </div>
          <input type="range" min={1} max={24} value={minesCount} onChange={(e) => setMinesCount(Number(e.target.value))} disabled={playing} className="w-full mt-3 accent-[#7FE7D6]" data-testid="mines-count-slider" />

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1">Nächstes Feld</p>
              <p className="font-mono font-semibold text-base tabular text-aqua" data-testid="mines-next-multiplier">
                {safeLeft > 0 ? `${nextMult.toFixed(2)}x` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1">Auszahlung jetzt</p>
              <p className="font-mono font-semibold text-base tabular text-win" data-testid="mines-payout">
                {playing ? fmt(payout) : "—"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {!playing ? (
              <PrimaryButton tone="gold" onClick={start} disabled={bet < 1} className="w-full py-4 text-base" data-testid="mines-start-button">
                <Bomb className="w-4 h-4" />
                {phase === "idle" ? `Spiel starten · ${fmt(bet)}` : `Neue Runde · ${fmt(bet)}`}
              </PrimaryButton>
            ) : (
              <>
                <PrimaryButton tone={k > 0 ? "win" : "secondary"} onClick={cashout} disabled={k < 1} className={`w-full py-4 text-base ${k > 0 ? "animate-win-pulse" : ""}`} data-testid="mines-cashout-button">
                  <HandCoins className="w-4 h-4" />
                  {k > 0 ? `Cashout · ${fmt(payout)}` : "Decke ein Feld auf"}
                </PrimaryButton>
                <PrimaryButton tone="secondary" onClick={randomPick} className="w-full py-3" data-testid="mines-random-button">
                  <Shuffle className="w-4 h-4" /> Zufälliges Feld
                </PrimaryButton>
              </>
            )}
          </div>
        </Panel>

        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Regeln</p>
          <ul className="space-y-2 text-xs text-dim leading-relaxed">
            <li>• 25 Felder, darunter deine gewählte Anzahl Minen.</li>
            <li>• Jeder Edelstein erhöht den Multiplikator — mehr Minen, höhere Steigerung.</li>
            <li>• Cashout jederzeit nach dem ersten Edelstein. Eine Mine beendet die Runde.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
};
