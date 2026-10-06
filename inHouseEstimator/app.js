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
    { key:'stairs',     name:'Flight of Stairs',          flat:100, step:0.5 },
    { key:'addSqft',    name:'Additional Square Feet',    sqft:1,   step:10, captionText:'' }
  ];

  var SERVICES = {
    carpet: {
      name: 'Carpet Cleaning',
      mode: 'area',
      tiers: {
        essential: { name:'Essential Cleaning', sqft:0.37 },
        deep:      { name:'Deep Cleaning',      sqft:0.50 },
        signature: { name:'Signature Cleaning', sqft:0.65 },
        quickdry:  { name:'Quick Dry Encapsulation', sqft:0.37 }
      },
      addons: {
        stairs: { name:'Flight of Stairs', linear:100, needsQty:true, qtyDefault:1, qtyStep:0.5,
                   text:'$100 per flight' },
        rug:    { name:'Area Rugs', text:'$50 / $75 per rug',
                   sizes:[ { key:'med', label:'Medium (5\u00d78)', price:50 },
                           { key:'lg',  label:'Large (9\u00d712)', price:75 } ] },
        hair:   { name:'Hair & debris removal', sqft:0.12 },
        deo:    { name:'Deodorizer',            sqft:0.05 },
        prot:   { name:'Stain protector',      sqft:0.10 },
        dry:    { name:'Accelerated drying',    sqft:0.03 },
        filter: { name:'Filter line cleaning',  linear:0.45, needsQty:true, qtyDefault:0, qtyStep:10 },
        stretch:{ name:'Carpet Stretching',      linear:100,  needsQty:true, qtyDefault:0, qtyStep:1,
                   text:'$100 starting per room', disclaimer:'All furniture must be removed and carpet must be in good condition.' },
        pet:    { name:'Pet odor treatment',    linear:50, needsQty:true, qtyDefault:0, qtyStep:1, text:'$50 starting per spot' },
        stain:  { name:'Stain treatment',       linear:15, needsQty:true, qtyDefault:0, qtyStep:1, text:'$15 starting per spot' }
      },
      quoteValue: 'Carpet cleaning'
    },
    tile: {
      name: 'Tile & Grout Cleaning',
      mode: 'area',
      rate: 0.85,
      addons: {
        stairs: { name:'Flight of Stairs', linear:100, needsQty:true, qtyDefault:1, qtyStep:0.5,
                   text:'$100 per flight' },
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
      addons: {
        stairs: { name:'Flight of Stairs', linear:100, needsQty:true, qtyDefault:1, qtyStep:0.5,
                   text:'$100 per flight' }
      },
      quoteValue: 'Natural stone'
    },
    lvp: {
      name: 'Hardwood/LVP Cleaning',
      mode: 'area',
      rate: 0.50,
      addons: {
        stairs: { name:'Flight of Stairs', linear:100, needsQty:true, qtyDefault:1, qtyStep:0.5,
                   text:'$100 per flight' }
      },
      quoteValue: 'Hardwood/LVP'
    },
    commcarpet: {
      name: 'Commercial Carpet',
      mode: 'area',
      rate: 0.50,
      addons: {
        stairs: { name:'Flight of Stairs', linear:100, needsQty:true, qtyDefault:1, qtyStep:0.5,
                   text:'$100 per flight' },
        stain: { name:'Stain treatment', linear:15, needsQty:true, qtyDefault:0, qtyStep:1,
                 text:'$15 starting per spot' }
      },
      quoteValue: 'Commercial carpet'
    },
    commhard: {
      name: 'Commercial Hard Floor',
      mode: 'area',
      rate: 0.50,
      addons: {
        stairs: { name:'Flight of Stairs', linear:100, needsQty:true, qtyDefault:1, qtyStep:0.5,
                   text:'$100 per flight' }
      },
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
      if(defs[k].sizes){ o[k].sizes = {}; defs[k].sizes.forEach(function(z){ o[k].sizes[z.key] = 0; }); }
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
      /* Area Rugs: a heading, then one line per size, each with its own -/+ ticker. */
      if(a.sizes){
        return '<div class="add" style="flex-direction:column;align-items:stretch;gap:.35rem;cursor:default">'+
               '<span>'+a.name+'</span>'+
               a.sizes.map(function(z){
                 var id = k+'.'+z.key;
                 return '<div data-sizerow="'+id+'" style="display:flex;align-items:center;gap:.85rem;margin-left:1.1rem;padding:.45rem .6rem .45rem 1rem;border:1px solid var(--line-d);border-radius:var(--r-md);cursor:pointer">'+
                        '<span>'+z.label+' <span class="add__c">$'+z.price+'</span></span>'+
                        '<div class="step step--sm" style="margin-left:auto">'+
                          '<button type="button" data-sizeminus="'+id+'" aria-label="Decrease">&minus;</button>'+
                          '<input type="number" data-size="'+id+'" value="0" min="0" step="1" aria-label="'+a.name+' '+z.label+' quantity">'+
                          '<button type="button" data-sizeplus="'+id+'" aria-label="Increase">+</button>'+
                        '</div>'+
                      '</div>';
               }).join('')+
             '</div>';
      }
      if(a.needsQty){
        var disclaimer = a.disclaimer ? '<br><span class="roomDisclaimer">'+a.disclaimer+'</span>' : '';
        var tap = (k==='filter'||k==='stretch'||k==='pet'||k==='stain') ? ' data-addrow="'+k+'" style="cursor:pointer"' : '';
        if(a.qtyDropdown){
          var opts = '';
          for(var n=0; n<=10; n++){ opts += '<option value="'+n+'"'+(n===0?' selected':'')+'>'+n+'</option>'; }
          return '<div class="add addQty"'+tap+'>'+
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
        return '<div class="add addQty"'+tap+'>'+
               '<label class="addQty__toggle">'+
                 '<input type="checkbox" data-add="'+k+'">'+
                 '<span><span data-addname="'+k+'">'+a.name+'</span> <span class="add__c">'+price+'</span>'+disclaimer+'</span>'+
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
        var step = +inp.step || 1, cur = +inp.value || 0;
        /* Stairs: first press goes straight to 1 flight (like the room picker), then half steps. */
        inp.value = (k === 'stairs' && cur === 0) ? 1 : cur + step;
        inp.dispatchEvent(new Event('input', {bubbles:true}));
      });
    });
    /* Tap-to-add rows (Filter line, Carpet Stretching, Pet odor, Stain treatment):
       tapping the row adds one step (10 linear ft for Filter, 1 for the dropdowns).
       The checkbox, dropdown and -/+ buttons keep their own behavior. */
    addsList.querySelectorAll('[data-addrow]').forEach(function(row){
      row.addEventListener('click', function(e){
        if(e.target.closest('input, select, button, .step')) return;
        var k = row.dataset.addrow, cb = addsList.querySelector('[data-add="'+k+'"]');
        e.preventDefault();
        if(cb && cb.disabled) return;
        var plus = row.querySelector('[data-addqtyplus]');
        if(plus){ plus.click(); return; }
        var sel = row.querySelector('select[data-addqty]');
        if(sel && sel.selectedIndex < sel.options.length - 1){
          sel.selectedIndex++;
          sel.dispatchEvent(new Event('change', {bubbles:true}));
        }
      });
    });
    /* Area Rug size tickers: each size keeps its own count; the add-on is "on" while any count is above 0. */
    addsList.querySelectorAll('[data-size]').forEach(function(el){
      var p = el.dataset.size.split('.'), k = p[0], z = p[1];
      st.addons[k] = st.addons[k] || { on:false };
      st.addons[k].sizes = st.addons[k].sizes || {};
      el.value = st.addons[k].sizes[z] || 0;
      el.addEventListener('input', function(){
        var v = Math.max(0, Math.floor(+el.value || 0)), ast = st.addons[k];
        ast.sizes[z] = v;
        ast.on = Object.keys(ast.sizes).some(function(x){ return ast.sizes[x] > 0; });
        st.touched = true;
        calc();
      });
    });
    addsList.querySelectorAll('[data-sizeminus],[data-sizeplus]').forEach(function(el){
      el.addEventListener('click', function(){
        var id = el.dataset.sizeminus || el.dataset.sizeplus,
            inp = addsList.querySelector('[data-size="'+id+'"]');
        if(!inp) return;
        var cur = +inp.value || 0;
        inp.value = el.dataset.sizeminus ? Math.max(0, cur - 1) : cur + 1;
        inp.dispatchEvent(new Event('input', {bubbles:true}));
      });
    });
    /* Tap anywhere on a size bubble to add one, same as pressing +.
       Taps on the -/+ ticker or the number box are skipped so they don't count twice. */
    addsList.querySelectorAll('[data-sizerow]').forEach(function(row){
      row.addEventListener('click', function(e){
        if(e.target.closest('.step')) return;
        var plus = row.querySelector('[data-sizeplus]');
        if(plus) plus.click();
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
      if(t === 'signature' || t === 'quickdry' || t === 'deep'){
        STATE.carpet.addons.dry = STATE.carpet.addons.dry || {};
        STATE.carpet.addons.dry.on = true;
        dryInput.checked = true;
        dryInput.disabled = true;
        if(dryLabel) dryLabel.style.opacity = '.7';
        if(dryCaption) dryCaption.textContent = (t === 'quickdry')
          ? 'Included in Quick Dry' : (t === 'deep') ? 'Included in this package' : 'Required for Signature';
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
      return '<div class="add" data-uphrow style="cursor:pointer;background:#172239;border:1px solid var(--brass,#C9982D);border-radius:12px;padding:12px 14px;margin-bottom:8px">'+
             '<span style="flex:1"><span style="color:var(--brass,#C9982D)">'+it.name+'</span> <span class="add__c" style="display:block">'+it.ft+' linear ft &times; $'+SERVICES.upholstery.rate+'</span></span>'+
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
    uphList.querySelectorAll('[data-uphrow]').forEach(function(row){
      row.addEventListener('click', function(e){
        if(e.target.closest('.step')) return;
        var plus = row.querySelector('[data-uphplus]');
        if(plus) plus.click();
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
             '<span><span data-roomname="'+rt.key+'">'+rt.name+'</span> <span class="add__c">'+caption+'</span>'+disclaimer+'</span>'+
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
      /* Each picked room's own price (its sq ft at this rate), so the estimate and the
         customer's quote can show the rooms adding up. A grouped line (Bedroom × 3) gets one price. */
      roomList.forEach(function(rm){ rm.cost = rm.sqft * rate; });

      if(sqft > 0){
        items.push({
          label: tierName + ' \u2014 ' + sqft.toLocaleString() + ' sq ft @ $' + rate.toFixed(2) + '/sq ft',
          cost: sqft * rate,
          rooms: roomList
        });
      }
      // If the stairs add-on is checked it prints its own line below; don't print twice.
      if(flatRooms > 0 && !(st.addons.stairs && st.addons.stairs.on)){
        items.push({ label: ((st.rooms.stairs || 0) > 1) ? 'Flights of Stairs' : 'Flight of Stairs', cost: flatRooms });
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
        // Deep bakes drying into its $0.50 rate: listed as "Included", never billed.
        if(svcKey==='carpet' && st.tier==='deep' && k==='dry'){ items.push({ label: a.name, cost: 0, included: true }); return; }
        if(!ast || !ast.on) return;
        // Area Rugs: one line per size with a count, e.g. "Area Rugs — Medium (5×8) × 2".
        if(a.sizes){
          a.sizes.forEach(function(z){
            var n = (ast.sizes && ast.sizes[z.key]) || 0;
            if(n > 0) items.push({ label: a.name + ' \u2014 ' + z.label + ' \u00d7 ' + n, cost: n * z.price });
          });
          return;
        }
        var cost;
        // Stairs is entered in two places (this add-on and the room picker) but is one
        // number: both read/write st.rooms.stairs, so it can never double-charge.
        if(k === 'stairs') cost = (st.rooms.stairs || 0) * a.linear;
        else if(a.needsQty)  cost = (ast.qty||0) * a.linear;
        else if(a.flat) cost = a.flat;
        else            cost = sqft * a.sqft;
        if(cost > 0) items.push({ label: (k === 'stairs' && (st.rooms.stairs || 0) > 1) ? 'Flights of Stairs' : a.name, cost: cost });
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
    /* Stairs label: "Flight of Stairs" up to 1, "Flights of Stairs" above 1 (1.5 counts as
       plural), on both the add-on row and the room-picker row, for whichever service is open. */
    var stairsSt = STATE[activeSvc] && STATE[activeSvc].rooms;
    if(stairsSt){
      var stairsTxt = ((stairsSt.stairs || 0) > 1) ? 'Flights of Stairs' : 'Flight of Stairs';
      var stairsAdd  = addsList && addsList.querySelector('[data-addname="stairs"]');
      var stairsRoom = roomList && roomList.querySelector('[data-roomname="stairs"]');
      if(stairsAdd)  stairsAdd.textContent  = stairsTxt;
      if(stairsRoom) stairsRoom.textContent = stairsTxt;
    }
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
       It comes off the subtotal and has the final say: the MIN_JOB floor only
       applies when there is no discount. Capped at the subtotal so the total
       never goes below $0, and subtotal - discount = total always adds up. */
    var dAmtEl = document.getElementById('discAmt'), dPctEl = document.getElementById('discPct');
    var dAmt = dAmtEl ? Math.max(0, +dAmtEl.value || 0) : 0;
    var dPct = dPctEl ? Math.min(100, Math.max(0, +dPctEl.value || 0)) : 0;
    var wanted = Math.round(dAmt > 0 ? dAmt : b.sum * dPct / 100);
    var disc = Math.min(wanted, b.sum);
    var waiveEl = document.getElementById('waiveMin'), waived = !!(waiveEl && waiveEl.checked);
    var applied = disc > 0 ? b.sum - disc : (waived ? b.sum : Math.max(b.sum, MIN_JOB));
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
        var line = '<li class="lineItem__sub"><span>'+twoLine(it.label)+'</span><span>'+(it.included ? 'Included' : '$'+money(it.cost))+'</span></li>';
        /* Rooms that produced the footage above, each with its sq ft and its own price.
           Only room-mode items carry this. */
        if(it.rooms && it.rooms.length){
          line += it.rooms.map(function(rm){
            var nm = rm.qty > 1 ? rm.name + ' \u00d7 ' + rm.qty : rm.name;
            var price = rm.cost != null ? ' · $' + money(rm.cost) : '';   /* the room's own price */
            return '<li class="lineItem__room"><span>'+nm+'</span><span>'+rm.sqft.toLocaleString()+' sq ft'+price+'</span></li>';
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
      : '';
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
  /* Waive minimum: checked = no $150 floor on this estimate. */
  (function(){ var w = document.getElementById('waiveMin'); if(w) w.addEventListener('change', calc); })();

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
      var jobDate = document.getElementById('eWhen');   // Job date clears with everything else
      if(jobDate) jobDate.value = '';
      var jobTime = document.getElementById('eWhenTime');   // and its AM/PM start time
      if(jobTime) jobTime.value = '';
      ['discAmt','discPct'].forEach(function(id){ var d = document.getElementById(id); if(d) d.value = ''; });
      var wm = document.getElementById('waiveMin'); if(wm) wm.checked = false;
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
      discAmt: dA ? dA.value : '', discPct: dP ? dP.value : '',
      waiveMin: !!(document.getElementById('waiveMin') || {}).checked
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
    var wm = document.getElementById('waiveMin'); if(wm) wm.checked = !!form.waiveMin;
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

  /* Number boxes: clicking into one that reads 0 empties it, so typing 8 gives 8, not 08.
     Leaving it empty puts the 0 back. Delegated, so boxes drawn later are covered too.
     Boxes that start empty (the discount boxes) are left alone. */
  document.addEventListener('focusin', function(e){
    var t = e.target;
    if(t.matches && t.matches('input[type="number"]') && t.value === '0') t.value = '';
  });
  document.addEventListener('focusout', function(e){
    var t = e.target;
    if(t.matches && t.matches('input[type="number"]') && t.value === '' && !t.placeholder) t.value = '0';
  });

  /* Job date: a month calendar that opens from the date box, drawn from the booking
     calendar (getOpenSlots). Each day shows AM and PM: white = open, grey = booked.
     Under $450: tap AM (starts 9:00) or PM (starts 1:00). That sets the date and the
     start time, so once the customer approves, the job takes only that half of the day.
     Both grey = the day is full and can't be picked.
     $450 or more takes the whole day: only days with nothing booked can be picked
     (tap the day); every other day is greyed out.
     Past days and days past the 60-day booking window are grey too.
     Tap the picked one again, or Clear, to un-pick. A dated job with no time holds the whole day.
     An estimate reopened with a date that has since been booked keeps it, with a red
     heads-up line under the box; it still saves.
     Nothing is held while the estimate is out; the slot is taken once the customer approves.
     If the open days can't load, the plain date box stays and works as before. */
  (function(){
    var when = document.getElementById('eWhen'), time = document.getElementById('eWhenTime'),
        box  = document.getElementById('eOpen');
    if(!when || !time || !box || !window.fetch) return;
    var URL = 'https://us-central1-khean-estimator-78f3e.cloudfunctions.net/getOpenSlots';
    var WHOLE_DAY_AT = 450, SLOT = { am:'09:00', pm:'13:00' };
    var MONTHS = ['January','February','March','April','May','June','July',
                  'August','September','October','November','December'];
    var byDate = null, first = '', last = '';   // the days getOpenSlots sent, by date; the first and last of them
    var big = null, shown = '', loadedAt = 0;   // $450+ month on screen?; month on screen ("2026-10"); when the days came in
    var lab = document.querySelector('label[for="eWhen"]');
    function isBig(){ return !!(window.KC_quote && Number(window.KC_quote.total) >= WHOLE_DAY_AT); }
    function isDay(s){ return /^\d{4}-\d{2}-\d{2}$/.test(s); }
    function hasTime(){ return /^\d\d:\d\d$/.test(time.value); }
    function pad(n){ return ('0' + n).slice(-2); }
    function label(day){
      var p = day.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
      return dt.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
    }
    function clock(t){ var h = +t.slice(0, 2); return (h % 12 || 12) + ':' + t.slice(3, 5); }

    /* The box you tap: shows the pick and opens the month. It takes the plain date
       box's place once the days load. The heads-up line sits under the month. */
    var btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'eWhenBtn'; btn.className = 'jobPick is-empty'; btn.hidden = true;
    btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'eOpen');
    btn.innerHTML = '<span class="jobPick__txt">Pick a day</span>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2Zm-2 8v10h14V10H5Z"/></svg>';
    when.parentNode.insertBefore(btn, when.nextSibling);
    var warn = document.createElement('p');
    warn.className = 'jobOpen__warn'; warn.hidden = true;
    box.parentNode.insertBefore(warn, box.nextSibling);

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
        '<p class="jobCal__hint">' + (big
          ? 'This job is $' + WHOLE_DAY_AT + ' or more, so it takes the whole day. Tap an open day; grey days have something booked.'
          : 'Tap AM (starts 9:00) or PM (starts 1:00). Grey is booked.') + '</p>' +
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
    /* Show the pick: in the box you tap, and lit up in the month. Warn when a date
       (say, on a reopened estimate) clashes with something booked. */
    function paint(){
      if(!byDate) return;
      var day = isDay(when.value) ? when.value : '', whole = isBig() || !hasTime();
      var txt = !day ? 'Pick a day' : label(day) + ' \u00b7 ' +
        (whole ? 'All day' : (time.value < '13:00' ? 'AM' : 'PM') + ' (starts ' + clock(time.value) + ')');
      var t = btn.firstChild;
      if(t.textContent !== txt) t.textContent = txt;
      btn.classList.toggle('is-empty', !day);
      box.querySelectorAll('[data-cell]').forEach(function(c){
        c.classList.toggle('is-picked', c.getAttribute('data-cell') === day);
      });
      box.querySelectorAll('[data-slot]').forEach(function(b){
        var s = b.getAttribute('data-slot');
        var on = b.getAttribute('data-day') === day && (s === 'all' || time.value === SLOT[s]);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var d = byDate[day] || null;
      var need = !d ? [] : whole ? ['am', 'pm'] : [time.value < '13:00' ? 'am' : 'pm'];
      var clash = need.some(function(s){ return !d[s]; });
      var w = !clash ? '' : 'Heads up: ' + label(day) + (need.length > 1
        ? ' already has something booked, and this job would hold the whole day.'
        : need[0] === 'am' ? ' morning isn\u2019t open.' : ' afternoon isn\u2019t open.') + ' It will still save.';
      warn.hidden = !clash;
      if(warn.textContent !== w) warn.textContent = w;
    }
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
      } else if(b.hasAttribute('data-clear')){ when.value = ''; time.value = ''; paint(); }
      else if(b.hasAttribute('data-close')) close();
      else if(b.hasAttribute('data-slot')){
        if(b.getAttribute('aria-pressed') === 'true'){ when.value = ''; time.value = ''; paint(); return; }   // tap the picked one again to un-pick
        when.value = b.getAttribute('data-day');
        time.value = b.getAttribute('data-slot') === 'pm' ? SLOT.pm : SLOT.am;
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
    when.addEventListener('change', function(){ time.value = ''; paint(); });   // plain date box (days didn't load): no start time
    /* Price crossed $450 with the month open? Redraw. Otherwise repaint, since New and Edit change the pick. */
    function check(){ if(!byDate) return; if(!box.hidden && isBig() !== big) draw(); else paint(); }
    ['input', 'change', 'click'].forEach(function(t){
      document.addEventListener(t, function(){ setTimeout(check, 0); });
    });
    setInterval(check, 1500);   // catches changes made without an event, like Edit restoring a saved estimate
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
          if(btn.hidden){ when.hidden = true; btn.hidden = false; if(lab) lab.htmlFor = 'eWhenBtn'; }   // swap in the calendar box
          if(box.hidden) paint();
          else { if(shown < first.slice(0, 7)) shown = first.slice(0, 7); draw(); }
        })
        .catch(function(){ loadedAt = 0; });   // first time: the plain date box stays; later: the days already shown stay
    }
    load();
  })();

  /* Phase 2 hook: a "Text this estimate" button would call buildBreakdown()
     and calc() here. Nothing sends anything today. */
})();
