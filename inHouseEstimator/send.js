/* Send Estimate — stage one: save the quote to Firestore and hand back a link.
   The link opens quote.html (stage two). Unapproved quotes expire after 30 days. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, doc, setDoc, runTransaction, serverTimestamp, Timestamp }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const db = getFirestore(initializeApp({
  apiKey: "AIzaSyCC1AXsqeWVBS792gor4BA6MLmz1yLypqg",
  authDomain: "khean-estimator-78f3e.firebaseapp.com",
  projectId: "khean-estimator-78f3e",
  storageBucket: "khean-estimator-78f3e.firebasestorage.app",
  messagingSenderId: "581692353222",
  appId: "1:581692353222:web:21f62f057ac5506bbb45c7"
}));

const $ = (id) => document.getElementById(id);
const val = (id) => ($(id) ? $(id).value.trim() : '');
const btn = $('eSendBtn'), box = $('qLinkBox'), msg = $('qLinkMsg'), url = $('qLinkUrl');

/* 20 random characters: far too many combinations to guess. */
function randomId(){
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes, (b) => abc[b % abc.length]).join('');
}

function show(text, isErr){
  box.hidden = false;
  msg.textContent = text;
  msg.classList.toggle('is-err', !!isErr);
}

btn.addEventListener('click', async () => {
  const q = window.KC_quote;
  if(!q){ show('Build an estimate first — nothing to send yet.', true); url.value = ''; return; }

  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    /* Next quote number, Q-1001 onward. A transaction so two sends can't share a number. */
    const n = await runTransaction(db, async (tx) => {
      const ref = doc(db, 'meta', 'counters');
      const snap = await tx.get(ref);
      const next = (snap.exists() && snap.data().quote ? snap.data().quote : 1000) + 1;
      tx.set(ref, { quote: next }, { merge: true });
      return next;
    });
    const id = randomId(), number = 'Q-' + n;

    await setDoc(doc(db, 'quotes', id), {
      number, status: 'sent',
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 30 * 864e5),
      customer: {
        name: val('eName'), phone: val('ePhone'), email: val('eEmail'), type: val('eType'),
        street: val('eAddr'), city: val('eCity'), state: val('eState'), zip: val('eZip')
      },
      lines: JSON.parse(JSON.stringify(q.lines)),
      subtotal: q.subtotal, discount: q.discount, discountLabel: q.discountLabel,
      total: q.total, minApplied: q.minApplied, sqftTotal: q.sqftTotal,
      notes: val('eNotes')
    });

    const link = new URL('quote.html?id=' + id, location.href).href;
    url.value = link;
    const first = val('eName').split(' ')[0];
    const body = 'Hi' + (first ? ' ' + first : '') + ', here is your Khean & Clean estimate ' + number + ': ' + link;
    const phone = val('ePhone').replace(/\D/g, '');
    $('qLinkSms').href = 'sms:' + (phone ? '+1' + phone : '') + '?&body=' + encodeURIComponent(body);
    show('Saved as ' + number + '. Link is good for 30 days unless approved.');
  } catch (e) {
    console.error(e);
    show('Could not save — ' + (e && e.message ? e.message : 'check your connection') + '.', true);
    url.value = '';
  } finally {
    btn.disabled = false; btn.textContent = 'Send Estimate';
  }
});

$('qLinkCopy').addEventListener('click', async () => {
  if(!url.value) return;
  try { await navigator.clipboard.writeText(url.value); $('qLinkCopy').textContent = 'Copied'; }
  catch { url.select(); document.execCommand('copy'); $('qLinkCopy').textContent = 'Copied'; }
  setTimeout(() => { $('qLinkCopy').textContent = 'Copy link'; }, 1500);
});

/* "New" clears the old link so it can't be texted by mistake. */
document.addEventListener('click', (e) => {
  if(e.target.closest('[data-clear="all"]')){ box.hidden = true; url.value = ''; }
});
