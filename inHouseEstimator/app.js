(function(){
  var MIN_JOB = 150;              // confirmed — matches your price sheet

  var ROOM_TYPES = [
    /* Grouped by the flooring each room most likely has, in the same order as
       the service tabs: carpet first, then tile & grout, then hard floor.
       Within each group, larger rooms first. */

    /* --- most likely carpet (upstairs / soft floors) --- */
    { key:'masterBed',  name:'Master Bedroom',            sqft:250, dims:'12\' 6" \u00d7 20\'' },
    { key:'den',        name:'Large Den / Office',        sqft:180, dims:'15\' \u00d7 12\'' },
    { key:'smallBed',   name:'Bedroom',                   sqft:110, dims:'10\' \u00d7 11\'' },
    { key:'closet',     name:'Walk-In Closet (Master)',   sqft:80,  dims:'8\' \u00d7 10\'' },
    { key:'hallway',    name:'Hallway',                   sqft:40,  dims:'4\' \u00d7 10\'' },

    /* --- most likely tile & grout (wet rooms) --- */
    { key:'kitchen',    name:'Kitchen',                   sqft:200, dims:'10\' \u00d7 20\'' },
    { key:'masterBath', name:'Master Bath',               sqft:150, dims:'10\' \u00d7 15\'' },
    { key:'fullBath',   name:'Full Bath',                 sqft:50,  dims:'5\' \u00d7 10\'' },
    { key:'laundry',    name:'Laundry Room',              sqft:45,  dims:'5\' \u00d7 9\'' },
    { key:'halfBath',   name:'Half Bath / Powder Room',   sqft:21,  dims:'3\' \u00d7 7\'' },

    /* --- most likely hard floor (downstairs living space) --- */
    { key:'greatRoom',  name:'Great Room', sqft:375, dims:'combined living, dining & kitchen' },
    { key:'living',     name:'Living / Family Room',      sqft:350, dims:'17\' 6" \u00d7 20\'' },
    { key:'loft',       name:'Large Loft',               sqft:275, dims:'11\' \u00d7 25\'' },
    { key:'dining',     name:'Dining Room',               sqft:245, dims:'12\' \u00d7 20\' 6"' },

    /* --- always last --- */
    { key:'stairs',     name:'Flights of Stairs',         flat:100, step:0.5 },
    { key:'addSqft',    name:'Additional Square Feet',    sqft:1,   step:10, captionText:'' }
  ];

  var SERVICES = {
    carpet: {
      name: 'Carpet Cleaning',
      mode: 'area',
      tiers: {
        essential: { name:'Essential Cleaning', sqft:0.37 },
        deep:      { name:'Deep Cleaning',      sqft:0.47 },
        signature: { name:'Signature Cleaning', sqft:0.65 },
        quickdry:  { name:'Quick Dry Encapsulation', sqft:0.37 }
      },
      addons: {
        stairs: { name:'Flights of Stairs', linear:100, needsQty:true, qtyDefault:1, qtyStep:0.5,
                   text:'$100 per flight' },
        hair:   { name:'Hair & debris removal', sqft:0.12 },
        deo:    { name:'Deodorizer',            sqft:0.05 },
        prot:   { name:'Stain protector',      sqft:0.10 },
        dry:    { name:'Accelerated drying',    sqft:0.03 },
        filter: { name:'Filter line cleaning',  linear:0.45, needsQty:true, qtyDefault:0, qtyStep:10 },
        stretch:{ name:'Carpet Stretching',      linear:100,  needsQty:true, qtyDefault:0, qtyStep:1, qtyDropdown:true,
                   text:'$100 starting per room', disclaimer:'All furniture must be removed and carpet must be in good condition.' },
        pet:    { name:'Pet odor treatment',    linear:50, needsQty:true, qtyDefault:0, qtyStep:1, qtyDropdown:true, text:'$50 starting per spot' },
        stain:  { name:'Stain treatment',       linear:15, needsQty:true, qtyDefault:0, qtyStep:1, qtyDropdown:true, text:'$15 starting per spot' }
      },
      quoteValue: 'Carpet cleaning'
    },
    tile: {
      name: 'Tile & Grout Cleaning',
      mode: 'area',
      rate: 0.85,
      addons: {
        seal: { name:'Grout color seal', linear:1.00, needsQty:true, qtyDefault:0, qtyStep:10, text:'$1.00 / sq ft',
                 allTileLabel:'All Grout' },
        acid: { name:'Acid treatment',  linear:1.00, needsQty:true, qtyDefault:0, qtyStep:10, text:'$1.00 / sq ft' }
      },
      quoteValue: 'Tile & grout'
    },
    stone: {
      name: 'Natural Stone Cleaning',
      mode: 'area',
      rate: 2.00,
      addons: {},
      quoteValue: 'Natural stone'
    },
    lvp: {
      name: 'Hardwood/LVP Cleaning',
      mode: 'area',
      rate: 0.50,
      addons: {},
      quoteValue: 'Hardwood/LVP'
    },
    commcarpet: {
      name: 'Commercial Carpet',
      mode: 'area',
      rate: 0.45,
      addons: {
        stain: { name:'Stain treatment', linear:15, needsQty:true, qtyDefault:0, qtyStep:1,
                 text:'$15 starting per spot' }
      },
      quoteValue: 'Commercial carpet'
    },
    commhard: {
      name: 'Commercial Hard Floor',
      mode: 'area',
      rate: 0.45,
      addons: {},
      quoteValue: 'Commercial hard floor'
    },
    upholstery: {
      name: 'Upholstery Cleaning',
      mode: 'items',
      rate: 38,
      items: [
        { key:'couch',      name:'Couch',                          ft:6 },
        { key:'chair',      name:'Dining room chair',               ft:1 },
        { key:'loveseat',   name:'Love seat',                       ft:4.5 },
        { key:'sect3',      name:'3-piece sectional',               ft:14 },
        { key:'sect5',      name:'5-piece sectional',               ft:20 },
        { key:'recliner',   name:'Large chair / recliner',          ft:3 },
        { key:'chairdrape', name:'Dining chair with drapes',        ft:1.5 },
        { key:'misc',       name:'Misc. furniture (per linear ft)', ft:1 }
      ],
      quoteValue: 'Upholstery'
    }
  };

  var qty        = document.getElementById('qty'),
      sqftBox    = document.getElementById('sqftBox'),
      roomFields = document.getElementById('roomFields'),
      roomBlock  = document.getElementById('roomBlock'),
      roomList   = document.getElementById('roomList'),
      roomPicker = document.getElementById('roomPicker'),
      roomSummary= document.getElementById('roomSummary'),
      roomSumTxt = document.getElementById('roomSummaryText'),
      areaFields = document.getElementById('areaFields'),
      uphFields  = document.getElementById('uphFields'),
      tierField  = document.getElementById('tierField'),
      addonsField= document.getElementById('addonsField'),
      addsList   = document.getElementById('addsList'),
      uphList    = document.getElementById('uphList'),
      totalEl    = document.getElementById('total'),
      totalSqftNumEl= document.getElementById('totalSqftNum'),
      totalSqftLabelEl= document.getElementById('totalSqftLabel'),
      linesEl    = document.getElementById('lines'),
      minEl      = document.getElementById('minNote');

  /* Each service tab keeps its own numbers — switching tabs never overwrites another
     tab's inputs. STATE is the saved value per service; "touched" means the person
     actually entered something (vs. just looking at the tab's default), which is what
     decides whether that service counts toward the grand total below. */
  var STATE = {}, activeSvc;

  function defaultRooms(){
    var o = {}; ROOM_TYPES.forEach(function(rt){ o[rt.key] = 0; }); return o;
  }
  function defaultAddons(svcKey){
    var o = {}, defs = SERVICES[svcKey].addons || {};
    Object.keys(defs).forEach(function(k){
      o[k] = { on:false };
      if(defs[k].needsQty) o[k].qty = defs[k].qtyDefault;
    });
    return o;
  }
  function initState(){
    ['carpet','tile','stone','lvp','commcarpet','commhard'].forEach(function(k){
      STATE[k] = { mode:'sqft', sqft:0, rooms:defaultRooms(), collapsed:false, addons:defaultAddons(k), touched:false };
    });
    STATE.carpet.tier = 'deep';
    // Deep ships pre-selected in the markup, so no 'change' event ever fires to
    // apply the drying default that the tier handler applies on every later switch.
    STATE.carpet.addons.dry.on = true;
    STATE.carpet.dryDefaultApplied = true;
    STATE.upholstery = { items:{}, touched:false };
    SERVICES.upholstery.items.forEach(function(it){ STATE.upholstery.items[it.key] = 0; });
  }
  initState();

  function svc(){ return document.querySelector('input[name="svc"]:checked').value; }
  /* Residential and commercial can't share an invoice, so the service row shows
     one group or the other, never both. Property type drives the swap, and the
     hidden group's numbers are cleared so nothing invisible can price into the
     estimate. */
  var COMM_SVCS = ['commcarpet','commhard'];
  var RES_SVCS  = ['carpet','tile','lvp','upholstery','stone'];
  function isComm(k){ return COMM_SVCS.indexOf(k) > -1; }
  function commercialMode(){
    var sel = document.getElementById('eType');
    return !!sel && sel.value === 'Commercial';
  }
  function service(){ return SERVICES[svc()]; }
  function mode(){ return document.querySelector('input[name="mode"]:checked').value; }
  function tier(){ return document.querySelector('input[name="tier"]:checked').value; }
  function money(n){ return n.toLocaleString('en-US',{maximumFractionDigits:0}); }

  function addonPriceTxt(a){
    if(a.text)   return a.text;
    if(a.flat)   return '$'+a.flat+(a.note ? ' '+a.note : '');
    if(a.linear) return '$'+a.linear.toFixed(2)+' / linear ft';
    return '$'+a.sqft.toFixed(2)+' / sq ft';
  }

  function renderAddons(){
    var s = service(), st = STATE[activeSvc], keys = Object.keys(s.addons || {});
    if(!keys.length){ addonsField.style.display = 'none'; addsList.innerHTML = ''; return; }
    addonsField.style.display = '';
    addsList.innerHTML = keys.map(function(k){
      var a = s.addons[k], price = addonPriceTxt(a);
      if(a.needsQty){
        var disclaimer = a.disclaimer ? '<br><span class="roomDisclaimer">'+a.disclaimer+'</span>' : '';
        if(a.qtyDropdown){
          var opts = '';
          for(var n=0; n<=10; n++){ opts += '<option value="'+n+'"'+(n===0?' selected':'')+'>'+n+'</option>'; }
          return '<div class="add addQty">'+
                 '<label class="addQty__toggle">'+
                   '<input type="checkbox" data-add="'+k+'">'+
                   '<span>'+a.name+' <span class="add__c">'+price+'</span>'+disclaimer+'</span>'+
                 '</label>'+
                 '<select class="addQty__select" data-addqty="'+k+'" style="margin-left:auto" aria-label="'+a.name+' quantity">'+opts+'</select>'+
               '</div>';
        }
        var allTileBtn = a.allTileLabel
          ? '<button type="button" class="allTileBtn" data-alltile="'+k+'">'+a.allTileLabel+'</button>'
          : '';
        return '<div class="add addQty">'+
               '<label class="addQty__toggle">'+
                 '<input type="checkbox" data-add="'+k+'">'+
                 '<span>'+a.name+' <span class="add__c">'+price+'</span>'+disclaimer+'</span>'+
               '</label>'+
               '<div class="addQty__actions" style="margin-left:auto">'+
                 allTileBtn+
                 '<div class="step step--sm">'+
                   '<button type="button" data-addqtyminus="'+k+'" aria-label="Decrease">&minus;</button>'+
                   '<input type="number" data-addqty="'+k+'" value="'+a.qtyDefault+'" min="0" step="'+(a.qtyStep||1)+'">'+
                   '<button type="button" data-addqtyplus="'+k+'" aria-label="Increase">+</button>'+
                 '</div>'+
               '</div>'+
             '</div>';
      }
      return '<label class="add"><input type="checkbox" data-add="'+k+'"> '+a.name+' <span class="add__c">'+price+'</span></label>';
    }).join('');
    addsList.querySelectorAll('[data-add]').forEach(function(el){
      var k = el.dataset.add;
      el.checked = !!(st.addons[k] && st.addons[k].on);
      el.addEventListener('change', function(){
        st.addons[k] = st.addons[k] || {};
        st.addons[k].on = el.checked;
        st.touched = true;

        // Stairs starts at one flight on check (matching the room picker's first-click
        // behavior) since its count lives in st.rooms, not in the add-on's own qty.
        if(k === 'stairs'){
          if(el.checked){ if(!(st.rooms.stairs > 0)) st.rooms.stairs = 1; }
          else st.rooms.stairs = 0;
          applyRoomValuesFromState();
        }

        // Deodorizer/protector are what actually distinguish Signature from Deep, so
        // unchecking either one steps the package down. Drying is required under
        // Signature (locked, can't be unchecked) but is a real, price-affecting
        // toggle under Deep, so it's exempt from the downgrade rule.
        if(!el.checked && svc()==='carpet' && tier()==='signature' &&
           DOWNGRADE_TRIGGER_ADDONS.indexOf(k) > -1){
          document.getElementById('tDeep').checked = true;
          STATE.carpet.tier = 'deep';
          if(!STATE.carpet.dryDefaultApplied){
            STATE.carpet.addons.dry = STATE.carpet.addons.dry || {};
            STATE.carpet.addons.dry.on = true;
            STATE.carpet.dryDefaultApplied = true;
          }
        }

        if(svc()==='carpet' && ['dry','deo','prot'].indexOf(k) > -1){
          syncTierAddonLocks();
        }

        // Deodorizer + protector + drying, all checked at once, is exactly what
        // Signature already is — so completing that trio upgrades the package
        // automatically instead of just stacking three separate add-on charges.
        if(svc()==='carpet' && tier() !== 'signature' &&
           STATE.carpet.addons.deo  && STATE.carpet.addons.deo.on &&
           STATE.carpet.addons.prot && STATE.carpet.addons.prot.on &&
           STATE.carpet.addons.dry  && STATE.carpet.addons.dry.on){
          document.getElementById('tSig').checked = true;
          STATE.carpet.tier = 'signature';
          syncTierAddonLocks();
        }

        // Number-stepper add-ons (not dropdowns) get a "please enter a quantity"
        // highlight the moment they're checked with nothing entered yet.
        if(s.addons[k] && s.addons[k].needsQty && !s.addons[k].qtyDropdown){
          var stepWrap = el.closest('.addQty'), stepEl = stepWrap ? stepWrap.querySelector('.step') : null;
          if(stepEl){
            var hasQty = st.addons[k] && st.addons[k].qty > 0;
            stepEl.classList.toggle('step--grow', el.checked && !hasQty);
          }
        }

        calc();
      });
    });
    addsList.querySelectorAll('[data-addqty]').forEach(function(el){
      var k = el.dataset.addqty;
      if(k === 'stairs') el.value = st.rooms.stairs || 0;
      else if(st.addons[k] && st.addons[k].qty != null) el.value = st.addons[k].qty;
      var evt = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(evt, function(){
        var v = +el.value || 0;
        st.addons[k] = st.addons[k] || {};
        // Stairs lives in st.rooms so the room picker and this add-on stay one number.
        // roomTotals() reads the picker's input, so write straight through to it.
        if(k === 'stairs'){
          st.rooms.stairs = v;
          var rInp = roomList && roomList.querySelector('[data-room="stairs"]');
          if(rInp) rInp.value = v;
        }
        else st.addons[k].qty = v;
        st.touched = true;

        // A quantity has been entered, so drop the "please enter a quantity" highlight.
        var stepWrap = el.closest('.step');
        if(stepWrap) stepWrap.classList.remove('step--grow');

        var cb = addsList.querySelector('[data-add="'+k+'"]');
        if(cb && cb.checked !== (v > 0)){
          cb.checked = v > 0;
          cb.dispatchEvent(new Event('change'));
          return; // the checkbox's own handler already calls calc()
        }

        calc();
      });
    });
    addsList.querySelectorAll('[data-addqtyminus]').forEach(function(el){
      el.addEventListener('click', function(){
        var k = el.dataset.addqtyminus, inp = addsList.querySelector('[data-addqty="'+k+'"]');
        if(!inp) return;
        var step = +inp.step || 1, min = +inp.min || 0;
        inp.value = Math.max(min, (+inp.value||0) - step);
        inp.dispatchEvent(new Event('input', {bubbles:true}));
      });
    });
    addsList.querySelectorAll('[data-addqtyplus]').forEach(function(el){
      el.addEventListener('click', function(){
        var k = el.dataset.addqtyplus, inp = addsList.querySelector('[data-addqty="'+k+'"]');
        if(!inp) return;
        var step = +inp.step || 1;
        inp.value = (+inp.value||0) + step;
        inp.dispatchEvent(new Event('input', {bubbles:true}));
      });
    });
    addsList.querySelectorAll('[data-alltile]').forEach(function(el){
      el.addEventListener('click', function(){
        var k = el.dataset.alltile, inp = addsList.querySelector('[data-addqty="'+k+'"]');
        if(!inp) return;
        inp.value = currentSqft(activeSvc);
        inp.dispatchEvent(new Event('input', {bubbles:true}));
      });
    });
    syncTierAddonLocks();
  }

  /* Current total square footage entered for a service, regardless of whether
     it's in "square feet" mode or "rooms" mode — used by the "All Tile" style
     buttons that fill a quantity field from the service's whole footprint. */
  function currentSqft(svcKey){
    var st = STATE[svcKey];
    if(st.mode === 'room'){
      var sqft = 0;
      ROOM_TYPES.forEach(function(rt){
        if(rt.flat != null) return;
        sqft += (st.rooms[rt.key] || 0) * rt.sqft;
      });
      return sqft;
    }
    return st.sqft || 0;
  }

  /* Essential is the base rate. Deep adds a $0.10/sq ft CRB machine surcharge (never
     shown as its own line — it's just "the whole job costs more"), plus accelerated
     drying by default (+$0.03) — but drying is optional under Deep and actually
     changes the price if skipped. Signature bakes in drying, deodorizer, and carpet
     protector permanently: $0.37 + $0.10 + $0.03 + $0.05 + $0.10 = $0.65, no opt-out. */
  var DOWNGRADE_TRIGGER_ADDONS = ['deo','prot'];

  function syncTierAddonLocks(){
    if(svc() !== 'carpet') return;
    var t = tier();
    var protChecked = !!(STATE.carpet.addons.prot && STATE.carpet.addons.prot.on) && t !== 'essential';

    // Drying: mandatory & locked under Signature; also required (and locked) any time
    // Stain protector is checked, since protector has to be dried in afterward; otherwise
    // a real, price-affecting toggle under Deep (defaults on, unchecking saves $0.03/sq ft);
    // a normal optional add-on under Essential.
    var dryInput = addsList.querySelector('[data-add="dry"]');
    if(dryInput){
      var dryLabel = dryInput.closest('label'),
          dryCaption = dryLabel ? dryLabel.querySelector('.add__c') : null;
      if(t === 'signature' || t === 'quickdry'){
        STATE.carpet.addons.dry = STATE.carpet.addons.dry || {};
        STATE.carpet.addons.dry.on = true;
        dryInput.checked = true;
        dryInput.disabled = true;
        if(dryLabel) dryLabel.style.opacity = '.7';
        if(dryCaption) dryCaption.textContent = (t === 'quickdry')
          ? 'Included in Quick Dry' : 'Required for Signature';
      } else if(protChecked){
        STATE.carpet.addons.dry = STATE.carpet.addons.dry || {};
        STATE.carpet.addons.dry.on = true;
        dryInput.checked = true;
        dryInput.disabled = true;
        if(dryLabel) dryLabel.style.opacity = '.7';
        if(dryCaption) dryCaption.textContent = 'Required with stain protector';
      } else {
        dryInput.disabled = false;
        dryInput.checked = !!(STATE.carpet.addons.dry && STATE.carpet.addons.dry.on);
        if(dryLabel) dryLabel.style.opacity = (t === 'deep' && dryInput.checked) ? '.7' : '';
        if(dryCaption){
          if(t === 'deep'){
            dryCaption.textContent = dryInput.checked ? 'Included in this package' : 'Skipped \u2014 saves $0.03 / sq ft';
          } else {
            dryCaption.textContent = addonPriceTxt(SERVICES.carpet.addons.dry);
          }
        }
      }
    }

    // Deodorizer / protector: bundled and clickable under Signature (unchecking
    // steps the package down to Deep); normal optional add-ons otherwise.
    ['deo','prot'].forEach(function(k){
      var input = addsList.querySelector('[data-add="'+k+'"]');
      if(!input) return;
      var label = input.closest('label'),
          captionEl = label ? label.querySelector('.add__c') : null;
      if(t === 'signature'){
        STATE.carpet.addons[k] = STATE.carpet.addons[k] || {};
        STATE.carpet.addons[k].on = true;
        input.checked = true;
        input.disabled = false;
        if(label) label.style.opacity = '.7';
        if(captionEl) captionEl.textContent = 'Included in this package';
      } else if(k === 'prot' && (t === 'essential' || t === 'quickdry')){
        input.checked = false;
        input.disabled = true;
        if(label) label.style.opacity = '.4';
        if(captionEl) captionEl.innerHTML = '<span class="lockNote">Not available with '
          + (t === 'quickdry' ? 'Quick Dry Encapsulation' : 'Essential Cleaning') + '</span>';
      } else {
        input.disabled = false;
        input.checked = !!(STATE.carpet.addons[k] && STATE.carpet.addons[k].on);
        if(label) label.style.opacity = '';
        if(captionEl) captionEl.textContent = addonPriceTxt(SERVICES.carpet.addons[k]);
      }
    });

    // Filter line cleaning: also unavailable under Essential — disables both the
    // checkbox and its linear-feet quantity field.
    var filterInput = addsList.querySelector('[data-add="filter"]'),
        filterQty    = addsList.querySelector('[data-addqty="filter"]');
    if(filterInput){
      var filterLabel = filterInput.closest('label'),
          filterCaption = filterLabel ? filterLabel.querySelector('.add__c') : null,
          filterStep = filterQty ? filterQty.closest('.step') : null;
      if(t === 'essential'){
        filterInput.checked = false;
        filterInput.disabled = true;
        if(filterQty) filterQty.disabled = true;
        if(filterLabel) filterLabel.style.opacity = '.4';
        if(filterStep) filterStep.style.opacity = '.4';
        if(filterCaption) filterCaption.innerHTML = '<span class="lockNote">Not available with Essential Cleaning</span>';
      } else {
        filterInput.disabled = false;
        if(filterQty) filterQty.disabled = false;
        filterInput.checked = !!(STATE.carpet.addons.filter && STATE.carpet.addons.filter.on);
        if(filterLabel) filterLabel.style.opacity = '';
        if(filterStep) filterStep.style.opacity = '';
        if(filterCaption) filterCaption.textContent = addonPriceTxt(SERVICES.carpet.addons.filter);
      }
    }
  }

  function renderUphItems(){
    var st = STATE.upholstery;
    uphList.innerHTML = SERVICES.upholstery.items.map(function(it){
      return '<div class="add" style="cursor:default">'+
             '<span style="flex:1">'+it.name+' <span class="add__c">'+it.ft+' ft</span></span>'+
             '<div class="step step--sm">'+
               '<button type="button" data-uphminus="'+it.key+'" aria-label="Decrease">&minus;</button>'+
               '<input type="number" data-uph="'+it.key+'" value="0" min="0" step="1">'+
               '<button type="button" data-uphplus="'+it.key+'" aria-label="Increase">+</button>'+
             '</div></div>';
    }).join('');
    uphList.querySelectorAll('[data-uph]').forEach(function(el){
      var k = el.dataset.uph;
      el.value = st.items[k] || 0;
      el.addEventListener('input', function(){ st.items[k] = +el.value || 0; st.touched = true; calc(); });
    });
    uphList.querySelectorAll('[data-uphminus]').forEach(function(el){
      el.addEventListener('click', function(){
        var k = el.dataset.uphminus, inp = uphList.querySelector('[data-uph="'+k+'"]');
        inp.value = Math.max(0,(+inp.value||0) - 1); st.items[k] = +inp.value; st.touched = true; calc();
      });
    });
    uphList.querySelectorAll('[data-uphplus]').forEach(function(el){
      el.addEventListener('click', function(){
        var k = el.dataset.uphplus, inp = uphList.querySelector('[data-uph="'+k+'"]');
        inp.value = (+inp.value||0) + 1; st.items[k] = +inp.value; st.touched = true; calc();
      });
    });
  }

  function renderRoomList(){
    roomList.innerHTML = ROOM_TYPES.map(function(rt){
      var caption;
      if(rt.captionText != null){
        caption = rt.captionText;
      } else if(rt.flat != null){
        caption = '$'+rt.flat+(rt.note ? ' '+rt.note : '')+' per '+(rt.unit || 'flight');
      } else {
        caption = rt.sqft+' sq ft'+(rt.dims ? ' ('+rt.dims+')' : '');
      }
      var disclaimer = rt.disclaimer ? '<br><span class="roomDisclaimer">'+rt.disclaimer+'</span>' : '';
      var step = rt.step || 1;
      return '<div class="add" data-roomrow="'+rt.key+'" style="cursor:pointer">'+
             '<span>'+rt.name+' <span class="add__c">'+caption+'</span>'+disclaimer+'</span>'+
             '<div class="step step--sm" style="margin-left:auto">'+
               '<button type="button" data-roomminus="'+rt.key+'" aria-label="Decrease">&minus;</button>'+
               '<input type="number" data-room="'+rt.key+'" value="0" min="0" step="'+step+'">'+
               '<button type="button" data-roomplus="'+rt.key+'" aria-label="Increase">+</button>'+
             '</div></div>';
    }).join('');
    roomList.querySelectorAll('[data-room]').forEach(function(el){
      el.addEventListener('input', function(){
        var k = el.dataset.room, v = +el.value || 0;
        STATE[activeSvc].rooms[k] = v;
        STATE[activeSvc].touched = true;
        if(k === 'addSqft'){ STATE[activeSvc].sqft = v; qty.value = v; }
        calc();
      });
    });
    roomList.querySelectorAll('[data-roomminus]').forEach(function(el){
      el.addEventListener('click', function(){
        var k = el.dataset.roomminus, inp = roomList.querySelector('[data-room="'+k+'"]'),
            step = +inp.step || 1;
        inp.value = Math.max(0, +(((+inp.value||0) - step).toFixed(2)));
        STATE[activeSvc].rooms[k] = +inp.value; STATE[activeSvc].touched = true;
        if(k === 'addSqft'){ STATE[activeSvc].sqft = +inp.value; qty.value = inp.value; }
        calc();
      });
    });
    roomList.querySelectorAll('[data-roomplus]').forEach(function(el){
      el.addEventListener('click', function(){
        var k = el.dataset.roomplus, inp = roomList.querySelector('[data-room="'+k+'"]'),
            step = +inp.step || 1;
        var cur = +inp.value || 0;
        inp.value = +(((cur === 0 && k === 'stairs') ? 1 : cur + step).toFixed(2));
        STATE[activeSvc].rooms[k] = +inp.value; STATE[activeSvc].touched = true;
        if(k === 'addSqft'){ STATE[activeSvc].sqft = +inp.value; qty.value = inp.value; }
        calc();
      });
    });
    /* Click anywhere on a room row to add one, same as pressing +.
       Clicks on the -/+/number controls are left alone so they don't count twice. */
    roomList.querySelectorAll('[data-roomrow]').forEach(function(row){
      row.addEventListener('click', function(e){
        if(e.target.closest('.step')) return;
        var plus = row.querySelector('[data-roomplus]');
        if(plus) plus.click();
      });
    });
  }

  function applyRoomValuesFromState(){
    ROOM_TYPES.forEach(function(rt){
      var inp = roomList.querySelector('[data-room="'+rt.key+'"]');
      if(inp) inp.value = STATE[activeSvc].rooms[rt.key] || 0;
    });
    // Stairs is mirrored by the front-screen add-on box; keep the two displays equal.
    var sInp = addsList && addsList.querySelector('[data-addqty="stairs"]');
    if(sInp) sInp.value = STATE[activeSvc].rooms.stairs || 0;
  }

  function roomTotals(){
    var sqft = 0, flat = 0, count = 0, picks = [];
    ROOM_TYPES.forEach(function(rt){
      var inp = roomList.querySelector('[data-room="'+rt.key+'"]'),
          q = inp ? (+inp.value||0) : 0;
      if(q > 0){
        if(rt.flat != null) flat += q * rt.flat; else sqft += q * rt.sqft;
        count += q; picks.push(q+'\u00d7 '+rt.name);
      }
    });
    return { sqft:sqft, flat:flat, count:count, picks:picks };
  }

  var BREAKOUT_PROPS = ['position','left','width','maxWidth','minWidth','boxSizing','padding','background','zIndex','borderTop','borderBottom','boxShadow'];

  function applyRoomBreakout(){
    var targetEl = roomBlock.closest('.est__form') || roomBlock.closest('.shell') || document.querySelector('#estimate .shell');
    var targetRect = targetEl.getBoundingClientRect();

    roomBlock.style.position  = 'relative';
    roomBlock.style.left      = '0px';
    roomBlock.style.width     = targetRect.width + 'px';
    roomBlock.style.maxWidth  = targetRect.width + 'px';
    roomBlock.style.minWidth  = '0';
    roomBlock.style.boxSizing = 'border-box';
    roomBlock.style.padding   = 'clamp(1.25rem,4vw,2.5rem)';
    roomBlock.style.background= 'var(--ink)';
    roomBlock.style.zIndex    = '20';
    roomBlock.style.borderTop = '1px solid var(--line-d)';
    roomBlock.style.borderBottom = '1px solid var(--line-d)';
    roomBlock.style.boxShadow = '0 24px 60px -20px rgba(0,0,0,.6)';

    // Measure where the box actually landed now that its width has changed, then
    // nudge it the exact remaining distance to align with the input column — two
    // passes avoids relying on a "static position" guess that reflow can throw off.
    var rect = roomBlock.getBoundingClientRect();
    roomBlock.style.left = (targetRect.left - rect.left) + 'px';
  }

  function removeRoomBreakout(){
    BREAKOUT_PROPS.forEach(function(p){ roomBlock.style[p] = ''; });
  }

  /* Floating Done is visible only while the picker is genuinely on screen.
     offsetParent alone only goes null when the picker is display:none, so it stayed
     true after scrolling past — leaving a dead green bar pinned to the viewport.
     An IntersectionObserver tracks actual visibility; roomsVisible holds the result. */
  var roomsVisible = false;
  if(window.IntersectionObserver && roomPicker){
    new IntersectionObserver(function(entries){
      roomsVisible = entries[0].isIntersecting;
      document.body.classList.toggle('rooms-open', roomsVisible && roomPicker.offsetParent !== null);
    }).observe(roomPicker);
  }

  function syncRoomsDone(){
    var laidOut = roomPicker.offsetParent !== null;
    var onScreen = window.IntersectionObserver ? roomsVisible : laidOut;
    document.body.classList.toggle('rooms-open', laidOut && onScreen);
    var btn = document.getElementById('roomsDone');
    var s = SERVICES[activeSvc];
    if(btn && s){
      var label = s.name.replace(/\s*Cleaning$/, '');
      btn.textContent = 'Done with ' + label;
      btn.setAttribute('aria-label', 'Done choosing rooms for ' + label);
    }
  }

  /* Service order is read from the row's markup, so reordering the buttons reorders the hint. */
  function svcOrder(){
    return Array.prototype.map.call(document.querySelectorAll('input[name="svc"]'), function(i){ return i.value; });
  }
  function clearSvcHint(){
    document.querySelectorAll('#svcRow label.seg__hint').forEach(function(l){ l.classList.remove('seg__hint'); });
  }
  /* After OK on the room picker: select the next service outright (numbers for the
     finished service stay in STATE and keep counting toward the running total). */
  function selectNextService(){
    clearSvcHint();
    var order = svcOrder(), i = order.indexOf(activeSvc);
    if(i < 0 || i >= order.length - 1) return;               /* last service: stay put */
    var inp = document.querySelector('input[name="svc"][value="'+order[i+1]+'"]');
    if(inp && !inp.checked){ inp.checked = true; inp.dispatchEvent(new Event('change',{bubbles:true})); }
  }

  /* Shared by the inline OK button and the floating Done button. */
  function finishRooms(){
    closeRoomPicker();
    selectNextService();
    var field = document.getElementById('svcField');
    if(field) field.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function closeRoomPicker(){
    var rt = roomTotals(), parts = [];
    if(rt.sqft) parts.push(rt.sqft.toLocaleString()+' sq ft');
    if(rt.flat) parts.push('$'+rt.flat.toLocaleString()+' flat');
    roomSumTxt.textContent = rt.count
      ? rt.count+(rt.count===1?' room':' rooms')+' selected \u2014 '+parts.join(', ')
      : 'No rooms selected yet';
    roomPicker.style.display = 'none';
    roomSummary.style.display = '';
    // Push any stairs change made inside the picker back onto the front-screen add-on.
    var sBox = addsList && addsList.querySelector('[data-addqty="stairs"]'),
        sRoom = roomList && roomList.querySelector('[data-room="stairs"]');
    if(sBox && sRoom){
      var sv = +sRoom.value || 0;
      sBox.value = sv;
      STATE[activeSvc].rooms.stairs = sv;
      var sCb = addsList.querySelector('[data-add="stairs"]');
      if(sCb){
        sCb.checked = sv > 0;
        STATE[activeSvc].addons.stairs = STATE[activeSvc].addons.stairs || {};
        STATE[activeSvc].addons.stairs.on = sv > 0;
      }
    }
    removeRoomBreakout();
    STATE[activeSvc].collapsed = true;
    syncRoomsDone();
  }

  function openRoomPicker(){
    roomPicker.style.display = '';
    roomSummary.style.display = 'none';
    applyRoomBreakout();
    STATE[activeSvc].collapsed = false;
    syncRoomsDone();
  }

  function syncMode(){
    var isRoom = mode()==='room';
    sqftBox.style.display    = isRoom ? 'none' : '';
    roomFields.style.display = isRoom ? '' : 'none';
    if(!isRoom){ removeRoomBreakout(); }
    syncRoomsDone();
  }

  /* Wipe a group's entries so a service that's off screen can never contribute
     a charge. Uses initState's own defaults rather than a hand-written reset so
     the two can't drift apart as services change. */
  function clearGroup(keys){
    keys.forEach(function(k){
      if(k === 'upholstery'){
        STATE.upholstery.touched = false;
        Object.keys(STATE.upholstery.items).forEach(function(i){ STATE.upholstery.items[i] = 0; });
        return;
      }
      var st = STATE[k];
      if(!st) return;
      st.mode = 'sqft'; st.sqft = 0; st.touched = false; st.collapsed = false;
      st.rooms = defaultRooms();
      st.addons = defaultAddons(k);
      if(k === 'carpet'){
        st.tier = 'deep';
        st.addons.dry.on = true;
        st.dryDefaultApplied = true;
      }
    });
  }

  /* Show one service group and hide the other. Called on load and whenever the
     property type changes. */
  /* Business name is required for every non-residential type, so the field only
     appears when it applies. Hiding also clears it, so a type switched back to
     Residential can't ship a stale business name the user can no longer see. */
  function syncBizField(){
    var sel = document.getElementById('eType'),
        wrap = document.getElementById('eBizField'),
        inp = document.getElementById('eBiz');
    if(!sel || !wrap) return;
    var need = sel.value !== 'Residential';
    wrap.hidden = !need;
    if(inp){
      inp.required = need;
      if(!need) inp.value = '';
    }
  }

  function syncSvcGroup(){
    syncBizField();
    var comm = commercialMode();
    var show = comm ? COMM_SVCS : RES_SVCS;
    var hide = comm ? RES_SVCS  : COMM_SVCS;

    clearGroup(hide);

    document.querySelectorAll('input[name="svc"]').forEach(function(el){
      var on = show.indexOf(el.value) > -1;
      var lab = document.querySelector('label[for="' + el.id + '"]');
      el.disabled = !on;
      el.hidden = !on;
      if(lab) lab.hidden = !on;
    });

    var lgnd = document.getElementById('svcLegend');
    if(lgnd) lgnd.textContent = comm ? 'Commercial Cleaning Service' : 'Cleaning Service';

    /* If the tab that was open belongs to the group being hidden, land on the
       first tab of the group now showing. */
    var cur = document.querySelector('input[name="svc"]:checked');
    if(!cur || show.indexOf(cur.value) === -1){
      var first = document.querySelector('input[name="svc"][value="' + show[0] + '"]');
      if(first) first.checked = true;
    }
    syncService();
  }

  function syncService(){
    activeSvc = svc();
    var s = SERVICES[activeSvc], isArea = s.mode === 'area', st = STATE[activeSvc];

    removeRoomBreakout();
    areaFields.style.display = isArea ? '' : 'none';
    uphFields.style.display  = isArea ? 'none' : '';
    tierField.style.display  = (activeSvc==='carpet') ? '' : 'none';
    /* Commercial is priced straight off square footage, so the rooms/sq-ft
       toggle is hidden — but the square-feet box itself lives in the same row
       and must stay visible, so only the toggle is hidden, not the row. */
    var mToggle = document.querySelector('.measureRow > .seg');
    if(mToggle) mToggle.style.display = isComm(activeSvc) ? 'none' : '';
    if(isComm(activeSvc)) STATE[activeSvc].mode = 'sqft';

    if(isArea){
      document.getElementById(st.mode==='room' ? 'mRoom' : 'mSqft').checked = true;
      qty.value = st.sqft;
      if(activeSvc === 'carpet'){
        var tid = st.tier==='deep' ? 'tDeep' : (st.tier==='signature' ? 'tSig' : (st.tier==='quickdry' ? 'tQuick' : 'tEss'));
        document.getElementById(tid).checked = true;
      }
      applyRoomValuesFromState();
      syncMode();
      if(st.mode === 'room'){
        if(st.collapsed) closeRoomPicker(); else openRoomPicker();
      }
    } else {
      renderUphItems();
    }
    renderAddons();
    syncRoomsDone();

    calc();
  }

  /* Pure calculation from stored state, independent of which tab is on screen — this
     is what lets the estimate add up every service the person has entered, even the
     ones they're not currently looking at. Returns the itemized components (base
     cleaning cost, stairs, each priced add-on) so the estimate can show a full
     price breakdown, not just a single lump total. */
  function computeServiceItems(svcKey){
    var s = SERVICES[svcKey], st = STATE[svcKey], items = [];

    if(s.mode === 'area'){
      var sqft = 0, flatRooms = 0, roomList = [];
      if(st.mode === 'room'){
        ROOM_TYPES.forEach(function(rt){
          var q = st.rooms[rt.key] || 0;
          if(rt.flat != null) flatRooms += q * rt.flat; else sqft += q * rt.sqft;
          /* Keep the rooms that were actually picked so the estimate can show
             what produced the square footage. Stairs price flat and print their
             own line, so they're excluded here. */
          if(q > 0 && rt.flat == null) roomList.push({ name:rt.name, qty:q, sqft:q * rt.sqft });
        });
      } else {
        sqft = st.sqft || 0;
      }
      var rate = (svcKey === 'carpet') ? s.tiers[st.tier || 'essential'].sqft : s.rate;
      var tierName = (svcKey==='carpet') ? s.tiers[st.tier||'essential'].name : s.name;

      if(sqft > 0){
        items.push({
          label: tierName + ' \u2014 ' + sqft.toLocaleString() + ' sq ft @ $' + rate.toFixed(2) + '/sq ft',
          cost: sqft * rate,
          rooms: roomList
        });
      }
      // If the stairs add-on is checked it prints its own line below; don't print twice.
      if(flatRooms > 0 && !(st.addons.stairs && st.addons.stairs.on)){
        items.push({ label: 'Flights of Stairs', cost: flatRooms });
      }

      Object.keys(s.addons || {}).forEach(function(k){
        var a = s.addons[k], ast = st.addons[k];
        // Signature bakes drying, deodorizer, and protector permanently into its $0.65
        // flat rate — never billed separately, no matter the checkbox state. Deep only
        // bakes in the CRB surcharge (invisible, in the base rate); drying is a normal
        // priced add-on there, so it's charged/credited like any other checkbox.
        if(svcKey==='carpet' && st.tier==='signature' && ['dry','deo','prot'].indexOf(k) > -1) return;
        if(svcKey==='carpet' && st.tier==='essential' && ['prot','filter'].indexOf(k) > -1) return;
        // Quick Dry bakes express drying into its $0.37 flat rate, and stain
        // protector isn't offered with encapsulation.
        if(svcKey==='carpet' && st.tier==='quickdry' && ['dry','prot'].indexOf(k) > -1) return;
        if(!ast || !ast.on) return;
        var cost;
        // Stairs is entered in two places (this add-on and the room picker) but is one
        // number: both read/write st.rooms.stairs, so it can never double-charge.
        if(k === 'stairs') cost = (st.rooms.stairs || 0) * a.linear;
        else if(a.needsQty)  cost = (ast.qty||0) * a.linear;
        else if(a.flat) cost = a.flat;
        else            cost = sqft * a.sqft;
        if(cost > 0) items.push({ label: a.name, cost: cost });
      });

      return items;
    }

    s.items.forEach(function(it){
      var qty = st.items[it.key] || 0;
      if(qty <= 0) return;
      items.push({
        label: it.name + ' \u00d7 ' + qty,
        cost: qty * it.ft * s.rate
      });
    });
    return items;
  }

  function computeServiceCost(svcKey){
    return computeServiceItems(svcKey).reduce(function(sum, it){ return sum + it.cost; }, 0);
  }

  function serviceLineLabel(svcKey){
    var s = SERVICES[svcKey], st = STATE[svcKey];
    if(s.mode === 'area'){
      var sqft = 0, flatRooms = 0;
      if(st.mode === 'room'){
        ROOM_TYPES.forEach(function(rt){
          var q = st.rooms[rt.key] || 0;
          if(rt.flat != null) flatRooms += q * rt.flat; else sqft += q * rt.sqft;
        });
      } else {
        sqft = st.sqft || 0;
      }
      var name = (svcKey==='carpet') ? s.tiers[st.tier||'essential'].name : s.name;
      var sizeTxt = sqft.toLocaleString() + ' sq ft';
      if(flatRooms) sizeTxt += ' + $' + flatRooms.toLocaleString();
      return name + ' \u2014 ' + sizeTxt;
    }
    var totalFt = s.items.reduce(function(sum,it){ return sum + (st.items[it.key]||0)*it.ft; }, 0);
    return s.name + ' \u2014 ' + totalFt.toLocaleString() + ' linear ft';
  }

  /* Only services the person has actually entered numbers for — not defaults. */
  function buildBreakdown(){
    var breakdown = [], sum = 0;
    Object.keys(SERVICES).forEach(function(k){
      if(!STATE[k].touched) return;
      var items = computeServiceItems(k);
      var cost = items.reduce(function(s,it){ return s + it.cost; }, 0);
      if(cost <= 0) return;
      breakdown.push({ key:k, label:serviceLineLabel(k), cost:cost, items:items });
      sum += cost;
    });
    return { breakdown:breakdown, sum:sum };
  }

  /* Combined square footage across every floor-type service (carpet, tile, stone,
     LVP) the person has actually entered — upholstery is excluded since it's priced
     by linear feet, not floor area. */
  function combinedFloorSqft(){
    var total = 0;
    Object.keys(SERVICES).forEach(function(k){
      if(SERVICES[k].mode !== 'area') return;
      if(!STATE[k].touched) return;
      total += currentSqft(k);
    });
    return total;
  }

  function calc(){
    var b = buildBreakdown();

    if(!b.breakdown.length){
      linesEl.innerHTML = '';
      totalEl.textContent = '0';
      var dl0 = document.getElementById('discLines'); if(dl0){ dl0.innerHTML = ''; dl0.hidden = true; }
      totalSqftNumEl.textContent = '';
      totalSqftLabelEl.textContent = '';
      minEl.textContent = 'Enter your rooms, square footage, or furniture above to build your estimate.';
      window.KC_quote = null;
      return;
    }

    /* Discount: dollars or percent, never both (the two boxes clear each other).
       It comes off the subtotal, and the MIN_JOB floor still holds: the discount
       is capped so subtotal - discount = total always adds up on the quote. */
    var dAmtEl = document.getElementById('discAmt'), dPctEl = document.getElementById('discPct');
    var dAmt = dAmtEl ? Math.max(0, +dAmtEl.value || 0) : 0;
    var dPct = dPctEl ? Math.min(100, Math.max(0, +dPctEl.value || 0)) : 0;
    var wanted = Math.round(dAmt > 0 ? dAmt : b.sum * dPct / 100);
    var disc = Math.min(wanted, Math.max(0, Math.round(b.sum - MIN_JOB)));
    var applied = Math.max(b.sum - disc, MIN_JOB);
    var discEl = document.getElementById('discLines');
    if(discEl){
      if(disc > 0){
        discEl.innerHTML = '<li><span>Subtotal</span><span>$'+money(b.sum)+'</span></li>' +
          '<li class="discLine"><span>Discount'+(dAmt > 0 ? '' : ' ('+dPct+'%)')+'</span><span>\u2212$'+money(disc)+'</span></li>';
        discEl.hidden = false;
      } else { discEl.innerHTML = ''; discEl.hidden = true; }
    }
    /* On screen the size goes on its own line and the dash disappears. This is
       done here rather than in the label itself because the same label strings
       are reused for the plain-text email below, where a <br> would show up
       literally. Only the first dash is replaced, so "@ $0.47/sq ft" stays put. */
    var twoLine = function(t){ return String(t).replace(' \u2014 ', '<br>'); };
    linesEl.innerHTML = b.breakdown.map(function(r){
      var head = '<li class="lineItem"><span>'+twoLine(r.label)+'</span><span>$'+money(r.cost)+'</span></li>';
      var subs = r.items.map(function(it){
        var line = '<li class="lineItem__sub"><span>'+twoLine(it.label)+'</span><span>$'+money(it.cost)+'</span></li>';
        /* Rooms that produced the footage above. No dollar figure — the money is
           on the line they sit under. Only room-mode items carry this. */
        if(it.rooms && it.rooms.length){
          line += it.rooms.map(function(rm){
            var nm = rm.qty > 1 ? rm.name + ' \u00d7 ' + rm.qty : rm.name;
            return '<li class="lineItem__room"><span>'+nm+'</span><span>'+rm.sqft.toLocaleString()+' sq ft</span></li>';
          }).join('');
        }
        return line;
      }).join('');
      return head + subs;
    }).join('');
    totalEl.textContent = money(applied);
    var sqftTotal = combinedFloorSqft();
    totalSqftNumEl.textContent = sqftTotal > 0 ? sqftTotal.toLocaleString() : '';
    totalSqftLabelEl.textContent = sqftTotal > 0 ? 'total sq ft across all floor types' : '';
    minEl.textContent = applied > b.sum
      ? 'Minimum service charge of $' + money(MIN_JOB) + ' applied.'
      : (wanted > disc ? 'Discount limited by the $' + money(MIN_JOB) + ' minimum service charge.' : '');
    /* What's on screen right now, for send.js to save. Same numbers the panel shows. */
    window.KC_quote = {
      lines: b.breakdown, subtotal: b.sum, discount: disc,
      discountLabel: disc > 0 ? 'Discount' + (dAmt > 0 ? '' : ' (' + dPct + '%)') : '',
      total: applied, minApplied: applied > b.sum, sqftTotal: sqftTotal
    };
  }

  /* Discount boxes: typing in one empties the other, then reprice. */
  ['discAmt','discPct'].forEach(function(id, i){
    var el = document.getElementById(id), other = document.getElementById(i ? 'discAmt' : 'discPct');
    if(!el) return;
    el.addEventListener('input', function(){ if(el.value !== '' && other) other.value = ''; calc(); });
  });

  document.getElementById('plus').addEventListener('click', function(){
    qty.value = (+qty.value||0) + (+qty.step||1);
    STATE[activeSvc].sqft = +qty.value; STATE[activeSvc].touched = true; calc();
  });
  document.getElementById('minus').addEventListener('click', function(){
    qty.value = Math.max(0,(+qty.value||0) - (+qty.step||1));
    STATE[activeSvc].sqft = +qty.value; STATE[activeSvc].touched = true; calc();
  });
  qty.addEventListener('input', function(){
    STATE[activeSvc].sqft = +qty.value || 0; STATE[activeSvc].touched = true; calc();
  });
  document.querySelectorAll('input[name="svc"]').forEach(function(el){ el.addEventListener('change', syncService); });
  (function(){
    var sel = document.getElementById('eType');
    if(sel) sel.addEventListener('change', syncSvcGroup);
  })();
  document.querySelectorAll('input[name="mode"]').forEach(function(el){
    el.addEventListener('change', function(){
      STATE[activeSvc].mode = mode();
      STATE[activeSvc].touched = true;
      syncMode();
      if(mode()==='room'){
        if(STATE[activeSvc].collapsed) closeRoomPicker(); else openRoomPicker();
      }
      calc();
    });
  });
  document.querySelectorAll('input[name="tier"]').forEach(function(el){
    el.addEventListener('change', function(){
      STATE.carpet.tier = tier();
      STATE.carpet.touched = true;
      // Each package is defined partly by what it does NOT include, so picking
      // one clears the add-ons that would otherwise turn it into a higher tier:
      // Deep drops deodorizer + protector, Essential drops deodorizer + drying.
      var tierClears = { deep:['deo','prot'], essential:['deo','dry'] }[tier()];
      if(svc() === 'carpet' && tierClears){
        tierClears.forEach(function(k){
          if(STATE.carpet.addons[k]) STATE.carpet.addons[k].on = false;
          var input = addsList.querySelector('[data-add="' + k + '"]');
          if(input) input.checked = false;
        });
      }
      if(tier() === 'deep' && !STATE.carpet.dryDefaultApplied){
        STATE.carpet.addons.dry = STATE.carpet.addons.dry || {};
        STATE.carpet.addons.dry.on = true;
        STATE.carpet.dryDefaultApplied = true;
      }
      syncTierAddonLocks();
      calc();
    });
  });
  document.querySelectorAll('[data-select-tier]').forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      var svcCarpet = document.getElementById('svcCarpet');
      if(!svcCarpet.checked){
        svcCarpet.checked = true;
        svcCarpet.dispatchEvent(new Event('change'));
      }
      var tierInput = document.getElementById(a.dataset.selectTier);
      tierInput.checked = true;
      tierInput.dispatchEvent(new Event('change'));
      var sec = document.getElementById('estimate');
      if(sec) sec.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });
  document.getElementById('roomsOk').addEventListener('click', finishRooms);
  document.getElementById('roomsDone').addEventListener('click', finishRooms);
  /* Any tap on a service clears the hint — click catches taps on the already-selected one too. */
  document.getElementById('svcRow').addEventListener('click', clearSvcHint);
  document.querySelector('label[for="mRoom"]').addEventListener('click', function(){
    STATE[activeSvc].mode = 'room';
    STATE[activeSvc].touched = true;
    syncMode();
    openRoomPicker();
    calc();
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        if(roomBlock) roomBlock.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    });
  });
  window.addEventListener('resize', function(){
    if(roomPicker.style.display !== 'none' && roomFields.style.display !== 'none'){
      applyRoomBreakout();
    }
  });

  renderRoomList();
  syncMode();
  /* Calls syncService() itself, after picking the right group for the property
     type the form loaded with. */
  syncSvcGroup();


  /* ---- New estimate: one button, resets every service to zero ---- */
  (function(){
    var newBtn = document.getElementById('eNewBtn'),
        dlg    = document.getElementById('estClearDlg');
    if(!newBtn || !dlg) return;

    function clearAll(){
      initState();
      var notes = document.getElementById('eNotes');
      if(notes) notes.value = '';
      ['discAmt','discPct'].forEach(function(id){ var d = document.getElementById(id); if(d) d.value = ''; });
      syncService();
      calc();
      window.scrollTo({ top:0, behavior:'smooth' });
    }

    newBtn.addEventListener('click', function(){
      newBtn.blur();
      if(typeof dlg.showModal === 'function') dlg.showModal();
      else if(window.confirm('Start a new estimate?')) clearAll();
    });

    dlg.addEventListener('click', function(e){
      var btn = e.target.closest('[data-clear]');
      if(!btn) return;
      var what = btn.getAttribute('data-clear');
      dlg.close();
      if(what === 'all') clearAll();
    });
  })();

  /* ---- Edit a saved estimate. send.js calls these two. ----
     KC_snapshot()     the form choices behind the estimate on screen; saved with every quote.
     KC_restore(form)  put saved choices back on screen and reprice. */

  window.KC_snapshot = function(){
    var dA = document.getElementById('discAmt'), dP = document.getElementById('discPct');
    return JSON.parse(JSON.stringify({
      v:1, active: activeSvc, state: STATE,
      discAmt: dA ? dA.value : '', discPct: dP ? dP.value : ''
    }));
  };

  window.KC_restore = function(form){
    if(!form || !form.state) return false;
    initState();
    Object.keys(STATE).forEach(function(k){
      var saved = form.state[k], cur = STATE[k];
      if(!saved) return;
      Object.keys(saved).forEach(function(p){
        /* Merge these so a room or add-on added to the app later still gets its default. */
        if(p === 'rooms' || p === 'addons' || p === 'items') cur[p] = Object.assign(cur[p] || {}, saved[p]);
        else cur[p] = saved[p];
      });
    });
    var dA = document.getElementById('discAmt'), dP = document.getElementById('discPct');
    if(dA) dA.value = form.discAmt || '';
    if(dP) dP.value = form.discPct || '';
    var t = STATE.carpet.tier, tid = t==='signature' ? 'tSig' : (t==='quickdry' ? 'tQuick' : (t==='essential' ? 'tEss' : 'tDeep'));
    document.getElementById(tid).checked = true;
    var radio = document.querySelector('input[name="svc"][value="' + (form.active || 'carpet') + '"]');
    if(radio) radio.checked = true;
    /* The property type dropdown is restored by send.js before this runs, so
       syncSvcGroup shows the matching group. It clears the other group, which
       is safe: a saved quote is never a mix of the two. It also calls
       syncService itself. */
    syncSvcGroup();
    if(radio && !radio.hidden) radio.checked = true;
    syncService();
    return true;
  };

  /* Phase 2 hook: a "Text this estimate" button would call buildBreakdown()
     and calc() here. Nothing sends anything today. */
})();
