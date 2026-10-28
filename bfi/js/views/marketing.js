// Marketing & sales outreach: vendor CRM, referral codes, campaign
// calendar, testimonials, asset requests, sources & CAC, SEO and ad notes.

import { db, commit, byId, uid, now, userName, currentUser } from "../db.js";
import { OUTREACH_STAGES, VENDOR_KINDS, SOURCES } from "../seed.js";
import { icon } from "../icons.js";
import { esc, attr, act, sheet, closeSheet, toast, badge, empty, kpi, field, input, textarea, select, chips, tabs, wa, avatar, go } from "../ui.js";
import * as C from "../calc.js";
import { coupleName, hydrateFiles } from "./project.js";
import { libraryTab, testimonialsTab, routesRefresh, fill } from "./admin.js";

const ui = { stage: "open" };
export const enquireLink = (code) => `${location.origin}${location.pathname}#/enquire/${encodeURIComponent(code)}`;
const pitch = (v) => `Namaste ${v.contact || v.name} 🙏 I'm from BFI — Marwari Invitations. We build premium digital wedding invitations made only for Marwari weddings. For your next 2–3 couples we'd love to create their invitation free/at a deep discount — with credit to you on the invite. Can I share a sample?`;

// Growth sub-navigation, shown to admin (marketing has these in the main nav).
function growthTabs(active) {
  if (currentUser()?.role !== "admin") return "";
  const T = [["outreach", "Outreach"], ["referrals", "Referrals"], ["campaigns", "Campaigns"], ["sources", "Sources & CAC"], ["seo", "SEO"], ["ads", "Ads A/B"], ["testimonials", "Testimonials"], ["library", "Assets"]];
  return `<nav class="tabs">${T.map(([k, l]) => `<a href="#/${k}" class="${k === active ? "on" : ""}">${l}</a>`).join("")}</nav>`;
}

// ── Home ────────────────────────────────
function mhome() {
  const due = db.vendors.filter((v) => !["declined", "affiliate"].includes(v.stage) && v.nextFollowUp && v.nextFollowUp <= C.today());
  const soon = db.campaigns.filter((c) => c.status !== "posted" && c.date >= C.today() && c.date <= C.addDays(7));
  const monthLeads = db.leads.filter((l) => l.createdAt.slice(0, 7) === C.today().slice(0, 7));
  const tReq = db.projects.filter((p) => p.status === "delivered" && !p.review);
  return {
    title: "Growth", eyebrow: "Marketing & outreach",
    html: `<div class="stack lg">
      <div class="grid kpi">
        ${kpi("Follow-ups due", due.length, due.length ? `<span style="color:var(--bad)">act today</span>` : "all caught up")}
        ${kpi("Active partners", db.users.filter((u) => u.role === "affiliate" && u.active !== false).length)}
        ${kpi("Leads this month", monthLeads.length, `${monthLeads.filter((l) => l.affiliateId).length} via partners`)}
        ${kpi("Campaigns next 7 days", soon.length)}
      </div>
      <div class="two">
        <div class="card"><div class="card-head"><h3>Follow-ups</h3><a class="small" href="#/outreach">CRM →</a></div>
          ${due.length ? `<div class="list">${due.map(vendorItem).join("")}</div>` : empty("No follow-ups due", "", "checkCircle")}</div>
        <div class="stack">
          <div class="card"><div class="card-head"><h3>Coming up</h3><a class="small" href="#/campaigns">Calendar →</a></div>
            ${soon.length ? `<div class="list">${soon.map(campItem).join("")}</div>` : `<p class="small muted">Nothing scheduled this week.</p>`}</div>
          <div class="card"><div class="card-head"><h3>Testimonials to collect</h3><a class="small" href="#/testimonials">All →</a></div>
            ${tReq.length ? `<div class="list">${tReq.map((p) => `<div class="item"><div class="grow item-t">${esc(coupleName(p))}</div>${badge(p.testimonialRequest?.sentAt ? "Requested" : "Not asked", p.testimonialRequest?.sentAt ? "gold" : "warn")}</div>`).join("")}</div>` : `<p class="small muted">Every delivered couple has reviewed.</p>`}</div>
        </div>
      </div>
    </div>`,
  };
}

