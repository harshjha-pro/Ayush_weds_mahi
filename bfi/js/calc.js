// Business rules: pricing, payments, revisions, SLAs, commission, margin
// and the Section 12 metrics. Pure functions over the db document.

import { db, uid, now, byId } from "./db.js";
import { STAGES } from "./seed.js";

const DAY = 864e5;
export const S = () => db.settings;

// ── formatting ───────────────────────────
export const money = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
// Compact rupees: ₹18.4L, ₹2.1Cr, ₹48.5K.
export function short(n) {
  n = Math.round(Number(n) || 0);
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, "")}L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `₹${n}`;
}
export const pct = (n) => (Number.isFinite(n) ? `${Math.round(n)}%` : "—");
export function date(iso, opts = { day: "numeric", month: "short", year: "numeric" }) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", opts);
}
export const shortDate = (iso) => date(iso, { day: "numeric", month: "short" });
export function ago(iso) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return shortDate(iso);
}
// Whole calendar days from today (negative once the date has passed).
export function daysUntil(iso) {
  if (!iso) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return Math.round((d - t) / DAY);
}
export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (n) => new Date(Date.now() + n * DAY).toISOString().slice(0, 10);

// ── pricing ──────────────────────────────
export function quoteTotal(q) {
  const s = S();
  const tier = s.tiers[q.tier] || s.tiers.basic;
  let total = tier.price;
  for (const id of q.addons || []) total += s.addons.find((a) => a.id === id)?.price || 0;
  for (const it of q.items || []) total += Number(it.amount) || 0;
  if (q.rush) total += Math.round(tier.price * (s.rushFee / 100));
  total -= Number(q.discount) || 0;
  return Math.max(0, Math.round(total));
}
export function quoteLines(q) {
  const s = S();
  const tier = s.tiers[q.tier] || s.tiers.basic;
  const lines = [{ label: `${tier.name} invitation`, amount: tier.price }];
  for (const id of q.addons || []) { const a = s.addons.find((x) => x.id === id); if (a) lines.push({ label: a.name, amount: a.price }); }
  for (const it of q.items || []) if (it.label) lines.push({ label: it.label, amount: Number(it.amount) || 0 });
  if (q.rush) lines.push({ label: `Rush delivery (${s.rushFee}%)`, amount: Math.round(tier.price * (s.rushFee / 100)) });
  if (Number(q.discount)) lines.push({ label: "Discount", amount: -Number(q.discount) });
  return lines;
}

// ── payments ─────────────────────────────
export const paid = (p) => p.payments.reduce((s, x) => s + Number(x.amount), 0);
export const refunded = (p) => p.refunds.reduce((s, x) => s + Number(x.amount), 0);
export const balance = (p) => (p.status === "cancelled" ? 0 : Math.max(0, p.price - paid(p)));
export function payStatus(p) {
  if (p.status === "cancelled") return { label: "Cancelled", tone: "line" };
  const b = balance(p);
  if (b <= 0) return { label: "Paid in full", tone: "ok" };
  if (paid(p) > 0) return { label: `${money(b)} due`, tone: "warn" };
  return { label: "Unpaid", tone: "bad" };
}
export function upiLink(p, amount = balance(p)) {
  const s = S();
  const q = new URLSearchParams({ pa: s.upiId, pn: s.upiName, am: String(amount), cu: "INR", tn: `${p.code} invitation` });
  return `upi://pay?${q}`;
}

// ── revisions ────────────────────────────
export function revisionLimit(p) {
  const base = S().tiers[p.tier]?.revisions ?? 1;
  return base >= 99 ? Infinity : base + (Number(p.extraRevisions) || 0);
}
export const revisionsUsed = (p) => p.revisions.length;
export const revisionsLeft = (p) => Math.max(0, revisionLimit(p) - revisionsUsed(p));
export const limitLabel = (p) => (revisionLimit(p) === Infinity ? "Unlimited (reasonable)" : `${revisionsUsed(p)} of ${revisionLimit(p)} used`);

