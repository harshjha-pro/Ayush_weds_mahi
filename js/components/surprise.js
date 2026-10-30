import { esc, has, icon, scriptText, monogramPicture } from "../utils.js";
import { frameCorner, landingBranch } from "./landing-art.js";

// How long each sequence runs (the CSS under "A Keepsake from Our Hearts"
// is timed to fit inside these).
const OPEN_MS = 3200;
const CLOSE_MS = 1450;
const QUICK_MS = 250; // reduced motion: a short fade either way

// A Keepsake from Our Hearts: a small illustrated memory book. Closed, its
// cover shows the title and a little wreath; opening lifts the cover away
// and reveals the inner page: the couple's sunset photograph, a divider,
// their message and their signature. It can be opened and closed as often
// as a guest likes. The state lives in data-state on .ks:
// closed → opening → open → closing → closed. Clicks in the middle of a
// sequence are ignored, so it never sticks half way.
export function SurpriseMessage(el, config, { reducedMotion }) {
  const { surprise, couple } = config;
  const photo = has(surprise.photo?.src) ? surprise.photo : null;
  const signature = surprise.signature || `${couple.partnerOne.first} & ${couple.partnerTwo.first}`;

  const picture = photo
    ? `<img class="surprise-photo ks-img" src="${esc(photo.thumb || photo.src)}"${
        photo.thumb ? ` srcset="${esc(photo.thumb)} 800w, ${esc(photo.src)} 1600w" sizes="(max-width: 560px) 80vw, 420px"` : ""
      } width="1600" height="1200" alt="${esc(photo.alt ?? "")}" loading="lazy" decoding="async" />`
    : `<div class="surprise-photo surprise-photo-empty">${monogramPicture(config, { loading: "lazy", alt: "" })}</div>`;

  el.innerHTML = `
    <div class="ks" data-state="closed">
      <div class="ks-book">
        <span class="ks-glow" aria-hidden="true"></span>
        <span class="ks-ribbon" aria-hidden="true"></span>

        <div class="ks-page" id="ks-page" inert>
          <span class="ks-rules" aria-hidden="true"></span>
          <h3 class="visually-hidden" id="ks-page-title" tabindex="-1">A message for you</h3>
          <figure class="ks-photo">
            <div class="ks-photo-mat">${picture}</div>
          </figure>
          <span class="ks-divider" aria-hidden="true">${divider()}</span>
          ${has(surprise.message) ? `<p class="ks-message">${esc(surprise.message)}</p>` : ""}
          <p class="ks-signature">${scriptText(signature, "script ks-sign")}</p>
          <span class="ks-finish" aria-hidden="true">${finish()}</span>
          <span class="ks-close-wrap"><button class="btn btn-ghost ks-close" type="button">${icon("i-close")} Close keepsake</button></span>
        </div>

        <div class="ks-cover">
          <span class="ks-rules" aria-hidden="true"></span>
          ${frameCorner("ks-corner ks-corner-bl")}${frameCorner("ks-corner ks-corner-br")}
          <span class="ks-sprig ks-sprig-l" aria-hidden="true">${landingBranch()}</span>
          <span class="ks-sprig ks-sprig-r" aria-hidden="true">${landingBranch()}</span>
          <div class="ks-cover-inner">
            <p class="ks-eyebrow">${esc(surprise.eyebrow || "Just for you")}</p>
            <h2 class="ks-title" id="surprise-title">${scriptText("A Keepsake", "script ks-script")} ${scriptText("from Our Hearts", "script ks-script ks-script-2")}</h2>
            <span class="ks-emblem" aria-hidden="true">${wreath()}</span>
            ${has(surprise.invite) ? `<p class="ks-invite">${esc(surprise.invite)}</p>` : ""}
            <button class="ks-open" type="button" aria-expanded="false" aria-controls="ks-page">
              <span class="ks-open-label">Open your keepsake</span>
            </button>
          </div>
          <span class="ks-sheen" aria-hidden="true"></span>
        </div>
      </div>
    </div>`;

  // The script lettering is drawn by this section's own states, not by the
  // page-wide scroll reveal.
  el.querySelectorAll("svg[data-draw]").forEach((svg) => svg.removeAttribute("data-draw"));

  const ks = el.querySelector(".ks");
  const page = el.querySelector(".ks-page");
  const cover = el.querySelector(".ks-cover");
  const openBtn = el.querySelector(".ks-open");
  const closeBtn = el.querySelector(".ks-close");
  let timer = 0;

  // A missing photo falls back to the monogram instead of a broken image.
  el.querySelector("img.surprise-photo")?.addEventListener("error", (e) => {
    e.target.outerHTML = `<div class="surprise-photo surprise-photo-empty">${monogramPicture(config, { alt: "" })}</div>`;
  });

  const set = (state) => (ks.dataset.state = state);

  const open = () => {
    if (ks.dataset.state !== "closed") return;
    set("opening");
    openBtn.setAttribute("aria-expanded", "true");
    page.inert = false;
    cover.inert = true;
    // Focus moves into the page, so it is never left on the hidden cover.
    el.querySelector("#ks-page-title").focus({ preventScroll: true });
    clearTimeout(timer);
    timer = setTimeout(() => set("open"), reducedMotion ? QUICK_MS : OPEN_MS);
  };

  const close = () => {
    if (ks.dataset.state !== "open") return;
    set("closing");
    openBtn.setAttribute("aria-expanded", "false");
    page.inert = true;
    cover.inert = false;
    openBtn.focus({ preventScroll: true });
    clearTimeout(timer);
    timer = setTimeout(() => set("closed"), reducedMotion ? QUICK_MS : CLOSE_MS);
  };

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  enter(el, reducedMotion);
}

