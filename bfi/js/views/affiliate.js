// Affiliate / vendor partner app: referral code, referred leads & projects
// (status only), commission tracker, trade status, referral submission,
// marketing kit and payout details.

import { db, commit, byId, uid, now, putFile, currentUser, fileUrl } from "../db.js";
import { LEAD_STAGES } from "../seed.js";
import { icon } from "../icons.js";
import { esc, attr, act, toast, badge, empty, kpi, field, input, textarea, select, wa, stateTabs, rtable, download, copy, templateArt, avatar } from "../ui.js";
import * as C from "../calc.js";
import { coupleName, projectTitle, hydrateFiles } from "./project.js";
import { enquireLink } from "./marketing.js";
import { routesRefresh } from "./admin.js";

const ui = { leadsTab: "leads", comTab: "current" };
const pitchFor = (u) => `Planning a Marwari wedding? 🪔 BFI — Marwari Invitations designs beautiful digital invitation websites made just for Marwari rituals and families. Use my code ${u.refCode} when you enquire: ${enquireLink(u.refCode)}`;
const nextPayout = () => { const d = new Date(); d.setMonth(d.getMonth() + (d.getDate() >= 5 ? 1 : 0), 5); return d.toISOString().slice(0, 10); };
const mine = (u) => ({
  leads: db.leads.filter((l) => l.affiliateId === u.id),
  projects: db.projects.filter((p) => p.affiliateId === u.id),
  commissions: db.commissions.filter((c) => c.partnerId === u.id),
});
// Plain status words for partners — no prices, notes or internals.
const statusOf = (p) => (p.status === "cancelled" ? ["Cancelled", "line"] : p.status === "delivered" ? ["Delivered", "ok"] : p.stage <= 1 ? ["Converted", "ok"] : ["In progress", "info"]);
const leadStatus = (l) => (l.stage === "converted" ? ["Converted", "ok"] : l.stage === "lost" ? ["Not booked", "line"] : ["In progress", "info"]);

// 1 · Referral code
function ahome(_, u) {
  const m = mine(u);
  const earned = m.commissions.reduce((s, c) => s + c.amount, 0);
  const owed = m.commissions.filter((c) => c.status === "owed").reduce((s, c) => s + c.amount, 0);
  return {
    title: "Your Referral Code", subtitle: "Share and earn commission.",
    html: `<div class="two side">
      <div class="stack">
        <div class="card stack">
          <div class="codebox"><span class="code-big">${esc(u.refCode)}</span><button class="btn primary" data-act="copy" data-text="${attr(u.refCode)}" data-label="Code copied">Copy</button></div>
          <div class="copy"><code>${esc(enquireLink(u.refCode))}</code><button class="btn sm" data-act="copy" data-text="${attr(enquireLink(u.refCode))}" data-label="Link copied" aria-label="Copy link">${icon("copy", "icon sm")}</button></div>
          <a class="btn primary block" href="#/kit">${icon("download", "icon sm")} Download Marketing Kit</a>
          <div class="row"><button class="btn sm" data-act="share" data-text="${attr(pitchFor(u))}">${icon("share", "icon sm")} Share</button><a class="btn sm" target="_blank" rel="noopener" href="${attr(wa("", pitchFor(u)))}">${icon("message", "icon sm")} WhatsApp</a><a class="btn sm" href="#/refer">${icon("plus", "icon sm")} Submit a referral</a></div>
        </div>
        <div class="card stack sm"><h3>Message to send couples</h3><p class="small" style="background:var(--bg-2);padding:12px;border-radius:8px;margin:0">${esc(pitchFor(u))}</p>
          <div><button class="btn sm" data-act="copy" data-text="${attr(pitchFor(u))}">${icon("copy", "icon sm")} Copy message</button></div></div>
      </div>
      <div class="stack">
        <div class="grid kpi">${kpi("Referred leads", m.leads.length)}${kpi("Orders", m.projects.length)}${kpi("Total earned", C.money(earned))}${kpi("Owed to you", C.money(owed), `next payout ${C.shortDate(nextPayout())}`)}</div>
        <div class="card stack sm"><div class="row between"><h3>Partner status</h3>${badge(u.partnerType === "trade" ? "One-time trade" : "Ongoing affiliate", u.partnerType === "trade" ? "warn" : "ok")}</div>
          <p class="small muted" style="margin:0">${u.partnerType === "trade" ? "Free/discounted invites for your next clients, with credit to you. Moves to cash commission after delivery." : `You earn ${C.commissionRate(u, "basic")}% Basic · ${C.commissionRate(u, "premium")}% Premium · ${C.commissionRate(u, "luxury")}% Luxury — on completed, paid orders.`}</p>
          <a class="small" href="#/trade">View trade status →</a></div>
      </div>
    </div>`,
  };
}

