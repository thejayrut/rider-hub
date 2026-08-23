(()=>{
'use strict';
const APP_KEY='riderhub_stable_v1';
const $=s=>document.querySelector(s);
const S=()=>window.state||{};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const persist=()=>{try{localStorage.setItem(APP_KEY,JSON.stringify(S()))}catch{}};
const fmtDate=s=>{if(!s)return'Date TBD';try{return new Date(s+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}catch{return s}};
const rideById=id=>(S().rides||[]).find(r=>r.id===id);

/* Small final-product styles: hierarchy over decoration. */
const style=document.createElement('style');style.textContent=`
.save-state{min-height:30px;padding:0 9px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--muted);font-size:8px;font-weight:850;cursor:pointer;white-space:nowrap}.save-state.synced{color:var(--good);border-color:rgba(113,200,134,.2)}.save-state.syncing,.save-state.pending{color:var(--accent);border-color:rgba(var(--accent-rgb),.24)}.save-state.offline{color:var(--muted)}
.finish-home{display:grid;gap:12px}.finish-hero{padding:25px;border:1px solid rgba(var(--accent-rgb),.18);border-radius:22px;background:radial-gradient(circle at 90% 12%,rgba(var(--accent-rgb),.13),transparent 34%),linear-gradient(145deg,#131618,#0d0f11)}.finish-hero h1{font-size:clamp(31px,6vw,52px);line-height:.98;letter-spacing:-.045em;margin:7px 0 9px}.finish-hero>p{margin:0;color:var(--muted);font-size:11px}.finish-bike{margin-top:21px;padding:16px;border-radius:18px;border:1px solid var(--line);background:rgba(7,8,9,.48);cursor:pointer}.finish-bike-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.finish-bike strong{font-size:17px}.finish-bike small{display:block;margin-top:4px;color:var(--muted);font-size:9px}.finish-ready{font-size:7px;font-weight:900;letter-spacing:.09em;color:var(--good);border:1px solid rgba(113,200,134,.25);border-radius:999px;padding:6px 8px}.finish-metrics{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-top:15px;border-top:1px solid var(--line)}.finish-metric{padding-top:12px}.finish-metric+ .finish-metric{padding-left:16px;border-left:1px solid var(--line)}.finish-metric span{display:block;color:var(--muted);font-size:7px;letter-spacing:.1em}.finish-metric b{display:block;margin-top:4px;font-size:18px}.finish-metric b.accent{color:var(--accent)}
.now-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;padding:17px 18px;border:1px solid var(--line);border-radius:18px;background:var(--surface)}.now-card .kicker{margin-bottom:5px}.now-card h2{font-size:19px;margin:0 0 4px}.now-card p{margin:0;color:var(--muted);font-size:9px;line-height:1.5}.now-card .primary{white-space:nowrap}.finish-quick{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.finish-quick button{min-height:76px;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--text);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer}.finish-quick b{font-size:15px;color:var(--accent)}.finish-quick span{font-size:9px}.finish-syncline{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:0 3px;color:var(--muted);font-size:8px}
.finish-more{display:grid;gap:11px}.more-finish-hero{display:flex;align-items:end;justify-content:space-between;gap:18px;padding:23px;border-radius:21px;border:1px solid rgba(var(--accent-rgb),.18);background:linear-gradient(145deg,#131618,#0d0f11)}.more-finish-hero h1{font-size:clamp(31px,5vw,46px);margin:5px 0 6px;letter-spacing:-.04em}.more-finish-hero p{margin:0;color:var(--muted);font-size:10px}.more-finish-hero .primary{min-width:170px}.finish-more-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.finish-more-card{min-height:100px;padding:15px;border:1px solid var(--line);border-radius:17px;background:var(--surface);color:var(--text);text-align:left;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;gap:12px}.finish-more-card b{font-size:15px;color:var(--accent)}.finish-more-card span{font-size:11px;font-weight:850}.finish-more-card small{color:var(--muted);font-size:8px;line-height:1.45}.finish-more-card.status-good b{color:var(--good)}
.health-list{display:grid;gap:7px}.health-row{display:grid;grid-template-columns:12px minmax(0,1fr) auto;align-items:center;gap:10px;padding:12px 13px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}.health-dot{width:8px;height:8px;border-radius:50%;background:var(--muted)}.health-dot.good{background:var(--good)}.health-dot.warn{background:var(--accent)}.health-dot.off{background:var(--danger)}.health-row strong{font-size:10px}.health-row small{display:block;color:var(--muted);font-size:8px;margin-top:2px}.health-row>span:last-child{font-size:8px;color:var(--muted);text-align:right}.drive-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}.resume-ridemode{margin:0 0 10px;padding:11px 13px;border:1px solid rgba(var(--accent-rgb),.25);border-radius:14px;background:rgba(var(--accent-rgb),.06);display:flex;align-items:center;justify-content:space-between;gap:10px}.resume-ridemode strong{font-size:10px}.resume-ridemode small{display:block;color:var(--muted);font-size:8px;margin-top:2px}
@media(max-width:760px){.finish-more-grid{grid-template-columns:1fr 1fr}.more-finish-hero{align-items:stretch;flex-direction:column}.more-finish-hero .primary{width:100%}.now-card{grid-template-columns:1fr}.now-card .primary{width:100%}.finish-syncline{align-items:flex-start;flex-direction:column}.save-state{padding:0 7px}.drive-actions{grid-template-columns:1fr}}
@media(max-width:480px){.finish-hero{padding:19px}.finish-quick{grid-template-columns:1fr 1fr}.finish-more-grid{grid-template-columns:1fr 1fr}.finish-more-card{min-height:88px}.finish-metrics{grid-template-columns:1fr 1fr}.header-actions{gap:5px}.save-state{font-size:7px}}
`;document.head.appendChild(style);

/* Save/sync feedback in the header. */
function ensureSaveState(){
  const actions=$('.header-actions');if(!actions)return null;
  let el=$('#saveState');if(!el){el=document.createElement('button');el.id='saveState';el.className='save-state';el.onclick=()=>window.openRiderHubStatus?.();actions.insertBefore(el,$('#networkStatus')||actions.firstChild)}
  return el;
}
function syncLabel(){
  const c=window.riderHubCloudState?.()||{},user=window.riderHubFirebaseUser?.();
  if(!navigator.onLine)return{state:'offline',text:'Saved offline'};
  if(!user)return{state:'local',text:'Device only'};
  if(c.state==='syncing')return{state:'syncing',text:'Syncing…'};
  if(c.state==='pending')return{state:'pending',text:'Pending sync'};
  if(c.state==='synced')return{state:'synced',text:'Synced'};
  return{state:'local',text:'Saved'};
}
function updateSaveState(){const el=ensureSaveState();if(!el)return;const s=syncLabel();el.className=`save-state ${s.state}`;el.textContent=s.text;el.title='Rider Hub save and sync status'}
window.addEventListener('riderhub-cloud-state',updateSaveState);window.addEventListener('online',updateSaveState);window.addEventListener('offline',updateSaveState);

/* Context-aware Home: one important thing, then quick access. */
function nextService(){const b=S().bike||{},odo=Number(b.odo||0),m=(b.serviceMilestones||[]).find(x=>Number(x)>odo);return Number(m||b.nextServiceKm||0)}
function homeContext(){
  const resume=rideById(S().ui?.resumeRideModeId);if(resume)return{k:'CONTINUE',h:'Ride Mode is ready to resume.',p:`${resume.name} · Day ${(resume.selectedDay||0)+1} of ${resume.days.length}`,a:'Continue Ride Mode',go:`openRideMode('${resume.id}')`};
  const service=nextService(),odo=Number(S().bike?.odo||0),left=service?service-odo:Infinity;if(left<=500)return{k:'MAINTENANCE',h:`Service in ${Math.max(0,left).toLocaleString('en-IN')} km`,p:'Your next saved manufacturer/manual service milestone is getting close.',a:'Open Bike',go:"setPage('bike')"};
  const ride=(S().rides||[]).find(r=>r.status!=='completed');if(ride)return{k:'NEXT RIDE',h:ride.name,p:`${ride.days.length} day${ride.days.length===1?'':'s'} · ${fmtDate(ride.start)}`,a:'Open ride',go:`openRide('${ride.id}')`};
  const drive=window.riderHubDriveStatus?.()||{};if(drive.remembered&&!drive.connected)return{k:'PRIVATE FILES',h:'Google Drive stays connected.',p:'Drive access will refresh only when a file action needs it.',a:'Drive status',go:'openCloudSetup()'};
  return{k:'READY',h:'Nothing needs your attention.',p:'Your motorcycle information stays close when you need it.',a:'Plan a ride',go:"setPage('rides')"};
}
function renderHomeFinish(){
  const root=$('#home');if(!root)return;const b=S().bike||{},configured=S().profile?.bikeConfigured,n=nextService(),ctx=homeContext(),drive=window.riderHubDriveStatus?.()||{},cloud=syncLabel();
  root.innerHTML=`<div class="finish-home"><section class="finish-hero"><div class="kicker">RIDER HUB</div><h1>Your motorcycle.<br>Ready when you are.</h1><p>Bike, rides, gear and the details worth keeping close.</p><div class="finish-bike" onclick="setPage('bike')"><div class="finish-bike-head"><div><strong>${esc(configured?(b.name||`${b.manufacturer||''} ${b.model||''}`.trim()):'Set up your motorcycle')}</strong><small>${esc(configured?[b.variant,b.colour,b.year].filter(Boolean).join(' · '):'Add your motorcycle details')}</small></div><span class="finish-ready">${configured?'READY':'SETUP'}</span></div>${configured?`<div class="finish-metrics"><div class="finish-metric"><span>ODOMETER</span><b>${Number(b.odo||0).toLocaleString('en-IN')} km</b></div><div class="finish-metric"><span>NEXT SERVICE</span><b class="accent">${n?n.toLocaleString('en-IN')+' km':'Manual / schedule needed'}</b></div></div>`:''}</div></section><section class="now-card"><div><div class="kicker">${ctx.k}</div><h2>${esc(ctx.h)}</h2><p>${esc(ctx.p)}</p></div><button class="primary" onclick="${ctx.go}">${esc(ctx.a)}</button></section><div class="finish-quick"><button onclick="setPage('rides')"><b>↗</b><span>My rides</span></button><button onclick="editOdo()"><b>◉</b><span>Odometer</span></button><button onclick="setPage('gear')"><b>▣</b><span>Gear Garage</span></button><button onclick="openEmergency()"><b>SOS</b><span>Emergency</span></button></div><div class="finish-syncline"><span>${cloud.text} · ${navigator.onLine?'Online':'Offline'}</span><span>${drive.remembered?`Google Drive connected${drive.email?' · '+esc(drive.email):''}`:'Google Drive not connected'}</span></div></div>`;
}

/* Persistent logical position: close Ride Mode intentionally to clear resume. */
const previousOpenRideMode=window.openRideMode,previousCloseRideMode=window.closeRideMode;
window.openRideMode=function(id){S().ui.resumeRideModeId=id;S().ui.resumeRideModeAt=Date.now();persist();return previousOpenRideMode?.apply(this,arguments)};
window.closeRideMode=function(){delete S().ui.resumeRideModeId;delete S().ui.resumeRideModeAt;persist();return previousCloseRideMode?.apply(this,arguments)};
function decorateRideResume(){const id=S().ui?.resumeRideModeId,ride=rideById(id),root=$('#rides');if(!ride||!root||root.querySelector('.resume-ridemode'))return;const target=root.querySelector('.ride-detail-hero');if(!target)return;target.insertAdjacentHTML('beforebegin',`<div class="resume-ridemode"><div><strong>Continue where you left off</strong><small>${esc(ride.name)} · Day ${(ride.selectedDay||0)+1}</small></div><button class="primary" onclick="openRideMode('${ride.id}')">Continue Ride Mode</button></div>`)}

/* Drive UX: connection preference stays remembered until explicit disconnect. */
window.openCloudSetup=()=>{
  const s=window.riderHubDriveStatus?.()||{},cfg=window.riderHubCloudConfig?.()||{};
  const remembered=!!s.remembered,ready=!!s.connected;
  window.openModal?.(`<div class="modalhead"><div><div class="kicker">PRIVATE FILE BACKUP</div><h3>Google Drive</h3><p class="caption">Once connected, Rider Hub remembers your Drive choice until you disconnect it.</p></div><button class="iconbtn" onclick="closeModal()">×</button></div><div class="drive-state ${remembered?'connected':'disconnected'}"><div class="drive-state-icon">${remembered?'✓':'☁'}</div><div><strong>${remembered?'Google Drive connected':'Google Drive not connected'}</strong><p>${remembered?`Connected as ${esc(s.email||'your Google account')}.${ready?' Drive access is ready.':' Access refreshes only when a Drive action needs it.'}`:'Connect Drive to keep private documents available across your devices.'}</p></div></div><div class="drive-paths"><div><span>DOCUMENTS</span><strong>My Drive / Rider Hub / Documents</strong></div><div><span>OWNER MANUALS</span><strong>My Drive / Rider Hub / Owner Manuals</strong></div></div><div class="connection-note">Signing out of Rider Hub or closing the app does not disconnect Drive. Google may occasionally require a quick access refresh for security.${cfg.lastSync?` Last file sync: ${esc(new Date(cfg.lastSync).toLocaleString())}.`:''}</div>${remembered?`<div class="drive-actions"><button class="primary" onclick="syncDriveNow()">${ready?'Sync private files':'Refresh access & sync'}</button><button class="ghost" onclick="confirmDisconnectDrive()">Disconnect Drive</button></div>`:'<button class="primary full" onclick="requestDriveAccess(true,true)">Connect Google Drive</button>'}`);
};
window.syncDriveNow=async()=>{let ok=window.cloudSyncConnected?.();if(!ok&&window.riderHubDriveRemembered?.())ok=await window.riderHubEnsureDriveAccess?.(false);if(!ok)return window.toast?.('Google Drive needs permission');await window.riderHubSyncAllLocalFiles?.();window.toast?.('Private files synced');window.openCloudSetup?.()};
window.confirmDisconnectDrive=()=>window.openModal?.(`<div class="modalhead"><div><div class="kicker">GOOGLE DRIVE</div><h3>Disconnect Drive?</h3></div></div><div class="connection-note">Your files stay in Google Drive. Rider Hub will stop using Drive on this device until you connect it again.</div><div class="modal-actions"><button class="ghost" onclick="closeModal()">Keep connected</button><button class="danger" onclick="disconnectDriveNow()">Disconnect</button></div>`);
window.disconnectDriveNow=()=>{window.disconnectRiderHubCloud?.();window.closeModal?.();setTimeout(renderActiveFinish,0)};

/* One Drive-backed document flow across phone and desktop. */
window.pickPrivateDocument=async id=>{
  if(navigator.onLine&&window.riderHubDriveRemembered?.()&&!window.cloudSyncConnected?.()){
    const ok=await window.riderHubEnsureDriveAccess?.(false);if(!ok)return window.toast?.('Refresh Google Drive access before attaching this file');
  }
  let input=$('#privateDocInputFinish');if(!input){input=document.createElement('input');input.type='file';input.id='privateDocInputFinish';input.hidden=true;document.body.appendChild(input)}
  input.onchange=async()=>{const f=input.files?.[0];if(!f)return;await window.savePrivateDoc?.(id,f);refreshDocumentBadges()};input.value='';input.click();
};
function openBlobFile(file){const url=URL.createObjectURL(file);window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60000)}
window.openPrivateDocument=async id=>{const f=await window.getPrivateDoc?.(id);if(f)return openBlobFile(f);if(window.riderHubDriveRemembered?.())return window.openModal?.(`<div class="modalhead"><div><div class="kicker">GOOGLE DRIVE</div><h3>Open cloud copy</h3><p class="caption">This file is not cached on this device.</p></div><button class="iconbtn" onclick="closeModal()">×</button></div><div class="connection-note">Refresh Drive access once, then Rider Hub will download and cache this document on this device.</div><button class="primary full" onclick="openPrivateDocumentFromDrive('${esc(id)}')">Open from Google Drive</button>`);window.toast?.('No file attached yet')};
window.openPrivateDocumentFromDrive=async id=>{const ok=window.cloudSyncConnected?.()||await window.riderHubEnsureDriveAccess?.(false);if(!ok)return;const f=await window.getPrivateDoc?.(id);if(!f)return window.toast?.('No Drive copy found');window.closeModal?.();openBlobFile(f)};
window.openStoredManual=()=>window.openPrivateDocument?.('owner_manual');
function refreshDocumentBadges(){const drive=window.riderHubDriveRemembered?.();document.querySelectorAll('.doc-state').forEach(el=>{el.textContent=drive?'DRIVE':'LOCAL';el.classList.toggle('drive',!!drive);el.classList.toggle('local',!drive)});document.querySelectorAll('.doc-footnote').forEach(el=>{el.textContent=drive?'Google Drive connected · attached files back up to your Rider Hub folder.':'Files stay on this device until Google Drive is connected.'})}
window.addEventListener('riderhub-drive-state',()=>{refreshDocumentBadges();renderActiveFinish()});

/* Rider Hub Status: useful product health, not a debug screen. */
function healthRow(kind,title,detail,value){return`<div class="health-row"><span class="health-dot ${kind}"></span><div><strong>${esc(title)}</strong><small>${esc(detail)}</small></div><span>${esc(value)}</span></div>`}
window.openRiderHubStatus=()=>{
  const user=window.riderHubFirebaseUser?.(),cloud=window.riderHubCloudState?.()||{},drive=window.riderHubDriveStatus?.()||{},sw=!!navigator.serviceWorker?.controller,online=navigator.onLine;
  const cloudKind=!online?'warn':cloud.state==='synced'?'good':cloud.state==='pending'?'warn':user?'good':'warn';
  const cloudValue=!online?'Saved offline':cloud.state==='syncing'?'Syncing…':cloud.state==='pending'?'Pending sync':cloud.state==='synced'?'Synced':'Saved';
  window.openModal?.(`<div class="modalhead"><div><div class="kicker">RIDER HUB STATUS</div><h3>Everything in one glance</h3><p class="caption">If something feels wrong, this shows which part needs attention.</p></div><button class="iconbtn" onclick="closeModal()">×</button></div><div class="health-list">${healthRow(user?'good':'warn','Account',user?user.email:'Sign in to restore cloud sync',user?'Signed in':'Device only')}${healthRow(cloudKind,'App data',cloud.lastSavedAt?`Last synced ${new Date(cloud.lastSavedAt).toLocaleString()}`:'Saved locally first',cloudValue)}${healthRow(drive.remembered?'good':'warn','Google Drive',drive.remembered?`Connected as ${drive.email||'your Google account'}`:'Optional private-file backup',drive.remembered?'Connected':'Not connected')}${healthRow(drive.remembered?(drive.lastSync?'good':'warn'):'warn','Private files',drive.lastSync?`Last Drive sync ${new Date(drive.lastSync).toLocaleString()}`:'Files remain available on this device when cached',drive.remembered?(drive.lastSync?'Backed up':'Ready to sync'):'Device only')}${healthRow(online?'good':'off','Internet',online?'Online services are available':'Core Rider Hub features keep working',''+(online?'Online':'Offline'))}${healthRow(sw?'good':'warn','Offline cache',sw?'Rider Hub app shell is cached':'Cache is still preparing',sw?'Ready':'Preparing')}</div>`);
};

/* More: fewer cards, clearer status, Install stays prominent. */
function renderMoreFinish(){
  const root=$('#more');if(!root)return;const drive=window.riderHubDriveStatus?.()||{},cloud=syncLabel();
  root.innerHTML=`<div class="finish-more"><section class="more-finish-hero"><div><div class="kicker">MORE</div><h1>Rider Hub</h1><p>Account, private files and the utilities that support the ride.</p></div><button class="primary" onclick="installApp()">Install as App</button></section><div class="finish-more-grid"><button class="finish-more-card" onclick="openAccount()"><b>◉</b><div><span>My Account</span><small>Google account, logout and account controls</small></div></button><button class="finish-more-card ${drive.remembered?'status-good':''}" onclick="openCloudSetup()"><b>☁</b><div><span>Files & Drive</span><small>${drive.remembered?'Google Drive connected':'Connect private-file backup'}</small></div></button><button class="finish-more-card ${cloud.state==='synced'?'status-good':''}" onclick="openRiderHubStatus()"><b>●</b><div><span>Rider Hub Status</span><small>${cloud.text} · ${navigator.onLine?'Online':'Offline'}</small></div></button><button class="finish-more-card" onclick="openEmergency()"><b>SOS</b><div><span>Emergency</span><small>Emergency calling and location sharing</small></div></button><button class="finish-more-card" onclick="openBackup()"><b>⇄</b><div><span>Backup / Import</span><small>Portable app-data backup</small></div></button><button class="finish-more-card" onclick="openAbout()"><b>RH</b><div><span>About Rider Hub</span><small>Creator, socials and feedback</small></div></button></div></div>`;
}
window.renderMore=renderMoreFinish;

/* Unsaved-change guard for real edit forms only. */
const priorOpenModal=window.openModal,priorCloseModal=window.closeModal;let modalDirty=false,guardModal=false;
window.openModal=(html,opt)=>{modalDirty=false;guardModal=/id="(?:edit|gearName|rideNotes|svc|odoInput|newRide|rideDay|task|seg)/i.test(String(html));return priorOpenModal?.(html,opt)};
window.closeModal=()=>{if(guardModal&&modalDirty&&!confirm('Discard unsaved changes?'))return false;modalDirty=false;guardModal=false;return priorCloseModal?.()};
document.addEventListener('input',e=>{if(guardModal&&e.target.closest?.('#modal')&&e.target.matches?.('input,textarea,select'))modalDirty=true},true);
document.addEventListener('change',e=>{if(guardModal&&e.target.closest?.('#modal')&&e.target.matches?.('input,textarea,select'))modalDirty=true},true);
document.addEventListener('click',e=>{const b=e.target.closest?.('#modal button');if(!b)return;const oc=b.getAttribute('onclick')||'';if(/save|add|update|setTaskStatus|togglePacking|delete|pickPrivateDocument/i.test(oc)){modalDirty=false;guardModal=false}},true);
window.addEventListener('beforeunload',e=>{if(guardModal&&modalDirty){e.preventDefault();e.returnValue=''}});
window.addEventListener('popstate',e=>{if(!(guardModal&&modalDirty))return;e.stopImmediatePropagation();history.pushState({...e.state,rh:true,modal:true},'');if(confirm('Discard unsaved changes?')){modalDirty=false;guardModal=false;history.back()}},true);

/* Keep final Home/More applied after legacy rendering and cloud hydration. */
function renderActiveFinish(){const p=S().ui?.page||'home';if(p==='home')renderHomeFinish();if(p==='more')renderMoreFinish();if(p==='rides')setTimeout(decorateRideResume,0);refreshDocumentBadges();updateSaveState()}
const previousSetPage=window.setPage;window.setPage=function(page){const out=previousSetPage?.apply(this,arguments);setTimeout(renderActiveFinish,0);return out};
const previousSave=window.save;window.save=function(){const out=previousSave?.apply(this,arguments);setTimeout(renderActiveFinish,0);return out};
const previousSetUser=window.riderHubSetUser;window.riderHubSetUser=function(){const out=previousSetUser?.apply(this,arguments);setTimeout(renderActiveFinish,0);return out};
const previousAuthReady=window.riderHubAuthReady;window.riderHubAuthReady=function(){const out=previousAuthReady?.apply(this,arguments);setTimeout(renderActiveFinish,0);return out};
updateSaveState();setTimeout(renderActiveFinish,0);
})();
