/* Casey Jones on every staff page (loaded by tabbar.js; manager.html has its own full page).
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
  "#kcFloat{position:fixed;right:16px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:41;display:flex;align-items:flex-end;gap:10px;flex-direction:row-reverse;--fb:calc(30px + env(safe-area-inset-bottom))}" +
  "@media (max-width:759px){#kcFloat{bottom:calc(89px + env(safe-area-inset-bottom));--fb:calc(104px + env(safe-area-inset-bottom))}}" +
  "body:has(#callbar) #kcFloat{display:none}" +
  "#kcBtn{width:52px;height:52px;border-radius:50%;border:0;background:#E3B64A;color:#111;display:grid;place-items:center;box-shadow:0 3px 10px rgba(0,0,0,.3);cursor:pointer;padding:0}" +
  "#kcBtn svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}" +
  "#kcFloat.on #kcBtn{background:#b3261e;color:#fff}" +
  "#kcFloat.on #kcBtn svg{transform:rotate(135deg)}" +
  /* KC's button: the gold hockey-mask emblem with a shine that sweeps across it. On a call it gets a red ring. */
  "#kcBtn.mask{position:relative;overflow:hidden;width:56px;height:56px;background:#1a1300 url(../images/kc-mask-gold.png) center/cover no-repeat;box-shadow:0 0 0 2px rgba(227,182,74,.55),0 3px 12px rgba(0,0,0,.35)}" +
  "#kcBtn.mask::after{content:'';position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 40%,rgba(255,248,220,.75) 50%,transparent 60%);transform:translateX(-120%);animation:kcfMaskShine 3.2s ease-in-out infinite}" +
  "@keyframes kcfMaskShine{0%,55%{transform:translateX(-120%)}85%,100%{transform:translateX(120%)}}" +
  "@media (prefers-reduced-motion:reduce){#kcBtn.mask::after{animation:none;display:none}}" +
  "#kcFloat.on #kcBtn.mask{background:#1a1300 url(../images/kc-mask-gold.png) center/cover no-repeat;box-shadow:0 0 0 3px #b3261e,0 0 14px rgba(179,38,30,.7)}" +
  /* Mask column: the small Text (chat) icon sits right above the mask while a call is on. */
  "#kcCol{display:flex;flex-direction:column;align-items:center;gap:8px}" +
  "#kcText{display:none;width:34px;height:34px;border-radius:50%;background:#E3B64A;color:#172239;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.35)}" +
  "#kcText svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}" +
  "#kcFloat.on #kcText{display:grid}" +
  /* No box: the KC logo floats on its own with the transcript above it. Tap the logo to talk, tap again to turn the mic off. */
  /* KC's logo stays still in the center of the screen; the transcript sits above it and grows upward on its own. */
  "#kcBubble{display:none}" +
  "#kcFloat.on #kcBubble{display:block}" +
  "#kcFace{position:fixed;left:50%;bottom:var(--fb);margin-left:-42px;width:84px;height:84px;border-radius:50%;background:#fff url(../images/icon-192.png) center/cover no-repeat;box-shadow:0 0 0 3px #E3B64A,0 4px 14px rgba(0,0,0,.4);cursor:pointer;--lv:0}" +
  /* Mic button, left of KC: tap to mute, tap again to talk. */
  "#kcMic{position:fixed;left:50%;bottom:calc(var(--fb) + 18px);margin-left:-114px;width:48px;height:48px;border-radius:50%;border:0;padding:0;background:#2e8a57;color:#fff;display:grid;place-items:center;box-shadow:0 2px 10px rgba(0,0,0,.4);cursor:pointer}" +
  "#kcMic svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}" +
  "#kcMic .slash{display:none}" +
  "#kcFloat.muted #kcMic{background:#555}#kcFloat.muted #kcMic .slash{display:inline}" +
  /* Voice ring: a spinning green/gold ring while listening that swells with each word heard (--lv, 0 to 1). */
  "#kcFace::before{content:'';position:absolute;inset:calc(-8px - var(--lv) * 10px);border-radius:50%;opacity:0;pointer-events:none;" +
    "background:conic-gradient(from 0deg,#2e8a57,#7ee2a8,#E3B64A,#2e8a57,#7ee2a8,#E3B64A,#2e8a57);" +
    "-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 4px - var(--lv) * 3px),#000 calc(100% - 3px - var(--lv) * 3px));mask:radial-gradient(farthest-side,transparent calc(100% - 4px - var(--lv) * 3px),#000 calc(100% - 3px - var(--lv) * 3px));" +
    "filter:drop-shadow(0 0 calc(4px + var(--lv) * 10px) rgba(126,226,168,.9));transition:opacity .2s}" +
  "#kcFloat.listen #kcFace::before{opacity:calc(.55 + var(--lv) * .45);animation:kcfSpin 2.4s linear infinite}" +
  "#kcFloat.kc #kcFace{animation:kcfTalk .7s infinite}" +
  "@keyframes kcfSpin{to{transform:rotate(360deg)}}" +
  "@keyframes kcfTalk{0%,100%{box-shadow:0 0 0 3px #E3B64A,0 0 0 6px rgba(227,182,74,.4)}50%{box-shadow:0 0 0 3px #E3B64A,0 0 0 16px rgba(227,182,74,0)}}" +
  "@media (prefers-reduced-motion:reduce){#kcFloat.listen #kcFace::before{animation:none}}" +
  /* Transcript: white text on black, about 3 lines; older lines slide up and off. Tap it to open and scroll back. */
  "#kcLog{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--fb) + 122px);width:min(320px,calc(100vw - 32px));box-sizing:border-box;background:rgba(0,0,0,.88);color:#fff;font:500 14px/20px system-ui,sans-serif;border-radius:10px;padding:6px 10px;max-height:72px;overflow:hidden;cursor:pointer;scroll-behavior:smooth}" +
  "#kcLog:empty{display:none}" +
  "#kcLog.open{max-height:50vh;overflow-y:auto;-webkit-overflow-scrolling:touch}" +
  "#kcLog p{margin:0}#kcLog b{color:#E3B64A;font-weight:600}#kcLog .live{opacity:.7}" +
  "#kcState{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--fb) + 92px);width:max-content;max-width:calc(100vw - 32px);box-sizing:border-box;color:#fff;font:600 12px/1.3 system-ui,sans-serif;text-align:center;align-self:center;background:rgba(0,0,0,.75);border-radius:999px;padding:3px 10px}" +
  "#kcState:empty{display:none}";
