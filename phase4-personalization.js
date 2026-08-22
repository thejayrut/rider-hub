/* Rider Hub Phase 4 personalization and multi-bike UX. */
(()=>{
const AUTH_KEY='riderhub_auth_session_v1';
const CANONICAL_HOST='rider-hub-506306.firebaseapp.com';
const esc4=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BELL='<svg viewBox="0 0 24 24" aria-hidden="true" class="rh-bell-svg"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>';

const MANUFACTURERS=[
 'Aprilia','Bajaj','Benelli','BMW Motorrad','Ducati','Harley-Davidson','Hero','Honda','Husqvarna','Indian Motorcycle','Jawa','Kawasaki','KTM','Moto Guzzi','Royal Enfield','Suzuki','Triumph','TVS','Yamaha','Yezdi','Other'
];
const MODEL_LISTS={
 'Royal Enfield':['Bear 650','Bullet 350','Bullet 650','Classic 350','Classic 650','Continental GT 650','Goan Classic 350','Guerrilla 450','Himalayan 450','Hunter 350','Interceptor 650','Meteor 350','Scram 440','Shotgun 650','Super Meteor 650','Other'],
 'TVS':['Apache RR 310','Apache RTR 160 2V','Apache RTR 160 4V','Apache RTR 180','Apache RTR 200 4V','Apache RTX','Raider','Radeon','Ronin','Sport','Star City+','Other']
};
const CATALOG={
 'TVS|Ronin':{
  variants:{
   'Base':['Lightning Black','Magma Red'],
   'Mid':['Glacier Silver','Charcoal Ember'],
   'Top':['Nimbus Grey','Midnight Blue']
  },
  specs:{engine:'225.9 cc single-cylinder, 4-stroke, oil-cooled',transmission:'5-speed',fuelTank:'14 L',tyres:'110/70-17 front · 130/70-17 rear · tubeless'},
  brakingByVariant:{Base:'300 mm front disc · 240 mm rear disc · single-channel ABS',Mid:'300 mm front disc · 240 mm rear disc · dual-channel ABS',Top:'300 mm front disc · 240 mm rear disc · dual-channel ABS'},
  manualUrl:'https://www.tvsmotor.com/-/media/Feature/Owners/UserManual2026/TVS-Ronin.pdf',
  chainIntervalKm:500,
  serviceMilestones:[750,5500,11500,17500,23500,29500,35500],
  serviceSummary:'Scheduled service around 750–1,000 km first, then approximately every 6,000 km / 6 months. Follow the owner manual for the exact schedule.'
 },
 'Royal Enfield|Hunter 350':{
  variants:{
   'Retro':['Factory Black'],
   'Metro':['Rio White','Dapper Grey','Tarmac Black','Tokyo Black','London Red','Rebel Blue','Moonshot White','Mumbai Yellow','Graphite Grey']
  },
  specs:{engine:'349 cc single-cylinder, 4-stroke, air-oil cooled',transmission:'5-speed constant mesh',fuelTank:'13 L'},
  tyresByVariant:{Retro:'100/80-17 front · 120/80-17 rear · tubeless',Metro:'110/70-17 front · 140/70-17 rear · tubeless'},
  brakingByVariant:{Retro:'300 mm front disc · 153 mm rear drum · single-channel ABS',Metro:'300 mm front disc · 270 mm rear disc · dual-channel ABS'},
  manualUrl:'https://www.royalenfield.com/in/en/support/owners-manual/',
  chainIntervalKm:500,
  serviceMilestones:[500,5000,10000,15000,20000,25000,30000,35000,40000,45000,50000],
  serviceSummary:'Periodic maintenance starts at 500 km / 1.5 months, then every 5,000 km / 6 months. Drive-chain clean/lube is specified every 500 km.'
 }
};

const catalogEntry=(make,model)=>CATALOG[`${make}|${model}`]||null;
const nextService=(entry,odo)=>{
 const n=Math.max(0,Number(odo)||0),list=entry?.serviceMilestones||[];
 return list.find(x=>x>n)||0;
};
const publicState=()=>!!(state?.profile?.publicUser);
const bikeConfigured=()=>!!state?.profile?.bikeConfigured;
const signedIn=()=>!!(window.riderHubFirebaseUser?.()||localStorage.getItem(AUTH_KEY));

function dynamicChrome(){
 const brand=document.querySelector('.brandname'),sub=document.querySelector('.brand .sub');
 if(!brand||!sub)return;
 if(!signedIn()||!bikeConfigured()){
  brand.textContent='RIDER HUB';
  sub.textContent='MOTORCYCLE OS';
  document.title='Rider Hub';
  return;
 }
 const b=state?.bike||{};
 brand.textContent=b.name||[b.manufacturer,b.model].filter(Boolean).join(' ')||'Rider Hub';
 sub.textContent=[b.variant,b.colour].filter(Boolean).join(' · ').toUpperCase()||'MY MOTORCYCLE';
 document.title=`Rider Hub — ${b.name||b.model||'Motorcycle'}`;
}
window.riderHubRefreshChrome=dynamicChrome;

function patchNotificationIcons(){
 document.querySelectorAll('button[title="Notifications"]').forEach(btn=>{btn.innerHTML=BELL;btn.setAttribute('aria-label','Notifications')});
 document.querySelectorAll('.quick').forEach(btn=>{if(/alerts/i.test(btn.textContent||'')){const b=btn.querySelector('b');if(b)b.innerHTML=BELL}});
}

function removePrivateWorkspace(){
 const home=document.querySelector('#home');if(!home)return;
 const card=[...home.querySelectorAll('.card')].find(x=>/private workspace/i.test(x.textContent||''));
 if(card){const prev=card.previousElementSibling;if(prev?.classList.contains('section-head'))prev.remove();card.remove()}
}
function patchRides(){document.querySelector('#rides .ride-list-head .add-ride-btn')?.remove()}

const previousHome=window.renderHome;
window.renderHome=function(){const out=previousHome?.apply(this,arguments);removePrivateWorkspace();patchNotificationIcons();dynamicChrome();return out};
const previousRides=window.renderRides;
window.renderRides=function(){const out=previousRides?.apply(this,arguments);patchRides();return out};
const previousBike=window.renderBike;
window.renderBike=function(){const out=previousBike?.apply(this,arguments);enhanceBikePage();dynamicChrome();return out};

function gearMoney(n){return n==null||n===''?'PRICE TBD':'₹'+Math.round(Number(n)||0).toLocaleString('en-IN')}
function myGearOwner(x){return !['Mom','Bike / Shared'].includes(String(x?.owner||''))}
let finalGearStatus='all',finalGearOwner='all',finalGearQuery='';
window.rhGearSetStatus=v=>{finalGearStatus=v;window.renderGear()};
window.rhGearSetOwner=v=>{finalGearOwner=v;window.renderGear()};
window.rhGearSearch=v=>{finalGearQuery=v;window.renderGear()};
function gearIcon(cat){return cat==='Riding Gear'?'◒':cat==='Luggage'?'▣':cat==='Electronics'?'◉':cat==='Camera & Mounts'?'◎':'◇'}
window.renderGear=function(){
 const g=Array.isArray(state?.gear)?state.gear:[];
 const owned=g.filter(x=>x.status==='owned'),planned=g.filter(x=>x.status==='planned');
 const spend=owned.reduce((a,x)=>a+(Number(x.amount)||0),0),budget=planned.reduce((a,x)=>a+(Number(x.amount)||0),0);
 const q=finalGearQuery.trim().toLowerCase();
 const items=g.filter(x=>(finalGearStatus==='all'||x.status===finalGearStatus)&&(finalGearOwner==='all'||(finalGearOwner==='mine'?myGearOwner(x):x.owner===finalGearOwner))&&(!q||`${x.name} ${x.category} ${x.owner} ${x.note||''}`.toLowerCase().includes(q)));
 const preferred=['Riding Gear','Luggage','Electronics','Bike Accessories','Camera & Mounts','Cleaning & Care'];
 const cats=[...preferred,...items.map(x=>x.category||'Gear').filter(x=>!preferred.includes(x))].filter((x,i,a)=>a.indexOf(x)===i);
 const root=document.querySelector('#gear');if(!root)return;
 root.innerHTML=`<div class="card gear-hero"><div class="kicker">GEAR GARAGE</div><h1>Your riding inventory</h1><p>Owned gear, planned purchases, bike setup, luggage, electronics and care items — all in one editable garage.</p><div class="gear-summary"><div class="sum"><label>OWNED</label><b>${owned.length}</b><small>products in garage</small></div><div class="sum"><label>WILL BUY</label><b>${planned.length}</b><small>planned products</small></div><div class="sum"><label>KNOWN SPEND</label><b>₹${Math.round(spend).toLocaleString('en-IN')}</b><small>excludes unknown prices</small></div><div class="sum"><label>PLANNED BUDGET</label><b>₹${Math.round(budget).toLocaleString('en-IN')}</b><small>known expected prices</small></div></div></div><div class="gear-toolbar"><div class="gear-search"><span class="search-symbol">⌕</span><input id="gearSearch" placeholder="Search helmet, luggage, Mom…" autocomplete="off" value="${esc4(finalGearQuery)}" oninput="rhGearSearch(this.value)"></div><div class="gear-tabs"><button class="chip ${finalGearStatus==='all'?'active':''}" onclick="rhGearSetStatus('all')">ALL</button><button class="chip ${finalGearStatus==='owned'?'active':''}" onclick="rhGearSetStatus('owned')">BOUGHT</button><button class="chip ${finalGearStatus==='planned'?'active':''}" onclick="rhGearSetStatus('planned')">WILL BUY</button></div><div class="gear-owner"><button class="chip ${finalGearOwner==='all'?'active':''}" onclick="rhGearSetOwner('all')">EVERYTHING</button><button class="chip ${finalGearOwner==='mine'?'active':''}" onclick="rhGearSetOwner('mine')">MY GEAR</button><button class="chip ${finalGearOwner==='Mom'?'active':''}" onclick="rhGearSetOwner('Mom')">MOM</button><button class="chip ${finalGearOwner==='Bike / Shared'?'active':''}" onclick="rhGearSetOwner('Bike / Shared')">BIKE / SHARED</button></div></div><div id="gearContent">${cats.map(cat=>{const rows=items.filter(x=>(x.category||'Gear')===cat);if(!rows.length)return'';return`<div class="gear-section-title"><h3>${esc4(cat)}</h3><span>${rows.length} ${rows.length===1?'ITEM':'ITEMS'}</span></div><div class="gear-list">${rows.map(x=>`<div class="gear-card" onclick="openGearDetail('${esc4(x.id)}')"><div class="gear-avatar">${gearIcon(cat)}</div><div><h4>${esc4(x.name)}${Number(x.qty||1)>1?` ×${Number(x.qty||1)}`:''}</h4><div class="gear-meta">${esc4(x.owner||'Me')} • ${esc4(cat)}</div></div><div class="gear-right"><div class="gear-price ${x.amount==null?'unknown':''}">${gearMoney(x.amount)}</div><span class="gear-state ${x.status==='planned'?'planned':'owned'}">${x.status==='planned'?'WILL BUY':'BOUGHT'}</span></div></div>`).join('')}</div>`}).join('')||'<div class="gear-empty">No items match these filters.</div>'}</div><div class="data-note">Prices marked unknown are intentionally left blank rather than guessed.</div><button class="gear-fab" onclick="openGearEditor()" aria-label="Add gear" title="Add gear">+</button>`;
};

function renderMoreFinal(){
 const sync=typeof window.riderHubFirebaseSyncStatus==='function'?window.riderHubFirebaseSyncStatus():null;
 const user=window.riderHubFirebaseUser?.();
 const root=document.querySelector('#more');if(!root)return;
 root.innerHTML=`<div class="card more-hero rh-more-hero"><div class="rh-more-copy"><div class="kicker">MORE</div><h1>Rider Hub</h1><p>Account, backup and essential utilities.</p></div><button class="rh-install-primary" onclick="openInstallApp()"><span>↓</span><strong>Install as App</strong><small>Phone or desktop</small></button></div><div class="more-grid"><button class="more-card" onclick="openMyAccount()"><b>◉</b><span><strong>My Account</strong><small>${esc4(user?.email||sync?.label||'Account')}</small></span></button><button class="more-card" onclick="openTransfer()"><b>⇄</b><span><strong>Backup / Import</strong><small>Export or restore Rider Hub data</small></span></button><button class="more-card" onclick="openEmergency()"><b>SOS</b><span><strong>Emergency contacts</strong><small>112, 108 and custom contacts</small></span></button><button class="more-card" onclick="openStorageInfo()"><b>▤</b><span><strong>Files & storage</strong><small>Private files and backup</small></span></button><button class="more-card" onclick="openAboutRiderHub()"><b>RH</b><span><strong>About Rider Hub</strong><small>About the app</small></span></button><button class="more-card" onclick="logoutRiderHub()"><b>↪</b><span><strong>Log out</strong><small>Switch Rider Hub account</small></span></button></div>`;
}
window.renderMore=renderMoreFinal;

window.openAppSettings=function(){if(typeof toast==='function')toast('No extra app settings are required right now')};

function opts(items,selected,placeholder='Select'){
 return `<option value="">${placeholder}</option>`+items.map(v=>`<option value="${esc4(v)}" ${String(v)===String(selected)?'selected':''}>${esc4(v)}</option>`).join('');
}
function currentSetupValues(){const b=state?.bike||{};return{make:b.manufacturer||'',model:b.model||'',variant:b.variant||'',colour:b.colour||'',year:b.year||new Date().getFullYear(),odo:Number(b.odo||0)}}
let setupDraft=null;
function setupModelControl(v){
 const models=MODEL_LISTS[v.make];
 if(!models)return `<input id="rhBikeModel" value="${esc4(v.model)}" placeholder="Motorcycle model">`;
 const chosen=models.includes(v.model)?v.model:(v.model?'Other':'');
 return `<select id="rhBikeModel" onchange="rhBikeSetupRefresh('model')">${opts(models,chosen,'Select model')}</select>${chosen==='Other'?`<input id="rhBikeModelCustom" value="${esc4(models.includes(v.model)?'':v.model)}" placeholder="Motorcycle model" style="margin-top:8px">`:''}`;
}
function setupModelValue(){const el=document.querySelector('#rhBikeModel');if(!el)return'';if(el.tagName==='SELECT'&&el.value==='Other')return(document.querySelector('#rhBikeModelCustom')?.value||'').trim()||'Other';return(el.value||'').trim()}
function setupMarkup(asGate=false){
 const v=setupDraft||currentSetupValues(),entry=catalogEntry(v.make,v.model),variants=entry?Object.keys(entry.variants):[],colors=entry?.variants?.[v.variant]||[];
 return `<div class="rh-bike-setup ${asGate?'gate':''}"><div class="rh-slide-kicker">${asGate?'ONE-TIME SETUP':'MY MOTORCYCLE'}</div><h2>${asGate?'Set up your motorcycle':'Edit motorcycle'}</h2><p>Choose what you ride. Known specifications and maintenance data are filled automatically when Rider Hub has a verified profile for that model.</p><div class="rh-bike-setup-grid"><div class="field"><label>MANUFACTURER</label><select id="rhBikeMake" onchange="rhBikeSetupRefresh('make')">${opts(MANUFACTURERS,v.make,'Select manufacturer')}</select></div><div class="field"><label>MODEL</label>${setupModelControl(v)}</div><div class="field"><label>VARIANT</label>${entry?`<select id="rhBikeVariant" onchange="rhBikeSetupRefresh('variant')">${opts(variants,v.variant,'Select variant')}</select>`:`<input id="rhBikeVariant" value="${esc4(v.variant)}" placeholder="Variant">`}</div><div class="field"><label>COLOUR</label>${entry&&colors.length?`<select id="rhBikeColour">${opts(colors,v.colour,'Select colour')}</select>`:`<input id="rhBikeColour" value="${esc4(v.colour)}" placeholder="Colour">`}</div><div class="field"><label>YEAR</label><input id="rhBikeYear" inputmode="numeric" value="${esc4(v.year)}"></div><div class="field"><label>ODOMETER KM</label><input id="rhBikeOdo" inputmode="numeric" value="${esc4(v.odo)}"></div></div><div id="rhBikeProfileHint" class="rh-bike-profile-hint">${entry?'Verified Rider Hub profile available for this model.':'This motorcycle can still be saved. Automatic specifications will appear as the verified catalog expands.'}</div><div class="rh-auth-actions">${asGate?'':'<button onclick="closeModal();setupDraft=null">Cancel</button>'}<button class="primary" onclick="rhSaveBikeSetup(${asGate?'true':'false'})">Save motorcycle</button></div></div>`;
}
function openSetupModal(){setupDraft=currentSetupValues();openModal(`<div class="modalhead"><div><div class="kicker">MY MOTORCYCLE</div><h3>Motorcycle setup</h3></div><button class="round" onclick="closeModal();setupDraft=null">×</button></div>${setupMarkup(false)}`)}
window.openPublicBikeSetup=openSetupModal;
window.rhBikeSetupRefresh=function(level){
 const v=setupDraft||currentSetupValues();
 v.make=document.querySelector('#rhBikeMake')?.value||v.make;
 v.model=setupModelValue();
 v.variant=document.querySelector('#rhBikeVariant')?.value||v.variant;
 v.colour=document.querySelector('#rhBikeColour')?.value||v.colour;
 v.year=document.querySelector('#rhBikeYear')?.value||v.year;
 v.odo=document.querySelector('#rhBikeOdo')?.value||v.odo;
 if(level==='make'){v.model='';v.variant='';v.colour=''}else if(level==='model'){v.variant='';v.colour=''}else if(level==='variant')v.colour='';
 setupDraft=v;
 const gate=document.querySelector('#rhAuthShell')?.classList.contains('active')&&!bikeConfigured();
 const target=document.querySelector('.rh-bike-setup');if(target)target.outerHTML=setupMarkup(gate);
};
window.rhSaveBikeSetup=function(asGate=false){
 const make=document.querySelector('#rhBikeMake')?.value?.trim()||'',model=setupModelValue();
 if(!make||!model)return toast('Choose manufacturer and model');if(model==='Other')return toast('Enter motorcycle model');
 const variant=document.querySelector('#rhBikeVariant')?.value?.trim()||'',colour=document.querySelector('#rhBikeColour')?.value?.trim()||'',year=Math.max(1900,Math.round(Number(document.querySelector('#rhBikeYear')?.value||new Date().getFullYear()))),odo=Math.max(0,Math.round(Number(document.querySelector('#rhBikeOdo')?.value||0)));
 const entry=catalogEntry(make,model),spec=entry?.specs||{};
 snapshot('bike setup');
 state.bike={...state.bike,name:`${make} ${model}`,manufacturer:make,model,variant,colour,year,odo,trim:[variant,colour,year].filter(Boolean).join(' • '),purchase:state.bike?.purchase||'Not added',engine:spec.engine||state.bike?.engine||'Not added',braking:entry?.brakingByVariant?.[variant]||state.bike?.braking||'Not added',transmission:spec.transmission||state.bike?.transmission||'Not added',fuelTank:spec.fuelTank||state.bike?.fuelTank||'Not added',tyres:entry?.tyresByVariant?.[variant]||spec.tyres||state.bike?.tyres||'Not added',manualUrl:entry?.manualUrl||'',maintenanceSummary:entry?.serviceSummary||'',chainIntervalKm:entry?.chainIntervalKm||0,nextServiceKm:entry?nextService(entry,odo):Number(state.bike?.nextServiceKm||0),nextServiceDate:entry?'See owner manual':(state.bike?.nextServiceDate||'Not added'),serviceHistory:Array.isArray(state.bike?.serviceHistory)?state.bike.serviceHistory:[]};
 state.profile=state.profile||{};state.profile.bikeConfigured=true;
 save();setupDraft=null;
 document.querySelector('#rhAuthShell')?.classList.remove('active');
 if(!asGate)closeModal();
 render();dynamicChrome();toast('Motorcycle saved');
};

function enhanceBikePage(){
 if(!bikeConfigured())return;
 const b=state?.bike||{},root=document.querySelector('#bike');if(!root||root.querySelector('.rh-manufacturer-profile'))return;
 const entry=catalogEntry(b.manufacturer,b.model);
 if(!entry)return;
 const section=document.createElement('div');section.className='rh-manufacturer-profile';
 section.innerHTML=`<div class="section-head"><div><div class="kicker">MANUFACTURER DATA</div><h2>Manual + service schedule</h2></div></div><div class="card list"><div class="listrow"><div class="ico">▤</div><div><strong>Owner's manual</strong><p>Official ${esc4(b.manufacturer)} manual/support source for ${esc4(b.model)}.</p></div><button class="secondary" onclick="rhOpenBikeManual()">Open</button></div><div class="listrow"><div class="ico">🔧</div><div><strong>Service schedule</strong><p>${esc4(entry.serviceSummary)}</p></div><span class="pill good">AUTO</span></div></div>`;
 const docsHead=[...root.querySelectorAll('.section-head')].find(x=>/documents/i.test(x.textContent||''));
 if(docsHead)docsHead.before(section);else root.appendChild(section);
}
window.rhOpenBikeManual=function(){const url=state?.bike?.manualUrl;if(url)window.open(url,'_blank','noopener');else toast('Manual link is not available for this model yet')};

const previousImport=window.riderHubImportState;
if(typeof previousImport==='function')window.riderHubImportState=function(remote){
 const fresh=location.hostname===CANONICAL_HOST&&publicState()&&!bikeConfigured();
 const starterRonin=fresh&&remote?.profile?.publicUser&&remote?.profile?.bikeConfigured&&String(remote?.bike?.manufacturer||'').toLowerCase()==='tvs'&&String(remote?.bike?.model||'').toLowerCase()==='ronin';
 if(starterRonin)return false;
 const out=previousImport.apply(this,arguments);setTimeout(()=>{dynamicChrome();maybeRequireBikeSetup()},0);return out;
};

let authFlow='intro',slideIndex=0,authPatching=false;
const SLIDES=[
 {k:'YOUR MOTORCYCLE OS',h:'Everything around your motorcycle, in one place.',p:'Bike information, maintenance, service history, gear and private documents stay organised around the motorcycle you actually ride.',f:[['Your bike','A workspace that adapts to your motorcycle.'],['Ownership','Odometer, service history and documents stay together.']]},
 {k:'RIDE MODE',h:'Plan less while riding. Miss less when tired.',p:'Ride plans, current tasks, progress, emergency tools, notes and packing stay easy to reach when you are on the road.',f:[['Ride progress','Track what is done, delayed or skipped.'],['Road-ready','Keep the important controls close during a ride.']]},
 {k:'YOUR RIDER HUB',h:'Your bike and rides can follow you across devices.',p:'Sign in once to keep your Rider Hub available across your devices while the core experience remains local-first.',f:[['Private by default','Your workspace belongs to your account.'],['Offline core','Your local copy remains useful when the network disappears.']]}
];
function authShell(){return document.querySelector('#rhAuthShell')}
function renderIntro(i=0){
 const shell=authShell();if(!shell)return;authFlow='intro';slideIndex=Math.max(0,Math.min(SLIDES.length-1,i));const s=SLIDES[slideIndex],stage=shell.querySelector('#rhAuthStage');if(!stage)return;
 authPatching=true;stage.innerHTML=`<div class="rh-slide-kicker">${s.k}</div><h1>${s.h}</h1><p>${s.p}</p><div class="rh-auth-features">${s.f.map(x=>`<div class="rh-auth-feature"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div><div class="rh-auth-dots">${SLIDES.map((_,n)=>`<i class="rh-auth-dot ${n===slideIndex?'active':''}"></i>`).join('')}</div><div class="rh-auth-actions">${slideIndex?'<button onclick="rhWelcomeBack()">Back</button>':''}<button class="primary" onclick="rhWelcomeNext()">${slideIndex===SLIDES.length-1?'Continue':'Next'}</button></div>`;authPatching=false;
}
window.rhWelcomeBack=()=>renderIntro(slideIndex-1);
window.rhWelcomeNext=()=>slideIndex===SLIDES.length-1?renderLogin():renderIntro(slideIndex+1);
function renderLogin(){
 const shell=authShell();if(!shell)return;authFlow='login';const stage=shell.querySelector('#rhAuthStage');if(!stage)return;
 authPatching=true;stage.innerHTML=`<div class="rh-auth-login"><div class="rh-slide-kicker">MY ACCOUNT</div><h2>Sign in to Rider Hub</h2><p>Use your Google account to keep your Rider Hub available across your devices.</p><div class="rh-auth-form"><button id="rhGoogleFirebaseLogin" class="rh-auth-button primary full">Continue with Google</button><div id="rhAuthNote" class="rh-auth-note" hidden></div></div></div>`;authPatching=false;
 setTimeout(()=>{const btn=document.querySelector('#rhGoogleFirebaseLogin');if(btn&&typeof window.rhLoginGoogle==='function'){btn.onclick=()=>window.rhLoginGoogle();btn.disabled=typeof window.riderHubFirebaseReady==='function'?!window.riderHubFirebaseReady():false}},0);
}
function sanitizeAuth(){
 const shell=authShell();if(!shell)return;
 const small=shell.querySelector('.rh-auth-brand small');if(small)small.textContent='MOTORCYCLE OS';
 const stage=shell.querySelector('#rhAuthStage');if(!stage)return;
 if(authFlow==='intro'&&shell.classList.contains('active')){
  const isOurSlide=/YOUR MOTORCYCLE OS|RIDE MODE|YOUR RIDER HUB/.test(stage.textContent||'');if(!isOurSlide&&!bikeConfigured())renderIntro(slideIndex);else if(!isOurSlide&&!signedIn())renderIntro(slideIndex);
  return;
 }
 if(authFlow==='login'){
  const h=stage.querySelector('h2');if(h)h.textContent='Sign in to Rider Hub';
  const p=stage.querySelector('.rh-auth-login>p');if(p)p.textContent='Use your Google account to keep your Rider Hub available across your devices.';
  const note=stage.querySelector('#rhAuthNote');if(note){const t=(note.textContent||'').trim();if(!t||/google sign-in is ready|loading google sign-in|firebase|firestore/i.test(t)){note.textContent='';note.hidden=true}else note.hidden=false}
 }
}
window.rhAuthShowWelcome=()=>renderIntro(0);
window.rhAuthShowLogin=renderLogin;

function setupGate(){const shell=authShell();if(!shell)return;authFlow='setup';setupDraft=currentSetupValues();shell.classList.add('active');const small=shell.querySelector('.rh-auth-brand small');if(small)small.textContent='MOTORCYCLE OS';const stage=shell.querySelector('#rhAuthStage');if(stage)stage.innerHTML=setupMarkup(true)}
function maybeRequireBikeSetup(){
 if(!publicState()||bikeConfigured())return false;
 const firebaseUser=window.riderHubFirebaseUser?.();if(!firebaseUser)return false;
 setupGate();return true;
}
window.riderHubNeedsBikeSetup=()=>publicState()&&!bikeConfigured();
window.riderHubRequireBikeSetup=setupGate;

const authObserver=new MutationObserver(()=>{
 if(authPatching)return;
 sanitizeAuth();
 const shell=authShell();if(shell&&!shell.classList.contains('active'))setTimeout(maybeRequireBikeSetup,0);
});
authObserver.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

const previousRender=window.render;
window.render=function(){const out=previousRender?.apply(this,arguments);removePrivateWorkspace();patchRides();patchNotificationIcons();enhanceBikePage();dynamicChrome();return out};
window.addEventListener('riderhub-sync-status',event=>{if(event?.detail?.kind==='signedout'){authFlow='intro';setupDraft=null;setTimeout(()=>{const shell=authShell();if(shell?.classList.contains('active'))renderIntro(0);dynamicChrome()},0);return}setTimeout(()=>{maybeRequireBikeSetup();dynamicChrome()},0)});

setTimeout(()=>{sanitizeAuth();dynamicChrome();patchNotificationIcons();if(authShell()?.classList.contains('active')&&!signedIn())renderIntro(0);maybeRequireBikeSetup()},140);
})();
