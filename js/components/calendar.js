import { esc, icon, toDate, formatTime, toast } from "../utils.js";

// Calendar times are written in UTC ("Z"), which every calendar app
// converts to the guest's own time zone correctly.
const utcStamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function eventData(config) {
  const { couple, event, venue } = config;
  const start = toDate(event.arrival) ?? toDate(event.functions[0]?.start);
  const end = toDate(event.calendarEnd);
  if (!start || !end || end <= start) return null;

  const title = `Engagement of ${couple.partnerOne.first} & ${couple.partnerTwo.first}`;
  const location = [venue.name, ...venue.addressLines].join(", ");
  const schedule = [
    event.arrival ? `Guest arrival: ${formatTime(toDate(event.arrival), event.timeZone)}` : null,
    ...event.functions.map((f) => `${f.name}: ${formatTime(toDate(f.start), event.timeZone)}`),
  ].filter(Boolean);
  const details = [`${couple.partnerOne.full} & ${couple.partnerTwo.full}`, "", ...schedule.map((s) => `${s} ${event.timeZoneLabel}`), "", `Directions: ${venue.mapsUrl}`].join("\n");
  return { start, end, title, location, details };
}

export function googleCalendarUrl(data, timeZone) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: data.title,
    dates: `${utcStamp(data.start)}/${utcStamp(data.end)}`,
    details: data.details,
    location: data.location,
    ctz: timeZone,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

const icsEscape = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// RFC 5545 asks for lines of at most 75 octets, continued with a space.
function fold(line) {
  const bytes = new TextEncoder();
  const out = [];
  let current = "";
  for (const ch of line) {
    if (bytes.encode(current + ch).length > (out.length ? 74 : 75)) {
      out.push(current);
      current = ch;
    } else current += ch;
  }
  out.push(current);
  return out.join("\r\n ");
}

export function buildIcs(data, url) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mahi and Ayush//Engagement Invitation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:engagement-${utcStamp(data.start)}@mahi-ayush`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(data.start)}`,
    `DTEND:${utcStamp(data.end)}`,
    `SUMMARY:${icsEscape(data.title)}`,
    `LOCATION:${icsEscape(data.location)}`,
    `DESCRIPTION:${icsEscape(data.details)}`,
    url ? `URL:${url}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function CalendarAction(config) {
  const data = eventData(config);
  if (!data) return "";
  return `
    <div class="calendar-actions">
      <a class="btn btn-primary" href="${esc(googleCalendarUrl(data, config.event.timeZone))}" target="_blank" rel="noopener">
        ${icon("i-calendar")} Google Calendar
      </a>
      <button class="btn btn-ghost" type="button" data-ics>${icon("i-calendar")} Apple / Outlook (.ics)</button>
    </div>`;
}

export function bindCalendar(root, config) {
  const btn = root.querySelector("[data-ics]");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const data = eventData(config);
    const ics = buildIcs(data, config.share.siteUrl);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mahi-ayush-engagement.ics";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("Calendar file downloaded");
  });
}
