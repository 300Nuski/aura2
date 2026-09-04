import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { toast } from "sonner";
import { LoaderPinwheel } from "lucide-react";
import { playWinChime, playLoseTone, playTick } from "@/lib/sounds";
import { recordRound } from "@/lib/rounds";
import { fmt } from "@/lib/format";
import { Panel, Label, PrimaryButton, SmallButton, Pill } from "@/components/common/Bits";
import { BetInput } from "@/components/game/BetInput";

export const WHEELS = {
  low: { label: "Niedrig", segs: [1.5, 1.2, 0, 1.2, 1.4, 1.2, 0, 1.2, 1.5, 1.2, 0, 1.2] },
  medium: { label: "Mittel", segs: [0, 1.9, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0, 1.9] },
  high: { label: "Hoch", segs: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11.8] },
};

const segColor = (m) => (m === 0 ? "#2A3150" : m >= 10 ? "#F5C451" : m >= 2 ? "#C084FC" : m >= 1.5 ? "#38BDF8" : "#3DDC97");

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

export const WheelGame = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(100);
  const [risk, setRisk] = useState("low");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const rotRef = useRef(0);
  const wheelRef = useRef(null);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;
  const segs = WHEELS[risk].segs;
  const SEG = 360 / segs.length;
  const paths = useMemo(() => segs.map((m, i) => ({ m, d: wedge(160, 160, 92, 152, i * SEG, (i + 1) * SEG), mid: i * SEG + SEG / 2, label: polar(160, 160, 124, i * SEG + SEG / 2) })), [segs, SEG]);
  const ev = useMemo(() => segs.reduce((s, m) => s + m, 0) / segs.length, [segs]);

  const spin = () => {
    if (spinning) return;
    const amount = Math.floor(Math.min(Math.max(1, bet), balanceRef.current));
    if (amount < 1) {
      toast.error("Nicht genügend Guthaben.");
      return;
    }
    setBalance((b) => b - amount);
    setSpinning(true);
    setResult(null);
    const idx = Math.floor(Math.random() * segs.length);
    const m = segs[idx];
    const payout = Math.floor(amount * m);
    const targetMod = 360 - (idx * SEG + SEG / 2) + (Math.random() - 0.5) * SEG * 0.6;
    const cur = rotRef.current % 360;
    const delta = ((targetMod - cur) % 360 + 360) % 360;
    const target = rotRef.current + 360 * 5 + delta;
    let lastSeg = -1;
    animate(rotRef.current, target, {
      duration: 4,
      ease: [0.12, 0.8, 0.1, 1],
      onUpdate: (v) => {
        rotRef.current = v;
        if (wheelRef.current) wheelRef.current.style.transform = `rotate(${v}deg)`;
        const s = Math.floor(((360 - (v % 360)) % 360) / SEG);
        if (s !== lastSeg) {
          lastSeg = s;
          playTick(900, 0.012);
        }
      },
      onComplete: () => {
        setResult({ m, payout, amount });
        setHistory((h) => [{ id: Date.now(), m }, ...h].slice(0, 14));
        if (payout > 0) {
          setBalance((b) => b + payout);
          playWinChime();
          toast.success(`${m}x · +${payout.toLocaleString("de-DE")} €`);
        } else playLoseTone();
        recordRound({ game: "Wheel", bet: amount, mult: m, payout, meta: { risk } });
        setSpinning(false);
      },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4" data-testid="wheel-game">
      <div className="order-2 lg:order-1 flex flex-col gap-4">
        <Panel className="p-5">
          <BetInput value={bet} onChange={setBet} disabled={spinning} balance={balance} testId="wheel" />
          <Label className="mt-5">Risiko</Label>
          <div className="grid grid-cols-3 gap-2" data-testid="wheel-risk-select">
            {Object.entries(WHEELS).map(([id, w]) => (
              <SmallButton key={id} active={risk === id} onClick={() => setRisk(id)} disabled={spinning} data-testid={`wheel-risk-${id}`}>
                {w.label}
              </SmallButton>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-surface-2 border border-line px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-dim">Max. Gewinn</span>
            <span className="font-mono font-semibold text-win tabular" data-testid="wheel-max-win">
              {fmt(Math.floor(bet * Math.max(...segs)))}
            </span>
          </div>
          <PrimaryButton onClick={spin} disabled={spinning || bet < 1} className="w-full py-4 text-base mt-4" data-testid="wheel-spin-button">
            <LoaderPinwheel className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`} /> {spinning ? "Dreht …" : `Drehen · ${fmt(bet)}`}
          </PrimaryButton>
          <p className="text-[10px] text-dim-2 text-center mt-2">Auszahlungsquote {(ev * 100).toFixed(1)} %</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Segmente</p>
          <div className="flex gap-2 flex-wrap">
            {[...new Set(segs)].sort((a, b) => a - b).map((m) => (
              <span key={m} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-mono font-semibold">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segColor(m) }} /> {m}x · {segs.filter((x) => x === m).length}×
              </span>
            ))}
          </div>
        </Panel>
      </div>
      <div className="order-1 lg:order-2 flex flex-col gap-4 min-w-0">
        <Panel className="p-6 relative overflow-hidden flex flex-col items-center min-h-[460px]">
          <div className="absolute -right-24 -bottom-24 w-[420px] h-[420px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(56,189,248,0.16) 0%, rgba(56,189,248,0) 60%)" }} />
          <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px]" data-testid="wheel-svg-wrap">
            <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <div ref={wheelRef} className="w-full h-full will-change-transform">
              <svg viewBox="0 0 320 320" className="w-full h-full">
                <circle cx="160" cy="160" r="158" fill="#0E1222" stroke="#2B3457" strokeWidth="2" />
                {paths.map((p, i) => (
                  <g key={i}>
                    <path d={p.d} fill={segColor(p.m)} stroke="#0E1222" strokeWidth="2" />
                    <text x={p.label[0]} y={p.label[1]} fill={p.m === 0 ? "#8B93B8" : "#0A0D19"} fontSize="12" fontWeight="800" fontFamily="JetBrains Mono, monospace" textAnchor="middle" dominantBaseline="central" transform={`rotate(${p.mid} ${p.label[0]} ${p.label[1]})`}>
                      {p.m === 0 ? "0" : `${p.m}x`}
                    </text>
                  </g>
                ))}
                <circle cx="160" cy="160" r="90" fill="#151B31" stroke="#2B3457" strokeWidth="2" />
                <circle cx="160" cy="160" r="60" fill="#11162A" stroke="#6E5BFF" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div key={result ? `${result.m}-${result.payout}` : spinning ? "spin" : "idle"} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }} className="text-center">
                  {result ? (
                    <p className={`font-mono font-extrabold text-3xl tabular ${result.m > 0 ? "text-win" : "text-danger"}`} data-testid="wheel-result">
                      {result.m}x
                    </p>
                  ) : (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-dim">{spinning ? "dreht" : "bereit"}</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-dim">{result ? (result.m > 0 ? `Gewonnen · +${result.payout.toLocaleString("de-DE")} €` : `Leer · −${result.amount.toLocaleString("de-DE")} €`) : spinning ? "Das Rad dreht …" : "Risiko wählen und drehen"}</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Letzte Drehungen</p>
          <div className="flex gap-2 flex-wrap min-h-[32px]" data-testid="wheel-history">
            {history.length === 0 && <span className="text-xs text-dim-2">Noch keine Drehung.</span>}
            {history.map((h) => (
              <Pill key={h.id} tone={h.m >= 10 ? "amber" : h.m > 0 ? "win" : "loss"}>
                {h.m}x
              </Pill>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};
