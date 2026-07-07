const CACHE_NAME = 'rrai-v1';
const urlsToCache = [
  '/',
  '/menu.html',
  '/avatar-ami.png'
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
      .then(response => {
        // Toujours essayer le réseau d'abord pour les requêtes API (Optionnel, mais plus sûr pour un SaaS)
        return fetch(event.request).catch(() => response);
      })
  );
});

self.addEventListener('push', event => {
  let data = { title: "Nouvelle notification", body: "Vous avez un nouveau message." };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch(e) {
    if(event.data) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: '/avatar-ami.png',
    badge: '/avatar-ami.png'
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
