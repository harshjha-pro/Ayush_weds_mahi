// Client portal — no account, opened by a private, non-guessable link.
// Shows only this couple's project: never pricing negotiation, internal
// notes, team or other clients.

import { db, commit, uid, now, fileUrl } from "../db.js";
import { STAGES, PURPOSES } from "../seed.js";
import { icon, crest } from "../icons.js";
import { esc, attr, act, toast, badge, empty, field, input, textarea, select, checkbox, timeline, wa, qrSvg, download, share } from "../ui.js";
import * as C from "../calc.js";
import { addAssets, assetTiles, hydrateFiles, uploadForm, coupleName, clientLink } from "./project.js";
import { enquireLink } from "./marketing.js";

const SECTIONS = ["Cover", "Couple & family names", "Events & timings", "Venue & map", "Photos", "RSVP", "Colours & style", "Wording / language", "Other"];
const EVENT_NAMES = ["Ganesh puja", "Mayra / Bhaat", "Haldi", "Mehendi", "Mahila sangeet", "Sangeet", "Baraat", "Phera", "Reception", "Other"];

export function portal(tok, tab) {
  const p = tok && db.projects.find((x) => x.token === tok);
  if (!p) return { title: "Not found", html: `<div class="entry"><div class="entry-box crest">${crest()}<h2>Link not recognised</h2><p style="text-transform:none;letter-spacing:0">Please use the private link the BFI studio sent you on WhatsApp.</p><a class="btn" href="#/">Back</a></div></div>` };
  const delivered = p.status === "delivered";
  const nav = delivered
    ? [["status", "Status", "home"], ["invite", "Invite", "qr"], ["review", "Review", "star"], ["preview", "Preview", "eye"], ["payment", "Payment", "rupee"]]
    : [["status", "Status", "home"], ["details", "Details", "edit"], ["uploads", "Uploads", "upload"], ["preview", "Preview", "eye"], ["payment", "Payment", "rupee"]];
  const all = ["status", "details", "uploads", "preview", "payment", "invite", "review"];
  if (!all.includes(tab)) tab = "status";
  const base = `#/c/${p.token}`;
  const body = { status, details, uploads, preview, payment, invite, review }[tab](p, base);
  return {
    title: coupleName(p),
    html: `
    <div class="main" style="padding-bottom:calc(84px + var(--safe-b))">
      <header class="topbar"><span class="brand">${crest()}<div><b>BFI</b><small>Marwari Invitations</small></div></span><div class="grow"></div>
        <a class="icon-btn" target="_blank" rel="noopener" href="${attr(wa(C.S().whatsapp, `Namaste BFI, this is ${p.clientName} (${p.code}).`))}" aria-label="WhatsApp the studio">${icon("message")}</a></header>
      <main class="content" style="max-width:720px">${body}</main>
      <nav class="tabbar" style="display:grid">${nav.map(([k, l, ic]) => `<a href="${base}/${k}" class="${k === tab ? "on" : ""}">${icon(ic)}<span>${l}</span></a>`).join("")}</nav>
    </div>`,
    after: (root) => { hydrateFiles(root); if (tab === "details") wireEvents(root); },
  };
}

function hero(p) {
  const i = p.intake || {};
  const b = i.brideName?.split(" ")[0] || p.brideName, g = i.groomName?.split(" ")[0] || p.groomName;
  return `<div class="portal-hero">
    <div class="eyebrow">Shubh vivah</div>
    <div class="names">${b && g ? `${esc(b)} <span class="amp">&amp;</span> ${esc(g)}` : esc(p.clientName)}</div>
    <div class="small muted" style="margin-top:6px">${C.date(p.weddingDate)}${p.city ? " · " + esc(p.city) : ""}</div>
  </div>`;
}

