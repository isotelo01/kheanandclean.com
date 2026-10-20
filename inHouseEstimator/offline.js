/* Offline job sheets. Used by job-sheet.html and job-room.html.
   - Firestore keeps a copy of the job on the phone, so the pages open with no service, and
     edits made with no service are kept on the phone and sync on their own when service is back.
   - Photos taken with no service are held on the phone and show right away; they upload on
     their own once service is back (next time a job sheet or room page is open).
   - "Download offline job sheet" saves the pages and app files to the phone. */
import { initializeFirestore, getFirestore as fsGetFirestore, persistentLocalCache, persistentMultipleTabManager,
  getDoc as fsGetDoc, getDocFromCache, setDoc as fsSetDoc, updateDoc as fsUpdateDoc }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { uploadBytes as stUpload, getDownloadURL as stUrl, ref as stRef }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

const FB = "https://www.gstatic.com/firebasejs/12.19.0/";
export const OFFLINE_CACHE = "kc-offline-pages";   /* sw.js reads this one and never clears it */

/* ---- Firestore with the on-phone copy ---- */
export function getFirestore(app){
  try { return initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
  catch (e) { console.error(e); return fsGetFirestore(app); }
}
/* No service and the job isn't on the phone either: treat it as not found instead of failing. */
const missing = { exists: () => false, data: () => undefined };
export async function getDoc(r){
  try { return await fsGetDoc(r); }
  catch (e) { try { return await getDocFromCache(r); } catch (e2) { return missing; } }
}
/* With no service a write is kept on the phone right away, but Firestore only says "done" once
   the server has it. Don't make the page wait for that: after a short wait it counts as saved. */
let pending = 0;
const settle = p => {
  pending++; badge();
  p.then(() => { pending = Math.max(0, pending - 1); badge(); }, e => { pending = Math.max(0, pending - 1); console.error(e); badge(); });
  return Promise.race([p, new Promise(r => setTimeout(r, navigator.onLine ? 8000 : 400))]);
};
export const setDoc = (...a) => settle(fsSetDoc(...a));
export const updateDoc = (...a) => settle(fsUpdateDoc(...a));

/* ---- Photos waiting to upload (kept on the phone in IndexedDB) ---- */
const idb = () => new Promise((res, rej) => {
  const o = indexedDB.open("kc-offline-photos", 1);
  o.onupgradeneeded = () => o.result.createObjectStore("q", { keyPath: "path" });
  o.onsuccess = () => res(o.result); o.onerror = () => rej(o.error);
});
const tx = async (mode, fn) => { const d = await idb(); return new Promise((res, rej) => {
  const t = d.transaction("q", mode), out = fn(t.objectStore("q"));
  t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); }); };
const qPut = item => tx("readwrite", s => s.put(item));
const qDel = path => tx("readwrite", s => s.delete(path));
const qGet = path => tx("readonly", s => s.get(path));
const qAll = () => tx("readonly", s => s.getAll());
let waiting = 0;
const countQ = async () => { try { waiting = (await qAll()).length; } catch (e) {} badge(); };

/* Same as Firebase's uploadBytes, except with no service the photo is kept on the phone and
   counts as uploaded (its path is saved on the job like any other photo). */
export async function uploadBytes(r, blob, meta){
  if (navigator.onLine) {
    try { return await Promise.race([stUpload(r, blob, meta),
      new Promise((_, rej) => setTimeout(() => rej(new Error("slow")), 45000))]); }
    catch (e) { if (navigator.onLine && !/network|retry|slow|offline|unknown/i.test(String(e && (e.code || e.message)))) throw e; }
  }
  await qPut({ path: r.fullPath, blob, type: (meta && meta.contentType) || "image/jpeg", at: Date.now() });
  countQ();
  return { ref: r, metadata: { fullPath: r.fullPath }, queued: true };
}
/* A photo still waiting on the phone shows from the phone. Otherwise the link is fetched as
   usual and remembered, so its link is still known with no service. */
