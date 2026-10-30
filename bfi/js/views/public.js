// Public enquiry page — the link partners and past clients share.
// A referral code in the URL is attached to the lead automatically.

import { db, commit, uid, now } from "../db.js";
import { icon, crest, ornament } from "../icons.js";
import { esc, attr, act, field, input, textarea, select } from "../ui.js";
import * as C from "../calc.js";
import { capacityCard } from "./site.js";

let sent = null;

export function enquire(code = "") {
  const ref = (code || "").toUpperCase();
  const partner = ref && db.users.find((u) => u.role === "affiliate" && u.refCode === ref);
  const tiers = C.S().tiers;
  return {
    title: "Enquire",
    html: `
    <div class="entry"><div class="entry-box" style="max-width:560px">
      <div class="crest">${crest()}<h1>BFI</h1><p>Marwari Invitations</p></div>
      ${sent ? `<div class="card stack" style="text-align:center">${icon("checkCircle", "icon lg")}<h2>Dhanyavaad, ${esc(sent)}!</h2>
        <p class="muted">Our studio will WhatsApp you within a day to plan your invitation.</p><button class="btn" data-act="enqAgain">Send another enquiry</button></div>` : `
      <div style="text-align:center"><h2>Digital invitations made for Marwari weddings</h2>
        <p class="muted small" style="margin-top:6px">Rituals, family names and Marwari traditions — designed with care, delivered as a beautiful invitation website.</p></div>
      ${capacityCard()}
      ${partner ? `<div class="callout">${icon("gift")}<div>Referred by <b>${esc(partner.name)}</b> · code ${esc(ref)}</div></div>` : ""}
      <form class="card form" data-form="enqSend">
        <input type="hidden" name="refCode" value="${attr(ref)}">
        <div class="cols">${field("Your name(s)", input("name", "", "text", 'required placeholder="Priya & Rohan"'))}${field("WhatsApp number", input("phone", "", "tel", 'required placeholder="+91 98…"'))}</div>
        <div class="cols">${field("Wedding date", input("weddingDate", "", "date"))}${field("City", input("city"))}</div>
        ${field("Package", select("interest", [["", "Help me choose"], ...Object.entries(tiers).map(([k, t]) => [k, `${t.name} · from ${C.money(t.price)}`])]))}
        ${!ref ? field("Referral code", input("refCodeTyped", "", "text", 'placeholder="if someone referred you" style="text-transform:uppercase"')) : ""}
        ${field("Tell us a little", textarea("note", "", 'rows="3" placeholder="Functions, style, anything you have in mind"'))}
        <button class="btn primary">${icon("send", "icon sm")} Send enquiry</button>
      </form>
      ${ornament()}
      <div class="stack">${Object.values(tiers).map((t) => `<div class="card tight row between nowrap"><div class="grow"><b class="serif" style="font-size:18px">${esc(t.name)}</b><div class="small muted">${esc(t.desc)}</div></div><b class="nowrap">${C.money(t.price)}</b></div>`).join("")}</div>`}
      <a class="small" href="#/" style="text-align:center">Studio sign-in</a>
    </div></div>`,
  };
}

act({
  enqSend: (d) => {
    const l = { id: uid("l"), name: d.name, phone: d.phone.replace(/\D/g, ""), email: "", weddingDate: d.weddingDate, city: d.city, interest: d.interest, source: "Other", refCode: d.refCode || d.refCodeTyped || "", stage: "new", createdAt: now(), waitlist: !!C.capacity()?.full, notes: d.note ? [{ at: now(), by: "Website", text: d.note }] : [] };
    if (!l.refCode) l.source = "Google / SEO";
    C.attributeLead(l);
    db.leads.push(l);
    sent = d.name.split(" ")[0];
    commit("Website enquiry", l.name, l.refCode || "organic");
  },
  enqAgain: () => { sent = null; window.dispatchEvent(new HashChangeEvent("hashchange")); },
});
