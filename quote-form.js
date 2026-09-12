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

  var PROPERTY_TYPES = ['Residential', 'Move-out deep clean', 'Commercial'];

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
            '<label for="' + p + 'Name">Name</label>' +
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
            '<label for="' + p + 'Type">Property type</label>' +
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

            '<div class="kcq__field">' +
              '<label for="' + p + 'Msg">Rooms or areas needing service</label>' +
              '<textarea id="' + p + 'Msg" name="message" rows="4" ' +
                'placeholder="e.g. three bedrooms and a hallway, one pet stain in the living room"></textarea>' +
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

  /* ---- remembered across pages ----
     Everything typed into the quick quote is kept in this browser under one
     shared key ("kcQuote"), and every page's quick quote reads it back on load —
     so details entered on the homepage appear here and vice versa. The homepage
     form (index.html) reads and writes the very same key. Cleared on send. */
  var STORE_KEY = 'kcQuote';
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

    /* ---- error helpers ---- */
    function setErr(suffix, msg) {
      var el   = $(suffix),
          slot = mount.querySelector('.kcq__err[data-for="' + p + suffix + '"]');
      if (slot) slot.textContent = msg || '';
      if (el) el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    function clearErrs() {
      ['Name', 'Phone', 'Email', 'Addr', 'Type', 'Services']
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
                        return '<li><span>' + esc(it.label) + '</span><span>$' + esc(it.cost) + '</span></li>';
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
      return ok;
    }

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
        if (bad) bad.focus();
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
      if (form.querySelector('.kcq__hp').checked) { fd.append('botcheck', 'true'); }

      submit.disabled = true;
      submit.textContent = 'Sending...';

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd
      })
      .then(function (r) {
        return r.json().catch(function () { return { success: r.ok }; });
      })
      .then(function (res) {
        if (res && res.success) {
          clearSaved();
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
