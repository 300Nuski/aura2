import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Users, Wifi, Rocket, History } from "lucide-react";
import CrashGraphCanvas from "@/components/crash/CrashGraphCanvas";
import { playCashoutChime, playExplosion } from "@/lib/sounds";
import { recordRound } from "@/lib/rounds";
import { fmt, fmtMult } from "@/lib/format";
import { Panel, Label, NumberInput, SmallButton, PrimaryButton, Pill } from "@/components/common/Bits";
import { BetInput } from "@/components/game/BetInput";

const BOT_NAMES = ["NoOneCanBeatMe", "Hello34445", "waffleman", "Defundings", "Nochance", "xXShadowXx", "KrakenKid", "LunaSky", "PixelPirat", "GoldenGir"];
const GROWTH = 0.00013;
const WAIT_MS = 6000;
const COOLDOWN_MS = 3000;

const genCrash = () => {
  const forced = Number(new URLSearchParams(window.location.search).get("crashAt"));
  if (forced > 1) return forced;
  return Math.min(100, Math.max(1, Math.floor((0.99 / (1 - Math.random())) * 100) / 100));
};

const genBots = () => {
  const names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  return Array.from({ length: 6 + Math.floor(Math.random() * 4) }, (_, i) => ({
    id: `bot-${i}-${Date.now()}`,
    name: names[i % names.length],
    bet: 50 + Math.floor(Math.random() * 2950),
    target: +(1.05 + Math.random() * 6).toFixed(2),
    cashed: false,
    lost: false,
  }));
};

const pillTone = (m) => (m < 1.2 ? "loss" : m >= 10 ? "gold" : m >= 2 ? "aqua" : "neutral");

