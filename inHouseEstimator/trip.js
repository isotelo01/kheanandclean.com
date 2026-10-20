/* Trip tracker on the job sheet (staff only). Saved on the job under `trip`, so it moves with the job
   into invoices and paidInvoices and shows on job-data.html.
   Drive  -> logs where/when you left, offers the on-my-way text, then opens Google Maps to the job.
   Opening the job sheet after a Drive -> logs that you arrived.
   Finish -> Go home (opens Google Maps home) or Next job. Logs time on site.
   Drive miles come from Google's route when it answered; otherwise (and for miles home) they're an
   estimate: straight-line distance x 1.25 for roads. GPS works with no service; the job
   sheet's offline copy holds the save until there's signal again. */
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js";
/* On my way text: Drive gets a Google traffic ETA (driveEta), adds 10 minutes, and offers to text the
   customer from the business line (smsSend). You can edit the text or skip it. */
const PAD_MIN = 10;

const ROAD = 1.25;
const HOME_KEY = "kcHomeSpot";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clock = t => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const dur = ms => { const m = Math.max(0, Math.round(ms / 60000)); return m < 60 ? m + " min" : Math.floor(m / 60) + "h " + (m % 60) + "m"; };
export function miles(a, b){
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 3958.8, r = x => x * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * ROAD * 10) / 10;
}
const home = () => { try { return JSON.parse(localStorage.getItem(HOME_KEY) || "null"); } catch (e) { return null; } };

