/* Rider Hub approved UX/personalisation changes.
   This layer intentionally avoids global DOM MutationObservers and automatic reloads.
   It patches stable public functions once, then reacts only to explicit Rider Hub events. */
(()=>{
'use strict';
const AUTH_KEY='riderhub_auth_session_v1';
const CANONICAL_HOST='rider-hub-506306.firebaseapp.com';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BELL='<svg class="rh-bell-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>';
const publicUser=()=>!!window.state?.profile?.publicUser;
const bikeConfigured=()=>!!window.state?.profile?.bikeConfigured;
const firebaseUser=()=>typeof window.riderHubFirebaseUser==='function'?window.riderHubFirebaseUser():null;
const signedIn=()=>!!firebaseUser();

/* Do not treat the built-in legacy starter workspace as migratable cloud data on
   Firebase Hosting. Once a Firebase account is activated, exports work normally. */
const rawExport=window.riderHubExportState;
if(typeof rawExport==='function'){
  window.riderHubExportState=function(){
    if(location.hostname===CANONICAL_HOST&&!publicUser())return null;
    return rawExport.apply(this,arguments);
  };
}

function setAuthBrandGeneric(){
  const small=document.querySelector('#rhAuthShell .rh-auth-brand small');
  if(small)small.textContent='MOTORCYCLE OS';
}
function applyMainBrand(){
  const name=document.querySelector('.header .brandname'),sub=document.querySelector('.header .brand .sub');
  if(!name||!sub)return;
  if(!signedIn()||!bikeConfigured()){
    name.textContent='RIDER HUB';sub.textContent='MOTORCYCLE OS';document.title='Rider Hub';return;
  }
  const b=window.state?.bike||{};
  name.textContent=b.name||[b.manufacturer,b.model].filter(Boolean).join(' ')||'Rider Hub';
  sub.textContent=[b.variant,b.colour].filter(Boolean).join(' · ').toUpperCase()||'MY MOTORCYCLE';
  document.title=`Rider Hub — ${b.name||b.model||'Motorcycle'}`;
}
function patchNotificationIcons(root=document){
  root.querySelectorAll?.('button[title="Notifications"]').forEach(btn=>{btn.innerHTML=BELL;btn.setAttribute('aria-label','Notifications')});
  root.querySelectorAll?.('.quick').forEach(btn=>{if(/alerts/i.test(btn.textContent||'')){const icon=btn.querySelector('b');if(icon)icon.innerHTML=BELL}});
}
function removePrivateWorkspace(){
  const root=document.querySelector('#home');if(!root)return;
  const card=[...root.querySelectorAll('.card')].find(x=>/private workspace/i.test(x.textContent||''));
  if(card){const prev=card.previousElementSibling;if(prev?.classList.contains('section-head'))prev.remove();card.remove()}
}
function removeTopAddRide(){document.querySelector('#rides .ride-list-head .add-ride-btn')?.remove()}
function postUi(){setAuthBrandGeneric();applyMainBrand();patchNotificationIcons();removePrivateWorkspace();removeTopAddRide();enhanceBikePage()}

/* Patch render entry points without calling render recursively. */
const originalRender=window.render;
if(typeof originalRender==='function')window.render=function(){const out=originalRender.apply(this,arguments);postUi();return out};
const originalHome=window.renderHome;
if(typeof originalHome==='function')window.renderHome=function(){const out=originalHome.apply(this,arguments);removePrivateWorkspace();patchNotificationIcons(document.querySelector('#home')||document);applyMainBrand();return out};
const originalBike=window.renderBike;
if(typeof originalBike==='function')window.renderBike=function(){const out=originalBike.apply(this,arguments);enhanceBikePage();applyMainBrand();return out};
const originalRides=window.renderRides;
if(typeof originalRides==='function')window.renderRides=function(){const out=originalRides.apply(this,arguments);removeTopAddRide();return out};

/* ---------- Approved onboarding: exactly three manual slides, then Google. ---------- */
const WELCOME=[
  {k:'YOUR MOTORCYCLE OS',h:'Everything around your motorcycle, in one place.',p:'Keep your bike information, maintenance, service history, gear and private documents organised around the motorcycle you actually ride.',f:[['Your bike','A workspace that adapts to your motorcycle.'],['Ownership','Odometer, service history and documents stay together.']]},
  {k:'RIDE MODE',h:'Plan less while riding. Miss less when tired.',p:'Ride plans, progress, emergency tools, notes and packing stay easy to reach when you are on the road.',f:[['Ride progress','Track what is done, delayed or skipped.'],['Road-ready','Keep the important controls close during a ride.']]},
  {k:'RIDER HUB',h:'Your bike and rides can follow you across devices.',p:'Sign in to keep your Rider Hub available across your devices while the core experience remains local-first.',f:[['Private account','Your workspace belongs to your account.'],['Offline core','Your local copy remains useful when the network disappears.']]}
];
let welcomeIndex=0;
let authMode='welcome';
function authShell(){return document.querySelector('#rhAuthShell')}
function showWelcome(i=0){
  const shell=authShell();if(!shell)return;authMode='welcome';welcomeIndex=Math.max(0,Math.min(WELCOME.length-1,i));setAuthBrandGeneric();shell.classList.add('active');
  const s=WELCOME[welcomeIndex],stage=shell.querySelector('#rhAuthStage');if(!stage)return;
  stage.innerHTML=`<div class="rh-slide-kicker">${s.k}</div><h1>${s.h}</h1><p>${s.p}</p><div class="rh-auth-features">${s.f.map(x=>`<div class="rh-auth-feature"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div><div class="rh-auth-dots">${WELCOME.map((_,n)=>`<i class="rh-auth-dot ${n===welcomeIndex?'active':''}"></i>`).join('')}</div><div class="rh-auth-actions">${welcomeIndex?'<button onclick="rhApprovedWelcomeBack()">Back</button>':''}<button class="primary" onclick="rhApprovedWelcomeNext()">${welcomeIndex===WELCOME.length-1?'Continue':'Next'}</button></div>`;
}
function showGoogleLogin(){
  const shell=authShell();if(!shell)return;authMode='login';setAuthBrandGeneric();shell.classList.add('active');const stage=shell.querySelector('#rhAuthStage');if(!stage)return;
  stage.innerHTML=`<div class="rh-auth-login"><div class="rh-slide-kicker">MY ACCOUNT</div><h2>Sign in to Rider Hub</h2><p>Use your Google account to keep your Rider Hub available across your devices.</p><div class="rh-auth-form"><button id="rhGoogleFirebaseLogin" class="rh-auth-button primary full" onclick="rhLoginGoogle()">Continue with Google</button><div id="rhAuthNote" class="rh-auth-note" hidden></div></div></div>`;
}
window.rhApprovedWelcomeBack=()=>showWelcome(welcomeIndex-1);
window.rhApprovedWelcomeNext=()=>welcomeIndex===WELCOME.length-1?showGoogleLogin():showWelcome(welcomeIndex+1);
window.rhAuthShowWelcome=()=>showWelcome(0);
window.rhAuthShowLogin=showGoogleLogin;

/* ---------- Motorcycle setup and catalog ---------- */
let bikeDraft=null;
let bikeModels=[];
const curatedMakes=()=>window.RIDER_HUB_MOTORCYCLE_CATALOG?.curatedMakes||[];
const curatedModels=make=>window.RIDER_HUB_MOTORCYCLE_CATALOG?.curatedModels?.[make]||[];
const profileFor=(make,model)=>typeof window.riderHubMotorcycleProfile==='function'?window.riderHubMotorcycleProfile(make,model):null;
const nextService=(entry,odo)=>typeof window.riderHubNextServiceKm==='function'?window.riderHubNextServiceKm(entry,odo):0;
function optList(items,selected,placeholder){return `<option value="">${placeholder}</option>${items.map(v=>`<option value="${esc(v)}" ${String(v)===String(selected)?'selected':''}>${esc(v)}</option>`).join('')}`}
function currentBikeDraft(){const b=window.state?.bike||{};return{make:b.manufacturer||'',model:b.model||'',variant:b.variant||'',colour:b.colour||'',year:Number(b.year||new Date().getFullYear()),odo:Number(b.odo||0),customMake:'',customModel:''}}
function actualMake(){const v=document.querySelector('#rhBikeMake')?.value||bikeDraft?.make||'';return v==='__other__'?(document.querySelector('#rhBikeMakeCustom')?.value||bikeDraft?.customMake||'').trim():v}
function actualModel(){const v=document.querySelector('#rhBikeModel')?.value||bikeDraft?.model||'';return v==='__other__'?(document.querySelector('#rhBikeModelCustom')?.value||bikeDraft?.customModel||'').trim():v}
function captureBikeDraft(){
  if(!bikeDraft)bikeDraft=currentBikeDraft();
  const makeSelect=document.querySelector('#rhBikeMake')?.value;if(makeSelect){if(makeSelect==='__other__')bikeDraft.customMake=document.querySelector('#rhBikeMakeCustom')?.value||bikeDraft.customMake;else bikeDraft.make=makeSelect}
  const modelSelect=document.querySelector('#rhBikeModel')?.value;if(modelSelect){if(modelSelect==='__other__')bikeDraft.customModel=document.querySelector('#rhBikeModelCustom')?.value||bikeDraft.customModel;else bikeDraft.model=modelSelect}
  const variant=document.querySelector('#rhBikeVariant');if(variant)bikeDraft.variant=variant.value||'';
  const colour=document.querySelector('#rhBikeColour');if(colour)bikeDraft.colour=colour.value||'';
  const year=document.querySelector('#rhBikeYear');if(year)bikeDraft.year=year.value||bikeDraft.year;
  const odo=document.querySelector('#rhBikeOdo');if(odo)bikeDraft.odo=odo.value||0;
}
function setupForm(gate=false){
  const d=bikeDraft||currentBikeDraft(),make=d.make||'',model=d.model||'',entry=profileFor(make,model),variants=entry?Object.keys(entry.variants||{}):[],colours=entry?.variants?.[d.variant]||[];
  const makes=[...new Set([...curatedMakes(),make].filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const models=[...new Set([...(bikeModels.length?bikeModels:curatedModels(make)),model].filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const makeOther=!make&&d.customMake;const modelOther=!model&&d.customModel;
  return `<div class="rh-bike-setup ${gate?'gate':''}"><div class="rh-slide-kicker">${gate?'ONE-TIME SETUP':'MY MOTORCYCLE'}</div><h2>${gate?'Set up your motorcycle':'Edit motorcycle'}</h2><p>Choose the motorcycle you ride. Rider Hub fills verified specifications, maintenance guidance and manual links when a verified model profile is available.</p><div class="rh-bike-setup-grid"><div class="field"><label>MANUFACTURER</label><select id="rhBikeMake" onchange="rhBikeSetupChanged('make')">${optList(makes,make,'Select manufacturer')}<option value="__other__" ${makeOther?'selected':''}>Other / not listed</option></select>${makeOther?`<input id="rhBikeMakeCustom" value="${esc(d.customMake)}" placeholder="Manufacturer" style="margin-top:8px">`:''}</div><div class="field"><label>MODEL</label><select id="rhBikeModel" onchange="rhBikeSetupChanged('model')">${optList(models,model,make?'Select model':'Choose manufacturer first')}<option value="__other__" ${modelOther?'selected':''}>Other / not listed</option></select>${modelOther?`<input id="rhBikeModelCustom" value="${esc(d.customModel)}" placeholder="Motorcycle model" style="margin-top:8px">`:''}</div><div class="field"><label>VARIANT</label>${variants.length?`<select id="rhBikeVariant" onchange="rhBikeSetupChanged('variant')">${optList(variants,d.variant,'Select variant')}</select>`:`<input id="rhBikeVariant" value="${esc(d.variant)}" placeholder="Variant">`}</div><div class="field"><label>COLOUR</label>${colours.length?`<select id="rhBikeColour">${optList(colours,d.colour,'Select colour')}</select>`:`<input id="rhBikeColour" value="${esc(d.colour)}" placeholder="Colour">`}</div><div class="field"><label>YEAR</label><input id="rhBikeYear" inputmode="numeric" value="${esc(d.year)}"></div><div class="field"><label>ODOMETER KM</label><input id="rhBikeOdo" inputmode="numeric" value="${esc(d.odo)}"></div></div><div class="rh-bike-profile-hint">${entry?'Verified Rider Hub profile found — specifications, service guidance and manual source will be applied automatically.':'Global make/model lookup is available. For motorcycles without a verified detailed profile, variant, colour and technical fields remain editable rather than being guessed.'}<div class="rh-catalog-source">Global make/model discovery uses the NHTSA vPIC motorcycle catalog when online, plus Rider Hub curated data.</div></div><div class="rh-auth-actions">${gate?'':'<button onclick="closeModal();rhCancelBikeSetup()">Cancel</button>'}<button class="primary" onclick="rhSaveApprovedBike(${gate?'true':'false'})">Save motorcycle</button></div></div>`;
}
function renderSetupHost(gate=false){const host=document.querySelector('#rhBikeSetupHost');if(host)host.innerHTML=setupForm(gate)}
async function loadModels(make,gate=false){
  bikeModels=curatedModels(make).slice();renderSetupHost(gate);
  if(make&&typeof window.riderHubMotorcycleModels==='function'){
    try{bikeModels=await window.riderHubMotorcycleModels(make);renderSetupHost(gate)}catch{}
  }
}
async function loadMakes(){
  if(typeof window.riderHubMotorcycleMakes!=='function')return;
  try{
    const all=await window.riderHubMotorcycleMakes(),sel=document.querySelector('#rhBikeMake');if(!sel||!all.length)return;
    const chosen=sel.value,html=optList(all,chosen,'Select manufacturer')+`<option value="__other__" ${chosen==='__other__'?'selected':''}>Other / not listed</option>`;sel.innerHTML=html;
  }catch{}
}
window.rhBikeSetupChanged=async function(level){
  captureBikeDraft();const gate=authMode==='setup';
  if(level==='make'){
    const selected=document.querySelector('#rhBikeMake')?.value||'';
    if(selected==='__other__'){bikeDraft.make='';bikeDraft.model='';bikeDraft.variant='';bikeDraft.colour='';bikeModels=[];renderSetupHost(gate);return}
    bikeDraft.make=selected;bikeDraft.model='';bikeDraft.customModel='';bikeDraft.variant='';bikeDraft.colour='';await loadModels(selected,gate);return;
  }
  if(level==='model'){
    const selected=document.querySelector('#rhBikeModel')?.value||'';
    if(selected==='__other__'){bikeDraft.model='';bikeDraft.variant='';bikeDraft.colour=''}else bikeDraft.model=selected;
    bikeDraft.variant='';bikeDraft.colour='';renderSetupHost(gate);return;
  }
  if(level==='variant'){bikeDraft.variant=document.querySelector('#rhBikeVariant')?.value||'';bikeDraft.colour='';renderSetupHost(gate)}
};
window.rhCancelBikeSetup=()=>{bikeDraft=null;bikeModels=[]};
function openBikeSetup(gate=false){
  bikeDraft=currentBikeDraft();bikeModels=curatedModels(bikeDraft.make).slice();
  if(gate){authMode='setup';const shell=authShell();if(!shell)return;setAuthBrandGeneric();shell.classList.add('active');const stage=shell.querySelector('#rhAuthStage');if(stage)stage.innerHTML=`<div id="rhBikeSetupHost">${setupForm(true)}</div>`}
  else if(typeof window.openModal==='function')window.openModal(`<div class="modalhead"><div><div class="kicker">MY MOTORCYCLE</div><h3>Motorcycle setup</h3></div><button class="round" onclick="closeModal();rhCancelBikeSetup()">×</button></div><div id="rhBikeSetupHost">${setupForm(false)}</div>`);
  setTimeout(()=>{loadMakes();if(bikeDraft.make)loadModels(bikeDraft.make,gate)},0);
}
window.openPublicBikeSetup=()=>openBikeSetup(false);
window.rhSaveApprovedBike=function(gate=false){
  captureBikeDraft();const make=actualMake()||bikeDraft?.customMake||bikeDraft?.make||'',model=actualModel()||bikeDraft?.customModel||bikeDraft?.model||'';
  if(!make||!model){if(typeof window.toast==='function')window.toast('Choose manufacturer and model');return}
  const variant=(document.querySelector('#rhBikeVariant')?.value||bikeDraft?.variant||'').trim(),colour=(document.querySelector('#rhBikeColour')?.value||bikeDraft?.colour||'').trim();
  const year=Math.max(1900,Math.min(2100,Math.round(Number(document.querySelector('#rhBikeYear')?.value||bikeDraft?.year||new Date().getFullYear()))));
  const odo=Math.max(0,Math.round(Number(document.querySelector('#rhBikeOdo')?.value||bikeDraft?.odo||0))),entry=profileFor(make,model),spec=entry?.specs||{};
  if(typeof window.snapshot==='function')window.snapshot('bike setup');
  const old=window.state?.bike||{};
  window.state.bike={...old,name:`${make} ${model}`,manufacturer:make,model,variant,colour,year,odo,trim:[variant,colour,year].filter(Boolean).join(' • '),purchase:old.purchase||'Not added',engine:spec.engine||old.engine||'Not added',braking:entry?.brakingByVariant?.[variant]||old.braking||'Not added',transmission:spec.transmission||old.transmission||'Not added',fuelTank:spec.fuelTank||old.fuelTank||'Not added',tyres:entry?.tyresByVariant?.[variant]||spec.tyres||old.tyres||'Not added',manualUrl:entry?.manualUrl||old.manualUrl||'',maintenanceSummary:entry?.serviceSummary||old.maintenanceSummary||'',chainIntervalKm:entry?.chainIntervalKm||old.chainIntervalKm||0,nextServiceKm:entry?nextService(entry,odo):Number(old.nextServiceKm||0),nextServiceDate:entry?'See owner manual':(old.nextServiceDate||'Not added'),serviceHistory:Array.isArray(old.serviceHistory)?old.serviceHistory:[]};
  window.state.profile=window.state.profile||{};window.state.profile.bikeConfigured=true;
  if(typeof window.save==='function')window.save();bikeDraft=null;bikeModels=[];if(!gate&&typeof window.closeModal==='function')window.closeModal();authShell()?.classList.remove('active');
  if(typeof window.render==='function')window.render();applyMainBrand();if(typeof window.toast==='function')window.toast('Motorcycle saved');
};
function enhanceBikePage(){
  if(!publicUser()||!bikeConfigured())return;const root=document.querySelector('#bike');if(!root||root.querySelector('.rh-bike-manual-card'))return;const b=window.state?.bike||{},entry=profileFor(b.manufacturer,b.model);if(!entry)return;
  const box=document.createElement('div');box.className='rh-bike-manual-card';box.innerHTML=`<div class="section-head"><div><div class="kicker">MANUFACTURER DATA</div><h2>Manual + service guidance</h2></div></div><div class="card list"><div class="listrow"><div class="ico">▤</div><div><strong>Owner's manual</strong><p>Official ${esc(b.manufacturer)} source for ${esc(b.model)}.</p></div><button class="secondary" onclick="riderHubOpenBikeManual()">Open</button></div><div class="listrow"><div class="ico">🔧</div><div><strong>Service guidance</strong><p>${esc(entry.serviceSummary)}</p></div><span class="pill good">AUTO</span></div></div>`;
  const docs=[...root.querySelectorAll('.section-head')].find(x=>/documents/i.test(x.textContent||''));if(docs)docs.before(box);else root.appendChild(box);
}
window.riderHubOpenBikeManual=function(){const url=window.state?.bike?.manualUrl;if(url)window.open(url,'_blank','noopener');else if(typeof window.toast==='function')window.toast('A verified manual link is not available for this model yet')};
function maybeRequireBikeSetup(){if(firebaseUser()&&publicUser()&&!bikeConfigured()){openBikeSetup(true);return true}return false}
window.riderHubRequireBikeSetup=()=>openBikeSetup(true);

/* ---------- Gear: restore the full garage/inventory presentation. ---------- */
let gearStatus='all',gearOwner='all',gearQuery='';
const gearMoney=n=>n==null||n===''?'PRICE TBD':'₹'+Math.round(Number(n)||0).toLocaleString('en-IN');
const mine=x=>!['Mom','Bike / Shared'].includes(String(x?.owner||''));
const gearIcon=cat=>cat==='Riding Gear'?'◒':cat==='Luggage'?'▣':cat==='Electronics'?'◉':cat==='Camera & Mounts'?'◎':'◇';
window.rhGearSetStatus=v=>{gearStatus=v;window.renderGear()};window.rhGearSetOwner=v=>{gearOwner=v;window.renderGear()};window.rhGearSearch=v=>{gearQuery=v;window.renderGear()};
window.renderGear=function(){
  const root=document.querySelector('#gear');if(!root)return;const g=Array.isArray(window.state?.gear)?window.state.gear:[],owned=g.filter(x=>x.status==='owned'),planned=g.filter(x=>x.status==='planned');
  const spend=owned.reduce((a,x)=>a+(Number(x.amount)||0),0),budget=planned.reduce((a,x)=>a+(Number(x.amount)||0),0),q=gearQuery.trim().toLowerCase();
  const items=g.filter(x=>(gearStatus==='all'||x.status===gearStatus)&&(gearOwner==='all'||(gearOwner==='mine'?mine(x):x.owner===gearOwner))&&(!q||`${x.name} ${x.category} ${x.owner} ${x.note||''}`.toLowerCase().includes(q)));
  const preferred=['Riding Gear','Luggage','Electronics','Bike Accessories','Camera & Mounts','Cleaning & Care'];const cats=[...preferred,...items.map(x=>x.category||'Gear').filter(x=>!preferred.includes(x))].filter((x,i,a)=>a.indexOf(x)===i);
  root.innerHTML=`<div class="card gear-hero"><div class="kicker">GEAR GARAGE</div><h1>Your riding inventory</h1><p>Owned gear, planned purchases, bike setup, luggage, electronics and care items — all in one editable garage.</p><div class="gear-summary"><div class="sum"><label>OWNED</label><b>${owned.length}</b><small>products in garage</small></div><div class="sum"><label>WILL BUY</label><b>${planned.length}</b><small>planned products</small></div><div class="sum"><label>KNOWN SPEND</label><b>₹${Math.round(spend).toLocaleString('en-IN')}</b><small>excludes unknown prices</small></div><div class="sum"><label>PLANNED BUDGET</label><b>₹${Math.round(budget).toLocaleString('en-IN')}</b><small>known expected prices</small></div></div></div><div class="rh-gear-toolbar-final"><div class="gear-search"><span class="search-symbol">⌕</span><input placeholder="Search helmet, luggage, Mom…" value="${esc(gearQuery)}" oninput="rhGearSearch(this.value)"></div><div class="gear-tabs"><button class="chip ${gearStatus==='all'?'active':''}" onclick="rhGearSetStatus('all')">ALL</button><button class="chip ${gearStatus==='owned'?'active':''}" onclick="rhGearSetStatus('owned')">BOUGHT</button><button class="chip ${gearStatus==='planned'?'active':''}" onclick="rhGearSetStatus('planned')">WILL BUY</button></div><div class="gear-owner"><button class="chip ${gearOwner==='all'?'active':''}" onclick="rhGearSetOwner('all')">EVERYTHING</button><button class="chip ${gearOwner==='mine'?'active':''}" onclick="rhGearSetOwner('mine')">MY GEAR</button><button class="chip ${gearOwner==='Mom'?'active':''}" onclick="rhGearSetOwner('Mom')">MOM</button><button class="chip ${gearOwner==='Bike / Shared'?'active':''}" onclick="rhGearSetOwner('Bike / Shared')">BIKE / SHARED</button></div></div><div id="gearContent">${cats.map(cat=>{const rows=items.filter(x=>(x.category||'Gear')===cat);if(!rows.length)return'';return`<div class="gear-section-title"><h3>${esc(cat)}</h3><span>${rows.length} ${rows.length===1?'ITEM':'ITEMS'}</span></div><div class="gear-list">${rows.map(x=>`<div class="gear-card" onclick="openGearDetail('${esc(x.id)}')"><div class="gear-avatar">${gearIcon(cat)}</div><div><h4>${esc(x.name)}${Number(x.qty||1)>1?` ×${Number(x.qty||1)}`:''}</h4><div class="gear-meta">${esc(x.owner||'Me')} • ${esc(cat)}</div></div><div class="gear-right"><div class="gear-price ${x.amount==null?'unknown':''}">${gearMoney(x.amount)}</div><span class="gear-state ${x.status==='planned'?'planned':'owned'}">${x.status==='planned'?'WILL BUY':'BOUGHT'}</span></div></div>`).join('')}</div>`}).join('')||'<div class="gear-empty">No gear added yet.</div>'}</div><div class="data-note">Prices marked unknown are intentionally left blank rather than guessed.</div><button class="gear-fab" onclick="openGearEditor()" aria-label="Add gear" title="Add gear">+</button>`;
};

/* ---------- More screen cleanup + prominent install action. ---------- */
window.renderMore=function(){
  const root=document.querySelector('#more');if(!root)return;const u=firebaseUser(),sync=typeof window.riderHubFirebaseSyncStatus==='function'?window.riderHubFirebaseSyncStatus():null;
  root.innerHTML=`<div class="card rh-more-hero-final"><div class="rh-more-copy"><div class="kicker">MORE</div><h1>Rider Hub</h1><p>Account, backup and essential utilities.</p></div><button class="rh-install-primary" onclick="openInstallApp()"><span>↓</span><strong>Install as App</strong><small>Phone or desktop</small></button></div><div class="more-grid"><button class="more-card" onclick="openMyAccount()"><b>◉</b><span><strong>My Account</strong><small>${esc(u?.email||sync?.label||'Account')}</small></span></button><button class="more-card" onclick="openTransfer()"><b>⇄</b><span><strong>Backup / Import</strong><small>Export or restore Rider Hub data</small></span></button><button class="more-card" onclick="openEmergency()"><b>SOS</b><span><strong>Emergency contacts</strong><small>112, 108 and custom contacts</small></span></button><button class="more-card" onclick="openStorageInfo()"><b>▤</b><span><strong>Files & storage</strong><small>Private files and account sync</small></span></button><button class="more-card" onclick="openAboutRiderHub()"><b>RH</b><span><strong>About Rider Hub</strong><small>About the app</small></span></button><button class="more-card" onclick="logoutRiderHub()"><b>↪</b><span><strong>Log out</strong><small>Switch Rider Hub account</small></span></button></div>`;
};
window.openAppSettings=function(){if(typeof window.toast==='function')window.toast('Unused settings were removed')};
window.openStorageInfo=function(){
  if(typeof window.openModal!=='function')return;const status=typeof window.riderHubFirebaseSyncStatus==='function'?window.riderHubFirebaseSyncStatus():null,drive=typeof window.cloudSyncLabel==='function'?window.cloudSyncLabel():'Not connected';
  window.openModal(`<div class="modalhead"><div><div class="kicker">FILES & STORAGE</div><h3>Your data</h3><p class="caption">App data and private file backup are kept separate.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="rh-service-grid"><div class="rh-service-card"><strong>App data</strong><p>${esc(status?.label||'Local')}</p></div><div class="rh-service-card"><strong>Private files</strong><p>Google Drive · ${esc(drive)}</p></div></div><div class="routecard"><strong>Supported private files</strong><p>PDF · JPG/JPEG · PNG · WEBP · HEIC/HEIF · TIFF · GIF · BMP · DOC/DOCX · ODT · RTF · TXT</p></div><div class="grid2"><button class="secondary" onclick="riderHubFirebaseSyncNow()">Sync app data</button><button class="primary" onclick="requestDriveAccess(true)">Connect / refresh Drive</button></div>`);
};

/* Initial and account-state behaviour. */
function onSyncStatus(event){
  const kind=event?.detail?.kind||'';
  if(kind==='signedout'){
    authMode='welcome';bikeDraft=null;bikeModels=[];setTimeout(()=>{if(!firebaseUser())showWelcome(0);applyMainBrand()},0);return;
  }
  setTimeout(()=>{if(!maybeRequireBikeSetup())authMode='app';postUi()},250);
}
window.addEventListener('riderhub-sync-status',onSyncStatus);

setAuthBrandGeneric();postUi();
try{
  const session=JSON.parse(localStorage.getItem(AUTH_KEY)||'null');
  if(!session?.uid&&!session?.provider?.includes('firebase'))setTimeout(()=>showWelcome(0),0);
}catch{setTimeout(()=>showWelcome(0),0)}
setTimeout(()=>{setAuthBrandGeneric();patchNotificationIcons();applyMainBrand();maybeRequireBikeSetup()},900);
})();
