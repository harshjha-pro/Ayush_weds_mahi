// Affiliate / vendor partner app: code & pitch, referred leads (status
// only), intro form, marketing kit, commission and payout details.

import { db, commit, byId, uid, now, putFile, currentUser } from "../db.js";
import { LEAD_STAGES } from "../seed.js";
import { icon } from "../icons.js";
import { esc, attr, act, toast, badge, empty, kpi, field, input, textarea, select, wa } from "../ui.js";
import * as C from "../calc.js";
import { coupleName, hydrateFiles } from "./project.js";
import { enquireLink } from "./marketing.js";

const pitchFor = (u) => `Planning a Marwari wedding? 🪔 BFI — Marwari Invitations designs beautiful digital invitation websites made just for Marwari rituals and families. Use my code ${u.refCode} when you enquire: ${enquireLink(u.refCode)}`;
const nextPayout = () => { const d = new Date(); d.setMonth(d.getMonth() + (d.getDate() >= 5 ? 1 : 0), 5); return d.toISOString().slice(0, 10); };
const mine = (u) => ({
  leads: db.leads.filter((l) => l.affiliateId === u.id),
  projects: db.projects.filter((p) => p.affiliateId === u.id),
  commissions: db.commissions.filter((c) => c.partnerId === u.id),
});

