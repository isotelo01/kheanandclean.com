/* Games menu (Floor and Waitlist pages): the poker games list and the table games list.
   Star = favorite (favorite poker games are what a poker table can be set to). Tap a stakes bubble = a wait list
   for that game at those stakes (green = list open). Table games get one "List" bubble. Write in your own poker
   game at the bottom. Data: playerTracker/pokergames { fav, custom, stakes, hide }; lists go in playerTracker/waitgames. */
import { setDoc, deleteField } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

/* Poker games (Hold'em and Omaha for now; no Stud or Razz yet). */
export const POKER_GAMES = { nlh: "No-Limit Hold'em", lhe: "Limit Hold'em", plh: "Pot-Limit Hold'em", plo: "Pot-Limit Omaha (PLO)",
  nlo: "No-Limit Omaha", lo: "Limit Omaha", plo8: "PLO Hi-Lo (PLO8)", o8: "Limit Omaha Hi-Lo (O8)", plo5: "5-Card PLO",
  plo6: "6-Card PLO", bigo: "Big O (5-Card Omaha Hi-Lo)", dbplo: "Double Board PLO" };
/* Table games: one list each (no stakes). Their favorites are kept with the poker ones, under these ids. */
export const TABLE_GAMES = { tg_bj: "Blackjack", tg_bac: "Baccarat", tg_3cp: "Three Card Poker", tg_uth: "Ultimate Texas Hold'em", tg_pg: "Pai Gow" };
/* Stakes bubbles: limit games get limit stakes, no-limit and pot-limit games get blinds. */
const LIMIT_IDS = ["lhe", "lo", "o8"];
export const STAKES_NL = ["1/2", "1/3", "2/3", "2/5", "5/10"];
const STAKES_LIMIT = ["1/3", "4/8", "6/12", "12/24"];
export const pg = { fav: {}, custom: {}, stakes: {}, hide: {} };   // stakes: { gameId: ["1/2/5/10", ...] } your own blinds; hide: built-in stakes removed
export const setPg = v => { pg.fav = v.fav || {}; pg.custom = v.custom || {}; pg.stakes = v.stakes || {}; pg.hide = v.hide || {}; };
export const pgName = id => POKER_GAMES[id] || (pg.custom[id] && pg.custom[id].name) || "";
const isLimit = id => LIMIT_IDS.includes(id) || (!POKER_GAMES[id] && /\blimit\b/i.test(pgName(id)) && !/(no|pot)[- ]limit/i.test(pgName(id)));
export const stakesFor = id => [...(isLimit(id) ? STAKES_LIMIT : STAKES_NL).filter(x => !(pg.hide[id] || []).includes(x)), ...(pg.stakes[id] || [])];
const ownStake = (id, st) => (pg.stakes[id] || []).includes(st);
export const pgAll = () => [...Object.keys(POKER_GAMES), ...Object.keys(pg.custom).filter(k => pg.custom[k] && pg.custom[k].name)];

const CSS = `.pgMenu{background:#0b1220;border:1px solid var(--gold);border-radius:12px;padding:10px 12px;margin-bottom:8px}
.pgMenu .pgh{display:flex;align-items:center}.pgMenu .pgh b{flex:1;color:var(--gold);font-size:17px}
.pgMenu .pgh button,.pgMenu .x{background:none;border:0;color:rgba(255,255,255,.6);font-size:22px;line-height:1;cursor:pointer;padding:0 4px}
.pgMenu .lbl{font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;margin:10px 0 2px}
.pgMenu .pg{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.08)}
.pgMenu .pg:last-child{border-bottom:0}.pgMenu .pg span{flex:1;min-width:160px}
.pgMenu .star{background:none;border:0;font-size:22px;line-height:1;cursor:pointer;color:rgba(255,255,255,.4);padding:0 2px}
.pgMenu .star.on{color:var(--gold)}
.pgMenu .tabs{display:flex;gap:6px;margin-top:8px}
.pgMenu .tabs button{border:1px solid var(--gold);background:none;color:var(--gold);border-radius:999px;padding:4px 12px;font:700 13px system-ui,sans-serif;cursor:pointer}
.pgMenu .tabs button.on{background:var(--gold);color:#000}`;

/* Put the menu in box (an empty, hidden element). opts: { PGREF, GAMESREF, games: () => games, listFor, fail, after }.
   Returns { draw, toggle }. */
