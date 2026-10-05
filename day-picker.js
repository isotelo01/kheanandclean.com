/* ============================================================================
   KHEAN & CLEAN — "SEE AVAILABLE DAYS" CALENDAR (kcDayPicker)
   ----------------------------------------------------------------------------
   Used by the shared quote form (quote-form.js) on the service pages, which
   loads this file on its own. The function below is copied VERBATIM from
   index.html and quick-quote.html (lines between the markers). Keep all three
   in step: if you change the picker there, paste the same function here.
   Styling for the calendar lives in quote-form.css.
   ============================================================================ */
/* ---- copied verbatim from quick-quote.html / index.html: start ---- */
        /* "See available days": the button that opens a month calendar of open days. Copied from the
           in-house estimator's Job date. Days come from the booking calendar (getOpenSlots):
           each day shows AM (9-1) and PM (1-6), white = open, grey = booked. A whole-day job
           ($450+ in the estimate builder) taps the day itself, and only days with nothing
           booked can be picked. Tap the picked one again, or Clear, to un-pick. Past days and
           days past the 60-day window are grey. If the days can't load, the plain date box
           stays and works as before. Used by the estimate builder just below and by the
           quick quote further down.
           o = { when, box, label, id, hint(big), big() }; hands back { slot(), clear() }. */
        window.kcDayPicker = function(o){
          var when = o.when, box = o.box, lab = o.label;
          if(!when || !box || !window.fetch) return null;
          var URL = 'https://us-central1-khean-estimator-78f3e.cloudfunctions.net/getOpenSlots';
          var MONTHS = ['January','February','March','April','May','June','July',
                        'August','September','October','November','December'];
          var SHOW = { am:'AM (9\u20131)', pm:'PM (1\u20136)', all:'All day' };
          var byDate = null, first = '', last = '', big = false, shown = '', loadedAt = 0;
          var slot = '', slotDay = '';   // what was tapped (am, pm or all) and the day it belongs to
          function isBig(){ return !!(o.big && o.big()); }
          function isDay(s){ return /^\d{4}-\d{2}-\d{2}$/.test(s); }
          function pad(n){ return ('0' + n).slice(-2); }
          function label(day){
            var p = day.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
            return dt.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
          }
          function cur(){ return slotDay && slotDay === when.value ? slot : ''; }   // the tapped time, while its day is still the date

          /* The box you tap: shows the pick and opens the month. It takes the plain date box's place once the days load. */
          var btn = document.createElement('button');
          btn.type = 'button'; btn.id = o.id; btn.className = 'jobPick is-empty'; btn.hidden = true;
          btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', box.id);
          btn.innerHTML = '<span class="jobPick__txt">See available days</span>';
          when.parentNode.insertBefore(btn, when.nextSibling);

          function slotBtn(day, d, s, txt){
            return '<button type="button" class="jobCal__slot" data-day="' + day + '" data-slot="' + s + '" aria-pressed="false"' +
              (d[s] ? '' : ' disabled') + ' aria-label="' + label(day) + ' ' + txt + (d[s] ? '' : ', booked') + '">' + txt + '</button>';
          }
          function draw(){
            big = isBig();
            var y = +shown.slice(0, 4), m = +shown.slice(5, 7) - 1;
            var lead = new Date(y, m, 1).getDay(), count = new Date(y, m + 1, 0).getDate();
            var now = new Date(), today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
            var cells = '';
            for(var i = 0; i < lead; i++) cells += '<span class="jobCal__cell is-blank" aria-hidden="true"></span>';
            for(var n = 1; n <= count; n++){
              var day = shown + '-' + pad(n), d = byDate[day];
              var cls = 'jobCal__cell' + (day === today ? ' is-today' : ''), at = ' data-cell="' + day + '"';
              var num = '<b>' + n + '</b>';
              if(!d){ cells += '<span class="' + cls + ' is-off"' + at + '>' + num + '</span>'; continue; }   // past, or past the window
              if(big){   // whole-day job: a day with anything booked isn't an option
                cells += (d.am && d.pm)
                  ? '<button type="button" class="' + cls + ' is-open"' + at + ' data-day="' + day + '" data-slot="all" aria-pressed="false"' +
                    ' aria-label="' + label(day) + ', all day">' + num + '<span class="jobCal__all">All day</span></button>'
                  : '<span class="' + cls + ' is-full"' + at + ' aria-label="' + label(day) + ', booked">' + num + '</span>';
                continue;
              }
              cells += '<div class="' + cls + (d.am || d.pm ? '' : ' is-full') + '"' + at + '>' + num +
                slotBtn(day, d, 'am', 'AM') + slotBtn(day, d, 'pm', 'PM') + '</div>';
            }
            box.innerHTML =
              '<div class="jobCal__head">' +
                '<button type="button" class="jobCal__nav" data-nav="-1" aria-label="Previous month"' +
                  (shown <= first.slice(0, 7) ? ' disabled' : '') + '>&lsaquo;</button>' +
                '<strong class="jobCal__month">' + MONTHS[m] + ' ' + y + '</strong>' +
                '<button type="button" class="jobCal__nav" data-nav="1" aria-label="Next month"' +
                  (shown >= last.slice(0, 7) ? ' disabled' : '') + '>&rsaquo;</button>' +
              '</div>' +
              '<p class="jobCal__hint">' + o.hint(big) + '</p>' +
              '<div class="jobCal__grid">' +
                ['Su','Mo','Tu','We','Th','Fr','Sa'].map(function(w){ return '<span class="jobCal__dow">' + w + '</span>'; }).join('') +
                cells +
              '</div>' +
              '<div class="jobCal__foot">' +
                '<button type="button" class="jobCal__link" data-clear>Clear</button>' +
                '<button type="button" class="jobCal__link" data-close>Close</button>' +
              '</div>';
            paint();
          }
          /* Show the pick: in the box you tap, and lit up in the month. */
          function paint(){
            if(!byDate) return;
            var day = isDay(when.value) ? when.value : '', s = cur();
            var txt = !day ? 'See available days' : label(day) + (s ? ' \u00b7 ' + SHOW[s] : '');
            var t = btn.firstChild;
            if(t.textContent !== txt) t.textContent = txt;
            btn.classList.toggle('is-empty', !day);
            box.querySelectorAll('[data-cell]').forEach(function(c){
              c.classList.toggle('is-picked', c.getAttribute('data-cell') === day);
            });
            box.querySelectorAll('[data-slot]').forEach(function(b){
              var on = b.getAttribute('data-day') === day && b.getAttribute('data-slot') === s;
              b.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
          }
          function clear(){ when.value = ''; slot = ''; slotDay = ''; paint(); }
          function open(){
            var mo = isDay(when.value) ? when.value.slice(0, 7) : '';
            shown = (mo && mo >= first.slice(0, 7) && mo <= last.slice(0, 7)) ? mo : first.slice(0, 7);
            draw();
            box.hidden = false;
            btn.setAttribute('aria-expanded', 'true');
            if(Date.now() - loadedAt > 60000) load();   // fresh days each time it opens, once a minute at most
          }
          function close(){ box.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
          btn.addEventListener('click', function(){ if(box.hidden) open(); else close(); });
          box.addEventListener('click', function(e){
            var b = e.target.closest('button');
            if(!b || b.disabled) return;
            if(b.hasAttribute('data-nav')){
              var nx = new Date(+shown.slice(0, 4), +shown.slice(5, 7) - 1 + (+b.getAttribute('data-nav')), 1);
              shown = nx.getFullYear() + '-' + pad(nx.getMonth() + 1);
              draw();
            } else if(b.hasAttribute('data-clear')) clear();
            else if(b.hasAttribute('data-close')) close();
            else if(b.hasAttribute('data-slot')){
              if(b.getAttribute('aria-pressed') === 'true'){ clear(); return; }   // tap the picked one again to un-pick
              when.value = slotDay = b.getAttribute('data-day');
              slot = b.getAttribute('data-slot');
              paint();
              close();
            }
          });
          /* Tap anywhere else, or Esc, and the month folds away. */
          document.addEventListener('click', function(e){
            if(box.hidden) return;
            var path = e.composedPath ? e.composedPath() : [e.target];
            if(path.indexOf(box) < 0 && path.indexOf(btn) < 0 && (!lab || path.indexOf(lab) < 0)) close();
          });
          document.addEventListener('keydown', function(e){
            if(e.key === 'Escape' && !box.hidden){ close(); btn.focus(); }
          });
          when.addEventListener('change', paint);   // plain date box (days didn't load): a date, no time
          /* Price crossed $450 (estimate builder)? A time picked for the other tier no longer
             fits, so it's cleared, and an open month redraws. Otherwise just repaint. */
          function check(){
            if(!byDate) return;
            var b = isBig();
            if(b !== big){ big = b; if(cur()) clear(); if(!box.hidden) draw(); }
            paint();
          }
          ['input', 'change', 'click'].forEach(function(t){
            document.addEventListener(t, function(){ setTimeout(check, 0); });
          });
          setInterval(check, 1500);   // catches price changes made without an event
          function load(){
            loadedAt = Date.now();
            fetch(URL)
              .then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); })
              .then(function(data){
                var all = ((data && data.days) || []).filter(function(d){ return d && isDay(d.date); });
                if(!all.length) return;
                var map = {}, dates = [];
                all.forEach(function(d){ map[d.date] = { am: !!d.am, pm: !!d.pm }; dates.push(d.date); });
                dates.sort();
                byDate = map; first = dates[0]; last = dates[dates.length - 1];
                if(btn.hidden){ when.hidden = true; btn.hidden = false; big = isBig(); if(lab) lab.htmlFor = btn.id; }   // swap in the button; the question stays above it and now points at it
                if(box.hidden) paint();
                else { if(shown < first.slice(0, 7)) shown = first.slice(0, 7); draw(); }
              })
              .catch(function(){ loadedAt = 0; });   // first time: the plain date box stays; later: the days already shown stay
          }
          load();
          /* set(): pre-pick a day and time (a quote opened for a change). The tier is read first,
             so check() doesn't see it flip and clear the pick. */
          function set(day, s){ if(!isDay(day)) return; big = isBig(); when.value = slotDay = day; slot = s || ''; paint(); }
          return { slot: cur, clear: clear, set: set };
        };
/* ---- copied verbatim from quick-quote.html / index.html: end ---- */
