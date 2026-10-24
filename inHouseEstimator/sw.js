/* K&C Estimator service worker — offline-first.
   Bump CACHE when you upload new files, or phones keep the old copy. */
var CACHE = 'kc-estimator-v147';
/* Saved by "Download offline job sheet" (offline.js). Never cleared on update. */
var OFFLINE = 'kc-offline-pages';
var ASSETS = ['./','./index.html','./app.css','./pricing.js','./pricing-live.js','./partner-pricing.js','./app.js','./manifest.webmanifest',
              '../images/icon-180.png','../images/icon-192.png','../images/icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE && k !== OFFLINE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if(e.request.mode === 'navigate'){
    /* Other pages: the browser handles them itself (intercepting them broke the
       login.html redirects with ERR_FAILED). Job Sheet, room pages and the Hub (the
       home-screen icon) load as normal with service; with no service they open from the
       copy "Download offline job sheet" saved. The Hub falls back to the Job Sheet, which
       lists the downloaded jobs. */
    var p = url.pathname.replace(/\.html$/, '');
    if(url.origin !== self.location.origin || !/\/(job-sheet|job-room|hub)$/.test(p)) return;
    e.respondWith(fetch(e.request).catch(function(){
      return caches.open(OFFLINE).then(function(c){
        return c.match(url.origin + p).then(function(hit){
          return hit || c.match(url.origin + p.replace(/(job-room|hub)$/, 'job-sheet'));
        });
      }).then(function(hit){ return hit || Response.error(); });
    }));
    return;
  }
  /* Photos from Firebase Storage and other outside files: never answer with the estimator page. */
  if(url.origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(function(c){ return c.match(e.request); }).then(function(hit){
    /* No service: files saved for offline, otherwise the estimator page as before. */
    return hit || fetch(e.request).catch(function(){
      return caches.open(OFFLINE).then(function(c){ return c.match(e.request); })
        .then(function(off){ return off || caches.match('./index.html'); });
    });
  }));
});
