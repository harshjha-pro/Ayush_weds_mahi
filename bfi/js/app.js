// App shell: hash router, role-scoped navigation, sign-in, settings,
// global search, install prompt and service worker registration.

import { db, onChange, currentUser, signIn, signOut, replaceAll, resetDemo, commit, byId } from "./db.js";
import { ROLES } from "./seed.js";
import { icon, crest } from "./icons.js";
import { esc, attr, act, sheet, closeSheet, toast, download, avatar, confirmSheet, go, field, input, badge } from "./ui.js";
import * as C from "./calc.js";
import * as admin from "./views/admin.js";
import * as marketing from "./views/marketing.js";
import * as designer from "./views/designer.js";
import * as affiliate from "./views/affiliate.js";
import * as client from "./views/client.js";
import * as pub from "./views/public.js";

const app = document.getElementById("app");

// Navigation per role: [section, label, icon]. The first entry is home.
const DESIGN_NAV = [["home", "My Projects", "folder"], ["intake", "Asset Intake", "checkCircle"], ["workspace", "Design Workspace", "palette"], ["workload", "Workload", "calendar"], ["brand", "Brand Workspace", "layers"], ["handover", "Handover", "send"], ["settings", "Settings", "settings"]];
const NAV = {
  admin: [
    ["home", "Dashboard", "home"], ["leads", "Leads & Sales", "inbox"], ["projects", "Projects", "folder"], ["people", "People", "users"],
    ["finance", "Finance", "rupee"], ["content", "Content & Assets", "image"], ["outreach", "Marketing", "megaphone"], ["compliance", "Compliance", "shield"],
    ["metrics", "Metrics", "chart"], ["comms", "Communications", "message"], ["settings", "Settings", "settings"],
  ],
  marketing: [
    ["home", "Dashboard", "home"], ["outreach", "Outreach CRM", "users"], ["campaigns", "Campaigns", "calendar"], ["sources", "Lead Source & CAC", "chart"],
    ["testimonials", "Testimonials", "star"], ["seo", "SEO Tracker", "globe"], ["ads", "Paid Ads", "target"], ["referrals", "Referral Codes", "link"],
    ["library", "Asset Library", "image"], ["settings", "Settings", "settings"],
  ],
  designer: DESIGN_NAV,
  freelancer: DESIGN_NAV,
  qa: [["home", "QA Queue", "checkCircle"], ["handover", "QA Review", "shield"], ["workload", "Workload", "calendar"], ["brand", "Brand Workspace", "layers"], ["settings", "Settings", "settings"]],
  affiliate: [
    ["home", "Referral Code", "qr"], ["myleads", "Leads & Projects", "list"], ["commission", "Commission", "rupee"], ["trade", "Trade Status", "briefcase"],
    ["refer", "Submit Referral", "plus"], ["kit", "Marketing Kit", "gift"], ["settings", "Settings", "settings"],
  ],
};
const EXTRA = {
  admin: ["lead", "project", "person", "vendor", "referrals", "campaigns", "testimonials", "library", "sources", "seo", "ads", "studio", "invoice", "brand"],
  marketing: ["vendor", "leads", "lead"],
  designer: ["job"], freelancer: ["job"], qa: ["job"], affiliate: [],
};
// Detail pages highlight their parent in the navigation.
const PARENT = { lead: "leads", project: "projects", person: "people", vendor: "outreach", job: "home", invoice: "finance", studio: "settings" };
const ROUTES = { ...admin.routes, ...marketing.routes, ...designer.routes, ...affiliate.routes };

const parse = () => location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);

