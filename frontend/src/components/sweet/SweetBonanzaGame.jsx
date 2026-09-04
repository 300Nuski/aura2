import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, RotateCw, Gift, Zap, BookOpen, Square, Play, Info } from "lucide-react";
import CandySymbol, { SYMBOLS } from "@/components/CandySymbols";
import { playWinChime, playCashoutChime, playTick, playReveal } from "@/lib/sounds";
import { recordRound } from "@/lib/rounds";
import { fmt } from "@/lib/format";
import { Panel, Label, PrimaryButton, SmallButton, Pill, NumberInput } from "@/components/common/Bits";
import { BetInput } from "@/components/game/BetInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  COLS,
  ROWS,
  PAYTABLE,
  SCATTER,
  BOMB,
  SCATTER_PAYS,
  FREE_SPINS_AWARD,
  FREE_SPINS_RETRIGGER,
  BUY_COST,
  ANTE_COST,
  fillGrid,
  resolveSpin,
  winTier,
} from "@/lib/sweetEngine";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const AUTO_OPTIONS = [10, 25, 50, 100, 0];

const Cell = ({ cell, winning, fresh, dim }) => (
  <motion.div
    layout
    initial={fresh ? { y: -110, opacity: 0, scale: 0.7 } : false}
    animate={{ y: 0, opacity: dim ? 0.35 : 1, scale: 1 }}
    exit={{ scale: 0, opacity: 0, rotate: 25, transition: { duration: 0.22 } }}
    transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.8 }}
    style={{ gridColumn: cell.col + 1, gridRow: cell.row + 1 }}
    className={`relative aspect-square rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center ${winning ? "winning-cell" : ""}`}
    data-testid={`sb-cell-${cell.col}-${cell.row}`}
    data-type={cell.type}
  >
    <div className="w-[78%] h-[78%]">
      <CandySymbol type={cell.type} />
    </div>
    {cell.type === BOMB && (
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gold text-gold-fg font-mono font-extrabold text-[11px] px-2 py-0.5 shadow-glow-gold" data-testid="sb-bomb-badge">
        {cell.mult}x
      </span>
    )}
  </motion.div>
);

