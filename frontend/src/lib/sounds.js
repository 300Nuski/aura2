let ctx = null;

const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

const note = (c, freq, at, dur, vol = 0.08, type = "sine") => {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
};

export const playWinChime = () => {
  try {
    const c = getCtx();
    const t = c.currentTime;
    note(c, 523.25, t, 0.4, 0.07);
    note(c, 659.25, t + 0.09, 0.4, 0.07);
    note(c, 783.99, t + 0.18, 0.55, 0.09);
    note(c, 1046.5, t + 0.28, 0.6, 0.05);
  } catch {}
};

export const playCashoutChime = () => {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(1320, t + 0.16);
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.3);
    note(c, 1567.98, t + 0.15, 0.5, 0.06);
    note(c, 2093, t + 0.23, 0.5, 0.045);
  } catch {}
};

export const playLoseTone = () => {
  try {
    const c = getCtx();
    const t = c.currentTime;
    note(c, 220, t, 0.35, 0.06, "sawtooth");
    note(c, 164.81, t + 0.12, 0.5, 0.06, "sawtooth");
  } catch {}
};

export const playTick = (pitch = 880, vol = 0.035) => {
  try {
    const c = getCtx();
    note(c, pitch, c.currentTime, 0.06, vol, "square");
  } catch {}
};

export const playReveal = () => {
  try {
    const c = getCtx();
    const t = c.currentTime;
    note(c, 987.77, t, 0.12, 0.05, "triangle");
    note(c, 1318.51, t + 0.05, 0.18, 0.05, "triangle");
  } catch {}
};

export const playExplosion = () => {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const len = 0.5;
    const buffer = c.createBuffer(1, c.sampleRate * len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.2);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + len);
    const g = c.createGain();
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(filter).connect(g).connect(c.destination);
    src.start(t);
    note(c, 110, t, 0.4, 0.08, "sawtooth");
  } catch {}
};

export const playCoinFlip = () => {
  try {
    const c = getCtx();
    const t = c.currentTime;
    for (let i = 0; i < 8; i++) note(c, 1800 + Math.sin(i) * 500, t + i * 0.09, 0.07, 0.025, "triangle");
  } catch {}
};
