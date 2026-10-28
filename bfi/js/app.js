// App shell: hash router, role-scoped navigation, sign-in, settings,
// install prompt and service worker registration.

import { db, onChange, currentUser, signIn, signOut, replaceAll, resetDemo, commit } from "./db.js";
import { ROLES } from "./seed.js";
import { icon, crest, ornament } from "./icons.js";
import { esc, attr, act, sheet, closeSheet, toast, download, avatar, confirmSheet, go } from "./ui.js";
import * as admin from "./views/admin.js";
import * as marketing from "./views/marketing.js";
import * as designer from "./views/designer.js";
import * as affiliate from "./views/affiliate.js";
import * as client from "./views/client.js";
import * as pub from "./views/public.js";

const app = document.getElementById("app");

// Which sections each role may open, and its navigation.
const NAV = {
  admin: [
    ["home", "Dashboard", "home"], ["leads", "Leads", "inbox"], ["projects", "Projects", "folder"], ["people", "People", "users"],
    ["finance", "Finance", "rupee"], ["content", "Content", "image"], ["outreach", "Growth", "megaphone"], ["metrics", "Metrics", "chart"],
    ["comms", "Comms", "message"], ["compliance", "Compliance", "shield"], ["settings", "Settings", "settings"],
  ],
  marketing: [
    ["home", "Home", "home"], ["outreach", "Outreach", "megaphone"], ["referrals", "Referrals", "link"], ["campaigns", "Campaigns", "calendar"],
    ["testimonials", "Testimonials", "star"], ["library", "Assets", "image"], ["sources", "Sources & CAC", "chart"], ["seo", "SEO", "globe"],
    ["ads", "Ads A/B", "target"], ["settings", "Settings", "settings"],
  ],
  designer: [["home", "Workload", "home"], ["work", "My projects", "folder"], ["brand", "Brand kit", "palette"], ["settings", "Settings", "settings"]],
  qa: [["home", "Workload", "home"], ["work", "QA queue", "checkCircle"], ["brand", "Brand kit", "palette"], ["settings", "Settings", "settings"]],
  freelancer: [["home", "Workload", "home"], ["work", "My projects", "folder"], ["brand", "Brand kit", "palette"], ["settings", "Settings", "settings"]],
  affiliate: [["home", "Home", "home"], ["myleads", "My leads", "list"], ["refer", "Refer", "plus"], ["kit", "Kit", "gift"], ["payouts", "Payouts", "rupee"], ["settings", "Settings", "settings"]],
};
const EXTRA = {
  admin: ["lead", "project", "person", "vendor", "referrals", "campaigns", "testimonials", "library", "sources", "seo", "ads", "studio", "work", "brand", "invoice"],
  marketing: ["vendor", "leads", "lead"],
  designer: ["job"], qa: ["job"], freelancer: ["job"], affiliate: [],
};
const ROUTES = { ...admin.routes, ...marketing.routes, ...designer.routes, ...affiliate.routes };

const parse = () => location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);

let lastHash = "";
function render() {
  const parts = parse();
  const sameRoute = lastHash === location.hash;
  const scroll = sameRoute ? window.scrollY : 0;
  lastHash = location.hash;

  // Public routes need no sign-in.
  if (parts[0] === "c") return mount(client.portal(parts[1], parts[2] || "status"), scroll);
  if (parts[0] === "enquire") return mount(pub.enquire(parts[1]), scroll);

  const user = currentUser();
  if (!user || parts[0] === "signin") return mount(entry(), 0);

  const [section = "home", ...args] = parts;
  const allowed = [...NAV[user.role].map((n) => n[0]), ...EXTRA[user.role]];
  if (!allowed.includes(section)) { go("/home"); return; }

  let view;
  if (section === "settings") view = settingsView(user);
  else if (section === "home") view = homeFor(user);
  else view = ROUTES[section]?.(args, user);
  if (!view) view = { title: "Not found", html: `<div class="card">That page doesn't exist.</div>` };
  shell(user, section, view, scroll);
}