// 2 · Leads & projects
function myleads(_, u) {
  const m = mine(u);
  const projLeadIds = new Set(m.projects.map((p) => p.leadId));
  const openLeads = m.leads.filter((l) => !projLeadIds.has(l.id));
  const rows = {
    leads: () => rtable([{ label: "Name" }, { label: "Wedding" }, { label: "Status", cls: "pill" }], openLeads.map((l) => { const [s, t] = leadStatus(l); return [`<span class="t">${esc(l.name)}</span><div class="s">${esc(l.city || "")} · referred ${C.ago(l.createdAt)}</div>`, C.date(l.weddingDate), badge(s, t)]; }), { empty: "No referrals yet. Share your code or submit a referral." }),
    projects: () => rtable([{ label: "Client" }, { label: "Package" }, { label: "Status", cls: "pill" }], m.projects.map((p) => { const [s, t] = statusOf(p); return [`<span class="t">${esc(p.clientName)}</span><div class="s">${esc(projectTitle(p))}</div>`, esc(C.S().tiers[p.tier].name), badge(s, t)]; }), { empty: "No projects yet." }),
    commissions: () => commissionTable(u, m.projects),
  }[ui.leadsTab]();
  return {
    title: "My Leads & Projects", subtitle: "Track your referrals and commissions.",
    html: `<div class="card pad0">${stateTabs([["leads", "Leads", openLeads.length], ["projects", "Projects", m.projects.length], ["commissions", "Commissions"]], ui.leadsTab, "affLeadsTab")}${rows}</div>`,
  };
}

function commissionTable(u, projects) {
  return rtable([{ label: "Project" }, { label: "Amount", cls: "num" }, { label: "Status", cls: "pill" }], projects.filter((p) => p.status !== "cancelled").map((p) => {
    const c = C.commissionOf(p);
    const amt = c ? c.amount : C.projectedCommission(p);
    return [`<span class="t">${esc(projectTitle(p))}</span><div class="s">${esc(C.S().tiers[p.tier].name)}</div>`, u.partnerType === "trade" ? "Trade" : C.money(amt), badge(c ? (c.status === "paid" ? "Paid" : "Owed") : "Pending", c ? (c.status === "paid" ? "ok" : "warn") : "warn")];
  }), { empty: "No commissions yet." });
}

// 3 · Commission tracker
function commission(_, u) {
  const m = mine(u);
  const earned = m.commissions.reduce((s, c) => s + c.amount, 0);
  const pos = db.payouts.filter((p) => p.partnerId === u.id).slice().reverse();
  return {
    title: "Commission Tracker", subtitle: "View your earnings and payout history.",
    html: `<div class="stack lg">
      <div class="grid kpi">${kpi("Total earned", C.money(earned))}<div class="card kpi-card"><div class="kpi-l">Next payout</div><div class="kpi-v" style="color:var(--ok);font-size:22px">${C.date(nextPayout())}</div><div class="kpi-s">${C.money(m.commissions.filter((c) => c.status === "owed").reduce((s, c) => s + c.amount, 0))} owed</div></div></div>
      <div class="card pad0">
        ${stateTabs([["current", "Current"], ["history", "History"]], ui.comTab, "affComTab")}
        ${ui.comTab === "current" ? commissionTable(u, m.projects.filter((p) => !C.commissionOf(p) || C.commissionOf(p).status === "owed"))
          : rtable([{ label: "Paid on" }, { label: "Reference" }, { label: "Orders" }, { label: "Amount", cls: "num" }], pos.map((p) => [C.date(p.at), esc(p.ref), p.entries.length, `<b>${C.money(p.amount)}</b>`]), { empty: "No payouts yet." })}
      </div>
      <p class="small muted">Commission is paid only on completed, paid orders — never on leads or quotes. Update payout details in <a href="#/settings">Settings</a>.</p>
    </div>`,
  };
}

