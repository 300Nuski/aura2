import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Dices, ArrowUp, ArrowDown, Percent, TrendingUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { playTick, playWinChime, playLoseTone } from "@/lib/sounds";
import { recordRound } from "@/lib/rounds";
import { fmt } from "@/lib/format";
import { Panel, Label, PrimaryButton, Pill } from "@/components/common/Bits";
import { BetInput } from "@/components/game/BetInput";

const HOUSE = 99; // 1 % edge
const clampTarget = (t) => Math.min(98, Math.max(2, Math.round(t * 100) / 100));

export const DiceGame = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(100);
  const [target, setTarget] = useState(50);
  const [over, setOver] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  const chance = useMemo(() => (over ? 100 - target : target), [over, target]);
  const mult = useMemo(() => Math.floor((HOUSE / chance) * 10000) / 10000, [chance]);
  const potential = Math.floor(bet * mult);

  const roll = () => {
    if (rolling) return;
    const amount = Math.floor(Math.min(Math.max(1, bet), balanceRef.current));
    if (amount < 1) {
      toast.error("Nicht genügend Guthaben.");
      return;
    }
    setBalance((b) => b - amount);
    setRolling(true);
    setResult(null);
    const value = Math.floor(Math.random() * 10000) / 100; // 0.00 – 99.99
    const won = over ? value > target : value < target;
    const payout = won ? Math.floor(amount * mult) : 0;

    // 3-step: anticipation (fast random), roll (converge), settle
    const start = performance.now();
    const DUR = 720;
    let lastTick = 0;
    const anim = (now) => {
      const k = Math.min(1, (now - start) / DUR);
      const eased = 1 - Math.pow(1 - k, 3);
      const noise = (1 - eased) * (Math.random() * 100);
      const shown = k < 0.85 ? Math.round((value * eased + noise * (1 - eased)) * 100) / 100 : value;
      setDisplay(Math.min(99.99, Math.max(0, shown)));
      if (now - lastTick > 70 && k < 0.85) {
        lastTick = now;
        playTick(500 + k * 700, 0.02);
      }
      if (k < 1) requestAnimationFrame(anim);
      else {
        setDisplay(value);
        setResult({ value, won, payout, amount });
        setHistory((h) => [{ value, won, id: Date.now() }, ...h].slice(0, 12));
        if (won) {
          setBalance((b) => b + payout);
          playWinChime();
          toast.success(`Gewonnen! ${value.toFixed(2)} · +${payout.toLocaleString("de-DE")} €`);
        } else {
          playLoseTone();
        }
        recordRound({ game: "Dice", bet: amount, mult: won ? mult : 0, payout, meta: { target, over, roll: value } });
        setRolling(false);
      }
    };
    requestAnimationFrame(anim);
  };

  const markerLeft = display == null ? null : `${display}%`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" data-testid="dice-game">
      <div className="lg:col-span-8 flex flex-col gap-5">
        <Panel className="p-5 sm:p-8 relative overflow-hidden">
          <div className="absolute -left-20 -top-24 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(106,168,255,0.14) 0%, rgba(106,168,255,0) 60%)" }} />

          {/* result display */}
          <div className="relative flex flex-col items-center justify-center min-h-[190px] mb-8">
            <AnimatePresence mode="wait">
              <motion.div key={result ? `r-${result.value}-${result.won}` : rolling ? "rolling" : "idle"} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.2 }} className="text-center">
                <p className={`font-mono font-bold text-6xl sm:text-7xl tabular tracking-[-0.03em] leading-none ${result ? (result.won ? "text-win" : "text-danger") : rolling ? "text-txt" : "text-dim-2"}`} data-testid="dice-result-display">
                  {display == null ? "—" : display.toFixed(2)}
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-dim">{result ? (result.won ? `Gewonnen · +${result.payout.toLocaleString("de-DE")} €` : `Verloren · −${result.amount.toLocaleString("de-DE")} €`) : rolling ? "Würfelt …" : "Würfle zwischen 0,00 und 99,99"}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* track */}
          <div className="relative px-2">
            <div className="relative h-14 rounded-2xl bg-surface-2 border border-line overflow-hidden" data-testid="dice-track">
              <div className="absolute inset-y-0 left-0 transition-[width] duration-200" style={{ width: `${target}%`, backgroundColor: over ? "rgba(255,77,109,0.22)" : "rgba(46,242,165,0.22)" }} />
              <div className="absolute inset-y-0 right-0 transition-[width] duration-200" style={{ width: `${100 - target}%`, backgroundColor: over ? "rgba(46,242,165,0.22)" : "rgba(255,77,109,0.22)" }} />
              <div className="absolute inset-y-0 w-0.5 bg-brand shadow-glow-brand" style={{ left: `${target}%` }} />
              <span className="absolute top-1 -translate-x-1/2 rounded-md bg-brand text-brand-fg text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ left: `${target}%` }} data-testid="dice-target-label">
                {target.toFixed(2)}
              </span>
              {markerLeft && (
                <motion.div className="absolute bottom-1 -translate-x-1/2 flex flex-col items-center" animate={{ left: markerLeft }} transition={{ type: "spring", stiffness: 260, damping: 26 }} data-testid="dice-roll-marker">
                  <span className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center shadow-card ${result ? (result.won ? "bg-win border-win-2 text-[#04150d]" : "bg-danger border-danger-2 text-white") : "bg-txt border-txt-2 text-ink"}`}>
                    <Dices className="w-4 h-4" />
                  </span>
                </motion.div>
              )}
            </div>
            <div className="mt-4">
              <Slider value={[target]} min={2} max={98} step={1} onValueChange={(v) => setTarget(clampTarget(v[0]))} disabled={rolling} className="dice-slider" data-testid="dice-target-slider" />
              <div className="flex justify-between mt-2 text-[10px] font-mono text-dim-2">
                {[0, 25, 50, 75, 100].map((v) => (
                  <span key={v}>{v}</span>
                ))}
              </div>
            </div>
          </div>

          {/* readouts */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Multiplikator
              </p>
              <p className="font-mono font-semibold text-lg tabular text-brand" data-testid="dice-multiplier">
                {mult.toFixed(4)}x
              </p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1">{over ? "Über" : "Unter"}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  max={98}
                  step={1}
                  value={target}
                  onChange={(e) => setTarget(clampTarget(Number(e.target.value) || 2))}
                  disabled={rolling}
                  className="w-full bg-transparent font-mono font-semibold text-lg tabular text-txt focus:outline-none"
                  data-testid="dice-target-input"
                />
                <button onClick={() => setOver((o) => !o)} disabled={rolling} className="shrink-0 w-8 h-8 rounded-lg bg-raised border border-line flex items-center justify-center hover:border-aqua/50 transition-colors duration-200" aria-label="Über/Unter wechseln" data-testid="dice-swap-button">
                  {over ? <ArrowUp className="w-4 h-4 text-win" /> : <ArrowDown className="w-4 h-4 text-win" />}
                </button>
              </div>
            </div>
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1 flex items-center gap-1">
                <Percent className="w-3 h-3" /> Gewinnchance
              </p>
              <p className="font-mono font-semibold text-lg tabular text-aqua" data-testid="dice-chance">
                {chance.toFixed(2)} %
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Letzte Würfe</p>
          <div className="flex gap-2 flex-wrap min-h-[32px]" data-testid="dice-history">
            {history.length === 0 && <span className="text-xs text-dim-2">Noch keine Würfe.</span>}
            <AnimatePresence initial={false}>
              {history.map((h) => (
                <motion.span key={h.id} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <Pill tone={h.won ? "win" : "loss"}>{h.value.toFixed(2)}</Pill>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-5">
        <Panel className="p-5">
          <BetInput value={bet} onChange={setBet} disabled={rolling} balance={balance} testId="dice" />

          <Label className="mt-5">Modus</Label>
          <div className="grid grid-cols-2 gap-2" data-testid="dice-over-under-toggle">
            <button onClick={() => setOver(false)} disabled={rolling} className={`rounded-xl border px-4 py-3 text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors duration-200 ${!over ? "bg-win/12 border-win/50 text-win" : "bg-surface-2 border-line text-dim hover:text-txt"}`} data-testid="dice-under-button">
              <ArrowDown className="w-4 h-4" /> Unter {target}
            </button>
            <button onClick={() => setOver(true)} disabled={rolling} className={`rounded-xl border px-4 py-3 text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors duration-200 ${over ? "bg-win/12 border-win/50 text-win" : "bg-surface-2 border-line text-dim hover:text-txt"}`} data-testid="dice-over-button">
              <ArrowUp className="w-4 h-4" /> Über {target}
            </button>
          </div>

          <div className="mt-5 rounded-xl bg-surface-2 border border-line px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-dim">Möglicher Gewinn</span>
            <span className="font-mono font-semibold text-win tabular" data-testid="dice-potential">
              {fmt(potential)}
            </span>
          </div>

          <PrimaryButton tone="gold" onClick={roll} disabled={rolling || bet < 1} className="w-full py-4 text-base mt-4" data-testid="dice-roll-button">
            <Dices className={`w-4 h-4 ${rolling ? "animate-spin" : ""}`} />
            {rolling ? "Würfelt …" : `Würfeln · ${fmt(bet)}`}
          </PrimaryButton>
        </Panel>

        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Regeln</p>
          <ul className="space-y-2 text-xs text-dim leading-relaxed">
            <li>• Der Würfel liefert eine Zahl von 0,00 bis 99,99.</li>
            <li>• <span className="text-txt font-semibold">Über</span>: Du gewinnst, wenn die Zahl größer als dein Ziel ist. <span className="text-txt font-semibold">Unter</span>: kleiner als dein Ziel.</li>
            <li>• Multiplikator = 99 ÷ Gewinnchance (1 % Hausvorteil).</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
};
