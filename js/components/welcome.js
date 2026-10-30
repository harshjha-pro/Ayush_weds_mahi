import { celCrest, celDivider } from "./celebration-art.js";
import { landingArches, landingBranch, landingFlourish, frameRules, frameCorner } from "./landing-art.js";
import { esc, icon, ornament, divider, monogramMedia, film, toDate, formatWeekday, formatDate, familiesBlock, words, prefersReducedMotion, scriptText } from "../utils.js";

export function WelcomeSection(el, config) {
  const { couple, invitation, event } = config;
  const first = toDate(event.functions[0]?.start);
  const dateLine = first ? `${formatWeekday(first, event.timeZone)} · ${formatDate(first, event.timeZone)}` : "";

  el.innerHTML = `
    <div class="frame hero-frame">
      ${ornament("corner", "corner corner-tl")}${ornament("corner", "corner corner-tr")}
      ${ornament("corner", "corner corner-bl")}${ornament("corner", "corner corner-br")}
      ${ornament("sprig", "hero-sprig hero-sprig-left")}${ornament("sprig", "hero-sprig hero-sprig-right")}

      <div class="hero-inner">
        <p class="eyebrow hero-eyebrow" data-animate>${esc(invitation.eyebrow)}</p>
        <div class="hero-monogram" data-animate>${monogramMedia(config, { preload: "auto" })}</div>
        <h1 class="hero-names" id="hero-title" tabindex="-1" data-animate>
          <span class="name">${esc(couple.partnerOne.full)}</span>
          <span class="amp" aria-hidden="true">&amp;</span><span class="visually-hidden">and</span>
          <span class="name">${esc(couple.partnerTwo.full)}</span>
        </h1>
        <p class="hero-welcome" data-animate>${words(invitation.welcomeLine)}</p>
        ${familiesBlock(invitation, "families hero-families", "data-animate")}
        ${
          dateLine
            ? `<div class="hero-date" data-animate>${divider("divider divider-sm")}<p><span class="label">${esc(event.title)}</span><span class="date">${esc(dateLine)}</span></p></div>`
            : ""
        }
        <a class="btn btn-primary hero-cta" href="#story" data-animate>Begin Our Story ${icon("i-down")}</a>
      </div>
    </div>`;
}

// The engagement film (the bride and her diamond ring), the first screen of
// the page: a portrait film in a champagne-gold frame, on ivory with a faint
// watermark of palace arches, fine branches in the upper corners and small
// flourishes near the lower ones. It plays while on screen (startFilms).
//
// When the opening intro ends, its golden light is still glowing here; the
// light settles, the frame draws from its corners, the illustration fades
// in with a slow push towards the bride and her ring, the botanical lines
// draw and bloom, and a few petals fall once (landing styles). Without the
// intro, or with reduced motion, the screen is simply there.
export function FilmSection(el, config) {
  const video = config.couple.heroVideo;
  if (!video?.src) {
    el.remove();
    return;
  }
  const frame = `
    ${frameRules()}
    <span class="film-mat" aria-hidden="true"></span>
    ${frameCorner("film-corner-tl")}${frameCorner("film-corner-tr")}${frameCorner("film-corner-bl")}${frameCorner("film-corner-br")}
    <span class="film-crest" aria-hidden="true">${celCrest()}</span>`;
  const petals = Array.from({ length: 7 }, (_, i) => {
    const left = [8, 22, 38, 61, 76, 88, 50][i];
    return `<i class="ld-petal${i % 2 ? " is-blush" : ""}" style="left:${left}%;--d:${(1.4 + i * 0.35).toFixed(2)}s;--t:${(6.5 + (i % 3) * 1.2).toFixed(1)}s;--x:${i % 2 ? 26 : -22}px"></i>`;
  }).join("");
  const { couple } = config;
  // The welcome: Lord Ganesha's blessing, the mantra, a gold divider, the
  // couple's line in script (two lines, so it stays large on phones) and
  // their names.
  const head = `
    <div class="ld-head">
      <picture class="ld-ganesha">
        <source srcset="assets/images/ganesha.webp" type="image/webp" />
        <img src="assets/images/ganesha.png" width="420" height="420" decoding="async" fetchpriority="high"
             alt="Lord Ganesha seated on a lotus, raising his hand in blessing" />
      </picture>
      <p class="ld-mantra" lang="sa">॥ श्री गणेशाय नमः ॥</p>
      <p class="ld-translit">Shri Ganeshaya Namah</p>
    </div>`;
  // After the portrait: the couple's line, written as it scrolls into view.
  const words = `
    <div class="ld-words">
      ${celDivider()}
      <p class="ld-welcome">${scriptText("Together is a", "script ld-script")}${scriptText("beautiful place to be.", "script ld-script ld-script-2")}</p>
      <p class="ld-names">${esc(couple.partnerOne.first)} <span class="ld-amp">&amp;</span> ${esc(couple.partnerTwo.first)}</p>
      <p class="ld-tagline">A celebration of love, family &amp; forever</p>
    </div>`;
  el.innerHTML = `
    <div class="film-bg" aria-hidden="true">
      <div class="ld-glow"></div>
      <div class="ld-arches">${landingArches()}</div>
      <div class="ld-branch ld-branch-l">${landingBranch()}</div>
      <div class="ld-branch ld-branch-r">${landingBranch()}</div>
      <div class="ld-flourish ld-flourish-l">${landingFlourish()}</div>
      <div class="ld-flourish ld-flourish-r">${landingFlourish()}</div>
      <div class="ld-petals">${petals}</div>
    </div>
    ${head}
    ${film(video, "hero-film", { frame, animate: false })}
    ${words}`;
  fitPortrait(el);
  landing(el);
  revealWords(el);
}

// The blessing and the portrait share the first screen: the portrait takes
// whatever height is left below the blessing (measured, so it is right on
// every phone), and its width follows from the 9:16 shape.
function fitPortrait(el) {
  const head = el.querySelector(".ld-head");
  const set = () => el.style.setProperty("--ld-head-h", `${Math.ceil(head.getBoundingClientRect().height)}px`);
  set();
  if ("ResizeObserver" in window) new ResizeObserver(set).observe(head);
}

// The words after the portrait reveal when they come into view.
function revealWords(el) {
  const words = el.querySelector(".ld-words");
  const show = () => words.classList.add("is-in");
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) return show();
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      show();
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.3 },
  );
  setTimeout(() => {
    const intro = document.getElementById("intro");
    if (intro && !intro.hidden) document.addEventListener("invitation:opened", () => io.observe(words), { once: true });
    else io.observe(words);
  });
}

// Plays the landing sequence once, as the intro hands over; otherwise
// shows the finished screen straight away.
function landing(el) {
  const settle = () => el.classList.add("is-landed");
  if (prefersReducedMotion()) return settle();
  // The intro is set up after this section, so look for it a moment later.
  setTimeout(() => {
    const intro = document.getElementById("intro");
    if (!intro || intro.hidden) return settle();
    document.addEventListener(
      "invitation:opened",
      () => {
        el.classList.add("is-landing");
        // Once everything has arrived, drop the motion state.
        setTimeout(() => el.classList.replace("is-landing", "is-landed"), 13000);
      },
      { once: true },
    );
  });
}