// 4 · Trade status
function trade(_, u) {
  const m = mine(u);
  const limit = u.tradeLimit || 3;
  const isTrade = u.partnerType === "trade";
  return {
    title: "Trade Status", subtitle: "Track your partnership status.",
    html: `<div class="stack lg">
      <div class="card stack">
        <div class="row between"><h3>Your partnership</h3>${badge(isTrade ? "One-time vendor trade" : "Ongoing affiliate", isTrade ? "warn" : "ok")}</div>
        <div class="stepper">${["Trade offer", "Clients delivered", "Ongoing affiliate"].map((l, i) => { const st = isTrade ? (i === 0 ? "done" : i === 1 ? "now" : "") : "done"; return `<div class="step ${st}"><span class="b">${st === "done" ? icon("check", "icon sm") : i + 1}</span>${l}</div>`; }).join("")}</div>
        ${isTrade ? `<div class="small">${m.projects.length}/${limit} discounted clients used</div>${progress((m.projects.length / limit) * 100)}<p class="small muted" style="margin:0">After your trade clients are delivered, we'll move you to an ongoing affiliate with cash commission.</p>` : `<p class="small muted" style="margin:0">You're on cash commission for every completed, paid order.</p>`}
      </div>
      <div class="card pad0"><div class="card-head" style="padding:16px 18px 0"><h3>Your clients</h3></div>
        ${rtable([{ label: "Vendor / client" }, { label: "Wedding" }, { label: "Status", cls: "pill" }],
          [...m.projects.map((p) => [`<span class="t">${esc(p.clientName)}</span>`, C.date(p.weddingDate), badge(p.status === "delivered" ? "Completed" : p.status === "cancelled" ? "Cancelled" : "Ongoing", p.status === "delivered" ? "info" : p.status === "cancelled" ? "line" : "ok")]),
           ...m.leads.filter((l) => !["converted", "lost"].includes(l.stage)).map((l) => [`<span class="t">${esc(l.name)}</span>`, C.date(l.weddingDate), badge("Potential", "warn")])], { empty: "No clients yet." })}
      </div>
    </div>`,
  };
}
const progress = (pct) => `<div class="progress"><i style="width:${Math.min(100, pct)}%"></i></div>`;

// 5 · Referral submission
function refer() {
  return {
    title: "Submit a Referral", subtitle: "Add a new lead manually.",
    html: `<form class="card form" data-form="affRefer" style="max-width:640px">
      ${field("Name *", input("name", "", "text", 'required placeholder="Enter name — e.g. Priya & Rohan"'))}
      ${field("Phone number *", input("phone", "", "tel", 'required placeholder="Enter phone"'))}
      ${field("Wedding date", input("weddingDate", "", "date"))}
      <details><summary class="small" style="cursor:pointer;color:var(--info)">More details (optional)</summary>
        <div class="form" style="margin-top:12px"><div class="cols">${field("Email", input("email", "", "email"))}${field("City", input("city"))}</div>
        ${field("Likely package", select("interest", [["", "Not sure"], ["basic", "Basic"], ["premium", "Premium"], ["luxury", "Luxury / Bespoke"]]))}
        ${field("Anything we should know", textarea("note", "", 'placeholder="Style, functions, budget…"'))}</div></details>
      <label class="check"><input type="checkbox" name="ok" required><span class="small">The couple agreed to be contacted by BFI.</span></label>
      <button class="btn primary block">Submit Referral</button>
    </form>`,
  };
}

