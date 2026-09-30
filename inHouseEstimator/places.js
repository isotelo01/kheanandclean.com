/* Address autocomplete (Google Places API New).
   Works on any street box whose id ends in "Addr" (eAddr, qAddr, the service
   pages' quick quote) and every input[data-f="street"] (customers), including
   rows added later. City/state/ZIP boxes are found by swapping "Addr" for
   "City"/"State"/"Zip" in the id. Picking a suggestion fills street, city,
   state and ZIP. Paste your Maps key below. */
(function () {
  var MAPS_KEY = "AIzaSyAYIvR0TpxuiC6ziPgH1PxfILMn97f5irs";
  var FIELDS = 'input[type="text"][id$="Addr"], input[data-f="street"]';
  if (!MAPS_KEY || MAPS_KEY.indexOf("PASTE") === 0) { console.warn("places.js: no Maps key set"); return; }

  /* Load Google only the first time a street field is used. */
  var loading = null;
  function loadGoogle() {
    if (loading) return loading;
    loading = new Promise(function (ok, fail) {
      window.__kcPlacesReady = ok;
      var s = document.createElement("script");
      s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(MAPS_KEY) +
              "&loading=async&libraries=places&callback=__kcPlacesReady";
      s.async = true;
      s.onerror = function () { loading = null; fail(new Error("Google Maps did not load")); };
      document.head.appendChild(s);
    }).then(function () { return google.maps.importLibrary("places"); });
    return loading;
  }

  /* Dropdown */
  var css = document.createElement("style");
  css.textContent =
    ".kcac{position:absolute;z-index:9999;background:#fff;border:1px solid #dde1e8;border-radius:8px;" +
    "box-shadow:0 6px 18px rgba(13,27,42,.18);margin:0;padding:4px 0;list-style:none;font:15px 'Archivo',system-ui,sans-serif;color:#1c2230;max-height:280px;overflow:auto}" +
    ".kcac li{padding:9px 12px;cursor:pointer;line-height:1.3}" +
    ".kcac li.on,.kcac li:hover{background:#f6efdc}" +
    ".kcac small{color:#5f6675}" +
    ".kcac .kcg{cursor:default;text-align:right;font-size:11px;color:#8a8f99;padding:4px 10px}" +
    ".kcac .kcg:hover{background:none}";
  document.head.appendChild(css);

  var list = document.createElement("ul");
  list.className = "kcac"; list.hidden = true;
  document.body.appendChild(list);

  var cur = null, items = [], active = -1, seq = 0, timer = null, token = null;

  function place(input) {
    var r = input.getBoundingClientRect();
    list.style.left = (r.left + window.scrollX) + "px";
    list.style.top = (r.bottom + window.scrollY + 4) + "px";
    list.style.width = r.width + "px";
  }
  function hide() { list.hidden = true; items = []; active = -1; }
  function mark(i) {
    active = i;
    [].forEach.call(list.querySelectorAll("li[data-i]"), function (li) {
      li.classList.toggle("on", +li.dataset.i === i);
    });
  }
  var esc = function (s) { return String(s || "").replace(/[&<>"]/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); };

  function show(input, sugg) {
    items = sugg; active = -1;
    if (!sugg.length) { hide(); return; }
    list.innerHTML = sugg.map(function (s, i) {
      var p = s.placePrediction;
      var main = p.mainText ? p.mainText.toString() : p.text.toString();
      var sub = p.secondaryText ? p.secondaryText.toString() : "";
      return '<li data-i="' + i + '">' + esc(main) + (sub ? '<br><small>' + esc(sub) + '</small>' : '') + '</li>';
    }).join("") + '<li class="kcg">Powered by Google</li>';
    place(input);
    list.hidden = false;
  }

  async function lookup(input) {
    var text = input.value.trim(), my = ++seq;
    if (text.length < 3) { hide(); return; }
    try {
      var lib = await loadGoogle();
      if (!token) token = new lib.AutocompleteSessionToken();
      var res = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: text,
        sessionToken: token,
        includedRegionCodes: ["us"],
        locationBias: { center: { lat: 38.678, lng: -121.176 }, radius: 50000 }  /* Folsom area */
      });
      if (my !== seq || input !== cur) return;          /* a newer keystroke won */
      show(input, (res.suggestions || []).filter(function (s) { return s.placePrediction; }));
    } catch (e) { console.error("places.js:", e); hide(); }
  }

  /* Put a value in a field and let the page's own listeners react. */
  function put(el, v) {
    if (!el || el.readOnly || v == null) return;
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function partner(input, f) {
    var box = input.closest(".addr");
    if (box) return box.querySelector('[data-f="' + f + '"]');
    var suffix = { city: "City", state: "State", zip: "Zip" }[f];
    return document.getElementById(input.id.replace(/Addr$/, suffix));
  }

  async function pick(i) {
    var s = items[i], input = cur;
    if (!s || !input) return;
    hide();
    try {
      var pl = s.placePrediction.toPlace();
      await pl.fetchFields({ fields: ["addressComponents"] });
      var get = function (type, short) {
        var c = (pl.addressComponents || []).find(function (c) { return c.types.indexOf(type) !== -1; });
        return c ? (short ? c.shortText : c.longText) : "";
      };
      var street = [get("street_number"), get("route", true)].filter(Boolean).join(" ");
      var unit = get("subpremise");
      if (unit) street += " #" + unit;
      if (!street) street = s.placePrediction.mainText ? s.placePrediction.mainText.toString() : input.value;
      put(input, street);
      put(partner(input, "city"), get("locality") || get("sublocality") || get("postal_town"));
      put(partner(input, "state"), get("administrative_area_level_1", true));
      put(partner(input, "zip"), get("postal_code"));
    } catch (e) {
      console.error("places.js:", e);
      put(input, s.placePrediction.text.toString());
    }
    token = null;   /* a pick ends the billing session */
  }

  /* Wire it up with delegation so rows added later work too. */
  document.addEventListener("input", function (e) {
    if (!e.isTrusted || !e.target.matches || !e.target.matches(FIELDS)) return;
    cur = e.target;
    clearTimeout(timer);
    timer = setTimeout(function () { lookup(cur); }, 200);
  });
  document.addEventListener("focusin", function (e) {
    if (e.target.matches && e.target.matches(FIELDS)) loadGoogle().catch(function () {});
  });
  document.addEventListener("focusout", function (e) {
    if (e.target === cur) setTimeout(hide, 150);
  });
  document.addEventListener("keydown", function (e) {
    if (list.hidden || e.target !== cur) return;
    if (e.key === "ArrowDown") { e.preventDefault(); mark(Math.min(active + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); mark(Math.max(active - 1, 0)); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(active); }
    else if (e.key === "Escape") hide();
  });
  /* pointerdown + preventDefault keeps the field from losing focus on a phone tap */
  list.addEventListener("pointerdown", function (e) {
    var li = e.target.closest("li[data-i]");
    if (!li) return;
    e.preventDefault();
    pick(+li.dataset.i);
  });
  window.addEventListener("resize", function () { if (!list.hidden && cur) place(cur); });
})();
