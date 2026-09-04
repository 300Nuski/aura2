/**
 * Sweet Bonanza style slot engine (pure functions, no React).
 * 6x5 grid, pay-anywhere (8+), tumble cascades, scatter free spins,
 * multiplier bombs during free spins, ante bet, buy feature.
 * RTP target ~96 % (tuned via simulation, see scripts/simSweet.js).
 */

export const COLS = 6;
export const ROWS = 5;
export const REGULARS = ["blueberry", "lemon", "kiwi", "watermelon", "orange", "plum", "jelly", "donut", "cupcake"];
export const SCATTER = "jar";
export const BOMB = "multijar";

// pays as multiple of bet for 8-9 / 10-11 / 12+
export const PAYTABLE = {
  blueberry: [0.25, 0.75, 2],
  lemon: [0.4, 0.9, 4],
  kiwi: [0.5, 1, 5],
  watermelon: [0.8, 1.2, 8],
  orange: [1, 1.5, 10],
  plum: [1.5, 2, 12],
  jelly: [2, 5, 15],
  donut: [2.5, 10, 25],
  cupcake: [10, 25, 50],
};
export const SCATTER_PAYS = { 4: 3, 5: 5, 6: 100 };
export const FREE_SPINS_AWARD = 10;
export const FREE_SPINS_RETRIGGER = 5;
export const BUY_COST = 100; // x bet
export const ANTE_COST = 1.25; // x bet

const BASE_WEIGHTS = {
  blueberry: 24,
  lemon: 22,
  kiwi: 20,
  watermelon: 16,
  orange: 13,
  plum: 10,
  jelly: 7,
  donut: 4.5,
  cupcake: 2.55,
  [SCATTER]: 2.55,
};
const ANTE_SCATTER_FACTOR = 1.18;
const FS_WEIGHTS = { ...BASE_WEIGHTS, [SCATTER]: 3.9, [BOMB]: 17 };
const BOMB_VALUES = [
  [2, 22],
  [3, 18],
  [4, 14],
  [5, 12],
  [6, 9],
  [8, 8],
  [10, 7],
  [12, 5],
  [15, 4],
  [20, 2.6],
  [25, 2.2],
  [50, 1.0],
  [100, 0.5],
];

const makePicker = (weights) => {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  return (rng) => {
    let r = rng() * total;
    for (const [k, w] of entries) {
      r -= w;
      if (r <= 0) return k;
    }
    return entries[entries.length - 1][0];
  };
};

const pickBase = makePicker(BASE_WEIGHTS);
const pickBaseAnte = makePicker({ ...BASE_WEIGHTS, [SCATTER]: BASE_WEIGHTS[SCATTER] * ANTE_SCATTER_FACTOR });
const pickFS = makePicker(FS_WEIGHTS);
const pickBombValue = makePicker(Object.fromEntries(BOMB_VALUES.map(([v, w]) => [String(v), w])));

let keyCounter = 1;
export const resetKeys = () => {
  keyCounter = 1;
};

export const newCell = (mode, rng = Math.random, ante = false) => {
  const type = mode === "fs" ? pickFS(rng) : ante ? pickBaseAnte(rng) : pickBase(rng);
  const cell = { key: keyCounter++, type, col: 0, row: 0 };
  if (type === BOMB) cell.mult = Number(pickBombValue(rng));
  return cell;
};

export const fillGrid = (mode, rng = Math.random, ante = false) => {
  const cells = [];
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const c = newCell(mode, rng, ante);
      c.col = col;
      c.row = row;
      cells.push(c);
    }
  }
  return cells;
};

export const payFor = (type, count) => {
  const p = PAYTABLE[type];
  if (!p) return 0;
  if (count >= 12) return p[2];
  if (count >= 10) return p[1];
  if (count >= 8) return p[0];
  return 0;
};

