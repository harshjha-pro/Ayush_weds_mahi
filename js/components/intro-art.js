// Original storybook artwork for the opening intro, drawn as SVG.
// Palette: warm ivory, pearl, champagne and antique gold, blush, warm beige,
// soft sage, muted olive and pale peach sunlight. No outlines in black; depth
// comes from soft gradients, fine linework and gentle shadows.

/* ── Small geometry helpers ───────────────────────────────── */

const f = (n) => Math.round(n * 10) / 10;

// A filled, tapering stroke along a cubic Bézier: used for bark and twigs so
// they thin naturally towards their tips.
export function taper([p0, p1, p2, p3], w0, w1, steps = 28) {
  const pt = (t) => {
    const u = 1 - t;
    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ];
  };
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [x, y] = pt(t);
    const [x2, y2] = pt(Math.min(1, t + 0.01));
    const [x1, y1] = pt(Math.max(0, t - 0.01));
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = -(y2 - y1) / len;
    const ny = (x2 - x1) / len;
    const w = (w0 + (w1 - w0) * t) / 2;
    left.push(`${f(x + nx * w)} ${f(y + ny * w)}`);
    right.unshift(`${f(x - nx * w)} ${f(y - ny * w)}`);
  }
  return `M${left.join("L")}L${right.join("L")}Z`;
}

// A cusped (Rajput) arch opening, base at y.
export function cuspedArch(x, y, w, h) {
  const r = w / 2;
  const top = y - h;
  const s = y - h + r * 0.9;
  return `M${f(x)} ${f(y)}V${f(s)}C${f(x)} ${f(s - r * 0.35)} ${f(x + r * 0.2)} ${f(s - r * 0.5)} ${f(x + r * 0.42)} ${f(s - r * 0.55)}C${f(x + r * 0.42)} ${f(top + r * 0.2)} ${f(x + r * 0.8)} ${f(top + r * 0.05)} ${f(x + r)} ${f(top)}C${f(x + r * 1.2)} ${f(top + r * 0.05)} ${f(x + r * 1.58)} ${f(top + r * 0.2)} ${f(x + r * 1.58)} ${f(s - r * 0.55)}C${f(x + r * 1.8)} ${f(s - r * 0.5)} ${f(x + w)} ${f(s - r * 0.35)} ${f(x + w)} ${f(s)}V${f(y)}Z`;
}

// Onion dome sitting on a base line.
export function onion(cx, base, w, h) {
  const r = w / 2;
  return `M${f(cx - r * 0.82)} ${f(base)}C${f(cx - r * 1.12)} ${f(base - h * 0.32)} ${f(cx - r * 0.98)} ${f(base - h * 0.66)} ${f(cx - r * 0.3)} ${f(base - h * 0.86)}C${f(cx - r * 0.12)} ${f(base - h * 0.92)} ${f(cx)} ${f(base - h * 0.96)} ${f(cx)} ${f(base - h)}C${f(cx)} ${f(base - h * 0.96)} ${f(cx + r * 0.12)} ${f(base - h * 0.92)} ${f(cx + r * 0.3)} ${f(base - h * 0.86)}C${f(cx + r * 0.98)} ${f(base - h * 0.66)} ${f(cx + r * 1.12)} ${f(base - h * 0.32)} ${f(cx + r * 0.82)} ${f(base)}Z`;
}

function finial(cx, top, s) {
  return `<g fill="#D6B779"><ellipse cx="${f(cx)}" cy="${f(top + s * 0.2)}" rx="${f(s * 0.32)}" ry="${f(s * 0.12)}"/><circle cx="${f(cx)}" cy="${f(top - s * 0.05)}" r="${f(s * 0.16)}"/><path d="M${f(cx - s * 0.04)} ${f(top - s * 0.15)}L${f(cx)} ${f(top - s * 0.75)}L${f(cx + s * 0.04)} ${f(top - s * 0.15)}Z"/></g>`;
}

// A small domed pavilion on four pillars.
function chhatri(cx, base, w) {
  const h = w * 0.9;
  return `<g>
    <rect x="${f(cx - w * 0.5)}" y="${f(base - w * 0.08)}" width="${f(w)}" height="${f(w * 0.08)}" fill="#D8C19E"/>
    <rect x="${f(cx - w * 0.42)}" y="${f(base - h * 0.62)}" width="${f(w * 0.09)}" height="${f(h * 0.55)}" fill="#E8D8BE"/>
    <rect x="${f(cx + w * 0.33)}" y="${f(base - h * 0.62)}" width="${f(w * 0.09)}" height="${f(h * 0.55)}" fill="#E8D8BE"/>
    <rect x="${f(cx - w * 0.33)}" y="${f(base - h * 0.62)}" width="${f(w * 0.66)}" height="${f(h * 0.55)}" fill="#C9AF87" opacity=".55"/>
    <rect x="${f(cx - w * 0.58)}" y="${f(base - h * 0.68)}" width="${f(w * 1.16)}" height="${f(w * 0.09)}" fill="#DDC7A4"/>
    <path d="${onion(cx, base - h * 0.68, w * 0.86, h * 0.62)}" fill="url(#ia-dome)"/>
    ${finial(cx, base - h * 0.68 - h * 0.62, w * 0.28)}
  </g>`;
}

// A jharokha: a projecting balcony window with a small domed canopy.
function jharokha(x, y, w) {
  const h = w * 0.9;
  return `<g>
    <path d="M${f(x - w * 0.12)} ${f(y + h)}H${f(x + w * 1.12)}L${f(x + w * 0.92)} ${f(y + h * 1.22)}H${f(x + w * 0.08)}Z" fill="#D8C19E"/>
    <rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#F1E4CF"/>
    <path d="${cuspedArch(x + w * 0.16, y + h * 0.92, w * 0.68, h * 0.72)}" fill="#C9AF87"/>
    <path d="${cuspedArch(x + w * 0.16, y + h * 0.92, w * 0.68, h * 0.72)}" fill="url(#ia-jali)" opacity=".7"/>
    <path d="M${f(x - w * 0.16)} ${f(y)}H${f(x + w * 1.16)}L${f(x + w)} ${f(y - h * 0.12)}H${f(x)}Z" fill="#DDC7A4"/>
    <path d="${onion(x + w / 2, y - h * 0.12, w * 0.9, h * 0.5)}" fill="url(#ia-dome)"/>
    <path d="M${f(x - w * 0.16)} ${f(y)}H${f(x + w * 1.16)}" stroke="#C9A867" stroke-width=".8"/>
  </g>`;
}

/* ── Palace (background) ──────────────────────────────────── */

