/* Live prices: the prices saved on the Settings page (Firestore settings/pricing) are the real ones.
   pricing.js (and the homepage's own copy) only hold the starting prices; this lays the Settings
   prices over them, in place, so every page that prices a job uses the same numbers.

   Load it right after pricing.js (and before partner-pricing.js / app.js). It gives:
   - KC_applyPrices(base, saved): writes saved prices INTO base = {ROOM_TYPES, SERVICES}; returns minJob.
   - KC_LIVE: the Settings prices this device saw last (used right away), then the fresh ones.
   - KC_MINJOB: the minimum charge from Settings (null until known).
   - KC_PRICING_READY: a promise, done once fresh prices are in (or after 3 s, or offline).
   - a "kc:prices" event on window when fresh prices differ from what the page started with.
   - any element with data-kcp="minJob" / "from.carpet" / "services.tile.rate" /
     "services.carpet.tiers.deep.price" / "services.carpet.addons.hair.price" ... gets that price
     ("$0.50"; add data-kcp-plain for just "0.50" when the page prints the "$" itself). */
(function(){
  var URL = "https://firestore.googleapis.com/v1/projects/khean-estimator-78f3e/databases/(default)/documents/settings/pricing";
  var CACHE = "kcPricesLive";
  var ok = function(v){ return typeof v === "number" && isFinite(v) && v >= 0; };
  var money = function(n){ return n % 1 === 0 ? String(n) : n.toFixed(2); };
  /* "$100 per flight" -> "$90 per flight"; "$50 / $75 per rug" takes two prices in order. */
  var retext = function(t, ps){ var i = 0;
    return typeof t !== "string" ? t : t.replace(/\$\d+(?:\.\d+)?/g, function(m){ var p = ps[i++]; return ok(p) ? "$" + money(p) : m; }); };

  /* Firestore's REST answer -> plain values. */
  function plain(v){
    if (!v) return null;
    if ("mapValue" in v) { var o = {}, f = v.mapValue.fields || {}; for (var k in f) o[k] = plain(f[k]); return o; }
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(plain);
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return Number(v.doubleValue);
    if ("booleanValue" in v) return !!v.booleanValue;
    if ("stringValue" in v) return v.stringValue;
    return null;
  }

  function apply(base, s){
    if (!base || !s) return null;
    var R = base.ROOM_TYPES, S = base.SERVICES || {};
    /* Rooms: the Settings list (hidden ones left out) in place of the regular rooms.
       Flight of Stairs and Additional Square Feet stay in code, always last. */
    if (R && Array.isArray(s.rooms)) {
      var had = {}, keep = [];
      R.forEach(function(r){ had[r.key] = r; if (r.key === "stairs" || r.key === "addSqft") keep.push(r); });
      var rooms = s.rooms.filter(function(r){ return r && !r.hidden && r.name && ok(r.sqft); }).map(function(r){
        var was = had[r.key] || {};
        return { key: r.key, name: r.name, sqft: r.sqft, dims: r.dims != null && r.dims !== "" ? r.dims : (was.dims || "") };
      });
      if (rooms.length) { R.length = 0; rooms.concat(keep).forEach(function(r){ R.push(r); }); }
    }
    /* One stairs price for every service and the room picker. */
    if (ok(s.stairs)) {
      if (R) R.forEach(function(r){ if (r.key === "stairs") r.flat = s.stairs; });
      Object.keys(S).forEach(function(k){ var a = S[k].addons && S[k].addons.stairs;
        if (a) { a.linear = s.stairs; if (a.text) a.text = retext(a.text, [s.stairs]); } });
    }
    Object.keys(S).forEach(function(k){
      var b = S[k], o = (s.services || {})[k]; if (!o) return;
      if (ok(o.rate) && typeof b.rate === "number") b.rate = o.rate;
      if (o.tiers && b.tiers) Object.keys(b.tiers).forEach(function(t){
        var v = o.tiers[t]; if (v && ok(v.price)) b.tiers[t].sqft = v.price; });
      if (o.addons && b.addons) Object.keys(b.addons).forEach(function(a){
        if (a === "stairs") return;
        var v = o.addons[a], d = b.addons[a]; if (!v) return;
        if (d.sizes && v.sizes) {
          var ps = d.sizes.map(function(z){ if (ok(v.sizes[z.key])) z.price = v.sizes[z.key]; return z.price; });
          if (d.text) d.text = retext(d.text, ps);
        } else if (ok(v.price)) {
          if (typeof d.sqft === "number") d.sqft = v.price;
          else if (typeof d.linear === "number") d.linear = v.price;
          else if (typeof d.flat === "number") d.flat = v.price;
          if (d.text) d.text = retext(d.text, [v.price]);
        }
      });
      if (Array.isArray(o.items) && Array.isArray(b.items)) {
        var items = o.items.filter(function(i){ return i && !i.hidden && i.name && ok(i.ft); })
          .map(function(i){ return { key: i.key, name: i.name, ft: i.ft }; });
        if (items.length) { b.items.length = 0; items.forEach(function(i){ b.items.push(i); }); }
      }
    });
    return ok(s.minJob) ? s.minJob : null;
  }
  window.KC_applyPrices = apply;

  /* Price text on pages: data-kcp="path into the Settings prices". "from.carpet" = cheapest package shown. */
  function look(s, path){
    if (path.indexOf("from.") === 0) {
      var t = (((s.services || {})[path.slice(5)]) || {}).tiers || {}, min = null;
      Object.keys(t).forEach(function(k){ var v = t[k]; if (v && !v.hidden && ok(v.price) && (min == null || v.price < min)) min = v.price; });
      return min;
    }
    var o = s; path.split(".").forEach(function(k){ o = o == null ? null : o[k]; });
    return o;
  }
  function fill(){
    var s = window.KC_LIVE; if (!s || !document.querySelectorAll) return;
    var els = document.querySelectorAll("[data-kcp]");
    for (var i = 0; i < els.length; i++) {
      var v = look(s, els[i].getAttribute("data-kcp"));
      /* data-kcp-plain: just the number, when the page prints the "$" in its own span */
      if (ok(v)) els[i].textContent = (els[i].hasAttribute("data-kcp-plain") ? "" : "$") + (v < 10 ? v.toFixed(2) : money(v));
    }
  }
  window.KC_fillPrices = fill;

  /* This device's last copy, right away (no waiting on the network). */
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE) || "null"); } catch (e) {}
  window.KC_LIVE = cached;
  window.KC_MINJOB = null;
  if (cached) {
    var m0 = window.KC_PRICING ? apply(window.KC_PRICING, cached) : (ok(cached.minJob) ? cached.minJob : null);
    window.KC_MINJOB = m0;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill); else fill();

  /* Then the current Settings prices. */
  var done;
  window.KC_PRICING_READY = new Promise(function(r){ done = r; });
  setTimeout(function(){ done(); }, 3000);
  if (typeof fetch !== "function" || (navigator && navigator.onLine === false)) { done(); return; }
  fetch(URL, { cache: "no-store" }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
    var s = j && j.fields ? plain({ mapValue: { fields: j.fields } }) : null;
    if (!s) return;
    delete s.updatedAt;
    var same = JSON.stringify(s) === JSON.stringify(cached);
    try { localStorage.setItem(CACHE, JSON.stringify(s)); } catch (e) {}
    window.KC_LIVE = s;
    if (same) return;
    if (window.KC_PRICING) {
      /* Partner prices (partner-pricing.js) follow the new regular prices: off, write, remember, back on. */
      var partner = !!window.KC_partnerOn && !!window.KC_partnerPrices;
      if (partner) window.KC_partnerPrices(false);
      window.KC_MINJOB = apply(window.KC_PRICING, s);
      if (window.KC_partnerRebase) window.KC_partnerRebase();
      if (partner) window.KC_partnerPrices(true);
    } else window.KC_MINJOB = ok(s.minJob) ? s.minJob : null;
    fill();
    try { window.dispatchEvent(new CustomEvent("kc:prices", { detail: { prices: s, minJob: window.KC_MINJOB } })); } catch (e) {}
  }).catch(function(){}).then(function(){ done(); });
})();
