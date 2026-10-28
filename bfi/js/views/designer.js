// Designer, QA reviewer and freelancer workspace. Each sees only the
// projects assigned to them; freelancers only within their access window.

import { db, byId } from "../db.js";
import { icon } from "../icons.js";
import { esc, attr, act, badge, empty, kpi, stateTabs, rtable, templateArt, progress } from "../ui.js";
import * as C from "../calc.js";
import { projectView, coupleName, projectTitle, thumb, intakeCard, uploadForm, assetTiles, hydrateFiles, handoverReady } from "./project.js";
import { routesRefresh } from "./admin.js";

const ui = { tab: "active", brand: "fonts", weekOffset: 0 };

export function myProjects(user) {
  return db.projects.filter((p) => {
    if (user.role === "qa") return p.qaId === user.id;
    if (user.role === "freelancer") return p.designerId === user.id && (user.projectIds || []).includes(p.id);
    return p.designerId === user.id;
  });
}
const dueTone = (p) => { const d = C.daysUntil(p.dueDate); return p.status !== "active" ? "ok" : d < 0 ? "bad" : d <= 3 ? "warn" : "info"; };
const stageColor = (p) => (p.stage >= 5 ? "var(--violet)" : p.stage === 4 ? "var(--warn)" : "var(--info)");

function projectRows(list, base = "#/job") {
  return `<div class="list">${list.map((p) => `
    <a class="item" href="${base}/${p.id}">${thumb(p)}
      <div class="grow"><div class="item-t ellipsis">${esc(projectTitle(p))}</div><div class="small" style="color:${stageColor(p)};font-weight:600">${esc(C.stageName(p.stage))}</div><div class="tiny muted">${esc(coupleName(p))} · ${esc(C.S().tiers[p.tier].name)}</div></div>
      <span class="badge ${dueTone(p)}">${p.status === "delivered" ? "Delivered" : `Due ${C.shortDate(p.dueDate)}`}</span></a>`).join("")}</div>`;
}

// 1 · My projects (designer home)
function dhome(_, user) {
  const mine = myProjects(user);
  const active = mine.filter((p) => p.status === "active").sort((a, b) => (a.dueDate || "9").localeCompare(b.dueDate || "9"));
  const done = mine.filter((p) => p.status !== "active");
  const openRev = active.reduce((s, p) => s + p.revisions.filter((r) => r.status !== "resolved").reduce((t, r) => t + r.items.filter((x) => !x.done).length, 0), 0);
  const list = ui.tab === "active" ? active : done;
  return {
    title: "My Projects", subtitle: "View and manage your assigned projects.",
    html: `<div class="stack lg">
      ${user.accessUntil ? `<div class="callout warn">${icon("clock")}<div>Freelance access ends <b>${C.date(user.accessUntil)}</b> (${C.daysUntil(user.accessUntil)} days). You only see the projects shared with you.</div></div>` : ""}
      <div class="grid kpi">${kpi("Active", active.length)}${kpi("Overdue", active.filter(C.isOverdue).length)}${kpi("Open revision items", openRev)}${kpi("Waiting on clients", active.filter((p) => p.stage <= 3 && C.checklistDone(p) < C.checklist(p).length).length)}</div>
      <div class="card pad0">
        ${stateTabs([["active", "Active", active.length], ["completed", "Completed", done.length]], ui.tab, "dTab")}
        <div style="padding:4px 16px">${list.length ? projectRows(list) : empty(ui.tab === "active" ? "Nothing assigned" : "Nothing completed yet", "New projects appear here when the admin assigns you.", "folder")}</div>
      </div>
    </div>`,
  };
}

// QA home: the queue
function qahome(_, user) {
  const mine = myProjects(user).filter((p) => p.status === "active");
  const queue = mine.filter((p) => p.stage === 5);
  return {
    title: "QA Queue", subtitle: "Projects waiting for your quality check.",
    html: `<div class="stack lg">
      <div class="grid kpi">${kpi("Waiting for QA", queue.length)}${kpi("Assigned to you", mine.length)}${kpi("Passed this month", myProjects(user).filter((p) => p.qa?.status === "pass" && (p.qa.at || "").slice(0, 7) === C.today().slice(0, 7)).length)}${kpi("Defects logged", myProjects(user).reduce((s, p) => s + (Number(p.qa?.defects) || 0), 0))}</div>
      <div class="card"><div class="card-head"><h3>Ready for review</h3></div>${queue.length ? projectRows(queue, "#/handover") : empty("Queue is clear", "Projects arrive when designers mark them ready.", "checkCircle")}</div>
      <div class="card"><div class="card-head"><h3>Coming up</h3></div>${projectRows(mine.filter((p) => p.stage < 5))}</div>
    </div>`,
  };
}

