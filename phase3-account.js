/* Rider Hub account shell, cross-device file recovery and credential-free UI. */
(()=>{
const AUTH='riderhub_auth_session_v1';
const MAP_KEY='riderhub_maps_demo_key';
const DOC_IDS=['vehicle_invoice','vehicle_tax','insurance','licence','service_invoice','hotelBooking'];
const esc2=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cfg=()=>typeof window.riderHubCloudConfig==='function'?window.riderHubCloudConfig():{};
const connected=()=>typeof window.cloudSyncConnected==='function'&&window.cloudSyncConnected();
const linked=()=>!!(cfg().email&&cfg().clientId);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const localDb=()=>new Promise((res,rej)=>{const q=indexedDB.open('riderhub_private_docs',1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('docs'))q.result.createObjectStore('docs')};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
async function localGet(key){const db=await localDb();return new Promise((res,rej)=>{const q=db.transaction('docs').objectStore('docs').get(key);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)})}
async function localPut(key,file){const db=await localDb();return new Promise((res,rej)=>{const tx=db.transaction('docs','readwrite');tx.objectStore('docs').put(file,key);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}

async function waitCloud(timeout=30000){const start=Date.now();while(Date.now()-start<timeout){if(connected())return true;await sleep(250)}return false}
async function ensureCloudAccess(){
 if(connected())return true;
 if(typeof window.requestDriveAccess!=='function')return false;
 try{window.requestDriveAccess(false)}catch{return false}
 return waitCloud();
}

async function syncAllLocalDocs(){
 if(!connected()||typeof window.riderHubUploadDoc!=='function')return 0;
 let count=0;
 for(const id of DOC_IDS){
  try{const f=await localGet(id);if(f){await window.riderHubUploadDoc(id,f);count++}}catch{}
 }
 return count;
}

const originalSyncNow=window.riderHubSyncNow;
if(typeof originalSyncNow==='function'){
 window.riderHubSyncNow=async function(){
  const ok=await ensureCloudAccess();
  if(!ok){if(typeof toast==='function')toast('Google sign-in was not completed');return}
  try{await originalSyncNow();const n=await syncAllLocalDocs();if(typeof toast==='function')toast(n?`Synced Rider Hub + ${n} file${n===1?'':'s'}`:'Rider Hub synced');refreshAccountUi()}catch(e){if(typeof toast==='function')toast('Sync failed · '+String(e?.message||e).slice(0,80))}
 };
}

const cloudSave=window.savePrivateDoc;
const cloudGet=window.getPrivateDoc;
const cloudDelete=window.deletePrivateDoc;
window.attachPrivateDoc=async function(key){
 const f=document.querySelector('#privateDocFile')?.files?.[0];
 if(!f)return toast('Choose a file');
 let cloudOk=connected();
 if(linked()&&!cloudOk)cloudOk=await ensureCloudAccess();
 try{
  if(typeof cloudSave==='function')await cloudSave(key,f);else await localPut(key,f);
  if(key==='hotelBooking'&&window.state?.ride?.backup)state.ride.backup.booking=true;
  if(typeof save==='function')save();
  closeModal();
  toast(cloudOk?'File saved + synced':'File saved locally · sync pending');
 }catch(e){toast('Could not save file · '+String(e?.message||e).slice(0,80))}
};

window.openPrivateDoc=async function(key){
 let f=null;
 try{f=await localGet(key)}catch{}
 if(f){window.open(URL.createObjectURL(f),'_blank');return}
 if(linked()){
  const ok=connected()||await ensureCloudAccess();
  if(ok&&typeof window.riderHubDownloadDoc==='function'){
   try{f=await window.riderHubDownloadDoc(key);if(f){await localPut(key,f);window.open(URL.createObjectURL(f),'_blank');return}}catch(e){toast('Could not load cloud file')}
  }
 }
 if(typeof window.openPrivateDocPicker==='function')window.openPrivateDocPicker(key);
};
window.openBookingPdf=()=>window.openPrivateDoc('hotelBooking');

if(typeof cloudDelete==='function'){
 window.deletePrivateDoc=async function(key){
  try{await cloudDelete(key)}catch{}
  if(!connected()&&linked()){
   const ok=await ensureCloudAccess();
   if(ok&&typeof window.riderHubDeleteDoc==='function')try{await window.riderHubDeleteDoc(key)}catch{}
  }
 };
}

window.openCloudSetup=function(){
 const c=cfg(),label=typeof cloudSyncLabel==='function'?cloudSyncLabel():'Not connected';
 openModal(`<div class="modalhead"><div><div class="kicker">CLOUD SYNC</div><h3>Google Drive sync</h3><p class="caption">Cross-device Rider Hub data and private files.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="routecard"><strong>Status</strong><p>${esc2(label)}${c.lastSync?' · Last sync '+new Date(c.lastSync).toLocaleString():''}</p></div><div class="rh-service-grid"><div class="rh-service-card"><strong>App data</strong><p>Ride progress, bike data, expenses and settings.</p></div><div class="rh-service-card"><strong>Private files</strong><p>Documents and hotel booking attachments.</p></div></div><div class="grid2" style="margin-top:12px"><button class="secondary" onclick="riderHubSyncNow()">Sync now</button><button class="primary" onclick="requestDriveAccess(true)">${connected()?'Refresh session':'Connect Google'}</button></div>${linked()?'<button class="secondary full" style="margin-top:8px" onclick="disconnectRiderHubCloud();setTimeout(openCloudSetup,150)">Disconnect cloud</button>':''}`)
};

window.openStorageInfo=function(){const label=typeof cloudSyncLabel==='function'?cloudSyncLabel():'Not connected';openModal(`<div class="modalhead"><div><div class="kicker">FILES & STORAGE</div><h3>Your files</h3><p class="caption">Local-first with Google Drive cross-device sync.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="routecard"><strong>Supported files</strong><p>PDF · JPG/JPEG · PNG · WEBP · HEIC/HEIF · TIFF · GIF · BMP · DOC/DOCX · ODT · RTF · TXT</p></div><div class="routecard"><strong>Cross-device</strong><p>${esc2(label)}</p></div><button class="primary full" onclick="riderHubSyncNow()">Sync files now</button>`)};

const oldTraffic=window.checkDemoTraffic;
window.openMapsDemoSetup=function(){
 const trafficReady=!!localStorage.getItem(MAP_KEY)||!!localStorage.getItem('rh_traffic_key');
 openModal(`<div class="modalhead"><div><div class="kicker">WEATHER & MAPS</div><h3>Connection status</h3><p class="caption">Credentials are not shown inside Rider Hub.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="rh-service-grid"><div class="rh-service-card"><strong>Live weather</strong><p>Ready · automatic weather feed.</p></div><div class="rh-service-card"><strong>Traffic + route ETA</strong><p>${trafficReady?'Configured on this device.':'Provider connection not available on this device.'}</p></div></div><button class="primary full" style="margin-top:12px" onclick="closeModal();setTimeout(()=>renderWeather(true),120)">Refresh weather</button>`)
};

function weatherText(code){const m={0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Cloudy',45:'Fog',48:'Fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',80:'Rain showers',81:'Rain showers',82:'Heavy showers',95:'Thunderstorm',96:'Thunderstorm',99:'Severe thunderstorm'};return m[code]||'Conditions available'}
window.renderWeather=async function(force=false){
 const el=document.querySelector('#weatherCard');if(!el)return;
 el.innerHTML=`<div class="weather-top"><div><div class="kicker">LIVE WEATHER</div><strong>${force?'Refreshing…':'Loading…'}</strong></div></div>`;
 try{
  const url='https://api.open-meteo.com/v1/forecast?latitude=23.5461&longitude=74.4347&current=temperature_2m,weather_code,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=Asia%2FKolkata&forecast_days=16';
  const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('Weather service unavailable');const j=await r.json();
  const d=typeof currentDay==='function'?currentDay():null,idx=d?j.daily?.time?.indexOf(d.date):-1;
  const rain=idx>=0?j.daily.precipitation_probability_max?.[idx]:null,max=idx>=0?j.daily.temperature_2m_max?.[idx]:null,min=idx>=0?j.daily.temperature_2m_min?.[idx]:null,temp=j.current?.temperature_2m,desc=weatherText(j.current?.weather_code);
  el.innerHTML=`<div class="weather-top"><div><div class="kicker">LIVE WEATHER</div><div class="weather-big">${temp==null?'—':Math.round(temp)+'°C'}</div><div class="weather-status">Banswara · ${esc2(desc)} · updated ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div></div><button class="secondary" onclick="renderWeather(true)">Refresh</button></div><div class="grid3" style="margin-top:10px"><div class="tile"><label>${d?'DAY '+d.day+' ':''}RAIN RISK</label><b>${rain==null?'—':rain+'%'}</b></div><div class="tile"><label>EXPECTED HIGH</label><b>${max==null?'—':Math.round(max)+'°'}</b></div><div class="tile"><label>EXPECTED LOW</label><b>${min==null?'—':Math.round(min)+'°'}</b></div></div>${rain!=null&&rain>=60?'<div class="alert red">High rain probability. Re-check road conditions before departure.</div>':'<div class="alert">Forecasts change. Refresh again before departure.</div>'}`;
 }catch(e){el.innerHTML=`<div class="weather-top"><div><div class="kicker">LIVE WEATHER</div><strong>Weather unavailable</strong><div class="caption">Try again when online.</div></div><button class="secondary" onclick="renderWeather(true)">Retry</button></div>`}
};

window.openTraffic=function(){
 const ready=!!localStorage.getItem(MAP_KEY)||!!localStorage.getItem('rh_traffic_key');
 if(!ready)return openModal(`<div class="modalhead"><div><div class="kicker">TRAFFIC</div><h3>Live traffic unavailable</h3><p class="caption">Rider Hub will not invent live congestion data.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="alert">A server-side traffic provider is not connected on this device yet. Weather and route planning still work.</div>`);
 const d=currentDay(),parts=d.segments.filter(s=>!s.backup);
 openModal(`<div class="modalhead"><div><div class="kicker">TRAFFIC + ETA</div><h3>Current route</h3><p class="caption">Traffic-aware timing when the provider returns it.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="field"><label>ROUTE PART</label><select id="trafficPart">${parts.map((s,i)=>`<option value="${i}">${esc2(s.label)}</option>`).join('')}</select></div><button class="primary full" onclick="checkDemoTraffic()">Check route now</button><div id="trafficDemoResult" class="alert">Ready.</div>`)
};
if(oldTraffic)window.checkDemoTraffic=oldTraffic;

function setAuth(on){if(on)localStorage.setItem(AUTH,JSON.stringify({at:new Date().toISOString(),provider:'google'}));else localStorage.removeItem(AUTH)}
function isAuth(){if(localStorage.getItem(AUTH))return true;if(cfg().email){setAuth(true);return true}return false}
function shell(){let el=document.querySelector('#rhAuthShell');if(el)return el;el=document.createElement('div');el.id='rhAuthShell';el.className='rh-auth-shell';el.innerHTML='<div class="rh-auth-inner"><div class="rh-auth-brand"><div class="rh-auth-mark">RH</div><div><strong>RIDER HUB</strong><small>TVS RONIN · CHARCOAL EMBER</small></div></div><div id="rhAuthStage" class="rh-auth-stage"></div></div>';document.body.appendChild(el);return el}
const slides=[
 {k:'YOUR MOTORCYCLE OS',h:'Everything around your Ronin, in one place.',p:'Bike information, odometer, maintenance, service history, gear and private documents stay organised without turning the app into a generic dashboard.',f:[['Bike + maintenance','Service intervals, chain care and ownership history.'],['Documents','Invoices, insurance, licence and booking files.']]},
 {k:'RIDE MODE',h:'Plan less while riding. Miss less when tired.',p:'Day plans, current task, ride progress, emergency tools, notes, packing, traffic and ride summaries are designed to stay useful on the road.',f:[['Ride progress','Done, delay and skip with day-by-day tracking.'],['End-of-day review','Catch missed ride tasks before the day is over.']]},
 {k:'CROSS-DEVICE',h:'Your phone and PC should see the same Rider Hub.',p:'Google Drive sync keeps app state and private attachments available across devices while the core app remains local-first.',f:[['Private cloud files','Attachments are stored in your own Google Drive app data.'],['Offline core','Your local copy remains usable when the network disappears.']]},
 {k:'CHARCOAL EMBER',h:'Built as a personal motorcycle system, not a social feed.',p:'Rider Hub keeps the focus on the bike, the ride and the information you actually need before, during and after a trip.',f:[['Focused UI','Charcoal, graphite and restrained ember accents.'],['Expandable later','Account and data architecture can grow beyond one rider.']]}
];
let slide=0;
function showSlide(i=0){slide=Math.max(0,Math.min(slides.length-1,i));const s=slides[slide],stage=shell().querySelector('#rhAuthStage');stage.innerHTML=`<div class="rh-slide-kicker">${s.k}</div><h1>${s.h}</h1><p>${s.p}</p><div class="rh-auth-features">${s.f.map(x=>`<div class="rh-auth-feature"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div><div class="rh-auth-dots">${slides.map((_,n)=>`<i class="rh-auth-dot ${n===slide?'active':''}"></i>`).join('')}</div><div class="rh-auth-actions">${slide?'<button onclick="rhAuthBack()">Back</button>':''}<button class="primary" onclick="rhAuthNext()">${slide===slides.length-1?'Continue':'Next'}</button></div>`}
window.rhAuthBack=()=>showSlide(slide-1);
window.rhAuthNext=()=>slide===slides.length-1?showLogin():showSlide(slide+1);
function showLogin(){const stage=shell().querySelector('#rhAuthStage');stage.innerHTML=`<div class="rh-auth-login"><div class="rh-slide-kicker">MY ACCOUNT</div><h2>Sign in to Rider Hub</h2><p>Use Google for working cross-device sync today.</p><div class="rh-auth-form"><button class="rh-auth-button primary full" onclick="rhLoginGoogle()">Continue with Google</button><div class="rh-auth-divider">or</div><label>EMAIL</label><input id="rhEmail" type="email" placeholder="you@example.com"><label>PASSWORD</label><input id="rhPassword" type="password" placeholder="Password"><button class="rh-auth-button full" onclick="rhEmailAuthInfo()">Login with email</button><button class="rh-auth-button full" onclick="rhEmailAuthInfo()">Create account with email</button><div id="rhAuthNote" class="rh-auth-note">Email/password accounts need a real server-backed authentication service. Rider Hub will not store passwords insecurely in browser code.</div></div></div>`}
window.rhEmailAuthInfo=()=>{const n=document.querySelector('#rhAuthNote');if(n){n.className='rh-auth-note warn';n.textContent='Email login is not enabled yet because the current GitHub Pages build has no secure authentication backend. Google login is fully functional now.'}};
window.rhLoginGoogle=async()=>{const n=document.querySelector('#rhAuthNote');if(n){n.className='rh-auth-note';n.textContent='Opening Google sign-in…'}const ok=await ensureCloudAccess();if(ok){setAuth(true);shell().classList.remove('active');if(n)n.textContent='Connected';refreshAccountUi();toast('Signed in to Rider Hub')}else if(n){n.className='rh-auth-note warn';n.textContent='Google sign-in was not completed. Try again.'}};
window.logoutRiderHub=function(){setAuth(false);try{if(typeof window.disconnectRiderHubCloud==='function')window.disconnectRiderHubCloud()}catch{}closeModal();showSlide(0);shell().classList.add('active')};

window.openMyAccount=function(){const c=cfg(),label=typeof cloudSyncLabel==='function'?cloudSyncLabel():'Not connected';openModal(`<div class="modalhead"><div><div class="kicker">MY ACCOUNT</div><h3>${esc2(c.name||'Rider Hub')}</h3><p class="caption">${esc2(c.email||'Not signed in')}</p></div><button class="round" onclick="closeModal()">×</button></div><div class="routecard"><strong>Cloud sync</strong><p>${esc2(label)}${c.lastSync?' · Last sync '+new Date(c.lastSync).toLocaleString():''}</p></div><div class="grid2"><button class="secondary" onclick="riderHubSyncNow()">Sync now</button><button class="primary" onclick="requestDriveAccess(true)">${connected()?'Refresh Google session':'Connect Google'}</button></div><button class="secondary full rh-logout" onclick="logoutRiderHub()">Log out</button>`)};

const oldRenderMore=window.renderMore;
window.renderMore=function(){
 const sync=typeof cloudSyncLabel==='function'?cloudSyncLabel():'Not connected';
 const el=document.querySelector('#more');if(!el){if(oldRenderMore)oldRenderMore();return}
 el.innerHTML=`<div class="card more-hero"><div class="kicker">MORE</div><h1>Rider Hub</h1><p>Account, app controls and utilities.</p></div><div class="more-grid"><button class="more-card" onclick="openMyAccount()"><b>◉</b><span><strong>My Account</strong><small>${esc2(sync)}</small></span></button><button class="more-card" onclick="openInstallApp()"><b>↓</b><span><strong>Install Rider Hub</strong><small>Add to your phone or desktop</small></span></button><button class="more-card" onclick="openNotifications()"><b>!</b><span><strong>Notifications</strong><small>Ride and maintenance reminders</small></span></button><button class="more-card" onclick="openMapsDemoSetup()"><b>⌖</b><span><strong>Weather & Maps</strong><small>Status and route services</small></span></button><button class="more-card" onclick="openTransfer()"><b>⇄</b><span><strong>Backup / Import</strong><small>Export or restore Rider Hub data</small></span></button><button class="more-card" onclick="openEmergency()"><b>SOS</b><span><strong>Emergency contacts</strong><small>112, 108 and custom contacts</small></span></button><button class="more-card" onclick="openStorageInfo()"><b>▤</b><span><strong>Files & storage</strong><small>Documents and cross-device sync</small></span></button><button class="more-card" onclick="openAppSettings()"><b>⚙</b><span><strong>App settings</strong><small>Preferences and permissions</small></span></button><button class="more-card" onclick="openAboutRiderHub()"><b>RH</b><span><strong>About Rider Hub</strong><small>Charcoal Ember · Phase 3</small></span></button><button class="more-card" onclick="logoutRiderHub()"><b>↪</b><span><strong>Log out</strong><small>Return to Rider Hub welcome</small></span></button></div>`
};

function refreshAccountUi(){if(window.state?.ui?.page==='more'&&typeof window.renderMore==='function')window.renderMore()}

setTimeout(()=>{
 if(isAuth())shell().classList.remove('active');else{showSlide(0);shell().classList.add('active')}
 if(window.state?.ui?.page==='more')window.renderMore();
},100);
})();