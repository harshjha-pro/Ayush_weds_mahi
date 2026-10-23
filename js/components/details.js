import { esc, has, icon, ornament, sectionHeading, toDate, formatWeekday, formatTime, formatDate, familiesBlock } from "../utils.js";
import { CalendarAction, bindCalendar } from "./calendar.js";

const functionIcon = (name) => (/ring|engage|sagai/i.test(name) ? "i-ring" : /lunch|dinner|meal|breakfast/i.test(name) ? "i-dine" : "i-clock");

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

  el.innerHTML = `
    ${sectionHeading({ id: "celebration-title", eyebrow: event.title, title: "The Celebration" })}
    <article class="frame details-card" data-animate>
      ${ornament("corner", "corner corner-tl")}${ornament("corner", "corner corner-tr")}
      ${ornament("corner", "corner corner-bl")}${ornament("corner", "corner corner-br")}

      ${
        first
          ? `<div class="date-block">
              <p class="date-weekday">${esc(formatWeekday(first, tz))}</p>
              <p class="date-main"><span class="date-month">${esc(get("month"))}</span><span class="date-day">${esc(get("day"))}</span><span class="date-year">${esc(get("year"))}</span></p>
              <p class="visually-hidden">${esc(`${formatWeekday(first, tz)}, ${formatDate(first, tz)}`)}</p>
            </div>`
          : ""
      }

      <ol class="schedule" aria-label="Programme">
        ${schedule
          .map(
            (r) => `
          <li class="schedule-item">
            <span class="schedule-icon">${icon(r.icon)}</span>
            <span class="schedule-name">${esc(r.name)}</span>
            <span class="schedule-dots" aria-hidden="true"></span>
            <time class="schedule-time" datetime="${r.time.toISOString()}">${esc(formatTime(r.time, tz))}</time>
          </li>`,
          )
          .join("")}
      </ol>
      <p class="tz-note">All times are ${esc(event.timeZoneLabel)}</p>

      <div class="details-venue">
        <span class="details-venue-icon">${icon("i-pin")}</span>
        <div>
          <p class="details-venue-name">${esc(venue.name)}</p>
          <address>${venue.addressLines.map(esc).join("<br />")}</address>
          <a class="text-link" href="#venue">Directions &amp; venue details</a>
        </div>
      </div>

      ${familiesBlock({ ...invitation, familiesLine: null }, "families details-families")}

      ${
        extras.length
          ? `<dl class="details-extras">${extras
              .map((x) => `<div><dt>${icon(x.icon)} ${esc(x.label)}</dt><dd>${esc(x.text)}</dd></div>`)
              .join("")}</dl>`
          : ""
      }

      <div class="details-calendar">
        <p class="eyebrow">Save the date</p>
        ${CalendarAction(config)}
      </div>
    </article>`;

  bindCalendar(el, config);
}