// ── Outreach CRM ────────────────────────
const vTone = { identified: "line", pitched: "info", talking: "gold", trade: "maroon", affiliate: "ok", declined: "line" };
const vendorItem = (v) => {
  const late = v.nextFollowUp && v.nextFollowUp < C.today() && !["declined", "affiliate"].includes(v.stage);
  return `<a class="item" href="#/vendor/${v.id}">${avatar(v.name)}<div class="grow"><div class="item-t ellipsis">${esc(v.name)}</div><div class="item-s ellipsis">${esc(v.kind)} · ${esc(v.city || "")}${v.nextFollowUp ? ` · follow up ${C.shortDate(v.nextFollowUp)}` : ""}</div></div>
    <div class="right">${badge(OUTREACH_STAGES.find((s) => s.key === v.stage)?.name, vTone[v.stage])}${late ? `<div class="tiny" style="color:var(--bad)">overdue</div>` : ""}</div></a>`;
};
function outreach() {
  const list = db.vendors.filter((v) => (ui.stage === "open" ? !["declined", "affiliate"].includes(v.stage) : ui.stage === "all" || v.stage === ui.stage))
    .sort((a, b) => (a.nextFollowUp || "9").localeCompare(b.nextFollowUp || "9"));
  const n = (k) => db.vendors.filter((v) => v.stage === k).length;
  return {
    title: "Outreach", fab: { act: "vendorNew", label: "Add vendor" },
    actions: `<button class="btn sm primary hide-m" data-act="vendorNew">${icon("plus", "icon sm")} Add vendor</button>`,
    html: `${growthTabs("outreach")}<div class="stack">
      ${chips([["open", "Open", db.vendors.filter((v) => !["declined", "affiliate"].includes(v.stage)).length], ...OUTREACH_STAGES.map((s) => [s.key, s.name, n(s.key)]), ["all", "All", db.vendors.length]], ui.stage, "vStage")}
      <div class="card" style="padding:4px 14px">${list.length ? `<div class="list">${list.map(vendorItem).join("")}</div>` : empty("No vendors here", "Add planners, photographers, MUAs, venues and creators.", "megaphone")}</div>
    </div>`,
  };
}
function vendorForm(v = {}) {
  return `<form class="form" data-form="vendorSave" data-id="${v.id || ""}">
    <div class="cols">${field("Business name", input("name", v.name, "text", "required"))}${field("Contact person", input("contact", v.contact))}</div>
    <div class="cols">${field("Type", select("kind", VENDOR_KINDS, v.kind))}${field("City", input("city", v.city))}</div>
    <div class="cols">${field("Phone", input("phone", v.phone, "tel"))}${field("Instagram", input("handle", v.handle, "text", 'placeholder="@handle"'))}</div>
    ${field("Trade terms offered", input("terms", v.terms, "text", 'placeholder="e.g. free Basic invite for next 3 clients + tag"'))}
    ${field("Next follow-up", input("nextFollowUp", v.nextFollowUp || C.addDays(2), "date"))}
    <button class="btn primary">${v.id ? "Save" : "Add vendor"}</button></form>`;
}
function vendor([id]) {
  const v = byId("vendors", id);
  if (!v) return null;
  const partner = v.partnerId && byId("users", v.partnerId);
  return {
    title: v.name, eyebrow: v.kind, back: "#/outreach",
    html: `<div class="two">
      <div class="stack">
        <div class="card stack">
          <div class="label">Pitch stage</div>
          <div class="chips" style="flex-wrap:wrap">${OUTREACH_STAGES.map((s) => `<button class="chip ${v.stage === s.key ? "on" : ""}" data-act="vSet" data-id="${v.id}" data-v="${s.key}">${s.name}</button>`).join("")}</div>
          <div class="row">
            ${v.phone ? `<a class="btn sm primary" target="_blank" rel="noopener" href="${attr(wa(v.phone, pitch(v)))}" data-act="vPitch" data-id="${v.id}">${icon("message", "icon sm")} Send pitch</a><a class="btn sm" href="tel:+${attr(v.phone)}">${icon("phone", "icon sm")}</a>` : ""}
            ${v.handle ? `<a class="btn sm" target="_blank" rel="noopener" href="https://instagram.com/${attr(v.handle.replace("@", ""))}">${esc(v.handle)}</a>` : ""}
          </div>
          ${partner ? `<div class="callout ok">${icon("link")}<div>Partner account: <b>${esc(partner.refCode)}</b> · ${partner.partnerType === "trade" ? "one-time trade" : "ongoing affiliate"}</div></div>`
            : `<div class="row"><button class="btn sm" data-act="vPartner" data-id="${v.id}" data-type="trade">${icon("gift", "icon sm")} Start trade</button><button class="btn sm" data-act="vPartner" data-id="${v.id}" data-type="affiliate">${icon("link", "icon sm")} Make affiliate</button></div>`}
        </div>
        <div class="card stack"><h3>Log</h3>
          <div class="thread">${(v.notes || []).slice().reverse().map((n) => `<div class="msg"><div class="h">${C.ago(n.at)}</div>${esc(n.text)}</div>`).join("") || `<p class="small muted">No activity yet.</p>`}</div>
          <form class="row nowrap" data-form="vNote" data-id="${v.id}"><input type="text" name="text" class="grow" placeholder="Called, sent sample, they asked for…" required><button class="btn sm primary">Log</button></form>
        </div>
      </div>
      <div class="card">${vendorForm(v)}</div>
    </div>`,
  };
}