// ── stage / SLA ──────────────────────────
export const stageName = (i) => STAGES[i]?.name || "—";
export function isOverdue(p) {
  if (p.status !== "active" || !p.dueDate) return false;
  return daysUntil(p.dueDate) < 0;
}
export function stageAge(p) { return p.stageSince ? Math.floor((Date.now() - new Date(p.stageSince)) / DAY) : 0; }
export function slaBreached(p) {
  if (p.status !== "active") return false;
  const sla = S().slaDays[p.stage] || 0;
  return sla > 0 && stageAge(p) > sla;
}
export function health(p) {
  if (p.status === "cancelled") return { label: "Cancelled", tone: "line" };
  if (p.status === "delivered") return { label: "Delivered", tone: "ok" };
  if (isOverdue(p)) return { label: `Overdue ${-daysUntil(p.dueDate)}d`, tone: "bad" };
  if (slaBreached(p)) return { label: `Stuck ${stageAge(p)}d`, tone: "warn" };
  const d = daysUntil(p.dueDate);
  if (d !== null && d <= 2) return { label: `Due in ${d}d`, tone: "warn" };
  return { label: "On track", tone: "ok" };
}
export function setStage(p, stage) {
  p.stage = stage;
  p.stageSince = now();
  if (stage === 7) { p.status = "delivered"; p.deliveredAt = p.deliveredAt || now(); }
  else if (p.status === "delivered") p.status = "active";
  ensureCommission(p);
}

// ── intake checklist ─────────────────────
export function checklist(p) {
  const i = p.intake || {};
  const has = (k) => p.assets.some((a) => a.purpose === k);
  return [
    { key: "couple", label: "Couple photos", done: has("couple"), tab: "uploads" },
    { key: "venue", label: "Venue photos / details", done: has("venue") || (i.events || []).some((e) => e.venue), tab: "uploads" },
    { key: "inspiration", label: "Inspiration links", done: has("inspiration"), tab: "uploads" },
    { key: "timeline", label: "Timeline / schedule", done: (i.events || []).length > 0, tab: "details" },
    { key: "family", label: "Family names", done: !!(i.brideParents || i.groomParents) || has("family"), tab: "details" },
    { key: "rsvp", label: "RSVP details", done: !!(i.rsvpBy || i.rsvpPhone), tab: "details" },
    { key: "logo", label: "Logo / branding", done: has("logo") || !!i.noLogo, tab: "uploads" },
  ];
}
export const checklistDone = (p) => checklist(p).filter((c) => c.done).length;

// ── commission ───────────────────────────
export function commissionRate(partner, tier) {
  if (!partner || partner.partnerType === "trade") return 0;
  const o = partner.commissionOverride?.[tier];
  return Number.isFinite(Number(o)) && o !== "" && o !== null && o !== undefined ? Number(o) : S().commission[tier] || 0;
}
// Commission is earned only on completed, paid orders.
export function ensureCommission(p) {
  if (!p.affiliateId || p.status !== "delivered" || balance(p) > 0) return;
  if (db.commissions.some((c) => c.projectId === p.id)) return;
  const partner = byId("users", p.affiliateId);
  const rate = commissionRate(partner, p.tier);
  if (!rate) return;
  db.commissions.push({ id: uid("c"), partnerId: partner.id, projectId: p.id, rate, amount: Math.round(p.price * rate / 100), at: now(), status: "owed", payoutId: null });
}
export const commissionOf = (p) => db.commissions.find((c) => c.projectId === p.id);
export function projectedCommission(p) {
  const partner = byId("users", p.affiliateId);
  return Math.round(p.price * commissionRate(partner, p.tier) / 100);
}

// ── margin (Section 11) ──────────────────
export function margin(p) {
  const s = S();
  const revenue = paid(p) - refunded(p);
  const labour = (Number(p.costs?.hours) || 0) * s.hourlyCost;
  const hosting = Number(p.costs?.hosting) || 0;
  const fees = Math.round(paid(p) * s.gatewayFee / 100);
  const commission = commissionOf(p)?.amount || (p.affiliateId ? projectedCommission(p) : 0);
  const revisions = revisionsUsed(p) * s.revisionCost;
  const other = Number(p.costs?.other) || 0;
  const cost = labour + hosting + fees + commission + revisions + other;
  const contribution = revenue - cost;
  return { revenue, labour, hosting, fees, commission, revisions, other, cost, contribution, pct: revenue ? (contribution / revenue) * 100 : 0, gross: revenue - labour - hosting };
}

// ── metrics (Section 12) ─────────────────
export function inRange(iso, from, to) {
  if (!iso) return false;
  const t = iso.slice(0, 10);
  return (!from || t >= from) && (!to || t <= to);
}
export function leadChannel(l) { return l.source || "Other"; }
export function projectChannel(p) {
  const l = p.leadId && byId("leads", p.leadId);
  if (l) return leadChannel(l);
  return p.affiliateId ? "Vendor referral" : "Other";
}

