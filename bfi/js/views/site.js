// The BFI website: services, packages, add-ons, design catalogue, process,
// reviews, delivery formats, partner programme, FAQ and contact.
// Public visitors see it at #/site; signed-in clients see it as Home,
// where "Book" starts a new project on their account.

import { db } from "../db.js";
import { icon, crest } from "../icons.js";
import { esc, attr, act, sheet, closeSheet, badge, templateArt, wa } from "../ui.js";
import * as C from "../calc.js";

const SECTIONS = [["services", "Services"], ["packages", "Packages"], ["designs", "Designs"], ["process", "How it works"], ["reviews", "Reviews"], ["faq", "FAQ"], ["contact", "Contact"]];

const TIER_FEATURES = {
  basic: ["Curated Marwari template", "Names, dates, venue & RSVP", "Mobile-first invitation website", "WhatsApp-ready share link + QR", "1 revision round"],
  premium: ["Personalised design", "Couple photos & gallery", "Full event schedule (Mehendi to Phera)", "Countdown, maps & interactive RSVP", "2 revision rounds"],
  luxury: ["Fully custom design & development", "Multiple function pages", "Your story, family & traditions", "Music, animations & bespoke details", "Unlimited reasonable revisions"],
};
const ADDON_INFO = {
  std: "Announce the date months ahead with a matching mini-invite.",
  event: "A dedicated page for Mayra, Haldi, Sangeet or any function.",
  itin: "Hour-by-hour plan for guests across all functions.",
  travel: "Hotels, travel, local tips and contacts for outstation guests.",
  thanks: "A thank-you page with photos after the wedding.",
};
const FAQ = () => [
  ["How long does it take?", `Basic is ready in about ${C.S().tiers.basic.days} days, Premium in ${C.S().tiers.premium.days} and Luxury in ${C.S().tiers.luxury.days}. Rush delivery is available for a ${C.S().rushFee}% fee.`],
  ["What do we need to send you?", "Names (spelt exactly as they should appear), family names, functions with dates, times and venues, RSVP details, and a few couple photos. Our guided form and upload page make it easy, and nothing gets missed."],
  ["How do revisions work?", "You send all changes together as one revision round from your private page. Your designer works through them as a checklist. Basic includes 1 round, Premium 2, Luxury unlimited reasonable rounds."],
  ["How long is the invitation hosted?", "Your invitation stays online through the wedding and for at least 6 months after. Custom domains and longer hosting are available on request. Where suitable we also give you a downloadable HTML copy."],
  ["Do you do Hindi or Marwari wording?", "Yes: English, Hindi, Marwari and bilingual invitations, with traditional openings like “Shri Ganeshaya Namah” and family blessings written the way your family wants."],
  ["We live abroad. Can you still help?", "Absolutely. Many of our couples are NRI families. Everything happens online, and guests anywhere can open the invitation on their phone."],
  ["How do payments work?", "A booking amount to start, and the balance before we publish. Pay by UPI from your private page. Here is our policy: " + C.S().policy.text],
  ["Are our photos and details private?", "Yes. Your project page uses a private, non-guessable link, and we never use your photos, names or review publicly without your consent, which you control."],
];

function hero(mode, client) {
  const tpls = db.templates.filter((t) => t.status === "active").slice(0, 3);
  const delivered = db.projects.filter((p) => p.status === "delivered").length;
  const reviews = db.projects.filter((p) => p.review);
  const avg = reviews.length ? (reviews.reduce((s, p) => s + p.review.rating, 0) / reviews.length).toFixed(1) : "5.0";
  return `<section class="site-hero">
    <div class="site-hero-in">
      <div class="stack">
        <div class="eyebrow" style="color:#e2c07f">BFI · Marwari Invitations</div>
        <h1 class="site-h1">Digital wedding invitations, crafted for Marwari families</h1>
        <p class="site-lead">Rituals, family names and traditions, designed with care and delivered as a beautiful invitation website your guests open on their phones.</p>
        <div class="row">
          <button class="btn gold" data-act="siteBook">${icon("plus", "icon sm")} ${mode === "client" ? "Start a new invitation" : "Book a consultation"}</button>
          <button class="btn site-ghost" data-act="siteJump" data-to="designs">Explore designs</button>
        </div>
        ${C.capacity() ? `<div><span class="cap-pill ${C.capacity().full ? "full" : ""}"><span class="dot"></span>${esc(C.capacityLine())}</span></div>` : ""}
        <div class="site-stats">
          <div><b>${Math.max(delivered, 1)}+</b><span>families served</span></div>
          <div><b>${avg}★</b><span>average rating</span></div>
          <div><b>${C.S().tiers.basic.days} days</b><span>fastest delivery</span></div>
        </div>
      </div>
      <div class="site-collage" aria-hidden="true">${tpls.map((t, i) => `<div class="tpl c${i}"><div class="art">${templateArt(t)}</div></div>`).join("")}</div>
    </div>
  </section>`;
}

