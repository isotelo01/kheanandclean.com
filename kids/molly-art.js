// Molly's Wonderland — original art (Molly the bunny, Pippi the chick, castle furniture)
(function () {
  const DRESS = {
    none: null,
    pink: { a: '#ff8fc8', b: '#ffd1ea' },
    purple: { a: '#b77dff', b: '#e6d1ff' },
    blue: { a: '#6fc3ff', b: '#d3eeff' },
    gold: { a: '#ffc94d', b: '#fff0c2' }
  };

  const SHOE = { pink: '#ff6fb1', purple: '#a24bd1', blue: '#3fa0e0', gold: '#ffc21a', red: '#e8344e' };
  function shoe(x, y, rx, ry, c) {
    return '<g><ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + c + '" stroke="#fff" stroke-width="1.5"/>' +
      '<ellipse cx="' + (x - rx * .3) + '" cy="' + (y - ry * .35) + '" rx="' + rx * .3 + '" ry="' + ry * .25 + '" fill="#fff" opacity=".55"/>' +
      '<path d="M' + x + ' ' + (y - ry * .2) + ' l-' + ry * .45 + ' -' + ry * .45 + ' a' + ry * .3 + ' ' + ry * .3 + ' 0 0 1 ' + ry * .45 + ' -' + ry * .2 + ' a' + ry * .3 + ' ' + ry * .3 + ' 0 0 1 ' + ry * .45 + ' ' + ry * .2 + 'z" fill="#fff"/></g>';
  }
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
    if (o.lashes) s += '<path d="M71 129 q-5 -2 -8 -8 M74 127 q-3 -3 -3 -10 M78.5 126 q0 -5 3 -10 M129 129 q5 -2 8 -8 M126 127 q3 -3 3 -10 M121.5 126 q0 -5 -3 -10" stroke="#2b1d22" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
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
    if (o.shoes && SHOE[o.shoes]) s += shoe(76, 254, 22, 13, SHOE[o.shoes]) + shoe(124, 254, 22, 13, SHOE[o.shoes]);
    // sparkles (glitter)
    if (o.glitter) s += '<g fill="#ffe27a"><path d="M30 90 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/><path d="M170 80 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z"/><path d="M40 230 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path d="M166 236 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/></g>';
    return s + '</svg>';
  }

  function pippi(o) {
    o = o || {};
    const d = DRESS[o.dress || 'none'];
    let s = '<svg viewBox="-12 -16 124 118" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M50 22 Q44 8 38 12 M50 22 Q50 4 56 8 M50 22 Q58 10 64 16" stroke="#f5c400" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="50" cy="58" rx="36" ry="34" fill="#ffe14d" stroke="#f0c400" stroke-width="2"/>';
    if (d) s += '<path d="M24 74 Q50 66 76 74 L86 90 Q50 100 14 90 Z" fill="' + d.a + '"/>' +
      '<path d="M14 90 Q20 97 26 91 Q32 98 38 92 Q44 99 50 92 Q56 99 62 92 Q68 98 74 91 Q80 97 86 90 Q50 101 14 90Z" fill="' + d.b + '"/>' +
      '<g fill="#fff"><circle cx="34" cy="84" r="2"/><circle cx="50" cy="87" r="2"/><circle cx="66" cy="84" r="2"/></g>' +
      '<path d="M50 74 l-8 -5 v10z M50 74 l8 -5 v10z" fill="' + d.b + '" stroke="' + d.a + '" stroke-width="1.5"/><circle cx="50" cy="74" r="3" fill="#ffe27a"/>';
    s += '<ellipse cx="17" cy="62" rx="8" ry="13" fill="#ffd21f" transform="rotate(25 17 62)"/>' +
      '<ellipse cx="83" cy="62" rx="8" ry="13" fill="#ffd21f" transform="rotate(-25 83 62)"/>';
    if (o.shadow) s += '<path d="M31 48 Q38 40 45 48 M55 48 Q62 40 69 48" stroke="#c08bff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>';
    s += '<circle cx="38" cy="52" r="5" fill="#2b1d22"/><circle cx="62" cy="52" r="5" fill="#2b1d22"/>' +
      '<circle cx="40" cy="50" r="1.6" fill="#fff"/><circle cx="64" cy="50" r="1.6" fill="#fff"/>';
    if (o.lashes) s += '<path d="M33.5 49 q-3 -1 -5.5 -5 M35.5 47.5 q-2 -2 -2 -6.5 M38.5 47 q0 -3 2 -6.5 M66.5 49 q3 -1 5.5 -5 M64.5 47.5 q2 -2 2 -6.5 M61.5 47 q0 -3 -2 -6.5" stroke="#2b1d22" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
    if (o.glasses) s += '<g stroke="#d65db1" stroke-width="2.5" fill="#ffd1ea" fill-opacity=".45"><path d="M38 44l2.5 5 5.5 .8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z"/><path d="M62 44l2.5 5 5.5 .8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z"/></g><path d="M45 52h10" stroke="#d65db1" stroke-width="2.5"/>';
    s += '<path d="M44 60 L56 60 L50 68 Z" fill="' + (o.gloss ? '#ff4f9a' : '#ff9a2e') + '"/>' +
      (o.gloss ? '<ellipse cx="48" cy="61.5" rx="2" ry="1" fill="#fff" opacity=".8"/>' : '') +
      '<ellipse cx="30" cy="65" rx="6" ry="3.5" fill="#ff8fb8" opacity="' + (o.blush ? '.9' : '.6') + '"/><ellipse cx="70" cy="65" rx="6" ry="3.5" fill="#ff8fb8" opacity="' + (o.blush ? '.9' : '.6') + '"/>' +
      '<path d="M40 91 l-4 6 M40 91 l0 7 M40 91 l4 6 M60 91 l-4 6 M60 91 l0 7 M60 91 l4 6" stroke="#ff9a2e" stroke-width="3" stroke-linecap="round"/>';
    if (o.shoes && SHOE[o.shoes]) s += shoe(40, 96, 9, 5.5, SHOE[o.shoes]) + shoe(60, 96, 9, 5.5, SHOE[o.shoes]);
    if (o.necklace) {
      s += '<g fill="#fffaf0" stroke="#e5d7b8" stroke-width=".8">';
      for (let i = 0; i <= 6; i++) { const a = Math.PI * (0.2 + 0.6 * i / 6); s += '<circle cx="' + (50 - Math.cos(a) * 16).toFixed(1) + '" cy="' + (68 + Math.sin(a) * 6).toFixed(1) + '" r="2.4"/>'; }
      s += '</g>';
    }
    if (o.wand) s += '<line x1="88" y1="70" x2="102" y2="40" stroke="#b77dff" stroke-width="4" stroke-linecap="round"/><path d="M103 26 l3.5 7.5 8 1 -6 5.6 1.7 8 -7.2 -4 -7.2 4 1.7 -8 -6 -5.6 8 -1z" fill="#ffe27a" stroke="#f5b400" stroke-width="1.5"/>';
    if (o.flower) s += '<g transform="translate(66 22)"><g fill="#ff8fc8"><circle cx="0" cy="-6" r="5"/><circle cx="6" cy="0" r="5"/><circle cx="0" cy="6" r="5"/><circle cx="-6" cy="0" r="5"/></g><circle r="4" fill="#ffe27a"/></g>';
    if (o.crown) s += '<path d="M33 26 L35 6 L43 16 L50 0 L57 16 L65 6 L67 26 Z" fill="#ffd23f" stroke="#e0a800" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="18" r="3.5" fill="#ff4f9a"/><circle cx="40" cy="21" r="2.4" fill="#6fc3ff"/><circle cx="60" cy="21" r="2.4" fill="#b77dff"/>';
    if (o.bow) s += '<g transform="translate(30 24) rotate(-15)"><path d="M0 0 L-11 -7 L-11 7 Z M0 0 L11 -7 L11 7 Z" fill="#ff6fb1" stroke="#e0458f" stroke-width="1.5" stroke-linejoin="round"/><circle r="3.5" fill="#ffd23f"/></g>';
    if (o.glitter) s += '<g fill="#ffe27a"><path d="M2 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path d="M96 80 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2z"/><path d="M8 88 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z"/></g>';
    return s + '</svg>';
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
    kitten: V('0 0 100 100', '<path d="M22 40 L18 10 L42 26 Z M78 40 L82 10 L58 26 Z" fill="#ffb86b" stroke="#e08a3a" stroke-width="2" stroke-linejoin="round"/><path d="M24 30 L22 16 L34 25 Z M76 30 L78 16 L66 25 Z" fill="#ffc2dc"/><ellipse cx="50" cy="52" rx="34" ry="28" fill="#ffb86b" stroke="#e08a3a" stroke-width="2"/><ellipse cx="50" cy="86" rx="22" ry="13" fill="#ffb86b" stroke="#e08a3a" stroke-width="2"/><path d="M40 30 l3 8 M50 27 v9 M60 30 l-3 8" stroke="#e08a3a" stroke-width="3" stroke-linecap="round"/><circle cx="38" cy="52" r="4.5" fill="#2b1d22"/><circle cx="62" cy="52" r="4.5" fill="#2b1d22"/><circle cx="39.5" cy="50.5" r="1.4" fill="#fff"/><circle cx="63.5" cy="50.5" r="1.4" fill="#fff"/><path d="M47 60 h6 l-3 3z" fill="#ff6fb1"/><path d="M44 65 q3 3 6 0 q3 3 6 0" stroke="#2b1d22" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M20 58 h-12 M20 63 l-11 3 M80 58 h12 M80 63 l11 3" stroke="#e08a3a" stroke-width="1.5"/><ellipse cx="30" cy="62" rx="5" ry="3" fill="#ff8fb8" opacity=".6"/><ellipse cx="70" cy="62" rx="5" ry="3" fill="#ff8fb8" opacity=".6"/>'),
    puppy: V('0 0 100 100', '<ellipse cx="50" cy="86" rx="24" ry="13" fill="#fff" stroke="#d9c8b8" stroke-width="2"/><ellipse cx="50" cy="50" rx="32" ry="30" fill="#fff" stroke="#d9c8b8" stroke-width="2"/><ellipse cx="18" cy="48" rx="11" ry="22" fill="#a8744f" transform="rotate(15 18 48)"/><ellipse cx="82" cy="48" rx="11" ry="22" fill="#a8744f" transform="rotate(-15 82 48)"/><ellipse cx="64" cy="44" rx="10" ry="9" fill="#e8c9a8"/><circle cx="38" cy="46" r="4.5" fill="#2b1d22"/><circle cx="62" cy="46" r="4.5" fill="#2b1d22"/><circle cx="39.5" cy="44.5" r="1.4" fill="#fff"/><circle cx="63.5" cy="44.5" r="1.4" fill="#fff"/><ellipse cx="50" cy="58" rx="6" ry="4.5" fill="#2b1d22"/><path d="M44 64 q6 5 12 0" stroke="#2b1d22" stroke-width="2" fill="none"/><path d="M48 66 q2 8 6 0z" fill="#ff6fa0"/><ellipse cx="30" cy="58" rx="5" ry="3" fill="#ff8fb8" opacity=".6"/><ellipse cx="70" cy="58" rx="5" ry="3" fill="#ff8fb8" opacity=".6"/>'),
    duckling: V('0 0 100 90', '<ellipse cx="54" cy="62" rx="36" ry="24" fill="#fff6a8" stroke="#f0d000" stroke-width="2"/><path d="M80 52 q16 -6 12 8 q-6 4 -12 2z" fill="#fff6a8" stroke="#f0d000" stroke-width="2"/><circle cx="34" cy="34" r="20" fill="#fff6a8" stroke="#f0d000" stroke-width="2"/><path d="M8 36 q-4 6 6 8 h8 l-2 -10z" fill="#ff9a2e"/><circle cx="32" cy="30" r="4" fill="#2b1d22"/><circle cx="33.3" cy="28.7" r="1.2" fill="#fff"/><ellipse cx="40" cy="40" rx="4" ry="2.5" fill="#ff8fb8" opacity=".6"/><path d="M50 62 q12 10 22 -2" stroke="#f0d000" stroke-width="3" fill="none" stroke-linecap="round"/>'),
    butterfly: V('0 0 100 80', '<g stroke="#b77dff" stroke-width="2"><ellipse cx="30" cy="28" rx="22" ry="20" fill="#ffb3d9"/><ellipse cx="70" cy="28" rx="22" ry="20" fill="#ffb3d9"/><ellipse cx="32" cy="58" rx="16" ry="14" fill="#c9a8ff"/><ellipse cx="68" cy="58" rx="16" ry="14" fill="#c9a8ff"/></g><g fill="#fff"><circle cx="28" cy="26" r="6"/><circle cx="72" cy="26" r="6"/><circle cx="32" cy="58" r="4"/><circle cx="68" cy="58" r="4"/></g><ellipse cx="50" cy="44" rx="5" ry="26" fill="#6b3fa0"/><path d="M48 20 q-6 -14 -12 -16 M52 20 q6 -14 12 -16" stroke="#6b3fa0" stroke-width="2" fill="none"/><circle cx="36" cy="4" r="3" fill="#6b3fa0"/><circle cx="64" cy="4" r="3" fill="#6b3fa0"/>'),
    daisy: V('0 0 60 100', '<path d="M30 50 V98" stroke="#4caf50" stroke-width="4"/><path d="M30 78 q-16 -4 -18 -16 q14 0 18 16z M30 86 q16 -4 18 -16 q-14 0 -18 16z" fill="#6ad46a"/><g fill="#fff" stroke="#f2c6dc" stroke-width="1.5"><ellipse cx="30" cy="14" rx="7" ry="12"/><ellipse cx="30" cy="46" rx="7" ry="12"/><ellipse cx="14" cy="30" rx="12" ry="7"/><ellipse cx="46" cy="30" rx="12" ry="7"/><ellipse cx="19" cy="19" rx="7" ry="11" transform="rotate(-45 19 19)"/><ellipse cx="41" cy="19" rx="7" ry="11" transform="rotate(45 41 19)"/><ellipse cx="19" cy="41" rx="7" ry="11" transform="rotate(45 19 41)"/><ellipse cx="41" cy="41" rx="7" ry="11" transform="rotate(-45 41 41)"/></g><circle cx="30" cy="30" r="9" fill="#ffd23f"/><circle cx="27" cy="29" r="1.4" fill="#2b1d22"/><circle cx="33" cy="29" r="1.4" fill="#2b1d22"/><path d="M27 33 q3 2.5 6 0" stroke="#2b1d22" stroke-width="1.2" fill="none"/>'),
    cupcake: V('0 0 80 100', '<path d="M14 54 L22 96 H58 L66 54 Z" fill="#6fc3ff" stroke="#3fa0e0" stroke-width="2"/><path d="M26 56 l3 38 M40 56 v38 M54 56 l-3 38" stroke="#3fa0e0" stroke-width="2"/><path d="M8 56 q-2 -18 16 -20 q2 -18 16 -18 q14 0 16 18 q18 2 16 20 z" fill="#ffb3d9" stroke="#ff8fc8" stroke-width="2"/><circle cx="40" cy="12" r="8" fill="#ff4f6a"/><path d="M40 4 q4 -6 8 -4" stroke="#4caf50" stroke-width="2" fill="none"/><g fill="#fff"><rect x="22" y="44" width="5" height="2" rx="1" transform="rotate(30 24 45)"/><rect x="50" y="40" width="5" height="2" rx="1" transform="rotate(-30 52 41)"/><rect x="36" y="30" width="5" height="2" rx="1"/></g><circle cx="32" cy="74" r="2.5" fill="#2b1d22"/><circle cx="48" cy="74" r="2.5" fill="#2b1d22"/><path d="M36 80 q4 4 8 0" stroke="#2b1d22" stroke-width="2" fill="none"/>'),
    teddy: V('0 0 100 100', '<circle cx="24" cy="22" r="12" fill="#c98a5a"/><circle cx="76" cy="22" r="12" fill="#c98a5a"/><circle cx="24" cy="22" r="6" fill="#ffc2dc"/><circle cx="76" cy="22" r="6" fill="#ffc2dc"/><ellipse cx="50" cy="80" rx="30" ry="20" fill="#c98a5a"/><circle cx="50" cy="42" r="28" fill="#c98a5a"/><ellipse cx="50" cy="52" rx="12" ry="9" fill="#f0d2b4"/><circle cx="40" cy="38" r="4" fill="#2b1d22"/><circle cx="60" cy="38" r="4" fill="#2b1d22"/><ellipse cx="50" cy="48" rx="4" ry="3" fill="#2b1d22"/><path d="M46 55 q4 3 8 0" stroke="#2b1d22" stroke-width="2" fill="none"/><path d="M50 72 l-8 -5 v10z M50 72 l8 -5 v10z" fill="#ff6fb1"/><circle cx="50" cy="72" r="3" fill="#ffd23f"/>'),
    stairs: V('0 0 240 170', '<g fill="#fff4fb" stroke="#e6b8e0" stroke-width="2"><rect x="80" y="20" width="80" height="20"/><rect x="74" y="40" width="92" height="16"/><rect x="66" y="56" width="108" height="16"/><rect x="58" y="72" width="124" height="16"/><rect x="48" y="88" width="144" height="16"/><rect x="38" y="104" width="164" height="16"/><rect x="26" y="120" width="188" height="16"/><rect x="14" y="136" width="212" height="18"/><rect x="0" y="154" width="240" height="14"/></g><g fill="#d65db1"><rect x="80" y="20" width="80" height="6"/><path d="M84 40h72v4H84zM76 56h88v4H76zM68 72h104v4H68zM60 88h120v4H60zM50 104h140v4H50zM40 120h160v4H40zM28 136h184v4H28zM16 154h208v4H16z" opacity=".35"/></g><g stroke="#ffd23f" stroke-width="5" fill="none" stroke-linecap="round"><path d="M80 20 L8 154"/><path d="M160 20 L232 154"/><path d="M80 2 v18 M160 2 v18"/></g><g stroke="#ffd23f" stroke-width="2.5"><path d="M70 39v-18 M58 61v-18 M46 84v-18 M34 106v-18 M22 129v-18 M170 39v-18 M182 61v-18 M194 84v-18 M206 106v-18 M218 129v-18"/></g><circle cx="8" cy="150" r="6" fill="#ffd23f"/><circle cx="232" cy="150" r="6" fill="#ffd23f"/><path d="M80 2h80" stroke="#ffd23f" stroke-width="5"/><path d="M120 6l-5-5a3.5 3.5 0 0 1 5-3 3.5 3.5 0 0 1 5 3z" fill="#ff4f9a"/>'),
    door: V('0 0 100 140', '<path d="M8 138V50a42 42 0 0 1 84 0v88z" fill="#ffd23f"/><path d="M16 138V52a34 34 0 0 1 68 0v86z" fill="#c77dff"/><path d="M50 18v120" stroke="#ffd23f" stroke-width="4"/><g fill="#a24bd1"><rect x="22" y="62" width="22" height="30" rx="4"/><rect x="56" y="62" width="22" height="30" rx="4"/><rect x="22" y="100" width="22" height="30" rx="4"/><rect x="56" y="100" width="22" height="30" rx="4"/></g><circle cx="43" cy="96" r="3.5" fill="#ffd23f"/><circle cx="57" cy="96" r="3.5" fill="#ffd23f"/><path d="M50 40l-6-6a4 4 0 0 1 6-5 4 4 0 0 1 6 5z" fill="#ff4f9a"/>'),
    fireplace: V('0 0 120 110', '<rect x="4" y="10" width="112" height="14" rx="4" fill="#fff4fb" stroke="#e6b8e0" stroke-width="2"/><rect x="12" y="24" width="96" height="84" fill="#ffe6f4" stroke="#e6b8e0" stroke-width="2"/><path d="M32 108V64a28 28 0 0 1 56 0v44z" fill="#4a2a3a"/><path d="M60 104c-14 0-20-10-14-22 4 6 8 6 8-2 6 4 14 10 14 18 0 4-3 6-8 6z" fill="#ff9a2e"/><path d="M60 104c-6 0-9-5-6-11 3 3 6 0 6-4 4 3 7 7 6 10-1 3-3 5-6 5z" fill="#ffe14d"/><rect x="28" y="100" width="64" height="6" rx="3" fill="#8a5a3c"/><circle cx="30" cy="4" r="5" fill="#ff8fc8"/><path d="M84 10V-0h10v10z" fill="#ffd23f"/>'),
    counter: V('0 0 140 90', '<rect x="2" y="14" width="136" height="10" rx="3" fill="#fff" stroke="#d9c8d8" stroke-width="2"/><rect x="6" y="24" width="128" height="64" fill="#ffd1ea" stroke="#e6a8cc" stroke-width="2"/><g fill="none" stroke="#e6a8cc" stroke-width="2"><rect x="12" y="32" width="36" height="50" rx="4"/><rect x="52" y="32" width="36" height="50" rx="4"/><rect x="92" y="32" width="36" height="50" rx="4"/></g><g fill="#ffd23f"><circle cx="42" cy="57" r="3"/><circle cx="58" cy="57" r="3"/><circle cx="98" cy="57" r="3"/></g><rect x="54" y="10" width="34" height="6" rx="3" fill="#cfefff"/><path d="M80 14V2h-8" stroke="#bbb" stroke-width="4" fill="none" stroke-linecap="round"/>'),
    longtable: V('0 0 200 80', '<rect x="4" y="20" width="192" height="14" rx="6" fill="#fff4fb" stroke="#ff8fc8" stroke-width="3"/><path d="M6 32q6 14 14 4 8 14 16 4 8 14 16 4 8 14 16 4 8 14 16 4 8 14 16 4 8 14 16 4 8 14 16 4 8 14 16 4 8 14 16 4 8 14 16 4 8 14 16 4" fill="#ffd1ea"/><rect x="24" y="36" width="10" height="42" fill="#ffd23f"/><rect x="166" y="36" width="10" height="42" fill="#ffd23f"/><g fill="#ffd23f"><rect x="94" y="6" width="12" height="14" rx="2"/></g><ellipse cx="100" cy="6" rx="3" ry="5" fill="#ffa53b"/><circle cx="50" cy="18" r="6" fill="#ff4f6a"/><circle cx="150" cy="18" r="6" fill="#ffe14d"/>'),
    tub: V('0 0 160 100', '<path d="M8 34h144v10c0 30-20 44-52 44H60C28 88 8 74 8 44z" fill="#fff" stroke="#c9d6e6" stroke-width="3"/><rect x="2" y="28" width="156" height="10" rx="5" fill="#fff" stroke="#c9d6e6" stroke-width="3"/><g fill="#ffd23f"><path d="M30 86l-8 12h10l6-10z"/><path d="M130 86l8 12h-10l-6-10z"/></g><g fill="#e6f6ff" stroke="#bfe6ff" stroke-width="2"><circle cx="40" cy="26" r="10"/><circle cx="58" cy="20" r="12"/><circle cx="80" cy="24" r="10"/><circle cx="100" cy="18" r="13"/><circle cx="120" cy="25" r="9"/></g><path d="M146 28V8h-12" stroke="#ffd23f" stroke-width="5" fill="none" stroke-linecap="round"/>'),
    sink: V('0 0 80 120', '<ellipse cx="40" cy="40" rx="36" ry="12" fill="#fff" stroke="#c9d6e6" stroke-width="3"/><path d="M6 40q4 22 34 24q30-2 34-24" fill="#fff" stroke="#c9d6e6" stroke-width="3"/><rect x="32" y="62" width="16" height="50" fill="#fff" stroke="#c9d6e6" stroke-width="3"/><ellipse cx="40" cy="114" rx="20" ry="5" fill="#fff" stroke="#c9d6e6" stroke-width="3"/><path d="M40 30V18h10" stroke="#ffd23f" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="40" cy="40" rx="24" ry="6" fill="#cfefff"/>'),
    sofa: V('0 0 180 100', '<rect x="22" y="10" width="136" height="50" rx="22" fill="#ff8fc8"/><rect x="4" y="40" width="40" height="48" rx="18" fill="#ff6fb1"/><rect x="136" y="40" width="40" height="48" rx="18" fill="#ff6fb1"/><rect x="30" y="52" width="120" height="30" rx="12" fill="#ffb3d9"/><path d="M90 56v24" stroke="#ff8fc8" stroke-width="3"/><rect x="44" y="24" width="30" height="26" rx="10" fill="#fff4fb"/><rect x="106" y="24" width="30" height="26" rx="10" fill="#e6d1ff"/><path d="M59 33l-4-4a3 3 0 0 1 4-2 3 3 0 0 1 4 2z" fill="#ff4f9a"/><rect x="16" y="86" width="8" height="12" fill="#ffd23f"/><rect x="156" y="86" width="8" height="12" fill="#ffd23f"/>'),
    bookshelf: V('0 0 90 140', '<rect x="4" y="4" width="82" height="132" rx="4" fill="#e7b37a" stroke="#b97f45" stroke-width="3"/><g fill="#b97f45"><rect x="8" y="44" width="74" height="5"/><rect x="8" y="88" width="74" height="5"/></g><g><rect x="12" y="14" width="10" height="30" fill="#ff6fb1"/><rect x="24" y="18" width="8" height="26" fill="#6fc3ff"/><rect x="34" y="12" width="12" height="32" fill="#b77dff"/><rect x="48" y="20" width="8" height="24" fill="#ffe14d"/><rect x="60" y="16" width="10" height="28" fill="#6ad46a"/><rect x="12" y="60" width="12" height="28" fill="#ffa53b"/><rect x="26" y="56" width="8" height="32" fill="#ff8fc8"/><rect x="36" y="62" width="10" height="26" fill="#59b7ff"/><circle cx="64" cy="76" r="12" fill="#ffd1ea"/><rect x="12" y="104" width="10" height="28" fill="#b77dff"/><rect x="24" y="100" width="12" height="32" fill="#ffe14d"/><rect x="40" y="106" width="8" height="26" fill="#ff6fb1"/><rect x="52" y="112" width="26" height="20" rx="3" fill="#6fc3ff"/></g>'),
    toybox: V('0 0 110 90', '<rect x="6" y="30" width="98" height="56" rx="6" fill="#6fc3ff" stroke="#3fa0e0" stroke-width="3"/><rect x="2" y="22" width="106" height="14" rx="6" fill="#ff8fc8" stroke="#e6609e" stroke-width="3"/><circle cx="30" cy="16" r="10" fill="#ffe14d"/><rect x="56" y="4" width="18" height="18" rx="3" fill="#6ad46a" transform="rotate(12 65 13)"/><circle cx="88" cy="14" r="8" fill="#b77dff"/><path d="M55 50l-8-8a6 6 0 0 1 8-6 6 6 0 0 1 8 6z" fill="#fff"/><text x="55" y="76" text-anchor="middle" font-family="Arial" font-weight="900" font-size="16" fill="#fff">TOYS</text>'),
    kidbed: V('0 0 140 90', '<rect x="4" y="10" width="20" height="78" rx="6" fill="#b77dff"/><rect x="116" y="34" width="20" height="54" rx="6" fill="#b77dff"/><rect x="18" y="44" width="104" height="28" rx="6" fill="#fff"/><rect x="40" y="46" width="82" height="30" rx="6" fill="#6fc3ff"/><g fill="#fff"><circle cx="56" cy="58" r="3"/><circle cx="76" cy="64" r="3"/><circle cx="96" cy="56" r="3"/><circle cx="110" cy="66" r="3"/></g><ellipse cx="34" cy="44" rx="14" ry="8" fill="#fff4fb" stroke="#e9c3d8"/><path d="M14 4l-4-4a3 3 0 0 1 4-3 3 3 0 0 1 4 3z" fill="#ffe14d"/>'),
    lamp: V('0 0 60 130', '<path d="M12 40L20 4h20l8 36z" fill="#ffd1ea" stroke="#ff8fc8" stroke-width="2"/><rect x="27" y="40" width="6" height="80" fill="#ffd23f"/><ellipse cx="30" cy="122" rx="20" ry="6" fill="#ffd23f"/><ellipse cx="30" cy="40" rx="14" ry="3" fill="#fff6c2" opacity=".9"/>'),
    window: V('0 0 100 120', '<path d="M10 116V50a40 40 0 0 1 80 0v66z" fill="#8fd3ff" stroke="#ffd23f" stroke-width="5"/><path d="M50 12v104M10 66h80" stroke="#ffd23f" stroke-width="4"/><circle cx="72" cy="38" r="8" fill="#fff6c2"/><path d="M4 116h92" stroke="#ff8fc8" stroke-width="8" stroke-linecap="round"/>')
  };

  // picture catalog for the game (key -> emoji or drawn piece, base width)
  const E = (v, w = 54) => ({ e: v, w });
  const P = (v, w) => ({ p: v, w });
  const CAT = {
    f1: E('🌸', 40), f2: E('🌷', 44), f3: E('🌻', 48), f4: E('🌹', 40), f5: E('🌼', 40), f6: E('🍄', 40), f7: E('🌳', 110), f8: E('🌲', 100),
    pinktree: P('pinktree', 130), rainbow: P('rainbow', 190), castle: P('castle', 150), pond: P('pond', 150), fence: P('fence', 110),
    fountain: E('⛲', 80), cloud: E('☁️', 80), star: E('⭐', 40), heart: E('💖', 40), balloon: E('🎈', 50), rock: E('🪨', 44), sparkle: E('✨', 40),
    molly: { molly: 1, w: 100 }, pippi: { pippi: 1, w: 74 },
    a1: E('🐰', 50), a2: E('🐱', 50), a3: E('🐶', 50), a4: E('🦆', 50), a5: E('🦋', 40), a6: E('🐞', 34), a7: E('🐢', 46), a8: E('🦄', 60),
    a9: E('🐑', 54), a10: E('🐝', 34), a11: E('🐟', 38), a12: E('🐿️', 46), a13: E('🦔', 44), a14: E('🐴', 64), a15: E('🐼', 54), a16: E('🐸', 42),
    bed: P('bed', 170), mirror: P('mirror', 80), rug: P('rug', 170), window: P('window', 100), chandelier: P('chandelier', 130), throne: P('throne', 100),
    kitten: P('kitten', 56), puppy: P('puppy', 58), duckling: P('duckling', 56), butterfly: P('butterfly', 46), daisy: P('daisy', 34), cupcake: P('cupcake', 42), teddy: P('teddy', 56),
    stairs: P('stairs', 240), door: P('door', 90), fireplace: P('fireplace', 130), counter: P('counter', 140), longtable: P('longtable', 200),
    tub: P('tub', 150), sink: P('sink', 70), sofa: P('sofa', 170), bookshelf: P('bookshelf', 80), toybox: P('toybox', 100), kidbed: P('kidbed', 140), lamp: P('lamp', 50),
    toilet: E('🚽', 60), soap: E('🧼', 30), lotion: E('🧴', 34), towel: E('🧺', 44), tv: E('📺', 70), puzzle: E('🧩', 36), dice: E('🎲', 32), yoyo: E('🪀', 32), kite: E('🪁', 50), art: E('🎨', 40), blocks: E('🧱', 40), car: E('🚗', 44), ball: E('⚽', 34), plant2: E('🌵', 44),
    armchair: E('💺', 56), island: P('counter', 120), dresser: E('🗄️', 62), beanbag: E('🟣', 50), washer: E('🫧', 50),
    table: P('table', 120), stove: P('stove', 100), fridge: P('fridge', 80),
    c1: E('🫖', 40), c2: E('🧁', 36), c3: E('🎂', 50), c4: E('🍓', 30), c5: E('🍪', 32), c6: E('🥛', 32), c7: E('🍽️', 40), c8: E('🍰', 36), c9: E('🍩', 34),
    c10: E('🧸', 50), c11: E('👑', 40), c12: E('🪴', 60), c13: E('🛋️', 110), c14: E('🪑', 60), c15: E('🎀', 36), c16: E('💐', 44), c17: E('🖼️', 60), c18: E('🕯️', 34), c19: E('🎹', 90), c20: E('📚', 44)
  };

  /* The castle house, shared by the 2D rooms and the 3D castle (1 unit = 1 foot).
     In 2D you stand in the middle of a room and turn to face one wall at a time: w 0 back, 1 right, 2 front, 3 left.
     A picture's x (0-100) runs along that wall from left to right; y 62 is at the wall and y 100 is the middle of the room;
     y under 62 means it hangs on the wall. */
  const ROOMS3D = {
    foyer: { f: 0, x: [-6, 6], z: [-4, 19] }, living: { f: 0, x: [6, 20], z: [-19, 19] }, kitchen: { f: 0, x: [-20, -6], z: [-19, 0] },
    dining: { f: 0, x: [-20, -6], z: [0, 19] }, master: { f: 1, x: [6, 20], z: [-19, 6] }, bath: { f: 1, x: [6, 20], z: [6, 19] },
    kids: { f: 1, x: [-20, -6], z: [0, 19] }, play: { f: 1, x: [-20, -6], z: [-19, 0] }
  };
  const K2T = { bed: 'bed', kidbed: 'kidbed', sofa: 'sofa', c13: 'sofa', c14: 'dchair', armchair: 'chair', table: 'table', longtable: 'longtable', tv: 'tv',
    fireplace: 'fireplace', bookshelf: 'bookshelf', c19: 'piano', stove: 'stove', fridge: 'fridge', counter: 'counter', island: 'island', tub: 'tub', toilet: 'toilet',
    sink: 'sink', mirror: 'mirror', throne: 'throne', dresser: 'dresser', toybox: 'toybox', teddy: 'teddy', c10: 'teddy', art: 'easel', beanbag: 'beanbag',
    blocks: 'blocks', c12: 'plant', plant2: 'plant', lamp: 'lamp', rug: 'rug', c3: 'cake', c8: 'cake', cupcake: 'cake', washer: 'washer', chandelier: 'chandelier',
    molly: 'molly', pippi: 'pippi' };
  const FACE = [0, -Math.PI / 2, Math.PI, Math.PI / 2];      // furniture faces into the room from each wall
  const clampN = (a, b, v) => Math.max(a, Math.min(b, v));
  const inner = r => ({ x0: r.x[0] + 1.2, x1: r.x[1] - 1.2, z0: r.z[0] + 1.2, z1: r.z[1] - 1.2 });
  function spot(r, w, u, v) {           // wall w, u along it (0..1), v from the wall to the middle (0..1) -> x, z
    const b = inner(r), hx = (b.x1 - b.x0) / 2, hz = (b.z1 - b.z0) / 2;
    if (w === 1) return { x: b.x1 - v * hx, z: b.z0 + u * (b.z1 - b.z0) };
    if (w === 2) return { x: b.x1 - u * (b.x1 - b.x0), z: b.z1 - v * hz };
    if (w === 3) return { x: b.x0 + v * hx, z: b.z1 - u * (b.z1 - b.z0) };
    return { x: b.x0 + u * (b.x1 - b.x0), z: b.z0 + v * hz };
  }
  function to3(o, id) {
    const r = ROOMS3D[id], w = o.w || 0, u = clampN(0, 100, o.x) / 100;
    if (K2T[o.k] === 'chandelier') { const p = spot(r, w, u, .75); return { x: p.x, z: p.z, y: 7.2, wall: 1, w }; }
    if (o.y < 62 && !K2T[o.k]) {       // hangs on the wall
      const p = spot(r, w, u, 0);
      if (w === 0) p.z = r.z[0] + .4; if (w === 1) p.x = r.x[1] - .4; if (w === 2) p.z = r.z[1] - .4; if (w === 3) p.x = r.x[0] + .4;
      return { x: p.x, z: p.z, y: Math.max(.6, (62 - o.y) / 62 * 8), wall: 1, w };
    }
    const p = spot(r, w, u, Math.max(0, o.y - 62) / 38);
    return { x: p.x, z: p.z, y: o.h3 || 0, w };
  }
  function to2(p, id, o, keepWall) {   // a 3D spot -> which wall you see it on, and where
    const r = ROOMS3D[id], b = inner(r), hx = (b.x1 - b.x0) / 2, hz = (b.z1 - b.z0) / 2;
    const d = [(p.z - b.z0) / hz, (b.x1 - p.x) / hx, (b.z1 - p.z) / hz, (p.x - b.x0) / hx];
    const w = keepWall != null ? keepWall : d.indexOf(Math.min(...d));
    const u = w === 0 ? (p.x - b.x0) / (b.x1 - b.x0) : w === 1 ? (p.z - b.z0) / (b.z1 - b.z0) : w === 2 ? (b.x1 - p.x) / (b.x1 - b.x0) : (b.z1 - p.z) / (b.z1 - b.z0);
    o.w = w; o.x = Math.round(clampN(0, 1, u) * 1000) / 10;
    if (keepWall == null) o.y = Math.round((62 + clampN(0, 1, d[w]) * 38) * 10) / 10;
    return o;
  }
  // pictures saved before rooms had four walls were a straight-on view of the whole room
  function oldTo3(o, id) {
    const r = ROOMS3D[id], b = inner(r), x = b.x0 + clampN(0, 100, o.x) / 100 * (b.x1 - b.x0);
    if (K2T[o.k] === 'chandelier') return { x, z: (r.z[0] + r.z[1]) / 2, y: 7.2, wall: 1 };
    if (o.y >= 62 || K2T[o.k]) return { x, z: b.z0 + Math.max(0, o.y - 62) / 38 * (b.z1 - b.z0), y: o.h3 || 0 };
    return { x, z: r.z[0] + .4, y: 0, wall: 1 };
  }
  function upgradeRooms(rooms) {
    Object.keys(ROOMS3D).forEach(id => (rooms[id] || []).forEach(o => {
      if (o.w != null) return;
      const p = oldTo3(o, id);
      if (p.wall && K2T[o.k] !== 'chandelier') o.w = 0; else to2(p, id, o, K2T[o.k] === 'chandelier' ? 0 : null);
      if (K2T[o.k] === 'chandelier') o.y = Math.min(o.y, 40);
    }));
  }
  const HOUSE = { ROOMS3D, K2T, FACE, inner, spot, to3, to2, upgradeRooms };
  window.MollyArt = { molly, pippi, PIECES, DRESS, SHOE, CAT, HOUSE };
})();
