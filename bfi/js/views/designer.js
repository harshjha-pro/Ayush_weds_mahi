// Designer, QA reviewer and freelancer workspace. Each sees only the
// projects assigned to them; freelancers only within their access window.

import { db, byId } from "../db.js";
import { icon } from "../icons.js";
import { esc, badge, empty, kpi } from "../ui.js";
import * as C from "../calc.js";
import { projectView, coupleName } from "./project.js";
import { projectCard } from "./admin.js";

export function myProjects(user) {
  return db.projects.filter((p) => {
    if (user.role === "qa") return p.qaId === user.id;
    if (user.role === "freelancer") return p.designerId === user.id && (user.projectIds || []).includes(p.id);
    return p.designerId === user.id;
  });
}

function dhome(_, user) {
  const mine = myProjects(user).filter((p) => p.status === "active");
  const isQA = user.role === "qa";
  const queue = isQA ? mine.filter((p) => p.stage === 5) : mine.filter((p) => [2, 3].includes(p.stage) || p.revisions.some((r) => r.status !== "resolved"));
  const upcoming = mine.slice().sort((a, b) => (a.dueDate || "9").localeCompare(b.dueDate || "9"));
  const openRev = mine.flatMap((p) => p.revisions.filter((r) => r.status !== "resolved").map((r) => [p, r]));
  const missing = mine.filter((p) => p.stage <= 3 && C.checklistDone(p) < C.checklist(p).length);
  return {
    title: `Namaste, ${user.name.split(" ")[0]}`, eyebrow: isQA ? "QA workload" : "Your workload",
    html: `<div class="stack lg">
      ${user.accessUntil ? `<div class="callout">${icon("clock")}<div>Freelance access ends <b>${C.date(user.accessUntil)}</b> (${C.daysUntil(user.accessUntil)} days).</div></div>` : ""}
      <div class="grid kpi">
        ${kpi("Active projects", mine.length)}
        ${kpi(isQA ? "Waiting for QA" : "Need work now", queue.length)}
        ${kpi("Overdue", mine.filter(C.isOverdue).length)}
        ${isQA ? kpi("Passed this month", myProjects(user).filter((p) => p.qa?.status === "pass" && (p.qa.at || "").slice(0, 7) === C.today().slice(0, 7)).length) : kpi("Open revision items", openRev.reduce((s, [, r]) => s + r.items.filter((x) => !x.done).length, 0))}
      </div>
      <div class="two">
        <div class="card"><div class="card-head"><h3>Due dates</h3><a class="small" href="#/work">All →</a></div>
          ${upcoming.length ? `<div class="list">${upcoming.map((p) => { const h = C.health(p); return `<a class="item" href="#/job/${p.id}"><div class="grow"><div class="item-t ellipsis">${esc(coupleName(p))}</div><div class="item-s">${esc(C.stageName(p.stage))} · due ${C.shortDate(p.dueDate)}</div></div>${badge(h.label, h.tone)}</a>`; }).join("")}</div>` : empty("Nothing assigned", "New projects appear here when the admin assigns you.", "folder")}
        </div>
        <div class="stack">
          ${!isQA ? `<div class="card"><h3>Open revisions</h3>${openRev.length ? `<div class="list">${openRev.map(([p, r]) => `<a class="item" href="#/job/${p.id}/revisions">${icon("list")}<div class="grow"><div class="item-t">${esc(coupleName(p))} · round ${r.round}</div><div class="item-s">${r.items.filter((x) => !x.done).length} item(s) pending</div></div></a>`).join("")}</div>` : `<p class="small muted">No pending revision items.</p>`}</div>
          <div class="card"><h3>Waiting on clients</h3>${missing.length ? `<div class="list">${missing.map((p) => `<a class="item" href="#/job/${p.id}">${icon("clock")}<div class="grow"><div class="item-t">${esc(coupleName(p))}</div><div class="item-s">${C.checklist(p).filter((c) => !c.done).map((c) => esc(c.label)).join(", ")}</div></div></a>`).join("")}</div>` : `<p class="small muted">Everyone has sent their details.</p>`}<p class="tiny muted">Clients get automatic reminders from the studio.</p></div>` : ""}
          ${isQA && queue.length ? `<div class="card"><h3>QA queue</h3><div class="list">${queue.map((p) => `<a class="item" href="#/job/${p.id}/handover">${icon("checkCircle")}<div class="grow item-t">${esc(coupleName(p))}</div>${icon("chevron")}</a>`).join("")}</div></div>` : ""}
        </div>
      </div>
    </div>`,
  };
}