export const SweetBonanzaGame = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(25);
  const [ante, setAnte] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [cells, setCells] = useState(() => fillGrid("base"));
  const [winKeys, setWinKeys] = useState(new Set());
  const [freshKeys, setFreshKeys] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [spinWin, setSpinWin] = useState(0); // in €, current spin accumulated
  const [groups, setGroups] = useState([]);
  const [fs, setFs] = useState({ active: false, left: 0, total: 0, played: 0 });
  const [overlay, setOverlay] = useState(null); // {type:'tier'|'fsIntro'|'fsEnd'|'bomb', ...}
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ spins: 0, wagered: 0, won: 0, best: 0 });
  const [auto, setAuto] = useState({ running: false, left: 0, stopOnWin: false, stopLoss: "", stopWin: "" });
  const [paytableOpen, setPaytableOpen] = useState(false);
  const [shake, setShake] = useState(false);
  const [countWin, setCountWin] = useState(0);

  const balanceRef = useRef(balance);
  balanceRef.current = balance;
  const turboRef = useRef(turbo);
  turboRef.current = turbo;
  const autoRef = useRef(auto);
  autoRef.current = auto;
  const alive = useRef(true);
  const startBalanceRef = useRef(balance);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const wait = useCallback(async (ms) => {
    await sleep(turboRef.current ? ms * 0.45 : ms);
    if (!alive.current) throw new Error("unmounted");
  }, []);

  const cost = useMemo(() => Math.floor(bet * (ante ? ANTE_COST : 1)), [bet, ante]);
  const buyCost = bet * BUY_COST;

  const showTier = async (winX, amount) => {
    const tier = winTier(winX);
    if (!tier) return;
    setOverlay({ type: "tier", tier, amount });
    setCountWin(0);
    playWinChime();
    await new Promise((res) => {
      const c = animate(0, amount, { duration: turboRef.current ? 0.9 : 1.8, ease: "easeOut", onUpdate: (v) => setCountWin(Math.floor(v)), onComplete: res });
      return c;
    });
    await wait(700);
    setOverlay(null);
  };

  /** Plays one spin (base or fs) with animation. Returns win in €. */
  const playSpin = async (mode, betAmt) => {
    const res = resolveSpin(mode, Math.random, ante && mode === "base");
    // drop initial grid
    setWinKeys(new Set());
    setGroups([]);
    setSpinWin(0);
    setFreshKeys(new Set(res.steps[0].cells.map((c) => c.key)));
    setCells(res.steps[0].cells);
    playTick(600, 0.02);
    await wait(560);
    let acc = 0;
    for (let i = 0; i < res.steps.length; i++) {
      const step = res.steps[i];
      if (step.win <= 0) break;
      acc += step.win * betAmt;
      setWinKeys(step.winKeys);
      setGroups(step.groups.map((g) => ({ ...g, amount: Math.floor(g.pay * betAmt) })));
      setSpinWin(Math.floor(acc));
      playReveal();
      await wait(760);
      const next = res.steps[i + 1];
      if (next) {
        setWinKeys(new Set());
        setFreshKeys(step.fresh || new Set());
        setCells(next.cells);
        playTick(900, 0.02);
        await wait(520);
      }
    }
    let total = Math.floor(res.tumbleWin * betAmt);
    if (mode === "fs" && res.bombMult > 0 && total > 0) {
      setOverlay({ type: "bomb", mult: res.bombMult, base: total, result: total * res.bombMult });
      playCashoutChime();
      await wait(1500);
      setOverlay(null);
      total *= res.bombMult;
      setSpinWin(total);
    }
    if (res.scatterPay > 0) {
      const sp = Math.floor(res.scatterPay * betAmt);
      total += sp;
      setSpinWin(total);
      toast.success(`${res.scatters} Freispiel-Gläser · Scatter-Gewinn ${fmt(sp)}`);
    }
    if (total > 0) {
      setBalance((b) => b + total);
      const x = total / betAmt;
      if (winTier(x)) {
        setShake(true);
        setTimeout(() => setShake(false), 400);
        await showTier(x, total);
      }
    }
    return { win: total, scatters: res.scatters };
  };

  const runFreeSpins = async (betAmt, spins) => {
    let left = spins;
    let total = 0;
    let played = 0;
    setOverlay({ type: "fsIntro", spins });
    playWinChime();
    await wait(1700);
    setOverlay(null);
    setFs({ active: true, left, total: 0, played: 0 });
    while (left > 0 && played < 300) {
      left--;
      played++;
      setFs({ active: true, left, total, played });
      const r = await playSpin("fs", betAmt);
      total += r.win;
      if (r.scatters >= 3) {
        left += FREE_SPINS_RETRIGGER;
        toast.success(`+${FREE_SPINS_RETRIGGER} Freispiele!`);
      }
      setFs({ active: true, left, total, played });
      await wait(450);
    }
    setOverlay({ type: "fsEnd", total, played });
    await wait(2200);
    setOverlay(null);
    setFs({ active: false, left: 0, total: 0, played: 0 });
    return total;
  };

  const round = async ({ buy = false } = {}) => {
    if (busy) return false;
    const betAmt = Math.max(1, Math.floor(bet));
    const price = buy ? betAmt * BUY_COST : Math.floor(betAmt * (ante ? ANTE_COST : 1));
    if (price > balanceRef.current) {
      toast.error("Nicht genügend Guthaben.");
      return false;
    }
    setBusy(true);
    setBalance((b) => b - price);
    let payout = 0;
    try {
      let scatters = 4;
      if (!buy) {
        const r = await playSpin("base", betAmt);
        payout += r.win;
        scatters = r.scatters;
      }
      if (scatters >= 4) payout += await runFreeSpins(betAmt, FREE_SPINS_AWARD);
      const mult = Math.round((payout / price) * 100) / 100;
      recordRound({ game: "Sweet Bonanza", bet: price, mult, payout, meta: { ante, buy } });
      setHistory((h) => [{ id: Date.now(), mult, payout, fs: scatters >= 4 }, ...h].slice(0, 14));
      setStats((s) => ({ spins: s.spins + 1, wagered: s.wagered + price, won: s.won + payout, best: Math.max(s.best, payout) }));
    } catch {
      return false;
    } finally {
      if (alive.current) setBusy(false);
    }
    return { payout, price };
  };

  // ---- autoplay loop
  const autoLoop = useRef(false);
  const startAuto = (count) => {
    startBalanceRef.current = balanceRef.current;
    setAuto((a) => ({ ...a, running: true, left: count === 0 ? -1 : count }));
    autoLoop.current = true;
  };
  const stopAuto = () => {
    autoLoop.current = false;
    setAuto((a) => ({ ...a, running: false, left: 0 }));
  };
  useEffect(() => {
    if (!auto.running || busy) return undefined;
    let cancelled = false;
    (async () => {
      await sleep(400);
      if (cancelled || !autoLoop.current) return;
      const r = await round();
      if (!r || !alive.current) {
        stopAuto();
        return;
      }
      const a = autoRef.current;
      let stop = false;
      const left = a.left > 0 ? a.left - 1 : a.left;
      if (left === 0) stop = true;
      if (a.stopOnWin && r.payout > 0) stop = true;
      if (a.stopLoss !== "" && startBalanceRef.current - balanceRef.current >= Number(a.stopLoss)) stop = true;
      if (a.stopWin !== "" && r.payout >= Number(a.stopWin)) stop = true;
      if (stop) {
        stopAuto();
        toast.info("Autoplay beendet.");
      } else setAuto((x) => ({ ...x, left }));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto.running, auto.left, busy]);

  const sessionRtp = stats.wagered > 0 ? (stats.won / stats.wagered) * 100 : null;
  const grid = useMemo(() => [...cells].sort((a, b) => a.row - b.row || a.col - b.col), [cells]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4" data-testid="sweet-bonanza-game">
      {/* ---------- controls ---------- */}
      <div className="order-2 lg:order-1 flex flex-col gap-4">
        <Panel className="p-5">
          <BetInput value={bet} onChange={setBet} disabled={busy || auto.running} balance={balance} testId="sb" presets={[10, 25, 50, 100]} />

          <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-2 border border-line px-4 py-3">
            <div>
              <p className="text-sm font-bold">Ante Bet</p>
              <p className="text-[11px] text-dim">+25 % Einsatz · mehr Freispiel-Gläser</p>
            </div>
            <Switch checked={ante} onCheckedChange={setAnte} disabled={busy || auto.running} data-testid="sb-ante-switch" />
          </div>
          <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-2 border border-line px-4 py-3">
            <div>
              <p className="text-sm font-bold inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-gold" /> Turbo
              </p>
              <p className="text-[11px] text-dim">Schnellere Animationen</p>
            </div>
            <Switch checked={turbo} onCheckedChange={setTurbo} data-testid="sb-turbo-switch" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1">Kosten / Spin</p>
              <p className="font-mono font-semibold text-base tabular" data-testid="sb-cost">
                {fmt(cost)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-line px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2 mb-1">Max. Gewinn</p>
              <p className="font-mono font-semibold text-base tabular text-gold">{fmt(bet * 21100)}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {auto.running ? (
              <PrimaryButton tone="danger" onClick={stopAuto} className="w-full py-4 text-base" data-testid="sb-auto-stop-button">
                <Square className="w-4 h-4" /> Autoplay stoppen {auto.left > 0 ? `(${auto.left})` : ""}
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => round()} disabled={busy || bet < 1} className="w-full py-4 text-base" data-testid="sb-spin-button">
                <RotateCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /> {busy ? (fs.active ? `Freispiel ${fs.played}` : "Dreht …") : `Spin · ${fmt(cost)}`}
              </PrimaryButton>
            )}
            <PrimaryButton tone="secondary" onClick={() => round({ buy: true })} disabled={busy || auto.running || ante || buyCost > balance} className="w-full py-3 border-gold/40 text-gold" data-testid="sb-buy-button">
              <Gift className="w-4 h-4" /> Freispiele kaufen · {fmt(buyCost)}
            </PrimaryButton>
            {ante && <p className="text-[10px] text-dim-2 text-center">Freispiel-Kauf ist mit Ante Bet deaktiviert.</p>}
          </div>
        </Panel>

        <Panel className="p-5" data-testid="sb-autoplay-panel">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim">Autoplay</p>
            <Play className="w-3.5 h-3.5 text-dim-2" />
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {AUTO_OPTIONS.map((n) => (
              <SmallButton key={n} onClick={() => startAuto(n)} disabled={busy || auto.running || bet < 1} className="px-0" data-testid={`sb-auto-${n}`}>
                {n === 0 ? "∞" : n}
              </SmallButton>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-txt-2">Stopp bei Gewinn</span>
            <Switch checked={auto.stopOnWin} onCheckedChange={(v) => setAuto((a) => ({ ...a, stopOnWin: v }))} disabled={auto.running} data-testid="sb-auto-stoponwin" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <Label className="text-danger-2">Verlustlimit (€)</Label>
              <NumberInput min={0} placeholder="—" value={auto.stopLoss} onChange={(e) => setAuto((a) => ({ ...a, stopLoss: e.target.value }))} disabled={auto.running} data-testid="sb-auto-stoploss" />
            </div>
            <div>
              <Label className="text-win">Einzelgewinn ≥ (€)</Label>
              <NumberInput min={0} placeholder="—" value={auto.stopWin} onChange={(e) => setAuto((a) => ({ ...a, stopWin: e.target.value }))} disabled={auto.running} data-testid="sb-auto-stopwin" />
            </div>
          </div>
        </Panel>

        <Panel className="p-5" data-testid="sb-stats">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim">Session</p>
            <button onClick={() => setPaytableOpen(true)} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-2 hover:text-brand" data-testid="sb-paytable-button">
              <BookOpen className="w-3.5 h-3.5" /> Gewinntabelle
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-surface-2 border border-line-2 px-3 py-2">
              <p className="text-[10px] text-dim-2 uppercase tracking-wider">Spins</p>
              <p className="font-mono font-semibold">{stats.spins}</p>
            </div>
            <div className="rounded-lg bg-surface-2 border border-line-2 px-3 py-2">
              <p className="text-[10px] text-dim-2 uppercase tracking-wider">RTP</p>
              <p className={`font-mono font-semibold ${sessionRtp == null ? "text-dim" : sessionRtp >= 100 ? "text-win" : "text-txt"}`}>{sessionRtp == null ? "—" : `${sessionRtp.toFixed(1)} %`}</p>
            </div>
            <div className="rounded-lg bg-surface-2 border border-line-2 px-3 py-2">
              <p className="text-[10px] text-dim-2 uppercase tracking-wider">Netto</p>
              <p className={`font-mono font-semibold ${stats.won - stats.wagered >= 0 ? "text-win" : "text-danger-2"}`}>{stats.won - stats.wagered >= 0 ? "+" : "−"}{Math.abs(stats.won - stats.wagered).toLocaleString("de-DE")} €</p>
            </div>
            <div className="rounded-lg bg-surface-2 border border-line-2 px-3 py-2">
              <p className="text-[10px] text-dim-2 uppercase tracking-wider">Bester Gewinn</p>
              <p className="font-mono font-semibold text-gold">{fmt(stats.best)}</p>
            </div>
          </div>
        </Panel>
      </div>

      {/* ---------- stage ---------- */}
      <div className="order-1 lg:order-2 flex flex-col gap-4 min-w-0">
        <Panel className={`relative overflow-hidden p-3 sm:p-5 ${shake ? "animate-candy-shake" : ""}`} style={{ background: "linear-gradient(160deg, rgba(244,114,182,0.14) 0%, rgba(21,27,49,0.92) 35%, rgba(21,27,49,0.92) 70%, rgba(192,132,252,0.14) 100%)" }}>
          {/* header bar */}
          <div className="relative flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Pill tone={fs.active ? "amber" : "dim"} data-testid="sb-mode-pill">
                <Sparkles className="w-3 h-3" /> {fs.active ? `Freispiele · ${fs.left} übrig` : ante ? "Ante Bet aktiv" : "Basisspiel"}
              </Pill>
              {fs.active && (
                <Pill tone="win" data-testid="sb-fs-total">
                  Freispiel-Gewinn {fmt(fs.total)}
                </Pill>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2">Gewinn dieser Drehung</p>
              <p className={`font-mono font-extrabold text-2xl tabular leading-none ${spinWin > 0 ? "text-win" : "text-dim"}`} data-testid="sb-spin-win">
                {fmt(spinWin)}
              </p>
            </div>
          </div>

          {/* grid */}
          <div className="relative rounded-2xl border border-line-2 p-2 sm:p-3" style={{ background: "radial-gradient(ellipse at top, rgba(255,255,255,0.05), rgba(10,13,25,0.6))" }}>
            <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }} data-testid="sb-grid">
              <AnimatePresence initial={false}>
                {grid.map((c) => (
                  <Cell key={c.key} cell={c} winning={winKeys.has(c.key)} fresh={freshKeys.has(c.key)} dim={winKeys.size > 0 && !winKeys.has(c.key) && c.type !== BOMB} />
                ))}
              </AnimatePresence>
            </div>

            {/* overlays */}
            <AnimatePresence>
              {overlay?.type === "tier" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center bg-[#0A0D19]/80 backdrop-blur-sm z-20" data-testid="sb-win-overlay">
                  <motion.p initial={{ scale: 0.5, rotate: -6 }} animate={{ scale: [0.5, 1.15, 1], rotate: 0 }} transition={{ duration: 0.6 }} className="font-display font-extrabold text-4xl sm:text-6xl uppercase tracking-tight" style={{ color: overlay.tier.color, textShadow: `0 0 40px ${overlay.tier.color}` }}>
                    {overlay.tier.label}
                  </motion.p>
                  <p className="font-mono font-extrabold text-4xl sm:text-5xl text-white mt-4 tabular" data-testid="sb-win-overlay-amount">
                    {fmt(countWin)}
                  </p>
                </motion.div>
              )}
              {overlay?.type === "bomb" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center bg-[#0A0D19]/75 backdrop-blur-sm z-20" data-testid="sb-bomb-overlay">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Multiplikator-Bomben</p>
                  <p className="font-mono font-extrabold text-5xl sm:text-7xl text-gold mt-2 tabular" style={{ textShadow: "0 0 40px rgba(245,196,81,0.7)" }}>
                    ×{overlay.mult}
                  </p>
                  <p className="font-mono text-lg text-txt-2 mt-3 tabular">
                    {fmt(overlay.base)} × {overlay.mult} = <span className="text-win font-bold">{fmt(overlay.result)}</span>
                  </p>
                </motion.div>
              )}
              {overlay?.type === "fsIntro" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center z-20" style={{ background: "radial-gradient(circle, rgba(192,132,252,0.55), rgba(10,13,25,0.92))" }} data-testid="sb-fs-intro">
                  <motion.div initial={{ scale: 0.4 }} animate={{ scale: [0.4, 1.1, 1] }} transition={{ duration: 0.7 }} className="w-24 h-24">
                    <CandySymbol type={SCATTER} />
                  </motion.div>
                  <p className="font-display font-extrabold text-4xl sm:text-5xl text-white mt-3">{overlay.spins} Freispiele!</p>
                  <p className="text-sm text-txt-2 mt-2">Bomben multiplizieren jeden Tumble-Gewinn</p>
                </motion.div>
              )}
              {overlay?.type === "fsEnd" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center bg-[#0A0D19]/85 backdrop-blur-sm z-20" data-testid="sb-fs-end">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-dim">Freispiele beendet · {overlay.played} Spins</p>
                  <p className="font-mono font-extrabold text-5xl sm:text-6xl text-win mt-3 tabular">{fmt(overlay.total)}</p>
                  <p className="text-sm text-txt-2 mt-2">Gesamtgewinn der Freispiele</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* win groups */}
          <div className="mt-3 flex items-center gap-2 flex-wrap min-h-[28px]" data-testid="sb-win-groups">
            <AnimatePresence>
              {groups.map((g) => (
                <motion.span key={g.type} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1.5 rounded-full bg-win/12 border border-win/30 pl-1 pr-2.5 py-0.5">
                  <span className="w-5 h-5">
                    <CandySymbol type={g.type} />
                  </span>
                  <span className="font-mono text-[11px] font-bold text-win">
                    {g.count}× → +{g.amount.toLocaleString("de-DE")} €
                  </span>
                </motion.span>
              ))}
            </AnimatePresence>
            {groups.length === 0 && !busy && <span className="text-[11px] text-dim-2 inline-flex items-center gap-1"><Info className="w-3 h-3" /> 8+ gleiche Symbole irgendwo im Feld gewinnen. Gewinne tumbeln.</span>}
          </div>
        </Panel>

        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Letzte Runden</p>
          <div className="flex gap-2 flex-wrap min-h-[32px]" data-testid="sb-history">
            {history.length === 0 && <span className="text-xs text-dim-2">Noch keine Drehung.</span>}
            {history.map((h) => (
              <Pill key={h.id} tone={h.fs ? "amber" : h.mult >= 1 ? "win" : h.mult > 0 ? "neutral" : "loss"}>
                {h.fs && <Sparkles className="w-3 h-3" />} {h.mult.toFixed(2)}x
              </Pill>
            ))}
          </div>
        </Panel>
      </div>

      {/* ---------- paytable ---------- */}
      <Dialog open={paytableOpen} onOpenChange={setPaytableOpen}>
        <DialogContent className="bg-surface border border-line text-txt sm:max-w-2xl rounded-2xl shadow-raised max-h-[85vh] overflow-y-auto thin-scroll" data-testid="sb-paytable-dialog">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-2xl font-extrabold">Gewinntabelle & Regeln</DialogTitle>
            <DialogDescription className="text-sm text-dim">Auszahlungen als Vielfaches des Einsatzes ({fmt(bet)}).</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            {SYMBOLS.map((s) => (
              <div key={s.type} className="rounded-xl bg-panel border border-line p-3 flex items-center gap-3">
                <span className="w-11 h-11 shrink-0">
                  <CandySymbol type={s.type} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{s.label}</p>
                  <p className="font-mono text-[10px] text-dim leading-relaxed">
                    8–9: <span className="text-win">{fmt(PAYTABLE[s.type][0] * bet)}</span>
                    <br />
                    10–11: <span className="text-win">{fmt(PAYTABLE[s.type][1] * bet)}</span>
                    <br />
                    12+: <span className="text-win">{fmt(PAYTABLE[s.type][2] * bet)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <div className="rounded-xl bg-panel border border-line p-3 flex gap-3">
              <span className="w-11 h-11 shrink-0">
                <CandySymbol type={SCATTER} />
              </span>
              <div className="text-xs text-dim leading-relaxed">
                <p className="font-bold text-txt mb-0.5">Freispiel-Glas (Scatter)</p>
                4+ im Basisspiel: <span className="text-txt">{FREE_SPINS_AWARD} Freispiele</span> · 3+ in Freispielen: <span className="text-txt">+{FREE_SPINS_RETRIGGER}</span>
                <br />
                Zahlt zusätzlich: 4 = {SCATTER_PAYS[4]}x · 5 = {SCATTER_PAYS[5]}x · 6 = {SCATTER_PAYS[6]}x
              </div>
            </div>
            <div className="rounded-xl bg-panel border border-line p-3 flex gap-3">
              <span className="w-11 h-11 shrink-0">
                <CandySymbol type={BOMB} />
              </span>
              <div className="text-xs text-dim leading-relaxed">
                <p className="font-bold text-txt mb-0.5">Multiplikator-Bombe</p>
                Nur in Freispielen. Werte 2x–100x. Alle Bomben auf dem Feld werden am Ende der Tumble-Sequenz summiert und mit dem Gewinn der Drehung multipliziert.
              </div>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-dim leading-relaxed">
            <li>• 6×5 Feld, Gewinne zählen überall (Pay Anywhere) ab 8 gleichen Symbolen.</li>
            <li>• Gewinnsymbole verschwinden, neue fallen nach (Tumble) — bis keine neuen Gewinne entstehen.</li>
            <li>• Ante Bet: +25 % Einsatz, Freispiel-Gläser erscheinen deutlich häufiger. Freispiel-Kauf: {BUY_COST}× Einsatz.</li>
            <li>• Gewinnstufen: Big Win ≥ 20×, Mega Win ≥ 50×, Epic Win ≥ 100×, Legendär ≥ 500×. Max. 21.100×.</li>
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SweetBonanzaGame;
