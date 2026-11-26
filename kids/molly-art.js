// Molly's Wonderland — original art (Molly the bunny, Pippi the chick, castle furniture)
(function () {
  const DRESS = {
    none: null,
    pink: { a: '#ff8fc8', b: '#ffd1ea' },
    purple: { a: '#b77dff', b: '#e6d1ff' },
    blue: { a: '#6fc3ff', b: '#d3eeff' },
    gold: { a: '#ffc94d', b: '#fff0c2' }
  };

  function molly(o) {
    o = o || {};
    const d = DRESS[o.dress || 'none'];
    let s = '<svg viewBox="-6 0 218 270" xmlns="http://www.w3.org/2000/svg">';
    // ears
    s += '<g stroke="#e9dfe6" stroke-width="2">' +
      '<ellipse cx="72" cy="52" rx="19" ry="48" fill="#fff" transform="rotate(-10 72 52)"/>' +
      '<ellipse cx="128" cy="52" rx="19" ry="48" fill="#fff" transform="rotate(10 128 52)"/></g>' +
      '<ellipse cx="72" cy="56" rx="9" ry="34" fill="#ffc2dc" transform="rotate(-10 72 56)"/>' +
      '<ellipse cx="128" cy="56" rx="9" ry="34" fill="#ffc2dc" transform="rotate(10 128 56)"/>';
    // body + feet
    s += '<ellipse cx="100" cy="212" rx="50" ry="44" fill="#fff" stroke="#e9dfe6" stroke-width="2"/>' +
      '<ellipse cx="76" cy="254" rx="20" ry="12" fill="#fff" stroke="#e9dfe6" stroke-width="2"/>' +
      '<ellipse cx="124" cy="254" rx="20" ry="12" fill="#fff" stroke="#e9dfe6" stroke-width="2"/>' +
      '<ellipse cx="76" cy="256" rx="8" ry="5" fill="#ffd6e7"/><ellipse cx="124" cy="256" rx="8" ry="5" fill="#ffd6e7"/>';
    // dress
    if (d) {
      s += '<path d="M66 180 Q100 168 134 180 L156 240 Q100 258 44 240 Z" fill="' + d.a + '"/>' +
        '<path d="M44 240 Q50 250 58 243 Q66 252 74 245 Q82 254 90 246 Q100 255 110 246 Q118 254 126 245 Q134 252 142 243 Q150 250 156 240 Q100 260 44 240Z" fill="' + d.b + '"/>' +
        '<path d="M58 222 Q100 234 142 222" stroke="#ffe27a" stroke-width="4" fill="none"/>' +
        '<g fill="#fff"><circle cx="78" cy="232" r="3"/><circle cx="100" cy="238" r="3"/><circle cx="122" cy="232" r="3"/><circle cx="90" cy="206" r="2.5"/><circle cx="112" cy="206" r="2.5"/></g>' +
        '<path d="M100 186 L84 176 L84 198 Z M100 186 L116 176 L116 198 Z" fill="' + d.b + '" stroke="' + d.a + '" stroke-width="2"/>' +
        '<circle cx="100" cy="187" r="6" fill="#ffe27a"/>';
    }
    // head
    s += '<ellipse cx="100" cy="128" rx="70" ry="60" fill="#fff" stroke="#e9dfe6" stroke-width="2"/>';
    // eyeshadow
    if (o.shadow) s += '<path d="M68 128 Q78 114 88 128" stroke="#c08bff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".75"/>' +
      '<path d="M112 128 Q122 114 132 128" stroke="#c08bff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".75"/>';
    // eyes
    s += '<circle cx="78" cy="134" r="8" fill="#2b1d22"/><circle cx="122" cy="134" r="8" fill="#2b1d22"/>' +
      '<circle cx="81" cy="131" r="2.8" fill="#fff"/><circle cx="125" cy="131" r="2.8" fill="#fff"/>';
    if (o.shadow) s += '<path d="M70 127 l-5 -4 M73 124 l-3 -5 M130 127 l5 -4 M127 124 l3 -5" stroke="#2b1d22" stroke-width="2" stroke-linecap="round"/>';
    // blush
    s += '<ellipse cx="62" cy="152" rx="12" ry="7" fill="#ff9cc4" opacity="' + (o.blush ? '.85' : '.35') + '"/>' +
      '<ellipse cx="138" cy="152" rx="12" ry="7" fill="#ff9cc4" opacity="' + (o.blush ? '.85' : '.35') + '"/>';
    // mouth
    if (o.gloss) s += '<path d="M90 150 Q100 166 110 150 Z" fill="#ff4f9a" stroke="#d6337a" stroke-width="1.5"/><ellipse cx="96" cy="153" rx="3" ry="1.5" fill="#fff" opacity=".8"/>';
    else s += '<path d="M92 150 Q96 155 100 150 Q104 155 108 150" stroke="#2b1d22" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
    // arms
    s += '<ellipse cx="52" cy="196" rx="13" ry="20" fill="#fff" stroke="#e9dfe6" stroke-width="2" transform="rotate(30 52 196)"/>' +
      '<ellipse cx="148" cy="196" rx="13" ry="20" fill="#fff" stroke="#e9dfe6" stroke-width="2" transform="rotate(-30 148 196)"/>';
    // necklace
    if (o.necklace) {
      s += '<g fill="#fffaf0" stroke="#e5d7b8" stroke-width="1">';
      for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.15 + 0.7 * i / 8); s += '<circle cx="' + (100 - Math.cos(a) * 30).toFixed(1) + '" cy="' + (176 + Math.sin(a) * 12).toFixed(1) + '" r="3.6"/>'; }
      s += '</g><path d="M100 190 l-6 -6 a4 4 0 0 1 6 -4 a4 4 0 0 1 6 4 z" fill="#ff4f9a"/>';
    }
    // wand
    if (o.wand) s += '<line x1="160" y1="208" x2="186" y2="150" stroke="#b77dff" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M188 120 l6 13 14 2 -10 10 3 14 -13 -7 -13 7 3 -14 -10 -10 14 -2z" fill="#ffe27a" stroke="#f5b400" stroke-width="2"/>' +
      '<circle cx="176" cy="116" r="3" fill="#fff"/><circle cx="200" cy="168" r="2.5" fill="#ffb3d9"/>';
    // crown
    if (o.crown) s += '<path d="M70 86 L74 52 L88 70 L100 44 L112 70 L126 52 L130 86 Z" fill="#ffd23f" stroke="#e0a800" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<circle cx="100" cy="72" r="6" fill="#ff4f9a"/><circle cx="82" cy="78" r="4" fill="#6fc3ff"/><circle cx="118" cy="78" r="4" fill="#b77dff"/>' +
      '<circle cx="74" cy="52" r="3.5" fill="#fff6c2"/><circle cx="100" cy="44" r="3.5" fill="#fff6c2"/><circle cx="126" cy="52" r="3.5" fill="#fff6c2"/>';
    // bow
    if (o.bow) s += '<g transform="translate(140 30) rotate(15)"><path d="M0 0 L-20 -12 L-20 12 Z M0 0 L20 -12 L20 12 Z" fill="#ff6fb1" stroke="#e0458f" stroke-width="2" stroke-linejoin="round"/><circle r="6" fill="#ffd23f"/></g>';
    // sparkles (glitter)
    if (o.glitter) s += '<g fill="#ffe27a"><path d="M30 90 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/><path d="M170 80 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z"/><path d="M40 230 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path d="M166 236 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/></g>';
    return s + '</svg>';
  }

  function pippi() {
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M50 22 Q44 8 38 12 M50 22 Q50 4 56 8 M50 22 Q58 10 64 16" stroke="#f5c400" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="50" cy="58" rx="36" ry="34" fill="#ffe14d" stroke="#f0c400" stroke-width="2"/>' +
      '<ellipse cx="17" cy="62" rx="8" ry="13" fill="#ffd21f" transform="rotate(25 17 62)"/>' +
      '<ellipse cx="83" cy="62" rx="8" ry="13" fill="#ffd21f" transform="rotate(-25 83 62)"/>' +
      '<circle cx="38" cy="52" r="5" fill="#2b1d22"/><circle cx="62" cy="52" r="5" fill="#2b1d22"/>' +
      '<circle cx="40" cy="50" r="1.6" fill="#fff"/><circle cx="64" cy="50" r="1.6" fill="#fff"/>' +
      '<path d="M44 60 L56 60 L50 68 Z" fill="#ff9a2e"/>' +
      '<ellipse cx="30" cy="65" rx="6" ry="3.5" fill="#ffa0c0" opacity=".7"/><ellipse cx="70" cy="65" rx="6" ry="3.5" fill="#ffa0c0" opacity=".7"/>' +
      '<path d="M40 91 l-4 6 M40 91 l0 7 M40 91 l4 6 M60 91 l-4 6 M60 91 l0 7 M60 91 l4 6" stroke="#ff9a2e" stroke-width="3" stroke-linecap="round"/></svg>';
  }

  const V = (b, inner) => '<svg viewBox="' + b + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  const PIECES = {
    pond: V('0 0 120 60', '<ellipse cx="60" cy="32" rx="58" ry="26" fill="#6fc3ff" stroke="#3fa0e0" stroke-width="3"/><ellipse cx="44" cy="26" rx="16" ry="5" fill="#bfe6ff"/><ellipse cx="84" cy="38" rx="10" ry="3" fill="#bfe6ff"/>'),
    fence: V('0 0 120 60', '<g fill="#e7b37a" stroke="#b97f45" stroke-width="2"><rect x="4" y="24" width="112" height="8"/><rect x="4" y="40" width="112" height="8"/><path d="M10 58V14l6-8 6 8v44z"/><path d="M40 58V14l6-8 6 8v44z"/><path d="M70 58V14l6-8 6 8v44z"/><path d="M100 58V14l6-8 6 8v44z"/></g>'),
    pinktree: V('0 0 100 120', '<rect x="44" y="70" width="12" height="46" rx="4" fill="#9b6a43"/><g fill="#ffb3d9"><circle cx="50" cy="40" r="30"/><circle cx="26" cy="58" r="20"/><circle cx="74" cy="58" r="20"/><circle cx="50" cy="66" r="20"/></g><g fill="#fff"><circle cx="40" cy="34" r="3"/><circle cx="62" cy="48" r="3"/><circle cx="30" cy="62" r="2.5"/><circle cx="70" cy="66" r="2.5"/></g>'),
    rainbow: V('0 0 140 74', '<g fill="none" stroke-width="8"><path d="M10 72a60 60 0 0 1 120 0" stroke="#ff5a5a"/><path d="M18 72a52 52 0 0 1 104 0" stroke="#ffa53b"/><path d="M26 72a44 44 0 0 1 88 0" stroke="#ffe14d"/><path d="M34 72a36 36 0 0 1 72 0" stroke="#6ad46a"/><path d="M42 72a28 28 0 0 1 56 0" stroke="#59b7ff"/><path d="M50 72a20 20 0 0 1 40 0" stroke="#b77dff"/></g>'),
    castle: V('0 0 120 120', '<g stroke="#c98bbd" stroke-width="2"><rect x="14" y="50" width="22" height="66" fill="#fff4fb"/><rect x="84" y="50" width="22" height="66" fill="#fff4fb"/><rect x="32" y="62" width="56" height="54" fill="#ffe9f6"/><rect x="48" y="34" width="24" height="40" fill="#fff4fb"/></g><path d="M10 52L25 22 40 52z M80 52L95 22 110 52z M44 36L60 4 76 36z" fill="#d65db1"/><path d="M50 116v-22a10 10 0 0 1 20 0v22z" fill="#a24bd1"/><path d="M60 92l-4-4a3 3 0 0 1 4-3 3 3 0 0 1 4 3z" fill="#ff4f9a"/><rect x="21" y="66" width="8" height="10" rx="4" fill="#ffd23f"/><rect x="91" y="66" width="8" height="10" rx="4" fill="#ffd23f"/><rect x="56" y="44" width="8" height="10" rx="4" fill="#ffd23f"/><path d="M60 4v-2l8 3-8 3" fill="#ff6fb1"/>'),
    throne: V('0 0 100 120', '<path d="M22 50V16q28-18 56 0v34z" fill="#b77dff" stroke="#ffd23f" stroke-width="4"/><path d="M50 8l4 8h-8z" fill="#ffd23f"/><rect x="16" y="50" width="68" height="22" rx="8" fill="#ff8fc8" stroke="#ffd23f" stroke-width="4"/><rect x="20" y="72" width="8" height="40" fill="#ffd23f"/><rect x="72" y="72" width="8" height="40" fill="#ffd23f"/><circle cx="50" cy="30" r="7" fill="#ff4f9a"/>'),
    chandelier: V('0 0 120 100', '<line x1="60" y1="0" x2="60" y2="26" stroke="#e0a800" stroke-width="3"/><path d="M14 46q46 30 92 0" fill="none" stroke="#ffd23f" stroke-width="6"/><ellipse cx="60" cy="34" rx="12" ry="8" fill="#ffd23f"/><g fill="#fff6c2" stroke="#e0a800"><rect x="10" y="30" width="8" height="16"/><rect x="36" y="46" width="8" height="16"/><rect x="56" y="50" width="8" height="16"/><rect x="76" y="46" width="8" height="16"/><rect x="102" y="30" width="8" height="16"/></g><g fill="#ffa53b"><ellipse cx="14" cy="26" rx="3" ry="5"/><ellipse cx="40" cy="42" rx="3" ry="5"/><ellipse cx="60" cy="46" rx="3" ry="5"/><ellipse cx="80" cy="42" rx="3" ry="5"/><ellipse cx="106" cy="26" rx="3" ry="5"/></g><g fill="#bfe6ff"><path d="M40 66l3 8-3 6-3-6z"/><path d="M60 70l3 8-3 6-3-6z"/><path d="M80 66l3 8-3 6-3-6z"/></g>'),
    bed: V('0 0 140 110', '<path d="M10 30q60-40 120 0" fill="#ffd1ea" stroke="#ff8fc8" stroke-width="3"/><path d="M14 30v60M126 30v60" stroke="#ffd23f" stroke-width="5"/><path d="M14 30q-6 30 10 50M126 30q6 30-10 50" fill="none" stroke="#ff8fc8" stroke-width="5"/><rect x="14" y="60" width="112" height="30" rx="8" fill="#fff" stroke="#e9c3d8" stroke-width="2"/><rect x="14" y="70" width="112" height="22" rx="6" fill="#b77dff"/><ellipse cx="40" cy="62" rx="16" ry="8" fill="#fff4fb" stroke="#e9c3d8"/><path d="M14 92v14M126 92v14" stroke="#ffd23f" stroke-width="6"/><path d="M70 8l-4-4a3 3 0 0 1 4-3 3 3 0 0 1 4 3z" fill="#ff4f9a"/>'),
    table: V('0 0 120 90', '<ellipse cx="60" cy="26" rx="54" ry="14" fill="#fff4fb" stroke="#ff8fc8" stroke-width="3"/><path d="M8 28q4 18 14 6 8 18 18 6 10 18 20 6 10 18 20 6 10 18 18-6 10 12 14-6" fill="#ffd1ea"/><rect x="54" y="38" width="12" height="44" fill="#ffd23f"/><ellipse cx="60" cy="84" rx="26" ry="5" fill="#ffd23f"/>'),
    stove: V('0 0 100 110', '<rect x="10" y="20" width="80" height="86" rx="6" fill="#fff" stroke="#bbb" stroke-width="3"/><rect x="10" y="20" width="80" height="18" rx="4" fill="#ffd1ea"/><g fill="#555"><circle cx="30" cy="20" r="7"/><circle cx="70" cy="20" r="7"/></g><g fill="#ff8fc8"><circle cx="25" cy="30" r="3"/><circle cx="40" cy="30" r="3"/><circle cx="60" cy="30" r="3"/><circle cx="75" cy="30" r="3"/></g><rect x="20" y="48" width="60" height="44" rx="4" fill="#333"/><rect x="26" y="54" width="48" height="30" rx="3" fill="#ffa53b" opacity=".6"/><rect x="30" y="44" width="40" height="4" rx="2" fill="#ccc"/>'),
    fridge: V('0 0 80 130', '<rect x="8" y="4" width="64" height="122" rx="10" fill="#bfe6ff" stroke="#6fc3ff" stroke-width="3"/><line x1="8" y1="46" x2="72" y2="46" stroke="#6fc3ff" stroke-width="3"/><rect x="58" y="16" width="5" height="20" rx="2" fill="#fff"/><rect x="58" y="58" width="5" height="30" rx="2" fill="#fff"/><path d="M26 24l-4-4a3 3 0 0 1 4-3 3 3 0 0 1 4 3z" fill="#ff4f9a"/><circle cx="34" cy="76" r="5" fill="#ffe14d"/><path d="M20 96l4-8 4 8z" fill="#b77dff"/>'),
    mirror: V('0 0 80 120', '<ellipse cx="40" cy="50" rx="32" ry="44" fill="#ffd23f"/><ellipse cx="40" cy="50" rx="25" ry="37" fill="#cfefff"/><path d="M26 30q6-10 14-12" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M40 6l-5-5a4 4 0 0 1 5-4 4 4 0 0 1 5 4z" fill="#ff4f9a"/><rect x="34" y="94" width="12" height="18" fill="#ffd23f"/><ellipse cx="40" cy="114" rx="20" ry="5" fill="#ffd23f"/>'),
    rug: V('0 0 140 60', '<ellipse cx="70" cy="30" rx="66" ry="26" fill="#b77dff"/><ellipse cx="70" cy="30" rx="54" ry="18" fill="#ffd1ea"/><path d="M70 22l-6-6a4 4 0 0 1 6-5 4 4 0 0 1 6 5z" fill="#ff4f9a"/>'),
    window: V('0 0 100 120', '<path d="M10 116V50a40 40 0 0 1 80 0v66z" fill="#8fd3ff" stroke="#ffd23f" stroke-width="5"/><path d="M50 12v104M10 66h80" stroke="#ffd23f" stroke-width="4"/><circle cx="72" cy="38" r="8" fill="#fff6c2"/><path d="M4 116h92" stroke="#ff8fc8" stroke-width="8" stroke-linecap="round"/>')
  };

  window.MollyArt = { molly, pippi, PIECES, DRESS };
})();
