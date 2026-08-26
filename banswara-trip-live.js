(()=>{
'use strict';
const TRIP_ID='ride_banswara_2026';
const REV='banswara-final-2026-08-26-v1';
const APP_KEY='riderhub_stable_v1';
const HOTEL={name:'Hotel Landmark, Banswara',address:'College Road, Opp. COCO Petrol Pump, Banswara, Rajasthan 327001',phone:'9413297333',email:'hotellandmarkbsw@gmail.com',checkIn:'28 Aug 2026 · after 12:00 PM',checkOut:'30 Aug 2026 · before 12:00 PM',room:'Deluxe Room · 1 double bed · Room only',guests:'2 adults',paid:2470,cancellation:'Free cancellation until 28 Aug 2026 · 11:59 AM'};
const $=s=>document.querySelector(s);
const S=()=>window.state||{};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
const persist=()=>{try{localStorage.setItem(APP_KEY,JSON.stringify(S()))}catch{}};
const mapUrl=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
const task=(time,title,note,kind='normal',flags={})=>({time,title,note,status:'upcoming',delay:0,kind,...flags});
const seg=(label,origin,destination,waypoints=[],note='')=>({label,origin,destination,waypoints,note});
const normalizeTitle=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

const FINAL_DAYS=[
 {day:1,date:'2026-08-28',title:'Ahmedabad → Mangarh → Banswara',from:'Ahmedabad',to:'Banswara',character:'Travel day + historical hilltop + relaxed city evening. No meaningful off-road today.',segments:[
   seg('Ahmedabad → Mangarh Dham','Ahmedabad, Gujarat','Mangarh Dham, Rajasthan',[],'Primary route. Use ordinary motorcycle-legal roads.'),
   seg('Mangarh Dham → Hotel Landmark','Mangarh Dham, Rajasthan',HOTEL.address,[],'If the Mangarh corridor is unsafe, skip Mangarh and use the ordinary Godhra–Dahod fallback.'),
   seg('Banswara easy evening',HOTEL.address,HOTEL.address,['Anand Sagar Lake, Banswara','Kalpavriksha, Banswara','Kagdi Pick Up Weir, Banswara','Dialab Lake, Banswara'],'Dialab Lake is optional. Return to the hotel if either rider is tired.')
  ],tasks:[
   task('04:15','Wake / light food','Final tyre, chain, brakes, rain gear, luggage straps, documents and weather check.','safety',{required:true}),
   task('05:00','Leave Ahmedabad','Start early. Keep the first hour calm; do not chase average speed.','ride',{required:true}),
   task('~07:00','Breakfast + Mom break','20–30 min. Light breakfast, water and stretch.','recovery',{required:true}),
   task('~09:15–10:00','Mangarh Dham','Historical hilltop memorial + views. Morning is the quiet target.','stop'),
   task('~12:00','Hotel Landmark check-in','Check in, lunch and remove wet gear.','hotel',{required:true}),
   task('12:30–15:00','REST','Non-negotiable recovery block. Charge camera, phones and intercoms.','recovery',{required:true}),
   task('15:15–16:00','Anand Sagar + Kalpavriksha','Easy quiet cluster; low-effort stop after the highway ride.','stop'),
   task('16:15–17:00','Kagdi Pick Up Weir','Go before the prime sunset leisure crowd.','stop'),
   task('17:10–17:30','Dialab Lake','Only if both riders are still fresh.','optional',{optional:true}),
   task('18:30–19:30','Dinner','Keep it comfortable; avoid a very heavy meal.','food'),
   task('20:00','Fuel + Saturday prep','Fill bike, organize Saturday essentials and charge electronics.','prep',{required:true}),
   task('21:15–21:30','Sleep','Saturday starts very early.','recovery',{required:true})
  ],foodOptions:['Nido Cafe','Brew Berry Cafe','Foodie By Default'],fallback:{title:'Friday route fallback',detail:'If the Mangarh corridor is damaged, waterlogged or unsafe, use the ordinary Godhra–Dahod highway corridor and sacrifice Mangarh. Safety beats keeping one attraction.',route:'Ahmedabad → Godhra → Dahod → Banswara'}},
 {day:2,date:'2026-08-29',title:'Chacha Kota → Mahi Dam → rest → Singpura',from:'Banswara',to:'Banswara',character:'Morning = quiet water and scale. Afternoon = proper recovery. Evening = off-road + waterfall. Do not add another attraction.',segments:[
   seg('Hotel → Chacha Kota','Hotel Landmark, Banswara','Chacha Kota Actual Boating Point, Banswara',['Chacha Kota Tower, Banswara'],'Start with the tower, then the actual boating point. Continue deeper only on safely motorable peninsula roads.'),
   seg('Chacha Kota → Mahi Dam','Chacha Kota Actual Boating Point, Banswara','Mahi Dam, Banswara Rajasthan',[],'Use the public / visitor side on Kakanseja Road. Do not navigate to restricted power-plant infrastructure.'),
   seg('Mahi Dam → Hotel','Mahi Dam, Banswara Rajasthan','Hotel Landmark, Banswara',[],'Return for lunch and the long recovery block.'),
   seg('Hotel → Singpura Waterfall','Hotel Landmark, Banswara','Singpura Waterfall, Ghatol, Banswara, Rajasthan',[],'Enter the rough approach only if rain, trail condition and daylight margin are acceptable.'),
   seg('Singpura → Hotel','Singpura Waterfall, Ghatol, Banswara, Rajasthan','Hotel Landmark, Banswara',[],'Start returning around 17:00. Aim to exit the rough section by 17:30–18:00.')
  ],tasks:[
   task('05:10–05:20','Leave Hotel Landmark','First part is dark. Clean visor, lights on, slower rural pace.','ride',{required:true}),
   task('06:00–06:15','Reach Chacha Kota','Target first-light / sunrise atmosphere.','stop'),
   task('06:00–06:15','Chacha Kota Tower','Quick first look; do not spend the morning here.','stop'),
   task('06:15–06:40','Actual Boating Point','Main backwater / island view. Boating may not operate this early.','stop'),
   task('06:40–08:00','Deep peninsula exploration','Follow proper motorable roads deeper toward the Mahisagar Heart side; turn around when the road becomes sketchy.','explore'),
   task('08:00–09:00','Breakfast + ride','Simple breakfast, then continue to Mahi.','food',{required:true}),
   task('~09:00–10:15','Mahi Dam','Visitor side, wall road if permitted, reservoir panorama, spillway / gates.','stop'),
   task('~10:15','Leave Mahi','Return toward Banswara.','ride'),
   task('~11:00–14:45','Hotel + lunch + REST','Shower, sleep, charge everything, back up footage and inspect the bike.','recovery',{required:true}),
   task('14:45–15:00','Leave for Singpura','Leave early enough that the off-road return stays fully in daylight.','ride',{required:true}),
   task('~15:30','Begin rough approach','Dirt, grass, rock and mud sections — ride to conditions.','offroad'),
   task('~16:15–16:30','Reach waterfall','Two-wheelers can get essentially to the waterfall area on the route used for planning.','stop'),
   task('16:15/16:30–17:00','Waterfall','Enjoy and shoot; stay away from dangerous edges and strong flow.','stop'),
   task('~17:00','START RETURN','Do not wait until sunset.','safety',{required:true,critical:true}),
   task('~17:30–18:00','EXIT OFF-ROAD SECTION','Be back on normal road before full dark.','safety',{required:true,critical:true}),
   task('~18:30–19:00','Hotel','Freshen up.','hotel'),
   task('19:30–21:00','Dinner','Day 2 food can be chosen on the day.','food'),
   task('21:00–21:30','Hotel + sleep','Back up footage and charge for Day 3.','recovery',{required:true})
  ],chacha:{target:'Chacha Kota Actual Boating Point',steps:['Tower: roughly 10–15 min','Actual Boating Point: roughly 20–30 min','Continue deeper on real peninsula roads while safely motorable','Mahisagar Heart is a direction of exploration, not a compulsory destination'],turnAround:['Deep mud','Flowing water','Submerged road','Slippery clay','Steep sketchy descent']},mahi:{target:'Mahi Dam, Banswara Rajasthan',steps:['Use proper public / visitor side','Ask security if motorcycles are permitted on the allowed wall section','Get reservoir panorama','Find the actual spillway / gate section','Obey barricades and security']},singpura:{terrain:['Normal narrow road','Dirt track','Grass / hill tracks','Rocky sections','Mud / puddles','Waterfall'],deadline:'Start returning around 17:00. Be completely out of the rough trail by roughly 17:30–18:00.',checks:['Rain acceptable','Enough daylight','Trail condition okay','Mom comfortable','Bike okay']}},
 {day:3,date:'2026-08-30',title:'Jagmeru Hills → hotel → Arthuna → Ahmedabad',from:'Banswara',to:'Ahmedabad',character:'Lighter than Day 2, but still a strong morning. Protect the ride-home buffer.',segments:[
   seg('Hotel → Jagmeru → Hotel','Hotel Landmark, Banswara','Hotel Landmark, Banswara',['Jagmer Hills, Banswara'],'Travel light if practical. Stop at 2–3 genuinely good viewpoints rather than collecting every pin.'),
   seg('Hotel → Arthuna','Hotel Landmark, Banswara','Arthuna Group of Temples, Rajasthan',[],'Leave around 09:00 after breakfast, packing and checkout.'),
   seg('Arthuna → Ahmedabad','Arthuna Group of Temples, Rajasthan','Ahmedabad, Gujarat',['Santrampur, Gujarat','Lunawada, Gujarat'],'Protect the homeward buffer. A calm return matters more than another attraction.')
  ],tasks:[
   task('05:10–05:15','Leave Hotel Landmark','Travel light for the hill session if possible.','ride',{required:true}),
   task('~05:50–06:00','Reach Jagmeru area','Target the Nichla Ghantala / Ghata Ki Nal side before sunrise.','stop'),
   task('06:00–07:30','Jagmeru Hills','Winding hill road, viewpoints, green monsoon landscape and optional firm dirt / grass exploration.','explore'),
   task('~07:30','Leave Jagmeru','Return to hotel before the day gets busy.','ride'),
   task('~08:00–08:15','Hotel','Back at base.','hotel'),
   task('08:15–09:00','Breakfast + shower + pack','Luggage straps, tyre pressure, chain, electronics and checkout prep.','prep',{required:true}),
   task('~09:00','Hotel checkout','Leave Hotel Landmark.','hotel',{required:true}),
   task('09:00–10:00/10:15','Ride to Arthuna','Roughly 54–55 km from Banswara depending on route.','ride'),
   task('~10:00–11:15','Arthuna','Archaeology / architecture block, not temple-hopping.','stop'),
   task('~11:15–11:30','Leave for Ahmedabad','Start the home leg before lunch.','ride',{required:true}),
   task('~12:30–13:30','Lunch','Santrampur / Lunawada side depending on hunger and route.','food'),
   task('Afternoon','Ride home','Include at least one short hydration / stretch break.','ride',{required:true}),
   task('~17:00–18:00','Ahmedabad','Target home window; rain / traffic can move this later.','finish')
  ],jagmeru:{rules:['The ride through the hills is the experience','Stop at 2–3 genuinely good viewpoints','Firm dirt / grass to a worthwhile viewpoint is fine','Wet clay, deep mud or steep sketchy trails are unnecessary','If practical, leave main touring luggage at the hotel until return']},homeRule:'If Jagmeru or Arthuna runs late, shorten the stop rather than sacrificing the Ahmedabad return buffer.'}
];

const TRIP_RULES=[
 'Safety overrides the schedule.',
 'No night riding on unknown rural or off-road sections.',
 'Do not blindly recreate a YouTube trail; use the surface in front of you.',
 'If Mom is tired, remove the next optional stop. Rest blocks are part of the itinerary.',
 'If water is flowing across the road, depth is unknown, or clay / mud is slippery: turn around.',
 'Use ordinary motorcycle-legal NH / SH roads; do not accept access-controlled expressways.'
];
const OFFROAD=[
 {level:'GREEN',mom:'Mom on bike',terrain:'Firm dirt, grass, normal gravel, mild red-earth track',action:'Ride two-up slowly. Smooth throttle and braking.'},
 {level:'YELLOW',mom:'Mom walks short section',terrain:'Ruts, loose rock, rough short climb, awkward 50–500 m',action:'Stop first. Mom walks on safe ground; ride Ronin solo; regroup.'},
 {level:'ORANGE',mom:'Off bike / conditional',terrain:'Soft mud, deeper ruts, loose steep trail',action:'Only if surface is firm and there is a safe escape / turnaround.'},
 {level:'RED',mom:'Do not proceed',terrain:'Unknown water depth / current, washed-out track, exposed edge, deep mud',action:'Turn around. This is not a target to complete.'}
];
const PREP=[
 {section:'27 Aug evening',items:[['weather','Check official weather / alerts and road closures'],['mangarh','Compare outbound road corridors and confirm Mangarh access'],['hotel','Confirm Hotel Landmark parking / booking details'],['fuel','Fuel the bike'],['maps','Download offline maps'],['devices','Charge all devices'],['rain','Pack rain gear on top, not buried'],['docs','Keep documents and emergency cash waterproof']]},
 {section:'28 Aug before 05:00',items:[['tyres','Tyre pressure'],['chain','Chain'],['brakes','Brakes'],['lights','Lights'],['straps','Luggage straps'],['visor','Visor'],['route','Live route check'],['hydrate','Start hydrated']]},
 {section:'29 Aug before Chacha',items:[['visibility','Visibility / rain check'],['cleanvisor','Clean visor'],['ridelights','Lights on']]},
 {section:'29 Aug before Singpura',items:[['singrain','Current rain'],['trail','Trail condition'],['daylight','Daylight margin'],['momcomfort','Mom comfort'],['bikecondition','Bike condition']]},
 {section:'30 Aug',items:[['lightload','Keep Jagmeru bike load light if practical'],['breakfast','Breakfast'],['pack','Pack'],['day3tyres','Tyres'],['day3chain','Chain'],['day3straps','Luggage straps'],['checkout','Checkout'],['arthuna','Leave Arthuna before lunch']]}
];

function preservedStatus(oldRide,day,taskDef){
 const oldDay=oldRide?.days?.find(d=>Number(d.day)===Number(day));
 const oldTask=oldDay?.tasks?.find(t=>normalizeTitle(t.title)===normalizeTitle(taskDef.title));
 return oldTask?{status:oldTask.status||'upcoming',delay:Number(oldTask.delay||0)}:{status:'upcoming',delay:0};
}
function finalRide(oldRide={}){
 const days=FINAL_DAYS.map(d=>({...clone(d),preflight:clone(oldRide.days?.find(x=>Number(x.day)===d.day)?.preflight||{}),tasks:d.tasks.map(t=>({...clone(t),...preservedStatus(oldRide,d.day,t)}))}));
 let notes=String(oldRide.notes||'');
 if(!/Rider Hub real-world test/i.test(notes))notes+=(notes?'\n\n':'')+'Rider Hub real-world test\n';
 return {...oldRide,id:TRIP_ID,name:'Banswara 3-Day Ronin Monsoon Adventure',start:'2026-08-28',end:'2026-08-30',status:oldRide.status||'planned',selectedDay:Math.max(0,Math.min(2,Number(oldRide.selectedDay||0))),days,expenses:clone(oldRide.expenses||{fuel:0,food:0,stay:2470,parking:0,misc:0}),notes,fuelLogs:clone(oldRide.fuelLogs||[]),packing:clone(oldRide.packing||{}),tripRevision:REV,riders:['Jayrut','Mom'],rideStyle:'Two-up · TVS Ronin · Monsoon',hotel:clone(HOTEL),tripDocuments:[{id:'trip_banswara_guide',name:'Final Banswara Trip Guide',desc:'28–30 Aug 2026 · itinerary, safety rules and route logic'},{id:'trip_banswara_hotel_booking',name:'Hotel Landmark Booking',desc:'2 nights · Deluxe Room · ₹2,470 paid'}],tripRules:clone(TRIP_RULES),offRoadMatrix:clone(OFFROAD),tripPrep:clone(oldRide.tripPrep||{}),singpuraChecks:clone(oldRide.singpuraChecks||{}),realWorldTestNotes:String(oldRide.realWorldTestNotes||'')};
}
function ensureFinalTrip({cloud=false}={}){
 const s=S();if(!Array.isArray(s.rides))return false;
 const i=s.rides.findIndex(r=>r.id===TRIP_ID||/Banswara 3-Day/i.test(r.name||''));
 const old=i>=0?s.rides[i]:{};
 if(old.tripRevision===REV)return false;
 const next=finalRide(old);
 if(i>=0)s.rides[i]=next;else s.rides.unshift(next);
 s.ui=s.ui||{};persist();
 if(cloud&&window.riderHubFirebaseUser?.())setTimeout(()=>window.riderHubCloudSave?.(clone(s)),250);
 return true;
}
function ride(){return(S().rides||[]).find(r=>r.id===TRIP_ID)}
function saveTrip(){persist();window.riderHubCloudSave?.(clone(S()));window.render?.()}

window.openBanswaraHotel=()=>window.openModal?.(`<div class="modalhead"><div><div class="kicker">CONFIRMED BASE</div><h3>${HOTEL.name}</h3><p class="caption">${HOTEL.address}</p></div><button class="iconbtn" onclick="closeModal()">×</button></div><div class="banswara-booking-grid"><div><span>STATUS</span><b>Confirmed · Paid</b></div><div><span>PAID</span><b>₹${HOTEL.paid.toLocaleString('en-IN')}</b></div><div><span>CHECK-IN</span><b>${HOTEL.checkIn}</b></div><div><span>CHECK-OUT</span><b>${HOTEL.checkOut}</b></div><div><span>ROOM</span><b>${HOTEL.room}</b></div><div><span>GUESTS</span><b>${HOTEL.guests}</b></div></div><div class="connection-note">${HOTEL.cancellation}</div><div class="banswara-action-row"><button class="primary" onclick="open('${mapUrl(HOTEL.address)}','_blank','noopener')">Navigate</button><button class="ghost" onclick="location.href='tel:${HOTEL.phone}'">Call hotel</button><button class="ghost" onclick="openPrivateDocument('trip_banswara_hotel_booking')">Open booking</button><button class="ghost" onclick="pickPrivateDocument('trip_banswara_hotel_booking')">Attach / replace</button></div>`);
window.openBanswaraTripDocs=()=>{const docs=ride()?.tripDocuments||[];window.openModal?.(`<div class="modalhead"><div><div class="kicker">TRIP DOCUMENTS</div><h3>Banswara files</h3><p class="caption">Keep both files Drive-backed and cached offline before departure.</p></div><button class="iconbtn" onclick="closeModal()">×</button></div><div class="banswara-docs">${docs.map(d=>`<div class="banswara-doc"><div><strong>${esc(d.name)}</strong><p>${esc(d.desc)}</p></div><div><button class="ghost" onclick="openPrivateDocument('${d.id}')">Open</button><button class="ghost" onclick="pickPrivateDocument('${d.id}')">Attach</button></div></div>`).join('')}</div>`)};
window.openBanswaraRules=()=>window.openModal?.(`<div class="modalhead"><div><div class="kicker">TRIP RULES</div><h3>Safety overrides schedule.</h3></div><button class="iconbtn" onclick="closeModal()">×</button></div><div class="banswara-rule-list">${TRIP_RULES.map(x=>`<div><span>✓</span><p>${esc(x)}</p></div>`).join('')}</div>`);
window.openBanswaraOffroad=()=>window.openModal?.(`<div class="modalhead"><div><div class="kicker">RONIN + MOM</div><h3>Off-road decision system</h3><p class="caption">Adventure stays in the trip, but every obstacle does not become a two-up challenge.</p></div><button class="iconbtn" onclick="closeModal()">×</button></div><div class="banswara-offroad">${OFFROAD.map(x=>`<div class="level ${x.level.toLowerCase()}"><b>${x.level}</b><div><strong>${esc(x.mom)}</strong><p>${esc(x.terrain)}</p><small>${esc(x.action)}</small></div></div>`).join('')}</div><div class="connection-note danger-note"><strong>Unknown flowing water = RED.</strong><br>If heavy rain changes the trail or water level, turn around.</div>`);
window.openBanswaraPrep=()=>{const r=ride();if(!r)return;window.openModal?.(`<div class="modalhead"><div><div class="kicker">TRAVEL-WEEK OPERATIONS</div><h3>Final trip checklist</h3></div><button class="iconbtn" onclick="closeModal()">×</button></div>${PREP.map(sec=>`<div class="banswara-prep-section"><strong>${esc(sec.section)}</strong>${sec.items.map(([id,label])=>`<button class="banswara-check ${r.tripPrep?.[id]?'done':''}" onclick="toggleBanswaraPrep('${id}')"><span>${r.tripPrep?.[id]?'✓':'○'}</span>${esc(label)}</button>`).join('')}</div>`).join('')}`)};
window.toggleBanswaraPrep=id=>{const r=ride();if(!r)return;r.tripPrep=r.tripPrep||{};r.tripPrep[id]=!r.tripPrep[id];saveTrip();window.openBanswaraPrep()};
window.openSingpuraGoNoGo=()=>{const r=ride();if(!r)return;const checks=r.days[1].singpura?.checks||[];window.openModal?.(`<div class="modalhead"><div><div class="kicker">DAY 2 · SINGPURA</div><h3>GO / NO-GO</h3><p class="caption">If conditions are materially worse, skip Singpura. That is a successful safety decision, not a failed ride.</p></div><button class="iconbtn" onclick="closeModal()">×</button></div><div class="banswara-go-list">${checks.map((label,i)=>`<button class="banswara-check ${r.singpuraChecks?.[i]?'done':''}" onclick="toggleSingpuraCheck(${i})"><span>${r.singpuraChecks?.[i]?'✓':'○'}</span>${esc(label)}</button>`).join('')}</div><div class="connection-note danger-note"><strong>Hard daylight rule</strong><br>${esc(r.days[1].singpura.deadline)}</div><button class="ghost full" onclick="openBanswaraOffroad()">Open off-road decision system</button>`)};
window.toggleSingpuraCheck=i=>{const r=ride();if(!r)return;r.singpuraChecks=r.singpuraChecks||{};r.singpuraChecks[i]=!r.singpuraChecks[i];saveTrip();window.openSingpuraGoNoGo()};
window.openBanswaraRealWorldNotes=()=>{const r=ride();if(!r)return;window.openModal?.(`<div class="modalhead"><div><div class="kicker">REAL-WORLD TEST</div><h3>Rider Hub trip notes</h3><p class="caption">One short line whenever something helps or annoys you.</p></div><button class="iconbtn" onclick="closeModal()">×</button></div><textarea id="banswaraRealNotes" rows="10" placeholder="Day 1 – Map took too many taps.\nDay 2 – Offline booking opened correctly.">${esc(r.realWorldTestNotes||'')}</textarea><button class="primary full" style="margin-top:10px" onclick="saveBanswaraRealWorldNotes()">Save trip notes</button>`)};
window.saveBanswaraRealWorldNotes=()=>{const r=ride(),el=$('#banswaraRealNotes');if(!r||!el)return;r.realWorldTestNotes=el.value;saveTrip();window.closeModal?.();window.toast?.('Trip test notes saved')};
window.openBanswaraFallback=()=>window.openModal?.(`<div class="modalhead"><div><div class="kicker">DAY 1 FALLBACK</div><h3>Skip Mangarh if the corridor is unsafe.</h3></div><button class="iconbtn" onclick="closeModal()">×</button></div><div class="connection-note">${esc(FINAL_DAYS[0].fallback.detail)}</div><button class="primary full" onclick="open('${mapUrl('Ahmedabad Godhra Dahod Banswara')}','_blank','noopener')">Open Godhra–Dahod fallback</button>`);
window.openBanswaraEmergency=()=>window.openModal?.(`<div class="modalhead"><div><div class="kicker">TRIP CONTACTS</div><h3>Emergency & base</h3></div><button class="iconbtn" onclick="closeModal()">×</button></div><div class="banswara-emergency"><button onclick="location.href='tel:112'"><b>112</b><span>General emergency</span></button><button onclick="location.href='tel:108'"><b>108</b><span>Ambulance</span></button><button onclick="location.href='tel:${HOTEL.phone}'"><b>Hotel</b><span>${HOTEL.phone}</span></button></div>`);

function dayContextHtml(r){const d=r.days[r.selectedDay||0];if(!d)return'';if(d.day===1)return`<div class="banswara-day-context"><div><div class="kicker">DAY 1 FLEXIBILITY</div><strong>Easy Banswara, not a sightseeing chase.</strong><p>REST is required. Dialab Lake is optional.</p></div><div class="banswara-context-actions"><button class="ghost" onclick="openBanswaraFallback()">Fallback route</button><button class="ghost" onclick="openBanswaraFood()">Food options</button></div></div>`;if(d.day===2)return`<div class="banswara-day-context critical"><div><div class="kicker">DAY 2 OFF-ROAD</div><strong>Singpura stays fully in daylight.</strong><p>Start return around 17:00 · exit rough trail by roughly 17:30–18:00.</p></div><div class="banswara-context-actions"><button class="primary" onclick="openSingpuraGoNoGo()">GO / NO-GO</button><button class="ghost" onclick="openBanswaraOffroad()">Off-road rules</button></div></div>`;return`<div class="banswara-day-context"><div><div class="kicker">DAY 3 PRIORITY</div><strong>Protect the ride-home buffer.</strong><p>Travel light for Jagmeru if practical. If the morning runs late, shorten a stop rather than the homeward buffer.</p></div></div>`}
window.openBanswaraFood=()=>window.openModal?.(`<div class="modalhead"><div><div class="kicker">DAY 1 FOOD</div><h3>Choose on the day.</h3><p class="caption">Food is flexible; hydration and an easy stomach matter more than forcing a food-tour schedule.</p></div><button class="iconbtn" onclick="closeModal()">×</button></div><div class="banswara-food">${FINAL_DAYS[0].foodOptions.map(x=>`<button onclick="open('${mapUrl(x+' Banswara')}','_blank','noopener')"><strong>${esc(x)}</strong><span>Open in Maps</span></button>`).join('')}</div>`);
function decorateRide(){const r=ride(),root=$('#rides');if(!r||!root||S().ui?.rideId!==TRIP_ID||!root.querySelector('.ride-detail-hero'))return;root.querySelector('.banswara-trip-panel')?.remove();root.querySelector('.banswara-day-context')?.remove();const hero=root.querySelector('.ride-detail-hero');hero.insertAdjacentHTML('afterend',`<section class="banswara-trip-panel"><div class="banswara-trip-top"><div><div class="kicker">CONFIRMED TRIP BASE</div><h2>Hotel Landmark, Banswara</h2><p>${HOTEL.checkIn} → ${HOTEL.checkOut} · ${HOTEL.room}</p></div><span class="banswara-paid">PAID ₹${HOTEL.paid.toLocaleString('en-IN')}</span></div><div class="banswara-trip-actions"><button onclick="openBanswaraHotel()">Hotel</button><button onclick="openBanswaraTripDocs()">Trip documents</button><button onclick="openBanswaraPrep()">Trip prep</button><button onclick="openBanswaraRules()">Trip rules</button><button onclick="openBanswaraRealWorldNotes()">Test notes</button></div></section>`);const cmd=root.querySelector('.ride-detail-command');if(cmd)cmd.insertAdjacentHTML('afterend',dayContextHtml(r));decorateTaskBadges(root,r)}
function decorateTaskBadges(root,r){const d=r.days[r.selectedDay||0],rows=[...root.querySelectorAll('.premium-task')];if(!d||!rows.length)return;rows.forEach((row,i)=>{row.querySelector('.banswara-task-badge')?.remove();const t=d.tasks[i];if(!t)return;let label=t.critical?'CRITICAL':t.optional?'OPTIONAL':t.required?'REQUIRED':'';if(!label)return;const badge=document.createElement('span');badge.className='banswara-task-badge '+(t.critical?'critical':t.optional?'optional':'required');badge.textContent=label;const body=row.querySelector('.task-body')||row;body.appendChild(badge)})}
function decorateRideMode(){const r=ride(),mode=$('#rideMode'),inner=$('#rideModeInner');if(!r||!mode?.classList.contains('open')||S().ui?.rideId!==TRIP_ID||!inner)return;inner.querySelector('.banswara-mode-strip')?.remove();const top=inner.querySelector('.ride-mode-top')||inner.firstElementChild;if(!top)return;top.insertAdjacentHTML('afterend',`<div class="banswara-mode-strip"><button onclick="openBanswaraRules()">Trip rules</button><button onclick="openBanswaraHotel()">Hotel</button><button onclick="openBanswaraEmergency()">112 / 108</button><button onclick="openBanswaraOffroad()">Off-road</button>${r.days[r.selectedDay||0]?.day===2?'<button class="critical" onclick="openSingpuraGoNoGo()">Singpura GO / NO-GO</button>':''}</div>`)}
let scheduled=false;function scheduleDecorate(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorateRide();decorateRideMode()})}
const obs=new MutationObserver(scheduleDecorate);obs.observe(document.body,{childList:true,subtree:true});

const baseSetUser=window.riderHubSetUser;window.riderHubSetUser=function(){const out=baseSetUser?.apply(this,arguments);ensureFinalTrip({cloud:true});setTimeout(scheduleDecorate,0);return out};
const baseAuthReady=window.riderHubAuthReady;window.riderHubAuthReady=function(){const out=baseAuthReady?.apply(this,arguments);ensureFinalTrip({cloud:true});setTimeout(scheduleDecorate,0);return out};
ensureFinalTrip({cloud:false});setTimeout(scheduleDecorate,0);
})();
