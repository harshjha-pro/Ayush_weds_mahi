// WeddingIntro: the opening scene, drawn as a storybook illustration. A dove
// waits on a blossom branch in a palace garden with the rolled invitation
// tied to its feet; one tap sends it flying, the letter drops onto a stone
// terrace, opens into a blank gilded card, and warm light gives way to the site.
//
// All artwork is original SVG (intro-art.js). Every step waits for the
// previous animation's `finished` promise, so the order is fixed. The intro is
// a layer above the page, never a gate: Skip and Escape end it at once, deep
// links bypass it, and any error simply reveals the site.
import { prefersReducedMotion } from "../utils.js";
import { hasMusic } from "./music.js";
import { palaceSvg, hillsSvg, gardenSvg, branchSvg, doveSvg, rollSvg, bowSvg, cardSvg, terraceSvg } from "./intro-art.js";

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

  const { couple } = config;
  const music = hasMusic(config);
  const letter = (cls) => `<div class="${cls}"><div class="letter-roll">${rollSvg()}</div><div class="letter-bow">${bowSvg()}</div></div>`;

  el.hidden = false;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", `Invitation from ${couple.partnerOne.first} and ${couple.partnerTwo.first}`);
  el.innerHTML = `
    <div class="intro-world" aria-hidden="true">
      <div class="intro-sky"><div class="intro-cloud c1"></div><div class="intro-cloud c2"></div><div class="intro-cloud c3"></div></div>
      <div class="intro-beams"></div>
      <div class="intro-layer intro-far">${hillsSvg()}</div>
      <div class="intro-layer intro-palace">${palaceSvg()}</div>
      <div class="intro-haze"></div>
      <div class="intro-layer intro-mid">${gardenSvg()}</div>
      <div class="intro-surface">${terraceSvg()}</div>
      <div class="intro-layer intro-near"><div class="perch-box">${branchSvg()}</div></div>
    </div>

    <div class="intro-dust" aria-hidden="true">${dust(9)}</div>
    <div class="intro-petals" aria-hidden="true">${fallingPetals()}</div>

    <div class="perch-box intro-carrier-box" aria-hidden="true">
      <div class="intro-carrier">
        <div class="dove">${doveSvg()}</div>
        <div class="scroll-sm"><span class="scroll-cord"></span>${letter("letter")}</div>
      </div>
    </div>

    <div class="cl" aria-hidden="true">
      <div class="cl-box">
        <div class="cl-card">${cardSvg()}<div class="cl-warmth"></div></div>
        <div class="cl-rolled">
          <div class="letter-roll cl-roll cl-roll-bottom">${rollSvg()}</div>
          <div class="letter-roll cl-roll cl-roll-top">${rollSvg()}</div>
          <div class="letter-bow cl-bow">${bowSvg()}</div>
        </div>
      </div>
    </div>

    <div class="intro-glow" aria-hidden="true"><div class="intro-rays"></div><div class="intro-sparks">${sparks(10)}</div></div>
    <div class="intro-whiteout" aria-hidden="true"></div>

    <button class="intro-start" type="button"><span class="intro-hint">Tap anywhere to begin</span></button>
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

/* ── The sequence (about 4.5 s after the tap) ─────────────── */

const run = (node, keyframes, options) => node.animate(keyframes, { fill: "forwards", easing: EASE, ...options }).finished;

async function playSequence(el, setState) {
  const $ = (s) => el.querySelector(s);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const carrier = $(".intro-carrier");
  const dove = $(".dove");
  const scroll = $(".scroll-sm");

  // BIRD_TAKEOFF (~0.6 s): a glance, a small crouch, wings open.
  setState("BIRD_TAKEOFF");
  $(".intro-start").disabled = true;
  run($(".intro-hint"), [{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
  await run($(".dv-head"), [{ transform: "rotate(0)" }, { transform: "rotate(-12deg)" }, { transform: "rotate(6deg)" }], { duration: 280, easing: EASE_IN_OUT });
  await run(dove, [{ transform: "translateY(0) scaleY(1)" }, { transform: "translateY(3%) scaleY(0.96)" }], { duration: 130, easing: EASE_IN_OUT });
  dove.classList.add("is-flying"); // the folded wing gives way to flapping wings
  await Promise.all([
    run($(".dv-folded"), [{ opacity: 1 }, { opacity: 0 }], { duration: 140 }),
    ...[...el.querySelectorAll(".dv-wings")].map((w) => run(w, [{ opacity: 0 }, { opacity: 1 }], { duration: 160 })),
    run(dove, [{ transform: "translateY(3%) scaleY(0.96)" }, { transform: "translateY(0) scaleY(1)" }], { duration: 160 }),
  ]);

  // BIRD_FLIGHT (~1.1 s): the dove rises and crosses the garden; layers move
  // at different speeds, so the camera seems to follow it.
  setState("BIRD_FLIGHT");
  const r0 = carrier.getBoundingClientRect();
  const cx = r0.left + r0.width / 2;
  const cy = r0.top + r0.height / 2;
  const at = (x, y, rot = 0, s = 1) => ({ transform: `translate(${x - cx}px, ${y - cy}px) rotate(${rot}deg) scale(${s})` });
  const flight = 1100;
  const sway = scroll.animate([{ transform: "rotate(-5deg)" }, { transform: "rotate(6deg)" }], {
    duration: 380,
    iterations: Infinity,
    direction: "alternate",
    easing: "ease-in-out",
  });
  await Promise.all([
    run(
      carrier,
      [
        { ...at(cx, cy), offset: 0 },
        { ...at(cx + W * 0.04, cy - H * 0.11, -9, 0.97), offset: 0.22 },
        { ...at(W * 0.66, H * 0.26, -4, 0.88), offset: 0.6 },
        { ...at(W * 0.53, H * 0.4, 0, 0.92), offset: 1 },
      ],
      { duration: flight, easing: "cubic-bezier(0.45, 0.05, 0.4, 1)" },
    ),
    run($(".intro-near"), [{ transform: "translate(0,0)" }, { transform: "translate(-110vw, 85vh)" }], { duration: flight * 0.8, easing: "ease-in" }),
    run($(".intro-mid"), [{ transform: "translate(0,0)" }, { transform: "translate(-14vw, 10vh)" }], { duration: flight }),
    run($(".intro-palace"), [{ transform: "translate(0,0)" }, { transform: "translate(-6vw, 5vh)" }], { duration: flight }),
    run($(".intro-far"), [{ transform: "translate(0,0)" }, { transform: "translate(-3vw, 3vh)" }], { duration: flight }),
    run($(".intro-surface"), [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: flight * 0.6, delay: flight * 0.4 }),
  ]);
  sway.cancel();

  // INVITATION_DROP (~0.7 s): the letter is released, turns a little as it
  // falls, and settles on the terrace; the dove flies on out of frame.
  setState("INVITATION_DROP");
  const sr = scroll.getBoundingClientRect();
  el.append(scroll); // the letter now belongs to the scene, not the bird
  Object.assign(scroll.style, { position: "fixed", left: `${sr.left}px`, top: `${sr.top}px`, width: `${sr.width}px`, height: `${sr.height}px`, margin: 0 });
  scroll.classList.add("is-dropped");
  const landX = W * 0.5 - (sr.left + sr.width / 2);
  const landY = H * 0.8 - (sr.top + sr.height / 2);
  await Promise.all([
    run(
      scroll,
      [
        { transform: "translate(0,0) rotate(0deg)", offset: 0, easing: "cubic-bezier(0.5, 0, 0.9, 0.6)" },
        { transform: `translate(${landX}px, ${landY}px) rotate(12deg)`, offset: 0.75, easing: "ease-out" },
        { transform: `translate(${landX}px, ${landY - 6}px) rotate(-2deg)`, offset: 0.88, easing: "ease-in" },
        { transform: `translate(${landX}px, ${landY}px) rotate(1deg)`, offset: 1 },
      ],
      { duration: 700 },
    ),
    run(carrier, [{ ...at(W * 0.53, H * 0.4, 0, 0.92) }, { ...at(W * 0.85, H * 0.15, -12, 0.84) }, { ...at(W * 1.35, -H * 0.06, -16, 0.72) }], {
      duration: 700,
      easing: "ease-in",
    }),
  ]);

  // LETTER_CLOSEUP (~0.45 s): the camera moves in; the garden softens.
  setState("LETTER_CLOSEUP");
  const cl = $(".cl");
  cl.classList.add("is-shown");
  const big = $(".cl-rolled").getBoundingClientRect();
  const small = scroll.querySelector(".letter").getBoundingClientRect();
  const k = small.width / big.width;
  const dx = small.left + small.width / 2 - (big.left + big.width / 2);
  const dy = small.top + small.height / 2 - (big.top + big.height / 2);
  scroll.style.visibility = "hidden";
  await Promise.all([
    run($(".cl-box"), [{ transform: `translate(${dx}px, ${dy}px) scale(${k}) rotate(1deg)` }, { transform: "translate(0,0) scale(1) rotate(0)" }], {
      duration: 450,
      easing: EASE_IN_OUT,
    }),
    run($(".intro-world"), [{ filter: "blur(0px)", opacity: 1 }, { filter: "blur(6px)", opacity: 0.8 }], { duration: 450 }),
    run($(".intro-petals"), [{ opacity: 1 }, { opacity: 0.3 }], { duration: 450 }),
  ]);

  // LETTER_OPENING (~0.95 s): the ribbon loosens, the seal slides aside and
  // the paper unrolls from the middle into the blank, gilded card.
  setState("LETTER_OPENING");
  await Promise.all([
    run($(".cl-bow .bow-knot"), [{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: "translate(0, 7px) scale(0.85)", opacity: 0 }], { duration: 350, easing: EASE_IN_OUT }),
    run($(".cl-bow .bow-band"), [{ transform: "scaleY(1)", opacity: 1 }, { transform: "scaleY(1.4)", opacity: 0 }], { duration: 330, delay: 40 }),
    run($(".cl-bow .bow-seal"), [{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: "translate(34px, 6px) rotate(40deg)", opacity: 0 }], { duration: 350, easing: EASE_IN_OUT }),
  ]);
  const half = $(".cl-card").getBoundingClientRect().height / 2;
  const unroll = { duration: 600, easing: "cubic-bezier(0.33, 0, 0.2, 1)" };
  await Promise.all([
    run($(".cl-card"), [{ clipPath: "inset(48% 0 48% 0)" }, { clipPath: "inset(0% 0 0% 0)" }], unroll),
    run($(".cl-roll-top"), [{ transform: "translateY(0) scaleY(1)" }, { transform: `translateY(${-half}px) scaleY(0.6)` }], unroll),
    run($(".cl-roll-bottom"), [{ transform: "translateY(0) scale(1, -1)" }, { transform: `translateY(${half}px) scale(1, -0.6)` }], unroll),
  ]);
  await Promise.all([
    run($(".cl-roll-top"), [{ opacity: 1 }, { opacity: 0 }], { duration: 180 }),
    run($(".cl-roll-bottom"), [{ opacity: 1 }, { opacity: 0 }], { duration: 180 }),
  ]);

  // GOLDEN_LIGHT_REVEAL (~0.7 s): a small warm glow in the middle of the card
  // brightens the paper, a few particles rise, the bloom reaches the edges,
  // and only then does the website show through.
  setState("GOLDEN_LIGHT_REVEAL");
  const glow = $(".intro-glow");
  glow.classList.add("is-on");
  const cover = (Math.hypot(W, H) / Math.min(W, H)) * 2.3;
  await Promise.all([
    run($(".cl-warmth"), [{ opacity: 0 }, { opacity: 1 }], { duration: 250 }),
    run(glow, [{ opacity: 0, transform: "translate(-50%, -50%) scale(0.12)" }, { opacity: 1, transform: `translate(-50%, -50%) scale(${cover})` }], {
      duration: 480,
      easing: "cubic-bezier(0.5, 0, 0.6, 1)",
    }),
    run($(".intro-whiteout"), [{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }], { duration: 480, easing: "ease-in" }),
  ]);
  // The screen is now soft ivory; the site fades up underneath.
  document.documentElement.classList.remove("is-revealing");
  await run(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-out" });
}

// For visitors who prefer less motion: no flight or zoom, just the opened
// card for a moment, then a soft fade into the site.
async function playReduced(el, setState) {
  setState("LETTER_OPENING");
  el.querySelector(".cl").classList.add("is-shown", "is-open");
  await new Promise((r) => setTimeout(r, 1200));
  setState("GOLDEN_LIGHT_REVEAL");
  await run(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 });
}

// A handful of petals that drift down the edges, never across the bird.
function fallingPetals() {
  const lanes = [5, 14, 24, 84, 93];
  return lanes
    .map((left, i) => {
      const dur = 13 + i * 2.5;
      const delay = -((i * 4.1) % dur);
      const size = 9 + (i % 3) * 2;
      return `<i class="${i % 2 ? "" : "is-blush"}" style="left:${left}%;--dur:${dur}s;--delay:${delay}s;--size:${size}px;--drift:${(i % 2 ? 1 : -1) * (18 + i * 6)}px"></i>`;
    })
    .join("");
}

// Very fine dust in the sunlight, top right.
function dust(n) {
  return Array.from({ length: n }, (_, i) => {
    const x = 55 + ((i * 17) % 40);
    const y = 6 + ((i * 23) % 34);
    return `<i style="left:${x}%;top:${y}%;--d:${7 + (i % 4) * 2}s;--delay:${-(i * 1.3)}s"></i>`;
  }).join("");
}

function sparks(n) {
  return Array.from({ length: n }, (_, i) => {
    const x = ((i * 37) % 60) - 30;
    return `<i style="--x:${x}%;--delay:${((i * 3) % 8) / 40}s;--s:${2 + (i % 3)}px"></i>`;
  }).join("");
}
