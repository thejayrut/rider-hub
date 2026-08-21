/* Phase 2E restoration layer: do not redesign Gear Garage or the My Rides landing screen. */
(() => {
  const detailRideRenderer = window.renderRides;
  const baseSetPage = window.setPage;
  let legacyGearStatus = 'all';
  let legacyGearOwner = 'all';
  let legacyGearSearch = '';

  const gearIcon = category => category==='Riding Gear'?'◒':category==='Luggage'?'▣':category==='Electronics'?'◉':category==='Camera & Mounts'?'◎':category==='Cleaning & Care'?'✦':'◇';
  const legacyMoney = n => n==null||n===''?'PRICE TBD':'₹'+Math.round(Number(n)||0).toLocaleString('en-IN');

  window.setPage = function(page,push=true){
    if(page==='rides' && push) state.ui.rideView='list';
    return baseSetPage(page,push);
  };

  function gearSummaryLegacy(){
    const items=Array.isArray(state.gear)?state.gear:[];
    const owned=items.filter(x=>x.status==='owned'), planned=items.filter(x=>x.status==='planned');
    return {
      owned:owned.length,
      planned:planned.length,
      spent:owned.reduce((a,x)=>a+(Number(x.amount)||0),0),
      budget:planned.reduce((a,x)=>a+(Number(x.amount)||0),0)
    };
  }

  function renderGearContentLegacy(){
    const root=$('#gearContent'); if(!root)return;
    const q=legacyGearSearch.trim().toLowerCase();
    const items=(Array.isArray(state.gear)?state.gear:[]).filter(x=>(legacyGearStatus==='all'||x.status===legacyGearStatus)&&(legacyGearOwner==='all'||x.owner===legacyGearOwner)&&(!q||`${x.name} ${x.category} ${x.owner} ${x.note||''}`.toLowerCase().includes(q)));
    const order=['Riding Gear','Luggage','Electronics','Bike Accessories','Camera & Mounts','Cleaning & Care'];
    root.innerHTML=order.map(cat=>{
      const rows=items.filter(x=>x.category===cat); if(!rows.length)return'';
      return `<div class="gear-section-title"><h3>${esc(cat)}</h3><span>${rows.length} ${rows.length===1?'ITEM':'ITEMS'}</span></div><div class="gear-list">${rows.map(x=>`<div class="gear-card" onclick="openGearDetail('${x.id}')"><div class="gear-avatar">${gearIcon(x.category)}</div><div><h4>${esc(x.name)}${x.qty>1?` ×${x.qty}`:''}</h4><div class="gear-meta">${esc(x.owner)} • ${esc(x.category)}</div></div><div class="gear-right"><div class="gear-price ${x.amount==null?'unknown':''}">${legacyMoney(x.amount)}</div><span class="gear-state ${x.status}">${x.status==='owned'?'BOUGHT':'WILL BUY'}</span></div></div>`).join('')}</div>`;
    }).join('')||'<div class="gear-empty">No items match these filters.</div>';
    $$('#gearStatusTabs .chip').forEach(b=>b.classList.toggle('active',b.dataset.gearStatus===legacyGearStatus));
    $$('#gearOwnerTabs .chip').forEach(b=>b.classList.toggle('active',b.dataset.gearOwner===legacyGearOwner));
  }

  window.renderGear = function(){
    const sm=gearSummaryLegacy();
    $('#gear').innerHTML=`<div class="card gear-hero"><div class="kicker">GEAR GARAGE</div><h1>Your riding inventory</h1><p>Owned gear, planned purchases, bike setup, luggage, electronics and care items — all in one editable garage.</p><div class="gear-summary"><div class="sum"><label>OWNED</label><b>${sm.owned}</b><small>products in garage</small></div><div class="sum"><label>WILL BUY</label><b>${sm.planned}</b><small>planned products</small></div><div class="sum"><label>KNOWN SPEND</label><b>${money(sm.spent)}</b><small>excludes unknown prices</small></div><div class="sum"><label>PLANNED BUDGET</label><b>${money(sm.budget)}</b><small>known expected prices</small></div></div></div><div class="gear-toolbar"><div class="gear-search"><span class="search-symbol">⌕</span><input id="gearSearch" placeholder="Search helmet, luggage, Mom…" autocomplete="off" value="${esc(legacyGearSearch)}"></div><div class="gear-tabs" id="gearStatusTabs"><button class="chip" data-gear-status="all">ALL</button><button class="chip" data-gear-status="owned">BOUGHT</button><button class="chip" data-gear-status="planned">WILL BUY</button></div><div class="gear-owner" id="gearOwnerTabs"><button class="chip" data-gear-owner="all">EVERYTHING</button><button class="chip" data-gear-owner="Jayrut">MY GEAR</button><button class="chip" data-gear-owner="Mom">MOM</button><button class="chip" data-gear-owner="Bike / Shared">BIKE / SHARED</button></div></div><div id="gearContent"></div><div class="data-note">Prices marked unknown are intentionally left blank rather than guessed. You can edit any item before the final app.</div><button class="gear-fab" onclick="openGearEditor()" aria-label="Add gear">+</button>`;
    $('#gearSearch').addEventListener('input',e=>{legacyGearSearch=e.target.value;renderGearContentLegacy()});
    $('#gearStatusTabs').addEventListener('click',e=>{const b=e.target.closest('[data-gear-status]');if(!b)return;legacyGearStatus=b.dataset.gearStatus;renderGearContentLegacy()});
    $('#gearOwnerTabs').addEventListener('click',e=>{const b=e.target.closest('[data-gear-owner]');if(!b)return;legacyGearOwner=b.dataset.gearOwner;renderGearContentLegacy()});
    renderGearContentLegacy();
  };

  window.openGearDetail = function(id){
    const x=(Array.isArray(state.gear)?state.gear:[]).find(g=>g.id===id); if(!x)return;
    openModal(`<div class="gear-detail-head"><div class="gear-avatar">${gearIcon(x.category)}</div><div><div class="kicker">${x.status==='owned'?'BOUGHT':'PLANNED'}</div><h3>${esc(x.name)}</h3><p class="caption">${esc(x.owner)} • ${esc(x.category)}${x.qty>1?' • '+x.qty+' units':''}</p></div></div><div class="gear-detail-grid"><div class="gear-detail-box"><label>STATUS</label><b>${x.status==='owned'?'Bought / Owned':'Will Buy'}</b></div><div class="gear-detail-box"><label>${x.status==='owned'?'PAID':'EXPECTED'}</label><b>${x.amount==null?'Not entered':money(x.amount)}</b></div><div class="gear-detail-box"><label>PURCHASE DATE</label><b>${x.purchaseDate||'Not entered'}</b></div><div class="gear-detail-box"><label>QUANTITY</label><b>${x.qty||1}</b></div></div><div class="gear-detail-note">${esc(x.note||'No note yet.')}</div><div class="gear-detail-actions"><button class="secondary" onclick="openGearEditor('${x.id}')">Edit details</button><button class="primary" onclick="toggleGearStatus('${x.id}')">${x.status==='owned'?'Move to Will Buy':'Mark bought'}</button><button class="danger" onclick="deleteGearLegacyConfirm('${x.id}')">Delete item</button></div>`);
  };

  window.openGearEditor = function(id=null){
    const x=id?(Array.isArray(state.gear)?state.gear:[]).find(g=>g.id===id):null;
    openModal(`<div class="kicker">GEAR GARAGE</div><h3>${x?'Edit item':'Add item'}</h3><p class="caption">Everything is editable. Unknown prices can stay blank.</p><div class="field"><label>ITEM NAME</label><input id="legacyGearName" type="text" value="${esc(x?.name||'')}"></div><div class="grid2"><div class="field"><label>CATEGORY</label><select id="legacyGearCategory">${['Riding Gear','Luggage','Electronics','Bike Accessories','Camera & Mounts','Cleaning & Care'].map(v=>`<option ${x?.category===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>OWNER</label><select id="legacyGearOwner">${['Jayrut','Mom','Bike / Shared'].map(v=>`<option ${x?.owner===v?'selected':''}>${v}</option>`).join('')}</select></div></div><div class="grid2"><div class="field"><label>STATUS</label><select id="legacyGearState"><option value="owned" ${x?.status==='owned'?'selected':''}>Bought</option><option value="planned" ${x?.status==='planned'?'selected':''}>Will Buy</option></select></div><div class="field"><label>QUANTITY</label><input id="legacyGearQty" type="number" inputmode="numeric" min="1" step="1" value="${x?.qty||1}"></div></div><div class="field"><label>PAID / EXPECTED AMOUNT · ₹</label><input id="legacyGearAmount" type="number" inputmode="decimal" min="0" step="0.01" value="${x?.amount??''}"><div class="caption">This is the total amount for this inventory line. Leave blank when the exact split is unknown.</div></div><div class="field"><label>PURCHASE DATE · OPTIONAL</label><input id="legacyGearDate" type="date" value="${x?.purchaseDate||''}"></div><div class="field"><label>NOTE / ORDER INFORMATION</label><textarea id="legacyGearNote">${esc(x?.note||'')}</textarea></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="saveGearLegacy('${x?.id||''}')">Save item</button></div>`);
  };

  window.saveGearLegacy = function(id=''){
    const name=$('#legacyGearName').value.trim(); if(!name)return toast('Add an item name');
    const raw=$('#legacyGearAmount').value.trim(), amount=raw===''?null:Number(raw); if(amount!=null&&(!Number.isFinite(amount)||amount<0))return toast('Check the amount');
    snapshot(id?'Edit gear':'Add gear');
    const entry={id:id||('g_custom_'+Date.now().toString(36)),name,category:$('#legacyGearCategory').value,owner:$('#legacyGearOwner').value,status:$('#legacyGearState').value,qty:Math.max(1,Math.round(Number($('#legacyGearQty').value)||1)),amount,purchaseDate:$('#legacyGearDate').value,note:$('#legacyGearNote').value.trim()};
    if(id){const i=state.gear.findIndex(x=>x.id===id);if(i>=0)state.gear[i]={...state.gear[i],...entry}}else state.gear.push(entry);
    save(); closeModal(); toast(id?'Gear item updated':'Gear item added');
  };

  window.deleteGearLegacyConfirm = function(id){
    const x=state.gear.find(g=>g.id===id);if(!x)return;
    openModal(`<div class="kicker">DELETE GEAR</div><h3>${esc(x.name)}</h3><p class="caption">This can be restored with Undo.</p><div class="modal-actions"><button class="secondary" onclick="openGearDetail('${id}')">Cancel</button><button class="danger" onclick="deleteGearLegacy('${id}')">Delete item</button></div>`);
  };
  window.deleteGearLegacy = function(id){snapshot('Delete gear');state.gear=state.gear.filter(x=>x.id!==id);save();closeModal();toast('Gear item deleted')};

  function rideOverallProgress(){
    let total=0,done=0;days.forEach(d=>d.tasks.forEach((_,i)=>{total++;const s=state.ride.tasks[d.day+'_'+i]||'upcoming';if(s==='done'||s==='skipped')done++}));return total?Math.round(done/total*100):0;
  }
  function rideCompleted(){return days.every(d=>d.tasks.every((_,i)=>['done','skipped'].includes(state.ride.tasks[d.day+'_'+i]||'upcoming')))}
  function renderRideList(){
    const done=rideCompleted(), pct=rideOverallProgress();
    $('#rides').innerHTML=`<div class="section-head"><div><div class="kicker">MY RIDES</div><h2>Plan. Ride. Remember.</h2></div><button class="linkbtn" onclick="openSimpleRideAdd()">+ Add ride</button></div><div class="ride-summary"><div class="card stat"><label>UPCOMING</label><b>${done?0:1}</b><small>planned</small></div><div class="card stat"><label>COMPLETED</label><b>${done?1:0}</b><small>rides</small></div><div class="card stat"><label>TOURING</label><b>0</b><small>km logged</small></div></div><div style="margin-top:12px"><div class="card ride-card" onclick="openRideFromList()"><div class="ride-card-top"><div><div class="kicker">OFFLINE READY</div><h3>Banswara 3-Day Ronin Adventure</h3><div class="ride-route">Ahmedabad → Banswara → Ahmedabad</div></div><span class="ride-status">${done?'COMPLETED':'UPCOMING'}</span></div><div class="ride-meta"><span>2026-08-28 → 2026-08-30</span><span>2 riders</span><span>3 days</span></div><div class="ride-progress"><i style="width:${pct}%"></i></div></div></div>`;
  }

  window.openSimpleRideAdd = function(){openModal(`<div class="kicker">ADD RIDE</div><h3>Create a ride</h3><p class="caption">Manual ride creation is being moved into the Phase 3 data model. The Banswara ride remains fully usable during the migration.</p><div class="modal-actions"><button class="secondary" onclick="closeModal()">Close</button><button class="primary" onclick="closeModal();toast('Phase 3 ride creator is next')">Continue in Phase 3</button></div>`)};
  window.openRideFromList = function(){state.ui.rideView='detail';history.pushState({page:'rides',rideView:'detail'},'',location.pathname+'#rides');detailRideRenderer();const root=$('#rides');if(root)root.insertAdjacentHTML('afterbegin','<button class="ride-list-back" onclick="backToRideList()">‹ My rides</button>')};
  window.backToRideList = function(){if(history.state?.rideView==='detail')history.back();else{state.ui.rideView='list';renderRideList()}};
  window.renderRides = function(){if(state.ui.rideView==='detail'){detailRideRenderer();const root=$('#rides');if(root&&!root.querySelector('.ride-list-back'))root.insertAdjacentHTML('afterbegin','<button class="ride-list-back" onclick="backToRideList()">‹ My rides</button>')}else renderRideList()};

  window.addEventListener('popstate',e=>{
    if((e.state?.page||location.hash.slice(1))==='rides'){
      state.ui.rideView=e.state?.rideView==='detail'?'detail':'list';
      window.renderRides();
    }
  });

  window.paintWeather = function(el,j){
    const cur=j.current||{},d=currentDay(),idx=(j.daily?.time||[]).indexOf(d.date),rain=idx>=0?j.daily.precipitation_probability_max[idx]:null,max=idx>=0?j.daily.temperature_2m_max[idx]:null,min=idx>=0?j.daily.temperature_2m_min[idx]:null;
    el.innerHTML=`<div class="weather-top"><div><div class="kicker">LIVE WEATHER</div><div class="weather-big">${Math.round(cur.temperature_2m??0)}°C</div><div class="weather-status">Banswara current · updated ${new Date(state.ride.weatherUpdated).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div></div><button class="secondary" onclick="renderWeather(true)">Refresh</button></div><div class="grid3" style="margin-top:10px"><div class="tile"><label>DAY ${d.day} RAIN RISK</label><b>${rain==null?'—':rain+'%'}</b></div><div class="tile"><label>EXPECTED HIGH</label><b>${max==null?'—':Math.round(max)+'°'}</b></div><div class="tile"><label>EXPECTED LOW</label><b>${min==null?'—':Math.round(min)+'°'}</b></div></div>${rain>=60?'<div class="alert red">High rain probability. Re-check roads before departure and use the wet-weather backup if the Santrampur/Mangarh corridor is questionable.</div>':'<div class="alert">Forecasts can change materially. Re-check the evening before and again before departure.</div>'}`;
  };

  // Force My Rides as the landing state whenever the Rides tab is opened after this patch loads.
  if(state.ui.page==='rides' && !history.state?.rideView) state.ui.rideView='list';
})();
