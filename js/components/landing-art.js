// Line artwork for the first screen (the framed engagement film): a faint
// watermark of palace arches and jharokhas along the top, fine botanical
// branches in the upper corners, small gold flourishes near the lower
// corners, and the frame's gold rules and corners. Strokes carry
// pathLength="1" so they can draw on; small blossoms and leaves fade in
// after (classes ld-draw and ld-bloom, styled in css/styles.css).
import { cuspedArch, onion } from "./intro-art.js";

const f = (n) => Math.round(n * 10) / 10;

// The watermark: a low arcade with two jharokha balconies and a central
// dome, outlines only, very pale.
export function landingArches() {
  const arcade = Array.from({ length: 13 }, (_, i) => {
    const x = 20 + i * 74;
    return `<path d="${cuspedArch(x, 290, 52, 96)}"/>`;
  }).join("");
  const jharokha = (x, y, w) => {
    const h = w * 0.9;
    return `<path d="M${x} ${y + h}H${x + w}V${y}H${x}Z"/><path d="${cuspedArch(x + w * 0.16, y + h * 0.92, w * 0.68, h * 0.72)}"/><path d="M${f(x - w * 0.16)} ${y}H${f(x + w * 1.16)}L${x + w} ${f(y - h * 0.12)}H${x}Z"/><path d="${onion(x + w / 2, f(y - h * 0.12), f(w * 0.9), f(h * 0.5))}"/><path d="M${f(x - w * 0.12)} ${y + h}H${f(x + w * 1.12)}L${f(x + w * 0.92)} ${f(y + h * 1.22)}H${f(x + w * 0.08)}Z"/>`;
  };
  return `
  <svg class="ld-arches-svg" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
    <g fill="none" stroke="#C9A867" stroke-width="1.1" stroke-linejoin="round">
      <path d="${onion(500, 120, 150, 120)}"/><path d="M430 120H570V150H430Z"/><path d="M500 0V-10"/>
      ${jharokha(250, 70, 70)}${jharokha(680, 70, 70)}
      <path d="M0 190H1000M0 196H1000"/>
      ${arcade}
    </g>
  </svg>`;
}

// A fine flowering branch for an upper corner: thin stems drawn in warm
// taupe, then small sage leaves and blush blossoms. Mirrored for the right.
export function landingBranch() {
  const leaf = (x, y, r, l = 12) =>
    `<path class="ld-bloom" d="M0 0C${f(l * 0.3)} ${f(-l * 0.32)} ${f(l * 0.75)} ${f(-l * 0.3)} ${l} 0C${f(l * 0.72)} ${f(l * 0.26)} ${f(l * 0.3)} ${f(l * 0.28)} 0 0Z" transform="translate(${x} ${y}) rotate(${r})" fill="#BCC4A6"/>`;
  const blossom = (x, y, s, blush = true) =>
    `<g class="ld-bloom" transform="translate(${x} ${y})">${Array.from({ length: 5 }, (_, i) => `<ellipse cx="0" cy="${f(-s * 0.55)}" rx="${f(s * 0.42)}" ry="${f(s * 0.58)}" transform="rotate(${i * 72})" fill="${blush ? "#F2D8D0" : "#FBF3EC"}" stroke="${blush ? "#E2B8AC" : "#E6D6C4"}" stroke-width=".4"/>`).join("")}<circle r="${f(s * 0.2)}" fill="#D6B779"/></g>`;
  const bud = (x, y, r) => `<path class="ld-bloom" d="M0 0C-2.4 -3 -2.2 -7 0 -9C2.2 -7 2.4 -3 0 0Z" transform="translate(${x} ${y}) rotate(${r})" fill="#EFCFC6"/>`;
  return `
  <svg class="ld-branch-svg" viewBox="0 0 220 200" aria-hidden="true">
    <g fill="none" stroke="#A8957A" stroke-linecap="round">
      <path class="ld-draw" pathLength="1" d="M-6 6C40 22 78 34 118 62C146 82 170 108 186 140" stroke-width="1.6"/>
      <path class="ld-draw" pathLength="1" d="M58 30C66 46 70 62 68 80" stroke-width="1"/>
      <path class="ld-draw" pathLength="1" d="M118 62C132 58 148 60 162 68" stroke-width="1"/>
      <path class="ld-draw" pathLength="1" d="M150 96C142 112 140 126 144 140" stroke-width=".9"/>
      <path class="ld-draw" pathLength="1" d="M92 46C100 36 104 26 104 14" stroke-width=".9"/>
    </g>
    ${leaf(40, 22, 30, 14)}${leaf(64, 48, 120, 12)}${leaf(86, 42, -40, 13)}${leaf(128, 64, 200, 12)}${leaf(140, 84, 50, 14)}${leaf(170, 116, -20, 12)}${leaf(146, 122, 110, 11)}
    ${blossom(68, 82, 7)}${blossom(104, 12, 6, false)}${blossom(164, 68, 7.5)}${blossom(186, 142, 8, false)}${blossom(144, 142, 6)}
    ${bud(118, 40, 20)}${bud(196, 128, 60)}${bud(52, 60, -10)}
  </svg>`;
}