// 6 · Marketing kit
function onePagerHtml() {
  const s = C.S();
  return `<!doctype html><html><head><meta charset="utf-8"><title>BFI — Marwari Invitations</title><style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;color:#14213d;padding:0 20px}h1{font-size:40px;margin:0}h2{color:#b88a35}td{padding:8px 12px;border-bottom:1px solid #eee}</style></head><body>
  <h1>BFI — Marwari Invitations</h1><p>Premium digital wedding invitations made only for Marwari weddings — rituals, family names and traditions, delivered as a beautiful mobile invitation website.</p>
  <h2>Packages</h2><table>${Object.values(s.tiers).map((t) => `<tr><td><b>${t.name}</b></td><td>${t.desc}</td><td>from ₹${t.price.toLocaleString("en-IN")}</td></tr>`).join("")}</table>
  <h2>Add-ons</h2><p>${s.addons.map((a) => a.name).join(" · ")}</p><p>WhatsApp: +${s.whatsapp} · ${s.email}</p></body></html>`;
}
function kit(_, u) {
  const imgs = db.library.filter((a) => a.status === "approved");
  const rows = [
    ["image", "Before/after images", `${imgs.length} approved item(s)`, `<a class="btn sm" href="#kit-images">View</a>`],
    ["file", "One-page PDF", "Packages & how it works — print or save as PDF", `<button class="btn sm" data-act="kitOnePager">Download</button>`],
    ["message", "Social media template", "Caption with your code", `<button class="btn sm" data-act="copy" data-text="${attr(pitchFor(u))}">Copy</button>`],
  ];
  return {
    title: "Marketing Kit", subtitle: "Download approved materials.",
    html: `<div class="stack lg">
      <div class="card" style="padding:4px 18px"><div class="list">${rows.map(([ic, t, s, b]) => `<div class="item"><span class="avatar">${icon(ic, "icon sm")}</span><div class="grow"><div class="item-t">${t}</div><div class="item-s">${s}</div></div>${b}</div>`).join("")}</div></div>
      <div class="callout">${icon("shield")}<div class="small">Everything here is approved for sharing. Client content only appears when the couple has consented.</div></div>
      <div id="kit-images" class="tpl-grid">${imgs.map((a) => `<div class="tpl"><a class="art th" style="display:grid;place-items:center;background:var(--bg-2)" ${a.fileId ? `data-file="${a.fileId}" data-kind="${a.fileKind || "image"}"` : a.url ? `href="${attr(a.url)}" target="_blank" rel="noopener"` : ""}>${a.projectId ? templateArt(byId("templates", byId("projects", a.projectId)?.templateId)) : icon(a.kind === "Reel clip" ? "video" : "file", "icon lg")}</a>
        <div class="meta"><b class="ellipsis">${esc(a.title)}</b><div class="row between">${badge(a.kind, "line")}${a.fileId ? `<button class="btn sm" data-act="kitDl" data-id="${a.id}">${icon("download", "icon sm")}</button>` : ""}</div></div></div>`).join("") || empty("Kit coming soon")}</div>
    </div>`,
    after: hydrateFiles,
  };
}

export function payoutForm(u) {
  return `<form class="card form" data-form="affPayout">
    <h3>Payout details</h3>
    <div class="cols">${field("UPI ID", input("upi", u.payout?.upi, "text", 'placeholder="name@bank"'))}${field("PAN (for tax records)", input("pan", u.payout?.pan, "text", 'style="text-transform:uppercase"'))}</div>
    ${field("Bank account (optional)", input("bank", u.payout?.bank, "text", 'placeholder="Bank · account · IFSC"'))}
    ${field("Your invoice (if required)", `<input type="file" name="invoice" accept="application/pdf,image/*">`, u.payout?.invoiceName ? `on file: ${u.payout.invoiceName}` : "")}
    <div><button class="btn primary">Save payout details</button></div>
    <p class="tiny muted" style="margin:0">Visible only to you and the studio admin.</p>
  </form>`;
}

export const routes = { ahome, myleads, commission, trade, refer, kit };

act({
  affLeadsTab: (el) => { ui.leadsTab = el.dataset.v; routesRefresh(); },
  affComTab: (el) => { ui.comTab = el.dataset.v; routesRefresh(); },
  affRefer: (d) => {
    const u = currentUser();
    const l = { id: uid("l"), name: d.name, phone: d.phone.replace(/\D/g, ""), email: d.email || "", weddingDate: d.weddingDate, city: d.city || "", interest: d.interest || "", source: "Vendor referral", refCode: u.refCode, stage: "new", createdAt: now(), notes: d.note ? [{ at: now(), by: u.name, text: d.note }] : [] };
    C.attributeLead(l);
    db.leads.push(l);
    commit("Partner referral", l.name, u.refCode);
    toast("Referral submitted — thank you!");
    ui.leadsTab = "leads";
    location.hash = "/myleads";
  },
  affPayout: async (d) => {
    const u = currentUser();
    const f = d.invoice?.[0];
    u.payout = { ...u.payout, upi: d.upi, bank: d.bank, pan: (d.pan || "").toUpperCase(), ...(f ? { invoiceFileId: await putFile(f), invoiceName: f.name } : {}) };
    commit("Payout details", u.name);
    toast("Saved");
  },
  kitOnePager: () => download("BFI-Marwari-Invitations.html", onePagerHtml(), "text/html"),
  kitDl: async (el) => {
    const a = byId("library", el.dataset.id);
    const url = await fileUrl(a.fileId);
    if (!url) { toast("File isn't on this device"); return; }
    const x = document.createElement("a"); x.href = url; x.download = a.title; x.click();
  },
});
