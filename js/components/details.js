// "The Celebration": the day's programme as a framed ivory invitation panel
// in a palace garden. The background, the panel's gold borders, the date,
// the programme, the venue and the families each reveal on their own as the
// section scrolls into view (see revealCelebration and the "Celebration"
// styles). All wording comes from config.js.
import { esc, has, icon, scriptText, toDate, formatWeekday, formatTime, formatDate, familiesBlock, prefersReducedMotion, copyText, toast } from "../utils.js";
import { CalendarAction, bindCalendar } from "./calendar.js";
import { shareUrl } from "./closing.js";
import { celPalace, celGarden, celSpray, celCorner, celCrest, celDivider } from "./celebration-art.js";
import { LETTERING } from "../lettering.js";

const functionIcon = (name) => (/ring|engage|sagai/i.test(name) ? "i-ring" : /lunch|dinner|meal|breakfast/i.test(name) ? "i-dine" : "i-clock");

// Turn-by-turn directions to the venue's map pin; the shared map link is the
// fallback when no coordinates are set.
const directionsUrl = (venue) =>
  venue.coordinates ? `https://www.google.com/maps/dir/?api=1&destination=${venue.coordinates.lat},${venue.coordinates.lng}` : venue.mapsUrl;

export function EventDetailsSection(el, config) {
  const { event, venue, invitation } = config;
  const tz = event.timeZone;
  const first = toDate(event.functions[0]?.start);
  const arrival = toDate(event.arrival);

  const dayParts = first
    ? new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "numeric", month: "long", year: "numeric" }).formatToParts(first)
    : [];
  const get = (t) => dayParts.find((p) => p.type === t)?.value ?? "";

  const schedule = [
    arrival && { name: "Guest Arrival", time: arrival, icon: "i-clock" },
    ...event.functions.map((f) => ({ name: f.name, time: toDate(f.start), icon: functionIcon(f.name) })),
  ].filter((r) => r && r.time);

  const extras = [
    has(event.dressCode) && { icon: "i-info", label: "Dress code", text: event.dressCode },
    has(event.notes) && { icon: "i-info", label: "Please note", text: event.notes },
  ].filter(Boolean);

  const directions = directionsUrl(venue);

  el.innerHTML = `
    <div class="cel-bg" aria-hidden="true" data-cel>
      <div class="cel-palace">${celPalace()}</div>
      <div class="cel-garden">${celGarden()}</div>
      <div class="cel-spray cel-spray-l">${celSpray()}</div>
      <div class="cel-spray cel-spray-r">${celSpray()}</div>
    </div>

    <header class="section-head cel-head" data-cel>
      <p class="cel-label">${esc(event.title)}</p>
      <h2 class="section-title cel-title${LETTERING["The Celebration"] ? " is-script" : ""}" id="celebration-title">${scriptText("The Celebration", "script cel-script")}</h2>
      ${has(invitation.welcomeLine) ? `<p class="cel-sub">${esc(invitation.welcomeLine)}</p>` : ""}
    </header>

    <article class="details-card cel-card" data-cel>
      <span class="cel-border cel-border-o" aria-hidden="true"></span>
      <span class="cel-border cel-border-i" aria-hidden="true"></span>
      ${celCorner("cel-corner-tl")}${celCorner("cel-corner-tr")}${celCorner("cel-corner-bl")}${celCorner("cel-corner-br")}
      <div class="cel-crest">${celCrest()}</div>

      ${
        first
          ? `<div class="date-block" data-cel>
              <p class="date-weekday cel-label">${esc(formatWeekday(first, tz))}</p>
              <p class="date-main"><span class="date-month">${esc(get("month"))}</span><span class="date-day">${esc(get("day"))}</span><span class="date-year">${esc(get("year"))}</span></p>
              <p class="visually-hidden">${esc(`${formatWeekday(first, tz)}, ${formatDate(first, tz)}`)}</p>
            </div>`
          : ""
      }

      ${celDivider()}

      <div class="cel-programme" data-cel>
        <p class="cel-label">The Programme</p>
        <ol class="schedule cel-timeline" aria-label="Programme">
          ${schedule
            .map(
              (r, i) => `
            <li class="schedule-item" style="--i:${i}">
              <span class="schedule-icon">${icon(r.icon)}</span>
              <span class="schedule-name">${esc(r.name)}</span>
              <span class="schedule-dots" aria-hidden="true"></span>
              <time class="schedule-time" datetime="${r.time.toISOString()}">${esc(formatTime(r.time, tz))}</time>
            </li>`,
            )
            .join("")}
        </ol>
        <p class="tz-note">All times are ${esc(event.timeZoneLabel)}</p>
      </div>

      ${celDivider()}

      <div class="details-venue cel-venue" data-cel>
        <div class="cel-venue-art" aria-hidden="true">${celPalace("cv-")}</div>
        <div class="cel-venue-info">
          <p class="cel-label">${icon("i-pin")} The Venue</p>
          <p class="details-venue-name">${esc(venue.name)}</p>
          <address>${venue.addressLines.map(esc).join("<br />")}</address>
          <div class="cel-actions">
            ${has(directions) ? `<a class="btn btn-primary" href="${esc(directions)}" target="_blank" rel="noopener">${icon("i-pin")} Get Directions</a>` : ""}
            <a class="btn btn-ghost" href="#venue">Venue &amp; map</a>
          </div>
        </div>
      </div>

      ${celDivider()}

      ${familiesBlock(invitation, "families details-families cel-families", "data-cel")}

      ${
        extras.length
          ? `<dl class="details-extras" data-cel>${extras
              .map((x) => `<div><dt>${icon(x.icon)} ${esc(x.label)}</dt><dd>${esc(x.text)}</dd></div>`)
              .join("")}</dl>`
          : ""
      }

      <div class="details-calendar" data-cel>
        <p class="cel-label">Save the Date</p>
        <div class="cel-actions">
          ${CalendarAction(config)}
          <button class="btn btn-ghost cel-share" type="button" data-cel-share>${icon("i-share")} Share</button>
        </div>
      </div>
    </article>`;

  bindCalendar(el, config);
  bindShare(el, config);
  revealCelebration(el);
}

// Share opens the phone's share sheet; elsewhere it copies the link.
function bindShare(root, config) {
  const btn = root.querySelector("[data-cel-share]");
  const url = shareUrl(config);
  btn.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, text: config.share.message, url });
      } catch {
        /* The guest closed the share sheet. */
      }
      return;
    }
    toast((await copyText(url)) ? "Link copied" : "Could not copy. Please copy it from the address bar.");
  });
}

// Each part of the section reveals once, when it comes into view. With
// reduced motion (or no observer support) everything is shown at once; the
// styles only hide things inside `.js`, so nothing is lost without scripts.
function revealCelebration(root) {
  const parts = [...root.querySelectorAll("[data-cel]")];
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    parts.forEach((p) => p.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
  );
  // The intro covers the page at first (it is set up just after this
  // section); start watching once it hands over.
  const start = () => parts.forEach((p) => io.observe(p));
  setTimeout(() => {
    const intro = document.getElementById("intro");
    if (intro && !intro.hidden) document.addEventListener("invitation:opened", start, { once: true });
    else start();
  });
}
