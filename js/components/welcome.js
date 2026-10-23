import { esc, has, icon, ornament, divider, monogramPicture, toDate, formatWeekday, formatDate } from "../utils.js";

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
        ${has(invitation.hosts) ? `<p class="hero-hosts" data-animate>${esc(invitation.hosts)}</p>` : ""}
        ${
          dateLine
            ? `<div class="hero-date" data-animate>${divider("divider divider-sm")}<p><span class="label">${esc(event.title)}</span><span class="date">${esc(dateLine)}</span></p></div>`
            : ""
        }
        <a class="btn btn-primary hero-cta" href="#story" data-animate>Begin Our Story ${icon("i-down")}</a>
      </div>
    </div>`;
}

// The opening envelope. It is a layer above the page, never a gate:
// it can be skipped, it closes with Escape, and deep links bypass it.
export function InvitationReveal(el, config, { reducedMotion }) {
  const { couple } = config;
  if (location.hash && location.hash !== "#home") return;

  el.hidden = false;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-labelledby", "reveal-title");
  el.innerHTML = `
    <div class="reveal-stage">
      <div class="envelope" aria-hidden="true">
        <div class="envelope-back"></div>
        <div class="envelope-card">
          <img src="${esc(couple.monogramSmall)}" width="96" height="96" alt="" />
        </div>
        <div class="envelope-pocket"></div>
        <div class="envelope-flap"></div>
        <div class="envelope-seal"><span>${esc(couple.monogramLetters)}</span></div>
      </div>
      <div class="reveal-text">
        <p class="eyebrow">You are invited</p>
        <h2 class="reveal-title" id="reveal-title">${esc(couple.partnerOne.first)} <span class="amp">&amp;</span> ${esc(couple.partnerTwo.first)}</h2>
        <button class="btn btn-primary reveal-open" type="button">Open Invitation</button>
        <button class="reveal-skip" type="button">Skip animation</button>
      </div>
    </div>`;

  document.documentElement.classList.add("is-revealing");
  const openBtn = el.querySelector(".reveal-open");
  const skipBtn = el.querySelector(".reveal-skip");
  // Focus the layer itself so screen readers announce it, without a focus ring on the button.
  el.tabIndex = -1;
  requestAnimationFrame(() => el.focus({ preventScroll: true }));

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.hidden = true;
    el.innerHTML = "";
    document.documentElement.classList.remove("is-revealing");
    document.removeEventListener("keydown", onKey);
    window.scrollTo(0, 0);
    document.getElementById("hero-title")?.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent("invitation:opened"));
  };

  const open = () => {
    if (reducedMotion) return finish();
    openBtn.disabled = true;
    el.classList.add("is-opening");
    // Matches the CSS sequence: seal lifts, flap opens, card rises, layer fades.
    setTimeout(() => el.classList.add("is-leaving"), 1500);
    setTimeout(finish, 2200);
  };

  const onKey = (e) => {
    if (e.key === "Escape") finish();
    // Keep keyboard focus inside the opening layer while it is shown.
    if (e.key === "Tab") {
      const f = [openBtn, skipBtn].filter((b) => !b.disabled);
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
    }
  };

  openBtn.addEventListener("click", open);
  skipBtn.addEventListener("click", finish);
  document.addEventListener("keydown", onKey);
}
