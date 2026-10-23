import { divider, toDate } from "../utils.js";

const UNITS = [
  ["days", "Days"],
  ["hours", "Hours"],
  ["minutes", "Minutes"],
  ["seconds", "Seconds"],
];

// Splits the remaining time into whole units. Never negative.
export function remaining(target, now = Date.now()) {
  const ms = Math.max(0, target - now);
  const s = Math.floor(ms / 1000);
  return { done: ms === 0, days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

// Calendar day in the venue's time zone, e.g. "2026-11-15".
const dayKey = (date, timeZone) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

export function CountdownTimer(el, config) {
  const { countdown, event } = config;
  const target = toDate(event.functions[0]?.start);

  if (!target) {
    // No valid date: hide the section rather than count down to nothing.
    el.hidden = true;
    return;
  }

  el.innerHTML = `
    <div class="countdown-inner" data-animate>
      <h2 class="visually-hidden" id="countdown-title">Countdown</h2>
      <p class="countdown-caption"></p>
      <div class="countdown-grid">
        ${UNITS.map(
          ([key, label], i) => `
          ${i ? '<span class="countdown-sep" aria-hidden="true"></span>' : ""}
          <div class="countdown-unit">
            <span class="countdown-num" data-unit="${key}">00</span>
            <span class="countdown-label">${label}</span>
          </div>`,
        ).join("")}
      </div>
      <p class="countdown-done" hidden></p>
      ${divider("divider divider-sm")}
    </div>`;

  const caption = el.querySelector(".countdown-caption");
  const grid = el.querySelector(".countdown-grid");
  const doneMsg = el.querySelector(".countdown-done");
  const nums = Object.fromEntries([...el.querySelectorAll("[data-unit]")].map((n) => [n.dataset.unit, n]));
  const eventDay = dayKey(target, event.timeZone);
  let timer;

  const tick = () => {
    const now = new Date();
    const r = remaining(target.getTime(), now.getTime());
    const today = dayKey(now, event.timeZone);

    if (r.done) {
      grid.hidden = true;
      caption.hidden = true;
      doneMsg.hidden = false;
      doneMsg.textContent = today === eventDay ? countdown.startedMessage : countdown.afterMessage;
      clearInterval(timer);
      return;
    }
    caption.textContent = today === eventDay ? countdown.todayCaption : countdown.caption;
    for (const [key] of UNITS) {
      const value = String(r[key]).padStart(2, "0");
      if (nums[key].textContent !== value) nums[key].textContent = value;
    }
  };

  tick();
  timer = setInterval(tick, 1000);
  // Browsers slow timers in background tabs; catch up instantly on return.
  document.addEventListener("visibilitychange", () => !document.hidden && tick());

  // Live announcements are off so screen readers are not interrupted every second.
  grid.setAttribute("role", "timer");
  grid.setAttribute("aria-live", "off");
  grid.setAttribute("aria-label", `Countdown to ${event.functions[0].name}`);
}
