/* Burst camera: stays open, every tap of the shutter saves a photo and counts up (1, 2, 3...).
   Done closes it. Used by the job sheet room pages and the website's quote finder.
   burstCam({ max, onShot(file), onDone(count) }) -> false if this phone/browser can't do it
   (then the page falls back to the phone's own camera). */
(function(){
  var CSS = '.bcam{position:fixed;inset:0;z-index:9999;background:#000;color:#fff;font:16px system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column}' +
    '.bcam video{flex:1;min-height:0;width:100%;object-fit:contain;background:#000}' +
    '.bcam .bflash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .15s}' +
    '.bcam .bflash.on{opacity:.7;transition:none}' +
    '.bcam .btop{position:absolute;top:0;left:0;right:0;display:flex;justify-content:center;gap:8px;padding:calc(env(safe-area-inset-top) + 12px) 12px 12px}' +
    '.bcam .bzoom{font:600 15px system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.5);border-radius:20px;padding:6px 14px;cursor:pointer}' +
    '.bcam .bzoom.on{background:#E3B64A;color:#000;border-color:#E3B64A}' +
    '.bcam .bbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px calc(env(safe-area-inset-bottom) + 16px);background:#000}' +
    '.bcam .bleft{width:90px;display:flex;align-items:center;gap:8px}' +
    '.bcam .bleft img{width:46px;height:46px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,.5)}' +
    '.bcam .bcount{font:700 18px system-ui,sans-serif}' +
    '.bcam .bshut{width:74px;height:74px;border-radius:50%;background:#fff;border:5px solid #000;box-shadow:0 0 0 3px #fff;cursor:pointer;flex:none}' +
    '.bcam .bshut:active{transform:scale(.92)}' +
    '.bcam .bshut:disabled{opacity:.4}' +
    '.bcam .bdone{width:90px;font:700 17px system-ui,sans-serif;color:#000;background:#E3B64A;border:0;border-radius:8px;padding:12px 0;cursor:pointer}' +
    '.bcam .bmsg{position:absolute;left:0;right:0;bottom:140px;text-align:center;font-size:15px;text-shadow:0 1px 4px #000;padding:0 16px}';

  window.burstCam = function(opts){
    opts = opts || {};
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
    var max = opts.max > 0 ? opts.max : 999, count = 0, stream = null, lastUrl = '', busy = false;
    if (!document.getElementById('bcam-css')) {
      var st = document.createElement('style'); st.id = 'bcam-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    var box = document.createElement('div');
    box.className = 'bcam';
    box.innerHTML = '<video playsinline muted autoplay></video><div class="bflash"></div><div class="btop"></div>' +
      '<div class="bmsg">Opening camera&hellip;</div>' +
      '<div class="bbar"><div class="bleft"><span class="bcount">0</span></div>' +
      '<button type="button" class="bshut" aria-label="Take photo" disabled></button>' +
      '<button type="button" class="bdone">Done</button></div>';
    document.body.appendChild(box);
    var video = box.querySelector('video'), shut = box.querySelector('.bshut'), msg = box.querySelector('.bmsg'),
        left = box.querySelector('.bleft'), top = box.querySelector('.btop');
    var say = function(t){ msg.textContent = t || ''; };

    function stop(){ if (stream) stream.getTracks().forEach(function(t){ t.stop(); }); stream = null; }
    function open(deviceId){
      stop();
      var v = { width: { ideal: 4032 }, height: { ideal: 3024 } };
      if (deviceId) v.deviceId = { exact: deviceId }; else v.facingMode = { ideal: 'environment' };
      return navigator.mediaDevices.getUserMedia({ video: v, audio: false }).then(function(s){
        stream = s; video.srcObject = s;
        return video.play().catch(function(){});
      }).then(function(){ shut.disabled = count >= max; say(count >= max ? 'That’s the most photos for now.' : ''); });
    }
    /* 0.5 / 1x: shown when the phone lists an ultra wide back camera. */
    function lenses(){
      if (!navigator.mediaDevices.enumerateDevices) return;
      navigator.mediaDevices.enumerateDevices().then(function(ds){
        var cams = ds.filter(function(d){ return d.kind === 'videoinput'; });
        var wide = cams.filter(function(d){ return /ultra ?wide/i.test(d.label); })[0];
        var main = cams.filter(function(d){ return /back/i.test(d.label) && !/ultra|tele|dual|triple/i.test(d.label); })[0];
        if (!wide || !main) return;
        top.innerHTML = '<button type="button" class="bzoom" data-id="' + wide.deviceId + '">0.5</button>' +
          '<button type="button" class="bzoom on" data-id="' + main.deviceId + '">1x</button>';
        top.addEventListener('click', function(e){
          var b = e.target.closest('.bzoom'); if (!b || b.classList.contains('on')) return;
          top.querySelectorAll('.bzoom').forEach(function(x){ x.classList.toggle('on', x === b); });
          shut.disabled = true; say('Switching lens…');
          open(b.dataset.id).catch(function(err){ say('Couldn’t switch lens.'); console.error(err); });
        });
      }).catch(function(){});
    }

    shut.addEventListener('click', function(){
      if (busy || count >= max || !video.videoWidth) return;
      busy = true;
      var c = document.createElement('canvas'); c.width = video.videoWidth; c.height = video.videoHeight;
      c.getContext('2d').drawImage(video, 0, 0);
      var fl = box.querySelector('.bflash'); fl.classList.add('on'); setTimeout(function(){ fl.classList.remove('on'); }, 60);
      c.toBlob(function(b){
        busy = false;
        if (!b) { say('That photo didn’t save. Try again.'); return; }
        count++;
        var f = new File([b], 'photo-' + Date.now() + '.jpg', { type: 'image/jpeg' });
        if (lastUrl) URL.revokeObjectURL(lastUrl);
        lastUrl = URL.createObjectURL(b);
        left.innerHTML = '<img src="' + lastUrl + '" alt=""><span class="bcount">' + count + '</span>';
        if (count >= max) { shut.disabled = true; say('That’s the most photos for now. Tap Done.'); }
        try { opts.onShot && opts.onShot(f); } catch (e) { console.error(e); }
      }, 'image/jpeg', 0.92);
    });
    box.querySelector('.bdone').addEventListener('click', function(){
      stop(); if (lastUrl) URL.revokeObjectURL(lastUrl); box.remove();
      try { opts.onDone && opts.onDone(count); } catch (e) { console.error(e); }
    });

    open().then(lenses).catch(function(err){
      console.error(err);
      say('Camera blocked. Allow camera access for this site, or tap Done and use Add photos.');
    });
    return true;
  };
})();
