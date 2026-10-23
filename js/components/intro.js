// WeddingIntro: the opening scene. A dove waits on a blossom branch with the
// rolled invitation tied to its feet; one tap sends it flying, the letter
// drops, unrolls, and its golden light dissolves into the website.
//
// Everything is drawn in SVG/CSS (no image or video assets), and every step
// waits for the previous animation's `finished` promise, so the order is fixed.
// It is a layer above the page, never a gate: Skip and Escape end it at once,
// deep links bypass it, and any error simply reveals the site.
import { esc, prefersReducedMotion, formatWeekday, formatDate, toDate } from "../utils.js";
import { hasMusic } from "./music.js";

export const INTRO_STATES = [
  "NEW_INTRO_IDLE",
  "BIRD_TAKEOFF",
  "BIRD_FLIGHT",
  "INVITATION_DROP",
  "LETTER_CLOSEUP",
  "LETTER_OPENING",
  "GOLDEN_LIGHT_REVEAL",
  "EXISTING_WEBSITE_VISIBLE",
];

const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

export function WeddingIntro(el, config, { reducedMotion = prefersReducedMotion() } = {}) {
  if (location.hash && location.hash !== "#home") return;

  const { couple, event } = config;
  const first = toDate(event.functions[0]?.start);
  const dateLine = first ? `${formatWeekday(first, event.timeZone)} · ${formatDate(first, event.timeZone)}` : "";
  const music = hasMusic(config);

  el.hidden = false;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", `Invitation from ${couple.partnerOne.first} and ${couple.partnerTwo.first}`);
  el.innerHTML = `
    <div class="intro-world" aria-hidden="true">
      <div class="intro-sky"></div>
      <div class="intro-beams"></div>
      <div class="intro-layer intro-far">${palaceSvg()}</div>
      <div class="intro-layer intro-mid">${gardenSvg()}<div class="intro-bokeh">${bokeh(9)}</div></div>
      <div class="intro-surface"><div class="intro-surface-petals">${restingPetals()}</div></div>
      <div class="intro-layer intro-near"><div class="perch-box">${branchSvg()}</div></div>
    </div>

    <div class="intro-petals" aria-hidden="true">${fallingPetals(12)}</div>

    <div class="perch-box intro-carrier-box" aria-hidden="true">
      <div class="intro-carrier">
        <div class="dove">${doveSvg()}</div>
        <div class="scroll-sm">${scrollSvg()}</div>
      </div>
    </div>

    <div class="cl" aria-hidden="true">
      <div class="cl-box">
        <div class="cl-card">
          <svg class="cl-corner tl"><use href="#corner"></use></svg><svg class="cl-corner tr"><use href="#corner"></use></svg>
          <svg class="cl-corner bl"><use href="#corner"></use></svg><svg class="cl-corner br"><use href="#corner"></use></svg>
          <div class="cl-content">
            <p class="cl-eyebrow">You are invited</p>
            <img class="cl-monogram" src="${esc(couple.monogramImage)}" width="480" height="480" alt="" />
            <p class="cl-names">${esc(couple.partnerOne.first)} <span>&amp;</span> ${esc(couple.partnerTwo.first)}</p>
            <svg class="cl-divider"><use href="#divider"></use></svg>
            ${dateLine ? `<p class="cl-date">${esc(dateLine)}</p>` : ""}
            <p class="cl-event">${esc(event.title)}</p>
          </div>
        </div>
        <div class="cl-roll cl-roll-top"></div>
        <div class="cl-roll cl-roll-bottom"></div>
        <div class="cl-ribbon"><span class="cl-ribbon-band"></span><span class="cl-bow">${bowSvg()}</span></div>
        <div class="cl-seal"><span>${esc(couple.monogramLetters)}</span></div>
      </div>
    </div>

    <div class="intro-glow" aria-hidden="true"><div class="intro-rays"></div><div class="intro-sparks">${sparks(26)}</div></div>
    <div class="intro-whiteout" aria-hidden="true"></div>

    <button class="intro-start" type="button">
      <span class="intro-hint">Tap anywhere to begin</span>
    </button>
    ${
      music
        ? `<button class="intro-chip intro-sound" type="button" aria-pressed="true">
             <svg class="icon" aria-hidden="true"><use href="#i-music"></use></svg>
             <span class="intro-sound-label">Sound on</span>
           </button>`
        : ""
    }
    <button class="intro-chip intro-skip" type="button">Skip intro</button>`;

  const $ = (s) => el.querySelector(s);
  const root = document.documentElement;
  const startBtn = $(".intro-start");
  const skipBtn = $(".intro-skip");
  const soundBtn = $(".intro-sound");

  root.classList.add("is-revealing");
  if (reducedMotion) el.classList.add("is-reduced");
  // Focus the layer itself (not the hint) so no focus ring shows for touch
  // and mouse; keyboard users reach the start button with Tab.
  el.tabIndex = -1;
  requestAnimationFrame(() => el.focus({ preventScroll: true }));

  const setState = (state) => {
    el.dataset.state = state;
    document.dispatchEvent(new CustomEvent("intro:state", { detail: state }));
  };
  setState("NEW_INTRO_IDLE");

  let started = false;
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    el.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    document.removeEventListener("keydown", onKey);
    el.hidden = true;
    el.innerHTML = "";
    root.classList.remove("is-revealing");
    window.scrollTo(0, 0);
    document.getElementById("hero-title")?.focus({ preventScroll: true });
    setState("EXISTING_WEBSITE_VISIBLE");
    document.dispatchEvent(new CustomEvent("invitation:opened"));
  };

  const begin = () => {
    if (started || done) return;
    started = true; // one tap only; later taps are ignored
    el.classList.add("is-started");
    // Called inside the tap itself, so the browser allows audio to start.
    if (soundBtn?.getAttribute("aria-pressed") === "true") document.dispatchEvent(new CustomEvent("invitation:play-music"));
    (reducedMotion ? playReduced(el, setState) : playSequence(el, setState)).then(finish, (err) => {
      console.error("Intro animation stopped early", err);
      finish();
    });
  };

  const onKey = (e) => {
    if (e.key === "Escape") return finish();
    if (e.key === "Tab") {
      // Keep keyboard focus inside the intro while it is shown.
      const f = [startBtn, soundBtn, skipBtn].filter((b) => b && !b.disabled && b.isConnected);
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
    }
  };

  el.addEventListener("click", (e) => {
    if (e.target.closest(".intro-skip")) return finish();
    if (e.target.closest(".intro-sound")) {
      const on = soundBtn.getAttribute("aria-pressed") !== "true";
      soundBtn.setAttribute("aria-pressed", String(on));
      soundBtn.querySelector(".intro-sound-label").textContent = on ? "Sound on" : "Sound off";
      return;
    }
    begin();
  });
  document.addEventListener("keydown", onKey);
}

