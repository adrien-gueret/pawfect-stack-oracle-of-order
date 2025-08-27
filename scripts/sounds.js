import { toggleMuteSounds, areSoundMuted } from "./state.js";

function playSound(f) {
  if (areSoundMuted()) {
    return;
  }

  const A = new AudioContext();
  const m = A.createBuffer(1, 96e3, 48e3);
  const b = m.getChannelData(0);
  for (let i = 96e3; i--; ) b[i] = f(i);
  const s = A.createBufferSource();
  s.buffer = m;
  s.connect(A.destination);
  s.start();
}

function playMainMusic() {
  if (areSoundMuted()) {
    return;
  }

  const step = 0.25;
  const base = 440;
  const semi = 1.05946;
  const notes = [
    10,
    12,
    13,
    12,
    10,
    12,
    15,
    13,
    12,
    10,
    12,
    13,
    15,
    13,
    12,
    ,
    19,
    19,
    19,
    19,
    21,
    21,
    21,
    21,
    18,
    18,
    18,
    18,
    19,
    19,
    19,
    19,
    10,
    12,
    15,
    13,
    12,
    10,
    12,
    15,
    13,
    12,
    15,
    17,
    15,
    13,
    12,
    ,
    19,
    21,
    21,
    21,
    23,
    23,
    23,
    23,
    21,
    21,
    21,
    21,
    19,
    19,
    19,
    19,
    10,
    12,
    13,
    12,
    10,
    12,
    15,
    13,
    12,
    10,
    12,
    13,
    15,
    13,
    12,
    ,
    19,
    19,
    19,
    19,
    21,
    21,
    21,
    21,
    18,
    18,
    18,
    18,
    19,
    19,
    19,
    19,
    12,
    13,
    15,
    13,
    12,
    10,
    12,
    13,
    15,
    17,
    15,
    13,
    12,
    10,
    12,
    ,
    21,
    19,
    21,
    19,
    21,
    23,
    21,
    19,
    21,
    19,
    21,
    23,
    21,
    19,
    21,
    19,
  ];

  if (!playMainMusic.ctx) playMainMusic.ctx = new AudioContext();
  const ctx = playMainMusic.ctx;

  // Toujours planifier dans le futur par rapport à currentTime
  const t0 = Math.max(ctx.currentTime + 0.03, 0); // petite marge
  const g = ctx.createGain();
  g.connect(ctx.destination);

  notes.forEach((n, i) => {
    if (!n) return;
    const start = t0 + i * step;
    const stop = start + 0.24;

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(base * Math.pow(semi, 13 - n), start);

    const gn = ctx.createGain();
    gn.gain.setValueAtTime(1, start);
    gn.gain.setTargetAtTime(0.0001, start + 0.22, 0.01);

    osc.connect(gn);
    gn.connect(g);

    osc.start(start);
    osc.stop(stop);
  });

  clearTimeout(playMainMusic.timer);
  playMainMusic.timer = setTimeout(() => {
    if (ctx.state === "suspended") ctx.resume();
    playMainMusic();
  }, notes.length * step * 1000);
}

function stopMainMusic() {
  if (playMainMusic.ctx) {
    playMainMusic.ctx.close();
    playMainMusic.ctx = null;
  }
  clearTimeout(playMainMusic.timer);
  playMainMusic.timer = null;
}

