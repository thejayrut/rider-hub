/* Rider Hub v32 focused UX fixes requested after v31. */
(()=>{
'use strict';
const S=()=>window.state||{};
const B=()=>S().bike||{};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid=v=>v!=null&&String(v).trim()&&!/^(not added|—)$/i.test(String(v).trim());
const modal=h=>window.openModal?.(h);
const toast=t=>window.toast?.(t);
const save=()=>window.save?.();

function serviceHistory(){const b=B();b.serviceHistory=Array.isArray(b.serviceHistory)?b.serviceHistory:[];return b.serviceHistory}
function ensureServiceIds(){let changed=false;for(const x of serviceHistory()){if(!x.id){x.id=`svc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;changed=true}}if(changed)setTimeout(save,0)}
function serviceHistoryHtml(){
  ensureServiceIds();const rows=serviceHistory().slice().sort((a,b)=>Number(b.odo||0)-Number(a.odo||0));
  if(!rows.length)return '<div class="listrow"><div class="ico">＋</div><div><strong>No service records yet</strong><p>Add completed maintenance and workshop work here.</p></div><button class="secondary rh-row-action" onclick="openServiceRecordEditor()">Add</button></div>';
  return rows.map(x=>`<div class="listrow rh-service-record" onclick="openServiceRecordEditor('${esc(x.id)}')" style="cursor:pointer"><div class="ico">✓</div><div><strong>${esc(x.name||'Service work')}</strong><p>${esc(x.date||'Date not recorded')} · ${Number(x.odo||0).toLocaleString('en-IN')} km${Number(x.cost||0)?` · ₹${Number(x.cost).toLocaleString('en-IN')}`:''}</p></div><span class="pill good">DONE</span></div>`).join('');
}
function rebuildServiceHistory(root){
  const heads=[...root.querySelectorAll('.section-head')];
  const head=heads.find(x=>/SERVICE HISTORY/i.test(x.textContent||''));if(!head)return;
  let actions=head.querySelector('.rh-service-actions');
  if(!actions){actions=document.createElement('div');actions.className='rh-service-actions';actions.innerHTML='<button class="secondary" onclick="openServiceRecordEditor()">+ Add service</button>';head.appendChild(actions)}
  let list=head.nextElementSibling;
  if(!list||!list.classList.contains('card')||!list.classList.contains('list')){list=document.createElement('div');list.className='card list';head.insertAdjacentElement('afterend',list)}
  list.innerHTML=serviceHistoryHtml();
}
window.openServiceRecordEditor=function(id=''){
  const x=id?serviceHistory().find(r=>r.id===id):null;
  modal(`<div class="modalhead"><div><div class="kicker">COMPLETED WORK</div><h3>${x?'Edit service record':'Add service record'}</h3><p class="caption">Record maintenance that has already been completed.</p></div><button class="round" onclick="closeModal()">×</button></div><div class="field"><label>WORK / SERVICE</label><input id="rhSvcName" value="${esc(x?.name||'')}" placeholder="Oil change, scheduled service, brake pads…"></div><div class="grid2"><div class="field"><label>DATE</label><input id="rhSvcDate" type="date" value="${esc(x?.date||new Date().toISOString().slice(0,10))}"></div><div class="field"><label>ODOMETER KM</label><input id="rhSvcOdo" inputmode="numeric" value="${Number(x?.odo??B().odo??0)}"></div></div><div class="field"><label>COST ₹ · OPTIONAL</label><input id="rhSvcCost" inputmode="decimal" value="${x?.cost??''}"></div><div class="field"><label>NOTE · OPTIONAL</label><textarea id="rhSvcNote">${esc(x?.note||'')}</textarea></div><div class="modal-actions"><button class="${x?'danger':'secondary'}" onclick="${x?`deleteServiceRecord('${esc(x.id)}')`:'closeModal()'}">${x?'Delete':'Cancel'}</button><button class="confirm" onclick="saveServiceRecord('${esc(x?.id||'')}')">✓ Save</button></div>`)
};
window.saveServiceRecord=function(id=''){
  const name=document.querySelector('#rhSvcName')?.value.trim();if(!name)return toast('Add the work or service name');
  const odo=Math.max(0,Math.round(Number(document.querySelector('#rhSvcOdo')?.value||0))),raw=document.querySelector('#rhSvcCost')?.value.trim()||'',cost=raw?Math.max(0,Number(raw)):0;
  if(raw&&!Number.isFinite(cost))return toast('Check the service cost');
  window.snapshot?.('service record');
  const item={id:id||`svc_${Date.now().toString(36)}`,name,date:document.querySelector('#rhSvcDate')?.value||new Date().toISOString().slice(0,10),odo,cost,note:document.querySelector('#rhSvcNote')?.value.trim()||''};
  const list=serviceHistory(),i=list.findIndex(x=>x.id===id);if(i>=0)list[i]={...list[i],...item};else list.push(item);
  save();window.closeModal?.();window.renderBike?.();toast(id?'Service record updated':'Service record added');
};
window.deleteServiceRecord=function(id){window.snapshot?.('delete service record');B().serviceHistory=serviceHistory().filter(x=>x.id!==id);save();window.closeModal?.();window.renderBike?.();toast('Service record deleted')};

function parseTyreSizes(){
  const b=B(),known=b.manualTyreSizes||{},text=String(b.manualSources?.tyres?.value||b.tyres||'');
  let front=known.front||'',rear=known.rear||'';
  if(!front){const m=text.match(/([^·]+?)\s+front(?:\s*·|$)/i);if(m)front=m[1].trim()}
  if(!rear){const m=text.match(/(?:^|·)\s*([^·]+?)\s+rear(?:\s*·|$)/i);if(m)rear=m[1].trim()}
  return{front,rear};
}
function pressureTiles(){
  const p=B().manualTyrePressure||{},s=p.solo||{},pl=p.pillion||{},tiles=[];
  const add=(label,v)=>{if(valid(v))tiles.push(`<div class="tile"><label>${esc(label)}</label><b>${esc(v)}</b></div>`)};
  add('SOLO · FRONT',s.front);add('SOLO · REAR',s.rear);add('WITH PILLION · FRONT',pl.front);add('WITH PILLION · REAR',pl.rear);
  return tiles.join('');
}
window.openTyreMaintenance=function(){
  const sizes=parseTyreSizes(),pressures=pressureTiles();
  const sizeTiles=[sizes.front&&`<div class="tile"><label>FRONT TYRE</label><b>${esc(sizes.front)}</b></div>`,sizes.rear&&`<div class="tile"><label>REAR TYRE</label><b>${esc(sizes.rear)}</b></div>`].filter(Boolean).join('');
  modal(`<div class="modalhead"><div><div class="kicker">TYRES</div><h3>Tyre information</h3><p class="caption">Values are shown only when available from the motorcycle data/manual.</p></div><button class="round" onclick="closeModal()">×</button></div>${sizeTiles?`<div class="grid2">${sizeTiles}</div>`:'<div class="alert">Tyre sizes were not found in the current motorcycle data.</div>'}${pressures?`<div class="section-head"><div><div class="kicker">COLD TYRE PRESSURE</div><h2>Load guidance</h2></div></div><div class="grid2">${pressures}</div>`:'<div class="routecard"><strong>Tyre pressure</strong><p>No solo/pillion pressure values were extracted from the current owner’s manual.</p></div>'}<button class="secondary full" style="margin-top:10px" onclick="openOwnerManualManager()">Owner’s manual</button>`)
};
window.openServiceSchedule=function(){
  const b=B(),m=(b.manualServiceMilestones||[]).map(Number).filter(x=>x>0);
  modal(`<div class="modalhead"><div><div class="kicker">SERVICE SCHEDULE</div><h3>${esc(b.name||'Motorcycle')}</h3></div><button class="round" onclick="closeModal()">×</button></div>${m.length?`<div class="card list">${m.map(k=>`<div class="listrow"><div class="ico">🔧</div><div><strong>${k.toLocaleString('en-IN')} km</strong><p>Recommended service point</p></div></div>`).join('')}</div>`:`<div class="alert">No service schedule is available yet. Add or replace the owner’s manual if you want Rider Hub to look for one.</div>`}<button class="secondary full" style="margin-top:10px" onclick="openOwnerManualManager()">Owner’s manual</button>`)
};

function polishMaintenance(root){
  const block=root.querySelector('.rh-maintenance-v31');
  if(block){
    const kicker=block.querySelector('.section-head .kicker');if(kicker)kicker.textContent='BIKE CARE';
    const rows=[...block.querySelectorAll('.listrow')];
    const service=rows.find(r=>/Service schedule/i.test(r.querySelector('strong')?.textContent||''));
    if(service){const p=service.querySelector('p'),next=Number(B().nextServiceKm||0);if(p)p.textContent=next?`Next recommended service: ${next.toLocaleString('en-IN')} km`:'Review your motorcycle service schedule.'}
  }
  root.querySelectorAll('.rh-manual-derived-card').forEach(x=>x.remove());
  root.querySelectorAll('.rh-source-badge').forEach(x=>x.remove());
  const maintenanceHeads=[...root.querySelectorAll(':scope > .section-head')].filter(x=>/^\s*MAINTENANCE\s*Maintenance\s*$/i.test((x.textContent||'').trim()));
  maintenanceHeads.slice(1).forEach(x=>x.remove());
}
function polishDocs(root){root.querySelector('.rh-document-vault .section-head button')?.remove()}
function cleanUndo(){document.querySelectorAll('#home .rh-page-undo,#more .rh-page-undo,#docs .rh-page-undo').forEach(x=>x.remove())}
function polishBike(root=document.querySelector('#bike')){if(!root)return;polishMaintenance(root);rebuildServiceHistory(root);polishDocs(root);cleanUndo()}

const prevBike=window.renderBike;
if(typeof prevBike==='function')window.renderBike=function(){const out=prevBike.apply(this,arguments);polishBike();return out};
const prevMore=window.renderMore;
if(typeof prevMore==='function')window.renderMore=function(){const out=prevMore.apply(this,arguments);cleanUndo();return out};
const prevHome=window.renderHome;
if(typeof prevHome==='function')window.renderHome=function(){const out=prevHome.apply(this,arguments);cleanUndo();return out};
const prevRender=window.render;
if(typeof prevRender==='function')window.render=function(){const out=prevRender.apply(this,arguments);polishBike();cleanUndo();return out};
window.addEventListener('riderhub-sync-status',()=>setTimeout(()=>{polishBike();cleanUndo()},70));
setTimeout(()=>{polishBike();cleanUndo()},250);
})();