let lastHash = "";
function render() {
  const parts = parse();
  const scroll = lastHash === location.hash ? window.scrollY : 0;
  lastHash = location.hash;

  // Public routes need no sign-in.
  if (parts[0] === "c") {
    const v = client.portal(parts[1], parts[2] || "home", parts.slice(3));
    return v.frame ? frame(v.frame, v, scroll) : mount(v, scroll);
  }
  if (parts[0] === "enquire") return mount(pub.enquire(parts[1]), scroll);

  const user = currentUser();
  if (!user || parts[0] === "signin") return mount(entry(), 0);

  const [section = "home", ...args] = parts;
  const nav = NAV[user.role];
  const allowed = [...nav.map((n) => n[0]), ...EXTRA[user.role]];
  if (!allowed.includes(section)) { go("/home"); return; }

  let view;
  if (section === "settings") view = settingsView(user);
  else if (section === "home") view = homeFor(user, args);
  else view = ROUTES[section]?.(args, user);
  if (!view) view = { title: "Not found", html: `<div class="card">That page doesn't exist or isn't shared with you.</div>` };

  const activeKey = user.role === "admin" && ["referrals", "campaigns", "sources", "seo", "ads", "testimonials", "library", "vendor"].includes(section) ? "outreach" : PARENT[section] || section;
  frame({
    nav: nav.map(([k, l, ic]) => [`#/${k}`, l, ic, k === activeKey]),
    who: { name: user.name, sub: ROLES[user.role].name, href: "#/settings" },
    search: ["admin", "marketing", "designer", "freelancer", "qa"].includes(user.role),
  }, view, scroll);
}

function homeFor(user, args) {
  if (user.role === "admin") return admin.routes.dashboard(args, user);
  if (user.role === "marketing") return marketing.routes.mhome(args, user);
  if (user.role === "affiliate") return affiliate.routes.ahome(args, user);
  if (user.role === "qa") return designer.routes.qahome(args, user);
  return designer.routes.dhome(args, user);
}

function mount(view, scroll) {
  document.title = view.title ? `${view.title} · BFI` : "BFI · Marwari Invitations";
  app.innerHTML = view.html;
  view.after?.(app);
  window.scrollTo(0, scroll);
}

const wordmark = (href = "#/home") => `<a class="wordmark" href="${href}"><b>BFI</b><small>Marwari Invitations</small></a>`;