// A small gold scroll for a lower corner.
export function landingFlourish() {
  return `
  <svg class="ld-flourish-svg" viewBox="0 0 140 60" aria-hidden="true">
    <g fill="none" stroke="#C3A064" stroke-linecap="round">
      <path class="ld-draw" pathLength="1" d="M4 56C24 56 40 48 52 36C62 26 74 22 86 26C96 30 98 42 88 46C80 49 74 42 80 36" stroke-width="1"/>
      <path class="ld-draw" pathLength="1" d="M52 36C60 44 72 48 88 48C104 48 118 42 134 34" stroke-width=".7"/>
    </g>
    <g class="ld-bloom" fill="#D6B779"><circle cx="134" cy="34" r="1.5"/><circle cx="4" cy="56" r="1.5"/><circle cx="110" cy="44" r="1"/></g>
  </svg>`;
}

// The frame's outer gold rule: eight hairlines that grow from the corners
// and meet in the middle of each side (drawn with CSS backgrounds, so the
// line stays exactly one pixel at any frame size).
export function frameRules() {
  return `<span class="film-rules" aria-hidden="true"></span>`;
}

// A refined corner: a gold bracket just outside the frame's corner, a small
// curl along each side and one tiny blossom with two leaves at the point.
export function frameCorner(cls) {
  return `
  <svg class="film-corner ${cls}" viewBox="0 0 64 64" aria-hidden="true">
    <g fill="none" stroke="#B89255" stroke-linecap="round">
      <path class="ld-draw" pathLength="1" d="M6 40V14C6 9.6 9.6 6 14 6H40" stroke-width="1.1"/>
      <path class="ld-draw" pathLength="1" d="M40 6C46 6 50 9 50 13C50 16 47 17 45 15M6 40C6 46 9 50 13 50C16 50 17 47 15 45" stroke-width=".7"/>
    </g>
    <g class="ld-bloom">
      <path d="M12 12C8 6 9 2 13 1C14 5 14 9 12 12Z" fill="#BCC4A6"/>
      <path d="M12 12C6 8 2 9 1 13C5 14 9 14 12 12Z" fill="#C7CEB3"/>
      ${Array.from({ length: 5 }, (_, i) => `<ellipse cx="13" cy="10.4" rx="2.1" ry="2.9" transform="rotate(${i * 72} 13 13)" fill="#F2D8D0" stroke="#E2B8AC" stroke-width=".35"/>`).join("")}
      <circle cx="13" cy="13" r="1.1" fill="#D6B779"/>
    </g>
  </svg>`;
}