function ahome(_, u) {
  const m = mine(u);
  const owed = m.commissions.filter((c) => c.status === "owed").reduce((s, c) => s + c.amount, 0);
  const paidC = m.commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const pipeline = m.projects.filter((p) => p.status === "active").reduce((s, p) => s + C.projectedCommission(p), 0);
  const trade = u.partnerType === "trade";
  const used = m.projects.length, limit = u.tradeLimit || 3;
  return {
    title: `Namaste, ${u.name.split(" ")[0]}`, eyebrow: "Partner",
    html: `<div class="stack lg">
      <div class="card royal stack">
        <div class="eyebrow">Your referral code</div>
        <div class="code-big">${esc(u.refCode)}</div>
        <div class="row">
          <button class="btn gold sm" data-act="share" data-text="${attr(pitchFor(u))}">${icon("share", "icon sm")} Share</button>
          <button class="btn sm" data-act="copy" data-text="${attr(enquireLink(u.refCode))}" data-label="Link copied">${icon("link", "icon sm")} Copy link</button>
          <a class="btn sm" href="#/refer">${icon("plus", "icon sm")} Refer a couple</a>
        </div>
        <p class="small muted" style="margin:0">Couples who enquire through your link, or mention your code, are tagged to you automatically.</p>
      </div>
      <div class="card stack">
        <div class="row between"><h3>Partner status</h3>${badge(trade ? "One-time vendor trade" : "Ongoing affiliate", trade ? "gold" : "ok")}</div>
        ${trade ? `<p class="small">Your next ${limit} couples get a free or discounted invitation with credit to you. <b>${used}/${limit}</b> used.</p>
          <div class="stages">${Array.from({ length: limit }, (_, i) => `<i class="${i < used ? "done" : ""}"></i>`).join("")}</div>
          <p class="tiny muted">After your trade clients are delivered, we'll move you to an ongoing affiliate with cash commission.</p>`
        : `<p class="small">You earn <b>${C.commissionRate(u, "basic")}%</b> on Basic, <b>${C.commissionRate(u, "premium")}%</b> on Premium and <b>${C.commissionRate(u, "luxury")}%</b> on Luxury orders — paid only on completed, paid orders.</p>`}
      </div>
      <div class="grid kpi">
        ${kpi("Referred leads", m.leads.length)}${kpi("Orders", m.projects.length)}
        ${kpi("Owed to you", C.money(owed), `next payout ${C.shortDate(nextPayout())}`)}${kpi("Paid so far", C.money(paidC), `${C.money(pipeline)} in progress`)}
      </div>
      <div class="card stack"><h3>Message to send couples</h3><p class="small" style="background:var(--bg-2);padding:12px;border-radius:10px;margin:0">${esc(pitchFor(u))}</p>
        <div class="row"><button class="btn sm" data-act="copy" data-text="${attr(pitchFor(u))}">${icon("copy", "icon sm")} Copy</button><a class="btn sm" target="_blank" rel="noopener" href="${attr(wa("", pitchFor(u)))}">${icon("message", "icon sm")} WhatsApp</a></div></div>
    </div>`,
  };
}

// Plain status words for partners — no prices, notes or internals.
const statusOf = (p) => (p.status === "cancelled" ? ["Cancelled", "line"] : p.status === "delivered" ? ["Delivered", "ok"] : [C.stageName(p.stage), "gold"]);
function myleads(_, u) {
  const m = mine(u);
  const projLeadIds = new Set(m.projects.map((p) => p.leadId));
  const openLeads = m.leads.filter((l) => !projLeadIds.has(l.id));
  return {
    title: "My leads & projects",
    html: `<div class="stack lg">
      <div class="card"><h3>Projects</h3>${m.projects.length ? `<div class="list">${m.projects.map((p) => {
        const [s, t] = statusOf(p); const c = C.commissionOf(p);
        return `<div class="item"><div class="grow"><div class="item-t">${esc(coupleName(p))}</div><div class="item-s">${esc(C.S().tiers[p.tier].name)} · wedding ${C.shortDate(p.weddingDate)}</div></div>
          <div class="right">${badge(s, t)}<div class="tiny muted">${c ? `${C.money(c.amount)} ${c.status}` : u.partnerType === "trade" ? "trade" : `~${C.money(C.projectedCommission(p))} on completion`}</div></div></div>`;
      }).join("")}</div>` : empty("No projects yet", "When a referral books, it shows here.", "folder")}</div>
      <div class="card"><h3>Enquiries</h3>${openLeads.length ? `<div class="list">${openLeads.map((l) => `<div class="item"><div class="grow"><div class="item-t">${esc(l.name)}</div><div class="item-s">${C.ago(l.createdAt)} · wedding ${C.shortDate(l.weddingDate)}</div></div>${badge(l.stage === "lost" ? "Not booked" : LEAD_STAGES.find((s) => s.key === l.stage)?.name, l.stage === "lost" ? "line" : "info")}</div>`).join("")}</div>` : `<p class="small muted">No open enquiries.</p>`}</div>
    </div>`,
  };
}

function refer(_, u) {
  return {
    title: "Refer a couple",
    html: `<form class="card form" data-form="affRefer" style="max-width:620px">
      <p class="small muted">Introduce a couple directly — our team will reach out within a day and you'll see their status here.</p>
      <div class="cols">${field("Couple's names", input("name", "", "text", 'required placeholder="e.g. Priya & Rohan"'))}${field("Contact phone", input("phone", "", "tel", 'required placeholder="9198…"'))}</div>
      <div class="cols">${field("Email", input("email", "", "email"))}${field("Wedding date", input("weddingDate", "", "date", "required"))}</div>
      <div class="cols">${field("City", input("city"))}${field("Likely package", select("interest", [["", "Not sure"], ["basic", "Basic"], ["premium", "Premium"], ["luxury", "Luxury / Bespoke"]]))}</div>
      ${field("Anything we should know", textarea("note", "", 'placeholder="Style, functions, budget…"'))}
      <label class="check"><input type="checkbox" name="ok" required><span class="small">The couple agreed to be contacted by BFI.</span></label>
      <button class="btn primary">${icon("send", "icon sm")} Send introduction</button>
    </form>`,
  };
}

function kit(_, u) {
  const items = db.library.filter((a) => a.status === "approved");
  return {
    title: "Marketing kit",
    html: `<div class="stack lg">
      <div class="callout">${icon("shield")}<div class="small">Everything here is approved for sharing — client content only appears when the couple has consented.</div></div>
      <div class="tiles" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">${items.map((a) => `<div class="tile">
        <a class="th" ${a.fileId ? `data-file="${a.fileId}" data-kind="${a.fileKind || "image"}"` : a.url ? `href="${attr(a.url)}" target="_blank" rel="noopener"` : ""}>${icon(a.kind === "Reel clip" ? "video" : a.kind === "One-pager" ? "file" : "image", "icon lg")}</a>
        <div class="meta"><b>${esc(a.title)}</b>${badge(a.kind, "line")}</div></div>`).join("") || empty("Kit coming soon")}</div>
      <div class="card stack"><h3>Packages to mention</h3>${Object.values(C.S().tiers).map((t) => `<div class="item"><div class="grow"><div class="item-t">${esc(t.name)}</div><div class="item-s">${esc(t.desc)}</div></div><b>from ${C.money(t.price)}</b></div>`).join("")}</div>
    </div>`,
    after: hydrateFiles,
  };
}

