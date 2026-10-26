/* Small label under every top-bar icon, so you can see what each one is.
   Same look on every page that loads this file (Leads, Customers, Texts, Email, Calendar).
   The label comes from the button's own label text (.lbl) or its aria-label, and follows it
   when a page changes it (Leads' Trash / back-to-list button). */
(function () {
  var css = document.createElement("style");
  css.textContent =
    ".nav{align-items:flex-start!important}" +
    ".nav > a, .nav > button, #phonePopBtn{flex-direction:column;align-items:center;justify-content:center;gap:3px;" +
      "padding:8px 10px 6px!important;min-width:52px;line-height:1}" +
    ".nav > a > .lbl, .nav > button > .lbl, #phonePopBtn > .lbl{display:block!important;font:600 10.5px/1.1 \"Archivo\",system-ui,sans-serif;" +
      "letter-spacing:.02em;white-space:nowrap;margin:0}" +
    ".nav > [hidden]{display:none!important}" +
    "#phonePopBtn{display:inline-flex}" +
    "@media (max-width:420px){.nav{gap:6px!important}.nav > a, .nav > button{min-width:46px;padding:7px 7px 5px!important}" +
      ".nav > a > .lbl, .nav > button > .lbl{font-size:9.5px}}";
  document.head.appendChild(css);

  function label(el) {
    if (!el.querySelector("svg")) return;                       // text buttons already say what they are
    var lbl = el.querySelector(".lbl");
    var text = (el.getAttribute("aria-label") || el.getAttribute("title") || "").trim();
    if (!lbl) {
      if (!text) return;
      lbl = document.createElement("span"); lbl.className = "lbl"; lbl.setAttribute("aria-hidden", "true");
      el.appendChild(lbl);
    }
    if (text && el.dataset.navLbl !== "own") lbl.textContent = short(text);
  }
  /* Keep labels to a word or two. */
  function short(t) {
    var map = { "Leads, approved leads and contacts": "People", "Add customer": "Add", "Create lead": "New lead",
      "Open phone (small window, top-right)": "Phone" };
    return map[t] || t;
  }
  function all() {
    document.querySelectorAll(".nav > a, .nav > button, #phonePopBtn").forEach(function (el) {
      /* A page's own label (Customers' "Add customer") stays as written, shortened. */
      var own = el.querySelector(".lbl");
      if (own && !el.dataset.navLbl) { el.dataset.navLbl = "own"; own.textContent = short(own.textContent.trim()); }
      label(el);
    });
  }
  all();
  new MutationObserver(function (list) {
    list.forEach(function (m) { if (m.target.closest && m.target.closest(".nav")) label(m.target); });
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["aria-label"] });
})();
