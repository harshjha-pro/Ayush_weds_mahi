import { esc, has, icon, scriptText, prefersReducedMotion } from "../utils.js";
import { LETTERING } from "../lettering.js";
import { celDivider } from "./celebration-art.js";
import { landingBranch, landingFlourish, frameCorner, invSide } from "./landing-art.js";

// Our Story, as a page from a royal wedding journal: the couple's heading,
// their story, then the Saptapadi promise in its own gold-framed panel.
// Around it, an ivory page with fine branches in the upper corners, faint
// palace outlines at the edges and small flourishes near the lower corners.
// Each part reveals once as it comes into view (the "Our Story" styles).
// The couple's films are in the Memories section that follows.
export function CoupleStorySection(el, config) {
  const { story, couple } = config;
  const paragraphs = story.paragraphs ?? [];
  const more = story.moreParagraphs ?? [];
  const petals = Array.from({ length: 5 }, (_, i) => {
    const left = [9, 24, 74, 88, 56][i];
    return `<i class="st-petal${i % 2 ? "" : " is-blush"}" style="left:${left}%;--d:${(1.5 + i * 0.9).toFixed(1)}s;--t:${(11 + (i % 3) * 2).toFixed(1)}s;--x:${i % 2 ? 30 : -24}px"></i>`;
  }).join("");

  const text = has(paragraphs)
    ? paragraphs.map((p, i) => `<p data-st style="--n:${i}">${esc(p)}</p>`).join("")
    : `<p class="story-soon" data-st>Our story, in our own words, will be shared here soon.</p>`;

  // "Sakhā saptapadī bhava · The Saptapadi": the words, then their source.
  const [words, source] = (story.quote?.attribution ?? "").split(" · ");

  el.innerHTML = `
    <div class="st-bg" aria-hidden="true" data-st>
      <div class="st-palace st-palace-l">${invSide()}</div>
      <div class="st-palace st-palace-r">${invSide()}</div>
      <div class="st-branch st-branch-l"><div class="st-sway">${landingBranch()}</div></div>
      <div class="st-branch st-branch-r"><div class="st-sway">${landingBranch()}</div></div>
      <div class="st-flourish st-flourish-l">${landingFlourish()}</div>
      <div class="st-flourish st-flourish-r">${landingFlourish()}</div>
      <div class="st-petals">${petals}</div>
    </div>

    <header class="section-head st-head" data-st>
      <p class="st-eyebrow">${esc(couple.partnerOne.first)} &amp; ${esc(couple.partnerTwo.first)}</p>
      <h2 class="section-title st-title${LETTERING["Our Story"] ? " is-script" : ""}" id="story-title">${scriptText("Our Story", "script st-script")}</h2>
      ${celDivider()}
    </header>

    <div class="story-body st-body">
      ${text}
      ${
        has(more)
          ? `<details class="story-more" data-st><summary><span class="more-closed">Read more</span><span class="more-open">Show less</span>${icon("i-down")}</summary>${more
              .map((p) => `<p>${esc(p)}</p>`)
              .join("")}</details>`
          : ""
      }
    </div>

    ${
      has(story.quote?.text)
        ? `<figure class="story-quote st-quote" data-st>
            <span class="st-rules" aria-hidden="true"></span>
            ${frameCorner("st-corner st-corner-tl")}${frameCorner("st-corner st-corner-tr")}${frameCorner("st-corner st-corner-bl")}${frameCorner("st-corner st-corner-br")}
            <span class="st-emblem" aria-hidden="true">${lotusEmblem()}</span>
            <blockquote><p>${esc(story.quote.text)}</p></blockquote>
            <span class="st-quote-divider" aria-hidden="true">${quoteDivider()}</span>
            ${
              has(words)
                ? `<figcaption><span class="st-translit">${esc(words)}</span>${has(source) ? `<span class="st-source">— ${esc(source)} —</span>` : ""}</figcaption>`
                : ""
            }
          </figure>`
        : ""
    }`;

  revealStory(el);
}

