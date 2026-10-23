import { esc, has, icon, ornament, sectionHeading, monogramPicture } from "../utils.js";

export function SurpriseMessage(el, config, { reducedMotion }) {
  const { surprise, couple } = config;
  const photo = has(surprise.photo?.src) ? surprise.photo : null;

  const picture = photo
    ? `<img class="surprise-photo" src="${esc(photo.src)}" alt="${esc(photo.alt ?? "")}" loading="lazy" decoding="async"${
        photo.focus ? ` style="object-position:${esc(photo.focus)}"` : ""
      } />`
    : `<div class="surprise-photo surprise-photo-empty">${monogramPicture(config, { loading: "lazy", alt: "" })}</div>`;

  el.innerHTML = `
    ${sectionHeading({ id: "surprise-title", eyebrow: "Just for you", title: "A Little Surprise" })}
    <div class="surprise-stage" data-animate>
      <button class="surprise-envelope" type="button" aria-expanded="false" aria-controls="surprise-note">
        <span class="visually-hidden">Open the sealed envelope</span>
        <span class="s-env" aria-hidden="true">
          <span class="s-env-back"></span>
          <span class="s-env-card">${ornament("sprig", "s-env-card-sprig")}</span>
          <span class="s-env-pocket"></span>
          <span class="s-env-flap"></span>
          <span class="s-env-seal">${icon("i-heart")}</span>
        </span>
      </button>
      <p class="surprise-hint">${esc(surprise.hint)}<span>Tap the envelope to open</span></p>

      <div class="surprise-note" id="surprise-note" hidden>
        <div class="frame surprise-card">
          ${ornament("corner", "corner corner-tl")}${ornament("corner", "corner corner-tr")}
          ${ornament("corner", "corner corner-bl")}${ornament("corner", "corner corner-br")}
          <div class="surprise-photo-frame">${picture}</div>
          <h3 class="visually-hidden" id="surprise-note-title" tabindex="-1">A message for you</h3>
          ${has(surprise.message) ? `<p class="surprise-message">${esc(surprise.message)}</p>` : ""}
          <p class="surprise-signature">${esc(surprise.signature || `${couple.partnerOne.first} & ${couple.partnerTwo.first}`)}</p>
          <button class="btn btn-ghost surprise-close" type="button">${icon("i-close")} Seal it again</button>
        </div>
      </div>
    </div>`;

  const stage = el.querySelector(".surprise-stage");
  const envelope = el.querySelector(".surprise-envelope");
  const note = el.querySelector(".surprise-note");
  const closeBtn = el.querySelector(".surprise-close");
  let timer;

  // A missing photo falls back to the monogram instead of a broken image.
  el.querySelector("img.surprise-photo")?.addEventListener("error", (e) => {
    e.target.outerHTML = `<div class="surprise-photo surprise-photo-empty">${monogramPicture(config, { alt: "" })}</div>`;
  });

  const open = () => {
    envelope.setAttribute("aria-expanded", "true");
    stage.classList.add("is-opening");
    clearTimeout(timer);
    const reveal = () => {
      stage.classList.add("is-open");
      note.hidden = false;
      el.querySelector("#surprise-note-title").focus({ preventScroll: true });
      note.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
    };
    // Let the envelope animation play first, unless motion is reduced.
    if (reducedMotion) reveal();
    else timer = setTimeout(reveal, 750);
  };

  const close = () => {
    clearTimeout(timer);
    envelope.setAttribute("aria-expanded", "false");
    note.hidden = true;
    stage.classList.remove("is-open", "is-opening");
    envelope.focus({ preventScroll: true });
  };

  envelope.addEventListener("click", () => (envelope.getAttribute("aria-expanded") === "true" ? close() : open()));
  closeBtn.addEventListener("click", close);
}
