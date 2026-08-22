/* Rider Hub Google Drive backup for private document attachments only.
   App state belongs to Firebase Authentication + Firestore. Keeping Drive
   file-only avoids two cloud databases racing to overwrite Rider Hub state.
   OAuth client IDs are public browser identifiers; no client secret is stored. */
(()=>{
const CFG='riderhub_cloud_sync_v1';
const DEFAULT_CLIENT_ID='819467937839-rpdc20lrpgtmsi4ijtisppg1rr1dsq8t.apps.googleusercontent.com';
let accessToken='',tokenExpiry=0,gisPromise=null;

const escHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cfg(){try{return JSON.parse(localStorage.getItem(CFG)||'{}')}catch{return{}}}
function setCfg(v){localStorage.setItem(CFG,JSON.stringify({...cfg(),...v}))}
function connected(){return !!accessToken&&Date.now()<tokenExpiry-60000}

if(!cfg().clientId)setCfg({clientId:DEFAULT_CLIENT_ID});

function preloadGIS(){
 if(window.google?.accounts?.oauth2||document.querySelector('script[data-rh-gis]'))return;
 const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.defer=true;s.dataset.rhGis='1';document.head.appendChild(s)
}
preloadGIS();

function loadGIS(){
 if(window.google?.accounts?.oauth2)return Promise.resolve();
 if(gisPromise)return gisPromise;
 gisPromise=new Promise((res,rej)=>{
  const existing=document.querySelector('script[data-rh-gis]');
  if(existing){
   let tries=0;const timer=setInterval(()=>{tries++;if(window.google?.accounts?.oauth2){clearInterval(timer);res()}else if(tries>60){clearInterval(timer);rej(new Error('Google Drive sign-in did not load'))}},100);return;
  }
  const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.defer=true;s.dataset.rhGis='1';s.onload=()=>res();s.onerror=()=>rej(new Error('Could not load Google Drive sign-in'));document.head.appendChild(s)
 });
 return gisPromise
}

async function api(url,opt={}){
 if(!connected())throw new Error('Google Drive backup is not connected');
 const h=new Headers(opt.headers||{});h.set('Authorization','Bearer '+accessToken);
 const r=await fetch(url,{...opt,headers:h});
 if(r.status===401){accessToken='';tokenExpiry=0;throw new Error('Google Drive session expired. Reconnect from My Account.')}
 if(!r.ok){const text=await r.text().catch(()=>''),msg=(()=>{try{return JSON.parse(text)?.error?.message||text}catch{return text}})();throw new Error(msg||('Google Drive error '+r.status))}
 return r
}
function q(s){return encodeURIComponent(s)}
async function findDoc(key){const prefix=`riderhub_doc_${key}__`;const r=await api(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q(`name contains '${prefix}' and trashed=false`)}&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=10`);const j=await r.json();return j.files?.[0]||null}
async function uploadMultipart(name,blob,existingId=''){
 const boundary='rh_'+Math.random().toString(36).slice(2);const meta={name,mimeType:blob.type||'application/octet-stream'};if(!existingId)meta.parents=['appDataFolder'];
 const body=new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${blob.type||'application/octet-stream'}\r\n\r\n`,blob,`\r\n--${boundary}--`],{type:`multipart/related; boundary=${boundary}`});
 const url=existingId?`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart&fields=id,name,modifiedTime`:'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime';
 const r=await api(url,{method:existingId?'PATCH':'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});return r.json()
}
async function profile(){
 try{
  const r=await api('https://www.googleapis.com/oauth2/v3/userinfo');const j=await r.json(),before=cfg();const email=(j.email||'').toLowerCase();
  if(before.lastGoogleEmail&&email&&before.lastGoogleEmail!==email&&typeof window.riderHubPublicBeforeGoogleSwitch==='function')try{window.riderHubPublicBeforeGoogleSwitch(before.lastGoogleEmail,email)}catch{}
  setCfg({name:j.name||j.email||'',email:j.email||'',picture:j.picture||'',lastGoogleEmail:email||before.lastGoogleEmail||''});return j
 }catch{return null}
}
function cloudLabel(){const c=cfg();return connected()?(c.email||'Connected'):c.email&&c.clientId?'Google linked · reconnect to back up files':c.clientId?'Ready to connect':'Not connected'}
function refreshCloudUi(){
 if(typeof window.renderMore==='function'&&window.state?.ui?.page==='more')window.renderMore();
 document.querySelectorAll('#modal .routecard').forEach(card=>{
  const heading=card.querySelector('strong')?.textContent?.trim();
  if(['Drive status','Google Drive backup','Status'].includes(heading)){
   const p=card.querySelector('p');if(p)p.textContent=cloudLabel()+(cfg().lastSync?' · Last file sync '+new Date(cfg().lastSync).toLocaleString():'')
  }
 })
}
async function syncNow(){
 if(!connected()){requestDriveAccess(true);return false}
 if(typeof toast==='function')toast('Google Drive file backup ready');
 refreshCloudUi();return true
}
async function requestDriveAccess(syncAfter=false){
 const c=cfg();if(!c.clientId){setCfg({clientId:DEFAULT_CLIENT_ID})}
 try{await loadGIS()}catch(e){if(typeof toast==='function')toast(e.message);return false}
 return new Promise(resolve=>{
  const client=google.accounts.oauth2.initTokenClient({
   client_id:(cfg().clientId||DEFAULT_CLIENT_ID),
   scope:'openid email profile https://www.googleapis.com/auth/drive.appdata',
   prompt:'consent',
   callback:async r=>{
    if(r.error){if(typeof toast==='function')toast('Google Drive connection was not completed');resolve(false);return}
    accessToken=r.access_token;tokenExpiry=Date.now()+(Number(r.expires_in||3600)*1000);await profile();setCfg({connectedAt:new Date().toISOString()});
    if(typeof toast==='function')toast('Google Drive file backup connected');refreshCloudUi();
    if(syncAfter)setTimeout(()=>{if(typeof window.riderHubSyncNow==='function')window.riderHubSyncNow()},150);
    resolve(true)
   }
  });
  try{client.requestAccessToken()}catch(e){if(typeof toast==='function')toast('Could not open Google Drive connection');resolve(false)}
 })
}
function disconnect(){accessToken='';tokenExpiry=0;setCfg({email:'',name:'',picture:'',connectedAt:''});if(typeof toast==='function')toast('Google Drive backup disconnected');refreshCloudUi()}
function openCloudSetup(){const c=cfg();openModal(`<div class="modalhead"><div><div class="kicker">FILE BACKUP</div><h3>Google Drive</h3><p class="caption">Private document attachments only. Rider Hub app data syncs through Firebase.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="routecard"><strong>Drive status</strong><p>${escHtml(cloudLabel())}${c.lastSync?` · Last file sync ${new Date(c.lastSync).toLocaleString()}`:''}</p></div><div class="modal-actions"><button class="secondary" onclick="riderHubSyncNow()">Sync files</button><button class="confirm" onclick="requestDriveAccess(true)">${connected()?'Refresh Google session':'Connect Google Drive'}</button></div>${c.clientId?'<button class="secondary full" style="margin-top:8px" onclick="disconnectRiderHubCloud()">Disconnect Drive</button>':''}`)}
function saveClientId(){if(typeof toast==='function')toast('Cloud connection is managed by Rider Hub')}
function docCloudName(key,file){return`riderhub_doc_${String(key).replace(/[^a-z0-9_-]/gi,'_')}__${file.name.replace(/[\\/]/g,'_')}`}
async function uploadDoc(key,file){if(!connected())return false;const existing=await findDoc(key);await uploadMultipart(docCloudName(key,file),file,existing?.id||'');setCfg({lastSync:new Date().toISOString()});refreshCloudUi();return true}
async function downloadDoc(key){if(!connected())return null;const f=await findDoc(key);if(!f)return null;const r=await api(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`);const b=await r.blob();const marker='__',name=f.name.includes(marker)?f.name.split(marker).slice(1).join(marker):f.name;return new File([b],name,{type:f.mimeType||b.type||'application/octet-stream',lastModified:Date.now()})}
async function deleteDoc(key){if(!connected())return false;const f=await findDoc(key);if(!f)return false;await api(`https://www.googleapis.com/drive/v3/files/${f.id}`,{method:'DELETE'});setCfg({lastSync:new Date().toISOString()});refreshCloudUi();return true}

window.cloudSyncConnected=connected;window.cloudSyncLabel=cloudLabel;window.openCloudSetup=openCloudSetup;window.saveCloudClientId=saveClientId;window.requestDriveAccess=requestDriveAccess;window.disconnectRiderHubCloud=disconnect;window.riderHubSyncNow=syncNow;window.riderHubUploadDoc=uploadDoc;window.riderHubDownloadDoc=downloadDoc;window.riderHubDeleteDoc=deleteDoc;window.riderHubCloudConfig=cfg;

const baseSaveDoc=window.savePrivateDoc;if(typeof baseSaveDoc==='function'){window.savePrivateDoc=async function(key,file){const r=await baseSaveDoc(key,file);if(connected()){try{await uploadDoc(key,file);if(typeof toast==='function')toast('Saved and backed up')}catch(e){if(typeof toast==='function')toast('Saved on device · Drive backup pending')}}return r}}
const baseGetDoc=window.getPrivateDoc;if(typeof baseGetDoc==='function'){window.getPrivateDoc=async function(key){let f=await baseGetDoc(key);if(f)return f;if(connected()){try{f=await downloadDoc(key);if(f){await baseSaveDoc(key,f);return f}}catch{}}return null}}
const baseDeleteDoc=window.deletePrivateDoc;if(typeof baseDeleteDoc==='function'){window.deletePrivateDoc=async function(key){const r=await baseDeleteDoc(key);if(connected()){try{await deleteDoc(key)}catch{}}return r}}
})();
