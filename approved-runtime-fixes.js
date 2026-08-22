/* Small, isolated fixes for the approved feature layer. */
(()=>{
'use strict';
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

const priorSaveBike=window.rhSaveApprovedBike;
if(typeof priorSaveBike==='function')window.rhSaveApprovedBike=function(gate=false){
  const before={make:window.state?.bike?.manufacturer||'',model:window.state?.bike?.model||''};
  const out=priorSaveBike.apply(this,arguments);
  const after=window.state?.bike||{};
  const changed=before.make&&before.model&&(before.make!==after.manufacturer||before.model!==after.model);
  if(changed){
    after.purchase='Not added';after.insurance='Not added';after.firstService={odo:0,date:'Not added',cost:0};after.serviceHistory=[];
    if(typeof window.save==='function')window.save();
  }
  return out;
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
  if(entry.chainIntervalKm&&!b.chainIntervalKm){b.chainIntervalKm=entry.chainIntervalKm;changed=true}
  if(typeof window.riderHubNextServiceKm==='function'&&(!b.nextServiceKm||b.nextServiceKm<=Number(b.odo||0))){const n=window.riderHubNextServiceKm(entry,b.odo);if(n){b.nextServiceKm=n;changed=true}}
  lastBackfillKey=key;
  if(changed&&typeof window.save==='function')window.save();
}
window.addEventListener('riderhub-sync-status',event=>{if(event?.detail?.kind==='signedout')lastBackfillKey='';setTimeout(backfillKnownBike,350)});
setTimeout(backfillKnownBike,1200);
})();