function status(p, base) {
  const st = STAGES[p.stage];
  const cl = C.checklist(p);
  const cta = {
    collect: [`${base}/details`, "Fill in your details"],
    review: [`${base}/preview`, "Open your preview"],
    approve: [C.balance(p) > 0 ? `${base}/payment` : `${base}/preview`, C.balance(p) > 0 ? "Clear balance & approve" : "Give final approval"],
    delivered: [`${base}/invite`, "Get your invitation"],
  }[st.key];
  const daysTo = C.daysUntil(p.weddingDate);
  return `<div class="stack lg">
    ${hero(p)}
    ${p.status === "cancelled" ? `<div class="callout bad">${icon("info")}<div>This project was cancelled. Please contact the studio for any questions.</div></div>` : `
    <div class="card next stack">
      <div class="eyebrow">What we need from you</div>
      <h3>${esc(st.need)}</h3>
      ${cta ? `<a class="btn primary" href="${cta[0]}">${esc(cta[1])} ${icon("arrowRight", "icon sm")}</a>` : ""}
    </div>`}
    <div class="card"><div class="card-head"><h3>Your invitation's journey</h3>${daysTo > 0 ? badge(`${daysTo} days to go`, "gold") : ""}</div>${timeline(p.stage, { client: true })}</div>
    ${p.stage <= 3 ? `<div class="card"><div class="card-head"><h3>Details checklist</h3>${badge(`${C.checklistDone(p)}/${cl.length}`, C.checklistDone(p) === cl.length ? "ok" : "warn")}</div>
      <div class="list">${cl.map((c) => `<div class="item">${icon(c.done ? "checkCircle" : "clock", "icon sm")}<div class="grow ${c.done ? "" : ""}">${esc(c.label)}</div>${c.done ? "" : `<a class="small" href="${base}/${["photo", "style", "family", "venue"].includes(c.key) && c.key !== "family" ? "uploads" : "details"}">Add</a>`}</div>`).join("")}</div></div>` : ""}
    <div class="grid kpi">
      <div class="card"><div class="kpi-l">Revisions</div><div class="kpi-v" style="font-size:22px">${C.revisionLimit(p) === Infinity ? "Unlimited" : `${C.revisionsLeft(p)} left`}</div><div class="kpi-s">${esc(C.limitLabel(p))}</div></div>
      <div class="card"><div class="kpi-l">Payment</div><div class="kpi-v" style="font-size:22px">${C.balance(p) ? C.money(C.balance(p)) : "Paid"}</div><div class="kpi-s">${C.balance(p) ? "balance due" : "thank you"}</div></div>
    </div>
    <p class="tiny muted" style="text-align:center">${icon("lock", "icon sm")} This page is private to you. Please don't share the link publicly.</p>
  </div>`;
}

// ── Structured intake ───────────────────
const eventRow = (e = {}, i = 0) => `
  <div class="card flat stack" data-event-row style="padding:12px">
    <div class="row between"><b class="small">Function ${i + 1}</b><button class="btn sm ghost" type="button" data-act="cEventDel">${icon("trash", "icon sm")}</button></div>
    <div class="cols">
      ${field("Function", select("evName[]", EVENT_NAMES, e.name || "Phera"))}
      ${field("Date", input("evDate[]", e.date, "date"))}
      ${field("Time", input("evTime[]", e.time, "time"))}
    </div>
    <div class="cols">${field("Venue", input("evVenue[]", e.venue, "text", 'placeholder="e.g. Rambagh Palace"'))}${field("Dress code", input("evDress[]", e.dress, "text", 'placeholder="optional"'))}</div>
    ${field("Address / Maps link", input("evAddress[]", e.address, "text"))}
  </div>`;

