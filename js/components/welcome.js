import { celCrest, celDivider, celPalace, celGarden } from "./celebration-art.js";
import { landingArches, landingBranch, landingFlourish, frameRules, frameCorner, invSide } from "./landing-art.js";
import { esc, icon, ornament, divider, monogramMedia, film, toDate, formatWeekday, formatDate, familiesBlock, words, prefersReducedMotion, scriptText } from "../utils.js";

export function WelcomeSection(el, config) {
  const { couple, invitation, event } = config;
  const first = toDate(event.functions[0]?.start);
  const dateLine = first ? `${formatWeekday(first, event.timeZone)} · ${formatDate(first, event.timeZone)}` : "";
  const petals = Array.from({ length: 6 }, (_, i) => {
    const left = [6, 18, 32, 70, 84, 94][i];
    return `<i class="inv-petal${i % 2 ? " is-blush" : ""}" style="left:${left}%;--d:${(1.2 + i * 0.4).toFixed(1)}s;--t:${(8 + (i % 3) * 1.5).toFixed(1)}s;--x:${i % 2 ? 24 : -20}px"></i>`;
  }).join("");

  // The invitation card, in reading order: Lord Ganesha's blessing, the
  // monogram, the couple, the invitation, the families, the date, and the
  // way into their story. Around it, a palace garden. The sequence is in the
  // "Invitation" styles; it plays once as the card comes into view.
  el.innerHTML = `
    <div class="inv-bg" aria-hidden="true">
      <div class="inv-palace">${celPalace("ivp-")}</div>
      <div class="inv-garden">${celGarden()}</div>
      <div class="inv-side inv-side-l">${invSide()}</div>
      <div class="inv-side inv-side-r">${invSide()}</div>
      <div class="inv-branch inv-branch-l">${landingBranch()}</div>
      <div class="inv-branch inv-branch-r">${landingBranch()}</div>
      <div class="inv-petals">${petals}</div>
    </div>

    <div class="frame hero-frame inv-card">
      <span class="inv-rules" aria-hidden="true"></span>
      ${ornament("corner", "corner corner-tl")}${ornament("corner", "corner corner-tr")}
      ${ornament("corner", "corner corner-bl")}${ornament("corner", "corner corner-br")}

      <div class="hero-inner">
        <div class="inv-blessing">
          <picture class="inv-ganesha">
            <source srcset="assets/images/ganesha.webp" type="image/webp" />
            <img src="assets/images/ganesha.png" width="420" height="420" decoding="async"
                 alt="Lord Ganesha seated on a lotus, raising his hand in blessing" />
          </picture>
          <p class="inv-mantra" lang="sa">॥ श्री गणेशाय नमः ॥</p>
        </div>

        <p class="inv-eyebrow">${esc(invitation.eyebrow)}</p>
        ${celDivider()}
        <div class="hero-monogram inv-monogram">${monogramMedia(config, { preload: "auto" })}</div>
        <p class="inv-couple">${esc(couple.partnerOne.first)} &amp; ${esc(couple.partnerTwo.first)}</p>

        <h1 class="hero-names" id="hero-title" tabindex="-1">
          <span class="name">${esc(couple.partnerOne.full)}</span>
          <span class="inv-amp" aria-hidden="true">${ampFlourish()}</span><span class="visually-hidden">and</span>
          <span class="name">${esc(couple.partnerTwo.full)}</span>
        </h1>

        <p class="hero-welcome">${words(invitation.welcomeLine)}</p>
        ${familiesBlock(invitation, "families hero-families inv-families")}

        ${
          dateLine
            ? `<div class="hero-date inv-date">
                <p class="label">${icon("i-calendar")}<span>${esc(event.title)}</span></p>
                <p class="date">${esc(dateLine)}</p>
              </div>`
            : ""
        }
        <a class="btn inv-cta hero-cta" href="#story">
          <svg class="inv-cta-emblem" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2C7.6 5 7.6 8 10 10C12.4 8 12.4 5 10 2ZM10 10C7 8.6 4 9 2 11C5 12.4 8 12 10 10ZM10 10C13 8.6 16 9 18 11C15 12.4 12 12 10 10ZM10 10V18" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>
          Explore Our Story
        </a>
        <span class="inv-chevron" aria-hidden="true">${icon("i-down")}</span>
      </div>
    </div>`;

  // The CTA glides to the real story section (and moves focus there).
  el.querySelector(".inv-cta").addEventListener("click", (e) => {
    const story = document.getElementById("story");
    if (!story) return;
    e.preventDefault();
    story.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", "#story");
    story.querySelector("h2")?.setAttribute("tabindex", "-1");
    story.querySelector("h2")?.focus({ preventScroll: true });
  });

  revealInvitation(el);
}

// A small gold floral divider between the two names.
const ampFlourish = () => `
  <svg viewBox="0 0 120 20" class="inv-amp-svg">
    <path class="inv-draw" pathLength="1" d="M4 10H46M74 10H116" fill="none" stroke="#C3A064" stroke-width=".8" stroke-linecap="round"/>
    <g class="inv-bloom">${Array.from({ length: 5 }, (_, i) => `<ellipse cx="60" cy="5.8" rx="2.4" ry="3.6" transform="rotate(${i * 72} 60 10)" fill="#F2D8D0" stroke="#D9AFA3" stroke-width=".4"/>`).join("")}<circle cx="60" cy="10" r="1.6" fill="#D6B779"/><circle cx="4" cy="10" r="1.2" fill="#D6B779"/><circle cx="116" cy="10" r="1.2" fill="#D6B779"/></g>
  </svg>`;

// Plays the card's sequence once, as it comes into view; reduced motion
// (or no observer support) shows the finished card.
function revealInvitation(el) {
  const show = () => {
    el.classList.add("is-in");
    el.dispatchEvent(new Event("invitation:card"));
  };
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) return show();
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      show();
    },
    { threshold: 0.18 },
  );
  setTimeout(() => {
    const intro = document.getElementById("intro");
    if (intro && !intro.hidden) document.addEventListener("invitation:opened", () => io.observe(el), { once: true });
    else io.observe(el);
  });
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
  // After the portrait: the couple's line in script (two lines, so it stays
  // large on phones), written as it scrolls into view. Lord Ganesha's
  // blessing opens the invitation card that follows.
  const words = `
    <div class="ld-words">
      ${celDivider()}
      <p class="ld-welcome">${scriptText("Together is a", "script ld-script")}${scriptText("beautiful place to be.", "script ld-script ld-script-2")}</p>
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
    ${film(video, "hero-film", { frame, animate: false })}
    ${words}`;
  landing(el);
  revealWords(el);
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
