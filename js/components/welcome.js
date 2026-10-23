import { esc, icon, ornament, divider, monogramPicture, toDate, formatWeekday, formatDate, familiesBlock } from "../utils.js";

export function WelcomeSection(el, config) {
  const { couple, invitation, event } = config;
  const first = toDate(event.functions[0]?.start);
  const dateLine = first ? `${formatWeekday(first, event.timeZone)} · ${formatDate(first, event.timeZone)}` : "";

  el.innerHTML = `
    <div class="frame hero-frame">
      ${ornament("corner", "corner corner-tl")}${ornament("corner", "corner corner-tr")}
      ${ornament("corner", "corner corner-bl")}${ornament("corner", "corner corner-br")}
      ${ornament("sprig", "hero-sprig hero-sprig-left")}${ornament("sprig", "hero-sprig hero-sprig-right")}

      <div class="hero-inner">
        <p class="eyebrow hero-eyebrow" data-animate>${esc(invitation.eyebrow)}</p>
        <div class="hero-monogram" data-animate>${monogramPicture(config)}</div>
        <h1 class="hero-names" id="hero-title" tabindex="-1" data-animate>
          <span class="name">${esc(couple.partnerOne.full)}</span>
          <span class="amp" aria-hidden="true">&amp;</span><span class="visually-hidden">and</span>
          <span class="name">${esc(couple.partnerTwo.full)}</span>
        </h1>
        <p class="hero-welcome" data-animate>${esc(invitation.welcomeLine)}</p>
        ${familiesBlock(invitation, "families hero-families", "data-animate")}
        ${
          dateLine
            ? `<div class="hero-date" data-animate>${divider("divider divider-sm")}<p><span class="label">${esc(event.title)}</span><span class="date">${esc(dateLine)}</span></p></div>`
            : ""
        }
        <a class="btn btn-primary hero-cta" href="#story" data-animate>Begin Our Story ${icon("i-down")}</a>
      </div>
    </div>`;
}
