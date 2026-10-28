// Marketing & sales outreach: vendor CRM, campaign calendar, lead source
// & CAC, testimonial requests, SEO tracker, paid-ads planning, referral
// codes and the asset library.

import { db, commit, byId, uid, now, currentUser } from "../db.js";
import { OUTREACH_STAGES, VENDOR_KINDS, SOURCES } from "../seed.js";
import { icon } from "../icons.js";
import { esc, attr, act, sheet, closeSheet, toast, badge, empty, kpi, field, input, textarea, select, stateTabs, wa, avatar, go, rtable, monthCalendar, donut, srcBadge } from "../ui.js";
import * as C from "../calc.js";
import { coupleName, projectTitle, hydrateFiles, thumb } from "./project.js";
import { libraryTab, testimonialsTab, routesRefresh, fill } from "./admin.js";

const ui = { tab: "all", q: "", kind: "", sort: "follow", calY: new Date().getFullYear(), calM: new Date().getMonth(), tTab: "pending", srcDays: "30" };
export const enquireLink = (code) => `${location.origin}${location.pathname}#/enquire/${encodeURIComponent(code)}`;
const pitch = (v) => `Namaste ${v.contact || v.name} 🙏 I'm from BFI — Marwari Invitations. We build premium digital wedding invitations made only for Marwari weddings. For your next 2–3 couples we'd love to create their invitation free/at a deep discount — with credit to you on the invite. Can I share a sample?`;
const KINDS = { email: "Email campaign", social: "Social media", vendor: "Vendor outreach", content: "Content creation" };

// Marketing sub-navigation, shown to admin (marketing has these in the main nav).
function growthTabs(active) {
  if (currentUser()?.role !== "admin") return "";
  const T = [["outreach", "Outreach CRM"], ["campaigns", "Campaigns"], ["sources", "Lead Source & CAC"], ["testimonials", "Testimonials"], ["seo", "SEO"], ["ads", "Paid Ads"], ["referrals", "Referral codes"], ["library", "Assets"]];
  return `<nav class="tabs">${T.map(([k, l]) => `<a href="#/${k}" class="${k === active ? "on" : ""}">${l}</a>`).join("")}</nav>`;
}

