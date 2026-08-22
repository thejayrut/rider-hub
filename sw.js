const CACHE='riderhub-v32';
const ASSETS=[
  './','./index.html','./styles.css','./phase2e-restore.css','./phase3-live.css','./phase3-account.css','./firebase-account.css','./approved-changes.css','./confirmed-features.css','./final-polish.css','./v32-ui.css',
  './app.js','./enhancements.js','./phase2e-restore.js','./maps-demo.js','./cloud-drive-v2.js','./phase3-live.js','./phase3-account.js',
  './phase3-public.js','./state-bridge.js','./stability-hotfix.js','./firebase-ui-bridge.js','./motorcycle-catalog.js','./auth-transition-guard.js','./approved-changes.js','./approved-runtime-fixes.js','./manual-reader.js','./confirmed-features.js','./manual-reader-v2.js','./ride-pdf-importer.js','./ride-mode-v2.js','./ride-mode-polish.js','./final-polish.js','./v31-undo-guards.js','./manual-reader-v3.js','./v32-fixes.js','./v32-fast-start.js','./auth-flow-controller.js','./firebase-config.js','./firebase-auth.js','./firebase-account-delete.js','./privacy.html','./terms.html','./manifest.webmanifest',
  './icon-192.svg','./icon-512.svg','./icon-maskable.svg'
];

const delay=ms=>new Promise((_,reject)=>setTimeout(()=>reject(new Error('network timeout')),ms));

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
    event.respondWith((async()=>{
      const cached=await caches.match('./index.html');
      const network=fetch(req).then(resp=>{
        if(resp&&resp.ok)caches.open(CACHE).then(cache=>cache.put('./index.html',resp.clone())).catch(()=>{});
        return resp;
      });
      if(!cached)return network;
      try{return await Promise.race([network,delay(1400)])}catch{return cached}
    })());
    return;
  }

  /* Static app files are cache-first. A slow connection must never hold the UI
     hostage for minutes. When cached content exists, serve it immediately and
     refresh that cache in the background. */
  event.respondWith((async()=>{
    const cached=await caches.match(req);
    const network=fetch(req).then(resp=>{
      if(resp&&resp.ok)caches.open(CACHE).then(cache=>cache.put(req,resp.clone())).catch(()=>{});
      return resp;
    });
    if(cached){event.waitUntil(network.catch(()=>{}));return cached}
    try{return await network}catch{return caches.match(req)}
  })());
});
