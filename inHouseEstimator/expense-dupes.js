/* Duplicate receipts: used by Income & Expenses (expenses.html) and the Email page's "save receipt".
   A saved expense counts as a likely duplicate of a new one when the amount is the same and either
   the date is the same, or the vendor matches and the dates are within 7 days of each other.
   fs = the Firestore functions the page already imports: { collection, query, where, getDocs }. */
const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
export function sameVendor(a, b) {
  a = norm(a); b = norm(b);
  return !!a && !!b && (a.includes(b) || b.includes(a) || (a.length >= 5 && a.slice(0, 5) === b.slice(0, 5)));
}
export function isDupe(x, y) {
  if (!(Math.abs((Number(x.amount) || 0) - (Number(y.amount) || 0)) < 0.005)) return false;
  const days = Math.abs(new Date(x.date + "T12:00:00") - new Date(y.date + "T12:00:00")) / 864e5;
  return days === 0 || (days <= 7 && sameVendor(x.vendor, y.vendor));
}
/* Saved expenses that look like the same receipt (searches its month and the months on each side). */
export async function findDupes(fs, db, rec) {
  const [y, m] = String(rec.date || "").split("-").map(Number); if (!y || !m) return [];
  const mk = (yy, mm) => { const d = new Date(yy, mm - 1, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
  const snap = await fs.getDocs(fs.query(fs.collection(db, "expenses"), fs.where("month", "in", [mk(y, m - 1), mk(y, m), mk(y, m + 1)])));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(e => isDupe(rec, e));
}
/* "Looks like a duplicate" question; true = save it anyway. */
export function confirmDupes(rec, dupes) {
  if (!dupes.length) return true;
  const list = dupes.slice(0, 3).map(e => "• " + (e.vendor || "?") + " $" + Number(e.amount || 0).toFixed(2) + " on " + e.date).join("\n");
  return confirm("This looks like a duplicate of a receipt already saved:\n\n" + list + "\n\nSave it anyway?");
}