/* One GPS fix. With no permission or no fix, still log the time (lat/lng left out). */
function spot(){
  return new Promise(res => {
    const t = Date.now();
    if (!navigator.geolocation) return res({ at: t });
    navigator.geolocation.getCurrentPosition(
      p => res({ at: t, lat: Math.round(p.coords.latitude * 1e5) / 1e5, lng: Math.round(p.coords.longitude * 1e5) / 1e5,
                 acc: Math.round(p.coords.accuracy) }),
      () => res({ at: t }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  });
}
/* Directions in Google Maps (opens the Google Maps app on the phone if it's installed). */
const gmaps = dest => "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + encodeURIComponent(dest);

/* box: an empty element on the job sheet. db/place/id: where the job lives. addr: the job address.
   trip: what's already saved on the job (q.trip). */
export function mountTrip({ box, db, place, id, addr, trip, phone, custName }){
  let t = Object.assign({}, trip || {});
  const fns = getFunctions(db.app, "us-central1");
  const driveEta = httpsCallable(fns, "driveEta", { timeout: 20000 }), smsSend = httpsCallable(fns, "smsSend");
  const first = String(custName || "").trim().split(/\s+/)[0] || "there";
  let timer = null;
  const save = () => {
    /* Don't wait: with no service the phone keeps it and syncs later. */
    setDoc(doc(db, place, id), { trip: t }, { mergeFields: ["trip"] })   /* replaces just `trip`, so Start over really clears it */.catch(e => { console.error(e); say("Couldn't save the trip. It'll try again next time you open this job."); });
    draw();
  };
  const say = m => { const el = box.querySelector(".tripmsg"); if (el) el.textContent = m; };

  /* Came back to the job sheet after tapping Drive (more than 2 minutes ago): that's arriving. */
  if (t.driveStart && !t.arrived && Date.now() - t.driveStart.at > 120000) {
    spot().then(s => { t.arrived = s; t.driveMiles = t.routeMiles != null ? t.routeMiles : miles(t.driveStart, s); save(); });
  }

  function draw(){
    clearTimeout(timer);
    const h = home();
    let html = '<div class="trip"><div class="triphead">Trip</div>';
    if (!t.driveStart && !t.arrived) {
      html += '<div class="tripline">Tap Drive when you leave. It logs your start, offers to text the customer an ETA, and opens Google Maps.</div>' +
        '<div class="tripbtns"><button type="button" data-t="drive" class="tripgo">Drive here</button>' +
        '<button type="button" data-t="arrive">I’m here, start job</button></div>';
    } else if (!t.arrived) {
      html += '<div class="tripline">Driving since ' + clock(t.driveStart.at) + '</div>' +
        '<div class="tripbtns"><button type="button" data-t="arrive" class="tripgo">I’m here, start job</button>' +
        '<button type="button" data-t="maps">Open Google Maps</button></div>';
    } else if (!t.finished) {
      html += '<div class="tripline">' + (t.driveStart ? 'Drive ' + (t.driveMiles != null ? '≈ ' + t.driveMiles + ' mi · ' : '') + dur(t.arrived.at - t.driveStart.at) + '<br>' : '') +
        'On site since ' + clock(t.arrived.at) + ' · <b class="tripclock">' + dur(Date.now() - t.arrived.at) + '</b></div>' +
        '<div class="tripbtns"><button type="button" data-t="home" class="tripgo">Done: go home</button>' +
        '<button type="button" data-t="next">Done: next job</button></div>';
      timer = setTimeout(draw, 60000);
    } else {
      html += '<div class="tripline">' +
        (t.driveStart ? 'Drive ' + (t.driveMiles != null ? '≈ ' + t.driveMiles + ' mi · ' : '') + dur(t.arrived.at - t.driveStart.at) + '<br>' : '') +
        'On site ' + clock(t.arrived.at) + '–' + clock(t.finished.at) + ' · <b>' + dur(t.finished.at - t.arrived.at) + '</b><br>' +
        (t.finished.then === "home" ? 'Then home' + (t.homeMiles != null ? ' ≈ ' + t.homeMiles + ' mi' : '') : 'Then the next job') + '</div>' +
        '<div class="tripbtns"><button type="button" data-t="reset" class="triplink">Start over</button></div>';
    }
    html += '<div class="tripnote">' + (h ? 'Home is saved. <button type="button" data-t="sethome" class="triplink">Update home to this spot</button>'
      : 'Miles home need your home spot. <button type="button" data-t="sethome" class="triplink">I’m home: save this spot</button>') + '</div>' +
      '<div class="tripmsg" role="status"></div></div>';
    box.innerHTML = html;
  }

  box.addEventListener("click", async e => {
    const b = e.target.closest("button[data-t]"); if (!b) return;
    const act = b.dataset.t;
    if (act === "maps" || act === "go") { location.href = gmaps(addr || ""); return; }
    if (act === "sendgo") {
      const body = (box.querySelector("#tripText") || {}).value || "";
      b.disabled = true; say("Sending…");
      try { await smsSend({ to: phone, body: body.trim() }); t.etaTexted = Date.now(); save(); }
      catch (err) { console.error(err); say("The text didn’t send (" + (err.message || "error") + "). Opening Maps anyway."); await new Promise(r => setTimeout(r, 2500)); }
      location.href = gmaps(addr || ""); return;
    }
    if (act === "reset") { if (!confirm("Clear this job’s trip times and miles?")) return; t = {}; save(); return; }
    b.disabled = true; say("Getting your location…");
    const s = await spot();
    if (s.lat == null) say("Couldn’t get your location (check Location is allowed for this site). Time was still logged.");
    else say("");
    if (act === "drive") {
      t = { driveStart: s }; save();
      if (!addr) return;
      if (!phone) { location.href = gmaps(addr); return; }
      /* Google traffic ETA + 10 min, then offer the on-my-way text before opening Maps. */
      let line = "I’m on my way!";
      if (s.lat != null) {
        say("Checking traffic…");
        try {
          const { data } = await driveEta({ lat: s.lat, lng: s.lng, to: addr });
          t.routeMiles = data.miles; t.etaMin = data.minutes; save();
          const at = new Date(Date.now() + (data.minutes + PAD_MIN) * 60000);
          line = "I’m on my way and should be there around " + clock(at) + ".";
        } catch (err) { console.error(err); }
      }
      const msg = "Hi " + first + ", it’s Israel with Khean & Clean. " + line + " See you soon!";
      box.innerHTML = '<div class="trip"><div class="triphead">Text ' + esc(custName || "the customer") + '?</div>' +
        (t.etaMin != null ? '<div class="tripline">Google says ' + t.etaMin + ' min with traffic (' + t.routeMiles + ' mi). The text adds ' + PAD_MIN + ' min.</div>'
          : '<div class="tripline">Couldn’t get a traffic time, so there’s no arrival time in the text. Edit it if you want one.</div>') +
        '<textarea id="tripText" rows="3" aria-label="Text to the customer">' + esc(msg) + '</textarea>' +
        '<div class="tripbtns"><button type="button" data-t="sendgo" class="tripgo">Text it &amp; drive</button>' +
        '<button type="button" data-t="go">Just drive</button></div><div class="tripmsg" role="status"></div></div>';
    } else if (act === "arrive") {
      t.arrived = s; t.driveMiles = t.routeMiles != null ? t.routeMiles : t.driveStart ? miles(t.driveStart, s) : null; save();
    } else if (act === "home" || act === "next") {
      t.finished = { ...s, then: act };
      t.onSiteMin = Math.round((s.at - t.arrived.at) / 60000);
      const h = home();
      t.homeMiles = act === "home" ? miles(s, h) : null;
      save();
      if (act === "home" && h) location.href = gmaps(h.lat + "," + h.lng);
      if (act === "next") say("Saved. Open the next job and tap Drive.");
    } else if (act === "sethome") {
      if (s.lat == null) { b.disabled = false; return; }
      try { localStorage.setItem(HOME_KEY, JSON.stringify({ lat: s.lat, lng: s.lng })); } catch (err) {}
      draw(); say("Home saved on this phone.");
    }
  });

  draw();
}
