// Original storybook artwork for the opening intro, drawn as SVG.
// Palette: warm ivory, pearl, champagne and antique gold, blush, warm beige,
// soft sage, muted olive and pale peach sunlight. No outlines in black; depth
// comes from soft gradients, fine linework and gentle shadows.

/* ── Small geometry helpers ───────────────────────────────── */

const f = (n) => Math.round(n * 10) / 10;

// A filled, tapering stroke along a cubic Bézier: used for bark and twigs so
// they thin naturally towards their tips.
function taper([p0, p1, p2, p3], w0, w1, steps = 28) {
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
function cuspedArch(x, y, w, h) {
  const r = w / 2;
  const top = y - h;
  const s = y - h + r * 0.9;
  return `M${f(x)} ${f(y)}V${f(s)}C${f(x)} ${f(s - r * 0.35)} ${f(x + r * 0.2)} ${f(s - r * 0.5)} ${f(x + r * 0.42)} ${f(s - r * 0.55)}C${f(x + r * 0.42)} ${f(top + r * 0.2)} ${f(x + r * 0.8)} ${f(top + r * 0.05)} ${f(x + r)} ${f(top)}C${f(x + r * 1.2)} ${f(top + r * 0.05)} ${f(x + r * 1.58)} ${f(top + r * 0.2)} ${f(x + r * 1.58)} ${f(s - r * 0.55)}C${f(x + r * 1.8)} ${f(s - r * 0.5)} ${f(x + w)} ${f(s - r * 0.35)} ${f(x + w)} ${f(s)}V${f(y)}Z`;
}

// Onion dome sitting on a base line.
function onion(cx, base, w, h) {
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
  const tree = (x, y, s, dark, light) => `
    <g>
      <path d="M${x} ${y}C${x - 1} ${y - s * 0.6} ${x + 1} ${y - s * 0.9} ${x} ${y - s}" stroke="#9C8468" stroke-width="${f(s * 0.06)}" fill="none"/>
      <circle cx="${x}" cy="${f(y - s * 1.1)}" r="${f(s * 0.5)}" fill="${dark}"/>
      <circle cx="${f(x - s * 0.42)}" cy="${f(y - s * 0.9)}" r="${f(s * 0.38)}" fill="${dark}"/>
      <circle cx="${f(x + s * 0.44)}" cy="${f(y - s * 0.92)}" r="${f(s * 0.36)}" fill="${dark}"/>
      <circle cx="${f(x + s * 0.12)}" cy="${f(y - s * 1.3)}" r="${f(s * 0.34)}" fill="${light}"/>
      <circle cx="${f(x + s * 0.48)}" cy="${f(y - s * 1.02)}" r="${f(s * 0.2)}" fill="${light}" opacity=".8"/>
    </g>`;
  const cypress = (x, y, h) =>
    `<path d="M${x} ${y}C${x - 9} ${y - h * 0.3} ${x - 7} ${y - h * 0.75} ${x} ${y - h}C${x + 7} ${y - h * 0.75} ${x + 9} ${y - h * 0.3} ${x} ${y}Z" fill="#B9C1A2"/><path d="M${x + 1} ${y - h * 0.9}C${x + 5} ${y - h * 0.6} ${x + 6} ${y - h * 0.3} ${x + 3} ${y}" stroke="#CDD4BC" stroke-width="2" fill="none"/>`;
  const shrub = (x, y, w) =>
    `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${f(w * 0.55)}" fill="#C7CEB3"/><ellipse cx="${f(x + w * 0.25)}" cy="${f(y - w * 0.18)}" rx="${f(w * 0.55)}" ry="${f(w * 0.3)}" fill="#D3D9C2"/>` +
    [0, 1, 2, 3, 4].map((i) => `<circle cx="${f(x - w * 0.6 + i * w * 0.3)}" cy="${f(y - w * 0.25 + (i % 2) * 5)}" r="2.2" fill="${i % 2 ? "#F3DFD9" : "#FFFCF7"}"/>`).join("");
  const posts = Array.from({ length: 9 }, (_, i) => {
    const x = 20 + i * 70;
    return `<rect x="${x - 4}" y="138" width="8" height="26" fill="#EFE3CF"/><circle cx="${x}" cy="136" r="4.5" fill="#E9D9C5"/>`;
  }).join("");
  // The middle copy carries the walk to the palace; the side copies only
  // extend the lawn, trees and wall for wide screens.
  const side = `
    <rect x="-10" y="0" width="620" height="220" fill="url(#ig-lawn)"/>
    ${tree(40, 150, 80, "#AEB596", "#C7CEB3")}${tree(120, 156, 58, "#B9C0A1", "#CDD3BB")}
    ${tree(560, 150, 82, "#AEB596", "#C7CEB3")}${tree(480, 158, 56, "#B9C0A1", "#CDD3BB")}
    ${cypress(196, 150, 96)}${cypress(214, 152, 76)}${cypress(404, 150, 96)}${cypress(386, 152, 76)}
    <rect x="-10" y="144" width="620" height="22" fill="#F1E6D3"/>
    <rect x="-10" y="142" width="620" height="2.5" fill="#E2CDAC"/>
    <rect x="-10" y="141.5" width="620" height=".7" fill="#D6B779" opacity=".7"/>
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

/* ── Flowering branch (foreground) ────────────────────────── */

function blossom(x, y, r, blush = false, rot = 0) {
  const id = blush ? "url(#ib-blush)" : "url(#ib-ivory)";
  const edge = blush ? "#E6C2B8" : "#E4D5C1";
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = rot + i * 72;
    return `<path d="M${x} ${y}C${f(x - r * 0.55)} ${f(y - r * 0.35)} ${f(x - r * 0.5)} ${f(y - r * 1.05)} ${x} ${f(y - r * 1.1)}C${f(x + r * 0.5)} ${f(y - r * 1.05)} ${f(x + r * 0.55)} ${f(y - r * 0.35)} ${x} ${y}Z" transform="rotate(${a} ${x} ${y})" fill="${id}" stroke="${edge}" stroke-width=".5"/>`;
  }).join("");
  const stamens = Array.from({ length: 6 }, (_, i) => {
    const a = ((rot + i * 60) * Math.PI) / 180;
    const sx = x + Math.cos(a) * r * 0.42;
    const sy = y + Math.sin(a) * r * 0.42;
    return `<path d="M${x} ${y}L${f(sx)} ${f(sy)}" stroke="#C9AE7A" stroke-width=".5"/><circle cx="${f(sx)}" cy="${f(sy)}" r=".9" fill="#D6B779"/>`;
  }).join("");
  return `<g>${petals}<circle cx="${x}" cy="${y}" r="${f(r * 0.2)}" fill="#E8D3A8"/>${stamens}</g>`;
}

function bud(x, y, s, rot) {
  return `<g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x}" cy="${y - s}" rx="${f(s * 0.55)}" ry="${s}" fill="url(#ib-blush)" stroke="#E6C2B8" stroke-width=".5"/><path d="M${x} ${y}L${x} ${y + s * 0.8}" stroke="#9C8468" stroke-width="1"/></g>`;
}

function leaf(x, y, len, rot, tone) {
  const fill = ["url(#ib-leaf1)", "url(#ib-leaf2)", "url(#ib-leaf3)"][tone % 3];
  return `<g transform="rotate(${rot} ${x} ${y})"><path d="M${x} ${y}C${f(x + len * 0.25)} ${f(y - len * 0.3)} ${f(x + len * 0.72)} ${f(y - len * 0.26)} ${x + len} ${y}C${f(x + len * 0.7)} ${f(y + len * 0.22)} ${f(x + len * 0.28)} ${f(y + len * 0.22)} ${x} ${y}Z" fill="${fill}"/><path d="M${x} ${y}C${f(x + len * 0.4)} ${f(y - len * 0.04)} ${f(x + len * 0.7)} ${f(y - len * 0.02)} ${f(x + len * 0.92)} ${y}" stroke="#9EA684" stroke-width=".6" fill="none"/></g>`;
}

export function branchSvg() {
  const main = [
    [-320, 384],
    [-40, 330],
    [250, 312],
    [600, 222],
  ];
  const twigs = [
    [[150, 312], [168, 294], [184, 286], [204, 281]],
    [[62, 322], [52, 306], [46, 294], [42, 282]],
    [[236, 306], [246, 292], [256, 280], [264, 268]],
    [[402, 280], [400, 292], [396, 300], [392, 304]],
    [[446, 264], [458, 254], [466, 246], [472, 238]],
    [[498, 250], [506, 240], [508, 232], [506, 224]],
    [[522, 240], [532, 248], [538, 254], [544, 258]],
  ];
  const blossoms = [
    [72, 312, 12, false, 10], [100, 296, 9, true, 30], [150, 318, 11, false, 50], [198, 280, 10, false, 5],
    [212, 290, 8, true, 40], [240, 309, 8.5, true, 20], [264, 266, 8, false, 35], [430, 262, 11, false, 15],
    [474, 236, 9, true, 40], [507, 222, 11.5, false, 0], [494, 238, 8, false, 60], [394, 302, 8.5, false, 60],
    [546, 258, 9, true, 25], [40, 280, 8.5, true, 12], [30, 300, 9, false, 44], [456, 250, 7, false, 20],
  ];
  const buds = [[118, 288, 4, -20], [228, 284, 3.5, 15], [520, 228, 4, 10], [416, 270, 3.5, -30], [56, 290, 3.5, -10]];
  const leaves = [
    [86, 318, 26, 160, 0], [124, 306, 23, -30, 1], [172, 300, 27, 200, 2], [214, 296, 21, -40, 0], [252, 300, 25, 20, 1],
    [404, 282, 25, -25, 2], [448, 258, 23, 210, 0], [486, 250, 27, -50, 1], [520, 240, 21, 190, 2], [372, 296, 23, 30, 0],
    [16, 318, 22, 150, 1], [330, 302, 20, -20, 2],
  ];
  // Fine bark texture: a few lighter strokes riding along the branch.
  const texture = [
    "M-200 360C-60 336 90 322 240 310",
    "M-120 352C20 332 160 318 300 304",
    "M300 302C380 296 460 270 560 238",
  ];
  return `
  <svg class="branch-svg" viewBox="0 0 560 420" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="ib-bark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A88E70"/><stop offset=".55" stop-color="#8E735A"/><stop offset="1" stop-color="#76604B"/></linearGradient>
      <radialGradient id="ib-ivory" cx=".5" cy=".85" r=".9"><stop offset="0" stop-color="#F3E9DB"/><stop offset=".45" stop-color="#FFFCF7"/><stop offset="1" stop-color="#FFFDF9"/></radialGradient>
      <radialGradient id="ib-blush" cx=".5" cy=".85" r=".9"><stop offset="0" stop-color="#EBC6BC"/><stop offset=".5" stop-color="#F3DFD9"/><stop offset="1" stop-color="#FAEEEA"/></radialGradient>
      <linearGradient id="ib-leaf1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C7CEB3"/><stop offset="1" stop-color="#AEB596"/></linearGradient>
      <linearGradient id="ib-leaf2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D3D9C2"/><stop offset="1" stop-color="#B7BE9F"/></linearGradient>
      <linearGradient id="ib-leaf3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#BFC7A8"/><stop offset="1" stop-color="#A3AB8A"/></linearGradient>
    </defs>
    <path d="${taper(main, 15, 6)}" fill="url(#ib-bark)"/>
    ${twigs.map((t, i) => `<path d="${taper(t, 4.2 - (i % 3) * 0.8, 1.2)}" fill="url(#ib-bark)"/>`).join("")}
    <g stroke="#C2A887" stroke-width=".9" fill="none" opacity=".55">${texture.map((d) => `<path d="${d}"/>`).join("")}</g>
    <g fill="#6E5845" opacity=".35"><ellipse cx="118" cy="314" rx="3" ry="1.6"/><ellipse cx="330" cy="296" rx="2.6" ry="1.4"/></g>
    ${leaves.map(([x, y, l, r, t]) => leaf(x, y, l, r, t)).join("")}
    ${buds.map(([x, y, s, r]) => bud(x, y, s, r)).join("")}
    ${blossoms.map(([x, y, r, b, rot]) => blossom(x, y, r, b, rot)).join("")}
  </svg>`;
}

/* ── The dove ─────────────────────────────────────────────── */

export function doveSvg() {
  const feathers = (d) => `<path d="${d}" stroke="#E2DCD3" stroke-width=".8" fill="none" stroke-linecap="round"/>`;
  return `
  <svg viewBox="0 0 220 160" class="dove-svg" role="img" aria-label="A white dove">
    <defs>
      <linearGradient id="dv-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#FCFAF6"/><stop offset=".85" stop-color="#ECE6DC"/><stop offset="1" stop-color="#E2DACD"/></linearGradient>
      <linearGradient id="dv-wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F7F3EC"/><stop offset="1" stop-color="#E6DFD4"/></linearGradient>
      <linearGradient id="dv-far" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F1ECE4"/><stop offset="1" stop-color="#DDD5C8"/></linearGradient>
      <linearGradient id="dv-rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6D9B8" stop-opacity="0"/><stop offset="1" stop-color="#F6D9B8" stop-opacity=".7"/></linearGradient>
      <filter id="dv-soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2.2" stdDeviation="2.4" flood-color="#9C8468" flood-opacity=".22"/></filter>
    </defs>
    <g filter="url(#dv-soft)">
      <g class="dv-wings">
        <g class="dv-wing dv-wing-far">
          <path fill="url(#dv-far)" d="M124 76C120 52 106 26 78 6C74 16 78 24 82 30C70 22 58 20 46 22C58 32 68 40 80 46C68 46 58 50 50 56C70 60 90 66 108 82Z"/>
          ${feathers("M116 70C108 52 96 36 80 20M108 74C96 62 82 52 60 40")}
        </g>
      </g>
      <g class="dv-tail">
        <path fill="url(#dv-body)" d="M68 96L18 84C15 90 15 96 19 100L13 107C22 111 42 109 68 104Z"/>
        ${feathers("M66 99L24 90M66 101L20 101M66 103L24 108")}
      </g>
      <path class="dv-body" fill="url(#dv-body)" d="M62 96C66 78 86 66 112 64C134 62 150 70 158 80C164 90 156 104 138 110C118 116 92 114 76 108C68 105 62 101 62 96Z"/>
      <path d="M86 70C104 64 128 62 146 70" stroke="url(#dv-rim)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M78 104C96 112 122 112 140 106" stroke="#E2D9CC" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>
      <g class="dv-legs" stroke="#D29E8F" stroke-width="2.2" stroke-linecap="round" fill="none">
        <path d="M110 111L108 123"/><path d="M108 123L101.5 126.5M108 123L113.5 126.5M108 123L106 127.5"/>
        <path d="M124 110L125 123"/><path d="M125 123L118.5 126.5M125 123L130.5 126.5M125 123L123 127.5"/>
        <g stroke="#A97C6E" stroke-width="1"><path d="M101.5 126.5L100.6 128M113.5 126.5L114.4 128M118.5 126.5L117.6 128M130.5 126.5L131.4 128"/></g>
      </g>
      <g class="dv-folded">
        <path fill="url(#dv-wing)" d="M80 84C96 66 132 64 150 80C140 92 118 100 96 100C86 98 80 92 80 84Z"/>
        <path fill="url(#dv-wing)" d="M86 92C70 96 50 99 34 98C50 91 68 87 86 85Z"/>
        ${feathers("M96 78C110 74 128 74 142 80M92 86C108 82 126 83 140 88M88 93C104 91 118 92 130 95M80 92L42 96M84 89L48 92")}
        <path d="M100 75C106 72 112 72 116 74M112 77C118 75 124 75 128 77" stroke="#ECE6DC" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      </g>
      <g class="dv-head">
        <path fill="url(#dv-body)" d="M140 76C138 60 148 46 162 46C175 46 182 56 179 67C177 75 168 80 158 80C150 80 143 79 140 76Z"/>
        <path d="M152 50C160 46 170 47 176 52" stroke="url(#dv-rim)" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path fill="#E5BCAD" d="M177 61.2L188.6 64.2L177 67.6Z"/>
        <path fill="#CFA092" d="M177 64.6L188.6 64.2L177 67.6Z"/>
        <path fill="#F3E4DD" d="M174.6 59.4C176.6 58.8 178.6 59.8 179.2 61.4L175.6 62.2Z"/>
        <circle cx="167" cy="59.5" r="3.4" fill="#F1E9E1"/>
        <circle cx="167" cy="59.5" r="2.1" fill="#4A3B2E"/><circle cx="167.7" cy="58.8" r=".65" fill="#FFFFFF"/>
      </g>
      <g class="dv-wings">
        <g class="dv-wing dv-wing-near">
          <path fill="url(#dv-wing)" d="M118 80C112 56 98 30 70 10C66 20 70 28 74 34C62 26 50 24 38 26C50 36 60 44 72 50C60 50 50 54 42 60C62 64 82 70 100 86Z"/>
          ${feathers("M112 72C102 52 90 36 72 18M104 76C92 62 76 50 50 34M98 80C86 72 70 64 50 58")}
          <path d="M116 76C108 64 100 56 90 50" stroke="#ECE6DC" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
        </g>
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