/* ── The sequence ─────────────────────────────────────────── */

const run = (node, keyframes, options) => node.animate(keyframes, { fill: "forwards", easing: EASE, ...options }).finished;

async function playSequence(el, setState) {
  const $ = (s) => el.querySelector(s);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const carrier = $(".intro-carrier");
  const dove = $(".dove");
  const scroll = $(".scroll-sm");

  // BIRD_TAKEOFF: a look around, a small crouch, wings open, lift.
  setState("BIRD_TAKEOFF");
  $(".intro-start").disabled = true;
  run($(".intro-hint"), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
  await run($(".dv-head"), [{ transform: "rotate(0)" }, { transform: "rotate(-14deg)" }, { transform: "rotate(9deg)" }, { transform: "rotate(-4deg)" }], {
    duration: 700,
    easing: EASE_IN_OUT,
  });
  await run(dove, [{ transform: "translateY(0) scaleY(1)" }, { transform: "translateY(4%) scaleY(0.95)" }], { duration: 260, easing: EASE_IN_OUT });
  dove.classList.add("is-flying"); // swaps the folded wing for flapping wings
  await Promise.all([
    run($(".dv-folded"), [{ opacity: 1 }, { opacity: 0 }], { duration: 160 }),
    ...[...el.querySelectorAll(".dv-wings")].map((w) => run(w, [{ opacity: 0 }, { opacity: 1 }], { duration: 220 })),
    run(dove, [{ transform: "translateY(4%) scaleY(0.95)" }, { transform: "translateY(0) scaleY(1)" }], { duration: 220 }),
  ]);

  // BIRD_FLIGHT: the dove climbs and glides while the garden slides past,
  // so the camera seems to follow it. The ribbon sways under the feet.
  setState("BIRD_FLIGHT");
  const r0 = carrier.getBoundingClientRect();
  const cx = r0.left + r0.width / 2;
  const cy = r0.top + r0.height / 2;
  const at = (x, y, rot = 0, s = 1) => ({ transform: `translate(${x - cx}px, ${y - cy}px) rotate(${rot}deg) scale(${s})` });
  const flightTime = 3200;
  const sway = scroll.animate([{ transform: "rotate(-5deg)" }, { transform: "rotate(6deg)" }], {
    duration: 520,
    iterations: Infinity,
    direction: "alternate",
    easing: "ease-in-out",
  });
  await Promise.all([
    run(
      carrier,
      [
        { ...at(cx, cy), offset: 0 },
        { ...at(cx + W * 0.03, cy - H * 0.12, -10, 0.98), offset: 0.14 },
        { ...at(W * 0.7, H * 0.24, -5, 0.86), offset: 0.42 },
        { ...at(W * 0.6, H * 0.3, 3, 0.9), offset: 0.7 },
        { ...at(W * 0.52, H * 0.44, 0, 0.95), offset: 1 },
      ],
      { duration: flightTime, easing: "cubic-bezier(0.45, 0.05, 0.4, 1)" },
    ),
    run($(".intro-near"), [{ transform: "translate(0,0)" }, { transform: "translate(-110vw, 85vh)" }], { duration: flightTime * 0.75, easing: "ease-in" }),
    run($(".intro-mid"), [{ transform: "translate(0,0)" }, { transform: "translate(-32vw, 6vh)" }], { duration: flightTime }),
    run($(".intro-far"), [{ transform: "translate(0,0)" }, { transform: "translate(-12vw, 3vh)" }], { duration: flightTime }),
    run($(".intro-surface"), [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: flightTime * 0.55, delay: flightTime * 0.45 }),
  ]);
  sway.cancel();

  // INVITATION_DROP: the letter is released, falls with a slight turn and
  // settles on the ivory surface; the dove flies on out of view.
  setState("INVITATION_DROP");
  const sr = scroll.getBoundingClientRect();
  const stage = el; // the dropped letter now belongs to the scene, not the bird
  stage.append(scroll);
  Object.assign(scroll.style, { position: "fixed", left: `${sr.left}px`, top: `${sr.top}px`, width: `${sr.width}px`, height: `${sr.height}px`, margin: 0 });
  scroll.classList.add("is-dropped");
  const landX = W * 0.5 - (sr.left + sr.width / 2);
  const landY = H * 0.8 - (sr.top + sr.height / 2);
  await Promise.all([
    run(
      scroll,
      [
        { transform: "translate(0,0) rotate(0)", offset: 0, easing: "cubic-bezier(0.5, 0, 0.9, 0.6)" },
        { transform: `translate(${landX}px, ${landY}px) rotate(14deg)`, offset: 0.72, easing: "ease-out" },
        { transform: `translate(${landX}px, ${landY - 8}px) rotate(-3deg)`, offset: 0.86, easing: "ease-in" },
        { transform: `translate(${landX}px, ${landY}px) rotate(2deg)`, offset: 1 },
      ],
      { duration: 1400 },
    ),
    run(
      carrier,
      [
        { ...at(W * 0.52, H * 0.44, 0, 0.95) },
        { ...at(W * 0.75, H * 0.2, -12, 0.85) },
        { ...at(W * 1.35, -H * 0.05, -16, 0.7) },
      ],
      { duration: 1500, easing: "ease-in" },
    ),
  ]);

  // LETTER_CLOSEUP: the camera moves in on the letter and the garden softens.
  setState("LETTER_CLOSEUP");
  const box = $(".cl-box");
  const cl = $(".cl");
  cl.classList.add("is-shown");
  const target = $(".cl-roll-top").getBoundingClientRect();
  const bottom = $(".cl-roll-bottom").getBoundingClientRect();
  const rolledW = target.width;
  const rolledCx = target.left + target.width / 2;
  const rolledCy = (target.top + bottom.bottom) / 2;
  const small = scroll.getBoundingClientRect();
  const k = small.width / rolledW;
  const dx = small.left + small.width / 2 - rolledCx;
  const dy = small.top + small.height / 2 - rolledCy;
  scroll.style.visibility = "hidden";
  await Promise.all([
    run(box, [{ transform: `translate(${dx}px, ${dy}px) scale(${k}) rotate(2deg)` }, { transform: "translate(0,0) scale(1) rotate(0)" }], {
      duration: 1500,
      easing: EASE_IN_OUT,
    }),
    run($(".intro-world"), [{ filter: "blur(0px)", opacity: 1 }, { filter: "blur(7px)", opacity: 0.75 }], { duration: 1500 }),
    run($(".intro-petals"), [{ opacity: 1 }, { opacity: 0.35 }], { duration: 1500 }),
  ]);

  // LETTER_OPENING: the ribbon loosens, the seal slides aside, and the
  // parchment unrolls from the centre into the flat card.
  setState("LETTER_OPENING");
  const boxRect = box.getBoundingClientRect();
  await Promise.all([
    run($(".cl-bow"), [{ transform: "translate(-50%, -50%) scale(1)", opacity: 1 }, { transform: "translate(-50%, 30%) scale(0.7) rotate(18deg)", opacity: 0 }], {
      duration: 800,
      easing: EASE_IN_OUT,
    }),
    run($(".cl-ribbon-band"), [{ transform: "scaleY(1)", opacity: 1 }, { transform: "scaleY(1.6)", opacity: 0 }], { duration: 800, delay: 150 }),
    run($(".cl-seal"), [{ transform: "translate(-50%, -50%) rotate(0)" }, { transform: `translate(calc(-50% + ${boxRect.width * 0.36}px), -10%) rotate(28deg) scale(0.8)` }], {
      duration: 700,
      delay: 250,
      easing: EASE_IN_OUT,
    }),
  ]);
  const half = boxRect.height / 2;
  const unroll = { duration: 1700, easing: "cubic-bezier(0.33, 0, 0.2, 1)" };
  await Promise.all([
    run($(".cl-card"), [{ clipPath: "inset(50% 0 50% 0)" }, { clipPath: "inset(0% 0 0% 0)" }], unroll),
    run($(".cl-roll-top"), [{ transform: "translateY(0) scaleY(1)" }, { transform: `translateY(${-half}px) scaleY(0.62)` }], unroll),
    run($(".cl-roll-bottom"), [{ transform: "translateY(0) scaleY(1)" }, { transform: `translateY(${half}px) scaleY(0.62)` }], unroll),
    run($(".cl-seal"), [{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: 500 }),
    run($(".cl-content"), [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 900, delay: 900 }),
  ]);

  // GOLDEN_LIGHT_REVEAL: warm light grows from the card's centre, with rising
  // sparks, until the screen is a soft ivory; then the website shows through.
  setState("GOLDEN_LIGHT_REVEAL");
  const glow = $(".intro-glow");
  glow.classList.add("is-on");
  const scaleTo = (Math.hypot(W, H) / Math.min(W, H)) * 2.2;
  await Promise.all([
    run(glow, [{ opacity: 0, transform: "translate(-50%, -50%) scale(0.15)" }, { opacity: 1, transform: `translate(-50%, -50%) scale(${scaleTo})` }], {
      duration: 2200,
      easing: "cubic-bezier(0.55, 0, 0.45, 1)",
    }),
    run($(".intro-whiteout"), [{ opacity: 0 }, { opacity: 0 }, { opacity: 1 }], { duration: 2200, easing: "ease-in" }),
  ]);
  document.documentElement.classList.remove("is-revealing");
  await run(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 1000, easing: "ease-out" });
}

// For visitors who prefer less motion: no flight or zoom, just the open card,
// then a soft fade into the site.
async function playReduced(el, setState) {
  setState("LETTER_OPENING");
  el.querySelector(".cl").classList.add("is-shown", "is-open");
  await new Promise((r) => setTimeout(r, 1800));
  setState("GOLDEN_LIGHT_REVEAL");
  await run(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 });
}

