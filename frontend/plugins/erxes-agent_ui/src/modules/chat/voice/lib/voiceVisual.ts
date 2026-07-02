// The engine behind the voice-mode centrepiece: an "aurora well" of liquid
// light. A divergence-free curl-noise flow field advects a few hundred glowing
// particles into continuously morphing, interweaving filaments — never frozen,
// alive even when idle. Behind them drift three slow light currents (parallax
// depth); in front sits a noise-displaced liquid core that breathes and emits
// concentric ripples on the agent's bass onsets. Everything composites additively
// onto an offscreen fade-buffer so trails persist without per-particle shadowBlur,
// which keeps it at 60fps. The palette is true OKLCH (cyan → electric blue →
// violet) baked once into a 256-entry LUT.
//
// This file is all the maths; VoiceWave.tsx is the thin lifecycle shell.

import type { VoicePhase } from '~/modules/chat/voice/hooks/useVoiceConversation';

const TAU = Math.PI * 2;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// Frame-rate-independent exponential approach (impeccable: ease-out, no bounce).
const approach = (cur: number, target: number, rate: number, dt: number) =>
  cur + (target - cur) * (1 - Math.exp(-rate * dt));

// ── OKLCH → sRGB, then a perceptual cool gradient LUT ──────────────────────────

const oklchToRgb = (L: number, C: number, h: number): [number, number, number] => {
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const enc = (v: number) => {
    const c = v <= 0 ? 0 : v >= 1 ? 1 : v;
    const e = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(e * 255);
  };
  return [enc(lr), enc(lg), enc(lb)];
};

// Built from the erxes brand hue (primary = oklch 0.514 0.2276 277, an
// indigo-violet). Deep indigo → brand indigo → vivid violet → luminous lavender.
// Hue stays in the 278–300 band (never blue/cyan); chroma eases off at the bright
// end so the hottest tips glow lavender-white instead of going garish.
const D2R = Math.PI / 180;
const PALETTE: [number, number, number][] = [
  [0.3, 0.125, 278 * D2R], // deep indigo well
  [0.5, 0.225, 280 * D2R], // erxes brand indigo-violet
  [0.66, 0.205, 292 * D2R], // vivid violet
  [0.9, 0.075, 300 * D2R], // luminous lavender-white
];

const buildLut = (): Uint8Array => {
  const lut = new Uint8Array(256 * 3);
  const segs = PALETTE.length - 1;
  for (let i = 0; i < 256; i++) {
    const x = (i / 255) * segs;
    const seg = Math.min(segs - 1, Math.floor(x));
    const f = x - seg;
    const A = PALETTE[seg];
    const B = PALETTE[seg + 1];
    const [r, g, b] = oklchToRgb(
      lerp(A[0], B[0], f),
      lerp(A[1], B[1], f),
      lerp(A[2], B[2], f),
    );
    lut[i * 3] = r;
    lut[i * 3 + 1] = g;
    lut[i * 3 + 2] = b;
  }
  return lut;
};

// ── Value-noise field (gradient hashed, smoothstep) for the flow potential ─────

const makeNoise = () => {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  // Deterministic shuffle (no Math.random — keeps renders reproducible).
  let seed = 1337;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (hash: number, x: number, y: number) => {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };

  return (x: number, y: number): number => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];
    const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
    return lerp(x1, x2, v); // ~[-1, 1]
  };
};

// ── Per-phase character of the field ───────────────────────────────────────────

interface Mood {
  energy: number; // brightness + flow speed
  swirl: number; // tangential orbit strength
  pull: number; // radial bias (+inward, -outward)
  turbulence: number; // curl-noise contribution
  trailFade: number; // 0..1 dark-fill alpha; lower = longer streaks
  coreGlow: number;
  sweep: number; // comet boost (thinking)
}

const moodFor = (phase: VoicePhase, audio: number, bass: number): Mood => {
  switch (phase) {
    case 'speaking':
      return {
        energy: 0.3 + audio * 0.7,
        swirl: 0.22 + audio * 0.28,
        pull: -0.03 - audio * 0.1,
        turbulence: 0.42 + audio * 0.6,
        trailFade: 0.1,
        coreGlow: 0.5 + bass * 0.9,
        sweep: 0,
      };
    case 'listening':
      return {
        energy: 0.26,
        swirl: 0.16,
        pull: 0.14,
        turbulence: 0.32,
        trailFade: 0.075,
        coreGlow: 0.44,
        sweep: 0,
      };
    case 'thinking':
    case 'transcribing':
      return {
        energy: 0.26,
        swirl: 0.4,
        pull: 0.03,
        turbulence: 0.4,
        trailFade: 0.07,
        coreGlow: 0.34,
        sweep: 1,
      };
    default: // idle, error
      return {
        energy: 0.15,
        swirl: 0.12,
        pull: 0,
        turbulence: 0.28,
        trailFade: 0.06,
        coreGlow: 0.28,
        sweep: 0,
      };
  }
};