// ── Referrals ───────────────────────────
function referrals() {
  const partners = db.users.filter((u) => u.role === "affiliate");
  const clients = db.projects.filter((p) => p.refCode);
  return {
    title: "Referral codes",
    html: `${growthTabs("referrals")}<div class="stack">
      <div class="callout">${icon("info")}<div>Every code has a shareable enquiry link. Leads submitted through it — or entered with the code — are attributed automatically.</div></div>
      ${partners.map((u) => {
        const ls = db.leads.filter((l) => l.affiliateId === u.id);
        const conv = ls.filter((l) => l.stage === "converted").length + db.projects.filter((p) => p.affiliateId === u.id && !p.leadId).length;
        return `<div class="card stack">
          <div class="row between"><div><h4>${esc(u.name)}</h4><div class="small muted">${esc(u.partnerKind || "")} · ${u.partnerType === "trade" ? "trade" : "affiliate"}</div></div><div class="code-big" style="font-size:22px">${esc(u.refCode)}</div></div>
          <div class="copy"><code>${esc(enquireLink(u.refCode))}</code><button class="btn sm" data-act="copy" data-text="${attr(enquireLink(u.refCode))}" data-label="Link copied">${icon("copy", "icon sm")}</button></div>
          <div class="row small"><span>${ls.length} lead(s)</span><span class="muted">·</span><span>${conv} converted</span>
            <button class="btn sm ghost" data-act="codeRegen" data-id="${u.id}">${icon("refresh", "icon sm")} New code</button></div>
        </div>`;
      }).join("")}
      ${clients.length ? `<div class="card"><h3>Past-client codes</h3><div class="list">${clients.map((p) => `<div class="item"><div class="grow"><div class="item-t">${esc(coupleName(p))}</div><div class="item-s">${db.leads.filter((l) => l.referrerProjectId === p.id).length} referral(s)</div></div><code>${esc(p.refCode)}</code></div>`).join("")}</div></div>` : ""}
    </div>`,
  };
}

