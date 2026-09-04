import { simulateRound } from "../frontend/src/lib/sweetEngine.js";
const N = Number(process.argv[2] || 200000);
const run = (ante, buy) => {
  let sum = 0, trig = 0, fsSpins = 0, max = 0, hits = 0;
  for (let i = 0; i < N; i++) {
    const r = simulateRound(Math.random, ante, buy);
    sum += r.total; if (r.triggered) trig++; fsSpins += r.freeSpins; if (r.total > max) max = r.total; if (r.total > 0) hits++;
  }
  const cost = buy ? 100 : ante ? 1.25 : 1;
  console.log(`${buy ? "BUY " : ante ? "ANTE" : "BASE"} RTP=${((sum / N / cost) * 100).toFixed(2)}% trig=1/${(N / Math.max(1, trig)).toFixed(0)} avgFS=${(fsSpins / Math.max(1, trig)).toFixed(1)} hit=${((hits / N) * 100).toFixed(1)}% max=${max.toFixed(0)}x`);
};
run(false, false); run(true, false); run(false, true);
