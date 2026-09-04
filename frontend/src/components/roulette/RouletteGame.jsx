import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { toast } from "sonner";
import { RotateCw, Undo2, Trash2, Copy } from "lucide-react";
import { playWinChime, playLoseTone, playTick } from "@/lib/sounds";
import { recordRound } from "@/lib/rounds";
import { fmt } from "@/lib/format";
import { Panel, Label, PrimaryButton, Pill } from "@/components/common/Bits";

const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const SEG = 360 / 37;
const CHIPS = [
  { v: 10, c: "#8B93B8" },
  { v: 25, c: "#3DDC97" },
  { v: 50, c: "#6AA8FF" },
  { v: 100, c: "#C084FC" },
  { v: 500, c: "#F5C451" },
  { v: 1000, c: "#FF5470" },
];

const colorOf = (n) => (n === 0 ? "green" : REDS.has(n) ? "red" : "black");
const colorHex = { green: "#3DDC97", red: "#FF5470", black: "#2A3150" };

const OUTSIDE = [
  { key: "d1", label: "1 – 12", mult: 3, test: (n) => n >= 1 && n <= 12 },
  { key: "d2", label: "13 – 24", mult: 3, test: (n) => n >= 13 && n <= 24 },
  { key: "d3", label: "25 – 36", mult: 3, test: (n) => n >= 25 && n <= 36 },
  { key: "low", label: "1 – 18", mult: 2, test: (n) => n >= 1 && n <= 18 },
  { key: "even", label: "Gerade", mult: 2, test: (n) => n !== 0 && n % 2 === 0 },
  { key: "red", label: "Rot", mult: 2, test: (n) => REDS.has(n), tone: "red" },
  { key: "black", label: "Schwarz", mult: 2, test: (n) => n !== 0 && !REDS.has(n), tone: "black" },
  { key: "odd", label: "Ungerade", mult: 2, test: (n) => n % 2 === 1 },
  { key: "high", label: "19 – 36", mult: 2, test: (n) => n >= 19 && n <= 36 },
  { key: "c1", label: "2:1", mult: 3, test: (n) => n !== 0 && n % 3 === 1 },
  { key: "c2", label: "2:1", mult: 3, test: (n) => n !== 0 && n % 3 === 2 },
  { key: "c3", label: "2:1", mult: 3, test: (n) => n !== 0 && n % 3 === 0 },
];
const OUTSIDE_BY_KEY = Object.fromEntries(OUTSIDE.map((o) => [o.key, o]));

const resolveBet = (key, num) => {
  if (key.startsWith("n")) return Number(key.slice(1)) === num ? 36 : 0;
  const o = OUTSIDE_BY_KEY[key];
  return o && o.test(num) ? o.mult : 0;
};

const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};
const wedge = (cx, cy, r0, r1, a0, a1) => {
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, a1);
  const [x2, y2] = polar(cx, cy, r0, a1);
  const [x3, y3] = polar(cx, cy, r0, a0);
  return `M ${x0} ${y0} A ${r1} ${r1} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 0 0 ${x3} ${y3} Z`;
};

const ChipStack = ({ amount, small = false }) => {
  const chip = [...CHIPS].reverse().find((c) => amount >= c.v) || CHIPS[0];
  return (
    <span
      className={`absolute z-10 rounded-full border-2 border-dashed border-white/70 flex items-center justify-center font-mono font-bold text-ink shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${small ? "w-6 h-6 text-[8px] -top-1.5 -right-1.5" : "w-7 h-7 text-[9px] -top-2 -right-2"}`}
      style={{ backgroundColor: chip.c }}
      data-testid="roulette-chip-on-cell"
    >
      {amount >= 1000 ? `${Math.round(amount / 100) / 10}k` : amount}
    </span>
  );
};

