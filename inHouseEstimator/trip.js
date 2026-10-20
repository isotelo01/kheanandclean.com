/* Trip tracker on the job sheet (staff only). Saved on the job under `trip`, so it moves with the job
   into invoices and paidInvoices and shows on job-data.html.
   Drive  -> logs where/when you left, then opens Apple Maps to the job.
   Opening the job sheet after a Drive -> logs that you arrived (miles worked out from the GPS points).
   Finish -> Go home (opens Apple Maps home) or Next job. Logs time on site.
   Miles are an estimate: straight-line distance x 1.25 for roads. GPS works with no service; the job
   sheet's offline copy holds the save until there's signal again. */
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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
const appleMaps = q => "https://maps.apple.com/?" + q + "&dirflg=d";

/* box: an empty element on the job sheet. db/place/id: where the job lives. addr: the job address.
   trip: what's already saved on the job (q.trip). */
export function mountTrip({ box, db, place, id, addr, trip }){
  let t = Object.assign({}, trip || {});
  let timer = null;
  const save = () => {
    /* Don't wait: with no service the phone keeps it and syncs later. */
    setDoc(doc(db, place, id), { trip: t }, { mergeFields: ["trip"] })   /* replaces just `trip`, so Start over really clears it */.catch(e => { console.error(e); say("Couldn't save the trip. It'll try again next time you open this job."); });
    draw();
  };
  const say = m => { const el = box.querySelector(".tripmsg"); if (el) el.textContent = m; };

  /* Came back to the job sheet after tapping Drive (more than 2 minutes ago): that's arriving. */
  if (t.driveStart && !t.arrived && Date.now() - t.driveStart.at > 120000) {
    spot().then(s => { t.arrived = s; t.driveMiles = miles(t.driveStart, s); save(); });
  }

  function draw(){
    clearTimeout(timer);
    const h = home();
    let html = '<div class="trip"><div class="triphead">Trip</div>';
    if (!t.driveStart && !t.arrived) {
      html += '<div class="tripline">Tap Drive when you leave. It logs your start and opens Apple Maps.</div>' +
        '<div class="tripbtns"><button type="button" data-t="drive" class="tripgo">Drive here</button>' +
        '<button type="button" data-t="arrive">I’m here, start job</button></div>';
    } else if (!t.arrived) {
      html += '<div class="tripline">Driving since ' + clock(t.driveStart.at) + '</div>' +
        '<div class="tripbtns"><button type="button" data-t="arrive" class="tripgo">I’m here, start job</button>' +
        '<button type="button" data-t="maps">Open Apple Maps</button></div>';
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
    if (act === "maps") { location.href = appleMaps("daddr=" + encodeURIComponent(addr || "")); return; }
    if (act === "reset") { if (!confirm("Clear this job’s trip times and miles?")) return; t = {}; save(); return; }
    b.disabled = true; say("Getting your location…");
    const s = await spot();
    if (s.lat == null) say("Couldn’t get your location (check Location is allowed for this site). Time was still logged.");
    else say("");
    if (act === "drive") {
      t = { driveStart: s }; save();
      if (addr) location.href = appleMaps("daddr=" + encodeURIComponent(addr));
    } else if (act === "arrive") {
      t.arrived = s; t.driveMiles = t.driveStart ? miles(t.driveStart, s) : null; save();
    } else if (act === "home" || act === "next") {
      t.finished = { ...s, then: act };
      t.onSiteMin = Math.round((s.at - t.arrived.at) / 60000);
      const h = home();
      t.homeMiles = act === "home" ? miles(s, h) : null;
      save();
      if (act === "home" && h) location.href = appleMaps("daddr=" + h.lat + "," + h.lng);
      if (act === "next") say("Saved. Open the next job and tap Drive.");
    } else if (act === "sethome") {
      if (s.lat == null) { b.disabled = false; return; }
      try { localStorage.setItem(HOME_KEY, JSON.stringify({ lat: s.lat, lng: s.lng })); } catch (err) {}
      draw(); say("Home saved on this phone.");
    }
  });

  draw();
}