export const levelWin = () => {
  if (areSoundMuted()) {
    return;
  }

  const ctx = new AudioContext(),
    g = ctx.createGain();
  g.connect(ctx.destination);
  const seq = [
    [13, 0],
    [17, 0.12],
    [20, 0.24],
    [25, 0.36],
    [13, 0.48],
    [17, 0.48],
    [20, 0.48],
  ];
  seq.forEach(([n, t]) => {
    const o = ctx.createOscillator(),
      gn = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(440 * Math.pow(1.05946, 13 - n), t);
    gn.gain.setValueAtTime(1, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(gn);
    gn.connect(g);
    o.start(t);
    o.stop(t + 0.3);
  });
};

export const levelLost = () => {
  if (areSoundMuted()) {
    return;
  }

  const ctx = new AudioContext(),
    g = ctx.createGain();
  g.connect(ctx.destination);

  const seq = [
    [19, 0],
    [17, 0.12],
    [15, 0.24],
    [13, 0.36],
    [21, 0.6],
  ];

  seq.forEach(([n, t]) => {
    const o = ctx.createOscillator(),
      gn = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(440 * Math.pow(1.05946, 13 - n), t);
    gn.gain.setValueAtTime(1, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(gn);
    gn.connect(g);
    o.start(t);
    o.stop(t + 0.5);
  });
};

export function meow() {
  playSound((i) => {
    const sr = 48000;
    const n = 32000;
    if (i > n) return null;

    const A = 0.03 * sr,
      tau = 11000,
      R = 0.12 * sr;
    const attack = i < A ? i / A : 1;
    const decay = Math.exp(-i / tau);
    const release = i < n - R ? 1 : 1 - (i - (n - R)) / R;
    const env = attack * decay * release;
    const f0 = 880;
    const upDur = 0.025 * sr;
    const upCents = 20;
    const upFactor = Math.pow(2, upCents / 1200);

    let f;
    if (i < upDur) {
      const k = i / upDur;
      f = f0 * (1 + (upFactor - 1) * k);
    } else {
      const fEnd = 880;
      const rem = (i - upDur) / (n - upDur);
      const eased = Math.pow(rem, 1.8);
      f = f0 * upFactor * Math.pow(fEnd / (f0 * upFactor), eased);
    }

    const ph = (2 * Math.PI * i * f) / sr;

    const base = Math.sin(ph);
    const h2 = Math.sin(2 * ph) * (0.4 * Math.exp(-i / (0.1 * sr)));
    const h3 = Math.sin(3 * ph) * (0.22 * Math.exp(-i / (0.07 * sr)));
    const noise = (Math.random() * 2 - 1) * 0.015 * Math.exp(-i / (0.02 * sr));

    const y = (base + h2 + h3 + noise) * env * 0.9;
    return Math.tanh(y * 1.3);
  });
}

export function potionBroken() {
  playSound((i) => {
    const sr = 48000;
    const n = 24000;
    if (i > n) return null;

    const A = 0.005 * sr;
    const tau = 5000;
    const env = (i < A ? i / A : 1) * Math.exp(-i / tau);
    const noise = (Math.random() * 2 - 1) * 0.6;
    const freqs = [3000, 4200, 5600, 7200];
    let ring = 0;
    for (let f of freqs) {
      ring += Math.sin((2 * Math.PI * i * f) / sr) * Math.exp(-i / (0.15 * sr));
    }

    return (noise * 0.4 + ring * 0.2) * env;
  });
}

export function putItem() {
  playSound((i) => {
    const sr = 48000;
    const n = 12000;
    if (i > n) return null;

    const env = Math.exp(-i / 4000);

    const f0 = 600;
    const f1 = 900;

    const base = Math.sin((2 * Math.PI * i * f0) / sr);
    const overtone = Math.sin((2 * Math.PI * i * f1) / sr) * 0.4;

    const pop = Math.sin((2 * Math.PI * i * (f0 + i / 60)) / sr) * 0.2;

    return (base + overtone + pop) * env * 0.8;
  });
}

export function itemDisappears() {
  playSound(
    (i) => Math.sin(((i % 400) / 400) * 2 * Math.PI) * Math.exp(-i / 8000) * 2.2
  );
}

export function plantGrowth() {
  playSound(
    (i) => (Math.random() * 2 - 1) * Math.sin(i / 50) * Math.exp(-i / 5000)
  );
}

export function toggleSounds(isMuted) {
  toggleMuteSounds(isMuted);

  if (isMuted) {
    stopMainMusic();
  } else {
    playMainMusic();
  }
}

export default playMainMusic;