/* ── Artwork (original SVG) ───────────────────────────────── */

function doveSvg() {
  return `
  <svg viewBox="0 0 220 160" class="dove-svg" role="img" aria-label="A white dove">
    <defs>
      <linearGradient id="dv-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#FBF8F3"/><stop offset="1" stop-color="#E7DED0"/>
      </linearGradient>
      <linearGradient id="dv-wing" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEE6DA"/>
      </linearGradient>
      <linearGradient id="dv-far" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#F4EEE5"/><stop offset="1" stop-color="#E2D7C6"/>
      </linearGradient>
      <filter id="dv-soft" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="#B99A5B" flood-opacity="0.28"/>
      </filter>
    </defs>
    <g filter="url(#dv-soft)">
      <g class="dv-wings">
        <g class="dv-wing dv-wing-far">
          <path fill="url(#dv-far)" d="M124 76C120 52 106 26 78 6C74 16 78 24 82 30C70 22 58 20 46 22C58 32 68 40 80 46C68 46 58 50 50 56C70 60 90 66 108 82Z"/>
        </g>
      </g>
      <g class="dv-tail">
        <path fill="url(#dv-body)" d="M68 96L18 84C15 90 15 96 19 100L13 107C22 111 42 109 68 104Z"/>
        <path d="M66 99L24 90M66 101L20 101M66 103L24 108" stroke="#DCCFBB" stroke-width="0.8" fill="none"/>
      </g>
      <path class="dv-body" fill="url(#dv-body)" d="M62 96C66 78 86 66 112 64C134 62 150 70 158 80C164 90 156 104 138 110C118 116 92 114 76 108C68 105 62 101 62 96Z"/>
      <g class="dv-legs" stroke="#D3A595" stroke-width="2.4" stroke-linecap="round" fill="none">
        <path d="M110 111L108 124M108 124L102 127M108 124L113 127"/>
        <path d="M124 110L125 124M125 124L119 127M125 124L130 127"/>
      </g>
      <g class="dv-folded">
        <path fill="url(#dv-wing)" d="M80 84C96 66 132 64 150 80C140 92 118 100 96 100C86 98 80 92 80 84Z"/>
        <path fill="url(#dv-wing)" d="M86 92C70 96 50 99 34 98C50 91 68 87 86 85Z"/>
        <path d="M96 78C110 74 128 74 142 80M92 86C108 82 126 83 140 88M88 93C104 91 118 92 130 95M80 92L42 96" stroke="#DCCFBB" stroke-width="0.8" fill="none" stroke-linecap="round"/>
      </g>
      <g class="dv-head">
        <path fill="url(#dv-body)" d="M140 76C138 60 148 46 162 46C175 46 182 56 179 67C177 75 168 80 158 80C150 80 143 79 140 76Z"/>
        <path fill="#D9B5A4" d="M177 61L189 64.5L177 68.5Z"/>
        <path fill="#EAD3C8" d="M175 59.5C177 59 179 60 179.5 61.5L176 62Z"/>
        <circle cx="167" cy="59.5" r="2.3" fill="#4A3B2E"/><circle cx="167.8" cy="58.8" r="0.7" fill="#FFFFFF"/>
      </g>
      <g class="dv-wings">
        <g class="dv-wing dv-wing-near">
          <path fill="url(#dv-wing)" d="M118 80C112 56 98 30 70 10C66 20 70 28 74 34C62 26 50 24 38 26C50 36 60 44 72 50C60 50 50 54 42 60C62 64 82 70 100 86Z"/>
          <path d="M112 72C102 52 90 36 72 18M104 76C92 62 76 50 50 34M98 80C86 72 70 64 50 58" stroke="#DCCFBB" stroke-width="0.8" fill="none" stroke-linecap="round"/>
        </g>
      </g>
    </g>
  </svg>`;
}