// A small lotus over the quote.
const lotusEmblem = () => `
  <svg viewBox="0 0 60 30" class="st-emblem-svg">
    <g class="ld-bloom">
      ${[-56, -28, 0, 28, 56].map((a) => `<path d="M0 0C-4.4 -6 -4.4 -15 0 -21C4.4 -15 4.4 -6 0 0Z" transform="translate(30 25) rotate(${a})" fill="${a ? "#F2D8D0" : "#F6E3DD"}" stroke="#D9AFA3" stroke-width=".45"/>`).join("")}
    </g>
    <path class="ld-draw" pathLength="1" d="M6 26.5H54" fill="none" stroke="#C3A064" stroke-width=".7" stroke-linecap="round"/>
  </svg>`;

// The divider under the quote: two gold lines and a small blossom, with a
// soft highlight that passes across once (styles: .st-quote-divider).
const quoteDivider = () => `
  <svg viewBox="0 0 160 16" class="st-quote-divider-svg">
    <path class="ld-draw" pathLength="1" d="M8 8H66M94 8H152" fill="none" stroke="#C3A064" stroke-width=".8" stroke-linecap="round"/>
    <g class="ld-bloom">${Array.from({ length: 5 }, (_, i) => `<ellipse cx="80" cy="4" rx="2.2" ry="3.4" transform="rotate(${i * 72} 80 8)" fill="#F2D8D0" stroke="#D9AFA3" stroke-width=".4"/>`).join("")}<circle cx="80" cy="8" r="1.5" fill="#D6B779"/><circle cx="4" cy="8" r="1.2" fill="#D6B779"/><circle cx="156" cy="8" r="1.2" fill="#D6B779"/></g>
  </svg>`;

// Each part reveals once, when it comes into view; reduced motion (or no
// observer support) shows everything at once. The text is never held back
// for long: each paragraph starts as soon as it is on screen.
function revealStory(root) {
  const parts = [...root.querySelectorAll("[data-st]")];
  const heading = root.querySelector(".st-script");
  const show = (p) => {
    p.classList.add("is-in");
    if (p.classList.contains("st-head")) heading?.classList.add("is-drawn");
  };
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    parts.forEach(show);
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        show(e.target);
        io.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  const start = () => parts.forEach((p) => io.observe(p));
  setTimeout(() => {
    const intro = document.getElementById("intro");
    if (intro && !intro.hidden) document.addEventListener("invitation:opened", start, { once: true });
    else start();
  });
}

export function PhotoGallery(el, photos) {
  el.innerHTML = photos
    .map(
      (p, i) => `
      <button class="gallery-item" type="button" data-index="${i}" data-animate aria-label="Open photo ${i + 1} of ${photos.length}${p.alt ? `: ${esc(p.alt)}` : ""}">
        <img src="${esc(p.thumb || p.src)}" alt="${esc(p.alt ?? "")}" loading="${i < 3 ? "eager" : "lazy"}" decoding="async"
             ${p.width && p.height ? `width="${p.width}" height="${p.height}"` : ""}
             ${p.focus ? `style="object-position:${esc(p.focus)}"` : ""} />
      </button>`,
    )
    .join("");

  // A failed image hides its tile rather than showing a broken icon.
  el.querySelectorAll("img").forEach((img) =>
    img.addEventListener(
      "error",
      () => {
        img.closest(".gallery-item")?.remove();
        markLastRow(el);
      },
      { once: true },
    ),
  );
  markLastRow(el);

  const lightbox = Lightbox(photos);
  el.addEventListener("click", (e) => {
    const item = e.target.closest(".gallery-item");
    if (item) lightbox.open(Number(item.dataset.index), item);
  });
}

// The first photo leads (full width on phones, 2×2 on wider screens).
// Tell the CSS how many tiles end up alone on the last row, so the final
// photo can stretch instead of leaving a gap.
function markLastRow(el) {
  const n = el.querySelectorAll(".gallery-item").length;
  el.dataset.count = n;
  el.dataset.tailPhone = n > 2 ? (n - 1) % 2 : 0;
  el.dataset.tailWide = n > 3 ? (n - 3) % 3 : 0;
}

function Lightbox(photos) {
  const box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Photo viewer");
  box.innerHTML = `
    <figure class="lightbox-figure">
      <img class="lightbox-img" alt="" />
      <figcaption class="lightbox-caption"></figcaption>
    </figure>
    <button class="lightbox-btn lightbox-close" type="button" aria-label="Close photo">${icon("i-close")}</button>
    ${photos.length > 1 ? `
      <button class="lightbox-btn lightbox-prev" type="button" aria-label="Previous photo">${icon("i-left")}</button>
      <button class="lightbox-btn lightbox-next" type="button" aria-label="Next photo">${icon("i-right")}</button>` : ""}`;
  document.body.append(box);

  const img = box.querySelector(".lightbox-img");
  const caption = box.querySelector(".lightbox-caption");
  let index = 0;
  let returnFocus = null;

  const show = (i) => {
    index = (i + photos.length) % photos.length;
    const p = photos[index];
    img.src = p.src;
    img.alt = p.alt ?? "";
    caption.textContent = photos.length > 1 ? `${index + 1} / ${photos.length}` : "";
  };

  const close = () => {
    box.hidden = true;
    document.documentElement.classList.remove("is-locked");
    document.removeEventListener("keydown", onKey);
    // Focus without scrolling, so the guest stays exactly where they were.
    returnFocus?.focus({ preventScroll: true });
  };

  const onKey = (e) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft" && photos.length > 1) show(index - 1);
    else if (e.key === "ArrowRight" && photos.length > 1) show(index + 1);
    else if (e.key === "Tab") {
      const f = [...box.querySelectorAll("button")];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  };

  box.addEventListener("click", (e) => {
    if (e.target.closest(".lightbox-close") || e.target === box) close();
    else if (e.target.closest(".lightbox-prev")) show(index - 1);
    else if (e.target.closest(".lightbox-next")) show(index + 1);
  });

  // Simple horizontal swipe on touch screens.
  let startX = null;
  box.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
  box.addEventListener("touchend", (e) => {
    if (startX === null || photos.length < 2) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });

  return {
    open(i, trigger) {
      returnFocus = trigger;
      show(i);
      box.hidden = false;
      document.documentElement.classList.add("is-locked");
      document.addEventListener("keydown", onKey);
      box.querySelector(".lightbox-close").focus({ preventScroll: true });
    },
  };
}
