//TODO: register service worker
navigator.serviceWorker.register('/sw.js').then(function(reg) {

  if (!navigator.serviceWorker.controller) {
    return;
  }

  if (reg.waiting) {
        navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
    }

    if (reg.installing) {
        navigator.serviceWorker.addEventListener('statechange', function () {
            if (navigator.serviceWorker.controller.state == 'installed') {
                navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
            }
        });
    }

    reg.addEventListener('updatefound', function () {
        navigator.serviceWorker.addEventListener('statechange', function () {
            if (navigator.serviceWorker.controller.state == 'installed') {
                navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
            }
        });
    });

  console.log('Service worker registered.');
}).catch(function() {
  console.log('service worker registration failed');
});


var refreshing;
navigator.serviceWorker.addEventListener('controllerchange', function() {
  if (refreshing) return;
  window.location.reload();
  refreshing = true;
});