// ── Campaigns ───────────────────────────
const campItem = (c) => {
  const a = c.assetId && byId("library", c.assetId);
  return `<div class="item">${icon("calendar")}<div class="grow"><div class="item-t ellipsis">${esc(c.title)}</div><div class="item-s ellipsis">${C.date(c.date)} · ${esc(c.channel)}${a ? ` · ${esc(a.title)}` : ""}</div></div>
    <select data-change="campStatus" data-id="${c.id}" style="width:auto;min-height:34px;padding:4px 8px" aria-label="Status">${["draft", "scheduled", "posted"].map((s) => `<option ${c.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>`;
};
function campaigns() {
  const approved = db.library.filter((a) => a.status === "approved");
  const showcase = db.projects.filter((p) => p.status === "delivered" && p.consent.showcase);
  const upcoming = db.campaigns.slice().sort((a, b) => a.date.localeCompare(b.date));
  return {
    title: "Campaign calendar",
    html: `${growthTabs("campaigns")}<div class="two">
      <div class="card"><h3>Calendar</h3>${upcoming.length ? `<div class="list">${upcoming.map(campItem).join("")}</div>` : empty("Nothing planned")}</div>
      <form class="card form" data-form="campAdd"><h3>Plan a post</h3>
        <div class="callout">${icon("shield")}<div class="small">Only delivered projects with showcase consent and approved assets can be used.</div></div>
        ${field("Title", input("title", "", "text", "required"))}
        <div class="cols">${field("Channel", select("channel", ["Instagram", "Pinterest", "YouTube", "WhatsApp status", "Blog / SEO", "Facebook"]))}${field("Date", input("date", C.addDays(3), "date"))}</div>
        ${field("Project", select("projectId", [["", "— none (stock content) —"], ...showcase.map((p) => [p.id, `${p.code} · ${coupleName(p)}`])]))}
        ${field("Asset", select("assetId", [["", "— none —"], ...approved.map((a) => [a.id, a.title])]))}
        <button class="btn primary">Add to calendar</button></form>
    </div>`,
  };
}

// ── Testimonials (request automation) ───
function testimonials() {
  const delivered = db.projects.filter((p) => p.status === "delivered");
  const isAdmin = currentUser()?.role === "admin";
  return {
    title: "Testimonials",
    html: `${growthTabs("testimonials")}<div class="stack">
      <div class="table-wrap"><table><thead><tr><th>Couple</th><th>Delivered</th><th>Requested</th><th>Responded</th><th>Consent</th><th></th></tr></thead><tbody>
      ${delivered.map((p) => `<tr><td>${esc(coupleName(p))}<div class="tiny muted">${esc(p.code)}</div></td><td>${C.shortDate(p.deliveredAt)}</td><td>${p.testimonialRequest?.sentAt ? C.shortDate(p.testimonialRequest.sentAt) : badge("Auto-queued", "gold")}</td>
        <td>${p.review ? badge(`${p.review.rating}★`, "ok") : `<span class="muted">—</span>`}</td><td>${p.review ? badge(p.review.consentPublic && p.consent.testimonial ? "Public OK" : "Private only", p.review.consentPublic && p.consent.testimonial ? "ok" : "warn") : "—"}</td>
        <td>${!p.review ? `<a class="btn sm" href="#" data-act="tstNudge" data-id="${p.id}">${icon("message", "icon sm")} Ask</a>` : ""}</td></tr>`).join("") || `<tr><td colspan="6" class="muted">No deliveries yet.</td></tr>`}</tbody></table></div>
      ${testimonialsTab({ canApprove: isAdmin })}
    </div>`,
  };
}

// ── Asset requests ──────────────────────
function library() {
  const isAdmin = currentUser()?.role === "admin";
  const eligible = db.projects.filter((p) => p.status === "delivered" && p.consent.photos && p.consent.showcase);
  return {
    title: "Asset library",
    html: `${growthTabs("library")}<div class="stack lg">
      <div class="card stack"><h3>Request from delivered projects</h3>
        <p class="small muted">Pull approved before/after shots and Reels-ready clips straight from a project's files — no need to ask the couple again.</p>
        ${eligible.length ? eligible.map((p) => `<div class="stack" style="gap:8px"><b>${esc(coupleName(p))}</b>
          <div class="tiles">${p.assets.filter((a) => ["image", "video"].includes(a.kind)).map((a) => {
            const taken = db.library.some((x) => x.sourceAssetId === a.id);
            return `<div class="tile"><a class="th" data-file="${a.fileId}" data-kind="${a.kind}">${icon(a.kind === "video" ? "video" : "image", "icon lg")}</a><div class="meta"><b>${esc(a.name)}</b>
              <button class="btn sm" data-act="assetRequest" data-pid="${p.id}" data-id="${a.id}" ${taken ? "disabled" : ""}>${taken ? "Requested" : "Request for marketing"}</button></div></div>`;
          }).join("") || `<p class="small muted">No photos or clips on this project.</p>`}
            ${p.previews.length ? `<div class="tile"><a class="th" href="${attr(p.delivery?.liveUrl || p.previews.at(-1).url)}" target="_blank" rel="noopener">${icon("eye", "icon lg")}</a><div class="meta"><b>Live invitation</b>
              <button class="btn sm" data-act="assetRequestLive" data-pid="${p.id}" ${db.library.some((x) => x.projectId === p.id && x.kind === "Before / after") ? "disabled" : ""}>Request before/after</button></div></div>` : ""}</div></div>`).join("")
          : empty("No consent-cleared projects yet", "Projects appear here once delivered with photo & showcase consent.", "shield")}
      </div>
      ${libraryTab({ canApprove: isAdmin })}
    </div>`,
    after: hydrateFiles,
  };
}

// ── Sources & CAC ───────────────────────
function sources() {
  const rows = SOURCES.map((s) => {
    const ls = db.leads.filter((l) => C.leadChannel(l) === s);
    const ps = db.projects.filter((p) => C.projectChannel(p) === s);
    const spend = db.spend.filter((x) => x.channel === s).reduce((t, x) => t + Number(x.amount), 0);
    const rev = ps.reduce((t, p) => t + C.paid(p), 0);
    return { s, leads: ls.length, orders: ps.length, spend, rev, cpl: ls.length ? spend / ls.length : 0, cac: ps.length ? spend / ps.length : 0 };
  }).filter((r) => r.leads || r.orders || r.spend);
  return {
    title: "Sources & CAC",
    html: `${growthTabs("sources")}<div class="stack">
      <div class="table-wrap"><table><thead><tr><th>Channel</th><th class="num">Leads</th><th class="num">Orders</th><th class="num">Spend</th><th class="num">Cost / lead</th><th class="num">CAC</th><th class="num">Revenue</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${esc(r.s)}</td><td class="num">${r.leads}</td><td class="num">${r.orders}</td><td class="num">${C.money(r.spend)}</td><td class="num">${C.money(r.cpl)}</td><td class="num">${C.money(r.cac)}</td><td class="num">${C.money(r.rev)}</td></tr>`).join("")}</tbody></table></div>
      <form class="card row" data-form="spendAdd"><b class="grow">Log spend</b><input type="month" name="month" value="${C.today().slice(0, 7)}" style="width:auto" required>
        <select name="channel" style="width:auto">${SOURCES.map((s) => `<option>${esc(s)}</option>`).join("")}</select><input type="number" name="amount" placeholder="₹" style="width:110px" required><button class="btn sm primary">Add</button></form>
      <p class="tiny muted">Vendor-trade discounts are counted in project margin, not here.</p>
    </div>`,
  };
}

