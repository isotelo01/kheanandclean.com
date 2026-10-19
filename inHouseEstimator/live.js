/* Loaded on every staff page by tabbar.js.
   1) Red unread bubbles: Texts (unread texts), Phone (new voicemails) on the phone bottom bar and the
      hub tiles; Mail (unread emails) on the hub tile.
   2) The business phone stays on on every page: it rings here along with both cells.
      phone.html and texts.html run their own phone, so this one stays off there.
      Green dot on the Phone tab (phones) / small "Phone on" pill (computers) while it's ready. */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js";

const app = getApps().length ? getApp() : initializeApp({
  apiKey: "AIzaSyCC1AXsqeWVBS792gor4BA6MLmz1yLypqg",
  authDomain: "khean-estimator-78f3e.firebaseapp.com",
  projectId: "khean-estimator-78f3e",
  storageBucket: "khean-estimator-78f3e.firebasestorage.app",
  messagingSenderId: "581692353222",
  appId: "1:581692353222:web:21f62f057ac5506bbb45c7"
});
const db = getFirestore(app), fns = getFunctions(app, "us-central1");
const here = (location.pathname.split("/").pop() || "").replace(/\.html$/, "");
const OWN_PHONE = here === "phone" || here === "texts";

const css = document.createElement("style");
css.textContent =
  ".kcBadge{position:absolute;top:-6px;right:-8px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#d93a3a;color:#fff;" +
    "font:700 11px/18px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #172239;pointer-events:none}" +
  ".tile .kcBadge{top:10px;right:10px;min-width:24px;height:24px;line-height:24px;font-size:13px;border-radius:12px;box-shadow:none}" +
  ".tile{position:relative}" +
  "#tabbar a{position:relative}#tabbar .kcIco{position:relative;display:inline-block}" +
  "#tabbar a.kcOn{color:#3ccf7f}#tabbar a.kcOn.on{color:#3ccf7f}" +
  "#kcPill{position:fixed;left:14px;bottom:14px;z-index:30;display:flex;align-items:center;gap:6px;background:#172239;color:#fff;" +
    "border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:6px 12px;font:600 12px system-ui,sans-serif;text-decoration:none}" +
  "#kcPill i{width:8px;height:8px;border-radius:50%;background:#3ccf7f}#kcPill.off i{background:#999}#kcPill.bad i{background:#d93a3a}" +
  "@media (max-width:759px){#kcPill{display:none}}" +
  "#kcCall{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:60;width:min(560px,calc(100% - 24px));background:#172239;color:#fff;" +
    "border:1px solid #d9b25f;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 6px 24px rgba(0,0,0,.4)}" +
  "#kcCall[hidden]{display:none}" +
  "#kcCall .w{flex:1;min-width:0;font:700 17px system-ui,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
  "#kcCall .s{display:block;font-weight:400;font-size:13px;opacity:.85}" +
  "#kcCall button{font:600 15px system-ui,sans-serif;border:0;border-radius:8px;padding:10px 14px;cursor:pointer}" +
  "#kcCall .ok{background:#1f8a5b;color:#fff}#kcCall .no{background:#d93a3a;color:#fff}#kcCall .mu{background:#fff;color:#172239}" +
  "@media (max-width:759px){#kcCall{bottom:calc(58px + env(safe-area-inset-bottom))}}";
document.head.appendChild(css);

/* ---------- bubbles ---------- */
const counts = {texts: 0, phone: 0, email: 0};
function paint() {
  [["texts", "./texts.html"], ["phone", "./phone.html"], ["email", "./email.html"]].forEach(([k, href]) => {
    document.querySelectorAll('#tabbar a[href="' + href + '"], a.tile[href="' + href + '"]').forEach(a => {
      const host = a.closest("#tabbar") ? (a.querySelector(".kcIco") || wrapIcon(a)) : a;
      let b = host.querySelector(":scope > .kcBadge");
      const n = counts[k];
      if (!n) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement("span"); b.className = "kcBadge"; host.appendChild(b); }
      b.textContent = n > 99 ? "99+" : String(n);
      b.setAttribute("aria-label", n + " new");
    });
  });
}
function wrapIcon(a) {   // the bubble sits on the tab's icon, not the whole tab
  const svg = a.querySelector("svg"); if (!svg) return a;
  const s = document.createElement("span"); s.className = "kcIco";
  svg.before(s); s.appendChild(svg); return s;
}

function startBubbles() {
  onSnapshot(query(collection(db, "smsThreads"), where("unread", ">", 0)), snap => {
    counts.texts = snap.docs.reduce((n, d) => n + (Number(d.data().unread) || 0), 0); paint();
  }, e => console.warn("texts bubble", e));
  onSnapshot(query(collection(db, "calls"), where("vmNew", "==", true)), snap => {
    counts.phone = snap.size; paint();
  }, e => console.warn("phone bubble", e));
  if (here === "hub") {
    const mailUnseen = httpsCallable(fns, "mailUnseen");
    const getMail = () => mailUnseen().then(r => { counts.email = Number(r.data && r.data.unseen) || 0; paint(); })
      .catch(e => console.warn("mail bubble", e));
    getMail(); setInterval(getMail, 2 * 60 * 1000);   // every 2 minutes while the hub is open
  }
}

