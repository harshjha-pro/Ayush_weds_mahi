// One project workspace, shared by admin, designers, QA and freelancers.
// Tabs are filtered by role: designers never see pricing or payments.

import { db, commit, byId, uid, now, userName, putFile, fileUrl, currentUser } from "../db.js";
import { PURPOSES } from "../seed.js";
import { icon } from "../icons.js";
import { esc, attr, act, sheet, closeSheet, toast, badge, empty, field, input, textarea, select, checkbox, tabs, timeline, stageBar, wa, avatar, fileKind, kindIcon, go, progress, templateArt, rtable } from "../ui.js";
import * as C from "../calc.js";

export const clientLink = (p) => `${location.origin}${location.pathname}#/c/${p.token}`;
export const coupleName = (p) => (p.brideName && p.groomName ? `${p.brideName} & ${p.groomName}` : p.clientName);
export const projectTitle = (p) => `${(p.clientName.split(" ").pop() || p.clientName)} Wedding`;
export const thumb = (p) => `<span class="thumb">${templateArt(byId("templates", p.templateId))}</span>`;

export const HANDOVER = [
  ["approved", "Final design approved by the client"],
  ["spelling", "All names, dates & spellings verified"],
  ["links", "Maps, calls, RSVP & WhatsApp links tested"],
  ["mobile", "Checked on a small phone and a desktop"],
  ["seo", "SEO / share metadata added (title, preview image)"],
  ["privacy", "Private, non-guessable URL — no photos exposed"],
  ["preview", "Client preview link sent"],
];
const handoverDone = (p, k) => (k === "approved" ? !!p.designApprovedAt || p.stage >= 5 || !!p.handover?.approved : k === "preview" ? p.previews.length > 0 || !!p.handover?.preview : !!p.handover?.[k]);
export const handoverReady = (p) => HANDOVER.every(([k]) => handoverDone(p, k));

// ── shared asset upload (client portal + team) ─────────
export async function addAssets(p, d, by) {
  let n = 0;
  for (const f of d.files || []) {
    const fileId = await putFile(f);
    p.assets.push({ id: uid("as"), fileId, name: f.name, type: f.type, kind: fileKind(f.type, f.name), size: f.size, purpose: d.purpose || "other", note: d.note || "", at: now(), by });
    n++;
  }
  if (d.link) {
    p.assets.push({ id: uid("as"), url: d.link, name: d.link.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60), kind: "link", purpose: d.purpose || "inspiration", note: d.note || "", at: now(), by });
    n++;
  }
  return n;
}

export function assetTiles(p, { canDelete = false } = {}) {
  if (!p.assets.length) return `<div class="empty boxed">${icon("image")}<h4>No references yet</h4><p class="small">Photos, videos, voice notes, PDFs and links appear here, organised by purpose.</p></div>`;
  const groups = Object.entries(PURPOSES).map(([k, l]) => [k, l, p.assets.filter((a) => a.purpose === k)]).filter((g) => g[2].length);
  return groups.map(([, l, list]) => `
    <div class="stack sm"><div class="row between"><b class="small">${esc(l)}</b><span class="badge">${list.length}</span></div>
    <div class="tiles">${list.map((a) => `
      <div class="tile">
        <a class="th" ${a.url ? `href="${attr(a.url)}" target="_blank" rel="noopener"` : `data-file="${a.fileId}" data-kind="${a.kind}"`}>${icon(kindIcon[a.kind] || "file", "icon lg")}</a>
        <div class="meta"><b title="${attr(a.name)}">${esc(a.name)}</b>
          ${a.note ? `<span class="muted">${esc(a.note)}</span>` : ""}
          <span class="muted tiny">${esc(a.by || "")} · ${C.ago(a.at)}</span>
          ${canDelete ? `<button class="btn sm ghost danger" data-act="pAssetDel" data-pid="${p.id}" data-id="${a.id}" aria-label="Remove">${icon("trash", "icon sm")}</button>` : ""}
        </div>
      </div>`).join("")}</div></div>`).join("");
}

// Swap placeholder tiles for the stored image / video / audio.
export async function hydrateFiles(root) {
  for (const el of root.querySelectorAll("[data-file]")) {
    const url = await fileUrl(el.dataset.file);
    if (!url) continue;
    const k = el.dataset.kind;
    if (k === "image") el.innerHTML = `<img src="${url}" alt="">`;
    else if (k === "video") el.innerHTML = `<video src="${url}" controls playsinline preload="metadata"></video>`;
    else if (k === "audio") el.innerHTML = `<audio src="${url}" controls style="width:92%"></audio>`;
    if (k !== "video" && k !== "audio") { el.setAttribute("href", url); el.setAttribute("target", "_blank"); }
  }
}

