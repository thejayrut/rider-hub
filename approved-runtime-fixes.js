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

let backfilled=false;
function backfillKnownBike(){
  if(backfilled||!window.state?.profile?.publicUser||!window.state?.profile?.bikeConfigured)return;
  const b=window.state.bike||{},entry=typeof window.riderHubMotorcycleProfile==='function'?window.riderHubMotorcycleProfile(b.manufacturer,b.model):null;if(!entry)return;
  const spec=entry.specs||{};let changed=false;
  const put=(key,value)=>{if(value&&(!b[key]||b[key]==='Not added'||b[key]==='—')){b[key]=value;changed=true}};
  put('engine',spec.engine);put('transmission',spec.transmission);put('fuelTank',spec.fuelTank);put('braking',entry.brakingByVariant?.[b.variant]);put('tyres',entry.tyresByVariant?.[b.variant]||spec.tyres);put('manualUrl',entry.manualUrl);put('maintenanceSummary',entry.serviceSummary);
  if(entry.chainIntervalKm&&!b.chainIntervalKm){b.chainIntervalKm=entry.chainIntervalKm;changed=true}
  if(typeof window.riderHubNextServiceKm==='function'&&(!b.nextServiceKm||b.nextServiceKm<=Number(b.odo||0))){const n=window.riderHubNextServiceKm(entry,b.odo);if(n){b.nextServiceKm=n;changed=true}}
  backfilled=true;
  if(changed&&typeof window.save==='function')window.save();
}
window.addEventListener('riderhub-sync-status',()=>setTimeout(backfillKnownBike,350));
setTimeout(backfillKnownBike,1200);
})();