// The rolled letter carried by the dove (same look as the close-up).
function scrollSvg() {
  return `
  <svg viewBox="0 0 120 46" class="scroll-svg">
    <defs>
      <linearGradient id="sc-paper" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FFFCF7"/><stop offset="0.45" stop-color="#FFF9F0"/><stop offset="1" stop-color="#E2CFB5"/>
      </linearGradient>
      <linearGradient id="sc-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#E9D3A2"/><stop offset="1" stop-color="#B99A5B"/>
      </linearGradient>
    </defs>
    <path d="M60 0V16" stroke="#E7C3B8" stroke-width="1.6"/>
    <rect x="8" y="16" width="104" height="22" rx="11" fill="url(#sc-paper)" stroke="#E2CFB5" stroke-width="0.6"/>
    <path d="M22 22H98M22 32H98" stroke="#D6B779" stroke-width="0.6" opacity="0.7"/>
    <ellipse cx="9" cy="27" rx="3.2" ry="11" fill="url(#sc-gold)"/>
    <ellipse cx="111" cy="27" rx="3.2" ry="11" fill="url(#sc-gold)"/>
    <rect x="55" y="15.5" width="10" height="23" fill="#F3DFD9" stroke="#E7C3B8" stroke-width="0.5"/>
    <path d="M60 22C52 14 44 16 46 22C48 27 56 25 60 22ZM60 22C68 14 76 16 74 22C72 27 64 25 60 22Z" fill="#F3DFD9" stroke="#E7C3B8" stroke-width="0.6"/>
    <path d="M58 23L52 34M62 23L68 34" stroke="#EBCFC6" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="60" cy="22.5" r="3.4" fill="url(#sc-gold)"/>
  </svg>`;
}

