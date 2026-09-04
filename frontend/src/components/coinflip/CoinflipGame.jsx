import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Crown, Gem, Coins, HandCoins, Repeat } from "lucide-react";
import { playCoinFlip, playWinChime, playLoseTone } from "@/lib/sounds";
import { recordRound } from "@/lib/rounds";
import { fmt } from "@/lib/format";
import { Panel, Label, PrimaryButton, Pill } from "@/components/common/Bits";
import { BetInput } from "@/components/game/BetInput";

const PAYOUT = 1.96;
const FLIP_MS = 1300;

const Face = ({ side }) =>
  side === "heads" ? (
    <div className="coin-face flex items-center justify-center" style={{ background: "radial-gradient(circle at 35% 30%, #F7E3A6 0%, #E7C77A 45%, #B8934A 100%)", boxShadow: "inset 0 0 0 6px rgba(120,90,30,0.35), inset 0 0 40px rgba(255,255,255,0.25)" }}>
      <div className="absolute inset-[14%] rounded-full border-2 border-[#8d6a2a]/40" />
      <Crown className="w-[38%] h-[38%] text-[#6b4d14]" strokeWidth={2.2} />
    </div>
  ) : (
    <div className="coin-face coin-face-back flex items-center justify-center" style={{ background: "radial-gradient(circle at 35% 30%, #C8FFF5 0%, #7FE7D6 45%, #3E9C8E 100%)", boxShadow: "inset 0 0 0 6px rgba(20,80,70,0.35), inset 0 0 40px rgba(255,255,255,0.25)" }}>
      <div className="absolute inset-[14%] rounded-full border-2 border-[#1e6b5f]/40" />
      <Gem className="w-[38%] h-[38%] text-[#0f4c43]" strokeWidth={2.2} />
    </div>
  );

