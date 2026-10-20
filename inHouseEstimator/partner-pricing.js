/* Partner prices. Loaded on partner-estimate.html only, after pricing.js and before app.js,
   so the partner estimator shows these numbers and nothing in-house changes.
   - Everything 25% off (packages, per-sq-ft services, upholstery, add-ons, stairs).
   - Cleaning rates never go below 34 cents a square foot (Quick Dry Encapsulation lands on 34 cents).
   Partners only ever see the lower prices; there's no "discount" line. */
(function(){
  var P = window.KC_PRICING; if (!P) return;
  var OFF = 0.75;      /* 25% off */
  var FLOOR = 0.34;    /* lowest cleaning rate per sq ft */
  var cut = function(n){ return Math.round(n * OFF * 10000) / 10000; };
  var floored = function(n){ return Math.max(FLOOR, cut(n)); };
  var money = function(v){ return v % 1 === 0 ? String(v) : v.toFixed(2); };
  /* "$100 per flight" -> "$75 per flight" */
  var text = function(s){ return typeof s === 'string' ? s.replace(/\$(\d+(?:\.\d+)?)/g, function(m, n){ return '$' + money(cut(+n)); }) : s; };

  Object.keys(P.SERVICES).forEach(function(k){
    var s = P.SERVICES[k];
    if (s.tiers) Object.keys(s.tiers).forEach(function(t){ s.tiers[t].sqft = floored(s.tiers[t].sqft); });
    if (typeof s.rate === 'number') s.rate = s.mode === 'items' ? cut(s.rate) : floored(s.rate);
    Object.keys(s.addons || {}).forEach(function(a){
      var x = s.addons[a];
      if (typeof x.sqft === 'number') x.sqft = cut(x.sqft);
      if (typeof x.linear === 'number') x.linear = cut(x.linear);
      if (Array.isArray(x.sizes)) x.sizes.forEach(function(z){ z.price = cut(z.price); });
      x.text = text(x.text);
    });
  });
  P.ROOM_TYPES.forEach(function(r){ if (typeof r.flat === 'number') r.flat = cut(r.flat); });
})();
