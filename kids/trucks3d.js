// Shared 3D monster trucks, school bus and cars for Whistler's Monster Trucks.
// Used by whistler-trucks-3d.html (garage + stunts) and whistler-trucks.html (the game).
import * as THREE from "three";

// Same four trucks as the 2D game.
export const TRUCKS = [
  { name: 'Flame Fang',    body: '#d62828', accent: '#ff8c1a', rim: '#ffd60a', deco: 'flames' },
  { name: 'Skull Crusher', body: '#2b2b2b', accent: '#9be564', rim: '#9be564', deco: 'skull' },
  { name: 'Thunder Bolt',  body: '#1565c0', accent: '#ffd60a', rim: '#c0c0c0', deco: 'bolt' },
  { name: 'Dragon Roar',   body: '#1d7a2e', accent: '#a0e426', rim: '#ff6f00', deco: 'dragon' },
  // shaped like a later (2007+) Avalanche: long crew cab, short bed, body-color sail panels, blunt front, no gray trim
  { name: 'Tyda Mad',      body: '#c9a66b', accent: '#d62828', rim: '#c0c0c0', deco: 'mad', shape: 'avalanche', real: 'avalanche' }   // 2.0: realistic body
];
// side outline for each body shape (2D drawing coordinates; front is on the right)
export const SHAPES = {
  pickup:    { body: [[30,100],[30,62],[40,52],[112,52],[124,22],[178,22],[189,30],[196,52],[214,56],[222,68],[222,100]],
               windows: [[[128,50],[120,50],[128,28],[174,28],[182,50]]], stackX: 105 },
  avalanche: { body: [[30,100],[30,56],[34,51],[52,51],[100,24],[110,22],[170,22],[182,27],[194,50],[219,51],[222,54],[222,100]],
               windows: [[[104,50],[110,28],[138,28],[138,50]], [[142,50],[142,28],[173,28],[181,50]]], ws: [[182, 29], [193, 49]], stackX: 40,
               faceTop: 54, face: 'chevy' }
};

/* ---------- helpers ---------- */
export const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .5, metalness: .1, ...extra });
export const BLACK = std('#1b1b1b', { roughness: .9 });
export function mesh(geo, mat, cast = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; }
// convert the 2D drawing's coordinates (SVG) to 3D units
export const P = (x, y) => new THREE.Vector2((x - 126) / 60, (100 - y) / 60);

export function svgTexture(svg, w, h) {
  const img = new Image(), cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  img.onload = () => { cv.getContext('2d').drawImage(img, 0, 0, w, h); tex.needsUpdate = true; };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return tex;
}

// side paint, drawn from the same artwork as the 2D trucks
export function decoSVG(t) {
  let d = '';
  if (t.deco === 'flames') d = `
    <path d="M36 98 C52 90 58 72 52 58 C66 70 76 66 80 56 C88 70 100 74 106 60 C112 74 128 78 138 66 C140 80 158 86 188 88 L188 98 Z" fill="${t.accent}" stroke="#111" stroke-width="2.5"/>
    <path d="M44 98 C58 92 62 82 60 72 C70 80 80 78 84 70 C90 82 104 84 110 74 C116 84 130 88 140 80 C144 90 160 92 186 94 L186 98 Z" fill="#ffd60a"/>`;
  else if (t.deco === 'skull') d = `
    <path d="M72 58 L128 98 M128 58 L72 98" stroke="#111" stroke-width="11" stroke-linecap="round"/>
    <path d="M72 58 L128 98 M128 58 L72 98" stroke="#f5f5f5" stroke-width="6" stroke-linecap="round"/>
    <rect x="89" y="80" width="22" height="14" rx="3" fill="#f5f5f5" stroke="#111" stroke-width="3"/>
    <circle cx="100" cy="72" r="16" fill="#f5f5f5" stroke="#111" stroke-width="3"/>
    <circle cx="94" cy="71" r="5" fill="#111"/><circle cx="106" cy="71" r="5" fill="#111"/>
    <path d="M100 76 l-3 5 h6 z" fill="#111"/><path d="M95 84 v8 M100 84 v8 M105 84 v8" stroke="#111" stroke-width="2"/>
    <path d="M140 64 h40 M146 76 h34 M152 88 h28" stroke="${t.accent}" stroke-width="5" stroke-linecap="round"/>`;
  else if (t.deco === 'bolt') d = `
    <path d="M58 57 L108 57 L90 74 L128 74 L66 99 L84 82 L50 82 Z" fill="${t.accent}" stroke="#111" stroke-width="3" stroke-linejoin="round"/>
    <path d="M142 60 L170 60 L160 72 L182 72 L146 96 L156 82 L136 82 Z" fill="${t.accent}" stroke="#111" stroke-width="3" stroke-linejoin="round"/>`;
  else if (t.deco === 'dragon') {
    for (let row = 0; row < 3; row++) for (let x = 42 + (row % 2) * 8; x < 186; x += 16)
      d += `<path d="M${x - 8} ${66 + row * 12} a8 8 0 0 0 16 0" fill="${t.accent}" stroke="#111" stroke-width="1.5"/>`;
  }
  else if (t.deco === 'mad') d = madDeco(t);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 52 160 48" width="1280" height="384">${d}</svg>`;
}

