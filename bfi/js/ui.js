// UI toolkit: escaping, delegated actions, sheets, toasts and small
// components shared by every view.

import { icon } from "./icons.js";
import { STAGES } from "./seed.js";

export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const attr = esc;
export const go = (path) => { location.hash = path; };
export const when = (cond, html) => (cond ? html : "");
export const each = (arr, fn) => (arr || []).map(fn).join("");
export const initials = (name = "") => name.replace(/[^A-Za-z &]/g, "").split(/[ &]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "B";

// ── delegated actions ────────────────────
// Markup names an action with data-act (click), data-form (submit) or
// data-change (change); views register handlers here.
const actions = {};
export const act = (map) => Object.assign(actions, map);

export function formData(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name || el.disabled) continue;
    if (el.name.endsWith("[]")) {
      const k = el.name.slice(0, -2);
      out[k] = out[k] || [];
      if (el.type === "checkbox" ? el.checked : el.value !== "") out[k].push(el.value);
    } else if (el.type === "checkbox") out[el.name] = el.checked;
    else if (el.type === "radio") { if (el.checked) out[el.name] = el.value; }
    else if (el.type === "file") out[el.name] = [...el.files];
    else out[el.name] = el.value.trim();
  }
  return out;
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  fn(el, e);
});
document.addEventListener("submit", (e) => {
  const form = e.target.closest("form[data-form]");
  if (!form) return;
  e.preventDefault();
  const fn = actions[form.dataset.form];
  if (fn) fn(formData(form), form, e);
});
document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-change]");
  if (el && actions[el.dataset.change]) actions[el.dataset.change](el, e);
});
document.addEventListener("input", (e) => {
  const el = e.target.closest("[data-input]");
  if (el && actions[el.dataset.input]) actions[el.dataset.input](el, e);
});

