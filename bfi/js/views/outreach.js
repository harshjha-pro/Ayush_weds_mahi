// Outreach & client management panel: follow-ups, direct client outreach,
// the clients they manage, and commission. Vendor CRM and referral codes
// come from marketing.js. The earnings page is shared with designers.

import { db, byId, currentUser, commit, userName } from "../db.js";
import { LEAD_STAGES } from "../seed.js";
import { icon } from "../icons.js";
import { esc, attr, badge, kpi, rtable, wa, stateTabs, act, srcBadge } from "../ui.js";
import * as C from "../calc.js";
import { coupleName, projectTitle, clientLink, thumb } from "./project.js";
import { routesRefresh } from "./admin.js";

const ui = { leadTab: "open", earnTab: "current" };
const leadTone = { new: "info", contacted: "violet", quoted: "gold", converted: "ok", lost: "bad" };
const stageLabel = (l) => LEAD_STAGES.find((s) => s.key === l.stage)?.name.replace(" enquiry", "");

// Commission rule card: the same numbers as Settings, in plain words.
export function rateCard() {
  const s = C.S(), t = (o) => `${o.basic}% Basic · ${o.premium}% Premium · ${o.luxury}% Luxury`;
  return `<div class="card stack sm">
    <h3>How commission works</h3>
    <div class="list small">
      <div class="item"><span class="site-ic sm">${icon("user", "icon sm")}</span><div class="grow"><b>Direct client</b> (no vendor)<div class="muted">Client manager and designer each earn ${t(s.teamDirect)}</div></div></div>
      <div class="item"><span class="site-ic sm">${icon("link", "icon sm")}</span><div class="grow"><b>Via vendor / affiliate</b><div class="muted">Client manager and designer each earn ${t(s.teamReferred)}; the vendor/affiliate earns ${t(s.commission)}</div></div></div>
    </div>
    <p class="tiny muted" style="margin:0">Paid only on completed, fully paid orders. One-time trade vendors get a discount, not cash.</p>
  </div>`;
}

