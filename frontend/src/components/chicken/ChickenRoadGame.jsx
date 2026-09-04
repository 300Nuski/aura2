import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { HandCoins, ChevronRight, Egg } from "lucide-react";
import { playReveal, playExplosion, playWinChime } from "@/lib/sounds";
import { recordRound } from "@/lib/rounds";
import { fmt } from "@/lib/format";
import { Panel, Label, PrimaryButton, SmallButton, Pill } from "@/components/common/Bits";
import { BetInput } from "@/components/game/BetInput";

export const DIFFS = [
  { id: "easy", label: "Leicht", lanes: 20, p: 0.04 },
  { id: "medium", label: "Mittel", lanes: 16, p: 0.08 },
  { id: "hard", label: "Schwer", lanes: 12, p: 0.14 },
  { id: "hardcore", label: "Hardcore", lanes: 8, p: 0.25 },
];
export const laneMult = (d, k) => (k <= 0 ? 1 : Math.floor(0.98 * Math.pow(1 / (1 - d.p), k) * 100) / 100);

const CARS = ["\u{1F697}", "\u{1F699}", "\u{1F695}", "\u{1F69A}", "\u{1F68C}", "\u{1F3CE}\uFE0F"];
const LANE_W = 88;

export const ChickenRoadGame = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(100);
  const [diffId, setDiffId] = useState("medium");
  const [phase, setPhase] = useState("idle"); // idle | playing | moving | hit | cashed
  const [pos, setPos] = useState(0); // lanes crossed
  const [stake, setStake] = useState(0);
  const [lastWin, setLastWin] = useState(null);
  const [history, setHistory] = useState([]);
  const [hitLane, setHitLane] = useState(null);
  const roadRef = useRef(null);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;
  const d = useMemo(() => DIFFS.find((x) => x.id === diffId), [diffId]);
  const playing = phase === "playing";
  const mult = laneMult(d, pos);
  const next = laneMult(d, pos + 1);
  const payout = Math.floor(stake * mult);

  // decorative traffic per lane (stable per difficulty)
  const traffic = useMemo(
    () =>
      Array.from({ length: d.lanes }, (_, i) => ({
        car: CARS[i % CARS.length],
        dur: 3.2 + ((i * 7919) % 23) / 10,
        delay: -((i * 104729) % 37) / 10,
        dir: i % 2 === 0 ? 1 : -1,
      })),
    [d.lanes]
  );

  useEffect(() => {
    const el = roadRef.current;
    if (!el) return;
    const target = Math.max(0, (pos + 0.5) * LANE_W - el.clientWidth / 2 + LANE_W);
    el.scrollTo({ left: target, behavior: "smooth" });
  }, [pos]);

  const start = () => {
    const amount = Math.floor(Math.min(Math.max(1, bet), balanceRef.current));
    if (amount < 1) {
      toast.error("Nicht genügend Guthaben.");
      return;
    }
    setBalance((b) => b - amount);
    setStake(amount);
    setPos(0);
    setHitLane(null);
    setLastWin(null);
    setPhase("playing");
    if (roadRef.current) roadRef.current.scrollTo({ left: 0 });
  };

  const finish = (k, amount) => {
    const m = laneMult(d, k);
    const win = Math.floor(amount * m);
    setBalance((b) => b + win);
    setLastWin({ mult: m, win });
    setPhase("cashed");
    playWinChime();
    recordRound({ game: "Chicken Road", bet: amount, mult: m, payout: win, meta: { difficulty: diffId, lanes: k } });
    setHistory((h) => [{ id: Date.now(), won: true, mult: m }, ...h].slice(0, 12));
    toast.success(`Chicken Road: ${k} Spuren · ${m.toFixed(2)}x · +${win.toLocaleString("de-DE")} €`);
  };

  const step = () => {
    if (!playing) return;
    const lane = pos + 1;
    const hit = Math.random() < d.p;
    setPhase("moving");
    setTimeout(() => {
      if (hit) {
        setPos(lane);
        setHitLane(lane);
        setPhase("hit");
        playExplosion();
        recordRound({ game: "Chicken Road", bet: stake, mult: 0, payout: 0, meta: { difficulty: diffId, lanes: pos } });
        setHistory((h) => [{ id: Date.now(), won: false, mult: 0 }, ...h].slice(0, 12));
        toast.error(`Erwischt auf Spur ${lane} — ${fmt(stake)} verloren.`);
        return;
      }
      setPos(lane);
      playReveal();
      if (lane >= d.lanes) finish(lane, stake);
      else setPhase("playing");
    }, 380);
  };

  const cashout = () => {
    if (!playing || pos < 1) return;
    finish(pos, stake);
  };

  const ended = phase === "hit" || phase === "cashed";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4" data-testid="chicken-game">
      <div className="order-2 lg:order-1 flex flex-col gap-4">
        <Panel className="p-5">
          <BetInput value={bet} onChange={setBet} disabled={playing || phase === "moving"} balance={balance} testId="chicken" />
          <Label className="mt-5">Schwierigkeit</Label>
          <div className="grid grid-cols-2 gap-2" data-testid="chicken-difficulty-select">
            {DIFFS.map((x) => (
              <SmallButton key={x.id} active={diffId === x.id} onClick={() => setDiffId(x.id)} disabled={playing || phase === "moving"} className="text-left px-3" data-testid={`chicken-diff-${x.id}`}>
                <span className="block">{x.label}</span>
                <span className="block text-[9px] text-dim-2 font-normal">
                  {x.lanes} Spuren · max {laneMult(x, x.lanes).toFixed(1)}x
                </span>
              </SmallButton>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1">Nächste Spur</p>
              <p className="font-mono font-semibold text-base tabular text-gold" data-testid="chicken-next-multiplier">
                {pos < d.lanes ? `${next.toFixed(2)}x` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1">Auszahlung jetzt</p>
              <p className="font-mono font-semibold text-base tabular text-win" data-testid="chicken-payout">
                {playing || phase === "moving" ? fmt(payout) : "—"}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {!playing && phase !== "moving" ? (
              <PrimaryButton onClick={start} disabled={bet < 1} className="w-full py-4 text-base" data-testid="chicken-start-button">
                <Egg className="w-4 h-4" /> {phase === "idle" ? `Los geht's · ${fmt(bet)}` : `Neue Runde · ${fmt(bet)}`}
              </PrimaryButton>
            ) : (
              <>
                <PrimaryButton onClick={step} disabled={phase === "moving"} className="w-full py-4 text-base" data-testid="chicken-step-button">
                  <ChevronRight className="w-4 h-4" /> Weiter · {next.toFixed(2)}x
                </PrimaryButton>
                <PrimaryButton tone={pos > 0 ? "win" : "secondary"} onClick={cashout} disabled={pos < 1 || phase === "moving"} className={`w-full py-3.5 ${pos > 0 ? "animate-win-pulse" : ""}`} data-testid="chicken-cashout-button">
                  <HandCoins className="w-4 h-4" /> {pos > 0 ? `Cashout · ${fmt(payout)}` : "Erst eine Spur überqueren"}
                </PrimaryButton>
              </>
            )}
          </div>
        </Panel>
        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Letzte Runden</p>
          <div className="flex gap-2 flex-wrap min-h-[32px]" data-testid="chicken-history">
            {history.length === 0 && <span className="text-xs text-dim-2">Noch keine Runde.</span>}
            {history.map((h) => (
              <Pill key={h.id} tone={h.won ? "win" : "loss"}>
                {h.won ? `${h.mult.toFixed(2)}x` : "Erwischt"}
              </Pill>
            ))}
          </div>
        </Panel>
      </div>

      <div className="order-1 lg:order-2 min-w-0 flex flex-col gap-4">
        <Panel className="p-4 sm:p-5 relative overflow-hidden">
          <div className="relative flex items-center justify-between mb-3">
            <Pill tone="amber">
              {d.label} · {d.lanes} Spuren · {Math.round(d.p * 100)} % Risiko / Spur
            </Pill>
            <div className="text-right">
              <p className={`font-mono font-bold text-2xl tabular leading-none ${phase === "hit" ? "text-danger" : phase === "cashed" ? "text-win" : "text-gold"}`} data-testid="chicken-current-multiplier">
                {phase === "cashed" && lastWin ? `${lastWin.mult.toFixed(2)}x` : `${mult.toFixed(2)}x`}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mt-1">
                Spur {Math.min(pos, d.lanes)} / {d.lanes}
              </p>
            </div>
          </div>

          {/* road */}
          <div ref={roadRef} className="relative overflow-x-auto thin-scroll rounded-2xl border border-line-2" style={{ background: "linear-gradient(180deg,#2b3148 0%,#1d2236 100%)" }} data-testid="chicken-road">
            <div className="relative flex h-[380px] sm:h-[440px]" style={{ width: (d.lanes + 2) * LANE_W }}>
              {/* sidewalks */}
              <div className="shrink-0 h-full flex flex-col items-center justify-end pb-8" style={{ width: LANE_W, background: "repeating-linear-gradient(90deg,#3a4160 0 10px,#2f3552 10px 20px)" }}>
                <span className="text-[10px] font-mono uppercase tracking-widest text-dim">Start</span>
              </div>
              {Array.from({ length: d.lanes }, (_, i) => {
                const lane = i + 1;
                const crossed = pos >= lane && !(phase === "hit" && hitLane === lane);
                const isNext = playing && pos + 1 === lane;
                const t = traffic[i];
                return (
                  <div key={lane} className={`relative shrink-0 h-full border-l border-dashed border-white/15 ${isNext ? "bg-gold/[0.07]" : ""}`} style={{ width: LANE_W }} data-testid={`chicken-lane-${lane}`}>
                    {/* multiplier tag */}
                    <span className={`absolute top-3 left-1/2 -translate-x-1/2 rounded-md px-2 py-1 font-mono text-[11px] font-bold ${crossed ? "bg-win/20 text-win border border-win/40" : isNext ? "bg-gold text-gold-fg" : "bg-black/30 text-txt-2 border border-white/10"}`}>
                      {laneMult(d, lane).toFixed(2)}x
                    </span>
                    {/* moving decorative car (not in the chicken lane when hit) */}
                    {!(phase === "hit" && hitLane === lane) && !crossed && (
                      <span
                        className="absolute left-1/2 -translate-x-1/2 text-3xl select-none pointer-events-none"
                        style={{ animation: `chicken-car ${t.dur}s linear ${t.delay}s infinite`, transform: t.dir === 1 ? "translateX(-50%) scaleY(1)" : "translateX(-50%) scaleY(-1)", top: 0 }}
                        aria-hidden="true"
                      >
                        {t.car}
                      </span>
                    )}
                    {/* manhole */}
                    <span className={`absolute bottom-[38%] left-1/2 -translate-x-1/2 w-11 h-11 rounded-full border-2 ${crossed ? "border-win/60 bg-win/15" : "border-white/15 bg-black/25"}`} />
                    {/* hit car */}
                    {phase === "hit" && hitLane === lane && (
                      <motion.span initial={{ y: -260 }} animate={{ y: 0 }} transition={{ duration: 0.35, ease: "easeIn" }} className="absolute left-1/2 -translate-x-1/2 bottom-[34%] text-5xl select-none" data-testid="chicken-hit-car">
                        {"\u{1F69B}"}
                      </motion.span>
                    )}
                  </div>
                );
              })}
              <div className="shrink-0 h-full flex flex-col items-center justify-end pb-8 border-l border-dashed border-white/15" style={{ width: LANE_W, background: "repeating-linear-gradient(90deg,#3a4160 0 10px,#2f3552 10px 20px)" }}>
                <span className="text-[10px] font-mono uppercase tracking-widest text-win">Ziel</span>
              </div>

              {/* chicken */}
              <motion.div
                className="absolute bottom-[36%] text-5xl select-none z-10"
                animate={{ left: pos * LANE_W + LANE_W / 2 - 24, y: phase === "moving" ? [0, -18, 0] : 0, rotate: phase === "hit" ? 90 : 0, scale: phase === "hit" ? 0.8 : 1 }}
                transition={{ left: { type: "spring", stiffness: 260, damping: 24 }, y: { duration: 0.38 }, rotate: { duration: 0.3 } }}
                data-testid="chicken-sprite"
                data-pos={pos}
              >
                {phase === "hit" ? "\u{1F414}\u{1F4A5}" : "\u{1F414}"}
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {phase === "hit" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-4 rounded-xl bg-danger/10 border border-danger/40 px-4 py-3 text-center" data-testid="chicken-hit-banner">
                <p className="font-display font-bold text-danger">Erwischt auf Spur {hitLane}</p>
                <p className="text-xs text-dim mt-0.5">Einsatz {fmt(stake)} verloren</p>
              </motion.div>
            )}
            {phase === "cashed" && lastWin && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative mt-4 rounded-xl bg-win/10 border border-win/40 px-4 py-3 text-center" data-testid="chicken-cashed-banner">
                <p className="font-display font-bold text-win">Sicher angekommen · {lastWin.mult.toFixed(2)}x</p>
                <p className="text-xs text-dim mt-0.5">+{lastWin.win.toLocaleString("de-DE")} € gutgeschrieben</p>
              </motion.div>
            )}
          </AnimatePresence>
          {ended && null}
        </Panel>
      </div>
    </div>
  );
};