export function palaceSvg() {
  const win = (x, y, w, h) => `<path d="${cuspedArch(x, y, w, h)}" fill="#C9AF87"/><path d="${cuspedArch(x + w * 0.15, y, w * 0.7, h * 0.78)}" fill="#B99D76" opacity=".6"/>`;
  const wingWindows = (x0) =>
    [0, 1, 2, 3].map((i) => win(x0 + i * 30, 252, 15, 26)).join("") + [0, 1].map((i) => jharokha(x0 + 12 + i * 60, 204, 22)).join("");
  const kangura = (x0, x1, y) =>
    Array.from({ length: Math.floor((x1 - x0) / 9) }, (_, i) => `<path d="${onion(x0 + 4.5 + i * 9, y, 7, 7)}" fill="#DECBAE"/>`).join("");
  return `
  <svg class="palace-svg" viewBox="0 0 600 300" preserveAspectRatio="xMidYMax meet">
    <defs>
      <linearGradient id="ia-wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9C3A1"/><stop offset=".55" stop-color="#EAD9BE"/><stop offset="1" stop-color="#F3E7D3"/></linearGradient>
      <linearGradient id="ia-dome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9C3A2"/><stop offset=".6" stop-color="#FAF2E4"/><stop offset="1" stop-color="#EBD9BC"/></linearGradient>
      <pattern id="ia-jali" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".7" fill="#F4E8D6"/></pattern>
    </defs>
    <g>
      <!-- plinth and steps -->
      <rect x="40" y="276" width="520" height="24" fill="#D8C19E"/>
      <rect x="40" y="276" width="520" height="1.2" fill="#D6B779" opacity=".7"/>
      <rect x="258" y="284" width="84" height="16" fill="#E3D2B6"/><rect x="250" y="292" width="100" height="8" fill="#ECDDC6"/>

      <!-- corner towers -->
      <rect x="52" y="168" width="34" height="108" fill="url(#ia-wall)"/>
      <rect x="514" y="168" width="34" height="108" fill="url(#ia-wall)"/>
      ${win(61, 222, 16, 30)}${win(523, 222, 16, 30)}
      ${chhatri(69, 168, 34)}${chhatri(531, 168, 34)}

      <!-- side wings -->
      <rect x="86" y="196" width="140" height="80" fill="url(#ia-wall)"/>
      <rect x="374" y="196" width="140" height="80" fill="url(#ia-wall)"/>
      ${kangura(86, 226, 196)}${kangura(374, 514, 196)}
      <rect x="82" y="194" width="148" height="4" fill="#D3BB94"/><rect x="370" y="194" width="148" height="4" fill="#D3BB94"/>
      ${wingWindows(98)}${wingWindows(386)}
      <path d="${onion(156, 189, 30, 24)}" fill="url(#ia-dome)"/>${finial(156, 165, 9)}
      <path d="${onion(444, 189, 30, 24)}" fill="url(#ia-dome)"/>${finial(444, 165, 9)}

      <!-- central block -->
      <rect x="226" y="146" width="148" height="130" fill="url(#ia-wall)"/>
      <rect x="222" y="143" width="156" height="4" fill="#D3BB94"/><rect x="222" y="146.6" width="156" height=".7" fill="#D6B779" opacity=".8"/>
      <rect x="222" y="205" width="156" height="3.5" fill="#D3BB94"/>
      ${win(234, 262, 16, 34)}${win(254, 262, 16, 34)}${win(330, 262, 16, 34)}${win(350, 262, 16, 34)}
      ${jharokha(236, 168, 22)}${jharokha(342, 168, 22)}
      ${chhatri(232, 143, 24)}${chhatri(368, 143, 24)}

      <!-- projecting central bay with the great gateway -->
      <rect x="270" y="128" width="60" height="148" fill="#F2E6D2"/>
      <rect x="266" y="126" width="68" height="3.5" fill="#D3BB94"/>
      <path d="${cuspedArch(279, 276, 42, 58)}" fill="#E4C3B6"/>
      <path d="${cuspedArch(285, 276, 30, 48)}" fill="#C7AC88"/>
      <path d="${cuspedArch(279, 276, 42, 58)}" fill="none" stroke="#D6B779" stroke-width=".8"/>
      ${jharokha(287, 172, 26)}
      <rect x="270" y="210" width="60" height="1" fill="#D6B779" opacity=".6"/>

      <!-- drum and main dome -->
      <rect x="272" y="108" width="56" height="20" fill="#E4D3B8"/>
      ${Array.from({ length: 7 }, (_, i) => `<rect x="${275 + i * 7.6}" y="111" width="3" height="13" fill="#C9AF87"/>`).join("")}
      <ellipse cx="300" cy="108" rx="34" ry="3.5" fill="#D3BB94"/>
      <path d="${onion(300, 106, 64, 66)}" fill="url(#ia-dome)"/>
      <path d="M300 40C318 46 328 62 330 82" stroke="#D6B779" stroke-width=".8" fill="none" opacity=".75"/>
      ${finial(300, 40, 18)}

      <!-- light from the upper right: the left faces fall into soft shade -->
      <g fill="#A88E70" opacity=".12">
        <rect x="52" y="168" width="12" height="108"/><rect x="86" y="196" width="40" height="80"/><rect x="374" y="196" width="30" height="80"/>
        <rect x="226" y="146" width="44" height="130"/><rect x="514" y="168" width="10" height="108"/>
      </g>
      <g fill="#9C8468" opacity=".14">
        <rect x="82" y="198" width="148" height="2"/><rect x="370" y="198" width="148" height="2"/><rect x="222" y="147" width="156" height="2.4"/><rect x="266" y="129.5" width="68" height="2"/>
      </g>
      <g fill="#C9B08A" opacity=".55">${Array.from({ length: 22 }, (_, i) => (i > 8 && i < 13 ? "" : `<path d="${cuspedArch(46 + i * 23.4, 299, 10, 14)}"/>`)).join("")}</g>
      <g stroke="#D6B779" stroke-width=".6" fill="none" opacity=".6"><path d="M300 42C290 54 284 76 285 104M300 42C310 54 316 76 315 104M300 42V104"/></g>
      <ellipse cx="300" cy="300" rx="260" ry="5" fill="#B99D76" opacity=".18"/>

      <!-- a few blush bougainvillea sprays softening the corners -->
      <g fill="#EFCFC6" opacity=".85">
        <circle cx="88" cy="200" r="5"/><circle cx="94" cy="206" r="4"/><circle cx="84" cy="210" r="4.5"/>
        <circle cx="512" cy="200" r="5"/><circle cx="506" cy="207" r="4"/><circle cx="516" cy="209" r="4"/>
      </g>
    </g>
  </svg>`;
}

export function hillsSvg() {
  const dome = (cx, base, w, h) => `<path d="${onion(cx, base, w, h)}"/>`;
  return `
  <svg class="hills-svg" viewBox="-600 0 1800 200" preserveAspectRatio="xMidYMax slice">
    <path d="M-600 120C-480 96 -360 104 -240 112C-140 118 -60 100 0 118V200H-600Z" fill="#E6DECB" opacity=".75"/><path d="M600 96C700 88 800 104 900 100C1020 96 1110 110 1200 104V200H600Z" fill="#E6DECB" opacity=".75"/>
    <path d="M-600 146C-480 136 -300 142 0 146V200H-600Z" fill="#DCDAC5" opacity=".7"/><path d="M600 132C760 128 960 140 1200 136V200H600Z" fill="#DCDAC5" opacity=".7"/>
    <path d="M0 118C70 88 140 96 210 108C280 120 330 84 410 92C480 99 540 80 600 96V200H0Z" fill="#E6DECB" opacity=".75"/>
    <path d="M0 146C90 128 160 138 240 132C330 126 400 140 480 128C540 120 580 128 600 132V200H0Z" fill="#DCDAC5" opacity=".7"/>
    <g fill="#E2D8C4" opacity=".7">
      <path d="M-420 112H-260V104H-250V112H-180V100H-170V112H-120V106H-80V116H-420Z"/>${dome(-255, 104, 14, 12)}${dome(-175, 100, 12, 10)}
      <path d="M700 98H820V90H830V98H900V92H960V102H700Z"/>${dome(825, 90, 12, 10)}
    </g>
    <g fill="#E9DFCC" opacity=".8">
      <rect x="60" y="150" width="44" height="34"/>${dome(82, 150, 26, 22)}
      <rect x="120" y="160" width="30" height="26"/>${dome(135, 160, 16, 14)}
      <rect x="452" y="152" width="40" height="32"/>${dome(472, 152, 22, 20)}
      <rect x="505" y="164" width="28" height="22"/>${dome(519, 164, 14, 12)}
    </g>
  </svg>`;
}

/* ── Garden (middle ground) ───────────────────────────────── */