function payouts(_, u) {
  const m = mine(u);
  const pos = db.payouts.filter((p) => p.partnerId === u.id);
  return {
    title: "Commission & payouts",
    html: `<div class="two">
      <div class="stack">
        <div class="card"><h3>Commission ledger</h3>${m.commissions.length ? `<div class="list">${m.commissions.map((c) => { const p = byId("projects", c.projectId); return `<div class="item"><div class="grow"><div class="item-t">${esc(p ? coupleName(p) : "")}</div><div class="item-s">${C.date(c.at)} · ${c.rate}%</div></div><b>${C.money(c.amount)}</b>${badge(c.status === "paid" ? "Paid" : "Owed", c.status === "paid" ? "ok" : "warn")}</div>`; }).join("")}</div>`
          : empty("No commission yet", u.partnerType === "trade" ? "Trade partnerships don't earn cash commission." : "Earned when a referred order is completed and paid.", "rupee")}</div>
        <div class="card"><div class="card-head"><h3>Payout history</h3><span class="small muted">Next: ${C.date(nextPayout())}</span></div>
          ${pos.length ? `<div class="list">${pos.map((p) => `<div class="item"><div class="grow"><div class="item-t">${C.money(p.amount)}</div><div class="item-s">${C.date(p.at)} · ref ${esc(p.ref)}</div></div></div>`).join("")}</div>` : `<p class="small muted">No payouts yet.</p>`}</div>
      </div>
      <form class="card form" data-form="affPayout">
        <h3>Payout details</h3>
        ${field("UPI ID", input("upi", u.payout?.upi, "text", 'placeholder="name@bank"'))}
        ${field("Bank account (optional)", input("bank", u.payout?.bank, "text", 'placeholder="Bank · account · IFSC"'))}
        ${field("PAN (for tax records)", input("pan", u.payout?.pan, "text", 'style="text-transform:uppercase"'))}
        ${field("Your invoice (if required)", `<input type="file" name="invoice" accept="application/pdf,image/*">`, u.payout?.invoiceName ? `on file: ${u.payout.invoiceName}` : "")}
        <button class="btn primary">Save details</button>
        <p class="tiny muted">Visible only to you and the studio admin.</p>
      </form>
    </div>`,
  };
}

export const routes = { ahome, myleads, refer, kit, payouts };

act({
  affRefer: (d) => {
    const u = currentPartner();
    const l = { id: uid("l"), name: d.name, phone: d.phone.replace(/\D/g, ""), email: d.email, weddingDate: d.weddingDate, city: d.city, interest: d.interest, source: "Vendor referral", refCode: u.refCode, stage: "new", createdAt: now(), notes: d.note ? [{ at: now(), by: u.name, text: d.note }] : [] };
    C.attributeLead(l);
    db.leads.push(l);
    commit("Partner introduction", l.name, u.refCode);
    toast("Introduction sent — thank you!");
    location.hash = "/myleads";
  },
  affPayout: async (d) => {
    const u = currentPartner();
    const f = d.invoice?.[0];
    u.payout = { ...u.payout, upi: d.upi, bank: d.bank, pan: d.pan.toUpperCase(), ...(f ? { invoiceFileId: await putFile(f), invoiceName: f.name } : {}) };
    commit("Payout details", u.name);
    toast("Saved");
  },
});

const currentPartner = () => currentUser();