export const CoinflipGame = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(100);
  const [pick, setPick] = useState("heads");
  const [phase, setPhase] = useState("idle"); // idle | flipping | won | lost
  const [rotation, setRotation] = useState(0);
  const [pot, setPot] = useState(0);
  const [stake, setStake] = useState(0);
  const [streak, setStreak] = useState(0);
  const [face, setFace] = useState("heads");
  const [history, setHistory] = useState([]);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;
  const stakeRef = useRef(0);
  const streakRef = useRef(0);
  stakeRef.current = stake;
  streakRef.current = streak;

  const flipping = phase === "flipping";
  const inSeries = phase === "won";

  const doFlip = (amountAtRisk, isContinue) => {
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const win = result === pick;
    const currentFace = (rotation / 180) % 2 === 0 ? "heads" : "tails";
    const needHalf = currentFace !== result ? 180 : 0;
    setRotation((r) => r + 1800 + needHalf);
    setPhase("flipping");
    playCoinFlip();
    setTimeout(() => {
      setFace(result);
      if (win) {
        const newPot = Math.floor(amountAtRisk * PAYOUT);
        setPot(newPot);
        setStreak((s) => s + 1);
        setPhase("won");
        playWinChime();
        setHistory((h) => [{ id: Date.now(), result, won: true }, ...h].slice(0, 14));
      } else {
        setPhase("lost");
        setPot(0);
        playLoseTone();
        setHistory((h) => [{ id: Date.now(), result, won: false }, ...h].slice(0, 14));
        recordRound({ game: "Coinflip", bet: stakeRef.current, mult: 0, payout: 0, meta: { streak: isContinue ? streakRef.current : 0 } });
        toast.error(`${result === "heads" ? "Kopf" : "Zahl"} — verloren (${fmt(stakeRef.current)}).`);
      }
    }, FLIP_MS);
  };

  const startFlip = () => {
    if (flipping) return;
    const amount = Math.floor(Math.min(Math.max(1, bet), balanceRef.current));
    if (amount < 1) {
      toast.error("Nicht genügend Guthaben.");
      return;
    }
    setBalance((b) => b - amount);
    setStake(amount);
    stakeRef.current = amount;
    setStreak(0);
    streakRef.current = 0;
    setPot(0);
    doFlip(amount, false);
  };

  const continueFlip = () => {
    if (!inSeries || flipping) return;
    doFlip(pot, true);
  };

  const takeWin = () => {
    if (!inSeries) return;
    const mult = Math.round((pot / stake) * 100) / 100;
    setBalance((b) => b + pot);
    recordRound({ game: "Coinflip", bet: stake, mult, payout: pot, meta: { streak } });
    toast.success(`Pot mitgenommen: +${pot.toLocaleString("de-DE")} € (${mult.toFixed(2)}x)`);
    setPhase("idle");
    setPot(0);
    setStreak(0);
  };

  const nextPot = Math.floor((inSeries ? pot : bet) * PAYOUT);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" data-testid="coinflip-game">
      <div className="lg:col-span-8 flex flex-col gap-5">
        <Panel className="p-5 sm:p-8 relative overflow-hidden">
          <div className="absolute -left-20 -bottom-24 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(231,199,122,0.14) 0%, rgba(231,199,122,0) 60%)" }} />
          <div className="relative flex flex-col items-center">
            <div className="relative z-10 flex items-center gap-2 mb-6">
              <Pill tone="gold">{PAYOUT.toFixed(2)}x pro Flip</Pill>
              {streak > 0 && (
                <Pill tone="win" data-testid="coinflip-streak">
                  Serie {streak}
                </Pill>
              )}
            </div>

            <div className="coin-scene w-44 h-44 sm:w-56 sm:h-56 relative" data-testid="coinflip-coin" data-face={face} data-phase={phase}>
              <div className="absolute inset-[-14%] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(231,199,122,0.25) 0%, rgba(231,199,122,0) 70%)" }} />
              <motion.div
                className="coin-3d relative w-full h-full"
                animate={{ rotateY: rotation, y: flipping ? [0, -44, 0] : 0 }}
                transition={{ rotateY: { duration: FLIP_MS / 1000, ease: [0.16, 1, 0.3, 1] }, y: { duration: FLIP_MS / 1000, ease: "easeInOut" } }}
              >
                <Face side="heads" />
                <Face side="tails" />
              </motion.div>
            </div>

            <div className="mt-7 h-16 text-center">
              <AnimatePresence mode="wait">
                <motion.div key={`${phase}-${pot}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  {phase === "idle" && <p className="text-sm text-dim">Wähle Kopf oder Zahl und wirf die Münze.</p>}
                  {phase === "flipping" && <p className="font-display font-bold text-lg text-txt-2">Die Münze fliegt …</p>}
                  {phase === "won" && (
                    <div>
                      <p className="font-mono font-bold text-3xl text-win tabular leading-none" data-testid="coinflip-pot">
                        {fmt(pot)}
                      </p>
                      <p className="text-xs text-dim mt-2">
                        {face === "heads" ? "Kopf" : "Zahl"} · Pot im Spiel · weiter auf {fmt(Math.floor(pot * PAYOUT))} oder mitnehmen
                      </p>
                    </div>
                  )}
                  {phase === "lost" && (
                    <div>
                      <p className="font-display font-bold text-xl text-danger leading-none">{face === "heads" ? "Kopf" : "Zahl"} — verloren</p>
                      <p className="text-xs text-dim mt-2">Einsatz {fmt(stake)} weg. Neue Runde?</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Letzte Flips</p>
          <div className="flex gap-2 flex-wrap min-h-[32px]" data-testid="coinflip-history">
            {history.length === 0 && <span className="text-xs text-dim-2">Noch keine Flips.</span>}
            {history.map((h) => (
              <span key={h.id} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${h.won ? "border-win/60" : "border-danger/60"} ${h.result === "heads" ? "bg-brand text-brand-fg" : "bg-aqua text-aqua-fg"}`} title={h.result === "heads" ? "Kopf" : "Zahl"}>
                {h.result === "heads" ? <Crown className="w-3.5 h-3.5" /> : <Gem className="w-3.5 h-3.5" />}
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-5">
        <Panel className="p-5">
          <BetInput value={bet} onChange={setBet} disabled={flipping || inSeries} balance={balance} testId="coinflip" />

          <Label className="mt-5">Deine Wahl</Label>
          <div className="grid grid-cols-2 gap-2" data-testid="coinflip-pick-toggle">
            <button onClick={() => setPick("heads")} disabled={flipping} className={`rounded-xl border px-4 py-3.5 text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors duration-200 ${pick === "heads" ? "bg-brand/15 border-brand/60 text-brand" : "bg-surface-2 border-line text-dim hover:text-txt"}`} data-testid="coinflip-pick-heads">
              <Crown className="w-4 h-4" /> Kopf
            </button>
            <button onClick={() => setPick("tails")} disabled={flipping} className={`rounded-xl border px-4 py-3.5 text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors duration-200 ${pick === "tails" ? "bg-aqua/15 border-aqua/60 text-aqua" : "bg-surface-2 border-line text-dim hover:text-txt"}`} data-testid="coinflip-pick-tails">
              <Gem className="w-4 h-4" /> Zahl
            </button>
          </div>

          <div className="mt-5 rounded-xl bg-surface-2 border border-line px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-dim">{inSeries ? "Pot nach nächstem Gewinn" : "Gewinn bei Treffer"}</span>
            <span className="font-mono font-semibold text-win tabular" data-testid="coinflip-potential">
              {fmt(nextPot)}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {inSeries ? (
              <>
                <PrimaryButton tone="win" onClick={takeWin} disabled={flipping} className="w-full py-4 text-base animate-win-pulse" data-testid="coinflip-take-button">
                  <HandCoins className="w-4 h-4" /> Mitnehmen · {fmt(pot)}
                </PrimaryButton>
                <PrimaryButton tone="gold" onClick={continueFlip} disabled={flipping} className="w-full py-3.5" data-testid="coinflip-double-button">
                  <Repeat className="w-4 h-4" /> Weiter flippen · {fmt(nextPot)}
                </PrimaryButton>
              </>
            ) : (
              <PrimaryButton tone="gold" onClick={startFlip} disabled={flipping || bet < 1} className="w-full py-4 text-base" data-testid="coinflip-flip-button">
                <Coins className={`w-4 h-4 ${flipping ? "animate-spin" : ""}`} />
                {flipping ? "Fliegt …" : `Flip · ${fmt(bet)}`}
              </PrimaryButton>
            )}
          </div>
        </Panel>

        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Regeln</p>
          <ul className="space-y-2 text-xs text-dim leading-relaxed">
            <li>• 50/50 — Treffer zahlt {PAYOUT.toFixed(2)}x (2 % Hausvorteil).</li>
            <li>• Nach einem Treffer bleibt der Pot im Spiel: <span className="text-txt font-semibold">Weiter flippen</span> multipliziert erneut, <span className="text-txt font-semibold">Mitnehmen</span> schreibt den Pot gut.</li>
            <li>• Du kannst die Seite vor jedem Flip neu wählen.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
};
