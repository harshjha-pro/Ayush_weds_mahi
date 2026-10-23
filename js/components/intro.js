// WeddingIntro: the opening scene. A white dove waits on a blossom branch in
// a palace garden with the rolled invitation tied to its feet; one tap sends
// it flying, the letter drops onto a silk-draped table, the camera moves in,
// the letter unrolls, and warm light dissolves into the website.
//
// The visuals are photographic stills (assets/intro/, generated for this site
// and prepared by tools/intro/prepare_assets.py) layered and moved with the
// Web Animations API. It is not filmed footage: the "camera" is pans, push-ins
// and focus changes on the plates, and the dove's wingbeat blends between two
// photographed wing poses.
//
// Every step waits for the previous animation's `finished` promise, so the
// order is fixed. The intro is a layer above the page, never a gate: Skip and
// Escape end it at once, deep links bypass it, and any error reveals the site.
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

const A = "assets/intro/";
const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";
const CAMERA = "cubic-bezier(0.45, 0.05, 0.3, 1)";

// Where the scroll's cord meets the dove's feet, as a share of the dove box
// (all three poses share one box, lined up on the eye).
const FEET = { perched: [0.6, 0.86], flying: [0.45, 0.66] };

export function WeddingIntro(el, config, { reducedMotion = prefersReducedMotion() } = {}) {
  if (location.hash && location.hash !== "#home") return;

  const { couple, event, invitation } = config;
  const first = toDate(event.functions[0]?.start);
  const dateLine = first ? `${formatWeekday(first, event.timeZone)} · ${formatDate(first, event.timeZone)}` : "";
  const music = hasMusic(config);
  const img = (name, cls) => `<img class="${cls}" src="${A}${name}.webp" alt="" decoding="async" draggable="false" />`;

  el.hidden = false;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", `Invitation from ${couple.partnerOne.first} and ${couple.partnerTwo.first}`);
  el.innerHTML = `
    <div class="intro-world" aria-hidden="true">
      <div class="cam cam-garden">${img("garden", "plate plate-garden")}</div>
      <div class="cam cam-table">${img("table", "plate plate-table")}</div>
      <div class="intro-haze"></div>
      <div class="intro-near">${img("branch", "branch")}</div>
    </div>

    <div class="intro-petals" aria-hidden="true">${fallingPetals(9)}</div>

    <div class="carrier" aria-hidden="true">
      <div class="dove is-perched">
        ${img("dove-perched", "dove-pose pose-perched")}
        ${img("dove-up", "dove-pose pose-up")}
        ${img("dove-down", "dove-pose pose-down")}
      </div>
      <div class="scroll-sm"><span class="scroll-cord"></span>${img("scroll", "scroll-img")}</div>
    </div>

    <div class="cl" aria-hidden="true">
      <div class="cl-box">
        <div class="cl-card">
          ${img("paper", "cl-paper")}
          <div class="cl-content">
            <p class="cl-eyebrow">${esc(invitation.familiesLine || "You are invited")}</p>
            <img class="cl-monogram" src="${esc(couple.monogramImage)}" width="480" height="480" alt="" />
            <p class="cl-names">${esc(couple.partnerOne.first)} <span>&amp;</span> ${esc(couple.partnerTwo.first)}</p>
            ${dateLine ? `<p class="cl-date">${esc(dateLine)}</p>` : ""}
            <p class="cl-event">${esc(event.title)}</p>
          </div>
          <div class="cl-sheen"></div>
        </div>
        <div class="cl-rolled">
          ${img("scroll-roll", "cl-roll cl-roll-top")}
          ${img("scroll-roll", "cl-roll cl-roll-bottom")}
          ${img("scroll-bow", "cl-bow")}
          ${img("scroll", "cl-whole")}
        </div>
      </div>
    </div>

    <div class="intro-light" aria-hidden="true">
      <div class="intro-glow"></div>
      <div class="intro-rays"></div>
      <div class="intro-motes">${motes(18)}</div>
    </div>
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
  const branchImg = $(".branch");
  const place = () => !el.classList.contains("is-started") && placeDove(el);
  if (branchImg.complete) place();
  else branchImg.addEventListener("load", place, { once: true });
  window.addEventListener("resize", place);

  // A missing photo should never leave a blank screen: fall back to the site.
  el.querySelectorAll("img").forEach((i) => i.addEventListener("error", () => finish(), { once: true }));

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

  function finish() {
    if (done) return;
    done = true;
    el.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", place);
    el.hidden = true;
    el.innerHTML = "";
    root.classList.remove("is-revealing");
    window.scrollTo(0, 0);
    document.getElementById("hero-title")?.focus({ preventScroll: true });
    setState("EXISTING_WEBSITE_VISIBLE");
    document.dispatchEvent(new CustomEvent("invitation:opened"));
  }

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

// Sit the dove on the branch. The branch photo is sized by CSS, so the perch
// point (a spot on the bark, measured on the photo) is read from its box.
function placeDove(el) {
  const branch = el.querySelector(".branch").getBoundingClientRect();
  const carrier = el.querySelector(".carrier");
  const px = branch.left + branch.width * 0.6;
  const py = branch.top + branch.height * 0.47;
  carrier.style.left = `${px - carrier.offsetWidth * FEET.perched[0]}px`;
  carrier.style.top = `${py - carrier.offsetHeight * FEET.perched[1]}px`;
}

/* ── The sequence ─────────────────────────────────────────── */

const run = (node, keyframes, options) => node.animate(keyframes, { fill: "forwards", easing: EASE, ...options }).finished;
const feetAt = ([fx, fy]) => ({ left: `${fx * 100}%`, top: `${fy * 100}%` });

async function playSequence(el, setState) {
  const $ = (s) => el.querySelector(s);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const carrier = $(".carrier");
  const dove = $(".dove");
  const scroll = $(".scroll-sm");

  // BIRD_TAKEOFF: the dove looks round, settles its weight, opens its wings.
  setState("BIRD_TAKEOFF");
  $(".intro-start").disabled = true;
  run($(".intro-hint"), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
  await run(
    $(".pose-perched"),
    [
      { transform: "rotate(0deg)" },
      { transform: "rotate(-3deg) translateY(-0.6%)", offset: 0.35 },
      { transform: "rotate(2deg) translateY(0.4%)", offset: 0.7 },
      { transform: "translateY(1.4%) scaleY(0.97)" },
    ],
    { duration: 900, easing: EASE_IN_OUT },
  );
  dove.classList.remove("is-perched");
  await Promise.all([
    run($(".pose-perched"), [{ opacity: 1 }, { opacity: 0 }], { duration: 180 }),
    run($(".pose-up"), [{ opacity: 0 }, { opacity: 1 }], { duration: 180 }),
    run(scroll, [feetAt(FEET.perched), feetAt(FEET.flying)], { duration: 380, easing: EASE_IN_OUT }),
  ]);
  // The wingbeat: the down-stroke pose fades in and out over the up-stroke,
  // which reads as feathers in motion. The body bobs with each beat.
  const flap = [
    $(".pose-down").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 170, iterations: Infinity, direction: "alternate", easing: "ease-in-out" }),
    dove.animate([{ transform: "translateY(0)" }, { transform: "translateY(2.2%)" }], { duration: 170, iterations: Infinity, direction: "alternate", easing: "ease-in-out" }),
    scroll.animate([{ rotate: "-4deg" }, { rotate: "5deg" }], { duration: 560, iterations: Infinity, direction: "alternate", easing: "ease-in-out" }),
  ];

  // BIRD_FLIGHT: the camera follows the dove over the reflecting pool towards
  // the palace; the branch sweeps out of frame and goes soft (rack focus).
  setState("BIRD_FLIGHT");
  const r0 = carrier.getBoundingClientRect();
  const cx = r0.left + r0.width / 2;
  const cy = r0.top + r0.height / 2;
  const at = (x, y, rot = 0, s = 1) => ({ transform: `translate(${x - cx}px, ${y - cy}px) rotate(${rot}deg) scale(${s})` });
  const flight = 3600;
  await Promise.all([
    run(
      carrier,
      [
        { ...at(cx, cy), offset: 0 },
        { ...at(cx + W * 0.04, cy - H * 0.12, -8, 0.98), offset: 0.16 },
        { ...at(W * 0.62, H * 0.26, -4, 0.86), offset: 0.48 },
        { ...at(W * 0.55, H * 0.28, 2, 0.8), offset: 0.75 },
        { ...at(W * 0.5, H * 0.34, 0, 0.78), offset: 1 },
      ],
      { duration: flight, easing: "cubic-bezier(0.42, 0.04, 0.38, 1)" },
    ),
    run($(".intro-near"), [{ transform: "translate(0,0) scale(1)", filter: "blur(0px)" }, { transform: "translate(-38%, 70%) scale(1.5)", filter: "blur(10px)" }], {
      duration: flight * 0.7,
      easing: "cubic-bezier(0.5, 0, 0.75, 0.4)",
    }),
    run($(".cam-garden"), [{ transform: "scale(1.06) translate(0, 0)" }, { transform: "scale(1.42) translate(0, 3%)" }], { duration: flight, easing: CAMERA }),
    run($(".intro-haze"), [{ opacity: 1 }, { opacity: 0.6 }], { duration: flight }),
  ]);

  // INVITATION_DROP: the letter is released and falls; the camera tilts down
  // from the palace to a silk-draped table in the pavilion where it lands.
  setState("INVITATION_DROP");
  const sr = scroll.getBoundingClientRect();
  flap[2].cancel();
  el.append(scroll); // the letter now belongs to the scene, not the bird
  Object.assign(scroll.style, { position: "fixed", left: `${sr.left}px`, top: `${sr.top}px`, width: `${sr.width}px`, height: `${sr.height}px`, margin: 0 });
  scroll.getAnimations().forEach((a) => a.cancel());
  scroll.classList.add("is-dropped");
  const landX = W * 0.5 - (sr.left + sr.width / 2);
  const landY = H * 0.66 - (sr.top + sr.height / 2);
  await Promise.all([
    run(
      scroll,
      [
        { transform: "translate(0,0) rotate(0deg) scale(1)", offset: 0, easing: "cubic-bezier(0.5, 0, 0.9, 0.55)" },
        { transform: `translate(${landX}px, ${landY}px) rotate(11deg) scale(1.15)`, offset: 0.74, easing: "ease-out" },
        { transform: `translate(${landX}px, ${landY - 6}px) rotate(-2deg) scale(1.15)`, offset: 0.87, easing: "ease-in" },
        { transform: `translate(${landX}px, ${landY}px) rotate(1.5deg) scale(1.15)`, offset: 1 },
      ],
      { duration: 1700 },
    ),
    run(carrier, [{ ...at(W * 0.5, H * 0.34, 0, 0.78) }, { ...at(W * 0.85, H * 0.12, -10, 0.7) }, { ...at(W * 1.45, -H * 0.12, -14, 0.6) }], {
      duration: 1600,
      easing: "ease-in",
    }),
    // A tilt down with a quick dissolve in the middle of the move, so the two
    // places never sit on top of each other for long.
    run(
      $(".cam-garden"),
      [
        { transform: "scale(1.42) translate(0, 3%)", opacity: 1 },
        { transform: "scale(1.46) translate(0, 12%)", opacity: 1, offset: 0.35 },
        { transform: "scale(1.5) translate(0, 22%)", opacity: 0, offset: 0.7 },
        { transform: "scale(1.5) translate(0, 22%)", opacity: 0 },
      ],
      { duration: 1500, easing: CAMERA },
    ),
    run(
      $(".cam-table"),
      [
        { transform: "scale(1.15) translate(0, -16%)", opacity: 0 },
        { transform: "scale(1.11) translate(0, -10%)", opacity: 0, offset: 0.3 },
        { transform: "scale(1.07) translate(0, -4%)", opacity: 1, offset: 0.65 },
        { transform: "scale(1.04) translate(0, 0)", opacity: 1 },
      ],
      { duration: 1500, easing: CAMERA },
    ),
    run($(".intro-near"), [{ opacity: 1 }, { opacity: 0 }], { duration: 700 }),
  ]);
  flap.forEach((a) => a.cancel());
  carrier.style.visibility = "hidden";

  // LETTER_CLOSEUP: a slow push-in on the letter; the background falls out of
  // focus as the lens gets closer.
  setState("LETTER_CLOSEUP");
  $(".cl").classList.add("is-shown");
  const big = $(".cl-whole").getBoundingClientRect();
  const small = scroll.querySelector(".scroll-img").getBoundingClientRect();
  const k = small.width / big.width;
  const dx = small.left + small.width / 2 - (big.left + big.width / 2);
  const dy = small.top + small.height / 2 - (big.top + big.height / 2);
  scroll.style.visibility = "hidden";
  $(".cam-table").style.transformOrigin = "50% 66%";
  await Promise.all([
    run($(".cl-box"), [{ transform: `translate(${dx}px, ${dy}px) scale(${k}) rotate(1.5deg)` }, { transform: "translate(0,0) scale(1) rotate(0deg)" }], {
      duration: 1900,
      easing: CAMERA,
    }),
    run($(".cam-table"), [{ transform: "scale(1.04)", filter: "blur(0px)" }, { transform: "scale(1.5)", filter: "blur(7px)" }], { duration: 1900, easing: CAMERA }),
    run($(".intro-petals"), [{ opacity: 1 }, { opacity: 0.4 }], { duration: 1900 }),
  ]);

  // LETTER_OPENING: the bow and seal lift away, then the paper unrolls from
  // the middle, revealing the embossed card.
  setState("LETTER_OPENING");
  $(".cl-whole").style.visibility = "hidden"; // same pixels, now split into layers
  await run(
    $(".cl-bow"),
    [
      { transform: "translate(0,0) rotate(0deg)", opacity: 1, filter: "blur(0px)" },
      { transform: "translate(6%, -38%) rotate(-7deg)", opacity: 1, filter: "blur(0px)", offset: 0.55 },
      { transform: "translate(18%, -95%) rotate(-14deg) scale(1.08)", opacity: 0, filter: "blur(3px)" },
    ],
    { duration: 1300, easing: EASE_IN_OUT },
  );
  const half = $(".cl-card").getBoundingClientRect().height / 2;
  const unroll = { duration: 2100, easing: "cubic-bezier(0.33, 0, 0.18, 1)" };
  await Promise.all([
    run($(".cl-card"), [{ clipPath: "inset(49% 0 49% 0)" }, { clipPath: "inset(0% 0 0% 0)" }], unroll),
    run($(".cl-roll-top"), [{ transform: "translateY(-50%) scaleY(1)" }, { transform: `translateY(calc(-50% - ${half}px)) scaleY(0.58)` }], unroll),
    run($(".cl-roll-bottom"), [{ transform: "translateY(-50%) scale(1, -1)" }, { transform: `translateY(calc(-50% + ${half}px)) scale(1, -0.58)` }], unroll),
    run($(".cl-content"), [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, delay: 1100 }),
  ]);
  await Promise.all([
    run($(".cl-roll-top"), [{ opacity: 1 }, { opacity: 0 }], { duration: 500 }),
    run($(".cl-roll-bottom"), [{ opacity: 1 }, { opacity: 0 }], { duration: 500 }),
  ]);

  // GOLDEN_LIGHT_REVEAL: warm light gathers on the card and the room around
  // it, a slow sheen crosses the embossing, fine motes drift up, and the
  // bloom spreads until the screen is soft ivory; the website shows through.
  setState("GOLDEN_LIGHT_REVEAL");
  $(".intro-light").classList.add("is-on");
  await Promise.all([
    run($(".intro-glow"), [{ opacity: 0, transform: "translate(-50%, -50%) scale(0.5)" }, { opacity: 0.85, transform: "translate(-50%, -50%) scale(1)" }], {
      duration: 1800,
      easing: "ease-out",
    }),
    run($(".intro-rays"), [{ opacity: 0 }, { opacity: 0.55 }], { duration: 1800 }),
    run($(".cl-sheen"), [{ transform: "translateX(-120%)" }, { transform: "translateX(120%)" }], { duration: 1800, easing: EASE_IN_OUT }),
    run($(".intro-world"), [{ filter: "brightness(1)" }, { filter: "brightness(1.18) saturate(0.92)" }], { duration: 1800 }),
  ]);
  const cover = (Math.hypot(W, H) / Math.min(W, H)) * 2.4;
  await Promise.all([
    run($(".intro-glow"), [{ transform: "translate(-50%, -50%) scale(1)", opacity: 0.85 }, { transform: `translate(-50%, -50%) scale(${cover})`, opacity: 1 }], {
      duration: 2000,
      easing: "cubic-bezier(0.5, 0, 0.5, 1)",
    }),
    run($(".intro-whiteout"), [{ opacity: 0 }, { opacity: 0.15, offset: 0.4 }, { opacity: 1 }], { duration: 2000, easing: "ease-in" }),
  ]);
  document.documentElement.classList.remove("is-revealing");
  await run(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 1100, easing: "ease-out" });
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

function fallingPetals(n) {
  return Array.from({ length: n }, (_, i) => {
    const left = (i * 41 + 9) % 100;
    const dur = 11 + ((i * 7) % 7);
    const delay = -((i * 2.3) % dur);
    const size = 9 + ((i * 5) % 8);
    const blur = i % 3 === 0 ? 2.5 : i % 3 === 1 ? 0.6 : 1.4; // some near the lens, some far
    return `<i class="${i % 3 !== 2 ? "is-blush" : ""}" style="left:${left}%;--dur:${dur}s;--delay:${delay}s;--size:${size}px;--blur:${blur}px;--drift:${(i % 2 ? 1 : -1) * (24 + ((i * 13) % 40))}px"></i>`;
  }).join("");
}

function motes(n) {
  return Array.from({ length: n }, (_, i) => {
    const x = ((i * 37) % 70) - 35;
    const y = ((i * 23) % 40) - 10;
    const d = 3.2 + ((i * 7) % 10) / 5;
    const delay = ((i * 3) % 14) / 10;
    const size = 1.5 + (i % 3) * 0.7;
    return `<i style="--x:${x}vw;--y:${y}vh;--d:${d}s;--delay:${delay}s;--s:${size}px"></i>`;
  }).join("");
}
