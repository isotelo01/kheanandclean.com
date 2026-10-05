/* ============================================================================
   KHEAN & CLEAN — SHARED QUOTE FORM  (behaviour + markup)
   ----------------------------------------------------------------------------
   This is the ONLY copy of the quote form on the whole site. All six pages
   load this file. Change it once and every page updates.

   HOW A PAGE USES IT
   ------------------
     <link rel="stylesheet" href="quote-form.css">
     ...
     <div data-kc-quote data-service="Carpet cleaning"></div>
     ...
     <script src="quote-form.js" defer></script>

   Options, all optional, set as attributes on the mount div:
     data-service   pre-ticks that service in the checklist
     data-estimator URL of the full estimator; shows a link under the form
     data-title     replaces the heading text
     data-sub       replaces the small line under the heading

   >>> BEFORE THIS WORKS: create a free account at web3forms.com and paste
   >>> your access key into ACCESS_KEY below. This is the only place on the
   >>> site it needs to go for the quote form.
   ============================================================================ */
(function () {
  'use strict';

  var ACCESS_KEY    = '2e49144b-d36b-4e13-bec4-aad215f7abc6';
  var FORM_ENDPOINT = 'https://api.web3forms.com/submit';

  var PHONE_DISPLAY = '(916) 767-2520';
  var PHONE_HREF    = 'tel:+19167672520';
  /* Photo hand-off targets. Neither link can attach anything — they only open
     the app with the wording prefilled; the customer adds the photos. */
  var EMAIL_DISPLAY = 'kheanandclean@gmail.com';
  var PHOTO_SUBJECT = 'Photos for my Khean & Clean estimate';
  var SMS_HREF      = 'sms:+19167672520?&body=' + encodeURIComponent(PHOTO_SUBJECT);
  var MAIL_HREF     = 'mailto:' + EMAIL_DISPLAY + '?subject=' + encodeURIComponent(PHOTO_SUBJECT);

  /* Firebase: the same project, SDK version and settings as quick-quote.html. Each request
     goes on the Leads page, and its photos go to Storage under quick-quote-photos/ (the only
     folder the Leads page shows photos from). Loaded only when someone presses Send. */
  var FB_VERSION = '10.12.0';
  var FB_CONFIG  = {
    apiKey:            'AIzaSyCC1AXsqeWVBS792gor4BA6MLmz1yLypqg',
    authDomain:        'khean-estimator-78f3e.firebaseapp.com',
    projectId:         'khean-estimator-78f3e',
    storageBucket:     'khean-estimator-78f3e.firebasestorage.app',
    messagingSenderId: '581692353222',
    appId:             '1:581692353222:web:21f62f057ac5506bbb45c7'
  };
  /* Photo limits, same as quick-quote.html. */
  var MAX_FILES = 10, MAX_BYTES = 10 * 1024 * 1024, MAX_EDGE = 2400, JPEG_QUALITY = 0.85;

  /* The services checklist. Add or remove a line here and every page follows. */
  var SERVICES = [
    'Carpet cleaning',
    'Tile & grout',
    'Upholstery',
    'Area rugs',
    'Pet treatment',
    'Stain treatment',
    'Hardwood/LVP',
    'Carpet stretching',
    'Natural stone',
    'Other'
  ];

  var PROPERTY_TYPES = ['Turnover Clean', 'Move-Out Restorative Clean', 'Pre-Listing Prep', 'Recurring Maintenance', 'Commercial property', 'Other'];

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* --------------------------------------------------------------------
     MARKUP — one copy, built per mount point.
     -------------------------------------------------------------------- */
  function buildMarkup(p, opts) {
    var checks = SERVICES.map(function (s) {
      var on = opts.service && opts.service.toLowerCase() === s.toLowerCase();
      return '<label class="kcq__check"><input type="checkbox" name="services" value="' +
        esc(s) + '"' + (on ? ' checked' : '') + '> ' + esc(s) + '</label>';
    }).join('');

    var propOpts = PROPERTY_TYPES.map(function (t) {
      return '<option>' + esc(t) + '</option>';
    }).join('');

    var estLink = opts.estimator
      ? '<p class="kcq__estLink">Want to work out a number yourself? ' +
        '<a href="' + esc(opts.estimator) + '">Use the in-depth estimating tool</a>.</p>'
      : '';

    return '' +
    '<div class="kcq" id="' + p + 'Wrap">' +
      /* Icon-only controls, top-right of the card. Exactly one is ever visible:
         the pencil when the form is collapsed into its summary, the clear when
         it is open. Both are real buttons with aria-labels, since there is no
         visible text to name them. */
      '<div class="kcq__tools">' +
        '<button type="button" class="kcq__tool" id="' + p + 'Edit" title="Edit your answers" aria-label="Edit your answers" hidden>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l4 4"/>' +
          '</svg>' +
        '</button>' +
        '<button type="button" class="kcq__tool" id="' + p + 'Clear" title="Clear the form" aria-label="Clear the form">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/>' +
            '<path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<p class="kcq__ttl">' + esc(opts.title) + '</p>' +
      '<p class="kcq__sub">' + esc(opts.sub) + '</p>' +

      '<form id="' + p + 'Form" novalidate>' +

        '<div class="kcq__row">' +
          '<div class="kcq__field">' +
            '<label for="' + p + 'Name">Company name</label>' +
            '<input id="' + p + 'Name" name="name" type="text" autocomplete="name" required aria-required="true">' +
            '<span class="kcq__err" data-for="' + p + 'Name"></span>' +
          '</div>' +
          '<div class="kcq__field">' +
            '<label for="' + p + 'Phone">Phone</label>' +
            '<input id="' + p + 'Phone" name="phone" type="tel" autocomplete="tel" required aria-required="true">' +
            '<span class="kcq__err" data-for="' + p + 'Phone"></span>' +
          '</div>' +
        '</div>' +

        '<div class="kcq__row">' +
          '<div class="kcq__field">' +
            '<label for="' + p + 'Email">Email</label>' +
            '<input id="' + p + 'Email" name="email" type="email" autocomplete="email" required aria-required="true">' +
            '<span class="kcq__err" data-for="' + p + 'Email"></span>' +
          '</div>' +
          '<div class="kcq__field">' +
            '<label for="' + p + 'Type">Job type</label>' +
            '<select id="' + p + 'Type" name="property_type" required aria-required="true">' +
              propOpts +
            '</select>' +
            '<span class="kcq__err" data-for="' + p + 'Type"></span>' +
          '</div>' +
        '</div>' +

        '<div id="' + p + 'Summary" class="kcq__summary" hidden></div>' +

        '<div id="' + p + 'Expand" class="kcq__expand">' +
          '<div class="kcq__expandInner">' +

            '<div class="kcq__field">' +
              '<label for="' + p + 'Addr">Property address</label>' +
              '<input id="' + p + 'Addr" name="address" type="text" autocomplete="street-address" placeholder="Street and city">' +
              '<span class="kcq__err" data-for="' + p + 'Addr"></span>' +
            '</div>' +

            '<fieldset class="kcq__field">' +
              '<legend>Services needed</legend>' +
              '<div class="kcq__checks">' + checks + '</div>' +
              '<span class="kcq__err" data-for="' + p + 'Services"></span>' +
            '</fieldset>' +

            /* When would you like this done? The plain date box becomes a "See available days"
               button once the open days load (day-picker.js), same as quick-quote.html. */
            '<div class="kcq__field">' +
              '<label for="' + p + 'When">When would you like this done? (optional)</label>' +
              '<div class="qWhen">' +
                '<input id="' + p + 'When" name="when" type="date" autocomplete="off" aria-label="Preferred date">' +
              '</div>' +
              '<div id="' + p + 'Open" class="jobCal" hidden></div>' +
            '</div>' +

            '<div class="kcq__field">' +
              '<label for="' + p + 'Msg">Total home square footage or rooms needing cleaning</label>' +
              '<textarea id="' + p + 'Msg" name="message" rows="4" ' +
                'placeholder="e.g. three bedrooms and a hallway, one pet stain in the living room"></textarea>' +
            '</div>' +

            /* Add photos: Take photo / Choose photo, with a preview and an X on each,
               same as quick-quote.html. They upload when the request is sent. */
            '<div class="kcq__field">' +
              '<label for="' + p + 'Photos">Add photos (optional)</label>' +
              '<input id="' + p + 'Photos" type="file" accept="image/*" multiple hidden>' +
              '<input id="' + p + 'Camera" type="file" accept="image/*" capture="environment" hidden>' +
              '<div class="kcq__photoZone">' +
                '<p class="kcq__photoHint">A quick photo helps us quote it right.</p>' +
                '<div class="kcq__photoBtns">' +
                  '<button type="button" id="' + p + 'CameraBtn" class="kcq__photoBtn kcq__photoBtn--cam"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>Take photo</button>' +
                  '<button type="button" id="' + p + 'PickBtn" class="kcq__photoBtn kcq__photoBtn--pick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Choose photo</button>' +
                '</div>' +
              '</div>' +
              '<div id="' + p + 'Preview" class="kcq__photoPreview"></div>' +
            '</div>' +

            /* Photo hand-off, mirroring the home page block. Phones get the sms
               link, desktops the mailto — see the 901px switch in quote-form.css. */
            '<p class="kcq__photos">' +
              '<a class="kcq__photo kcq__photo--sms" href="' + SMS_HREF + '" ' +
                'aria-label="Text us photos at ' + PHONE_DISPLAY + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                  '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' +
                '</svg>' +
                '<span>Text us photos<span class="kcq__photoSub">' + PHONE_DISPLAY + '</span></span>' +
              '</a>' +
              '<a class="kcq__photo kcq__photo--mail" href="' + MAIL_HREF + '" ' +
                'aria-label="Email us photos at ' + EMAIL_DISPLAY + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                  '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>' +
                  '<polyline points="22,6 12,13 2,6"/>' +
                '</svg>' +
                '<span>Email us photos<span class="kcq__photoSub">' + EMAIL_DISPLAY + '</span></span>' +
              '</a>' +
            '</p>' +

            '<button type="button" class="kcq__summarize" id="' + p + 'Summarize">Summarize</button>' +

          '</div>' +
        '</div>' +

        '<input type="checkbox" name="botcheck" class="kcq__hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<input type="hidden" name="service" value="' + esc(opts.service || '') + '">' +
        '<input type="hidden" name="page" value="' + esc(location.pathname.split('/').pop() || 'index.html') + '">' +

        /* Text consent (A2P 10DLC): a Yes / No choice, neither picked to start. One must be picked
           to send, but "No thanks" still sends the quote, so consent itself is never required.
           The promo checkbox under it is optional; unticked = No. Same wording as the homepage. */
        '<div class="kcq__consent" role="radiogroup" aria-labelledby="' + p + 'SmsQ" aria-describedby="' + p + 'SmsWhat" aria-required="true">' +
          '<p class="kcq__consentQ" id="' + p + 'SmsQ">Can we text you about your quote?</p>' +
          '<p class="kcq__consentWhat" id="' + p + 'SmsWhat">If you say yes, Khean &amp; Clean will text you quote links, appointment confirmations and reminders. Choose Yes or No to send. Either way, you get your quote.</p>' +
          '<div class="kcq__consentOpts">' +
            '<label class="kcq__check" for="' + p + 'Sms"><input type="radio" id="' + p + 'Sms" name="sms_consent" value="Yes" autocomplete="off"> Yes, text me</label>' +
            '<label class="kcq__check" for="' + p + 'SmsNo"><input type="radio" id="' + p + 'SmsNo" name="sms_consent" value="No" autocomplete="off"> No thanks</label>' +
          '</div>' +
          '<span class="kcq__err" data-for="' + p + 'Sms"></span>' +
          '<label class="kcq__promo" for="' + p + 'Promo"><input type="checkbox" id="' + p + 'Promo" name="marketing_consent" value="Yes" autocomplete="off"> Also text me occasional specials &amp; promotions (optional)</label>' +
          '<p class="kcq__consentFine">Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out or HELP for help. Consent isn\'t required to get a quote. <a href="privacy.html">Privacy Policy</a> &middot; <a href="sms-terms.html">SMS Terms</a></p>' +
        '</div>' +

        '<button class="kcq__submit" type="submit" id="' + p + 'Submit">Send quote request</button>' +
        '<p class="kcq__fine">We reply during business hours, 9am&ndash;9pm daily. ' +
          'For emergency water removal, call <a href="' + PHONE_HREF + '">' + PHONE_DISPLAY + '</a> ' +
          'any time, day or night.</p>' +
        '<p class="kcq__status" id="' + p + 'Status" role="status" aria-live="polite"></p>' +
      '</form>' +
      estLink +
    '</div>' +

    '<div class="kcq kcq__done" id="' + p + 'Done" hidden>' +
      '<div class="kcq__doneTick">' +
        '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" ' +
          'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
      '</div>' +
      '<h3>Request received.</h3>' +
      '<p>We will come back to you with a real figure, usually the same day. ' +
        'If it is urgent, call and we will pick up.</p>' +
      '<a class="kcq__doneCall" href="' + PHONE_HREF + '">Call ' + PHONE_DISPLAY + '</a>' +
    '</div>' +

    /* Clear confirmation. Ported from index.html's #qClearDlg so the clear
       button shows the emerald panel instead of the browser's confirm().
       Ids carry the same instance prefix as every other node above. */
    '<dialog id="' + p + 'ClearDlg" class="kcq__clearDlg" aria-labelledby="' + p + 'ClearTtl">' +
      '<p class="kcq__clearDlg__ttl" id="' + p + 'ClearTtl">Clear the form and start over?</p>' +
      '<p class="kcq__clearDlg__sub">This cannot be undone.</p>' +
      '<div class="kcq__clearDlg__acts">' +
        '<button type="button" class="kcq__clearDlg__btn" data-kcqclear="yes">Yes</button>' +
        '<button type="button" class="kcq__clearDlg__btn kcq__clearDlg__cancel" data-kcqclear="no">No</button>' +
      '</div>' +
    '</dialog>';
  }

  /* --------------------------------------------------------------------
     WIRING — one instance.
     -------------------------------------------------------------------- */
  var seq = 0;

  /* "See available days": day-picker.js holds the calendar (copied verbatim from the
     homepage). Loaded once, from the same folder as this file, unless the page has it. */
  var dpState = 0, dpWaiters = [];   // 0 not loaded, 1 loading, 2 done (loaded or failed)
  function loadDayPicker(cb) {
    if (window.kcDayPicker || dpState === 2) { cb(); return; }
    dpWaiters.push(cb);
    if (dpState === 1) return;
    dpState = 1;
    var s = document.createElement('script');
    s.src = 'day-picker.js';
    s.onload = s.onerror = function () { dpState = 2; var w = dpWaiters; dpWaiters = []; w.forEach(function (f) { f(); }); };
    document.head.appendChild(s);
  }

  /* Firebase, loaded on the first Send. import() is wrapped so a very old browser that
     cannot load it still gets a working form (the email still goes out). */
  var fbReady = null;
  function loadModule(u) {
    try { return (new Function('u', 'return import(u)'))(u); }
    catch (e) { return Promise.reject(e); }
  }
  function firebase() {
    if (!fbReady) {
      var base = 'https://www.gstatic.com/firebasejs/' + FB_VERSION + '/';
      fbReady = Promise.all([
        loadModule(base + 'firebase-app.js'),
        loadModule(base + 'firebase-storage.js'),
        loadModule(base + 'firebase-firestore.js')
      ]).then(function (m) {
        var app = m[0].getApps().length ? m[0].getApp() : m[0].initializeApp(FB_CONFIG);
        return { st: m[1], fs: m[2], storage: m[1].getStorage(app), db: m[2].getFirestore(app) };
      });
      fbReady.catch(function () { fbReady = null; });   // a failed load is tried again on the next Send
    }
    return fbReady;
  }

  /* Shrinks a phone photo to MAX_EDGE on its long side and re-encodes it as JPEG, as on
     quick-quote.html. Anything that is not an image, or is already small, passes through. */
  function resizePhoto(file) {
    return new Promise(function (resolve) {
      if (!/^image\//.test(file.type) || file.size < 400 * 1024) { resolve(file); return; }
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.width, h = img.height;
        if (Math.max(w, h) > MAX_EDGE) { var k = MAX_EDGE / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        c.toBlob(function (blob) { resolve(blob && blob.size < file.size ? blob : file); }, 'image/jpeg', JPEG_QUALITY);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };   // unreadable: upload what we were given
      img.src = url;
    });
  }

  /* Uploads the photos one at a time and hands back their storage paths. One failed or
     oversized photo is skipped; the rest are kept. Same folder and naming as quick-quote.html. */
  function uploadPhotos(fb, list, leadKey) {
    var paths = [];
    return list.slice(0, MAX_FILES).reduce(function (chain, f, i) {
      return chain.then(function () { return resizePhoto(f); }).then(function (shrunk) {
        if (shrunk.size > MAX_BYTES) return;
        var safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '') + '.jpg';
        var path = 'quick-quote-photos/' + leadKey + '/' + Date.now() + '_' + i + '_' + safe;
        return fb.st.uploadBytes(fb.st.ref(fb.storage, path), shrunk, { contentType: 'image/jpeg' })
          .then(function (snap) { paths.push(snap.ref.fullPath); })
          .catch(function (err) { if (window.console) console.error('Photo upload failed: ' + f.name, err); });
      });
    }, Promise.resolve()).then(function () { return paths; });
  }

  /* Puts the request on the Leads page, as quick-quote.html does. If the database won't take
     the texting answers, the lead still goes in, with any Yes written at the top of its
     message instead (same wording the Leads page reads). */
  function saveLead(fb, lead) {
    var row = Object.assign({}, lead, { status: 'new', source: 'quick-quote', createdAt: fb.fs.serverTimestamp() });
    var leads = fb.fs.collection(fb.db, 'leads');
    return fb.fs.addDoc(leads, row).then(function (ref) { return ref.id; }, function (err) {
      if (!err || err.code !== 'permission-denied' || !('smsConsent' in lead)) throw err;
      var plain = Object.assign({}, row);
      delete plain.smsConsent; delete plain.marketingConsent;
      if (lead.marketingConsent) plain.message = 'OK to text specials: yes' + (plain.message ? '\n\n' + plain.message : '');
      if (lead.smsConsent) plain.message = 'OK to text: yes' + (plain.message ? '\n\n' + plain.message : '');
      return fb.fs.addDoc(leads, plain).then(function (ref) { return ref.id; });
    });
  }

  /* ---- remembered across pages ----
     Everything typed into the quick quote is kept in this browser under one
     shared key ("kcQuote"), and every page's quick quote reads it back on load —
     so details entered on the homepage appear here and vice versa. The homepage
     form (index.html) reads and writes the very same key. Cleared on send. */
  var STORE_KEY = 'kcQuotePM';
  function store() { try { return window.localStorage; } catch (e) { return null; } }
  function readSaved() {
    var st = store(); if (!st) return null;
    try { var d = JSON.parse(st.getItem(STORE_KEY) || 'null'); return (d && typeof d === 'object') ? d : null; }
    catch (e) { return null; }
  }
  function writeSaved(d) { var st = store(); if (st) { try { st.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) {} } }
  function clearSaved()  { var st = store(); if (st) { try { st.removeItem(STORE_KEY); } catch (e) {} } }

  function init(mount) {
    var p = 'kcq' + (++seq) + '_';

    var opts = {
      service:   mount.getAttribute('data-service') || '',
      estimator: mount.getAttribute('data-estimator') || '',
      title:     mount.getAttribute('data-title') || 'Quick Online Quote',
      sub:       mount.getAttribute('data-sub') || 'Free \u00b7 No obligation'
    };

    mount.innerHTML = buildMarkup(p, opts);

    var $ = function (suffix) { return document.getElementById(p + suffix); };

    var wrap      = $('Wrap'),
        form      = $('Form'),
        done      = $('Done'),
        statusEl  = $('Status'),
        submit    = $('Submit'),
        expand    = $('Expand'),
        summary   = $('Summary'),
        summarize = $('Summarize'),
        nameEl    = $('Name'),
        phoneEl   = $('Phone'),
        emailEl   = $('Email'),
        typeEl    = $('Type'),
        addrEl    = $('Addr'),
        msgEl     = $('Msg'),
        editBtn   = $('Edit'),
        clearBtn  = $('Clear');

    /* Photos, the preferred day and its calendar (same as quick-quote.html). */
    var whenEl   = $('When'),
        openBox  = $('Open'),
        photosIn = $('Photos'),
        cameraIn = $('Camera'),
        preview  = $('Preview'),
        files    = [],     // the photos chosen: picking adds, the X removes, Send uploads these
        picker   = null;   // the "See available days" calendar, once day-picker.js has loaded

    /* The calendar holds YYYY-MM-DD; this hands back MM/DD/YY for the email, lead and summary,
       plus AM or PM when it was tapped from the calendar. Same as quick-quote.html. */
    function whenText() {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(whenEl.value), s = picker ? picker.slot() : '';
      return m ? m[2] + '/' + m[3] + '/' + m[1].slice(2) + (s ? ' ' + (s === 'all' ? 'All day' : s.toUpperCase()) : '') : '';
    }

    /* ---- error helpers ---- */
    function setErr(suffix, msg) {
      var el   = $(suffix),
          slot = mount.querySelector('.kcq__err[data-for="' + p + suffix + '"]');
      if (slot) slot.textContent = msg || '';
      if (el) el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    function clearErrs() {
      ['Name', 'Phone', 'Email', 'Addr', 'Type', 'Services', 'Sms']
        .forEach(function (s) { setErr(s, ''); });
    }

    /* ---- expand / collapse ---- */
    /* One control at a time: pencil while collapsed (its job is to reopen),
       bin while open (its job is to wipe). Driven off the single source of
       truth — whether the expand panel carries is-open — so the buttons
       cannot drift out of step with the form. */
    function syncTools() {
      var open = expand.classList.contains('is-open');
      if (editBtn)  editBtn.hidden  = open;
      if (clearBtn) clearBtn.hidden = !open;
    }
    function openUp() {
      expand.classList.add('is-open');
      if (summary) summary.hidden = true;
      syncTools();
    }
    /* ---- remember / restore across pages ---- */
    function save() {
      /* carry forward the estimator breakdown written by the homepage — this
         save runs on every keystroke, so without it the structured estimate
         would be wiped the moment someone typed on a service page. */
      var prev = readSaved();
      writeSaved({
        name: nameEl.value, phone: phoneEl.value, email: emailEl.value,
        addr: addrEl.value, type: typeEl.value, msg: msgEl.value,
        services: Array.prototype.map.call(form.querySelectorAll('input[name="services"]:checked'), function (c) { return c.value; }),
        est: prev && prev.est ? prev.est : null,
        ts: Date.now()
      });
    }
    function restore() {
      var d = readSaved(); if (!d) return false;
      var touched = false;
      [['name', nameEl], ['phone', phoneEl], ['email', emailEl], ['addr', addrEl], ['type', typeEl], ['msg', msgEl]].forEach(function (pair) {
        var v = d[pair[0]], el = pair[1];
        if (!el || typeof v !== 'string' || !v) return;
        if (el.tagName === 'SELECT' && !Array.prototype.some.call(el.options, function (o) { return o.value === v; })) return;
        if (el.value.trim() && el.value !== v) return;      // never overwrite something already typed here
        el.value = v; touched = true;
      });
      if (Array.isArray(d.services)) {
        Array.prototype.forEach.call(form.querySelectorAll('input[name="services"]'), function (c) {
          if (d.services.indexOf(c.value) !== -1 && !c.checked) { c.checked = true; touched = true; }
        });
      }
      return touched;
    }
    form.addEventListener('input',  save);
    form.addEventListener('change', save);
    restore();

    // Land collapsed in the summary view — the same state the summarize button
    // produces. No validation here on purpose: whatever is saved gets rendered,
    // even a name on its own, and an empty form simply shows an empty summary.
    expand.classList.remove('is-open');
    renderSummary();
    syncTools();

    /* Opens once they have entered a name plus at least one way to reach them
       (phone or email), matching the homepage quick quote. Stays collapsed
       until then, so the card opens small. The pencil is the manual way in. */
    function maybeExpand() {
      if (expand.classList.contains('is-open')) return;
      var hasName  = nameEl  && nameEl.value.trim();
      var hasPhone = phoneEl && phoneEl.value.trim();
      var hasEmail = emailEl && emailEl.value.trim();
      if (hasName && (hasPhone || hasEmail)) openUp();
    }
    [nameEl, phoneEl, emailEl].forEach(function (el) {
      if (el) el.addEventListener('input', maybeExpand);
    });

    /* ---- summary ----
       Matches the homepage quick quote (index.html renderSummary): services
       as chips, then address, then rooms/areas or the estimate. Name, phone,
       email and property type are deliberately NOT shown here, same as the
       homepage. Nothing is truncated; empty fields are simply omitted. */
    function renderSummary() {
      if (!summary) return;
      var rows = [];

      function addRow(label, value) {
        if (!value) return;
        rows.push('<div class="kcq__sumRow">' +
                    '<span class="kcq__sumLabel">' + esc(label) + '</span>' +
                    '<span class="kcq__sumVal">' + esc(value) + '</span>' +
                  '</div>');
      }

      var svc = [];
      Array.prototype.forEach.call(
        form.querySelectorAll('input[name="services"]:checked'),
        function (el) { svc.push(el.value); }
      );
      if (svc.length) {
        rows.push('<div class="kcq__chips">' + svc.map(function (s) {
          return '<span class="kcq__chip">' + esc(s) + '</span>';
        }).join('') + '</div>');
      }

      addRow('Address',  addrEl ? addrEl.value.trim() : '');
      addRow('When',     whenText());

      /* Rooms/areas — but if this text came from the homepage estimator, show
         the same itemised breakdown the homepage shows rather than the raw
         dump. The structured copy rides along in localStorage under "est";
         if it is missing or does not match, fall back to plain text. */
      var msgVal = msgEl ? msgEl.value.trim() : '';
      var isEst  = /^ESTIMATE FROM YOUR ONLINE ESTIMATOR/.test(msgVal);
      var saved  = readSaved();
      var d      = saved && saved.est;

      if (isEst && d && d.text === msgVal) {
        var body = msgVal.replace(/^ESTIMATE FROM YOUR ONLINE ESTIMATOR\s*/, '');
        var notes = '';
        var ni = body.indexOf('\nNotes: ');
        if (ni !== -1) { notes = body.slice(ni + 8).trim(); }

        var html = d.services.map(function (sv) {
          return '<div class="qEst__svc"><div class="qEst__head"><span>' + esc(sv.label) + '</span>' +
                 '<span class="qEst__price">$' + esc(sv.cost) + '</span></div>' +
                 (sv.measure ? '<div class="qEst__meta">' + esc(sv.measure) + '</div>' : '') +
                 (sv.items && sv.items.length
                    ? '<ul class="qEst__items">' + sv.items.map(function (it) {
                        return '<li><span>' + esc(it.label) + '</span><span>' + (it.included ? 'Included' : '$' + esc(it.cost)) + '</span></li>';
                      }).join('') + '</ul>'
                    : '') +
                 '</div>';
        }).join('');
        html += '<div class="qEst__total"><span>Estimated total</span>' +
                '<span class="qEst__price">$' + esc(d.total) + '</span></div>';
        var foot = [];
        if (d.minNote) foot.push(d.minNote);
        if (d.sqft > 0) foot.push(d.sqft.toLocaleString() + ' sq ft total floor area');
        if (foot.length) html += '<div class="qEst__foot">' + esc(foot.join(' \u00b7 ')) + '</div>';

        rows.push('<div class="kcq__sumRow kcq__sumRow--full">' +
                    '<span class="kcq__sumLabel">Estimate</span>' +
                    '<span class="kcq__sumVal qEst">' + html + '</span>' +
                  '</div>');
        if (notes) addRow('Notes', notes);
      } else {
        addRow(isEst ? 'Estimate' : 'Rooms/areas', msgVal);
      }

      if (files.length) addRow('Photos', files.length + (files.length === 1 ? ' photo' : ' photos') + ' attached');

      if (rows.length) {
        summary.innerHTML = rows.join('');
        summary.hidden = false;
      } else {
        summary.innerHTML = '';
        summary.hidden = true;
      }
    }

    summarize.addEventListener('click', function () {
      expand.classList.remove('is-open');
      renderSummary();
      syncTools();
      summarize.blur();
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      wrap.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });

    /* ---- header icon controls ---- */
    if (editBtn) {
      editBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        openUp();
        editBtn.blur();
        if (nameEl) nameEl.focus();
      });
    }

    if (clearBtn) {
      /* The wipe itself, lifted unchanged out of the old click handler so
         both the dialog's Yes button and the confirm() fallback can call it. */
      var doClear = function () {
        [nameEl, phoneEl, emailEl, typeEl, addrEl, msgEl].forEach(function (el) {
          if (el) el.value = '';
        });
        Array.prototype.forEach.call(
          form.querySelectorAll('input[name="services"]'),
          function (c) { c.checked = false; }
        );
        Array.prototype.forEach.call(
          form.querySelectorAll('input[name="sms_consent"], input[name="marketing_consent"]'),
          function (c) { c.checked = false; }   // texting Yes / No and the promo box start unpicked again
        );
        if (picker) picker.clear(); else whenEl.value = '';   // un-pick the day too
        files.length = 0; drawPhotos();                      // and drop the photos
        clearErrs();
        clearSaved();
        if (summary) { summary.innerHTML = ''; summary.hidden = true; }
        if (statusEl) { statusEl.textContent = ''; statusEl.classList.remove('err'); }
        expand.classList.remove('is-open');
        syncTools();
        if (nameEl) nameEl.focus();
      };

      var clearDlg = document.getElementById(p + 'ClearDlg');

      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        clearBtn.blur();
        if (clearDlg && typeof clearDlg.showModal === 'function') clearDlg.showModal();
        else if (window.confirm('Clear the form and start over?')) doClear();
      });

      if (clearDlg) {
        clearDlg.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-kcqclear]');
          if (!btn) return;
          clearDlg.close();
          if (btn.getAttribute('data-kcqclear') === 'yes') doClear();
        });
      }
    }

    syncTools();

    /* ---- photos: Take photo / Choose photo, a preview with an X on each ---- */
    var previewUrls = [];
    function drawPhotos() {
      previewUrls.forEach(function (u) { URL.revokeObjectURL(u); });
      previewUrls = [];
      preview.innerHTML = '';
      files.forEach(function (f, i) {
        var tile = document.createElement('div'); tile.className = 'kcq__photoTile';
        var img = document.createElement('img'); img.className = 'kcq__photoThumb'; img.alt = f.name;
        img.src = URL.createObjectURL(f); previewUrls.push(img.src);
        var x = document.createElement('button'); x.type = 'button'; x.className = 'kcq__photoX';
        x.setAttribute('aria-label', 'Remove ' + f.name); x.textContent = '\u00d7';
        x.addEventListener('click', function () { files.splice(i, 1); drawPhotos(); });
        tile.appendChild(img); tile.appendChild(x); preview.appendChild(tile);
      });
    }
    function addPhotos(input) {
      Array.prototype.forEach.call(input.files, function (f) { if (files.length < MAX_FILES) files.push(f); });
      input.value = '';   // so the same photo can be picked again after removing it
      drawPhotos();
    }
    photosIn.addEventListener('change', function () { addPhotos(photosIn); });
    cameraIn.addEventListener('change', function () { addPhotos(cameraIn); });
    $('PickBtn').addEventListener('click', function () { photosIn.click(); });
    $('CameraBtn').addEventListener('click', function () { cameraIn.click(); });

    /* ---- When would you like this done? Optional; only a suggestion, nothing is booked here. ---- */
    (function () {
      var t = new Date();   // no past dates in the plain date box
      whenEl.min = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
      loadDayPicker(function () {
        if (!window.kcDayPicker) return;   // calendar file didn't load: the plain date box stays and works
        picker = window.kcDayPicker({
          when: whenEl, box: openBox, id: p + 'WhenBtn',
          label: mount.querySelector('label[for="' + p + 'When"]'),
          hint: function () { return 'Tap a morning (9\u20131) or afternoon (1\u20136). Grey is booked. We\u2019ll confirm the day with you.'; }
        });
      });
    })();

    /* ---- live field feedback ---- */
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    function checkEmail() {
      var v  = emailEl.value.trim(),
          ok = !v || EMAIL_RE.test(v);
      setErr('Email', ok ? '' : 'Enter a valid email address.');
    }
    emailEl.addEventListener('input', checkEmail);
    emailEl.addEventListener('blur', checkEmail);

    /* Deleting is handled explicitly: without this, backspacing over a ')'
       or '-' would be re-added by the reformat and the caret would stick. */
    phoneEl.addEventListener('input', function (e) {
      var del = e.inputType && e.inputType.indexOf('delete') === 0;
      var d = phoneEl.value.replace(/\D/g,'');
      /* a pasted number often carries a country code — drop a leading 1
         so "+1 916 767 2520" formats as (916) 767-2520, not (191) 676-7252 */
      if(d.length > 10 && d.charAt(0) === '1') d = d.slice(1);
      d = d.slice(0,10);
      var out;
      if (!d) out = '';
      else if (d.length < 4) out = del ? d : '(' + d;
      else if (d.length < 7) out = '(' + d.slice(0, 3) + ') ' + d.slice(3);
      else out = '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
      phoneEl.value = out;
    });

    /* ---- validation ---- */
    function validate() {
      var ok = true;
      clearErrs();

      if (!nameEl.value.trim()) { setErr('Name', 'Please tell us your name.'); ok = false; }

      var digits        = phoneEl.value.replace(/\D/g, ''),
          phoneProvided = phoneEl.value.trim().length > 0,
          emailProvided = emailEl.value.trim().length > 0;

      if (!phoneProvided) {
        setErr('Phone', 'Please give us a phone number.'); ok = false;
      } else if (digits.length < 10) {
        setErr('Phone', 'That looks too short for a phone number.'); ok = false;
      }

      if (!emailProvided) {
        setErr('Email', 'Please give us an email address.'); ok = false;
      } else if (!EMAIL_RE.test(emailEl.value.trim())) {
        setErr('Email', 'Check the email address.'); ok = false;
      }

      if (!typeEl.value) {
        setErr('Type', 'Please choose residential or commercial.'); ok = false;
      }

      if (!form.querySelector('input[name="services"]:checked')) {
        setErr('Services', 'Choose at least one service.');
        ok = false;
      }
      /* Text: Yes or No must be picked. Either answer sends; only skipping the choice blocks it. */
      if (!form.querySelector('input[name="sms_consent"]:checked')) {
        setErr('Sms', 'Please choose Yes or No.');
        ok = false;
      }
      return ok;
    }
    /* Picking Yes or No clears its "please choose" message. */
    Array.prototype.forEach.call(form.querySelectorAll('input[name="sms_consent"]'), function (r) {
      r.addEventListener('change', function () { setErr('Sms', ''); });
    });

    /* ---- submit ---- */
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      statusEl.textContent = '';
      statusEl.classList.remove('err');

      if (!expand.classList.contains('is-open')) openUp();

      if (!validate()) {
        statusEl.textContent = 'Please fix the highlighted fields.';
        statusEl.classList.add('err');
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) { bad.focus(); if (bad.name === 'sms_consent') bad.closest('[role="radiogroup"]').scrollIntoView({ block: 'center' }); }   // a missed Yes / No: bring its panel to the middle of the screen
        return;
      }

      var services = Array.prototype.map.call(
        form.querySelectorAll('input[name="services"]:checked'),
        function (c) { return c.value; }
      ).join(', ');

      var fd = new FormData();
      fd.append('access_key', ACCESS_KEY);
      fd.append('subject', 'Quote request from ' + nameEl.value.trim());
      fd.append('from_name', 'Khean & Clean website');
      fd.append('name',    nameEl.value.trim());
      fd.append('phone',   phoneEl.value.trim());
      fd.append('email',   emailEl.value.trim());
      fd.append('address', addrEl.value.trim());
      fd.append('property_type', $('Type').value);
      fd.append('services', services);
      fd.append('message', msgEl.value.trim());
      fd.append('service_page', opts.service || '');
      var smsYes = !!($('Sms') && $('Sms').checked), promoYes = !!($('Promo') && $('Promo').checked);
      fd.append('sms_consent', smsYes ? 'Yes' : 'No');
      fd.append('marketing_consent', promoYes ? 'Yes' : 'No');
      if (form.querySelector('.kcq__hp').checked) { fd.append('botcheck', 'true'); }

      fd.append('when', whenText());

      submit.disabled = true;
      submit.textContent = files.length ? 'Uploading photos...' : 'Sending...';

      /* Photos go to Firebase Storage first, then the request goes on the Leads page with the
         photos, day and texting answers, then the email goes out. A failed upload or save never
         blocks the email, so no request is lost. Bots are skipped. Same order as quick-quote.html. */
      var isBot = form.querySelector('.kcq__hp').checked,
          leadKey = Date.now() + '_' + Math.random().toString(36).slice(2, 8),
          sending = files.slice(),
          whenVal = whenText();
      (isBot ? Promise.resolve(null) : firebase().then(function (fb) {
        return (sending.length ? uploadPhotos(fb, sending, leadKey) : Promise.resolve([])).then(function (photoPaths) {
          fd.append('photo_count', String(photoPaths.length));
          return saveLead(fb, {
            name:      nameEl.value.trim(),
            phone:     phoneEl.value.trim(),
            email:     emailEl.value.trim(),
            addresses: [{ street: addrEl.value.trim(), city: '', state: 'CA', zip: '' }],
            type:      typeEl.value.toLowerCase(),
            services:  services,
            when:      whenVal,
            message:   msgEl.value.trim(),
            page:      'property-managers',
            smsConsent:       smsYes,
            marketingConsent: promoYes,
            photoPaths: photoPaths
          });
        });
      }))
      .catch(function (err) {
        if (window.console) console.error('Lead save failed', err);
        if (sending.length && !fd.has('photo_count')) fd.append('photo_count', '0 of ' + sending.length + ' (upload failed)');
        return null;
      })
      .then(function () {
        submit.textContent = 'Sending...';
        return fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: fd
        });
      })
      .then(function (r) {
        return r.json().catch(function () { return { success: r.ok }; });
      })
      .then(function (res) {
        if (res && res.success) {
          clearSaved();
          if (typeof gtag === 'function') { gtag('event', 'generate_lead', { form_name: 'pm_quote', service: opts.service || '' }); }
          wrap.hidden = true;
          done.hidden = false;
          done.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          throw new Error((res && res.message) || 'Submission failed');
        }
      })
      .catch(function (err) {
        console.error('Web3Forms error:', err && err.message);
        statusEl.innerHTML = 'Something went wrong sending that. Please call ' +
          '<a href="' + PHONE_HREF + '">' + PHONE_DISPLAY + '</a> and we will sort it out.';
        statusEl.classList.add('err');
        submit.disabled = false;
        submit.textContent = 'Send quote request';
      });
    });
  }

  function boot() {
    var mounts = document.querySelectorAll('[data-kc-quote]');
    Array.prototype.forEach.call(mounts, init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
