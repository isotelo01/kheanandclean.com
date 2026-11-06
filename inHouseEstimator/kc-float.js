/* KC Jones on every staff page (loaded by tabbar.js; manager.html has its own full page).
   Gold KC button, bottom right. Tap it: the call starts and a floating KC logo circle pops up.
   The circle pulses while you talk (green) and while KC talks (gold). The same button ends the call.
   While the call is on, a small "Text" button sits next to it and opens KC's own page (manager.html).
   Moving to another page drops the browser's mic and audio, so the call picks itself back up on the
   next page with the same conversation (sessionStorage mgrHistory, shared with manager.html). */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js";

const app = getApps().length ? getApp() : initializeApp({
  apiKey: "AIzaSyCC1AXsqeWVBS792gor4BA6MLmz1yLypqg",
  authDomain: "khean-estimator-78f3e.firebaseapp.com",
  projectId: "khean-estimator-78f3e",
  storageBucket: "khean-estimator-78f3e.firebasestorage.app",
  messagingSenderId: "581692353222",
  appId: "1:581692353222:web:21f62f057ac5506bbb45c7"
});
const managerBot = httpsCallable(getFunctions(app, "us-central1"), "managerBot", { timeout: 190000 });
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const ss = { get(k, d) { try { const v = sessionStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
             set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

const css = document.createElement("style");
css.textContent =
  "#kcFloat{position:fixed;right:16px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:41;display:flex;align-items:flex-end;gap:10px;flex-direction:row-reverse}" +
  "@media (max-width:759px){#kcFloat{bottom:calc(89px + env(safe-area-inset-bottom))}}" +
  "body:has(#callbar) #kcFloat{display:none}" +
  "#kcBtn{width:52px;height:52px;border-radius:50%;border:0;background:#E3B64A;color:#111;display:grid;place-items:center;box-shadow:0 3px 10px rgba(0,0,0,.3);cursor:pointer;padding:0}" +
  "#kcBtn svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}" +
  "#kcFloat.on #kcBtn{background:#b3261e;color:#fff}" +
  "#kcFloat.on #kcBtn svg{transform:rotate(135deg)}" +
  /* KC's button: the gold hockey-mask emblem with a shine that sweeps across it. On a call it gets a red ring. */
  "#kcBtn.mask{position:relative;overflow:hidden;width:56px;height:56px;background:#1a1300 url(../images/kc-mask-gold.png) center/cover no-repeat;box-shadow:0 0 0 2px rgba(227,182,74,.55),0 3px 12px rgba(0,0,0,.35)}" +
  "#kcBtn.mask::after{content:'';position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 40%,rgba(255,248,220,.75) 50%,transparent 60%);transform:translateX(-120%);animation:kcShine 3.2s ease-in-out infinite}" +
  "@keyframes kcShine{0%,55%{transform:translateX(-120%)}85%,100%{transform:translateX(120%)}}" +
  "@media (prefers-reduced-motion:reduce){#kcBtn.mask::after{animation:none;display:none}}" +
  "#kcFloat.on #kcBtn.mask{background:#1a1300 url(../images/kc-mask-gold.png) center/cover no-repeat;box-shadow:0 0 0 3px #b3261e,0 0 14px rgba(179,38,30,.7)}" +
  "#kcBubble{display:none;flex-direction:column;align-items:center;gap:6px;background:#172239;border:1px solid #E3B64A;border-radius:18px;padding:12px 12px 10px;box-shadow:0 6px 20px rgba(0,0,0,.35);width:150px}" +
  "#kcFloat.on #kcBubble{display:flex}" +
  "#kcFace{width:84px;height:84px;border-radius:50%;background:#fff url(../images/icon-192.png) center/cover no-repeat;box-shadow:0 0 0 3px #E3B64A;transition:box-shadow .15s}" +
  "#kcFloat.you #kcFace{animation:kcYou 1s infinite}" +
  "#kcFloat.kc #kcFace{animation:kcTalk .7s infinite}" +
  "@keyframes kcYou{0%,100%{box-shadow:0 0 0 3px #2e8a57,0 0 0 6px rgba(46,138,87,.35)}50%{box-shadow:0 0 0 3px #2e8a57,0 0 0 14px rgba(46,138,87,0)}}" +
  "@keyframes kcTalk{0%,100%{box-shadow:0 0 0 3px #E3B64A,0 0 0 6px rgba(227,182,74,.4)}50%{box-shadow:0 0 0 3px #E3B64A,0 0 0 16px rgba(227,182,74,0)}}" +
  "#kcState{color:#fff;font:600 13px/1.3 system-ui,sans-serif;text-align:center;min-height:17px}" +
  "#kcText{font:600 14px system-ui,sans-serif;color:#172239;background:#E3B64A;border-radius:999px;padding:6px 18px;text-decoration:none}";
document.head.appendChild(css);

const wrap = document.createElement("div");
wrap.id = "kcFloat";
wrap.innerHTML =
  '<button type="button" id="kcBtn" class="mask" aria-label="Call KC Jones" title="Call KC Jones"></button>' +
  '<div id="kcBubble"><div id="kcFace" role="img" aria-label="KC Jones"></div><div id="kcState" aria-live="polite"></div><a id="kcText" href="./manager.html">Text</a></div>';
document.body.appendChild(wrap);
const $ = id => document.getElementById(id);
const setState = t => { $("kcState").textContent = t; };
const mode = m => { wrap.classList.remove("you", "kc"); if (m) wrap.classList.add(m); };

let history = [];
try { history = JSON.parse(ss.get("mgrHistory", "[]")); } catch (e) { history = []; }
const keep = () => ss.set("mgrHistory", JSON.stringify(history.slice(-30)));
let inCall = false, rec = null, busy = false, stopPlayer = null;
const player = new Audio();

/* KC's voice: the backend's MP3 (Google "Charon"); the device voice if there's none. */
const MALE = /\b(male|guy|david|mark|andrew|brian|christopher|eric|roger|aaron|arthur|daniel|fred|alex|rishi|tom|james|oliver|reed|evan|nathan)\b/i;
const maleVoice = () => { try { const en = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
  return en.find(v => /en-US/i.test(v.lang) && MALE.test(v.name) && !/female/i.test(v.name)) || en.find(v => MALE.test(v.name) && !/female/i.test(v.name)) || null; } catch (e) { return null; } };
function speak(t, then, audio) {
  mode("kc"); setState("KC is talking (tap him to cut in)");
  let done = false;
  const fin = () => { if (done) return; done = true; stopPlayer = null; mode(""); if (then) then(); };
  if (audio) {
    player.onended = fin;
    player.onerror = () => { if (!done) { done = true; stopPlayer = null; speak(t, then); } };
    stopPlayer = () => { try { player.pause(); } catch (e) {} fin(); };
    player.src = "data:audio/mpeg;base64," + audio;
    player.play().catch(() => { if (!done) { done = true; stopPlayer = null; speak(t, then); } });
    return;
  }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t); u.rate = 1.05;
    const v = maleVoice(); if (v) u.voice = v; else u.pitch = 0.7;
    u.onend = u.onerror = fin;
    stopPlayer = () => { try { speechSynthesis.cancel(); } catch (e) {} fin(); };
    speechSynthesis.speak(u);
  } catch (e) { fin(); }
}

async function send(text) {
  text = String(text || "").trim(); if (!text || busy) return;
  busy = true; mode(""); setState("Thinking…");
  history.push({ role: "user", text }); keep();
  let reply = "", audio = null;
  try {
    const r = await managerBot({ history, voice: true });
    reply = (r.data && r.data.reply) || ""; audio = (r.data && r.data.audio) || null;
    if (reply) { history.push({ role: "assistant", text: reply }); keep(); }
  } catch (e) {
    history.pop(); keep(); reply = ""; setState(e.message || "Couldn't reach KC.");
  }
  busy = false;
  if (!inCall) return;
  if (reply) speak(reply, listenSoon, audio); else setTimeout(listen, 1200);
}

/* After KC talks, a short pause so the iPhone can switch from speaker to mic before listening. */
const listenSoon = () => setTimeout(listen, 350);
/* Hands-free listening restarts on its own, but never forever: after 3 empty tries or a mic error it
   stops and says "Tap KC to talk". Tapping his face always starts listening (iPhone allows the mic from a tap). */
let empties = 0, paused = false;
function stopForTap(why) { paused = true; mode(""); setState((why ? why + " " : "") + "Tap KC to talk."); }
function listen(fromTap) {
  if (!inCall || busy || rec) return;
  if (!SR) { setState("Voice isn't supported here. Tap Text."); return; }
  if (paused && !fromTap) return;
  paused = false;
  rec = new SR(); rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false;
  let heard = "", err = "";
  rec.onspeechstart = () => { mode("you"); setState("Listening…"); };
  rec.onresult = e => { heard = ""; for (const r of e.results) heard += r[0].transcript; if (heard.trim()) { mode("you"); setState("“" + heard.trim().slice(-60) + "”"); } };
  rec.onerror = e => { err = e.error || "error"; };
  rec.onend = () => {
    rec = null; mode(""); if (!inCall) return;
    if (heard.trim()) { empties = 0; send(heard.trim()); return; }
    if (err === "not-allowed") { setState("Mic is blocked. Allow the microphone in Settings, then tap KC."); paused = true; return; }
    if (err && err !== "no-speech" && err !== "aborted") { stopForTap("Mic didn't start (" + err + ")."); return; }
    if (++empties >= 3) { empties = 0; stopForTap("I didn't hear anything."); return; }
    setTimeout(listen, 250);
  };
  setState("Go ahead, I'm listening");
  try { rec.start(); } catch (e) { rec = null; stopForTap("Mic didn't start."); }
}

function startCall(resume) {
  inCall = true; ss.set("kcCall", "1");
  wrap.classList.add("on"); $("kcBtn").setAttribute("aria-label", "Hang up on KC Jones");
  try { player.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; player.play().catch(() => {}); } catch (e) {}
  empties = 0; paused = false;
  if (resume || history.length) { listen(); return; }
  const hi = "Hey, it's KC Jones. What do you need?";
  /* The greeting's voice is saved on the phone after the first call, so later calls start right away. */
  let saved = null; try { saved = localStorage.getItem("kcHiAudio"); } catch (e) {}
  if (saved) { speak(hi, listenSoon, saved); return; }
  setState("Calling…");
  managerBot({ sayOnly: hi }).then(r => {
    const a = r.data && r.data.audio;
    if (a) { try { localStorage.setItem("kcHiAudio", a); } catch (e) {} }
    if (inCall) speak(hi, listenSoon, a);
  }).catch(() => { if (inCall) speak(hi, listenSoon); });
}
function hangUp(keepNote) {
  inCall = false; ss.set("kcCall", "0");
  if (rec) { try { rec.abort(); } catch (e) {} rec = null; }
  if (stopPlayer) stopPlayer();
  try { speechSynthesis.cancel(); } catch (e) {}
  mode(""); wrap.classList.remove("on"); $("kcBtn").setAttribute("aria-label", "Call KC Jones");
  if (!keepNote) setState("");
}
$("kcBtn").onclick = () => inCall ? hangUp() : startCall(false);
/* Tap KC's face: while he talks, it cuts him off and listens; otherwise it starts listening right from the tap. */
$("kcFace").onclick = () => {
  if (!inCall || busy) return;
  if (stopPlayer) stopPlayer();
  if (rec) return;   /* already listening */
  empties = 0; listen(true);
};
$("kcFace").style.cursor = "pointer";

/* Picked back up after moving to another page. */
if (ss.get("kcCall", "0") === "1") startCall(true);
