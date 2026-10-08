/* Send Estimate — stage one: save the quote to Firestore and hand back a link.
   The link opens quote.html (stage two). Unapproved quotes expire after 30 days. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, runTransaction, serverTimestamp, Timestamp,
         collection, query, where, limit, getDocs }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const app = initializeApp({
  apiKey: "AIzaSyCC1AXsqeWVBS792gor4BA6MLmz1yLypqg",
  authDomain: "khean-estimator-78f3e.firebaseapp.com",
  projectId: "khean-estimator-78f3e",
  storageBucket: "khean-estimator-78f3e.firebasestorage.app",
  messagingSenderId: "581692353222",
  appId: "1:581692353222:web:21f62f057ac5506bbb45c7"
});
const db = getFirestore(app);

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

/* Everything that comes from the form. Used for new quotes and for edits.
   "form" is the snapshot of choices that lets Edit reopen the estimate later. */
function fromForm(q){
  return {
    customer: {
      name: val('eName'), phone: val('ePhone'), email: val('eEmail'), type: val('eType'),
      business: val('eBiz'),
      street: val('eAddr'), city: val('eCity'), state: val('eState'), zip: val('eZip')
    },
    lines: JSON.parse(JSON.stringify(q.lines)),
    subtotal: q.subtotal, discount: q.discount, discountLabel: q.discountLabel,
    total: q.total, minApplied: q.minApplied, sqftTotal: q.sqftTotal,
    notes: val('eNotes'),
    scheduledDate: val('eWhen'),   /* Job date, "2026-10-08". Same field the calendar's Change date writes; blank = no date. */
    scheduledTime: val('eWhenTime'),   /* "09:00" or "13:00" when AM/PM was tapped in the open days; blank = whole day. */
    form: window.KC_snapshot ? window.KC_snapshot() : null
  };
}

function showLink(id, number, text){
  const link = new URL('quote.html?id=' + id, location.href).href;
  url.value = link;
  const first = val('eName').split(' ')[0];
  const body = 'Hi' + (first ? ' ' + first : '') + ', here is your Khean & Clean estimate ' + number + ': ' + link;
  const phone = val('ePhone').replace(/\D/g, '');
  $('qLinkSms').href = 'sms:' + (phone ? '+1' + phone : '') + '?&body=' + encodeURIComponent(body);
  show(text);
  return { link, body };
}

/* After a new estimate saves: offer text or email, then go to the Dashboard.
   Closing the dialog any way -- button, X, Esc, backdrop -- lands on the Dashboard. */
function askHowToSend(number, link, body){
  const dlg = $('sendDlg');
  if (!dlg || !dlg.showModal) { location.href = './dashboard.html'; return; }

  const phone = val('ePhone').replace(/\D/g, '');
  const email = val('eEmail');
  const sms = $('sendDlgSms'), mail = $('sendDlgMail');

  $('sendDlgTtl').textContent = 'Saved as ' + number;
  $('sendDlgSub').textContent = 'Send it to the customer, or close to go to the Dashboard.';

  /* Only offer a route we actually have a destination for. */
  sms.hidden = !phone;
  sms.href = 'sms:' + (phone ? '+1' + phone : '') + '?&body=' + encodeURIComponent(body);
  mail.hidden = !email;
  mail.href = 'mailto:' + encodeURIComponent(email) +
    '?subject=' + encodeURIComponent('Your Khean & Clean estimate ' + number) +
    '&body=' + encodeURIComponent(body);
  if (!phone && !email) $('sendDlgSub').textContent = 'No phone or email on the estimate, so there is nobody to send it to. The link is on the Dashboard.';

  const leave = () => { location.href = './dashboard.html'; };
  dlg.addEventListener('close', leave, { once: true });
  $('sendDlgX').onclick = () => dlg.close();
  /* Click outside the sheet closes it. */
  dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
  /* Tapping Send hands off to the phone's app, then we move on. */
  [sms, mail].forEach(a => a.addEventListener('click', () => setTimeout(() => dlg.close(), 400), { once: true }));

  dlg.showModal();
}

/* ---- Who the estimate is filed under ----
   Customer picked from the name list (Customer ID set): that customer's record is topped up.
   A new address, phone or email is added; blanks get filled; nothing on file is overwritten.
   No Customer ID: the estimate files as a quoted lead. Estimates never create customers. */
