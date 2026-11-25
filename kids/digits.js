/* Finger-written digit reader for Unicorn Math.
   Uses the $P point-cloud recognizer (stroke order and direction don't matter).
   readDigit(strokes) -> { digit: 0-9, score } or null.  strokes = [[{x,y},...], ...] */
(function (global) {
  var N = 32;

  function arc(cx, cy, rx, ry, a0, a1) {
    var pts = [], steps = Math.max(8, Math.round(Math.abs(a1 - a0) / 12));
    for (var i = 0; i <= steps; i++) {
      var a = (a0 + (a1 - a0) * i / steps) * Math.PI / 180;
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    return pts;
  }
  function cat() { return [].concat.apply([], arguments); }

  // Templates drawn in a 100 x 100 box (y goes down). Several ways kids write each number.
  var RAW = {
    0: [[arc(50, 50, 30, 48, -90, 270)]],
    1: [[[[50, 0], [50, 100]]],
        [[[30, 18], [50, 0], [50, 100]]],
        [[[30, 18], [50, 0], [50, 100]], [[30, 100], [70, 100]]]],
    2: [[cat(arc(50, 28, 28, 28, 190, 400), [[20, 100], [82, 100]])]],
    3: [[cat(arc(48, 25, 27, 25, 200, 450), arc(48, 75, 30, 25, 270, 520))]],
    4: [[[[62, 0], [12, 66], [88, 66]], [[62, 25], [62, 100]]],
        [[[18, 0], [15, 60], [85, 60]], [[65, 15], [65, 100]]],
        [[[62, 100], [62, 0], [12, 66], [88, 66]]]],
    5: [[cat([[78, 0], [26, 0], [24, 48]], arc(46, 70, 30, 28, 245, 470))],
        [cat([[26, 0], [24, 48]], arc(46, 70, 30, 28, 245, 470)), [[26, 0], [78, 0]]]],
    6: [[cat([[68, 0], [45, 12], [28, 38], [22, 65]], arc(50, 72, 28, 26, 180, 540))]],
    7: [[[[15, 0], [85, 0], [40, 100]]],
        [[[15, 0], [85, 0], [40, 100]], [[35, 52], [75, 52]]]],
    8: [[cat(arc(50, 25, 22, 25, 90, -270), arc(50, 75, 26, 25, 270, 630))],
        [arc(50, 25, 22, 25, 0, 360), arc(50, 75, 26, 25, 0, 360)]],
    9: [[cat(arc(48, 28, 26, 28, 0, -360), [[74, 28], [72, 100]])],
        [arc(48, 28, 26, 28, 0, 360), [[74, 28], [72, 100]]]]
  };

  function toCloud(strokes) {
    var pts = [];
    strokes.forEach(function (s, id) {
      s.forEach(function (p) { pts.push({ x: p.x !== undefined ? p.x : p[0], y: p.y !== undefined ? p.y : p[1], id: id }); });
    });
    return normalize(resample(pts, N));
  }
  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
  function pathLen(pts) {
    var d = 0;
    for (var i = 1; i < pts.length; i++) if (pts[i].id === pts[i - 1].id) d += dist(pts[i - 1], pts[i]);
    return d;
  }
  function resample(pts, n) {
    var I = pathLen(pts) / (n - 1), D = 0, out = [pts[0]];
    pts = pts.slice();
    for (var i = 1; i < pts.length; i++) {
      if (pts[i].id === pts[i - 1].id) {
        var d = dist(pts[i - 1], pts[i]);
        if (D + d >= I && d > 0) {
          var t = (I - D) / d;
          var q = { x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y), id: pts[i].id };
          out.push(q); pts.splice(i, 0, q); D = 0;
        } else D += d;
      }
    }
    while (out.length < n) out.push(pts[pts.length - 1]);
    return out.slice(0, n);
  }
  function normalize(pts) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(function (p) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
    var s = Math.max(maxX - minX, maxY - minY) || 1, cx = 0, cy = 0;
    var out = pts.map(function (p) { return { x: (p.x - minX) / s, y: (p.y - minY) / s, id: p.id }; });
    out.forEach(function (p) { cx += p.x; cy += p.y; });
    cx /= out.length; cy /= out.length;
    return out.map(function (p) { return { x: p.x - cx, y: p.y - cy, id: p.id }; });
  }
  function cloudDist(a, b, start) {
    var matched = [], sum = 0, i = start, w;
    do {
      var best = Infinity, idx = -1;
      for (var j = 0; j < b.length; j++) if (!matched[j]) { var d = dist(a[i], b[j]); if (d < best) { best = d; idx = j; } }
      matched[idx] = true;
      w = 1 - ((i - start + a.length) % a.length) / a.length;
      sum += w * best;
      i = (i + 1) % a.length;
    } while (i !== start);
    return sum;
  }
  function greedy(a, b) {
    var step = Math.floor(Math.pow(a.length, 0.5)), min = Infinity;
    for (var i = 0; i < a.length; i += step) min = Math.min(min, cloudDist(a, b, i), cloudDist(b, a, i));
    return min;
  }

  // More ways little kids write numbers
  var MORE = {
    0: [[arc(50, 50, 45, 48, -90, 270)], [arc(50, 50, 22, 48, -90, 270)], [arc(50, 50, 32, 48, -60, 250)]],
    1: [[[[20, 30], [50, 0], [50, 100]]], [[[50, 0], [50, 100]], [[30, 18], [50, 0]]]],
    2: [[cat(arc(50, 30, 32, 30, 180, 360), [[82, 30], [20, 100], [85, 100]])],
        [cat(arc(50, 26, 26, 26, 200, 390), [[30, 92], [22, 100], [30, 104], [40, 96], [85, 100]])],
        [[[15, 5], [80, 5], [20, 100], [85, 100]]]],
    3: [[cat([[20, 0], [80, 0], [45, 42]], arc(48, 72, 30, 28, 250, 520))],
        [cat(arc(50, 25, 30, 25, 180, 450), arc(50, 75, 30, 25, 270, 540))],
        [arc(48, 25, 27, 25, 200, 450), arc(48, 75, 30, 25, 270, 520)]],
    4: [[[[60, 0], [10, 66], [88, 66]], [[62, 0], [62, 100]]],
        [[[20, 0], [15, 55], [80, 55]], [[70, 0], [70, 100]]],
        [[[20, 0], [20, 55], [80, 55], [80, 0], [80, 100]]]],
    5: [[cat([[75, 0], [28, 0], [24, 45]], arc(46, 72, 32, 28, 240, 480))],
        [cat([[24, 0], [24, 45]], arc(46, 72, 32, 28, 240, 480)), [[24, 0], [75, 0]]],
        [cat([[24, 45]], arc(46, 72, 32, 28, 240, 480)), [[24, 0], [24, 45]], [[24, 0], [75, 0]]]],
    6: [[cat([[70, 0], [40, 18], [25, 50]], arc(50, 75, 25, 25, 180, 540))],
        [cat([[60, 0], [30, 40], [25, 70]], arc(48, 78, 24, 22, 180, 540))]],
    7: [[cat([[15, 0], [85, 0]], [[70, 30], [52, 65], [45, 100]])],
        [[[15, 0], [85, 0]], [[85, 0], [40, 100]]]],
    8: [[cat(arc(50, 26, 26, 26, 90, -270), arc(50, 74, 26, 26, 270, 630))],
        [cat([[80, 10], [50, 0], [20, 20], [80, 80], [50, 100], [20, 80], [80, 20], [50, 0]])]],
    9: [[cat(arc(45, 28, 28, 28, 0, -360), [[73, 28], [73, 100]])],
        [cat(arc(45, 28, 28, 28, 0, -360), [[73, 28], [70, 75], [50, 100], [30, 95]])],
        [arc(45, 28, 28, 28, 0, 360), [[73, 10], [73, 100]]]]
  };
  Object.keys(MORE).forEach(function (d) { RAW[d] = RAW[d].concat(MORE[d]); });

  function mirror(strokes) { return strokes.map(function (s) { return s.map(function (p) { return [100 - p[0], p[1]]; }); }); }
  var TEMPLATES = [];
  Object.keys(RAW).forEach(function (d) {
    RAW[d].forEach(function (strokes) {
      TEMPLATES.push({ digit: +d, cloud: toCloud(strokes), raw: strokes });
      // kids often write these backwards; count a backwards one as that number
      if ("13467 9".indexOf(d) >= 0) TEMPLATES.push({ digit: +d, cloud: toCloud(mirror(strokes)), raw: mirror(strokes), mirrored: true });
    });
  });

  function readDigit(strokes) {
    var pts = 0;
    strokes.forEach(function (s) { pts += s.length; });
    if (!strokes.length || pts < 2) return null;
    // A short, skinny mark is a 1 (a tap or tiny dash shouldn't count as anything)
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokes.forEach(function (s) { s.forEach(function (p) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }); });
    var w = maxX - minX, h = maxY - minY;
    if (Math.max(w, h) < 12) return null;
    if (h > 0 && w / h < 0.22 && strokes.length === 1) return { digit: 1, score: 0 };
    var c = toCloud(strokes), best = Infinity, digit = null, byDigit = {};
    TEMPLATES.forEach(function (t) {
      var d = greedy(c, t.cloud);
      if (byDigit[t.digit] === undefined || d < byDigit[t.digit]) byDigit[t.digit] = d;
      if (d < best) { best = d; digit = t.digit; }
    });
    return { digit: digit, score: best, byDigit: byDigit };
  }

  // Split strokes into digits left to right: strokes whose left-right spans overlap belong together.
  function splitDigits(strokes) {
    var boxes = strokes.filter(function (s) { return s.length; }).map(function (s) {
      var a = Infinity, b = -Infinity;
      s.forEach(function (p) { a = Math.min(a, p.x); b = Math.max(b, p.x); });
      return { s: s, a: a, b: b };
    }).sort(function (x, y) { return x.a - y.a; });
    var groups = [];
    boxes.forEach(function (bx) {
      var g = groups[groups.length - 1];
      // same digit if this stroke mostly sits over the group (e.g. the stem of a 4, a 5's top bar)
      var over = g ? Math.min(g.b, bx.b) - Math.max(g.a, bx.a) : -1;
      var narrow = g ? Math.max(4, Math.min(g.b - g.a, bx.b - bx.a)) : 1;
      if (g && over >= -2 && over / narrow > 0.35) { g.strokes.push(bx.s); g.b = Math.max(g.b, bx.b); }
      else groups.push({ strokes: [bx.s], a: bx.a, b: bx.b });
    });
    // A short piece (a 1's flag or base, a 7's cross line) isn't a number by itself:
    // join it to the closest neighbor.
    function height(g) {
      var a = Infinity, b = -Infinity;
      g.strokes.forEach(function (s) { s.forEach(function (p) { a = Math.min(a, p.y); b = Math.max(b, p.y); }); });
      return b - a;
    }
    var changed = true;
    while (changed && groups.length > 1) {
      changed = false;
      var maxH = Math.max.apply(null, groups.map(height));
      for (var i = 0; i < groups.length; i++) {
        if (height(groups[i]) >= 0.45 * maxH) continue;
        var L = groups[i - 1], R = groups[i + 1];
        var gapL = L ? groups[i].a - L.b : Infinity, gapR = R ? R.a - groups[i].b : Infinity;
        var j = gapL <= gapR ? i - 1 : i + 1, t = groups[j];
        t.strokes = t.strokes.concat(groups[i].strokes);
        t.a = Math.min(t.a, groups[i].a); t.b = Math.max(t.b, groups[i].b);
        groups.splice(i, 1);
        changed = true;
        break;
      }
    }
    return groups.map(function (g) { return g.strokes; });
  }

  // Read a whole written number. If the expected answer's digit is almost as good a match
  // as the best guess, go with it (kids' handwriting is wobbly; this saves false "try again"s).
  function readNumber(strokes, expected) {
    var groups = splitDigits(strokes), out = "", exp = expected === undefined ? null : String(expected);
    for (var i = 0; i < groups.length; i++) {
      var r = readDigit(groups[i]);
      if (!r) continue;
      var d = r.digit;
      if (exp && exp.length === groups.length && r.byDigit) {
        var want = +exp[i], ws = r.byDigit[want];
        if (ws !== undefined && ws <= r.score * 1.25 + 0.05) d = want;
      }
      out += d;
    }
    return out === "" ? null : +out;
  }

  global.readDigit = readDigit;
  global.readNumber = readNumber;
  global._digitTemplates = TEMPLATES;
})(typeof window !== "undefined" ? window : globalThis);
