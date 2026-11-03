// Draws an invitation card on a canvas. All drawing uses a 1080 × 1350
// coordinate space and is scaled to whatever size the canvas actually is.
// Pass `t` (seconds) to draw one frame of the reveal animation; leave it out
// for the finished card.

const W = 1080;
const H = 1350;

export const DURATION = 6; // seconds, including a short hold at the end

export const themes = [
  {
    id: 'kesariya', label: 'Kesariya', best: 'Shubh Vivah', pattern: 'bandhani',
    outer: '#b81f2a', dotA: '#f4b41a', dotB: '#fff3d6',
    inner: ['#fff7e6', '#fbe2b5'], frame: '#c9a24a',
    ink: '#7a1220', accent: '#d9661c', soft: '#5a3a32',
  },
  {
    id: 'rani', label: 'Rani', best: 'Sangeet', pattern: 'bandhani',
    outer: '#a8124c', dotA: '#f2c94c', dotB: '#ffe4ee',
    inner: ['#fff5f8', '#fbdde8'], frame: '#c9a24a',
    ink: '#8e0e3f', accent: '#b8862b', soft: '#5d3443',
  },
  {
    id: 'leheriya', label: 'Leheriya', best: 'Mehendi', pattern: 'leheriya',
    outer: '#1f6e45', dotA: '#f4b41a', dotB: '#f4b41a',
    inner: ['#fffbea', '#f5edc6'], frame: '#c99a2e',
    ink: '#1d5236', accent: '#b9780f', soft: '#43483a',
  },
  {
    id: 'shahi', label: 'Shahi', best: 'Reception', pattern: 'bandhani',
    outer: '#2e060d', dotA: '#c9a24a', dotB: '#7a1220',
    inner: ['#5a0d1a', '#2e060d'], frame: '#d9b45a',
    ink: '#f4d58a', accent: '#e9b949', soft: '#ecd9b0',
  },
  {
    id: 'haldi', label: 'Haldi', best: 'Pithi Dastoor', pattern: 'mothda',
    outer: '#f2a900', dotA: '#e0661b', dotB: '#fff1b8',
    inner: ['#fffdf0', '#fff1c2'], frame: '#d98a00',
    ink: '#8a4300', accent: '#d2541a', soft: '#5b4526',
  },
  {
    id: 'mehendi', label: 'Mehendi', best: 'Mehendi', pattern: 'jaali',
    outer: '#4f6b2a', dotA: '#c7b26a', dotB: '#e9e2b8',
    inner: ['#fbfaef', '#ebe8cd'], frame: '#a8913f',
    ink: '#3c5420', accent: '#9a6b1c', soft: '#4a4a36',
  },
  {
    id: 'neel', label: 'Neel', best: 'Tilak', pattern: 'jaali',
    outer: '#183b8c', dotA: '#7fa7e8', dotB: '#f3d27a',
    inner: ['#f6f9ff', '#dfe8fa'], frame: '#c9a24a',
    ink: '#163276', accent: '#2c6fd1', soft: '#3b4560',
  },
  {
    id: 'gulabi', label: 'Gulabi', best: 'Mayra / Bhaat', pattern: 'leheriya',
    outer: '#e2557a', dotA: '#f7a64a', dotB: '#f7a64a',
    inner: ['#fff6f3', '#fde1d8'], frame: '#d79a3c',
    ink: '#a3254b', accent: '#d9661c', soft: '#5d3a3f',
  },
  {
    id: 'mor', label: 'Mor', best: 'Nikasi & Baraat', pattern: 'mandana',
    outer: '#0d5c63', dotA: '#e9c46a', dotB: '#7fd1c6',
    inner: ['#f4fbfa', '#d8eeeb'], frame: '#d4a93f',
    ink: '#0b4a50', accent: '#b5822a', soft: '#36504f',
  },
  {
    id: 'chandni', label: 'Chandni', best: 'Phere', pattern: 'mandana',
    outer: '#e9e4da', dotA: '#b5a48a', dotB: '#ffffff',
    inner: ['#ffffff', '#f4f1ea'], frame: '#a9a9b3',
    ink: '#2d3550', accent: '#8b7752', soft: '#555a66',
  },
];

