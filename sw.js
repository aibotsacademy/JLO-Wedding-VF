/* Service worker del álbum JLO.
   Solo guarda la página y los íconos para que la app abra rápido.
   Apps Script, Google Drive y las fuentes van siempre directo a la red.
   Si cambias los íconos, sube el número de CACHE (v2, v3…). */
var CACHE = 'jlo-album-v1';
var SHELL = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).catch(function(){}));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // La página: siempre la versión más nueva; sin conexión, la última guardada
  if (req.mode === 'navigate'){
    e.respondWith(fetch(req).then(function(res){
      if (res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put('./', copy); }); }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(r){ return r || caches.match('./'); });
    }));
    return;
  }

  // Íconos, manifest e imágenes propias: primero la copia guardada
  e.respondWith(caches.match(req).then(function(r){ return r || fetch(req); }));
});