function homeFor(user) {
  if (user.role === "admin") return admin.routes.dashboard([], user);
  if (user.role === "marketing") return marketing.routes.mhome([], user);
  if (user.role === "affiliate") return affiliate.routes.ahome([], user);
  return designer.routes.dhome([], user);
}

function mount(view, scroll) {
  document.title = view.title ? `${view.title} · BFI` : "BFI · Marwari Invitations";
  app.innerHTML = view.html;
  view.after?.(app);
  window.scrollTo(0, scroll);
}

function shell(user, section, view, scroll) {
  const nav = NAV[user.role];
  const navSection = { lead: "leads", project: "projects", person: "people", vendor: "outreach", job: "work", invoice: "finance", studio: "settings",
    referrals: user.role === "admin" ? "outreach" : "referrals", campaigns: user.role === "admin" ? "outreach" : "campaigns",
    testimonials: user.role === "admin" ? "content" : "testimonials", library: user.role === "admin" ? "content" : "library",
    sources: user.role === "admin" ? "outreach" : "sources", seo: user.role === "admin" ? "outreach" : "seo", ads: user.role === "admin" ? "outreach" : "ads" }[section] || section;
  const primary = nav.slice(0, 4);
  const rest = nav.slice(4);
  const link = ([k, l, ic]) => `<a href="#/${k}" class="${k === navSection ? "on" : ""}">${icon(ic)}<span>${esc(l)}</span></a>`;
  document.title = `${view.title} · BFI`;
  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" href="#/home">${crest()}<div><b>BFI</b><small>Marwari Invitations</small></div></a>
        ${nav.map(link).join("")}
        <div class="grow"></div>
        <div class="who">${esc(user.name)}<br><span style="opacity:.7">${esc(ROLES[user.role].name)}</span></div>
        <a href="#/signin" data-act="signOut">${icon("logout")}<span>Sign out</span></a>
      </aside>
      <div class="main">
        <header class="topbar">
          ${view.back ? `<a class="icon-btn" href="${attr(view.back)}" aria-label="Back">${icon("arrowLeft")}</a>` : `<a class="brand" href="#/home">${crest()}</a>`}
          <div class="title">${view.eyebrow ? `<div class="eyebrow">${esc(view.eyebrow)}</div>` : ""}<h1>${esc(view.title)}</h1></div>
          ${view.actions || ""}
        </header>
        <main class="content">${view.html}</main>
      </div>
      <nav class="tabbar">
        ${primary.map(link).join("")}
        ${rest.length ? `<button data-act="moreNav" class="${rest.some((r) => r[0] === navSection) ? "on" : ""}">${icon("grid")}<span>More</span></button>` : ""}
      </nav>
      ${view.fab ? `<button class="fab" data-act="${view.fab.act}" aria-label="${attr(view.fab.label)}">${icon(view.fab.icon || "plus", "icon lg")}</button>` : ""}
    </div>`;
  view.after?.(app);
  window.scrollTo(0, scroll);
}

// ── Entry: sign in as a team member, or track an invitation ─────────
function entry() {
  const groups = Object.keys(ROLES).map((role) => [role, db.users.filter((u) => u.role === role && u.active !== false)]).filter(([, us]) => us.length);
  return {
    title: "Welcome",
    html: `
    <div class="entry">
      <div class="entry-box">
        <div class="crest">${crest()}<h1>BFI</h1><p>Marwari Invitations</p></div>
        <div class="card stack">
          <div><div class="eyebrow">Couples</div><h3>Track your invitation</h3></div>
          <form data-form="track" class="row nowrap">
            <input type="text" name="code" placeholder="Paste your private link or code" autocomplete="off" aria-label="Tracking code" class="grow" required>
            <button class="btn primary">${icon("arrowRight")}</button>
          </form>
          <a class="small" href="#/enquire">New here? Make an enquiry →</a>
        </div>
        ${ornament()}
        <div class="stack">
          <div><div class="eyebrow">Studio team & partners</div><h3>Sign in</h3></div>
          ${groups.map(([role, us]) => `
            <div class="stack" style="gap:8px">
              <div class="label">${esc(ROLES[role].name)}</div>
              <div class="role-list">${us.map((u) => `
                <button class="role" data-act="signIn" data-id="${u.id}">
                  ${avatar(u.name)}<div class="grow"><b>${esc(u.name)}</b><span>${esc(ROLES[role].desc)}${u.accessUntil ? ` · access until ${esc(u.accessUntil)}` : ""}</span></div>${icon("chevron")}
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
    const tokenStr = (raw.match(/#\/c\/([a-z0-9]+)/i) || [])[1] || raw.toLowerCase().replace(/[^a-z0-9]/g, "");
    // Only the long private token opens a portal; project codes are guessable.
    const p = db.projects.find((x) => x.token === tokenStr);
    if (!p) { toast("We couldn't find that code — check the link we sent you"); return; }
    go(`/c/${p.token}`);
  },
  moreNav: () => {
    const user = currentUser();
    const rest = NAV[user.role].slice(4);
    sheet("More", `<div class="list">${rest.map(([k, l, ic]) => `<a class="item" href="#/${k}" data-act="navTo" data-to="/${k}">${icon(ic)}<div class="grow item-t">${esc(l)}</div>${icon("chevron")}</a>`).join("")}
      <a class="item" href="#/signin" data-act="signOut">${icon("logout")}<div class="grow item-t">Sign out</div></a></div>`);
  },
  navTo: (el) => { closeSheet(); go(el.dataset.to); },
});

// ── Settings (every role) ───────────────
let installEvt = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; });
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;