function details(p) {
  const i = p.intake || {};
  const locked = p.stage >= 4;
  return `<div class="stack lg">
    <div><div class="eyebrow">Step by step</div><h2>Wedding details</h2><p class="small muted">Fill in what you have — you can save and come back. Please spell names exactly as they should appear.</p></div>
    ${locked ? `<div class="callout">${icon("info")}<div>Your design is in progress. For changes now, send them with your revision request on the Preview tab.</div></div>` : ""}
    <form class="form" data-form="cIntake" data-token="${p.token}">
      <fieldset class="card form" ${locked ? "disabled" : ""} style="border:1px solid var(--line)">
        <h3>1 · The couple</h3>
        <div class="cols">${field("Bride's full name", input("brideName", i.brideName))}${field("Groom's full name", input("groomName", i.groomName))}</div>
      </fieldset>
      <fieldset class="card form" ${locked ? "disabled" : ""} style="border:1px solid var(--line)">
        <h3>2 · Families</h3>
        ${field("Bride's parents", input("brideParents", i.brideParents, "text", 'placeholder="Mr. & Mrs. …"'))}
        ${field("Groom's parents", input("groomParents", i.groomParents, "text", 'placeholder="Mr. & Mrs. …"'))}
        ${field("Grandparents / blessings (Dada-Dadi, Nana-Nani)", textarea("grandparents", i.grandparents, 'rows="2"'))}
      </fieldset>
      <fieldset class="card form" ${locked ? "disabled" : ""} style="border:1px solid var(--line)">
        <h3>3 · Functions</h3>
        <div class="stack" data-events>${(i.events?.length ? i.events : [{}]).map(eventRow).join("")}</div>
        <button class="btn sm" type="button" data-act="cEventAdd">${icon("plus", "icon sm")} Add function</button>
      </fieldset>
      <fieldset class="card form" ${locked ? "disabled" : ""} style="border:1px solid var(--line)">
        <h3>4 · RSVP & wording</h3>
        <div class="cols">${field("RSVP by", input("rsvpBy", i.rsvpBy, "date"))}${field("RSVP contact number", input("rsvpPhone", i.rsvpPhone, "tel"))}</div>
        <div class="cols">${field("Language", select("language", ["English", "Hindi", "English + Hindi", "Marwari + Hindi", "Gujarati + English"], i.language || "English + Hindi"))}${field("Opening line", select("wording", ["Shri Ganeshaya Namah", "Om Shri Ganeshaya Namah", "Jai Shri Krishna", "Custom (tell us below)"], i.wording || "Shri Ganeshaya Namah"))}</div>
        ${field("Anything else", textarea("notes", i.notes, 'rows="3" placeholder="Special rituals, people to mention, colours you love…"'))}
      </fieldset>
      ${locked ? "" : `<div class="row"><button class="btn" name="mode" value="draft" data-act="cIntakeDraft">Save draft</button><button class="btn primary" name="mode" value="submit">${icon("check", "icon sm")} Submit details</button></div>
        ${i.submittedAt ? `<p class="small muted">Submitted ${C.date(i.submittedAt)} — you can update and resubmit until design starts.</p>` : ""}`}
    </form>
  </div>`;
}
function wireEvents() { /* rows are added via delegated actions */ }
function readIntake(form) {
  const fd = new FormData(form);
  const g = (k) => fd.getAll(k);
  const names = g("evName[]");
  const events = names.map((name, i) => ({ name, date: g("evDate[]")[i], time: g("evTime[]")[i], venue: g("evVenue[]")[i].trim(), dress: g("evDress[]")[i].trim(), address: g("evAddress[]")[i].trim() })).filter((e) => e.date || e.venue);
  const v = (k) => (fd.get(k) || "").toString().trim();
  return { brideName: v("brideName"), groomName: v("groomName"), brideParents: v("brideParents"), groomParents: v("groomParents"), grandparents: v("grandparents"), events, rsvpBy: v("rsvpBy"), rsvpPhone: v("rsvpPhone"), language: v("language"), wording: v("wording"), notes: v("notes") };
}

function uploads(p) {
  return `<div class="stack lg">
    <div><div class="eyebrow">References</div><h2>Photos & inspiration</h2><p class="small muted">Couple photos, family name lists, venue details, Pinterest or Instagram links, voice notes, PDFs — tag each so your designer finds it fast.</p></div>
    ${uploadForm(p, "cUpload").replace('data-pid=', `data-token="${p.token}" data-pid=`)}
    ${assetTiles(p)}
  </div>`;
}

