// The countdown: four framed panels in a palace garden, counting down to the
// first function in config.js. Each digit rolls up when it changes. The plain
// numbers stay in the page (visually hidden) for screen readers; the rolling
// digits beside them are decoration.
import { esc, scriptText, toDate, prefersReducedMotion } from "../utils.js";
import { celPalace, celSpray } from "./celebration-art.js";
import { LETTERING } from "../lettering.js";

const UNITS = [
  ["days", "Days"],
  ["hours", "Hours"],
  ["minutes", "Minutes"],
  ["seconds", "Seconds"],
];

const HEADING = "Counting the Days";

// Splits the remaining time into whole units. Never negative.
export function remaining(target, now = Date.now()) {
  const ms = Math.max(0, target - now);
  const s = Math.floor(ms / 1000);
  return { done: ms === 0, days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

// Calendar day in the venue's time zone, e.g. "2026-11-15".
const dayKey = (date, timeZone) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

// An ornamental panel border: notched outer rule, a finer inner rule, gold
// dots at the corners and a small lotus at the top. Drawn on (pathLength).
const panelFrame = () => `
  <svg class="cd-frame" viewBox="0 0 120 140" aria-hidden="true">
    <g fill="none" stroke="#B89255" stroke-linecap="round" stroke-linejoin="round">
      <path class="cd-draw" pathLength="1" d="M16 4H104L116 16V124L104 136H16L4 124V16Z" stroke-width="1"/>
      <path class="cd-draw" pathLength="1" d="M18 10H102Q110 10 110 18V122Q110 130 102 130H18Q10 130 10 122V18Q10 10 18 10Z" stroke-width=".5"/>
      <path class="cd-draw" pathLength="1" d="M44 10C50 16 56 17 60 17C64 17 70 16 76 10M44 130C50 124 56 123 60 123C64 123 70 124 76 130" stroke-width=".6"/>
    </g>
    <g class="cd-bloom" fill="#D6B779">
      <path d="M60 2C57 6 57 10 60 13C63 10 63 6 60 2Z" fill="#F1D6CE" stroke="#D9AFA3" stroke-width=".4"/>
      <circle cx="60" cy="14.5" r="1.1"/><circle cx="60" cy="126" r="1.1"/>
      <circle cx="4" cy="16" r="1.2"/><circle cx="116" cy="16" r="1.2"/><circle cx="4" cy="124" r="1.2"/><circle cx="116" cy="124" r="1.2"/>
    </g>
  </svg>`;

// A fine gold rule with a lotus in the middle, above and below the heading.
const rule = (cls) => `
  <svg class="cd-rule ${cls}" viewBox="0 0 260 20" aria-hidden="true">
    <g fill="none" stroke="#B89255" stroke-linecap="round">
      <path class="cd-draw" pathLength="1" d="M112 10H10M148 10H250" stroke-width=".8"/>
      <path class="cd-draw" pathLength="1" d="M112 10C118 4 124 4 130 10C136 4 142 4 148 10" stroke-width=".7"/>
    </g>
    <g class="cd-bloom">
      <path d="M130 2C126 6 126 11 130 15C134 11 134 6 130 2Z" fill="#F1D6CE" stroke="#D9AFA3" stroke-width=".4"/>
      <circle cx="6" cy="10" r="1.2" fill="#D6B779"/><circle cx="254" cy="10" r="1.2" fill="#D6B779"/>
    </g>
  </svg>`;

// A few petals that drift slowly across the background.
const petals = () =>
  Array.from({ length: 6 }, (_, i) => {
    const top = [12, 30, 52, 70, 22, 84][i];
    const dur = 22 + i * 3.5;
    return `<i class="cd-petal${i % 2 ? " is-blush" : ""}" style="top:${top}%;--dur:${dur}s;--delay:${-(i * 4.3).toFixed(1)}s;--rise:${i % 2 ? -40 : 30}px"></i>`;
  }).join("");

export function CountdownTimer(el, config) {
  const { countdown, event } = config;
  const target = toDate(event.functions[0]?.start);

  if (!target) {
    // No valid date: hide the section rather than count down to nothing.
    el.hidden = true;
    return;
  }

  const reduced = prefersReducedMotion();
  el.innerHTML = `
    <div class="cd-bg" aria-hidden="true" data-cd>
      <div class="cd-palace">${celPalace("cdp-")}</div>
      <div class="cd-spray cd-spray-l">${celSpray()}</div>
      <div class="cd-spray cd-spray-r">${celSpray()}</div>
      <div class="cd-petals">${petals()}</div>
    </div>

    <div class="countdown-inner">
      <header class="cd-head" data-cd>
        ${rule("cd-rule-top")}
        <h2 class="cd-title${LETTERING[HEADING] ? " is-script" : ""}" id="countdown-title">${scriptText(HEADING, "script cd-script")}</h2>
        <p class="countdown-caption"></p>
      </header>

      <div class="countdown-grid" data-cd>
        ${UNITS.map(
          ([key, label], i) => `
          <div class="countdown-unit cd-panel" style="--i:${i}">
            ${panelFrame()}
            <span class="cd-roller" aria-hidden="true" data-roll="${key}"></span>
            <span class="countdown-num visually-hidden" data-unit="${key}">00</span>
            <span class="countdown-label">${esc(label)}</span>
          </div>`,
        ).join("")}
      </div>
      <p class="countdown-done" hidden></p>
      ${rule("cd-rule-bottom")}
    </div>`;

  const caption = el.querySelector(".countdown-caption");
  const grid = el.querySelector(".countdown-grid");
  const doneMsg = el.querySelector(".countdown-done");
  const nums = Object.fromEntries([...el.querySelectorAll("[data-unit]")].map((n) => [n.dataset.unit, n]));
  const rollers = Object.fromEntries([...el.querySelectorAll("[data-roll]")].map((n) => [n.dataset.roll, n]));
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
      roll(rollers[key], value, reduced || document.hidden);
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

  revealCountdown(el);
}

// Shows `value` in a roller, one slot per digit. A digit that changes rolls
// up: the old one rises out as the new one rises in from below.
function roll(roller, value, instant) {
  const slots = [...roller.children];
  if (slots.length !== value.length) {
    roller.innerHTML = [...value].map((d) => `<span class="cd-slot"><span class="cd-d">${d}</span></span>`).join("");
    return;
  }
  [...value].forEach((d, i) => {
    const slot = slots[i];
    const current = slot.lastElementChild;
    if (current.textContent === d) return;
    const next = document.createElement("span");
    next.className = "cd-d";
    next.textContent = d;
    if (instant) {
      slot.replaceChildren(next);
      return;
    }
    slot.append(next);
    const ease = "cubic-bezier(0.22, 0.61, 0.36, 1)";
    current.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-70%)", opacity: 0 }], { duration: 520, easing: ease, fill: "forwards" }).finished.then(
      () => current.remove(),
      () => current.remove(),
    );
    next.animate([{ transform: "translateY(70%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], { duration: 520, easing: ease });
  });
}

// Each part reveals once as it comes into view; the drifting petals only
// move while the section is on screen.
function revealCountdown(root) {
  const parts = [...root.querySelectorAll("[data-cd]")];
  const bg = root.querySelector(".cd-bg");
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
    { rootMargin: "0px 0px -10% 0px", threshold: 0.2 },
  );
  new IntersectionObserver(([e]) => bg.classList.toggle("is-on-screen", e.isIntersecting)).observe(root);
  // The intro covers the page at first (it is set up just after this
  // section); start once it hands over.
  setTimeout(() => {
    const intro = document.getElementById("intro");
    const start = () => parts.forEach((p) => io.observe(p));
    if (intro && !intro.hidden) document.addEventListener("invitation:opened", start, { once: true });
    else start();
  });
}
