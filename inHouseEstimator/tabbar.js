/* Phone-only bottom bar: Phone, Texts, Dashboard, Customers. Loaded by every staff page (not login/quote/terms). */
(function () {
  var tabs = [
    ["phone.html", "Phone", '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'],
    ["texts.html", "Texts", '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'],
    ["dashboard.html", "Dashboard", '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>'],
    ["customers.html", "Contacts", '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>']
  ];
  var here = (location.pathname.split("/").pop() || "").replace(/\.html$/, "");
  // On the Dashboard itself, its tab becomes Income & Expenses.
  // On the Phone page itself, its tab becomes Home (back to the hub).
  var HOME = ["hub.html", "Home", '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>'];
  if (here === "phone") tabs[0] = HOME;
  // On the Texts page: Home, Phone, Dashboard, Customers (no Texts tab there).
  if (here === "texts") tabs = [HOME, tabs[0], tabs[2], tabs[3]];
  if (here === "dashboard") tabs[2] = ["expenses.html", "Income", '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'];
  var css = document.createElement("style");
  css.textContent =
    "#tabbar{display:none}" +
    "@media (max-width:759px){" +
      "#tabbar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;background:#172239;border-top:1px solid rgba(255,255,255,.12);padding-bottom:env(safe-area-inset-bottom)}" +
      /* Two-thirds taller than before (about 77px instead of 46px), bigger icons and labels. */
      "#tabbar a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:76px;padding:12px 0 10px;box-sizing:border-box;color:rgba(255,255,255,.65);text-decoration:none;font:500 12px/1.1 system-ui,sans-serif}" +
      "#tabbar a.on{color:#d9b25f}" +
      "#tabbar svg{width:26px;height:26px}" +
      "body{padding-bottom:calc(77px + env(safe-area-inset-bottom))!important}" +
      "#callbar{bottom:calc(89px + env(safe-area-inset-bottom))!important}" +
      "body.rooms-open .roomsDone{bottom:calc(89px + env(safe-area-inset-bottom))!important}" +   /* room list's Done button sits above the bar */
      ".mhide{display:none!important}" +
    "}";
  document.head.appendChild(css);
  var nav = document.createElement("nav");
  nav.id = "tabbar";
  nav.setAttribute("aria-label", "Quick links");
  nav.innerHTML = tabs.map(function (t) {
    var on = here === t[0].replace(/\.html$/, "");
    return '<a href="./' + t[0] + '"' + (on ? ' class="on" aria-current="page"' : '') + '>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + t[2] + '</svg>' + t[1] + '</a>';
  }).join("");
  document.body.appendChild(nav);
  // Manager bot: a gold call button on every staff page (bottom right, above the tab bar on phones).
  if (here !== "manager") {
    var mcss = document.createElement("style");
    mcss.textContent =
      "#mgrBtn{position:fixed;right:16px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:41;width:52px;height:52px;border-radius:50%;background:#E3B64A;color:#111;display:grid;place-items:center;box-shadow:0 3px 10px rgba(0,0,0,.3);text-decoration:none}" +
      "#mgrBtn svg{width:24px;height:24px}" +
      "@media (max-width:759px){#mgrBtn{bottom:calc(89px + env(safe-area-inset-bottom))}}" +
      "body:has(#callbar) #mgrBtn{display:none}";
    document.head.appendChild(mcss);
    var mgr = document.createElement("a");
    mgr.id = "mgrBtn"; mgr.href = "./manager.html?call=1"; mgr.title = "Call the Manager"; mgr.setAttribute("aria-label", "Call the Manager bot");
    mgr.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13v1M15 13v1M9 17h6"/></svg>';
    document.body.appendChild(mgr);
  }
  // Unread bubbles + the business phone on every page (live.js).
  var live = document.createElement("script");
  live.type = "module"; live.src = "./live.js";
  document.body.appendChild(live);
  // Count button taps for the Taps page (taps.js).
  var taps = document.createElement("script");
  taps.type = "module"; taps.src = "./taps.js";
  document.body.appendChild(taps);
  // Keep the screen on while any app page is open (so the phone stays ready). Phones drop the lock
  // when you leave the app or lock the screen, so it's asked for again whenever the page is back.
  // Phones/browsers without wake lock just ignore this.
  var lock = null;
  function keepAwake() {
    if (!("wakeLock" in navigator) || document.visibilityState !== "visible" || lock) return;
    navigator.wakeLock.request("screen").then(function (l) {
      lock = l; l.addEventListener("release", function () { lock = null; });
    }).catch(function () {});
  }
  keepAwake();
  document.addEventListener("visibilitychange", keepAwake);
  // Some phones only allow it after a tap: try again on the first touch.
  document.addEventListener("pointerdown", keepAwake, { passive: true });
})();
