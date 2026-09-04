const VERSION = 'playcounter-202609042256';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION)
      .then(function (c) { return c.addAll(ASSETS); })
      .catch(function () {})
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

// Network first for the page itself, so a new build is picked up as soon as
// there is any connection. Falls back to cache when offline.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var isPage = e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').indexOf('text/html') !== -1;

  if (isPage) {
    e.respondWith(
      fetch(e.request)
        .then(function (res) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put('./index.html', copy); }).catch(function () {});
          return res;
        })
        .catch(function () {
          return caches.match('./index.html', { ignoreSearch: true })
            .then(function (hit) { return hit || caches.match('./'); });
        })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(e.request, copy); }).catch(function () {});
        return res;
      });
    })
  );
});
