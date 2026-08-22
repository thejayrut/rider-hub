/* Rider Hub compatibility + UX bridge.
   Legacy Phase 3 screens remain in place, but Firebase owns account identity and
   Firestore owns app-data sync. Google Drive is file backup only. */
(()=>{
const AUTH='riderhub_auth_session_v1';
const PREVIEW='riderhub_local_preview_v1';
const GITHUB_HOST='thejayrut.github.io';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const connected=()=>typeof window.cloudSyncConnected==='function'&&window.cloudSyncConnected();
const cloudLabel=()=>typeof window.cloudSyncLabel==='function'?window.cloudSyncLabel():'Not connected';
const previewAllowed=()=>location.hostname===GITHUB_HOST;
const previewActive=()=>previewAllowed()&&localStorage.getItem(PREVIEW)==='1';

window.RIDER_HUB_LOCAL_PREVIEW_ACTIVE=previewActive;
window.RIDER_HUB_EXIT_LOCAL_PREVIEW=function(showLogin=true){
 localStorage.removeItem(PREVIEW);
 const shell=document.querySelector('#rhAuthShell');
 if(showLogin&&shell){shell.classList.add('active');const btn=document.querySelector('#rhGoogleFirebaseLogin');if(btn)btn.disabled=false}
 const chip=document.querySelector('#rhSyncChip');if(chip){chip.hidden=true;chip.dataset.state='signedout'}
 if(typeof window.closeModal==='function')try{window.closeModal()}catch{}
};

/* Old Drive-based sessions must never count as Firebase authentication. */
try{const s=JSON.parse(localStorage.getItem(AUTH)||'null');if(s&&s.provider!=='firebase')localStorage.removeItem(AUTH)}catch{localStorage.removeItem(AUTH)}

/* Prevent the legacy Phase 3 Drive OAuth handler from being used as account login
   during the short interval before firebase-auth.js loads. */
window.rhLoginGoogle=function(){
 const n=document.querySelector('#rhAuthNote');
 if(n){n.className='rh-auth-note';n.textContent='Loading Firebase Google Sign-In…'}
};

function setLocalChip(){
 const chip=document.querySelector('#rhSyncChip');if(!chip)return;
 chip.hidden=false;chip.dataset.state='local';chip.textContent='LOCAL';chip.title='Local preview · cloud sync is off'
}
function hideShellForPreview(){if(!previewActive())return;document.querySelector('#rhAuthShell')?.classList.remove('active');setLocalChip()}
function addPreviewButton(stage){
 if(!previewAllowed()||!stage||stage.querySelector('#rhLocalPreview'))return;
 const google=stage.querySelector('#rhGoogleFirebaseLogin')||[...stage.querySelectorAll('button')].find(b=>/continue with google/i.test(b.textContent||''));
 if(!google)return;
 const btn=document.createElement('button');btn.id='rhLocalPreview';btn.className='rh-auth-button full';btn.textContent='Preview locally without sign-in';btn.style.marginTop='8px';
 btn.onclick=()=>{localStorage.setItem(PREVIEW,'1');localStorage.removeItem(AUTH);hideShellForPreview();if(typeof window.toast==='function')window.toast('Local preview · cloud sync is off')};
 google.insertAdjacentElement('afterend',btn)
}

function patchAuthStage(){
 const stage=document.querySelector('#rhAuthStage');if(!stage)return;
 if(stage.querySelector('#rhEmail')||/login with email|create account with email/i.test(stage.textContent||'')){
  stage.innerHTML=`<div class="rh-auth-login"><div class="rh-slide-kicker">MY ACCOUNT</div><h2>Sign in to Rider Hub</h2><p>Use your Google account. App data syncs privately through Firebase and Firestore.</p><div class="rh-auth-form"><button id="rhGoogleFirebaseLogin" class="rh-auth-button primary full" disabled>Continue with Google</button><div id="rhAuthNote" class="rh-auth-note">Loading Google Sign-In…</div></div></div>`
 }
 const p=[...stage.querySelectorAll('p')].find(x=>(x.textContent||'').includes('Google Drive sync keeps app state'));
 if(p)p.textContent='Firebase keeps Rider Hub app data in sync across devices. Google Drive is reserved for optional private document backup, while the core app remains local-first.';
 stage.querySelectorAll('.rh-auth-feature').forEach(card=>{const b=card.querySelector('b'),span=card.querySelector('span');if(b?.textContent==='Private cloud files'&&span)span.textContent='Private attachments can be backed up separately to Google Drive app data.'});
 addPreviewButton(stage);hideShellForPreview()
}

new MutationObserver(patchAuthStage).observe(document.documentElement,{subtree:true,childList:true});
patchAuthStage();
setTimeout(patchAuthStage,120);setTimeout(patchAuthStage,700);

window.openCloudSetup=function(){
 const c=typeof window.riderHubCloudConfig==='function'?window.riderHubCloudConfig():{};const label=cloudLabel();
 if(typeof window.openModal!=='function')return;
 openModal(`<div class="modalhead"><div><div class="kicker">FILE BACKUP</div><h3>Google Drive</h3><p class="caption">Optional backup for private document attachments. Rider Hub app data syncs through Firestore.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="routecard"><strong>Drive status</strong><p>${esc(label)}${c.lastSync?' · Last file sync '+new Date(c.lastSync).toLocaleString():''}</p></div><div class="rh-service-grid"><div class="rh-service-card"><strong>App data</strong><p>Firebase Firestore · separate from Drive.</p></div><div class="rh-service-card"><strong>Private files</strong><p>Invoices, documents and booking attachments.</p></div></div><div class="grid2" style="margin-top:12px"><button class="secondary" onclick="riderHubSyncNow()">Sync files</button><button class="primary" onclick="requestDriveAccess(true)">${connected()?'Refresh Drive':'Connect Drive'}</button></div>${c.clientId?'<button class="secondary full" style="margin-top:8px" onclick="disconnectRiderHubCloud();setTimeout(openCloudSetup,150)">Disconnect Drive</button>':''}`)
};
window.openStorageInfo=function(){
 if(typeof window.openModal!=='function')return;
 const firebase=typeof window.riderHubFirebaseSyncStatus==='function'?window.riderHubFirebaseSyncStatus():null;
 openModal(`<div class="modalhead"><div><div class="kicker">FILES & STORAGE</div><h3>Your data</h3><p class="caption">Local-first app data with separate cloud services.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="rh-service-grid"><div class="rh-service-card"><strong>App data</strong><p>${previewActive()?'Local preview only':firebase?`Firestore · ${esc(firebase.label)}`:'Firebase loading'}</p></div><div class="rh-service-card"><strong>Private files</strong><p>Google Drive · ${esc(cloudLabel())}</p></div></div><div class="routecard"><strong>Supported private files</strong><p>PDF · JPG/JPEG · PNG · WEBP · HEIC/HEIF · TIFF · GIF · BMP · DOC/DOCX · ODT · RTF · TXT</p></div>${previewActive()?'<button class="primary full" onclick="openTransfer()">Backup / Import local data</button>':'<div class="grid2"><button class="secondary" onclick="riderHubFirebaseSyncNow()">Sync app data</button><button class="primary" onclick="riderHubSyncNow()">Sync private files</button></div>'}`)
};

const priorRenderMore=window.renderMore;
if(typeof priorRenderMore==='function'){
 window.renderMore=function(){
  const out=priorRenderMore.apply(this,arguments);
  const account=[...document.querySelectorAll('#more .more-card')].find(b=>String(b.getAttribute('onclick')||'').includes('openMyAccount'));
  const small=account?.querySelector('small');
  if(small){const u=typeof window.riderHubFirebaseUser==='function'?window.riderHubFirebaseUser():null;const s=typeof window.riderHubFirebaseSyncStatus==='function'?window.riderHubFirebaseSyncStatus():null;small.textContent=previewActive()?'Local preview':u?.email||(s?.label?`Firebase · ${s.label}`:'Firebase account')}
  const storage=[...document.querySelectorAll('#more .more-card')].find(b=>String(b.getAttribute('onclick')||'').includes('openStorageInfo'));
  const storageSmall=storage?.querySelector('small');if(storageSmall)storageSmall.textContent=previewActive()?'Local data + backup tools':'Firestore app data + Drive files';
  return out
 }
}

window.addEventListener('riderhub-sync-status',()=>{if(typeof window.renderMore==='function'&&window.state?.ui?.page==='more')window.renderMore()});

/* When a new service worker takes control, reload once so old JS/CSS cannot keep
   running against a newly activated cache. Skip this on first-ever install. */
if('serviceWorker'in navigator){
 const hadController=!!navigator.serviceWorker.controller;let reloading=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||reloading)return;reloading=true;location.reload()})
}

if(previewActive())setTimeout(hideShellForPreview,80);
})();