// Tyda Mad: name in big letters with cartoon "mad" marks
export function madDeco(t) {
  const mark = (x, y) => `<path d="M${x - 7} ${y - 3} q5 3 0 6 M${x + 7} ${y - 3} q-5 3 0 6 M${x - 3} ${y - 7} q3 5 6 0 M${x - 3} ${y + 7} q3 -5 6 0" stroke="#111" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M${x - 7} ${y - 3} q5 3 0 6 M${x + 7} ${y - 3} q-5 3 0 6 M${x - 3} ${y - 7} q3 5 6 0 M${x - 3} ${y + 7} q3 -5 6 0" stroke="#ff3b30" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  return `${mark(43, 66)}${mark(181, 64)}
    <text x="112" y="78" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="17"
      fill="${t.accent}" stroke="#111" stroke-width="3" paint-order="stroke" letter-spacing="1">TYDA MAD</text>`;
}

// Chevy-style front (Tyda Mad): headlights as angry eyes, upper grille between them, the wide chrome
// bar across the middle (no logo), toothy lower grille, bumper
export function chevyFaceSVG() {
  let teeth = '';
  for (let x = 18; x < 180; x += 16) teeth += `<path d="M${x} 60 l8 12 l8 -12 z M${x} 88 l8 -11 l8 11 z" fill="#fff"/>`;
  const slats = [16, 24, 32].map(y => `<path d="M72 ${y} H128" stroke="#555" stroke-width="3"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 104" width="800" height="416">
    <path d="M6 12 L62 22 L60 42 L8 38 Z M194 12 L138 22 L140 42 L192 38 Z" fill="#fff" stroke="#111" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="40" cy="30" r="7" fill="#111"/><circle cx="160" cy="30" r="7" fill="#111"/>
    <path d="M2 4 L66 18 M198 4 L134 18" stroke="#111" stroke-width="9" stroke-linecap="round"/>
    <rect x="68" y="8" width="64" height="36" rx="3" fill="#111" stroke="#cfcfcf" stroke-width="4"/>${slats}
    <rect x="3" y="46" width="194" height="10" rx="2" fill="#dcdcdc" stroke="#111" stroke-width="3"/>
    <rect x="14" y="58" width="172" height="31" rx="4" fill="#111"/>${teeth}
    <rect x="1" y="91" width="198" height="12" rx="3" fill="#8a8a8a" stroke="#111" stroke-width="3"/>
  </svg>`;
}

// angry face for the front grille
export function faceSVG() {
  let teeth = '';
  for (let x = 14; x < 186; x += 17) teeth += `<path d="M${x} 66 l8.5 16 l8.5 -16 z M${x} 100 l8.5 -14 l8.5 14 z" fill="#fff"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 104" width="800" height="416">
    <path d="M18 18 L80 30 L76 50 L22 46 Z M182 18 L120 30 L124 50 L178 46 Z" fill="#fff" stroke="#111" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="58" cy="38" r="8" fill="#111"/><circle cx="142" cy="38" r="8" fill="#111"/>
    <path d="M10 8 L88 26 M190 8 L112 26" stroke="#111" stroke-width="10" stroke-linecap="round"/>
    <rect x="10" y="64" width="180" height="38" rx="6" fill="#111"/>${teeth}
  </svg>`;
}

/* ---------- truck builder ---------- */
export const W = 1.6;               // body width
export const TIRE_R = 1.0, TIRE_W = 0.85;
export const BODY_Y = 1.62;         // bottom of the body

let treadCache = null;
function treadGeo(ROUT, hw) {
  if (treadCache) return treadCache;
  const surf = z => { const e = Math.min(1, Math.abs(z / hw)); return ROUT - Math.pow(Math.max(0, (e - .6) / .4), 2.2) * .17; };
  const boxes = [];   // each: { w, h, l, m: Matrix4 }
  const n = new THREE.Vector3(), tdir = new THREE.Vector3(), d = new THREE.Vector3(), wv = new THREE.Vector3();
  function seg(phi, z, dz, dyArc, h, w, len) {
    // phi = angle around the tire, z = across the tire; (dz, dyArc) = direction of the bar on the surface
    const r = surf(z), dr = (surf(z + dz * .01) - r) / .01;
    n.set(Math.cos(phi), Math.sin(phi), 0); tdir.set(-Math.sin(phi), Math.cos(phi), 0);
    d.set(0, 0, 0).addScaledVector(new THREE.Vector3(0, 0, 1), dz).addScaledVector(tdir, dyArc).addScaledVector(n, dr * dz).normalize();
    const up = n.clone().addScaledVector(d, -n.dot(d)).normalize();
    wv.crossVectors(up, d).normalize();
    const m = new THREE.Matrix4().makeBasis(wv, up, d);
    m.setPosition(n.x * (r + h / 2 - .01), n.y * (r + h / 2 - .01), z);
    boxes.push({ w, h, l: len, m });
  }
  const BARS = 16, ANG = .62, SEGS = 6;                  // bars per side, sweep angle, pieces per bar (so it hugs the curve)
  for (let k = 0; k < BARS; k++) {
    [1, -1].forEach(side => {
      const a0 = (k + (side < 0 ? .5 : 0)) / BARS * Math.PI * 2;
      const z0 = -side * .05, z1 = side * hw * .97, L = Math.abs(z1 - z0);
      for (let i = 0; i < SEGS; i++) {
        const u = (i + .5) / SEGS, z = z0 + (z1 - z0) * u;
        const back = Math.abs(z - z0) * Math.tan(ANG);       // bars sweep back toward the shoulders
        const phi = a0 - back / ROUT;
        const depth = .14 - .07 * Math.min(1, Math.abs(z) / hw);   // deeper in the middle
        seg(phi, z, side, -Math.tan(ANG), depth, .15, L / SEGS / Math.cos(ANG) + .03);
      }
      // a block on the shoulder between bars
      const zb = side * hw * .96, phiB = a0 - (hw * .9 * Math.tan(ANG)) / ROUT - Math.PI / BARS;
      seg(phiB, zb, side, 0, .07, .16, .14);
    });
  }
  // merge every box into one shape
  const pos = [], nor = [], tmpN = new THREE.Matrix3();
  boxes.forEach(b => {
    const geo = new THREE.BoxGeometry(b.w, b.h, b.l).toNonIndexed();
    geo.applyMatrix4(b.m);
    pos.push(...geo.attributes.position.array); nor.push(...geo.attributes.normal.array);
    geo.dispose();
  });
  treadCache = new THREE.BufferGeometry();
  treadCache.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  treadCache.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return treadCache;
}
let swTex = null;
function sidewallTex(outerR) {
  if (swTex) return swTex;
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d'), px = S / 2 / outerR;                      // pixels per unit (ring UVs span the outer circle)
  c.fillStyle = '#1c1c1c'; c.fillRect(0, 0, S, S);
  c.translate(S / 2, S / 2);
  c.strokeStyle = '#5a5a5a'; c.lineWidth = 4;
  [.47, outerR - .03].forEach(r => { c.beginPath(); c.arc(0, 0, r * px, 0, 7); c.stroke(); });
  const text = 'WHISTLER  ★  MONSTER TIRES  ★  WHISTLER  ★  MONSTER TIRES  ★  ';
  const rad = (.47 + outerR) / 2 * px;
  c.font = `900 ${Math.round(.15 * px)}px Arial Black, Arial, sans-serif`; c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const total = [...text].reduce((w, ch) => w + c.measureText(ch).width, 0), squeeze = (Math.PI * 2 * rad) / total;
  let ang = -Math.PI / 2;
  [...text].forEach(ch => {
    const w = c.measureText(ch).width * squeeze, a = ang + w / 2 / rad;
    c.save(); c.rotate(a); c.translate(0, -rad); c.scale(squeeze > 1 ? 1 : squeeze, 1); c.fillText(ch, 0, 0); c.restore();
    ang += w / rad;
  });
  swTex = new THREE.CanvasTexture(cv); swTex.colorSpace = THREE.SRGBColorSpace; swTex.anisotropy = 8;
  return swTex;
}
export function tire(t) {
  const g = new THREE.Group();
  // rounded monster-truck tire body: smooth shoulders, slightly crowned tread
  const prof = [], hw = TIRE_W / 2, RIN = .5, ROUT = TIRE_R * .93;
  for (let i = 0; i <= 20; i++) {
    const u = i / 20, z = -hw + u * TIRE_W, e = Math.abs(z / hw);            // e: 0 at the middle, 1 at the edge
    const shoulder = Math.pow(Math.max(0, (e - .6) / .4), 2.2);             // rounds off the last 40% toward each side
    prof.push(new THREE.Vector2(ROUT - shoulder * .17, z));
  }
  prof.unshift(new THREE.Vector2(RIN, -hw)); prof.push(new THREE.Vector2(RIN, hw));
  const rubber = mesh(new THREE.LatheGeometry(prof, 56), std('#1c1c1c', { roughness: .85 }));
  rubber.rotation.x = Math.PI / 2; g.add(rubber);
  // white "WHISTLER" lettering around both sidewalls
  const SW_OUT = ROUT - .17, swGeo = new THREE.RingGeometry(.44, SW_OUT, 64), swMat = new THREE.MeshStandardMaterial({ map: sidewallTex(SW_OUT), roughness: .85 });
  [1, -1].forEach(side => {
    const sw = new THREE.Mesh(swGeo, swMat);
    sw.position.z = side * (hw + .004); if (side < 0) sw.rotation.y = Math.PI;
    g.add(sw);
  });
  // real monster-truck "V" tread: long slanted bars from each shoulder, left and right staggered and
  // overlapping a little in the middle; deeper in the center, lower on the shoulders, plus shoulder blocks
  g.add(mesh(treadGeo(ROUT, hw), std('#141414', { roughness: .9 })));
  const rimMat = std(t.rim, { metalness: .5, roughness: .3 });
  [1, -1].forEach(side => {
    const rim = mesh(new THREE.CylinderGeometry(.42, .42, .08, 24), rimMat);
    rim.rotation.x = Math.PI / 2; rim.position.z = side * (TIRE_W / 2 + .01); g.add(rim);
    const hub = mesh(new THREE.CylinderGeometry(.13, .13, .14, 16), BLACK);
    hub.rotation.x = Math.PI / 2; hub.position.z = side * (TIRE_W / 2 + .03); g.add(hub);
    for (let b = 0; b < 5; b++) {
      const a = b / 5 * Math.PI * 2, bolt = mesh(new THREE.CylinderGeometry(.04, .04, .12, 8), BLACK);
      bolt.rotation.x = Math.PI / 2; bolt.position.set(Math.cos(a) * .27, Math.sin(a) * .27, side * (TIRE_W / 2 + .03)); g.add(bolt);
    }
  });
  return g;
}

export class Helix extends THREE.Curve {
  constructor(r, h, turns) { super(); this.r = r; this.h = h; this.turns = turns; }
  getPoint(u, out = new THREE.Vector3()) { const a = u * this.turns * Math.PI * 2; return out.set(Math.cos(a) * this.r, u * this.h, Math.sin(a) * this.r); }
}

/* ---------- 2.0 realistic body: 2004-05 Chevy Avalanche 1500, no cladding (body-color, Silverado-style front) ----------
   Real size: 221.6" long, 79.8" wide, 73.6" tall, 130" wheelbase, 39" front overhang.
   Measured in inches (i = back from the front bumper, h = up from the ground), scaled so the front axle
   sits on the monster truck's front axle. Big wheel wells, like a real monster truck body. */
const AV_IN = 3.6 / 221.6;   // world units per inch
function avalancheFrontSVG(t) {
  // 2003-05 Silverado/Avalanche front: tall headlamps at the corners, chrome-framed grille split by a
  // body-color bar (no logo), body-color bumper with fog lamps and a black lower opening
  const mesh = (x, y, w, h) => { let d = ''; for (let i = x + 3; i < x + w; i += 6) d += `<path d="M${i} ${y} v${h}" stroke="#2c2c2c" stroke-width="1.6"/>`; for (let j = y + 3; j < y + h; j += 5) d += `<path d="M${x} ${j} h${w}" stroke="#2c2c2c" stroke-width="1.2"/>`; return d; };
  const lamp = (x, flip) => `<g transform="${flip ? `translate(${2 * x + 58} 0) scale(-1 1)` : ''}">
      <path d="M${x} 6 H${x + 58} V46 H${x + 8} Q${x} 46 ${x} 38 Z" fill="#cfd8de" stroke="#222" stroke-width="2"/>
      <circle cx="${x + 18}" cy="22" r="11" fill="#f4f7f9" stroke="#8a949a" stroke-width="2"/><circle cx="${x + 18}" cy="22" r="4" fill="#fff" stroke="#999"/>
      <circle cx="${x + 42}" cy="22" r="10" fill="#f4f7f9" stroke="#8a949a" stroke-width="2"/><circle cx="${x + 42}" cy="22" r="3.5" fill="#fff" stroke="#999"/>
      <rect x="${x + 4}" y="36" width="50" height="7" rx="2" fill="#f0a020" opacity=".9"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 266 100" width="1064" height="400">
    <rect width="266" height="100" fill="${t.body}"/>
    ${lamp(3, false)}${lamp(205, true)}
    <rect x="66" y="4" width="134" height="48" rx="3" fill="#111" stroke="#d8d8d8" stroke-width="4"/>
    ${mesh(70, 8, 126, 14)}${mesh(70, 38, 126, 11)}
    <rect x="68" y="23" width="130" height="13" fill="${t.body}" stroke="#d8d8d8" stroke-width="2.5"/>
    <path d="M2 58 H264" stroke="rgba(0,0,0,.35)" stroke-width="2"/>
    <rect x="76" y="70" width="114" height="18" rx="4" fill="#141414"/>${mesh(78, 72, 110, 14)}
    <rect x="112" y="58" width="42" height="11" rx="1.5" fill="#f2f2f2" stroke="#555" stroke-width="1.5"/>
    <circle cx="40" cy="79" r="8" fill="#eef3f6" stroke="#333" stroke-width="2.5"/><circle cx="226" cy="79" r="8" fill="#eef3f6" stroke="#333" stroke-width="2.5"/>
    <path d="M6 94 H260" stroke="rgba(0,0,0,.3)" stroke-width="3"/>
  </svg>`;
}
function avalancheSideSVG(t, frontRight) {
  // door seams, handles, fuel door and the truck's name, on the lower body side (h 16-51)
  const u = i => frontRight ? 221.6 - i : i, v = h => 51 - h;
  const seam = (i, h0, h1) => `<path d="M${u(i)} ${v(h1)} V${v(h0)}" stroke="rgba(0,0,0,.45)" stroke-width=".5"/>`;
  const handle = i => `<rect x="${u(i) - 3.5}" y="${v(47.5)}" width="7" height="1.6" rx=".8" fill="${t.body}" stroke="rgba(0,0,0,.5)" stroke-width=".35"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 221.6 35" width="2216" height="350">
    ${seam(58, 38, 51)}${seam(113, 22, 51)}${seam(158, 20, 51)}${handle(104)}${handle(150)}
    <rect x="${u(178) - 3.5}" y="${v(45)}" width="7" height="6" rx="1" fill="none" stroke="rgba(0,0,0,.45)" stroke-width=".4"/>
    <path d="M${u(2)} ${v(34)} H${u(219)}" stroke="rgba(255,255,255,.18)" stroke-width=".6"/>
    <text x="${u(112)}" y="${v(24)}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="11.5"
      fill="${t.accent}" stroke="#111" stroke-width="1.6" paint-order="stroke" letter-spacing=".6">${t.name.toUpperCase()}</text>
  </svg>`;
}
function avalancheBody(truck, t) {
  const s = AV_IN, xF = 1.2 + 39 * s;                                  // front of the bumper (front axle at x = 1.2)
  const X = i => xF - i * s, Y = h => BODY_Y + (h - 16) * s;           // inches → world
  const BW = 79.8 * s;
  const paint = std(t.body, { metalness: .55, roughness: .28 });
  const black = std('#151515', { roughness: .6 });
  const chrome = std('#e6e6e6', { metalness: .95, roughness: .12 });
  const glass = std('#1c2933', { metalness: .4, roughness: .06 });
  const ext = (shape, depth, mat, bevel = .02) => {
    const m = mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3 }), mat);
    m.position.z = -depth / 2; truck.add(m); return m;
  };
  const poly = list => { const sh = new THREE.Shape(); list.forEach(([i, h], k) => k ? sh.lineTo(X(i), Y(h)) : sh.moveTo(X(i), Y(h))); return sh; };

  // lower body: bumper, hood, beltline, covered bed; big wheel wells over the monster tires
  const lower = poly([[0, 16], [0, 46], [6, 48], [56, 51], [221.6, 51], [221.6, 22], [219, 16]]);
  const well = (ci, r) => { const cx = X(ci), cy = Y(16); for (let k = 0; k <= 18; k++) { const a = k / 18 * Math.PI; lower.lineTo(cx - r * Math.cos(a), cy + r * Math.sin(a)); } };
  well(186, .47); well(39, .47); lower.lineTo(X(0), Y(16));
  ext(lower, BW, paint);
  // cab + sail panels (the Avalanche's sloped "flying buttresses" from the roof down to the bed)
  ext(poly([[56, 51], [60, 52.5], [88, 71.2], [96, 73.6], [156, 73.6], [162, 72.6], [205, 51.5], [205, 51]]), BW * .9, paint, .035);
  // side glass, B-pillar, windshield
  ext(poly([[64, 53.5], [89, 70.2], [111, 70.6], [111, 53.5]]), BW * .9 + .085, glass, 0);   // sits just outside the cab's rounded edge
  ext(poly([[116, 53.5], [116, 70.6], [150, 70.6], [150, 53.5]]), BW * .9 + .085, glass, 0);
  ext(poly([[111, 53], [111, 71.5], [116, 71.5], [116, 53]]), BW * .9 + .09, black, 0);
  const a = new THREE.Vector2(X(60.5), Y(53)), b = new THREE.Vector2(X(87.5), Y(70.8));
  const ws = mesh(new THREE.BoxGeometry(.012, a.distanceTo(b), BW * .82), glass, false);
  ws.position.set((a.x + b.x) / 2 + .03, (a.y + b.y) / 2, 0); ws.rotation.z = Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2; truck.add(ws);
  // roof rails
  [1, -1].forEach(sd => { const r = mesh(new THREE.BoxGeometry(56 * s, .035, .04), black); r.position.set(X(126), Y(73.6) + .055, sd * BW * .36); truck.add(r); });
  // bed cover seam + rear "midgate" line
  const cover = mesh(new THREE.BoxGeometry(16 * s, .012, BW * .86), black); cover.position.set(X(213), Y(51) + .026, 0); truck.add(cover);

  // front: headlamps, grille, bumper (drawn), with a little depth for the grille bar
  const fH = (46 - 16) * s, front = new THREE.Mesh(new THREE.PlaneGeometry(BW + .03, fH), new THREE.MeshStandardMaterial({ map: svgTexture(avalancheFrontSVG(t), 1064, 400), roughness: .35, metalness: .2 }));
  front.position.set(X(0) + .022, Y(31), 0); front.rotation.y = Math.PI / 2; truck.add(front);
  // sides: door seams, handles, name
  [1, -1].forEach(sd => {
    const tex = svgTexture(avalancheSideSVG(t, sd > 0), 2216, 350);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(221.6 * s, 35 * s), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .4, depthWrite: false }));
    p.position.set(X(110.8), Y(33.5), sd * (BW / 2 + .022)); if (sd < 0) p.rotation.y = Math.PI; truck.add(p);
    // mirrors
    const arm = mesh(new THREE.BoxGeometry(.05, .03, .08), black); arm.position.set(X(63), Y(54), sd * (BW * .45 + .04)); truck.add(arm);
    const mir = mesh(new THREE.BoxGeometry(.05, .13, .14), paint); mir.position.set(X(64), Y(55), sd * (BW * .45 + .13)); truck.add(mir);
    // taillights
    const tl = mesh(new THREE.BoxGeometry(.03, 17 * s, .1), std('#c4161c', { emissive: '#5a0000', roughness: .25 })); tl.position.set(X(221.6) - .015, Y(39), sd * (BW / 2 - .07)); truck.add(tl);
  });
  // rear bumper
  const rb = mesh(new THREE.BoxGeometry(.06, 6 * s, BW), chrome); rb.position.set(X(221.6) - .03, Y(19), 0); truck.add(rb);

  // exhaust stacks standing up out of the bed
  const stacks = [];
  [1, -1].forEach(sd => {
    const ex = mesh(new THREE.CylinderGeometry(.06, .06, .6, 12), chrome);
    ex.position.set(X(196), Y(51) + .3, sd * BW * .28); truck.add(ex);
    const tip = new THREE.Object3D(); tip.position.set(ex.position.x, ex.position.y + .32, ex.position.z); truck.add(tip); stacks.push(tip);
  });
  return stacks;
}

export function buildTruck(t) {
  const truck = new THREE.Group(), wheels = [];
  const bodyMat = std(t.body, { metalness: .35, roughness: .35 });
  const accentMat = std(t.accent, { metalness: .3, roughness: .4 });
  let stacks = [];
  if (t.real === 'avalanche') stacks = avalancheBody(truck, t);
  else {

  // body: the 2D side outline, pushed out into 3D
  const shape = SHAPES[t.shape] || SHAPES.pickup;
  const pts = shape.body.map(p => P(...p));
  const body = mesh(new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: W, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 3 }), bodyMat);
  body.position.set(0, BODY_Y, -W / 2); truck.add(body);

  // windows (side and front)
  const glass = std('#bfe9ff', { metalness: .2, roughness: .1 });
  shape.windows.forEach(wp => {
    const win = mesh(new THREE.ExtrudeGeometry(new THREE.Shape(wp.map(p => P(...p))), { depth: W + .14, bevelEnabled: false }), glass, false);
    win.position.set(0, BODY_Y, -(W + .14) / 2); truck.add(win);
  });
  const ws = mesh(new THREE.BoxGeometry(.05, .3, W - .2), glass, false);
  const [wa, wb] = shape.ws || [[184, 30], [194, 50]], a = P(...wa), b = P(...wb);
  ws.position.set((a.x + b.x) / 2 + .05, BODY_Y + (a.y + b.y) / 2, 0); ws.rotation.z = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2; truck.add(ws);

  // side paint (both sides)
  const decoTex = svgTexture(decoSVG(t), 1280, 384);
  const dTL = P(30, 52), dBR = P(190, 100);
  const decoGeo = new THREE.PlaneGeometry(dBR.x - dTL.x, dTL.y - dBR.y);
  [1, -1].forEach(side => {
    // double-sided so the far side shows a mirror image with the paint still facing forward
    const m = new THREE.Mesh(decoGeo, new THREE.MeshStandardMaterial({ map: decoTex, transparent: true, roughness: .4, side: THREE.DoubleSide }));
    m.position.set((dTL.x + dBR.x) / 2, BODY_Y + (dTL.y + dBR.y) / 2, side * (W / 2 + .056));
    truck.add(m);
  });

  // angry face on the front
  const chevy = shape.face === 'chevy';
  const fTop = P(222, shape.faceTop || 58), fBot = P(222, 100);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(chevy ? W + .06 : W - .1, fTop.y - fBot.y), new THREE.MeshStandardMaterial({ map: svgTexture(chevy ? chevyFaceSVG() : faceSVG(), 800, 416), transparent: true, roughness: .4 }));
  face.position.set(fTop.x + .056, BODY_Y + (fTop.y + fBot.y) / 2, 0); face.rotation.y = Math.PI / 2; truck.add(face);

  // roof: light bar, or dragon spikes
  const roofY = BODY_Y + P(0, 22).y + .05;
  if (t.deco === 'dragon') {
    for (let x = 116; x <= 172; x += 14) {
      const sp = mesh(new THREE.ConeGeometry(.13, .38, 4), accentMat);
      sp.position.set(P(x, 0).x, roofY + .19, 0); truck.add(sp);
    }
  } else {
    const bar = mesh(new THREE.BoxGeometry(.9, .07, W - .3), BLACK); bar.position.set(P(153, 0).x, roofY, 0); truck.add(bar);
    const lightMat = std('#ffd60a', { emissive: '#ffb300', emissiveIntensity: .6 });
    [-0.5, -0.17, 0.17, 0.5].forEach(z => { const l = mesh(new THREE.BoxGeometry(.16, .14, .18), lightMat); l.position.set(P(153, 0).x + .25, roofY + .1, z); truck.add(l); });
  }

  // exhaust stacks
  [1, -1].forEach(side => {
    const ex = mesh(new THREE.CylinderGeometry(.07, .07, .7, 12), std('#b0b0b0', { metalness: .9, roughness: .2 }));
    ex.position.set(P(shape.stackX, 0).x, BODY_Y + P(0, 52).y + .3, side * (W / 2 - .12)); truck.add(ex);
    const tip = new THREE.Object3D(); tip.position.set(ex.position.x, ex.position.y + .38, ex.position.z); truck.add(tip); stacks.push(tip);   // where smoke comes out
  });
  }   // end of the cartoon body

  // chassis, axles, springs
  const chassis = mesh(new THREE.BoxGeometry(3.1, .2, 1.1), std('#444', { metalness: .6 }));
  chassis.position.set(0, BODY_Y - .2, 0); truck.add(chassis);
  const WX = [-1.2, 1.2];
  WX.forEach(x => {
    const axle = mesh(new THREE.CylinderGeometry(.09, .09, 2.5, 12), std('#555', { metalness: .7 }));
    axle.rotation.x = Math.PI / 2; axle.position.set(x, TIRE_R, 0); truck.add(axle);
    [1, -1].forEach(side => {
      const spring = mesh(new THREE.TubeGeometry(new Helix(.12, BODY_Y - .2 - TIRE_R, 6), 80, .03, 6), accentMat);
      spring.position.set(x, TIRE_R, side * .55); truck.add(spring);
      const shock = mesh(new THREE.CylinderGeometry(.045, .045, BODY_Y - TIRE_R, 8), std('#ddd', { metalness: .8 }));
      shock.position.set(x, (BODY_Y + TIRE_R) / 2 - .1, side * .55); truck.add(shock);
      const w = tire(t); w.position.set(x, TIRE_R, side * (W / 2 + TIRE_W / 2 + .05)); truck.add(w); wheels.push(w);
    });
  });

  // drivetrain: axle housings, a differential on each axle, driveshafts to a transmission tucked under the body
  const iron = std('#808080', { metalness: .55, roughness: .4 });
  const steel = std('#c8c8c8', { metalness: .7, roughness: .25 });
  const rod = (a, b, r, mat) => {
    const d = new THREE.Vector3().subVectors(b, a), m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 14), mat);
    m.position.copy(a).add(b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    truck.add(m); return m;
  };
  const ball = (p, r, mat) => { const m = mesh(new THREE.SphereGeometry(r, 12, 10), mat); m.position.copy(p); truck.add(m); return m; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const TRANS_Y = BODY_Y - .42;                       // just under the frame, out of sight
  // transmission + transfer case
  const trans = mesh(new THREE.BoxGeometry(.62, .3, .42), iron); trans.position.set(.16, TRANS_Y, 0); truck.add(trans);
  const bell = mesh(new THREE.CylinderGeometry(.24, .18, .22, 16), iron); bell.rotation.z = Math.PI / 2; bell.position.set(.56, TRANS_Y + .02, 0); truck.add(bell);
  const tcase = mesh(new THREE.BoxGeometry(.24, .36, .34), iron); tcase.position.set(-.27, TRANS_Y - .04, 0); truck.add(tcase);
  WX.forEach(x => {
    const s = Math.sign(x);                           // +1 front axle, -1 rear axle
    // axle housing tubes out to each wheel
    [1, -1].forEach(side => rod(V(x, TIRE_R, side * .2), V(x, TIRE_R, side * 1.25), .13, iron));
    // differential "pumpkin" with its cover facing the middle of the truck
    const diff = ball(V(x, TIRE_R, 0), .3, iron); diff.scale.set(1, 1, .85);
    const cover = mesh(new THREE.CylinderGeometry(.22, .22, .07, 18), steel);
    cover.rotation.z = Math.PI / 2; cover.position.set(x + s * .28, TIRE_R, 0); truck.add(cover);
    // pinion snout pointing at the transmission, then the driveshaft with U-joints
    const pinionEnd = V(x - s * .42, TIRE_R + .02, 0);
    rod(V(x - s * .2, TIRE_R, 0), pinionEnd, .09, iron);
    const transEnd = s > 0 ? V(.47, TRANS_Y - .02, 0) : V(-.39, TRANS_Y - .08, 0);
    ball(pinionEnd, .075, steel); ball(transEnd, .075, steel);
    rod(pinionEnd, transEnd, .055, steel);
  });

  truck.userData.wheels = wheels;
  truck.userData.stacks = stacks;
  return truck;
}

/* ---------- school bus ---------- */
export function textTex(text, w, h, bg, fg) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
  c.fillStyle = fg; c.font = `900 ${h * .62}px Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, w / 2, h / 2 + 2);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
}
export const busParts = {
  yellow: std('#f7b500', { metalness: .2, roughness: .45 }),
  black: std('#151515', { roughness: .8 }),
  glass: std('#1f3550', { metalness: .3, roughness: .15 }),
  red: std('#e53935', { emissive: '#b71c1c', emissiveIntensity: .4 }),
  amber: std('#ffb300', { emissive: '#ff8f00', emissiveIntensity: .4 }),
  sign: new THREE.MeshStandardMaterial({ map: textTex('SCHOOL BUS', 512, 96, '#f7b500', '#111'), roughness: .5 })
};
export function schoolBus() {
  // long side faces the jump; front hood points +z
  const g = new THREE.Group(), M = busParts;
  const BW = 1.6, BH = 1.8, BASE = .45, BL = 5.5, BZ = -.55; // box body
  const front = BZ + BL / 2;
  const add = (geo, mat, x, y, z) => { const m = mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(BW, BH, BL), M.yellow, 0, BASE + BH / 2, BZ);
  add(new THREE.BoxGeometry(BW * .92, .14, BL * .98), M.yellow, 0, BASE + BH + .07, BZ);
  add(new THREE.BoxGeometry(BW * .88, .85, 1.1), M.yellow, 0, BASE + .42, front + .55);
  add(new THREE.BoxGeometry(BW * .7, .5, .05), M.black, 0, BASE + .45, front + 1.11);
  add(new THREE.BoxGeometry(BW + .1, .2, .14), M.black, 0, BASE + .12, front + 1.16);
  add(new THREE.BoxGeometry(BW + .1, .2, .14), M.black, 0, BASE + .12, BZ - BL / 2 - .05);
  [.55, 1.0].forEach(y => add(new THREE.BoxGeometry(BW + .03, .06, BL), M.black, 0, BASE + y, BZ));
  for (let i = 0; i < 8; i++) add(new THREE.BoxGeometry(BW + .04, .55, .5), M.glass, 0, BASE + 1.38, BZ - BL / 2 + .55 + i * .64);
  add(new THREE.BoxGeometry(BW * .86, .62, .05), M.glass, 0, BASE + 1.3, front + .01);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(BW * .9, .26), M.sign);
  sign.position.set(0, BASE + BH - .16, front + .03); g.add(sign);
  const back = sign.clone(); back.position.z = BZ - BL / 2 - .03; back.rotation.y = Math.PI; g.add(back);
  [-1, 1].forEach(s => {
    add(new THREE.BoxGeometry(.18, .14, .06), M.amber, s * .55, BASE + BH - .16 + .0, front + .02).position.x = s * .66;
    add(new THREE.BoxGeometry(.18, .14, .06), M.red, s * .66, BASE + BH - .16, BZ - BL / 2 - .02);
    [front + .6, BZ - BL / 2 + 1.1].forEach(z => {
      const w = add(new THREE.CylinderGeometry(.45, .45, .32, 20), M.black, s * (BW / 2 - .1), .45, z);
      w.rotation.z = Math.PI / 2;
    });
  });
  g.traverse(o => { o.receiveShadow = false; });   // buses still cast shadows; skipping self-shadow avoids roof blotches
  return g;
}