document.head.appendChild(css);

const wrap = document.createElement("div");
wrap.id = "kcFloat";
wrap.innerHTML =
  '<div id="kcCol"><a id="kcText" href="./manager.html" aria-label="Text Casey Jones" title="Text Casey Jones"><svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/></svg></a>' +
  '<button type="button" id="kcBtn" class="mask" aria-label="Call Casey Jones" title="Call Casey Jones"></button></div>' +
  '<div id="kcBubble"><div id="kcLog" role="log" aria-label="Conversation with KC" title="Tap to read back"></div>' +
  '<button type="button" id="kcMic" aria-label="Mic: tap to mute or talk"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/><path class="slash" d="M4 4l16 16"/></svg></button>' +
  '<div id="kcFace" role="button" tabindex="0" aria-label="Tap KC to stop him talking"></div><div id="kcState" aria-live="polite"></div></div>';
document.body.appendChild(wrap);
const $ = id => document.getElementById(id);
const setState = t => { $("kcState").textContent = t; };
const mode = m => { wrap.classList.remove("you", "kc", "listen"); if (m === "you") wrap.classList.add("listen"); else if (m) wrap.classList.add(m); };
/* Voice ring level: each new word heard bumps it up, then it eases back down. */
let lv = 0, lvRaf = 0;
const bump = () => { lv = Math.min(1, lv + .45); if (!lvRaf) lvRaf = requestAnimationFrame(function step() { lv = Math.max(0, lv - .025); $("kcFace").style.setProperty("--lv", lv.toFixed(3)); lvRaf = lv > 0 ? requestAnimationFrame(step) : 0; }); };
/* Transcript box: the conversation so far, newest at the bottom. Closed it shows ~3 lines; tap to open and scroll back. */
const logBox = () => $("kcLog");
function drawLog(live) {
  const box = logBox(), esc = s => String(s).replace(/[&<>]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"}[c]));
  box.innerHTML = history.slice(-30).map(m => '<p>' + (m.role === "assistant" ? '<b>KC:</b> ' : '<b>You:</b> ') + esc(m.text) + '</p>').join("") +
    (live ? '<p class="live"><b>You:</b> ' + esc(live) + '</p>' : "");
  if (!box.classList.contains("open")) box.scrollTop = box.scrollHeight;
}
let muted = false;

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
  mode("kc"); setState("KC is talking (tap him to stop)");
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
  history.push({ role: "user", text }); keep(); drawLog();
  let reply = "", audio = null;
  try {
    const r = await managerBot({ history, voice: true });
    reply = (r.data && r.data.reply) || ""; audio = (r.data && r.data.audio) || null;
    if (reply) { history.push({ role: "assistant", text: reply }); keep(); drawLog(); }
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
function stopForTap(why) { paused = true; mode(""); setState((why ? why + " " : "") + "Tap the mic to talk."); }
function listen(fromTap) {
  if (!inCall || busy || rec) return;
  if (!SR) { setState("Voice isn't supported here. Tap Text."); return; }
  if ((paused || muted) && !fromTap) return;
  paused = false; muted = false; wrap.classList.remove("muted");
  rec = new SR(); rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false;
  let heard = "", err = "";
  rec.onspeechstart = () => { mode("you"); bump(); setState("Listening…"); };
  rec.onresult = e => { heard = ""; for (const r of e.results) heard += r[0].transcript; if (heard.trim()) { mode("you"); bump(); setState("Listening…"); drawLog(heard.trim()); } };
  rec.onerror = e => { err = e.error || "error"; };
  rec.onend = () => {
    rec = null; mode(""); if (!inCall || muted) return;
    if (heard.trim()) { empties = 0; send(heard.trim()); return; }
    if (err === "not-allowed") { setState("Mic is blocked. Allow the microphone in Settings, then tap the mic."); paused = true; return; }
    if (err && err !== "no-speech" && err !== "aborted") { stopForTap("Mic didn't start (" + err + ")."); return; }
    if (++empties >= 3) { empties = 0; stopForTap("I didn't hear anything."); return; }
    setTimeout(listen, 250);
  };
  mode("you"); setState("Go ahead, I'm listening");
  try { rec.start(); } catch (e) { rec = null; stopForTap("Mic didn't start."); }
}

function startCall(resume) {
  inCall = true; ss.set("kcCall", "1");
  wrap.classList.add("on"); $("kcBtn").setAttribute("aria-label", "Hang up on Casey Jones");
  try { player.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; player.play().catch(() => {}); } catch (e) {}
  empties = 0; paused = false; muted = false; wrap.classList.remove("muted"); drawLog();
  if (resume || history.length) { listen(); return; }
  const hi = "Hey, it's Casey Jones. What do you need?";
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
  mode(""); wrap.classList.remove("on", "muted"); logBox().classList.remove("open"); $("kcBtn").setAttribute("aria-label", "Call Casey Jones");
  if (!keepNote) setState("");
}
$("kcBtn").onclick = () => inCall ? hangUp() : startCall(false);
/* Tap KC's logo: stops him talking. The mic then waits until you tap the mic button. */
$("kcFace").onclick = () => {
  if (!inCall || !stopPlayer) return;
  paused = true; stopPlayer(); setState("Tap the mic to talk.");
};
/* Mic button: while listening, mute it. Otherwise turn it on and listen (stops KC if he's talking). */
$("kcMic").onclick = () => {
  if (!inCall || busy) return;
  if (rec) { muted = true; paused = true; try { rec.abort(); } catch (e) {} rec = null; mode(""); wrap.classList.add("muted"); setState("Mic off. Tap the mic to talk."); return; }
  if (stopPlayer) { paused = true; stopPlayer(); }
  empties = 0; listen(true);
};
$("kcFace").onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("kcFace").onclick(); } };
/* Tap the transcript to open it and scroll back; tap again to shrink it to the last few lines. */
logBox().onclick = () => { const b = logBox(); b.classList.toggle("open"); if (!b.classList.contains("open")) b.scrollTop = b.scrollHeight; };

/* Picked back up after moving to another page. */
if (ss.get("kcCall", "0") === "1") startCall(true);
