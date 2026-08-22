const CACHE='riderhub-v25';
const ASSETS=[
  './','./index.html','./styles.css','./phase2e-restore.css','./phase3-live.css','./phase3-account.css','./firebase-account.css','./approved-changes.css',
  './app.js','./enhancements.js','./phase2e-restore.js','./maps-demo.js','./cloud-sync.js','./phase3-live.js','./phase3-account.js',
  './phase3-public.js','./state-bridge.js','./stability-hotfix.js','./firebase-ui-bridge.js','./motorcycle-catalog.js','./approved-changes.js','./approved-runtime-fixes.js','./firebase-config.js','./firebase-auth.js','./privacy.html','./terms.html','./manifest.webmanifest',
  './icon-192.svg','./icon-512.svg','./icon-maskable.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);

  /* Cross-origin requests belong to Firebase SDK, Google Identity/Drive, maps,
     weather and other APIs. Firebase Hosting also reserves /__/ for auth helpers.
     Never cache, replace or fallback either category. */
  if(url.origin!==self.location.origin||url.pathname.startsWith('/__/'))return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req)
        .then(resp=>{
          if(resp&&resp.ok)caches.open(CACHE).then(cache=>cache.put('./index.html',resp.clone())).catch(()=>{});
          return resp;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(resp=>{
        if(resp&&resp.ok)caches.open(CACHE).then(cache=>cache.put(req,resp.clone())).catch(()=>{});
        return resp;
      })
      .catch(()=>caches.match(req))
  );
});
