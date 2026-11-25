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

  var TEMPLATES = [];
  Object.keys(RAW).forEach(function (d) {
    RAW[d].forEach(function (strokes) { TEMPLATES.push({ digit: +d, cloud: toCloud(strokes), raw: strokes }); });
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
    var c = toCloud(strokes), best = Infinity, digit = null;
    TEMPLATES.forEach(function (t) { var d = greedy(c, t.cloud); if (d < best) { best = d; digit = t.digit; } });
    return { digit: digit, score: best };
  }

  global.readDigit = readDigit;
  global._digitTemplates = TEMPLATES;
})(typeof window !== "undefined" ? window : globalThis);