export function metrics({ from, to, channel } = {}) {
  const chOk = (c) => !channel || c === channel;
  const leads = db.leads.filter((l) => inRange(l.createdAt, from, to) && chOk(leadChannel(l)));
  const projects = db.projects.filter((p) => inRange(p.createdAt, from, to) && chOk(projectChannel(p)));
  const delivered = projects.filter((p) => p.status === "delivered");
  const converted = leads.filter((l) => l.stage === "converted");
  const lost = leads.filter((l) => l.stage === "lost");
  const spend = db.spend.filter((x) => (!from || x.month >= from.slice(0, 7)) && (!to || x.month <= to.slice(0, 7)) && chOk(x.channel)).reduce((s, x) => s + Number(x.amount), 0);
  const visitors = db.traffic.filter((x) => (!from || x.month >= from.slice(0, 7)) && (!to || x.month <= to.slice(0, 7))).reduce((s, x) => s + Number(x.visitors), 0);
  const qualified = leads.filter((l) => l.stage !== "new" && !(l.stage === "lost" && l.lostReason === "No response")).length;
  const partners = db.users.filter((u) => u.role === "affiliate" && u.active !== false);
  const refLeads = leads.filter((l) => l.affiliateId);
  const refConverted = refLeads.filter((l) => l.stage === "converted").length + projects.filter((p) => p.affiliateId && !p.leadId).length;
  const commissions = db.commissions.filter((c) => inRange(c.at, from, to));
  const revenue = projects.reduce((s, p) => s + paid(p) - refunded(p), 0);
  const margins = projects.map(margin);
  const contribution = margins.reduce((s, m) => s + m.contribution, 0);
  const gross = margins.reduce((s, m) => s + m.gross, 0);
  const cycle = converted.map((l) => (l.convertedAt ? (new Date(l.convertedAt) - new Date(l.createdAt)) / DAY : null)).filter((x) => x !== null);
  const turn = delivered.map((p) => (new Date(p.deliveredAt) - new Date(p.createdAt)) / DAY);
  const onTime = delivered.filter((p) => !p.dueDate || p.deliveredAt.slice(0, 10) <= p.dueDate).length;
  const reviews = projects.filter((p) => p.review);
  const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
  const emails = new Map();
  db.projects.forEach((p) => { const k = (p.email || p.phone || "").toLowerCase(); if (k) emails.set(k, (emails.get(k) || 0) + 1); });
  const repeat = [...emails.values()].filter((n) => n > 1).length;
  const nonCancelled = projects.filter((p) => p.status !== "cancelled");

  return {
    marketing: { visitors, leads: leads.length, qualified, spend, cpl: leads.length ? spend / leads.length : 0, cac: converted.length ? spend / converted.length : 0 },
    vendor: { partners: partners.length, referrals: refLeads.length, conversion: refLeads.length ? (refConverted / refLeads.length) * 100 : NaN, commission: commissions.reduce((s, c) => s + c.amount, 0) },
    sales: { enquiries: leads.length, orders: projects.length, conversion: leads.length ? (converted.length / leads.length) * 100 : NaN, aov: nonCancelled.length ? avg(nonCancelled.map((p) => p.price)) : 0, cycle: avg(cycle), lost: lost.length },
    production: { delivered: delivered.length, turnaround: avg(turn), revisions: avg(projects.map(revisionsUsed)), onTime: delivered.length ? (onTime / delivered.length) * 100 : NaN, active: projects.filter((p) => p.status === "active").length, overdue: projects.filter(isOverdue).length },
    quality: { defects: projects.reduce((s, p) => s + (Number(p.qa?.defects) || 0), 0), complaints: projects.reduce((s, p) => s + (Number(p.complaints) || 0), 0), rework: projects.filter((p) => p.qa?.status === "fail" || p.qaFailed).length, csat: avg(reviews.map((p) => p.review.rating)) },
    finance: { revenue, gross, grossPct: revenue ? (gross / revenue) * 100 : NaN, contribution, contributionPct: revenue ? (contribution / revenue) * 100 : NaN, outstanding: projects.reduce((s, p) => s + balance(p), 0), refunds: projects.reduce((s, p) => s + refunded(p), 0) },
    retention: { reviews: reviews.length, referralRate: projects.length ? (projects.filter((p) => p.affiliateId).length / projects.length) * 100 : NaN, repeat },
    lostReasons: lost.reduce((m, l) => ((m[l.lostReason || "Other"] = (m[l.lostReason || "Other"] || 0) + 1), m), {}),
    bySource: leads.reduce((m, l) => ((m[leadChannel(l)] = (m[leadChannel(l)] || 0) + 1), m), {}),
  };
}

// Revenue per month for the last n months.
export function monthly(n = 6) {
  const out = [];
  const d = new Date(); d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    const total = db.projects.flatMap((p) => p.payments).filter((x) => x.at.slice(0, 7) === key).reduce((s, x) => s + Number(x.amount), 0);
    out.push({ key, label: m.toLocaleDateString("en-IN", { month: "short" }), total });
  }
  return out;
}

export function csv(rows) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const cell = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
}

