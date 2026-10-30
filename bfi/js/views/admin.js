// Admin panel: leads & quotes, projects, people, finance, content,
// compliance, metrics, comms and studio settings.

import { db, commit, byId, uid, now, token, userName, putFile, ensureClient, clientProjects } from "../db.js";
import { STAGES, LEAD_STAGES, LOST_REASONS, SOURCES, ROLES, VENDOR_KINDS } from "../seed.js";
import { icon } from "../icons.js";
import { esc, attr, act, sheet, closeSheet, toast, badge, empty, kpi, field, input, textarea, select, checkbox, chips, tabs, stateTabs, stageBar, wa, avatar, bars, download, go, confirmSheet, rtable, lineChart, srcBadge, templateArt } from "../ui.js";
import * as C from "../calc.js";
import { projectView, clientLink, coupleName, hydrateFiles, projectTitle, thumb } from "./project.js";

const ui = { leadStage: "all", leadQ: "", leadSource: "", leadDate: "", projFilter: "active", projQ: "", projBoard: false, range: "90", from: "", to: "", channel: "", trendN: 6, tplQ: "", tplTier: "" };

// ── Dashboard ───────────────────────────
const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
function dashboard(_, user) {
  const active = db.projects.filter((p) => p.status === "active");
  const overdue = active.filter(C.isOverdue);
  const stuck = active.filter((p) => !C.isOverdue(p) && C.slaBreached(p));
  const qa = active.filter((p) => p.stage === 5);
  const approval = active.filter((p) => p.stage === 6);
  const leadsD = C.delta(db.leads, (l) => l.createdAt);
  const convD = C.delta(db.leads.filter((l) => l.stage === "converted"), (l) => l.convertedAt || l.createdAt);
  const projD = C.delta(db.projects, (p) => p.createdAt);
  const payments = db.projects.flatMap((p) => p.payments);
  const month = C.today().slice(0, 7);
  const lastMonth = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();
  const rev = payments.filter((x) => x.at.slice(0, 7) === month).reduce((s, x) => s + Number(x.amount), 0);
  const revPrev = payments.filter((x) => x.at.slice(0, 7) === lastMonth).reduce((s, x) => s + Number(x.amount), 0);
  const attention = [
    ...overdue.map((p) => [p, "bad", `Overdue by ${-C.daysUntil(p.dueDate)} day(s)`]),
    ...stuck.map((p) => [p, "warn", `${C.stageAge(p)} days in ${C.stageName(p.stage)}`]),
    ...qa.map((p) => [p, "info", "Waiting for QA"]),
    ...approval.map((p) => [p, "gold", C.balance(p) > 0 ? `Awaiting sign-off · ${C.money(C.balance(p))} due` : "Awaiting client sign-off"]),
    ...db.projects.flatMap((p) => p.notes.filter((n) => n.tag === "Payment claimed" && !n.done).map(() => [p, "violet", "Client reports a payment — verify"])),
  ];
  const recent = db.projects.filter((p) => p.status !== "cancelled").sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  return {
    title: `${greet()}, ${user.name.split(" ")[0] === "Studio" ? "Admin" : user.name.split(" ")[0]}`,
    subtitle: "Here's what's happening with your business today.",
    html: `
    <div class="stack lg">
      <div class="grid kpi">
        ${kpi("Total leads", db.leads.length, "", leadsD)}
        ${kpi("Converted", db.leads.filter((l) => l.stage === "converted").length + db.projects.filter((p) => !p.leadId).length, "", convD)}
        ${kpi("Active projects", active.length, overdue.length ? `<span style="color:var(--bad)">${overdue.length} overdue</span>` : "", projD)}
        ${kpi("Revenue (MTD)", C.short(rev), "", revPrev >= 1000 ? ((rev - revPrev) / revPrev) * 100 : NaN)}
      </div>
      ${capacityAdmin()}
      <div class="two">
        <div class="card">
          <div class="card-head"><h3>Revenue trend</h3>
            <select data-change="trendN" style="width:auto;min-height:34px;padding:4px 10px" aria-label="Range">${[6, 12].map((n) => `<option value="${n}" ${ui.trendN === n ? "selected" : ""}>Last ${n} months</option>`).join("")}</select></div>
          ${lineChart(C.monthly(ui.trendN), C.short)}
        </div>
        <div class="card">
          <div class="card-head"><h3>Needs attention</h3><span class="badge ${attention.length ? "warn" : "ok"}">${attention.length}</span></div>
          ${attention.length ? `<div class="list">${attention.slice(0, 7).map(([p, tone, why]) => `
            <a class="item" href="#/project/${p.id}"><span class="dot" style="color:var(--${tone})"></span>
            <div class="grow"><div class="item-t ellipsis">${esc(projectTitle(p))}</div><div class="item-s">${esc(why)}</div></div>${icon("chevron", "icon sm")}</a>`).join("")}</div>`
            : empty("All calm", "Nothing overdue or stuck.", "checkCircle")}
        </div>
      </div>
      <div class="card pad0">
        <div class="card-head" style="padding:16px 18px 0"><h3>Recent projects</h3><a class="small" href="#/projects">View all</a></div>
        ${rtable([{ label: "Project" }, { label: "Stage" }, { label: "Due date" }, { label: "Status", cls: "pill" }],
          recent.map((p) => { const h = C.health(p); return [`<span class="t">${esc(projectTitle(p))}</span><div class="s">${esc(coupleName(p))}</div>`, esc(C.stageName(p.stage)), C.date(p.dueDate), badge(h.label, h.tone)]; }),
          { href: (i) => `#/project/${recent[i].id}` })}
      </div>
      <div class="two even">
        <div class="card"><div class="card-head"><h3>Lead pipeline</h3><a class="small" href="#/leads">Open</a></div>
          ${bars(Object.fromEntries(LEAD_STAGES.map((s) => [s.name, db.leads.filter((l) => l.stage === s.key).length])))}</div>
        <div class="card"><div class="card-head"><h3>Recent activity</h3><a class="small" href="#/compliance/audit">Audit log</a></div>
          <div class="list">${db.audit.slice(0, 5).map((a) => `<div class="item"><div class="grow"><div class="small"><b>${esc(a.by)}</b> · ${esc(a.action)} <span class="muted">${esc(a.entity)}</span></div></div><span class="tiny muted nowrap">${C.ago(a.at)}</span></div>`).join("")}</div>
        </div>
      </div>
    </div>`,
  };
}

// Booking capacity as clients see it, with requests waiting for a slot.
function capacityAdmin() {
  const c = C.capacity();
  const waiting = db.leads.filter((l) => !["converted", "lost"].includes(l.stage));
  if (!c) return `<div class="card row between"><div><b>Booking capacity is off</b><div class="small muted">Turn it on to show clients how many invitation slots are left.</div></div><a class="btn sm" href="#/studio">Set capacity</a></div>`;
  return `<div class="card stack sm">
    <div class="row between"><div><h3>Booking capacity</h3><div class="small muted">${C.date(c.start)} – ${C.date(c.until)} · shown to clients on the website, booking page and enquiry form</div></div>
      <div class="row"><b style="font-size:20px">${c.used}/${c.slots}</b>${badge(c.full ? "Full: waitlist on" : `${c.left} slot(s) left`, c.full ? "bad" : c.left <= 1 ? "warn" : "ok")}<a class="btn sm" href="#/studio">Edit</a></div></div>
    <div class="cap-meter">${Array.from({ length: c.slots }, (_, i) => `<i class="${i < c.used ? "on" : ""}"></i>`).join("")}</div>
    <div class="small muted">Clients see: “${esc(C.capacityLine(c))}”${waiting.length ? ` · ${waiting.length} open request(s), ${waiting.filter((l) => l.waitlist).length} on the waitlist` : ""}</div>
  </div>`;
}

// ── Leads & Sales ───────────────────────
function leads() {
  const q = ui.leadQ.toLowerCase();
  const days = { "7": 7, "30": 30, "90": 90 }[ui.leadDate];
  let list = db.leads.filter((l) => ui.leadStage === "all" || l.stage === ui.leadStage)
    .filter((l) => !ui.leadSource || l.source === ui.leadSource)
    .filter((l) => !days || Date.now() - new Date(l.createdAt) < days * 864e5)
    .filter((l) => !q || `${l.name} ${l.phone} ${l.city} ${l.source} ${l.refCode}`.toLowerCase().includes(q))
    .sort((a, b) => (ui.leadDate === "old" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
  const count = (k) => db.leads.filter((l) => l.stage === k).length;
  return {
    title: "Leads & Sales", subtitle: "Manage your leads, pipeline and quotes.", fab: { act: "leadNew", label: "Add lead" },
    actions: `<button class="btn primary" data-act="leadNew">${icon("plus", "icon sm")} Add Lead</button>`,
    html: `
    <div class="card pad0">
      ${stateTabs([["all", "All Leads", db.leads.length], ...LEAD_STAGES.map((s) => [s.key, s.name.replace(" enquiry", ""), count(s.key)])], ui.leadStage, "leadChip")}
      <div class="toolbar">
        <div class="search">${icon("search", "icon sm")}<input type="search" placeholder="Search leads…" value="${attr(ui.leadQ)}" data-input="leadSearch" aria-label="Search leads"></div>
        <select data-change="leadSource" aria-label="Source"><option value="">Source</option>${SOURCES.map((s) => `<option ${ui.leadSource === s ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>
        <select data-change="leadDate" aria-label="Date">${[["", "Date: newest"], ["old", "Oldest first"], ["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"]].map(([v, l]) => `<option value="${v}" ${ui.leadDate === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      </div>
      ${rtable([{ label: "Name" }, { label: "Source" }, { label: "Stage", cls: "pill" }, { label: "Wedding" }, { label: "Date" }, { label: "", cls: "act" }],
        list.map((l) => [`<span class="t">${esc(l.name)}</span><div class="s">${esc(l.city || "")}${l.refCode ? ` · ${esc(l.refCode)}` : ""}${l.waitlist ? ` ${badge("Waitlist", "warn")}` : ""}</div>`, srcBadge(l.source), badge(LEAD_STAGES.find((s) => s.key === l.stage)?.name.replace(" enquiry", ""), leadTone[l.stage]), C.date(l.weddingDate), C.date(l.createdAt),
          `<button class="icon-btn plain" data-act="leadMenu" data-id="${l.id}" aria-label="Actions">${icon("more")}</button>`]),
        { empty: "No leads match. Add phone or walk-in enquiries with Add Lead.", href: (i) => `#/lead/${list[i].id}` })}
    </div>`,
    after: (root) => { const s = root.querySelector("[data-input=leadSearch]"); if (ui.leadQ && s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } },
  };
}
const leadTone = { new: "info", contacted: "violet", quoted: "gold", converted: "ok", lost: "bad" };

function leadForm(l = {}) {
  return `
  <form class="form" data-form="leadSave" data-id="${l.id || ""}">
    <div class="cols">${field("Name", input("name", l.name, "text", "required"))}${field("Phone (with country code)", input("phone", l.phone, "tel", 'placeholder="9198…"'))}</div>
    <div class="cols">${field("Email", input("email", l.email, "email"))}${field("City", input("city", l.city))}</div>
    <div class="cols">${field("Wedding date", input("weddingDate", l.weddingDate, "date"))}${field("Interested in", select("interest", [["", "Not sure"], ["basic", "Basic"], ["premium", "Premium"], ["luxury", "Luxury / Bespoke"]], l.interest))}</div>
    <div class="cols">${field("Source", select("source", SOURCES, l.source || "Walk-in / phone"))}${field("Referral code", input("refCode", l.refCode, "text", 'placeholder="optional" style="text-transform:uppercase"'))}</div>
    ${!l.id ? field("Notes", textarea("note", "", 'placeholder="What did they ask for?"')) : ""}
    <button class="btn primary">${l.id ? "Save" : "Add lead"}</button>
  </form>`;
}

function leadDetail([id]) {
  const l = byId("leads", id);
  if (!l) return null;
  const proj = db.projects.find((p) => p.leadId === l.id);
  const q = l.quote || { tier: l.interest || "premium", addons: [], items: [], discount: 0, rush: false };
  return {
    title: l.name, subtitle: `${l.source}${l.city ? " · " + l.city : ""} · enquired ${C.date(l.createdAt)}`, back: "#/leads",
    html: `
    <div class="two">
      <div class="stack">
        <div class="card stack">
          <div class="row between"><b>Stage</b>${badge(LEAD_STAGES.find((s) => s.key === l.stage)?.name, leadTone[l.stage])}</div>
          ${l.stage !== "converted" ? `<div class="chips">${LEAD_STAGES.filter((s) => !["converted", "lost"].includes(s.key)).map((s) => `<button class="chip ${l.stage === s.key ? "on" : ""}" data-act="leadStage" data-id="${l.id}" data-v="${s.key}">${s.name}</button>`).join("")}
            <button class="chip" data-act="leadLost" data-id="${l.id}">Mark lost…</button></div>` : ""}
          ${l.stage === "lost" ? `<div class="callout bad">${icon("info")}<div>Lost: <b>${esc(l.lostReason)}</b>${l.lostNote ? ` — ${esc(l.lostNote)}` : ""}</div></div>` : ""}
          ${proj ? `<a class="btn" href="#/project/${proj.id}">${icon("folder", "icon sm")} Open project ${esc(proj.code)}</a>` : ""}
          <div class="row">
            ${l.phone ? `<a class="btn sm" href="tel:+${attr(l.phone)}">${icon("phone", "icon sm")} Call</a><a class="btn sm" target="_blank" rel="noopener" href="${attr(wa(l.phone, `Namaste ${l.name} 🙏 Thank you for your enquiry with BFI — Marwari Invitations.`))}">${icon("message", "icon sm")} WhatsApp</a>` : ""}
            ${l.email ? `<a class="btn sm" href="mailto:${attr(l.email)}">${icon("mail", "icon sm")} Email</a>` : ""}
            <button class="btn sm" data-act="leadEdit" data-id="${l.id}">${icon("edit", "icon sm")} Edit</button>
          </div>
        </div>
        ${l.stage !== "converted" ? quoteBuilder(l, q) : ""}
      </div>
      <div class="stack">
        <div class="card"><h3>Details</h3><div class="list small">
          ${[["Phone", l.phone], ["Email", l.email], ["City", l.city], ["Wedding", C.date(l.weddingDate)], ["Referral code", l.refCode], ["Partner", l.affiliateId && userName(l.affiliateId)], ["Created", C.date(l.createdAt)]].filter((r) => r[1]).map(([k, v]) => `<div class="item"><span class="muted grow">${k}</span><b>${esc(v)}</b></div>`).join("")}
        </div></div>
        <div class="card stack"><h3>Notes</h3>
          <div class="thread">${(l.notes || []).map((n) => `<div class="msg"><div class="h">${esc(n.by || "")} · ${C.ago(n.at)}</div>${esc(n.text)}</div>`).join("") || `<p class="muted small">No notes.</p>`}</div>
          <form class="row nowrap" data-form="leadNote" data-id="${l.id}"><input type="text" name="text" placeholder="Add a note" required class="grow"><button class="btn sm primary">Add</button></form>
        </div>
      </div>
    </div>`,
  };
}

function quoteBuilder(l, q) {
  const s = C.S();
  const items = [...(q.items || []), { label: "", amount: "" }, { label: "", amount: "" }].slice(0, Math.max(2, (q.items || []).length + 1));
  return `
  <form class="card form" data-form="quoteSave" data-id="${l.id}" data-input="quoteCalc">
    <div class="card-head"><h3>Quote builder</h3><span class="kpi-v" data-quote-total>${C.money(C.quoteTotal(q))}</span></div>
    <div class="stack" style="gap:6px">${Object.entries(s.tiers).map(([k, t]) => `
      <label class="role" style="box-shadow:none"><input type="radio" name="tier" value="${k}" ${q.tier === k ? "checked" : ""} style="accent-color:var(--maroon)">
        <div class="grow"><b>${esc(t.name)} · ${C.money(t.price)}</b><span>${esc(t.desc)}</span></div></label>`).join("")}</div>
    <div><div class="label">Add-ons</div>${s.addons.map((a) => checkbox("addons[]", (q.addons || []).includes(a.id), `${esc(a.name)} <span class="muted">· ${C.money(a.price)}</span>`, a.id)).join("")}</div>
    <div><div class="label">Custom line items</div>${items.map((it) => `<div class="row nowrap" style="margin-top:6px"><input type="text" name="itemLabel[]" value="${attr(it.label)}" placeholder="e.g. Extra language version" class="grow"><input type="number" name="itemAmount[]" value="${attr(it.amount)}" placeholder="₹" style="width:110px"></div>`).join("")}</div>
    <div class="cols">${field("Discount (₹)", input("discount", q.discount || 0, "number", 'min="0"'))}${field("Rush", select("rush", [["no", "Standard turnaround"], ["yes", `Rush (+${s.rushFee}%)`]], q.rush ? "yes" : "no"))}</div>
    <div class="row"><button class="btn">Save quote</button><button class="btn" data-act="quoteSend" data-id="${l.id}">${icon("message", "icon sm")} Send</button>
      <button class="btn primary" data-act="leadConvert" data-id="${l.id}">${icon("wand", "icon sm")} Convert to project</button></div>
  </form>`;
}

function readQuote(form) {
  const fd = new FormData(form);
  const labels = fd.getAll("itemLabel[]"), amounts = fd.getAll("itemAmount[]");
  return {
    tier: fd.get("tier") || "premium", addons: fd.getAll("addons[]"),
    items: labels.map((label, i) => ({ label: label.trim(), amount: Number(amounts[i]) || 0 })).filter((x) => x.label),
    discount: Number(fd.get("discount")) || 0, rush: fd.get("rush") === "yes",
  };
}

export function createProjectFromLead(l, q) {
  const s = C.S();
  const client = (l.clientId && byId("clients", l.clientId)) || ensureClient({ name: l.name, phone: l.phone, email: l.email, city: l.city });
  db.counters.project++;
  const p = {
    id: uid("p"), code: `BFI-${db.counters.project}`, token: token(), leadId: l.id, clientId: client.id, occasion: l.occasion || "", clientName: client.name, brideName: "", groomName: "",
    phone: l.phone, email: l.email, weddingDate: l.weddingDate, city: l.city, tier: q.tier, addons: q.addons || [], items: q.items || [],
    discount: q.discount || 0, rush: !!q.rush, rushFeeAdded: !!q.rush, price: C.quoteTotal(q), templateId: l.templateId || db.templates.find((t) => t.status === "active" && t.tiers.includes(q.tier))?.id || "t1",
    designerId: null, qaId: db.users.find((u) => u.role === "qa")?.id || null, affiliateId: l.affiliateId || null, stage: 1, stageSince: now(), status: "active",
    createdAt: now(), dueDate: C.addDays(Math.ceil(s.tiers[q.tier].days / (q.rush ? 2 : 1))), extraRevisions: 0, overrideNote: "",
    intake: { events: [] }, assets: [], previews: [], revisions: [], notes: [], payments: [], invoices: [], refunds: [], handover: {},
    qa: { status: "pending", notes: "", defects: 0 }, approval: null, delivery: null, review: null,
    consent: { photos: false, names: false, testimonial: false, showcase: false, at: null, method: "" }, costs: { hours: 0, hosting: s.hostingCost, other: 0 }, complaints: 0,
  };
  db.projects.push(p);
  l.stage = "converted"; l.convertedAt = now(); l.quote = { ...q, total: p.price, at: now() };
  return p;
}

// ── Projects ────────────────────────────
function projects() {
  const q = ui.projQ.toLowerCase();
  const f = ui.projFilter;
  const list = db.projects.filter((p) => {
    if (f === "active") return p.status === "active";
    if (f === "overdue") return C.isOverdue(p);
    if (f === "delivered") return p.status === "delivered";
    if (f === "cancelled") return p.status === "cancelled";
    if (f.startsWith("s")) return p.status === "active" && p.stage === Number(f.slice(1));
    return true;
  }).filter((p) => !q || `${p.code} ${p.clientName} ${p.brideName} ${p.groomName} ${p.city} ${userName(p.designerId)}`.toLowerCase().includes(q))
    .sort((a, b) => (a.dueDate || "9").localeCompare(b.dueDate || "9"));
  const n = (fn) => db.projects.filter(fn).length;
  const chipList = [["active", "Active", n((p) => p.status === "active")], ["overdue", "Overdue", n(C.isOverdue)], ...STAGES.slice(0, 7).map((s, i) => [`s${i}`, s.name, n((p) => p.status === "active" && p.stage === i)]), ["delivered", "Delivered", n((p) => p.status === "delivered")], ["cancelled", "Cancelled", n((p) => p.status === "cancelled")], ["all", "All", db.projects.length]];
  return {
    title: "Projects", subtitle: "Every order, stage by stage, with deadline flags.",
    actions: `<button class="btn" data-act="projBoard">${icon(ui.projBoard ? "list" : "layers", "icon sm")} ${ui.projBoard ? "List" : "Board"}</button>`,
    html: ui.projBoard ? board() : `
    <div class="card pad0">
      <div class="toolbar">
        <div class="search">${icon("search", "icon sm")}<input type="search" placeholder="Search couple, code, city, designer" value="${attr(ui.projQ)}" data-input="projSearch" aria-label="Search projects"></div>
      </div>
      <div style="padding:12px 14px 0">${chips(chipList, f, "projChip")}</div>
      ${rtable([{ label: "Project" }, { label: "Stage" }, { label: "Designer" }, { label: "Due date" }, { label: "Revisions" }, { label: "Status", cls: "pill" }],
        list.map((p) => { const h = C.health(p); return [`<div class="row nowrap">${thumb(p)}<div><span class="t">${esc(projectTitle(p))}</span><div class="s">${esc(p.code)} · ${esc(C.S().tiers[p.tier]?.name)}</div></div></div>`, esc(C.stageName(p.stage)), esc(userName(p.designerId)), C.date(p.dueDate), esc(C.limitLabel(p)), badge(h.label, h.tone)]; }),
        { empty: "No projects here. Convert a lead to start one.", href: (i) => `#/project/${list[i].id}` })}
    </div>`,
    after: (root) => { const s = root.querySelector("[data-input=projSearch]"); if (ui.projQ && s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } },
  };
}
export const projectCard = (p, base = "#/project") => {
  const h = C.health(p);
  return `
  <a class="card" href="${base}/${p.id}" style="text-decoration:none;color:inherit;display:grid;gap:10px">
    <div class="row nowrap">${thumb(p)}<div class="grow"><b class="ellipsis" style="display:block">${esc(projectTitle(p))}</b><div class="small muted">${esc(coupleName(p))} · ${esc(p.code)}</div></div>${badge(h.label, h.tone)}</div>
    ${stageBar(p.stage, p.status === "cancelled")}
    <div class="row between small"><span class="muted">${esc(C.stageName(p.stage))}</span><span class="muted">Due ${C.shortDate(p.dueDate)}</span></div>
  </a>`;
};
function board() {
  return `<div class="pipeline">${STAGES.map((s, i) => {
    const list = db.projects.filter((p) => p.status !== "cancelled" && p.stage === i && (i < 7 || C.daysUntil(p.deliveredAt?.slice(0, 10)) > -30));
    return `<div class="pipe"><h4>${esc(s.name)}<span>${list.length}</span></h4>${list.map((p) => {
      const h = C.health(p);
      return `<a class="card" href="#/project/${p.id}" style="display:block;text-decoration:none;color:inherit"><b class="small">${esc(projectTitle(p))}</b><div class="row between tiny" style="margin-top:4px"><span class="muted">${esc(userName(p.designerId))}</span>${badge(h.label, h.tone)}</div></a>`;
    }).join("")}</div>`;
  }).join("")}</div>`;
}

// ── People ──────────────────────────────
function people([tab = "team"]) {
  const groups = {
    team: db.users.filter((u) => ["admin", "marketing", "designer", "qa"].includes(u.role)),
    partners: db.users.filter((u) => u.role === "affiliate"),
    freelancers: db.users.filter((u) => u.role === "freelancer"),
  };
  if (tab === "clients") return clientsTab(groups);
  const list = groups[tab] || groups.team;
  return {
    title: "People", subtitle: "Team roles, affiliate & vendor partners, and time-boxed freelancers.", fab: { act: "personNew", label: "Add person" },
    actions: `<button class="btn primary" data-act="personNew">${icon("plus", "icon sm")} Add person</button>`,
    html: `<div class="card pad0">
    ${peopleTabs(groups, tab)}
    ${rtable([{ label: "Name" }, { label: tab === "partners" ? "Type" : "Role" }, { label: tab === "partners" ? "Code" : tab === "freelancers" ? "Access until" : "Email" }, { label: "Status", cls: "pill" }],
      list.map((u) => {
        const expired = u.accessUntil && new Date(u.accessUntil) < new Date();
        return [`<div class="row nowrap">${avatar(u.name)}<span class="t">${esc(u.name)}</span></div>`,
          u.role === "affiliate" ? `${u.partnerType === "trade" ? "One-time trade" : "Ongoing affiliate"} · ${esc(u.partnerKind || "")}` : esc(ROLES[u.role].name),
          u.role === "affiliate" ? `<code>${esc(u.refCode || "")}</code>` : u.role === "freelancer" ? C.date(u.accessUntil) : esc(u.email || ""),
          u.active === false ? badge("Inactive", "line") : expired ? badge("Expired", "bad") : badge("Active", "ok")];
      }), { href: (i) => `#/person/${list[i].id}` })}
    </div>`,
  };
}

const peopleTabs = (groups, tab) => tabs([["team", "Team", groups.team.length], ["clients", "Clients", db.clients.length], ["partners", "Affiliates & vendors", groups.partners.length], ["freelancers", "Freelancers", groups.freelancers.length]], tab, "#/people");
// Client accounts: one family, one private link, any number of projects.
function clientsTab(groups) {
  const list = db.clients.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const portal = (c) => `${location.origin}${location.pathname}#/c/${c.token}`;
  return {
    title: "People", subtitle: "Team roles, clients, affiliate & vendor partners, and time-boxed freelancers.",
    html: `<div class="card pad0">${peopleTabs(groups, "clients")}
      ${rtable([{ label: "Client" }, { label: "Projects" }, { label: "Lifetime value", cls: "num" }, { label: "", cls: "act" }],
        list.map((c) => {
          const ps = clientProjects(c);
          return [`<div class="row nowrap">${avatar(c.name)}<div><span class="t">${esc(c.name)}</span><div class="s">${esc(c.phone || "")} · ${esc(c.city || "")}</div></div></div>`,
            ps.map((p) => `<a href="#/project/${p.id}">${esc(p.code)}</a> ${badge(p.status === "delivered" ? "Delivered" : C.stageName(p.stage), p.status === "delivered" ? "ok" : "info")}`).join("<br>") || "—",
            C.money(ps.reduce((s, p) => s + C.paid(p), 0)) + (ps.length > 1 ? ` ${badge("Repeat", "gold")}` : ""),
            `<button class="btn sm" data-act="copy" data-text="${attr(portal(c))}" data-label="Portal link copied">${icon("copy", "icon sm")} Portal link</button>`];
        }), { empty: "No clients yet. Converting a lead creates one." })}
    </div>`,
  };
}

function personForm(u = { role: "designer" }) {
  const isP = u.role === "affiliate", isF = u.role === "freelancer";
  return `
  <form class="form" data-form="personSave" data-id="${u.id || ""}">
    <div class="cols">${field("Name", input("name", u.name, "text", "required"))}${field("Role", select("role", Object.entries(ROLES).map(([k, r]) => [k, r.name]), u.role, 'data-change="personRole"'))}</div>
    <div class="cols">${field("Email", input("email", u.email, "email"))}${field("Phone", input("phone", u.phone, "tel"))}</div>
    <div data-role-block="affiliate" ${isP ? "" : "hidden"} class="form">
      <div class="cols">${field("Partner type", select("partnerType", [["affiliate", "Ongoing affiliate (commission)"], ["trade", "One-time vendor trade"]], u.partnerType || "affiliate"))}${field("Kind", select("partnerKind", VENDOR_KINDS, u.partnerKind))}</div>
      <div class="cols">${field("Referral code", input("refCode", u.refCode || "", "text", 'placeholder="auto" style="text-transform:uppercase"'))}${field("Trade limit (clients)", input("tradeLimit", u.tradeLimit || 3, "number", 'min="0"'))}</div>
      <div class="label">Commission overrides (% — blank uses default)</div>
      <div class="cols">${["basic", "premium", "luxury"].map((t) => field(`${C.S().tiers[t].name} (default ${C.S().commission[t]}%)`, input(`co_${t}`, u.commissionOverride?.[t] ?? "", "number", 'min="0" max="50" step="0.5"'))).join("")}</div>
    </div>
    <div data-role-block="freelancer" ${isF ? "" : "hidden"} class="form">
      ${field("Access until", input("accessUntil", u.accessUntil || C.addDays(14), "date"), "access ends automatically")}
      <div><div class="label">Projects they can see</div>${db.projects.filter((p) => p.status === "active").map((p) => checkbox("projectIds[]", (u.projectIds || []).includes(p.id), `${esc(p.code)} · ${esc(coupleName(p))}`, p.id)).join("")}</div>
    </div>
    <button class="btn primary">${u.id ? "Save" : "Add person"}</button>
  </form>`;
}

function person([id]) {
  const u = byId("users", id);
  if (!u) return null;
  let extra = "";
  if (u.role === "affiliate") {
    const ls = db.leads.filter((l) => l.affiliateId === u.id);
    const ps = db.projects.filter((p) => p.affiliateId === u.id);
    const cs = db.commissions.filter((c) => c.partnerId === u.id);
    const owed = cs.filter((c) => c.status === "owed").reduce((s, c) => s + c.amount, 0);
    const paidC = cs.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
    const vendor = db.vendors.find((v) => v.partnerId === u.id);
    extra = `
      <div class="grid kpi">${kpi("Leads", ls.length)}${kpi("Projects", ps.length)}${kpi("Commission owed", C.money(owed))}${kpi("Commission paid", C.money(paidC))}</div>
      <div class="card"><h3>Projects</h3><div class="list">${ps.map((p) => `<a class="item" href="#/project/${p.id}"><div class="grow"><div class="item-t">${esc(coupleName(p))}</div><div class="item-s">${esc(p.code)} · ${esc(C.stageName(p.stage))} · ${C.money(p.price)}</div></div>${badge(C.commissionRate(u, p.tier) + "%", "gold")}</a>`).join("") || `<p class="muted small">None yet.</p>`}</div></div>
      <div class="card"><h3>Payout details</h3><div class="small">UPI: <b>${esc(u.payout?.upi || "—")}</b> · Bank: <b>${esc(u.payout?.bank || "—")}</b> · PAN: <b>${esc(u.payout?.pan || "—")}</b></div>
        ${u.partnerType === "trade" ? `<p class="small muted" style="margin-top:6px">Trade partner: ${ps.length}/${u.tradeLimit || 3} discounted clients used. <button class="btn sm" data-act="tradeToAff" data-id="${u.id}">Convert to ongoing affiliate</button></p>` : ""}
        ${vendor ? `<p class="small" style="margin-top:6px"><a href="#/vendor/${vendor.id}">Outreach record →</a></p>` : ""}</div>`;
  }
  if (u.role === "freelancer") {
    extra = `<div class="card"><h3>Scoped access</h3><p class="small muted">Sees only these projects until ${esc(u.accessUntil || "—")}.</p><div class="list">${(u.projectIds || []).map((pid) => byId("projects", pid)).filter(Boolean).map((p) => `<a class="item" href="#/project/${p.id}"><div class="grow item-t">${esc(p.code)} · ${esc(coupleName(p))}</div></a>`).join("") || `<p class="muted small">No projects.</p>`}</div></div>`;
  }
  if (["designer", "qa"].includes(u.role)) {
    const ps = db.projects.filter((p) => p.status === "active" && (p.designerId === u.id || p.qaId === u.id));
    extra = `<div class="card"><h3>Active projects (${ps.length})</h3><div class="list">${ps.map((p) => `<a class="item" href="#/project/${p.id}"><div class="grow"><div class="item-t">${esc(coupleName(p))}</div><div class="item-s">${esc(C.stageName(p.stage))} · due ${C.shortDate(p.dueDate)}</div></div>${badge(C.health(p).label, C.health(p).tone)}</a>`).join("") || `<p class="muted small">None.</p>`}</div></div>`;
  }
  return {
    title: u.name, subtitle: ROLES[u.role].name, back: `#/people/${u.role === "affiliate" ? "partners" : u.role === "freelancer" ? "freelancers" : "team"}`,
    html: `<div class="two"><div class="stack">${extra || `<div class="card small muted">Full access per role: ${esc(ROLES[u.role].desc)}.</div>`}</div>
      <div class="stack"><div class="card">${personForm(u)}</div>
        ${u.id !== "u_admin" ? `<button class="btn ${u.active === false ? "" : "danger"}" data-act="personToggle" data-id="${u.id}">${u.active === false ? "Reactivate" : "Deactivate access"}</button>` : ""}</div></div>`,
  };
}

// ── Finance ─────────────────────────────
function finance([tab = "overview"]) {
  const T = [["overview", "Overview"], ["orders", "Orders"], ["commissions", "Commissions"], ["invoices", "Invoices"], ["refunds", "Refunds"]];
  const body = {
    overview: () => {
      const rows = db.projects.filter((p) => p.status !== "cancelled").map((p) => [p, C.margin(p)]);
      const rev = rows.reduce((s, [, m]) => s + m.revenue, 0);
      const cost = rows.reduce((s, [, m]) => s + m.cost, 0);
      const owed = db.commissions.filter((c) => c.status === "owed").reduce((s, c) => s + c.amount, 0) + db.projects.filter((p) => p.status === "active" && p.affiliateId).reduce((s, p) => s + C.projectedCommission(p), 0);
      const revD = C.delta(db.projects.flatMap((p) => p.payments), (x) => x.at, 30, (x) => Number(x.amount));
      const byTier = {};
      rows.forEach(([p, m]) => { (byTier[p.tier] = byTier[p.tier] || []).push(m); });
      return `<div class="stack lg">
      <div class="grid kpi">
        ${kpi("Total revenue", C.short(rev), "collected, net of refunds")}
        ${kpi("Total costs", C.short(cost), "incl. commission & fees")}
        ${kpi("Margin", rev ? C.pct(((rev - cost) / rev) * 100) : "—", C.money(rev - cost))}
        ${kpi("Commission owed", C.short(owed), "incl. in-progress orders")}
      </div>
      <div class="card pad0">
        <div class="card-head" style="padding:16px 18px 0"><h3>Order-wise margin</h3><span class="small muted">contribution after all costs</span></div>
        ${rtable([{ label: "Order ID" }, { label: "Project" }, { label: "Revenue", cls: "num" }, { label: "Cost", cls: "num" }, { label: "Margin", cls: "pill" }],
          rows.map(([p, m]) => [`<span class="t">#${esc(p.code)}</span>`, esc(projectTitle(p)), C.money(m.revenue), C.money(m.cost), `<b style="color:var(--${m.contribution >= 0 ? "ok" : "bad"})">${C.pct(m.pct)}</b>`]),
          { href: (i) => `#/project/${rows[i][0].id}/money` })}
      </div>
      <div class="grid kpi">${Object.entries(C.S().tiers).map(([k, t]) => {
        const ms = byTier[k] || [];
        const r = ms.reduce((s, m) => s + m.revenue, 0), c = ms.reduce((s, m) => s + m.contribution, 0);
        return kpi(`${t.name} · ${ms.length} order(s)`, r ? C.pct((c / r) * 100) : "—", `contribution ${C.money(c)}`);
      }).join("")}</div>
      <p class="tiny muted">Costs = design hours × ₹${C.S().hourlyCost}/h + hosting + ${C.S().gatewayFee}% payment fees + revision rounds × ₹${C.S().revisionCost} + commission + other. Change rates in Settings → Prices & policies.</p>
      </div>`;
    },
    orders: () => `<div class="card pad0">${rtable([{ label: "Order" }, { label: "Price", cls: "num" }, { label: "Paid", cls: "num" }, { label: "Balance", cls: "num" }, { label: "Status", cls: "pill" }, { label: "", cls: "act" }],
      db.projects.slice().sort((a, b) => C.balance(b) - C.balance(a)).map((p) => {
        const s = C.payStatus(p);
        return [`<span class="t">#${esc(p.code)}</span><div class="s">${esc(projectTitle(p))}</div>`, C.money(p.price), C.money(C.paid(p)), C.money(C.balance(p)), badge(s.label, s.tone),
          C.balance(p) > 0 ? `<a class="btn sm" target="_blank" rel="noopener" href="${attr(wa(p.phone, `Namaste ${p.clientName} 🙏 Your balance for ${p.code} is ${C.money(C.balance(p))}. Pay securely from your invitation page: ${clientLink(p)}`))}">${icon("message", "icon sm")} Remind</a>` : ""];
      }))}</div>`,
    commissions: () => {
      const partners = db.users.filter((u) => u.role === "affiliate");
      return `<div class="stack">${partners.map((u) => {
        const cs = db.commissions.filter((c) => c.partnerId === u.id);
        const owed = cs.filter((c) => c.status === "owed");
        const pending = db.projects.filter((p) => p.affiliateId === u.id && p.status === "active").reduce((s, p) => s + C.projectedCommission(p), 0);
        return `<div class="card">
          <div class="card-head"><div class="row nowrap">${avatar(u.name)}<div><h4>${esc(u.name)}</h4><div class="small muted">${u.partnerType === "trade" ? "Trade partner — no cash commission" : `Code ${esc(u.refCode)} · ${esc(u.payout?.upi || u.payout?.bank || "no payout details")}`}</div></div></div>
            <div class="right"><div class="kpi-v" style="font-size:20px;margin:0">${C.money(owed.reduce((s, c) => s + c.amount, 0))}</div><div class="tiny muted">owed · ${C.money(pending)} in pipeline</div></div></div>
          ${cs.length ? rtable([{ label: "Order" }, { label: "Rate" }, { label: "Amount", cls: "num" }, { label: "Status", cls: "pill" }], cs.map((c) => { const p = byId("projects", c.projectId); return [esc(p ? `${p.code} · ${projectTitle(p)}` : ""), `${c.rate}%`, C.money(c.amount), badge(c.status === "paid" ? "Paid" : "Owed", c.status === "paid" ? "ok" : "warn")]; })) : `<p class="small muted" style="margin:0">No completed, paid orders yet.</p>`}
          ${owed.length ? `<button class="btn primary sm" style="margin-top:10px" data-act="payoutNew" data-id="${u.id}">${icon("send", "icon sm")} Pay out ${C.money(owed.reduce((s, c) => s + c.amount, 0))}</button>` : ""}
        </div>`;
      }).join("")}
      <div class="card pad0"><div class="card-head" style="padding:16px 18px 0"><h3>Payout history</h3></div>${rtable([{ label: "Partner" }, { label: "Date" }, { label: "Reference" }, { label: "Amount", cls: "num" }], db.payouts.slice().reverse().map((po) => [esc(userName(po.partnerId)), C.date(po.at), esc(po.ref), `<b>${C.money(po.amount)}</b>`]), { empty: "No payouts yet." })}</div></div>`;
    },
    invoices: () => {
      const inv = db.projects.flatMap((p) => p.invoices.map((i) => ({ ...i, p }))).sort((a, b) => b.at.localeCompare(a.at));
      return `<div class="card pad0">${rtable([{ label: "Invoice" }, { label: "Project" }, { label: "Date" }, { label: "Amount", cls: "num" }], inv.map((i) => [`<span class="t">${esc(i.no)}</span>`, esc(projectTitle(i.p)), C.date(i.at), C.money(i.amount)]), { empty: "No invoices yet. Generate one from a project's Payments tab.", href: (k) => `#/invoice/${inv[k].p.id}/${encodeURIComponent(inv[k].no)}` })}</div>`;
    },
    refunds: () => {
      const rf = db.projects.flatMap((p) => p.refunds.map((r) => ({ ...r, p })));
      return `<div class="stack"><div class="callout">${icon("info")}<div><b>Policy:</b> ${esc(C.S().policy.text)}</div></div>
        <div class="card pad0">${rtable([{ label: "Project" }, { label: "Date" }, { label: "Reason" }, { label: "Amount", cls: "num" }], rf.map((r) => [esc(`${r.p.code} · ${projectTitle(r.p)}`), C.date(r.at), esc(r.reason), C.money(r.amount)]), { empty: "No refunds. Cancel a project from its Overview to process one against the policy.", href: (k) => `#/project/${rf[k].p.id}` })}</div></div>`;
    },
  }[tab]?.() || "";
  return { title: "Finance", subtitle: "Track revenue, expenses and commissions.", html: tabs(T, tab, "#/finance") + body };
}

function invoice([pid, no]) {
  const p = byId("projects", pid);
  const inv = p?.invoices.find((i) => i.no === no);
  if (!inv) return null;
  const s = C.S();
  const lines = C.quoteLines(p);
  return {
    title: inv.no, eyebrow: "Invoice", back: `#/project/${p.id}/money`,
    actions: `<button class="btn sm primary" onclick="window.print()">${icon("download", "icon sm")} Print / PDF</button>`,
    html: `
    <div class="invoice" style="max-width:760px">
      <div class="row between" style="align-items:flex-start"><div><h2>${esc(s.studio)}</h2><div class="small">${esc(s.address)}<br>${esc(s.email)}${s.gstin ? `<br>GSTIN ${esc(s.gstin)}` : ""}</div></div>
        <div class="right"><div class="eyebrow">Invoice</div><b>${esc(inv.no)}</b><div class="small">${C.date(inv.at)}</div></div></div>
      <div class="divider">✦</div>
      <div class="small"><b>Billed to</b><br>${esc(p.clientName)}<br>${esc(p.email || "")} ${esc(p.phone || "")}<br>Project ${esc(p.code)} · wedding ${C.date(p.weddingDate)}</div>
      <table style="margin:18px 0"><thead><tr><th>Description</th><th class="num">Amount</th></tr></thead>
        <tbody>${lines.map((l) => `<tr><td>${esc(l.label)}</td><td class="num">${C.money(l.amount)}</td></tr>`).join("")}
        <tr><td><b>Total</b></td><td class="num"><b>${C.money(p.price)}</b></td></tr>
        <tr><td>Paid to date</td><td class="num">${C.money(C.paid(p))}</td></tr>
        <tr><td><b>Balance due</b></td><td class="num"><b>${C.money(C.balance(p))}</b></td></tr></tbody></table>
      <div class="small">Pay by UPI to <b>${esc(s.upiId)}</b> (${esc(s.upiName)}).</div>
      <p class="tiny" style="margin-top:14px;color:#777">${esc(s.policy.text)}</p>
    </div>`,
  };
}

// ── Content & Assets ────────────────────
function content([tab = "overview"]) {
  const T = [["overview", "Templates"], ["library", "Asset Library"], ["testimonials", "Testimonials"]];
  const body = { overview: templatesTab, library: () => libraryTab(), testimonials: () => testimonialsTab() }[tab]?.() || "";
  return { title: "Content & Assets", subtitle: "Manage templates, assets and testimonials.", actions: tab === "overview" ? `<button class="btn primary" data-act="tplNew">${icon("plus", "icon sm")} Add template</button>` : "", html: tabs(T, tab, "#/content") + body, after: hydrateFiles };
}
const tierTone = { basic: "info", premium: "line", luxury: "gold" };
function templatesTab() {
  const q = ui.tplQ.toLowerCase();
  const list = db.templates.filter((t) => (!ui.tplTier || t.tiers.includes(ui.tplTier)) && (!q || `${t.name} ${t.tags.join(" ")}`.toLowerCase().includes(q)));
  return `
  <div class="card stack">
    <div class="row">
      <div class="search grow">${icon("search", "icon sm")}<input type="search" placeholder="Search templates…" value="${attr(ui.tplQ)}" data-input="tplSearch" aria-label="Search templates"></div>
      <select data-change="tplTier" style="width:auto" aria-label="Tier"><option value="">All tiers</option>${Object.entries(C.S().tiers).map(([k, t]) => `<option value="${k}" ${ui.tplTier === k ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select>
    </div>
    <div class="tpl-grid">${list.map((t) => `
      <div class="tpl" style="${t.status === "retired" ? "opacity:.55" : ""}">
        <div class="art">${templateArt(t)}</div>
        <div class="meta">
          <div class="row between nowrap"><b class="ellipsis">${esc(t.name)}</b><button class="icon-btn plain" data-act="tplMenu" data-id="${t.id}" aria-label="Template actions">${icon("more")}</button></div>
          <div class="row" style="gap:4px">${badge(C.S().tiers[t.tier || t.tiers[0]]?.name.split(" ")[0], tierTone[t.tier || t.tiers[0]])}${t.status === "retired" ? badge("Retired", "line") : ""}<span class="tiny muted">${db.projects.filter((p) => p.templateId === t.id).length} used</span></div>
        </div>
      </div>`).join("") || `<p class="muted">No templates match.</p>`}</div>
  </div>`;
}

export function libraryTab({ canApprove = true } = {}) {
  return `
  <div class="stack">
    <form class="card form" data-form="libAdd">
      <h3>Add to library</h3>
      <div class="cols">${field("Title", input("title", "", "text", "required"))}${field("Kind", select("kind", ["Before / after", "Reel clip", "Photo", "One-pager", "Template screenshot"]))}</div>
      <div class="cols">${field("Source", select("source", [["stock", "Stock / our own"], ["customer", "Customer-supplied"]]))}${field("Project (if customer)", select("projectId", [["", "—"], ...db.projects.map((p) => [p.id, `${p.code} · ${coupleName(p)}`])]))}</div>
      <div class="cols">${field("File", `<input type="file" name="files" accept="image/*,video/*,application/pdf">`)}${field("…or link", input("url", "", "url"))}</div>
      <button class="btn primary">${icon("upload", "icon sm")} Add</button>
    </form>
    <div class="tiles" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">${db.library.map((a) => {
      const p = a.projectId && byId("projects", a.projectId);
      const consentOk = a.source !== "customer" || (p && p.consent.photos && p.consent.showcase);
      return `<div class="tile">
        <a class="th" ${a.fileId ? `data-file="${a.fileId}" data-kind="${a.fileKind || "image"}"` : a.url ? `href="${attr(a.url)}" target="_blank" rel="noopener"` : ""}>${icon(a.kind === "Reel clip" ? "video" : a.kind === "One-pager" ? "file" : "image", "icon lg")}</a>
        <div class="meta"><b title="${attr(a.title)}">${esc(a.title)}</b>
          <span class="row" style="gap:4px">${badge(a.kind, "line")}${badge(a.source === "customer" ? "Customer" : "Stock", "gold")}</span>
          <span class="row" style="gap:4px">${badge(a.status === "approved" ? "Approved" : a.status === "rejected" ? "Rejected" : "Pending", a.status === "approved" ? "ok" : a.status === "rejected" ? "bad" : "warn")}${!consentOk ? badge("No consent", "bad") : ""}</span>
          ${canApprove ? `<span class="row" style="gap:4px"><button class="btn sm" data-act="libStatus" data-id="${a.id}" data-v="approved" ${consentOk ? "" : "disabled"}>${icon("check", "icon sm")}</button><button class="btn sm" data-act="libStatus" data-id="${a.id}" data-v="rejected">${icon("x", "icon sm")}</button></span>` : ""}
        </div></div>`;
    }).join("")}</div>
  </div>`;
}
export function testimonialsTab({ canApprove = true } = {}) {
  const list = db.projects.filter((p) => p.review);
  const waiting = db.projects.filter((p) => p.status === "delivered" && !p.review);
  return `
  <div class="stack">
    ${list.map((p) => {
      const ok = p.review.consentPublic && p.consent.testimonial;
      return `<div class="card stack">
        <div class="row between"><div><h4>${esc(coupleName(p))}</h4><div class="small muted">${esc(p.code)} · ${C.date(p.review.at)}</div></div><div style="color:var(--gold)">${"★".repeat(p.review.rating)}${"☆".repeat(5 - p.review.rating)}</div></div>
        <p class="serif" style="font-size:18px;font-style:italic">“${esc(p.review.text)}”</p>
        <div class="row">${badge(ok ? "Consent logged" : "No public consent", ok ? "ok" : "bad")}${badge(p.review.approved ? "Approved for public use" : "Not approved", p.review.approved ? "ok" : "warn")}
          ${canApprove ? `<button class="btn sm" data-act="tstApprove" data-id="${p.id}" ${ok ? "" : "disabled"}>${p.review.approved ? "Withdraw" : "Approve"}</button>` : ""}
          ${p.review.approved ? `<button class="btn sm" data-act="copy" data-text="${attr(`“${p.review.text}” — ${coupleName(p)}`)}">${icon("copy", "icon sm")} Copy</button>` : ""}</div>
      </div>`;
    }).join("") || empty("No reviews yet", "Clients leave one from their portal after delivery.", "star")}
    ${waiting.length ? `<div class="card"><h3>Waiting for a review</h3><div class="list">${waiting.map((p) => `<div class="item"><div class="grow"><div class="item-t">${esc(coupleName(p))}</div><div class="item-s">Requested ${C.ago(p.testimonialRequest?.sentAt)}</div></div>
      <a class="btn sm" target="_blank" rel="noopener" data-act="tstNudge" data-id="${p.id}" href="#">${icon("message", "icon sm")} Ask</a></div>`).join("")}</div></div>` : ""}
  </div>`;
}

// ── Compliance ──────────────────────────
function compliance([tab = "consent"]) {
  const T = [["consent", "Consent"], ["documents", "Documents"], ["audit", "Audit log"]];
  const yes = (v) => (v ? `<span style="color:var(--ok)">${icon("check", "icon sm")}</span>` : `<span class="muted">—</span>`);
  const body = {
    consent: () => `<div class="table-wrap"><table><thead><tr><th>Client</th><th>Photos</th><th>Names</th><th>Testimonial</th><th>Showcase</th><th>How / when</th></tr></thead><tbody>
      ${db.projects.map((p) => `<tr><td><a href="#/project/${p.id}/consent">${esc(p.code)}</a><div class="tiny muted">${esc(coupleName(p))}</div></td><td>${yes(p.consent.photos)}</td><td>${yes(p.consent.names)}</td><td>${yes(p.consent.testimonial)}</td><td>${yes(p.consent.showcase)}</td><td class="small">${p.consent.at ? `${esc(p.consent.method)}<div class="tiny muted">${C.date(p.consent.at)}</div>` : `<span class="muted">Not recorded</span>`}</td></tr>`).join("")}</tbody></table></div>`,
    documents: () => `<div class="stack">
      <form class="card form" data-form="docAdd"><h3>Store a document</h3>
        <div class="cols">${field("Title", input("title", "", "text", "required"))}${field("Type", select("kind", ["Terms of service", "Privacy policy", "Refund policy", "Affiliate agreement", "Vendor agreement", "Freelancer NDA", "Client signed ToS", "Other"]))}</div>
        <div class="cols">${field("Party", select("partyId", [["", "— studio-wide —"], ...db.users.filter((u) => u.role !== "admin").map((u) => [u.id, u.name])]))}${field("Signed on", input("signedAt", C.today(), "date"))}</div>
        ${field("File", `<input type="file" name="files" accept="application/pdf,image/*">`)}
        <button class="btn primary">Save</button></form>
      <div class="card" style="padding:4px 16px"><div class="list">${db.documents.map((d) => `<div class="item">${icon("file")}<div class="grow"><div class="item-t">${esc(d.title)}</div><div class="item-s">${esc(d.kind)} · ${d.partyId ? esc(userName(d.partyId)) : "Studio-wide"} · signed ${C.date(d.signedAt)}</div></div>
        ${d.fileId ? `<a class="btn sm" data-file="${d.fileId}" data-kind="pdf">${icon("eye", "icon sm")}</a>` : badge("No file", "line")}</div>`).join("")}</div></div></div>`,
    audit: () => `<div class="stack"><div class="row"><button class="btn sm" data-act="auditCsv">${icon("download", "icon sm")} Export CSV</button><span class="small muted">${db.audit.length} entries</span></div>
      <div class="card" style="padding:4px 16px"><div class="list">${db.audit.slice(0, 300).map((a) => `<div class="item"><div class="grow"><div class="small"><b>${esc(a.by)}</b> · ${esc(a.action)} · <span class="muted">${esc(a.entity)}</span></div>${a.detail ? `<div class="item-s">${esc(a.detail)}</div>` : ""}</div><span class="tiny muted nowrap">${new Date(a.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>`).join("")}</div></div></div>`,
  }[tab]?.() || "";
  return { title: "Compliance", subtitle: "Consent records, signed documents and the audit trail.", html: tabs(T, tab, "#/compliance") + body, after: hydrateFiles };
}

// ── Metrics ─────────────────────────────
function rangeDates() {
  if (ui.range === "custom") return { from: ui.from, to: ui.to };
  if (ui.range === "all") return { from: "", to: "" };
  return { from: C.addDays(-Number(ui.range)), to: C.today() };
}
function metricsView() {
  const r = rangeDates();
  const m = C.metrics({ ...r, channel: ui.channel });
  const n = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : "—");
  const sec = (title, items) => `<div class="card"><h3 style="margin-bottom:10px">${title}</h3><div class="grid kpi">${items.map(([l, v, s]) => `<div><div class="kpi-l">${l}</div><div class="kpi-v" style="font-size:24px">${v}</div>${s ? `<div class="kpi-s">${s}</div>` : ""}</div>`).join("")}</div></div>`;
  return {
    title: "Metrics", subtitle: "Section 12 metrics — filter by date range and channel, export for 90-day reviews.", actions: `<button class="btn sm" data-act="metricsCsv">${icon("download", "icon sm")} <span class="hide-m">Export</span></button>`,
    html: `
    <div class="stack">
      ${chips([["30", "30 days"], ["90", "90 days"], ["180", "6 months"], ["all", "All time"], ["custom", "Custom"]], ui.range, "rangeChip")}
      <div class="row">
        ${ui.range === "custom" ? `<input type="date" value="${attr(ui.from)}" data-change="rangeFrom" style="width:auto" aria-label="From"><input type="date" value="${attr(ui.to)}" data-change="rangeTo" style="width:auto" aria-label="To">` : ""}
        <select data-change="channelSel" style="width:auto" aria-label="Channel">${[["", "All channels"], ...SOURCES.map((s) => [s, s])].map(([v, l]) => `<option value="${attr(v)}" ${v === ui.channel ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>
      </div>
      <div class="callout">${icon("calendar")}<div>90-day review: compare cost per order, vendor conversion and average order value, then decide whether to deepen the Marwari channel or open a second niche. Export this view for the checkpoint.</div></div>
      ${sec("Marketing", [["Website visitors", m.marketing.visitors], ["Leads", m.marketing.leads], ["Qualified leads", m.marketing.qualified], ["Cost per lead", C.money(m.marketing.cpl)], ["Cost per order (CAC)", C.money(m.marketing.cac)]])}
      ${sec("Vendor & affiliate channel", [["Active partners", m.vendor.partners], ["Referrals sent", m.vendor.referrals], ["Conversion", C.pct(m.vendor.conversion)], ["Commission cost", C.money(m.vendor.commission)]])}
      ${sec("Sales", [["Enquiry → order", C.pct(m.sales.conversion)], ["Orders", m.sales.orders], ["Average order value", C.money(m.sales.aov)], ["Sales cycle", `${n(m.sales.cycle, 1)} d`], ["Lost", m.sales.lost]])}
      ${sec("Production", [["Turnaround", `${n(m.production.turnaround, 1)} d`], ["Revisions / order", n(m.production.revisions, 1)], ["On-time delivery", C.pct(m.production.onTime)], ["Active", m.production.active], ["Overdue now", m.production.overdue]])}
      ${sec("Quality", [["Defects (QA)", m.quality.defects], ["Complaints", m.quality.complaints], ["Rework (QA fails)", m.quality.rework], ["Satisfaction", Number.isFinite(m.quality.csat) ? `${n(m.quality.csat, 1)} ★` : "—"]])}
      ${sec("Finance", [["Revenue", C.money(m.finance.revenue)], ["Gross margin", `${C.money(m.finance.gross)}`, C.pct(m.finance.grossPct)], ["Contribution", C.money(m.finance.contribution), C.pct(m.finance.contributionPct)], ["Outstanding", C.money(m.finance.outstanding)], ["Refunds", C.money(m.finance.refunds)]])}
      ${sec("Retention", [["Reviews", m.retention.reviews], ["Referral rate", C.pct(m.retention.referralRate)], ["Repeat clients", m.retention.repeat]])}
      <div class="two"><div class="card"><h3 style="margin-bottom:10px">Leads by source</h3>${bars(m.bySource)}</div>
        <div class="card"><h3 style="margin-bottom:10px">Why leads were lost</h3>${bars(m.lostReasons)}</div></div>
      <div class="card stack"><h3>Traffic & spend inputs</h3><p class="small muted">Enter monthly website visitors and channel spend so cost-per-lead and CAC are real.</p>
        <form class="row" data-form="trafficAdd"><input type="month" name="month" value="${C.today().slice(0, 7)}" style="width:auto" required><input type="number" name="visitors" placeholder="Visitors" style="width:130px" required><button class="btn sm">Save visitors</button></form>
        <form class="row" data-form="spendAdd"><input type="month" name="month" value="${C.today().slice(0, 7)}" style="width:auto" required><select name="channel" style="width:auto">${SOURCES.map((s) => `<option>${esc(s)}</option>`).join("")}</select><input type="number" name="amount" placeholder="₹ spend" style="width:120px" required><button class="btn sm">Add spend</button></form>
      </div>
    </div>`,
  };
}

// ── Comms ───────────────────────────────
const AUDIENCES = {
  "clients-active": ["Clients · active projects", () => db.projects.filter((p) => p.status === "active")],
  "clients-intake": ["Clients · details missing", () => db.projects.filter((p) => p.status === "active" && p.stage <= 2 && C.checklistDone(p) < C.checklist(p).length)],
  "clients-review": ["Clients · preview to review", () => db.projects.filter((p) => p.status === "active" && p.stage === 4)],
  "clients-delivered": ["Clients · delivered", () => db.projects.filter((p) => p.status === "delivered")],
  designers: ["Designers & freelancers", () => db.users.filter((u) => ["designer", "freelancer", "qa"].includes(u.role) && u.active !== false)],
  affiliates: ["Affiliates & vendors", () => db.users.filter((u) => u.role === "affiliate" && u.active !== false)],
};
function fill(body, r) {
  const isP = !!r.code && !!r.token;
  return body.replace(/\{\{name\}\}/g, isP ? r.clientName : r.name.split(" ·")[0])
    .replace(/\{\{link\}\}/g, isP ? clientLink(r) : location.origin + location.pathname)
    .replace(/\{\{code\}\}/g, r.refCode || r.code || "")
    .replace(/\{\{round\}\}/g, isP ? `round ${r.revisions.length}` : "");
}
function comms([tab = "broadcast"]) {
  const T = [["broadcast", "Broadcast"], ["templates", "Templates"], ["history", "History"]];
  const body = {
    broadcast: () => `
      <form class="card form" data-form="bcPrepare" style="max-width:720px">
        <h3>New broadcast</h3>
        ${field("Send to", select("audience", Object.entries(AUDIENCES).map(([k, [l, f]]) => [k, `${l} (${f().length})`])))}
        ${field("Template", select("tpl", [["", "— write your own —"], ...db.msgTemplates.map((t) => [t.id, t.name])], "", 'data-change="bcTpl"'))}
        ${field("Message", textarea("body", "", 'required rows="4" placeholder="Use {{name}}, {{link}}, {{code}}"'), "placeholders are filled per person")}
        ${field("Channel", select("channel", [["whatsapp", "WhatsApp (one tap per person)"], ["email", "Email (one message, BCC)"]]))}
        <button class="btn primary">${icon("send", "icon sm")} Prepare</button>
      </form>`,
    templates: () => `<div class="stack">
      <form class="card form" data-form="tmSave"><h3>Add template</h3>
        <div class="cols">${field("Name", input("name", "", "text", "required"))}${field("Audience", select("audience", [["clients", "Clients"], ["designers", "Designers"], ["affiliates", "Affiliates"]]))}</div>
        ${field("Message", textarea("body", "", "required"), "use {{name}}, {{link}}, {{code}}, {{round}}")}<button class="btn primary">Save</button></form>
      ${db.msgTemplates.map((t) => `<div class="card"><div class="row between"><h4>${esc(t.name)}</h4><span class="row">${badge(t.audience, "gold")}<button class="btn sm ghost danger" data-act="tmDel" data-id="${t.id}">${icon("trash", "icon sm")}</button></span></div><p class="small" style="margin-top:6px">${esc(t.body)}</p></div>`).join("")}</div>`,
    history: () => `<div class="card" style="padding:4px 16px"><div class="list">${db.broadcasts.slice().reverse().map((b) => `<div class="item">${icon(b.channel === "email" ? "mail" : "message")}<div class="grow"><div class="item-t">${esc(b.audienceLabel)}</div><div class="item-s ellipsis">${esc(b.body)}</div></div><span class="tiny muted">${b.count} · ${C.ago(b.at)}</span></div>`).join("") || empty("No broadcasts yet", "", "send")}</div></div>`,
  }[tab]?.() || "";
  return { title: "Communications", subtitle: "Broadcast to clients, designers or partners, and manage message templates.", html: tabs(T, tab, "#/comms") + body };
}

// ── Studio settings ─────────────────────
function studio() {
  const s = C.S();
  return {
    title: "Prices & policies", subtitle: "Tiers, add-ons, commission, costs, SLAs and refund policy.", back: "#/settings",
    html: `
    <form class="form" data-form="studioSave" style="max-width:820px">
      <div class="card form"><h3>Contact & payments</h3>
        <div class="cols">${field("Studio name", input("studio", s.studio))}${field("WhatsApp number", input("whatsapp", s.whatsapp, "tel"))}${field("Email", input("email", s.email, "email"))}</div>
        <div class="cols">${field("UPI ID", input("upiId", s.upiId))}${field("UPI payee name", input("upiName", s.upiName))}${field("GSTIN", input("gstin", s.gstin))}</div>
        ${field("Address", input("address", s.address))}</div>
      <div class="card form"><h3>Tiers</h3>${Object.entries(s.tiers).map(([k, t]) => `
        <div class="cols">${field(t.name + " price ₹", input(`t_${k}_price`, t.price, "number"))}${field("Revision rounds (99 = unlimited)", input(`t_${k}_revisions`, t.revisions, "number"))}${field("Turnaround days", input(`t_${k}_days`, t.days, "number"))}</div>`).join("")}</div>
      <div class="card form"><h3>Add-ons</h3>${s.addons.map((a) => `<div class="cols">${field("Name", input(`a_${a.id}_name`, a.name))}${field("Price ₹", input(`a_${a.id}_price`, a.price, "number"))}</div>`).join("")}</div>
      <div class="card form"><h3>Booking capacity</h3>
        <p class="small muted" style="margin:0">Clients see how many new invitation orders you're accepting, e.g. “Only 3 of 5 slots left for the next 7 days”. When full, new requests join a waitlist.</p>
        ${checkbox("capEnabled", s.capacity?.enabled, "Show booking capacity to clients")}
        <div class="cols">${field("Orders accepted per window", input("capSlots", s.capacity?.slots || 5, "number", 'min="1" max="200"'))}${field("Window length (days)", input("capDays", s.capacity?.days || 7, "number", 'min="1" max="60"'))}${field("Window starts", input("capStart", s.capacity?.start || C.today(), "date"), "then repeats")}</div></div>
      <div class="card form"><h3>Commission & costs</h3>
        <div class="cols">${["basic", "premium", "luxury"].map((t) => field(`${s.tiers[t].name} commission %`, input(`c_${t}`, s.commission[t], "number", 'step="0.5"'))).join("")}</div>
        <div class="cols">${field("Rush fee %", input("rushFee", s.rushFee, "number"))}${field("Design cost ₹/hour", input("hourlyCost", s.hourlyCost, "number"))}${field("Hosting ₹/order", input("hostingCost", s.hostingCost, "number"))}${field("Gateway fee %", input("gatewayFee", s.gatewayFee, "number", 'step="0.1"'))}${field("Cost per revision ₹", input("revisionCost", s.revisionCost, "number"))}</div></div>
      <div class="card form"><h3>SLA days per stage</h3><div class="cols">${STAGES.map((st, i) => field(st.name, input(`sla_${i}`, s.slaDays[i], "number", 'min="0"'))).join("")}</div></div>
      <div class="card form"><h3>Cancellation & refund policy</h3>${field("Policy text (shown to clients)", textarea("policyText", s.policy.text))}
        <div class="label">Refund % if cancelled at each stage</div><div class="cols">${STAGES.map((st, i) => field(st.name, input(`rf_${i}`, s.policy.refundPct[i], "number", 'min="0" max="100"'))).join("")}</div></div>
      <button class="btn primary">Save settings</button>
    </form>`,
  };
}

// ── routes ──────────────────────────────
export const routes = {
  dashboard, leads, lead: leadDetail, projects, people, person, finance, invoice, content, compliance, metrics: metricsView, comms, studio,
  project: ([id, tab = "overview", ...rest], user) => { const p = byId("projects", id); return p ? projectView(p, user, tab, "#/project", rest) : null; },
};

// ── actions ─────────────────────────────
act({
  leadChip: (el) => { ui.leadStage = el.dataset.v; routesRefresh(); },
  leadSearch: (el) => { ui.leadQ = el.value; routesRefresh(); },
  leadNew: () => sheet("New lead", leadForm()),
  leadEdit: (el) => sheet("Edit lead", leadForm(byId("leads", el.dataset.id))),
  leadSave: (d, f) => {
    let l = f.dataset.id && byId("leads", f.dataset.id);
    if (!l) { l = { id: uid("l"), stage: "new", notes: [], createdAt: now() }; db.leads.push(l); }
    Object.assign(l, { name: d.name, phone: d.phone.replace(/\D/g, ""), email: d.email, city: d.city, weddingDate: d.weddingDate, interest: d.interest, source: d.source, refCode: d.refCode });
    if (d.note) l.notes.push({ at: now(), by: "Admin", text: d.note });
    C.attributeLead(l);
    closeSheet();
    commit(f.dataset.id ? "Edited lead" : "Added lead", l.name, l.affiliateId ? `attributed to ${userName(l.affiliateId)}` : l.source);
    go(`/lead/${l.id}`);
  },
  leadStage: (el) => { closeSheet(); const l = byId("leads", el.dataset.id); l.stage = el.dataset.v; commit("Lead stage", l.name, el.dataset.v); },
  leadLost: (el) => sheet("Mark as lost", `<form class="form" data-form="leadLostGo" data-id="${el.dataset.id}">
      <p class="small muted">Logging why helps fix the sales process later.</p>
      ${field("Reason", select("reason", LOST_REASONS))}${field("Details", input("note"))}<button class="btn danger">Mark lost</button></form>`),
  leadLostGo: (d, f) => { const l = byId("leads", f.dataset.id); Object.assign(l, { stage: "lost", lostReason: d.reason, lostNote: d.note, lostAt: now() }); closeSheet(); commit("Lead lost", l.name, d.reason); },
  leadNote: (d, f) => { const l = byId("leads", f.dataset.id); l.notes.push({ at: now(), by: "Admin", text: d.text }); commit("Lead note", l.name); },
  quoteCalc: (el) => { const f = el.closest("form"); f.querySelector("[data-quote-total]").textContent = C.money(C.quoteTotal(readQuote(f))); },
  quoteSave: (d, f) => {
    const l = byId("leads", f.dataset.id);
    const q = readQuote(f);
    l.quote = { ...q, total: C.quoteTotal(q), at: now() };
    if (["new", "contacted"].includes(l.stage)) l.stage = "quoted";
    commit("Quote saved", l.name, C.money(l.quote.total));
    toast("Quote saved");
  },
  quoteSend: (el) => {
    const f = el.closest("form"); const l = byId("leads", el.dataset.id);
    const q = readQuote(f);
    const text = `Namaste ${l.name} 🙏 Here is your BFI invitation quote:\n${C.quoteLines(q).map((x) => `• ${x.label}: ${C.money(x.amount)}`).join("\n")}\nTotal: ${C.money(C.quoteTotal(q))}\n\n${C.S().policy.text}`;
    window.open(wa(l.phone, text), "_blank");
  },
  leadConvert: (el) => {
    const l = byId("leads", el.dataset.id);
    const q = readQuote(el.closest("form"));
    const p = createProjectFromLead(l, q);
    commit("Converted lead", l.name, `${p.code} · ${C.money(p.price)}`);
    toast(`${p.code} created — assign a designer`);
    go(`/project/${p.id}`);
  },
  projChip: (el) => { ui.projFilter = el.dataset.v; routesRefresh(); },
  projSearch: (el) => { ui.projQ = el.value; routesRefresh(); },
  projBoard: () => { ui.projBoard = !ui.projBoard; routesRefresh(); },
  personNew: () => sheet("Add person", personForm()),
  personRole: (el) => { const f = el.closest("form"); f.querySelectorAll("[data-role-block]").forEach((b) => (b.hidden = b.dataset.roleBlock !== el.value)); },
  personSave: (d, f) => {
    let u = f.dataset.id && byId("users", f.dataset.id);
    if (!u) { u = { id: uid("u"), active: true, createdAt: now(), payout: {} }; db.users.push(u); }
    Object.assign(u, { name: d.name, role: d.role, email: d.email, phone: d.phone.replace(/\D/g, "") });
    if (d.role === "affiliate") {
      let code = (d.refCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!code) code = d.name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) + Math.floor(10 + Math.random() * 89);
      if (db.users.some((x) => x.id !== u.id && x.refCode === code)) { toast("That referral code is taken"); return; }
      const co = {};
      ["basic", "premium", "luxury"].forEach((t) => { if (d[`co_${t}`] !== "") co[t] = Number(d[`co_${t}`]); });
      Object.assign(u, { partnerType: d.partnerType, partnerKind: d.partnerKind, refCode: code, tradeLimit: Number(d.tradeLimit) || 3, commissionOverride: co });
    }
    if (d.role === "freelancer") Object.assign(u, { accessUntil: d.accessUntil, projectIds: d.projectIds || [] });
    closeSheet();
    commit(f.dataset.id ? "Edited person" : "Added person", u.name, ROLES[u.role].name);
    toast("Saved");
    if (!f.dataset.id) go(`/person/${u.id}`);
  },
  personToggle: (el) => { const u = byId("users", el.dataset.id); u.active = u.active === false; commit(u.active ? "Reactivated" : "Deactivated", u.name); },
  tradeToAff: (el) => { const u = byId("users", el.dataset.id); u.partnerType = "affiliate"; const v = db.vendors.find((x) => x.partnerId === u.id); if (v) v.stage = "affiliate"; commit("Trade → affiliate", u.name); },
  payoutNew: (el) => {
    const u = byId("users", el.dataset.id);
    const owed = db.commissions.filter((c) => c.partnerId === u.id && c.status === "owed");
    sheet(`Pay out ${u.name}`, `<form class="form" data-form="payoutGo" data-id="${u.id}">
      <div class="list">${owed.map((c) => checkbox("ids[]", true, `${esc(byId("projects", c.projectId)?.code)} · ${C.money(c.amount)}`, c.id)).join("")}</div>
      <p class="small">Send to: <b>${esc(u.payout?.upi || u.payout?.bank || "no payout details on file")}</b></p>
      ${field("Payment reference", input("ref", "", "text", 'required placeholder="UPI / NEFT reference"'))}
      <button class="btn primary">Mark as paid</button></form>`);
  },
  payoutGo: (d, f) => {
    const ids = d.ids || [];
    if (!ids.length) return;
    const cs = db.commissions.filter((c) => ids.includes(c.id));
    const po = { id: uid("po"), partnerId: f.dataset.id, amount: cs.reduce((s, c) => s + c.amount, 0), at: now(), ref: d.ref, entries: ids };
    cs.forEach((c) => { c.status = "paid"; c.payoutId = po.id; });
    db.payouts.push(po);
    closeSheet();
    commit("Payout", userName(f.dataset.id), `${C.money(po.amount)} · ${d.ref}`);
  },
  trendN: (el) => { ui.trendN = Number(el.value); routesRefresh(); },
  leadSource: (el) => { ui.leadSource = el.value; routesRefresh(); },
  leadDate: (el) => { ui.leadDate = el.value; routesRefresh(); },
  leadMenu: (el) => {
    const l = byId("leads", el.dataset.id);
    sheet(l.name, `<div class="menu-list">
      <a href="#/lead/${l.id}" data-act="navTo" data-to="#/lead/${l.id}">${icon("eye")}<span class="grow">Open & build quote</span></a>
      ${l.phone ? `<a href="${attr(wa(l.phone, `Namaste ${l.name} 🙏 Thank you for your enquiry with BFI — Marwari Invitations.`))}" target="_blank" rel="noopener">${icon("message")}<span class="grow">WhatsApp</span></a><a href="tel:+${attr(l.phone)}">${icon("phone")}<span class="grow">Call</span></a>` : ""}
      ${!["converted", "lost"].includes(l.stage) ? `<button data-act="leadStage" data-id="${l.id}" data-v="contacted">${icon("check")}<span class="grow">Mark contacted</span></button><button data-act="leadLost" data-id="${l.id}">${icon("x")}<span class="grow">Mark lost…</span></button>` : ""}
    </div>`);
  },
  tplSearch: (el) => { ui.tplQ = el.value; routesRefresh(); },
  tplTier: (el) => { ui.tplTier = el.value; routesRefresh(); },
  tplNew: () => sheet("Add template", `<form class="form" data-form="tplSave">
      <div class="cols">${field("Name", input("name", "", "text", "required"))}${field("Main tier", select("tier", Object.entries(C.S().tiers).map(([k, t]) => [k, t.name]), "premium"))}</div>
      ${field("Tags", input("tags", "", "text", 'placeholder="haveli, gold, minimal"'))}
      ${field("Cover style", select("art", [["royal-heritage", "Maroon & gold"], ["mandap-magic", "Ivory floral"], ["golden-elegance", "Red ornate"], ["desert-dreams", "Sand minimal"], ["marwari-classic", "Classic red"], ["royal-palace", "Black & gold"]]))}
      ${field("Preview link", input("previewUrl", "", "url"))}
      <div><div class="label">Available in</div><div class="row">${Object.entries(C.S().tiers).map(([k, t]) => checkbox("tiers[]", true, esc(t.name), k)).join("")}</div></div>
      <button class="btn primary">Add template</button></form>`),
  tplMenu: (el) => {
    const t = byId("templates", el.dataset.id);
    sheet(t.name, `<div class="stack"><div class="tpl" style="max-width:240px;margin:0 auto"><div class="art">${templateArt(t)}</div></div>
      <div class="menu-list">${t.previewUrl ? `<a href="${attr(t.previewUrl)}" target="_blank" rel="noopener">${icon("eye")}<span class="grow">Open preview</span></a>` : ""}
      <button data-act="tplToggle" data-id="${t.id}">${icon(t.status === "active" ? "x" : "refresh")}<span class="grow">${t.status === "active" ? "Retire template" : "Restore template"}</span></button></div></div>`);
  },
  tplSave: (d) => { db.templates.push({ id: uid("t"), name: d.name, art: d.art, tier: d.tier, tags: d.tags.split(",").map((x) => x.trim()).filter(Boolean), tiers: d.tiers?.length ? d.tiers : [d.tier], previewUrl: d.previewUrl, status: "active" }); closeSheet(); commit("Added template", d.name); },
  tplToggle: (el) => { closeSheet(); const t = byId("templates", el.dataset.id); t.status = t.status === "active" ? "retired" : "active"; commit(t.status === "active" ? "Restored template" : "Retired template", t.name); },
  libAdd: async (d) => {
    const f = d.files?.[0];
    if (d.source === "customer" && !d.projectId) { toast("Pick the project this customer content came from"); return; }
    const fileId = f ? await putFile(f) : null;
    db.library.push({ id: uid("a"), title: d.title, kind: d.kind, source: d.source, projectId: d.projectId || null, status: "pending", url: d.url, fileId, fileKind: f ? (f.type.startsWith("video") ? "video" : f.type === "application/pdf" ? "pdf" : "image") : null, at: now() });
    commit("Library upload", d.title, d.source);
  },
  libStatus: (el) => {
    const a = byId("library", el.dataset.id);
    const p = a.projectId && byId("projects", a.projectId);
    if (el.dataset.v === "approved" && a.source === "customer" && !(p && p.consent.photos && p.consent.showcase)) { toast("Client hasn't consented to photo/showcase use"); return; }
    a.status = el.dataset.v;
    commit(a.status === "approved" ? "Approved asset" : "Rejected asset", a.title);
  },
  tstApprove: (el) => {
    const p = byId("projects", el.dataset.id);
    if (!p.review.approved && !(p.review.consentPublic && p.consent.testimonial)) { toast("Consent isn't logged"); return; }
    p.review.approved = !p.review.approved;
    commit(p.review.approved ? "Approved testimonial" : "Withdrew testimonial", p.code);
  },
  tstNudge: (el) => {
    const p = byId("projects", el.dataset.id);
    const t = db.msgTemplates.find((m) => m.id === "m4");
    window.open(wa(p.phone, fill(t?.body || "Shubh vivah {{name}}! Could you leave us a short review? {{link}}", p) + "/review"), "_blank");
    p.testimonialRequest = { ...(p.testimonialRequest || {}), sentAt: now() };
    commit("Testimonial request", p.code);
  },
  docAdd: async (d) => {
    const f = d.files?.[0];
    db.documents.push({ id: uid("d"), title: d.title, kind: d.kind, partyId: d.partyId || null, signedAt: d.signedAt, fileId: f ? await putFile(f) : null });
    commit("Stored document", d.title, d.kind);
  },
  auditCsv: () => download("bfi-audit-log.csv", C.csv(db.audit.map(({ at: t, by, action, entity, detail }) => ({ at: t, by, action, entity, detail }))), "text/csv"),
  rangeChip: (el) => { ui.range = el.dataset.v; if (ui.range === "custom" && !ui.from) { ui.from = C.addDays(-90); ui.to = C.today(); } routesRefresh(); },
  rangeFrom: (el) => { ui.from = el.value; routesRefresh(); },
  rangeTo: (el) => { ui.to = el.value; routesRefresh(); },
  channelSel: (el) => { ui.channel = el.value; routesRefresh(); },
  metricsCsv: () => {
    const r = rangeDates();
    const m = C.metrics({ ...r, channel: ui.channel });
    const rows = [];
    for (const [area, vals] of Object.entries(m)) if (!["lostReasons", "bySource"].includes(area)) for (const [k, v] of Object.entries(vals)) rows.push({ area, metric: k, value: Number.isFinite(v) ? Math.round(v * 100) / 100 : "" });
    Object.entries(m.lostReasons).forEach(([k, v]) => rows.push({ area: "lost reasons", metric: k, value: v }));
    Object.entries(m.bySource).forEach(([k, v]) => rows.push({ area: "leads by source", metric: k, value: v }));
    const head = `# BFI metrics ${r.from || "start"} to ${r.to || "today"}${ui.channel ? " · " + ui.channel : ""}\n`;
    download(`bfi-metrics-${C.today()}.csv`, head + C.csv(rows), "text/csv");
    const proj = db.projects.map((p) => { const mm = C.margin(p); return { code: p.code, client: p.clientName, tier: p.tier, channel: C.projectChannel(p), stage: C.stageName(p.stage), status: p.status, created: p.createdAt.slice(0, 10), due: p.dueDate, delivered: p.deliveredAt?.slice(0, 10) || "", price: p.price, paid: C.paid(p), contribution: mm.contribution, revisions: p.revisions.length }; });
    setTimeout(() => download(`bfi-projects-${C.today()}.csv`, C.csv(proj), "text/csv"), 400);
  },
  trafficAdd: (d) => { const e = db.traffic.find((t) => t.month === d.month); if (e) e.visitors = Number(d.visitors); else db.traffic.push({ id: uid("tr"), month: d.month, visitors: Number(d.visitors) }); commit("Traffic", d.month, d.visitors); toast("Saved"); },
  spendAdd: (d) => { db.spend.push({ id: uid("sp"), month: d.month, channel: d.channel, amount: Number(d.amount) }); commit("Spend", d.channel, C.money(d.amount)); toast("Saved"); },
  bcTpl: (el) => { const t = byId("msgTemplates", el.value); if (t) el.closest("form").body.value = t.body; },
  bcPrepare: (d) => {
    const [label, fn] = AUDIENCES[d.audience];
    const people = fn();
    if (!people.length) { toast("Nobody in that audience"); return; }
    const isClient = d.audience.startsWith("clients");
    const rows = people.map((r) => ({ name: isClient ? r.clientName : r.name, phone: r.phone, email: r.email, text: fill(d.body, r) }));
    db.broadcasts.push({ id: uid("bc"), at: now(), audience: d.audience, audienceLabel: label, body: d.body, channel: d.channel, count: rows.length });
    commit("Broadcast", label, `${rows.length} recipient(s) via ${d.channel}`);
    if (d.channel === "email") {
      const bcc = rows.map((r) => r.email).filter(Boolean).join(",");
      location.href = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent("BFI — Marwari Invitations")}&body=${encodeURIComponent(d.body.replace(/\{\{\w+\}\}/g, ""))}`;
      return;
    }
    sheet(`Send to ${rows.length}`, `<p class="small muted">Tap each to open WhatsApp with the personalised message.</p><div class="list">${rows.map((r) => `
      <div class="item">${avatar(r.name)}<div class="grow"><div class="item-t">${esc(r.name)}</div><div class="item-s ellipsis">${esc(r.text)}</div></div>
      ${r.phone ? `<a class="btn sm primary" target="_blank" rel="noopener" href="${attr(wa(r.phone, r.text))}" data-act="bcSent">${icon("send", "icon sm")}</a>` : badge("No phone", "line")}</div>`).join("")}</div>`);
  },
  bcSent: (el) => { window.open(el.href, "_blank"); el.classList.remove("primary"); el.innerHTML = icon("check", "icon sm"); },
  tmSave: (d) => { db.msgTemplates.push({ id: uid("m"), name: d.name, audience: d.audience, body: d.body }); commit("Message template", d.name); },
  tmDel: (el) => confirmSheet("Delete template?", "", () => { db.msgTemplates = db.msgTemplates.filter((m) => m.id !== el.dataset.id); commit("Deleted template", el.dataset.id); }, "Delete"),
  studioSave: (d) => {
    const s = C.S();
    ["studio", "whatsapp", "email", "upiId", "upiName", "gstin", "address"].forEach((k) => (s[k] = d[k]));
    for (const k of Object.keys(s.tiers)) ["price", "revisions", "days"].forEach((f) => (s.tiers[k][f] = Number(d[`t_${k}_${f}`]) || 0));
    s.addons.forEach((a) => { a.name = d[`a_${a.id}_name`]; a.price = Number(d[`a_${a.id}_price`]) || 0; });
    ["basic", "premium", "luxury"].forEach((t) => (s.commission[t] = Number(d[`c_${t}`]) || 0));
    ["rushFee", "hourlyCost", "hostingCost", "gatewayFee", "revisionCost"].forEach((k) => (s[k] = Number(d[k]) || 0));
    s.slaDays = STAGES.map((_, i) => Number(d[`sla_${i}`]) || 0);
    s.capacity = { enabled: d.capEnabled, slots: Math.max(1, Number(d.capSlots) || 5), days: Math.max(1, Number(d.capDays) || 7), start: d.capStart || C.today() };
    s.policy = { text: d.policyText, refundPct: STAGES.map((_, i) => Number(d[`rf_${i}`]) || 0) };
    commit("Studio settings", "Settings");
    toast("Settings saved");
  },
});

// UI-only state changes re-render without writing data.
function routesRefresh() { window.dispatchEvent(new HashChangeEvent("hashchange")); }
export { routesRefresh, fill };
