/* Player Tracker test people, shared by every Player Tracker page (player-tracker, players, dealers,
   dealer-table, floor, waitlist). All made up.
   - 200 test players, card numbers 100001-100200, each with a full profile (fake 555-01xx phone,
     example.com email, birthday, notes). The first 10 are the original test players.
   - 10 test dealers. Each dealer's four-digit number is their ID and what they enter on the
     Dealers page keypad to log in. */

const FIRST10 = ["Doyle Brunson", "Phil Ivey", "Stu Ungar", "Johnny Moss", "Amarillo Slim",
  "Puggy Pearson", "Wild Bill Hickok", "Doc Holliday", "Poker Alice", "Wyatt Earp"];
/* Fake 555 numbers. 100002 and 100009 share the last 4 (0142) to test the "full number" step. */
const PHONES10 = ["9165550101", "9165550142", "9165550103", "9165550104", "9165550105",
  "9165550106", "9165550107", "9165550108", "2095550142", "9165550110"];

const FIRSTS = ["James", "Maria", "Robert", "Linda", "Michael", "Patricia", "David", "Jennifer", "Carlos", "Elizabeth",
  "Daniel", "Susan", "Anthony", "Jessica", "Kevin", "Sarah", "Brian", "Karen", "Jose", "Nancy",
  "Thomas", "Lisa", "Ryan", "Betty", "Eric", "Sandra", "Jason", "Ashley", "Luis", "Kimberly",
  "Gary", "Donna", "Tony", "Michelle", "Frank", "Emily", "Ray", "Angela", "Victor", "Diane"];
const LASTS = ["Nguyen", "Garcia", "Smith", "Johnson", "Lopez", "Williams", "Brown", "Martinez", "Lee", "Davis",
  "Hernandez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen",
  "King", "Wright", "Scott", "Torres", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker",
  "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Patel", "Chen", "Kim", "Singh"];
const GAMES = ["Blackjack", "Baccarat", "Poker", "Three Card Poker", "Ultimate Texas Hold'em"];
const DRINKS = ["coffee, black", "Diet Coke", "water, no ice", "iced tea", "Sprite", "hot tea", "orange juice", "club soda with lime"];
const NOTES = ["Likes seat 1.", "Prefers end seats.", "Regular on weekends.", "Usually comes in after work.",
  "Plays a long session.", "Likes a quiet table.", "Ask about comps.", "Tips well.", "New this year.", "Weeknight regular."];
const pad = (n, w) => String(n).padStart(w, "0");

export const ROSTER = {}, TEST_PHONES = {}, TEST_INFO = {};
for (let i = 1; i <= 200; i++) {
  const c = String(100000 + i);
  let name;
  if (i <= 10) name = FIRST10[i - 1];
  else { const k = i - 11; name = FIRSTS[k % FIRSTS.length] + " " + LASTS[(k * 7 + Math.floor(k / FIRSTS.length)) % LASTS.length]; }
  ROSTER[c] = name;
  TEST_PHONES[c] = i <= 10 ? PHONES10[i - 1] : (i <= 100 ? "530" : "707") + "55501" + pad(i % 100, 2);
  const [f, ...l] = name.toLowerCase().replace(/[^a-z ]/g, "").split(" ");
  TEST_INFO[c] = {
    email: f + "." + (l.join("") || "player") + i + "@example.com",
    bday: (1950 + (i * 7) % 52) + "-" + pad(1 + (i * 5) % 12, 2) + "-" + pad(1 + (i * 11) % 28, 2),
    notes: "Favorite game: " + GAMES[i % GAMES.length] + ". Drink: " + DRINKS[i % DRINKS.length] + ". " + NOTES[i % NOTES.length]
  };
}

/* ---- Casinos. Each casino has its own tables, seats, wait list, calls, floor plan, building and log.
   Players (roster, profiles, phone sign-in) are shared, so one player works at every casino.
   EDH keeps the original documents (playerTracker/poc ...); Capitol's get a prefix (playerTracker/capitol_poc ...).
   Which casino: ?casino= in the link (the Personal page sub menu sets it), else the last one used on this device. */
export const CASINOS = { edh: "EDH Casino", capitol: "Capitol Casino" };
const qsCasino = new URLSearchParams(location.search).get("casino");
let pick = CASINOS[qsCasino] ? qsCasino : null;
try { if (pick) localStorage.setItem("playerTracker.casino", pick); else pick = localStorage.getItem("playerTracker.casino"); } catch (e) {}
export const CASINO = CASINOS[pick] ? pick : "edh", CASINO_NAME = CASINOS[CASINO];
const SHARED = ["roster", "profiles", "phoneIndex"];
/* Use in place of Firestore's doc(): only playerTracker documents change. */
export const casinoDoc = fsDoc => (db, col, name, ...rest) =>
  fsDoc(db, col, col === "playerTracker" && CASINO !== "edh" && name && !SHARED.includes(name) ? CASINO + "_" + name : name, ...rest);
