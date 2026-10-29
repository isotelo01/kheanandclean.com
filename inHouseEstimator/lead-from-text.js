/* Create lead from a text or a call (Texts and Phone pages).
   guessFromTexts: pulls a name and who referred them out of what they texted, so the name box starts filled in.
   makeLead: files them on Leads as a New lead, with how they came in and what they said in the notes. */
import { doc, collection, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const clean = s => String(s || "").replace(/\s+/g, " ").trim();

export function guessFromTexts(texts) {
  let name = "", referredBy = "";
  for (const raw of texts || []) {
    const t = clean(raw);
    if (!name) {
      const m = t.match(/\b(?:[Mm]y name is|[Mm]y name's|[Tt]his is|[Nn]ame's)\s+([A-Z][a-z'’-]+(?:\s+[A-Z][a-z'’-]+)?)/);
      if (m) name = m[1];
    }
    if (!referredBy) {
      const m = t.match(/\b(?:referred (?:me |us )?(?:to you )?by|referral from|recommended by|got your (?:number|name|info|contact info|contact) from|heard about you (?:from|through))\s+([^.,!?;\n]{2,40})/i)
        || t.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:referred|recommended) (?:me|us|you)\b/)
        || t.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+gave me your (?:number|info|name)\b/);
      if (m) referredBy = clean(m[1]).split(/\s+(?:for|to|and|about|who|that|because|regarding|so)\b/i)[0];
    }
  }
  return { name, referredBy };
}

/* how: "text" or "call". texts: what they sent (newest last). Returns the new lead's id. */
export async function makeLead(db, { name, phone, how, texts, referredBy }) {
  const when = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const said = (texts || []).map(clean).filter(Boolean).slice(-5).map(s => s.slice(0, 300));
  const message = [
    "Came in by " + (how === "call" ? "phone call" : "text") + " on " + when + ".",
    referredBy ? "Referred by " + referredBy + "." : "",
    said.length ? "\nWhat they texted:\n" + said.join("\n") : ""
  ].filter(Boolean).join("\n");
  const ref = doc(collection(db, "leads"));
  await setDoc(ref, { name, phone, message, source: how === "call" ? "call" : "text", status: "new",
    createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}