// ── Preview & consolidated feedback ─────
function preview(p) {
  const latest = p.previews.at(-1);
  const left = C.revisionsLeft(p);
  const draft = p.feedbackDraft || [];
  const canRequest = p.stage === 4;
  const lim = C.revisionLimit(p);
  return `<div class="stack lg">
    <div><div class="eyebrow">Preview</div><h2>${latest ? "Your invitation" : "Preview coming soon"}</h2></div>
    ${latest ? `<div class="preview-frame"><iframe src="${attr(latest.url)}" title="Invitation preview" loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups"></iframe></div>
      <a class="btn block" href="${attr(latest.url)}" target="_blank" rel="noopener">${icon("eye", "icon sm")} Open full screen</a>` : empty("Your designer is working on it", "You'll get a WhatsApp message the moment it's ready.", "palette")}
    <div class="card row between"><div><b>Revision rounds</b><div class="small muted">${esc(C.limitLabel(p))}</div></div>
      ${lim !== Infinity ? `<div class="meter">${Array.from({ length: lim }, (_, i) => `<span class="${i < p.revisions.length ? "used" : ""}">${i + 1}</span>`).join("")}</div>` : badge("Unlimited", "gold")}</div>
    ${canRequest && latest ? `
      <div class="card stack">
        <h3>Changes</h3>
        <p class="small muted">Add every change here, then send them together as <b>one</b> revision round. Collect thoughts from family first — it saves a round.</p>
        ${draft.length ? `<div class="list">${draft.map((c, i) => `<div class="item"><span class="badge line">${esc(c.where)}</span><div class="grow small">${esc(c.text)}</div><button class="btn sm ghost" data-act="cFbDel" data-token="${p.token}" data-i="${i}">${icon("x", "icon sm")}</button></div>`).join("")}</div>` : ""}
        <form class="form" data-form="cFbAdd" data-token="${p.token}">
          <div class="cols">${field("Where on the invitation", select("where", SECTIONS))}</div>
          ${field("What should change", textarea("text", "", 'required rows="2" placeholder="e.g. Nani\'s name should be Smt. Kamla Devi Jain"'))}
          <button class="btn sm">${icon("plus", "icon sm")} Add change</button>
        </form>
        ${left > 0 || lim === Infinity ? `<button class="btn primary" data-act="cFbSend" data-token="${p.token}" ${draft.length ? "" : "disabled"}>${icon("send", "icon sm")} Send ${draft.length} change(s) as round ${p.revisions.length + 1}</button>`
          : `<div class="callout bad">${icon("info")}<div>You've used all included revision rounds. Message the studio for an extra round.</div></div>`}
      </div>
      <div class="card stack"><h3>Happy with the design?</h3><p class="small muted">Approve the design and we'll run our final quality check.</p>
        <button class="btn" data-act="cApproveDesign" data-token="${p.token}" ${draft.length ? "disabled" : ""}>${icon("checkCircle", "icon sm")} Approve design</button></div>` : ""}
    ${p.stage === 6 && !p.approval ? signoff(p) : ""}
    ${p.approval ? `<div class="callout ok">${icon("checkCircle")}<div>Final approval given by ${esc(p.approval.name)} on ${C.date(p.approval.at)}.</div></div>` : ""}
    ${p.revisions.length ? `<div class="card"><h3>Past requests</h3><div class="list">${p.revisions.slice().reverse().map((r) => `<div class="item"><div class="grow"><div class="item-t">Round ${r.round}</div><div class="item-s">${C.date(r.at)} · ${r.items.length} change(s)</div></div>${badge(r.status === "resolved" ? "Done" : "In progress", r.status === "resolved" ? "ok" : "gold")}</div>`).join("")}</div></div>` : ""}
  </div>`;
}

function signoff(p) {
  return `<form class="card next form" data-form="cSignoff" data-token="${p.token}">
    <div class="eyebrow">Final step</div><h3>Final content approval</h3>
    <p class="small">Nothing is published until you approve. Please check every name, date, time and venue one last time.</p>
    ${C.balance(p) > 0 ? `<div class="callout">${icon("rupee")}<div>A balance of <b>${C.money(C.balance(p))}</b> is due before we publish. <a href="#/c/${p.token}/payment">Pay now</a></div></div>` : ""}
    <label class="check"><input type="checkbox" name="ok" required><span>I confirm all names, dates and details are correct.</span></label>
    ${field("Your full name", input("name", p.clientName, "text", "required"))}
    <button class="btn primary">${icon("check", "icon sm")} Give final approval</button>
  </form>`;
}