function bowSvg() {
  return `
  <svg viewBox="0 0 100 70">
    <path d="M50 30C34 8 12 10 16 28C20 42 40 38 50 30ZM50 30C66 8 88 10 84 28C80 42 60 38 50 30Z" fill="#F3DFD9" stroke="#E2BDB1" stroke-width="1"/>
    <path d="M24 22C30 20 38 24 44 28M76 22C70 20 62 24 56 28" stroke="#E7C9C0" stroke-width="1" fill="none"/>
    <path d="M46 32L32 66L40 62L44 68L50 34ZM54 32L68 66L60 62L56 68L50 34Z" fill="#F0D6CE" stroke="#E2BDB1" stroke-width="0.8"/>
    <rect x="43" y="23" width="14" height="14" rx="4" fill="#F3DFD9" stroke="#E2BDB1"/>
  </svg>`;
}

function flower(x, y, r, petal, edge, rot = 0) {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = rot + i * 72;
    return `<ellipse cx="${x}" cy="${y - r * 0.62}" rx="${r * 0.42}" ry="${r * 0.62}" transform="rotate(${a} ${x} ${y})" fill="${petal}" stroke="${edge}" stroke-width="0.7"/>`;
  }).join("");
  return `<g>${petals}<circle cx="${x}" cy="${y}" r="${r * 0.22}" fill="#D6B779"/><circle cx="${x}" cy="${y}" r="${r * 0.1}" fill="#B99A5B"/></g>`;
}