function themeName() { return document.documentElement.dataset.theme || "auto"; }

function settingsView(user) {
  const isAdmin = user.role === "admin";
  return {
    title: "Settings",
    html: `
    <div class="stack lg" style="max-width:720px">
      <div class="card row">${avatar(user.name)}<div class="grow"><b>${esc(user.name)}</b><div class="small muted">${esc(ROLES[user.role].name)} · ${esc(user.email || "")}</div></div>
        <button class="btn sm" data-act="signOut">${icon("logout", "icon sm")} Sign out</button></div>

      <div class="card stack">
        <h3>App</h3>
        <div class="row between"><div><b>Appearance</b><div class="small muted">Follow the phone, or choose</div></div>
          <div class="chips">${["auto", "light", "dark"].map((t) => `<button class="chip ${themeName() === t ? "on" : ""}" data-act="theme" data-v="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div></div>
        <div class="row between"><div><b>Install on this phone</b><div class="small muted">${standalone() ? "Installed — you're using the app." : "Opens full-screen from your home screen and works offline."}</div></div>
          ${standalone() ? `<span class="badge ok">Installed</span>` : `<button class="btn sm primary" data-act="install">${icon("download", "icon sm")} Install</button>`}</div>
      </div>

      ${isAdmin ? `
      <div class="card stack">
        <h3>Studio</h3>
        <a class="item" href="#/studio">${icon("settings")}<div class="grow"><div class="item-t">Prices, policies & payments</div><div class="item-s">Tiers, add-ons, commission rates, SLA days, refund policy, UPI</div></div>${icon("chevron")}</a>
        <div class="item">${icon("download")}<div class="grow"><div class="item-t">Back up all data</div><div class="item-s">Download a JSON file (files/photos stay on this device)</div></div><button class="btn sm" data-act="backup">Export</button></div>
        <div class="item">${icon("upload")}<div class="grow"><div class="item-t">Restore from backup</div><div class="item-s">Replaces everything on this device</div></div><label class="btn sm">Import<input type="file" accept="application/json" data-change="restore" hidden></label></div>
        <div class="item">${icon("refresh")}<div class="grow"><div class="item-t">Reset demo data</div><div class="item-s">Start again with the sample studio</div></div><button class="btn sm danger" data-act="reset">Reset</button></div>
      </div>` : ""}
      <p class="tiny muted" style="text-align:center">BFI — Marwari Invitations · v1</p>
    </div>`,
  };
}

function applyTheme(t) {
  if (t === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]').content = dark ? "#150b0e" : "#5a1726";
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
export { render };
