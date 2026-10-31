import { esc, icon, monogramMedia, copyText, toast, toDate, formatShortDate, words, scriptText, prefersReducedMotion } from "../utils.js";
import { landingBranch } from "./landing-art.js";

// The link that gets shared. Until a public address is set in config.js,
// the address the guest is viewing is used (without any #section part).
export const shareUrl = (config) => config.share.siteUrl || location.href.split("#")[0];

// The last page of the invitation: an ivory page on a pale mint ground,
// fine flowering branches drawn in its upper corners, the closing line, a
// gold flourish, "With love," in script, the M&A seal, the date, the ways
// to share it, a few quiet links and the couple's names. Each group comes
// in once, as it scrolls into view ("Closing" styles); then all is still,
// but for two petals that drift by while the page is on screen.
export function ClosingSection(el, config) {
  const { closing, couple, event } = config;
  const first = toDate(event.functions[0]?.start);

  el.innerHTML = `
    <div class="fin">
      <span class="fin-petal fin-petal-1" aria-hidden="true"></span>
      <span class="fin-petal fin-petal-2" aria-hidden="true"></span>
      <div class="fin-paper" data-fin>
        <span class="fin-rule" aria-hidden="true"></span>
        <span class="fin-branch fin-branch-l" aria-hidden="true">${landingBranch()}</span>
        <span class="fin-branch fin-branch-r" aria-hidden="true">${landingBranch()}</span>

        <div class="fin-head" data-fin>
          <h2 class="closing-line fin-line" id="closing-title">${words(closing.line)}</h2>
          <span class="fin-divider" aria-hidden="true">${flourish()}</span>
          <p class="closing-thanks fin-thanks">${scriptText(closing.thankYou, "script fin-script").replace(" data-draw", "")}</p>
        </div>

        <div class="fin-seal-group" data-fin>
          <div class="fin-seal">
            <svg class="fin-ring" viewBox="0 0 200 200" aria-hidden="true"><circle class="fin-draw" pathLength="1" cx="100" cy="100" r="97" transform="rotate(-90 100 100)"/></svg>
            ${monogramMedia(config, { cls: "monogram closing-monogram", loading: "lazy" })}
            <span class="fin-shine" aria-hidden="true"></span>
          </div>
          ${first ? `<p class="closing-date fin-date">${esc(formatShortDate(first, event.timeZone))}</p>` : ""}
        </div>

        ${ShareInvitation(config)}

        <div class="fin-end" data-fin>
          <nav class="closing-links fin-links" aria-label="Quick links">
            <a href="#celebration">Event details</a><span aria-hidden="true">·</span><a href="#venue">Directions</a><span aria-hidden="true">·</span><a href="#home" data-top>Back to top</a>
          </nav>
          <footer class="site-footer fin-footer">
            <p class="fin-names">${esc(couple.partnerOne.first)} &amp; ${esc(couple.partnerTwo.first)}</p>
            ${config.music?.credit ? `<p class="music-credit">${esc(config.music.credit)}</p>` : ""}
          </footer>
        </div>
      </div>
    </div>`;

  bindShare(el, config);

  // "Back to top" goes to the very top of the page (the link's #home stays
  // as the place to go without scripts).
  el.querySelector("[data-top]").addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    history.replaceState(null, "", location.pathname + location.search);
    document.getElementById("main")?.setAttribute("tabindex", "-1");
    document.getElementById("main")?.focus({ preventScroll: true });
  });

  reveal(el);
}

function ShareInvitation(config) {
  const text = `${config.share.message}\n\n${shareUrl(config)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return `
    <div class="share fin-share" data-fin>
      <p class="eyebrow fin-eyebrow">Share the invitation</p>
      <a class="fin-btn fin-btn-primary" href="${esc(wa)}" target="_blank" rel="noopener" data-whatsapp>${icon("i-whatsapp")} Share on WhatsApp</a>
      <div class="share-actions fin-secondary">
        <button class="fin-btn fin-btn-ghost" type="button" data-share hidden>${icon("i-share")} More options</button>
        <button class="fin-btn fin-btn-ghost" type="button" data-copy-link>${icon("i-link")} Copy link</button>
      </div>
    </div>`;
}

function bindShare(root, config) {
  const nativeBtn = root.querySelector("[data-share]");
  const url = shareUrl(config);

  // The system share sheet exists on most phones; desktops fall back to the
  // WhatsApp link and copy button, which are always shown.
  if (navigator.share) {
    nativeBtn.hidden = false;
    nativeBtn.addEventListener("click", async () => {
      try {
        await navigator.share({ title: document.title, text: config.share.message, url });
      } catch {
        /* The guest closed the share sheet; nothing to do. */
      }
    });
  }

  root.querySelector("[data-copy-link]").addEventListener("click", async () => {
    toast((await copyText(url)) ? "Link copied" : "Could not copy. Please copy it from the address bar.");
  });
}

// Each group reveals once, as it comes into view; reduced motion (or no
// observer support) shows everything at once. The two petals drift only
// while the section is on screen.
function reveal(el) {
  const groups = [...el.querySelectorAll("[data-fin]")];
  const cl = el.querySelector(".fin");
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    groups.forEach((g) => g.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.2 },
  );
  new IntersectionObserver((entries) => cl.classList.toggle("is-on", entries.some((e) => e.isIntersecting))).observe(cl);
  // The intro covers the page at first; start watching once it hands over.
  const start = () => groups.forEach((g) => io.observe(g));
  setTimeout(() => {
    const intro = document.getElementById("intro");
    if (intro && !intro.hidden) document.addEventListener("invitation:opened", start, { once: true });
    else start();
  });
}

// The divider: two fine gold lines drawn outwards from a small flower.
const flourish = () => `
  <svg viewBox="0 0 220 18" class="fin-flourish">
    <path class="fin-draw fin-draw-l" pathLength="1" d="M98 9H8" />
    <path class="fin-draw fin-draw-r" pathLength="1" d="M122 9H212" />
    <g class="fin-flower">
      <path d="M110 2.5L115 9L110 15.5L105 9Z" fill="none" stroke="#C3A064" stroke-width=".9"/>
      ${[0, 90, 180, 270].map((a) => `<ellipse cx="110" cy="5.6" rx="1.3" ry="2.2" transform="rotate(${a} 110 9)" fill="#E9CFC4"/>`).join("")}
      <circle cx="110" cy="9" r="1.1" fill="#C3A064"/><circle cx="4" cy="9" r="1" fill="#C3A064"/><circle cx="216" cy="9" r="1" fill="#C3A064"/>
    </g>
  </svg>`;