function leaf(x, y, len, rot) {
  return `<g transform="rotate(${rot} ${x} ${y})"><path d="M${x} ${y}C${x + len * 0.3} ${y - len * 0.28} ${x + len * 0.75} ${y - len * 0.22} ${x + len} ${y}C${x + len * 0.7} ${y + len * 0.22} ${x + len * 0.3} ${y + len * 0.2} ${x} ${y}Z" fill="#CDCCAA" opacity="0.85"/><path d="M${x} ${y}L${x + len * 0.9} ${y}" stroke="#B9B791" stroke-width="0.6"/></g>`;
}

function branchSvg() {
  const ivory = ["#FFFCF7", "#E9D9C5"];
  const blush = ["#F3DFD9", "#E2BDB1"];
  const blossoms = [
    [70, 312, 13, ...ivory, 10], [104, 296, 10, ...blush, 30], [150, 318, 12, ...ivory, 50], [196, 282, 11, ...ivory, 5],
    [236, 310, 9, ...blush, 20], [430, 262, 12, ...ivory, 15], [470, 246, 10, ...blush, 40], [505, 232, 13, ...ivory, 0],
    [395, 300, 9, ...ivory, 60], [540, 260, 9, ...blush, 25], [40, 280, 9, ...blush, 12], [262, 270, 8, ...ivory, 35],
  ];
  const leaves = [
    [86, 318, 26, 160], [124, 306, 24, -30], [172, 300, 28, 200], [214, 296, 22, -40], [250, 300, 26, 20],
    [404, 282, 26, -25], [448, 258, 24, 210], [486, 250, 28, -50], [520, 240, 22, 190], [372, 296, 24, 30],
  ];
  return `
  <svg class="branch-svg" viewBox="0 0 560 420" preserveAspectRatio="xMidYMid meet">
    <path d="M-320 372C-160 344 -40 330 70 318C170 308 250 300 330 297C400 294 470 268 600 226" stroke="#A88E6E" stroke-width="13" fill="none" stroke-linecap="round"/>
    <path d="M-320 372C-160 344 -40 330 70 318C170 308 250 300 330 297C400 294 470 268 600 226" stroke="#C4AD8C" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7" transform="translate(0 -3)"/>
    <path d="M150 306C170 290 186 284 200 282M60 316C50 300 44 290 40 282M240 300C250 288 258 278 262 270M410 288C400 300 396 300 395 300M450 274C462 262 468 252 470 246M500 252C506 244 508 238 505 232M520 244C530 250 536 256 540 260" stroke="#A88E6E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    ${leaves.map(([x, y, l, r]) => leaf(x, y, l, r)).join("")}
    ${blossoms.map(([x, y, r, p, e, rot]) => flower(x, y, r, p, e, rot)).join("")}
  </svg>`;
}