// Pages 2, 3 and 6 reuse the project workspace with a project switcher.
function scoped(user, pid, tab, title, subtitle, filter = () => true) {
  const mine = myProjects(user).filter((p) => p.status === "active").filter(filter);
  const p = (pid && mine.find((x) => x.id === pid)) || mine[0];
  if (!p) return { title, subtitle, html: `<div class="card">${empty("No active projects", "", "folder")}</div>` };
  const v = projectView(p, user, tab, "#/job");
  const section = location.hash.split("/")[1];
  return {
    ...v, title, subtitle, back: null, actions: "",
    html: `<div class="row" style="margin-bottom:14px"><span class="small muted">Project</span>
      <select data-change="dPick" data-section="${section}" style="width:auto;min-width:220px" aria-label="Project">${mine.map((x) => `<option value="${x.id}" ${x.id === p.id ? "selected" : ""}>${esc(projectTitle(x))} · ${esc(C.stageName(x.stage))}</option>`).join("")}</select>
      <a class="btn sm" href="#/job/${p.id}">All tabs ${icon("arrowRight", "icon sm")}</a></div>${v.html.replace(/<nav class="tabs">[\s\S]*?<\/nav>/, "")}`,
  };
}
function intake([pid], user) {
  const mine = myProjects(user).filter((p) => p.status === "active");
  if (pid) return scoped(user, pid, "assets", "Asset Intake", "Track what you have and what's missing.");
  return {
    title: "Asset Intake Checklist", subtitle: "Track what you have and what's missing. Clients get automatic reminders.",
    html: mine.length ? `<div class="grid">${mine.map((p) => `<div><a href="#/intake/${p.id}" style="text-decoration:none;color:inherit;display:block">${intakeCard(p, { remind: false })}</a></div>`).join("")}</div>` : `<div class="card">${empty("No active projects")}</div>`,
  };
}
const workspace = ([pid], user) => scoped(user, pid, "design", "Design Workspace", "Build and preview your designs.");
const handover = ([pid], user) => user.role === "qa"
  ? scoped(user, pid, "handover", "QA Review", "Check content, functionality, mobile and privacy before sign-off.", (p) => p.stage >= 3)
  : scoped(user, pid, "handover", "Handover Checklist", "Prepare for QA and client delivery.");

