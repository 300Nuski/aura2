import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Target } from "lucide-react";
import { playTick, playWinChime, playLoseTone } from "@/lib/sounds";
import { recordRound } from "@/lib/rounds";
import { fmt } from "@/lib/format";
import { Panel, Label, PrimaryButton, SmallButton, Pill } from "@/components/common/Bits";
import { BetInput } from "@/components/game/BetInput";

export const PLINKO_TABLES = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

const RISKS = [
  { id: "low", label: "Niedrig" },
  { id: "medium", label: "Mittel" },
  { id: "high", label: "Hoch" },
];

const bucketColor = (m, max) => {
  const t = Math.min(1, Math.log10(1 + m) / Math.log10(1 + max));
  // amber → red gradient for high multipliers, teal for low
  if (m < 1) return "#6AA8FF";
  const r = Math.round(255);
  const g = Math.round(200 - t * 150);
  const b = Math.round(80 - t * 60);
  return `rgb(${r},${g},${b})`;
};

export const PlinkoGame = ({ balance, setBalance }) => {
  const [bet, setBet] = useState(50);
  const [rows, setRows] = useState(12);
  const [risk, setRisk] = useState("medium");
  const [history, setHistory] = useState([]);
  const [active, setActive] = useState(0);
  const [lastHit, setLastHit] = useState(null);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const balls = useRef([]);
  const balanceRef = useRef(balance);
  balanceRef.current = balance;
  const table = useMemo(() => PLINKO_TABLES[rows][risk], [rows, risk]);
  const tableRef = useRef(table);
  tableRef.current = table;
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const hitRef = useRef({});

  // ---- render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let W = 0;
    let H = 0;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.floor(r.width);
      H = Math.floor(r.height);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const geom = () => {
      const n = rowsRef.current;
      const padT = 26;
      const padB = 58;
      const usableH = H - padT - padB;
      const gapY = usableH / n;
      const gapX = Math.min(gapY * 1.15, (W - 40) / (n + 2));
      const cx = W / 2;
      return { n, padT, gapY, gapX, cx, pinR: Math.max(2.5, gapX * 0.12), ballR: Math.max(5, gapX * 0.22) };
    };
    const pinPos = (g, row, i) => {
      // row r has r+3 pins, centered
      const count = row + 3;
      const x = g.cx + (i - (count - 1) / 2) * g.gapX;
      const y = g.padT + row * g.gapY + g.gapY * 0.5;
      return [x, y];
    };

    const frame = (now) => {
      ctx.clearRect(0, 0, W, H);
      const g = geom();
      // pins
      ctx.fillStyle = "rgba(195,201,230,0.85)";
      for (let r = 0; r < g.n; r++) {
        for (let i = 0; i < r + 3; i++) {
          const [x, y] = pinPos(g, r, i);
          ctx.beginPath();
          ctx.arc(x, y, g.pinR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // buckets
      const t = tableRef.current;
      const max = Math.max(...t);
      const by = g.padT + g.n * g.gapY + 10;
      const bw = g.gapX * 0.9;
      const bh = 30;
      t.forEach((m, i) => {
        const x = g.cx + (i - (t.length - 1) / 2) * g.gapX;
        const hit = hitRef.current[i];
        const bump = hit ? Math.max(0, 1 - (now - hit) / 320) : 0;
        const c = bucketColor(m, max);
        ctx.fillStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = bump ? 22 : 0;
        const yy = by + bump * 6;
        const r = 7;
        ctx.beginPath();
        ctx.moveTo(x - bw / 2 + r, yy);
        ctx.arcTo(x + bw / 2, yy, x + bw / 2, yy + bh, r);
        ctx.arcTo(x + bw / 2, yy + bh, x - bw / 2, yy + bh, r);
        ctx.arcTo(x - bw / 2, yy + bh, x - bw / 2, yy, r);
        ctx.arcTo(x - bw / 2, yy, x + bw / 2, yy, r);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#0A0D19";
        ctx.font = `700 ${bw < 34 ? 9 : 11}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(m >= 100 ? `${m}` : `${m}x`, x, yy + bh / 2);
      });
      // balls
      const alive = [];
      for (const b of balls.current) {
        const elapsed = now - b.start;
        const stepMs = b.stepMs;
        const stepF = elapsed / stepMs;
        const step = Math.floor(stepF);
        if (step >= g.n + 1) {
          if (!b.done) {
            b.done = true;
            b.onLand();
          }
          continue;
        }
        const k = stepF - step;
        // position: from pin (step-1) to pin (step) using path offsets
        const offA = b.offsets[step] ?? 0;
        const offB = b.offsets[step + 1] ?? offA;
        const rowA = step - 1;
        const rowB = step;
        const yA = rowA < 0 ? g.padT - g.gapY * 0.4 : g.padT + rowA * g.gapY + g.gapY * 0.5;
        const yB = rowB >= g.n ? by - g.ballR : g.padT + rowB * g.gapY + g.gapY * 0.5;
        const xA = g.cx + offA * g.gapX;
        const xB = g.cx + offB * g.gapX;
        const ease = k * k;
        const x = xA + (xB - xA) * k;
        const y = yA + (yB - yA) * ease - Math.sin(k * Math.PI) * g.gapY * 0.35;
        if (step !== b.lastStep) {
          b.lastStep = step;
          if (step > 0 && step <= g.n) playTick(700 + Math.random() * 300, 0.012);
        }
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(x, y - g.ballR * 0.6, g.ballR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        alive.push(b);
      }
      balls.current = alive;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const drop = () => {
    const amount = Math.floor(Math.min(Math.max(1, bet), balanceRef.current));
    if (amount < 1) {
      toast.error("Nicht genügend Guthaben.");
      return;
    }
    if (balls.current.length >= 6) return;
    setBalance((b) => b - amount);
    const n = rows;
    const t = table;
    // random walk: offsets in units of gapX (half steps)
    const offsets = [0];
    let pos = 0;
    let rights = 0;
    for (let r = 0; r < n; r++) {
      const right = Math.random() < 0.5;
      pos += right ? 0.5 : -0.5;
      if (right) rights++;
      offsets.push(pos);
    }
    offsets.push(pos);
    const bucket = rights;
    const mult = t[bucket];
    const payout = Math.floor(amount * mult);
    const color = mult >= 10 ? "#F5C451" : mult >= 1 ? "#FF8A5B" : "#6AA8FF";
    setActive((a) => a + 1);
    balls.current.push({
      start: performance.now(),
      stepMs: Math.max(95, 190 - n * 5),
      offsets,
      color,
      lastStep: -1,
      onLand: () => {
        hitRef.current[bucket] = performance.now();
        setActive((a) => Math.max(0, a - 1));
        if (payout > 0) setBalance((b) => b + payout);
        setHistory((h) => [{ id: Date.now() + Math.random(), mult, won: mult >= 1 }, ...h].slice(0, 14));
        setLastHit({ mult, payout, amount });
        recordRound({ game: "Plinko", bet: amount, mult, payout, meta: { rows: n, risk, bucket } });
        if (mult >= 1) playWinChime();
        else playLoseTone();
      },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4" data-testid="plinko-game">
      <div className="order-2 lg:order-1 flex flex-col gap-4">
        <Panel className="p-5">
          <BetInput value={bet} onChange={setBet} balance={balance} testId="plinko" />
          <Label className="mt-5">Risiko</Label>
          <div className="grid grid-cols-3 gap-2" data-testid="plinko-risk-select">
            {RISKS.map((r) => (
              <SmallButton key={r.id} active={risk === r.id} onClick={() => setRisk(r.id)} disabled={active > 0} data-testid={`plinko-risk-${r.id}`}>
                {r.label}
              </SmallButton>
            ))}
          </div>
          <Label className="mt-5">Reihen</Label>
          <div className="grid grid-cols-3 gap-2" data-testid="plinko-rows-select">
            {[8, 12, 16].map((r) => (
              <SmallButton key={r} active={rows === r} onClick={() => setRows(r)} disabled={active > 0} data-testid={`plinko-rows-${r}`}>
                {r}
              </SmallButton>
            ))}
          </div>
          <PrimaryButton onClick={drop} disabled={bet < 1 || active >= 6} className="w-full py-4 text-base mt-5" data-testid="plinko-drop-button">
            <Target className="w-4 h-4" /> Kugel fallen lassen · {fmt(bet)}
          </PrimaryButton>
          <p className="text-[10px] text-dim-2 text-center mt-2">Bis zu 6 Kugeln gleichzeitig · {active} aktiv</p>
          {lastHit && (
            <div className={`mt-4 rounded-xl border px-4 py-3 flex items-center justify-between ${lastHit.mult >= 1 ? "bg-win/10 border-win/30" : "bg-danger/10 border-danger/30"}`} data-testid="plinko-last-result">
              <span className="text-xs font-semibold text-txt-2">Gelandet bei {lastHit.mult}x</span>
              <span className={`font-mono text-sm font-semibold tabular ${lastHit.payout >= lastHit.amount ? "text-win" : "text-danger"}`}>{lastHit.payout >= lastHit.amount ? "+" : "−"}{Math.abs(lastHit.payout - lastHit.amount).toLocaleString("de-DE")} €</span>
            </div>
          )}
        </Panel>
        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim mb-3">Letzte Treffer</p>
          <div className="flex gap-2 flex-wrap min-h-[32px]" data-testid="plinko-history">
            {history.length === 0 && <span className="text-xs text-dim-2">Noch keine Kugel gefallen.</span>}
            {history.map((h) => (
              <Pill key={h.id} tone={h.mult >= 10 ? "amber" : h.won ? "win" : "loss"}>
                {h.mult}x
              </Pill>
            ))}
          </div>
        </Panel>
      </div>
      <div className="order-1 lg:order-2 min-w-0">
        <Panel className="p-3 relative overflow-hidden" style={{ minHeight: "min(calc(100vh - 6.5rem), 820px)" }}>
          <div className="absolute -left-20 -top-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,138,91,0.16) 0%, rgba(255,138,91,0) 60%)" }} />
          <div ref={wrapRef} className="relative w-full h-[520px] lg:h-[calc(100vh-8.2rem)] lg:min-h-[520px] lg:max-h-[780px] rounded-xl overflow-hidden" style={{ background: "linear-gradient(180deg,#131833 0%,#0B0F1F 100%)" }} data-testid="plinko-board">
            <canvas ref={canvasRef} className="block" />
          </div>
        </Panel>
      </div>
    </div>
  );
};
