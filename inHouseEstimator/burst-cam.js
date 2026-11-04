/* Burst camera: stays open, every tap of the shutter saves a photo and counts up (1, 2, 3...).
   Done closes it. Used by the job sheet room pages and the website's quote finder.
   burstCam({ max, onShot(file), onDone(count), tip(count) }) -> false if this phone/browser can't do it
   (then the page falls back to the phone's own camera).
   tip (optional): returns the HTML shown over the live view for the next shot (what to shoot, a small drawing). */
(function(){
  var CSS = '.bcam{position:fixed;inset:0;z-index:9999;background:#000;color:#fff;font:16px system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column}' +
    '.bcam .bmain{position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column}' +
    '.bcam .bview{position:relative;flex:1;min-height:0;min-width:0;display:flex}' +
    '.bcam video{flex:1;min-height:0;min-width:0;width:100%;height:100%;object-fit:contain;background:#000}' +
    '.bcam .bflash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity .15s}' +
    '.bcam .bflash.on{opacity:.7;transition:none}' +
    '.bcam .btop:empty{display:none}' +
    '.bcam .bzoom{font:600 15px system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.5);border-radius:20px;padding:8px 14px;cursor:pointer}' +
    '.bcam .bzoom.on{background:#E3B64A;color:#000;border-color:#E3B64A}' +
    /* Light: icon button at the top right of the picture; gold while on. Only shown if the camera has a light. */
    '.bcam .blight{position:absolute;right:12px;top:calc(env(safe-area-inset-top) + 12px);z-index:3;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.5);padding:0;cursor:pointer}' +
    '.bcam .blight[hidden]{display:none}.bcam .blight svg{width:22px;height:22px}' +
    '.bcam .blight.on{background:#E3B64A;color:#000;border-color:#E3B64A}' +
    '.bcam .bbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px calc(env(safe-area-inset-bottom) + 16px);background:#000}' +
    '.bcam .bleft{width:90px;display:flex;align-items:center;gap:8px;order:1}' +
    '.bcam .bleft img{width:46px;height:46px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,.5)}' +
    '.bcam .bcount{font:700 18px system-ui,sans-serif}' +
    '.bcam .bshut{width:74px;height:74px;border-radius:50%;background:#fff;border:5px solid #000;box-shadow:0 0 0 3px #fff;cursor:pointer;flex:none;order:2}' +
    '.bcam .bshut:active{transform:scale(.92)}' +
    '.bcam .bshut:disabled{opacity:.4}' +
    '.bcam .bdone{width:90px;font:700 17px system-ui,sans-serif;color:#000;background:#E3B64A;border:0;border-radius:8px;padding:12px 0;cursor:pointer;order:4}' +
    '.bcam .btip{box-sizing:border-box;display:flex;align-items:center;gap:12px;background:rgba(0,0,0,.62);border-left:3px solid #E3B64A;border-radius:10px;padding:10px 12px;font-weight:600;line-height:1.3;pointer-events:none}' +
    '.bcam .btip:empty{display:none}' +
    '.bcam .btip svg{width:104px;max-width:104px;flex:none;margin:0}' +
    '.bcam .bback,.bcam .bfwd{font:600 15px system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.5);border-radius:20px;padding:8px 14px;cursor:pointer}' +
    '.bcam .bback[hidden],.bcam .bfwd[hidden]{display:none}' +
    '.bcam .bmsg{position:absolute;left:0;right:0;bottom:64px;text-align:center;font-size:15px;text-shadow:0 1px 4px #000;padding:0 16px}' +
    /* iPhone: label top left; Back / Forward bottom left of the picture; one lens button next to the shutter
       (count, lens, shutter, Done); sideways, the right column is Done, shutter, lens, count from the top. */
    '.bcam.ios .btip{position:absolute;z-index:2;left:12px;max-width:calc(100% - 24px);top:calc(env(safe-area-inset-top) + 12px)}' +
    '.bcam.ios .bnav{position:absolute;left:12px;bottom:12px;display:flex;gap:8px;z-index:2}' +
    '.bcam.ios .bleft{order:1}.bcam.ios .btop{order:2}.bcam.ios .bshut{order:3}.bcam.ios .bdone{order:4}' +
    /* Android: label centered at the top above the picture; Back / Forward bottom left of the picture;
       one lens button by the shutter; bar raised so Chrome's full screen notice doesn't cover it. */
    '.bcam.andr .btip{align-self:center;max-width:calc(100% - 24px);margin:calc(env(safe-area-inset-top) + 12px) 12px 10px}' +
    '.bcam.andr .bnav{position:absolute;left:calc(env(safe-area-inset-left) + 12px);bottom:12px;display:flex;gap:8px}' +
    '.bcam.andr .btop{order:3}' +
    '@media (orientation:portrait){.bcam.andr .bbar{padding-bottom:calc(env(safe-area-inset-bottom) + 120px)}}' +
    '@media (orientation:landscape){.bcam{flex-direction:row}' +
    '.bcam .bbar{flex-direction:column;justify-content:space-between;padding:calc(env(safe-area-inset-top) + 16px) calc(env(safe-area-inset-right) + 16px) calc(env(safe-area-inset-bottom) + 16px) 16px}' +
    /* iPhone sideways, right column top to bottom: light, 0.5, count, shutter, Done; label bottom right of the picture. */
    '.bcam.ios .bbar{flex-direction:column}.bcam.ios .bleft{justify-content:center}.bcam.ios .bfwd{right:12px}' +
    '.bcam.ios .blight{position:static;order:1}.bcam.ios .btop{order:2}.bcam.ios .bleft{order:3}.bcam.ios .bshut{order:4}.bcam.ios .bdone{order:5}' +
    '.bcam.ios .btip{top:auto;left:auto;right:12px;bottom:calc(env(safe-area-inset-bottom) + 12px)}' +
    '.bcam.andr .btop{order:1}.bcam.andr .bshut{order:2}.bcam.andr .bleft{order:3;justify-content:center}.bcam.andr .bdone{order:4}}';

  window.burstCam = function(opts){
    opts = opts || {};
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
    var max = opts.max > 0 ? opts.max : 999, count = 0, pos = 0, files = [], stream = null, lastUrl = '', busy = false;
    /* Which way the phone is held, from gravity (iPhones report it with the opposite sign). */
    var grav = { x: 0, y: 9.8 }, IOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    function onMot(e){ var a = e.accelerationIncludingGravity; if (a && a.x != null) { grav.x = IOS ? -a.x : a.x; grav.y = IOS ? -a.y : a.y; } }
    window.addEventListener('devicemotion', onMot);
    if (!document.getElementById('bcam-css')) {
      var st = document.createElement('style'); st.id = 'bcam-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    /* Light button: over the picture on Android; in the bar on iPhone (top right upright, top of the right column sideways). */
    var LIGHT = '<button type="button" class="blight" aria-label="Light" hidden><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg></button>';
    var box = document.createElement('div');
    box.className = 'bcam ' + (IOS ? 'ios' : 'andr');
    /* One lens button in the bar, next to the shutter (iPhone and Android). */
    box.innerHTML = '<div class="bmain"><div class="btip"></div><div class="bview"><video playsinline muted autoplay></video><div class="bflash"></div>' + (IOS ? '' : LIGHT) +
      '<div class="bnav"><button type="button" class="bback" hidden>&larr; Back</button><button type="button" class="bfwd" hidden>Forward &rarr;</button></div>' +
      '<div class="bmsg">Opening camera&hellip;</div></div></div>' +
      '<div class="bbar"><div class="bleft"><span class="bcount">0</span></div><div class="btop"></div>' + (IOS ? LIGHT : '') +
      '<button type="button" class="bshut" aria-label="Take photo" disabled></button>' +
      '<button type="button" class="bdone">Done</button></div>';
    document.body.appendChild(box);
    /* Android: go full screen so the browser's top bar is hidden (iPhone browsers don't allow it). */
    if (!IOS && box.requestFullscreen) { try { box.requestFullscreen({ navigationUI: 'hide' }).catch(function(){}); } catch (e) {} }
    var video = box.querySelector('video'), shut = box.querySelector('.bshut'), msg = box.querySelector('.bmsg'),
        left = box.querySelector('.bleft'), top = box.querySelector('.btop');
    var say = function(t){ msg.textContent = t || ''; };
    var tipBox = box.querySelector('.btip');
    var tip = function(){ if (opts.tip) { try { tipBox.innerHTML = opts.tip(pos) || ''; } catch (e) { console.error(e); } } };
    tip();
    /* Back / Forward (only when the page passes onReplace): step through this session's photos.
       Nothing is deleted; shooting on an earlier step replaces that photo, Forward skips ahead. */
    var back = box.querySelector('.bback'), fwd = box.querySelector('.bfwd');
    var thumb = function(f){ if (lastUrl) URL.revokeObjectURL(lastUrl); lastUrl = f ? URL.createObjectURL(f) : '';
      left.innerHTML = (f ? '<img src="' + lastUrl + '" alt="">' : '') + '<span class="bcount">' + count + '</span>'; };
    var showBack = function(){ back.hidden = !(opts.onReplace && pos > 0); fwd.hidden = !(opts.onReplace && pos < count); };
    var step = function(d){
      if (busy) return;
      pos = Math.max(0, Math.min(count, pos + d));
      thumb(files[pos < count ? pos : count - 1]);
      shut.disabled = !video.videoWidth || (pos >= count && count >= max);
      say(pos < count ? 'Retake this photo, or tap Forward.' : '');
      tip(); showBack();
    };
    back.addEventListener('click', function(){ step(-1); });
    fwd.addEventListener('click', function(){ step(1); });

    function stop(){ window.removeEventListener('devicemotion', onMot); if (stream) stream.getTracks().forEach(function(t){ t.stop(); }); stream = null; }
    function open(deviceId){
      stop();
      var v = { width: { ideal: 4032 }, height: { ideal: 3024 } };
      if (deviceId) v.deviceId = { exact: deviceId }; else v.facingMode = { ideal: 'environment' };
      return navigator.mediaDevices.getUserMedia({ video: v, audio: false }).then(function(s){
        stream = s; video.srcObject = s;
        return video.play().catch(function(){});
      }).then(function(){ shut.disabled = count >= max; say(count >= max ? 'That’s the most photos for now.' : ''); setLight(); });
    }
    /* Light: stays on while shooting (a web page can't fire a real flash). Kept on across lens switches. */
    var lightBtn = box.querySelector('.blight'), lightOn = false;
    function setLight(){
      var t = stream && stream.getVideoTracks()[0], caps = {};
      try { caps = t && t.getCapabilities ? t.getCapabilities() : {}; } catch (e) {}
      lightBtn.hidden = !caps.torch;
      if (!caps.torch) return;
      t.applyConstraints({ advanced: [{ torch: lightOn }] }).catch(function(err){ console.error(err); });
      lightBtn.classList.toggle('on', lightOn);
    }
    lightBtn.addEventListener('click', function(){ lightOn = !lightOn; setLight(); });
    /* 0.5 / 1x: shown when the phone lists an ultra wide back camera. */
    function lenses(){
      if (!navigator.mediaDevices.enumerateDevices) return;
      navigator.mediaDevices.enumerateDevices().then(function(ds){
        var cams = ds.filter(function(d){ return d.kind === 'videoinput'; });
        var wide = cams.filter(function(d){ return /ultra ?wide/i.test(d.label); })[0];
        var main = cams.filter(function(d){ return /back/i.test(d.label) && !/ultra|tele|dual|triple/i.test(d.label); })[0];
        if (!wide || !main) return;
        /* One lens button that names the lens you'd switch to (0.5 while on 1x, 1x while on 0.5). */
        var onWide = false;
        top.innerHTML = '<button type="button" class="bzoom">0.5</button>';
        var zb = top.querySelector('.bzoom');
        zb.addEventListener('click', function(){
          onWide = !onWide; zb.textContent = onWide ? '1x' : '0.5';
          shut.disabled = true; say('Switching lens…');
          open((onWide ? wide : main).deviceId).catch(function(err){ say('Couldn’t switch lens.'); console.error(err); });
        });
      }).catch(function(){});
    }

    shut.addEventListener('click', function(){
      if (busy || (pos >= count && count >= max) || !video.videoWidth) return;
      busy = true;
      /* Rotation lock: the screen stays upright, so a phone held sideways gives a sideways frame.
         Gravity says which way the phone is held; turn the photo to match. */
      var vw = video.videoWidth, vh = video.videoHeight, turn = 0;
      var upright = !(screen.orientation && screen.orientation.type) || /portrait/.test(screen.orientation.type);
      if (upright && vh > vw && Math.abs(grav.x) > 6 && Math.abs(grav.x) > Math.abs(grav.y) * 1.5) turn = grav.x > 0 ? -1 : 1;
      var c = document.createElement('canvas'), g = c.getContext('2d');
      if (turn) { c.width = vh; c.height = vw; g.translate(vh / 2, vw / 2); g.rotate(turn * Math.PI / 2); g.drawImage(video, -vw / 2, -vh / 2); }
      else { c.width = vw; c.height = vh; g.drawImage(video, 0, 0); }
      var fl = box.querySelector('.bflash'); fl.classList.add('on'); setTimeout(function(){ fl.classList.remove('on'); }, 60);
      c.toBlob(function(b){
        busy = false;
        if (!b) { say('That photo didn’t save. Try again.'); return; }
        var f = new File([b], 'photo-' + Date.now() + '.jpg', { type: 'image/jpeg' });
        if (pos < count) {   /* retake of an earlier photo */
          try { opts.onReplace(files[pos], f); } catch (e) { console.error(e); }
          files[pos] = f;
        } else {
          count++; files.push(f);
          try { opts.onShot && opts.onShot(f); } catch (e) { console.error(e); }
        }
        pos++;
        thumb(f);
        say(pos < count ? 'Retake this photo, or tap Forward.' : '');
        if (pos >= count && count >= max) { shut.disabled = true; say('That’s the most photos for now. Tap Done.'); }
        tip(); showBack();
      }, 'image/jpeg', 0.92);
    });
    /* Closing keeps the photos. The phone's Back (button or swipe) closes the camera too, back to the room,
       instead of leaving the page: opening adds a history step, and Back pops it. */
    var closed = false;
    function close(){
      if (closed) return; closed = true;
      window.removeEventListener('popstate', close);
      stop(); if (lastUrl) URL.revokeObjectURL(lastUrl);
      try { if (document.fullscreenElement === box) document.exitFullscreen().catch(function(){}); } catch (e) {}
      box.remove();
      try { opts.onDone && opts.onDone(count); } catch (e) { console.error(e); }
    }
    try { history.pushState({ bcam: 1 }, ''); } catch (e) {}
    window.addEventListener('popstate', close);
    box.querySelector('.bdone').addEventListener('click', function(){
      close();
      try { if (history.state && history.state.bcam) history.back(); } catch (e) {}   /* drop the step we added */
    });

    /* Camera blocked or not working: offer the phone's own camera right here (a real tap, so it opens).
       Its photos come back through onShot like burst shots, then it closes. */
    open().then(lenses).catch(function(err){
      console.error(err);
      stop();
      msg.innerHTML = 'Camera blocked here.<br><label class="bzoom" style="display:inline-block;position:relative;margin-top:12px">Use phone camera' +
        '<input type="file" accept="image/*" capture="environment" style="position:absolute;width:1px;height:1px;opacity:0;overflow:hidden"></label>';
      msg.style.bottom = '45%';
      msg.querySelector('input').addEventListener('change', function(){
        Array.prototype.slice.call(this.files || []).slice(0, max - count).forEach(function(f){
          count++;
          try { opts.onShot && opts.onShot(f); } catch (e) { console.error(e); }
        });
        box.querySelector('.bdone').click();
      });
    });
    return true;
  };
})();