function palaceSvg() {
  const dome = (cx, base, w, h) =>
    `M${cx - w / 2} ${base}C${cx - w / 2} ${base - h * 0.62} ${cx - w * 0.2} ${base - h * 0.88} ${cx} ${base - h}C${cx + w * 0.2} ${base - h * 0.88} ${cx + w / 2} ${base - h * 0.62} ${cx + w / 2} ${base}Z`;
  const chhatri = (cx, base, w) =>
    `<path d="${dome(cx, base - w * 0.7, w, w * 0.8)}"/><rect x="${cx - w / 2}" y="${base - w * 0.72}" width="${w}" height="${w * 0.08}"/><rect x="${cx - w * 0.42}" y="${base - w * 0.66}" width="${w * 0.1}" height="${w * 0.66}"/><rect x="${cx + w * 0.32}" y="${base - w * 0.66}" width="${w * 0.1}" height="${w * 0.66}"/><path d="M${cx} ${base - w * 1.5}V${base - w * 1.72}" stroke="#E9D9C5" stroke-width="2"/>`;
  const arches = Array.from({ length: 14 }, (_, i) => {
    const x = 34 + i * 38;
    return `<path d="M${x} 252V222C${x} 210 ${x + 7} 204 ${x + 11} 202C${x + 15} 204 ${x + 22} 210 ${x + 22} 222V252Z" fill="#F7EFE3"/>`;
  }).join("");
  return `
  <svg class="palace-svg" viewBox="0 0 600 260" preserveAspectRatio="xMidYMax meet">
    <g fill="#E9D9C5">
      <rect x="18" y="176" width="564" height="84"/>
      <rect x="70" y="138" width="78" height="40"/><path d="${dome(109, 138, 56, 38)}"/>
      <rect x="452" y="138" width="78" height="40"/><path d="${dome(491, 138, 56, 38)}"/>
      <rect x="210" y="112" width="180" height="66"/>
      <path d="${dome(300, 112, 104, 78)}"/>
      <path d="M300 34V14" stroke="#E9D9C5" stroke-width="3"/><circle cx="300" cy="12" r="4"/>
      ${chhatri(226, 112, 26)}${chhatri(374, 112, 26)}
      ${chhatri(60, 176, 20)}${chhatri(540, 176, 20)}${chhatri(178, 176, 18)}${chhatri(422, 176, 18)}
    </g>
    ${arches}
    <g fill="#F7EFE3">
      <path d="M280 178V146C280 132 292 124 300 122C308 124 320 132 320 146V178Z"/>
      <path d="M238 170V150C238 142 244 138 248 137C252 138 258 142 258 150V170Z"/><path d="M342 170V150C342 142 348 138 352 137C356 138 362 142 362 150V170Z"/>
    </g>
  </svg>`;
}