// ── Dashboard ───────────────────────────
function ohome(_, u) {
  const due = db.vendors.filter((v) => !["declined", "affiliate"].includes(v.stage) && v.nextFollowUp && v.nextFollowUp <= C.today());
  const myLeads = db.leads.filter((l) => l.ownerId === u.id && !["converted", "lost"].includes(l.stage));
  const myProjects = db.projects.filter((p) => p.clientManagerId === u.id);
  const active = myProjects.filter((p) => p.status === "active");
  const owed = db.commissions.filter((c) => c.partnerId === u.id && c.status === "owed").reduce((s, c) => s + c.amount, 0);
  const pipeline = active.reduce((s, p) => s + (C.earningFor(p, u.id)?.amount || 0), 0);
  const needsYou = active.filter((p) => C.isOverdue(p) || C.checklistDone(p) < C.checklist(p).length && p.stage <= 2 || (p.stage === 6 && C.balance(p) > 0));
  return {
    title: `Namaste, ${u.name.split(" ")[0]}`, subtitle: "Reach out, bring clients in, and look after them until delivery.",
    actions: `<button class="btn primary" data-act="leadNew">${icon("plus", "icon sm")} Add lead</button>`,
    html: `<div class="stack lg">
      <div class="grid kpi">
        ${kpi("Follow-ups due", due.length + myLeads.filter((l) => l.stage === "new").length, "vendors + new leads")}
        ${kpi("My open leads", myLeads.length)}
        ${kpi("Clients I manage", active.length, `${myProjects.filter((p) => p.status === "delivered").length} delivered`)}
        ${kpi("Commission owed", C.money(owed), `${C.money(pipeline)} in progress`)}
      </div>
      <div class="two">
        <div class="stack">
          <div class="card pad0"><div class="card-head" style="padding:16px 18px 0"><h3>Clients needing attention</h3><a class="small" href="#/myclients">All clients</a></div>
            ${rtable([{ label: "Client" }, { label: "Why" }, { label: "", cls: "act" }], needsYou.map((p) => [`<span class="t">${esc(projectTitle(p))}</span><div class="s">${esc(coupleName(p))}</div>`,
              C.isOverdue(p) ? `<span style="color:var(--bad)">Overdue ${-C.daysUntil(p.dueDate)}d</span>` : p.stage === 6 ? `Balance ${C.money(C.balance(p))} before sign-off` : `${C.checklist(p).length - C.checklistDone(p)} details missing`,
              `<a class="btn sm" target="_blank" rel="noopener" href="${attr(wa(p.phone, `Namaste ${p.clientName} 🙏 Just checking in on your BFI invitation: ${clientLink(p)}`))}">${icon("message", "icon sm")}</a>`]), { empty: "All your clients are on track." })}</div>
          <div class="card pad0"><div class="card-head" style="padding:16px 18px 0"><h3>Vendor follow-ups</h3><a class="small" href="#/outreach">Vendor CRM</a></div>
            ${rtable([{ label: "Vendor" }, { label: "Type" }, { label: "Due" }], due.map((v) => [`<span class="t">${esc(v.name)}</span>`, esc(v.kind), C.date(v.nextFollowUp)]), { empty: "No vendor follow-ups due.", href: (i) => `#/vendor/${due[i].id}` })}</div>
        </div>
        <div class="stack">${rateCard()}
          <div class="card"><div class="card-head"><h3>My new leads</h3><a class="small" href="#/direct">Direct outreach</a></div>
            <div class="list">${myLeads.slice(0, 5).map((l) => `<a class="item" href="#/lead/${l.id}"><div class="grow"><div class="item-t">${esc(l.name)}</div><div class="item-s">${esc(l.source)} · ${C.ago(l.createdAt)}</div></div>${badge(stageLabel(l), leadTone[l.stage])}</a>`).join("") || `<p class="small muted" style="margin:0">No open leads.</p>`}</div></div>
        </div>
      </div>
    </div>`,
  };
}

// ── Direct outreach: leads this person owns ─────────
function direct(_, u) {
  const mine = db.leads.filter((l) => (u.role === "admin" ? !!l.ownerId : l.ownerId === u.id));
  const unowned = db.leads.filter((l) => !l.ownerId && l.stage === "new");
  const groups = { open: mine.filter((l) => !["converted", "lost"].includes(l.stage)), converted: mine.filter((l) => l.stage === "converted"), lost: mine.filter((l) => l.stage === "lost"), unassigned: unowned };
  const list = groups[ui.leadTab] || groups.open;
  return {
    title: "Direct Outreach", subtitle: "Customers you reach out to directly. Direct orders earn the higher team commission.",
    actions: `<button class="btn primary" data-act="leadNew">${icon("plus", "icon sm")} Add lead</button>`,
    html: `<div class="card pad0">
      ${stateTabs([["open", "My open leads", groups.open.length], ["converted", "Converted", groups.converted.length], ["lost", "Lost", groups.lost.length], ["unassigned", "Unassigned new", groups.unassigned.length]], ui.leadTab, "oLeadTab")}
      ${rtable([{ label: "Name" }, { label: "Source" }, { label: "Stage", cls: "pill" }, { label: "Wedding" }, { label: "", cls: "act" }],
        list.map((l) => [`<span class="t">${esc(l.name)}</span><div class="s">${esc(l.city || "")}${l.affiliateId ? " · via vendor" : ""}${u.role === "admin" && l.ownerId ? ` · ${esc(userName(l.ownerId))}` : ""}</div>`, srcBadge(l.source), badge(stageLabel(l), leadTone[l.stage]), C.date(l.weddingDate),
          ui.leadTab === "unassigned" ? `<button class="btn sm" data-act="oClaim" data-id="${l.id}">Claim</button>` : l.phone ? `<a class="btn sm" target="_blank" rel="noopener" href="${attr(wa(l.phone, `Namaste ${l.name} 🙏 This is ${u.name.split(" ")[0]} from BFI — Marwari Invitations.`))}">${icon("message", "icon sm")}</a>` : ""]),
        { empty: ui.leadTab === "unassigned" ? "No unassigned leads right now." : "Nothing here yet. Add a lead after a call, expo or DM.", href: (i) => `#/lead/${list[i].id}` })}
    </div>`,
  };
}

// ── Clients I manage ────────────────────
function myclients(_, u) {
  const isAdmin = u.role === "admin";
  const mine = db.projects.filter((p) => (isAdmin ? true : p.clientManagerId === u.id)).sort((a, b) => (a.status === "active" ? 0 : 1) - (b.status === "active" ? 0 : 1) || (a.dueDate || "").localeCompare(b.dueDate || ""));
  return {
    title: isAdmin ? "Client managers" : "My Clients", subtitle: isAdmin ? "Who looks after each family, and what they earn on it." : "Projects where you are the client manager: keep families informed until delivery.",
    html: `<div class="card pad0">${rtable([{ label: "Project" }, { label: "Stage" }, { label: "Payment" }, { label: "My commission", cls: "num" }, { label: "Status", cls: "pill" }, { label: "", cls: "act" }],
      mine.map((p) => {
        const h = C.health(p), ps = C.payStatus(p), e = C.earningFor(p, isAdmin ? p.clientManagerId : u.id);
        return [`<div class="row nowrap">${thumb(p)}<div><span class="t">${esc(projectTitle(p))}</span><div class="s">${esc(coupleName(p))} · ${esc(C.S().tiers[p.tier].name)} · ${C.isReferred(p) ? "via vendor" : "direct"}${isAdmin ? ` · ${p.clientManagerId ? esc(userName(p.clientManagerId)) : `<span style="color:var(--warn)">no client manager</span>`}` : ""}</div></div></div>`,
          esc(C.stageName(p.stage)), badge(ps.label, ps.tone), e ? `${C.money(e.amount)} <span class="tiny muted">${e.rate}% · ${e.status}</span>` : "—", badge(h.label, h.tone),
          `<span class="row nowrap"><button class="btn sm" data-act="copy" data-text="${attr(clientLink(p))}" data-label="Client link copied" aria-label="Copy client link">${icon("copy", "icon sm")}</button><a class="btn sm" target="_blank" rel="noopener" href="${attr(wa(p.phone, `Namaste ${p.clientName} 🙏 Here's your private BFI page: ${clientLink(p)}`))}" aria-label="WhatsApp">${icon("message", "icon sm")}</a></span>`];
      }), { empty: "No clients assigned to you yet.", href: isAdmin ? (i) => `#/project/${mine[i].id}` : undefined })}</div>`,
  };
}

// ── Earnings (outreach, designers, freelancers) ─────
export function earnings(_, u) {
  const field = u.role === "outreach" ? "clientManagerId" : "designerId";
  const projects = db.projects.filter((p) => p[field] === u.id && p.status !== "cancelled");
  const mine = db.commissions.filter((c) => c.partnerId === u.id);
  const paid = mine.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const owed = mine.filter((c) => c.status === "owed").reduce((s, c) => s + c.amount, 0);
  const current = projects.map((p) => [p, C.earningFor(p, u.id)]).filter(([, e]) => e && e.status !== "paid");
  const pos = db.payouts.filter((x) => x.partnerId === u.id).slice().reverse();
  return {
    title: "My Commission", subtitle: "What you earn on each order you manage or design.",
    html: `<div class="stack lg">
      <div class="grid kpi">${kpi("Paid to you", C.money(paid))}${kpi("Owed (ready for payout)", C.money(owed))}${kpi("In progress", C.money(current.filter(([, e]) => e.status === "projected").reduce((s, [, e]) => s + e.amount, 0)), "earned when delivered & paid")}</div>
      <div class="two">
        <div class="card pad0">
          ${stateTabs([["current", "Current"], ["history", "Payouts"]], ui.earnTab, "oEarnTab")}
          ${ui.earnTab === "current" ? rtable([{ label: "Project" }, { label: "Type" }, { label: "Rate" }, { label: "Amount", cls: "num" }, { label: "Status", cls: "pill" }],
              current.map(([p, e]) => [`<span class="t">${esc(projectTitle(p))}</span><div class="s">${esc(C.S().tiers[p.tier].name)} · ${esc(C.stageName(p.stage))}</div>`, C.isReferred(p) ? "Via vendor" : "Direct", `${e.rate}%`, C.money(e.amount), badge(e.status === "owed" ? "Owed" : "In progress", e.status === "owed" ? "warn" : "info")]), { empty: "Nothing in progress." })
            : rtable([{ label: "Paid on" }, { label: "Reference" }, { label: "Orders" }, { label: "Amount", cls: "num" }], pos.map((x) => [C.date(x.at), esc(x.ref), x.entries.length, `<b>${C.money(x.amount)}</b>`]), { empty: "No payouts yet." })}
        </div>
        <div class="stack">${rateCard()}<p class="small muted">Add your UPI or bank details in <a href="#/settings">Settings</a> so payouts reach you.</p></div>
      </div>
    </div>`,
  };
}

export const routes = { ohome, direct, myclients, earnings };

act({
  oLeadTab: (el) => { ui.leadTab = el.dataset.v; routesRefresh(); },
  oEarnTab: (el) => { ui.earnTab = el.dataset.v; routesRefresh(); },
  oClaim: (el) => { const l = byId("leads", el.dataset.id); l.ownerId = currentUser().id; commit("Claimed lead", l.name, currentUser().name); },
});