/* ---------- little cars (to crush) ---------- */
function labelTex(label) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const c = cv.getContext('2d');
  c.fillStyle = '#fff'; c.strokeStyle = '#111'; c.lineWidth = 16;
  c.beginPath(); c.roundRect(10, 10, 236, 236, 40); c.fill(); c.stroke();
  c.fillStyle = '#111'; c.font = '900 180px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(label, 128, 140);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
}
const carGlass = std('#bfe9ff', { metalness: .2, roughness: .1 });
const carLight = std('#fff7c2', { emissive: '#fff2a0', emissiveIntensity: .5 });
const carHub = std('#aaaaaa', { metalness: .7, roughness: .3 });
// A small car, front pointing +x. label (optional) shows on a sign above the roof, facing +z.
export function car3d(color, label) {
  const g = new THREE.Group(), paint = std(color, { metalness: .35, roughness: .35 });
  const add = (geo, mat, x, y, z) => { const m = mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(2.4, .5, 1.3), paint, 0, .55, 0);                // lower body
  add(new THREE.BoxGeometry(1.3, .46, 1.16), paint, -.12, 1.03, 0);          // cabin
  add(new THREE.BoxGeometry(1.1, .32, 1.19), carGlass, -.12, 1.04, 0);       // side windows
  add(new THREE.BoxGeometry(1.33, .32, .98), carGlass, -.12, 1.04, 0);       // front/back windows
  [1.22, -1.22].forEach(x => add(new THREE.BoxGeometry(.1, .16, 1.32), BLACK, x, .4, 0));
  [.42, -.42].forEach(z => add(new THREE.BoxGeometry(.05, .12, .26), carLight, 1.21, .63, z));
  [.8, -.8].forEach(x => [.6, -.6].forEach(z => {
    const w = add(new THREE.CylinderGeometry(.3, .3, .24, 18), BLACK, x, .3, z); w.rotation.x = Math.PI / 2;
    const h = add(new THREE.CylinderGeometry(.13, .13, .26, 12), carHub, x, .3, z); h.rotation.x = Math.PI / 2;
  }));
  if (label) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), new THREE.MeshStandardMaterial({ map: labelTex(label), side: THREE.DoubleSide, roughness: .6 }));
    sign.position.set(-.12, 1.95, 0); sign.castShadow = true; g.add(sign);
    const post = add(new THREE.CylinderGeometry(.04, .04, .4, 8), BLACK, -.12, 1.37, 0);
    g.userData.sign = [sign, post];
  }
  return g;
}

