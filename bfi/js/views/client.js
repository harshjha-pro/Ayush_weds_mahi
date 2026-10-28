// Client portal — no account, opened by a private, non-guessable link.
// Four pages: Dashboard, My Project, Messages, Settings. Shows only this
// couple's project: never pricing negotiation, internal notes or other clients.

import { db, commit, uid, now, fileUrl } from "../db.js";
import { STAGES } from "../seed.js";
import { icon, crest } from "../icons.js";
import { esc, attr, act, toast, badge, empty, field, input, textarea, select, checkbox, timeline, wa, qrSvg, download, sheet, closeSheet, progress, templateArt, toggle, copy, share } from "../ui.js";
import * as C from "../calc.js";
import { addAssets, assetTiles, hydrateFiles, uploadForm, coupleName, projectTitle, chatView, markSeen, scrollChat, intakeCard } from "./project.js";
import { enquireLink } from "./marketing.js";
import { byId } from "../db.js";

const SECTIONS = ["Cover", "Couple & family names", "Events & timings", "Venue & map", "Photos", "RSVP", "Colours & style", "Wording / language", "Other"];
const EVENT_NAMES = ["Ganesh puja", "Mayra / Bhaat", "Haldi", "Mehendi", "Mahila sangeet", "Sangeet", "Baraat", "Phera", "Reception", "Other"];
const MILESTONES = [["Design", 0, 3], ["Your review", 4, 4], ["Final checks", 5, 6], ["Delivery", 7, 7]];

export function portal(tok, page, rest = []) {
  const p = tok && db.projects.find((x) => x.token === tok);
  if (!p) return { title: "Not found", html: `<div class="entry"><div class="entry-box crest">${crest()}<h1>BFI</h1><h3>Link not recognised</h3><p>Please use the private link the BFI studio sent you on WhatsApp.</p><a class="btn" href="#/">Back</a></div></div>` };
  try { localStorage.setItem("bfi.client", p.token); } catch {}
  const base = `#/c/${p.token}`;
  if (!["home", "project", "messages", "settings"].includes(page)) {
    // Old deep links (#/c/token/preview) open inside My Project.
    rest = [page]; page = "project";
  }
  const unreadN = Object.keys(C.THREADS).reduce((s, t) => s + C.unread(p, t, "client"), 0);
  const nav = [["home", "Dashboard", "home"], ["project", "My Project", "folder"], ["messages", unreadN ? `Messages (${unreadN})` : "Messages", "message"], ["settings", "Settings", "settings"]];
  const v = { home, project, messages, settings }[page](p, base, rest);
  return {
    ...v,
    frame: {
      nav: nav.map(([k, l, ic]) => [`${base}/${k}`, l, ic, k === page]),
      who: { name: coupleName(p), href: `${base}/settings` },
      signOutAct: "cForget",
    },
    after: (root) => { hydrateFiles(root); scrollChat(root); v.after?.(root); },
  };
}

const welcomeNames = (p) => {
  const i = p.intake || {};
  const b = i.brideName?.split(" ")[0] || p.brideName, g = i.groomName?.split(" ")[0] || p.groomName;
  return b && g ? `${b} & ${g}` : p.clientName;
};

function stepper(p) {
  return `<div class="stepper">${MILESTONES.map(([l, a, b]) => {
    const st = p.stage > b || p.status === "delivered" ? "done" : p.stage >= a ? "now" : "";
    return `<div class="step ${st}"><span class="b">${st === "done" ? icon("check", "icon sm") : icon(["palette", "eye", "shield", "send"][MILESTONES.findIndex((m) => m[0] === l)], "icon sm")}</span>${l}</div>`;
  }).join("")}</div>`;
}