export function gardenSvg() {
  // A garden tree: a forked, tapering trunk and a canopy built from soft
  // overlapping clumps, shaded away from the sun (upper right) and lit
  // towards it, with a little leaf texture. Some carry blush blossom.
  const tree = (x, y, s, dark, light, flowering = false) => {
    const clumps = [
      [-0.46, -0.86, 0.36, dark], [0.44, -0.9, 0.34, dark], [0, -1.02, 0.44, dark], [-0.24, -1.26, 0.32, dark],
      [0.26, -1.3, 0.3, light], [0.5, -1.08, 0.22, light], [-0.04, -1.4, 0.24, light], [0.14, -0.92, 0.26, "#C4CBAE"],
    ]
      .map(([dx, dy, r, c], i) => `<ellipse cx="${f(x + dx * s)}" cy="${f(y + dy * s)}" rx="${f(r * s * 1.08)}" ry="${f(r * s * 0.92)}" transform="rotate(${(i * 23) % 40 - 20} ${f(x + dx * s)} ${f(y + dy * s)})" fill="${c}"/>`)
      .join("");
    const texture = Array.from({ length: 10 }, (_, i) => {
      const tx = x + (((i * 37) % 100) / 100 - 0.5) * s * 1.1;
      const ty = y - s * (0.82 + ((i * 53) % 60) / 100);
      return `<path d="M${f(tx)} ${f(ty)}q${f(s * 0.04)} ${f(-s * 0.05)} ${f(s * 0.09)} 0"/>`;
    }).join("");
    const flowers = flowering
      ? Array.from({ length: 7 }, (_, i) => `<circle cx="${f(x + (((i * 41) % 100) / 100 - 0.5) * s * 0.9)}" cy="${f(y - s * (0.85 + ((i * 29) % 50) / 100))}" r="${f(s * 0.03 + 0.8)}"/>`).join("")
      : "";
    return `
    <g>
      <ellipse cx="${x}" cy="${f(y + 2)}" rx="${f(s * 0.5)}" ry="${f(s * 0.07)}" fill="#C9CDB2" opacity=".6"/>
      <path d="${taper([[x, y], [x - 1, y - s * 0.35], [x + 2, y - s * 0.55], [x - 3, y - s * 0.86]], s * 0.075, s * 0.025, 12)}" fill="#9C8468"/>
      <path d="${taper([[x, y - s * 0.45], [x + s * 0.1, y - s * 0.6], [x + s * 0.2, y - s * 0.7], [x + s * 0.28, y - s * 0.84]], s * 0.04, s * 0.015, 10)}" fill="#9C8468"/>
      ${clumps}
      <g stroke="#9FA788" stroke-width=".7" fill="none" opacity=".32">${texture}</g>
      ${flowering ? `<g fill="#F3DFD9">${flowers}</g>` : ""}
    </g>`;
  };
  const cypress = (x, y, h) =>
    `<path d="M${x} ${y}C${x - 9} ${y - h * 0.3} ${x - 7} ${y - h * 0.75} ${x} ${y - h}C${x + 7} ${y - h * 0.75} ${x + 9} ${y - h * 0.3} ${x} ${y}Z" fill="#B9C1A2"/><path d="M${x + 1} ${y - h * 0.9}C${x + 5} ${y - h * 0.6} ${x + 6} ${y - h * 0.3} ${x + 3} ${y}" stroke="#CDD4BC" stroke-width="2" fill="none"/>`;
  const shrub = (x, y, w) =>
    `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${f(w * 0.55)}" fill="#C7CEB3"/><ellipse cx="${f(x + w * 0.25)}" cy="${f(y - w * 0.18)}" rx="${f(w * 0.55)}" ry="${f(w * 0.3)}" fill="#D3D9C2"/>` +
    [0, 1, 2, 3, 4].map((i) => `<circle cx="${f(x - w * 0.6 + i * w * 0.3)}" cy="${f(y - w * 0.25 + (i % 2) * 5)}" r="2.2" fill="${i % 2 ? "#F3DFD9" : "#FFFCF7"}"/>`).join("");
  // A low garden wall with a row of small cusped arches and finial posts.
  const posts = Array.from({ length: 9 }, (_, i) => {
    const x = 20 + i * 70;
    return `<rect x="${x - 4}" y="136" width="8" height="28" fill="#EFE3CF"/><rect x="${x - 4}" y="136" width="2.5" height="28" fill="#DCCBB0" opacity=".6"/><path d="${onion(x, 136, 9, 8)}" fill="#E9D9C5"/>`;
  }).join("");
  const arcade = Array.from({ length: 34 }, (_, i) => `<path d="${cuspedArch(-6 + i * 18.4, 162, 11, 13)}"/>`).join("");
  // The middle copy carries the walk to the palace; the side copies only
  // extend the lawn, trees and wall for wide screens.
  const side = `
    <rect x="-10" y="0" width="620" height="220" fill="url(#ig-lawn)"/>
    ${tree(40, 150, 80, "#AEB596", "#CBD2B8")}${tree(120, 156, 58, "#B9C0A1", "#D3D9C2", true)}
    ${tree(560, 150, 82, "#AEB596", "#CBD2B8", true)}${tree(480, 158, 56, "#B9C0A1", "#D3D9C2")}
    ${cypress(196, 150, 96)}${cypress(214, 152, 76)}${cypress(404, 150, 96)}${cypress(386, 152, 76)}
    <rect x="-10" y="144" width="620" height="22" fill="#F1E6D3"/>
    <rect x="-10" y="142" width="620" height="2.5" fill="#E2CDAC"/>
    <rect x="-10" y="141.5" width="620" height=".7" fill="#D6B779" opacity=".7"/>
    <g fill="#E1D1B8" opacity=".8">${arcade}</g>
    <rect x="-10" y="163" width="620" height="3" fill="#E2CDAC" opacity=".6"/>
    ${posts}
    ${shrub(90, 170, 34)}${shrub(250, 172, 26)}${shrub(350, 172, 26)}${shrub(510, 170, 34)}
    <path d="M-10 176C120 170 220 178 300 176C380 174 480 170 610 176V220H-10Z" fill="#E7E5CF"/>
    <path d="M250 220L282 178H318L350 220Z" fill="#F4EBDA"/>
`;
  return `
  <svg class="garden-svg" viewBox="-600 0 1800 220" preserveAspectRatio="xMidYMax slice">
    <defs><linearGradient id="ig-lawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4E4CF" stop-opacity="0"/><stop offset=".2" stop-color="#DFE2CB"/><stop offset="1" stop-color="#E9E6D2"/></linearGradient></defs>
    <g transform="translate(-600 0)">${side}</g>
    <g transform="translate(600 0)">${side}</g>
    <g>${side}
    <!-- stone walk and a pale reflecting channel leading to the palace -->
    <path d="M276 30H324L372 220H228Z" fill="#F1E8D6"/>
    <path d="M292 30H308L326 220H274Z" fill="#E4E9DF"/>
    <path d="M296 40L294 70M304 52L305 90M298 110L296 150M303 130L305 180" stroke="#FFFCF7" stroke-width="1.2" opacity=".8"/>
    <path d="M276 30L228 220M324 30L372 220" stroke="#E2D0B4" stroke-width="1"/>
    ${[60, 95, 130].map((y, i) => `<circle cx="${f(268 - i * 9)}" cy="${y}" r="${3 + i}" fill="#F3DFD9"/><circle cx="${f(332 + i * 9)}" cy="${y}" r="${3 + i}" fill="#F3DFD9"/>`).join("")}
    </g>
  </svg>`;
}

/* ── Flowering tree (foreground) ──────────────────────────── */

// The main limb the dove perches on. The dove's feet are placed on this
// curve, so it never moves; only the twigs around it sway.
const LIMB = [
  [-320, 384],
  [-40, 330],
  [250, 312],
  [600, 222],
];

const bez = ([p0, p1, p2, p3], t) => {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
};

// A cherry-like blossom: five notched petals with a soft blush at the heart,
// fine veins and gold-tipped stamens. `tone` picks ivory, blush or rose.
export function blossom(x, y, r, tone = 0, rot = 0) {
  const fill = ["url(#ib-ivory)", "url(#ib-blush)", "url(#ib-rose)"][tone % 3];
  const edge = ["#E6D8C6", "#E8C6BC", "#DFB2A6"][tone % 3];
  const petal = `M0 0C${f(-r * 0.5)} ${f(-r * 0.22)} ${f(-r * 0.66)} ${f(-r * 0.9)} ${f(-r * 0.24)} ${f(-r * 1.06)}L0 ${f(-r * 0.93)}L${f(r * 0.24)} ${f(-r * 1.06)}C${f(r * 0.66)} ${f(-r * 0.9)} ${f(r * 0.5)} ${f(-r * 0.22)} 0 0Z`;
  const petals = Array.from({ length: 5 }, (_, i) => `<path d="${petal}" transform="rotate(${i * 72 + ((i * 7) % 5)})" fill="${fill}" stroke="${edge}" stroke-width=".45"/>`).join("");
  const veins = Array.from({ length: 5 }, (_, i) => `<path d="M0 ${f(-r * 0.3)}L0 ${f(-r * 0.72)}" transform="rotate(${i * 72})"/>`).join("");
  const stamens = Array.from({ length: 9 }, (_, i) => {
    const a = (i * 40 * Math.PI) / 180;
    const l = r * (0.38 + (i % 3) * 0.06);
    return `<path d="M0 0L${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}"/><circle cx="${f(Math.cos(a) * l)}" cy="${f(Math.sin(a) * l)}" r=".85"/>`;
  }).join("");
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">
    ${petals}
    <g stroke="${edge}" stroke-width=".4" opacity=".7" fill="none">${veins}</g>
    <circle r="${f(r * 0.36)}" fill="#EBC3B6" opacity=".45"/>
    <g stroke="#C9AE7A" stroke-width=".45" fill="#D6B779">${stamens}</g>
    <circle r="${f(r * 0.16)}" fill="#E8D3A8"/>
  </g>`;
}

// A blossom seen from the side: a half-open cup on its green calyx.
export function blossomSide(x, y, r, tone = 0, rot = 0) {
  const fill = ["url(#ib-ivory)", "url(#ib-blush)", "url(#ib-rose)"][tone % 3];
  const edge = ["#E6D8C6", "#E8C6BC", "#DFB2A6"][tone % 3];
  const p = (a, s) =>
    `<path d="M0 0C${f(-r * 0.55 * s)} ${f(-r * 0.3)} ${f(-r * 0.62 * s)} ${f(-r * 1)} ${f(-r * 0.15 * s)} ${f(-r * 1.08)}C${f(r * 0.3 * s)} ${f(-r * 1.04)} ${f(r * 0.42 * s)} ${f(-r * 0.4)} 0 0Z" transform="rotate(${a})" fill="${fill}" stroke="${edge}" stroke-width=".45"/>`;
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">
    <path d="M0 0L0 ${f(r * 0.9)}" stroke="#9C8468" stroke-width=".9"/>
    ${p(-30, 1)}${p(30, -1)}${p(0, 0.7)}
    <path d="M${f(-r * 0.32)} ${f(-r * 0.05)}C${f(-r * 0.2)} ${f(r * 0.3)} ${f(r * 0.2)} ${f(r * 0.3)} ${f(r * 0.32)} ${f(-r * 0.05)}C${f(r * 0.1)} ${f(r * 0.06)} ${f(-r * 0.1)} ${f(r * 0.06)} ${f(-r * 0.32)} ${f(-r * 0.05)}Z" fill="#AEB596"/>
    <g fill="#D6B779"><circle cx="${f(-r * 0.12)}" cy="${f(-r * 0.86)}" r=".7"/><circle cx="${f(r * 0.1)}" cy="${f(-r * 0.92)}" r=".7"/></g>
  </g>`;
}