function work(_, user) {
  const mine = myProjects(user);
  const active = mine.filter((p) => p.status === "active");
  const done = mine.filter((p) => p.status !== "active");
  return {
    title: user.role === "qa" ? "QA queue" : "My projects",
    html: `<div class="stack lg">
      <div class="grid">${active.map((p) => projectCard(p, "#/job")).join("") || `<div class="card">${empty("No active projects")}</div>`}</div>
      ${done.length ? `<div><div class="eyebrow">Completed</div><div class="grid">${done.map((p) => projectCard(p, "#/job")).join("")}</div></div>` : ""}
    </div>`,
  };
}

function job([id, tab = "overview"], user) {
  const p = byId("projects", id);
  if (!p || !myProjects(user).includes(p)) return null;
  return projectView(p, user, tab, "#/job");
}

function brand() {
  const palettes = [
    ["Royal Maroon", ["#5a1726", "#b48a3c", "#fbf6ee", "#2b171c"]],
    ["Haveli Rang", ["#c2410c", "#f59e0b", "#14532d", "#fef3c7"]],
    ["Mehendi Mor", ["#365314", "#0e7490", "#d9b56f", "#f7fee7"]],
    ["Gangaur Blush", ["#be7c86", "#f3d9d4", "#9a7b4f", "#fffaf5"]],
  ];
  const fonts = [["Cormorant Garamond", "Headings, names", "serif"], ["Inter", "Body, details, RSVP", "sans-serif"], ["Tiro Devanagari Hindi", "Hindi / Marwari wording", "serif"], ["Great Vibes", "Script accents only", "cursive"]];
  return {
    title: "Brand kit",
    html: `<div class="stack lg">
      <div class="card"><h3 style="margin-bottom:10px">Approved palettes</h3><div class="grid">${palettes.map(([n, cs]) => `<div><b class="small">${esc(n)}</b><div class="row" style="gap:6px;margin-top:6px">${cs.map((c) => `<button class="avatar" style="background:${c};border-color:var(--line-2)" data-act="copy" data-text="${c}" data-label="${c} copied" aria-label="Copy ${c}"></button>`).join("")}</div><div class="tiny muted">${cs.join(" · ")}</div></div>`).join("")}</div></div>
      <div class="card"><h3 style="margin-bottom:10px">Fonts</h3><div class="list">${fonts.map(([f, use, gen]) => `<div class="item"><div class="grow"><div style="font-family:'${f}',${gen};font-size:22px">${esc(f)}</div><div class="item-s">${esc(use)}</div></div><a class="btn sm" target="_blank" rel="noopener" href="https://fonts.google.com/specimen/${encodeURIComponent(f.replace(/ /g, "+"))}">Get</a></div>`).join("")}</div></div>
      <div class="card"><h3 style="margin-bottom:10px">Templates</h3><div class="list">${db.templates.filter((t) => t.status === "active").map((t) => `<div class="item">${icon("layers")}<div class="grow"><div class="item-t">${esc(t.name)}</div><div class="item-s">${t.tiers.map((k) => esc(C.S().tiers[k]?.name)).join(" · ")} · ${t.tags.map((x) => "#" + esc(x)).join(" ")}</div></div>${t.previewUrl ? `<a class="btn sm" href="${esc(t.previewUrl)}" target="_blank" rel="noopener">Open</a>` : ""}</div>`).join("")}</div></div>
      <div class="card"><h3>Cultural & quality checklist</h3><ul class="small" style="padding-left:18px;margin:8px 0 0">
        <li>Ganesh vandana / “Shri Ganeshaya Namah” at the top unless the family asks otherwise.</li>
        <li>Order family names as given; elders and “Nana-Nani / Dada-Dadi” blessings exactly as written.</li>
        <li>Use the family's spelling for Marwari surnames — never auto-correct.</li>
        <li>Event names: Ganesh puja, Mayra / Bhaat, Haldi, Mehendi, Mahila sangeet, Baraat, Phera, Bidaai.</li>
        <li>Times in IST with a 12-hour clock; venue with a Maps link.</li>
      </ul></div>
    </div>`,
  };
}

export const routes = { dhome, work, job, brand };
