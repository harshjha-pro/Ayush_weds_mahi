import { esc, icon, ornament, divider, monogramPicture, copyText, toast, toDate, formatShortDate } from "../utils.js";

// The link that gets shared. Until a public address is set in config.js,
// the address the guest is viewing is used (without any #section part).
export const shareUrl = (config) => config.share.siteUrl || location.href.split("#")[0];

export function ClosingSection(el, config) {
  const { closing, couple, event } = config;
  const first = toDate(event.functions[0]?.start);

  el.innerHTML = `
    <div class="closing-inner" data-animate>
      ${ornament("sprig", "closing-sprig closing-sprig-left")}${ornament("sprig", "closing-sprig closing-sprig-right")}
      <h2 class="closing-line" id="closing-title">${esc(closing.line)}</h2>
      ${divider()}
      <p class="closing-thanks">${esc(closing.thankYou)}</p>
      ${monogramPicture(config, { cls: "monogram closing-monogram", loading: "lazy" })}
      ${first ? `<p class="closing-date">${esc(formatShortDate(first, event.timeZone))}</p>` : ""}
      ${ShareInvitation(config)}
      <nav class="closing-links" aria-label="Quick links">
        <a href="#celebration">Event details</a><span aria-hidden="true">·</span><a href="#venue">Directions</a><span aria-hidden="true">·</span><a href="#home">Back to top</a>
      </nav>
    </div>
    <footer class="site-footer">
      <p>${esc(couple.partnerOne.first)} &amp; ${esc(couple.partnerTwo.first)}</p>
      ${config.music?.credit ? `<p class="music-credit">${esc(config.music.credit)}</p>` : ""}
    </footer>`;

  bindShare(el, config);
}

function ShareInvitation(config) {
  const text = `${config.share.message}\n\n${shareUrl(config)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return `
    <div class="share">
      <p class="eyebrow">Share the invitation</p>
      <div class="share-actions">
        <a class="btn btn-primary" href="${esc(wa)}" target="_blank" rel="noopener" data-whatsapp>${icon("i-whatsapp")} Share on WhatsApp</a>
        <button class="btn btn-ghost" type="button" data-share hidden>${icon("i-share")} More options</button>
        <button class="btn btn-ghost" type="button" data-copy-link>${icon("i-link")} Copy link</button>
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