function welcomeStrip(client, base) {
  const ps = db.projects.filter((p) => p.clientId === client.id && p.status !== "cancelled");
  const active = ps.filter((p) => p.status === "active");
  const pending = db.leads.filter((l) => l.clientId === client.id && !["converted", "lost"].includes(l.stage));
  return `<div class="card site-welcome">
    <div class="row between"><div><div class="eyebrow">Welcome back</div><h2>${esc(client.name)}</h2></div><a class="btn primary" href="${base}/dashboard">${icon("home", "icon sm")} My dashboard</a></div>
    ${active.length || pending.length ? `<div class="grid three" style="margin-top:12px">${active.map((p) => `<a class="card flat tight" href="${base}/p/${p.id}" style="color:inherit;text-decoration:none"><b class="small">${esc(p.occasion || "Wedding invitation")}</b><div class="tiny muted">${esc(C.stageName(p.stage))} · ${C.progressPct(p)}%</div><div class="progress" style="margin-top:6px"><i style="width:${C.progressPct(p)}%"></i></div></a>`).join("")}
      ${pending.map((l) => `<div class="card flat tight"><b class="small">${esc(l.occasion || "New invitation")}</b><div class="tiny muted">Requested ${C.ago(l.createdAt)}: the studio will confirm shortly</div></div>`).join("")}</div>` : `<p class="small muted" style="margin:8px 0 0">Planning another celebration? Pick a package or design below and we'll start a new project on your account.</p>`}
  </div>`;
}

export function website({ mode = "public", client = null, base = "" } = {}) {
  const s = C.S();
  const tpls = db.templates.filter((t) => t.status === "active");
  const reviews = db.projects.filter((p) => p.review?.approved && p.review.consentPublic && p.consent.testimonial);
  return `<div class="site ${mode}">
    ${mode === "client" && client ? welcomeStrip(client, base) : ""}
    ${hero(mode, client)}
    <nav class="site-nav chips" aria-label="Sections">${SECTIONS.map(([k, l]) => `<button class="chip" data-act="siteJump" data-to="${k}">${l}</button>`).join("")}</nav>

    <section class="site-sec" id="sec-services">
      <div class="site-head"><div class="eyebrow">What we do</div><h2>Services</h2><p>Everything your wedding invitation needs, from a quick curated design to a fully bespoke experience.</p></div>
      <div class="grid four">
        ${[["palette", "Done-for-you invitations", "Pick a Marwari template and we personalise everything: names, functions, photos, RSVP. Three packages to suit every family."],
          ["wand", "Bespoke invitation experiences", "A fully custom invitation website, built from scratch around your story, your traditions and every function."],
          ["layers", "Add-on services", "Save-the-dates, extra function pages, itineraries, guest travel guides and thank-you pages."],
          ["qr", "Delivery that just works", "A mobile-first invitation link for WhatsApp, a QR code for cards and standees, and a downloadable copy where suitable."]]
          .map(([ic, t, d]) => `<div class="card site-card"><span class="site-ic">${icon(ic)}</span><h3>${t}</h3><p class="small muted">${d}</p></div>`).join("")}
      </div>
    </section>

    <section class="site-sec" id="sec-packages">
      <div class="site-head"><div class="eyebrow">Products & pricing</div><h2>Packages</h2><p>Transparent pricing. Every package includes a private project page to track progress, send changes and pay.</p></div>
      ${capacityCard()}
      <div class="grid three">${Object.entries(s.tiers).map(([k, t]) => `
        <div class="card price-card ${k === "premium" ? "featured" : ""}">
          ${k === "premium" ? `<span class="badge gold" style="align-self:flex-start">Most popular</span>` : ""}
          <h3>${esc(t.name)}</h3>
          <div class="price">${C.money(t.price)}<span> onwards</span></div>
          <p class="small muted">${esc(t.desc)}</p>
          <ul class="ticks">${TIER_FEATURES[k].map((f) => `<li>${icon("check", "icon sm")}${esc(f)}</li>`).join("")}<li>${icon("clock", "icon sm")}Ready in ~${t.days} days</li></ul>
          <button class="btn ${k === "premium" ? "primary" : ""} block" data-act="siteBook" data-tier="${k}">Choose ${esc(t.name.split(" ")[0])}</button>
        </div>`).join("")}</div>
      <div class="card" style="margin-top:16px">
        <h3 style="margin-bottom:10px">Add-ons</h3>
        <div class="list">${s.addons.map((a) => `<div class="item"><span class="site-ic sm">${icon("plus", "icon sm")}</span><div class="grow"><div class="item-t">${esc(a.name)}</div><div class="item-s">${esc(ADDON_INFO[a.id] || "")}</div></div><b>${C.money(a.price)}</b></div>`).join("")}</div>
      </div>
    </section>

    <section class="site-sec" id="sec-designs">
      <div class="site-head"><div class="eyebrow">Design catalogue</div><h2>Marwari designs</h2><p>A focused collection made for Marwari weddings. Tap a design to see it up close.</p></div>
      <div class="tpl-grid">${tpls.map((t) => `
        <button class="tpl site-tpl" data-act="siteTpl" data-id="${t.id}">
          <div class="art">${templateArt(t)}</div>
          <div class="meta"><b>${esc(t.name)}</b><div class="row" style="gap:4px">${t.tiers.map((k) => badge(s.tiers[k].name.split(" ")[0], k === "luxury" ? "gold" : k === "basic" ? "info" : "line")).join("")}</div></div>
        </button>`).join("")}</div>
    </section>

    <section class="site-sec" id="sec-process">
      <div class="site-head"><div class="eyebrow">How it works</div><h2>From hello to “you're invited”</h2><p>One clear process for every order, with one project owner and no scattered WhatsApp threads.</p></div>
      <div class="steps">${[["Consultation", "Tell us about your functions, style and budget."], ["Design & scope", "Confirm your design, price, timeline and revision rounds."], ["Your details", "Fill our guided form and upload photos & inspiration."], ["We design", "Your designer customises everything for your family."], ["Preview & changes", "Review on your phone and send all changes in one go."], ["Quality check", "We verify every name, date, link and the mobile view."], ["Final approval", "Nothing goes live until you sign off."], ["Share & celebrate", "Get your link and QR, and share it with every guest."]]
        .map(([t, d], i) => `<div class="step-card"><span class="n">${i + 1}</span><b>${t}</b><p class="small muted">${d}</p></div>`).join("")}</div>
    </section>

    <section class="site-sec">
      <div class="two even">
        <div class="card site-card">
          <div class="eyebrow">Why BFI</div><h2 style="margin-bottom:10px">Made for Marwari weddings</h2>
          <ul class="ticks">${["Ganesh vandana, Mayra / Bhaat, Mahila sangeet and every ritual you celebrate", "Family names and Dada-Dadi / Nana-Nani blessings, exactly as your family writes them", "English, Hindi, Marwari and bilingual wording", "Royal palettes and motifs, from haveli arches and mandaps to palace skylines", "A private page per project to track progress, chat with your designer and pay"].map((f) => `<li>${icon("check", "icon sm")}${f}</li>`).join("")}</ul>
        </div>
        <div class="card site-card">
          <div class="eyebrow">Delivery</div><h2 style="margin-bottom:10px">What you receive</h2>
          <ul class="ticks">${["A hosted, mobile-first invitation website", "WhatsApp-ready link and a printable QR code", "Countdown, maps, RSVP and event schedule (by package)", "A downloadable HTML copy where technically suitable", "Hosting, custom domain and music options explained before you book"].map((f) => `<li>${icon("check", "icon sm")}${f}</li>`).join("")}</ul>
        </div>
      </div>
    </section>

    <section class="site-sec" id="sec-reviews">
      <div class="site-head"><div class="eyebrow">Kind words</div><h2>Reviews</h2></div>
      ${reviews.length ? `<div class="grid">${reviews.map((p) => `<figure class="card site-quote"><div style="color:var(--gold)">${"★".repeat(p.review.rating)}</div><blockquote>“${esc(p.review.text)}”</blockquote><figcaption class="small muted">${esc(p.consent.names ? `${p.brideName} & ${p.groomName}` : "A BFI couple")} · ${esc(p.city || "")}</figcaption></figure>`).join("")}</div>`
        : `<p class="muted">Reviews from our couples appear here.</p>`}
    </section>

    <section class="site-sec">
      <div class="card site-partner">
        <div class="grow"><div class="eyebrow" style="color:#e2c07f">For wedding planners, photographers, MUAs & venues</div><h2>Partner with BFI</h2>
          <p class="small">Earn ${s.commission.basic}–${s.commission.luxury}% on every completed order you refer, or start with free invitations for your next clients.</p></div>
        <a class="btn gold" href="https://wa.me/${attr(s.whatsapp)}?text=${encodeURIComponent("Namaste BFI, I'd like to become a partner.")}" target="_blank" rel="noopener">${icon("message", "icon sm")} Become a partner</a>
      </div>
    </section>

    <section class="site-sec" id="sec-faq">
      <div class="site-head"><div class="eyebrow">Questions</div><h2>FAQ</h2></div>
      <div class="card" style="padding:6px 18px">${FAQ().map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p class="small muted">${esc(a)}</p></details>`).join("")}</div>
    </section>

    <section class="site-sec" id="sec-contact">
      <div class="card site-contact">
        <div class="stack sm"><div class="eyebrow">Contact</div><h2>Let's plan your invitation</h2>
          <p class="small muted" style="margin:0">${esc(s.address)} · serving families across India and abroad</p></div>
        <div class="row">
          <button class="btn primary" data-act="siteBook">${icon("send", "icon sm")} ${mode === "client" ? "Start a new invitation" : "Enquire now"}</button>
          <a class="btn" href="https://wa.me/${attr(s.whatsapp)}" target="_blank" rel="noopener">${icon("message", "icon sm")} WhatsApp</a>
          <a class="btn" href="mailto:${attr(s.email)}">${icon("mail", "icon sm")} Email</a>
        </div>
      </div>
      <footer class="site-foot">${crest("mark")}<span><b>BFI — Marwari Invitations</b><br><span class="tiny muted">© ${new Date().getFullYear()} · Terms, privacy and refund policy shared before booking</span></span></footer>
    </section>
  </div>`;
}

// Live booking capacity, so families know how soon we can start.
export function capacityCard() {
  const c = C.capacity();
  if (!c) return "";
  return `<div class="callout ${c.full ? "warn" : ""}" style="margin-bottom:16px;align-items:center">${icon("calendar")}<div class="grow"><b>${esc(C.capacityLine(c))}</b>
    <div class="cap-meter" style="margin-top:8px;max-width:320px" aria-label="${c.used} of ${c.slots} slots booked">${Array.from({ length: c.slots }, (_, i) => `<i class="${i < c.used ? "on" : ""}"></i>`).join("")}</div>
    <div class="tiny muted" style="margin-top:4px">We take a limited number of invitations each week so every family gets full attention.</div></div></div>`;
}

// Public website page (#/site): its own header, no app shell.
export function publicSite() {
  return {
    title: "Marwari wedding invitations",
    html: `<header class="site-top"><a class="wordmark" href="#/site"><b>BFI</b><small>Marwari Invitations</small></a>
        <div class="row"><a class="btn sm ghost hide-m" href="#/">Sign in</a><button class="btn sm primary" data-act="siteBook">Enquire</button></div></header>
      <main class="content">${website({ mode: "public" })}</main>`,
  };
}

// Where "Book" goes: clients get a new-project request on their account,
// visitors get the enquiry form.
let bookHandler = null;
export const onBook = (fn) => { bookHandler = fn; };

act({
  siteJump: (el) => document.getElementById(`sec-${el.dataset.to}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
  siteBook: (el) => { closeSheet(); if (bookHandler && location.hash.startsWith("#/c/")) bookHandler({ tier: el.dataset.tier, templateId: el.dataset.tpl }); else location.hash = "/enquire"; },
  siteTpl: (el) => {
    const t = db.templates.find((x) => x.id === el.dataset.id);
    const s = C.S();
    sheet(t.name, `<div class="stack">
      <div class="tpl" style="max-width:320px;margin:0 auto;width:100%"><div class="art">${templateArt(t)}</div></div>
      <div class="row" style="justify-content:center">${t.tiers.map((k) => badge(`${s.tiers[k].name} · from ${C.money(s.tiers[k].price)}`, k === "luxury" ? "gold" : "line")).join("")}</div>
      <p class="small muted" style="text-align:center;margin:0">${t.tags.map((x) => "#" + esc(x)).join(" ")}. Every design is personalised with your names, functions, colours and photos.</p>
      ${t.previewUrl ? `<a class="btn block" href="${attr(t.previewUrl)}" target="_blank" rel="noopener">${icon("eye", "icon sm")} Live preview</a>` : ""}
      <button class="btn primary block" data-act="siteBook" data-tier="${t.tiers.includes("premium") ? "premium" : t.tiers[0]}" data-tpl="${t.id}">Choose this design</button>
    </div>`);
  },
});