export function mountPgMenu(box, { PGREF, GAMESREF, games, listFor, fail, after, WAITREF, wait, running }) {
  if (!document.getElementById("pgMenuCss")) { const s = document.createElement("style"); s.id = "pgMenuCss"; s.textContent = CSS; document.head.appendChild(s); }
  box.classList.add("pgMenu");
  box.innerHTML = `<div class="pgh"><b>Games</b><button data-pgclose aria-label="Close">&times;</button></div>
    <div class="tabs"><button data-pgtab="poker" class="on">Poker games</button><button data-pgtab="table">Table games</button></div>
    <div data-pane="poker"><div class="lbl">Favorites</div><div data-pgfav></div>
      <div class="lbl">All poker games</div><div data-pgall></div>
      <div style="display:flex;gap:8px;margin:10px 0 0"><input data-pgnew placeholder="Write in your own poker game" autocomplete="off" style="flex:1;min-width:0"><button class="btn sm" data-pgadd>Add</button></div></div>
    <div data-pane="table" hidden><div data-tgall></div></div>`;
  const q = s => box.querySelector(s);
  let stakeFor = "";   // game whose "+" (add your own blinds) box is open
  const startList = (name, table) => {   // started by hand: shows even with no table open
    const G = games(), had = listFor(name);
    if (!had) { const gid = "g" + Date.now(); G[gid] = { name, at: Date.now(), manual: true, ...(table ? { table: true } : {}) }; setDoc(GAMESREF, { [gid]: G[gid] }, { merge: true }).catch(fail); }
    else if (!G[had].manual) { G[had].manual = true; setDoc(GAMESREF, { [had]: { ...G[had] } }, { merge: true }).catch(fail); }
  };
  /* Tap a green (open) list again to close it: it turns clear. Not while a table is open running that game;
     if people are on the list, ask first (closing takes them off). */
  const toggleList = (name, table) => {
    const G = games(), had = listFor(name);
    if (!had) { startList(name, table); return; }
    if (running && running(name)) { alert("A table is open running " + name + ". Close the table first."); return; }
    const W = wait ? wait() : {}, ids = Object.keys(W).filter(k => W[k] && W[k].game === had);
    if (ids.length && !confirm(ids.length + (ids.length > 1 ? " people are" : " person is") + " on the " + name + " list. Close the list and take them off?")) return;
    delete G[had]; setDoc(GAMESREF, { [had]: deleteField() }, { merge: true }).catch(fail);
    if (ids.length && WAITREF) { const upd = {}; ids.forEach(k => { upd[k] = deleteField(); delete W[k]; }); setDoc(WAITREF, upd, { merge: true }).catch(fail); }
  };
  function draw() {
    if (box.hidden) return;
    const star = id => `<button class="star${pg.fav[id] ? " on" : ""}" data-star="${esc(id)}" aria-label="Favorite">${pg.fav[id] ? "&#9733;" : "&#9734;"}</button>`;
    const row = id => `<div class="pg">${star(id)}
      <span>${esc(pgName(id))}</span><div class="bubs">${stakesFor(id).map(st => `<button class="bub${listFor(st + " " + pgName(id)) ? " on" : ""}" data-pgstart="${esc(id)}" data-stake="${st}"
        title="${listFor(st + " " + pgName(id)) ? "List open (tap to close)" : "Start a " + st + " list"} (right-click to delete)">${st}${ownStake(id, st) ? ` <b data-stkdel="${esc(id)}" data-st="${st}" title="Remove" style="opacity:.6">&times;</b>` : ""}</button>`).join("")}
        ${stakeFor === id ? `<span style="display:inline-flex;gap:6px;min-width:0;flex:none"><input data-stkin placeholder="e.g. 1/2/5/10" inputmode="decimal" style="width:120px;padding:4px 8px">
          <button class="btn sm" data-stkadd="${esc(id)}">Add</button></span>` : `<button class="bub" data-stkopen="${esc(id)}" title="Add your own blinds (up to 4)">+</button>`}</div>
      ${pg.custom[id] ? `<button class="x" data-pgdel="${esc(id)}" title="Remove">&times;</button>` : ""}</div>`;
    const all = pgAll(), favs = all.filter(id => pg.fav[id]);
    const si0 = q("[data-stkin]"), typed = si0 ? si0.value : "", hadFocus = si0 && document.activeElement === si0;
    q("[data-pgfav]").innerHTML = favs.length ? favs.map(row).join("") : `<div class="hint" style="margin:4px 0">Tap a star to add a favorite.</div>`;
    q("[data-pgall]").innerHTML = all.map(row).join("");
    if (stakeFor && pg.fav[stakeFor]) q("[data-pgfav]").querySelectorAll("[data-stkin]").forEach(el => el.closest("span").remove());   // one box (the full list)
    q("[data-tgall]").innerHTML = Object.entries(TABLE_GAMES).map(([id, nm]) => `<div class="pg">${star(id)}<span>${esc(nm)}</span>
      <div class="bubs"><button class="bub${listFor(nm) ? " on" : ""}" data-tgstart="${esc(id)}">${listFor(nm) ? "List open" : "Start list"}</button></div></div>`).join("");
    const si = q("[data-stkin]"); if (si) { si.value = typed; if (hadFocus || !typed) si.focus(); si.onkeydown = e => { if (e.key === "Enter") addStake(stakeFor); if (e.key === "Escape") { stakeFor = ""; draw(); } }; }
  }
  /* "+" on a game's row: type your own blinds, 2 to 4 numbers like 1/2 or 1/2/5/10. It becomes a bubble. */
  function addStake(id) {
    const raw = (q("[data-stkin]") ? q("[data-stkin]").value : "").trim(), nums = raw.split(/[\/\s,-]+/).filter(Boolean);
    if (nums.length < 2 || nums.length > 4 || nums.some(x => !/^\d+(\.\d+)?$/.test(x))) { alert("Type 2 to 4 blinds, like 1/2 or 1/2/5/10."); return; }
    const st = nums.join("/");
    if ((pg.hide[id] || []).includes(st)) {   // a built-in one that was removed: bring it back
      pg.hide[id] = pg.hide[id].filter(x => x !== st);
      setDoc(PGREF, { hide: { [id]: pg.hide[id] } }, { merge: true }).catch(fail);
    } else if (!stakesFor(id).includes(st)) {
      pg.stakes[id] = [...(pg.stakes[id] || []), st];
      setDoc(PGREF, { stakes: { [id]: pg.stakes[id] } }, { merge: true }).catch(fail);
    }
    stakeFor = ""; draw();
  }
  box.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("[data-pgclose]")) { box.hidden = true; return; }
    const tab = t.closest("[data-pgtab]");
    if (tab) { box.querySelectorAll("[data-pgtab]").forEach(b => b.classList.toggle("on", b === tab));
      box.querySelectorAll("[data-pane]").forEach(p => p.hidden = p.dataset.pane !== tab.dataset.pgtab); return; }
    if (t.closest("[data-pgadd]")) { addPgGame(); return; }
    const st = t.closest("[data-star]"), go = t.closest("[data-pgstart]"), del = t.closest("[data-pgdel]"), tg = t.closest("[data-tgstart]");
    const so = t.closest("[data-stkopen]"), sa = t.closest("[data-stkadd]"), sd = t.closest("[data-stkdel]");
    if (so) { stakeFor = so.dataset.stkopen; draw(); return; }
    if (sa) { addStake(sa.dataset.stkadd); return; }
    if (sd) {   // remove one of your own blind structures
      const id = sd.dataset.stkdel; pg.stakes[id] = (pg.stakes[id] || []).filter(x => x !== sd.dataset.st);
      setDoc(PGREF, { stakes: { [id]: pg.stakes[id] } }, { merge: true }).catch(fail);
      draw(); return;
    }
    if (st) {
      const id = st.dataset.star, on = !pg.fav[id];
      if (on) pg.fav[id] = true; else delete pg.fav[id];
      setDoc(PGREF, { fav: { [id]: on ? true : deleteField() } }, { merge: true }).catch(fail);
    } else if (go) toggleList(go.dataset.stake + " " + pgName(go.dataset.pgstart));   // e.g. "1/2 No-Limit Hold'em"
    else if (tg) toggleList(TABLE_GAMES[tg.dataset.tgstart], true);
    else if (del) {
      const id = del.dataset.pgdel; delete pg.custom[id]; delete pg.fav[id];
      setDoc(PGREF, { custom: { [id]: deleteField() }, fav: { [id]: deleteField() } }, { merge: true }).catch(fail);
    } else return;
    draw(); if (after) after();
  });
  /* Right-click (or press and hold on a phone) a stakes bubble to delete it, built-in or your own. "+" adds it back. */
  function delStake(id, st) {
    if (ownStake(id, st)) { pg.stakes[id] = pg.stakes[id].filter(x => x !== st); setDoc(PGREF, { stakes: { [id]: pg.stakes[id] } }, { merge: true }).catch(fail); }
    else { pg.hide[id] = [...(pg.hide[id] || []), st]; setDoc(PGREF, { hide: { [id]: pg.hide[id] } }, { merge: true }).catch(fail); }
    draw();
  }
  box.addEventListener("contextmenu", e => {
    const b = e.target.closest("[data-pgstart][data-stake]"); if (!b) return;
    e.preventDefault(); delStake(b.dataset.pgstart, b.dataset.stake);
  });
  let holdT = 0, held = false;
  box.addEventListener("touchstart", e => {
    const b = e.target.closest("[data-pgstart][data-stake]"); if (!b) return;
    held = false; clearTimeout(holdT);
    holdT = setTimeout(() => { held = true; if (navigator.vibrate) navigator.vibrate(30); delStake(b.dataset.pgstart, b.dataset.stake); }, 650);
  }, { passive: true });
  ["touchend", "touchmove", "touchcancel"].forEach(t => box.addEventListener(t, () => clearTimeout(holdT), { passive: true }));
  box.addEventListener("click", e => { if (held) { held = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);   // a hold isn't a tap
  const addPgGame = () => {
    const inp = q("[data-pgnew]"), name = inp.value.trim(); if (!name) { inp.focus(); return; }
    if (pgAll().some(id => pgName(id).toLowerCase() === name.toLowerCase())) { inp.value = ""; return; }
    const id = "c" + Date.now();
    pg.custom[id] = { name, at: Date.now() };
    setDoc(PGREF, { custom: { [id]: pg.custom[id] } }, { merge: true }).catch(fail);
    inp.value = ""; draw();
  };
  q("[data-pgnew]").onkeydown = e => { if (e.key === "Enter") addPgGame(); };
  return { draw, toggle: () => { box.hidden = !box.hidden; draw(); } };
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
