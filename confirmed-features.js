/* Rider Hub confirmed product changes: manufacturer UX, owner manuals,
   account-aware documents, dynamic accent colour and final More/Bike cleanup. */
(()=>{
'use strict';
const MAJORS=['Royal Enfield','Honda','Yamaha','TVS','Bajaj','Hero','KTM','Kawasaki','Suzuki','BMW Motorrad','Triumph','Harley-Davidson','Ducati','Aprilia','Benelli'];
const DEFAULT_ACCENT='#f0a12b';
const FILE_ACCEPT='.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.tif,.tiff,.gif,.bmp,.doc,.docx,.odt,.rtf,.txt,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,image/tiff,image/gif,image/bmp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,text/plain';
const STANDARD_DOCS=[
  {id:'licence',name:'Rider licence',desc:'Driving or learner licence',primary:true},
  {id:'insurance',name:'Insurance',desc:'Motorcycle insurance policy',primary:true},
  {id:'registration_rc',name:'Registration / RC',desc:'Registration certificate'},
  {id:'puc',name:'PUC / emissions',desc:'Pollution under control certificate'},
  {id:'vehicle_invoice',name:'Purchase invoice',desc:'Vehicle purchase invoice or receipt'},
  {id:'warranty',name:'Warranty',desc:'Manufacturer or extended warranty'},
  {id:'service_invoice',name:'Service invoices',desc:'Workshop and service bills'}
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const state=()=>window.state||{};
const bike=()=>state().bike||{};
const profile=()=>state().profile||{};
const signedIn=()=>!!(typeof window.riderHubFirebaseUser==='function'&&window.riderHubFirebaseUser());
const allMakesSource=typeof window.riderHubMotorcycleMakes==='function'?window.riderHubMotorcycleMakes:null;
if(allMakesSource)window.riderHubMotorcycleMakes=async()=>MAJORS.slice();

function hexRgb(hex){
  const m=String(hex||'').trim().match(/^#([0-9a-f]{6})$/i);if(!m)return null;
  const n=parseInt(m[1],16);return {r:n>>16,g:(n>>8)&255,b:n&255};
}
function mix(hex,amount){
  const c=hexRgb(hex)||hexRgb(DEFAULT_ACCENT),t=amount>=0?255:0,p=Math.abs(amount);
  const f=x=>Math.round(x+(t-x)*p).toString(16).padStart(2,'0');
  return '#'+f(c.r)+f(c.g)+f(c.b);
}
function deriveAccent(name){
  const raw=String(name||'').trim();
  if(/^#[0-9a-f]{6}$/i.test(raw))return raw.toLowerCase();
  const s=raw.toLowerCase();
  const map=[
    [/purple|violet|plum|lavender|aubergine/,'#9b6cff'],
    [/red|crimson|scarlet|maroon|burgundy/,'#e45b5b'],
    [/blue|navy|azure|cobalt|indigo/,'#5f8fff'],
    [/teal|turquoise|cyan|aqua/,'#42b8b0'],
    [/green|olive|emerald|forest/,'#62b875'],
    [/yellow|gold|mustard/,'#d8b84b'],
    [/pink|rose|magenta/,'#df75a6'],
    [/orange|ember|copper|bronze|rust/,'#f0a12b'],
    [/silver|grey|gray|graphite|charcoal|black/,'#a9afb8'],
    [/white|pearl|ivory/,'#d8dce2']
  ];
  for(const [re,val] of map)if(re.test(s))return val;
  return DEFAULT_ACCENT;
}
function applyAccent(hex){
  const c=hexRgb(hex)?hex:DEFAULT_ACCENT,r=hexRgb(c);
  const root=document.documentElement;
  root.style.setProperty('--ember',c);
  root.style.setProperty('--ember2',mix(c,.17));
  root.style.setProperty('--soft',`rgba(${r.r},${r.g},${r.b},.11)`);
  root.style.setProperty('--rh-accent',c);
}
function applyStoredAccent(){
  if(!signedIn()){applyAccent(DEFAULT_ACCENT);return}
  const s=state();s.ui=s.ui||{};
  const color=s.ui.accentColor||deriveAccent(bike().colour);
  s.ui.accentColor=color;applyAccent(color);
}
window.riderHubDeriveAccent=deriveAccent;
window.riderHubApplyAccent=applyAccent;

function rebuildMajorMakeSelect(){
  const sel=document.querySelector('#rhBikeMake');if(!sel)return;
  const current=sel.value||bike().manufacturer||'';
  const values=[...MAJORS];
  if(current&&current!=='__other__'&&!values.includes(current))values.unshift(current);
  sel.innerHTML='<option value="">Select manufacturer</option>'+values.map(v=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(v)}</option>`).join('')+`<option value="__other__" ${current==='__other__'?'selected':''}>Other manufacturers…</option>`;
}
async function showOtherManufacturers(){
  const make=document.querySelector('#rhBikeMake');if(!make)return;
  document.querySelector('#rhBikeMakeOtherWrap')?.remove();
  const wrap=document.createElement('div');wrap.id='rhBikeMakeOtherWrap';wrap.className='rh-other-manufacturers';
  wrap.innerHTML='<label>OTHER MANUFACTURERS</label><select id="rhBikeMakeOther"><option value="">Loading manufacturers…</option></select>';
  make.insertAdjacentElement('afterend',wrap);
  const other=wrap.querySelector('select');
  let all=[];
  try{all=allMakesSource?await allMakesSource():[]}catch{}
  all=[...new Set((all||[]).filter(x=>x&&!MAJORS.includes(x)))].sort((a,b)=>a.localeCompare(b));
  other.innerHTML='<option value="">Choose manufacturer</option>'+all.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')+'<option value="__manual__">Not listed — type it manually</option>';
  other.onchange=()=>window.rhChooseOtherManufacturer(other.value);
}
window.rhChooseOtherManufacturer=async function(value){
  const make=document.querySelector('#rhBikeMake'),wrap=document.querySelector('#rhBikeMakeOtherWrap');if(!make)return;
  if(value==='__manual__'){
    document.querySelector('#rhBikeMakeCustom')?.remove();
    const custom=document.createElement('input');custom.id='rhBikeMakeCustom';custom.placeholder='Manufacturer';custom.style.marginTop='8px';wrap?.insertAdjacentElement('afterend',custom);
    const model=document.querySelector('#rhBikeModel');
    if(model){
      model.innerHTML='<option value="__other__" selected>Type model manually</option>';
      document.querySelector('#rhBikeModelCustom')?.remove();
      const mi=document.createElement('input');mi.id='rhBikeModelCustom';mi.placeholder='Motorcycle model';mi.style.marginTop='8px';model.insertAdjacentElement('afterend',mi);
    }
    return;
  }
  if(!value)return;
  const opt=document.createElement('option');opt.value=value;opt.textContent=value;make.appendChild(opt);make.value=value;
  wrap?.remove();
  if(typeof originalBikeChanged==='function')await originalBikeChanged('make');
  setTimeout(decorateSetup,0);
};

function decorateSetup(){
  const make=document.querySelector('#rhBikeMake');if(!make)return;
  rebuildMajorMakeSelect();
  document.querySelectorAll('.rh-catalog-source').forEach(x=>x.remove());
  const hint=document.querySelector('.rh-bike-profile-hint');
  if(hint){
    if(/Global make\/model|without a verified detailed profile/i.test(hint.textContent||''))hint.remove();
    else hint.textContent='Verified motorcycle data is available for this model.';
  }
  const grid=document.querySelector('.rh-bike-setup-grid');
  if(grid&&!grid.querySelector('.rh-accent-field')){
    const field=document.createElement('div');field.className='field rh-accent-field';
    const current=state().ui?.accentColor||deriveAccent(document.querySelector('#rhBikeColour')?.value||bike().colour);
    field.innerHTML=`<label>RIDER HUB ACCENT</label><div class="rh-accent-control"><input id="rhAccentColor" type="color" value="${esc(current)}"><span>Highlights follow your bike colour. Tap the swatch if you want to adjust it.</span></div>`;
    grid.appendChild(field);
    field.querySelector('#rhAccentColor').addEventListener('input',e=>{e.currentTarget.dataset.manual='1';applyAccent(e.currentTarget.value)});
  }
  const colour=document.querySelector('#rhBikeColour');
  if(colour&&!colour.dataset.rhAccentBound){
    colour.dataset.rhAccentBound='1';
    const update=()=>{const picker=document.querySelector('#rhAccentColor');if(picker&&!picker.dataset.manual){picker.value=deriveAccent(colour.value);applyAccent(picker.value)}};
    colour.addEventListener('change',update);colour.addEventListener('input',update);
  }
  const primary=document.querySelector('.rh-bike-setup.gate .rh-auth-actions .primary');
  if(primary)primary.textContent='Continue';
}

const originalBikeChanged=window.rhBikeSetupChanged;
window.rhBikeSetupChanged=async function(level){
  const make=document.querySelector('#rhBikeMake');
  if(level==='make'&&make?.value==='__other__'){await showOtherManufacturers();return}
  const out=typeof originalBikeChanged==='function'?await originalBikeChanged.apply(this,arguments):undefined;
  setTimeout(decorateSetup,0);return out;
};
const originalOpenBike=window.openPublicBikeSetup;
if(typeof originalOpenBike==='function')window.openPublicBikeSetup=function(){const out=originalOpenBike.apply(this,arguments);setTimeout(decorateSetup,0);setTimeout(decorateSetup,220);return out};
const originalRequireBike=window.riderHubRequireBikeSetup;
if(typeof originalRequireBike==='function')window.riderHubRequireBikeSetup=function(){const out=originalRequireBike.apply(this,arguments);setTimeout(decorateSetup,0);setTimeout(decorateSetup,220);return out};

window.riderHubManualSetupPending=false;
function ownerManualKey(){
  const b=bike();
  return `owner_manual_${[b.manufacturer,b.model,b.year].map(x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,'_')).filter(Boolean).join('_')||'motorcycle'}`;
}
window.riderHubManualSetupNeeded=()=>!!(profile().publicUser&&profile().bikeConfigured&&profile().manualPromptCompleted===false);
function manualWhyHtml(){
  return `<div class="rh-manual-why"><strong>Why Rider Hub asks for this</strong><p>Your owner's manual is the best model/year-specific source for specifications and maintenance. Rider Hub can read searchable PDF text to fill high-confidence details such as engine size, fuel-tank capacity, transmission, tyres, brakes, drive-chain intervals and service milestones. It will not invent values it cannot find.</p></div>`;
}
function driveStatusHtml(){
  const connected=typeof window.cloudSyncConnected==='function'&&window.cloudSyncConnected();
  const label=typeof window.cloudSyncLabel==='function'?window.cloudSyncLabel():'Google Drive not connected';
  return `<div class="rh-drive-inline ${connected?'connected':''}"><div><strong>${connected?'Private-file backup ready':'Back up the manual to your Google Drive'}</strong><span>${esc(label)}</span></div>${connected?'':'<button type="button" class="secondary" onclick="rhConnectDriveForManual()">Connect Drive</button>'}</div>`;
}
window.riderHubShowManualSetupStep=function(){
  const shell=document.querySelector('#rhAuthShell'),stage=document.querySelector('#rhAuthStage');if(!shell||!stage)return;
  window.riderHubManualSetupPending=true;shell.classList.add('active');
  stage.innerHTML=`<div class="rh-slide-kicker">OWNER'S MANUAL</div><h1>Add your motorcycle manual.</h1><p>Optional, but recommended before Rider Hub builds maintenance information around your bike.</p>${manualWhyHtml()}${driveStatusHtml()}<div class="rh-manual-upload"><input id="rhSetupManualFile" type="file" accept="application/pdf,.pdf" hidden onchange="rhManualFileChosen(this)"><button type="button" class="secondary full" onclick="document.querySelector('#rhSetupManualFile').click()">Choose owner's manual PDF</button><div id="rhSetupManualName" class="caption">No PDF selected</div></div><div class="rh-auth-actions"><button type="button" onclick="rhSkipOwnerManual()">Skip / do later</button><button id="rhSetupManualContinue" type="button" class="primary" onclick="rhUploadOwnerManualAndContinue()" disabled>Upload & continue</button></div>`;
};
window.rhConnectDriveForManual=async()=>{await window.requestDriveAccess?.(true);window.riderHubShowManualSetupStep()};
window.rhManualFileChosen=function(input){const f=input?.files?.[0];const label=document.querySelector('#rhSetupManualName'),btn=document.querySelector('#rhSetupManualContinue');if(label)label.textContent=f?.name||'No PDF selected';if(btn)btn.disabled=!f};
function finishManualGate(deferred=false){
  const p=profile();p.manualPromptCompleted=true;p.manualDeferred=!!deferred;window.riderHubManualSetupPending=false;
  if(typeof window.save==='function')window.save();
  document.querySelector('#rhAuthShell')?.classList.remove('active');
  if(typeof window.setPage==='function')window.setPage('home',false);
  applyStoredAccent();
}
window.rhSkipOwnerManual=()=>finishManualGate(true);

function applyManualResult(result,file,key){
  const b=bike(),fields=result?.fields||{};
  b.ownerManualKey=key;b.ownerManualName=file?.name||'Owner manual.pdf';b.ownerManualAddedAt=new Date().toISOString();b.ownerManualStatus=result?.status||'saved';
  b.manualPageCount=Number(result?.pageCount||0);b.manualSources={};b.manualServiceMilestones=Array.isArray(result?.serviceMilestones)?result.serviceMilestones:[];
  const missing=v=>!v||v==='Not added'||v==='—'||v==='Add Owner’s Manual'||v==="Add Owner's Manual";
  for(const field of ['engine','braking','transmission','fuelTank','tyres']){
    const found=fields[field];if(!found)continue;
    b.manualSources[field]=found;
    if(missing(b[field]))b[field]=found.value;
  }
  if(fields.chainIntervalKm){b.chainIntervalKm=Number(fields.chainIntervalKm.value||0);b.manualSources.chainIntervalKm=fields.chainIntervalKm}
  if(b.manualServiceMilestones.length){
    const next=b.manualServiceMilestones.find(x=>Number(x)>Number(b.odo||0));
    if(next)b.nextServiceKm=Number(next);
  }
  b.manualMaintenance=Array.isArray(result?.maintenance)?result.maintenance:[];
  b.manualWarnings=Array.isArray(result?.warnings)?result.warnings:[];
  b.manualProcessedAt=new Date().toISOString();
}
async function saveAndProcessManual(file){
  const key=ownerManualKey();
  if(typeof window.savePrivateDoc!=='function')throw new Error('Private file storage is unavailable');
  await window.savePrivateDoc(key,file);
  let result;
  try{
    if(typeof window.riderHubProcessOwnerManual!=='function')throw new Error('Manual reader is unavailable');
    result=await window.riderHubProcessOwnerManual(file);
  }catch(e){
    console.warn('Owner manual processing failed',e);
    result={status:'saved',pageCount:0,fields:{},serviceMilestones:[],maintenance:[],warnings:[e?.message||'The manual was saved but could not be processed automatically.']};
  }
  applyManualResult(result,file,key);
  return result;
}
window.rhUploadOwnerManualAndContinue=async function(){
  const input=document.querySelector('#rhSetupManualFile'),file=input?.files?.[0],btn=document.querySelector('#rhSetupManualContinue');
  if(!file)return window.toast?.('Choose an owner’s manual PDF');
  if(btn){btn.disabled=true;btn.textContent='Reading manual…'}
  try{
    const result=await saveAndProcessManual(file);
    window.toast?.(result.status==='processed'?'Owner’s manual added and processed':'Owner’s manual saved');
    finishManualGate(false);
  }catch(e){
    window.toast?.(e?.message||'Could not save the owner’s manual');
    if(btn){btn.disabled=false;btn.textContent='Upload & continue'}
  }
};

const baseSaveBike=window.rhSaveApprovedBike;
if(typeof baseSaveBike==='function')window.rhSaveApprovedBike=function(gate=false){
  const s=state();s.profile=s.profile||{};s.ui=s.ui||{};
  if(gate){s.profile.manualPromptCompleted=false;s.profile.manualDeferred=false;window.riderHubManualSetupPending=true}
  const picker=document.querySelector('#rhAccentColor');
  const selectedColour=document.querySelector('#rhBikeColour')?.value||bike().colour||'';
  const accent=picker?.value||deriveAccent(selectedColour);
  const result=baseSaveBike.apply(this,arguments);
  state().ui=state().ui||{};state().ui.accentColor=accent;applyAccent(accent);
  if(typeof window.save==='function')window.save();
  if(gate)setTimeout(()=>window.riderHubShowManualSetupStep(),0);
  return result;
};

function manualSourceBadge(field){
  const src=bike().manualSources?.[field];if(!src?.page)return '';
  return `<small class="rh-source-badge">Owner's manual · p. ${Number(src.page)}</small>`;
}
function addManualButtonAndData(root){
  if(!root||!profile().bikeConfigured)return;
  const infoHead=[...root.querySelectorAll('.section-head')].find(x=>/Bike information/i.test(x.textContent||''));
  if(infoHead){
    let actions=infoHead.querySelector('.rh-bike-head-actions');
    if(!actions){
      actions=document.createElement('div');actions.className='rh-bike-head-actions';
      const existing=[...infoHead.children].filter(x=>x.tagName==='BUTTON');for(const b of existing)actions.appendChild(b);
      const btn=document.createElement('button');btn.className='secondary';btn.onclick=()=>window.openOwnerManualManager();actions.prepend(btn);infoHead.appendChild(actions);
    }
    const btn=actions.querySelector('button');if(btn)btn.textContent=bike().ownerManualKey?"Owner's manual":"Add Owner's Manual";
  }
  const specMap={ENGINE:'engine',BRAKING:'braking',TRANSMISSION:'transmission','FUEL TANK':'fuelTank',TYRES:'tyres'};
  root.querySelectorAll('.bike-info-grid .info').forEach(card=>{
    const label=card.querySelector('label')?.textContent?.trim().toUpperCase(),field=specMap[label];if(!field)return;
    const val=card.querySelector('b');if(!val)return;
    if(!bike().ownerManualKey&&/^(Not added|—)$/i.test(val.textContent.trim())){
      val.textContent="Add Owner's Manual";card.classList.add('rh-manual-missing');card.onclick=()=>window.openOwnerManualManager();
    }else{
      card.classList.remove('rh-manual-missing');
      card.querySelector('.rh-source-badge')?.remove();
      const badge=manualSourceBadge(field);if(badge)val.insertAdjacentHTML('afterend',badge);
    }
  });
  root.querySelector('.rh-manual-derived-card')?.remove();
  if(bike().ownerManualKey){
    const data=bike().manualServiceMilestones||[],chain=bike().chainIntervalKm||0,warnings=bike().manualWarnings||[];
    const block=document.createElement('div');block.className='rh-manual-derived-card';
    block.innerHTML=`<div class="section-head"><div><div class="kicker">OWNER'S MANUAL</div><h2>Manual-based maintenance</h2></div></div><div class="card list">${chain?`<div class="listrow"><div class="ico">⛓</div><div><strong>Drive-chain interval</strong><p>${Number(chain).toLocaleString('en-IN')} km${bike().manualSources?.chainIntervalKm?.page?` · manual p. ${Number(bike().manualSources.chainIntervalKm.page)}`:''}</p></div><span class="pill good">MANUAL</span></div>`:''}${data.length?`<div class="listrow"><div class="ico">🔧</div><div><strong>Service milestones found</strong><p>${data.slice(0,10).map(x=>Number(x).toLocaleString('en-IN')+' km').join(' · ')}</p></div><span class="pill good">MANUAL</span></div>`:''}${!chain&&!data.length?`<div class="listrow"><div class="ico">▤</div><div><strong>Manual saved</strong><p>${esc(warnings[0]||'No maintenance interval was extracted automatically. You can still open the manual any time.')}</p></div><span class="pill soon">REVIEW</span></div>`:''}</div>`;
    const serviceHead=[...root.querySelectorAll('.section-head')].find(x=>/SERVICE HISTORY/i.test(x.textContent||''));
    if(serviceHead)serviceHead.before(block);else root.appendChild(block);
  }
}

window.openOwnerManualManager=function(){
  if(!profile().bikeConfigured)return window.openPublicBikeSetup?.();
  const b=bike(),has=!!b.ownerManualKey,drive=typeof window.cloudSyncLabel==='function'?window.cloudSyncLabel():'Google Drive not connected';
  const found=Object.entries(b.manualSources||{}).filter(([,v])=>v?.value);
  window.openModal?.(`<div class="modalhead"><div><div class="kicker">OWNER'S MANUAL</div><h3>${has?'Motorcycle manual':'Add owner’s manual'}</h3><p class="caption">${esc(b.name||'Your motorcycle')}</p></div><button class="round" onclick="closeModal()">×</button></div>${manualWhyHtml()}<div class="routecard"><strong>${has?esc(b.ownerManualName||'Owner manual.pdf'):'No manual added yet'}</strong><p>${has?`Saved privately · ${esc(drive)}`:'Upload a searchable PDF now, or do it later.'}</p></div>${found.length?`<div class="rh-manual-found">${found.map(([k,v])=>`<div><strong>${esc(k)}</strong><span>${esc(v.value)}${v.page?` · p. ${Number(v.page)}`:''}</span></div>`).join('')}</div>`:''}<div class="grid2" style="margin-top:10px">${has?`<button class="secondary" onclick="rhOpenOwnerManual()">Open manual</button>`:'<button class="secondary" onclick="requestDriveAccess(true)">Connect Drive</button>'}<button class="primary" onclick="openOwnerManualUpload()">${has?'Replace manual':'Upload manual'}</button></div>`);
};
window.openOwnerManualUpload=function(){
  window.openModal?.(`<div class="modalhead"><div><div class="kicker">OWNER'S MANUAL</div><h3>Upload PDF</h3><p class="caption">${esc(bike().name||'Your motorcycle')}</p></div><button class="round" onclick="closeModal()">×</button></div>${manualWhyHtml()}${driveStatusHtml()}<input id="rhManualModalFile" type="file" accept="application/pdf,.pdf" hidden onchange="document.querySelector('#rhManualModalName').textContent=this.files?.[0]?.name||'No PDF selected'"><button class="secondary full" onclick="document.querySelector('#rhManualModalFile').click()">Choose owner's manual PDF</button><div id="rhManualModalName" class="caption" style="margin-top:8px">No PDF selected</div><button class="primary full" style="margin-top:12px" onclick="rhSaveOwnerManualFromModal()">Save & process manual</button>`);
};
window.rhSaveOwnerManualFromModal=async function(){
  const file=document.querySelector('#rhManualModalFile')?.files?.[0];if(!file)return window.toast?.('Choose an owner’s manual PDF');
  try{await saveAndProcessManual(file);profile().manualPromptCompleted=true;profile().manualDeferred=false;window.save?.();window.closeModal?.();window.renderBike?.();window.toast?.('Owner’s manual updated')}
  catch(e){window.toast?.(e?.message||'Could not save manual')}
};
window.rhOpenOwnerManual=async function(){
  const key=bike().ownerManualKey;if(!key)return;
  const f=await window.getPrivateDoc?.(key);if(!f)return window.toast?.('Manual file is not available on this device. Connect Drive and try again.');
  window.open(URL.createObjectURL(f),'_blank','noopener');
};

function ensureCustomDocs(){const s=state();s.customDocuments=Array.isArray(s.customDocuments)?s.customDocuments:[];return s.customDocuments}
function docMeta(id){
  const standard=STANDARD_DOCS.find(x=>x.id===id);if(standard)return standard;
  return ensureCustomDocs().find(x=>x.id===id)||null;
}
function renderDocumentVault(root){
  root.querySelectorAll('.rh-document-vault').forEach(x=>x.remove());
  const docHead=[...root.querySelectorAll('.section-head')].find(x=>/DOCUMENTS/i.test(x.textContent||''));if(docHead){
    let n=docHead;while(n){const next=n.nextElementSibling;n.remove();n=next}
  }
  const custom=ensureCustomDocs(),primary=STANDARD_DOCS.filter(x=>x.primary);
  const box=document.createElement('div');box.className='rh-document-vault';
  box.innerHTML=`<div class="section-head"><div><div class="kicker">DOCUMENTS</div><h2>Document vault</h2></div><button class="secondary" onclick="openAddCustomDocument()">+ Custom</button></div><div class="card list">${primary.map(d=>`<div class="listrow" onclick="openRiderHubDocument('${d.id}')" style="cursor:pointer"><div class="ico">▤</div><div><strong>${esc(d.name)}</strong><p>${esc(d.desc)}</p></div><span class="pill good">PRIVATE</span></div>`).join('')}</div><button class="secondary full rh-more-documents" onclick="openMoreRiderHubDocuments()">More documents${custom.length?` · ${custom.length} custom`:''}</button><div class="rh-doc-storage-note"><strong>Private files</strong><span>${esc(typeof window.cloudSyncConnected==='function'&&window.cloudSyncConnected()?'Backed up in My Drive / Rider Hub when saved.':'Saved on this device. Connect Google Drive to back them up to My Drive / Rider Hub.')}</span></div>`;
  root.appendChild(box);
}
window.openRiderHubDocument=function(id){
  const d=docMeta(id);if(!d)return;
  const connected=typeof window.cloudSyncConnected==='function'&&window.cloudSyncConnected();
  window.openModal?.(`<div class="modalhead"><div><div class="kicker">DOCUMENT</div><h3>${esc(d.name)}</h3><p class="caption">${esc(d.desc||'Custom private document')}</p></div><button class="round" onclick="closeModal()">×</button></div><div class="routecard"><strong>Private storage</strong><p>${connected?'This file backs up to your own Google Drive / Rider Hub / Documents folder.':'This file stays on this device until you connect Google Drive.'}</p></div><div class="grid2"><button class="secondary" onclick="rhOpenDocumentFile('${esc(id)}')">Open file</button><button class="primary" onclick="openRiderHubDocPicker('${esc(id)}')">Attach / replace</button></div>${d.custom?`<button class="danger full" style="margin-top:10px" onclick="deleteCustomDocument('${esc(id)}')">Delete custom document</button>`:''}`);
};
window.openMoreRiderHubDocuments=function(){
  const more=STANDARD_DOCS.filter(x=>!x.primary),custom=ensureCustomDocs();
  window.openModal?.(`<div class="modalhead"><div><div class="kicker">DOCUMENT VAULT</div><h3>More documents</h3></div><button class="round" onclick="closeModal()">×</button></div><div class="card list">${more.map(d=>`<div class="listrow" onclick="openRiderHubDocument('${d.id}')" style="cursor:pointer"><div class="ico">▤</div><div><strong>${esc(d.name)}</strong><p>${esc(d.desc)}</p></div><span class="pill good">PRIVATE</span></div>`).join('')}${custom.map(d=>`<div class="listrow" onclick="openRiderHubDocument('${esc(d.id)}')" style="cursor:pointer"><div class="ico">＋</div><div><strong>${esc(d.name)}</strong><p>${esc(d.desc||'Custom document')}</p></div><span class="pill soon">CUSTOM</span></div>`).join('')}</div><button class="primary full" style="margin-top:10px" onclick="openAddCustomDocument()">+ Add custom document</button>`);
};
window.openAddCustomDocument=function(){
  window.openModal?.(`<div class="modalhead"><div><div class="kicker">CUSTOM DOCUMENT</div><h3>Add document</h3><p class="caption">Use any name that makes sense to you.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="field"><label>DOCUMENT NAME</label><input id="rhCustomDocName" placeholder="Roadside assistance, permit, receipt…"></div><div class="field"><label>NOTE · OPTIONAL</label><input id="rhCustomDocDesc" placeholder="What this document is for"></div><button class="primary full" style="margin-top:12px" onclick="saveCustomDocument()">Continue to file</button>`);
};
window.saveCustomDocument=function(){
  const name=document.querySelector('#rhCustomDocName')?.value.trim();if(!name)return window.toast?.('Add a document name');
  const desc=document.querySelector('#rhCustomDocDesc')?.value.trim()||'Custom private document';
  const item={id:'custom_'+Date.now().toString(36),name,desc,custom:true,createdAt:new Date().toISOString()};
  ensureCustomDocs().push(item);window.save?.();window.openRiderHubDocPicker(item.id);
};
window.openRiderHubDocPicker=function(id){
  const d=docMeta(id);if(!d)return;
  window.openModal?.(`<div class="modalhead"><div><div class="kicker">PRIVATE FILE</div><h3>${esc(d.name)}</h3><p class="caption">The file is account-scoped on this device and backs up to your own Rider Hub Drive folder after Drive is connected.</p></div><button class="round" onclick="closeModal()">×</button></div><input id="rhDocFile" type="file" accept="${FILE_ACCEPT}" hidden onchange="document.querySelector('#rhDocFileName').textContent=this.files?.[0]?.name||'No file selected'"><button class="secondary full" onclick="document.querySelector('#rhDocFile').click()">Choose file</button><div id="rhDocFileName" class="caption" style="margin-top:8px">No file selected</div><div class="grid2" style="margin-top:12px"><button class="secondary" onclick="requestDriveAccess(true)">Connect Drive</button><button class="primary" onclick="saveRiderHubDocumentFile('${esc(id)}')">Save file</button></div>`);
};
window.saveRiderHubDocumentFile=async function(id){
  const file=document.querySelector('#rhDocFile')?.files?.[0];if(!file)return window.toast?.('Choose a file');
  try{await window.savePrivateDoc?.(id,file);const d=docMeta(id);if(d){d.fileName=file.name;d.updatedAt=new Date().toISOString()}window.save?.();window.closeModal?.();window.renderBike?.();window.toast?.(window.cloudSyncConnected?.()?'Saved and backed up to Google Drive':'Saved on device · connect Drive for backup')}
  catch(e){window.toast?.(e?.message||'Could not save file')}
};
window.rhOpenDocumentFile=async function(id){
  const f=await window.getPrivateDoc?.(id);if(!f)return window.toast?.('No file attached yet');
  window.open(URL.createObjectURL(f),'_blank','noopener');
};
window.deleteCustomDocument=async function(id){
  const d=docMeta(id);if(!d?.custom)return;
  await window.deletePrivateDoc?.(id).catch(()=>{});
  const list=ensureCustomDocs(),i=list.findIndex(x=>x.id===id);if(i>=0)list.splice(i,1);
  window.save?.();window.closeModal?.();window.renderBike?.();window.toast?.('Custom document deleted');
};

function enhanceBike(){
  const root=document.querySelector('#bike');if(!root)return;
  addManualButtonAndData(root);renderDocumentVault(root);
}
const baseRenderBike=window.renderBike;
if(typeof baseRenderBike==='function')window.renderBike=function(){const out=baseRenderBike.apply(this,arguments);enhanceBike();applyStoredAccent();return out};

function enhanceMore(){
  const root=document.querySelector('#more');if(!root)return;
  const logout=[...root.querySelectorAll('button')].find(b=>/Log out/i.test(b.textContent||''));
  if(logout&&!root.querySelector('.rh-delete-account-card')){
    const del=document.createElement('button');del.className='more-card rh-delete-account-card';del.onclick=()=>window.openDeleteRiderHubAccount?.();
    del.innerHTML='<b>×</b><span><strong>Delete account</strong><small>Permanently remove this Rider Hub account</small></span>';
    logout.insertAdjacentElement('afterend',del);
  }
}
const baseRenderMore=window.renderMore;
if(typeof baseRenderMore==='function')window.renderMore=function(){const out=baseRenderMore.apply(this,arguments);enhanceMore();applyStoredAccent();return out};

window.openStorageInfo=function(){
  const status=typeof window.riderHubFirebaseSyncStatus==='function'?window.riderHubFirebaseSyncStatus():null,drive=typeof window.cloudSyncLabel==='function'?window.cloudSyncLabel():'Google Drive not connected';
  window.openModal?.(`<div class="modalhead"><div><div class="kicker">FILES & STORAGE</div><h3>Your Rider Hub data</h3><p class="caption">App data and private files use separate storage.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="rh-service-grid"><div class="rh-service-card"><strong>Rider Hub app data</strong><p>${esc(status?.label||'Local copy')}</p></div><div class="rh-service-card"><strong>Private files</strong><p>${esc(drive)}</p></div></div><div class="routecard"><strong>Google Drive location</strong><p>My Drive / Rider Hub / Documents<br>My Drive / Rider Hub / Owner Manuals</p></div><div class="grid2"><button class="secondary" onclick="riderHubFirebaseSyncNow()">Sync app data</button><button class="primary" onclick="requestDriveAccess(true)">Connect / refresh Drive</button></div>`);
};

const baseRender=window.render;
if(typeof baseRender==='function')window.render=function(){const out=baseRender.apply(this,arguments);applyStoredAccent();enhanceMore();enhanceBike();return out};
window.addEventListener('riderhub-sync-status',()=>setTimeout(()=>{applyStoredAccent();enhanceMore();if(state().ui?.page==='bike')enhanceBike()},50));
applyStoredAccent();setTimeout(()=>{decorateSetup();enhanceMore();enhanceBike()},300);
})();
