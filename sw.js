const CACHE='riderhub-stable-v34';
const ASSETS=['./','./index.html','./stable-app.css','./stable-compat.css','./stable-app.js','./stable-auth.js','./firebase-config.js','./motorcycle-catalog.js','./manual-reader.js','./cloud-drive-v2.js','./manifest.webmanifest','./icon-192.svg','./icon-512.svg','./icon-maskable.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/__/'))return;
 if(req.mode==='navigate'){
   event.respondWith(fetch(req).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put('./index.html',r.clone())).catch(()=>{});return r}).catch(()=>caches.match('./index.html')));return;
 }
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(req,r.clone())).catch(()=>{});return r})));
});
