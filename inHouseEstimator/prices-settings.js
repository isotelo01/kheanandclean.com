/* Prices section of the Settings page (settings.html).
   Saves to Firestore settings/pricing. The first time, it starts from the prices in pricing.js.
   STEP 1: this is the editor only. The estimators do not read settings/pricing yet,
   so saving here does not change any quote until step 2 is wired in. */
import { getApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const db = getFirestore(getApp()), auth = getAuth(getApp());   /* app is started by settings.html */
const REF = doc(db, "settings", "pricing");
const KC = window.KC_PRICING;                 /* from pricing.js */
const MIN_JOB_DEFAULT = 150;                  /* same as MIN_JOB in app.js and the homepage */
const SPECIAL = { stairs: 1, addSqft: 1 };    /* room-picker rows that stay in code */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num = v => { const n = Number(v); return isFinite(n) && n >= 0 ? n : 0; };
const newKey = () => "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const box = document.getElementById("prices"), btn = document.getElementById("pricesSave"),
      note = document.getElementById("pricesNote");
const msg = (t, err) => { note.textContent = t; note.classList.toggle("err", !!err); };
let P = null, dirty = false;

/* Today's prices from pricing.js, in the shape that gets saved. */
function seed() {
  const out = { minJob: MIN_JOB_DEFAULT, stairs: KC.SERVICES.carpet.addons.stairs.linear,
    rooms: KC.ROOM_TYPES.filter(r => !SPECIAL[r.key])
      .map(r => ({ key: r.key, name: r.name, sqft: r.sqft, dims: r.dims || "", hidden: false })),
    services: {} };
  Object.entries(KC.SERVICES).forEach(([k, s]) => {
    const o = out.services[k] = { addons: {} };
    if (s.rate != null) o.rate = s.rate;
    if (s.tiers) { o.tiers = {};
      Object.entries(s.tiers).forEach(([t, v]) => { o.tiers[t] = { price: v.sqft, hidden: false }; }); }
    Object.entries(s.addons || {}).forEach(([a, v]) => {
      if (a === "stairs") return;              /* one stairs price for every service, kept at the top */
      o.addons[a] = v.sizes
        ? { sizes: Object.fromEntries(v.sizes.map(z => [z.key, z.price])), hidden: false }
        : { price: v.sqft != null ? v.sqft : v.linear, hidden: false };
    });
    if (s.items) o.items = s.items.map(i => ({ key: i.key, name: i.name, ft: i.ft, hidden: false }));
  });
  return out;
}

/* Saved prices laid over today's, so anything added to pricing.js later still shows up. */
function merge(base, saved) {
  if (!saved) return base;
  if (saved.minJob != null) base.minJob = saved.minJob;
  if (saved.stairs != null) base.stairs = saved.stairs;
  if (Array.isArray(saved.rooms)) base.rooms = saved.rooms;
  Object.entries(base.services).forEach(([k, b]) => {
    const s = (saved.services || {})[k]; if (!s) return;
    if (b.rate != null && s.rate != null) b.rate = s.rate;
    ["tiers", "addons"].forEach(g => {
      if (b[g] && s[g]) Object.keys(b[g]).forEach(x => { if (s[g][x]) b[g][x] = { ...b[g][x], ...s[g][x] }; });
    });
    if (b.items && Array.isArray(s.items)) b.items = s.items;
  });
  return base;
}

/* ---- Drawing ---- */
const unitOf = a => {
  if (a.sqft != null) return "per sq ft";
  if (!a.text) return a.linear != null ? "per ft" : "each";
  const u = a.text.replace(/^\$[\d.,]+\s*(\/\s*)?/, "").trim();
  return !u ? "each" : /^(per|starting)/.test(u) ? u : "per " + u;
};
const hideBox = (p, on) => p
  ? '<label class="hide"><input type="checkbox" data-p="' + p + '"' + (on ? " checked" : "") + '> Hide</label>'
  : "<span></span>";
/* One price: name (with its unit under it), $ box, Hide. */
const row = (label, unit, p, val, hp, hidden) =>
  '<div class="prrow"><span class="pname">' + esc(label) + '<small>' + esc(unit) + '</small></span>' +
  '<label class="cost"><span>$</span><input type="number" min="0" step="any" inputmode="decimal" data-p="' + p +
  '" value="' + esc(val) + '" aria-label="' + esc(label) + ' price"></label>' + hideBox(hp, hidden) + '</div>';
/* Editable list (rooms, furniture): name, size, Hide, delete. */
const list = (p, rows, sizeKey, sizeLabel, addLabel) =>
  '<div class="lrow lhead"><span>Name</span><span>' + sizeLabel + '</span><span></span><span></span></div>' +
  rows.map((r, i) => '<div class="lrow"><input data-p="' + p + '.' + i + '.name" value="' + esc(r.name) +
    '" placeholder="Name" aria-label="Name">' +
    '<input type="number" min="0" step="any" inputmode="decimal" data-p="' + p + '.' + i + '.' + sizeKey +
    '" value="' + esc(r[sizeKey]) + '" aria-label="' + sizeLabel + '">' + hideBox(p + '.' + i + '.hidden', r.hidden) +
    '<button type="button" class="x" data-pdel="' + p + '.' + i + '" aria-label="Delete ' + esc(r.name || "row") +
    '">&times;</button></div>').join("") +
  '<button type="button" class="ghost add" data-addrow="' + p + '">' + addLabel + '</button>';

function draw() {
  const open = [...box.querySelectorAll("details[open]")].map(d => d.dataset.k);
  const S = KC.SERVICES;
  let h = '<div class="pgroup"><h3>Every job</h3>' +
    row("Minimum charge", "per job", "minJob", P.minJob) +
    row("Flight of stairs", "per flight, every service", "stairs", P.stairs) + '</div>';
  Object.entries(P.services).forEach(([k, o]) => {
    const s = S[k], sp = "services." + k; let b = "";
    if (o.rate != null) b += row("Base rate", s.mode === "items" ? "per linear ft" : "per sq ft", sp + ".rate", o.rate);
    if (o.tiers) Object.entries(o.tiers).forEach(([t, v]) =>
      b += row(s.tiers[t].name, "per sq ft", sp + ".tiers." + t + ".price", v.price, sp + ".tiers." + t + ".hidden", v.hidden));
    Object.entries(o.addons).forEach(([a, v]) => {
      const d = s.addons[a], ap = sp + ".addons." + a;
      if (v.sizes) d.sizes.forEach((z, i) =>
        b += row(d.name + " \u2014 " + z.label, "per rug", ap + ".sizes." + z.key, v.sizes[z.key], i ? null : ap + ".hidden", v.hidden));
      else b += row(d.name, unitOf(d), ap + ".price", v.price, ap + ".hidden", v.hidden);
    });
    if (o.items) b += '<h4>Furniture pieces</h4>' + list(sp + ".items", o.items, "ft", "Linear ft", "+ Add piece");
    h += '<details class="pgroup" data-k="' + k + '"><summary>' + esc(s.name) + '</summary>' + b + '</details>';
  });
  h += '<details class="pgroup" data-k="rooms"><summary>Rooms</summary>' +
    '<p class="sub">Rooms on the room picker and the size each one counts as.</p>' +
    list("rooms", P.rooms, "sqft", "Sq ft", "+ Add room") + '</details>';
  box.innerHTML = h;
  open.forEach(k => box.querySelector('details[data-k="' + k + '"]')?.setAttribute("open", ""));
}

/* ---- Editing (nothing is saved until "Save prices") ---- */
const walk = path => { const ks = path.split("."), last = ks.pop(); let o = P; ks.forEach(k => { o = o[k]; }); return [o, last]; };
const touch = () => { dirty = true; msg("Not saved yet."); };

box.addEventListener("input", e => {
  const p = e.target.dataset.p; if (!p) return;
  const [o, k] = walk(p);
  o[k] = e.target.type === "checkbox" ? e.target.checked
       : e.target.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value))
       : e.target.value;
  touch();
});

