(()=>{
'use strict';
const CREATOR='Jayrut Gajjar';
const INSTAGRAM_HANDLE='@jayrut.raw';
const INSTAGRAM_URL='https://www.instagram.com/jayrut.raw/';
const YOUTUBE_HANDLE='@jayrut-raw';
const YOUTUBE_URL='https://www.youtube.com/@jayrut-raw';
const FEEDBACK_EMAIL='jayrut.raw@gmail.com';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cfg=()=>{try{return window.riderHubCloudConfig?.()||{}}catch{return{}}};
const driveReady=()=>!!window.cloudSyncConnected?.();

function driveLabel(){
  const c=cfg();
  if(driveReady())return `Google Drive connected${c.email?' · '+c.email:''}`;
  if(c.email)return `Google Drive linked · ${c.email}`;
  return 'Google Drive · not connected';
}
window.cloudSyncLabel=driveLabel;

const originalRequestDriveAccess=window.requestDriveAccess;
window.requestDriveAccess=async function(syncAfter=false){
  if(typeof originalRequestDriveAccess!=='function')return false;
  const ok=await originalRequestDriveAccess(syncAfter);
  if(ok){
    try{window.renderMore?.()}catch{}
    setTimeout(()=>{try{window.openCloudSetup?.()}catch{}},0);
  }
  return ok;
};

window.openCloudSetup=function(){
  const c=cfg(),ready=driveReady(),linked=!!c.email;
  const status=ready?'Drive connected':linked?'Drive linked':'Drive not connected';
  const detail=ready
    ?`Connected as ${esc(c.email||'your Google account')}. New Rider Hub private files can back up to your Drive.`
    :linked
      ?`Rider Hub remembers ${esc(c.email)}. Reconnect when Google asks for a fresh Drive permission.`
      :'Connect the same Google account you use for Rider Hub.';
  const action=ready
    ?`<button class="primary full" disabled>✓ Drive connected</button><button class="ghost full" style="margin-top:8px" onclick="requestDriveAccess(true)">Refresh Drive permission</button>`
    :`<button class="primary full" onclick="requestDriveAccess(true)">${linked?'Reconnect Google Drive':'Connect Google Drive'}</button>`;
  window.openModal?.(`<div class="modalhead"><div><div class="kicker">PRIVATE FILE BACKUP</div><h3>Google Drive</h3><p class="caption">Rider Hub stores private files in a visible folder in your own Google Drive.</p></div><button class="iconbtn" onclick="closeModal()">×</button></div>
    <div class="card notice"><strong>Storage location</strong><p class="caption">My Drive / Rider Hub / Documents<br>My Drive / Rider Hub / Owner Manuals</p></div>
    <div class="card notice"><strong>${status}</strong><p class="caption">${detail}</p></div>
    <div class="card notice"><strong>Private by design</strong><p class="caption">Rider Hub requests the narrow Drive permission for files created or used with this app. It does not request unrestricted access to your whole Drive.</p></div>
    ${action}`);
};

window.openInstagram=()=>window.open(INSTAGRAM_URL,'_blank','noopener,noreferrer');
window.openYouTube=()=>window.open(YOUTUBE_URL,'_blank','noopener,noreferrer');
window.openFeedback=()=>{location.href=`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('Rider Hub Feedback')}&body=${encodeURIComponent('Hi Jayrut,\n\nMy Rider Hub feedback:\n')}`};

window.openAbout=function(){
  window.openModal?.(`<div class="modalhead"><div><div class="kicker">RIDER HUB</div><h3>About Rider Hub</h3><p class="caption">Your motorcycle companion</p></div><button class="iconbtn" onclick="closeModal()">×</button></div>
    <div class="card notice"><div class="kicker">MADE BY</div><h3 style="margin:6px 0 0">${CREATOR}</h3></div>
    <div class="card notice"><strong>Why Rider Hub exists</strong><p class="caption">Rider Hub keeps your motorcycle, maintenance, rides, gear, maps and private files in one focused place without turning ownership into a dashboard maze.</p></div>
    <div class="card notice"><strong>Private files</strong><p class="caption">When Google Drive is connected, manuals and private documents can be backed up to your own visible Rider Hub folder in your Google Drive.</p></div>
    <div class="grid3" style="margin-top:10px"><button class="ghost" onclick="openInstagram()"><b>◎</b><br><span>Instagram</span><small style="display:block;margin-top:4px">${INSTAGRAM_HANDLE}</small></button><button class="ghost" onclick="openYouTube()"><b>▶</b><br><span>YouTube</span><small style="display:block;margin-top:4px">${YOUTUBE_HANDLE}</small></button><button class="ghost" onclick="openFeedback()"><b>✉</b><br><span>Feedback</span><small style="display:block;margin-top:4px">Email me</small></button></div>
    <p class="caption" style="margin-top:12px">Feedback: ${FEEDBACK_EMAIL}</p>`);
};

try{if(document.querySelector('#more')?.classList.contains('active'))window.renderMore?.()}catch{}
})();
