import { esc, has, icon, scriptText, prefersReducedMotion } from "../utils.js";
import { LETTERING } from "../lettering.js";
import { celDivider } from "./celebration-art.js";
import { landingBranch, landingFlourish, frameCorner } from "./landing-art.js";

// "The Story Behind the Yes": an illustrated storybook (in the place of the
// old "A Little Surprise"). Closed, it is a book cover; opened, its chapters
// (config.storybook.chapters) are read one spread at a time, turned like
// paper. Each newly turned page washes in like watercolour, then its title
// is written and its words appear; small things in each scene keep moving
// (lights, steam, leaves, birds) while the "camera" drifts very slowly.
//
// State lives in data-state on .sb: closed → opening → reading ⇄ turning →
// closing → closed. Anything asked for in the middle of a move is ignored,
// so turns never overlap.
const OPEN_MS = 1500; // cover swings open (the page reveal follows)
const CLOSE_MS = 1200;
const TURN_MS = 850; // a page turn on wide screens
const TURN_SMALL_MS = 650; // the lighter turn on phones
const QUICK_MS = 220; // reduced motion: a short fade
const WIDE = "(min-width: 900px) and (min-height: 600px)";

export function StorybookSection(el, config) {
  const book = config.storybook ?? {};
  const chapters = (book.chapters ?? []).filter((c) => has(c?.title));
  if (!chapters.length) {
    el.remove();
    return;
  }
  const n = chapters.length;
  const reduced = prefersReducedMotion();
  const wideQuery = window.matchMedia(WIDE);
  const pad = (i) => String(i + 1).padStart(2, "0");

  el.innerHTML = `
    <div class="sb" data-state="closed">
      <div class="sb-ui sb-bar" inert>
        <button class="sb-tool sb-contents-btn" type="button" aria-expanded="false" aria-controls="sb-contents">${listIcon()} Contents</button>
        <button class="sb-tool sb-close" type="button">${icon("i-close")} Close storybook</button>
      </div>
      <div class="sb-stage">
        <span class="sb-bloom" aria-hidden="true"></span>
        <span class="sb-motes" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<i style="left:${18 + ((i * 29) % 64)}%;top:${30 + ((i * 41) % 46)}%;--d:${(i * 0.12).toFixed(2)}s;--x:${i % 2 ? 14 : -12}px"></i>`).join("")}</span>
        <div class="sb-book" id="sb-book">
          <div class="sb-slot sb-slot-l"></div>
          <div class="sb-slot sb-slot-r"></div>
          <div class="sb-leaf" aria-hidden="true" hidden>
            <div class="sb-face sb-face-front"></div>
            <div class="sb-face sb-face-back"></div>
          </div>
          <div class="sb-cover">
            <div class="sb-face sb-cover-front">${cover(book)}</div>
            <div class="sb-face sb-cover-back" aria-hidden="true"></div>
          </div>
        </div>
      </div>

      <div class="sb-ui sb-foot" inert>
        <div class="sb-nav">
          <button class="sb-btn sb-prev" type="button" aria-label="Previous page">${icon("i-left")}</button>
          <div class="sb-progress">
            <p class="sb-count" aria-hidden="true"><span class="sb-count-now">01</span> / ${pad(n - 1)}</p>
            <span class="sb-ticks" aria-hidden="true">${chapters.map(() => "<i></i>").join("")}</span>
          </div>
          <button class="sb-btn sb-next" type="button" aria-label="Next page">${icon("i-right")}</button>
        </div>
        <div class="sb-contents" id="sb-contents" hidden>
          <p class="sb-contents-title">Contents</p>
          <ol>${chapters
            .map((c, i) => `<li><button type="button" data-go="${i}"><span class="sb-contents-num">${pad(i)}</span>${esc(c.title)}</button></li>`)
            .join("")}</ol>
        </div>
      </div>
      <p class="visually-hidden sb-live" aria-live="polite"></p>
    </div>`;

  const sb = el.querySelector(".sb");
  const bookEl = el.querySelector(".sb-book");
  const slotL = el.querySelector(".sb-slot-l");
  const slotR = el.querySelector(".sb-slot-r");
  const leaf = el.querySelector(".sb-leaf");
  const leafFront = leaf.querySelector(".sb-face-front");
  const leafBack = leaf.querySelector(".sb-face-back");
  const coverBack = el.querySelector(".sb-cover-back");
  const coverFront = el.querySelector(".sb-cover-front");
  const uis = [...el.querySelectorAll(".sb-ui")];
  const openBtn = el.querySelector(".sb-open");
  const prevBtn = el.querySelector(".sb-prev");
  const nextBtn = el.querySelector(".sb-next");
  const contentsBtn = el.querySelector(".sb-contents-btn");
  const contents = el.querySelector(".sb-contents");
  const live = el.querySelector(".sb-live");
  const countNow = el.querySelector(".sb-count-now");
  const ticks = [...el.querySelectorAll(".sb-ticks i")];

  let cur = 0;
  let wide = wideQuery.matches;
  let timer = 0;
  const state = () => sb.dataset.state;
  const set = (s) => (sb.dataset.state = s);

  // One page of a chapter. side: L or R (a spread on wide screens) or S (a
  // single page on phones). mode: pre (paper only, before its reveal),
  // reveal (plays the reveal), done (finished, still).
  const pageHTML = (i, side, mode) => page(chapters[i], i, n, side, mode, book);

  // Shows chapter i in the open book, either revealing it or as it is.
  const show = (i, mode) => {
    if (wide) {
      slotL.innerHTML = pageHTML(i, "L", mode);
      slotR.innerHTML = pageHTML(i, "R", mode);
    } else {
      slotL.innerHTML = "";
      slotR.innerHTML = pageHTML(i, "S", mode);
    }
    cur = i;
    bookEl.setAttribute("aria-label", `Chapter ${i + 1} of ${n}: ${chapters[i].title}`);
    countNow.textContent = pad(i);
    ticks.forEach((t, k) => t.classList.toggle("is-on", k <= i));
    const had = document.activeElement;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === n - 1;
    // Focus never falls off a button that has just been switched off.
    if (had?.disabled) (had === nextBtn ? prevBtn : nextBtn).focus({ preventScroll: true });
    contents.querySelectorAll("[data-go]").forEach((b) => b.toggleAttribute("aria-current", Number(b.dataset.go) === i));
    preload(i - 1);
    preload(i + 1);
  };
  const preload = (i) => {
    const c = chapters[i];
    if (!c) return;
    [c.image?.src, c.inset?.src].filter(Boolean).forEach((src) => (new Image().src = src));
  };
  const announce = (i) => (live.textContent = `Chapter ${i + 1} of ${n}: ${chapters[i].title}`);

  // ── Opening and closing the book
  const open = () => {
    if (state() !== "closed") return;
    clearTimeout(timer);
    openBtn.setAttribute("aria-expanded", "true");
    show(0, "pre");
    coverBack.innerHTML = wide ? pageHTML(0, "L", "pre") : "";
    set("opening");
    uis.forEach((u) => (u.inert = false));
    coverFront.inert = true;
    timer = setTimeout(
      () => {
        set("reading");
        show(0, reduced ? "done" : "reveal");
        announce(0);
        el.querySelector(".sb-slot .sb-title")?.focus({ preventScroll: true });
      },
      reduced ? QUICK_MS : OPEN_MS,
    );
  };

  const close = () => {
    if (state() !== "reading") return;
    clearTimeout(timer);
    toggleContents(false);
    coverBack.innerHTML = wide ? pageHTML(cur, "L", "done") : "";
    if (wide) slotL.innerHTML = pageHTML(cur, "L", "done");
    set("closing");
    uis.forEach((u) => (u.inert = true));
    coverFront.inert = false;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus({ preventScroll: true });
    timer = setTimeout(
      () => {
        set("closed");
        slotL.innerHTML = slotR.innerHTML = coverBack.innerHTML = "";
      },
      reduced ? QUICK_MS : CLOSE_MS,
    );
  };

  // ── Turning pages. A leaf, with the outgoing page on one face and the
  // incoming page on the other, turns about the spine over pages that are
  // already in place beneath it.
  const turn = (to) => {
    if (state() !== "reading" || to === cur || to < 0 || to >= n) return;
    const from = cur;
    const forward = to > from;
    set("turning");
    toggleContents(false);
    const land = () => {
      leaf.hidden = true;
      leaf.className = "sb-leaf";
      leafFront.innerHTML = leafBack.innerHTML = "";
      show(to, reduced ? "done" : "reveal");
      announce(to);
      set("reading");
    };
    if (reduced) {
      setTimeout(land, QUICK_MS);
      return;
    }

    let keyframes;
    if (wide) {
      // Beneath: the side that stays, and the incoming page on the other.
      if (forward) slotR.innerHTML = pageHTML(to, "R", "pre");
      else slotL.innerHTML = pageHTML(to, "L", "pre");
      leafFront.innerHTML = forward ? pageHTML(from, "R", "done") : pageHTML(to, "R", "pre");
      leafBack.innerHTML = forward ? pageHTML(to, "L", "pre") : pageHTML(from, "L", "done");
      leaf.className = "sb-leaf is-wide";
      keyframes = forward
        ? [{ transform: "rotateY(0deg)" }, { transform: "rotateY(-90deg) translateZ(8px)", offset: 0.5 }, { transform: "rotateY(-180deg)" }]
        : [{ transform: "rotateY(-180deg)" }, { transform: "rotateY(-90deg) translateZ(8px)", offset: 0.5 }, { transform: "rotateY(0deg)" }];
    } else {
      // Phones: the outgoing page swings away to the left (or the previous
      // one swings back in), with no back face.
      if (forward) {
        leafFront.innerHTML = pageHTML(from, "S", "done");
        slotR.innerHTML = pageHTML(to, "S", "pre");
      } else leafFront.innerHTML = pageHTML(to, "S", "pre");
      leaf.className = "sb-leaf is-small";
      const away = { transform: "rotateY(-105deg)", opacity: 0 };
      const home = { transform: "rotateY(0deg)", opacity: 1 };
      keyframes = forward ? [home, { transform: "rotateY(-60deg)", opacity: 0.9, offset: 0.6 }, away] : [away, { transform: "rotateY(-60deg)", opacity: 0.9, offset: 0.4 }, home];
    }
    leaf.classList.add(forward ? "is-forward" : "is-back");
    leaf.hidden = false;
    const duration = wide ? TURN_MS : TURN_SMALL_MS;
    const anim = leaf.animate(keyframes, { duration, easing: "cubic-bezier(0.45, 0.05, 0.3, 1)", fill: "forwards" });
    leaf.querySelectorAll(".sb-shade").forEach((s, k) =>
      s.animate([{ opacity: k ? 0.35 : 0 }, { opacity: 0.4, offset: 0.5 }, { opacity: k ? 0 : 0.35 }], { duration, fill: "forwards" }),
    );
    anim.finished.then(() => {
      land();
      anim.cancel();
    });
  };
  const next = () => turn(cur + 1);
  const prev = () => turn(cur - 1);

  // ── Contents
  const toggleContents = (on) => {
    const opened = on ?? contents.hidden;
    contents.hidden = !opened;
    contentsBtn.setAttribute("aria-expanded", String(opened));
    if (opened) (contents.querySelector("[aria-current]") || contents.querySelector("button"))?.focus({ preventScroll: true });
  };
  contentsBtn.addEventListener("click", () => toggleContents());
  contents.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (!b) return;
    const to = Number(b.dataset.go);
    toggleContents(false);
    contentsBtn.focus({ preventScroll: true });
    turn(to);
  });

  // ── Controls: buttons, keys, page edges and swipes
  openBtn.addEventListener("click", open);
  el.querySelector(".sb-close").addEventListener("click", close);
  nextBtn.addEventListener("click", next);
  prevBtn.addEventListener("click", prev);
  sb.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !contents.hidden) {
      toggleContents(false);
      contentsBtn.focus({ preventScroll: true });
    } else if (state() === "reading" && contents.hidden && !e.target.closest("input, textarea")) {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else return;
      e.preventDefault();
    }
  });
  // A click on a page (not on something of its own) turns from that side.
  bookEl.addEventListener("click", (e) => {
    if (state() !== "reading" || e.target.closest("button, a")) return;
    if (!wide) return; // phones turn by swiping or with the buttons
    if (e.target.closest(".sb-slot-r")) next();
    else if (e.target.closest(".sb-slot-l")) prev();
  });
  let touch = null;
  bookEl.addEventListener("touchstart", (e) => (touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }), { passive: true });
  bookEl.addEventListener("touchend", (e) => {
    if (!touch || state() !== "reading") return;
    const dx = e.changedTouches[0].clientX - touch.x;
    const dy = e.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) (dx < 0 ? next : prev)();
  });

  // Switching between a spread and a single page (rotating a tablet, say)
  // redraws the open chapter for the new shape.
  wideQuery.addEventListener("change", (e) => {
    wide = e.matches;
    if (state() === "reading") show(cur, "done");
  });

  // ── The scenes keep moving only while the book is on screen.
  const pause = (on) => sb.classList.toggle("is-paused", on);
  if ("IntersectionObserver" in window) {
    let seen = false;
    new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      pause(!visible || document.hidden);
      if (visible && !seen) {
        seen = true;
        sb.classList.add("is-in");
      }
    }, { threshold: 0.2 }).observe(sb);
  } else sb.classList.add("is-in");
  document.addEventListener("visibilitychange", () => document.hidden && pause(true));

}

// The closed book's cover: gold rules and corners, sprigs, the title in
// script, a small portrait of the two of them, and the way in.
function cover(book) {
  const [t1, t2] = Array.isArray(book.title) ? book.title : [book.title ?? "The Story Behind the Yes"];
  const c = book.cover;
  return `
    <span class="sb-spine" aria-hidden="true"></span>
    <span class="sb-edges" aria-hidden="true"></span>
    <span class="sb-cover-rule" aria-hidden="true"></span>
    ${frameCorner("sb-corner sb-corner-tl")}${frameCorner("sb-corner sb-corner-tr")}${frameCorner("sb-corner sb-corner-bl")}${frameCorner("sb-corner sb-corner-br")}
    <span class="sb-cover-sprig sb-cover-sprig-l" aria-hidden="true">${landingBranch()}</span>
    <span class="sb-cover-sprig sb-cover-sprig-r" aria-hidden="true">${landingBranch()}</span>
    <div class="sb-cover-inner">
      <h2 class="sb-cover-title" id="surprise-title">${script(t1, "script sb-cover-script")}${t2 ? ` ${script(t2, "script sb-cover-script sb-cover-script-2")}` : ""}</h2>
      <span class="sb-heart" aria-hidden="true">${heart()}</span>
      ${has(book.names) ? `<p class="sb-cover-names">${esc(book.names)}</p>` : ""}
      ${
        has(c?.src)
          ? `<figure class="sb-cover-portrait"><picture><source srcset="${esc(c.src)}" type="image/webp" /><img src="${esc(c.fallback || c.src)}" width="${c.width}" height="${c.height}" alt="${esc(c.alt ?? "")}" loading="lazy" decoding="async" /></picture></figure>`
          : ""
      }
      ${has(book.tagline) ? `<p class="sb-cover-tagline">${esc(book.tagline)}</p>` : ""}
      <button class="sb-open" type="button" aria-expanded="false" aria-controls="sb-book">${bookIcon()}<span>${esc(book.cue || "Tap to open our story")}</span></button>
    </div>
    <span class="sb-shimmer" aria-hidden="true"></span>`;
}

// One page. The illustration sits on the left of a spread (on the right for
// "framed" chapters) and the words face it; on phones both share one page.
// Script lettering in the book is drawn by its own states, so the
// page-wide draw-on-scroll marker is left off.
const script = (text, cls) => scriptText(text, cls).replace(" data-draw", "");

function page(ch, i, n, side, mode, book) {
  const layout = ch.layout || "bleed";
  const artSide = layout === "framed" ? "R" : "L";
  const showArt = side === "S" || side === artSide;
  const showText = side === "S" || side !== artSide;
  const label = mode === "done" || mode === "reveal" ? "" : ' aria-hidden="true"';
  const folio = side === "S" ? "" : `<span class="sb-folio" aria-hidden="true">${side === "L" ? i * 2 + 1 : i * 2 + 2}</span>`;
  return `
    <article class="sb-page sb-page-${side} sb-l-${layout} is-${mode}" style="--n:${i}"${label}>
      <span class="sb-paper" aria-hidden="true"></span>
      <span class="sb-page-rule" aria-hidden="true"></span>
      ${side !== "S" ? `<span class="sb-gutter sb-gutter-${side}" aria-hidden="true"></span>` : ""}
      ${showArt ? art(ch, layout) : ""}
      ${showText ? words(ch, i, n, layout, side, book) : ""}
      ${showText && side !== "S" ? `<span class="sb-sprig" aria-hidden="true">${landingBranch()}</span><span class="sb-flourish" aria-hidden="true">${landingFlourish()}</span>` : ""}
      ${folio}
      <span class="sb-shade" aria-hidden="true"></span>
    </article>`;
}

function art(ch, layout) {
  const im = ch.image ?? {};
  const ar = im.width && im.height ? `${im.width} / ${im.height}` : "4 / 5";
  return `
    <div class="sb-art sb-art-${layout}">
      <div class="sb-window">
        <div class="sb-cam cam-${ch.camera || "push"}" style="--ar:${ar}">
          <div class="sb-move">
            <picture>
              ${has(im.src) ? `<source srcset="${esc(im.src)}" type="image/webp" />` : ""}
              <img src="${esc(im.fallback || im.src)}" width="${im.width || 640}" height="${im.height || 800}" alt="${esc(im.alt ?? "")}" decoding="async" draggable="false" />
            </picture>
            <div class="sb-amb" aria-hidden="true">${ambient(ch.ambient)}</div>
          </div>
        </div>
        <span class="sb-wash" aria-hidden="true"></span>
        <div class="sb-fg" aria-hidden="true">${ambientFront(ch.ambient)}</div>
      </div>
      ${layout === "polaroid" ? '<span class="sb-tape" aria-hidden="true"></span>' : ""}
    </div>`;
}

function words(ch, i, n, layout, side, book) {
  const inset = ch.inset;
  return `
    <div class="sb-text">
      <p class="sb-num">Chapter ${String(i + 1).padStart(2, "0")}</p>
      <h3 class="sb-title${LETTERING[ch.title] ? " is-script" : ""}" tabindex="-1">${script(ch.title, "script sb-script")}</h3>
      <span class="sb-divider" aria-hidden="true">${celDivider()}</span>
      <p class="sb-copy">${esc(ch.text ?? "")}</p>
      ${
        layout === "finale"
          ? `<p class="sb-sign">${script(book.signature || "Mahi & Ayush", "script sb-sign-script")}</p><span class="sb-end-heart" aria-hidden="true">${heart()}</span>`
          : ""
      }
      ${
        has(inset?.src)
          ? `<figure class="sb-inset"><img src="${esc(inset.src)}" width="${inset.width || 600}" height="${inset.height || 800}" alt="${esc(inset.alt ?? "")}" loading="lazy" decoding="async" /></figure>`
          : ""
      }
    </div>`;
}

// What moves inside a scene, placed on the illustration itself (so it
// drifts with the "camera"); positions are [x%, y%] of the picture.
function ambient(a = {}) {
  const at = ([x, y]) => `left:${x}%;top:${y}%`;
  const out = [];
  if (a.beam) out.push('<span class="amb amb-beam"></span>');
  if (a.motes) for (let i = 0; i < 8; i++) out.push(`<i class="amb amb-mote" style="left:${8 + i * 11}%;top:${22 + ((i * 37) % 52)}%;--d:${(-i * 1.3).toFixed(1)}s"></i>`);
  (a.bokeh || []).forEach((p, i) => out.push(`<i class="amb amb-bokeh" style="${at(p)};--d:${(-i * 1.1).toFixed(1)}s;--s:${16 + (i % 3) * 9}px"></i>`));
  if (a.clouds) out.push('<i class="amb amb-cloud" style="top:5%;--d:0s"></i><i class="amb amb-cloud" style="top:13%;--d:-11s;--w:46px"></i>');
  if (a.papers) [[16, 34], [82, 26], [58, 12]].forEach((p, i) => out.push(`<i class="amb amb-paper" style="${at(p)};--d:${(-i * 2.4).toFixed(1)}s"></i>`));
  if (a.steam) out.push(`<svg class="amb amb-steam" style="${at(a.steam)}" viewBox="0 0 30 54"><path d="M14 52C6 44 22 36 14 27C6 18 20 11 14 2"/><path d="M22 52C16 45 28 38 22 30"/></svg>`);
  if (a.sun) out.push(`<span class="amb amb-sun" style="${at(a.sun)}"></span>`);
  (a.lights || []).forEach((p, i) => out.push(`<i class="amb amb-light" style="${at(p)};--d:${(-i * 0.53).toFixed(2)}s"></i>`));
  (a.stars || []).forEach((p, i) => out.push(`<i class="amb amb-star" style="${at(p)};--d:${(-i * 0.9).toFixed(1)}s"></i>`));
  if (a.glow) out.push(`<span class="amb amb-glow" style="${at(a.glow)}"></span>`);
  (a.shimmer || []).forEach((p, i) => out.push(`<i class="amb amb-ripple" style="${at(p)};--d:${(-i * 1.1).toFixed(1)}s"></i>`));
  (a.doodles || []).forEach((p, i) =>
    out.push(
      `<svg class="amb amb-doodle" style="${at(p)};--d:${(i * 0.9).toFixed(1)}s" viewBox="0 0 24 24">${
        i % 2
          ? '<path d="M12 3V9M12 15V21M3 12H9M15 12H21M6 6L9 9M15 15L18 18M18 6L15 9M9 15L6 18"/>'
          : '<path d="M12 20C7 16 3.5 13 3.5 9.2C3.5 6.6 5.5 4.8 7.8 4.8C9.6 4.8 11 5.9 12 7.4C13 5.9 14.4 4.8 16.2 4.8C18.5 4.8 20.5 6.6 20.5 9.2C20.5 13 17 16 12 20Z"/>'
      }</svg>`,
    ),
  );
  return out.join("");
}

// Foreground things, nearer than the picture, which move on their own (the
// difference between the two is the parallax).
function ambientFront(a = {}) {
  const out = [];
  if (a.birds) out.push('<svg class="amb amb-birds" viewBox="0 0 60 22"><path d="M2 9Q6 4 10 9Q14 4 18 9"/><path d="M24 5Q27 2 30 5Q33 2 36 5"/><path d="M42 13Q45 10 48 13Q51 10 54 13"/></svg>');
  if (a.palms) out.push('<svg class="amb amb-frond" viewBox="0 0 120 90"><path d="M2 4C30 10 60 26 94 60" fill="none" stroke="#6f8058" stroke-width="2"/>' + Array.from({ length: 9 }, (_, i) => { const x = 12 + i * 9.5; const y = 7 + i * 6; return `<path d="M${x} ${y}C${x + 4} ${y + 14} ${x - 2} ${y + 24} ${x - 10} ${y + 30}" fill="none" stroke="#7d8f62" stroke-width="2.4" stroke-linecap="round"/>`; }).join("") + "</svg>");
  if (a.leaves) for (let i = 0; i < 3; i++) out.push(`<i class="amb amb-leaf" style="left:${20 + i * 28}%;--d:${(-i * 2.7).toFixed(1)}s;--x:${i % 2 ? 30 : -26}px"></i>`);
  if (a.petals || a.motes) for (let i = 0; i < 4; i++) out.push(`<i class="amb amb-petal${i % 2 ? " is-blush" : ""}" style="left:${12 + i * 24}%;--d:${(-i * 2.2).toFixed(1)}s;--x:${i % 2 ? 26 : -22}px"></i>`);
  return out.join("");
}

const heart = () => `<svg viewBox="0 0 24 22" class="sb-heart-svg"><path class="ld-draw" pathLength="1" d="M12 19.5C7.4 16 3.5 12.9 3.5 8.6C3.5 5.9 5.6 4 8 4C9.8 4 11.2 5 12 6.5C12.8 5 14.2 4 16 4C18.4 4 20.5 5.9 20.5 8.6C20.5 12.9 16.6 16 12 19.5Z" fill="none" stroke="#B89255" stroke-width="1.2" stroke-linejoin="round"/></svg>`;

const listIcon = () => `<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M8 7H20M8 12H20M8 17H20M4 7H4.5M4 12H4.5M4 17H4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

const bookIcon = () => `<svg viewBox="0 0 24 24" class="sb-open-icon" aria-hidden="true"><path d="M12 6.5C10 5 7 4.5 3.5 5V18.5C7 18 10 18.5 12 20C14 18.5 17 18 20.5 18.5V5C17 4.5 14 5 12 6.5ZM12 6.5V20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