/* Links that go to a player's phone (QR codes, copied links) carry the casino. */
export const withCasino = u => u + (u.includes("?") ? "&" : "?") + "casino=" + CASINO;
/* Links between Player Tracker pages carry it too, so two tabs on two casinos don't mix up. */
const PT_PAGES = /(player-tracker|players|dealers|dealer-table|floor|waitlist|measure|player-tracker-hardware)\.html/;
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
  const h = a.getAttribute("href");
  if (!h || /casino=/.test(h) || /^(https?:|mailto:|tel:|#)/.test(h)) return;
  if (PT_PAGES.test(h) || /^\?/.test(h)) a.setAttribute("href", withCasino(h));
}, true);
const markHeads = () => {
  document.title += " · " + CASINO_NAME;
  document.querySelectorAll(".top h1:not([id])").forEach(h => {
    const s = document.createElement("div"); s.textContent = CASINO_NAME;
    s.style.cssText = "font:600 13px system-ui,sans-serif;color:rgba(255,255,255,.7);letter-spacing:.04em";
    h.appendChild(s);
  });
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", markHeads); else markHeads();

/* ---- Live wait lists (Floor and Waitlist pages). A list builds off the games that are running:
   - an open poker table with a game picked (e.g. "1/2 No-Limit Hold'em") has a live list;
   - when no open table runs that game, a list that still has names stays as an interest list;
   - an empty list with no open table hides. Lists started by hand (Start list bubbles) always show.
   tables = playerTracker/tables { n: { open } }, list = playerTracker/tablelist { n: { variant, stakes, deleted } }. */
/* Phoned-in names fall off the wait list an hour after they're added. */
export const CALL_MS = 60 * 60000;
export const expired = v => !!(v && v.call && Date.now() - (v.at || 0) > CALL_MS);
export const openGameNames = (tables, list) => new Set(Object.entries(list || {})
  .filter(([n, t]) => t && t.variant && !t.deleted && tables && tables[n] && tables[n].open)
  .map(([, t]) => (t.stakes ? t.stakes + " " : "") + t.variant));
export function liveLists(games, wait, tables, list) {
  const open = openGameNames(tables, list), out = [];
  for (const [gid, g] of Object.entries(games || {})) {
    if (!g || !g.name) continue;
    const count = Object.values(wait || {}).filter(v => v && v.name && v.game === gid && !expired(v)).length;
    const isOpen = open.has(g.name);
    if (!isOpen && !count && !g.manual) continue;   // hidden
    out.push({ gid, name: g.name, at: g.at || 0, count, open: isOpen, interest: !isOpen && count > 0, table: !!g.table });
  }
  return out.sort((a, b) => b.open - a.open || a.at - b.at);
}

/* ---- Hours only count at an open table. When a player sits down (or comes back from break) the clock starts
   only if their table is open (playerTracker/tables { n: { open } }); closing a table stops everyone's clock there
   and opening it starts them again (Floor page). tables = null means this page can't see table status (a player's
   phone), so the clock starts. */
export const clockStart = (tables, t) => !tables || (tables[t || 1] && tables[t || 1].open) ? Date.now() : null;

/* ---- Table 1 chairs (same layout as player-tracker.html: table centre 200,40, radius 170, 7 seats, ~45 units a foot).
   The chair that goes with a seat: the chair sitting closest to that seat (from playerTracker/layout, where chairs
   were dragged), or chair n for seat n if no chair is near it. Used when the dealer moves a player who's logged in
   by chair: their login moves to the chair at their new seat. */
export function chairForSeat(layout, s, seats = 7) {
  const cx = 200, cy = 40, r = 170, ang = i => Math.PI * (i / (seats + 1));
  const pos = i => layout && layout[i] ? [layout[i].x, layout[i].y] : [cx + Math.cos(ang(i)) * (r + 40), cy + Math.sin(ang(i)) * (r + 40)];
  let best = 0, bd = Infinity;
  for (let i = 1; i <= seats; i++) {
    const [x, y] = pos(i);
    let near = 0, nd = Infinity;
    for (let k = 1; k <= seats; k++) { const d = Math.hypot(x - (cx + Math.cos(ang(k)) * r), y - (cy + Math.sin(ang(k)) * r)); if (d < nd) { nd = d; near = k; } }
    if (near === s && nd < bd) { bd = nd; best = i; }
  }
  return best || s;
}

/* 10 test dealers: four-digit number -> name. */
export const DEALERS = {
  "4821": "Ace in the Hole",  "7350": "Shuffle Off Home", "1946": "Chip Stackhouse", "6083": "River Turner",
  "3517": "Flop Martinez",    "8264": "Dee Ling",         "5172": "Cutter Deck",     "2690": "Penny Ante",
  "9438": "Hank Pair",        "1305": "Lucky Seven"
};