// Shared frame for team and client: sidebar (desktop), top bar, page
// header and bottom tab bar (phone).
function frame(f, view, scroll) {
  const link = ([href, l, ic, on]) => `<a class="nav ${on ? "on" : ""}" href="${href}">${icon(ic)}<span>${esc(l)}</span></a>`;
  const tab = ([href, l, ic, on]) => `<a href="${href}" class="${on ? "on" : ""}">${icon(ic)}<span>${esc(l.split(" ")[0] === "My" || l.length < 11 ? l : l.split(" ")[0])}</span></a>`;
  const primary = f.nav.slice(0, f.nav.length > 5 ? 4 : 5);
  const rest = f.nav.slice(primary.length);
  document.title = `${view.title} · BFI`;
  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        ${wordmark(f.nav[0][0])}
        ${f.nav.map(link).join("")}
        <div class="grow"></div>
        ${f.signOut === false ? "" : `<a class="nav" href="#/signin" data-act="${f.signOutAct || "signOut"}">${icon("logout")}<span>Sign out</span></a>`}
      </aside>
      <div class="main">
        <header class="topbar">
          ${wordmark(f.nav[0][0])}
          <div class="grow"></div>
          ${f.search ? `<form class="gsearch search" data-form="gsearch">${icon("search", "icon sm")}<input type="search" name="q" placeholder="Search" aria-label="Search"></form>
            <button class="icon-btn plain m-only" data-act="gsearchOpen" aria-label="Search">${icon("search")}</button>` : ""}
          <a class="user-chip" href="${f.who.href}">${avatar(f.who.name)}<span class="hide-m">${esc(f.who.name.split(" ·")[0])}</span></a>
        </header>
        <main class="content">
          <div class="page-head">
            <div class="grow">${view.back ? `<a class="back" href="${attr(view.back)}">${icon("arrowLeft", "icon sm")} Back</a>` : ""}
              ${view.eyebrow ? `<div class="eyebrow">${esc(view.eyebrow)}</div>` : ""}<h1>${esc(view.title)}</h1>${view.subtitle ? `<p>${esc(view.subtitle)}</p>` : ""}</div>
            ${view.actions ? `<div class="row">${view.actions}</div>` : ""}
          </div>
          ${view.html}
        </main>
      </div>
      <nav class="tabbar">
        ${primary.map(tab).join("")}
        ${rest.length ? `<button data-act="moreNav" class="${rest.some((r) => r[3]) ? "on" : ""}">${icon("grid")}<span>More</span></button>` : ""}
      </nav>
      ${view.fab && !view.actions ? `<button class="fab" data-act="${view.fab.act}" aria-label="${attr(view.fab.label)}">${icon(view.fab.icon || "plus", "icon lg")}</button>` : ""}
    </div>`;
  moreNav = rest;
  view.after?.(app);
  window.scrollTo(0, scroll);
}
let moreNav = [];

// ── Entry: sign in as a team member, or open a couple's portal ─────
function entry() {
  const groups = Object.keys(ROLES).map((role) => [role, db.users.filter((u) => u.role === role && u.active !== false)]).filter(([, us]) => us.length);
  let saved = null;
  try { saved = localStorage.getItem("bfi.client"); } catch {}
  const savedP = saved && db.projects.find((p) => p.token === saved);
  return {
    title: "Welcome",
    html: `
    <div class="entry">
      <div class="entry-box">
        <div class="crest">${crest()}<h1>BFI</h1><p>Marwari Invitations</p></div>
        ${savedP ? `<a class="btn primary block" href="#/c/${savedP.token}">${icon("arrowRight", "icon sm")} Continue to ${esc(savedP.clientName)}'s invitation</a>` : ""}
        <div class="card stack">
          <div><h3>Track your invitation</h3><p class="small muted" style="margin:2px 0 0">Couples: paste the private link we sent you.</p></div>
          <form data-form="track" class="row nowrap">
            <input type="text" name="code" placeholder="Private link or code" autocomplete="off" aria-label="Tracking code" class="grow" required>
            <button class="btn primary">${icon("arrowRight")}</button>
          </form>
          <a class="small" href="#/enquire">New here? Make an enquiry →</a>
        </div>
        <div class="stack">
          <div><h3>Studio team & partners</h3><p class="small muted" style="margin:2px 0 0">Choose who you are</p></div>
          ${groups.map(([role, us]) => `
            <div class="stack sm">
              <div class="label">${esc(ROLES[role].name)}</div>
              <div class="role-list">${us.map((u) => `
                <button class="role" data-act="signIn" data-id="${u.id}">
                  ${avatar(u.name)}<div class="grow"><b>${esc(u.name)}</b><span>${esc(ROLES[role].desc)}${u.accessUntil ? ` · until ${esc(C.date(u.accessUntil))}` : ""}</span></div>${icon("chevron")}
                </button>`).join("")}</div>
            </div>`).join("")}
          <p class="tiny muted" style="text-align:center">Demo sign-in: data is stored on this device. Connect a shared backend before inviting the team.</p>
        </div>
      </div>
    </div>`,
  };
}

act({
  signIn: (el) => {
    const u = db.users.find((x) => x.id === el.dataset.id);
    if (u.accessUntil && new Date(u.accessUntil) < new Date()) { toast("This freelancer's access has expired"); return; }
    signIn(u.id);
    go("/home");
    render();
  },
  signOut: () => { signOut(); go("/"); render(); },
  track: (d) => {
    const raw = d.code.trim();
    const tok = (raw.match(/#\/c\/([a-z0-9]+)/i) || [])[1] || raw.toLowerCase().replace(/[^a-z0-9]/g, "");
    // Only the long private token opens a portal; project codes are guessable.
    const p = db.projects.find((x) => x.token === tok);
    if (!p) { toast("We couldn't find that link — check the message we sent you"); return; }
    go(`/c/${p.token}`);
  },
  moreNav: () => {
    sheet("More", `<div class="menu-list">${moreNav.map(([href, l, ic]) => `<a href="${href}" data-act="navTo" data-to="${attr(href)}">${icon(ic)}<span class="grow">${esc(l)}</span>${icon("chevron")}</a>`).join("")}</div>`);
  },
  navTo: (el) => { closeSheet(); location.hash = el.dataset.to.replace(/^#/, ""); },
  gsearchOpen: () => sheet("Search", `<form data-form="gsearch" class="search">${icon("search", "icon sm")}<input type="search" name="q" placeholder="Couple, lead, vendor, code…" autofocus></form>`),
  gsearch: (d) => {
    const q = (d.q || "").toLowerCase().trim();
    if (!q) return;
    const user = currentUser();
    const hits = [];
    const mine = ["designer", "freelancer", "qa"].includes(user.role) ? designer.myProjects(user) : db.projects;
    const pBase = user.role === "admin" ? "#/project/" : "#/job/";
    mine.filter((p) => `${p.code} ${p.clientName} ${p.brideName} ${p.groomName} ${p.city}`.toLowerCase().includes(q))
      .forEach((p) => hits.push([pBase + p.id, `${p.brideName && p.groomName ? `${p.brideName} & ${p.groomName}` : p.clientName}`, `${p.code} · ${C.stageName(p.stage)}`, "folder"]));
    if (["admin", "marketing"].includes(user.role)) {
      db.leads.filter((l) => `${l.name} ${l.phone} ${l.city} ${l.refCode}`.toLowerCase().includes(q)).forEach((l) => hits.push([`#/lead/${l.id}`, l.name, `Lead · ${l.source}`, "inbox"]));
      db.vendors.filter((v) => `${v.name} ${v.contact} ${v.city} ${v.kind}`.toLowerCase().includes(q)).forEach((v) => hits.push([`#/vendor/${v.id}`, v.name, `Vendor · ${v.kind}`, "megaphone"]));
    }
    if (user.role === "admin") db.users.filter((u) => `${u.name} ${u.refCode || ""} ${u.email}`.toLowerCase().includes(q)).forEach((u) => hits.push([`#/person/${u.id}`, u.name, ROLES[u.role].name, "user"]));
    sheet(`Results for “${d.q}”`, hits.length ? `<div class="menu-list">${hits.slice(0, 30).map(([h, t, s, ic]) => `<a href="${h}" data-act="navTo" data-to="${attr(h)}">${icon(ic)}<span class="grow"><b>${esc(t)}</b><br><span class="small muted">${esc(s)}</span></span></a>`).join("")}</div>` : `<p class="muted">No matches.</p>`);
  },
});