export async function getDownloadURL(r){
  try { const q = await qGet(r.fullPath); if (q && q.blob) return URL.createObjectURL(q.blob); } catch (e) {}
  const k = "kcUrl:" + r.fullPath;
  try { const u = await stUrl(r); try { localStorage.setItem(k, u); } catch (e) {} return u; }
  catch (e) { let u = null; try { u = localStorage.getItem(k); } catch (x) {} if (u) return u; throw e; }
}
/* Back in service: send the waiting photos up, oldest first. A photo that already made it up
   (a slow upload that finished on its own) just comes off the list. */
let flushing = false;
export async function flush(storage){
  if (flushing || !navigator.onLine) return; flushing = true;
  try {
    const items = (await qAll()).sort((a, b) => a.at - b.at);
    for (const it of items) {
      const r = stRef(storage, it.path);
      try { await stUpload(r, it.blob, { contentType: it.type }); await qDel(it.path); }
      catch (e) {
        let there = false; try { await stUrl(r); there = true; } catch (x) {}
        if (there) await qDel(it.path); else { console.error("Photo upload " + it.path, e); break; }
      }
      countQ();
    }
  } catch (e) { console.error(e); }
  finally { flushing = false; countQ(); }
}

/* ---- Small gold tag at the bottom: no service / waiting to sync ---- */
let tag = null;
function badge(){
  if (!document.body) return;
  if (!tag) { tag = document.createElement("div"); tag.id = "kcOffTag";
    tag.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(74px + env(safe-area-inset-bottom));z-index:90;background:#E3B64A;color:#172239;font:700 13px system-ui,sans-serif;padding:7px 14px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.4);display:none;max-width:92vw;text-align:center";
    document.body.appendChild(tag); }
  const n = waiting, ph = n + " photo" + (n > 1 ? "s" : "");
  const txt = !navigator.onLine
    ? "No service — saved on phone, will sync" + (n ? " (" + ph + ")" : "")
    : n ? "Uploading " + ph + "…" : pending ? "Syncing…" : "";
  tag.textContent = txt; tag.style.display = txt ? "block" : "none";
}

/* ---- Download offline job sheet: the pages and app files go on the phone ---- */
/* Pages are kept under their path without ".html" (no ?id=...), the same key sw.js looks up. */
const keyOf = u => { const x = new URL(u, location.href); return x.origin + x.pathname.replace(/\.html$/, ""); };
export async function saveForOffline(){
  if (!("caches" in window)) throw new Error("This browser can't save pages offline");
  const c = await caches.open(OFFLINE_CACHE);
  const pages = ["./job-sheet.html", "./job-room.html"];
  const files = ["./offline.js", "./pricing.js", "./theme-dark.css", "./tabbar.js", "../images/icon-180.png",
    FB + "firebase-app.js", FB + "firebase-firestore.js", FB + "firebase-auth.js", FB + "firebase-storage.js"];
  for (const u of pages) {
    const r = await fetch(u, { cache: "reload" }); if (!r.ok) throw new Error("Could not save " + u);
    /* A fresh copy (not marked as redirected), so the phone will open it as a page. */
    await c.put(keyOf(u), new Response(await r.blob(), { headers: { "Content-Type": "text/html; charset=utf-8" } }));
  }
  for (const u of files) {
    const abs = new URL(u, location.href).href;
    const r = await fetch(abs, { cache: "reload" }); if (!r.ok) throw new Error("Could not save " + u);
    await c.put(abs, r);
  }
}
/* The jobs downloaded for offline, newest first (shown on the Job Sheet when no job is open). */
export const offlineJobs = () => { try { return JSON.parse(localStorage.getItem("kcOfflineJobs") || "[]"); } catch (e) { return []; } };
export function rememberJob(j){
  const list = [j, ...offlineJobs().filter(x => x.id !== j.id)].slice(0, 20);
  try { localStorage.setItem("kcOfflineJobs", JSON.stringify(list)); } catch (e) {}
}

/* Start up: service worker (lets the pages open with no service), the tag, waiting photos. */
export function startOffline(storage){
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(e => console.error(e));
  const go = () => { badge(); countQ(); flush(storage); };
  window.addEventListener("online", go);
  window.addEventListener("offline", badge);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
  setInterval(() => flush(storage), 60000);
}
