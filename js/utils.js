import { LETTERING } from "./lettering.js";

// Small shared helpers. Content comes from config.js, so everything
// inserted into HTML is escaped first.

export const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const has = (value) => (Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && String(value).trim() !== "");

export const icon = (name, cls = "icon") =>
  `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#${name}"></use></svg>`;

// Ornaments carry data-draw: their gold linework is drawn on when they
// scroll into view (the symbol paths use pathLength="1").
export const ornament = (name, cls) =>
  `<svg class="${cls}" aria-hidden="true" focusable="false" data-draw><use href="#${name}"></use></svg>`;

export const divider = (cls = "divider") => ornament("divider", cls);

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const toDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

// All dates are shown in the venue's time zone, whatever the guest's device uses.
const parts = (date, timeZone, options) =>
  Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone, ...options }).formatToParts(date).map((p) => [p.type, p.value]));

export const formatWeekday = (date, timeZone) => parts(date, timeZone, { weekday: "long" }).weekday;

export const formatDate = (date, timeZone) => {
  const p = parts(date, timeZone, { day: "numeric", month: "long", year: "numeric" });
  return `${p.day} ${p.month} ${p.year}`;
};

export const formatTime = (date, timeZone) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(date).map((x) => [x.type, x.value]),
  );
  return `${p.hour}:${p.minute} ${String(p.dayPeriod).toUpperCase()}`;
};

export const formatShortDate = (date, timeZone) => {
  const p = parts(date, timeZone, { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${p.day} · ${p.month} · ${p.year}`;
};

let toastTimer;
export function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("is-shown");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-shown"), 2600);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-secure (http) pages have no Clipboard API.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

// Gently fades elements in as they scroll into view.
// Reveals content as it scrolls into view, once. Items in the same section
// arrive a beat apart (a gentle stagger); ornaments and script headings are
// drawn on. With reduced motion or no observer support, everything shows.
export function observeReveals(root = document) {
  const items = [...root.querySelectorAll("[data-animate]:not(.is-visible), [data-draw]:not(.is-drawn)")];
  const show = (el) => el.classList.add(el.hasAttribute("data-draw") ? "is-drawn" : "is-visible");
  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    items.forEach(show);
    return;
  }
  const groups = new Map();
  items.forEach((el) => {
    if (!el.hasAttribute("data-animate")) return;
    const key = el.closest("section, header, footer") ?? document.body;
    const i = groups.get(key) ?? 0;
    el.style.setProperty("--stagger", `${Math.min(i, 5) * 90}ms`);
    groups.set(key, i + 1);
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          show(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  items.forEach((el) => io.observe(el));
}

// A short line whose words arrive one after another. The words stay real
// text in reading order, so it reads and selects normally.
export function words(text) {
  return `<span class="words">${String(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => `<span class="w" style="--i:${i}">${esc(w)}</span>`)
    .join(" ")}</span>`;
}

// A heading set in Pinyon Script and drawn on letter by letter. The real
// text stays in the heading for screen readers, search and copying.
export function scriptText(text, cls = "script") {
  const art = LETTERING[text];
  if (!art) return esc(text);
  return `<span class="visually-hidden">${esc(text)}</span><svg class="${cls}" viewBox="${art.viewBox}" aria-hidden="true" focusable="false" data-draw>${art.paths
    .map((d, i) => `<path d="${d}" pathLength="1" style="--i:${i}"/>`)
    .join("")}</svg>`;
}

export function sectionHeading({ id, eyebrow, title }) {
  return `
    <header class="section-head" data-animate>
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
      <h2 class="section-title${LETTERING[title] ? " is-script" : ""}" id="${id}">${scriptText(title)}</h2>
      ${divider()}
    </header>`;
}

// The large monogram as the couple's animated video: it draws itself once
// when it comes into view (see startMonogramVideos in motion.js). The still
// image sits inside as the fallback, and replaces the video for visitors who
// prefer reduced motion or if the video cannot play.
export function monogramMedia(config, { cls = "monogram", preload = "metadata", loading = "eager" } = {}) {
  const c = config.couple;
  const still = monogramPicture(config, { cls: "monogram", loading });
  if (!c.monogramVideo || prefersReducedMotion()) return monogramPicture(config, { cls, loading });
  // The exact codec lets browsers that cannot play it skip the download.
  const type = /\.webm$/i.test(c.monogramVideo) ? "video/webm" : 'video/mp4; codecs="avc1.64001F, mp4a.40.2"';
  return `
    <div class="${cls} mono-video" data-mono-video role="img" aria-label="${esc(`${c.monogramLetters} monogram for ${c.partnerOne.first} and ${c.partnerTwo.first}`)}">
      <video class="mono-video-el" muted playsinline disablepictureinpicture preload="${preload}" aria-hidden="true">
        <source src="${esc(c.monogramVideo)}" type="${esc(type)}" />
      </video>
      ${still}
    </div>`;
}

// The couple's illustrated film in the welcome section, in an arched gold
// frame. It is muted (its soundtrack was removed) and loops only while in
// view (see startHeroFilm in motion.js). The poster is the still shown
// before it plays, for reduced motion, and if the video cannot play.
export function heroFilm(video) {
  if (!video?.src) return "";
  const poster = `
      <picture class="hero-film-poster">
        <source srcset="${esc(video.poster)}" type="image/webp" />
        <img src="${esc(video.posterFallback)}" width="540" height="960" loading="eager" decoding="async" alt="" />
      </picture>`;
  const film = prefersReducedMotion()
    ? ""
    : `<video class="hero-film-video" muted loop playsinline disablepictureinpicture preload="metadata" aria-hidden="true">
        <source src="${esc(video.src)}" type='video/mp4; codecs="avc1.64001F"' />
      </video>`;
  return `
    <figure class="hero-film" data-hero-film data-animate role="img" aria-label="${esc(video.alt)}">
      ${poster}${film}
    </figure>`;
}

export function monogramPicture(config, { cls = "monogram", loading = "eager", alt } = {}) {
  const c = config.couple;
  return `
    <picture class="${cls}">
      <source srcset="${esc(c.monogramImage)}" type="image/webp" />
      <img src="${esc(c.monogramImageFallback)}" width="480" height="480" loading="${loading}" decoding="async"
           alt="${esc(alt ?? `${c.monogramLetters} monogram for ${c.partnerOne.first} and ${c.partnerTwo.first}`)}" />
    </picture>`;
}

// Both families, side by side (stacked on narrow phones).
export function familiesBlock(invitation, cls = "families", attrs = "") {
  const fams = (invitation.families ?? []).filter((f) => f?.names?.length);
  if (!fams.length) return "";
  return `
    <div class="${cls}" ${attrs}>
      ${has(invitation.familiesLine) ? `<p class="families-line">${esc(invitation.familiesLine)}</p>` : ""}
      <div class="families-grid">
        ${fams
          .map(
            (f) => `
          <div class="family">
            <p class="eyebrow">${esc(f.side)}</p>
            <p class="family-names">${f.names.map(esc).join('<span class="family-amp"> &amp; </span>')}</p>
          </div>`,
          )
          .join('<span class="families-rule" aria-hidden="true"></span>')}
      </div>
    </div>`;
}
