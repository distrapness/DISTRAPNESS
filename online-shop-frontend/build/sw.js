const CACHE_NAME = 'distrapness-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('push', function(event) {
  const data = event.data?.json() || { title: 'Distrapness', body: 'Ada promo baru untukmu!' };
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});