function gardenSvg() {
  const cypress = (x, h, c) => `<path d="M${x} 200C${x - 11} 170 ${x - 9} ${200 - h * 0.7} ${x} ${200 - h}C${x + 9} ${200 - h * 0.7} ${x + 11} 170 ${x} 200Z" fill="${c}"/>`;
  return `
  <svg class="garden-svg" viewBox="0 0 600 200" preserveAspectRatio="xMidYMax slice">
    ${[30, 110, 190, 410, 490, 570].map((x, i) => cypress(x, 120 + (i % 3) * 18, i % 2 ? "#D9D6BC" : "#D2CFB2")).join("")}
    <rect x="-10" y="168" width="620" height="40" rx="20" fill="#DDD8BE"/>
    <rect x="-10" y="186" width="620" height="40" fill="#E9E2CD"/>
    <rect x="60" y="176" width="480" height="30" rx="15" fill="#E6E0C9"/>
    <path d="M270 190C270 176 284 168 300 168C316 168 330 176 330 190Z" fill="#EFE7D6"/>
    <path d="M300 168V150M292 156C296 150 304 150 308 156" stroke="#EFE7D6" stroke-width="3" fill="none"/>
  </svg>`;
}

function bokeh(n) {
  return Array.from({ length: n }, (_, i) => {
    const x = (i * 37 + 11) % 100;
    const y = (i * 53 + 7) % 70;
    const s = 24 + ((i * 29) % 46);
    const c = i % 3 === 0 ? "243,223,217" : "214,183,121";
    return `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;--c:${c};animation-delay:${-(i * 0.9)}s"></i>`;
  }).join("");
}

function fallingPetals(n) {
  return Array.from({ length: n }, (_, i) => {
    const left = (i * 41 + 5) % 100;
    const dur = 9 + ((i * 7) % 6);
    const delay = -((i * 1.7) % dur);
    const size = 8 + ((i * 5) % 7);
    const blush = i % 3 !== 0;
    return `<i class="${blush ? "is-blush" : ""}" style="left:${left}%;--dur:${dur}s;--delay:${delay}s;--size:${size}px;--drift:${(i % 2 ? 1 : -1) * (20 + ((i * 13) % 40))}px"></i>`;
  }).join("");
}

function restingPetals() {
  return [
    [18, 38, 22], [30, 62, -30], [70, 44, 50], [82, 70, 10], [58, 78, -60], [10, 72, 80],
  ]
    .map(([x, y, r], i) => `<i class="${i % 2 ? "is-blush" : ""}" style="left:${x}%;top:${y}%;transform:rotate(${r}deg)"></i>`)
    .join("");
}

function sparks(n) {
  return Array.from({ length: n }, (_, i) => {
    const x = ((i * 37) % 100) - 50;
    const d = 1.6 + ((i * 7) % 10) / 10;
    const delay = ((i * 3) % 12) / 10;
    const size = 3 + (i % 3);
    return `<i style="--x:${x}%;--d:${d}s;--delay:${delay}s;--s:${size}px"></i>`;
  }).join("");
}