// ── Dashboard ───────────────────────────
function mhome() {
  const due = db.vendors.filter((v) => !["declined", "affiliate"].includes(v.stage) && v.nextFollowUp && v.nextFollowUp <= C.today());
  const soon = db.campaigns.filter((c) => c.status !== "posted" && c.date >= C.today() && c.date <= C.addDays(7));
  const monthLeads = db.leads.filter((l) => l.createdAt.slice(0, 7) === C.today().slice(0, 7));
  const tReq = db.projects.filter((p) => p.status === "delivered" && !p.review && !p.testimonialRequest?.declined);
  return {
    title: `Namaste, ${currentUser().name.split(" ")[0]}`, subtitle: "Build partnerships. Drive awareness.",
    html: `<div class="stack lg">
      <div class="grid kpi">
        ${kpi("Follow-ups due", due.length, due.length ? `<span style="color:var(--bad)">act today</span>` : "all caught up")}
        ${kpi("Active partners", db.users.filter((u) => u.role === "affiliate" && u.active !== false).length)}
        ${kpi("Leads this month", monthLeads.length, `${monthLeads.filter((l) => l.affiliateId || l.referrerProjectId).length} via referrals`, C.delta(db.leads, (l) => l.createdAt))}
        ${kpi("Campaigns next 7 days", soon.length)}
      </div>
      <div class="two">
        <div class="card pad0"><div class="card-head" style="padding:16px 18px 0"><h3>Follow-ups due</h3><a class="small" href="#/outreach">Outreach CRM</a></div>
          ${rtable([{ label: "Vendor" }, { label: "Type" }, { label: "Stage", cls: "pill" }, { label: "Next follow-up" }], due.map((v) => [`<span class="t">${esc(v.name)}</span>`, esc(v.kind), stageBadge(v.stage), C.date(v.nextFollowUp)]), { empty: "No follow-ups due.", href: (i) => `#/vendor/${due[i].id}` })}</div>
        <div class="stack">
          <div class="card"><div class="card-head"><h3>Coming up</h3><a class="small" href="#/campaigns">Calendar</a></div>
            ${soon.length ? `<div class="list">${soon.map((c) => `<div class="item"><span class="ev k-${c.kind || "social"}" style="padding:2px 6px;border-radius:4px;font-size:11px">${esc(KINDS[c.kind] || "Post")}</span><div class="grow small"><b>${esc(c.title)}</b><div class="muted">${C.date(c.date)} · ${esc(c.channel)}</div></div></div>`).join("")}</div>` : `<p class="small muted" style="margin:0">Nothing scheduled this week.</p>`}</div>
          <div class="card"><div class="card-head"><h3>Testimonials to collect</h3><a class="small" href="#/testimonials">All</a></div>
            ${tReq.length ? `<div class="list">${tReq.map((p) => `<div class="item"><div class="grow item-t">${esc(projectTitle(p))}</div>${badge(p.testimonialRequest?.sentAt ? "Requested" : "Not asked", p.testimonialRequest?.sentAt ? "warn" : "bad")}</div>`).join("")}</div>` : `<p class="small muted" style="margin:0">Every delivered couple has reviewed.</p>`}</div>
        </div>
      </div>
    </div>`,
  };
}

// ── Outreach CRM ────────────────────────
const vTone = { identified: "line", pitched: "violet", talking: "warn", trade: "ok", affiliate: "ok", declined: "bad" };
const stageBadge = (k) => badge(OUTREACH_STAGES.find((s) => s.key === k)?.name || k, vTone[k]);
const TAB_STAGES = { all: null, invited: ["identified", "pitched"], talking: ["talking"], agreed: ["trade", "affiliate"], rejected: ["declined"] };
function outreach() {
  const q = ui.q.toLowerCase();
  const inTab = (v, t) => !TAB_STAGES[t] || TAB_STAGES[t].includes(v.stage);
  const list = db.vendors.filter((v) => inTab(v, ui.tab) && (!ui.kind || v.kind === ui.kind) && (!q || `${v.name} ${v.contact} ${v.city} ${v.handle}`.toLowerCase().includes(q)))
    .sort((a, b) => (ui.sort === "new" ? b.createdAt.localeCompare(a.createdAt) : (a.nextFollowUp || "9").localeCompare(b.nextFollowUp || "9")));
  const n = (t) => db.vendors.filter((v) => inTab(v, t)).length;
  return {
    title: "Vendor & Creator Outreach", subtitle: "Manage partnerships and follow-ups.", fab: { act: "vendorNew", label: "Add vendor" },
    actions: `<button class="btn primary" data-act="vendorNew">${icon("plus", "icon sm")} Add vendor</button>`,
    html: `${growthTabs("outreach")}<div class="card pad0">
      ${stateTabs([["all", "All", n("all")], ["invited", "Invited", n("invited")], ["talking", "In Discussion", n("talking")], ["agreed", "Agreed", n("agreed")], ["rejected", "Rejected", n("rejected")]], ui.tab, "vTab")}
      <div class="toolbar">
        <div class="search">${icon("search", "icon sm")}<input type="search" placeholder="Search vendors…" value="${attr(ui.q)}" data-input="vSearch" aria-label="Search vendors"></div>
        <select data-change="vKind" aria-label="Filter by type"><option value="">All types</option>${VENDOR_KINDS.map((k) => `<option ${ui.kind === k ? "selected" : ""}>${esc(k)}</option>`).join("")}</select>
        <select data-change="vSort" aria-label="Sort"><option value="follow" ${ui.sort === "follow" ? "selected" : ""}>Next follow-up</option><option value="new" ${ui.sort === "new" ? "selected" : ""}>Newest</option></select>
      </div>
      ${rtable([{ label: "Vendor" }, { label: "Type" }, { label: "Stage", cls: "pill" }, { label: "Next follow-up" }, { label: "", cls: "act" }],
        list.map((v) => {
          const late = v.nextFollowUp && v.nextFollowUp < C.today() && !["declined", "affiliate"].includes(v.stage);
          return [`<span class="t" style="color:var(--info)">${esc(v.name)}</span><div class="s">${esc(v.contact || "")}${v.city ? " · " + esc(v.city) : ""}</div>`, esc(v.kind), stageBadge(v.stage), `<span style="${late ? "color:var(--bad);font-weight:600" : ""}">${C.date(v.nextFollowUp)}</span>`, `<button class="icon-btn plain" data-act="vMenu" data-id="${v.id}" aria-label="Actions">${icon("more")}</button>`];
        }), { empty: "No vendors here. Add planners, photographers, MUAs, venues and creators.", href: (i) => `#/vendor/${list[i].id}` })}
    </div>`,
    after: (root) => { const s = root.querySelector("[data-input=vSearch]"); if (ui.q && s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } },
  };
}
function vendorForm(v = {}) {
  return `<form class="form" data-form="vendorSave" data-id="${v.id || ""}">
    <div class="cols">${field("Business name", input("name", v.name, "text", "required"))}${field("Contact person", input("contact", v.contact))}</div>
    <div class="cols">${field("Type", select("kind", VENDOR_KINDS, v.kind))}${field("City", input("city", v.city))}</div>
    <div class="cols">${field("Phone", input("phone", v.phone, "tel"))}${field("Instagram", input("handle", v.handle, "text", 'placeholder="@handle"'))}</div>
    ${field("Trade terms offered", input("terms", v.terms, "text", 'placeholder="e.g. free Basic invite for next 3 clients + tag"'))}
    ${field("Next follow-up", input("nextFollowUp", v.nextFollowUp || C.addDays(2), "date"))}
    <div><button class="btn primary">${v.id ? "Save" : "Add vendor"}</button></div></form>`;
}
function vendor([id]) {
  const v = byId("vendors", id);
  if (!v) return null;
  const partner = v.partnerId && byId("users", v.partnerId);
  return {
    title: v.name, subtitle: `${v.kind}${v.city ? " · " + v.city : ""}`, back: "#/outreach", actions: stageBadge(v.stage),
    html: `<div class="two">
      <div class="stack">
        <div class="card stack">
          <div class="label">Pitch stage</div>
          <div class="chips" style="flex-wrap:wrap">${OUTREACH_STAGES.map((s) => `<button class="chip ${v.stage === s.key ? "on" : ""}" data-act="vSet" data-id="${v.id}" data-v="${s.key}">${s.name}</button>`).join("")}</div>
          <div class="row">
            ${v.phone ? `<a class="btn sm primary" target="_blank" rel="noopener" href="${attr(wa(v.phone, pitch(v)))}" data-act="vPitch" data-id="${v.id}">${icon("message", "icon sm")} Send pitch</a><a class="btn sm" href="tel:+${attr(v.phone)}" aria-label="Call">${icon("phone", "icon sm")}</a>` : ""}
            ${v.handle ? `<a class="btn sm" target="_blank" rel="noopener" href="https://instagram.com/${attr(v.handle.replace("@", ""))}">${esc(v.handle)}</a>` : ""}
          </div>
          ${v.terms ? `<div class="small"><span class="muted">Trade terms:</span> ${esc(v.terms)}</div>` : ""}
          ${partner ? `<div class="callout ok">${icon("link")}<div>Partner account: <b>${esc(partner.refCode)}</b> · ${partner.partnerType === "trade" ? "one-time trade" : "ongoing affiliate"}</div></div>`
            : `<div class="row"><button class="btn sm" data-act="vPartner" data-id="${v.id}" data-type="trade">${icon("gift", "icon sm")} Start trade</button><button class="btn sm" data-act="vPartner" data-id="${v.id}" data-type="affiliate">${icon("link", "icon sm")} Make affiliate</button></div>`}
        </div>
        <div class="card stack"><h3>Activity</h3>
          <div class="thread">${(v.notes || []).slice().reverse().map((n) => `<div class="msg"><div class="h">${C.ago(n.at)}</div>${esc(n.text)}</div>`).join("") || `<p class="small muted" style="margin:0">No activity yet.</p>`}</div>
          <form class="row nowrap" data-form="vNote" data-id="${v.id}"><input type="text" name="text" class="grow" placeholder="Called, sent sample, they asked for…" required><button class="btn sm primary">Log</button></form>
        </div>
      </div>
      <div class="card">${vendorForm(v)}</div>
    </div>`,
  };
}

// ── Campaign calendar ───────────────────
function campaigns() {
  const approved = db.library.filter((a) => a.status === "approved");
  const showcase = db.projects.filter((p) => p.status === "delivered" && p.consent.showcase);
  const events = [
    ...db.campaigns.map((c) => ({ date: c.date, label: c.title, kind: c.kind || "social" })),
    ...db.vendors.filter((v) => v.nextFollowUp && !["declined", "affiliate"].includes(v.stage)).map((v) => ({ date: v.nextFollowUp, label: `Follow up: ${v.name}`, kind: "vendor" })),
  ];
  const monthName = new Date(ui.calY, ui.calM, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const upcoming = db.campaigns.filter((c) => c.date >= C.addDays(-1)).sort((a, b) => a.date.localeCompare(b.date));
  const sTone = { scheduled: "violet", "in progress": "warn", draft: "line", posted: "ok" };
  return {
    title: "Campaign Calendar", subtitle: "Plan and track your outreach campaigns.",
    actions: `<button class="btn primary" data-act="campNew">${icon("plus", "icon sm")} Plan campaign</button>`, fab: { act: "campNew", label: "Plan campaign" },
    html: `${growthTabs("campaigns")}<div class="stack lg">
      <div class="card stack">
        <div class="row between">
          <div class="row"><b style="font-size:16px">${esc(monthName)}</b><button class="icon-btn plain" data-act="calMove" data-d="-1" aria-label="Previous month">${icon("arrowLeft", "icon sm")}</button><button class="icon-btn plain" data-act="calMove" data-d="1" aria-label="Next month">${icon("arrowRight", "icon sm")}</button><button class="btn sm" data-act="calMove" data-d="0">Today</button></div>
          <div class="row small">${Object.entries(KINDS).map(([k, l]) => `<span class="row" style="gap:5px"><span class="ev dotk k-${k}"></span>${l}</span>`).join("")}</div>
        </div>
        ${monthCalendar(ui.calY, ui.calM, events)}
      </div>
      <div class="card pad0"><div class="card-head" style="padding:16px 18px 0"><h3>Upcoming campaigns</h3></div>
        ${rtable([{ label: "Campaign" }, { label: "Channel" }, { label: "Date" }, { label: "Status", cls: "pill" }],
          upcoming.map((c) => [`<span class="t">${esc(c.title)}</span><div class="s">${esc(KINDS[c.kind] || "")}${c.projectId ? " · consent-cleared project" : ""}</div>`, esc(c.channel), C.date(c.date),
            `<select data-change="campStatus" data-id="${c.id}" style="width:auto;min-height:30px;padding:2px 8px;font-size:12px" aria-label="Status">${["draft", "scheduled", "in progress", "posted"].map((s) => `<option ${c.status === s ? "selected" : ""}>${s}</option>`).join("")}</select>`]),
          { empty: "Nothing planned yet." })}
      </div>
      <template id="camp-form">
        <form class="form" data-form="campAdd">
          <div class="callout">${icon("shield")}<div class="small">Only delivered projects with showcase consent and approved assets can be used.</div></div>
          ${field("Title", input("title", "", "text", "required"))}
          <div class="cols">${field("Type", select("kind", Object.entries(KINDS)))}${field("Channel", select("channel", ["Instagram", "Pinterest", "Email", "Website", "YouTube", "WhatsApp status", "Facebook"]))}${field("Date", input("date", C.addDays(3), "date"))}</div>
          ${field("Project", select("projectId", [["", "— none (stock content) —"], ...showcase.map((p) => [p.id, `${p.code} · ${projectTitle(p)}`])]))}
          ${field("Asset", select("assetId", [["", "— none —"], ...approved.map((a) => [a.id, a.title])]))}
          <button class="btn primary">Add to calendar</button>
        </form>
      </template>
    </div>`,
  };
}

// ── Lead source & CAC ───────────────────
function sources() {
  const days = ui.srcDays === "all" ? null : Number(ui.srcDays);
  const from = days ? C.addDays(-days) : "";
  const leads = db.leads.filter((l) => !from || l.createdAt.slice(0, 10) >= from);
  const counts = {};
  leads.forEach((l) => (counts[l.source] = (counts[l.source] || 0) + 1));
  const rows = SOURCES.map((s) => {
    const ls = leads.filter((l) => l.source === s);
    const ps = db.projects.filter((p) => C.projectChannel(p) === s && (!from || p.createdAt.slice(0, 10) >= from));
    const spend = db.spend.filter((x) => x.channel === s && (!from || x.month >= from.slice(0, 7))).reduce((t, x) => t + Number(x.amount), 0);
    const commission = ps.reduce((t, p) => t + (p.affiliateId ? C.projectedCommission(p) : 0), 0);
    const rev = ps.reduce((t, p) => t + C.paid(p), 0);
    return { s, leads: ls.length, orders: ps.length, spend, commission, rev, cac: ps.length ? (spend + commission) / ps.length : 0 };
  }).filter((r) => r.leads || r.orders || r.spend);
  return {
    title: "Lead Source & Cost", subtitle: "Track performance by channel.",
    actions: `<select data-change="srcDays" style="width:auto" aria-label="Range">${[["30", "Last 30 days"], ["90", "Last 90 days"], ["180", "Last 6 months"], ["all", "All time"]].map(([v, l]) => `<option value="${v}" ${ui.srcDays === v ? "selected" : ""}>${l}</option>`).join("")}</select>`,
    html: `${growthTabs("sources")}<div class="stack lg">
      <div class="two even">
        <div class="card"><h3 style="margin-bottom:14px">Leads by source</h3>${donut(counts, "Total leads")}</div>
        <div class="card"><h3 style="margin-bottom:6px">Cost per acquisition</h3><p class="tiny muted">(spend + partner commission) ÷ orders</p>
          <div class="list">${rows.map((r) => `<div class="item">${srcBadge(r.s)}<div class="grow"></div><span class="small muted">${r.orders} order(s)</span><b class="num">${r.orders ? C.money(r.cac) : "—"}</b></div>`).join("") || `<p class="small muted">No data.</p>`}</div></div>
      </div>
      <div class="card pad0">${rtable([{ label: "Channel" }, { label: "Leads", cls: "num" }, { label: "Orders", cls: "num" }, { label: "Spend", cls: "num" }, { label: "Cost / lead", cls: "num" }, { label: "Revenue", cls: "num" }],
        rows.map((r) => [srcBadge(r.s), r.leads, r.orders, C.money(r.spend), r.leads ? C.money(r.spend / r.leads) : "—", C.money(r.rev)]))}</div>
      <form class="card row" data-form="spendAdd"><b class="grow">Log channel spend</b><input type="month" name="month" value="${C.today().slice(0, 7)}" style="width:auto" required aria-label="Month">
        <select name="channel" style="width:auto" aria-label="Channel">${SOURCES.map((s) => `<option>${esc(s)}</option>`).join("")}</select><input type="number" name="amount" placeholder="₹" style="width:110px" required aria-label="Amount"><button class="btn sm primary">Add</button></form>
    </div>`,
  };
}

// ── Testimonial requests ────────────────
function testimonials() {
  const delivered = db.projects.filter((p) => p.status === "delivered");
  const group = (p) => (p.review ? "received" : p.testimonialRequest?.declined ? "declined" : "pending");
  const list = delivered.filter((p) => group(p) === ui.tTab);
  const n = (g) => delivered.filter((p) => group(p) === g).length;
  const isAdmin = currentUser()?.role === "admin";
  return {
    title: "Testimonial Requests", subtitle: "Automate and track client testimonials.",
    html: `${growthTabs("testimonials")}<div class="stack lg">
      <div class="card pad0">
        ${stateTabs([["pending", "Pending", n("pending")], ["received", "Received", n("received")], ["declined", "Declined", n("declined")]], ui.tTab, "tTab")}
        ${rtable([{ label: "Client" }, { label: "Project" }, { label: "Status", cls: "pill" }, { label: "Consent" }, { label: "", cls: "act" }],
          list.map((p) => {
            const g = group(p);
            const consent = p.review ? (p.review.consentPublic && p.consent.testimonial ? `<b style="color:var(--info)">Yes</b>` : `<b style="color:var(--bad)">No</b>`) : "—";
            return [`<span class="t">${esc(p.clientName.split(" ").pop())} Family</span><div class="s">${p.testimonialRequest?.sentAt ? `requested ${C.ago(p.testimonialRequest.sentAt)}` : "auto-queued at delivery"}</div>`, esc(projectTitle(p)),
              badge(g === "received" ? `Received ${p.review.rating}★` : g === "declined" ? "Declined" : "Pending", g === "received" ? "ok" : g === "declined" ? "bad" : "warn"), consent,
              g === "pending" ? `<span class="row nowrap"><a class="btn sm" href="#" data-act="tstNudge" data-id="${p.id}">${icon("message", "icon sm")} Ask</a><button class="btn sm ghost" data-act="tstDecline" data-id="${p.id}">Declined</button></span>` : ""];
          }), { empty: "Nothing here." })}
      </div>
      ${ui.tTab === "received" ? testimonialsTab({ canApprove: isAdmin }) : ""}
    </div>`,
  };
}

// ── SEO content tracker ─────────────────
const seoStatus = (s) => (!s.position ? ["Not ranked", "line"] : s.position <= s.target ? ["On track", "ok"] : s.position <= s.target + 10 ? ["Improving", "warn"] : ["Needs work", "bad"]);
function seo() {
  return {
    title: "SEO Content Tracker", subtitle: "Track landing pages and keyword performance.",
    actions: `<button class="btn primary" data-act="seoNew">${icon("plus", "icon sm")} Add page</button>`,
    html: `${growthTabs("seo")}<div class="card pad0">
      ${rtable([{ label: "Page / keyword" }, { label: "Target" }, { label: "Position" }, { label: "Visits / leads" }, { label: "Status", cls: "pill" }],
        db.seo.map((s) => { const [l, t] = seoStatus(s); return [`<span class="t">${esc(s.keyword)}</span><div class="s">${esc(s.url)} · ${s.status}</div>`, `Top ${s.target}`, s.position || "—", `${s.visits} / ${s.leads}`, badge(l, t)]; }),
        { empty: "No pages tracked.", href: (i) => `#/seo/${db.seo[i].id}` })}
    </div>`,
    after: () => { const id = location.hash.split("/")[2]; if (id) seoEdit(id); },
  };
}
function seoEdit(id) {
  const s = byId("seo", id);
  if (!s) return;
  sheet(s.title, `<form class="form" data-form="seoSave" data-id="${s.id}">
    <div class="cols">${field("Keyword", input("keyword", s.keyword))}${field("URL", input("url", s.url))}</div>
    <div class="cols">${field("Target (top N)", input("target", s.target, "number"))}${field("Current position", input("position", s.position || "", "number"))}${field("Page status", select("status", [["planned", "Planned"], ["draft", "Draft"], ["live", "Live"]], s.status))}</div>
    <div class="cols">${field("Visits / month", input("visits", s.visits, "number"))}${field("Leads", input("leads", s.leads, "number"))}</div>
    <button class="btn primary">Save</button></form>`);
}

// ── Paid ads planning ───────────────────
function ads() {
  const delivered = db.projects.filter((p) => p.status === "delivered").length;
  return {
    title: "Paid Advertising Tests", subtitle: "Plan and track future ad campaigns.",
    actions: db.ads.length ? `<button class="btn primary" data-act="adNew">${icon("plus", "icon sm")} Plan campaign</button>` : "",
    html: `${growthTabs("ads")}<div class="stack lg">
      ${db.ads.length ? db.ads.map((a) => `<form class="card form" data-form="adSave" data-id="${a.id}">
        <div class="row between"><h3>${esc(a.title)}</h3>${badge(a.status, a.status === "running" ? "ok" : "line")}</div>
        <div class="small muted">${esc(a.channel)} · budget ${C.money(a.budget || 0)}</div>
        <div class="cols">${field("Variant A", textarea("variantA", a.variantA, 'rows="2"'))}${field("Variant B", textarea("variantB", a.variantB, 'rows="2"'))}</div>
        <div class="cols">${field("Result / learning", input("result", a.result))}${field("Status", select("status", ["planned", "running", "done"], a.status))}</div>
        <div><button class="btn sm">Save notes</button></div></form>`).join("")
        : `<div class="card"><div class="empty boxed">${icon("target")}<h4>No active campaigns</h4><p class="small">Paid advertising will be introduced after 10 successful organic orders. You have ${delivered}/10.</p>
          <button class="btn primary" data-act="adNew">${icon("plus", "icon sm")} Plan campaign</button></div></div>`}
    </div>`,
  };
}

// ── Referral codes ──────────────────────
function referrals() {
  const partners = db.users.filter((u) => u.role === "affiliate");
  const clients = db.projects.filter((p) => p.refCode);
  return {
    title: "Referral Codes", subtitle: "Every code has a shareable enquiry link; leads are attributed automatically.",
    html: `${growthTabs("referrals")}<div class="stack lg">
      <div class="card pad0">${rtable([{ label: "Partner" }, { label: "Code" }, { label: "Leads", cls: "num" }, { label: "Converted", cls: "num" }, { label: "", cls: "act" }],
        partners.map((u) => {
          const ls = db.leads.filter((l) => l.affiliateId === u.id);
          const conv = ls.filter((l) => l.stage === "converted").length + db.projects.filter((p) => p.affiliateId === u.id && !p.leadId).length;
          return [`<span class="t">${esc(u.name)}</span><div class="s">${esc(u.partnerKind || "")} · ${u.partnerType === "trade" ? "trade" : "affiliate"}</div>`, `<code>${esc(u.refCode)}</code>`, ls.length, conv,
            `<span class="row nowrap"><button class="btn sm" data-act="copy" data-text="${attr(enquireLink(u.refCode))}" data-label="Link copied">${icon("copy", "icon sm")} Link</button><button class="btn sm ghost" data-act="codeRegen" data-id="${u.id}" aria-label="New code">${icon("refresh", "icon sm")}</button></span>`];
        }))}</div>
      ${clients.length ? `<div class="card pad0"><div class="card-head" style="padding:16px 18px 0"><h3>Past-client codes</h3></div>${rtable([{ label: "Client" }, { label: "Code" }, { label: "Referrals", cls: "num" }], clients.map((p) => [esc(projectTitle(p)), `<code>${esc(p.refCode)}</code>`, db.leads.filter((l) => l.referrerProjectId === p.id).length]))}</div>` : ""}
    </div>`,
  };
}

// ── Asset library & requests ────────────
function library() {
  const isAdmin = currentUser()?.role === "admin";
  const eligible = db.projects.filter((p) => p.status === "delivered" && p.consent.photos && p.consent.showcase);
  return {
    title: "Asset Library", subtitle: "Approved before/after shots and Reels clips — pulled from consent-cleared projects.",
    html: `${growthTabs("library")}<div class="stack lg">
      <div class="card stack"><h3>Request from delivered projects</h3>
        <p class="small muted" style="margin:0">Pull before/after shots and Reels-ready clips straight from a project's files, without asking the couple again.</p>
        ${eligible.length ? eligible.map((p) => `<div class="stack sm"><div class="row">${thumb(p)}<b>${esc(projectTitle(p))}</b></div>
          <div class="tiles">${p.assets.filter((a) => ["image", "video"].includes(a.kind)).map((a) => {
            const taken = db.library.some((x) => x.sourceAssetId === a.id);
            return `<div class="tile"><a class="th" data-file="${a.fileId}" data-kind="${a.kind}">${icon(a.kind === "video" ? "video" : "image", "icon lg")}</a><div class="meta"><b>${esc(a.name)}</b>
              <button class="btn sm" data-act="assetRequest" data-pid="${p.id}" data-id="${a.id}" ${taken ? "disabled" : ""}>${taken ? "Requested" : "Request"}</button></div></div>`;
          }).join("")}
            ${p.delivery ? `<div class="tile"><a class="th" href="${attr(p.delivery.liveUrl)}" target="_blank" rel="noopener">${icon("eye", "icon lg")}</a><div class="meta"><b>Live invitation</b>
              <button class="btn sm" data-act="assetRequestLive" data-pid="${p.id}" ${db.library.some((x) => x.projectId === p.id && x.kind === "Before / after") ? "disabled" : ""}>Request before/after</button></div></div>` : ""}</div></div>`).join("")
          : empty("No consent-cleared projects yet", "Projects appear here once delivered with photo & showcase consent.", "shield")}
      </div>
      ${libraryTab({ canApprove: isAdmin })}
    </div>`,
    after: hydrateFiles,
  };
}

export const routes = { mhome, outreach, vendor, referrals, campaigns, testimonials, library, sources, seo, ads };

act({
  vTab: (el) => { ui.tab = el.dataset.v; routesRefresh(); },
  vSearch: (el) => { ui.q = el.value; routesRefresh(); },
  vKind: (el) => { ui.kind = el.value; routesRefresh(); },
  vSort: (el) => { ui.sort = el.value; routesRefresh(); },
  vMenu: (el) => {
    const v = byId("vendors", el.dataset.id);
    sheet(v.name, `<div class="menu-list">
      <a href="#/vendor/${v.id}" data-act="navTo" data-to="#/vendor/${v.id}">${icon("eye")}<span class="grow">Open</span></a>
      ${v.phone ? `<a href="${attr(wa(v.phone, pitch(v)))}" target="_blank" rel="noopener" data-act="vPitch" data-id="${v.id}">${icon("message")}<span class="grow">Send pitch on WhatsApp</span></a>` : ""}
      ${OUTREACH_STAGES.filter((s) => s.key !== v.stage).map((s) => `<button data-act="vSet" data-id="${v.id}" data-v="${s.key}">${icon("arrowRight")}<span class="grow">Move to ${esc(s.name)}</span></button>`).join("")}
    </div>`);
  },
  vendorNew: () => sheet("Add vendor", vendorForm()),
  vendorSave: (d, f) => {
    let v = f.dataset.id && byId("vendors", f.dataset.id);
    if (!v) { v = { id: uid("v"), stage: "identified", notes: [], createdAt: now() }; db.vendors.push(v); }
    Object.assign(v, { ...d, phone: (d.phone || "").replace(/\D/g, "") });
    closeSheet();
    commit(f.dataset.id ? "Edited vendor" : "Added vendor", v.name);
    if (!f.dataset.id) go(`/vendor/${v.id}`); else toast("Saved");
  },
  vSet: (el) => { closeSheet(); const v = byId("vendors", el.dataset.id); const name = OUTREACH_STAGES.find((s) => s.key === el.dataset.v).name; v.stage = el.dataset.v; v.notes.push({ at: now(), text: `Stage → ${name}` }); commit("Vendor stage", v.name, name); },
  vPitch: (el) => { closeSheet(); const v = byId("vendors", el.dataset.id); window.open(el.href, "_blank"); if (v.stage === "identified") v.stage = "pitched"; v.notes.push({ at: now(), text: "Sent pitch on WhatsApp" }); v.nextFollowUp = C.addDays(3); commit("Pitched vendor", v.name); },
  vNote: (d, f) => { const v = byId("vendors", f.dataset.id); v.notes.push({ at: now(), text: d.text }); commit("Vendor log", v.name); },
  vPartner: (el) => {
    const v = byId("vendors", el.dataset.id);
    let code = v.name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) + (el.dataset.type === "trade" ? "" : Math.floor(10 + Math.random() * 89));
    while (db.users.some((u) => u.refCode === code)) code += Math.floor(Math.random() * 9);
    const u = { id: uid("u"), name: v.contact ? `${v.contact} · ${v.name}` : v.name, role: "affiliate", partnerType: el.dataset.type, partnerKind: v.kind, refCode: code, email: "", phone: v.phone, active: true, tradeLimit: 3, payout: {}, createdAt: now() };
    db.users.push(u);
    v.partnerId = u.id; v.stage = el.dataset.type === "trade" ? "trade" : "affiliate";
    v.notes.push({ at: now(), text: `Partner account created — code ${code}` });
    commit("Created partner", u.name, code);
    toast(`Code ${code} created`);
  },
  codeRegen: (el) => {
    const u = byId("users", el.dataset.id);
    const old = u.refCode;
    u.refCode = u.name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) + Math.floor(100 + Math.random() * 899);
    commit("New referral code", u.name, `${old} → ${u.refCode}`);
  },
  calMove: (el) => {
    const d = Number(el.dataset.d);
    if (!d) { ui.calY = new Date().getFullYear(); ui.calM = new Date().getMonth(); }
    else { const t = new Date(ui.calY, ui.calM + d, 1); ui.calY = t.getFullYear(); ui.calM = t.getMonth(); }
    routesRefresh();
  },
  campNew: () => sheet("Plan a campaign", document.getElementById("camp-form")?.innerHTML || ""),
  campAdd: (d) => { db.campaigns.push({ id: uid("cp"), ...d, projectId: d.projectId || null, assetId: d.assetId || null, status: "scheduled" }); closeSheet(); commit("Planned campaign", d.title); },
  campStatus: (el) => { const c = byId("campaigns", el.dataset.id); c.status = el.value; commit("Campaign status", c.title, el.value); },
  srcDays: (el) => { ui.srcDays = el.value; routesRefresh(); },
  tTab: (el) => { ui.tTab = el.dataset.v; routesRefresh(); },
  tstDecline: (el) => { const p = byId("projects", el.dataset.id); p.testimonialRequest = { ...(p.testimonialRequest || {}), declined: now() }; commit("Testimonial declined", p.code); },
  assetRequest: (el) => {
    const p = byId("projects", el.dataset.pid);
    const a = p.assets.find((x) => x.id === el.dataset.id);
    db.library.push({ id: uid("a"), title: `${projectTitle(p)} — ${a.name}`, kind: a.kind === "video" ? "Reel clip" : "Photo", source: "customer", projectId: p.id, status: "pending", fileId: a.fileId, fileKind: a.kind, sourceAssetId: a.id, at: now() });
    commit("Asset request", p.code, a.name);
    toast("Requested — admin approves before use");
  },
  assetRequestLive: (el) => {
    const p = byId("projects", el.dataset.pid);
    db.library.push({ id: uid("a"), title: `${projectTitle(p)} — before/after`, kind: "Before / after", source: "customer", projectId: p.id, status: "pending", url: p.delivery?.liveUrl, at: now() });
    commit("Asset request", p.code, "before/after");
  },
  seoNew: () => sheet("Track a page", `<form class="form" data-form="seoAdd">
      <div class="cols">${field("Title", input("title", "", "text", "required"))}${field("Target keyword", input("keyword", "marwari wedding invitation "))}</div>
      <div class="cols">${field("URL path", input("url", "/"))}${field("Target (top N)", input("target", 10, "number"))}</div>
      <button class="btn primary">Add page</button></form>`),
  seoAdd: (d) => { db.seo.push({ id: uid("s"), ...d, target: Number(d.target) || 10, position: 0, status: "planned", visits: 0, leads: 0, updatedAt: now() }); closeSheet(); commit("SEO page", d.title); },
  seoSave: (d, f) => { const s = byId("seo", f.dataset.id); Object.assign(s, { keyword: d.keyword, url: d.url, target: Number(d.target) || 10, position: Number(d.position) || 0, status: d.status, visits: Number(d.visits) || 0, leads: Number(d.leads) || 0, updatedAt: now() }); closeSheet(); go("/seo"); commit("SEO update", s.title); },
  adNew: () => sheet("Plan an ad test", `<form class="form" data-form="adAdd">
      <div class="cols">${field("Name", input("title", "", "text", "required"))}${field("Channel", select("channel", ["Meta (Instagram/Facebook)", "Google", "YouTube", "Pinterest"]))}${field("Budget ₹", input("budget", "", "number"))}</div>
      <div class="cols">${field("Variant A", textarea("variantA", "", 'rows="2"'))}${field("Variant B", textarea("variantB", "", 'rows="2"'))}</div>
      <button class="btn primary">Add plan</button></form>`),
  adSave: (d, f) => { const a = byId("ads", f.dataset.id); Object.assign(a, d); commit("Ad note", a.title); toast("Saved"); },
  adAdd: (d) => { db.ads.push({ id: uid("ad"), ...d, budget: Number(d.budget) || 0, result: "", status: "planned", at: now() }); closeSheet(); commit("Ad test", d.title); },
});