/* ---------- engine rumble: little bumps while idling, bigger ones while driving ---------- */
export function bump(t, moving) {
  if (moving) return { y: Math.abs(Math.sin(t * 11)) * .06 + Math.abs(Math.sin(t * 6.7 + 1)) * .05, rx: Math.sin(t * 5.3) * .028, rz: Math.sin(t * 7.9) * .022 };
  return { y: Math.abs(Math.sin(t * 18)) * .02, rx: Math.sin(t * 9) * .006, rz: Math.sin(t * 13) * .003 };
}

/* ---------- exhaust smoke from the stacks ---------- */
let smokeTexture = null;
function smokeTex() {
  if (smokeTexture) return smokeTexture;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.5, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  smokeTexture = new THREE.CanvasTexture(cv); return smokeTexture;
}
export class Exhaust {
  constructor(scene) { this.scene = scene; this.pool = []; this.live = []; this.acc = 0; this.v = new THREE.Vector3(); }
  // rate = puffs per second from each stack
  update(dt, truck, rate) {
    if (truck && truck.parent && truck.userData.stacks) {
      this.acc += dt * rate;
      if (this.acc >= 1) truck.updateMatrixWorld(true);
      while (this.acc >= 1) { this.acc -= 1; truck.userData.stacks.forEach(s => this.spawn(s.getWorldPosition(this.v), rate)); }
    }
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i]; p.age += dt;
      const f = p.age / p.life;
      if (f >= 1) { p.s.visible = false; this.pool.push(p); this.live.splice(i, 1); continue; }
      p.s.position.addScaledVector(p.vel, dt); p.vel.y += dt * .25; p.vel.multiplyScalar(1 - dt * .6);
      const sc = p.size * (1 + f * 2.2); p.s.scale.set(sc, sc, sc);
      p.s.material.opacity = p.alpha * (1 - f);
    }
  }
  spawn(pos, rate) {
    const p = this.pool.pop() || (() => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex(), color: '#6b6b6b', transparent: true, depthWrite: false }));
      this.scene.add(s); return { s, vel: new THREE.Vector3() };
    })();
    const heavy = rate > 12;
    p.s.visible = true; p.s.position.copy(pos);
    p.vel.set((Math.random() - .5) * .3 - (heavy ? .5 : .1), 1.1 + Math.random() * .5, (Math.random() - .5) * .3);
    p.age = 0; p.life = 1 + Math.random() * .6; p.size = heavy ? .38 : .26; p.alpha = heavy ? .6 : .38;
    p.s.material.color.set(heavy ? '#4a4a4a' : '#7a7a7a');
    this.live.push(p);
  }
}

