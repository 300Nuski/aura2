import { useEffect, useRef } from "react";
import RocketShip from "@/components/RocketShip";

/**
 * CrashGraphCanvas
 * ---------------------------------------------------------------
 * Renders the crash flight curve on a 2D canvas with its own rAF
 * loop. Nothing here goes through React state per frame:
 *  - the curve is analytic: m(t) = exp(growth * t)  → we can always
 *    draw it from the origin to the tip, no point buffer, no drop-off
 *  - axis domains grow continuously (not quantized) → no jitter
 *  - the rocket is a DOM overlay positioned via ref/transform, its
 *    rotation is the analytic tangent of the rendered curve
 *  - crash FX (particles, shockwave, red curve) run on the canvas
 */

const PAD = { l: 52, r: 28, t: 36, b: 34 };
const CURVE_SAMPLES = 160;
const TANGENT_DT = 140; // ms used to compute tangent direction
const CRASH_FX_MS = 1400;

const COLORS = {
  run: "#3DDC97",
  runSoft: "rgba(61,220,151,0.9)",
  runGlow: "rgba(61,220,151,0.55)",
  crash: "#FF5470",
  crashGlow: "rgba(255,84,112,0.6)",
  grid: "rgba(139,147,184,0.12)",
  label: "rgba(139,147,184,0.8)",
};

const niceStep = (range, targetLines) => {
  const raw = range / targetLines;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const candidates = [1, 2, 2.5, 5, 10].map((c) => c * pow);
  return candidates.find((c) => c >= raw) || candidates[candidates.length - 1];
};

const makeStars = (count) =>
  Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.1 + 0.3,
    o: Math.random() * 0.45 + 0.15,
    ph: Math.random() * Math.PI * 2,
    sp: 0.6 + Math.random() * 1.2,
  }));

const spawnParticles = (x, y) => {
  const ps = [];
  for (let i = 0; i < 46; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 260;
    ps.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 40,
      r: 1.5 + Math.random() * 3.2,
      life: 0.7 + Math.random() * 0.7,
      color: ["#FF4D6D", "#FF9F1C", "#FFD32A", "#FFFFFF", "#FF6B7A"][i % 5],
    });
  }
  return ps;
};