export function bud(x, y, s, rot) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">
    <path d="M0 0L0 ${f(s * 1.1)}" stroke="#9C8468" stroke-width=".9"/>
    <path d="M0 ${f(-s * 2.1)}C${f(-s * 0.75)} ${f(-s * 1.5)} ${f(-s * 0.7)} ${f(-s * 0.3)} 0 0C${f(s * 0.7)} ${f(-s * 0.3)} ${f(s * 0.75)} ${f(-s * 1.5)} 0 ${f(-s * 2.1)}Z" fill="url(#ib-blush)" stroke="#E2BBB0" stroke-width=".45"/>
    <path d="M${f(-s * 0.6)} ${f(-s * 0.55)}C${f(-s * 0.3)} ${f(-s * 0.1)} ${f(s * 0.3)} ${f(-s * 0.1)} ${f(s * 0.6)} ${f(-s * 0.55)}C${f(s * 0.3)} ${f(s * 0.25)} ${f(-s * 0.3)} ${f(s * 0.25)} ${f(-s * 0.6)} ${f(-s * 0.55)}Z" fill="#AEB596"/>
  </g>`;
}

// A slender leaf with a midrib and faint side veins; `fold` adds a paler
// upper half, as if the leaf were turned a little towards the light.
export function leaf(x, y, len, rot, tone, fold = false) {
  const fill = ["url(#ib-leaf1)", "url(#ib-leaf2)", "url(#ib-leaf3)"][tone % 3];
  const w = len * 0.2;
  const veins = [0.3, 0.5, 0.7]
    .map((t) => `<path d="M${f(len * t)} 0L${f(len * (t + 0.12))} ${f(-w * 0.62)}M${f(len * t)} 0L${f(len * (t + 0.12))} ${f(w * 0.6)}"/>`)
    .join("");
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">
    <path d="M0 0C${f(len * 0.2)} ${f(-w)} ${f(len * 0.62)} ${f(-w * 1.05)} ${f(len)} 0C${f(len * 0.62)} ${f(w * 0.92)} ${f(len * 0.22)} ${f(w * 0.95)} 0 0Z" fill="${fill}"/>
    ${fold ? `<path d="M0 0C${f(len * 0.2)} ${f(-w)} ${f(len * 0.62)} ${f(-w * 1.05)} ${f(len)} 0C${f(len * 0.6)} ${f(-w * 0.1)} ${f(len * 0.3)} ${f(-w * 0.1)} 0 0Z" fill="#E1E5D2" opacity=".45"/>` : ""}
    <path d="M0 0C${f(len * 0.4)} ${f(-w * 0.12)} ${f(len * 0.72)} ${f(-w * 0.06)} ${f(len * 0.96)} 0" stroke="#97A07D" stroke-width=".6" fill="none"/>
    <g stroke="#A3AB8A" stroke-width=".35" opacity=".7" fill="none">${veins}</g>
  </g>`;
}

// A layer of the tree drawn in its own <svg> over the same box, so it can
// sway as a composited transform: the browser moves the finished picture
// instead of repainting the whole tree every frame. (ox, oy) is the pivot in
// the tree's own coordinates.
function swayLayer(cls, [ox, oy], [a, d, dl], body) {
  return `<svg class="tw ${cls}" viewBox="0 0 560 420" preserveAspectRatio="xMidYMid meet" style="--ox:${f((ox / 560) * 100)}%;--oy:${f((oy / 420) * 100)}%;--a:${a}deg;--d:${d}s;--dl:${dl}s">${body}</svg>`;
}

// A twig: a tapered stem plus whatever grows on it.
function twig(base, curve, w0, items) {
  return `<path d="${taper(curve, w0, 0.9)}" fill="url(#ib-bark)"/>${items}`;
}

const flutter = (x, y, a, d, body) => body;

