/* Rider Hub Maps Demo Key adapter. No billing key is committed to GitHub. */
(()=>{
const KEY='riderhub_maps_demo_key',CACHE='riderhub_google_weather_cache',BANSWARA={lat:23.5461,lng:74.4347};
const demoKey=()=>localStorage.getItem(KEY)||localStorage.getItem('rh_traffic_key')||'';
const weatherUrl=(path,key,extra={})=>{const q=new URLSearchParams({key,'location.latitude':BANSWARA.lat,'location.longitude':BANSWARA.lng,unitsSystem:'METRIC',...extra});return`https://weather.googleapis.com/v1/${path}?${q}`};
async function json(url,opt){const r=await fetch(url,opt);if(!r.ok)throw new Error(`${r.status} ${await r.text().catch(()=>r.statusText)}`);return r.json()}
window.openMapsDemoSetup=function(after=''){
 const existing=demoKey();
 openModal(`<div class="modalhead"><div><div class="kicker">₹0 MAPS PROTOTYPE</div><h3>Connect Maps Demo Key</h3><p class="caption">Paste the no-billing Demo Key you created. It stays only in this browser and is never saved to GitHub.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="field"><label>MAPS DEMO KEY</label><input id="mapsDemoKey" type="password" value="${esc(existing)}" placeholder="Paste demo key"></div><div id="mapsDemoStatus" class="caption" style="margin-top:10px"></div><div class="modal-actions"><button class="secondary" onclick="localStorage.removeItem('${KEY}');localStorage.removeItem('rh_traffic_key');$('#mapsDemoStatus').textContent='Key removed from this device.'">Remove</button><button class="confirm" onclick="saveMapsDemoKey('${esc(after)}')">✓ Connect</button></div>`)
};
window.saveMapsDemoKey=async function(after=''){
 const k=$('#mapsDemoKey')?.value.trim();if(!k)return toast('Paste the Maps Demo Key');const s=$('#mapsDemoStatus');s.textContent='Checking key…';
 try{await json(weatherUrl('currentConditions:lookup',k));localStorage.setItem(KEY,k);localStorage.removeItem('rh_traffic_key');s.textContent='Connected. Weather and route intelligence are ready.';setTimeout(()=>{closeModal();if(after==='weather')renderWeather(true);if(after==='traffic')openTraffic()},450)}catch(e){s.textContent='Could not validate this Demo Key. '+String(e.message||e).slice(0,130)}
};
window.renderWeather=async function(force=false){
 const el=$('#weatherCard');if(!el)return;const k=demoKey();
 if(!k){el.innerHTML='<div class="weather-top"><div><div class="kicker">LIVE WEATHER</div><strong>Maps Demo Key not connected</strong><div class="caption">Connect your no-billing demo key once to load live Banswara weather.</div></div><button class="secondary" onclick="openMapsDemoSetup(\'weather\')">Connect</button></div>';return}
 el.innerHTML='<div class="weather-top"><div><div class="kicker">LIVE WEATHER</div><strong>'+(force?'Refreshing…':'Loading…')+'</strong></div></div>';
 try{
  const [cur,daily]=await Promise.all([json(weatherUrl('currentConditions:lookup',k)),json(weatherUrl('forecast/days:lookup',k,{days:'10',pageSize:'10'}))]);
  const payload={cur,daily,at:new Date().toISOString()};localStorage.setItem(CACHE,JSON.stringify(payload));paintGoogleWeather(el,payload)
 }catch(e){
  try{const cached=JSON.parse(localStorage.getItem(CACHE)||'null');if(cached){paintGoogleWeather(el,cached,true);return}}catch{}
  el.innerHTML=`<div class="weather-top"><div><div class="kicker">LIVE WEATHER</div><strong>Weather unavailable</strong><div class="caption">${esc(String(e.message||e).slice(0,150))}</div></div><button class="secondary" onclick="renderWeather(true)">Retry</button></div><button class="secondary full" style="margin-top:8px" onclick="openMapsDemoSetup('weather')">Manage Maps Demo Key</button>`
 }
};
function ymd(x){const d=x?.displayDate;if(!d)return'';return`${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`}
function paintGoogleWeather(el,p,cached=false){
 const c=p.cur||{},d=currentDay(),f=(p.daily?.forecastDays||[]).find(x=>ymd(x)===d.date),rain=f?.daytimeForecast?.precipitation?.probability?.percent??f?.nighttimeForecast?.precipitation?.probability?.percent??null,max=f?.maxTemperature?.degrees??f?.daytimeForecast?.maxTemperature?.degrees??null,min=f?.minTemperature?.degrees??f?.nighttimeForecast?.minTemperature?.degrees??null,temp=c.temperature?.degrees??null,desc=c.weatherCondition?.description?.text||'Conditions available';
 el.innerHTML=`<div class="weather-top"><div><div class="kicker">LIVE WEATHER</div><div class="weather-big">${temp==null?'—':Math.round(temp)+'°C'}</div><div class="weather-status">Banswara · ${esc(desc)} · ${cached?'cached · ':''}updated ${new Date(p.at||c.currentTime||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div></div><button class="secondary" onclick="renderWeather(true)">Refresh</button></div><div class="grid3" style="margin-top:10px"><div class="tile"><label>DAY ${d.day} RAIN RISK</label><b>${rain==null?'—':rain+'%'}</b></div><div class="tile"><label>EXPECTED HIGH</label><b>${max==null?'—':Math.round(max)+'°'}</b></div><div class="tile"><label>EXPECTED LOW</label><b>${min==null?'—':Math.round(min)+'°'}</b></div></div>${rain!=null&&rain>=60?'<div class="alert red">High rain probability. Re-check road conditions before departure and use the wet-weather route if needed.</div>':'<div class="alert">Forecasts change. Refresh again before departure.</div>'}`
}
async function compute(seg,traffic){
 const k=demoKey();const body={origin:{address:seg.origin},destination:{address:seg.destination},intermediates:(seg.waypoints||[]).map(address=>({address})),travelMode:'DRIVE',routingPreference:traffic?'TRAFFIC_AWARE':'TRAFFIC_UNAWARE',polylineQuality:'OVERVIEW'};if(traffic)body.extraComputations=['TRAFFIC_ON_POLYLINE'];
 const j=await json('https://routes.googleapis.com/directions/v2:computeRoutes',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':k,'X-Goog-FieldMask':'routes.duration,routes.distanceMeters,routes.travelAdvisory.speedReadingIntervals'},body:JSON.stringify(body)}),r=j.routes?.[0];if(!r)throw new Error('No route returned');return{km:Number(r.distanceMeters||0)/1000,min:Number(String(r.duration||'0s').replace('s',''))/60,traffic}
}
window.openTraffic=function(){
 const k=demoKey();if(!k)return openMapsDemoSetup('traffic');const d=currentDay(),parts=d.segments.filter(s=>!s.backup);
 openModal(`<div class="modalhead"><div><div class="kicker">TRAFFIC / ROUTE</div><h3>Current route intelligence</h3><p class="caption">Uses your no-billing Maps Demo Key. Traffic-aware mode is attempted first; Rider Hub falls back to a basic route instead of faking congestion.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="field"><label>ROUTE PART</label><select id="trafficPart">${parts.map((s,i)=>`<option value="${i}">${esc(s.label)}</option>`).join('')}</select></div><button class="primary full" onclick="checkDemoTraffic()">Check route now</button><div id="trafficDemoResult" class="alert">Ready.</div><button class="secondary full" style="margin-top:8px" onclick="openMapsDemoSetup('traffic')">Manage Maps Demo Key</button>`)
};
window.checkDemoTraffic=async function(){const out=$('#trafficDemoResult'),d=currentDay(),parts=d.segments.filter(s=>!s.backup),seg=parts[Number($('#trafficPart')?.value||0)];out.textContent='Checking route…';try{let r;try{r=await compute(seg,true)}catch{r=await compute(seg,false)}out.innerHTML=`<strong>${r.km.toFixed(0)} km · ${Math.round(r.min)} min</strong><br>${r.traffic?'Traffic-aware ETA returned by Google Routes prototype.':'Basic route estimate returned. Live traffic-aware mode was not available for this request.'}`}catch(e){out.textContent='Route intelligence unavailable: '+String(e.message||e).slice(0,150)}};
})();