// ── SEO tracker ─────────────────────────
function seo() {
  return {
    title: "SEO pages",
    html: `${growthTabs("seo")}<div class="stack">
      ${db.seo.map((s) => `<form class="card form" data-form="seoSave" data-id="${s.id}">
        <div class="row between"><h4>${esc(s.title)}</h4>${badge(s.status === "live" ? "Live" : s.status === "draft" ? "Draft" : "Planned", s.status === "live" ? "ok" : "warn")}</div>
        <div class="small muted">${esc(s.url)} · “${esc(s.keyword)}” · ${s.visits ? C.pct((s.leads / s.visits) * 100) + " conv." : "no traffic yet"}</div>
        <div class="cols">${field("Status", select("status", [["planned", "Planned"], ["draft", "Draft"], ["live", "Live"]], s.status))}${field("Visits / month", input("visits", s.visits, "number"))}${field("Leads", input("leads", s.leads, "number"))}</div>
        <button class="btn sm">Update</button></form>`).join("")}
      <form class="card form" data-form="seoAdd"><h3>Add page</h3>
        <div class="cols">${field("Title", input("title", "", "text", "required"))}${field("Target keyword", input("keyword", "marwari wedding invitation "))}</div>
        ${field("URL path", input("url", "/", "text"))}<button class="btn primary">Add</button></form>
    </div>`,
  };
}