// Palace scenery for the sides of the invitation card: a carved column and
// cusped arch with a jharokha above, a small chhatri on top, two cypresses
// and a lotus at the foot. Soft beige washes with fine gold lines, drawn in
// the same hand as the rest. Mirrored for the right-hand side.
export function invSide() {
  const g = "#C9A867";
  return `
  <svg class="inv-side-svg" viewBox="0 0 220 640" aria-hidden="true">
    <defs>
      <linearGradient id="iv-stone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EADCC4"/><stop offset=".6" stop-color="#F4EADA"/><stop offset="1" stop-color="#EFE2CC"/></linearGradient>
      <linearGradient id="iv-dome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E4D3B6"/><stop offset=".6" stop-color="#F8F0E2"/><stop offset="1" stop-color="#EADBC2"/></linearGradient>
    </defs>
    <!-- chhatri -->
    <g>
      <path d="${onion(110, 132, 74, 66)}" fill="url(#iv-dome)" stroke="${g}" stroke-width=".8"/>
      <path d="M106 66L110 50L114 66Z" fill="#D6B779"/><circle cx="110" cy="64" r="3" fill="#D6B779"/>
      <rect x="66" y="132" width="88" height="8" fill="#E4D3B6" stroke="${g}" stroke-width=".6"/>
      <rect x="74" y="140" width="8" height="46" fill="url(#iv-stone)"/><rect x="138" y="140" width="8" height="46" fill="url(#iv-stone)"/>
      <path d="${cuspedArch(84, 186, 52, 44)}" fill="#E9DBC3" opacity=".7"/>
      <rect x="60" y="186" width="100" height="8" fill="#E4D3B6" stroke="${g}" stroke-width=".6"/>
    </g>
    <!-- jharokha balcony -->
    <g>
      <rect x="62" y="194" width="96" height="120" fill="url(#iv-stone)"/>
      <path d="${cuspedArch(78, 296, 64, 80)}" fill="#E2D0B2" stroke="${g}" stroke-width=".7"/>
      <path d="M78 296H142" stroke="${g}" stroke-width=".7"/>
      ${Array.from({ length: 6 }, (_, i) => `<path d="M${84 + i * 10} 296V266" stroke="#F6EEE0" stroke-width="1.2"/>`).join("")}
      <path d="M52 314H168L156 330H64Z" fill="#E4D3B6" stroke="${g}" stroke-width=".6"/>
      ${Array.from({ length: 5 }, (_, i) => `<path d="M${72 + i * 19} 330L${76 + i * 19} 342L${80 + i * 19} 330" fill="none" stroke="${g}" stroke-width=".6"/>`).join("")}
    </g>
    <!-- column and great arch -->
    <g>
      <rect x="40" y="342" width="140" height="236" fill="url(#iv-stone)"/>
      <path d="${cuspedArch(62, 578, 96, 170)}" fill="#E6D6BC" stroke="${g}" stroke-width=".8"/>
      <path d="${cuspedArch(74, 578, 72, 146)}" fill="none" stroke="${g}" stroke-width=".5" opacity=".7"/>
      <rect x="40" y="342" width="22" height="236" fill="#E2D2B6"/><rect x="158" y="342" width="22" height="236" fill="#EBDDC5"/>
      ${[360, 420, 480, 540].map((y) => `<path d="M40 ${y}H62M158 ${y}H180" stroke="${g}" stroke-width=".5" opacity=".7"/>`).join("")}
      <rect x="34" y="338" width="152" height="6" fill="#E4D3B6" stroke="${g}" stroke-width=".5"/>
      <rect x="30" y="578" width="160" height="10" fill="#E4D3B6" stroke="${g}" stroke-width=".5"/>
    </g>
    <!-- cypresses and a lotus at the foot -->
    <g>
      <path d="M22 600C12 560 14 500 24 450C34 500 36 560 26 600Z" fill="#BCC4A6"/>
      <path d="M200 604C190 572 192 524 200 486C208 524 210 572 202 604Z" fill="#C7CEB3"/>
      <path d="M24 600V614M201 604V614" stroke="#A8957A" stroke-width="2"/>
      <g transform="translate(110 612)">
        ${[-50, -25, 0, 25, 50].map((a) => `<path d="M0 0C-6 -8 -6 -20 0 -28C6 -20 6 -8 0 0Z" transform="rotate(${a})" fill="#F2D8D0" stroke="#E2B8AC" stroke-width=".5"/>`).join("")}
        <path d="M-30 4H30" stroke="#BCC4A6" stroke-width="3" stroke-linecap="round"/>
      </g>
    </g>
  </svg>`;
}
