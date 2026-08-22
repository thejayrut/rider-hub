/* Rider Hub stability hotfix.
   Prevent automatic service-worker controller changes from forcing a page reload.
   A manual refresh remains available when the user wants to pick up an update. */
(()=>{
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', event => {
    event.stopImmediatePropagation();
  });
})();
