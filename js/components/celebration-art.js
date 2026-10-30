// Artwork for "The Celebration": the same hand-drawn palace, garden and
// blossoms as the opening intro (intro-art.js), plus gold ornaments for the
// invitation panel. Every piece is its own SVG, so the section stays
// responsive and each part can animate on its own.
//
// The intro's gradients live in a layer that is hidden once it ends (or the
// whole time, when the intro film plays). Browsers will not paint with
// gradients from a hidden SVG, so each copy here gets its own id prefix.
import { palaceSvg, gardenSvg, blossom, blossomSide, bud, leaf, taper, FLOWER_DEFS, BARK_DEFS } from "./intro-art.js";

const scoped = (svg, from, to) => svg.replaceAll(`id="${from}`, `id="${to}`).replaceAll(`url(#${from}`, `url(#${to}`);

export const celPalace = (prefix = "cp-") => scoped(palaceSvg(), "ia-", prefix);

export const celGarden = () => scoped(gardenSvg(), "ig-", "cgd-");

// A blossom spray for the section's corners: a tapering twig with open
// flowers, a side-view bloom, buds and sage leaves.
export function celSpray() {
  const body = `
    <path d="${taper([[-10, 214], [40, 170], [96, 120], [190, 64]], 7, 1.2)}" fill="url(#ib-bark)"/>
    <path d="${taper([[70, 140], [76, 110], [92, 86], [112, 70]], 3.2, 0.9)}" fill="url(#ib-bark)"/>
    <path d="${taper([[120, 104], [140, 108], [160, 120], [176, 140]], 2.8, 0.8)}" fill="url(#ib-bark)"/>
    ${leaf(40, 170, 30, -70, 0, true)}${leaf(60, 152, 26, 160, 1)}${leaf(96, 120, 28, -40, 2)}${leaf(130, 98, 24, 170, 0, true)}${leaf(150, 84, 26, -30, 1)}${leaf(156, 118, 22, 60, 2)}
    ${blossom(190, 62, 13, 0, 10)}${blossom(112, 68, 11, 1, 30)}${blossom(176, 142, 10.5, 0, 40)}
    ${blossomSide(168, 80, 9, 2, 20)}${blossom(84, 100, 8, 2, 0)}${blossom(146, 64, 8.5, 1, 50)}
    ${bud(200, 84, 3.6, 40)}${bud(126, 52, 3.2, -20)}${bud(186, 156, 3, 150)}`;
  return scoped(
    `<svg class="cel-spray-svg" viewBox="0 0 220 220" aria-hidden="true"><defs>${FLOWER_DEFS}${BARK_DEFS}</defs>${body}</svg>`,
    "ib-",
    "cs-",
  );
}

// A gold corner flourish for the invitation panel: an outer bracket, a
// curling vine, two leaves and a tiny blush blossom. The lines draw on
// (pathLength="1"); the flower and leaves fade in after.
export function celCorner(cls) {
  return `
  <svg class="cel-corner ${cls}" viewBox="0 0 120 120" aria-hidden="true" data-cel>
    <g fill="none" stroke="#B89255" stroke-linecap="round">
      <path class="cel-draw" pathLength="1" d="M6 112V30C6 16 16 6 30 6H112" stroke-width="1.3"/>
      <path class="cel-draw" pathLength="1" d="M14 96V36C14 24 24 14 36 14H96" stroke-width=".7"/>
      <path class="cel-draw" pathLength="1" d="M22 72C22 44 44 22 72 22C60 28 50 38 46 52C42 66 32 72 22 72Z" stroke-width=".8"/>
      <path class="cel-draw" pathLength="1" d="M46 52C54 46 62 46 68 50C62 54 54 56 46 52ZM40 60C38 70 40 78 46 84" stroke-width=".7"/>
      <path class="cel-draw" pathLength="1" d="M72 22C80 18 88 20 92 26M22 72C18 80 20 88 26 92" stroke-width=".7"/>
    </g>
    <g class="cel-bloom">
      <path d="M58 40C62 32 72 30 76 34C72 40 64 42 58 40Z" fill="#B4BB9C"/>
      <path d="M40 58C32 62 30 72 34 76C40 72 42 64 40 58Z" fill="#C7CEB3"/>
      ${Array.from({ length: 5 }, (_, i) => `<ellipse cx="34" cy="29" rx="3.2" ry="4.6" transform="rotate(${i * 72} 34 34)" fill="#F1D6CE" stroke="#E2B9AE" stroke-width=".4"/>`).join("")}
      <circle cx="34" cy="34" r="1.8" fill="#D6B779"/>
      <circle cx="96" cy="26" r="1.4" fill="#D6B779"/><circle cx="26" cy="96" r="1.4" fill="#D6B779"/>
    </g>
  </svg>`;
}

// A small crest that sits on the panel's top edge: a lotus between two
// fine scrolls.
export function celCrest() {
  return `
  <svg class="cel-crest-svg" viewBox="0 0 160 44" aria-hidden="true">
    <g fill="none" stroke="#B89255" stroke-linecap="round">
      <path class="cel-draw" pathLength="1" d="M4 30C24 30 40 26 56 18M156 30C136 30 120 26 104 18" stroke-width=".9"/>
      <path class="cel-draw" pathLength="1" d="M40 30C44 22 52 20 58 24M120 30C116 22 108 20 102 24" stroke-width=".7"/>
    </g>
    <g class="cel-bloom">
      <path d="M80 4C72 12 72 24 80 32C88 24 88 12 80 4Z" fill="#F1D6CE" stroke="#D9AFA3" stroke-width=".5"/>
      <path d="M80 32C70 30 62 22 60 14C70 16 77 22 80 32ZM80 32C90 30 98 22 100 14C90 16 83 22 80 32Z" fill="#F6E3DD" stroke="#D9AFA3" stroke-width=".5"/>
      <path d="M66 34H94" stroke="#B89255" stroke-width=".9"/>
      <circle cx="80" cy="38" r="1.6" fill="#D6B779"/><circle cx="4" cy="30" r="1.3" fill="#D6B779"/><circle cx="156" cy="30" r="1.3" fill="#D6B779"/>
    </g>
  </svg>`;
}

// A fine divider between the panel's parts: two hairlines and a small
// four-petal motif.
export function celDivider() {
  return `
  <svg class="cel-divider" viewBox="0 0 220 16" aria-hidden="true" data-cel>
    <g fill="none" stroke="#C7A86C" stroke-linecap="round">
      <path class="cel-draw" pathLength="1" d="M98 8H8M122 8H212" stroke-width=".8"/>
    </g>
    <g class="cel-bloom" fill="#D6B779">
      ${Array.from({ length: 4 }, (_, i) => `<ellipse cx="110" cy="3.6" rx="2" ry="3.6" transform="rotate(${i * 90 + 45} 110 8)"/>`).join("")}
      <circle cx="110" cy="8" r="1.3" fill="#F6E3DD"/><circle cx="4" cy="8" r="1.1"/><circle cx="216" cy="8" r="1.1"/>
    </g>
  </svg>`;
}
