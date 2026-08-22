const CACHE='riderhub-v17';
const ASSETS=[
  './','./index.html','./styles.css','./phase2e-restore.css','./phase3-live.css','./phase3-account.css',
  './app.js','./enhancements.js','./phase2e-restore.js','./maps-demo.js','./cloud-sync.js','./cloud-sync-fix.js',
  './phase3-live.js','./phase3-account.js','./phase3-public.js','./firebase-ui-bridge.js','./firebase-config.js','./firebase-auth.js',
  './privacy.html','./terms.html','./manifest.webmanifest'
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

  /* Never intercept Firebase SDK, Google Identity, Drive API, maps, weather or
     any other cross-origin request. Serving cached HTML as a failed module/API
     response can break authentication and produce hard-to-debug blank screens. */
  if(url.origin!==self.location.origin)return;

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
