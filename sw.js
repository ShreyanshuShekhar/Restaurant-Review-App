let staticCacheName = 'restaurant-review-v3';

// TODO: install new cache
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
      '/',
      'index.html',
      'restaurant.html',
      'css/styles.css',
      'css/styles_index.css',
      'css/styles_restaurant.css',
      'css/responsive.css',
      'data/restaurants.json',
      'js/dbhelper.js',
      'js/main.js',
      'js/restaurant_info.js',
      'js/sw_registration.js',
      'img/1.webp',
      'img/2.webp',
      'img/3.webp',
      'img/4.webp',
      'img/5.webp',
      'img/6.webp',
      'img/7.webp',
      'img/8.webp',
      'img/9.webp',
      'img/10.webp'
      ]);
    })
  );
});

// TODO: delete old caches
self.addEventListener('activate',function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
              return cacheName.startsWith('restaurant-') && (staticCacheName != cacheName);
            }).map(function(cacheName) {
              return caches.delete(cacheName);
        })
      );
    })
  );
});

// TODO: fetch request
self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    }).catch(function() {
      return caches.match('restaurant.html');
    })
  );
});
