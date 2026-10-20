/* Phone-only bottom bar: Phone, Texts, Dashboard, Customers. Loaded by every staff page (not login/quote/terms). */
(function () {
  var tabs = [
    ["phone.html", "Phone", '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'],
    ["texts.html", "Texts", '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'],
    ["dashboard.html", "Dashboard", '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>'],
    ["customers.html", "Customers", '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>']
  ];
  var here = (location.pathname.split("/").pop() || "").replace(/\.html$/, "");
  // On the Dashboard itself, its tab becomes Income & Expenses.
  if (here === "dashboard") tabs[2] = ["expenses.html", "Income", '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'];
  var css = document.createElement("style");
  css.textContent =
    "#tabbar{display:none}" +
    "@media (max-width:759px){" +
      "#tabbar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;background:#172239;border-top:1px solid rgba(255,255,255,.12);padding-bottom:env(safe-area-inset-bottom)}" +
      "#tabbar a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 0 4px;color:rgba(255,255,255,.65);text-decoration:none;font:500 10px/1.1 system-ui,sans-serif}" +
      "#tabbar a.on{color:#d9b25f}" +
      "#tabbar svg{width:18px;height:18px}" +
      "body{padding-bottom:calc(46px + env(safe-area-inset-bottom))!important}" +
      "#callbar{bottom:calc(58px + env(safe-area-inset-bottom))!important}" +
      "body.rooms-open .roomsDone{bottom:calc(58px + env(safe-area-inset-bottom))!important}" +   /* room list's Done button sits above the bar */
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
  // Unread bubbles + the business phone on every page (live.js).
  var live = document.createElement("script");
  live.type = "module"; live.src = "./live.js";
  document.body.appendChild(live);
})();
