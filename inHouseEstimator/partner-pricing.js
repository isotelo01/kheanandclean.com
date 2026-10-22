/* Partner prices, as an on/off switch: window.KC_partnerPrices(true / false).
   Loaded after pricing.js and before app.js, on:
   - partner-estimate.html (switched on for every partner estimate), and
   - the in-house estimator (index.html): the "Partner price" box in Discount switches it.
   Partner prices: everything 25% off (packages, per-sq-ft services, upholstery, add-ons, stairs),
   and cleaning rates never below 34 cents a square foot. The floor is only for this switch:
   the Discount box and the other discounts can still go lower. */
(function(){
  var P = window.KC_PRICING; if (!P) return;
  var OFF = 0.75;      /* 25% off */
  var FLOOR = 0.34;    /* lowest cleaning rate per sq ft, partner price only */
  var ORIGINAL = JSON.parse(JSON.stringify(P));   /* your regular prices, to switch back to */
  var cut = function(n){ return Math.round(n * OFF * 10000) / 10000; };
  var floored = function(n){ return Math.max(FLOOR, cut(n)); };
  var money = function(v){ return v % 1 === 0 ? String(v) : v.toFixed(2); };
  /* "$100 per flight" -> "$75 per flight" */
  var text = function(s){ return typeof s === 'string' ? s.replace(/\$(\d+(?:\.\d+)?)/g, function(m, n){ return '$' + money(cut(+n)); }) : s; };

  /* Writes the numbers in place (app.js holds these same objects). */
  window.KC_partnerPrices = function(on){
    on = !!on;
    Object.keys(P.SERVICES).forEach(function(k){
      var s = P.SERVICES[k], o = ORIGINAL.SERVICES[k];
      if (s.tiers) Object.keys(s.tiers).forEach(function(t){ s.tiers[t].sqft = on ? floored(o.tiers[t].sqft) : o.tiers[t].sqft; });
      if (typeof o.rate === 'number') s.rate = !on ? o.rate : (s.mode === 'items' ? cut(o.rate) : floored(o.rate));
      Object.keys(s.addons || {}).forEach(function(a){
        var x = s.addons[a], ox = o.addons[a];
        if (typeof ox.sqft === 'number') x.sqft = on ? cut(ox.sqft) : ox.sqft;
        if (typeof ox.linear === 'number') x.linear = on ? cut(ox.linear) : ox.linear;
        if (Array.isArray(ox.sizes)) x.sizes.forEach(function(z, i){ z.price = on ? cut(ox.sizes[i].price) : ox.sizes[i].price; });
        if ('text' in ox) x.text = on ? text(ox.text) : ox.text;
      });
    });
    P.ROOM_TYPES.forEach(function(r, i){ var or = ORIGINAL.ROOM_TYPES[i]; if (or && typeof or.flat === 'number') r.flat = on ? cut(or.flat) : or.flat; });
    window.KC_partnerOn = on;
  };
  /* New Settings prices arrived: pricing-live.js switches partner prices off, writes the new regular
     prices in, calls this to remember them, then switches partner prices back on if they were. */
  window.KC_partnerRebase = function(){ ORIGINAL = JSON.parse(JSON.stringify(P)); };
})();
