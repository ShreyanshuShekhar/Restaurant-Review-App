//TODO: register service worker
navigator.serviceWorker.register('/sw.js').then(function() {

  if (!navigator.serviceWorker.controller) {
    return;
  }

  console.log('service worker registered');
}).catch(function() {
  console.log('service worker registration failed');
});
