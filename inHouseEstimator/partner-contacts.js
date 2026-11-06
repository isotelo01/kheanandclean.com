/* USERS -> CONTACTS (Israel, Nov 2026)
   Every app user (partner login on the Users page) gets a real, editable contact on the Contacts page.
   The link is kept both ways: customers/<id>.partnerUid and partners/<uid>.customerId.
   Uses the stacking rule in contact-match.js:
     same name + same phone/email -> link to that contact and stack anything new onto it
     same phone/email, different name -> flagged as a possible duplicate (partners/<uid>.dupOf), nothing merged.
       Flags show at the top of Contacts and as a red count on the hub's Contacts tile; Israel picks
       Merge or Keep separate whenever he gets to it.
     nothing matches -> a new contact is made */
import { collection, query, where, limit, getDocs, doc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { sameName, stackPatch } from "./contact-match.js";

const phoneKey = s => { const d = String(s || "").replace(/\D/g, "").slice(-10); return d.length === 10 ? d : ""; };
const emailKey = s => String(s || "").trim().toLowerCase();
/* Users page type -> Contacts page type */
const TYPE = { "Property management": "pm", "Realtor": "realtor", "Commercial": "commercial" };

async function findMatch(db, pk, ek) {
  const tries = [];
  if (pk) tries.push(["phoneKeys", "array-contains", pk], ["phoneKey", "==", pk]);
  if (ek) tries.push(["emailKeys", "array-contains", ek], ["emailKey", "==", ek]);
  for (const [f, op, v] of tries) {
    const s = await getDocs(query(collection(db, "customers"), where(f, op, v), limit(10)));
    const hit = s.docs.find(d => !d.data().trashed);
    if (hit) return { id: hit.id, ...hit.data() };
  }
  return null;
}

/* Make (or link) the contact for one user.
   mode: "auto" (default), "merge" (stack onto the flagged match), "separate" (always a new contact).
   Returns the contact id, or "" when it was flagged instead. */
export async function partnerToContact(db, u, mode) {
  const force = mode === "merge", separate = mode === "separate";
  if (u.customerId) return u.customerId;
  const name = String(u.contactName || "").trim(), business = String(u.businessName || "").trim();
  const phone = String(u.phone || "").trim(), email = String(u.email || "").trim();
  if (!name && !business) return "";
  const pk = phoneKey(phone), ek = emailKey(email);
  const dup = separate ? null : (pk || ek) ? await findMatch(db, pk, ek) : null;
  let id;
  if (dup && !dup.partnerUid && (force || sameName(name || business, dup) || sameName(business, dup))) {
    id = dup.id;
    const stack = stackPatch(dup, { phones: phone ? [phone] : [], emails: email ? [email] : [], business });
    await setDoc(doc(db, "customers", id), { ...stack, partnerUid: u.id, updatedAt: serverTimestamp() }, { merge: true });
  } else if (dup && !force) {
    /* Possible duplicate: flag it once and move on. */
    if (u.dupOf !== dup.id) {
      await setDoc(doc(db, "partners", u.id), { dupOf: dup.id, dupName: dup.business || dup.name || "", dupAt: serverTimestamp() }, { merge: true });
      u.dupOf = dup.id; u.dupName = dup.business || dup.name || "";
    }
    return "";
  } else {
    id = doc(collection(db, "customers")).id;
    await setDoc(doc(db, "customers", id), {
      type: TYPE[u.type] || "partner", business, name, phone, email, notes: "", addresses: [],
      phones: phone ? [phone] : [], emails: email ? [email] : [],
      phoneKeys: pk ? [pk] : [], emailKeys: ek ? [ek] : [], phoneKey: pk, emailKey: ek,
      contact: true, partnerUid: u.id, source: "app user",
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    }, { merge: true });
  }
  await setDoc(doc(db, "partners", u.id), { customerId: id, dupOf: "", dupName: "" }, { merge: true });
  u.customerId = id; u.dupOf = ""; u.dupName = "";
  return id;
}

/* Background pass over every user. Never blocks the page; one bad record doesn't stop the rest.
   Returns true if anything new was linked or made. */
export async function syncPartnerContacts(db, users) {
  let changed = false;
  for (const u of (users || []).filter(u => u && u.id && !u.customerId)) {
    try { if (await partnerToContact(db, u)) changed = true; }
    catch (e) { console.warn("user -> contact " + u.id, e); }
  }
  return changed;
}
