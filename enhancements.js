/* Rider Hub incremental enhancements: loaded after app.js so these safely extend the stable base. */
(function(){
const baseRenderRides=renderRides;
renderRides=function(){baseRenderRides();injectRideExtras()};
function injectRideExtras(){
 const hero=document.querySelector('#rides .ride-hero'); if(!hero||hero.querySelector('.rh-extra-actions'))return;
 const row=document.createElement('div');row.className='rh-extra-actions';row.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px';
 row.innerHTML='<button class="secondary" onclick="addRideCalendar()">Add trip to calendar</button><button class="secondary" onclick="openDayAudit()">Day-end review</button>';hero.appendChild(row);
}
window.addRideCalendar=function(){
 const start='20260828T000000',end='20260831T000000';
 const q=new URLSearchParams({action:'TEMPLATE',text:'Banswara 3-Day Ronin Adventure',dates:start+'/'+end,details:'Rider Hub trip · TVS Ronin · 28–30 Aug 2026',location:HOME});
 window.open('https://calendar.google.com/calendar/render?'+q.toString(),'_blank','noopener');
};
window.openDayAudit=function(){
 const d=currentDay();const pending=d.tasks.map((t,i)=>({t,i})).filter(x=>!['done','skipped'].includes(status(x.i)));
 openModal(`<div class="modalhead"><div><div class="kicker">DAY-END REVIEW</div><h3>Day ${d.day} checklist</h3><p class="caption">Anything you forgot stays actionable instead of silently disappearing.</p></div><button class="round" onclick="closeModal()">×</button></div>${pending.length?pending.map(x=>`<div class="routecard"><strong>${x.t[0]} · ${esc(x.t[1])}</strong><p>${esc(x.t[2])}</p><div class="grid2"><button class="confirm" onclick="auditSet(${x.i},'done')">Done now</button><button class="secondary" onclick="auditSet(${x.i},'skipped')">Did not do</button></div></div>`).join(''):'<div class="alert">Everything for this day is already accounted for.</div>'}`)
};
window.auditSet=function(i,s){snapshot('day-end review');state.ride.tasks[taskKey(i)]=s;save();closeModal();openDayAudit()};
const baseAudit=dayEndAudit;
dayEndAudit=function(){
 const d=currentDay(),end=new Date(d.date+'T'+d.end+':00');if(Date.now()<end.getTime())return;
 const pending=d.tasks.map((t,i)=>({t,i})).filter(x=>!['done','skipped'].includes(status(x.i)));if(!pending.length)return;
 const sig='audit_notice_'+d.day+'_'+new Date().toISOString().slice(0,10);if(localStorage.getItem(sig))return;localStorage.setItem(sig,'1');
 if(Notification.permission==='granted'){const n=new Notification('Rider Hub · Day '+d.day+' review',{body:`${pending.length} item${pending.length>1?'s':''} still need a decision.`});n.onclick=()=>{window.focus();setPage('rides');setTimeout(openDayAudit,150)}}
 toast(`${pending.length} task${pending.length>1?'s':''} need day-end review`)
};
window.openTraffic=function(){
 const key=localStorage.getItem('rh_traffic_key')||'';
 if(!key){openModal(`<div class="modalhead"><div><div class="kicker">TRAFFIC PROVIDER</div><h3>Connect live Google traffic</h3><p class="caption">Google Maps live traffic requires your own Maps JavaScript API key. Rider Hub stores it only on this device; it is never committed to GitHub.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="field"><label>GOOGLE MAPS JAVASCRIPT API KEY</label><input id="trafficKey" type="password" placeholder="Paste API key"></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Close</button><button class="confirm" onclick="saveTrafficKey()">✓ Connect</button></div>`);return}
 openModal(`<div class="modalhead"><div><div class="kicker">LIVE TRAFFIC</div><h3>Day ${currentDay().day} route traffic</h3><p class="caption">Google Maps TrafficLayer + the first verified route segment.</p></div><button class="round" onclick="closeModal()">×</button></div><div id="trafficMap" style="height:380px;border-radius:16px;overflow:hidden;border:1px solid var(--line);background:#0b0d0f"></div><div class="alert" id="trafficStatus">Loading provider…</div><button class="secondary full" style="margin-top:8px" onclick="disconnectTraffic()">Disconnect traffic provider</button>`);loadGoogleTraffic(key)
};
window.saveTrafficKey=function(){const key=document.querySelector('#trafficKey')?.value.trim();if(!key)return toast('Add an API key');localStorage.setItem('rh_traffic_key',key);closeModal();setTimeout(openTraffic,80)};
window.disconnectTraffic=function(){localStorage.removeItem('rh_traffic_key');closeModal();toast('Traffic provider disconnected')};
window.loadGoogleTraffic=function(key){
 function start(){try{const d=currentDay(),s=d.segments[0],map=new google.maps.Map(document.getElementById('trafficMap'),{zoom:7,center:{lat:23.4,lng:73.6},mapTypeControl:false,streetViewControl:false,fullscreenControl:true});new google.maps.TrafficLayer().setMap(map);const svc=new google.maps.DirectionsService(),ren=new google.maps.DirectionsRenderer({map,suppressMarkers:false});svc.route({origin:s.origin,destination:s.destination,waypoints:s.waypoints.map(location=>({location,stopover:true})),travelMode:google.maps.TravelMode.DRIVING,provideRouteAlternatives:false},(res,st)=>{const x=document.getElementById('trafficStatus');if(st==='OK'){ren.setDirections(res);const legs=res.routes[0].legs||[],km=legs.reduce((a,l)=>a+(l.distance?.value||0),0)/1000,min=legs.reduce((a,l)=>a+(l.duration_in_traffic?.value||l.duration?.value||0),0)/60;x.textContent=`Provider connected · ${km.toFixed(0)} km for this segment · estimated ${Math.round(min)} min. Colored road overlay is live Google traffic.`}else{x.textContent='Google traffic connected, but this route could not be resolved: '+st}})}catch(e){document.getElementById('trafficStatus').textContent='Traffic provider error: '+e.message}}
 if(window.google?.maps){start();return}
 window.__rhTrafficReady=start;const s=document.createElement('script');s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(key)+'&callback=__rhTrafficReady&v=weekly';s.async=true;s.onerror=()=>{const x=document.getElementById('trafficStatus');if(x)x.textContent='Could not load Google Maps. Check API key, billing and Maps JavaScript API permissions.'};document.head.appendChild(s)
};
})();