// The first time the section comes into view the keepsake settles in and
// its title and ornaments draw; the opening itself waits for the guest.
function enter(el, reducedMotion) {
  const ks = el.querySelector(".ks");
  const show = () => {
    ks.classList.add("is-in");
    el.querySelectorAll(".ks-script").forEach((s) => s.classList.add("is-drawn"));
  };
  if (reducedMotion || !("IntersectionObserver" in window)) return show();
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      show();
    },
    { threshold: 0.3 },
  );
  setTimeout(() => {
    const intro = document.getElementById("intro");
    if (intro && !intro.hidden) document.addEventListener("invitation:opened", () => io.observe(ks), { once: true });
    else io.observe(ks);
  });
}

// The cover's emblem: two sage sprigs curving into a wreath around a small
// gold heart, with blush blossoms.
const wreath = () => `
  <svg viewBox="0 0 120 64" class="ks-wreath">
    <g fill="none" stroke="#A8957A" stroke-linecap="round" stroke-width=".9">
      <path class="ld-draw" pathLength="1" d="M60 58C40 56 24 46 20 26"/>
      <path class="ld-draw" pathLength="1" d="M60 58C80 56 96 46 100 26"/>
    </g>
    <g class="ld-bloom">
      ${[[24, 40, 210], [30, 49, 230], [40, 54, 250], [22, 31, 190], [96, 40, -30], [90, 49, -50], [80, 54, -70], [98, 31, -10]]
        .map(([x, y, r]) => `<path d="M0 0C2.4 -2.4 6 -2.4 8 0C6 2.2 2.4 2.2 0 0Z" transform="translate(${x} ${y}) rotate(${r})" fill="#BCC4A6"/>`)
        .join("")}
      ${[[20, 24], [100, 24]]
        .map(([x, y]) => `<g transform="translate(${x} ${y})">${Array.from({ length: 5 }, (_, i) => `<ellipse cy="-2.6" rx="2" ry="2.8" transform="rotate(${i * 72})" fill="#F2D8D0" stroke="#E2B8AC" stroke-width=".35"/>`).join("")}<circle r="1" fill="#D6B779"/></g>`)
        .join("")}
    </g>
    <path class="ld-draw" pathLength="1" d="M60 44C52 38 47 33 47 27.5C47 24 49.6 21.5 52.8 21.5C56 21.5 58.4 23.6 60 26.4C61.6 23.6 64 21.5 67.2 21.5C70.4 21.5 73 24 73 27.5C73 33 68 38 60 44Z" fill="none" stroke="#B89255" stroke-width="1.1" stroke-linejoin="round"/>
  </svg>`;

// The small divider between the photograph and the message.
const divider = () => `
  <svg viewBox="0 0 160 16" class="ks-divider-svg">
    <path class="ld-draw" pathLength="1" d="M10 8H66M94 8H150" fill="none" stroke="#C3A064" stroke-width=".8" stroke-linecap="round"/>
    <g class="ld-bloom">${Array.from({ length: 5 }, (_, i) => `<ellipse cx="80" cy="4" rx="2.2" ry="3.4" transform="rotate(${i * 72} 80 8)" fill="#F2D8D0" stroke="#D9AFA3" stroke-width=".4"/>`).join("")}<circle cx="80" cy="8" r="1.5" fill="#D6B779"/></g>
  </svg>`;

// The finishing touch under the signature: a fine line and a tiny flower.
const finish = () => `
  <svg viewBox="0 0 120 14" class="ks-finish-svg">
    <path class="ld-draw" pathLength="1" d="M20 7C40 4 50 10 60 7C70 4 80 10 100 7" fill="none" stroke="#C3A064" stroke-width=".7" stroke-linecap="round"/>
    <g class="ld-bloom">${Array.from({ length: 5 }, (_, i) => `<ellipse cx="60" cy="4.6" rx="1.5" ry="2.2" transform="rotate(${i * 72} 60 7)" fill="#F2D8D0" stroke="#E2B8AC" stroke-width=".3"/>`).join("")}<circle cx="60" cy="7" r=".9" fill="#D6B779"/></g>
  </svg>`;