// Referral codes belong to partners (commission) or past clients (thank-you
// reward); a lead carrying one is attributed automatically.
export function attributeLead(l) {
  const code = (l.refCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  l.refCode = code;
  l.affiliateId = null;
  l.referrerProjectId = null;
  if (!code) return;
  const partner = db.users.find((u) => u.role === "affiliate" && u.active !== false && (u.refCode || "").toUpperCase() === code);
  const pastClient = !partner && db.projects.find((p) => (p.refCode || "").toUpperCase() === code);
  if (partner) {
    l.affiliateId = partner.id;
    if (!l.source || ["Walk-in / phone", "Other", "Instagram"].includes(l.source)) l.source = "Vendor referral";
  } else if (pastClient) {
    l.referrerProjectId = pastClient.id;
    l.source = "Past client";
  }
}

// Change of a count/sum between the last `days` and the window before it.
export function delta(items, dateOf, days = 30, valueOf = () => 1) {
  const now = Date.now(), span = days * DAY;
  let cur = 0, prev = 0;
  for (const it of items) {
    const t = new Date(dateOf(it) || 0).getTime();
    if (t > now - span) cur += valueOf(it);
    else if (t > now - 2 * span) prev += valueOf(it);
  }
  return { cur, prev, pct: prev ? ((cur - prev) / prev) * 100 : cur ? 100 : NaN };
}

// Percent through the 8 stages, for client-facing progress bars.
export const progressPct = (p) => (p.status === "delivered" ? 100 : Math.round((p.stage / 7) * 100));

// Client ↔ team chat: one conversation per project. Typing @Design team,
// @Studio admin or @QA team tags who the message is for.
export const TAGS = { design: "Design team", admin: "Studio admin", qa: "QA team" };
export const THREADS = TAGS;
const ALIASES = { design: ["design team", "designer", "design"], admin: ["studio admin", "studio", "admin"], qa: ["qa team", "qa"] };
export function parseTags(text = "") {
  const t = text.toLowerCase();
  return Object.keys(ALIASES).filter((k) => ALIASES[k].some((a) => new RegExp(`@${a.replace(/ /g, "\\s+")}(?![a-z])`).test(t)));
}
// Messages saved before tagging carried a group "thread" instead.
export const msgTags = (m) => m.tags || (m.thread && m.from === "client" ? [m.thread] : []);
export const roleGroup = (role) => (role === "qa" ? "qa" : role === "admin" ? "admin" : "design");
const seenKey = (side, role) => (side === "client" ? "client" : `team:${roleGroup(role)}`);
// Unread for the client: any team reply. For a team member: client
// messages tagged to their group or untagged (admin sees every one).
export function unread(p, side, role) {
  const seen = p.seen?.[seenKey(side, role)] || "";
  return (p.messages || []).filter((m) => m.at > seen && (side === "client" ? m.from !== "client"
    : m.from === "client" && (role === "admin" || !msgTags(m).length || msgTags(m).includes(roleGroup(role))))).length;
}
export function markSeen(p, side, role) {
  const key = seenKey(side, role);
  const last = (p.messages || []).map((m) => m.at).sort().pop() || "";
  if (last && (p.seen?.[key] || "") < last) { p.seen = { ...(p.seen || {}), [key]: last }; return true; }
  return false;
}

// Booking capacity: the studio accepts `slots` new orders per `days`-long
// window, starting from `start` and rolling forward. Accepted = projects
// created in the window (cancelled ones free their slot).
export function capacity() {
  const cap = S().capacity;
  if (!cap?.enabled || !cap.slots) return null;
  const days = Number(cap.days) || 7;
  const t0 = new Date(`${cap.start || today()}T00:00:00`);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const n = Math.max(0, Math.floor((t - t0) / (days * DAY)));
  const start = new Date(t0.getTime() + n * days * DAY), end = new Date(start.getTime() + days * DAY);
  const used = db.projects.filter((p) => p.status !== "cancelled" && new Date(p.createdAt) >= start && new Date(p.createdAt) < end).length;
  const left = Math.max(0, Number(cap.slots) - used);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { slots: Number(cap.slots), used, left, days, full: left === 0, start: iso(start), until: iso(new Date(end.getTime() - DAY)), next: iso(end) };
}
// Client-facing line, e.g. "Only 3 of 5 invitation slots left until 3 Nov".
export function capacityLine(c = capacity()) {
  if (!c) return "";
  return c.full ? `Fully booked until ${shortDate(c.until)}. New requests join the waitlist for ${shortDate(c.next)} onwards`
    : `${c.left <= Math.ceil(c.slots / 2) ? "Only " : ""}${c.left} of ${c.slots} invitation slots left for the next ${c.days} days (until ${shortDate(c.until)})`;
}