export interface VoiceVisualState {
  phase: VoicePhase;
  freq: Uint8Array | null; // 128 bins, or null when not speaking
  dt: number;
  time: number;
}

interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  age: number;
  life: number;
  band: number; // preferred radius fraction of the well
}

interface Ripple {
  r: number;
  life: number;
}

const COUNT = 540;
const COUNT_REDUCED = 120;

export interface VoiceVisual {
  render: (state: VoiceVisualState) => void;
  dispose: () => void;
}

export const createVoiceVisual = (
  canvas: HTMLCanvasElement,
  reducedMotion: boolean,
): VoiceVisual | null => {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return null;

  const lut = buildLut();
  const noise = makeNoise();
  const count = reducedMotion ? COUNT_REDUCED : COUNT;

  // Offscreen buffer the filaments accumulate on; faded (not cleared) each frame
  // so trails persist. drawImage'd additively onto the visible canvas.
  const trail = document.createElement('canvas');
  const tctx = trail.getContext('2d', { alpha: true });
  if (!tctx) return null;

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let R = 0;

  const particles: Particle[] = [];
  const ripples: Ripple[] = [];

  // Smoothed live values so transitions glide instead of snapping.
  let mEnergy = 0.14;
  let mSwirl = 0.07;
  let mPull = 0;
  let mTurb = 0.34;
  let mFade = 0.15;
  let mGlow = 0.26;
  let mSweep = 0;
  let audioLevel = 0;
  let bassLevel = 0;
  let trebleLevel = 0;
  let prevBass = 0;
  let sweepAngle = 0;

  const spawn = (p: Particle, first: boolean) => {
    p.band = 0.14 + Math.random() * 0.3;
    const a = Math.random() * TAU;
    const rad = R * p.band * (0.6 + Math.random() * 0.6);
    p.x = cx + Math.cos(a) * rad;
    p.y = cy + Math.sin(a) * rad;
    p.px = p.x;
    p.py = p.y;
    p.age = first ? Math.random() * 4 : 0;
    p.life = 2.6 + Math.random() * 4;
  };

  const resize = (): boolean => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const cw = canvas.clientWidth || 1;
    const ch = canvas.clientHeight || 1;
    const nw = Math.round(cw * dpr);
    const nh = Math.round(ch * dpr);
    if (nw === w && nh === h) return false;
    canvas.width = nw;
    canvas.height = nh;
    trail.width = nw;
    trail.height = nh;
    w = nw;
    h = nh;
    cx = w / 2;
    cy = h * 0.46;
    R = Math.min(w, h);
    if (particles.length === 0) {
      for (let i = 0; i < count; i++) {
        const p: Particle = { x: 0, y: 0, px: 0, py: 0, age: 0, life: 0, band: 0 };
        spawn(p, true);
        particles.push(p);
      }
    }
    // Fresh buffer on resize so stale trails don't smear at the new scale.
    tctx.clearRect(0, 0, w, h);
    return true;
  };

  // Curl of a scalar potential → a divergence-free (swirling, never-pooling) flow.
  const flow = (x: number, y: number, t: number, scale: number, out: [number, number]) => {
    const e = 0.55;
    const nx = x * scale;
    const ny = y * scale;
    const p1 =
      noise(nx, ny + e + t) +
      0.5 * noise(nx * 2.1 - t * 0.6, ny * 2.1 + e);
    const p2 =
      noise(nx, ny - e + t) +
      0.5 * noise(nx * 2.1 - t * 0.6, ny * 2.1 - e);
    const p3 =
      noise(nx + e, ny + t) +
      0.5 * noise(nx * 2.1 + e - t * 0.6, ny * 2.1);
    const p4 =
      noise(nx - e, ny + t) +
      0.5 * noise(nx * 2.1 - e - t * 0.6, ny * 2.1);
    out[0] = (p1 - p2) / (2 * e);
    out[1] = -(p3 - p4) / (2 * e);
  };

  const vel: [number, number] = [0, 0];

  const drawBackground = (time: number) => {
    // Deep cool well.
    ctx.globalCompositeOperation = 'source-over';
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.95);
    bg.addColorStop(0, '#160e33');
    bg.addColorStop(0.5, '#0c0820');
    bg.addColorStop(1, '#060410');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Three slow drifting light currents — parallax depth, idle life.
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const sp = 0.022 + i * 0.014;
      const orbit = R * (0.22 + i * 0.12);
      const ang = time * sp + (i * TAU) / 3;
      const gx = cx + Math.cos(ang) * orbit;
      const gy = cy + Math.sin(ang * 0.8) * orbit * 0.6;
      const rad = R * (0.4 - i * 0.06);
      const ci = 60 + i * 70;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
      const r = lut[ci * 3];
      const gg = lut[ci * 3 + 1];
      const b = lut[ci * 3 + 2];
      g.addColorStop(0, `rgba(${r},${gg},${b},${0.16 + mEnergy * 0.12})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  };

  const updateParticles = (dt: number, time: number) => {
    // Fade prior frame on the trail buffer (persistence → flowing streaks).
    tctx.globalCompositeOperation = 'source-over';
    tctx.fillStyle = `rgba(10,6,22,${mFade})`;
    tctx.fillRect(0, 0, w, h);
    tctx.globalCompositeOperation = 'lighter';
    tctx.lineCap = 'round';

    const scale = 2.4 / R;
    const turbAmp = R * (0.07 + mEnergy * 0.28) * mTurb;
    const lineW = Math.max(1, R / 720);
    const energyExpand = 1 + mEnergy * 0.5;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.px = p.x;
      p.py = p.y;

      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const nxr = dx / dist;
      const nyr = dy / dist;

      // 1) Differential orbit — inner shells sweep a touch faster, shearing the
      //    light into slow spiral ribbons rather than a rigid wheel. The high
      //    radius floor keeps the centre from spinning frantically.
      const omega = (0.12 + mSwirl) / (0.62 + dist / R);
      let vx = -nyr * omega * dist;
      let vy = nxr * omega * dist;

      // 2) Radial restoring force toward this particle's band: keeps the well
      //    luminous and contained instead of spraying outward as dust.
      const rBand = R * p.band * energyExpand;
      const fr = (rBand - dist) * 1.3;
      vx += nxr * fr;
      vy += nyr * fr;

      // 3) Curl-noise turbulence on top — organic waver, never-frozen flow.
      flow(p.x, p.y, time * 0.13, scale, vel);
      vx += vel[0] * turbAmp;
      vy += vel[1] * turbAmp;

      // 4) Phase radial bias (listening inhales, speaking exhales).
      const pull = mPull * R * 0.6;
      vx -= nxr * pull;
      vy -= nyr * pull;

      p.x += vx * dt;
      p.y += vy * dt;
      p.age += dt;

      if (p.age > p.life || dist > R * 0.56) {
        spawn(p, false);
        continue;
      }

      const lifeT = p.age / p.life;
      const env = Math.sin(lifeT * Math.PI);
      const sp = clamp01(Math.hypot(vx, vy) / (R * (1.2 + mEnergy)));
      const radial = clamp01(dist / (R * 0.46));
      // Bright cyan-white near the core / fast streaks, deep violet at the rim.
      let ci = clamp01(0.2 + sp * 0.55 + (1 - radial) * 0.4);

      // Comet sweep while thinking: lift particles near the rotating angle.
      let boost = 0;
      if (mSweep > 0.01) {
        const pang = Math.atan2(dy, dx);
        let ad = Math.abs(pang - sweepAngle);
        if (ad > Math.PI) ad = TAU - ad;
        boost = mSweep * Math.exp(-ad * ad * 3.5) * 0.6;
        ci = clamp01(ci + boost * 0.5);
      }

      const idx = Math.min(255, Math.floor(ci * 255));
      const r = lut[idx * 3];
      const g = lut[idx * 3 + 1];
      const b = lut[idx * 3 + 2];
      const alpha = clamp01(env * (0.42 + mEnergy * 0.5) + boost);
      tctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      tctx.lineWidth = lineW * (1 + boost * 1.4);
      tctx.beginPath();
      tctx.moveTo(p.px, p.py);
      tctx.lineTo(p.x, p.y);
      tctx.stroke();
    }
  };

  const drawCore = (time: number) => {
    ctx.globalCompositeOperation = 'lighter';
    const baseR = R * 0.085;
    const breath = 1 + Math.sin(time * 0.5) * 0.05 + bassLevel * 0.28;
    const coreR = baseR * breath;

    // Wobbling liquid rim.
    ctx.beginPath();
    const segs = 48;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * TAU;
      const n = noise(Math.cos(a) * 1.3 + time * 0.22, Math.sin(a) * 1.3);
      const rr = coreR * (1 + n * (0.12 + audioLevel * 0.22));
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const fill = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 1.5);
    fill.addColorStop(0, `rgba(236,228,255,${0.62 + mGlow * 0.3})`);
    fill.addColorStop(0.4, `rgba(150,110,250,${0.36 + mGlow * 0.26})`);
    fill.addColorStop(1, 'rgba(60,30,120,0)');
    ctx.fillStyle = fill;
    ctx.fill();

    // Outer halo.
    const halo = ctx.createRadialGradient(cx, cy, coreR * 0.6, cx, cy, coreR * 3.4);
    halo.addColorStop(0, `rgba(124,80,240,${0.15 + mGlow * 0.17})`);
    halo.addColorStop(1, 'rgba(40,20,90,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 3.4, 0, TAU);
    ctx.fill();

    // Drifting specular highlight → the "liquid light" read.
    const hx = cx + Math.cos(time * 0.32) * coreR * 0.4;
    const hy = cy - coreR * 0.35 + Math.sin(time * 0.26) * coreR * 0.25;
    const spec = ctx.createRadialGradient(hx, hy, 0, hx, hy, coreR * 0.9);
    spec.addColorStop(0, `rgba(255,255,255,${0.5 + mGlow * 0.3})`);
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(hx, hy, coreR * 0.9, 0, TAU);
    ctx.fill();

    // Expanding ripple rings.
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      const t = 1 - rp.life;
      const rr = coreR + t * R * 0.42;
      const alpha = rp.life * rp.life * 0.5;
      ctx.strokeStyle = `rgba(196,176,255,${alpha})`;
      ctx.lineWidth = Math.max(1, R / 900) * (1 + rp.life);
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, TAU);
      ctx.stroke();
    }
  };

  const sampleAudio = (freq: Uint8Array | null, dt: number) => {
    let aTarget = 0;
    let bTarget = 0;
    let tTarget = 0;
    if (freq) {
      let bass = 0;
      for (let i = 1; i < 6; i++) bass += freq[i];
      bass /= 5 * 255;
      let mid = 0;
      for (let i = 6; i < 44; i++) mid += freq[i];
      mid /= 38 * 255;
      let treble = 0;
      for (let i = 44; i < 110; i++) treble += freq[i];
      treble /= 66 * 255;
      bTarget = Math.pow(bass, 1.2);
      tTarget = Math.pow(treble, 1.1);
      aTarget = clamp01((bass * 0.5 + mid * 0.9 + treble * 0.6) * 1.5);
    }
    audioLevel = approach(audioLevel, aTarget, 14, dt);
    bassLevel = approach(bassLevel, bTarget, 18, dt);
    trebleLevel = approach(trebleLevel, tTarget, 16, dt);
  };

  const render = (state: VoiceVisualState) => {
    const { phase, freq, dt, time } = state;
    resize();
    sampleAudio(freq, dt);

    const mood = moodFor(phase, audioLevel, bassLevel);
    const rate = 4;
    mEnergy = approach(mEnergy, mood.energy, rate, dt);
    mSwirl = approach(mSwirl, mood.swirl, rate, dt);
    mPull = approach(mPull, mood.pull, rate, dt);
    mTurb = approach(mTurb, mood.turbulence, rate, dt);
    mFade = approach(mFade, mood.trailFade, rate, dt);
    mGlow = approach(mGlow, mood.coreGlow, rate, dt);
    mSweep = approach(mSweep, mood.sweep, 3, dt);
    sweepAngle = (sweepAngle + dt * 1.1) % TAU;

    // Spawn ripples on bass onsets while speaking.
    if (phase === 'speaking' && bassLevel - prevBass > 0.07 && bassLevel > 0.3) {
      if (ripples.length < 6) ripples.push({ r: 0, life: 1 });
    }
    prevBass = bassLevel;
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].life -= dt * 0.7;
      if (ripples[i].life <= 0) ripples.splice(i, 1);
    }

    drawBackground(time);
    updateParticles(dt, time);

    // Composite the glowing filament buffer over the background.
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(trail, 0, 0);

    // Treble sparkle: lift the whole filament field a touch on bright consonants.
    if (trebleLevel > 0.04) {
      ctx.globalAlpha = clamp01(trebleLevel * 0.6);
      ctx.drawImage(trail, 0, 0);
      ctx.globalAlpha = 1;
    }

    drawCore(time);
    ctx.globalCompositeOperation = 'source-over';
  };

  const dispose = () => {
    trail.width = 0;
    trail.height = 0;
    particles.length = 0;
    ripples.length = 0;
  };

  return { render, dispose };
};