export const CrashGame = ({ balance, setBalance }) => {
  const [phase, setPhase] = useState("waiting");
  const [countdown, setCountdown] = useState(WAIT_MS / 1000);
  const [mult, setMult] = useState(1);
  const [crashPoint, setCrashPoint] = useState(null);
  const [roundStart, setRoundStart] = useState(0);
  const [history, setHistory] = useState([]);
  const [players, setPlayers] = useState([]);
  const [myBet, setMyBet] = useState(null);
  const [queued, setQueued] = useState(null);
  const [betAmount, setBetAmount] = useState(100);
  const [autoCash, setAutoCash] = useState(2);
  const [mode, setMode] = useState("manual");
  const [autoRounds, setAutoRounds] = useState(10);
  const [stopProfit, setStopProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoStats, setAutoStats] = useState({ done: 0, net: 0 });
  const [shake, setShake] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const myBetRef = useRef(null);
  const queuedRef = useRef(null);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const timeoutRef = useRef(null);
  const autoRef = useRef({ running: false, remaining: 0, net: 0, done: 0, amount: 0, cashout: null, stopProfit: null, stopLoss: null });
  const autoRoundRef = useRef(false);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  const cashOut = useCallback(
    (m) => {
      const mb = myBetRef.current;
      if (!mb || !mb.active) return;
      const win = Math.floor(mb.amount * m);
      myBetRef.current = null;
      setMyBet({ ...mb, active: false, cashedAt: m, win });
      setBalance((b) => b + win);
      playCashoutChime();
      recordRound({ game: "Crash", bet: mb.amount, mult: m, payout: win });
      setLastResult({ type: "win", mult: m, amount: win - mb.amount });
      if (mb.isAuto) autoRef.current.net += win - mb.amount;
      if (!mb.isAuto) toast.success(`Cashout bei ${m.toFixed(2)}x · +${win.toLocaleString("de-DE")} €`);
    },
    [setBalance]
  );

  useEffect(() => {
    let cancelled = false;

    const placeAutoOrQueued = () => {
      const a = autoRef.current;
      if (queuedRef.current && !myBetRef.current?.active) {
        const q = queuedRef.current;
        queuedRef.current = null;
        setQueued(null);
        const amt = Math.floor(Math.min(q.amount, balanceRef.current));
        if (amt >= 1) {
          setBalance((b) => b - amt);
          const mb = { amount: amt, auto: q.auto, active: true };
          myBetRef.current = mb;
          setMyBet(mb);
        } else {
          toast.error("Vorgemerkte Wette verworfen: zu wenig Guthaben.");
        }
      }
      if (a.running && a.remaining !== 0 && !myBetRef.current?.active) {
        const amt = Math.floor(Math.min(a.amount, balanceRef.current));
        if (amt < 1) {
          a.running = false;
          setAutoRunning(false);
          toast.error("Auto-Modus gestoppt: zu wenig Guthaben.");
        } else {
          setBalance((b) => b - amt);
          const mb = { amount: amt, auto: a.cashout, active: true, isAuto: true };
          myBetRef.current = mb;
          setMyBet(mb);
          autoRoundRef.current = true;
        }
      }
    };

    const runWaiting = () => {
      setPhase("waiting");
      setMult(1);
      setCrashPoint(null);
      setMyBet((prev) => (prev && !prev.active ? null : prev));
      setPlayers(genBots());
      placeAutoOrQueued();
      const end = Date.now() + WAIT_MS;
      setCountdown(WAIT_MS / 1000);
      timerRef.current = setInterval(() => {
        if (cancelled) return;
        const remain = (end - Date.now()) / 1000;
        if (remain <= 0) {
          clearInterval(timerRef.current);
          runRound();
        } else {
          setCountdown(remain);
        }
      }, 100);
    };

    const runRound = () => {
      const crash = genCrash();
      const start = performance.now();
      setRoundStart(start);
      setPhase("running");
      let lastUi = 0;
      const tick = () => {
        if (cancelled) return;
        const nowTs = performance.now();
        const elapsed = nowTs - start;
        const m = Math.max(1, Math.floor(Math.exp(GROWTH * elapsed) * 100) / 100);
        if (nowTs - lastUi > 80) {
          lastUi = nowTs;
          setMult(m);
          setPlayers((ps) => (ps.some((pl) => !pl.cashed && !pl.lost && pl.target <= m) ? ps.map((pl) => (!pl.cashed && !pl.lost && pl.target <= m ? { ...pl, cashed: true } : pl)) : ps));
        }
        const mb = myBetRef.current;
        if (mb && mb.active && mb.auto && m >= mb.auto) cashOut(m);
        if (m >= crash) {
          setMult(crash);
          endRound(crash);
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const endRound = (crash) => {
      setPhase("crashed");
      setCrashPoint(crash);
      setShake(true);
      setTimeout(() => setShake(false), 260);
      setHistory((h) => [crash, ...h].slice(0, 14));
      setPlayers((ps) => ps.map((pl) => (!pl.cashed ? { ...pl, lost: true } : pl)));
      const mb = myBetRef.current;
      if (mb && mb.active) {
        myBetRef.current = null;
        setMyBet({ ...mb, active: false, lost: true });
        recordRound({ game: "Crash", bet: mb.amount, mult: 0, payout: 0 });
        setLastResult({ type: "loss", mult: crash, amount: -mb.amount });
        playExplosion();
        if (mb.isAuto) autoRef.current.net += -mb.amount;
        if (!mb.isAuto) toast.error(`Abgestürzt bei ${crash.toFixed(2)}x — Einsatz verloren.`);
      }
      if (autoRoundRef.current) {
        autoRoundRef.current = false;
        const a = autoRef.current;
        a.done += 1;
        if (a.remaining > 0) a.remaining -= 1;
        setAutoStats({ done: a.done, net: a.net });
        let stop = false;
        if (a.remaining === 0) stop = true;
        if (a.stopProfit != null && a.net >= a.stopProfit) stop = true;
        if (a.stopLoss != null && a.net <= -a.stopLoss) stop = true;
        if (stop && a.running) {
          a.running = false;
          setAutoRunning(false);
          toast.info(`Auto-Modus beendet · ${a.done} Runden · Netto ${a.net >= 0 ? "+" : ""}${a.net.toLocaleString("de-DE")} €`);
        }
      }
      timeoutRef.current = setTimeout(() => {
        if (!cancelled) runWaiting();
      }, COOLDOWN_MS);
    };

    runWaiting();
    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
      clearTimeout(timeoutRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [cashOut, setBalance]);

  const placeBet = () => {
    if (myBet?.active) return;
    const amount = Math.floor(Math.min(Math.max(1, betAmount), balanceRef.current));
    if (amount < 1) {
      toast.error("Nicht genügend Guthaben.");
      return;
    }
    if (phase === "waiting") {
      setBalance((b) => b - amount);
      const mb = { amount, auto: autoCash > 1 ? autoCash : null, active: true };
      myBetRef.current = mb;
      setMyBet(mb);
      setLastResult(null);
    } else {
      const q = { amount, auto: autoCash > 1 ? autoCash : null };
      queuedRef.current = q;
      setQueued(q);
      toast.info(`Wette für die nächste Runde vorgemerkt: ${fmt(amount)}`);
    }
  };

  const cancelBet = () => {
    if (phase === "waiting" && myBetRef.current?.active) {
      const mb = myBetRef.current;
      myBetRef.current = null;
      setMyBet(null);
      setBalance((b) => b + mb.amount);
      toast.info("Wette zurückgezogen.");
    } else if (queuedRef.current) {
      queuedRef.current = null;
      setQueued(null);
      toast.info("Vormerkung entfernt.");
    }
  };

  const startAuto = () => {
    if (autoRunning) return;
    const amount = Math.floor(Math.max(1, betAmount));
    if (amount > balanceRef.current) {
      toast.error("Nicht genügend Guthaben.");
      return;
    }
    const rounds = Math.max(0, Math.floor(autoRounds));
    autoRef.current = {
      running: true,
      remaining: rounds > 0 ? rounds : -1,
      net: 0,
      done: 0,
      amount,
      cashout: autoCash > 1 ? autoCash : null,
      stopProfit: stopProfit !== "" ? Math.max(0, Number(stopProfit)) : null,
      stopLoss: stopLoss !== "" ? Math.max(0, Number(stopLoss)) : null,
    };
    setAutoStats({ done: 0, net: 0 });
    setAutoRunning(true);
    toast.success(`Auto-Modus gestartet${rounds > 0 ? ` · ${rounds} Runden` : " · endlos"}.`);
    if (phase === "waiting" && !myBetRef.current?.active) {
      const amt = Math.floor(Math.min(amount, balanceRef.current));
      setBalance((b) => b - amt);
      const mb = { amount: amt, auto: autoRef.current.cashout, active: true, isAuto: true };
      myBetRef.current = mb;
      setMyBet(mb);
      autoRoundRef.current = true;
    }
  };

  const stopAuto = () => {
    autoRef.current.running = false;
    setAutoRunning(false);
    toast.info("Auto-Modus wird nach dieser Runde gestoppt.");
  };

  const potential = myBet?.active ? Math.floor(myBet.amount * mult) : 0;
  const totalWager = players.reduce((s, p) => s + p.bet, 0) + (myBet?.active ? myBet.amount : 0);
  const inputsLocked = mode === "auto" ? autoRunning : !!myBet?.active || !!queued;
  const autoCashLocked = autoRunning || (mode === "manual" && (!!myBet?.active || !!queued));

  let mainButton;
  if (phase === "running" && myBet?.active) {
    mainButton = (
      <PrimaryButton tone="win" onClick={() => cashOut(mult)} className="w-full py-4 text-base animate-win-pulse" data-testid="crash-cashout-button">
        Cashout @ {mult.toFixed(2)}x · +{potential.toLocaleString("de-DE")} €
      </PrimaryButton>
    );
  } else if (phase === "waiting" && myBet?.active) {
    mainButton = (
      <PrimaryButton tone="secondary" onClick={cancelBet} className="w-full py-4" data-testid="crash-cancel-bet-button">
        Wette platziert · Start in {countdown.toFixed(1)}s — zurückziehen
      </PrimaryButton>
    );
  } else if (queued) {
    mainButton = (
      <PrimaryButton tone="secondary" onClick={cancelBet} className="w-full py-4" data-testid="crash-cancel-queued-button">
        Vorgemerkt für nächste Runde · {fmt(queued.amount)} — entfernen
      </PrimaryButton>
    );
  } else if (phase === "crashed") {
    mainButton = (
      <PrimaryButton tone="danger" disabled className="w-full py-4" data-testid="crash-bet-button">
        Abgestürzt @ {crashPoint?.toFixed(2)}x
      </PrimaryButton>
    );
  } else {
    mainButton = (
      <PrimaryButton tone="gold" onClick={placeBet} className="w-full py-4 text-base" data-testid="crash-bet-button">
        <Rocket className="w-4 h-4" />
        {phase === "waiting" ? `Setzen · ${fmt(betAmount)}` : `Nächste Runde · ${fmt(betAmount)}`}
      </PrimaryButton>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4" data-testid="crash-game">
      {/* ---------------- canvas (full viewport height) ---------------- */}
      <div className="order-1 lg:order-2 flex flex-col gap-4 min-w-0">
        <Panel className="p-3 sm:p-4 relative overflow-hidden flex flex-col" style={{ minHeight: "min(calc(100vh - 6.5rem), 900px)" }}>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap px-1">
            <div className="flex gap-1.5 flex-wrap items-center" data-testid="crash-history-pills">
              <History className="w-3.5 h-3.5 text-dim-2 mr-1" />
              {history.length === 0 && <span className="text-xs text-dim-2">Verlauf erscheint nach der ersten Runde</span>}
              {history.map((h, i) => (
                <Pill key={`${h}-${i}`} tone={pillTone(h)}>
                  {h.toFixed(2)}x
                </Pill>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-dim">
              <Wifi className="w-3.5 h-3.5 text-win" />
              Live <span className="w-1.5 h-1.5 rounded-full bg-win animate-pulse-dot" />
            </span>
          </div>

          <div className={`relative flex-1 rounded-2xl overflow-hidden border border-line-2 min-h-[320px] ${shake ? "animate-crash-shake" : ""}`}>
            <CrashGraphCanvas phase={phase} roundStart={roundStart} crashPoint={crashPoint} growth={GROWTH} className="absolute inset-0 h-full" multiplierPosition="center" />
            {phase === "crashed" && <div className="absolute inset-0 pointer-events-none animate-red-flash" style={{ background: "radial-gradient(ellipse at center, rgba(255,84,112,0) 40%, rgba(255,84,112,0.55) 100%)" }} />}
            {phase === "waiting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="font-display font-extrabold text-6xl sm:text-7xl lg:text-8xl tracking-[-0.04em] tabular text-txt-2 leading-none drop-shadow-[0_8px_40px_rgba(0,0,0,0.6)]" data-testid="crash-countdown-display">
                  {countdown.toFixed(1)}s
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-dim mt-4">Nächste Runde startet</p>
              </div>
            )}
            {phase === "running" && <p className="absolute left-0 right-0 top-[58%] text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-dim pointer-events-none">Aktueller Multiplikator</p>}
            <AnimatePresence>
              {phase === "crashed" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-0 right-0 top-[58%] flex justify-center pointer-events-none">
                  <span className="rounded-xl glass border border-danger/50 text-danger font-display font-bold text-base px-5 py-2 shadow-glow-danger" data-testid="crash-crashed-badge">
                    Abgestürzt @ {crashPoint?.toFixed(2)}x
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Panel>
      </div>

      {/* ---------------- left dock: bet + players ---------------- */}
      <div className="order-2 lg:order-1 flex flex-col gap-4">
        <Panel className="p-5">
          <div className="flex gap-1 rounded-full bg-surface-2 border border-line p-1 mb-5" data-testid="crash-mode-tabs">
            <button onClick={() => !autoRunning && setMode("manual")} disabled={autoRunning} className={`flex-1 rounded-full py-2 text-xs font-bold transition-colors duration-200 disabled:opacity-50 ${mode === "manual" ? "bg-raised text-txt shadow-glow-aqua" : "text-dim hover:text-txt"}`} data-testid="crash-manual-tab">
              Manuell
            </button>
            <button onClick={() => setMode("auto")} className={`flex-1 rounded-full py-2 text-xs font-bold transition-colors duration-200 ${mode === "auto" ? "bg-raised text-txt shadow-glow-aqua" : "text-dim hover:text-txt"}`} data-testid="crash-auto-tab">
              Auto
            </button>
          </div>

          <BetInput value={betAmount} onChange={setBetAmount} disabled={inputsLocked} balance={balance} testId="crash" />

          <Label className="mt-5">Auto-Cashout (Multiplikator)</Label>
          <div className="flex items-center gap-2">
            <NumberInput min={1.01} step={0.1} value={autoCash} onChange={(e) => setAutoCash(Number(e.target.value))} disabled={autoCashLocked} data-testid="crash-auto-cashout-input" />
            {[1.5, 2, 5, 10].map((v) => (
              <SmallButton key={v} active={autoCash === v} onClick={() => setAutoCash(v)} disabled={autoCashLocked} data-testid={`crash-auto-quick-${v}`}>
                {v}x
              </SmallButton>
            ))}
          </div>
          <p className="text-[11px] text-dim-2 mt-1.5">Wert ≤ 1 deaktiviert den Auto-Cashout.</p>

          {mode === "auto" && (
            <div className="mt-5 space-y-4" data-testid="crash-auto-config">
              <div>
                <Label>Anzahl Runden (0 = endlos)</Label>
                <div className="flex items-center gap-2">
                  <NumberInput min={0} value={autoRounds} onChange={(e) => setAutoRounds(Number(e.target.value))} disabled={autoRunning} data-testid="crash-auto-rounds-input" />
                  {[10, 25, 0].map((v) => (
                    <SmallButton key={v} active={autoRounds === v} onClick={() => setAutoRounds(v)} disabled={autoRunning}>
                      {v === 0 ? "∞" : v}
                    </SmallButton>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-win">Stop bei Gewinn (€)</Label>
                  <NumberInput min={0} placeholder="—" value={stopProfit} onChange={(e) => setStopProfit(e.target.value)} disabled={autoRunning} data-testid="crash-auto-stopprofit-input" />
                </div>
                <div>
                  <Label className="text-danger-2">Stop bei Verlust (€)</Label>
                  <NumberInput min={0} placeholder="—" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} disabled={autoRunning} data-testid="crash-auto-stoploss-input" />
                </div>
              </div>
              {autoRunning && (
                <div className="flex items-center justify-between rounded-xl bg-surface-2 border border-line px-4 py-3" data-testid="crash-auto-stats">
                  <span className="text-xs text-dim">
                    Runde <span className="font-mono font-semibold text-txt">{autoStats.done}</span>
                    <span className="text-dim-2"> / {autoRef.current.remaining > 0 ? autoStats.done + autoRef.current.remaining : "∞"}</span>
                  </span>
                  <span className={`font-mono text-xs font-semibold ${autoStats.net >= 0 ? "text-win" : "text-danger-2"}`}>
                    {autoStats.net >= 0 ? "+" : ""}
                    {autoStats.net.toLocaleString("de-DE")} €
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mt-5">
            {mode === "manual" ? (
              mainButton
            ) : (
              <PrimaryButton tone={autoRunning ? "danger" : "gold"} onClick={autoRunning ? stopAuto : startAuto} className="w-full py-4" data-testid="crash-auto-start-button">
                {autoRunning ? "Auto-Modus stoppen" : "Auto-Modus starten"}
              </PrimaryButton>
            )}
          </div>

          {myBet?.active && (
            <p className="mt-3 text-center text-xs font-mono text-dim" data-testid="crash-my-bet-info">
              Einsatz {fmt(myBet.amount)}
              {myBet.auto ? ` · Auto @ ${myBet.auto.toFixed(2)}x` : ""}
              {myBet.isAuto ? " · AUTO" : ""}
            </p>
          )}

          <AnimatePresence>
            {lastResult && !myBet?.active && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 rounded-xl border px-4 py-3 flex items-center justify-between ${lastResult.type === "win" ? "bg-win/10 border-win/30" : "bg-danger/10 border-danger/30"}`}
                data-testid="crash-last-result"
              >
                <span className="text-xs font-semibold text-txt-2">{lastResult.type === "win" ? `Cashout bei ${fmtMult(lastResult.mult)}` : `Abgestürzt bei ${fmtMult(lastResult.mult)}`}</span>
                <span className={`font-mono text-sm font-semibold tabular ${lastResult.type === "win" ? "text-win" : "text-danger"}`}>
                  {lastResult.amount >= 0 ? "+" : "−"}
                  {Math.abs(lastResult.amount).toLocaleString("de-DE")} €
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>

        <Panel className="p-5" data-testid="crash-players-list">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-2 text-sm font-bold">
              <Users className="w-4 h-4 text-aqua" />
              Spieler
              <span className="font-mono text-xs text-dim">{players.length + (myBet?.active ? 1 : 0)}</span>
            </span>
            <span className="font-mono text-xs text-dim tabular">{fmt(totalWager)}</span>
          </div>
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto thin-scroll pr-1">
            {myBet?.active && (
              <div className="flex items-center justify-between rounded-xl bg-brand/15 border border-brand/50 px-3 py-2.5" data-testid="crash-my-row">
                <span className="flex items-center gap-2 text-xs font-bold text-brand-2">
                  <span className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[10px] font-bold">DU</span>
                  Du
                </span>
                <span className="font-mono text-xs font-semibold text-brand-2">{phase === "running" ? `${mult.toFixed(2)}x` : "bereit"}</span>
                <span className="font-mono text-xs text-txt-2 tabular">{fmt(myBet.amount)}</span>
              </div>
            )}
            <AnimatePresence initial={false}>
              {players.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 border ${p.lost ? "opacity-40 border-line-2 bg-panel-2" : p.cashed ? "bg-win/[0.08] border-win/30" : "bg-panel-2 border-line-2"}`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-txt-2 truncate">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-raised border border-line flex items-center justify-center text-[10px] font-bold">{p.name.slice(0, 1)}</span>
                    <span className="truncate max-w-[96px]">{p.name}</span>
                  </span>
                  <span className={`font-mono text-xs font-semibold ${p.cashed ? "text-win" : p.lost ? "text-danger-2" : "text-dim-2"}`}>{p.cashed ? `${p.target.toFixed(2)}x` : p.lost ? "crash" : "…"}</span>
                  <span className="font-mono text-xs text-dim tabular">{fmt(p.bet)}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Panel>
      </div>
    </div>
  );
};
