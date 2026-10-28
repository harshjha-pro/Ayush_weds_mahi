// Draws a sample invitation card on a canvas. All drawing uses a 1080 × 1350
// coordinate space and is scaled to whatever size the canvas actually is.

const W = 1080;
const H = 1350;

export const themes = [
  {
    id: 'kesariya', label: 'Kesariya', pattern: 'bandhani',
    outer: '#b81f2a', dotA: '#f4b41a', dotB: '#fff3d6',
    inner: ['#fff7e6', '#fbe2b5'], frame: '#c9a24a',
    ink: '#7a1220', accent: '#d9661c', soft: '#5a3a32',
  },
  {
    id: 'rani', label: 'Rani', pattern: 'bandhani',
    outer: '#a8124c', dotA: '#f2c94c', dotB: '#ffe4ee',
    inner: ['#fff5f8', '#fbdde8'], frame: '#c9a24a',
    ink: '#8e0e3f', accent: '#b8862b', soft: '#5d3443',
  },
  {
    id: 'leheriya', label: 'Leheriya', pattern: 'leheriya',
    outer: '#1f6e45', dotA: '#f4b41a', dotB: '#f4b41a',
    inner: ['#fffbea', '#f5edc6'], frame: '#c99a2e',
    ink: '#1d5236', accent: '#b9780f', soft: '#43483a',
  },
  {
    id: 'shahi', label: 'Shahi', pattern: 'bandhani',
    outer: '#2e060d', dotA: '#c9a24a', dotB: '#7a1220',
    inner: ['#5a0d1a', '#2e060d'], frame: '#d9b45a',
    ink: '#f4d58a', accent: '#e9b949', soft: '#ecd9b0',
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

export function drawCard(canvas, data, theme = themes[0]) {
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  drawOuter(ctx, theme);
  drawFrame(ctx, theme);
  drawText(ctx, data, theme);

  ctx.restore();
}

function drawOuter(ctx, t) {
  ctx.fillStyle = t.outer;
  ctx.fillRect(0, 0, W, H);

  if (t.pattern === 'leheriya') {
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
    return;
  }

  // Bandhani: small tie-dye dots in offset rows.
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
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(0, -18, 7, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = t.frame;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

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

function drawText(ctx, d, t) {
  const cx = W / 2;
  const max = 720;

  ctx.fillStyle = t.accent;
  ctx.font = `34px ${HINDI}`;
  ctx.fillText('॥ श्री गणेशाय नमः ॥', cx, 290);

  ctx.fillStyle = t.ink;
  fit(ctx, d.ceremonyHindi, max, 70, (s) => `${s}px ${HINDI}`);
  ctx.fillText(d.ceremonyHindi, cx, 400);

  ctx.fillStyle = t.accent;
  ctx.font = `500 26px ${BODY}`;
  ctx.letterSpacing = '8px';
  ctx.fillText(d.ceremony.toUpperCase(), cx + 4, 452);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = t.soft;
  ctx.font = `italic 500 34px ${DISPLAY}`;
  ctx.fillText('request the pleasure of your company', cx, 530);

  ctx.fillStyle = t.ink;
  fit(ctx, d.bride, max, 150, (s) => `${s}px ${SCRIPT}`);
  ctx.fillText(d.bride, cx, 690);
  ctx.fillStyle = t.accent;
  ctx.font = `80px ${SCRIPT}`;
  ctx.fillText('&', cx, 780);
  ctx.fillStyle = t.ink;
  fit(ctx, d.groom, max, 150, (s) => `${s}px ${SCRIPT}`);
  ctx.fillText(d.groom, cx, 900);

  divider(ctx, 960, t);

  ctx.fillStyle = t.ink;
  fit(ctx, d.dateLine, max, 46, (s) => `600 ${s}px ${DISPLAY}`);
  ctx.fillText(d.dateLine, cx, 1036);

  ctx.fillStyle = t.soft;
  fit(ctx, d.venue, max, 36, (s) => `500 ${s}px ${DISPLAY}`);
  ctx.fillText(d.venue, cx, 1090);

  if (d.family) {
    ctx.fillStyle = t.accent;
    fit(ctx, d.family, max - 80, 34, (s) => `italic 500 ${s}px ${DISPLAY}`);
    ctx.fillText(d.family, cx, 1160);
  }

  ctx.fillStyle = t.soft;
  ctx.globalAlpha = 0.55;
  ctx.font = `500 18px ${BODY}`;
  ctx.letterSpacing = '4px';
  ctx.fillText('SAMPLE · BFI', cx + 2, 1225);
  ctx.letterSpacing = '0px';
  ctx.globalAlpha = 1;
}
