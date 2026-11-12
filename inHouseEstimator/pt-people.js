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

/* 10 test dealers: four-digit number -> name. */
export const DEALERS = {
  "4821": "Ace in the Hole",  "7350": "Shuffle Off Home", "1946": "Chip Stackhouse", "6083": "River Turner",
  "3517": "Flop Martinez",    "8264": "Dee Ling",         "5172": "Cutter Deck",     "2690": "Penny Ante",
  "9438": "Hank Pair",        "1305": "Lucky Seven"
};