// ── Settings (every role) ───────────────
let installEvt = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; });
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
const themeName = () => document.documentElement.dataset.theme || "auto";

export function appSettingsRows() {
  return `
    <div class="setrow"><span class="ic">${icon(themeName() === "dark" ? "moon" : "sun")}</span><div class="grow"><b>Appearance</b><span>Follow the phone, or choose</span></div>
      <div class="chips">${["auto", "light", "dark"].map((t) => `<button class="chip ${themeName() === t ? "on" : ""}" data-act="theme" data-v="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div></div>
    <div class="setrow"><span class="ic">${icon("download")}</span><div class="grow"><b>Install on this phone</b><span>${standalone() ? "Installed — you're using the app." : "Opens full-screen from your home screen, works offline"}</span></div>
      ${standalone() ? badge("Installed", "ok") : `<button class="btn sm primary" data-act="install">Install</button>`}</div>`;
}

function settingsView(user) {
  const isAdmin = user.role === "admin";
  const isAff = user.role === "affiliate";
  return {
    title: "Settings", subtitle: "Manage your account and preferences.",
    html: `
    <div class="stack lg" style="max-width:760px">
      <form class="card form" data-form="profileSave">
        <div class="row">${avatar(user.name)}<div class="grow"><b>${esc(user.name)}</b><div class="small muted">${esc(ROLES[user.role].name)}</div></div></div>
        <div class="cols">${field("Name", input("name", user.name, "text", "required"))}${field("Email", input("email", user.email, "email"))}${field("Phone", input("phone", user.phone, "tel"))}</div>
        <button class="btn">Save profile</button>
      </form>
      ${isAff ? affiliate.payoutForm(user) : ""}
      <div class="card setlist">
        ${appSettingsRows()}
        ${isAdmin ? `
        <a class="setrow" href="#/studio"><span class="ic">${icon("settings")}</span><div class="grow"><b>Prices, policies & payments</b><span>Tiers, add-ons, commission, SLA days, refund policy, UPI</span></div>${icon("chevron")}</a>
        <div class="setrow"><span class="ic">${icon("download")}</span><div class="grow"><b>Back up all data</b><span>Download a JSON file (uploaded files stay on this device)</span></div><button class="btn sm" data-act="backup">Export</button></div>
        <div class="setrow"><span class="ic">${icon("upload")}</span><div class="grow"><b>Restore from backup</b><span>Replaces everything on this device</span></div><label class="btn sm">Import<input type="file" accept="application/json" data-change="restore" hidden></label></div>
        <div class="setrow"><span class="ic">${icon("refresh")}</span><div class="grow"><b>Reset demo data</b><span>Start again with the sample studio</span></div><button class="btn sm danger" data-act="reset">Reset</button></div>` : ""}
        <a class="setrow" href="https://wa.me/${attr(db.settings.whatsapp)}" target="_blank" rel="noopener"><span class="ic">${icon("info")}</span><div class="grow"><b>Help & support</b><span>Message the studio on WhatsApp</span></div>${icon("chevron")}</a>
        <button class="setrow" data-act="signOut"><span class="ic">${icon("logout")}</span><div class="grow"><b>Sign out</b><span>Switch to another person</span></div></button>
      </div>
      <p class="tiny muted" style="text-align:center">BFI — Marwari Invitations · v2</p>
    </div>`,
  };
}

function applyTheme(t) {
  if (t === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]').content = dark ? "#0c111c" : "#14213d";
}
try { applyTheme(localStorage.getItem("bfi.theme") || "auto"); } catch { /* storage blocked */ }

act({
  theme: (el) => { try { localStorage.setItem("bfi.theme", el.dataset.v); } catch {} applyTheme(el.dataset.v); render(); },
  install: async () => {
    if (installEvt) { installEvt.prompt(); await installEvt.userChoice; installEvt = null; render(); return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    sheet("Install BFI", ios
      ? `<ol class="stack" style="padding-left:18px"><li>Open this page in <b>Safari</b>.</li><li>Tap the <b>Share</b> button ${icon("share", "icon sm")}.</li><li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol>`
      : `<ol class="stack" style="padding-left:18px"><li>Open this page in <b>Chrome</b>.</li><li>Tap the <b>⋮</b> menu (top right).</li><li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li></ol>`);
  },
  profileSave: (d) => { const u = currentUser(); Object.assign(u, { name: d.name, email: d.email, phone: d.phone.replace(/\D/g, "") }); commit("Profile", u.name); toast("Saved"); },
  backup: () => { download(`bfi-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(db, null, 1), "application/json"); commit("Exported", "Backup"); },
  restore: async (el) => {
    const f = el.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data.projects || !data.users) throw new Error("bad");
      confirmSheet("Restore backup?", "This replaces all data on this device with the backup.", () => { replaceAll(data); toast("Backup restored"); });
    } catch { toast("That file isn't a BFI backup"); }
  },
  reset: () => confirmSheet("Reset demo data?", "All records on this device will be replaced with the sample studio.", () => { resetDemo(); location.reload(); }, "Reset"),
});

// ── boot ────────────────────────────────
window.addEventListener("hashchange", () => { closeSheet(); render(); });
onChange(render);
render();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
export { render, frame };