export const fontsReady = Promise.all([
  '600 40px "Cormorant Garamond"',
  'italic 500 40px "Cormorant Garamond"',
  '40px "Great Vibes"',
  '40px "Tiro Devanagari Hindi"',
  '500 40px Jost',
].map((f) => document.fonts.load(f).catch(() => null)));

const DISPLAY = '"Cormorant Garamond", Georgia, serif';
const SCRIPT = '"Great Vibes", cursive';
const HINDI = '"Tiro Devanagari Hindi", serif';
const BODY = 'Jost, system-ui, sans-serif';

const ease = (x) => { const c = Math.min(Math.max(x, 0), 1); return 1 - Math.pow(1 - c, 3); };

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} data   names, ceremony, date line, venue, family
 * @param {object} theme  one of `themes`
 * @param {{t?: number, blank?: boolean}} opts
 */
export function drawCard(canvas, data, theme = themes[0], opts = {}) {
  const ctx = canvas.getContext('2d');
  const t = opts.t;
  ctx.save();
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  drawOuter(ctx, theme);

  const f = t == null ? 1 : ease(t / 0.8);
  ctx.save();
  ctx.globalAlpha = f;
  ctx.translate(W / 2, H / 2);
  ctx.scale(0.94 + 0.06 * f, 0.94 + 0.06 * f);
  ctx.translate(-W / 2, -H / 2);
  drawFrame(ctx, theme);
  ctx.restore();

  if (opts.blank) drawBlank(ctx, data, theme, t);
  else drawText(ctx, data, theme, t);

  if (t != null) drawPetals(ctx, t);
  ctx.restore();
}

/* ---------- Outer patterns ---------- */

function drawOuter(ctx, t) {
  ctx.fillStyle = t.outer;
  ctx.fillRect(0, 0, W, H);
  ({ leheriya, jaali, mothda, mandana }[t.pattern] || bandhani)(ctx, t);
}

