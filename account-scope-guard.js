(()=>{
'use strict';
const DB_NAME='riderhub_private_docs';
const safe=s=>String(s||'').replace(/[^a-z0-9_-]+/gi,'_').slice(0,150);
const currentUid=()=>window.riderHubFirebaseUser?.()?.uid||'';
const expectedPrefix=()=>currentUid()?`rhuser_${safe(currentUid())}__`:'';
const isForeignScopedKey=key=>{const k=String(key||'');const p=expectedPrefix();return k.startsWith('rhuser_')&&!!p&&!k.startsWith(p)};
for(const name of ['riderHubUploadDoc','riderHubDownloadDoc','riderHubDeleteDoc']){
  const base=window[name];if(typeof base!=='function')continue;
  window[name]=function(key){
    if(isForeignScopedKey(key))return name==='riderHubDownloadDoc'?Promise.resolve(null):name==='riderHubDeleteDoc'?Promise.resolve(false):Promise.resolve({skipped:true});
    return base.apply(this,arguments);
  };
}
async function removeForeignLocalFiles(user){
  const uid=user?.uid;if(!uid)return false;const keep=`rhuser_${safe(uid)}__`;
  return new Promise(resolve=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onerror=()=>resolve(false);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('docs'))req.result.createObjectStore('docs')};
    req.onsuccess=()=>{
      const db=req.result,tx=db.transaction('docs','readwrite'),store=tx.objectStore('docs'),keys=store.getAllKeys();
      keys.onsuccess=()=>{for(const key of keys.result||[]){const k=String(key);if(k.startsWith('rhuser_')&&!k.startsWith(keep))store.delete(key)}};
      tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();resolve(false)};
    };
  });
}
const baseReady=window.riderHubAuthReady;
window.riderHubAuthReady=user=>{if(user)removeForeignLocalFiles(user).catch(()=>{});return baseReady?.(user)};
})();
