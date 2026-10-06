/* K&C prices and room sizes: the ONE place to change them.
   Used by the estimator (app.js) and the job sheet (job-sheet.html), so a price changed
   here changes in both. Loaded with a plain <script src="pricing.js"> before either. */
(function(){
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

  window.KC_PRICING = { ROOM_TYPES: ROOM_TYPES, SERVICES: SERVICES };
})();
