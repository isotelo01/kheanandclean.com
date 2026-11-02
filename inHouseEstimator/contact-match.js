/* CONTACT MATCHING — the rule for stacking (Israel, Nov 2026):
   1. Name matches + a phone or email matches  -> same person, stack automatically.
      A first name alone still counts ("Omar" matches "Omar Smith").
   2. Phone or email matches but the name is different -> ask first.
   3. Nothing matches -> separate contacts (two different Omars stay separate).
   "Stacking" adds every new phone, email and address under the one profile. */

const words = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/).filter(Boolean);

/* Same first name, and the last names agree when both have one. */
function namesAgree(a, b) {
  const x = words(a), y = words(b);
  if (!x.length || !y.length) return false;
  if (x[0] !== y[0]) return false;
  if (x.length > 1 && y.length > 1) return x[x.length - 1] === y[y.length - 1];
  return true;
}
/* Does this name match the person or the business on the record? */
export const sameName = (name, rec) => !!rec && (namesAgree(name, rec.name) || namesAgree(name, rec.business));

const phoneKey = s => { const d = String(s || "").replace(/\D/g, "").slice(-10); return d.length === 10 ? d : ""; };
const emailKey = s => String(s || "").trim().toLowerCase();
const list = (arr, one) => (Array.isArray(arr) && arr.length ? arr : [one]).map(v => String(v || "").trim()).filter(Boolean);
const addrKey = a => [a.street, a.zip || a.city].map(v => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "")).join("|");

/* Everything new on `add` stacked onto contact `rec`. Returns only the fields to save
   (no updatedAt); the record's main phone / email stay the main ones. */
export function stackPatch(rec, add) {
  const phones = list(rec.phones, rec.phone), pk = phones.map(phoneKey);
  (add.phones || []).forEach(p => { const k = phoneKey(p); if (String(p || "").trim() && (k ? !pk.includes(k) : !phones.includes(p))) { phones.push(String(p).trim()); pk.push(k); } });
  const emails = list(rec.emails, rec.email), ek = emails.map(emailKey);
  (add.emails || []).forEach(e => { const k = emailKey(e); if (k && !ek.includes(k)) { emails.push(String(e).trim()); ek.push(k); } });
  const addresses = (Array.isArray(rec.addresses) ? rec.addresses : []).filter(a => a && (a.street || a.city || a.zip));
  const ak = addresses.map(addrKey);
  (add.addresses || []).filter(a => a && (a.street || a.city || a.zip)).forEach(a => {
    const k = addrKey(a); if (!ak.includes(k)) { addresses.push({ street: a.street || "", city: a.city || "", state: a.state || "CA", zip: a.zip || "" }); ak.push(k); }
  });
  const patch = {
    phones, emails, addresses,
    phone: phones[0] || "", email: emails[0] || "",
    phoneKeys: phones.map(phoneKey).filter(Boolean), emailKeys: emails.map(emailKey).filter(Boolean),
    phoneKey: phoneKey(phones[0]), emailKey: emailKey(emails[0])
  };
  if (!String(rec.business || "").trim() && String(add.business || "").trim()) patch.business = String(add.business).trim();
  const note = String(add.notes || "").trim();
  if (note && !String(rec.notes || "").includes(note)) patch.notes = (rec.notes ? String(rec.notes).trim() + "\n\n" : "") + note;
  const paths = (Array.isArray(rec.photoPaths) ? rec.photoPaths : []).slice();
  (add.photoPaths || []).forEach(p => { if (!paths.includes(p)) paths.push(p); });
  if (paths.length) patch.photoPaths = paths;
  return patch;
}