// ── sheet & toast ────────────────────────
export function sheet(title, body, { wide = false } = {}) {
  const root = document.getElementById("sheet-root");
  root.innerHTML = `
    <div class="sheet-bg" data-act="closeSheetBg">
      <div class="sheet" role="dialog" aria-modal="true" aria-label="${attr(title)}" style="${wide ? "max-width:860px" : ""}">
        <div class="grip"></div>
        <div class="sheet-h"><h3>${esc(title)}</h3><button class="icon-btn" data-act="closeSheet" aria-label="Close">${icon("x")}</button></div>
        <div class="sheet-b">${body}</div>
      </div>
    </div>`;
  document.body.style.overflow = "hidden";
  const first = root.querySelector("input:not([type=hidden]),select,textarea");
  if (first && window.innerWidth > 700) first.focus();
  return root.querySelector(".sheet-b");
}
export function closeSheet() {
  document.getElementById("sheet-root").innerHTML = "";
  document.body.style.overflow = "";
}
act({
  closeSheet,
  closeSheetBg: (el, e) => { if (e.target === el) closeSheet(); },
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

let toastTimer;
export function toast(msg) {
  const root = document.getElementById("toast-root");
  root.innerHTML = `<div class="toast">${esc(msg)}</div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (root.innerHTML = ""), 2600);
}

export function confirmSheet(title, text, onYes, yesLabel = "Confirm") {
  sheet(title, `<p class="muted">${esc(text)}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-act="closeSheet">Cancel</button><button class="btn primary" data-act="__confirmYes">${esc(yesLabel)}</button></div>`);
  actions.__confirmYes = () => { closeSheet(); onYes(); };
}

// ── clipboard, share, download ───────────
export async function copy(text, label = "Copied") {
  try { await navigator.clipboard.writeText(text); toast(label); }
  catch { prompt("Copy this:", text); }
}
export async function share(text, url) {
  if (navigator.share) { try { await navigator.share({ text, url }); return; } catch { return; } }
  copy([text, url].filter(Boolean).join(" "), "Copied to share");
}
export function download(name, content, type = "text/plain") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export const wa = (phone, text) => `https://wa.me/${String(phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
export const mailto = (to, subject, body) => `mailto:${to || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
act({ copy: (el) => copy(el.dataset.text, el.dataset.label || "Copied") });
act({ share: (el) => share(el.dataset.text, el.dataset.url) });

// ── QR code (vendor/qrcode.js) ───────────
export function qrSvg(text, cell = 5) {
  if (!window.qrcode) return "";
  const q = window.qrcode(0, "M");
  q.addData(text);
  q.make();
  return q.createSvgTag({ cellSize: cell, margin: 2, scalable: true });
}

// ── components ───────────────────────────
export const badge = (label, tone = "") => `<span class="badge ${tone}">${esc(label)}</span>`;
export const empty = (title, text = "", ic = "lotus") => `<div class="empty">${icon(ic)}<h4>${esc(title)}</h4><p class="small">${esc(text)}</p></div>`;
export const avatar = (name) => `<span class="avatar">${esc(initials(name))}</span>`;

export function stageBar(stage, cancelled = false) {
  return `<div class="stages" aria-label="Stage ${stage + 1} of ${STAGES.length}">${STAGES.map((_, i) => `<i class="${cancelled ? "" : i < stage || stage === 7 ? "done" : i === stage ? "now" : ""}"></i>`).join("")}</div>`;
}

export function timeline(stage, { client = false } = {}) {
  return `<div class="timeline">${STAGES.map((s, i) => {
    const cls = i < stage || stage === 7 ? "done" : i === stage ? "now" : "";
    return `<div class="tl ${cls}"><div class="b">${cls === "done" ? icon("check", "icon sm") : i + 1}</div><div><div class="t">${esc(client && s.key === "review" ? "Your review" : s.name)}</div>${i === stage ? `<div class="d">${esc(client ? s.client : s.need)}</div>` : ""}</div></div>`;
  }).join("")}</div>`;
}

export function field(label, input, hint = "") {
  return `<label class="field"><span>${esc(label)}${hint ? ` <span class="hint">· ${esc(hint)}</span>` : ""}</span>${input}</label>`;
}
export const input = (name, value = "", type = "text", extra = "") => `<input type="${type}" name="${name}" value="${attr(value)}" ${extra}>`;
export const textarea = (name, value = "", extra = "") => `<textarea name="${name}" ${extra}>${esc(value)}</textarea>`;
export function select(name, options, value = "", extra = "") {
  return `<select name="${name}" ${extra}>${options.map((o) => {
    const [v, l] = Array.isArray(o) ? o : [o, o];
    return `<option value="${attr(v)}" ${String(v) === String(value ?? "") ? "selected" : ""}>${esc(l)}</option>`;
  }).join("")}</select>`;
}
export const checkbox = (name, checked, label, value) => `<label class="check"><input type="checkbox" name="${name}" ${value !== undefined ? `value="${attr(value)}"` : ""} ${checked ? "checked" : ""}><span>${label}</span></label>`;

export function chips(items, active, actName, key = "v") {
  return `<div class="chips">${items.map(([v, l, n]) => `<button class="chip ${String(v) === String(active) ? "on" : ""}" data-act="${actName}" data-${key}="${attr(v)}">${esc(l)}${n !== undefined ? `<span class="n">${n}</span>` : ""}</button>`).join("")}</div>`;
}

export function tabs(items, active, base) {
  return `<nav class="tabs">${items.map(([k, l, n]) => `<a href="${base}/${k}" class="${k === active ? "on" : ""}">${esc(l)}${n !== undefined ? `<span class="n">(${n})</span>` : ""}</a>`).join("")}</nav>`;
}
// Tabs that switch view state instead of the URL.
export function stateTabs(items, active, actName) {
  return `<nav class="tabs">${items.map(([k, l, n]) => `<button class="${k === active ? "on" : ""}" data-act="${actName}" data-v="${attr(k)}">${esc(l)}${n !== undefined ? `<span class="n">(${n})</span>` : ""}</button>`).join("")}</nav>`;
}

export function bars(obj, fmt = (v) => v) {
  const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return `<p class="muted small">No data in this range.</p>`;
  const max = Math.max(...entries.map((e) => e[1]), 1);
  return `<div class="bars">${entries.map(([k, v]) => `<div class="bar"><span class="ellipsis">${esc(k)}</span><div class="track"><div class="fill" style="width:${(v / max) * 100}%"></div></div><b class="num">${fmt(v)}</b></div>`).join("")}</div>`;
}

export const progress = (pct, cls = "") => `<div class="progress ${cls}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;

// KPI card with an optional change vs the previous period.
export function kpi(label, value, sub = "", delta) {
  // delta: a % number, or { cur, prev, pct } from calc.delta (small bases show the count).
  let d = "";
  if (delta && typeof delta === "object") {
    const diff = delta.cur - delta.prev;
    d = delta.prev >= 3 ? `<div class="delta ${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "+" : ""}${Math.round(delta.pct)}% vs prev. 30 days</div>`
      : delta.cur ? `<div class="delta up">+${delta.cur} in last 30 days</div>` : "";
  } else if (Number.isFinite(delta)) d = `<div class="delta ${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "+" : ""}${Math.round(delta)}%</div>`;
  return `<div class="card kpi-card"><div class="kpi-l">${esc(label)}</div><div class="kpi-v">${value}</div>${d}${sub ? `<div class="kpi-s">${sub}</div>` : ""}</div>`;
}

// Responsive table: a table on wide screens, stacked rows on phones.
// cols: [{ label, cls }] where cls "pill" / "act" / "num" control layout.
export function rtable(cols, rows, { empty: emptyText = "Nothing here yet.", href } = {}) {
  if (!rows.length) return `<div class="empty"><p class="small">${esc(emptyText)}</p></div>`;
  return `<div class="table-wrap"><table class="rt"><thead><tr>${cols.map((c) => `<th class="${c.cls === "num" ? "num" : ""}">${esc(c.label)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r, i) => `<tr ${href ? `data-href="${attr(href(i))}" data-act="rowGo"` : ""}>${r.map((cell, j) => `<td class="${cols[j].cls || ""}" data-label="${attr(cols[j].label)}">${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
act({ rowGo: (el, e) => { if (e.target.closest("a,button,select,input")) return; location.hash = el.dataset.href.replace(/^#/, ""); } });

// Line chart with soft area fill.
export function lineChart(series, fmt = (v) => v, { height = 180 } = {}) {
  const W = 600, H = height, pl = 44, pr = 10, pt = 10, pb = 24;
  const max = Math.max(...series.map((s) => s.total), 1);
  const nice = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / nice) * nice;
  const x = (i) => pl + (i * (W - pl - pr)) / Math.max(1, series.length - 1);
  const y = (v) => pt + (H - pt - pb) * (1 - v / top);
  const pts = series.map((s, i) => [x(i), y(s.total)]);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = `${path} L${x(series.length - 1)} ${H - pb} L${pl} ${H - pb} Z`;
  const ticks = [0, .5, 1].map((f) => top * f);
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Trend chart">
    <defs><linearGradient id="lcg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--primary)" stop-opacity=".16"/><stop offset="1" stop-color="var(--primary)" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map((t) => `<line class="grid-l" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text class="axis" x="${pl - 6}" y="${y(t) + 3}" text-anchor="end">${esc(fmt(t))}</text>`).join("")}
    <path d="${area}" fill="url(#lcg)"/>
    <path d="${path}" fill="none" stroke="var(--primary)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="var(--surface)" stroke="var(--primary)" stroke-width="2"><title>${esc(series[i].label)}: ${esc(fmt(series[i].total))}</title></circle>`).join("")}
    ${series.map((s, i) => `<text class="axis" x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(s.label)}</text>`).join("")}
  </svg></div>`;
}

const PALETTE = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)", "var(--muted)"];
export function donut(obj, centerLabel = "Total") {
  const entries = Object.entries(obj).filter((e) => e[1] > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, e) => s + e[1], 0);
  if (!total) return `<p class="muted small">No data in this range.</p>`;
  const r = 15.9155, C = 100;
  let off = 25;
  const arcs = entries.map(([, v], i) => {
    const len = (v / total) * C;
    const a = `<circle r="${r}" cx="21" cy="21" fill="none" stroke="${PALETTE[i % PALETTE.length]}" stroke-width="6" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${off}"/>`;
    off -= len;
    return a;
  }).join("");
  return `<div class="donut-wrap"><svg viewBox="0 0 42 42" width="160" height="160" role="img" aria-label="${attr(centerLabel)}">${arcs}
      <text x="21" y="21" text-anchor="middle" style="font-size:7px;font-weight:700;fill:var(--ink)">${total}</text>
      <text x="21" y="26.5" text-anchor="middle" style="font-size:2.6px;fill:var(--muted)">${esc(centerLabel)}</text></svg>
    <div class="legend">${entries.map(([k, v], i) => `<div><span class="dot" style="color:${PALETTE[i % PALETTE.length]}"></span><span class="ellipsis">${esc(k)}</span><b class="num">${Math.round((v / total) * 100)}%</b></div>`).join("")}</div></div>`;
}

// Month grid. events: [{ date: "YYYY-MM-DD", label, kind }]
export function monthCalendar(year, month, events) {
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startDow);
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayKey = key(new Date());
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    if (i >= 35 && d.getMonth() !== month) break;
    const k = key(d);
    const evs = events.filter((e) => e.date === k);
    cells.push(`<div class="day ${d.getMonth() !== month ? "out" : ""} ${k === todayKey ? "today" : ""}"><span class="dn">${d.getDate()}</span>${evs.map((e) => `<span class="ev k-${e.kind}" title="${attr(e.label)}">${esc(e.label)}</span>`).join("")}</div>`);
  }
  return `<div class="cal">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<div class="dow">${d}</div>`).join("")}${cells.join("")}</div>`;
}

// Decorative invitation cover, drawn per template: palette + motif.
const ART = {
  "royal-heritage": ["#6b1324", "#d6a84f", "#f3dfb2", "arch"],
  "mandap-magic": ["#f4e6cf", "#b8862f", "#8a2b1d", "mandap"],
  "golden-elegance": ["#5c0d18", "#e2b65c", "#2a0a10", "mandala"],
  "desert-dreams": ["#efe0c4", "#a8763a", "#7a4a1f", "desert"],
  "marwari-classic": ["#9a1f2e", "#f0cf86", "#f8e9c9", "kalash"],
  "royal-palace": ["#121212", "#d4a64a", "#3a2a10", "palace"],
};
const MOTIF = {
  arch: (g) => `<path d="M55 170V95c0-26 20-46 45-54 25 8 45 28 45 54v75" fill="none" stroke="${g}" stroke-width="1.6"/><path d="M65 170V97c0-20 15-36 35-43 20 7 35 23 35 43v73" fill="none" stroke="${g}" stroke-width=".8"/><path d="M100 34c-4-4-4-9 0-13 4 4 4 9 0 13z" fill="${g}"/><circle cx="100" cy="86" r="8" fill="none" stroke="${g}" stroke-width="1.2"/><circle cx="100" cy="86" r="2.5" fill="${g}"/>`,
  mandap: (g) => `<path d="M48 70 100 38l52 32z" fill="none" stroke="${g}" stroke-width="1.5"/><path d="M52 70h96" stroke="${g}" stroke-width="1.5"/>${[58, 82, 118, 142].map((x) => `<path d="M${x} 72v92" stroke="${g}" stroke-width="2"/>`).join("")}${[60, 75, 90, 105, 120, 135].map((x, i) => `<circle cx="${x + 3}" cy="${76 + (i % 2) * 4}" r="2.2" fill="${g}" opacity=".7"/>`).join("")}<path d="M50 166h100" stroke="${g}" stroke-width="1.5"/><path d="M100 30c-3-3-3-7 0-10 3 3 3 7 0 10z" fill="${g}"/>`,
  mandala: (g) => `<g transform="translate(100 82)">${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30})" d="M0-12C6-22 6-32 0-40-6-32-6-22 0-12z" fill="none" stroke="${g}" stroke-width="1.1"/>`).join("")}${Array.from({ length: 24 }, (_, i) => `<circle transform="rotate(${i * 15})" cx="0" cy="-46" r="1.6" fill="${g}"/>`).join("")}<circle r="9" fill="none" stroke="${g}" stroke-width="1.2"/><circle r="3" fill="${g}"/></g>`,
  desert: (g) => `<circle cx="138" cy="58" r="14" fill="none" stroke="${g}" stroke-width="1.4"/><path d="M60 118v-22h10v-8l8-8 8 8v8h10v-14l10-12 10 12v14h10v22z" fill="none" stroke="${g}" stroke-width="1.3"/><path d="M20 150c30-14 55-14 80 0s50 14 80 0" fill="none" stroke="${g}" stroke-width="1.4"/><path d="M20 166c30-10 55-10 80 0s50 10 80 0" fill="none" stroke="${g}" stroke-width=".9"/>`,
  kalash: (g) => `<path d="M76 104c0 26 10 40 24 40s24-14 24-40z" fill="none" stroke="${g}" stroke-width="1.6"/><path d="M80 104h40M84 96h32l-4 8H88z" fill="none" stroke="${g}" stroke-width="1.4"/><ellipse cx="100" cy="80" rx="11" ry="13" fill="none" stroke="${g}" stroke-width="1.4"/>${[-1, 1].map((d) => `<path d="M100 92c${d * 14}-2 ${d * 26}-8 ${d * 32}-18 ${d * -10} 0 ${d * -24} 6 ${d * -32} 18z" fill="none" stroke="${g}" stroke-width="1.2"/>`).join("")}<path d="M88 124h24" stroke="${g}" stroke-width="1"/><circle cx="100" cy="124" r="3" fill="${g}"/>`,
  palace: (g) => `<path d="M24 156V112h14V96l8-8 8 8v16h12V82l10-12 10 12v30h28V82l10-12 10 12v30h12V96l8-8 8 8v16h14v44z" fill="none" stroke="${g}" stroke-width="1.3"/><path d="M90 112V92c0-8 4-14 10-18 6 4 10 10 10 18v20" fill="none" stroke="${g}" stroke-width="1.3"/><path d="M100 70c-3-3-3-7 0-10 3 3 3 7 0 10z" fill="${g}"/>${[40, 60, 132, 152].map((x) => `<path d="M${x} 140v-10a4 4 0 0 1 8 0v10" fill="none" stroke="${g}" stroke-width="1"/>`).join("")}`,
};
export function templateArt(t, label = "Wedding Invitation") {
  const k = (t?.art || t?.name || "royal-heritage").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
  const [bg, gold, ink, motif] = ART[k] || ART["royal-heritage"];
  const dark = parseInt(bg.slice(1, 3), 16) < 170;
  const txt = dark ? gold : ink;
  const id = Math.random().toString(36).slice(2, 7);
  const textY = { arch: 122, mandap: 118, mandala: 150, desert: 138, kalash: 160, palace: 178 }[motif];
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><radialGradient id="r${id}" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="${bg}" stop-opacity=".82"/><stop offset="1" stop-color="${bg}"/></radialGradient>
    <pattern id="p${id}" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.1" fill="${gold}" opacity=".22"/></pattern></defs>
    <rect width="200" height="200" fill="${bg}"/><rect width="200" height="200" fill="url(#r${id})"/><rect width="200" height="200" fill="url(#p${id})"/>
    <rect x="10" y="10" width="180" height="180" fill="none" stroke="${gold}" stroke-width="1.5"/>
    <rect x="15" y="15" width="170" height="170" fill="none" stroke="${gold}" stroke-width=".6"/>
    ${[20, 180].map((x) => `<path d="M${x} 20 q${x < 100 ? 18 : -18} 4 ${x < 100 ? 22 : -22} 22" fill="none" stroke="${gold}" stroke-width="1"/><circle cx="${x}" cy="20" r="3" fill="${gold}"/>`).join("")}
    ${MOTIF[motif](gold)}
    ${motif === "palace" || motif === "kalash" || motif === "mandala" ? `<text x="100" y="${textY}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="13" fill="${txt}">${esc(label)}</text>`
      : `<text x="100" y="${textY}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="15" fill="${txt}">${esc(label.split(" ")[0])}</text>
    <text x="100" y="${textY + 17}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="12" fill="${txt}">${esc(label.split(" ").slice(1).join(" "))}</text>`}
  </svg>`;
}

// Source chip with a coloured initial.
const SRC_COLOR = { Instagram: "#e1306c", Pinterest: "#e60023", "Google / SEO": "#4285f4", "WhatsApp group": "#25d366", "Vendor referral": "#14213d", "Past client": "#b88a35", "Walk-in / phone": "#6b7486", Other: "#9aa3b2" };
export const srcBadge = (s) => `<span class="src"><i style="background:${SRC_COLOR[s] || "#9aa3b2"}">${esc((s || "?")[0])}</i>${esc(s)}</span>`;

export const toggle = (name, checked, extra = "") => `<label class="switch"><input type="checkbox" name="${name}" ${checked ? "checked" : ""} ${extra}><span></span></label>`;

export const fileKind = (type = "", name = "") => {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  return "file";
};
export const kindIcon = { image: "image", video: "video", audio: "mic", pdf: "file", link: "link", file: "file" };
