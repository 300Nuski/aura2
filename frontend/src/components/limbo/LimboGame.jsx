import { useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { toast } from "sonner";
import { Infinity as InfinityIcon, Percent, TrendingUp } from "lucide-react";
import { playWinChime, playLoseTone } from "@/lib/sounds";
import { recordRound } from "@/lib/rounds";
import { fmt } from "@/lib/format";
import { Panel, Label, PrimaryButton, SmallButton, Pill, NumberInput } from "@/components/common/Bits";
import { BetInput } from "@/components/game/BetInput";

const MAX = 1000000;
const genResult = () => Math.min(MAX, Math.max(1, Math.floor((0.99 / (1 - Math.random())) * 100) / 100));

export const LimboGame = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(100);
  const [target, setTarget] = useState(2);
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  const t = Math.max(1.01, Number(target) || 1.01);
  const chance = Math.min(99, 99 / t);
  const potential = Math.floor(bet * t);

  const play = () => {
    if (rolling) return;
    const amount = Math.floor(Math.min(Math.max(1, bet), balanceRef.current));
    if (amount < 1) {
      toast.error("Nicht genügend Guthaben.");
      return;
    }
    setBalance((b) => b - amount);
    setRolling(true);
    setResult(null);
    const r = genResult();
    const won = r >= t;
    const payout = won ? Math.floor(amount * t) : 0;
    animate(1, r, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
      onComplete: () => {
        setDisplay(r);
        setResult({ r, won, payout, amount });
        setHistory((h) => [{ id: Date.now(), r, won }, ...h].slice(0, 14));
        if (won) {
          setBalance((b) => b + payout);
          playWinChime();
          toast.success(`${r.toFixed(2)}x ≥ ${t.toFixed(2)}x · +${payout.toLocaleString("de-DE")} €`);
        } else playLoseTone();
        recordRound({ game: "Limbo", bet: amount, mult: won ? t : 0, payout, meta: { target: t, result: r } });
        setRolling(false);
      },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4" data-testid="limbo-game">
      <div className="order-2 lg:order-1 flex flex-col gap-4">
        <Panel className="p-5">
          <BetInput value={bet} onChange={setBet} disabled={rolling} balance={balance} testId="limbo" />
          <Label className="mt-5">Ziel-Multiplikator</Label>
          <div className="flex items-center gap-2">
            <NumberInput min={1.01} step={0.01} value={target} onChange={(e) => setTarget(e.target.value)} onBlur={() => setTarget(Math.min(MAX, Math.max(1.01, Math.round((Number(target) || 1.01) * 100) / 100)))} disabled={rolling} data-testid="limbo-target-input" />
            {[2, 5, 10, 100].map((v) => (
              <SmallButton key={v} active={Number(target) === v} onClick={() => setTarget(v)} disabled={rolling} data-testid={`limbo-quick-${v}`}>
                {v}x
              </SmallButton>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1 flex items-center gap-1">
                <Percent className="w-3 h-3" /> Gewinnchance
              </p>
              <p className="font-mono font-semibold text-base tabular text-aqua" data-testid="limbo-chance">
                {chance.toFixed(2)} %
              </p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Gewinn
              </p>
              <p className="font-mono font-semibold text-base tabular text-win" data-testid="limbo-potential">
                {fmt(potential)}
              </p>
            </div>
          </div>
          <PrimaryButton onClick={play} disabled={rolling || bet < 1} className="w-full py-4 text-base mt-4" data-testid="limbo-play-button">
            <InfinityIcon className="w-4 h-4" /> {rolling ? "Läuft …" : `Spielen · ${fmt(bet)}`}
          </PrimaryButton>
        </Panel>
        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Regeln</p>
          <ul className="space-y-2 text-xs text-dim leading-relaxed">
            <li>• Das Ergebnis liegt zwischen 1,00x und 1.000.000x.</li>
            <li>• Ist das Ergebnis ≥ deinem Ziel, gewinnst du Einsatz × Ziel.</li>
            <li>• Gewinnchance = 99 ÷ Ziel (1 % Hausvorteil).</li>
          </ul>
        </Panel>
      </div>
      <div className="order-1 lg:order-2 flex flex-col gap-4 min-w-0">
        <Panel className="p-6 sm:p-10 relative overflow-hidden flex flex-col items-center justify-center min-h-[420px]">
          <div className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(192,132,252,0.18) 0%, rgba(192,132,252,0) 60%)" }} />
          <Pill tone="dim" className="mb-6">Ziel {t.toFixed(2)}x</Pill>
          <AnimatePresence mode="wait">
            <motion.p
              key={result ? `${result.r}-${result.won}` : rolling ? "rolling" : "idle"}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`font-mono font-extrabold text-6xl sm:text-8xl tabular tracking-[-0.04em] leading-none ${result ? (result.won ? "text-win" : "text-danger") : rolling ? "text-txt" : "text-dim-2"}`}
              data-testid="limbo-result-display"
            >
              {display == null ? "1.00x" : `${display.toFixed(2)}x`}
            </motion.p>
          </AnimatePresence>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-dim">{result ? (result.won ? `Gewonnen · +${result.payout.toLocaleString("de-DE")} €` : `Verloren · −${result.amount.toLocaleString("de-DE")} €`) : rolling ? "Ergebnis wird ermittelt …" : "Setze ein Ziel und spiele"}</p>
          {/* target bar */}
          <div className="mt-8 w-full max-w-lg">
            <div className="relative h-3 rounded-full bg-surface-2 border border-line overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-win/40" style={{ width: `${chance}%` }} />
              <div className="absolute inset-y-0 left-0 bg-danger/30" style={{ left: `${chance}%`, right: 0 }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] font-mono text-dim-2">
              <span>Gewinn {chance.toFixed(1)} %</span>
              <span>Verlust {(100 - chance).toFixed(1)} %</span>
            </div>
          </div>
        </Panel>
        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Letzte Ergebnisse</p>
          <div className="flex gap-2 flex-wrap min-h-[32px]" data-testid="limbo-history">
            {history.length === 0 && <span className="text-xs text-dim-2">Noch keine Runde.</span>}
            {history.map((h) => (
              <Pill key={h.id} tone={h.won ? "win" : "loss"}>
                {h.r.toFixed(2)}x
              </Pill>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};
