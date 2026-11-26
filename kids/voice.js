/* Unicorn Math: kid profiles + recorded voice clips.
   Clips are kept on this device (IndexedDB) and, when signed in, uploaded to Firebase
   (Storage: kid-voices/<profile>/<key>, Firestore: kidVoices/<profile>) so any device can play them. */
(function (global) {
  var FB = {
    apiKey: "AIzaSyCC1AXsqeWVBS792gor4BA6MLmz1yLypqg",
    authDomain: "khean-estimator-78f3e.firebaseapp.com",
    projectId: "khean-estimator-78f3e",
    storageBucket: "khean-estimator-78f3e.firebasestorage.app",
    messagingSenderId: "581692353222",
    appId: "1:581692353222:web:21f62f057ac5506bbb45c7"
  };
  var SDK = "https://www.gstatic.com/firebasejs/12.19.0/";

  // Everything the game says, in the order they get recorded. secs = how long the recorder listens.
  var LINES = [{ key: "what_is", text: "What is", secs: 2 },
               { key: "plus", text: "plus", secs: 2 },
               { key: "take_away", text: "take away", secs: 2 }];
  for (var n = 0; n <= 20; n++) LINES.push({ key: "n" + n, text: String(n), secs: 2 });
  LINES = LINES.concat([
    { key: "p0", text: "Woohoo! You got it!", secs: 3.5 },
    { key: "p1", text: "Yay! That's magical!", secs: 3.5 },
    { key: "p2", text: "Amazing! Super star!", secs: 3.5 },
    { key: "p3", text: "Wow! Rainbow power!", secs: 3.5 },
    { key: "p4", text: "Yes! You did it!", secs: 3.5 },
    { key: "p5", text: "Sparkly! Great job!", secs: 3.5 },
    { key: "t0", text: "Ooh, so close! Try again!", secs: 3.5 },
    { key: "t1", text: "Oops! You can do it, try again!", secs: 4 },
    { key: "t2", text: "Almost! One more try!", secs: 3.5 },
    { key: "win", text: "Woohoo! You did it! A new friend joined your stable!", secs: 5 }
  ]);
  // A game can set window.KID_VOICE_CONFIG before loading this file to use its own lines and its own saved kid
  // (Monster Trucks does this so it never changes who's playing Unicorn Math).
  var CFG = global.KID_VOICE_CONFIG || {};
  if (CFG.lines) LINES = CFG.lines;
  var ACTIVE_KEY = CFG.activeKey || "unicornActive", PROFILES_KEY = CFG.profilesKey || "unicornProfiles";
  var BY_TEXT = {};
  LINES.forEach(function (l) { BY_TEXT[l.text] = l.key; });

  // ---- profiles (kept on this device)
  function slug(name) { return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "kid"; }
  function getProfiles() { try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]"); } catch (e) { return []; } }
  function setProfiles(p) { try { localStorage.setItem(PROFILES_KEY, JSON.stringify(p)); } catch (e) {} }
  function active() {
    var id = null;
    try { id = localStorage.getItem(ACTIVE_KEY); } catch (e) {}
    var list = getProfiles();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function addProfile(name) {
    name = String(name || "").trim();
    if (!name) return null;
    var list = getProfiles(), id = slug(name);
    var found = list.filter(function (p) { return p.id === id; })[0];
    if (!found) { found = { id: id, name: name }; list.push(found); setProfiles(list); registerKid(found); }
    useProfile(id);
    return found;
  }
  function useProfile(id) {
    try { localStorage.setItem(ACTIVE_KEY, id); } catch (e) {}
    clips = {};
    return loadClips();
  }

  // ---- local clip store
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      try {
        var r = indexedDB.open("unicornVoice", 1);
        r.onupgradeneeded = function () { r.result.createObjectStore("clips"); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      } catch (e) { rej(e); }
    });
    return dbp;
  }
  function idb(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var tx = d.transaction("clips", mode), st = tx.objectStore("clips"), out = fn(st);
        tx.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }

  // clips[key] = playable URL for the active profile
  var clips = {};
  var owner = {};   // key -> name of the OTHER kid whose recording is used (first come, first served)
  var localBlobs = {}, ownRemote = {}, others = {}, gen = 0;   // for checking/fixing empty website copies
  var MIN_BYTES = 200;                                          // smaller than this = empty recording
  function loadClips() {
    var p = active();
    owner = {}; localBlobs = {}; ownRemote = {}; others = {};
    var myGen = ++gen;
    if (!p) return sharedFill(null).then(function () { checkClips(null, myGen); return clips; });
    var prefix = p.id + "/";
    var local = idb("readonly", function (st) {
      var keysReq = st.getAllKeys ? st.getAllKeys() : null, valsReq = st.getAll ? st.getAll() : null;
      return { keysReq: keysReq, valsReq: valsReq };
    }).then(function (r) {
      var ks = r.keysReq.result || [], vs = r.valsReq.result || [];
      ks.forEach(function (k, i) {
        if (String(k).indexOf(prefix) !== 0 || !vs[i] || vs[i].size < MIN_BYTES) return;   // skip empty recordings
        var key = k.slice(prefix.length);
        localBlobs[key] = vs[i]; clips[key] = URL.createObjectURL(vs[i]);
      });
    }).catch(function () {});
    // shared copies from the website (fill in anything this device doesn't have)
    var remote = fetch("https://firestore.googleapis.com/v1/projects/" + FB.projectId + "/databases/(default)/documents/kidVoices/" + p.id)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var f = j && j.fields && j.fields.clips && j.fields.clips.mapValue && j.fields.clips.mapValue.fields;
        return f || {};
      }).catch(function () { return {}; });
    return Promise.all([local, remote]).then(function (r) {
      var f = r[1];
      Object.keys(f).forEach(function (k) {
        if (!f[k].stringValue) return;
        ownRemote[k] = f[k].stringValue;
        if (!clips[k]) clips[k] = f[k].stringValue;
      });
      return sharedFill(p.id);
    }).then(function () { checkClips(p, myGen); setTimeout(prepareAll, 1500); return clips; });
  }
  // One shared set of lines: anything this kid hasn't recorded uses another kid's recording.
  function sharedFill(myId) {
    if (CFG.share === false) return Promise.resolve();
    return siteKids().then(function (kids) {
      kids.forEach(function (k) {
        if (k.id === myId) return;
        Object.keys(k.clips).forEach(function (key) {
          (others[key] = others[key] || []).push({ url: k.clips[key], name: k.name });
          if (!clips[key]) { clips[key] = k.clips[key]; owner[key] = k.name; }
        });
      });
    });
  }

  // ---- Firebase (only loaded when recording)
  var fbp = null;
  function firebase() {
    if (fbp) return fbp;
    fbp = Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-auth.js"),
                       import(SDK + "firebase-storage.js"), import(SDK + "firebase-firestore.js")])
      .then(function (m) {
        var app = m[0].getApps().length ? m[0].getApp() : m[0].initializeApp(FB);
        var auth = m[1].getAuth(app);
        return new Promise(function (res) {
          var off = m[1].onAuthStateChanged(auth, function () { off(); res({ app: app, auth: auth, A: m[1], S: m[2], F: m[3] }); });
        });
      });
    return fbp;
  }
  function signedIn() { return firebase().then(function (f) { return !!f.auth.currentUser; }).catch(function () { return false; }); }
  function signIn(email, pw) {
    return firebase().then(function (f) {
      return f.A.setPersistence(f.auth, f.A.browserLocalPersistence).then(function () {
        return f.A.signInWithEmailAndPassword(f.auth, email, pw);
      });
    });
  }

  // Save a recording: always on this device; also to the website when signed in.
  // Resolves "shared" (on the website too), "local" (this device only, not signed in) or "local-error".
  function saveClip(key, blob) {
    var p = active();
    if (!p) return Promise.reject(new Error("No profile"));
    if (!blob || blob.size < MIN_BYTES) return Promise.reject(new Error("Empty recording"));
    // Trim the quiet bits at the start and end so lines run together naturally (keeps the original if it can't).
    return trimBlob(blob).then(function (b) { blob = b; return saveBytes(p, key, blob); });
  }
  function saveBytes(p, key, blob) {
    var type = blob.type || "audio/mp4";
    // Read the sound into memory first. Uploading the recorder's Blob directly sent 0-byte files from the iPhone.
    return blob.arrayBuffer().then(function (buf) {
      var copy = new Blob([buf], { type: type });
      clips[key] = URL.createObjectURL(copy); prepare(clips[key]);
      delete owner[key]; localBlobs[key] = copy;
      var local = idb("readwrite", function (st) { st.put(copy, p.id + "/" + key); }).catch(function () {});
      return local.then(function () { return uploadClip(p, key, new Uint8Array(buf), type); });
    });
  }
  // Upload bytes to the website and check the website really got them. Resolves "shared" or "local-error".
  function uploadClip(p, key, bytes, type) {
    return firebase().then(function (f) {
      var ext = /wav/.test(type) ? "wav" : /mp4|m4a|aac/.test(type) ? "m4a" : "webm";
      var ref = f.S.ref(f.S.getStorage(f.app), "kid-voices/" + p.id + "/" + key + "." + ext);
      return f.S.uploadBytes(ref, bytes, { contentType: type })
        .then(function (snap) {
          if (!snap || !snap.metadata || +snap.metadata.size < MIN_BYTES) throw new Error("website got an empty file");
          return f.S.getDownloadURL(ref);
        })
        .then(function (url) {
          ownRemote[key] = url;
          var data = { name: p.name, updatedAt: f.F.serverTimestamp(), clips: {} };
          data.clips[key] = url;
          return f.F.setDoc(f.F.doc(f.F.getFirestore(f.app), "kidVoices", p.id), data, { merge: true });
        })
        .then(function () { return "shared"; });
    }).catch(function (e) { console.warn("upload failed", e); return "local-error"; });
  }

  // ---- empty website recordings: skip them, and re-upload from this device when it has a good copy
  var sizeCache = {};
  function remoteSize(url) {   // bytes in a website recording, or null if we can't tell
    if (!/^https:\/\/firebasestorage\.googleapis\.com\//.test(url)) return Promise.resolve(null);
    var meta = url.split("?")[0];
    if (!(meta in sizeCache)) sizeCache[meta] = fetch(meta).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.size != null ? +j.size : null; }).catch(function () { return null; });
    return sizeCache[meta];
  }
  function checkClips(p, myGen) {
    Object.keys(clips).forEach(function (key) {
      var url = clips[key];
      if (/^blob:/.test(url)) return;   // a good recording saved on this device
      remoteSize(url).then(function (size) {
        if (size === null || size >= MIN_BYTES || gen !== myGen) return;
        // empty: use another kid's recording of this line if theirs has sound, otherwise the iPad voice
        var list = (others[key] || []).filter(function (o) { return o.url !== url; });
        (function tryNext(i) {
          if (gen !== myGen) return;
          if (i >= list.length) { if (clips[key] === url) { delete clips[key]; delete owner[key]; } return; }
          remoteSize(list[i].url).then(function (s) {
            if (s === null || s >= MIN_BYTES) { if (gen === myGen && clips[key] === url) { clips[key] = list[i].url; owner[key] = list[i].name; } }
            else tryNext(i + 1);
          });
        })(0);
      });
    });
    // fix the website copies of this kid's recordings that came out empty, using the good copy on this device
    if (!p) return;
    Object.keys(localBlobs).forEach(function (key) {
      var url = ownRemote[key];
      (url ? remoteSize(url) : Promise.resolve(0)).then(function (size) {
        if (size === null || size >= MIN_BYTES || gen !== myGen) return;
        var blob = localBlobs[key];
        blob.arrayBuffer().then(function (buf) {
          return uploadClip(p, key, new Uint8Array(buf), blob.type || "audio/mp4");
        }).then(function (r) { if (r === "shared") delete sizeCache[(url || "").split("?")[0]]; }).catch(function () {});
      });
    });
  }

  // ---- kids saved on the website (so a name made on one iPad shows up on the others)
  var FS = "https://firestore.googleapis.com/v1/projects/" + FB.projectId + "/databases/(default)/documents/";
  function siteKids() {
    return fetch(FS + "kidVoices?pageSize=100").then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) {
      return (j.documents || []).map(function (d) {
        var f = d.fields || {}, clipsF = (f.clips && f.clips.mapValue && f.clips.mapValue.fields) || {}, c = {};
        Object.keys(clipsF).forEach(function (k) { if (clipsF[k].stringValue) c[k] = clipsF[k].stringValue; });
        var fr = ((f.friends && f.friends.arrayValue && f.friends.arrayValue.values) || []).map(function (v) { return v.stringValue; });
        return { id: d.name.split("/").pop(), name: (f.name && f.name.stringValue) || d.name.split("/").pop(), clips: c,
                 stars: +((f.stars && f.stars.integerValue) || 0), friends: fr,
                 password: (f.password && f.password.stringValue) || "" };
      });
    }).catch(function () { return []; });
  }
  function syncProfiles() {
    return siteKids().then(function (kids) {
      var list = getProfiles();
      kids.forEach(function (k) { if (!list.some(function (p) { return p.id === k.id; })) list.push({ id: k.id, name: k.name }); });
      setProfiles(list);
      return list;
    });
  }
  // make sure a new name exists on the website even before anything is recorded
  function registerKid(p) {
    return firebase().then(function (f) {
      return f.F.setDoc(f.F.doc(f.F.getFirestore(f.app), "kidVoices", p.id), { name: p.name }, { merge: true });
    }).catch(function () {});
  }
  // admin: remove one recording everywhere
  function deleteClip(kidId, key) {
    return firebase().then(function (f) {
      var st = f.S.getStorage(f.app);
      var dels = ["m4a", "webm"].map(function (ext) { return f.S.deleteObject(f.S.ref(st, "kid-voices/" + kidId + "/" + key + "." + ext)).catch(function () {}); });
      var upd = {}; upd["clips." + key] = f.F.deleteField();
      dels.push(f.F.updateDoc(f.F.doc(f.F.getFirestore(f.app), "kidVoices", kidId), upd));
      return Promise.all(dels);
    }).then(function () {
      return idb("readwrite", function (st) { st.delete(kidId + "/" + key); }).catch(function () {});
    }).then(function () {
      var a = active();
      if (a && a.id === kidId) delete clips[key];
    });
  }

  // ---- kids' login: any username (changeable) + any password. Simple, not real security.
  function patchKid(id, fields) {
    var body = { fields: {} }, mask = [];
    Object.keys(fields).forEach(function (k) { body.fields[k] = { stringValue: String(fields[k]) }; mask.push("updateMask.fieldPaths=" + k); });
    return fetch(FS + "kidVoices/" + encodeURIComponent(id) + "?" + mask.join("&"),
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error("save failed"); });
  }
  function findKid(kids, name) {
    var n = String(name).trim().toLowerCase();
    return kids.filter(function (k) { return String(k.name).trim().toLowerCase() === n; })[0];
  }
  function remember(id, name) {
    var list = getProfiles().filter(function (p) { return p.id !== id; });
    list.push({ id: id, name: name });
    setProfiles(list);
    return useProfile(id);
  }
  function signUp(name, pw) {
    name = String(name || "").trim();
    if (!name) return Promise.reject(new Error("Type a username"));
    return siteKids().then(function (kids) {
      if (findKid(kids, name)) throw new Error("That name is taken. Try another, or log in.");
      var id = slug(name), base = id, n = 2;
      while (kids.some(function (k) { return k.id === id; })) id = base + "-" + n++;
      return patchKid(id, { name: name, password: pw || "" }).then(function () { return remember(id, name); });
    });
  }
  function logIn(name, pw) {
    return siteKids().then(function (kids) {
      var k = findKid(kids, name);
      if (!k) throw new Error("No one has that username yet. Tap Sign up.");
      if (k.password && k.password !== String(pw || "")) throw new Error("Wrong password. Try again!");
      var done = k.password ? Promise.resolve() : patchKid(k.id, { password: pw || "" });   // older profile: first login sets it
      return done.then(function () { return remember(k.id, k.name); });
    });
  }
  function logOut() {
    try { localStorage.removeItem(ACTIVE_KEY); } catch (e) {}
    clips = {}; owner = {};
    return loadClips();
  }
  function rename(newName) {
    var p = active();
    newName = String(newName || "").trim();
    if (!p || !newName) return Promise.reject(new Error("Type a username"));
    return siteKids().then(function (kids) {
      var other = findKid(kids, newName);
      if (other && other.id !== p.id) throw new Error("That name is taken.");
      return patchKid(p.id, { name: newName });
    }).then(function () {
      setProfiles(getProfiles().map(function (q) { return q.id === p.id ? { id: q.id, name: newName } : q; }));
    });
  }

  // admin: delete a whole kid profile (recordings, stars, friends) from the website
  function deleteKid(kid) {
    return firebase().then(function (f) {
      var st = f.S.getStorage(f.app), dels = [];
      Object.keys(kid.clips || {}).forEach(function (key) {
        ["m4a", "webm"].forEach(function (ext) { dels.push(f.S.deleteObject(f.S.ref(st, "kid-voices/" + kid.id + "/" + key + "." + ext)).catch(function () {})); });
      });
      return Promise.all(dels).then(function () { return f.F.deleteDoc(f.F.doc(f.F.getFirestore(f.app), "kidVoices", kid.id)); });
    }).then(function () {
      setProfiles(getProfiles().filter(function (p) { return p.id !== kid.id; }));
    });
  }

  // ---- playback: play a list of clips in a row. Resolves false (and plays nothing) if any are missing.
  var current = null;
  function stop() {
    if (current) { try { current.pause(); } catch (e) {} current = null; }
    if (sources.length) { sources.forEach(function (s) { try { s.onended = null; s.stop(); } catch (e) {} }); sources = []; if (playDone) { playDone(true); playDone = null; } }
  }

  // ---- trimming quiet parts (shared by saving and playing)
  var ctx = null, sources = [], playDone = null, bufCache = {};
  function audioCtx() {
    try {
      if (!ctx) {
        // iPhone: play through the speaker even when the ring switch is on silent, like normal audio does
        try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
        ctx = new (global.AudioContext || global.webkitAudioContext)();
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  try { ["touchend", "click"].forEach(function (ev) { document.addEventListener(ev, function () { audioCtx(); }, { passive: true }); }); } catch (e) {}
  function quietEdges(buf) {   // [start, end] seconds of the part with sound in it
    var d = buf.getChannelData(0), n = d.length, peak = 0, i;
    for (i = 0; i < n; i++) { var v = Math.abs(d[i]); if (v > peak) peak = v; }
    if (peak < .01) return null;                       // basically silent
    var th = Math.max(.02, peak * .08), win = Math.floor(buf.sampleRate * .01), s = 0, e = n - 1;
    for (i = 0; i < n; i += win) { if (Math.abs(d[i]) > th || maxIn(d, i, win) > th) { s = i; break; } }
    for (i = n - 1; i >= 0; i -= win) { if (maxIn(d, Math.max(0, i - win), win) > th) { e = i; break; } }
    var pad = .06;                                     // keep a tiny bit so words don't get clipped
    return [Math.max(0, s / buf.sampleRate - pad), Math.min(buf.duration, e / buf.sampleRate + pad)];
  }
  function maxIn(d, from, len) { var m = 0; for (var j = from; j < Math.min(d.length, from + len); j++) { var v = Math.abs(d[j]); if (v > m) m = v; } return m; }
  function decode(arrayBuf) {
    var c = audioCtx(); if (!c) return Promise.reject(new Error("no audio"));
    return new Promise(function (res, rej) { var r = c.decodeAudioData(arrayBuf, res, rej); if (r && r.then) r.then(res, rej); });
  }
  function trimmedBuffer(url) {   // decoded + trimmed sound for a clip, or null if it can't be fetched/decoded
    if (!(url in bufCache)) bufCache[url] = fetch(url).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(decode).then(function (buf) {
        var q = quietEdges(buf); if (!q) return null;
        return { buf: buf, start: q[0], end: q[1] };
      }).catch(function () { return null; });
    return bufCache[url];
  }
  function playBuffers(list) {
    var c = audioCtx(), t = c.currentTime + .03;
    sources = [];
    return new Promise(function (res) {
      playDone = res;
      list.forEach(function (b, i) {
        var src = c.createBufferSource(); src.buffer = b.buf; src.connect(c.destination);
        src.start(t, b.start, b.end - b.start); t += (b.end - b.start) + .04;   // tiny gap between words
        if (i === list.length - 1) src.onended = function () { sources = []; if (playDone) { playDone(true); playDone = null; } };
        sources.push(src);
      });
    });
  }
  // Trim a new recording and save it as a small WAV file (plays everywhere). Falls back to the original.
  function trimBlob(blob) {
    return blob.arrayBuffer().then(function (ab) { return decode(ab.slice(0)); }).then(function (buf) {
      var q = quietEdges(buf); if (!q) return blob;
      var rate = 22050, len = Math.max(1, Math.floor((q[1] - q[0]) * rate));
      var src = buf.getChannelData(0), out = new Int16Array(len), step = buf.sampleRate / rate, off = q[0] * buf.sampleRate;
      for (var i = 0; i < len; i++) { var v = src[Math.min(src.length - 1, Math.floor(off + i * step))]; out[i] = Math.max(-1, Math.min(1, v)) * 32767; }
      return wavBlob(out, rate);
    }).catch(function () { return blob; });
  }
  function wavBlob(samples, rate) {
    var b = new ArrayBuffer(44 + samples.length * 2), v = new DataView(b), w = function (o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); w(8, "WAVE"); w(12, "fmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, samples.length * 2, true);
    for (var i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, samples[i], true);
    return new Blob([b], { type: "audio/wav" });
  }
  function play(keys) {
    stop();
    for (var i = 0; i < keys.length; i++) if (!clips[keys[i]]) return Promise.resolve(false);
    // smooth version (quiet start/end cut, words back to back) when those clips are already prepared;
    // otherwise play them normally right away (iPhone only allows sound right on the tap) and prepare them for next time
    var ready = keys.map(function (k) { return bufReady[clips[k]]; });
    if (ready.every(Boolean) && audioCtx()) return playBuffers(ready);
    keys.forEach(function (k) { prepare(clips[k]); });
    return playPlain(keys);
  }
  var bufReady = {};
  function prepare(url) { if (url && !(url in bufReady)) { bufReady[url] = null; trimmedBuffer(url).then(function (r) { bufReady[url] = r || false; }); } }
  function prepareAll() { Object.keys(clips).forEach(function (k) { prepare(clips[k]); }); }
  function playPlain(keys) {
    var idx = 0, failed = false;
    return new Promise(function (res) {
      // resolves false if any clip couldn't play (e.g. a format this device can't play), so the caller can fall back
      function bad() { failed = true; nextClip(); }
      function nextClip() {
        if (idx >= keys.length) { current = null; return res(!failed); }
        var a = new Audio(clips[keys[idx++]]);
        current = a;
        a.onended = nextClip;
        a.onerror = bad;
        var pr = a.play();
        if (pr && pr.catch) pr.catch(bad);
      }
      nextClip();
    });
  }
  function hasAll(keys) { return keys.every(function (k) { return !!clips[k]; }); }

  global.KidVoice = {
    LINES: LINES, keyFor: function (t) { return BY_TEXT[t]; },
    getProfiles: getProfiles, active: active, addProfile: addProfile, useProfile: useProfile,
    loadClips: loadClips, saveClip: saveClip, play: play, stop: stop, hasAll: hasAll,
    has: function (k) { return !!clips[k]; },
    ownerOf: function (k) { return owner[k] || null; },
    mine: function (k) { return !!clips[k] && !owner[k]; }, signedIn: signedIn, signIn: signIn,
    siteKids: siteKids, syncProfiles: syncProfiles, registerKid: registerKid, deleteClip: deleteClip, deleteKid: deleteKid, signUp: signUp, logIn: logIn, logOut: logOut, rename: rename, FB: FB
  };
  // ?kid=<id> opens that kid's profile (used by the admin page's Re-record button)
  try {
    var want = new URLSearchParams(location.search).get("kid");
    if (want) {
      var nm = new URLSearchParams(location.search).get("name") || want;
      var L = getProfiles();
      if (!L.some(function (p) { return p.id === want; })) { L.push({ id: want, name: nm }); setProfiles(L); }
      localStorage.setItem(ACTIVE_KEY, want);
    }
  } catch (e) {}
  loadClips();
})(window);
