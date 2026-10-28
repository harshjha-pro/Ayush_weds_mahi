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
export const kpi = (label, value, sub = "") => `<div class="card"><div class="kpi-l">${esc(label)}</div><div class="kpi-v">${value}</div>${sub ? `<div class="kpi-s">${sub}</div>` : ""}</div>`;
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
  return `<nav class="tabs">${items.map(([k, l]) => `<a href="${base}/${k}" class="${k === active ? "on" : ""}">${esc(l)}</a>`).join("")}</nav>`;
}

export function bars(obj, fmt = (v) => v) {
  const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return `<p class="muted small">No data in this range.</p>`;
  const max = Math.max(...entries.map((e) => e[1]), 1);
  return `<div class="bars">${entries.map(([k, v]) => `<div class="bar"><span class="ellipsis">${esc(k)}</span><div class="track"><div class="fill" style="width:${(v / max) * 100}%"></div></div><b class="num">${fmt(v)}</b></div>`).join("")}</div>`;
}

export function spark(series, fmt = (v) => v) {
  const max = Math.max(...series.map((s) => s.total), 1);
  return `<div class="spark">${series.map((s, i) => `<div class="${i === series.length - 1 ? "hi" : ""}" style="height:${Math.max(2, (s.total / max) * 100)}%" title="${attr(s.label)}: ${attr(fmt(s.total))}"></div>`).join("")}</div>
    <div class="spark-l">${series.map((s) => `<span>${esc(s.label)}</span>`).join("")}</div>`;
}

export const fileKind = (type = "", name = "") => {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  return "file";
};
export const kindIcon = { image: "image", video: "video", audio: "mic", pdf: "file", link: "link", file: "file" };
