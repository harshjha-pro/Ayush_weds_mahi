// Small shared helpers. Content comes from config.js, so everything
// inserted into HTML is escaped first.

export const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const has = (value) => (Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && String(value).trim() !== "");

export const icon = (name, cls = "icon") =>
  `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#${name}"></use></svg>`;

export const ornament = (name, cls) =>
  `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#${name}"></use></svg>`;

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
export function observeReveals(root = document) {
  const items = root.querySelectorAll("[data-animate]:not(.is-visible)");
  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  items.forEach((el) => io.observe(el));
}

export function sectionHeading({ id, eyebrow, title }) {
  return `
    <header class="section-head" data-animate>
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
      <h2 class="section-title" id="${id}">${esc(title)}</h2>
      ${divider()}
    </header>`;
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
