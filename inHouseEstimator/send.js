/* Send Estimate — stage one: save the quote to Firestore and hand back a link.
   The link opens quote.html (stage two). Unapproved quotes expire after 30 days. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, doc, getDoc, getDocFromServer, setDoc, updateDoc, deleteDoc, runTransaction, serverTimestamp, Timestamp,
         collection, query, where, limit, getDocs, deleteField }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFunctions, httpsCallable }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js";

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
/* Street with the Apt / Unit box on the end ("123 Main St #4B"); see kcStreet in index.html. */
const streetVal = () => (window.kcStreet ? window.kcStreet('eAddr') : val('eAddr'));
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

/* Reads the estimate back from the server (not the phone's copy). No match = not saved. */
async function confirmSaved(col, id, number){
  const s = await getDocFromServer(doc(db, col, id));
  if (!s.exists() || s.data().number !== number) throw new Error('could not confirm it saved, try again');
}

/* Everything that comes from the form. Used for new quotes and for edits.
   "form" is the snapshot of choices that lets Edit reopen the estimate later. */
function fromForm(q){
  return {
    customer: {
      name: val('eName'), phone: val('ePhone'), email: val('eEmail'), type: val('eType'),
      business: val('eBiz'),
      street: streetVal(), city: val('eCity'), state: val('eState'), zip: val('eZip'),
      textOk: !!($('eTextOk') || {}).checked, specialsOk: !!($('eSpecialsOk') || {}).checked
    },
    lines: JSON.parse(JSON.stringify(q.lines)),
    subtotal: q.subtotal, discount: q.discount, discountLabel: q.discountLabel,
    freeLines: q.freeLines || [], freeTotal: q.freeTotal || 0,   /* "Free pet treatment × 2" etc. */
    feeWaived: !!q.feeWaived,   /* no 3% card fee on this one; carries to the invoice */
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
  return { link, body };   /* no link box anymore: Save confirms, then the Dashboard */
}

/* After a new estimate saves: offer text or email, then go to the Dashboard.
   Closing the dialog any way -- button, X, Esc, backdrop -- lands on the Dashboard.
   Same as the Dashboard buttons: Text it = from the business line (smsSend), Email it =
   straight from israel@ (sendEmail). On a phone there's also "Text from my phone". */
const fns = getFunctions(app, 'us-central1');
const smsSendFn = httpsCallable(fns, 'smsSend'), sendEmailFn = httpsCallable(fns, 'sendEmail');

function askHowToSend(id, number, link, body){
  const dlg = $('sendDlg');
  if (!dlg || !dlg.showModal) { location.href = './dashboard.html'; return; }

  const phone = val('ePhone').replace(/\D/g, '');
  const email = val('eEmail');
  const sms = $('sendDlgSms'), mail = $('sendDlgMail'), mine = $('sendDlgMine'), sub = $('sendDlgSub');
  const onPhone = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  $('sendDlgTtl').textContent = 'Saved as ' + number;
  sub.textContent = 'Send it to the customer, or close to go to the Dashboard.';

  /* Only offer a route we actually have a destination for. */
  sms.hidden = !phone;
  mail.hidden = !email;
  if (mine) {
    mine.hidden = !(phone && onPhone);
    const sep = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? '&' : '?';
    mine.href = 'sms:' + phone + sep + 'body=' + encodeURIComponent(body);
    mine.addEventListener('click', () => setTimeout(() => dlg.close(), 400), { once: true });
  }
  if (!phone && !email) sub.textContent = 'No phone or email on the estimate, so there is nobody to send it to. The link is on the Dashboard.';
  /* The job sheet is ready as soon as the estimate is saved: rooms and areas already on it. */
  const js = $('sendDlgJs');
  if (js) js.href = './job-sheet.html?id=' + encodeURIComponent(id);

  /* One tap sends; the box stays open so you can do the other one too. */
  const sendVia = (a, label, fn) => a.onclick = async (e) => {
    e.preventDefault();
    if (a.getAttribute('aria-disabled') === 'true') return;
    a.setAttribute('aria-disabled', 'true'); a.textContent = 'Sending\u2026';
    try {
      await fn();
      a.textContent = label + ' \u2713';
      sub.textContent = 'Sent. Close to go to the Dashboard.';
    } catch (err) {
      a.removeAttribute('aria-disabled'); a.textContent = label === 'Texted' ? 'Text it' : 'Email it';
      sub.textContent = (label === 'Texted' ? 'Text' : 'Email') + ' didn\u2019t send. ' + ((err && err.message) || 'Try again.');
    }
  };
  sendVia(sms, 'Texted', () => smsSendFn({ to: phone, body }));
  sendVia(mail, 'Emailed', () => sendEmailFn({ to: email, name: val('eName'), kind: 'estimate', docId: id, link }));

  const leave = () => { location.href = './dashboard.html'; };
  dlg.addEventListener('close', leave, { once: true });
  $('sendDlgX').onclick = () => dlg.close();
  /* Click outside the sheet closes it. */
  dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };

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
  const addr = { street: streetVal(), city: val('eCity'), state: val('eState'), zip: val('eZip') };
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
      /* A ticked OK to text / specials is remembered on the customer (a yes is never taken back here).
         Each on its own, so a refused field can't stop the rest. */
      if (($('eTextOk') || {}).checked && d.smsConsent !== true)
        await setDoc(hit.ref, { smsConsent: true }, { merge: true }).catch(e => console.error('Texting OK not saved:', e));
      if (($('eSpecialsOk') || {}).checked && d.marketingConsent !== true)
        await setDoc(hit.ref, { marketingConsent: true }, { merge: true }).catch(e => console.error('Specials OK not saved:', e));
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
  const addr = { street: streetVal(), city: val('eCity'), state: val('eState'), zip: val('eZip') };
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
let edit = null, banner = null, backBtn = null, offBtn = null;

/* "Take off calendar": clears the job date on an accepted estimate (same as the
   Calendar page's button). The job stays in Approved and shows under Needs Date. */
async function takeOffCalendar(){
  if (!edit || edit.from !== 'acceptedQuotes') return;
  offBtn.disabled = true; offBtn.textContent = 'Taking off…';
  try {
    await updateDoc(doc(db, 'acceptedQuotes', edit.id),
      { scheduledDate: deleteField(), scheduledTime: deleteField(), scheduledUpdatedAt: serverTimestamp() });
  } catch (e) {
    console.error(e);
    show('Could not take it off the calendar — ' + (e && e.message ? e.message : 'check your connection') + '.', true);
    offBtn.disabled = false; offBtn.textContent = 'Take off calendar';
    return;
  }
  ['eWhen', 'eWhenTime'].forEach(fid => {
    const el = $(fid); if (!el) return;
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  delete edit.data.scheduledDate; delete edit.data.scheduledTime;
  offBtn.remove(); offBtn = null;
  show('Taken off the calendar. It\u2019s now under Needs Date.');
}

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
    location.href = './dashboard.html';   /* back to the Dashboard to see it in Estimates */
    return;
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

async function loadForEdit(id, from, copy){
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
    [['eName', c.name], ['ePhone', c.phone], ['eEmail', c.email], ['eAddr', c.street], ['eUnit', ''],
     ['eCity', c.city], ['eZip', c.zip], ['eNotes', d.notes], ['eWhen', d.scheduledDate], ['eWhenTime', d.scheduledTime]].forEach(([fid, v]) => {
      const el = $(fid); if (!el) return;
      el.value = v || '';
      el.dispatchEvent(new Event('input', { bubbles: true }));   /* keeps the letterhead in sync */
    });
    if ($('eTextOk')) $('eTextOk').checked = c.textOk === true;
    if ($('eSpecialsOk')) $('eSpecialsOk').checked = c.specialsOk === true;
    if ($('eType') && c.type) { $('eType').value = c.type; $('eType').dispatchEvent(new Event('change', { bubbles: true })); }
    /* After the change event, since that handler clears the field when the type
       is Residential — setting it earlier would be wiped. */
    if ($('eBiz') && c.business) $('eBiz').value = c.business;

    if (d.form) window.KC_restore(d.form);
    /* The saved doc decides the card fee, so a Dashboard "Waive fee" tap isn't undone by editing. */
    if ($('waiveFee')) { $('waiveFee').checked = !!d.feeWaived; $('waiveFee').dispatchEvent(new Event('change', { bubbles: true })); }
    if (!copy) edit = { id, from, data: d,   /* what the form opened with, so saveEdit can tell what was actually changed here */
      when: d.scheduledDate || '', whenTime: d.scheduledTime || '', fee: !!d.feeWaived };
    /* Keep the estimate filed under the same customer or lead as before. */
    if ($('eCustId')) $('eCustId').value = d.customerId || '';
    if ($('eLeadId')) $('eLeadId').value = d.leadId || '';
    if ($('eCustTag')) { $('eCustTag').textContent = 'Existing customer'; $('eCustTag').hidden = !d.customerId; }

    /* Copy job (Dashboard, paid invoices): same customer and rooms at today's prices, no date,
       not in edit mode, so Send Estimate makes a brand-new estimate. The paid invoice is untouched. */
    if (copy) {
      ['eWhen', 'eWhenTime'].forEach(fid => {
        const el = $(fid); if (!el) return;
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      if ($('waiveFee')) { $('waiveFee').checked = false; $('waiveFee').dispatchEvent(new Event('change', { bubbles: true })); }
      history.replaceState(null, '', location.pathname);
      banner.textContent = 'Copy of ' + (d.number || 'this job') + ' for the same customer. Pick a date, check it over, then Send Estimate to make a new estimate.' +
        (d.form ? '' : ' It has no saved form, so add the rooms again.');
      return;
    }

    let note = 'Editing ' + (d.number || 'this estimate') + '.';
    if (!d.form) {
      note += ' It has no saved form, so the estimate below is blank. Rebuild it before saving.';
    } else {
      const now = window.KC_quote ? window.KC_quote.total : 0, was = Number(d.total) || 0;
      if (Math.abs(now - was) >= 0.01) note += ' Heads up: it now totals $' + now.toFixed(2) + ' but was saved at $' + was.toFixed(2) + '. Check it before saving.';
    }
    banner.textContent = note;
    btn.textContent = 'Save changes';
    /* A quote updated from a job sheet: a way back to its job sheet. Saving here updates the job sheet
       (it rebuilds from this estimate the next time it opens); anything taken off here stays on the
       job sheet at $0, not billed, with its photos and notes. */
    if (d.fromJobSheet || d.revisionOf) {
      const jsId = d.revisionOf || id;
      banner.textContent = note + ' Saving updates its job sheet; anything taken off here stays on the job sheet at $0, not billed.' +
        (d.onsite ? ' Rooms added on the job sheet aren’t in this form.' : '');
      const jl = document.createElement('a');
      jl.href = './job-sheet.html?id=' + encodeURIComponent(jsId);
      jl.textContent = 'Open job sheet ›';
      jl.style.cssText = 'display:inline-block;margin:6px 0 10px;color:#E3B64A;font-weight:600';
      banner.after(jl);
    }
    /* Unpaid invoice or accepted estimate: offer a way back to Estimates. */
    if (from === 'invoices' || from === 'acceptedQuotes') {
      backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = btn.className;
      backBtn.id = 'eBackBtn';
      backBtn.textContent = 'Return to estimates';
      backBtn.style.cssText = 'margin-top:10px;background:transparent;color:#E3B64A;border:1px solid #E3B64A';
      btn.after(backBtn);
      backBtn.addEventListener('click', returnToEstimates);
    }
    /* Accepted estimate with a job date: offer a way to take it off the calendar. */
    if (from === 'acceptedQuotes' && d.scheduledDate) {
      offBtn = document.createElement('button');
      offBtn.type = 'button';
      offBtn.className = btn.className;
      offBtn.id = 'eOffBtn';
      offBtn.textContent = 'Take off calendar';
      offBtn.style.cssText = 'margin-top:10px;background:transparent;color:#ff6b6b;border:1px solid #ff6b6b';
      (backBtn || btn).after(offBtn);
      offBtn.addEventListener('click', takeOffCalendar);
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
  /* Start from the doc as it is NOW, not as it was when this page opened: job sheet rooms,
     photos, on-site prices, a calendar date change or a Dashboard fee waive made since then
     would otherwise be put back to the old copy. Only the form's own fields change. */
  const fresh = await getDocFromServer(doc(db, edit.from, edit.id));
  if (!fresh.exists()) throw new Error('This estimate moved or was deleted since you opened it. Go back to the Dashboard, refresh and open it again');
  edit.data = fresh.data();
  const merged = Object.assign({}, edit.data, fromForm(q), { updatedAt: serverTimestamp() });
  /* Date / card fee not touched in this form: keep whatever is saved now (e.g. moved on the calendar). */
  if (val('eWhen') === edit.when && val('eWhenTime') === edit.whenTime) {
    merged.scheduledDate = edit.data.scheduledDate || '';
    merged.scheduledTime = edit.data.scheduledTime || '';
  }
  if (!!q.feeWaived === edit.fee) merged.feeWaived = !!edit.data.feeWaived;
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
  await confirmSaved(target, edit.id, merged.number);
  edit.from = target; edit.data = merged;
  edit.when = merged.scheduledDate || ''; edit.whenTime = merged.scheduledTime || ''; edit.fee = !!merged.feeWaived;
  showLink(edit.id, merged.number, text);
}

{
  const p = new URLSearchParams(location.search);
  if (p.get('edit') && EDITABLE.includes(p.get('from'))) loadForEdit(p.get('edit'), p.get('from'), p.get('copy') === '1');
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
  let leaving = false;
  try {
    if (edit) {
      await saveEdit(q);   /* throws unless the server copy checks out */
      leaving = true; btn.textContent = 'Saved \u2713';
      setTimeout(() => { location.href = './dashboard.html'; }, 900);
      return;
    }

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
    await confirmSaved('quotes', id, number);

    const sent = showLink(id, number, 'Saved as ' + number + '. Link is good for 30 days unless approved.');
    leaving = true; btn.textContent = 'Saved \u2713';
    askHowToSend(id, number, sent.link, sent.body);
  } catch (e) {
    console.error(e);
    show('Could not save — ' + (e && e.message ? e.message : 'check your connection') + '.', true);
    url.value = '';
  } finally {
    if (!leaving) { btn.disabled = false; btn.textContent = edit ? 'Save changes' : 'Send Estimate'; }
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
    if(offBtn){ offBtn.remove(); offBtn = null; }
  }
});