export const uploadForm = (p, formName = "pUpload", extra = "") => `
  <form class="form card" data-form="${formName}" data-pid="${p.id}" ${extra}>
    <h3>Add references</h3>
    <div class="cols">
      ${field("What is it for?", select("purpose", Object.entries(PURPOSES), "couple"))}
      ${field("Files", `<input type="file" name="files" multiple accept="image/*,video/*,audio/*,application/pdf">`, "photos, videos, voice notes, PDFs")}
    </div>
    <div class="cols">${field("Or paste a link", input("link", "", "url", 'placeholder="Pinterest, Instagram, Drive…"'))}${field("Note (optional)", input("note", "", "text", 'placeholder="e.g. use this one for the cover"'))}</div>
    <div><button class="btn primary">${icon("upload", "icon sm")} Add</button></div>
  </form>`;

// Asset intake checklist card (mockup: Asset Intake Checklist).
export function intakeCard(p, { remind = true } = {}) {
  const cl = C.checklist(p);
  const done = C.checklistDone(p);
  return `<div class="card stack">
    <div class="row nowrap">${thumb(p)}<div class="grow"><b>${esc(projectTitle(p))}</b><div class="small muted">${esc(coupleName(p))}</div></div><span class="small muted nowrap">${done}/${cl.length} Complete</span></div>
    ${progress((done / cl.length) * 100, "ok")}
    <div class="list">${cl.map((c) => `<div class="item"><span style="color:var(--${c.done ? "ok" : "muted"})">${icon(c.done ? "checkCircle" : "clock")}</span><div class="grow">${esc(c.label)}</div>${badge(c.done ? "Uploaded" : "Missing", c.done ? "ok" : "bad")}</div>`).join("")}</div>
    ${remind && done < cl.length ? `<button class="btn sm" data-act="pRemind" data-id="${p.id}">${icon("message", "icon sm")} Remind client on WhatsApp</button>` : ""}
  </div>`;
}