function payment(p) {
  const s = C.S();
  const bal = C.balance(p);
  const link = C.upiLink(p, bal);
  return `<div class="stack lg">
    <div><div class="eyebrow">Payment</div><h2>${bal ? `${C.money(bal)} due` : "All paid — thank you"}</h2></div>
    <div class="card"><div class="list">
      <div class="item"><div class="grow">${esc(s.tiers[p.tier].name)} invitation${p.addons.length ? ` + ${p.addons.length} add-on(s)` : ""}</div><b>${C.money(p.price)}</b></div>
      ${p.payments.map((x) => `<div class="item"><div class="grow small muted">Paid ${C.date(x.at)} · ${esc(x.method)}</div><b class="small">− ${C.money(x.amount)}</b></div>`).join("")}
      <div class="item"><div class="grow"><b>Balance</b></div><b>${C.money(bal)}</b></div>
    </div></div>
    ${bal ? `<div class="card stack" style="text-align:center">
      <a class="btn primary block" href="${attr(link)}">${icon("rupee", "icon sm")} Pay ${C.money(bal)} with UPI</a>
      <div class="small muted">or scan with any UPI app</div>
      <div><span class="qr">${qrSvg(link, 4)}</span></div>
      <div class="small">UPI ID: <b>${esc(s.upiId)}</b> <button class="btn sm ghost" data-act="copy" data-text="${attr(s.upiId)}">${icon("copy", "icon sm")}</button></div>
    </div>
    <form class="card form" data-form="cPaid" data-token="${p.token}"><h3>Already paid?</h3>
      <div class="cols">${field("Amount", input("amount", bal, "number", 'required min="1"'))}${field("UPI / bank reference", input("ref", "", "text", "required"))}</div>
      <button class="btn">Send to studio</button><p class="tiny muted">We'll confirm within a day.</p></form>` : ""}
    <details class="card"><summary class="small"><b>Cancellation & refund policy</b></summary><p class="small muted" style="margin-top:8px">${esc(s.policy.text)}</p></details>
  </div>`;
}

function invite(p) {
  const d = p.delivery;
  if (!d) return empty("Almost there", "Your invitation link appears here once it's published.", "qr");
  return `<div class="stack lg" style="text-align:center">
    ${hero(p)}
    <div class="card stack">
      <div class="eyebrow">Your live invitation</div>
      <a class="btn primary block" href="${attr(d.liveUrl)}" target="_blank" rel="noopener">${icon("eye", "icon sm")} Open invitation</a>
      <div class="copy"><code>${esc(d.liveUrl)}</code><button class="btn sm" data-act="copy" data-text="${attr(d.liveUrl)}">${icon("copy", "icon sm")}</button></div>
      <div class="row" style="justify-content:center"><a class="btn sm" target="_blank" rel="noopener" href="${attr(wa("", `You're invited! 🪔 ${d.liveUrl}`))}">${icon("message", "icon sm")} Share on WhatsApp</a><button class="btn sm" data-act="share" data-text="You're invited!" data-url="${attr(d.liveUrl)}">${icon("share", "icon sm")} Share</button></div>
    </div>
    <div class="card stack"><div class="eyebrow">QR code</div><div><span class="qr" data-qr>${qrSvg(d.liveUrl, 6)}</span></div>
      <p class="small muted">Print it on shagun envelopes or venue standees.</p>
      <button class="btn sm" data-act="cQrDl" data-token="${p.token}">${icon("download", "icon sm")} Download QR</button></div>
    ${d.htmlFileId ? `<div class="card stack"><div class="eyebrow">Offline copy</div><button class="btn" data-act="cHtmlDl" data-token="${p.token}">${icon("download", "icon sm")} Download HTML package</button><p class="tiny muted">${esc(d.htmlName || "")}</p></div>` : ""}
    <a class="btn" href="#/c/${p.token}/review">${icon("star", "icon sm")} Tell us how we did</a>
  </div>`;
}

function review(p) {
  const r = p.review || {};
  const c = p.consent || {};
  return `<div class="stack lg">
    <div><div class="eyebrow">Thank you</div><h2>How did we do?</h2></div>
    <form class="card form" data-form="cReview" data-token="${p.token}">
      <div class="stars" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${n <= (r.rating || 0) ? "on" : ""}" data-act="cStar" data-n="${n}" aria-label="${n} star">${icon("star")}</button>`).join("")}</div>
      <input type="hidden" name="rating" value="${r.rating || 0}">
      ${field("Your words", textarea("text", r.text, 'rows="4" placeholder="What did your family love?"'))}
      <div class="label">May we share this publicly?</div>
      ${checkbox("consentPublic", r.consentPublic ?? false, "Publish my review on BFI's website & social media")}
      ${checkbox("photos", c.photos, "You may use photos from our invitation")}
      ${checkbox("names", c.names, "You may show our names")}
      ${checkbox("showcase", c.showcase, "You may showcase our invitation (portfolio, Reels)")}
      <p class="tiny muted">You can change these any time. Nothing is used publicly without your consent.</p>
      <button class="btn primary">${r.at ? "Update" : "Send review"}</button>
    </form>
    ${p.refCode ? `<div class="card royal stack"><div class="eyebrow">Know another couple?</div><h3>Share your code</h3><div class="code-big">${esc(p.refCode)}</div>
      <p class="small muted" style="margin:0">Friends who enquire with your code get priority booking — and we'll send you a thank-you gift.</p>
      <div class="row"><button class="btn gold sm" data-act="share" data-text="${attr(`We loved our BFI Marwari wedding invitation! Use my code ${p.refCode}: ${enquireLink(p.refCode)}`)}">${icon("share", "icon sm")} Share</button></div></div>` : ""}
  </div>`;
}

// ── actions ─────────────────────────────
const T = (el) => db.projects.find((x) => x.token === (el.dataset?.token || el.getAttribute?.("data-token")));
act({
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
  cSignoff: (d, f) => {
    const p = T(f);
    p.approval = { at: now(), name: d.name };
    commit("Final approval", p.code, d.name);
    toast("Approved — we'll publish shortly");
  },
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
  if (submit && p.stage === 2 && C.checklistDone(p) >= 5) C.setStage(p, 3);
  commit(submit ? "Client submitted details" : "Client saved draft", p.code);
  toast(submit ? "Details submitted — thank you!" : "Draft saved");
}
