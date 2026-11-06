/* TAP COUNTER (Israel, Nov 2026) — loaded on every staff page by tabbar.js.
   Counts which buttons and links get tapped, so the Taps page (taps.html) can rank them.
   Taps pile up on the phone and are saved together every 20 seconds and when the page closes,
   into settings/tapStats: counts["page|button"] (everyone) and users.<uid>["page|button"] (per person). */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, setDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const STAFF = ["6lZy8VTy4gTBeLg4HrEGnTNPixg1", "5SNJ2DzfrycMrEfbex73Lywf7KB3", "eoYah1xNcaT7R4lAMOVFFMS7ITN2", "p0cjvQnfHiWXDxRvMuAWm5dyb9e2"];
const app = getApps().length ? getApp() : initializeApp({
  apiKey: "AIzaSyCC1AXsqeWVBS792gor4BA6MLmz1yLypqg",
  authDomain: "khean-estimator-78f3e.firebaseapp.com",
  projectId: "khean-estimator-78f3e",
  storageBucket: "khean-estimator-78f3e.firebasestorage.app",
  messagingSenderId: "581692353222",
  appId: "1:581692353222:web:21f62f057ac5506bbb45c7"
});
const here = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
let uid = "", pending = {};
onAuthStateChanged(getAuth(app), u => { uid = u && STAFF.includes(u.uid) ? u.uid : ""; });

/* The button's name: its label, title, or the words on it (first 40 letters). */
const nameOf = el => String(el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "")
  .replace(/\s+/g, " ").trim().slice(0, 40);
/* Map keys can't have dots or slashes; keep them readable. */
const keyOf = (page, name) => (page + "|" + name).replace(/[.\/\[\]~*`]/g, " ").replace(/\s+/g, " ").trim();

document.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest("button, a, [role=button], summary, label.opt");
  if (!el) return;
  const name = nameOf(el); if (!name) return;
  const k = keyOf(el.closest("#tabbar") ? "bottom bar" : here, name);
  pending[k] = (pending[k] || 0) + 1;
}, true);

function flush() {
  if (!uid) return;
  const keys = Object.keys(pending); if (!keys.length) return;
  const counts = {}, mine = {};
  keys.forEach(k => { counts[k] = increment(pending[k]); mine[k] = increment(pending[k]); });
  pending = {};
  setDoc(doc(getFirestore(app), "settings", "tapStats"),
    { counts, users: { [uid]: mine }, updatedAt: serverTimestamp() }, { merge: true })
    .catch(err => console.warn("tap counter:", err));
}
setInterval(flush, 20000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
window.addEventListener("pagehide", flush);
