/* PROFILE SYNC — keeps quotes in step with the contact they belong to.
   When a lead or customer profile is saved, its name, address, phone and email are copied
   onto that person's open quotes, accepted quotes and invoices (the customer block only;
   prices and lines are never touched). The dashboard's top Refresh does the same for every card.
   Only filled-in profile fields are copied, so a blank field never wipes a quote. */
import { collection, query, where, getDocs, doc, getDoc, setDoc }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const COLS = ["quotes", "acceptedQuotes", "invoices"];
const t = v => String(v || "").trim();

/* The customer block a quote should carry, built from a lead or customer profile. */
export function profilePatch(p) {
  const a = (Array.isArray(p.addresses) && p.addresses.find(x => x && (x.street || x.city || x.zip))) ||
    { street: p.street, city: p.city, state: p.state || (p.street || p.city ? "CA" : ""), zip: p.zip };
  const patch = {};
  [["name", p.name], ["business", p.business], ["street", a.street], ["city", a.city], ["state", a.state],
   ["zip", a.zip], ["phone", p.phone], ["email", p.email]]
    .forEach(([k, v]) => { if (t(v)) patch[k] = t(v); });
  return patch;
}

/* Copies the patch onto one quote, only if something actually differs. Returns true when it wrote. */
async function apply(db, col, snap, patch) {
  const c = (snap.data() || {}).customer || {};
  if (!Object.keys(patch).some(k => t(c[k]) !== patch[k])) return false;
  await setDoc(doc(db, col, snap.id), { customer: patch }, { merge: true });
  return true;
}

/* After saving a profile: col is "leads" or "customers", id is the profile's id,
   p is the saved profile data. Never throws; a failure just leaves the quotes as they were. */
export async function syncProfileToQuotes(db, col, id, p) {
  const patch = profilePatch(p || {});
  if (!id || !Object.keys(patch).length) return 0;
  const links = [[col === "customers" ? "customerId" : "leadId", id]];
  if (col === "leads" && p && p.customerId) links.push(["customerId", p.customerId]);
  let n = 0;
  for (const c of COLS) for (const [f, v] of links) {
    try {
      const qs = await getDocs(query(collection(db, c), where(f, "==", v)));
      for (const s of qs.docs) if (await apply(db, c, s, patch)) n++;
    } catch (e) { console.warn("profile sync " + c + "." + f, e); }
  }
  return n;
}

/* Dashboard Refresh: rows are the cards ({ id, source, custId, leadId }). Each linked profile
   is read once (customer first, then lead) and copied onto its cards. */
export async function syncRowsFromProfiles(db, rows) {
  const cache = {};
  const profile = async key => {
    if (!(key in cache)) {
      const [col, pid] = key.split("/");
      try { const s = await getDoc(doc(db, col, pid)); cache[key] = s.exists() ? s.data() : null; }
      catch (e) { console.warn("profile read " + key, e); cache[key] = null; }
    }
    return cache[key];
  };
  let n = 0;
  for (const r of rows || []) {
    if (!COLS.includes(r.source) || (!r.custId && !r.leadId)) continue;
    const p = (r.custId && await profile("customers/" + r.custId)) || (r.leadId && await profile("leads/" + r.leadId));
    if (!p) continue;
    try {
      const s = await getDoc(doc(db, r.source, r.id));
      if (s.exists() && await apply(db, r.source, s, profilePatch(p))) n++;
    } catch (e) { console.warn("card sync " + r.source + "/" + r.id, e); }
  }
  return n;
}
