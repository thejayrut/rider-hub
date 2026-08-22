/* Small, isolated fixes for the approved feature layer. */
(()=>{
'use strict';
const escR=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Keep verified manual sources current. */
const catalog=window.RIDER_HUB_MOTORCYCLE_CATALOG;
if(catalog?.profiles?.['tvs|ronin'])catalog.profiles['tvs|ronin'].manualUrl='https://www.tvsmotor.com/-/media/Feature/Owners/UserManual2026/TVS-Ronin.pdf';
const hunterManual=variant=>String(variant||'').toLowerCase()==='retro'
  ?'https://www.royalenfield.com/content/dam/royal-enfield/hunter-350/owners-manual/hunter-350-single-channel.pdf'
  :'https://www.royalenfield.com/content/dam/royal-enfield/hunter-350/owners-manual/hunter-350-dual-channel.pdf';

const priorChange=window.rhBikeSetupChanged;
window.rhBikeSetupChanged=async function(level){
  const make=document.querySelector('#rhBikeMake');
  const model=document.querySelector('#rhBikeModel');
  if(level==='make'&&make?.value==='__other__'){
    document.querySelector('#rhBikeMakeCustom')?.remove();
    const custom=document.createElement('input');custom.id='rhBikeMakeCustom';custom.placeholder='Manufacturer';custom.style.marginTop='8px';make.insertAdjacentElement('afterend',custom);
    if(model){model.innerHTML='<option value="__other__" selected>Other / not listed</option>';document.querySelector('#rhBikeModelCustom')?.remove();const m=document.createElement('input');m.id='rhBikeModelCustom';m.placeholder='Motorcycle model';m.style.marginTop='8px';model.insertAdjacentElement('afterend',m)}
    const variant=document.querySelector('#rhBikeVariant'),colour=document.querySelector('#rhBikeColour');if(variant)variant.value='';if(colour)colour.value='';return;
  }
  if(level==='model'&&model?.value==='__other__'){
    document.querySelector('#rhBikeModelCustom')?.remove();const m=document.createElement('input');m.id='rhBikeModelCustom';m.placeholder='Motorcycle model';m.style.marginTop='8px';model.insertAdjacentElement('afterend',m);
    const variant=document.querySelector('#rhBikeVariant'),colour=document.querySelector('#rhBikeColour');if(variant)variant.value='';if(colour)colour.value='';return;
  }
  if(typeof priorChange==='function')return priorChange.apply(this,arguments);
};

/* Service history belongs to the selected motorcycle. Preserve it while editing
   the same bike, but do not carry it across to a different make/model. */
const baseSaveBike=window.rhSaveApprovedBike;
if(typeof baseSaveBike==='function')window.rhSaveApprovedBike=function(gate=false){
  const before={make:window.state?.bike?.manufacturer||'',model:window.state?.bike?.model||''};
  const result=baseSaveBike.apply(this,arguments);
  const b=window.state?.bike;if(!b)return result;
  const changed=!!(before.make&&before.model&&(before.make!==b.manufacturer||before.model!==b.model));
  if(changed){
    b.serviceHistory=[];
    b.firstService={odo:0,date:'Not added',cost:0};
    b.purchase='Not added';
    b.insurance='Not added';
    b.chainLast=Number(b.odo||0);
  }
  if(String(b.manufacturer||'').toLowerCase()==='tvs'&&String(b.model||'').toLowerCase()==='ronin')b.manualUrl='https://www.tvsmotor.com/-/media/Feature/Owners/UserManual2026/TVS-Ronin.pdf';
  if(String(b.manufacturer||'').toLowerCase()==='royal enfield'&&String(b.model||'').toLowerCase()==='hunter 350')b.manualUrl=hunterManual(b.variant);
  if((changed||b.manualUrl)&&typeof window.save==='function')window.save();
  return result;
};

let lastBackfillKey='';
function backfillKnownBike(){
  if(!window.state?.profile?.publicUser||!window.state?.profile?.bikeConfigured)return;
  const b=window.state.bike||{},u=typeof window.riderHubFirebaseUser==='function'?window.riderHubFirebaseUser():null,key=`${u?.uid||'local'}|${b.manufacturer||''}|${b.model||''}|${b.variant||''}`;
  if(key===lastBackfillKey)return;
  const entry=typeof window.riderHubMotorcycleProfile==='function'?window.riderHubMotorcycleProfile(b.manufacturer,b.model):null;if(!entry){lastBackfillKey=key;return}
  const spec=entry.specs||{};let changed=false;
  const put=(field,value)=>{if(value&&(!b[field]||b[field]==='Not added'||b[field]==='—')){b[field]=value;changed=true}};
  put('engine',spec.engine);put('transmission',spec.transmission);put('fuelTank',spec.fuelTank);put('braking',entry.brakingByVariant?.[b.variant]);put('tyres',entry.tyresByVariant?.[b.variant]||spec.tyres);put('manualUrl',entry.manualUrl);put('maintenanceSummary',entry.serviceSummary);
  if(String(b.manufacturer||'').toLowerCase()==='tvs'&&String(b.model||'').toLowerCase()==='ronin'&&b.manualUrl!=='https://www.tvsmotor.com/-/media/Feature/Owners/UserManual2026/TVS-Ronin.pdf'){b.manualUrl='https://www.tvsmotor.com/-/media/Feature/Owners/UserManual2026/TVS-Ronin.pdf';changed=true}
  if(String(b.manufacturer||'').toLowerCase()==='royal enfield'&&String(b.model||'').toLowerCase()==='hunter 350'){const url=hunterManual(b.variant);if(b.manualUrl!==url){b.manualUrl=url;changed=true}}
  if(entry.chainIntervalKm&&!b.chainIntervalKm){b.chainIntervalKm=entry.chainIntervalKm;changed=true}
  if(typeof window.riderHubNextServiceKm==='function'&&(!b.nextServiceKm||b.nextServiceKm<=Number(b.odo||0))){const n=window.riderHubNextServiceKm(entry,b.odo);if(n){b.nextServiceKm=n;changed=true}}
  lastBackfillKey=key;
  if(changed&&typeof window.save==='function')window.save();
}
window.addEventListener('riderhub-sync-status',event=>{if(event?.detail?.kind==='signedout')lastBackfillKey='';setTimeout(backfillKnownBike,350)});
setTimeout(backfillKnownBike,1200);

/* Keep the approved Gear Garage design, but make the editor account-aware so
   another Google user never sees a hard-coded rider name as their default. */
const baseGearEditor=window.openGearEditor;
window.openGearEditor=function(id=null){
  if(!window.state?.profile?.publicUser||typeof window.openModal!=='function')return typeof baseGearEditor==='function'?baseGearEditor.apply(this,arguments):undefined;
  const x=id?(window.state.gear||[]).find(g=>g.id===id):null;
  const accountName=String(window.state.profile?.account?.name||'Me').trim()||'Me';
  const owners=[x?.owner,accountName,'Mom','Bike / Shared'].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);
  window.openModal(`<div class="modalhead"><div><div class="kicker">GEAR GARAGE</div><h3>${x?'Edit item':'Add item'}</h3></div><button class="round" onclick="closeModal()">×</button></div><div class="field"><label>NAME</label><input id="gName" value="${escR(x?.name||'')}"></div><div class="grid2"><div class="field"><label>CATEGORY</label><select id="gCat">${['Riding Gear','Luggage','Electronics','Bike Accessories','Camera & Mounts','Cleaning & Care'].map(v=>`<option ${x?.category===v?'selected':''}>${escR(v)}</option>`).join('')}</select></div><div class="field"><label>OWNER</label><select id="gOwner">${owners.map(v=>`<option ${x?.owner===v||(!x&&v===accountName)?'selected':''}>${escR(v)}</option>`).join('')}</select></div></div><div class="grid2"><div class="field"><label>STATUS</label><select id="gStatus"><option value="owned" ${x?.status==='owned'?'selected':''}>Bought</option><option value="planned" ${x?.status==='planned'?'selected':''}>Will Buy</option></select></div><div class="field"><label>QUANTITY</label><input id="gQty" inputmode="numeric" value="${Number(x?.qty||1)}"></div></div><div class="field"><label>PRICE ₹ · leave blank if TBD</label><input id="gAmount" inputmode="decimal" value="${x?.amount??''}"></div><div class="field"><label>NOTE</label><textarea id="gNote">${escR(x?.note||'')}</textarea></div><div class="modal-actions"><button class="secondary" onclick="${x?`openGearDelete('${escR(x.id)}')`:'closeModal()'}">${x?'Delete':'Cancel'}</button><button class="confirm" onclick="saveGearItem('${escR(x?.id||'')}')">✓ Save</button></div>`);
};
})();