/* ---------- phone on every page ---------- */
function phoneLook(state, why) {   // "on" | "off" | "bad"
  document.querySelectorAll('#tabbar a[href="./phone.html"]').forEach(a => a.classList.toggle("kcOn", state === "on"));
  let p = document.getElementById("kcPill");
  if (!p) { p = document.createElement("a"); p.id = "kcPill"; p.href = "./phone.html"; p.innerHTML = "<i></i><span></span>"; document.body.appendChild(p); }
  p.className = state === "on" ? "" : state;
  p.querySelector("span").textContent = state === "on" ? "Phone on" : state === "bad" ? "Phone error" : "Phone off";
  p.title = why || (state === "on" ? "This page rings with your cells." : "");
}

// phone.html / texts.html: just mirror their own Phone button into the green tab.
function mirrorOwnPhone() {
  const btn = document.getElementById("phoneBtn"); if (!btn) return;
  const sync = () => phoneLook(btn.classList.contains("on") ? "on" : btn.classList.contains("bad") ? "bad" : "off", btn.title);
  new MutationObserver(sync).observe(btn, {attributes: true, attributeFilter: ["class"]});
  sync();
}

function loadSdk() {
  if (window.Twilio && window.Twilio.Device) return Promise.resolve();
  return new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@twilio/voice-sdk@2.18.5/dist/twilio.min.js";
    s.onload = ok; s.onerror = () => fail(new Error("The calling library didn't load."));
    document.head.appendChild(s);
  });
}

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const pretty = p => { const d = String(p || "").replace(/\D/g, "").slice(-10); return d.length === 10 ? "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6) : String(p || "Unknown caller"); };
let device = null, live = null, tick = null;

async function startPhone() {
  phoneLook("off");
  const voiceToken = httpsCallable(fns, "voiceToken");
  const getToken = async () => (await voiceToken()).data.token;
  try {
    await loadSdk();
    // No microphone question here: it's asked only when you answer a call.
    device = new window.Twilio.Device(await getToken(), {closeProtection: true, codecPreferences: ["opus", "pcmu"]});
    device.on("registered", () => phoneLook("on"));
    device.on("unregistered", () => phoneLook("off"));
    device.on("error", e => { console.warn("phone", e); phoneLook("bad", e ? (e.code ? e.code + ": " : "") + (e.message || "") : ""); });
    device.on("incoming", ringing);
    device.on("tokenWillExpire", async () => { try { device.updateToken(await getToken()); } catch (e) { console.warn("phone token", e); } });
    await device.register();
  } catch (e) {
    console.warn("phone on", e);
    if (device) { try { device.destroy(); } catch (x) {} device = null; }
    phoneLook("bad", (e && e.message) || String(e));
  }
}

function bar() {
  let b = document.getElementById("kcCall");
  if (!b) { b = document.createElement("div"); b.id = "kcCall"; b.setAttribute("role", "status"); b.setAttribute("aria-live", "polite"); document.body.appendChild(b); }
  return b;
}
function endCall() {
  clearInterval(tick); tick = null; live = null;
  const b = bar(); b.hidden = true; b.innerHTML = "";
}
function ringing(c) {
  if (live) { c.reject(); return; }
  live = c;
  const num = pretty(c.parameters && c.parameters.From), b = bar();
  b.innerHTML = '<span class="w">' + esc(num) + '<span class="s">Incoming call</span></span>' +
    '<button type="button" class="ok" id="kcAns">Answer</button><button type="button" class="no" id="kcDec">Decline</button>';
  b.hidden = false;
  ["cancel", "disconnect", "reject"].forEach(ev => c.on(ev, () => { if (live === c) endCall(); }));
  c.on("error", e => { console.warn("call", e); if (live === c) endCall(); });
  document.getElementById("kcDec").onclick = () => { c.reject(); endCall(); };
  document.getElementById("kcAns").onclick = () => {
    b.innerHTML = '<span class="w">' + esc(num) + '<span class="s" id="kcSub">Connecting…</span></span>' +
      '<button type="button" class="mu" id="kcMute">Mute</button><button type="button" class="no" id="kcHang">Hang up</button>';
    document.getElementById("kcMute").onclick = e => {
      const m = !c.isMuted(); c.mute(m); e.currentTarget.textContent = m ? "Unmute" : "Mute";
    };
    document.getElementById("kcHang").onclick = () => c.disconnect();
    c.on("accept", () => {
      const t0 = Date.now(), sub = document.getElementById("kcSub");
      tick = setInterval(() => { const s = Math.round((Date.now() - t0) / 1000); if (sub) sub.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }, 1000);
    });
    c.accept();
  };
}

let started = false;
onAuthStateChanged(getAuth(app), user => {
  if (!user || started) return;
  started = true;
  startBubbles();
  if (OWN_PHONE) mirrorOwnPhone(); else startPhone();
});