export const RouletteGame = ({ balance, setBalance }) => {
  const [chip, setChip] = useState(50);
  const [bets, setBets] = useState({});
  const [undoStack, setUndoStack] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [lastWin, setLastWin] = useState(null);
  const [history, setHistory] = useState([]);
  const rotationRef = useRef(0);
  const wheelRef = useRef(null);
  const ballRef = useRef(null);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  const total = useMemo(() => Object.values(bets).reduce((s, v) => s + v, 0), [bets]);

  const segments = useMemo(
    () =>
      WHEEL.map((num, i) => {
        const a0 = i * SEG;
        const mid = a0 + SEG / 2;
        const [tx, ty] = polar(170, 170, 138, mid);
        return { num, d: wedge(170, 170, 108, 160, a0, a0 + SEG), fill: colorHex[colorOf(num)], tx, ty, mid };
      }),
    []
  );

  const place = (key) => {
    if (spinning) return;
    if (total + chip > balanceRef.current) {
      toast.error("Nicht genügend Guthaben für diesen Chip.");
      return;
    }
    setBets((b) => ({ ...b, [key]: (b[key] || 0) + chip }));
    setUndoStack((u) => [...u, key]);
    playTick(1200, 0.02);
  };
  const undo = () => {
    if (spinning || !undoStack.length) return;
    const key = undoStack[undoStack.length - 1];
    setUndoStack((u) => u.slice(0, -1));
    setBets((b) => {
      const n = { ...b };
      n[key] -= chip;
      if (n[key] <= 0) delete n[key];
      return n;
    });
  };
  const clear = () => {
    if (spinning) return;
    setBets({});
    setUndoStack([]);
  };
  const doubleAll = () => {
    if (spinning || !total) return;
    if (total * 2 > balanceRef.current) {
      toast.error("Verdoppeln übersteigt dein Guthaben.");
      return;
    }
    setBets((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v * 2])));
  };

  const spin = () => {
    if (spinning || total < 1) return;
    if (total > balanceRef.current) {
      toast.error("Nicht genügend Guthaben.");
      return;
    }
    setBalance((b) => b - total);
    setSpinning(true);
    setResult(null);
    setLastWin(null);
    const idx = Math.floor(Math.random() * 37);
    const num = WHEEL[idx];
    const targetMod = 360 - (idx * SEG + SEG / 2);
    const current = rotationRef.current % 360;
    const delta = ((targetMod - current) % 360 + 360) % 360;
    const target = rotationRef.current + 360 * 6 + delta;
    const from = rotationRef.current;
    animate(from, target, {
      duration: 4.6,
      ease: [0.12, 0.8, 0.12, 1],
      onUpdate: (v) => {
        rotationRef.current = v;
        if (wheelRef.current) wheelRef.current.style.transform = `rotate(${v}deg)`;
        if (ballRef.current) {
          const k = Math.min(1, Math.max(0, (v - from) / (target - from)));
          // ball orbits against the wheel (3 turns) and settles under the pointer
          ballRef.current.style.transform = `rotate(${(1 - Math.pow(1 - k, 2)) * -1080}deg)`;
        }
      },
      onComplete: () => {
        if (ballRef.current) ballRef.current.style.transform = "rotate(0deg)";
        let payout = 0;
        for (const [key, amt] of Object.entries(bets)) payout += Math.floor(amt * resolveBet(key, num));
        setResult(num);
        setHistory((h) => [num, ...h].slice(0, 16));
        const mult = total ? Math.round((payout / total) * 100) / 100 : 0;
        recordRound({ game: "Roulette", bet: total, mult, payout, meta: { number: num } });
        if (payout > 0) {
          setBalance((b) => b + payout);
          setLastWin({ payout, net: payout - total });
          playWinChime();
          toast.success(`${num} ${colorOf(num) === "red" ? "Rot" : colorOf(num) === "black" ? "Schwarz" : "Grün"} · Auszahlung ${fmt(payout)}`);
        } else {
          setLastWin({ payout: 0, net: -total });
          playLoseTone();
          toast.error(`${num} — keine Wette getroffen.`);
        }
        setSpinning(false);
      },
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === " " && !spinning && total > 0 && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        spin();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const numberRows = [3, 2, 1].map((r) => Array.from({ length: 12 }, (_, i) => i * 3 + r));

  const cellCls = (n) => {
    const c = colorOf(n);
    if (c === "red") return "bg-danger/20 border-danger/50 text-danger-2 hover:bg-danger/35";
    if (c === "green") return "bg-win/20 border-win/50 text-win hover:bg-win/35";
    return "bg-[#222A48] border-line text-txt hover:bg-raised";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4" data-testid="roulette-game">
      {/* ---------- left dock ---------- */}
      <div className="order-2 lg:order-1 flex flex-col gap-4">
        <Panel className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-2 text-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-brand" /> Manuell
            </span>
            <span className="font-mono text-xs text-dim tabular">Guthaben {fmt(balance)}</span>
          </div>
          <Label>Chip-Wert</Label>
          <div className="grid grid-cols-6 gap-1.5" data-testid="roulette-chip-selector">
            {CHIPS.map((c) => (
              <button
                key={c.v}
                onClick={() => setChip(c.v)}
                disabled={spinning}
                className={`aspect-square rounded-full border-[3px] border-dashed flex items-center justify-center font-mono font-bold text-[10px] text-ink transition-transform duration-200 hover:scale-105 ${chip === c.v ? "ring-2 ring-white ring-offset-2 ring-offset-panel scale-105" : "opacity-80"}`}
                style={{ backgroundColor: c.c, borderColor: "rgba(255,255,255,0.7)" }}
                data-testid={`roulette-chip-selector-${c.v}`}
                aria-label={`Chip ${c.v}`}
              >
                {c.v >= 1000 ? "1k" : c.v}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-surface-2 border border-line px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-dim">Gesamteinsatz</span>
              <span className="font-mono font-semibold text-base tabular text-txt" data-testid="roulette-total-bet">
                {fmt(total)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-dim">Wetten</span>
              <span className="font-mono text-xs text-dim-2 tabular">{Object.keys(bets).length}</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button onClick={undo} disabled={spinning || !undoStack.length} className="rounded-lg bg-surface-2 border border-line py-2 text-[11px] font-bold text-txt-2 inline-flex items-center justify-center gap-1 hover:border-brand/60 disabled:opacity-40" data-testid="roulette-undo-button">
              <Undo2 className="w-3.5 h-3.5" /> Zurück
            </button>
            <button onClick={doubleAll} disabled={spinning || !total} className="rounded-lg bg-surface-2 border border-line py-2 text-[11px] font-bold text-txt-2 inline-flex items-center justify-center gap-1 hover:border-brand/60 disabled:opacity-40" data-testid="roulette-double-button">
              <Copy className="w-3.5 h-3.5" /> 2×
            </button>
            <button onClick={clear} disabled={spinning || !total} className="rounded-lg bg-surface-2 border border-line py-2 text-[11px] font-bold text-txt-2 inline-flex items-center justify-center gap-1 hover:border-danger/60 hover:text-danger disabled:opacity-40" data-testid="roulette-clear-button">
              <Trash2 className="w-3.5 h-3.5" /> Löschen
            </button>
          </div>

          <PrimaryButton onClick={spin} disabled={spinning || total < 1} className="w-full py-4 text-base mt-4" data-testid="roulette-spin-button">
            <RotateCw className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`} />
            {spinning ? "Rad dreht …" : total > 0 ? `Drehen · ${fmt(total)}` : "Chips setzen"}
          </PrimaryButton>
          <p className="text-[10px] text-dim-2 text-center mt-2">Leertaste = Drehen</p>

          <AnimatePresence>
            {lastWin && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-4 rounded-xl border px-4 py-3 flex items-center justify-between ${lastWin.payout > 0 ? "bg-win/10 border-win/30" : "bg-danger/10 border-danger/30"}`} data-testid="roulette-last-result">
                <span className="text-xs font-semibold text-txt-2">{lastWin.payout > 0 ? `Auszahlung ${fmt(lastWin.payout)}` : "Keine Wette getroffen"}</span>
                <span className={`font-mono text-sm font-semibold tabular ${lastWin.net >= 0 ? "text-win" : "text-danger"}`}>
                  {lastWin.net >= 0 ? "+" : "−"}
                  {Math.abs(lastWin.net).toLocaleString("de-DE")} €
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>

        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Deine Wetten</p>
          {Object.keys(bets).length === 0 && <p className="text-xs text-dim-2">Klicke auf Zahlen oder Felder, um Chips zu setzen.</p>}
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto thin-scroll">
            {Object.entries(bets).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-lg bg-panel-2 border border-line-2 px-3 py-2 text-xs" data-testid="roulette-bet-row">
                <span className="font-semibold text-txt-2">{k.startsWith("n") ? `Zahl ${k.slice(1)}` : OUTSIDE_BY_KEY[k]?.label === "2:1" ? `Kolonne ${k.slice(1)}` : OUTSIDE_BY_KEY[k]?.label}</span>
                <span className="font-mono text-dim">×{k.startsWith("n") ? 36 : OUTSIDE_BY_KEY[k]?.mult}</span>
                <span className="font-mono font-semibold text-txt tabular">{fmt(v)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ---------- table ---------- */}
      <div className="order-1 lg:order-2 flex flex-col gap-4 min-w-0">
        <Panel className="p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,84,112,0.16) 0%, rgba(255,84,112,0) 60%)" }} />
          <div className="relative grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6 items-center">
            {/* wheel */}
            <div className="relative w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] mx-auto" data-testid="roulette-wheel">
              <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-20 w-0 h-0 border-l-[9px] border-r-[9px] border-t-[16px] border-l-transparent border-r-transparent border-t-gold drop-shadow-[0_0_8px_rgba(245,196,81,0.8)]" />
              <div ref={wheelRef} className="w-full h-full will-change-transform" data-testid="roulette-wheel-svg">
                <svg viewBox="0 0 340 340" className="w-full h-full">
                  <circle cx="170" cy="170" r="168" fill="#0E1222" stroke="#2B3457" strokeWidth="2" />
                  <circle cx="170" cy="170" r="162" fill="none" stroke="#F5C451" strokeWidth="1.5" opacity="0.6" />
                  {segments.map((s) => (
                    <g key={s.num}>
                      <path d={s.d} fill={s.fill} stroke="#0E1222" strokeWidth="1.2" />
                      <text x={s.tx} y={s.ty} fill="#fff" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono, monospace" textAnchor="middle" dominantBaseline="central" transform={`rotate(${s.mid} ${s.tx} ${s.ty})`}>
                        {s.num}
                      </text>
                    </g>
                  ))}
                  <circle cx="170" cy="170" r="106" fill="#151B31" stroke="#2B3457" strokeWidth="2" />
                  <circle cx="170" cy="170" r="70" fill="#11162A" stroke="#6E5BFF" strokeWidth="1.5" opacity="0.9" />
                </svg>
              </div>
              <div ref={ballRef} className="absolute inset-0 will-change-transform pointer-events-none">
                <span className="absolute left-1/2 top-[13%] -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                  <motion.div key={result ?? "idle"} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }} className="text-center">
                    {result !== null ? (
                      <span className="font-mono font-extrabold text-4xl text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]" data-testid="roulette-result-badge" style={{ color: colorOf(result) === "black" ? "#fff" : colorHex[colorOf(result)] }}>
                        {result}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-dim">{spinning ? "dreht" : "bereit"}</span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* right side: history + stats */}
            <div className="min-w-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim">Letzte Zahlen</p>
                <span className="font-mono text-[10px] text-dim-2">{history.length} Runden</span>
              </div>
              <div className="flex gap-2 flex-wrap min-h-[44px]" data-testid="roulette-history">
                {history.length === 0 && <span className="text-xs text-dim-2">Noch keine Drehung.</span>}
                <AnimatePresence initial={false}>
                  {history.map((n, i) => (
                    <motion.span
                      key={`${n}-${i}-${history.length}`}
                      initial={{ scale: 0, rotate: 45 }}
                      animate={{ scale: 1, rotate: 45 }}
                      className={`w-9 h-9 flex items-center justify-center border-2 ${i === 0 ? "ring-2 ring-white/60" : ""}`}
                      style={{ backgroundColor: `${colorHex[colorOf(n)]}${colorOf(n) === "black" ? "" : "33"}`, borderColor: colorHex[colorOf(n)], borderRadius: 8 }}
                    >
                      <span className="-rotate-45 font-mono font-bold text-xs" style={{ color: colorOf(n) === "black" ? "#fff" : colorHex[colorOf(n)] }}>
                        {n}
                      </span>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["Rot", history.filter((n) => colorOf(n) === "red").length, "text-danger-2"],
                  ["Schwarz", history.filter((n) => colorOf(n) === "black").length, "text-txt"],
                  ["Zero", history.filter((n) => n === 0).length, "text-win"],
                ].map(([l, v, c]) => (
                  <div key={l} className="rounded-xl bg-surface-2 border border-line px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-dim-2">{l}</p>
                    <p className={`font-mono font-semibold text-lg tabular ${c}`}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone="dim">Zahl ×36</Pill>
                <Pill tone="dim">Dutzend / Kolonne ×3</Pill>
                <Pill tone="dim">Einfache Chance ×2</Pill>
              </div>
            </div>
          </div>
        </Panel>

        {/* betting table */}
        <Panel className="p-4 sm:p-5 overflow-x-auto thin-scroll" data-testid="roulette-table">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[52px_repeat(12,1fr)_52px] gap-1.5">
              <button onClick={() => place("n0")} disabled={spinning} className={`relative row-span-3 rounded-xl border-2 flex items-center justify-center font-mono font-bold text-lg transition-colors ${cellCls(0)}`} data-testid="roulette-cell-0">
                0{bets.n0 && <ChipStack amount={bets.n0} />}
              </button>
              {numberRows.map((row, ri) => (
                <Fragment key={ri}>
                  {row.map((n) => (
                    <button key={n} onClick={() => place(`n${n}`)} disabled={spinning} className={`relative aspect-[1.15] rounded-xl border-2 flex items-center justify-center font-mono font-bold text-sm transition-colors ${cellCls(n)} ${result === n ? "ring-2 ring-white" : ""}`} data-testid={`roulette-cell-${n}`}>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center ${colorOf(n) === "red" ? "bg-danger text-white" : "bg-[#151B31] text-txt border border-line"}`}>{n}</span>
                      {bets[`n${n}`] && <ChipStack amount={bets[`n${n}`]} small />}
                    </button>
                  ))}
                  <button onClick={() => place(`c${3 - ri}`)} disabled={spinning} className="relative rounded-xl border-2 border-line bg-surface-2 text-[11px] font-mono font-bold text-txt-2 hover:border-brand/60 transition-colors" data-testid={`roulette-cell-c${3 - ri}`}>
                    2:1{bets[`c${3 - ri}`] && <ChipStack amount={bets[`c${3 - ri}`]} small />}
                  </button>
                </Fragment>
              ))}
            </div>
            <div className="grid grid-cols-[52px_repeat(3,1fr)_52px] gap-1.5 mt-1.5">
              <span />
              {OUTSIDE.slice(0, 3).map((o) => (
                <button key={o.key} onClick={() => place(o.key)} disabled={spinning} className="relative rounded-xl border-2 border-line bg-surface-2 py-3 text-sm font-bold text-txt-2 hover:border-brand/60 hover:text-txt transition-colors" data-testid={`roulette-cell-${o.key}`}>
                  {o.label}
                  {bets[o.key] && <ChipStack amount={bets[o.key]} />}
                </button>
              ))}
              <span />
            </div>
            <div className="grid grid-cols-[52px_repeat(6,1fr)_52px] gap-1.5 mt-1.5">
              <span />
              {OUTSIDE.slice(3, 9).map((o) => (
                <button
                  key={o.key}
                  onClick={() => place(o.key)}
                  disabled={spinning}
                  className={`relative rounded-xl border-2 py-3 text-sm font-bold transition-colors ${
                    o.tone === "red" ? "bg-danger/25 border-danger/60 text-danger-2 hover:bg-danger/40" : o.tone === "black" ? "bg-[#1A2140] border-line text-txt hover:bg-raised" : "bg-surface-2 border-line text-txt-2 hover:border-brand/60 hover:text-txt"
                  }`}
                  data-testid={`roulette-cell-${o.key}`}
                >
                  {o.label}
                  {bets[o.key] && <ChipStack amount={bets[o.key]} />}
                </button>
              ))}
              <span />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default RouletteGame;
