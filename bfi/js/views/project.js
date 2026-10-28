// One project workspace, shown to admin, designers, QA and freelancers.
// Tabs are filtered by role: designers never see pricing or payments.

import { db, commit, byId, uid, now, userName, putFile, fileUrl, currentUser } from "../db.js";
import { STAGES, PURPOSES } from "../seed.js";
import { icon } from "../icons.js";
import { esc, attr, act, sheet, closeSheet, toast, badge, empty, field, input, textarea, select, checkbox, tabs, timeline, stageBar, each, wa, avatar, fileKind, kindIcon, go } from "../ui.js";
import * as C from "../calc.js";

export const clientLink = (p) => `${location.origin}${location.pathname}#/c/${p.token}`;
export const coupleName = (p) => (p.brideName && p.groomName ? `${p.brideName} & ${p.groomName}` : p.clientName);

const HANDOVER = [
  ["content", "All names, dates and times match the intake form"],
  ["spelling", "Spelling checked in every language used"],
  ["links", "Maps, calls and WhatsApp links work"],
  ["rsvp", "RSVP flow tested end to end"],
  ["mobile", "Checked on a small phone and a desktop"],
  ["privacy", "No private photos on a guessable public URL"],
];

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
  if (!p.assets.length) return empty("No references yet", "Photos, videos, voice notes, PDFs and links appear here.", "image");
  const groups = Object.entries(PURPOSES).map(([k, l]) => [k, l, p.assets.filter((a) => a.purpose === k)]).filter((g) => g[2].length);
  return groups.map(([k, l, list]) => `
    <div class="stack" style="gap:8px"><div class="row between"><b>${esc(l)}</b><span class="badge">${list.length}</span></div>
    <div class="tiles">${list.map((a) => `
      <div class="tile">
        <a class="th" ${a.url ? `href="${attr(a.url)}" target="_blank" rel="noopener"` : `data-file="${a.fileId}" data-kind="${a.kind}"`}>${icon(kindIcon[a.kind] || "file", "icon lg")}</a>
        <div class="meta"><b title="${attr(a.name)}">${esc(a.name)}</b>
          ${a.note ? `<span class="muted">${esc(a.note)}</span>` : ""}
          <span class="muted tiny">${esc(a.by || "")} · ${C.ago(a.at)}</span>
          ${canDelete ? `<button class="btn sm ghost danger" data-act="pAssetDel" data-pid="${p.id}" data-id="${a.id}">${icon("trash", "icon sm")}</button>` : ""}
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

export const uploadForm = (p, formName = "pUpload") => `
  <form class="form card flat" data-form="${formName}" data-pid="${p.id}">
    <div class="cols">
      ${field("What is it for?", select("purpose", Object.entries(PURPOSES), "couple"))}
      ${field("Files", `<input type="file" name="files" multiple accept="image/*,video/*,audio/*,application/pdf">`, "photos, videos, voice notes, PDFs")}
    </div>
    ${field("Or paste a link", input("link", "", "url", 'placeholder="Pinterest, Instagram, Drive…"'))}
    ${field("Note (optional)", input("note", "", "text", 'placeholder="e.g. use this one for the cover"'))}
    <button class="btn primary">${icon("upload", "icon sm")} Add</button>
  </form>`;

// ── view ────────────────────────────────
export function projectView(p, user, tab, base) {
  const role = user.role;
  const isAdmin = role === "admin";
  const all = [
    ["overview", "Overview"], ["brief", "Brief"], ["refs", `References (${p.assets.length})`], ["preview", "Preview"],
    ["revisions", `Revisions (${p.revisions.length})`], ["notes", `Notes (${p.notes.length})`], ["handover", role === "qa" ? "QA check" : "Handover & QA"],
    ["money", "Payments"], ["delivery", "Delivery"], ["consent", "Consent"],
  ];
  const T = isAdmin ? all : all.filter(([k]) => !["money", "consent"].includes(k));
  if (!T.some(([k]) => k === tab)) tab = "overview";
  const h = C.health(p);
  const body = {
    overview: () => overview(p, user),
    brief: () => brief(p),
    refs: () => `<div class="stack lg">${uploadForm(p)}${assetTiles(p, { canDelete: isAdmin })}</div>`,
    preview: () => previewTab(p, user),
    revisions: () => revisionsTab(p, user),
    notes: () => notesTab(p, user),
    handover: () => handoverTab(p, user),
    money: () => moneyTab(p),
    delivery: () => deliveryTab(p, user),
    consent: () => consentTab(p),
  }[tab]();

  return {
    title: coupleName(p),
    eyebrow: `${p.code} · ${C.S().tiers[p.tier]?.name || ""}`,
    back: isAdmin ? "#/projects" : "#/work",
    actions: `<span class="badge ${h.tone} hide-m">${esc(h.label)}</span>`,
    html: `
      <div class="stack" style="margin-bottom:12px">
        <div class="row between"><span class="small"><b>${esc(C.stageName(p.stage))}</b> · stage ${p.stage + 1} of 8</span><span class="badge ${h.tone}">${esc(h.label)}</span></div>
        ${stageBar(p.stage, p.status === "cancelled")}
      </div>
      ${tabs(T, tab, `${base}/${p.id}`)}
      ${body}`,
    after: hydrateFiles,
  };
}

function overview(p, user) {
  const isAdmin = user.role === "admin";
  const cl = C.checklist(p);
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
            <button class="btn sm" data-act="pStage" data-id="${p.id}" data-stage="${p.stage - 1}" ${p.stage === 0 ? "disabled" : ""}>${icon("arrowLeft", "icon sm")}</button>
            <button class="btn sm primary" data-act="pStage" data-id="${p.id}" data-stage="${p.stage + 1}" ${p.stage === 7 || (!isAdmin && p.stage >= 3) ? "disabled" : ""}>Next ${icon("arrowRight", "icon sm")}</button>
          </div>` : ""}
        </div>
        ${timeline(p.stage)}
        <p class="small muted">In this stage for ${C.stageAge(p)} day(s) · SLA ${C.S().slaDays[p.stage] || "—"} day(s)</p>
      </div>
      <div class="card">
        <div class="card-head"><h3>Client details</h3><span class="badge ${C.checklistDone(p) === cl.length ? "ok" : "warn"}">${C.checklistDone(p)}/${cl.length} received</span></div>
        <div class="list">${cl.map((c) => `<div class="item">${icon(c.done ? "checkCircle" : "clock", "icon sm")}<div class="grow ${c.done ? "" : "muted"}">${esc(c.label)}</div>${c.done ? "" : badge("Missing", "warn")}</div>`).join("")}</div>
        ${cl.some((c) => !c.done) ? `<button class="btn sm" style="margin-top:10px" data-act="pRemind" data-id="${p.id}">${icon("message", "icon sm")} Send reminder on WhatsApp</button>` : ""}
      </div>
    </div>
    <div class="stack">
      <div class="card stack">
        <div class="row between"><b>Wedding</b><span>${C.date(p.weddingDate)}</span></div>
        <div class="row between"><b>Due</b><span class="${d < 0 && p.status === "active" ? "badge bad" : ""}">${C.date(p.dueDate)}</span></div>
        <div class="row between"><b>Revisions</b><span>${esc(C.limitLabel(p))}${p.rush ? " · " + badge("Rush", "maroon") : ""}</span></div>
        <div class="row between"><b>Template</b><span>${esc(byId("templates", p.templateId)?.name || "—")}</span></div>
        ${isAdmin ? `<div class="row between"><b>Price</b><span>${C.money(p.price)} · ${badge(C.payStatus(p).label, C.payStatus(p).tone)}</span></div>` : ""}
        <div class="row between"><b>Client link</b><span class="row"><button class="btn sm" data-act="copy" data-text="${attr(clientLink(p))}" data-label="Client link copied">${icon("copy", "icon sm")} Copy</button>
          <a class="btn sm" target="_blank" rel="noopener" href="${attr(wa(p.phone, `Namaste ${p.clientName} 🙏 Track your BFI invitation here (private link): ${clientLink(p)}`))}">${icon("message", "icon sm")}</a></span></div>
      </div>
      ${isAdmin ? `
      <form class="card form" data-form="pAssign" data-id="${p.id}">
        <h3>Assignment</h3>
        ${field("Designer", select("designerId", [["", "— unassigned —"], ...staff(["designer", "freelancer"])], p.designerId))}
        ${field("QA reviewer", select("qaId", [["", "— unassigned —"], ...staff(["qa", "admin"])], p.qaId))}
        ${field("Affiliate / vendor", select("affiliateId", partners, p.affiliateId || ""))}
        <div class="cols">${field("Due date", input("dueDate", p.dueDate, "date"))}${field("Template", select("templateId", db.templates.filter((t) => t.status === "active" || t.id === p.templateId).map((t) => [t.id, t.name]), p.templateId))}</div>
        <button class="btn primary">Save assignment</button>
      </form>
      <form class="card form" data-form="pOverride" data-id="${p.id}">
        <h3>Exceptions</h3>
        <p class="small muted">Override the revision limit for rush orders or goodwill. Every change is in the audit log.</p>
        <div class="cols">${field("Extra revision rounds", input("extraRevisions", p.extraRevisions || 0, "number", 'min="0" max="20"'))}
        ${field("Rush order", select("rush", [["no", "No"], ["yes", "Yes"]], p.rush ? "yes" : "no"))}</div>
        ${field("Reason", input("overrideNote", p.overrideNote || "", "text", 'placeholder="e.g. goodwill — our spelling error"'))}
        <button class="btn">Save exception</button>
      </form>
      ${p.status === "active" ? `<div class="row"><button class="btn danger sm" data-act="pCancel" data-id="${p.id}">${icon("x", "icon sm")} Cancel & refund</button>
        <button class="btn sm" data-act="pComplaint" data-id="${p.id}">${icon("alert", "icon sm")} Log complaint (${p.complaints || 0})</button></div>` : ""}` : `
      <div class="card stack"><h3>Team</h3>
        <div class="row">${avatar(userName(p.designerId))}<div><b>${esc(userName(p.designerId))}</b><div class="small muted">Designer</div></div></div>
        <div class="row">${avatar(userName(p.qaId))}<div><b>${esc(userName(p.qaId))}</b><div class="small muted">QA reviewer</div></div></div>
      </div>`}
    </div>
  </div>`;
}

function brief(p) {
  const i = p.intake || {};
  const row = (l, v) => (v ? `<div class="item"><div class="grow"><div class="item-s">${esc(l)}</div><div>${esc(v)}</div></div></div>` : "");
  return `
  <div class="two">
    <div class="card"><div class="card-head"><h3>Intake form</h3>${i.submittedAt ? badge("Submitted " + C.shortDate(i.submittedAt), "ok") : badge("Not submitted", "warn")}</div>
      <div class="list">
        ${row("Bride", i.brideName)}${row("Groom", i.groomName)}${row("Bride's family", i.brideParents)}${row("Groom's family", i.groomParents)}
        ${row("Grandparents / blessings", i.grandparents)}${row("Language", i.language)}${row("Preferred wording", i.wording)}
        ${row("RSVP by", i.rsvpBy && C.date(i.rsvpBy))}${row("RSVP contact", i.rsvpPhone)}${row("Anything else", i.notes)}
      </div>
      ${!i.submittedAt && !i.brideName ? empty("Waiting for the client", "They fill this in from their private link.") : ""}
    </div>
    <div class="card"><h3>Events</h3>
      ${(i.events || []).length ? `<div class="list">${i.events.map((e) => `<div class="item">${icon("calendar")}<div class="grow"><div class="item-t">${esc(e.name)}</div><div class="item-s">${C.date(e.date)} ${esc(e.time || "")} · ${esc(e.venue || "")}${e.dress ? " · " + esc(e.dress) : ""}</div></div></div>`).join("")}</div>` : empty("No events yet")}
    </div>
  </div>`;
}

function previewTab(p, user) {
  const latest = p.previews[p.previews.length - 1];
  const canPush = ["admin", "designer", "freelancer"].includes(user.role);
  return `
  <div class="two">
    <div class="stack">
      ${latest ? `<div class="preview-frame"><iframe src="${attr(latest.url)}" title="Preview" loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups"></iframe></div>
        <a class="btn block" href="${attr(latest.url)}" target="_blank" rel="noopener">${icon("eye", "icon sm")} Open full screen</a>` : empty("No preview yet", "Push a working preview link — the client sees it in their portal.", "eye")}
    </div>
    <div class="stack">
      ${canPush ? `<form class="card form" data-form="pPreview" data-id="${p.id}">
        <h3>Push a preview</h3>
        ${field("Preview link", input("url", "", "url", 'required placeholder="https://…"'))}
        ${field("What changed", input("note", "", "text", 'placeholder="e.g. Round 1 changes done"'))}
        <button class="btn primary">${icon("send", "icon sm")} Share with client</button>
        <p class="tiny muted">Use an unlisted link with a long random path — never a guessable public URL.</p>
      </form>` : ""}
      <div class="card"><h3>History</h3><div class="list">${p.previews.slice().reverse().map((v) => `<a class="item" href="${attr(v.url)}" target="_blank" rel="noopener">${icon("link")}<div class="grow"><div class="item-t">${esc(v.note || "Preview")}</div><div class="item-s">${esc(userName(v.by))} · ${C.ago(v.at)}</div></div></a>`).join("") || `<p class="muted small">Nothing yet.</p>`}</div></div>
    </div>
  </div>`;
}

function revisionsTab(p, user) {
  const lim = C.revisionLimit(p);
  return `
  <div class="stack">
    <div class="card row between"><div><b>Revision allowance</b><div class="small muted">${esc(C.limitLabel(p))}${p.extraRevisions ? ` · includes ${p.extraRevisions} extra (${esc(p.overrideNote || "override")})` : ""}</div></div>
      ${lim !== Infinity ? `<div class="meter">${Array.from({ length: lim }, (_, i) => `<span class="${i < p.revisions.length ? "used" : ""}">${i + 1}</span>`).join("")}</div>` : badge("Unlimited", "gold")}
    </div>
    ${p.revisions.slice().reverse().map((r) => `
      <div class="card">
        <div class="card-head"><div><div class="eyebrow">Round ${r.round}</div><h4>${esc(r.summary || "Revision request")}</h4><div class="small muted">${C.date(r.at)}${r.comments ? ` · ${r.comments.length} comment(s) on preview` : ""}</div></div>
          ${badge(r.status === "resolved" ? "Resolved" : `${r.items.filter((x) => x.done).length}/${r.items.length} done`, r.status === "resolved" ? "ok" : "warn")}</div>
        <div class="list">${r.items.map((it, i) => `<label class="check"><input type="checkbox" data-change="pRevItem" data-pid="${p.id}" data-rid="${r.id}" data-i="${i}" ${it.done ? "checked" : ""} ${user.role === "qa" ? "disabled" : ""}><span class="${it.done ? "muted" : ""}" style="${it.done ? "text-decoration:line-through" : ""}">${esc(it.text)}${it.where ? ` <span class="badge line">${esc(it.where)}</span>` : ""}</span></label>`).join("")}</div>
      </div>`).join("") || empty("No revision requests", "Client requests arrive here as a checklist — one round per request.", "list")}
  </div>`;
}

function notesTab(p, user) {
  return `
  <div class="stack" style="max-width:720px">
    <div class="callout">${icon("lock")}<div>Internal only — clients never see these notes.</div></div>
    <div class="thread">${p.notes.map((n) => `<div class="msg ${n.byId === user.id ? "mine" : ""}"><div class="h">${esc(userName(n.byId))} · ${C.ago(n.at)}${n.tag ? ` · ${badge(n.tag, "gold")}` : ""}</div>${esc(n.text)}</div>`).join("") || `<p class="muted">No notes yet.</p>`}</div>
    <form class="form card flat" data-form="pNote" data-id="${p.id}">
      ${field("Add a note", textarea("text", "", 'required placeholder="Blockers, missing info, scope questions…"'))}
      <div class="row">${select("tag", [["", "General"], ["Blocker", "Blocker"], ["Missing info", "Missing info"], ["Scope question", "Scope question"]], "", 'style="width:auto"')}<button class="btn primary">Post</button></div>
    </form>
  </div>`;
}

function handoverTab(p, user) {
  const h = p.handover || {};
  const all = HANDOVER.every(([k]) => h[k]);
  const canQA = ["qa", "admin"].includes(user.role);
  return `
  <div class="two">
    <div class="card stack">
      <h3>Handover checklist</h3>
      <p class="small muted">Tick every item before marking ready for QA.</p>
      ${HANDOVER.map(([k, l]) => `<label class="check"><input type="checkbox" data-change="pHand" data-id="${p.id}" data-k="${k}" ${h[k] ? "checked" : ""} ${user.role === "qa" ? "disabled" : ""}><span>${esc(l)}</span></label>`).join("")}
      ${user.role !== "qa" ? `<button class="btn primary" data-act="pReadyQA" data-id="${p.id}" ${all && p.stage < 5 ? "" : "disabled"}>${icon("checkCircle", "icon sm")} Ready for QA</button>
      ${p.stage >= 5 ? `<p class="small muted">Already past QA hand-off.</p>` : ""}` : ""}
    </div>
    <div class="card stack">
      <div class="card-head"><h3>QA review</h3>${badge(p.qa.status === "pass" ? "Passed" : p.qa.status === "fail" ? "Sent back" : "Pending", p.qa.status === "pass" ? "ok" : p.qa.status === "fail" ? "bad" : "warn")}</div>
      ${canQA ? `<form class="form" data-form="pQA" data-id="${p.id}">
        ${field("Defects found in this review", input("defects", 0, "number", 'min="0"'), `${p.qa.defects || 0} so far`)}
        ${field("Notes for the designer", textarea("notes", p.qa.notes || ""))}
        <div class="row"><button class="btn primary" name="verdict" value="pass" data-act="pQAVerdict" data-v="pass" data-id="${p.id}">${icon("check", "icon sm")} Pass</button>
        <button class="btn danger" data-act="pQAVerdict" data-v="fail" data-id="${p.id}">${icon("x", "icon sm")} Send back</button></div>
      </form>` : `<p class="small">${esc(p.qa.notes || "No QA notes yet.")}</p>`}
    </div>
  </div>`;
}

function moneyTab(p) {
  const m = C.margin(p);
  return `
  <div class="two">
    <div class="stack">
      <div class="grid kpi">
        ${["Price", "Paid", "Balance", "Refunded"].map((l, i) => `<div class="card"><div class="kpi-l">${l}</div><div class="kpi-v">${C.money([p.price, C.paid(p), C.balance(p), C.refunded(p)][i])}</div></div>`).join("")}
      </div>
      <div class="card"><div class="card-head"><h3>Payments</h3><button class="btn sm" data-act="pInvoice" data-id="${p.id}">${icon("file", "icon sm")} Invoice</button></div>
        <div class="list">${p.payments.map((x) => `<div class="item">${icon("rupee")}<div class="grow"><div class="item-t">${C.money(x.amount)}</div><div class="item-s">${C.date(x.at)} · ${esc(x.method)} ${esc(x.ref || "")}</div></div></div>`).join("") || `<p class="muted small">No payments yet.</p>`}</div>
        ${p.invoices.length ? `<div class="small muted" style="margin-top:8px">Invoices: ${p.invoices.map((i) => `<a href="#/invoice/${p.id}/${encodeURIComponent(i.no)}">${esc(i.no)}</a>`).join(", ")}</div>` : ""}
      </div>
      <form class="card form" data-form="pPay" data-id="${p.id}">
        <h3>Record a payment</h3>
        <div class="cols">${field("Amount (₹)", input("amount", C.balance(p) || "", "number", 'required min="1"'))}${field("Method", select("method", ["UPI", "Bank transfer", "Card", "Cash", "Payment link"]))}</div>
        <div class="cols">${field("Reference", input("ref"))}${field("Date", input("date", C.today(), "date"))}</div>
        <button class="btn primary">Save payment</button>
      </form>
    </div>
    <form class="card form" data-form="pCosts" data-id="${p.id}">
      <h3>Margin</h3>
      <div class="list small">
        ${[["Revenue (net of refunds)", m.revenue], ["Design hours × rate", -m.labour], ["Hosting", -m.hosting], ["Payment fees", -m.fees], ["Affiliate commission", -m.commission], ["Revision cost", -m.revisions], ["Other", -m.other]].map(([l, v]) => `<div class="item"><div class="grow">${l}</div><b class="num">${C.money(v)}</b></div>`).join("")}
        <div class="item"><div class="grow"><b>Contribution margin</b></div><b class="num" style="color:${m.contribution >= 0 ? "var(--ok)" : "var(--bad)"}">${C.money(m.contribution)} · ${C.pct(m.pct)}</b></div>
      </div>
      <div class="cols">${field("Design hours", input("hours", p.costs?.hours || 0, "number", 'min="0" step="0.5"'))}${field("Hosting ₹", input("hosting", p.costs?.hosting || 0, "number", 'min="0"'))}${field("Other ₹", input("other", p.costs?.other || 0, "number", 'min="0"'))}</div>
      <button class="btn">Update costs</button>
    </form>
  </div>`;
}

function deliveryTab(p, user) {
  const isAdmin = user.role === "admin";
  return `
  <div class="two">
    <div class="card stack">
      <h3>Final approval</h3>
      ${p.approval ? `<div class="callout ok">${icon("checkCircle")}<div>Approved by <b>${esc(p.approval.name)}</b> on ${C.date(p.approval.at)}.</div></div>` : `<div class="callout">${icon("lock")}<div>No publication before the client's final content approval. The client signs off from their portal.</div></div>`}
      ${p.delivery ? `<div class="stack"><b>Live link</b><div class="copy"><code>${esc(p.delivery.liveUrl)}</code><button class="btn sm" data-act="copy" data-text="${attr(p.delivery.liveUrl)}">${icon("copy", "icon sm")}</button></div>
        <div class="small muted">Published ${C.date(p.delivery.publishedAt)}${p.delivery.htmlFileId ? " · HTML package attached" : ""}</div></div>` : ""}
    </div>
    ${isAdmin || user.role === "designer" ? `<form class="card form" data-form="pDeliver" data-id="${p.id}">
      <h3>${p.delivery ? "Update delivery" : "Publish & deliver"}</h3>
      ${field("Live invitation URL", input("liveUrl", p.delivery?.liveUrl || "", "url", "required"))}
      ${field("Downloadable HTML package", `<input type="file" name="html" accept=".zip,.html,text/html,application/zip">`, "optional")}
      <button class="btn primary" ${p.approval ? "" : "disabled"}>${icon("send", "icon sm")} Publish</button>
      ${!p.approval ? `<p class="tiny muted">Unlocks after client approval.</p>` : C.balance(p) > 0 ? `<p class="tiny" style="color:var(--warn)">Balance of ${C.money(C.balance(p))} is still due.</p>` : ""}
    </form>` : ""}
  </div>`;
}

function consentTab(p) {
  const c = p.consent || {};
  return `
  <form class="card form" style="max-width:640px" data-form="pConsent" data-id="${p.id}">
    <h3>Consent record</h3>
    <p class="small muted">What the client agreed we may use publicly. Customer content stays out of marketing until consent is logged here.</p>
    ${checkbox("photos", c.photos, "Photos may be used in marketing")}
    ${checkbox("names", c.names, "Names may be shown")}
    ${checkbox("testimonial", c.testimonial, "Testimonial may be published")}
    ${checkbox("showcase", c.showcase, "Project may be showcased (portfolio, Reels)")}
    ${field("How consent was given", select("method", ["Client portal toggle", "WhatsApp message", "Email", "Signed form", "Verbal (recorded)"], c.method || "Client portal toggle"))}
    <div class="small muted">${c.at ? `Last updated ${C.date(c.at)}` : "Never recorded"}</div>
    <button class="btn primary">Save consent</button>
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
    toast("Preview shared — client can view it now");
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
});