// Bandhani: small tie-dye dots in offset rows.
function bandhani(ctx, t) {
  const step = 30;
  for (let row = 0, y = 12; y < H; row++, y += step) {
    for (let x = row % 2 ? 12 + step / 2 : 12; x < W; x += step) {
      ctx.fillStyle = (row + Math.round(x / step)) % 3 === 0 ? t.dotB : t.dotA;
      ctx.beginPath();
      ctx.arc(x, y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Leheriya: diagonal wave stripes.
function leheriya(ctx, t) {
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = t.dotA;
  for (let y = -1100; y < 1100; y += 44) {
    ctx.beginPath();
    for (let x = -1100; x <= 1100; x += 20) ctx.lineTo(x, y + Math.sin(x / 22) * 7);
    for (let x = 1100; x >= -1100; x -= 20) ctx.lineTo(x, y + 14 + Math.sin(x / 22) * 7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// Jaali: the carved stone lattice of Rajasthani windows.
function jaali(ctx, t) {
  const s = 54;
  ctx.strokeStyle = t.dotA;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let k = -H; k < W + H; k += s) {
    ctx.moveTo(k, 0); ctx.lineTo(k + H, H);
    ctx.moveTo(k, 0); ctx.lineTo(k - H, H);
  }
  ctx.stroke();
  ctx.fillStyle = t.dotB;
  for (let y = 0; y <= H; y += s / 2) {
    for (let x = ((y / (s / 2)) % 2) * (s / 2); x <= W; x += s) {
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Mothda: small checks of diamonds, as on turban cloth.
function mothda(ctx, t) {
  const s = 36;
  for (let row = 0, y = 0; y < H + s; row++, y += s / 2) {
    for (let x = row % 2 ? s / 2 : 0; x < W + s; x += s) {
      ctx.fillStyle = row % 4 < 2 ? t.dotA : t.dotB;
      ctx.beginPath();
      ctx.moveTo(x, y - 9); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 9); ctx.lineTo(x - 9, y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// Mandana: the floor-art motif of dot rosettes.
function mandana(ctx, t) {
  const s = 96;
  for (let row = 0, y = 30; y < H + s; row++, y += s * 0.86) {
    for (let x = row % 2 ? 30 + s / 2 : 30; x < W + s; x += s) {
      ctx.fillStyle = t.dotA;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 18, y + Math.sin(a) * 18, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = t.dotB;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ---------- Frame ---------- */

function archPath(ctx, inset) {
  const x0 = inset;
  const x1 = W - inset;
  const top = inset + 10;
  const bottom = H - inset;
  const shoulder = 430 + inset * 0.2;
  ctx.beginPath();
  ctx.moveTo(x0, bottom);
  ctx.lineTo(x0, shoulder);
  ctx.bezierCurveTo(x0, shoulder - 190, W / 2 - 170, top + 90, W / 2, top);
  ctx.bezierCurveTo(W / 2 + 170, top + 90, x1, shoulder - 190, x1, shoulder);
  ctx.lineTo(x1, bottom);
  ctx.closePath();
}

function drawFrame(ctx, t) {
  // Gold band, then the plain inner arch.
  archPath(ctx, 70);
  ctx.fillStyle = t.frame;
  ctx.fill();

  archPath(ctx, 84);
  const g = ctx.createLinearGradient(0, 100, 0, H);
  g.addColorStop(0, t.inner[0]);
  g.addColorStop(1, t.inner[1]);
  ctx.fillStyle = g;
  ctx.fill();

  archPath(ctx, 104);
  ctx.strokeStyle = t.frame;
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 10]);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.setLineDash([]);

  // Small flowers in the lower corners.
  flower(ctx, 150, H - 150, t);
  flower(ctx, W - 150, H - 150, t);

  // Kalash finial at the top of the arch.
  ctx.fillStyle = t.frame;
  ctx.beginPath();
  ctx.arc(W / 2, 62, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W / 2, 20);
  ctx.quadraticCurveTo(W / 2 + 12, 40, W / 2, 50);
  ctx.quadraticCurveTo(W / 2 - 12, 40, W / 2, 20);
  ctx.fill();
}

function flower(ctx, cx, cy, t) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = t.accent;
  ctx.globalAlpha *= 0.85;
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(0, -18, 7, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha /= 0.85;
  ctx.fillStyle = t.frame;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------- Text ---------- */

function fit(ctx, text, maxWidth, size, font) {
  let s = size;
  ctx.font = font(s);
  while (s > 16 && ctx.measureText(text).width > maxWidth) {
    s -= 2;
    ctx.font = font(s);
  }
}

function divider(ctx, y, t) {
  ctx.strokeStyle = t.frame;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 170, y);
  ctx.lineTo(W / 2 - 22, y);
  ctx.moveTo(W / 2 + 22, y);
  ctx.lineTo(W / 2 + 170, y);
  ctx.stroke();
  ctx.fillStyle = t.accent;
  ctx.beginPath();
  ctx.moveTo(W / 2, y - 12);
  ctx.lineTo(W / 2 + 12, y);
  ctx.lineTo(W / 2, y + 12);
  ctx.lineTo(W / 2 - 12, y);
  ctx.closePath();
  ctx.fill();
}

// Runs `fn` with the fade-up for item `i` of the reveal sequence applied.
function stepper(ctx, t) {
  return (i, fn) => {
    if (t == null) { fn(); return; }
    const a = ease((t - (0.7 + i * 0.3)) / 0.6);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(0, (1 - a) * 24);
    fn();
    ctx.restore();
  };
}

function drawHeading(ctx, d, t, step) {
  const cx = W / 2;
  step(0, () => {
    ctx.fillStyle = t.accent;
    ctx.font = `34px ${HINDI}`;
    ctx.fillText('॥ श्री गणेशाय नमः ॥', cx, 290);
  });
  step(1, () => {
    ctx.fillStyle = t.ink;
    fit(ctx, d.ceremonyHindi, 720, 70, (s) => `${s}px ${HINDI}`);
    ctx.fillText(d.ceremonyHindi, cx, 400);
  });
  step(2, () => {
    ctx.fillStyle = t.accent;
    ctx.font = `500 26px ${BODY}`;
    ctx.letterSpacing = '8px';
    ctx.fillText(d.ceremony.toUpperCase(), cx + 4, 452);
    ctx.letterSpacing = '0px';
  });
}

function drawText(ctx, d, t, time) {
  const cx = W / 2;
  const max = 720;
  const step = stepper(ctx, time);

  drawHeading(ctx, d, t, step);
  step(3, () => {
    ctx.fillStyle = t.soft;
    ctx.font = `italic 500 34px ${DISPLAY}`;
    ctx.fillText('request the pleasure of your company', cx, 530);
  });
  step(4, () => {
    ctx.fillStyle = t.ink;
    fit(ctx, d.bride, max, 150, (s) => `${s}px ${SCRIPT}`);
    ctx.fillText(d.bride, cx, 690);
  });
  step(5, () => {
    ctx.fillStyle = t.accent;
    ctx.font = `80px ${SCRIPT}`;
    ctx.fillText('&', cx, 780);
  });
  step(6, () => {
    ctx.fillStyle = t.ink;
    fit(ctx, d.groom, max, 150, (s) => `${s}px ${SCRIPT}`);
    ctx.fillText(d.groom, cx, 900);
  });
  step(7, () => divider(ctx, 960, t));
  step(8, () => {
    ctx.fillStyle = t.ink;
    fit(ctx, d.dateLine, max, 46, (s) => `600 ${s}px ${DISPLAY}`);
    ctx.fillText(d.dateLine, cx, 1036);
  });
  step(9, () => {
    ctx.fillStyle = t.soft;
    fit(ctx, d.venue, max, 36, (s) => `500 ${s}px ${DISPLAY}`);
    ctx.fillText(d.venue, cx, 1090);
  });
  if (d.family) {
    step(10, () => {
      ctx.fillStyle = t.accent;
      fit(ctx, d.family, max - 80, 34, (s) => `italic 500 ${s}px ${DISPLAY}`);
      ctx.fillText(d.family, cx, 1160);
    });
  }
  step(11, () => watermark(ctx, t, d.watermark));
}

// A blank card with ruled lines, to print and fill in by hand.
function drawBlank(ctx, d, t, time) {
  const step = stepper(ctx, time);
  drawHeading(ctx, d, t, step);
  const line = (i, label, y) => step(i, () => {
    ctx.strokeStyle = t.frame;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 9]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(240, y);
    ctx.lineTo(W - 240, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = t.soft;
    ctx.font = `500 20px ${BODY}`;
    ctx.letterSpacing = '4px';
    ctx.fillText(label.toUpperCase(), W / 2 + 2, y + 34);
    ctx.letterSpacing = '0px';
  });
  step(3, () => {
    ctx.fillStyle = t.soft;
    ctx.font = `italic 500 34px ${DISPLAY}`;
    ctx.fillText('request the pleasure of your company', W / 2, 530);
  });
  line(4, 'Bride', 640);
  step(5, () => {
    ctx.fillStyle = t.accent;
    ctx.font = `80px ${SCRIPT}`;
    ctx.fillText('&', W / 2, 740);
  });
  line(6, 'Groom', 810);
  step(7, () => divider(ctx, 885, t));
  line(8, 'Date & time', 955);
  line(9, 'Venue', 1035);
  line(10, 'With love', 1115);
  step(11, () => watermark(ctx, t, d.watermark));
}

function watermark(ctx, t, text) {
  if (!text) return;
  ctx.fillStyle = t.soft;
  ctx.globalAlpha *= 0.55;
  ctx.font = `500 18px ${BODY}`;
  ctx.letterSpacing = '4px';
  ctx.fillText(text, W / 2 + 2, 1225);
  ctx.letterSpacing = '0px';
  ctx.globalAlpha /= 0.55;
}

/* ---------- Marigold petals for the animation ---------- */

const PETALS = Array.from({ length: 28 }, (_, i) => {
  const r = (n) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
  return {
    x: r(1) * W, y0: -80 - r(2) * H, speed: 150 + r(3) * 140, sway: 20 + r(4) * 40,
    phase: r(5) * 6.28, spin: (r(6) - 0.5) * 3, size: 10 + r(7) * 10,
    color: ['#f4a10b', '#f7c331', '#e9661c', '#d4381c'][i % 4],
  };
});

function drawPetals(ctx, t) {
  const fadeOut = 1 - ease((t - (DURATION - 1.2)) / 1.2);
  if (fadeOut <= 0) return;
  for (const p of PETALS) {
    const y = p.y0 + t * p.speed;
    if (y < -40 || y > H + 40) continue;
    const x = p.x + Math.sin(t * 1.6 + p.phase) * p.sway;
    ctx.save();
    ctx.globalAlpha = 0.9 * fadeOut;
    ctx.translate(x, y);
    ctx.rotate(p.phase + t * p.spin);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