// ── Ads A/B notes ───────────────────────
function ads() {
  const delivered = db.projects.filter((p) => p.status === "delivered").length;
  const reviews = db.projects.filter((p) => p.review?.approved).length;
  return {
    title: "Paid ads · A/B notes",
    html: `${growthTabs("ads")}<div class="stack">
      <div class="callout ${delivered >= 10 ? "ok" : ""}">${icon("target")}<div><b>Paid spend follows proof.</b> ${delivered}/10 delivered projects · ${reviews} approved testimonial(s). ${delivered >= 10 ? "Ready to test paid campaigns." : "Keep building organic & vendor proof first."}</div></div>
      ${db.ads.map((a) => `<form class="card form" data-form="adSave" data-id="${a.id}">
        <div class="row between"><h4>${esc(a.title)}</h4>${badge(a.status, a.status === "running" ? "ok" : "line")}</div>
        <div class="cols">${field("Variant A", textarea("variantA", a.variantA, 'rows="2"'))}${field("Variant B", textarea("variantB", a.variantB, 'rows="2"'))}</div>
        <div class="cols">${field("Result / learning", input("result", a.result))}${field("Status", select("status", ["planned", "running", "done"], a.status))}</div>
        <button class="btn sm">Save</button></form>`).join("")}
      <form class="card form" data-form="adAdd"><h3>New test</h3><div class="cols">${field("Name", input("title", "", "text", "required"))}${field("Channel", select("channel", ["Meta", "Google", "YouTube", "Pinterest"]))}</div><button class="btn primary">Add</button></form>
    </div>`,
  };
}

export const routes = { mhome, outreach, vendor, referrals, campaigns, testimonials, library, sources, seo, ads };

act({
  vStage: (el) => { ui.stage = el.dataset.v; routesRefresh(); },
  vendorNew: () => sheet("Add vendor", vendorForm()),
  vendorSave: (d, f) => {
    let v = f.dataset.id && byId("vendors", f.dataset.id);
    if (!v) { v = { id: uid("v"), stage: "identified", notes: [], createdAt: now() }; db.vendors.push(v); }
    Object.assign(v, { ...d, phone: (d.phone || "").replace(/\D/g, "") });
    closeSheet();
    commit(f.dataset.id ? "Edited vendor" : "Added vendor", v.name);
    if (!f.dataset.id) go(`/vendor/${v.id}`); else toast("Saved");
  },
  vSet: (el) => { const v = byId("vendors", el.dataset.id); v.stage = el.dataset.v; v.notes.push({ at: now(), text: `Stage → ${el.textContent}` }); commit("Vendor stage", v.name, el.dataset.v); },
  vPitch: (el) => { const v = byId("vendors", el.dataset.id); window.open(el.href, "_blank"); if (v.stage === "identified") v.stage = "pitched"; v.notes.push({ at: now(), text: "Sent pitch on WhatsApp" }); v.nextFollowUp = C.addDays(3); commit("Pitched vendor", v.name); },
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
  campAdd: (d) => { db.campaigns.push({ id: uid("cp"), ...d, projectId: d.projectId || null, assetId: d.assetId || null, status: "draft" }); commit("Planned campaign", d.title); },
  campStatus: (el) => { const c = byId("campaigns", el.dataset.id); c.status = el.value; commit("Campaign status", c.title, el.value); },
  assetRequest: (el) => {
    const p = byId("projects", el.dataset.pid);
    const a = p.assets.find((x) => x.id === el.dataset.id);
    db.library.push({ id: uid("a"), title: `${coupleName(p)} — ${a.name}`, kind: a.kind === "video" ? "Reel clip" : "Photo", source: "customer", projectId: p.id, status: "pending", fileId: a.fileId, fileKind: a.kind, sourceAssetId: a.id, at: now() });
    commit("Asset request", p.code, a.name);
    toast("Requested — admin approves before use");
  },
  assetRequestLive: (el) => {
    const p = byId("projects", el.dataset.pid);
    db.library.push({ id: uid("a"), title: `${coupleName(p)} — before/after`, kind: "Before / after", source: "customer", projectId: p.id, status: "pending", url: p.delivery?.liveUrl, at: now() });
    commit("Asset request", p.code, "before/after");
  },
  seoSave: (d, f) => { const s = byId("seo", f.dataset.id); Object.assign(s, { status: d.status, visits: Number(d.visits) || 0, leads: Number(d.leads) || 0, updatedAt: now() }); commit("SEO update", s.title); toast("Saved"); },
  seoAdd: (d) => { db.seo.push({ id: uid("s"), ...d, status: "planned", visits: 0, leads: 0, updatedAt: now() }); commit("SEO page", d.title); },
  adSave: (d, f) => { const a = byId("ads", f.dataset.id); Object.assign(a, d); commit("Ad note", a.title); toast("Saved"); },
  adAdd: (d) => { db.ads.push({ id: uid("ad"), ...d, variantA: "", variantB: "", result: "", status: "planned", at: now() }); commit("Ad test", d.title); },
});