/** Evaluate a grid → { win (x bet), winKeys:Set, groups:[{type,count,pay}] } */
export const evaluate = (cells) => {
  const counts = {};
  for (const c of cells) if (PAYTABLE[c.type]) counts[c.type] = (counts[c.type] || 0) + 1;
  let win = 0;
  const winKeys = new Set();
  const groups = [];
  for (const [t, n] of Object.entries(counts)) {
    const pay = payFor(t, n);
    if (pay > 0) {
      win += pay;
      groups.push({ type: t, count: n, pay });
      for (const c of cells) if (c.type === t) winKeys.add(c.key);
    }
  }
  groups.sort((a, b) => b.pay - a.pay);
  return { win, winKeys, groups };
};

export const countScatters = (cells) => cells.filter((c) => c.type === SCATTER).length;
export const bombsOn = (cells) => cells.filter((c) => c.type === BOMB);

/** Remove winning cells, collapse columns, refill from top. Returns { cells, fresh:Set } */
export const tumble = (cells, winKeys, mode, rng = Math.random, ante = false) => {
  const next = [];
  const fresh = new Set();
  for (let col = 0; col < COLS; col++) {
    const survivors = cells.filter((c) => c.col === col && !winKeys.has(c.key)).sort((a, b) => a.row - b.row);
    const missing = ROWS - survivors.length;
    const column = [];
    for (let i = 0; i < missing; i++) {
      const c = newCell(mode, rng, ante);
      c.col = col;
      fresh.add(c.key);
      column.push(c);
    }
    column.push(...survivors);
    column.forEach((c, row) => {
      c.row = row;
      next.push(c);
    });
  }
  return { cells: next, fresh };
};

/**
 * Resolve a full spin synchronously (used for simulation and as source of truth).
 * Returns list of steps for the UI to animate:
 * steps: [{ cells, win, winKeys, groups }, ...] where the last step has no win.
 */
export const resolveSpin = (mode, rng = Math.random, ante = false) => {
  let cells = fillGrid(mode, rng, ante);
  const steps = [];
  let total = 0;
  for (let i = 0; i < 40; i++) {
    const ev = evaluate(cells);
    steps.push({ cells, win: ev.win, winKeys: ev.winKeys, groups: ev.groups });
    if (ev.win <= 0) break;
    total += ev.win;
    const t = tumble(cells, ev.winKeys, mode, rng, ante);
    cells = t.cells;
    steps[steps.length - 1].fresh = t.fresh;
  }
  const scatters = countScatters(steps[0].cells);
  const scatterPay = mode === "base" ? SCATTER_PAYS[Math.min(6, scatters)] || 0 : 0;
  let bombMult = 0;
  if (mode === "fs" && total > 0) {
    // bombs stay on screen through tumbles; all bombs visible at the end are summed
    bombMult = bombsOn(cells).reduce((s, c) => s + c.mult, 0);
  }
  const finalWin = total * (bombMult > 0 ? bombMult : 1) + scatterPay;
  return { steps, tumbleWin: total, bombMult, scatterPay, win: finalWin, scatters, finalCells: cells };
};

/** Full round simulation (base spin + potential free spins). Returns total win in x bet. */
export const simulateRound = (rng = Math.random, ante = false, buy = false) => {
  let total = 0;
  let scatters;
  if (buy) {
    scatters = 4;
  } else {
    const base = resolveSpin("base", rng, ante);
    total += base.win;
    scatters = base.scatters;
  }
  let fs = scatters >= 4 ? FREE_SPINS_AWARD : 0;
  let played = 0;
  while (fs > 0 && played < 500) {
    fs--;
    played++;
    const r = resolveSpin("fs", rng, false);
    total += r.win;
    if (r.scatters >= 3) fs += FREE_SPINS_RETRIGGER;
  }
  return { total, freeSpins: played, triggered: scatters >= 4 };
};

export const winTier = (winX) => {
  if (winX >= 500) return { id: "legendary", label: "Legendärer Gewinn", color: "#F5C451" };
  if (winX >= 100) return { id: "epic", label: "Epic Win", color: "#C084FC" };
  if (winX >= 50) return { id: "mega", label: "Mega Win", color: "#FF8A5B" };
  if (winX >= 20) return { id: "big", label: "Big Win", color: "#3DDC97" };
  return null;
};