function treeParts() {
  const at = (t) => bez(LIMB, t);
  const [ax, ay] = at(0.5); // 114,317
  const [bx, by] = at(0.42); // ~42,327
  const [cx, cy] = at(0.56); // ~168,309
  const [dx, dy] = at(0.81); // ~407,266
  const [ex, ey] = at(0.86); // ~456,256
  const [gx, gy] = at(0.92); // ~517,242

  const twigs = [
    // A higher bough reaching in from above the frame, so the branch reads as
    // part of a tree whose crown is overhead. Its flowers stay clear of the
    // dove, to the upper left.
    twig(
      [70, -260],
      [[70, -260], [120, -150], [150, -40], [250, 52]],
      11,
      `<path d="${taper([[132, -86], [104, -50], [96, -14], [100, 30]], 4.4, 1)}" fill="url(#ib-bark)"/>
       <path d="${taper([[176, 0], [176, 30], [186, 56], [204, 80]], 3.6, 0.9)}" fill="url(#ib-bark)"/>
       <path d="${taper([[214, 24], [234, 32], [246, 52], [244, 84]], 3, 0.8)}" fill="url(#ib-bark)"/>
       ${leaf(118, -60, 26, 150, 0, true)}${leaf(100, -10, 24, 40, 1)}${leaf(150, -20, 24, -30, 2)}${leaf(170, 30, 22, 120, 0)}${leaf(196, 20, 24, -40, 1, true)}${leaf(236, 44, 20, 70, 2)}
       ${flutter(100, 30, 6, 3.5, blossom(100, 34, 11, 0, 8))}${blossomSide(88, 18, 8.5, 1, 220)}${blossom(116, 44, 8, 1, 40)}${bud(96, 52, 3.4, 180)}
       ${flutter(204, 80, 6, 3.1, blossom(204, 84, 10.5, 0, 30))}${blossom(188, 68, 8.5, 2, 12)}${bud(214, 98, 3.2, 170)}
       ${flutter(244, 84, 7, 3.9, blossom(244, 88, 9.5, 1, 50))}${blossomSide(256, 76, 8, 0, 150)}
       ${blossom(140, -2, 9, 0, 22)}${blossom(160, 12, 7.5, 1, 0)}`,
    ),
    // Upper left: a branch rising out of the frame, with a fork.
    twig(
      [bx, by],
      [[bx, by], [bx - 6, by - 40], [bx + 10, by - 70], [bx + 2, by - 112]],
      7,
      `<path d="${taper([[bx + 4, by - 58], [bx + 20, by - 70], [bx + 34, by - 74], [bx + 52, by - 86]], 3.2, 0.8)}" fill="url(#ib-bark)"/>
       ${leaf(bx + 2, by - 30, 26, 200, 0, true)}${leaf(bx + 4, by - 52, 22, -28, 1)}${leaf(bx + 30, by - 74, 20, -70, 2)}
       ${flutter(bx + 2, by - 112, 5, 3.4, blossom(bx + 2, by - 112, 11, 0, 12))}
       ${blossom(bx - 12, by - 96, 9, 1, 40)}${blossomSide(bx + 16, by - 100, 8, 0, 24)}
       ${flutter(bx + 52, by - 86, 6, 2.9, blossom(bx + 52, by - 86, 9.5, 0, 30))}${bud(bx + 42, by - 88, 3.4, 30)}
       ${blossom(bx - 4, by - 76, 7.5, 2, 18)}`,
    ),
    // Left, short upward spray close to the tail (kept low and small).
    twig(
      [ax + 36, ay - 6],
      [[ax + 36, ay - 6], [ax + 52, ay - 22], [ax + 68, ay - 30], [ax + 90, ay - 36]],
      4.4,
      `${leaf(ax + 56, ay - 24, 22, -40, 1, true)}${leaf(ax + 70, ay - 30, 18, 150, 2)}
       ${flutter(ax + 90, ay - 36, 6, 3.1, blossom(ax + 90, ay - 36, 10, 0, 5))}${blossom(ax + 100, ay - 26, 8, 1, 40)}`,
    ),
    // Hanging cluster beneath the limb on the left.
    twig(
      [cx, cy + 2],
      [[cx, cy + 2], [cx + 4, cy + 18], [cx - 2, cy + 30], [cx - 10, cy + 42]],
      4,
      `${leaf(cx + 2, cy + 14, 24, 120, 0)}${leaf(cx - 2, cy + 24, 20, 60, 2, true)}
       ${flutter(cx - 10, cy + 42, 7, 3.6, blossom(cx - 10, cy + 44, 10, 1, 22))}${blossomSide(cx - 22, cy + 36, 8.5, 0, 200)}${blossom(cx + 8, cy + 34, 8, 0, 50)}
       ${bud(cx - 4, cy + 58, 3.2, 170)}`,
    ),
    // Right of the dove: a twig dipping down then up, flowers hanging.
    twig(
      [dx, dy],
      [[dx, dy], [dx - 2, dy + 14], [dx - 8, dy + 26], [dx - 14, dy + 38]],
      3.8,
      `${leaf(dx - 2, dy + 10, 22, 30, 1)}${leaf(dx - 6, dy + 22, 20, 150, 0, true)}
       ${flutter(dx - 14, dy + 38, 6, 3.3, blossom(dx - 14, dy + 40, 9, 0, 60))}${blossomSide(dx - 2, dy + 40, 7.5, 1, 170)}`,
    ),
    // Upper right: the limb's crown, rising towards the light.
    twig(
      [ex, ey],
      [[ex, ey], [ex + 10, ey - 24], [ex + 30, ey - 46], [ex + 58, ey - 72]],
      6,
      `<path d="${taper([[ex + 22, ey - 38], [ex + 14, ey - 56], [ex + 10, ey - 72], [ex + 14, ey - 92]], 3, 0.8)}" fill="url(#ib-bark)"/>
       ${leaf(ex + 8, ey - 18, 26, -30, 2)}${leaf(ex + 26, ey - 42, 22, 160, 0, true)}${leaf(ex + 40, ey - 58, 24, -60, 1)}${leaf(ex + 12, ey - 70, 18, 200, 2)}
       ${flutter(ex + 58, ey - 72, 5, 3.8, blossom(ex + 58, ey - 72, 11.5, 0, 0))}${blossom(ex + 46, ey - 82, 8.5, 1, 30)}
       ${flutter(ex + 14, ey - 92, 6, 3.2, blossom(ex + 14, ey - 94, 10, 0, 20))}${blossomSide(ex + 26, ey - 88, 8, 2, 30)}${bud(ex + 2, ey - 84, 3.4, -30)}
       ${blossom(ex + 70, ey - 58, 8, 1, 10)}`,
    ),
    // Far right, a short spray hanging over the edge.
    twig(
      [gx, gy],
      [[gx, gy], [gx + 8, gy + 8], [gx + 16, gy + 14], [gx + 28, gy + 18]],
      3.8,
      `${leaf(gx + 6, gy + 2, 22, 190, 1)}${leaf(gx + 12, gy + 10, 20, 40, 2, true)}
       ${blossom(gx + 28, gy + 20, 9.5, 1, 25)}${blossom(gx + 38, gy + 8, 8, 0, 5)}${bud(gx + 20, gy + 26, 3, 160)}`,
    ),
  ];

  // Blossoms that sit right on the limb, either side of the dove's perch.
  const onLimb = [
    [0.47, -2, 12, 0, 10], [0.52, -10, 9, 1, 30], [0.62, -12, 7.5, 2, 20], [0.79, 8, 8, 0, 60], [0.84, -8, 9.5, 0, 15], [0.9, -10, 10.5, 1, 0],
  ]
    .map(([t, oy, r, tone, rot]) => {
      const [x, y] = at(t);
      return blossom(x, y + oy, r, tone, rot);
    })
    .join("");
  const limbLeaves = [
    [0.45, 2, 24, 160, 0], [0.54, 4, 22, 30, 1], [0.6, 6, 20, 150, 2], [0.78, 2, 22, -20, 2], [0.88, 4, 24, 200, 0], [0.37, 0, 22, -30, 1],
  ]
    .map(([t, oy, l, r, tone], i) => {
      const [x, y] = at(t);
      return flutter(x, y + oy, 4 + (i % 3), 3 + (i % 4) * 0.45, leaf(x, y + oy, l, r, tone, i % 2 === 0));
    })
    .join("");

  // Softer, paler flowers and leaves behind the limb, for depth.
  const back = swayLayer("tb-back", [300, 300], [0.6, 7, 0], `
    <g opacity=".55">
      ${leaf(470, 196, 26, -40, 1)}${leaf(520, 186, 24, 200, 0)}${leaf(80, 250, 24, -60, 2)}${leaf(150, 278, 22, -20, 1)}
      ${blossom(500, 176, 10, 0, 10)}${blossom(536, 200, 8, 1, 40)}${blossom(452, 214, 8, 0, 30)}
      ${blossom(70, 232, 9, 1, 15)}${blossom(112, 262, 8, 0, 40)}${blossom(30, 262, 7.5, 0, 0)}
    </g>`);

  // The twigs sway in three groups, each at its own speed: the high bough
  // slowest, the left sprays and the right crown a little quicker.
  const layers =
    swayLayer("tw-bough", [70, -260], [0.9, 7.2, -2], twigs[0]) +
    swayLayer("tw-left", [110, 318], [1.3, 5.2, -1.2], twigs.slice(1, 4).join("")) +
    swayLayer("tw-right", [440, 258], [1.2, 4.4, -2.6], twigs.slice(4).join(""));
  return { twigs: layers, onLimb, limbLeaves, back };
}

// Petal and leaf gradients shared by every flower drawing (ids start "ib-").
export const FLOWER_DEFS = `
      <radialGradient id="ib-ivory" cx=".5" cy=".85" r=".9"><stop offset="0" stop-color="#F1E5D4"/><stop offset=".45" stop-color="#FFFCF7"/><stop offset="1" stop-color="#FFFDF9"/></radialGradient>
      <radialGradient id="ib-blush" cx=".5" cy=".85" r=".9"><stop offset="0" stop-color="#E9C2B7"/><stop offset=".5" stop-color="#F3DFD9"/><stop offset="1" stop-color="#FBF1ED"/></radialGradient>
      <radialGradient id="ib-rose" cx=".5" cy=".85" r=".9"><stop offset="0" stop-color="#DDAA9C"/><stop offset=".55" stop-color="#EBC6BB"/><stop offset="1" stop-color="#F6E2DC"/></radialGradient>
      <linearGradient id="ib-leaf1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#CBD2B8"/><stop offset="1" stop-color="#A9B191"/></linearGradient>
      <linearGradient id="ib-leaf2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D6DCC6"/><stop offset="1" stop-color="#B4BB9C"/></linearGradient>
      <linearGradient id="ib-leaf3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C0C8A9"/><stop offset="1" stop-color="#9DA685"/></linearGradient>`;

export const BARK_DEFS = `
  <linearGradient id="ib-bark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#AD9375"/><stop offset=".5" stop-color="#8F755B"/><stop offset="1" stop-color="#6F5947"/></linearGradient>`;

// The limb's soft cast shadow, drawn once and blurred by CSS; it never
// animates, so the blur costs nothing after the first frame.
export function branchShadowSvg() {
  return `
  <svg class="branch-shadow" viewBox="0 0 560 420" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path d="${taper(LIMB, 15, 6)}" fill="#7A6450"/>
  </svg>`;
}