box.addEventListener("click", e => {
  const add = e.target.closest("[data-addrow]");
  if (add) {
    const [o, k] = walk(add.dataset.addrow), rows = o[k];
    rows.push(k === "items" ? { key: newKey(), name: "", ft: 1, hidden: false }
                            : { key: newKey(), name: "", sqft: 0, dims: "", hidden: false });
    draw(); touch();
    box.querySelector('[data-p="' + add.dataset.addrow + '.' + (rows.length - 1) + '.name"]')?.focus();
    return;
  }
  const del = e.target.closest("[data-pdel]");
  if (del) {
    const parts = del.dataset.pdel.split("."), i = Number(parts.pop()), [o, k] = walk(parts.join("."));
    if (!confirm('Delete "' + (o[k][i].name || "this row") + '"? Quotes already sent keep their prices.')) return;
    o[k].splice(i, 1); draw(); touch();
  }
});

/* Save writes the whole price list. Blank boxes save as 0; rows with no name are dropped. */
btn.addEventListener("click", async () => {
  btn.disabled = true; msg("Saving\u2026");
  try {
    const clean = JSON.parse(JSON.stringify(P));
    const fix = o => { for (const k in o) { const v = o[k];
      if (v && typeof v === "object") fix(v);
      else if (!["name", "key", "dims", "hidden"].includes(k)) o[k] = num(v); } };
    fix(clean);
    const named = rows => rows.filter(r => String(r.name || "").trim()).map(r => ({ ...r, name: r.name.trim() }));
    clean.rooms = named(clean.rooms);
    Object.values(clean.services).forEach(s => { if (s.items) s.items = named(s.items); });
    await setDoc(REF, { ...clean, updatedAt: serverTimestamp() });
    P = merge(seed(), clean); draw(); dirty = false; msg("Saved.");
  } catch (e) { console.error(e); msg("Could not save: " + e.message, true); }
  finally { btn.disabled = false; }
});

addEventListener("beforeunload", e => { if (dirty) e.preventDefault(); });

/* Load once signed in (settings.html sends signed-out visitors to login). */
onAuthStateChanged(auth, async user => {
  if (!user || P) return;
  try {
    const s = await getDoc(REF);
    P = merge(seed(), s.exists() ? s.data() : null); draw();
    msg(s.exists() ? "" : "Showing the prices from pricing.js. Press Save prices once to store them.");
  } catch (e) { console.error(e); msg("Could not load prices: " + e.message, true); }
});
