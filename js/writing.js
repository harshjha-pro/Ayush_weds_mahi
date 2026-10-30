// Text that writes itself in as it scrolls into view: each letter arrives a
// moment after the one before, left to right, like a pen moving across the
// paper. Built on GSAP's SplitText and ScrollTrigger (js/vendor/). The script
// headings keep their own drawn-on lettering, and live text (the countdown)
// is left alone. Without GSAP, or for visitors who prefer reduced motion,
// nothing changes: the text is simply there.
import { prefersReducedMotion } from "./utils.js";

// Every element that carries readable text...
const CANDIDATES = "main h1, main h2, main h3, main p, main figcaption, main li, main dt, main dd, main .eyebrow";
// ...except these: script lettering (already drawn on), controls, live or
// hidden text, and anything holding media.
const SKIP = [
  ".is-script",
  "button",
  ".btn",
  ".countdown-num",
  ".countdown-caption",
  ".countdown-done",
  ".surprise-note",
  ".lightbox",
  // The Celebration has its own, gentler reveals (details.js).
  "#celebration",
  "#countdown",
  "#venue",
  ".visually-hidden",
  "[aria-hidden='true']",
  "[hidden]",
].join(",");

const writeIn = (gsap, chars, extra = {}) =>
  gsap.from(chars, {
    opacity: 0,
    y: "0.35em",
    x: "-0.12em",
    duration: 0.5,
    ease: "power2.out",
    // Short lines write letter by letter; long paragraphs speed up so the
    // whole thing still finishes in about a second and a half.
    stagger: Math.min(0.04, Math.max(0.006, 1.4 / chars.length)),
    ...extra,
  });

export function startWriting() {
  const { gsap, ScrollTrigger, SplitText } = window;
  if (!gsap || !ScrollTrigger || !SplitText || prefersReducedMotion()) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  document.documentElement.classList.add("is-writing");

  const all = [...document.querySelectorAll(CANDIDATES)].filter(
    (el) =>
      el.textContent.trim() &&
      !el.closest(SKIP) &&
      !el.querySelector("svg, img, video, button, input, select, textarea") &&
      // In a flex or grid box every split word would become its own item.
      !/flex|grid/.test(getComputedStyle(el).display),
  );
  // Only the outermost of nested matches is split (an h1 holds its names).
  const targets = all.filter((el) => !all.some((other) => other !== el && other.contains(el)));

  for (const el of targets) {
    const { chars } = SplitText.create(el, { type: "words,chars", wordsClass: "wr-w", charsClass: "wr-c", aria: "auto" });
    if (!chars.length) continue;
    writeIn(gsap, chars, { scrollTrigger: { trigger: el, start: "clamp(top 90%)", once: true } });
  }

  // The secret message writes itself when the envelope is opened.
  document.addEventListener("surprise:opened", () => {
    document.querySelectorAll(".surprise-message, .surprise-signature").forEach((el, i) => {
      if (el.dataset.written) return;
      el.dataset.written = "1";
      const { chars } = SplitText.create(el, { type: "words,chars", wordsClass: "wr-w", charsClass: "wr-c", aria: "auto" });
      writeIn(gsap, chars, { delay: 0.35 + i * 1.2 });
    });
  });

  // Images and fonts can change the page's height after this runs.
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