export function branchSvg() {
  const { twigs, onLimb, limbLeaves, back } = treeParts();
  // The limb's upper edge catches the light; its underside falls into shade.
  const lit = LIMB.map(([x, y]) => [x, y - 4.2]);
  const under = LIMB.map(([x, y]) => [x, y + 3.2]);
  const knots = [0.5, 0.66, 0.83].map((t) => bez(LIMB, t));
  return `
  ${back}
  <svg class="branch-svg" viewBox="0 0 560 420" preserveAspectRatio="xMidYMid meet">
    <defs>
      ${BARK_DEFS}
      ${FLOWER_DEFS}
    </defs>
    <path d="${taper(LIMB, 15, 6)}" fill="url(#ib-bark)"/>
    <path d="${taper(under, 9, 3)}" fill="#6A5443" opacity=".28"/>
    <path d="${taper(lit, 3.2, 1)}" fill="#C7AE8E" opacity=".75"/>
    <g stroke="#C2A887" stroke-width=".8" fill="none" opacity=".45">
      <path d="M-160 356C-20 334 120 320 250 306"/><path d="M290 296C370 288 450 264 548 236"/>
    </g>
    <g fill="#6E5845" opacity=".4">${knots.map(([x, y], i) => `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${2.6 - i * 0.4}" ry="1.4" transform="rotate(${-8 - i * 6} ${f(x)} ${f(y)})"/>`).join("")}</g>
    <g fill="#C7CEB3" opacity=".7"><circle cx="96" cy="322" r="1.4"/><circle cx="101" cy="324" r="1"/><circle cx="430" cy="262" r="1.3"/></g>
    ${limbLeaves}
    ${onLimb}
  </svg>
  ${twigs}`;
}

// An out-of-focus spray in the very front corner (blurred by CSS). Its bark
// uses the tree's gradient, defined once in branchSvg.
export function foreSpraySvg() {
  return `
  <svg class="fore-svg" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <radialGradient id="if-blush" cx=".5" cy=".85" r=".9"><stop offset="0" stop-color="#E9C2B7"/><stop offset="1" stop-color="#FBF1ED"/></radialGradient>
      <radialGradient id="if-ivory" cx=".5" cy=".85" r=".9"><stop offset="0" stop-color="#F1E5D4"/><stop offset="1" stop-color="#FFFDF9"/></radialGradient>
    </defs>
    <path d="${taper([[210, 200], [170, 150], [120, 120], [60, 96]], 9, 2)}" fill="url(#ib-bark)"/>
    <g fill="#B4BB9C"><path d="M140 140C150 118 170 112 186 118C176 134 160 142 140 140Z"/><path d="M96 112C90 92 100 76 116 70C120 90 112 104 96 112Z"/></g>
    ${[[60, 96, 18, "if-ivory"], [92, 120, 15, "if-blush"], [130, 112, 13, "if-ivory"], [76, 74, 12, "if-blush"]]
      .map(
        ([x, y, r, g]) =>
          `<g transform="translate(${x} ${y})">${Array.from({ length: 5 }, (_, i) => `<ellipse cx="0" cy="${-r * 0.55}" rx="${r * 0.42}" ry="${r * 0.55}" transform="rotate(${i * 72})" fill="url(#${g})"/>`).join("")}<circle r="${r * 0.18}" fill="#E8D3A8"/></g>`,
      )
      .join("")}
  </svg>`;
}

/* ── The dove ─────────────────────────────────────────────── */

// One feather: tapered quill end, widest past the middle, rounded tip, with
// a fine shaft.
function feather([x0, y0], [x1, y1], w, fill, line = "#E3DCD1", shaft = true) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = ((-dy / len) * w) / 2;
  const ny = ((dx / len) * w) / 2;
  const P = (t, s) => `${f(x0 + dx * t + nx * s)} ${f(y0 + dy * t + ny * s)}`;
  return `<path d="M${P(0, 0)}C${P(0.18, 0.55)} ${P(0.32, 1)} ${P(0.56, 1)}C${P(0.84, 1)} ${P(1, 0.62)} ${P(1, 0)}C${P(1, -0.62)} ${P(0.84, -1)} ${P(0.56, -1)}C${P(0.32, -1)} ${P(0.18, -0.55)} ${P(0, 0)}Z" fill="${fill}" stroke="${line}" stroke-width=".45"/>${shaft ? `<path d="M${P(0.05, 0)}L${P(0.86, 0.06)}" stroke="${line}" stroke-width=".5" fill="none" stroke-linecap="round"/>` : ""}`;
}

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// An open wing for flight: long primaries fanning from the wrist,
// secondaries along the trailing edge, two rows of small coverts and a
// light leading edge. (ox, oy) shifts the whole wing; the far wing uses
// cooler tones.
function openWing(ox, oy, far) {
  const S = [116 + ox, 78 + oy]; // shoulder (the hinge)
  const W = [86 + ox, 38 + oy]; // wrist
  const tone = far ? ["url(#dv-far)", "#DCD3C5"] : ["url(#dv-wing)", "#E3DCD1"];
  const tips = [[78, 2], [66, 2], [55, 7], [46, 14], [39, 23], [35, 33], [35, 43]];
  const primaries = tips
    .map(([x, y], i) => feather([W[0] - 1 + i * 0.8, W[1] + 2 + i * 1.6], [x + ox, y + oy], 8.5 - i * 0.4, tone[0], tone[1]))
    .reverse()
    .join("");
  const secondaries = Array.from({ length: 6 }, (_, i) => {
    const t = 0.1 + i * 0.16;
    const b = lerp(S, W, t);
    const len = 15 + t * 18;
    return feather(b, [b[0] - len * 0.86, b[1] + len * 0.5], 10, tone[0], tone[1]);
  }).join("");
  const coverts = (row, len, w) =>
    Array.from({ length: 6 }, (_, i) => {
      const b = lerp(S, W, 0.08 + i * 0.16);
      return feather([b[0] + row, b[1] - row * 0.4], [b[0] + row - len * 0.82, b[1] - row * 0.4 + len * 0.56], w, tone[0], tone[1]);
    }).join("");
  return `
    <path fill="${tone[0]}" d="M${S[0]} ${S[1]}L${W[0]} ${W[1]}L${54 + ox} ${30 + oy}L${48 + ox} ${56 + oy}L${96 + ox} ${86 + oy}Z"/>
    ${primaries}${secondaries}${coverts(2, 15, 9)}${coverts(5, 9, 7)}
    <path d="M${S[0] + 2} ${S[1] - 2}C${S[0] - 8} ${S[1] - 18} ${W[0] + 8} ${W[1] + 6} ${W[0]} ${W[1]}L${W[0] - 8} ${W[1] - 14}" stroke="#FFFFFF" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/>`;
}

export function doveSvg() {
  const line = (d, c = "#E2DACE", w = 0.7) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  // Folded wing, back to front: primaries reaching to the tail, then
  // secondaries, then rows of small scalloped coverts and the tertials.
  const foldPrim = [[34, 97], [38, 94.5], [42, 99.5], [47, 96.5]].map(([x, y], i) => feather([100 - i * 2, 90 - i], [x, y], 7 - i * 0.5, "url(#dv-wing)")).join("");
  const foldSec = Array.from({ length: 5 }, (_, i) => {
    const b = [104 + i * 9, 86 - i * 2.2];
    return feather(b, [b[0] - 28, b[1] + 9 - i * 0.6], 10.5, "url(#dv-wing)");
  }).join("");
  const covRow = (y0, n, len, w, step, x0) =>
    Array.from({ length: n }, (_, i) => {
      const b = [x0 + i * step, y0 - i * 0.9];
      return feather(b, [b[0] - len * 0.9, b[1] + len * 0.42], w, "url(#dv-wing)", "#ECE6DD", false);
    }).join("");
  const tailFeathers = [[16, 83], [13, 90.5], [12.5, 98], [14.5, 105], [20, 110.5]]
    .map(([x, y], i) => feather([68, 97 + i * 1.6], [x, y], 10 - Math.abs(i - 2) * 0.8, i % 2 ? "url(#dv-tail2)" : "url(#dv-body)", "#E0D8CB"))
    .join("");
  return `
  <svg viewBox="0 0 220 160" class="dove-svg" role="img" aria-label="A white dove">
    <defs>
      <linearGradient id="dv-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#FCFAF6"/><stop offset=".85" stop-color="#ECE6DC"/><stop offset="1" stop-color="#E0D8CB"/></linearGradient>
      <linearGradient id="dv-tail2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8F5EF"/><stop offset="1" stop-color="#E5DED3"/></linearGradient>
      <linearGradient id="dv-wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F8F4EE"/><stop offset="1" stop-color="#E8E1D6"/></linearGradient>
      <linearGradient id="dv-far" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2EDE5"/><stop offset="1" stop-color="#DCD3C6"/></linearGradient>
      <linearGradient id="dv-rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6D9B8" stop-opacity="0"/><stop offset="1" stop-color="#F6D9B8" stop-opacity=".75"/></linearGradient>
      <radialGradient id="dv-pearl" cx=".72" cy=".28" r=".6"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".6" stop-color="#FBF6F0" stop-opacity=".35"/><stop offset="1" stop-color="#FBF6F0" stop-opacity="0"/></radialGradient>
    </defs>
    <g class="dv-trail" fill="none" stroke="#FFFFFF" stroke-linecap="round">
      <path d="M66 88C46 84 26 88 4 96" stroke-width="2.2" opacity=".75"/>
      <path d="M70 100C52 100 34 104 14 112" stroke-width="1.6" opacity=".55"/>
      <path d="M90 60C70 50 50 50 30 56" stroke-width="1.4" opacity=".45"/>
    </g>
    <g>
      <g class="dv-wings">
        <g class="dv-wing dv-wing-far">${openWing(6, -4, true)}</g>
      </g>
      <g class="dv-tail">
        <path fill="url(#dv-body)" d="M68 96L18 84C15 90 15 96 19 100L13 107C22 111 42 109 68 104Z"/>
        ${tailFeathers}
      </g>
      <path class="dv-body" fill="url(#dv-body)" d="M62 96C66 78 86 66 112 64C134 62 150 70 158 80C164 90 156 104 138 110C118 116 92 114 76 108C68 105 62 101 62 96Z"/>
      <path d="M118 66C140 64 156 74 160 86C158 96 150 102 140 106C146 94 142 78 118 66Z" fill="url(#dv-pearl)"/>
      ${line("M132 96C138 98 144 97 150 92M128 101C134 103 141 102 147 98M136 90C141 91 146 89 151 85", "#EDE7DE", 0.8)}
      <path d="M86 70C104 64 128 62 146 70" stroke="url(#dv-rim)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M78 104C96 112 122 112 140 106" stroke="#DED4C6" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>
      <g class="dv-legs" stroke-linecap="round" fill="none">
        <path d="M110 110.5C110.2 115 109.4 119 108.6 122.8M124 109.8C124.6 114 125 118 125.2 122.8" stroke="#D89A8B" stroke-width="2.6"/>
        <path d="M108.6 114.4h2.2M108.4 117.2h2.1M108.2 120h2M124.4 113.6h2.1M124.7 116.6h2.1M124.9 119.6h2" stroke="#C3887A" stroke-width=".5"/>
        <g stroke="#D29486" stroke-width="1.7">
          <path d="M108.6 122.8C111 123.2 113.2 124.4 114.6 126.6M108.6 122.8C109.8 124.4 110.6 126 111 128.2M108.6 122.8C106.4 123 104 124 102.4 125.8"/>
          <path d="M125.2 122.8C127.6 123.2 129.8 124.4 131.2 126.6M125.2 122.8C126.4 124.4 127.2 126 127.6 128.2M125.2 122.8C123 123 120.6 124 119 125.8"/>
        </g>
        <g stroke="#8E6E62" stroke-width=".9"><path d="M114.6 126.6l.5 1.2M111 128.2l.1 1.1M102.4 125.8l-.7 1M131.2 126.6l.5 1.2M127.6 128.2l.1 1.1M119 125.8l-.7 1"/></g>
      </g>
      <g class="dv-folded">
        <path fill="url(#dv-wing)" d="M80 84C96 66 132 64 150 80C140 92 118 100 96 100C86 98 80 92 80 84Z"/>
        ${foldPrim}${foldSec}
        <g class="dv-coverts">
          ${covRow(83, 4, 14, 10, 11, 106)}${covRow(76.5, 4, 11, 9, 10, 114)}
          ${line("M100 75C106 72 112 72 116 74M112 77C118 75 124 75 128 77", "#FFFFFF", 1.2)}
        </g>
      </g>
      <g class="dv-head">
        <path fill="url(#dv-body)" d="M140 76C138 60 148 46 162 46C175 46 182 56 179 67C177 75 168 80 158 80C150 80 143 79 140 76Z"/>
        <path d="M146 54C152 48 162 45.5 172 49C164 49 156 52 150 58Z" fill="#FFFFFF" opacity=".9"/>
        <ellipse cx="163" cy="70" rx="9" ry="5.4" fill="#ECE6DD" opacity=".35"/>
        ${line("M146 74C152 78 160 79 168 77", "#E4DCD0", 0.8)}
        <path d="M152 50C160 46 170 47 176 52" stroke="url(#dv-rim)" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- beak: pale cere, slim upper mandible with a soft hook, lower mandible in shade -->
        <path fill="#E2B6A7" d="M176.4 60.6C181 60.6 185.8 61.9 189.2 64.4C185.6 65 181 65.1 176.8 64.8Z"/>
        <path fill="#CD9E90" d="M177 64.8C181 65.2 185 65.2 188 64.9C185 66.7 180.8 67.7 177.2 67.4Z"/>
        <path d="M177 64.8C181 65 185 65 189 64.4" stroke="#B9877A" stroke-width=".45" fill="none"/>
        <ellipse cx="178.4" cy="61.4" rx="2.4" ry="1.35" fill="#F5ECE7"/>
        <!-- eye: pale eye-ring, warm brown iris, two highlights -->
        <circle cx="167" cy="59.5" r="3.9" fill="#F0E4DD" stroke="#E3D1C8" stroke-width=".5"/>
        <circle cx="167" cy="59.5" r="2.45" fill="#6A4E3A"/>
        <circle cx="167" cy="59.5" r="1.45" fill="#2F2219"/>
        <circle cx="167.8" cy="58.6" r=".75" fill="#FFFFFF"/><circle cx="166.2" cy="60.5" r=".35" fill="#FFFFFF" opacity=".7"/>
        <ellipse class="dv-lid" cx="167" cy="59.5" rx="4.1" ry="4.1" fill="#F8F4EE"/>
      </g>
      <g class="dv-wings">
        <g class="dv-wing dv-wing-near">${openWing(0, 0, false)}</g>
      </g>
    </g>
  </svg>`;
}

/* ── The invitation (one design, every scene) ─────────────── */

// The rolled paper alone. Used for the letter on the bird and, scaled up,
// for both rolls in the close-up, so it never changes between shots.
export function rollSvg() {
  return `
  <svg viewBox="0 0 120 30" class="roll-svg" preserveAspectRatio="none">
    <defs>
      <linearGradient id="ir-paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFDF9"/><stop offset=".38" stop-color="#FFF9F0"/><stop offset=".8" stop-color="#EBDCC5"/><stop offset="1" stop-color="#DCC7A8"/></linearGradient>
      <radialGradient id="ir-end" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#E9D9C5"/><stop offset=".6" stop-color="#F7EEDF"/><stop offset="1" stop-color="#E2CDAF"/></radialGradient>
    </defs>
    <path d="M7 3H113C116.5 3 118 8 118 15C118 22 116.5 27 113 27H7C3.5 27 2 22 2 15C2 8 3.5 3 7 3Z" fill="url(#ir-paper)"/>
    <path d="M14 9C20 7 24 11 30 9M38 9C44 7 48 11 54 9M66 9C72 7 76 11 82 9M90 9C96 7 100 11 106 9" stroke="#D6B779" stroke-width=".55" fill="none" opacity=".85"/>
    <path d="M14 21C20 19 24 23 30 21M90 21C96 19 100 23 106 21" stroke="#D6B779" stroke-width=".55" fill="none" opacity=".75"/>
    <path d="M7 3.6H113" stroke="#FFFFFF" stroke-width=".8" opacity=".8"/>
    <ellipse cx="7" cy="15" rx="4.4" ry="11.6" fill="url(#ir-end)"/>
    <path d="M7 6C4.6 9 4.6 21 7 24C9 21 9.2 12 7.4 10.4C6 12 6.2 18 7.2 19" stroke="#D2BC98" stroke-width=".55" fill="none"/>
    <ellipse cx="113" cy="15" rx="4.4" ry="11.6" fill="url(#ir-end)"/>
    <path d="M113 6C115.4 9 115.4 21 113 24C111 21 110.8 12 112.6 10.4C114 12 113.8 18 112.8 19" stroke="#D2BC98" stroke-width=".55" fill="none"/>
  </svg>`;
}

// Ribbon, bow and seal: drawn over the roll so they can loosen and lift away.
export function bowSvg() {
  return `
  <svg viewBox="0 0 120 46" class="bow-svg">
    <defs>
      <linearGradient id="iw-satin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8E9E5"/><stop offset=".45" stop-color="#F3DFD9"/><stop offset=".8" stop-color="#E9C8BE"/><stop offset="1" stop-color="#F3DFD9"/></linearGradient>
      <radialGradient id="iw-gold" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#F0DDB0"/><stop offset=".5" stop-color="#D6B779"/><stop offset="1" stop-color="#B99A5B"/></radialGradient>
    </defs>
    <g class="bow-band"><rect x="55" y="11" width="10" height="24" fill="url(#iw-satin)"/><path d="M55 11V35M65 11V35" stroke="#E6C2B8" stroke-width=".4"/></g>
    <g class="bow-knot">
      <path d="M60 18C51 8 41 9 42 16C43 23 54 22 60 18Z" fill="url(#iw-satin)" stroke="#E6C2B8" stroke-width=".5"/>
      <path d="M60 18C69 8 79 9 78 16C77 23 66 22 60 18Z" fill="url(#iw-satin)" stroke="#E6C2B8" stroke-width=".5"/>
      <path d="M46 14C50 13 54 15 57 17M74 14C70 13 66 15 63 17" stroke="#FFFFFF" stroke-width=".7" fill="none" opacity=".8"/>
      <path d="M58 20L50 34L53.5 33L54.5 37L60.5 21ZM62 20L70 34L66.5 33L65.5 37L59.5 21Z" fill="url(#iw-satin)" stroke="#E6C2B8" stroke-width=".4"/>
    </g>
    <g class="bow-seal">
      <circle cx="60" cy="18.5" r="5.6" fill="url(#iw-gold)"/>
      <circle cx="60" cy="18.5" r="4.3" fill="none" stroke="#F3E2B8" stroke-width=".5"/>
      ${Array.from({ length: 6 }, (_, i) => `<ellipse cx="60" cy="16.4" rx=".9" ry="1.8" transform="rotate(${i * 60} 60 18.5)" fill="#C7A868"/>`).join("")}
      <circle cx="60" cy="18.5" r="1" fill="#EBD6A6"/>
    </g>
  </svg>`;
}

// The opened card: handmade ivory paper with a champagne-gold border and
// flourishes. The centre is intentionally blank.
export function cardSvg() {
  const corner = (tx, ty, sx, sy) => `
    <g transform="translate(${tx} ${ty}) scale(${sx} ${sy})" fill="none" stroke="#C9A867" stroke-linecap="round">
      <path d="M0 46C0 20 20 0 46 0" stroke-width="1.6"/>
      <path d="M8 46C8 25 25 8 46 8" stroke-width="1" opacity=".85"/>
      <path d="M14 30C14 20 20 14 30 14C24 18 20 24 18 30Z" fill="#E6CF9E" stroke-width=".5"/>
      <path d="M30 14C34 6 42 4 48 8M14 30C6 34 4 42 8 48" stroke-width=".8"/>
      <circle cx="22" cy="22" r="2.4" fill="#D6B779" stroke="none"/>
      <path d="M48 8C52 10 56 9 58 6M8 48C10 52 9 56 6 58" stroke-width=".6"/>
      <circle cx="58.5" cy="5.5" r="1.1" fill="#D6B779" stroke="none"/><circle cx="5.5" cy="58.5" r="1.1" fill="#D6B779" stroke="none"/>
    </g>`;
  const crest = (cx, cy, flip) => `
    <g transform="translate(${cx} ${cy}) scale(1 ${flip})" fill="none" stroke="#C9A867" stroke-linecap="round">
      <path d="M-34 0C-22 -2 -12 -8 -6 -14M34 0C22 -2 12 -8 6 -14" stroke-width=".8"/>
      <path d="M0 -20C-6 -12 -6 -4 0 2C6 -4 6 -12 0 -20Z" fill="#E6CF9E" stroke-width=".6"/>
      <path d="M-9 -6C-14 -10 -20 -10 -24 -6M9 -6C14 -10 20 -10 24 -6" stroke-width=".7"/>
      <circle cx="-38" cy="0" r="1.3" fill="#D6B779" stroke="none"/><circle cx="38" cy="0" r="1.3" fill="#D6B779" stroke="none"/>
    </g>`;
  const deckle = (() => {
    // A softly irregular paper edge.
    const pts = [];
    const n = 26;
    const jitter = (i, s) => Math.sin(i * 12.9898 + s) * 1.2;
    for (let i = 0; i <= n; i++) pts.push([4 + (i / n) * 232, 4 + jitter(i, 1)]);
    for (let i = 1; i <= n * 1.4; i++) pts.push([236 + jitter(i, 2), 4 + (i / (n * 1.4)) * 322]);
    for (let i = 1; i <= n; i++) pts.push([236 - (i / n) * 232, 326 + jitter(i, 3)]);
    for (let i = 1; i < n * 1.4; i++) pts.push([4 + jitter(i, 4), 326 - (i / (n * 1.4)) * 322]);
    return "M" + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L") + "Z";
  })();
  return `
  <svg viewBox="0 0 240 330" class="card-svg">
    <defs>
      <radialGradient id="ic-paper" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#FFFCF7"/><stop offset=".7" stop-color="#FFF9F0"/><stop offset="1" stop-color="#F2E5D2"/></radialGradient>
      <filter id="ic-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/>
        <feColorMatrix values="0 0 0 0 .55  0 0 0 0 .47  0 0 0 0 .35  0 0 0 .06 0"/>
        <feComposite in2="SourceGraphic" operator="in"/>
      </filter>
    </defs>
    <path d="${deckle}" fill="url(#ic-paper)"/>
    <path d="${deckle}" fill="#fff" filter="url(#ic-grain)"/>
    <rect x="16" y="16" width="208" height="298" fill="none" stroke="#C9A867" stroke-width="1.5"/>
    <rect x="22" y="22" width="196" height="286" fill="none" stroke="#D6B779" stroke-width=".8"/>
    <path d="M30 22V308M210 22V308" stroke="#E6CF9E" stroke-width=".35" stroke-dasharray="1 3"/>
    ${corner(22, 22, 1, 1)}${corner(218, 22, -1, 1)}${corner(22, 308, 1, -1)}${corner(218, 308, -1, -1)}
    ${crest(120, 44, 1)}${crest(120, 286, -1)}
  </svg>`;
}

/* ── Landing surface: an ivory stone terrace ──────────────── */

export function terraceSvg() {
  // Tile joints converge towards a vanishing point above the frame.
  const vx = 300;
  const vy = -420;
  const rays = Array.from({ length: 13 }, (_, i) => {
    const x = -300 + i * 100;
    const t = (0 - vy) / (300 - vy);
    const x0 = vx + (x - vx) * t;
    return `<path d="M${f(x0)} 0L${x} 300" />`;
  }).join("");
  const rows = [26, 60, 104, 160, 230].map((y) => `<path d="M-20 ${y}H620"/>`).join("");
  return `
  <svg class="terrace-svg" viewBox="0 0 600 300" preserveAspectRatio="xMidYMin slice">
    <defs>
      <linearGradient id="it-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6EEE1"/><stop offset=".5" stop-color="#FBF5EC"/><stop offset="1" stop-color="#EFE3D0"/></linearGradient>
      <radialGradient id="it-sun" cx=".72" cy=".2" r=".7"><stop offset="0" stop-color="#F6D9B8" stop-opacity=".55"/><stop offset="1" stop-color="#F6D9B8" stop-opacity="0"/></radialGradient>
      <filter id="it-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <rect width="600" height="300" fill="url(#it-stone)"/>
    <g stroke="#E2D0B4" stroke-width="1.4" fill="none">${rays}${rows}</g>
    <path d="M-20 12H620" stroke="#D6B779" stroke-width="1.4" opacity=".55"/>
    <path d="M-20 16H620" stroke="#D6B779" stroke-width=".6" opacity=".45"/>
    <!-- botanical shadows cast by an unseen branch -->
    <g fill="#9C8468" opacity=".18" filter="url(#it-blur)">
      <path d="M420 40C470 60 520 70 600 66L600 92C520 96 470 86 420 66Z"/>
      <ellipse cx="470" cy="70" rx="22" ry="9" transform="rotate(-18 470 70)"/>
      <ellipse cx="520" cy="96" rx="20" ry="8" transform="rotate(14 520 96)"/>
      <ellipse cx="560" cy="58" rx="18" ry="8" transform="rotate(-30 560 58)"/>
      <ellipse cx="60" cy="210" rx="26" ry="10" transform="rotate(20 60 210)"/>
      <ellipse cx="20" cy="240" rx="22" ry="9" transform="rotate(-12 20 240)"/>
    </g>
    <rect width="600" height="300" fill="url(#it-sun)"/>
  </svg>`;
}