// Client ↔ team conversation (also used by the client portal).
export function chatView(p, thread, side, base, threads) {
  const msgs = (p.messages || []).filter((m) => m.thread === thread);
  const me = side === "client" ? "client" : currentUser()?.id;
  return `<div class="chat">
    <nav class="threads">${threads.map((t) => {
      const n = C.unread(p, t, side);
      return `<a href="${base}/${t}" class="${t === thread ? "on" : ""}">${avatar(C.THREADS[t])}<span>${esc(C.THREADS[t])}</span>${n ? `<span class="unread">${n}</span>` : ""}</a>`;
    }).join("")}</nav>
    <div class="convo">
      <div class="msgs" data-scroll-bottom>${msgs.map((m) => {
        const mine = m.from === me || (side === "team" && m.from !== "client" && m.from === me);
        const who = m.from === "client" ? p.clientName : userName(m.from);
        return `<div class="bubble ${mine ? "me" : ""}">${!mine ? `<div class="who">${esc(who)}</div>` : ""}${esc(m.text)}<div class="tm">${new Date(m.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div></div>`;
      }).join("") || `<div class="empty"><p class="small">No messages yet — say namaste 🙏</p></div>`}</div>
      <form class="composer" data-form="msgSend" data-pid="${p.id}" data-thread="${thread}" data-side="${side}">
        <input type="text" name="text" placeholder="Type a message…" autocomplete="off" required aria-label="Message"><button class="btn primary" aria-label="Send">${icon("send", "icon sm")}</button>
      </form>
    </div>
  </div>`;
}
export function markSeen(p, thread, side) {
  const key = `${side}:${thread}`;
  const last = (p.messages || []).filter((m) => m.thread === thread).map((m) => m.at).sort().pop() || "";
  if (last && (p.seen?.[key] || "") < last) { p.seen = { ...(p.seen || {}), [key]: last }; return true; }
  return false;
}
export const scrollChat = (root) => root.querySelectorAll("[data-scroll-bottom]").forEach((el) => (el.scrollTop = el.scrollHeight));

// ── view ────────────────────────────────
export function projectView(p, user, tab, base, rest = []) {
  const role = user.role;
  const isAdmin = role === "admin";
  const threadsFor = isAdmin ? ["design", "admin", "qa"] : role === "qa" ? ["qa"] : ["design"];
  const unreadN = threadsFor.reduce((s, t) => s + C.unread(p, t, "team"), 0);
  const all = [
    ["overview", "Overview"], ["design", "Design"], ["assets", "Assets", p.assets.length], ["brief", "Brief"],
    ["messages", unreadN ? `Messages •` : "Messages"], ["notes", "Notes", p.notes.length], ["handover", role === "qa" ? "QA review" : "Handover & QA"],
    ["money", "Payments"], ["delivery", "Delivery"], ["consent", "Consent"],
  ];
  const T = isAdmin ? all : all.filter(([k]) => !["money", "consent", "overview"].includes(k) || (k === "overview" && false));
  if (!T.some(([k]) => k === tab)) tab = T[0][0];
  const h = C.health(p);
  const thread = threadsFor.includes(rest[0]) ? rest[0] : threadsFor[0];
  if (tab === "messages" && markSeen(p, thread, "team")) setTimeout(() => commit("Read messages", p.code), 0);
  const body = {
    overview: () => overview(p, user),
    design: () => designTab(p, user),
    assets: () => `<div class="two side"><div class="stack">${intakeCard(p)}${uploadForm(p)}</div><div class="card stack"><h3>Client references</h3>${assetTiles(p, { canDelete: isAdmin })}</div></div>`,
    brief: () => brief(p),
    messages: () => chatView(p, thread, "team", `${base}/${p.id}/messages`, threadsFor),
    notes: () => notesTab(p, user),
    handover: () => handoverTab(p, user),
    money: () => moneyTab(p),
    delivery: () => deliveryTab(p, user),
    consent: () => consentTab(p),
  }[tab]();

  return {
    title: projectTitle(p),
    subtitle: `${coupleName(p)} · ${p.code} · ${C.S().tiers[p.tier]?.name} package`,
    back: isAdmin ? "#/projects" : "#/home",
    actions: `${badge(h.label, h.tone)}`,
    html: `
      <div class="card tight stack sm" style="margin-bottom:14px">
        <div class="row between small"><span><b>${esc(C.stageName(p.stage))}</b> · stage ${p.stage + 1} of 8</span><span class="muted">Due ${C.date(p.dueDate)} · wedding ${C.date(p.weddingDate)}</span></div>
        ${stageBar(p.stage, p.status === "cancelled")}
      </div>
      ${tabs(T, tab, `${base}/${p.id}`)}
      ${body}`,
    after: (root) => { hydrateFiles(root); scrollChat(root); },
  };
}

function overview(p, user) {
  const staff = (r) => db.users.filter((u) => r.includes(u.role) && u.active !== false).map((u) => [u.id, u.name]);
  const partners = [["", "— none —"], ...db.users.filter((u) => u.role === "affiliate").map((u) => [u.id, u.name])];
  const d = C.daysUntil(p.dueDate);
  return `
  <div class="two">
    <div class="stack">
      ${p.status === "cancelled" ? `<div class="callout bad">${icon("alert")}<div>Cancelled ${C.date(p.cancelledAt)} — ${esc(p.cancelReason || "")}. Refunded ${C.money(C.refunded(p))}.</div></div>` : ""}
      <div class="card">
        <div class="card-head"><h3>Stage</h3>
          ${p.status !== "cancelled" ? `<div class="row">
            <button class="btn sm" data-act="pStage" data-id="${p.id}" data-stage="${p.stage - 1}" ${p.stage === 0 ? "disabled" : ""} aria-label="Previous stage">${icon("arrowLeft", "icon sm")}</button>
            <button class="btn sm primary" data-act="pStage" data-id="${p.id}" data-stage="${p.stage + 1}" ${p.stage === 7 ? "disabled" : ""}>Next ${icon("arrowRight", "icon sm")}</button>
          </div>` : ""}
        </div>
        ${timeline(p.stage)}
        <p class="small muted" style="margin:0">In this stage for ${C.stageAge(p)} day(s) · SLA ${C.S().slaDays[p.stage] || "—"} day(s)</p>
      </div>
      ${intakeCard(p)}
    </div>
    <div class="stack">
      <div class="card stack sm">
        ${[["Client", `${esc(p.clientName)} · ${esc(p.phone || "")}`], ["Wedding", C.date(p.weddingDate)], ["Due", `<span class="${d < 0 && p.status === "active" ? "badge bad" : ""}">${C.date(p.dueDate)}</span>`], ["Revisions", `${esc(C.limitLabel(p))}${p.rush ? " " + badge("Rush", "violet") : ""}`], ["Template", esc(byId("templates", p.templateId)?.name || "—")], ["Price", `${C.money(p.price)} ${badge(C.payStatus(p).label, C.payStatus(p).tone)}`]].map(([k, v]) => `<div class="row between"><span class="muted small">${k}</span><span class="small">${v}</span></div>`).join("")}
        <div class="row between"><span class="muted small">Client link</span><span class="row"><button class="btn sm" data-act="copy" data-text="${attr(clientLink(p))}" data-label="Client link copied">${icon("copy", "icon sm")} Copy</button>
          <a class="btn sm" target="_blank" rel="noopener" href="${attr(wa(p.phone, `Namaste ${p.clientName} 🙏 Track your BFI invitation here (private link): ${clientLink(p)}`))}" aria-label="Send on WhatsApp">${icon("message", "icon sm")}</a></span></div>
      </div>
      <form class="card form" data-form="pAssign" data-id="${p.id}">
        <h3>Assignment</h3>
        ${field("Designer", select("designerId", [["", "— unassigned —"], ...staff(["designer", "freelancer"])], p.designerId))}
        ${field("QA reviewer", select("qaId", [["", "— unassigned —"], ...staff(["qa", "admin"])], p.qaId))}
        ${field("Affiliate / vendor", select("affiliateId", partners, p.affiliateId || ""))}
        <div class="cols">${field("Due date", input("dueDate", p.dueDate, "date"))}${field("Template", select("templateId", db.templates.filter((t) => t.status === "active" || t.id === p.templateId).map((t) => [t.id, t.name]), p.templateId))}</div>
        <div><button class="btn primary">Save assignment</button></div>
      </form>
      <form class="card form" data-form="pOverride" data-id="${p.id}">
        <h3>Exceptions</h3>
        <p class="small muted" style="margin:0">Override the revision limit for rush orders or goodwill. Every change is in the audit log.</p>
        <div class="cols">${field("Extra revision rounds", input("extraRevisions", p.extraRevisions || 0, "number", 'min="0" max="20"'))}
        ${field("Rush order", select("rush", [["no", "No"], ["yes", "Yes"]], p.rush ? "yes" : "no"))}</div>
        ${field("Reason", input("overrideNote", p.overrideNote || "", "text", 'placeholder="e.g. goodwill — our spelling error"'))}
        <div><button class="btn">Save exception</button></div>
      </form>
      ${p.status === "active" ? `<div class="row"><button class="btn danger sm" data-act="pCancel" data-id="${p.id}">${icon("x", "icon sm")} Cancel & refund</button>
        <button class="btn sm" data-act="pComplaint" data-id="${p.id}">${icon("alert", "icon sm")} Log complaint (${p.complaints || 0})</button></div>` : ""}
    </div>
  </div>`;
}

// Design workspace: preview, versions, revision log.
function designTab(p, user) {
  const latest = p.previews.at(-1);
  const canPush = ["admin", "designer", "freelancer"].includes(user.role);
  const tpl = byId("templates", p.templateId);
  return `
  <div class="two side">
    <div class="card stack">
      <div class="row between"><h3>${latest ? "Live preview" : "Template"}</h3>${latest ? `<a class="btn sm" href="${attr(latest.url)}" target="_blank" rel="noopener">${icon("eye", "icon sm")} Open</a>` : badge(tpl?.name || "", "gold")}</div>
      ${latest ? `<div class="preview-frame"><iframe src="${attr(latest.url)}" title="Preview" loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups"></iframe></div>`
        : `<div class="tpl" style="max-width:360px;margin:0 auto;width:100%"><div class="art">${templateArt(tpl, "Wedding Invitation")}</div></div>`}
    </div>
    <div class="stack">
      <div class="card stack">
        <h3>Versions</h3>
        ${p.previews.length ? `<div class="list">${p.previews.slice().reverse().map((v, i) => `<a class="item" href="${attr(v.url)}" target="_blank" rel="noopener"><span class="dot" style="color:var(--${i === 0 ? "primary" : "line-2"})"></span><div class="grow"><div class="item-t">Version ${p.previews.length - i}</div><div class="item-s">${C.date(v.at)} · ${esc(v.note || "")}</div></div>${icon("link", "icon sm")}</a>`).join("")}</div>` : `<p class="small muted" style="margin:0">No versions yet.</p>`}
        ${canPush ? `<form class="form" data-form="pPreview" data-id="${p.id}">
          ${field("Preview link", input("url", "", "url", 'required placeholder="https://…"'))}
          ${field("What changed", input("note", "", "text", 'placeholder="e.g. Round 1 changes done"'))}
          <button class="btn primary block">${icon("link", "icon sm")} Create preview link</button>
          <p class="tiny muted" style="margin:0">Use an unlisted link with a long random path. The client sees it in their portal.</p>
        </form>` : ""}
      </div>
      <div class="card stack">
        <div class="row between"><h3>Revision log</h3><span class="small muted">${esc(C.limitLabel(p))}</span></div>
        ${p.revisions.length ? p.revisions.slice().reverse().map((r) => `
          <details class="card flat tight" ${r.status !== "resolved" ? "open" : ""}>
            <summary class="row between" style="cursor:pointer;list-style:none"><span><b class="small">Round ${r.round} · ${esc(r.summary || "Changes")}</b><br><span class="tiny muted">${C.date(r.at)}</span></span>${badge(r.status === "resolved" ? "Resolved" : "Pending", r.status === "resolved" ? "ok" : "bad")}</summary>
            <div style="margin-top:8px">${r.items.map((it, i) => `<label class="check"><input type="checkbox" data-change="pRevItem" data-pid="${p.id}" data-rid="${r.id}" data-i="${i}" ${it.done ? "checked" : ""} ${user.role === "qa" ? "disabled" : ""}><span class="small ${it.done ? "muted" : ""}" style="${it.done ? "text-decoration:line-through" : ""}">${esc(it.text)}${it.where ? ` <span class="badge line">${esc(it.where)}</span>` : ""}</span></label>`).join("")}</div>
          </details>`).join("") : `<p class="small muted" style="margin:0">Client revision requests arrive here as a checklist, one round per request.</p>`}
      </div>
    </div>
  </div>`;
}

function brief(p) {
  const i = p.intake || {};
  const rows = [["Bride", i.brideName], ["Groom", i.groomName], ["Bride's family", i.brideParents], ["Groom's family", i.groomParents], ["Grandparents / blessings", i.grandparents], ["Language", i.language], ["Opening line", i.wording], ["RSVP by", i.rsvpBy && C.date(i.rsvpBy)], ["RSVP contact", i.rsvpPhone], ["Anything else", i.notes]].filter((r) => r[1]);
  return `
  <div class="two even">
    <div class="card"><div class="card-head"><h3>Intake form</h3>${i.submittedAt ? badge("Submitted " + C.shortDate(i.submittedAt), "ok") : badge("Not submitted", "warn")}</div>
      ${rows.length ? `<div class="list">${rows.map(([l, v]) => `<div class="item"><div class="grow"><div class="item-s">${esc(l)}</div><div>${esc(v)}</div></div></div>`).join("")}</div>` : empty("Waiting for the client", "They fill this in from their private link.", "clock")}
    </div>
    <div class="card"><h3 style="margin-bottom:10px">Events</h3>
      ${rtable([{ label: "Function" }, { label: "Date" }, { label: "Time" }, { label: "Venue" }], (i.events || []).map((e) => [`<span class="t">${esc(e.name)}</span>`, C.date(e.date), esc(e.time || ""), esc(e.venue || "")]), { empty: "No events yet" })}
    </div>
  </div>`;
}

function notesTab(p, user) {
  return `
  <div class="stack" style="max-width:760px">
    <div class="callout">${icon("lock")}<div>Internal only: clients never see these notes. Use Messages to talk to the client.</div></div>
    <div class="thread">${p.notes.map((n) => `<div class="msg ${n.byId === user.id ? "mine" : ""}"><div class="h">${esc(n.byId ? userName(n.byId) : "Client portal")} · ${C.ago(n.at)}${n.tag ? ` · ${badge(n.tag, "gold")}` : ""}</div>${esc(n.text)}</div>`).join("") || `<p class="muted">No notes yet.</p>`}</div>
    <form class="form card" data-form="pNote" data-id="${p.id}">
      ${field("Note to admin / QA", textarea("text", "", 'required placeholder="Blockers, missing info, scope questions…"'))}
      <div class="row">${select("tag", [["", "General"], ["Blocker", "Blocker"], ["Missing info", "Missing info"], ["Scope question", "Scope question"]], "", 'style="width:auto"')}<button class="btn primary">Post note</button></div>
    </form>
  </div>`;
}

export function handoverTab(p, user) {
  const canQA = ["qa", "admin"].includes(user.role);
  return `
  <div class="two even">
    <div class="card stack">
      <div><h3>Handover checklist</h3><p class="small muted" style="margin:2px 0 0">Prepare for QA and client delivery.</p></div>
      <div class="list">${HANDOVER.map(([k, l]) => {
        const auto = (k === "approved" && (!!p.designApprovedAt || p.stage >= 5)) || (k === "preview" && p.previews.length > 0);
        return `<label class="check item" style="padding:10px 2px"><input type="checkbox" data-change="pHand" data-id="${p.id}" data-k="${k}" ${handoverDone(p, k) ? "checked" : ""} ${user.role === "qa" || auto ? "disabled" : ""}><span class="grow">${esc(l)}${auto ? ` <span class="tiny muted">· automatic</span>` : ""}</span></label>`;
      }).join("")}</div>
      ${user.role !== "qa" ? `<button class="btn primary block" data-act="pReadyQA" data-id="${p.id}" ${handoverReady(p) && p.stage < 5 ? "" : "disabled"}>Mark ready for QA</button>
      ${p.stage >= 5 ? `<p class="small muted" style="margin:0">Already handed to QA.</p>` : !handoverReady(p) ? `<p class="small muted" style="margin:0">Tick every item to continue.</p>` : ""}` : ""}
    </div>
    <div class="card stack">
      <div class="card-head" style="margin:0"><h3>QA review</h3>${badge(p.qa.status === "pass" ? "Passed" : p.qa.status === "fail" ? "Sent back" : "Pending", p.qa.status === "pass" ? "ok" : p.qa.status === "fail" ? "bad" : "warn")}</div>
      ${canQA ? `<form class="form" data-form="pQA" data-id="${p.id}">
        ${field("Defects found in this review", input("defects", 0, "number", 'min="0"'), `${p.qa.defects || 0} so far`)}
        ${field("Notes for the designer", textarea("notes", p.qa.notes || ""))}
        <div class="row"><button class="btn primary" data-act="pQAVerdict" data-v="pass" data-id="${p.id}" ${p.stage === 5 ? "" : "disabled"}>${icon("check", "icon sm")} Pass</button>
        <button class="btn danger" data-act="pQAVerdict" data-v="fail" data-id="${p.id}" ${p.stage === 5 ? "" : "disabled"}>${icon("x", "icon sm")} Send back</button></div>
        ${p.stage !== 5 ? `<p class="tiny muted" style="margin:0">Opens when the project reaches Quality check.</p>` : ""}
      </form>` : `<p class="small" style="margin:0">${esc(p.qa.notes || "No QA notes yet.")}</p>`}
    </div>
  </div>`;
}

function moneyTab(p) {
  const m = C.margin(p);
  return `
  <div class="two">
    <div class="stack">
      <div class="grid kpi">${["Price", "Paid", "Balance", "Refunded"].map((l, i) => `<div class="card kpi-card"><div class="kpi-l">${l}</div><div class="kpi-v">${C.money([p.price, C.paid(p), C.balance(p), C.refunded(p)][i])}</div></div>`).join("")}</div>
      <div class="card pad0"><div class="card-head" style="padding:16px 18px 0"><h3>Payments</h3><button class="btn sm" data-act="pInvoice" data-id="${p.id}">${icon("file", "icon sm")} Generate invoice</button></div>
        ${rtable([{ label: "Date" }, { label: "Method" }, { label: "Reference" }, { label: "Amount", cls: "num" }], p.payments.map((x) => [C.date(x.at), esc(x.method), esc(x.ref || "—"), `<b>${C.money(x.amount)}</b>`]), { empty: "No payments yet." })}
        ${p.invoices.length ? `<div class="small muted" style="padding:0 18px 14px">Invoices: ${p.invoices.map((i) => `<a href="#/invoice/${p.id}/${encodeURIComponent(i.no)}">${esc(i.no)}</a>`).join(", ")}</div>` : ""}
      </div>
      <form class="card form" data-form="pPay" data-id="${p.id}">
        <h3>Record a payment</h3>
        <div class="cols">${field("Amount (₹)", input("amount", C.balance(p) || "", "number", 'required min="1"'))}${field("Method", select("method", ["UPI", "Bank transfer", "Card", "Cash", "Payment link"]))}${field("Reference", input("ref"))}${field("Date", input("date", C.today(), "date"))}</div>
        <div><button class="btn primary">Save payment</button></div>
      </form>
    </div>
    <form class="card form" data-form="pCosts" data-id="${p.id}">
      <h3>Order margin</h3>
      <div class="list small">
        ${[["Revenue (net of refunds)", m.revenue], ["Design hours × rate", -m.labour], ["Hosting", -m.hosting], ["Payment fees", -m.fees], ["Affiliate commission", -m.commission], ["Revision cost", -m.revisions], ["Other", -m.other]].map(([l, v]) => `<div class="item"><div class="grow">${l}</div><b class="num">${C.money(v)}</b></div>`).join("")}
        <div class="item"><div class="grow"><b>Contribution margin</b></div><b class="num" style="color:var(--${m.contribution >= 0 ? "ok" : "bad"})">${C.money(m.contribution)} · ${C.pct(m.pct)}</b></div>
      </div>
      <div class="cols">${field("Design hours", input("hours", p.costs?.hours || 0, "number", 'min="0" step="0.5"'))}${field("Hosting ₹", input("hosting", p.costs?.hosting || 0, "number", 'min="0"'))}${field("Other ₹", input("other", p.costs?.other || 0, "number", 'min="0"'))}</div>
      <div><button class="btn">Update costs</button></div>
    </form>
  </div>`;
}

function deliveryTab(p, user) {
  return `
  <div class="two even">
    <div class="card stack">
      <h3>Final approval</h3>
      ${p.approval ? `<div class="callout ok">${icon("checkCircle")}<div>Approved by <b>${esc(p.approval.name)}</b> on ${C.date(p.approval.at)}.</div></div>` : `<div class="callout">${icon("lock")}<div>No publication before the client's final content approval. The client signs off from their portal.</div></div>`}
      ${p.delivery ? `<b class="small">Live link</b><div class="copy"><code>${esc(p.delivery.liveUrl)}</code><button class="btn sm" data-act="copy" data-text="${attr(p.delivery.liveUrl)}">${icon("copy", "icon sm")}</button></div>
        <div class="small muted">Published ${C.date(p.delivery.publishedAt)}${p.delivery.htmlFileId ? " · HTML package attached" : ""}</div>` : ""}
    </div>
    ${["admin", "designer"].includes(user.role) ? `<form class="card form" data-form="pDeliver" data-id="${p.id}">
      <h3>${p.delivery ? "Update delivery" : "Publish & deliver"}</h3>
      ${field("Live invitation URL", input("liveUrl", p.delivery?.liveUrl || "", "url", "required"))}
      ${field("Downloadable HTML package", `<input type="file" name="html" accept=".zip,.html,text/html,application/zip">`, "optional")}
      <div><button class="btn primary" ${p.approval ? "" : "disabled"}>${icon("send", "icon sm")} Publish</button></div>
      ${!p.approval ? `<p class="tiny muted" style="margin:0">Unlocks after client approval.</p>` : C.balance(p) > 0 ? `<p class="tiny" style="color:var(--warn);margin:0">Balance of ${C.money(C.balance(p))} is still due.</p>` : ""}
    </form>` : ""}
  </div>`;
}

function consentTab(p) {
  const c = p.consent || {};
  return `
  <form class="card form" style="max-width:640px" data-form="pConsent" data-id="${p.id}">
    <h3>Consent record</h3>
    <p class="small muted" style="margin:0">What the client agreed we may use publicly. Customer content stays out of marketing until consent is logged here.</p>
    ${checkbox("photos", c.photos, "Photos may be used in marketing")}
    ${checkbox("names", c.names, "Names may be shown")}
    ${checkbox("testimonial", c.testimonial, "Testimonial may be published")}
    ${checkbox("showcase", c.showcase, "Project may be showcased (portfolio, Reels)")}
    ${field("How consent was given", select("method", ["Client portal toggle", "WhatsApp message", "Email", "Signed form", "Verbal (recorded)"], c.method || "Client portal toggle"))}
    <div class="small muted">${c.at ? `Last updated ${C.date(c.at)}` : "Never recorded"}</div>
    <div><button class="btn primary">Save consent</button></div>
  </form>`;
}

// ── actions ─────────────────────────────
const P = (id) => byId("projects", id);
act({
  pStage: (el) => {
    const p = P(el.dataset.id); const s = Number(el.dataset.stage);
    if (s < 0 || s > 7) return;
    if (s === 7 && !p.approval) { toast("Needs the client's final approval first"); return; }
    C.setStage(p, s);
    commit("Moved stage", p.code, C.stageName(s));
  },
  pAssign: (d, f) => {
    const p = P(f.dataset.id);
    Object.assign(p, { designerId: d.designerId || null, qaId: d.qaId || null, affiliateId: d.affiliateId || null, dueDate: d.dueDate, templateId: d.templateId });
    commit("Assigned", p.code, `Designer ${userName(p.designerId)}, QA ${userName(p.qaId)}, partner ${userName(p.affiliateId)}`);
    toast("Saved");
  },
  pOverride: (d, f) => {
    const p = P(f.dataset.id);
    const wasRush = p.rush;
    p.extraRevisions = Math.max(0, Number(d.extraRevisions) || 0);
    p.rush = d.rush === "yes";
    p.overrideNote = d.overrideNote;
    if (p.rush && !wasRush && !p.rushFeeAdded) { p.price += Math.round(C.S().tiers[p.tier].price * C.S().rushFee / 100); p.rushFeeAdded = true; }
    commit("Exception", p.code, `+${p.extraRevisions} rounds, rush ${p.rush ? "yes" : "no"} — ${d.overrideNote}`);
    toast("Exception saved");
  },
  pRemind: (el) => {
    const p = P(el.dataset.id);
    const missing = C.checklist(p).filter((c) => !c.done).map((c) => c.label.toLowerCase()).join(", ");
    window.open(wa(p.phone, `Namaste ${p.clientName} 🙏 To start your invitation we still need: ${missing}. You can add everything here: ${clientLink(p)}`), "_blank");
    p.lastReminder = now();
    commit("Sent reminder", p.code, missing);
  },
  pUpload: async (d, f) => {
    const p = P(f.dataset.pid);
    const n = await addAssets(p, d, currentUser()?.name || "Team");
    if (!n) { toast("Choose a file or paste a link"); return; }
    commit("Uploaded", p.code, `${n} reference(s)`);
    toast(`${n} added`);
  },
  pAssetDel: (el) => {
    const p = P(el.dataset.pid);
    p.assets = p.assets.filter((a) => a.id !== el.dataset.id);
    commit("Removed reference", p.code);
  },
  pPreview: (d, f) => {
    const p = P(f.dataset.id);
    p.previews.push({ id: uid("pv"), url: d.url, note: d.note, at: now(), by: currentUser().id, round: p.revisions.length });
    if (p.stage < 4) C.setStage(p, 4);
    commit("Pushed preview", p.code, d.url);
    toast("Preview shared — the client can view it now");
  },
  pRevItem: (el) => {
    const p = P(el.dataset.pid);
    const r = p.revisions.find((x) => x.id === el.dataset.rid);
    r.items[Number(el.dataset.i)].done = el.checked;
    r.status = r.items.every((x) => x.done) ? "resolved" : "open";
    commit(el.checked ? "Resolved item" : "Reopened item", p.code, r.items[Number(el.dataset.i)].text);
  },
  pNote: (d, f) => {
    const p = P(f.dataset.id);
    p.notes.push({ id: uid("n"), at: now(), byId: currentUser().id, text: d.text, tag: d.tag });
    commit("Internal note", p.code, d.tag || "");
  },
  pHand: (el) => {
    const p = P(el.dataset.id);
    p.handover = { ...p.handover, [el.dataset.k]: el.checked };
    commit("Handover checklist", p.code, `${el.dataset.k}: ${el.checked}`);
  },
  pReadyQA: (el) => {
    const p = P(el.dataset.id);
    C.setStage(p, 5);
    p.qa = { ...p.qa, status: "pending" };
    commit("Ready for QA", p.code);
    toast("Sent to QA");
  },
  pQAVerdict: (el) => {
    const p = P(el.dataset.id);
    const form = el.closest("form");
    const defects = Number(form.defects.value) || 0;
    const notes = form.notes.value.trim();
    p.qa = { status: el.dataset.v, notes, defects: (Number(p.qa.defects) || 0) + defects, at: now(), by: currentUser().id };
    if (el.dataset.v === "pass") C.setStage(p, 6);
    else { p.qaFailed = (p.qaFailed || 0) + 1; C.setStage(p, 3); p.notes.push({ id: uid("n"), at: now(), byId: currentUser().id, text: `QA sent back: ${notes}`, tag: "Blocker" }); }
    commit(el.dataset.v === "pass" ? "QA passed" : "QA failed", p.code, notes);
    toast(el.dataset.v === "pass" ? "QA passed — waiting on client sign-off" : "Sent back to the designer");
  },
  pPay: (d, f) => {
    const p = P(f.dataset.id);
    p.payments.push({ id: uid("pay"), at: new Date(d.date + "T12:00:00").toISOString(), amount: Number(d.amount), method: d.method, ref: d.ref });
    p.notes.forEach((n) => { if (n.tag === "Payment claimed") n.done = true; });
    C.ensureCommission(p);
    commit("Payment", p.code, `${C.money(d.amount)} ${d.method}`);
    toast("Payment recorded");
  },
  pCosts: (d, f) => {
    const p = P(f.dataset.id);
    p.costs = { hours: Number(d.hours) || 0, hosting: Number(d.hosting) || 0, other: Number(d.other) || 0 };
    commit("Updated costs", p.code);
  },
  pInvoice: (el) => {
    const p = P(el.dataset.id);
    db.counters.invoice++;
    const no = `BFI/${new Date().getFullYear()}/${String(db.counters.invoice).padStart(3, "0")}`;
    p.invoices.push({ no, at: now(), amount: p.price });
    commit("Invoice", p.code, no);
    go(`/invoice/${p.id}/${encodeURIComponent(no)}`);
  },
  pDeliver: async (d, f) => {
    const p = P(f.dataset.id);
    if (!p.approval) { toast("Client approval is required before publishing"); return; }
    const htmlFileId = d.html?.[0] ? await putFile(d.html[0]) : p.delivery?.htmlFileId || null;
    p.delivery = { liveUrl: d.liveUrl, htmlFileId, htmlName: d.html?.[0]?.name || p.delivery?.htmlName, publishedAt: p.delivery?.publishedAt || now() };
    C.setStage(p, 7);
    p.testimonialRequest = p.testimonialRequest || { sentAt: now(), respondedAt: null };
    // Past-client referral code, shown in the client's portal after delivery.
    p.refCode = p.refCode || `${(p.brideName || p.clientName).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6)}${p.code.replace(/\D/g, "").slice(-3)}`;
    commit("Delivered", p.code, d.liveUrl);
    toast("Delivered — testimonial request queued");
  },
  pConsent: (d, f) => {
    const p = P(f.dataset.id);
    p.consent = { photos: d.photos, names: d.names, testimonial: d.testimonial, showcase: d.showcase, method: d.method, at: now() };
    commit("Consent", p.code, Object.entries(p.consent).filter(([, v]) => v === true).map(([k]) => k).join(", ") || "none");
    toast("Consent saved");
  },
  pComplaint: (el) => {
    const p = P(el.dataset.id);
    p.complaints = (p.complaints || 0) + 1;
    commit("Complaint logged", p.code);
  },
  pCancel: (el) => {
    const p = P(el.dataset.id);
    const pctR = C.S().policy.refundPct[p.stage] ?? 0;
    const suggested = Math.round(C.paid(p) * pctR / 100);
    sheet("Cancel & refund", `
      <form class="form" data-form="pCancelGo" data-id="${p.id}">
        <div class="callout">${icon("info")}<div><b>Policy:</b> ${esc(C.S().policy.text)}</div></div>
        <p class="small">Stage <b>${esc(C.stageName(p.stage))}</b> → policy refund <b>${pctR}%</b> of ${C.money(C.paid(p))} paid = <b>${C.money(suggested)}</b>.</p>
        ${field("Refund amount (₹)", input("amount", suggested, "number", 'min="0"'))}
        ${field("Reason", input("reason", "", "text", "required"))}
        <button class="btn danger">Cancel project</button>
      </form>`);
  },
  pCancelGo: (d, f) => {
    const p = P(f.dataset.id);
    if (Number(d.amount) > 0) p.refunds.push({ id: uid("rf"), at: now(), amount: Number(d.amount), reason: d.reason });
    p.status = "cancelled"; p.cancelledAt = now(); p.cancelReason = d.reason;
    closeSheet();
    commit("Cancelled", p.code, `${d.reason}; refund ${C.money(d.amount)}`);
  },
  msgSend: (d, f) => {
    const p = P(f.dataset.pid);
    const side = f.dataset.side;
    const from = side === "client" ? "client" : currentUser().id;
    p.messages = p.messages || [];
    p.messages.push({ id: uid("msg"), thread: f.dataset.thread, from, text: d.text, at: now() });
    markSeen(p, f.dataset.thread, side);
    commit("Message", p.code, `${C.THREADS[f.dataset.thread]} · ${side}`);
  },
});