const CrashGraphCanvas = ({ phase, roundStart, crashPoint, growth, className = "", showMultiplier = true, multiplierPosition = "center" }) => {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const rocketRef = useRef(null);
  const multRef = useRef(null);
  const starsRef = useRef(makeStars(70));
  const st = useRef({
    phase: "waiting",
    roundStart: 0,
    crashPoint: null,
    growth: 0.00013,
    crashAt: 0,
    crashTip: null,
    particles: [],
    lastAngle: 0,
  });

  // Sync props into the mutable render state (no per-frame React work)
  useEffect(() => {
    const s = st.current;
    if (phase === "crashed" && s.phase !== "crashed") {
      s.crashAt = performance.now();
      s.pendingSpawn = true;
    }
    if (phase === "running" && s.phase !== "running") {
      s.particles = [];
      s.crashTip = null;
    }
    s.phase = phase;
    s.roundStart = roundStart;
    s.crashPoint = crashPoint;
    s.growth = growth;
  }, [phase, roundStart, crashPoint, growth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let lastFrame = performance.now();

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(200, Math.floor(rect.width));
      H = Math.max(160, Math.floor(rect.height));
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const drawBackground = (now) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#131833");
      g.addColorStop(1, "#0B0F1F");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // violet + teal ambient glows (reference look)
      const rg = ctx.createRadialGradient(W * 0.75, H * 0.2, 10, W * 0.75, H * 0.2, W * 0.6);
      rg.addColorStop(0, "rgba(110,91,255,0.20)");
      rg.addColorStop(1, "rgba(110,91,255,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
      const rg2 = ctx.createRadialGradient(W * 0.15, H * 0.9, 10, W * 0.15, H * 0.9, W * 0.5);
      rg2.addColorStop(0, "rgba(61,220,151,0.10)");
      rg2.addColorStop(1, "rgba(61,220,151,0)");
      ctx.fillStyle = rg2;
      ctx.fillRect(0, 0, W, H);
      // stars
      const t = now / 1000;
      for (const s of starsRef.current) {
        const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        ctx.globalAlpha = s.o * (0.35 + 0.65 * tw);
        ctx.fillStyle = "#BFDBFE";
        ctx.beginPath();
        ctx.arc(PAD.l + s.x * (W - PAD.l - PAD.r), PAD.t + s.y * (H - PAD.t - PAD.b), s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawGrid = (gx, gy, maxT, maxM) => {
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 7]);
      ctx.fillStyle = COLORS.label;
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      // y ticks (multiplier)
      const yStep = niceStep(maxM - 1, 4);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const firstTick = yStep >= 1 ? yStep : 1 + yStep;
      ctx.fillText("1.00x", PAD.l - 8, gy(1));
      for (let m = firstTick; m <= maxM + 1e-6; m += yStep) {
        if (m <= 1) continue;
        const y = gy(m);
        if (y < PAD.t - 1) break;
        ctx.beginPath();
        ctx.moveTo(PAD.l, y);
        ctx.lineTo(W - PAD.r, y);
        ctx.stroke();
        ctx.fillText(`${m.toFixed(m < 10 ? 2 : 0)}x`, PAD.l - 8, y);
      }
      // x ticks (seconds)
      const secs = maxT / 1000;
      const xStep = niceStep(secs, 5);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let s = xStep; s <= secs + 1e-6; s += xStep) {
        const x = gx(s * 1000);
        ctx.beginPath();
        ctx.moveTo(x, PAD.t);
        ctx.lineTo(x, H - PAD.b);
        ctx.stroke();
        ctx.fillText(`${s}s`, x, H - PAD.b + 8);
      }
      ctx.setLineDash([]);
      // baseline
      ctx.strokeStyle = "rgba(139,147,184,0.25)";
      ctx.beginPath();
      ctx.moveTo(PAD.l, H - PAD.b);
      ctx.lineTo(W - PAD.r, H - PAD.b);
      ctx.moveTo(PAD.l, PAD.t);
      ctx.lineTo(PAD.l, H - PAD.b);
      ctx.stroke();
    };

    const drawCurve = (gx, gy, elapsed, growth, crashed) => {
      const color = crashed ? COLORS.crash : COLORS.run;
      const glow = crashed ? COLORS.crashGlow : COLORS.runGlow;
      const pts = [];
      for (let i = 0; i <= CURVE_SAMPLES; i++) {
        const t = (elapsed * i) / CURVE_SAMPLES;
        pts.push([gx(t), gy(Math.exp(growth * t))]);
      }
      // area under curve
      const area = ctx.createLinearGradient(0, PAD.t, 0, H - PAD.b);
      area.addColorStop(0, crashed ? "rgba(255,84,112,0.30)" : "rgba(61,220,151,0.30)");
      area.addColorStop(1, crashed ? "rgba(255,84,112,0.0)" : "rgba(61,220,151,0.0)");
      ctx.beginPath();
      ctx.moveTo(pts[0][0], H - PAD.b);
      for (const p of pts) ctx.lineTo(p[0], p[1]);
      ctx.lineTo(pts[pts.length - 1][0], H - PAD.b);
      ctx.closePath();
      ctx.fillStyle = area;
      ctx.fill();
      // glow stroke
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.shadowColor = glow;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      // bright core
      ctx.strokeStyle = crashed ? "rgba(255,200,210,0.85)" : "rgba(220,255,236,0.85)";
      ctx.lineWidth = 1.1;
      ctx.stroke();
      return pts[pts.length - 1];
    };

    const drawTip = (x, y, crashed) => {
      ctx.shadowColor = crashed ? COLORS.crashGlow : COLORS.runGlow;
      ctx.shadowBlur = 22;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const drawParticles = (dt) => {
      const s = st.current;
      if (!s.particles.length) return;
      const alive = [];
      for (const p of s.particles) {
        p.life -= dt;
        if (p.life <= 0) continue;
        p.vy += 380 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        alive.push(p);
      }
      ctx.globalAlpha = 1;
      s.particles = alive;
    };

    const drawShockwave = (x, y, sinceCrash) => {
      const k = Math.min(1, sinceCrash / 0.9);
      if (k >= 1) return;
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = "#FF9F9F";
      ctx.lineWidth = 2.5 * (1 - k) + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 8 + k * 110, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const setRocket = (visible, x, y, angleDeg, extra = "") => {
      const el = rocketRef.current;
      if (!el) return;
      if (!visible) {
        el.style.opacity = "0";
        return;
      }
      el.style.opacity = "1";
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${angleDeg.toFixed(2)}deg) ${extra}`;
    };

    const frame = (now) => {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      const s = st.current;
      ctx.clearRect(0, 0, W, H);
      drawBackground(now);

      const running = s.phase === "running";
      const crashed = s.phase === "crashed";

      let elapsed = 0;
      if (running) elapsed = Math.max(0, now - s.roundStart);
      else if (crashed && s.crashPoint) elapsed = Math.log(s.crashPoint) / s.growth;

      const mNow = running || crashed ? Math.exp(s.growth * elapsed) : 1;
      // continuous domains → no jitter; tip stays ~87% right once the round is long
      const maxT = Math.max(8000, elapsed * 1.15);
      const maxM = Math.max(2, mNow * 1.22);
      const gx = (t) => PAD.l + (t / maxT) * (W - PAD.l - PAD.r);
      const gy = (m) => H - PAD.b - ((m - 1) / (maxM - 1)) * (H - PAD.t - PAD.b);

      drawGrid(gx, gy, maxT, maxM);

      if (!running && !crashed) {
        // waiting: rocket idles on the launch pad
        const x0 = gx(0);
        const y0 = gy(1);
        ctx.shadowColor = COLORS.runGlow;
        ctx.shadowBlur = 16;
        ctx.fillStyle = COLORS.run;
        ctx.beginPath();
        ctx.arc(x0, y0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        s.lastAngle = -12;
        setRocket(true, x0 + 30 - 48, y0 - 10 - 34, -12);
        if (multRef.current) multRef.current.textContent = "";
        raf = requestAnimationFrame(frame);
        return;
      }

      const [tx, ty] = drawCurve(gx, gy, elapsed, s.growth, crashed);
      // analytic tangent of the *rendered* curve at the tip
      const tPrev = Math.max(0, elapsed - TANGENT_DT);
      const px = gx(tPrev);
      const py = gy(Math.exp(s.growth * tPrev));
      let angle = s.lastAngle;
      if (elapsed > 30) angle = (Math.atan2(ty - py, tx - px) * 180) / Math.PI;
      // mild smoothing to kill any sub-pixel noise from very short tangents
      s.lastAngle = s.lastAngle + (angle - s.lastAngle) * Math.min(1, dt * 14);
      const a = s.lastAngle;
      const rad = (a * Math.PI) / 180;

      if (running) {
        drawTip(tx, ty, false);
        // rocket sits slightly ahead of the tip along the tangent (its engine at the beam head)
        const cx = tx + Math.cos(rad) * 30;
        const cy = ty + Math.sin(rad) * 30;
        setRocket(true, cx - 48, cy - 34, a);
        if (multRef.current) multRef.current.textContent = `${(Math.floor(mNow * 100) / 100).toFixed(2)}x`;
      } else {
        // crashed: freeze curve (red), explode, rocket tumbles down & fades
        if (s.pendingSpawn) {
          s.pendingSpawn = false;
          s.crashTip = [tx, ty];
          s.particles = spawnParticles(tx, ty);
        }
        const since = (now - s.crashAt) / 1000;
        drawShockwave(tx, ty, since);
        drawParticles(dt);
        const fall = Math.min(1, since / (CRASH_FX_MS / 1000));
        const cx = tx + Math.cos(rad) * 30 + since * 40;
        const cy = ty + Math.sin(rad) * 30 + 260 * fall * fall;
        const op = Math.max(0, 1 - fall * 1.15);
        const el = rocketRef.current;
        if (el) {
          el.style.opacity = String(op);
          el.style.transform = `translate3d(${(cx - 48).toFixed(2)}px, ${(cy - 34).toFixed(2)}px, 0) rotate(${(a + fall * 140).toFixed(2)}deg)`;
        }
        if (multRef.current) multRef.current.textContent = `${s.crashPoint.toFixed(2)}x`;
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`relative w-full overflow-hidden ${className}`} data-testid="crash-graph">
      <canvas ref={canvasRef} className="block" />
      <div
        ref={rocketRef}
        className="absolute left-0 top-0 w-[96px] h-[68px] pointer-events-none will-change-transform"
        style={{ opacity: 0 }}
        data-testid="crash-rocket"
      >
        <RocketShip thrusting={phase === "running"} className="w-full h-full drop-shadow-[0_0_18px_rgba(61,220,151,0.55)]" />
      </div>
      {showMultiplier && (
        <div className={`absolute pointer-events-none select-none ${multiplierPosition === "center" ? "inset-0 flex items-center justify-center" : "left-14 top-4"}`}>
          <p
            ref={multRef}
            className={`font-display font-extrabold tracking-[-0.04em] tabular-nums leading-none ${
              multiplierPosition === "center" ? "text-6xl sm:text-7xl lg:text-8xl drop-shadow-[0_8px_40px_rgba(0,0,0,0.6)]" : "text-5xl sm:text-6xl"
            } ${phase === "crashed" ? "text-[#FF5470]" : "text-white"}`}
            data-testid="crash-multiplier-display"
          />
        </div>
      )}
    </div>
  );
};

export default CrashGraphCanvas;
