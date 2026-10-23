import { esc, has, icon, ornament, sectionHeading } from "../utils.js";

export function CoupleStorySection(el, config) {
  const { story, couple } = config;
  const paragraphs = story.paragraphs ?? [];
  const more = story.moreParagraphs ?? [];
  const photos = (story.photos ?? []).filter((p) => has(p?.src));

  const text = has(paragraphs)
    ? paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")
    : `<p class="story-soon">Our story, in our own words, will be shared here soon.</p>`;

  el.innerHTML = `
    ${sectionHeading({ id: "story-title", eyebrow: `${couple.partnerOne.first} & ${couple.partnerTwo.first}`, title: "Our Story" })}
    <div class="story-body" data-animate>
      ${text}
      ${
        has(more)
          ? `<details class="story-more"><summary><span class="more-closed">Read more</span><span class="more-open">Show less</span>${icon("i-down")}</summary>${more
              .map((p) => `<p>${esc(p)}</p>`)
              .join("")}</details>`
          : ""
      }
    </div>
    ${has(story.quote?.text) ? `
      <figure class="story-quote" data-animate>
        <blockquote><p>${esc(story.quote.text)}</p></blockquote>
        ${has(story.quote.attribution) ? `<figcaption>${esc(story.quote.attribution)}</figcaption>` : ""}
      </figure>` : ""}
    ${photos.length ? `<div class="gallery" data-count="${photos.length}"></div>` : storyArches()}`;

  if (photos.length) PhotoGallery(el.querySelector(".gallery"), photos);
}

// Shown until photographs are added: three illustrated arches, so the
// section still feels finished rather than empty.
function storyArches() {
  return `
    <div class="story-arches" aria-hidden="true" data-animate>
      <div class="arch">${ornament("sprig", "arch-sprig")}</div>
      <div class="arch arch-tall">${ornament("sprig", "arch-sprig")}</div>
      <div class="arch">${ornament("sprig", "arch-sprig arch-sprig-flip")}</div>
    </div>`;
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
