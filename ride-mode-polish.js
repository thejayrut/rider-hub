/* Small Ride Mode presentation additions that keep imported itinerary context
   visible inside the operational ride screen. */
(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base=window.rhRenderGenericRideMode;if(typeof base!=='function')return;
window.rhRenderGenericRideMode=function(){
  const out=base.apply(this,arguments),root=document.querySelector('#rideModeInner'),id=window.state?.ui?.activeRideId;
  const ride=(window.state?.customRides||[]).find(x=>x.id===id);if(!root||!ride)return out;
  root.querySelector('.rh-mode-context')?.remove();
  const d=ride.days?.[Number(ride.selectedDay||0)]||{},stay=Array.isArray(ride.lodging)?ride.lodging:[];
  if(!stay.length&&!ride.sourceFileKey&&!d.route&&!ride.route)return out;
  const block=document.createElement('div');block.className='rh-mode-context';
  block.innerHTML=`${d.route||ride.route?`<div class="card booking"><div class="kicker">TODAY'S ROUTE</div><h3>${esc(d.route||ride.route)}</h3><button class="secondary full" style="margin-top:9px" onclick="rhRideMap('${esc(ride.id)}')">Open route</button></div>`:''}${stay.length?`<div class="card booking" style="margin-top:10px"><div class="kicker">STAY / BOOKING</div>${stay.slice(0,5).map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}${ride.sourceFileKey?`<button class="secondary full" style="margin-top:10px" onclick="rhOpenRideSourcePdf('${esc(ride.id)}')">Open imported ride PDF</button>`:''}`;
  const weather=root.querySelector('#rhRideModeWeather');if(weather)weather.insertAdjacentElement('afterend',block);else root.appendChild(block);
  return out;
};
})();
