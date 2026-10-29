/* CONTACTS — the rule for the whole app:
   Everyone with a name and a phone number (or email) is a Contact. That's the start of their profile.
   Contact never goes away; lead, customer, partner, cold call, etc. are added on top of it.
   All contacts belong in caller ID, Texts, and what the AI can see.

   Saved as contact: true on the record. Leads, Customers and Cold Calls tag any record that
   qualifies when their list loads, so records from the website forms get tagged too. */
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const has = v => Array.isArray(v) ? v.some(x => String(x || "").trim()) : !!String(v || "").trim();

export const isContact = r => !!r &&
  has(r.name || r.business || r.contact) && (has(r.phone) || has(r.phones) || has(r.email) || has(r.emails));

/* Background: tags the ones that qualify and aren't tagged yet. Never blocks the page. */
export async function tagContacts(db, col, list) {
  for (const r of (list || []).filter(r => r && r.id && !r.contact && !r.trashed && isContact(r))) {
    try { await updateDoc(doc(db, col, r.id), { contact: true }); r.contact = true; }
    catch (e) { console.warn("contact tag " + col + "/" + r.id, e); }
  }
}