// 4 · Workload & deadlines
function workload(_, user) {
  const mine = myProjects(user).filter((p) => p.status === "active").sort((a, b) => (a.dueDate || "9").localeCompare(b.dueDate || "9"));
  const start = new Date(); start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + ui.weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayK = key(new Date());
  const dueOn = (k) => mine.filter((p) => p.dueDate === k);
  const weekKeys = days.map(key);
  const thisWeek = mine.filter((p) => weekKeys.includes(p.dueDate));
  return {
    title: "Workload & Deadlines", subtitle: "View your schedule and upcoming deadlines.",
    html: `<div class="stack lg">
      <div class="card stack">
        <div class="row between"><b>${start.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</b>
          <div class="row"><button class="icon-btn plain" data-act="wkMove" data-d="-1" aria-label="Previous week">${icon("arrowLeft", "icon sm")}</button><button class="btn sm" data-act="wkMove" data-d="0">This week</button><button class="icon-btn plain" data-act="wkMove" data-d="1" aria-label="Next week">${icon("arrowRight", "icon sm")}</button></div></div>
        <div class="week">${days.map((d) => `<div class="${key(d) === todayK ? "today" : ""} ${dueOn(key(d)).length ? "has" : ""}"><span class="tiny">${d.toLocaleDateString("en-IN", { weekday: "short" })}</span><b>${d.getDate()}</b></div>`).join("")}</div>
        ${thisWeek.length ? `<div class="small"><b>Due this week:</b> ${thisWeek.map((p) => `${esc(projectTitle(p))} (${C.shortDate(p.dueDate)})`).join(", ")}</div>` : `<p class="small muted" style="margin:0">Nothing due this week.</p>`}
      </div>
      <div class="card pad0">${rtable([{ label: "Project" }, { label: "Stage" }, { label: "Due", cls: "pill" }, { label: "Revisions" }, { label: "Client details" }],
        mine.map((p) => [`<div class="row nowrap">${thumb(p)}<span class="t">${esc(projectTitle(p))}</span></div>`, `<span style="color:${stageColor(p)};font-weight:600">${esc(C.stageName(p.stage))}</span>`, badge(C.shortDate(p.dueDate), dueTone(p)), esc(C.limitLabel(p)), `${C.checklistDone(p)}/${C.checklist(p).length}`]),
        { empty: "No active projects.", href: (i) => `#/job/${mine[i].id}` })}</div>
    </div>`,
  };
}

// 5 · Brand workspace
function brand() {
  const fonts = [["Playfair Display", "Headings, couple names", "serif"], ["Montserrat", "Body, details, RSVP", "sans-serif"], ["Cormorant Garamond", "Elegant alternates", "serif"], ["Tiro Devanagari Hindi", "Hindi / Marwari wording", "serif"], ["Great Vibes", "Script accents only", "cursive"]];
  const palettes = [["Royal Maroon", ["#6b1324", "#d6a84f", "#f3dfb2", "#2a0a10"]], ["Mandap Ivory", ["#f4e6cf", "#b8862f", "#8a2b1d", "#3d2a14"]], ["Desert Sand", ["#efe0c4", "#a8763a", "#7a4a1f", "#fffaf0"]], ["Palace Night", ["#121212", "#d4a64a", "#3a2a10", "#f5e6c8"]], ["Mehendi Green", ["#365314", "#d9b56f", "#0e7490", "#f7fee7"]]];
  const T = [["fonts", "Fonts"], ["colors", "Colors"], ["templates", "Templates"], ["assets", "Assets"]];
  const body = {
    fonts: () => `<div class="card"><h3 style="margin-bottom:8px">Approved fonts</h3><div class="list">${fonts.map(([f, use, gen]) => `<div class="item"><div class="grow"><div style="font-family:'${f}',${gen};font-size:20px">${esc(f)}</div><div class="item-s">${esc(use)}</div></div><a class="btn sm" target="_blank" rel="noopener" href="https://fonts.google.com/specimen/${encodeURIComponent(f.replace(/ /g, "+"))}">Get</a></div>`).join("")}</div></div>`,
    colors: () => `<div class="grid">${palettes.map(([n, cs]) => `<div class="card stack sm"><b>${esc(n)}</b><div class="row" style="gap:0;border-radius:8px;overflow:hidden">${cs.map((c) => `<button style="flex:1;height:56px;background:${c};border:0;cursor:pointer" data-act="copy" data-text="${c}" data-label="${c} copied" aria-label="Copy ${c}"></button>`).join("")}</div><div class="tiny muted">${cs.join(" · ")} — tap to copy</div></div>`).join("")}</div>`,
    templates: () => `<div class="tpl-grid">${db.templates.filter((t) => t.status === "active").map((t) => `<div class="tpl"><div class="art">${templateArt(t)}</div><div class="meta"><b>${esc(t.name)}</b><div class="tiny muted">${t.tiers.map((k) => esc(C.S().tiers[k]?.name)).join(" · ")}</div>${t.previewUrl ? `<a class="small" href="${attr(t.previewUrl)}" target="_blank" rel="noopener">Open</a>` : ""}</div></div>`).join("")}</div>`,
    assets: () => `<div class="stack"><div class="card"><h3>Cultural & quality checklist</h3><ul class="small" style="padding-left:18px;margin:8px 0 0">
        <li>“Shri Ganeshaya Namah” at the top unless the family asks otherwise.</li>
        <li>Order family names as given; Dada-Dadi / Nana-Nani blessings exactly as written.</li>
        <li>Use the family's spelling for Marwari surnames — never auto-correct.</li>
        <li>Event names: Ganesh puja, Mayra / Bhaat, Haldi, Mehendi, Mahila sangeet, Baraat, Phera, Bidaai.</li>
        <li>Times in IST, 12-hour clock; every venue with a Maps link.</li></ul></div>
      <div class="tiles">${db.library.filter((a) => a.status === "approved" && a.source === "stock").map((a) => `<div class="tile"><a class="th" ${a.fileId ? `data-file="${a.fileId}" data-kind="${a.fileKind || "image"}"` : ""}>${icon(a.kind === "Reel clip" ? "video" : "file", "icon lg")}</a><div class="meta"><b>${esc(a.title)}</b></div></div>`).join("")}</div></div>`,
  }[ui.brand]();
  return { title: "Brand Workspace", subtitle: "Access approved brand elements.", html: stateTabs(T, ui.brand, "bTab") + body, after: hydrateFiles };
}

function job([id, tab = "design", ...rest], user) {
  const p = byId("projects", id);
  if (!p || !myProjects(user).includes(p)) return null;
  return projectView(p, user, tab, "#/job", rest);
}

export const routes = { dhome, qahome, intake, workspace, workload, brand, handover, job };

act({
  dTab: (el) => { ui.tab = el.dataset.v; routesRefresh(); },
  bTab: (el) => { ui.brand = el.dataset.v; routesRefresh(); },
  wkMove: (el) => { const d = Number(el.dataset.d); ui.weekOffset = d ? ui.weekOffset + d : 0; routesRefresh(); },
  dPick: (el) => { location.hash = `/${el.dataset.section}/${el.value}`; },
});