const phoneKey = s => { const d = String(s || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? d : ''; };
const emailKey = s => String(s || '').trim().toLowerCase();
const sameAddr = (a, b) => ['street', 'city', 'zip'].every(k =>
  String(a[k] || '').trim().toLowerCase() === String(b[k] || '').trim().toLowerCase());
/* Phones and emails are lists on the customer; first is the primary (same as customers.html). */
const listOf = (arr, one) => (Array.isArray(arr) && arr.length ? arr : [one])
  .map(x => String(x || '').trim()).filter(Boolean);
/* Property type on the estimate -> contact type on the customer record. */
const TYPE_MAP = {
  'Residential': 'residential',
  'Property management': 'pm',
  'Realtor': 'realtor',
  'Commercial': 'commercial'
};

async function fileCustomer(custId){
  const name = val('eName'), phone = val('ePhone'), email = val('eEmail');
  const pk = phoneKey(phone), ek = emailKey(email);
  const addr = { street: val('eAddr'), city: val('eCity'), state: val('eState'), zip: val('eZip') };
  const hasAddr = !!(addr.street || addr.city || addr.zip);
  try {
    /* Only the customer picked from the name list. */
    const snap = await getDoc(doc(db, 'customers', custId));
    const hit = snap.exists() ? snap : null;
    if (hit) {
      const d = hit.data(), addresses = (d.addresses || []).slice(), patch = {};
      if (hasAddr && !addresses.some(a => sameAddr(a, addr))) { addresses.push(addr); patch.addresses = addresses; }
      if (!d.name && name)   patch.name = name;
      if (!d.business && val('eBiz')) patch.business = val('eBiz');
      /* A phone or email not on file yet is added to the end of their list. */
      const phones = listOf(d.phones, d.phone), emails = listOf(d.emails, d.email);
      if (pk && !phones.some(x => phoneKey(x) === pk)) phones.push(phone);
      if (ek && !emails.some(x => emailKey(x) === ek)) emails.push(email);
      const phoneKeys = phones.map(phoneKey).filter(Boolean), emailKeys = emails.map(emailKey).filter(Boolean);
      if (JSON.stringify(phones) !== JSON.stringify(d.phones || []) || JSON.stringify(emails) !== JSON.stringify(d.emails || []))
        Object.assign(patch, { phones, emails, phoneKeys, emailKeys,
          phone: phones[0] || '', email: emails[0] || '',
          phoneKey: phoneKey(phones[0]), emailKey: emailKey(emails[0]) });
      if (d.trashed) Object.assign(patch, { trashed: false, trashedAt: null });   /* estimating for them again means they're active */
      if (Object.keys(patch).length) await setDoc(hit.ref, Object.assign(patch, { updatedAt: serverTimestamp() }), { merge: true });
    }
  } catch (e) {
    console.error('Customer not filed:', e);   /* the quote is already saved; don't fail the send */
  }
}

/* No Customer ID: file as a quoted lead. Quote started from a lead (New quote on
   the Leads page): that same lead is marked quoted. Otherwise a new lead is made,
   already marked quoted, so it shows under Quoted on the Leads page. */
async function fileLead(quoteId, number){
  const link = { status: 'quoted', quoteId, quoteNumber: number, updatedAt: serverTimestamp() };
  const leadId = val('eLeadId');
  if (leadId) {
    try { await updateDoc(doc(db, 'leads', leadId), link); return leadId; }
    catch (e) { if (e.code !== 'not-found') throw e; }   /* lead was erased: make a fresh one */
  }
  const addr = { street: val('eAddr'), city: val('eCity'), state: val('eState'), zip: val('eZip') };
  const id = randomId();
  await setDoc(doc(db, 'leads', id), Object.assign({
    name: val('eName'), phone: val('ePhone'), email: val('eEmail'),
    type: val('eType').toLowerCase(), business: val('eBiz'),
    addresses: (addr.street || addr.city || addr.zip) ? [addr] : [],
    message: '', services: [], source: 'estimate', createdAt: serverTimestamp()
  }, link));
  if ($('eLeadId')) $('eLeadId').value = id;
  return id;
}

/* File the estimate under its customer or its quoted lead, and note which on the quote.
   Never fails the send: the quote is already saved by the time this runs. */
async function fileContact(quoteId, from, number){
  const custId = val('eCustId');
  try {
    if (custId) {
      await fileCustomer(custId);
      await setDoc(doc(db, from, quoteId), { customerId: custId, leadId: null }, { merge: true });
    } else {
      const leadId = await fileLead(quoteId, number);
      await setDoc(doc(db, from, quoteId), { leadId, customerId: null }, { merge: true });
    }
  } catch (e) {
    console.error('Contact not filed:', e);
  }
}

/* ---- Edit mode: index.html?edit=<id>&from=<collection>, opened from the Dashboard ---- */
const EDITABLE = ['quotes', 'acceptedQuotes', 'invoices', 'paidInvoices'];
const ACCEPT_FIELDS = ['acceptedName', 'acceptedAt', 'termsAccepted', 'termsVersion'];
let edit = null, banner = null, backBtn = null;

/* "Return to estimates": saves your edits and sends the invoice back to Estimates. */
async function returnToEstimates(){
  const q = window.KC_quote;
  if (!edit || (edit.from !== 'invoices' && edit.from !== 'acceptedQuotes')) return;
  if (!q) { show('Build an estimate first — nothing to save yet.', true); return; }
  if (val('eType') !== 'Residential' && !val('eBiz')) {
    show('Add the business name before saving.', true);
    const b = $('eBiz'); if (b) b.focus();
    return;
  }
  backBtn.disabled = true; btn.disabled = true; backBtn.textContent = 'Moving…';
  try {
    await saveEdit(q, true);
    banner.textContent = 'Editing ' + edit.data.number + '.';
    backBtn.remove(); backBtn = null;
  } catch (e) {
    console.error(e);
    show('Could not move it — ' + (e && e.message ? e.message : 'check your connection') + '.', true);
    backBtn.disabled = false; backBtn.textContent = 'Return to estimates';
  } finally {
    btn.disabled = false;
  }
}

const signedIn = () => new Promise(res => {
  const off = onAuthStateChanged(getAuth(app), u => { if (u) { off(); res(u); } });
});

async function loadForEdit(id, from){
  banner = document.createElement('p');
  banner.className = 'qlink__k';
  banner.textContent = 'Loading estimate\u2026';
  btn.before(banner);
  btn.disabled = true;
  try {
    await signedIn();
    const snap = await getDoc(doc(db, from, id));
    if (!snap.exists()) { banner.textContent = 'That estimate is no longer there. Go back to the Dashboard and refresh.'; return; }
    const d = snap.data(), c = d.customer || {};
    [['eName', c.name], ['ePhone', c.phone], ['eEmail', c.email], ['eAddr', c.street],
     ['eCity', c.city], ['eZip', c.zip], ['eNotes', d.notes], ['eWhen', d.scheduledDate], ['eWhenTime', d.scheduledTime]].forEach(([fid, v]) => {
      const el = $(fid); if (!el) return;
      el.value = v || '';
      el.dispatchEvent(new Event('input', { bubbles: true }));   /* keeps the letterhead in sync */
    });
    if ($('eType') && c.type) { $('eType').value = c.type; $('eType').dispatchEvent(new Event('change', { bubbles: true })); }
    /* After the change event, since that handler clears the field when the type
       is Residential — setting it earlier would be wiped. */
    if ($('eBiz') && c.business) $('eBiz').value = c.business;

    if (d.form) window.KC_restore(d.form);
    edit = { id, from, data: d };
    /* Keep the estimate filed under the same customer or lead as before. */
    if ($('eCustId')) $('eCustId').value = d.customerId || '';
    if ($('eLeadId')) $('eLeadId').value = d.leadId || '';
    if ($('eCustTag')) { $('eCustTag').textContent = 'Existing customer'; $('eCustTag').hidden = !d.customerId; }

    let note = 'Editing ' + (d.number || 'this estimate') + '.';
    if (!d.form) {
      note += ' It has no saved form, so the estimate below is blank. Rebuild it before saving.';
    } else {
      const now = window.KC_quote ? window.KC_quote.total : 0, was = Number(d.total) || 0;
      if (Math.abs(now - was) >= 0.01) note += ' Heads up: it now totals $' + now.toFixed(2) + ' but was saved at $' + was.toFixed(2) + '. Check it before saving.';
    }
    banner.textContent = note;
    btn.textContent = 'Save changes';
    /* Unpaid invoice or accepted estimate: offer a way back to Estimates. */
    if (from === 'invoices' || from === 'acceptedQuotes') {
      backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = btn.className;
      backBtn.id = 'eBackBtn';
      backBtn.textContent = 'Return to estimates';
      backBtn.style.cssText = 'margin-top:10px;background:transparent;color:inherit;border:1px solid currentColor';
      btn.after(backBtn);
      backBtn.addEventListener('click', returnToEstimates);
    }
  } catch (e) {
    console.error(e);
    banner.textContent = 'Could not load that estimate: ' + (e && e.message ? e.message : 'check your connection') + '.';
  } finally {
    btn.disabled = false;
  }
}

/* Save over the same document: same id, same number, so links already sent keep working.
   An accepted estimate whose price changed goes back to Estimates for a fresh approval. */
async function saveEdit(q, backToEstimates){
  const merged = Object.assign({}, edit.data, fromForm(q), { updatedAt: serverTimestamp() });
  const priceChanged = Math.abs(Number(q.total) - (Number(edit.data.total) || 0)) >= 0.01;
  let target = edit.from, text = 'Saved changes to ' + merged.number + '. Same link as before.';

  /* "Return to estimates" on an unpaid invoice: undo what the Invoice button added,
     put the original Q- number back, and make it need accepting again. */
  if (backToEstimates && edit.from === 'invoices') {
    const invNo = merged.number;
    if (merged.quoteNumber) merged.number = merged.quoteNumber;
    ['type', 'invoicedAt', 'quoteNumber', 'quoteId'].forEach(k => delete merged[k]);
    ACCEPT_FIELDS.forEach(k => delete merged[k]);
    merged.status = 'sent';
    merged.expiresAt = Timestamp.fromMillis(Date.now() + 30 * 864e5);
    target = 'quotes';
    text = 'Invoice ' + invNo + ' is back in Estimates as ' + merged.number + '. It needs to be accepted again. Same link as before.';
  } else if (edit.from === 'quotes' || (edit.from === 'acceptedQuotes' && (priceChanged || backToEstimates))) {
    ACCEPT_FIELDS.forEach(k => delete merged[k]);
    merged.status = 'sent';
    merged.expiresAt = Timestamp.fromMillis(Date.now() + 30 * 864e5);
    target = 'quotes';
    if (edit.from === 'acceptedQuotes') text = backToEstimates
      ? merged.number + ' is back in Estimates. It needs to be accepted again. Same link as before.'
      : 'Saved ' + merged.number + '. The price changed, so it moved back to Estimates for the customer to approve again. Same link as before.';
  }

  await setDoc(doc(db, target, edit.id), merged);           /* copy first ... */
  if (target !== edit.from) await deleteDoc(doc(db, edit.from, edit.id));   /* ... then remove */
  await fileContact(edit.id, target, merged.number);
  edit.from = target; edit.data = merged;
  showLink(edit.id, merged.number, text);
}

{
  const p = new URLSearchParams(location.search);
  if (p.get('edit') && EDITABLE.includes(p.get('from'))) loadForEdit(p.get('edit'), p.get('from'));
}

btn.addEventListener('click', async () => {
  const q = window.KC_quote;
  if(!q){ show('Build an estimate first — nothing to send yet.', true); url.value = ''; return; }
  /* Business name is required for every non-residential type. Checked here, not
     via the browser's form validation, because Send is a plain button outside a
     submitting form — nothing would enforce required on its own. */
  if (val('eType') !== 'Residential' && !val('eBiz')) {
    show('Add the business name before sending.', true);
    url.value = '';
    const b = $('eBiz'); if (b) { b.focus(); }
    return;
  }

  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    if (edit) { await saveEdit(q); return; }

    /* Next quote number, Q-1001 onward. A transaction so two sends can't share a number. */
    const n = await runTransaction(db, async (tx) => {
      const ref = doc(db, 'meta', 'counters');
      const snap = await tx.get(ref);
      const next = (snap.exists() && snap.data().quote ? snap.data().quote : 1000) + 1;
      tx.set(ref, { quote: next }, { merge: true });
      return next;
    });
    const id = randomId(), number = 'Q-' + n;

    await setDoc(doc(db, 'quotes', id), Object.assign({
      number, status: 'sent',
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 30 * 864e5)
    }, fromForm(q)));
    await fileContact(id, 'quotes', number);

    const sent = showLink(id, number, 'Saved as ' + number + '. Link is good for 30 days unless approved.');
    askHowToSend(number, sent.link, sent.body);
  } catch (e) {
    console.error(e);
    show('Could not save — ' + (e && e.message ? e.message : 'check your connection') + '.', true);
    url.value = '';
  } finally {
    btn.disabled = false; btn.textContent = edit ? 'Save changes' : 'Send Estimate';
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
  if(e.target.closest('[data-clear="all"]')){
    box.hidden = true; url.value = '';
    /* A new estimate starts with no customer or lead attached. */
    if ($('eCustId')) $('eCustId').value = '';
    if ($('eLeadId')) $('eLeadId').value = '';
    if ($('eCustTag')) $('eCustTag').hidden = true;
    /* New while editing leaves edit mode, so the next Send makes a fresh quote. */
    if(edit){ edit = null; history.replaceState(null, '', location.pathname); btn.textContent = 'Send Estimate'; }
    if(banner){ banner.remove(); banner = null; }
    if(backBtn){ backBtn.remove(); backBtn = null; }
  }
});