/* ---------- outdoor arena: dirt floor, painted wall, stands full of cheering fans ---------- */
// Made-up sponsors for the arena wall, each on its own sharp sign.
const SPONSORS = [
  { name: 'RUMBLE OIL',  tag: 'MOTOR OIL FOR MONSTERS', bg: '#111111', fg: '#ffd60a', icon: 'drop' },
  { name: 'ROCKET GAS',  tag: "FILL 'ER UP!",           bg: '#d62828', fg: '#ffffff', icon: 'pump' },
  { name: 'MEGAMUD',     tag: 'MONSTER TRUCK OIL',      bg: '#ff8c1a', fg: '#2b1700', icon: 'tire' },
  { name: 'BLAZE FUEL',  tag: 'RACE FUEL',              bg: '#1565c0', fg: '#ffffff', icon: 'flame' },
  { name: 'GATOR GRIP',  tag: 'TIRES',                  bg: '#1d7a2e', fg: '#ffffff', icon: 'tire' },
  { name: 'WHISTLER',    tag: '★ RACING TEAM ★',        bg: '#7b2cbf', fg: '#ffffff', icon: 'star' }
];
function drawIcon(c, kind, x, y, s, color) {
  c.save(); c.translate(x, y); c.fillStyle = color; c.strokeStyle = color; c.lineWidth = s * .12;
  if (kind === 'drop') { c.beginPath(); c.moveTo(0, -s * .55); c.bezierCurveTo(s * .45, -s * .05, s * .42, s * .5, 0, s * .5); c.bezierCurveTo(-s * .42, s * .5, -s * .45, -s * .05, 0, -s * .55); c.fill(); }
  else if (kind === 'pump') { c.fillRect(-s * .38, -s * .5, s * .5, s); c.clearRect(-s * .3, -s * .4, s * .34, s * .26); c.beginPath(); c.moveTo(s * .12, -s * .2); c.lineTo(s * .38, -s * .05); c.lineTo(s * .38, s * .3); c.stroke(); }
  else if (kind === 'tire') { c.beginPath(); c.arc(0, 0, s * .45, 0, 7); c.lineWidth = s * .2; c.stroke(); c.beginPath(); c.arc(0, 0, s * .12, 0, 7); c.fill(); }
  else if (kind === 'flame') { c.beginPath(); c.moveTo(0, -s * .55); c.quadraticCurveTo(s * .5, -s * .05, s * .3, s * .3); c.quadraticCurveTo(s * .15, s * .55, 0, s * .5); c.quadraticCurveTo(-s * .35, s * .45, -s * .32, s * .15); c.quadraticCurveTo(-s * .3, -s * .1, -s * .05, -s * .2); c.quadraticCurveTo(s * .05, -s * .35, 0, -s * .55); c.fill(); }
  else { c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? s * .22 : s * .5, a = -Math.PI / 2 + k * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); }
  c.restore();
}
function sponsorTex(sp) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256;
  const c = cv.getContext('2d');
  c.fillStyle = sp.bg; c.fillRect(0, 0, 1024, 256);
  c.strokeStyle = sp.fg; c.lineWidth = 10; c.strokeRect(14, 14, 996, 228);
  drawIcon(c, sp.icon, 130, 128, 150, sp.fg);
  c.fillStyle = sp.fg; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '900 104px Arial Black, Arial, sans-serif'; c.fillText(sp.name, 600, 108, 740);
  c.font = '800 44px Arial, sans-serif'; c.fillText(sp.tag, 600, 196, 740);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function buildArena(R = 40) {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 1, 96), new THREE.MeshStandardMaterial({ color: '#8b5a2b', roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.01; floor.receiveShadow = true; g.add(floor);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R - .03, R - .03, 1.6, 128, 1, true), new THREE.MeshStandardMaterial({ color: '#1f2a44', side: THREE.BackSide, roughness: .8 }));
  wall.position.y = .8; g.add(wall);
  // sponsor signs around the wall, facing the middle
  const signMats = SPONSORS.map(sp => new THREE.MeshStandardMaterial({ map: sponsorTex(sp), roughness: .6 }));
  const signGeo = new THREE.PlaneGeometry(5.2, 1.3), nSigns = Math.floor(Math.PI * 2 * R / 6.4);
  for (let i = 0; i < nSigns; i++) {
    const a = i / nSigns * Math.PI * 2, sign = new THREE.Mesh(signGeo, signMats[i % signMats.length]);
    sign.position.set(Math.cos(a) * (R - .09), .8, Math.sin(a) * (R - .09)); sign.lookAt(0, .8, 0); g.add(sign);
  }
  // stepped stands all the way around
  const ROWS = 7, STEP = 1.6, RISE = 1.0, BASE = 1.6;
  const prof = [new THREE.Vector2(R, 0), new THREE.Vector2(R, BASE)];
  for (let r = 0; r < ROWS; r++) {
    prof.push(new THREE.Vector2(R + .3 + r * STEP, BASE + r * RISE));
    prof.push(new THREE.Vector2(R + .3 + r * STEP, BASE + (r + 1) * RISE));
  }
  const outer = R + .3 + ROWS * STEP;
  prof.push(new THREE.Vector2(outer, BASE + ROWS * RISE + 1.4), new THREE.Vector2(outer + .4, BASE + ROWS * RISE + 1.4), new THREE.Vector2(outer + .4, 0));
  const stands = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), new THREE.MeshStandardMaterial({ color: '#9aa3ad', roughness: .9, side: THREE.DoubleSide }));
  g.add(stands);
  // fans: one body + one head per seat (instanced so it stays fast)
  const seats = [];
  for (let r = 0; r < ROWS; r++) {
    const rad = R + .3 + r * STEP + STEP * .55, n = Math.floor(Math.PI * 2 * rad / .95);
    for (let i = 0; i < n; i++) {
      if (i % 26 < 2 || Math.random() < .22) continue;        // aisles and empty seats
      const a = i / n * Math.PI * 2;
      seats.push({ x: Math.cos(a) * rad, z: Math.sin(a) * rad, y: BASE + r * RISE, a, ph: Math.random() * 6.28, sp: 4 + Math.random() * 6, jump: Math.random() < .35 });
    }
  }
  const shirts = ['#d62828', '#1565c0', '#ffd60a', '#1d7a2e', '#ff8c1a', '#7b2cbf', '#ffffff', '#222222', '#e91e63', '#00acc1'];
  const skins = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#a0522d'];
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(.55, .85, .4), new THREE.MeshStandardMaterial({ roughness: .8 }), seats.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(.21, 10, 8), new THREE.MeshStandardMaterial({ roughness: .8 }), seats.length);
  const col = new THREE.Color(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  seats.forEach((s, i) => {
    s.q = new THREE.Quaternion().setFromAxisAngle(up, -s.a + Math.PI / 2 + Math.PI);   // face the middle
    bodies.setColorAt(i, col.set(shirts[i % shirts.length]));
    heads.setColorAt(i, col.set(skins[(i * 7) % skins.length]));
  });
  g.add(bodies, heads);
  function place(t) {
    seats.forEach((s, i) => {
      const hop = s.jump ? Math.max(0, Math.sin(t * s.sp + s.ph)) * .35 : Math.abs(Math.sin(t * s.sp * .5 + s.ph)) * .06;
      m.compose(pos.set(s.x, s.y + .43 + hop, s.z), s.q, one); bodies.setMatrixAt(i, m);
      m.compose(pos.set(s.x, s.y + 1.07 + hop, s.z), s.q, one); heads.setMatrixAt(i, m);
    });
    bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
  }
  place(0);
  // light towers
  const pole = std('#777', { metalness: .6 }), lamp = std('#fffbe0', { emissive: '#fff3b0', emissiveIntensity: .8 });
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2 + .3, rr = outer + 2;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.25, .35, 24, 8), pole); p.position.set(Math.cos(a) * rr, 12, Math.sin(a) * rr); g.add(p);
    const l = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, .5), lamp); l.position.set(Math.cos(a) * rr, 24.5, Math.sin(a) * rr); l.lookAt(0, 0, 0); g.add(l);
  }
  let last = 0;
  g.userData.update = t => { if (t - last > 1 / 30) { last = t; place(t); } };   // cheer at 30 fps to save battery
  return g;
}