// ── 1 · Dashboard ───────────────────────
function home(p, base) {
  const st = STAGES[p.stage];
  const pct = C.progressPct(p);
  const cta = {
    collect: [`${base}/project/details`, "Fill in your details"],
    review: [`${base}/project/preview`, "Open your preview"],
    approve: [C.balance(p) > 0 ? `${base}/project/payment` : `${base}/project/preview`, C.balance(p) > 0 ? "Clear balance & approve" : "Give final approval"],
    delivered: [`${base}/project/invite`, "Get your invitation"],
  }[st.key];
  const lastMsg = (p.messages || []).filter((m) => m.from !== "client").at(-1);
  const shareUrl = p.delivery?.liveUrl || p.previews.at(-1)?.url;
  return {
    title: `Welcome, ${welcomeNames(p)}`, subtitle: "Your invitation journey at a glance.",
    html: `<div class="two">
      <div class="stack">
        ${p.status === "cancelled" ? `<div class="callout bad">${icon("info")}<div>This project was cancelled. Please message the studio with any questions.</div></div>` : `
        <div class="card stack">
          <div class="small muted">Project status</div>
          <div class="row between"><h2>${esc(st.key === "review" ? "Your review" : st.name)}</h2><b>${pct}%</b></div>
          ${progress(pct)}
          <p class="small muted" style="margin:0">${esc(st.client)}</p>
        </div>
        <div class="card stack" style="border-color:var(--primary)">
          <div class="eyebrow">What we need from you</div>
          <h3>${esc(st.need)}</h3>
          ${cta ? `<div><a class="btn primary" href="${cta[0]}">${esc(cta[1])} ${icon("arrowRight", "icon sm")}</a></div>` : ""}
        </div>`}
        <div class="card stack"><h3>Progress</h3>${stepper(p)}
          <div class="row between small"><span class="muted">Revision rounds</span><b>${C.revisionLimit(p) === Infinity ? "Unlimited" : `${C.revisionsLeft(p)} of ${C.revisionLimit(p)} left`}</b></div></div>
      </div>
      <div class="stack">
        <div class="card stack"><h3>Quick actions</h3>
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:8px">
            ${shareUrl ? `<button class="btn" data-act="share" data-text="${attr(p.delivery ? "You're invited! 🪔" : "Our invitation preview")}" data-url="${attr(shareUrl)}">${icon("share", "icon sm")} Share link</button>` : `<a class="btn" href="${base}/project/uploads">${icon("upload", "icon sm")} Upload</a>`}
            ${p.delivery ? `<a class="btn" href="${base}/project/invite">${icon("download", "icon sm")} Download</a>` : `<a class="btn" href="${base}/project/details">${icon("edit", "icon sm")} Details</a>`}
            <a class="btn" href="${base}/project/payment">${icon("rupee", "icon sm")} ${C.balance(p) ? "Pay" : "Receipts"}</a>
            <a class="btn" href="${base}/messages">${icon("message", "icon sm")} Message</a>
          </div></div>
        <div class="card stack sm"><div class="row between"><h3>Latest message</h3><a class="small" href="${base}/messages">Open</a></div>
          ${lastMsg ? `<div class="bubble" style="max-width:100%"><div class="who">${esc(C.THREADS[lastMsg.thread])}</div>${esc(lastMsg.text)}<div class="tm">${C.ago(lastMsg.at)}</div></div>` : `<p class="small muted" style="margin:0">No messages yet.</p>`}</div>
        <div class="card stack sm"><h3>Payment</h3><div class="row between"><span class="muted small">Balance</span><b>${C.balance(p) ? C.money(C.balance(p)) : "Paid in full"}</b></div></div>
        <p class="tiny muted" style="text-align:center">${icon("lock", "icon sm")} This page is private to you. Please don't share the link publicly.</p>
      </div>
    </div>`,
  };
}

// ── 2 · My Project (with sub-sections) ──
function project(p, base, [sub = "overview"]) {
  const delivered = p.status === "delivered";
  const T = [["overview", "Overview"], ["details", "Details"], ["uploads", "Uploads", p.assets.length], ["preview", "Preview & changes"], ["payment", "Payment"], ...(delivered || p.delivery ? [["invite", "Invitation"], ["review", "Review"]] : [])];
  if (!T.some((t) => t[0] === sub)) sub = "overview";
  const body = { overview, details, uploads, preview, payment, invite, review }[sub](p, base);
  return {
    title: "My Project", subtitle: "Details and progress of your invitation.",
    html: `<nav class="tabs">${T.map(([k, l, n]) => `<a href="${base}/project/${k}" class="${k === sub ? "on" : ""}">${esc(l)}${n ? `<span class="n">(${n})</span>` : ""}</a>`).join("")}</nav>${body}`,
  };
}

function overview(p) {
  const tpl = byId("templates", p.templateId);
  return `<div class="two side">
    <div class="card stack">
      <div class="row" style="align-items:flex-start;gap:16px">
        <div class="tpl" style="width:130px;flex:none"><div class="art">${templateArt(tpl)}</div></div>
        <div class="stack sm grow" style="min-width:180px">
          <h2>${esc(projectTitle(p))}</h2><div class="small muted">${esc(C.S().tiers[p.tier].name)} package${p.addons.length ? ` + ${p.addons.length} add-on(s)` : ""}</div>
          <div class="row between small"><span class="muted">Delivery date</span><b>${C.date(p.dueDate)}</b></div>
          <div class="row between small"><span class="muted">Wedding</span><b>${C.date(p.weddingDate)}</b></div>
          <div class="row between small"><span class="muted">${esc(STAGES[p.stage].name)}</span><b>${C.progressPct(p)}%</b></div>
          ${progress(C.progressPct(p), "ok")}
        </div>
      </div>
      ${stepper(p)}
    </div>
    <div class="card"><h3 style="margin-bottom:12px">Timeline</h3>${timeline(p.stage, { client: true })}</div>
  </div>`;
}

// Structured intake
const eventRow = (e = {}, i = 0) => `
  <div class="card flat stack" data-event-row style="padding:12px">
    <div class="row between"><b class="small">Function ${i + 1}</b><button class="btn sm ghost" type="button" data-act="cEventDel" aria-label="Remove function">${icon("trash", "icon sm")}</button></div>
    <div class="cols">${field("Function", select("evName[]", EVENT_NAMES, e.name || "Phera"))}${field("Date", input("evDate[]", e.date, "date"))}${field("Time", input("evTime[]", e.time, "time"))}</div>
    <div class="cols">${field("Venue", input("evVenue[]", e.venue, "text", 'placeholder="e.g. Rambagh Palace"'))}${field("Dress code", input("evDress[]", e.dress, "text", 'placeholder="optional"'))}</div>
    ${field("Address / Maps link", input("evAddress[]", e.address, "text"))}
  </div>`;
function details(p) {
  const i = p.intake || {};
  const locked = p.stage >= 4;
  const fs = (n, title, inner) => `<fieldset class="card form" ${locked ? "disabled" : ""} style="margin:0"><h3>${n} · ${title}</h3>${inner}</fieldset>`;
  return `<div class="stack lg">
    <p class="small muted" style="margin:0">Fill in what you have; you can save and come back. Please spell names exactly as they should appear.</p>
    ${locked ? `<div class="callout">${icon("info")}<div>Your design is in progress. For changes now, send them with your revision request under Preview & changes.</div></div>` : ""}
    <form class="form" data-form="cIntake" data-token="${p.token}">
      ${fs(1, "The couple", `<div class="cols">${field("Bride's full name", input("brideName", i.brideName))}${field("Groom's full name", input("groomName", i.groomName))}</div>`)}
      ${fs(2, "Families", `${field("Bride's parents", input("brideParents", i.brideParents, "text", 'placeholder="Mr. & Mrs. …"'))}${field("Groom's parents", input("groomParents", i.groomParents, "text", 'placeholder="Mr. & Mrs. …"'))}${field("Grandparents / blessings (Dada-Dadi, Nana-Nani)", textarea("grandparents", i.grandparents, 'rows="2"'))}`)}
      ${fs(3, "Functions & timeline", `<div class="stack" data-events>${(i.events?.length ? i.events : [{}]).map(eventRow).join("")}</div><div><button class="btn sm" type="button" data-act="cEventAdd">${icon("plus", "icon sm")} Add function</button></div>`)}
      ${fs(4, "RSVP & wording", `<div class="cols">${field("RSVP by", input("rsvpBy", i.rsvpBy, "date"))}${field("RSVP contact number", input("rsvpPhone", i.rsvpPhone, "tel"))}</div>
        <div class="cols">${field("Language", select("language", ["English", "Hindi", "English + Hindi", "Marwari + Hindi", "Gujarati + English"], i.language || "English + Hindi"))}${field("Opening line", select("wording", ["Shri Ganeshaya Namah", "Om Shri Ganeshaya Namah", "Jai Shri Krishna", "Custom (tell us below)"], i.wording || "Shri Ganeshaya Namah"))}</div>
        ${checkbox("noLogo", i.noLogo, "We don't have a logo or monogram — please design one")}
        ${field("Anything else", textarea("notes", i.notes, 'rows="3" placeholder="Special rituals, people to mention, colours you love…"'))}`)}
      ${locked ? "" : `<div class="row"><button class="btn" data-act="cIntakeDraft">Save draft</button><button class="btn primary">${icon("check", "icon sm")} Submit details</button></div>
        ${i.submittedAt ? `<p class="small muted" style="margin:0">Submitted ${C.date(i.submittedAt)}. You can update and resubmit until design starts.</p>` : ""}`}
    </form>
  </div>`;
}
function readIntake(form) {
  const fd = new FormData(form);
  const g = (k) => fd.getAll(k);
  const events = g("evName[]").map((name, i) => ({ name, date: g("evDate[]")[i], time: g("evTime[]")[i], venue: g("evVenue[]")[i].trim(), dress: g("evDress[]")[i].trim(), address: g("evAddress[]")[i].trim() })).filter((e) => e.date || e.venue);
  const v = (k) => (fd.get(k) || "").toString().trim();
  return { brideName: v("brideName"), groomName: v("groomName"), brideParents: v("brideParents"), groomParents: v("groomParents"), grandparents: v("grandparents"), events, rsvpBy: v("rsvpBy"), rsvpPhone: v("rsvpPhone"), language: v("language"), wording: v("wording"), notes: v("notes"), noLogo: fd.get("noLogo") === "on" };
}

function uploads(p) {
  return `<div class="two side">
    <div class="stack">${uploadForm(p, "cUpload", `data-token="${p.token}"`)}${intakeCard(p, { remind: false })}</div>
    <div class="card stack"><h3>Your references</h3><p class="small muted" style="margin:0">Couple photos, family lists, venue details, Pinterest/Instagram links, voice notes, PDFs, tagged so your designer finds them fast.</p>${assetTiles(p)}</div>
  </div>`;
}

// Preview & consolidated feedback
function preview(p) {
  const latest = p.previews.at(-1);
  const left = C.revisionsLeft(p);
  const draft = p.feedbackDraft || [];
  const canRequest = p.stage === 4;
  const lim = C.revisionLimit(p);
  return `<div class="two side">
    <div class="stack">
      ${latest ? `<div class="preview-frame"><iframe src="${attr(latest.url)}" title="Invitation preview" loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups"></iframe></div>
        <a class="btn block" href="${attr(latest.url)}" target="_blank" rel="noopener">${icon("eye", "icon sm")} Open full screen</a>` : `<div class="card">${empty("Your designer is working on it", "You'll get a WhatsApp message the moment your preview is ready.", "palette")}</div>`}
    </div>
    <div class="stack">
      <div class="card row between"><div><b>Revision rounds</b><div class="small muted">${esc(C.limitLabel(p))}</div></div>
        ${lim !== Infinity ? `<div class="meter">${Array.from({ length: lim }, (_, i) => `<span class="${i < p.revisions.length ? "used" : ""}">${i + 1}</span>`).join("")}</div>` : badge("Unlimited", "gold")}</div>
      ${canRequest && latest ? `
        <div class="card stack">
          <h3>Your changes</h3>
          <p class="small muted" style="margin:0">Add every change, then send them together as <b>one</b> revision round. Collect thoughts from family first; it saves a round.</p>
          ${draft.length ? `<div class="list">${draft.map((c, i) => `<div class="item"><span class="badge line">${esc(c.where)}</span><div class="grow small">${esc(c.text)}</div><button class="btn sm ghost" data-act="cFbDel" data-token="${p.token}" data-i="${i}" aria-label="Remove">${icon("x", "icon sm")}</button></div>`).join("")}</div>` : ""}
          <form class="form" data-form="cFbAdd" data-token="${p.token}">
            ${field("Where on the invitation", select("where", SECTIONS))}
            ${field("What should change", textarea("text", "", 'required rows="2" placeholder="e.g. Nani\'s name should be Smt. Kamla Devi Jain"'))}
            <div><button class="btn sm">${icon("plus", "icon sm")} Add change</button></div>
          </form>
          ${left > 0 || lim === Infinity ? `<button class="btn primary" data-act="cFbSend" data-token="${p.token}" ${draft.length ? "" : "disabled"}>${icon("send", "icon sm")} Send ${draft.length} change(s) as round ${p.revisions.length + 1}</button>`
            : `<div class="callout bad">${icon("info")}<div>You've used all included revision rounds. Message the studio for an extra round.</div></div>`}
        </div>
        <div class="card stack"><h3>Happy with the design?</h3><p class="small muted" style="margin:0">Approve the design and we'll run our final quality check.</p>
          <div><button class="btn" data-act="cApproveDesign" data-token="${p.token}" ${draft.length ? "disabled" : ""}>${icon("checkCircle", "icon sm")} Approve design</button></div></div>` : ""}
      ${p.stage === 6 && !p.approval ? signoff(p) : ""}
      ${p.approval ? `<div class="callout ok">${icon("checkCircle")}<div>Final approval given by ${esc(p.approval.name)} on ${C.date(p.approval.at)}.</div></div>` : ""}
      ${p.revisions.length ? `<div class="card"><h3>Past requests</h3><div class="list">${p.revisions.slice().reverse().map((r) => `<div class="item"><div class="grow"><div class="item-t">Round ${r.round}</div><div class="item-s">${C.date(r.at)} · ${r.items.length} change(s)</div></div>${badge(r.status === "resolved" ? "Done" : "In progress", r.status === "resolved" ? "ok" : "warn")}</div>`).join("")}</div></div>` : ""}
    </div>
  </div>`;
}
function signoff(p) {
  return `<form class="card form" data-form="cSignoff" data-token="${p.token}" style="border-color:var(--primary)">
    <div class="eyebrow">Final step</div><h3>Final content approval</h3>
    <p class="small" style="margin:0">Nothing is published until you approve. Please check every name, date, time and venue one last time.</p>
    ${C.balance(p) > 0 ? `<div class="callout warn">${icon("rupee")}<div>A balance of <b>${C.money(C.balance(p))}</b> is due before we publish. <a href="#/c/${p.token}/project/payment">Pay now</a></div></div>` : ""}
    <label class="check"><input type="checkbox" name="ok" required><span>I confirm all names, dates and details are correct.</span></label>
    ${field("Your full name", input("name", p.clientName, "text", "required"))}
    <div><button class="btn primary">${icon("check", "icon sm")} Give final approval</button></div>
  </form>`;
}

function payment(p) {
  const s = C.S();
  const bal = C.balance(p);
  const link = C.upiLink(p, bal);
  return `<div class="two side">
    <div class="stack">
      <div class="card"><div class="card-head"><h3>${bal ? `${C.money(bal)} due` : "All paid — thank you"}</h3>${badge(C.payStatus(p).label, C.payStatus(p).tone)}</div><div class="list">
        <div class="item"><div class="grow">${esc(s.tiers[p.tier].name)} invitation${p.addons.length ? ` + ${p.addons.length} add-on(s)` : ""}</div><b>${C.money(p.price)}</b></div>
        ${p.payments.map((x) => `<div class="item"><div class="grow small muted">Paid ${C.date(x.at)} · ${esc(x.method)}</div><b class="small">− ${C.money(x.amount)}</b></div>`).join("")}
        <div class="item"><div class="grow"><b>Balance</b></div><b>${C.money(bal)}</b></div>
      </div></div>
      <details class="card"><summary class="small" style="cursor:pointer"><b>Cancellation & refund policy</b></summary><p class="small muted" style="margin:8px 0 0">${esc(s.policy.text)}</p></details>
    </div>
    ${bal ? `<div class="stack"><div class="card stack" style="text-align:center">
      <a class="btn primary block" href="${attr(link)}">${icon("rupee", "icon sm")} Pay ${C.money(bal)} with UPI</a>
      <div class="small muted">or scan with any UPI app</div>
      <div><span class="qr">${qrSvg(link, 4)}</span></div>
      <div class="small">UPI ID: <b>${esc(s.upiId)}</b> <button class="btn sm ghost" data-act="copy" data-text="${attr(s.upiId)}" aria-label="Copy UPI ID">${icon("copy", "icon sm")}</button></div>
    </div>
    <form class="card form" data-form="cPaid" data-token="${p.token}"><h3>Already paid?</h3>
      <div class="cols">${field("Amount", input("amount", bal, "number", 'required min="1"'))}${field("UPI / bank reference", input("ref", "", "text", "required"))}</div>
      <div><button class="btn">Send to studio</button></div><p class="tiny muted" style="margin:0">We'll confirm within a day.</p></form></div>` : ""}
  </div>`;
}

function invite(p) {
  const d = p.delivery;
  if (!d) return `<div class="card">${empty("Almost there", "Your invitation link appears here once it's published.", "qr")}</div>`;
  return `<div class="two even">
    <div class="card stack">
      <div class="eyebrow">Your live invitation</div>
      <a class="btn primary block" href="${attr(d.liveUrl)}" target="_blank" rel="noopener">${icon("eye", "icon sm")} Open invitation</a>
      <div class="copy"><code>${esc(d.liveUrl)}</code><button class="btn sm" data-act="copy" data-text="${attr(d.liveUrl)}" aria-label="Copy link">${icon("copy", "icon sm")}</button></div>
      <div class="row"><a class="btn sm" target="_blank" rel="noopener" href="${attr(wa("", `You're invited! 🪔 ${d.liveUrl}`))}">${icon("message", "icon sm")} Share on WhatsApp</a><button class="btn sm" data-act="share" data-text="You're invited!" data-url="${attr(d.liveUrl)}">${icon("share", "icon sm")} Share</button></div>
      ${d.htmlFileId ? `<button class="btn" data-act="cHtmlDl" data-token="${p.token}">${icon("download", "icon sm")} Download HTML package</button>` : ""}
    </div>
    <div class="card stack" style="text-align:center"><div class="eyebrow">QR code</div><div><span class="qr">${qrSvg(d.liveUrl, 6)}</span></div>
      <p class="small muted" style="margin:0">Print it on shagun envelopes or venue standees.</p>
      <div><button class="btn sm" data-act="cQrDl" data-token="${p.token}">${icon("download", "icon sm")} Download QR</button></div></div>
  </div>`;
}

function review(p) {
  const r = p.review || {};
  const c = p.consent || {};
  return `<div class="two side">
    <form class="card form" data-form="cReview" data-token="${p.token}">
      <h3>How did we do?</h3>
      <div class="stars" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${n <= (r.rating || 0) ? "on" : ""}" data-act="cStar" data-n="${n}" aria-label="${n} star">${icon("star")}</button>`).join("")}</div>
      <input type="hidden" name="rating" value="${r.rating || 0}">
      ${field("Your words", textarea("text", r.text, 'rows="4" placeholder="What did your family love?"'))}
      <div class="label">May we share this publicly?</div>
      ${checkbox("consentPublic", r.consentPublic ?? false, "Publish my review on BFI's website & social media")}
      ${checkbox("photos", c.photos, "You may use photos from our invitation")}
      ${checkbox("names", c.names, "You may show our names")}
      ${checkbox("showcase", c.showcase, "You may showcase our invitation (portfolio, Reels)")}
      <p class="tiny muted" style="margin:0">You can change these any time. Nothing is used publicly without your consent.</p>
      <div><button class="btn primary" type="submit">${r.at ? "Update review" : "Send review"}</button></div>
    </form>
    ${p.refCode ? `<div class="card navy stack"><div class="eyebrow" style="color:#e2c07f">Know another couple?</div><h3>Share your code</h3><div class="code-big" style="color:#fff">${esc(p.refCode)}</div>
      <p class="small muted" style="margin:0">Friends who enquire with your code get priority booking, and we'll send you a thank-you gift.</p>
      <div><button class="btn gold sm" data-act="share" data-text="${attr(`We loved our BFI Marwari wedding invitation! Use my code ${p.refCode}: ${enquireLink(p.refCode)}`)}">${icon("share", "icon sm")} Share</button></div></div>` : ""}
  </div>`;
}

// ── 3 · Messages ────────────────────────
function messages(p, base, [thread = "design"]) {
  if (!C.THREADS[thread]) thread = "design";
  if (markSeen(p, thread, "client")) setTimeout(() => commit("Client read messages", p.code), 0);
  return { title: "Messages", subtitle: "Talk to your design team, the studio and QA, all in one place.", html: chatView(p, thread, "client", `${base}/messages`, Object.keys(C.THREADS)) };
}

// ── 4 · Settings ────────────────────────
function settings(p) {
  const pr = p.clientPrefs || { whatsapp: true, email: true };
  return {
    title: "Settings", subtitle: "Manage your account and preferences.",
    html: `<div class="card setlist" style="max-width:720px">
      <button class="setrow" data-act="cProfile" data-token="${p.token}"><span class="ic">${icon("user")}</span><div class="grow"><b>Profile</b><span>Update your personal information</span></div>${icon("chevron")}</button>
      <button class="setrow" data-act="cNotify" data-token="${p.token}"><span class="ic">${icon("bell")}</span><div class="grow"><b>Notifications</b><span>Email & WhatsApp preferences · ${[pr.whatsapp && "WhatsApp", pr.email && "Email"].filter(Boolean).join(" + ") || "off"}</span></div>${icon("chevron")}</button>
      <button class="setrow" data-act="cPrefs" data-token="${p.token}"><span class="ic">${icon("settings")}</span><div class="grow"><b>Project preferences</b><span>Language, best time to contact</span></div>${icon("chevron")}</button>
      <button class="setrow" data-act="cHelp"><span class="ic">${icon("info")}</span><div class="grow"><b>Help & support</b><span>Get help or contact us</span></div>${icon("chevron")}</button>
      <button class="setrow" data-act="cForget"><span class="ic">${icon("logout")}</span><div class="grow"><b>Logout</b><span>Forget this invitation on this device</span></div></button>
    </div>`,
  };
}

// ── actions ─────────────────────────────
const T = (el) => db.projects.find((x) => x.token === el.dataset?.token);
act({
  cForget: () => { try { localStorage.removeItem("bfi.client"); } catch {} location.hash = "/"; },
  cProfile: (el) => { const p = T(el); sheet("Profile", `<form class="form" data-form="cProfileSave" data-token="${p.token}">${field("Your name", input("clientName", p.clientName, "text", "required"))}<div class="cols">${field("Phone", input("phone", p.phone, "tel"))}${field("Email", input("email", p.email, "email"))}</div><button class="btn primary">Save</button></form>`); },
  cProfileSave: (d, f) => { const p = T(f); Object.assign(p, { clientName: d.clientName, phone: d.phone.replace(/\D/g, ""), email: d.email }); closeSheet(); commit("Client profile", p.code); toast("Saved"); },
  cNotify: (el) => { const p = T(el); const pr = p.clientPrefs || { whatsapp: true, email: true }; sheet("Notifications", `<form class="form" data-form="cNotifySave" data-token="${p.token}">
      <div class="setrow"><span class="ic">${icon("message")}</span><div class="grow"><b>WhatsApp</b><span>Preview ready, reminders, delivery</span></div>${toggle("whatsapp", pr.whatsapp)}</div>
      <div class="setrow"><span class="ic">${icon("mail")}</span><div class="grow"><b>Email</b><span>Invoices and receipts</span></div>${toggle("email", pr.email)}</div>
      <button class="btn primary">Save</button></form>`); },
  cNotifySave: (d, f) => { const p = T(f); p.clientPrefs = { ...(p.clientPrefs || {}), whatsapp: d.whatsapp, email: d.email }; closeSheet(); commit("Client notifications", p.code); toast("Saved"); },
  cPrefs: (el) => { const p = T(el); const pr = p.clientPrefs || {}; sheet("Project preferences", `<form class="form" data-form="cPrefsSave" data-token="${p.token}">
      ${field("Invitation language", select("language", ["English", "Hindi", "English + Hindi", "Marwari + Hindi"], p.intake?.language || "English + Hindi"))}
      ${field("Best time to contact", select("contactTime", ["Anytime", "Morning", "Afternoon", "Evening"], pr.contactTime || "Anytime"))}
      ${field("Who should we coordinate with?", input("coordinator", pr.coordinator || "", "text", 'placeholder="e.g. Bride\'s brother, Rahul — 98…"'))}
      <button class="btn primary">Save</button></form>`); },
  cPrefsSave: (d, f) => { const p = T(f); p.clientPrefs = { ...(p.clientPrefs || {}), contactTime: d.contactTime, coordinator: d.coordinator }; p.intake = { ...p.intake, language: d.language }; closeSheet(); commit("Client preferences", p.code); toast("Saved"); },
  cHelp: () => sheet("Help & support", `<div class="menu-list">
      <a href="https://wa.me/${attr(C.S().whatsapp)}" target="_blank" rel="noopener">${icon("message")}<span class="grow">WhatsApp the studio</span></a>
      <a href="mailto:${attr(C.S().email)}">${icon("mail")}<span class="grow">${esc(C.S().email)}</span></a></div>
      <div class="stack sm" style="margin-top:12px"><b class="small">Good to know</b><p class="small muted" style="margin:0">Send all changes for a round together. Your designer works through them as one checklist, and it counts as one round.</p><p class="small muted" style="margin:0">${esc(C.S().policy.text)}</p></div>`),
  cEventAdd: (el) => { const box = el.closest("form").querySelector("[data-events]"); box.insertAdjacentHTML("beforeend", eventRow({}, box.children.length)); },
  cEventDel: (el) => { const row = el.closest("[data-event-row]"); if (row.parentElement.children.length > 1) row.remove(); },
  cIntakeDraft: (el) => saveIntake(el.closest("form"), false),
  cIntake: (_, form) => saveIntake(form, true),
  cUpload: async (d, f) => {
    const p = T(f);
    const n = await addAssets(p, d, "Client");
    if (!n) { toast("Choose a file or paste a link"); return; }
    commit("Client upload", p.code, `${n} item(s)`);
    toast(`${n} added — thank you!`);
  },
  cFbAdd: (d, f) => { const p = T(f); p.feedbackDraft = [...(p.feedbackDraft || []), { where: d.where, text: d.text }]; commit("Client feedback draft", p.code); },
  cFbDel: (el) => { const p = T(el); p.feedbackDraft.splice(Number(el.dataset.i), 1); commit("Client feedback draft", p.code); },
  cFbSend: (el) => {
    const p = T(el);
    if (C.revisionsLeft(p) <= 0) { toast("No revision rounds left"); return; }
    const items = (p.feedbackDraft || []).map((c) => ({ text: c.text, where: c.where, done: false }));
    if (!items.length) return;
    const round = p.revisions.length + 1;
    p.revisions.push({ id: uid("r"), round, at: now(), summary: [...new Set(items.map((i) => i.where))].join(", "), items, status: "open" });
    p.feedbackDraft = [];
    C.setStage(p, 3);
    commit("Revision request", p.code, `round ${round}, ${items.length} change(s)`);
    toast(`Round ${round} sent — your designer is on it`);
  },
  cApproveDesign: (el) => { const p = T(el); C.setStage(p, 5); p.designApprovedAt = now(); commit("Client approved design", p.code); toast("Thank you! Final checks next."); },
  cSignoff: (d, f) => { const p = T(f); p.approval = { at: now(), name: d.name }; commit("Final approval", p.code, d.name); toast("Approved — we'll publish shortly"); },
  cPaid: (d, f) => {
    const p = T(f);
    p.notes.push({ id: uid("n"), at: now(), byId: null, text: `Client reports payment of ${C.money(d.amount)} — ref ${d.ref}. Verify and record it.`, tag: "Payment claimed" });
    commit("Client payment claim", p.code, `${C.money(d.amount)} ${d.ref}`);
    toast("Sent — we'll confirm soon");
  },
  cQrDl: (el) => { const p = T(el); download(`${p.code}-invitation-qr.svg`, qrSvg(p.delivery.liveUrl, 10), "image/svg+xml"); },
  cHtmlDl: async (el) => { const p = T(el); const url = await fileUrl(p.delivery.htmlFileId); if (!url) { toast("Package not available on this device — ask the studio"); return; } const a = document.createElement("a"); a.href = url; a.download = p.delivery.htmlName || "invitation.zip"; a.click(); },
  cStar: (el) => { const form = el.closest("form"); const n = Number(el.dataset.n); form.rating.value = n; form.querySelectorAll(".stars button").forEach((b, i) => b.classList.toggle("on", i < n)); },
  cReview: (d, f) => {
    const p = T(f);
    if (!Number(d.rating)) { toast("Tap the stars to rate"); return; }
    p.review = { ...(p.review || {}), rating: Number(d.rating), text: d.text, at: p.review?.at || now(), consentPublic: d.consentPublic, approved: d.consentPublic ? p.review?.approved || false : false };
    p.consent = { photos: d.photos, names: d.names, testimonial: d.consentPublic, showcase: d.showcase, at: now(), method: "Client portal toggle" };
    if (p.testimonialRequest) p.testimonialRequest.respondedAt = p.testimonialRequest.respondedAt || now();
    commit("Client review", p.code, `${d.rating}★, public ${d.consentPublic ? "yes" : "no"}`);
    toast("Thank you so much! 🙏");
  },
});

function saveIntake(form, submit) {
  const p = db.projects.find((x) => x.token === form.dataset.token);
  const data = readIntake(form);
  p.intake = { ...p.intake, ...data, ...(submit ? { submittedAt: now() } : {}) };
  if (data.brideName) p.brideName = data.brideName.split(" ")[0];
  if (data.groomName) p.groomName = data.groomName.split(" ")[0];
  if (submit && p.stage === 2 && C.checklist(p).filter((c) => c.done && c.tab === "details").length >= 2) C.setStage(p, 3);
  commit(submit ? "Client submitted details" : "Client saved draft", p.code);
  toast(submit ? "Details submitted — thank you!" : "Draft saved");
}
