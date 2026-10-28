// Data layer. All records live in one JSON document in localStorage;
// uploaded files (photos, videos, voice notes, PDFs) live in IndexedDB.
// Every write goes through commit() so it is saved and audit-logged.

import { seed } from "./seed.js";

const KEY = "bfi.data.v2";
const SESSION = "bfi.session.v1";
const listeners = new Set();

export let db = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch { /* fall through to a fresh seed */ }
  const fresh = seed();
  persist(fresh);
  return fresh;
}

function migrate(data) {
  // Keep older saves working when new collections are added.
  const base = seed({ empty: true });
  for (const k of Object.keys(base)) if (data[k] === undefined) data[k] = base[k];
  data.settings = { ...base.settings, ...data.settings };
  for (const p of data.projects) { p.messages = p.messages || []; p.assets = p.assets || []; }
  return data;
}

function persist(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (e) { console.error(e); alert("Storage is full. Export a backup and remove large items."); }
}

export const onChange = (fn) => listeners.add(fn);

export function commit(action, entity, detail = "") {
  const who = currentUser();
  db.audit.unshift({ id: uid("log"), at: now(), by: who ? who.name : "Client", byId: who?.id || null, action, entity, detail });
  if (db.audit.length > 2000) db.audit.length = 2000;
  persist(db);
  listeners.forEach((fn) => fn());
}

export function replaceAll(data) {
  db = migrate(data);
  persist(db);
  listeners.forEach((fn) => fn());
}

export function resetDemo() {
  db = seed();
  persist(db);
  idbClear();
}

// ── ids & tokens ─────────────────────────
export const uid = (p = "id") => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const ALPH = "abcdefghjkmnpqrstuvwxyz23456789";
export function token(len = 22) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ALPH[b % ALPH.length]).join("");
}
export const now = () => new Date().toISOString();

// ── lookups ──────────────────────────────
export const byId = (col, id) => db[col].find((r) => r.id === id);
export const userName = (id) => byId("users", id)?.name || "—";

// ── session ──────────────────────────────
export function currentUser() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION) || "null");
    const u = s && byId("users", s.userId);
    if (!u || u.active === false) return null;
    if (u.accessUntil && new Date(u.accessUntil) < new Date()) return null;
    return u;
  } catch { return null; }
}
export function signIn(userId) {
  localStorage.setItem(SESSION, JSON.stringify({ userId, at: now() }));
}
export function signOut() { localStorage.removeItem(SESSION); }

// ── file storage (IndexedDB) ─────────────
let idb;
function openIdb() {
  if (idb) return idb;
  idb = new Promise((res, rej) => {
    const r = indexedDB.open("bfi-files", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return idb;
}
export async function putFile(blob) {
  const id = uid("f");
  const d = await openIdb();
  await new Promise((res, rej) => {
    const t = d.transaction("files", "readwrite");
    t.objectStore("files").put(blob, id);
    t.oncomplete = res; t.onerror = () => rej(t.error);
  });
  return id;
}
const urlCache = new Map();
export async function fileUrl(id) {
  if (urlCache.has(id)) return urlCache.get(id);
  const d = await openIdb();
  const blob = await new Promise((res) => {
    const r = d.transaction("files").objectStore("files").get(id);
    r.onsuccess = () => res(r.result); r.onerror = () => res(null);
  });
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}
async function idbClear() {
  const d = await openIdb();
  d.transaction("files", "readwrite").objectStore("files").clear();
}
