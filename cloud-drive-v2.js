/* Rider Hub private-file backup in the signed-in user's own Google Drive.
   Drive preference is account state; access tokens remain short-lived and refresh on demand. */
(()=>{
'use strict';
const CFG_KEY='riderhub_drive_v2';
const ROOT_NAME='Rider Hub';
const DOCS_NAME='Documents';
const MANUALS_NAME='Owner Manuals';
let accessToken='',tokenExpiry=0,modulesPromise=null;
const rawSave=window.savePrivateDoc;
const rawGet=window.getPrivateDoc;
const rawDelete=window.deletePrivateDoc;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>String(s||'').replace(/[^a-z0-9_-]+/gi,'_').slice(0,150);
function readCfg(){try{return JSON.parse(localStorage.getItem(CFG_KEY)||'{}')}catch{return{}}}
function stateCfg(){return window.state?.profile?.drive||{}}
function writeCfg(patch){const next={...readCfg(),...patch};localStorage.setItem(CFG_KEY,JSON.stringify(next));window.dispatchEvent(new CustomEvent('riderhub-drive-state',{detail:driveStatus()}));return next}
function writeStateDrive(enabled,email=''){if(!window.state?.profile)return;window.state.profile.drive={enabled:!!enabled,email:email||window.state.profile.drive?.email||'',updatedAt:Date.now()};window.save?.()}
function firebaseUser(){return typeof window.riderHubFirebaseUser==='function'?window.riderHubFirebaseUser():null}
function logicalUid(){return firebaseUser()?.uid||window.state?.profile?.account?.uid||'local'}
function scopedKey(key){const k=String(key||'document');if(k.startsWith('rhuser_'))return k;return`rhuser_${safe(logicalUid())}__${safe(k)}`}
function connected(){return!!accessToken&&Date.now()<tokenExpiry-60000}
function remembered(){
  const c=readCfg(),s=stateCfg(),user=firebaseUser(),saved=String(c.email||s.email||'').toLowerCase(),active=String(user?.email||window.state?.profile?.email||'').toLowerCase();
  const desired=(c.email?c.desired!==false:false)||s.enabled===true;
  return!!saved&&desired&&(!active||saved===active);
}
function driveStatus(){const c=readCfg(),s=stateCfg();return{connected:connected(),remembered:remembered(),email:c.email||s.email||'',lastSync:c.lastSync||'',desired:remembered(),pending:!!c.lastPendingAt}}
function isManualKey(key){return/owner[_-]?manual/i.test(String(key||''))}
function label(){const s=driveStatus();if(s.connected)return`Google Drive connected${s.email?' · '+s.email:''}`;if(s.remembered)return`Google Drive connected${s.email?' · '+s.email:''} · access refreshes when needed`;return'Google Drive not connected'}
async function loadModules(){if(modulesPromise)return modulesPromise;modulesPromise=Promise.all([import('https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js')]).then(([appMod,authMod])=>({appMod,authMod}));return modulesPromise}
async function api(url,opt={}){if(!connected())throw new Error('Google Drive access needs to be refreshed');const headers=new Headers(opt.headers||{});headers.set('Authorization','Bearer '+accessToken);const r=await fetch(url,{...opt,headers});if(r.status===401){accessToken='';tokenExpiry=0;writeCfg({lastAccessExpiredAt:new Date().toISOString()});throw new Error('Google Drive access needs to be refreshed')}if(!r.ok){const text=await r.text().catch(()=>'');let msg=text;try{msg=JSON.parse(text)?.error?.message||text}catch{}throw new Error(msg||`Google Drive error ${r.status}`)}return r}
const q=s=>encodeURIComponent(s);const quote=s=>String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
async function googleProfile(){const r=await api('https://www.googleapis.com/oauth2/v3/userinfo');return r.json()}
async function findFolder(name,parent='root'){const query=`name='${quote(name)}' and mimeType='application/vnd.google-apps.folder' and '${quote(parent)}' in parents and trashed=false`;const r=await api(`https://www.googleapis.com/drive/v3/files?q=${q(query)}&spaces=drive&fields=files(id,name,parents)&pageSize=20`);const j=await r.json();return j.files?.[0]||null}
async function createFolder(name,parent='root'){const r=await api('https://www.googleapis.com/drive/v3/files?fields=id,name,parents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,mimeType:'application/vnd.google-apps.folder',parents:[parent]})});return r.json()}
async function ensureFolder(name,parent='root'){return await findFolder(name,parent)||await createFolder(name,parent)}
async function ensureFolders(){const root=await ensureFolder(ROOT_NAME,'root'),docs=await ensureFolder(DOCS_NAME,root.id),manuals=await ensureFolder(MANUALS_NAME,root.id);writeCfg({rootId:root.id,docsId:docs.id,manualsId:manuals.id});return{rootId:root.id,docsId:docs.id,manualsId:manuals.id}}
async function accountLocalEntries(){const prefix=`rhuser_${safe(logicalUid())}__`;return new Promise(resolve=>{const req=indexedDB.open('riderhub_private_docs',1);req.onerror=()=>resolve([]);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('docs'))req.result.createObjectStore('docs')};req.onsuccess=()=>{const db=req.result,tx=db.transaction('docs'),store=tx.objectStore('docs'),keys=store.getAllKeys(),vals=store.getAll();let ks=[],vs=[];keys.onsuccess=()=>{ks=keys.result||[]};vals.onsuccess=()=>{vs=vals.result||[]};tx.oncomplete=()=>{db.close();resolve(ks.map((k,i)=>({key:String(k),file:vs[i]})).filter(x=>x.key.startsWith(prefix)&&x.file))};tx.onerror=()=>{db.close();resolve([])}}})}
async function backupAllLocalFiles(){if(!connected())return false;const entries=await accountLocalEntries();let ok=true;for(const entry of entries){try{await uploadDoc(entry.key,entry.file)}catch(e){ok=false;console.warn('Rider Hub Drive pending file',entry.key,e)}}return ok}
async function requestDriveAccess(syncAfter=false,forceConsent=false){
  const user=firebaseUser();if(!user){window.toast?.('Sign in to Rider Hub first');return false}
  try{
    const {appMod,authMod}=await loadModules(),app=appMod.getApps().length?appMod.getApp():null;if(!app)throw new Error('Rider Hub account is still starting');
    const auth=authMod.getAuth(app),provider=new authMod.GoogleAuthProvider();provider.addScope('https://www.googleapis.com/auth/drive.file');provider.addScope('email');provider.addScope('profile');provider.setCustomParameters({prompt:forceConsent||!remembered()?'consent':'',login_hint:user.email||''});
    const result=await authMod.reauthenticateWithPopup(auth.currentUser,provider),credential=authMod.GoogleAuthProvider.credentialFromResult(result);if(!credential?.accessToken)throw new Error('Google Drive permission was not returned');
    accessToken=credential.accessToken;tokenExpiry=Date.now()+55*60*1000;const profile=await googleProfile(),expected=String(user.email||'').toLowerCase(),actual=String(profile.email||'').toLowerCase();if(expected&&actual&&expected!==actual){accessToken='';tokenExpiry=0;throw new Error('Connect the same Google account you use for Rider Hub')}
    const prev=readCfg();if(prev.email&&actual&&String(prev.email).toLowerCase()!==actual)writeCfg({rootId:'',docsId:'',manualsId:''});const folders=await ensureFolders(),email=profile.email||user.email||'';
    writeCfg({desired:true,email,name:profile.name||user.displayName||'',connectedAt:prev.connectedAt||new Date().toISOString(),lastAccessAt:new Date().toISOString(),...folders});writeStateDrive(true,email);
    const filesOk=await backupAllLocalFiles();refreshUi();window.toast?.(filesOk?'Google Drive connected':'Google Drive connected · some files are pending');if(syncAfter&&typeof window.renderMore==='function')window.renderMore();return true;
  }catch(e){console.warn('Rider Hub Drive connection failed',e);const code=String(e?.code||'');if(code.includes('popup-closed')||code.includes('cancelled'))window.toast?.('Google Drive connection cancelled');else if(remembered())window.toast?.('Google Drive needs permission again');else window.toast?.(e?.message||'Could not connect Google Drive');return false}
}
async function ensureDriveAccess(syncAfter=false){if(connected())return true;if(!remembered())return false;return requestDriveAccess(syncAfter,false)}
async function bucketId(key){const c=readCfg();if(c.rootId&&c.docsId&&c.manualsId)return isManualKey(key)?c.manualsId:c.docsId;const f=await ensureFolders();return isManualKey(key)?f.manualsId:f.docsId}
function prefixFor(key){return`RH_${safe(key)}__`}
async function findDoc(key){const folder=await bucketId(key),prefix=prefixFor(key),query=`name contains '${quote(prefix)}' and '${quote(folder)}' in parents and trashed=false`;const r=await api(`https://www.googleapis.com/drive/v3/files?q=${q(query)}&spaces=drive&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,modifiedTime,size,parents)&pageSize=20`);const j=await r.json();return j.files?.find(f=>String(f.name||'').startsWith(prefix))||null}
async function uploadMultipart(name,blob,parentId,existingId=''){const boundary='rh_'+Math.random().toString(36).slice(2),meta={name,mimeType:blob.type||'application/octet-stream'};if(!existingId)meta.parents=[parentId];const body=new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${blob.type||'application/octet-stream'}\r\n\r\n`,blob,`\r\n--${boundary}--`],{type:`multipart/related; boundary=${boundary}`});const url=existingId?`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart&fields=id,name,modifiedTime,parents`:'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,parents';const r=await api(url,{method:existingId?'PATCH':'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});return r.json()}
async function uploadDoc(key,file){const sk=scopedKey(key),folder=await bucketId(sk),old=await findDoc(sk),name=prefixFor(sk)+String(file.name||'document').replace(/[\\/]/g,'_'),out=await uploadMultipart(name,file,folder,old?.id||'');writeCfg({lastSync:new Date().toISOString(),lastPendingAt:''});refreshUi();return out}
async function downloadDoc(key){const sk=scopedKey(key),f=await findDoc(sk);if(!f)return null;const r=await api(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`),b=await r.blob(),prefix=prefixFor(sk),name=String(f.name||'document').startsWith(prefix)?String(f.name).slice(prefix.length):String(f.name||'document');return new File([b],name,{type:f.mimeType||b.type||'application/octet-stream',lastModified:Date.now()})}
async function deleteDocFile(key){const sk=scopedKey(key),f=await findDoc(sk);if(!f)return false;await api(`https://www.googleapis.com/drive/v3/files/${f.id}`,{method:'DELETE'});writeCfg({lastSync:new Date().toISOString()});refreshUi();return true}
async function deleteDriveData(){if(!connected())return false;const c=readCfg();let root=c.rootId?{id:c.rootId}:await findFolder(ROOT_NAME,'root');if(!root?.id)return true;await api(`https://www.googleapis.com/drive/v3/files/${root.id}`,{method:'DELETE'});writeCfg({rootId:'',docsId:'',manualsId:'',lastSync:new Date().toISOString()});return true}
function refreshUi(){window.dispatchEvent(new CustomEvent('riderhub-drive-state',{detail:driveStatus()}));if(window.state?.ui?.page==='more'&&typeof window.renderMore==='function')try{window.renderMore()}catch{}}
function openCloudSetup(){const c=readCfg(),s=driveStatus();if(typeof window.openModal!=='function')return;window.openModal(`<div class="modalhead"><div><div class="kicker">PRIVATE FILE BACKUP</div><h3>Google Drive</h3><p class="caption">Rider Hub remembers this connection until you choose Disconnect.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="routecard"><strong>Status</strong><p>${esc(label())}${c.lastSync?` · Last file sync ${esc(new Date(c.lastSync).toLocaleString())}`:''}</p></div><div class="routecard"><strong>Storage</strong><p>My Drive / Rider Hub / Documents<br>My Drive / Rider Hub / Owner Manuals</p></div>${s.remembered&&!s.connected?'<div class="alert">Your Drive connection is remembered. Google may occasionally require a quick access refresh before a file can sync.</div>':''}<button class="primary full" onclick="requestDriveAccess(true,${s.remembered?'false':'true'})">${s.remembered?'Refresh Drive access':'Connect Google Drive'}</button>${s.remembered?'<button class="ghost full" style="margin-top:8px" onclick="disconnectRiderHubCloud()">Disconnect Google Drive</button>':''}`)}
async function syncNow(){if(!connected()){if(remembered()){const ok=await ensureDriveAccess(false);if(!ok)return false}else{const ok=await requestDriveAccess(false,true);if(!ok)return false}}const ok=await backupAllLocalFiles();window.toast?.(ok?'Private files synced':'Some private files are pending');return ok}
function disconnect(){const email=driveStatus().email;accessToken='';tokenExpiry=0;writeCfg({desired:false,disconnectedAt:new Date().toISOString()});writeStateDrive(false,email);refreshUi();window.toast?.('Google Drive disconnected')}
if(typeof rawSave==='function'&&typeof rawGet==='function'&&typeof rawDelete==='function'){
  window.savePrivateDoc=async function(key,file){const sk=scopedKey(key),result=await rawSave(sk,file);if(connected()){try{await uploadDoc(sk,file);window.toast?.('Backed up to Google Drive')}catch(e){writeCfg({lastPendingAt:new Date().toISOString()});console.warn('Drive backup pending',e);window.toast?.('Saved on device · Drive backup pending')}}else if(remembered()){writeCfg({lastPendingAt:new Date().toISOString()});window.toast?.('Saved on device · Drive access will refresh when needed')}return result};
  window.getPrivateDoc=async function(key){const sk=scopedKey(key);let f=await rawGet(sk);if(!f&&sk!==key){const legacy=await rawGet(key).catch(()=>null);if(legacy){await rawSave(sk,legacy);await rawDelete(key).catch(()=>{});f=legacy}}if(f)return f;if(connected()){try{f=await downloadDoc(sk);if(f){await rawSave(sk,f);return f}}catch(e){console.warn('Drive download unavailable',e)}}return null};
  window.deletePrivateDoc=async function(key){const sk=scopedKey(key),result=await rawDelete(sk);if(connected())try{await deleteDocFile(sk)}catch(e){console.warn('Drive delete pending',e)}else if(remembered())writeCfg({lastPendingAt:new Date().toISOString()});return result};
}
async function deleteLocalAccountFiles(uid){const prefix=`rhuser_${safe(uid)}__`;return new Promise(resolve=>{const req=indexedDB.open('riderhub_private_docs',1);req.onerror=()=>resolve(false);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('docs'))req.result.createObjectStore('docs')};req.onsuccess=()=>{const db=req.result,tx=db.transaction('docs','readwrite'),store=tx.objectStore('docs'),keys=store.getAllKeys();keys.onsuccess=()=>{for(const k of keys.result||[])if(String(k).startsWith(prefix))store.delete(k)};tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();resolve(false)}}})}
window.riderHubScopedDocKey=scopedKey;
window.cloudSyncConnected=connected;
window.cloudSyncLabel=label;
window.openCloudSetup=openCloudSetup;
window.requestDriveAccess=requestDriveAccess;
window.disconnectRiderHubCloud=disconnect;
window.riderHubSyncNow=syncNow;
window.riderHubEnsureDriveAccess=ensureDriveAccess;
window.riderHubReconnectDrive=()=>requestDriveAccess(true,true);
window.riderHubDriveRemembered=remembered;
window.riderHubDriveStatus=driveStatus;
window.riderHubUploadDoc=uploadDoc;
window.riderHubDownloadDoc=downloadDoc;
window.riderHubDeleteDoc=deleteDocFile;
window.riderHubDeleteDriveData=deleteDriveData;
window.riderHubDeleteLocalAccountFiles=deleteLocalAccountFiles;
window.riderHubCloudConfig=readCfg;
})();
