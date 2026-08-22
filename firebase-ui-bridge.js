/* Compatibility bridge between the older Phase 3 account UI and Firebase.
   It removes the old Drive-as-login wording while firebase-auth.js owns the
   actual secure authentication and Firestore session. */
(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const connected=()=>typeof window.cloudSyncConnected==='function'&&window.cloudSyncConnected();
const cloudLabel=()=>typeof window.cloudSyncLabel==='function'?window.cloudSyncLabel():'Not connected';

/* Prevent the legacy Phase 3 Google Drive OAuth handler from being used as an
   account login during the short interval before the Firebase module loads. */
window.rhLoginGoogle=function(){
  const n=document.querySelector('#rhAuthNote');
  if(n){n.className='rh-auth-note';n.textContent='Loading Firebase Google Sign-In…'}
};

function patchAuthStage(){
  const stage=document.querySelector('#rhAuthStage');
  if(!stage)return;

  if(stage.querySelector('#rhEmail')||/login with email|create account with email/i.test(stage.textContent||'')){
    stage.innerHTML=`<div class="rh-auth-login"><div class="rh-slide-kicker">MY ACCOUNT</div><h2>Sign in to Rider Hub</h2><p>Use your Google account. App data syncs privately through Firebase and Firestore.</p><div class="rh-auth-form"><button id="rhGoogleFirebaseLogin" class="rh-auth-button primary full" disabled>Continue with Google</button><div id="rhAuthNote" class="rh-auth-note">Loading Google Sign-In…</div></div></div>`;
    return;
  }

  const p=[...stage.querySelectorAll('p')].find(x=>(x.textContent||'').includes('Google Drive sync keeps app state'));
  if(p)p.textContent='Firebase keeps Rider Hub app data in sync across devices. Google Drive is reserved for optional private document backup, while the core app remains local-first.';

  stage.querySelectorAll('.rh-auth-feature').forEach(card=>{
    const b=card.querySelector('b'),span=card.querySelector('span');
    if(b?.textContent==='Private cloud files'&&span)span.textContent='Private attachments can be backed up separately to Google Drive app data.';
  });
}

new MutationObserver(patchAuthStage).observe(document.documentElement,{subtree:true,childList:true});
patchAuthStage();

window.openCloudSetup=function(){
  const c=typeof window.riderHubCloudConfig==='function'?window.riderHubCloudConfig():{};
  const label=cloudLabel();
  if(typeof window.openModal!=='function')return;
  openModal(`<div class="modalhead"><div><div class="kicker">FILE BACKUP</div><h3>Google Drive</h3><p class="caption">Optional backup for private document attachments. Rider Hub app data syncs through Firestore.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="routecard"><strong>Drive status</strong><p>${esc(label)}${c.lastSync?' · Last file sync '+new Date(c.lastSync).toLocaleString():''}</p></div><div class="rh-service-grid"><div class="rh-service-card"><strong>App data</strong><p>Firebase Firestore · separate from Drive.</p></div><div class="rh-service-card"><strong>Private files</strong><p>Invoices, documents and booking attachments.</p></div></div><div class="grid2" style="margin-top:12px"><button class="secondary" onclick="riderHubSyncNow()">Sync files</button><button class="primary" onclick="requestDriveAccess(true)">${connected()?'Refresh Drive':'Connect Drive'}</button></div>${c.clientId?'<button class="secondary full" style="margin-top:8px" onclick="disconnectRiderHubCloud();setTimeout(openCloudSetup,150)">Disconnect Drive</button>':''}`);
};

window.openStorageInfo=function(){
  if(typeof window.openModal!=='function')return;
  openModal(`<div class="modalhead"><div><div class="kicker">FILES & STORAGE</div><h3>Your files</h3><p class="caption">Files stay local first, with optional Google Drive backup.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="routecard"><strong>Supported files</strong><p>PDF · JPG/JPEG · PNG · WEBP · HEIC/HEIF · TIFF · GIF · BMP · DOC/DOCX · ODT · RTF · TXT</p></div><div class="routecard"><strong>Google Drive backup</strong><p>${esc(cloudLabel())}</p></div><button class="primary full" onclick="riderHubSyncNow()">Sync private files</button>`);
};

const priorRenderMore=window.renderMore;
if(typeof priorRenderMore==='function'){
  window.renderMore=function(){
    const out=priorRenderMore.apply(this,arguments);
    const account=[...document.querySelectorAll('#more .more-card')].find(b=>String(b.getAttribute('onclick')||'').includes('openMyAccount'));
    const small=account?.querySelector('small');
    if(small){
      const u=typeof window.riderHubFirebaseUser==='function'?window.riderHubFirebaseUser():null;
      small.textContent=u?.email||'Firebase account';
    }
    return out;
  };
}
})();
