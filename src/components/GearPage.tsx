import { useMemo, useState } from 'react'
import { useRiderHub } from '../store/RiderHubProvider'
import type { GearCategory, GearItem, GearOwner, GearStatus } from '../types'
import { Modal, ModalHead } from './Modal'

const categories:GearCategory[]=['Riding Gear','Luggage','Electronics','Bike Accessories','Camera & Mounts','Cleaning & Care']
const owners:GearOwner[]=['Jayrut','Mom','Bike / Shared']
const money=(n:number|null)=>n==null?'PRICE TBD':`₹${Math.round(n).toLocaleString('en-IN')}`
const icon=(c:GearCategory)=>c==='Riding Gear'?'◒':c==='Luggage'?'▣':c==='Electronics'?'◉':c==='Camera & Mounts'?'◎':c==='Cleaning & Care'?'✦':'◇'

export function GearPage(){
  const {state,saveGear,deleteGear}=useRiderHub()
  const [status,setStatus]=useState<'all'|GearStatus>('all')
  const [owner,setOwner]=useState<'all'|GearOwner>('all')
  const [query,setQuery]=useState('')
  const [selected,setSelected]=useState<GearItem|null>(null)
  const [editing,setEditing]=useState<GearItem|null|undefined>(undefined)
  const filtered=useMemo(()=>state.gear.filter(x=>(status==='all'||x.status===status)&&(owner==='all'||x.owner===owner)&&`${x.name} ${x.category} ${x.owner} ${x.note??''}`.toLowerCase().includes(query.toLowerCase())),[state.gear,status,owner,query])
  const owned=state.gear.filter(x=>x.status==='owned'),planned=state.gear.filter(x=>x.status==='planned')
  const spend=owned.reduce((a,x)=>a+(x.amount??0),0),budget=planned.reduce((a,x)=>a+(x.amount??0),0)
  return <>
    <section className="card gearHero"><div className="kicker">GEAR GARAGE</div><h1>Your riding inventory</h1><p>Owned gear, planned purchases, bike setup, luggage, electronics and care items — all in one garage.</p><div className="gearSummary"><div><label>OWNED</label><b>{owned.length}</b><small>products in garage</small></div><div><label>WILL BUY</label><b>{planned.length}</b><small>planned products</small></div><div><label>KNOWN SPEND</label><b>{money(spend)}</b><small>excludes unknown prices</small></div><div><label>PLANNED BUDGET</label><b>{money(budget)}</b><small>known expected prices</small></div></div></section>
    <div className="gearToolbar"><div className="gearSearch"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search helmet, luggage, Mom…"/></div><div className="chips"><button className={status==='all'?'active':''} onClick={()=>setStatus('all')}>ALL</button><button className={status==='owned'?'active':''} onClick={()=>setStatus('owned')}>BOUGHT</button><button className={status==='planned'?'active':''} onClick={()=>setStatus('planned')}>WILL BUY</button></div><div className="chips"><button className={owner==='all'?'active':''} onClick={()=>setOwner('all')}>EVERYTHING</button><button className={owner==='Jayrut'?'active':''} onClick={()=>setOwner('Jayrut')}>MY GEAR</button><button className={owner==='Mom'?'active':''} onClick={()=>setOwner('Mom')}>MOM</button><button className={owner==='Bike / Shared'?'active':''} onClick={()=>setOwner('Bike / Shared')}>BIKE / SHARED</button></div></div>
    {categories.map(cat=>{const rows=filtered.filter(x=>x.category===cat);if(!rows.length)return null;return <section key={cat}><div className="gearSectionTitle"><h3>{cat}</h3><span>{rows.length} {rows.length===1?'ITEM':'ITEMS'}</span></div><div className="gearList">{rows.map(x=><article className="gearCard" key={x.id} onClick={()=>setSelected(x)}><div className="gearAvatar">{icon(x.category)}</div><div className="min0"><h4>{x.name}{x.qty>1?` ×${x.qty}`:''}</h4><div className="gearMeta">{x.owner} • {x.category}</div></div><div className="gearRight"><b className={x.amount==null?'unknown':''}>{money(x.amount)}</b><span className={x.status}>{x.status==='owned'?'BOUGHT':'WILL BUY'}</span></div></article>)}</div></section>})}
    <div className="dataNote">Prices marked unknown are intentionally left blank rather than guessed.</div>
    <button className="gearFab" onClick={()=>setEditing(null)} aria-label="Add gear">＋</button>

    <Modal open={!!selected} onClose={()=>setSelected(null)} title="Gear details"><div className="gearDetailHead"><div className="gearAvatar">{selected?icon(selected.category):''}</div><div><div className="kicker">{selected?.status==='owned'?'BOUGHT':'PLANNED'}</div><h3>{selected?.name}</h3><p>{selected?.owner} • {selected?.category}</p></div></div>{selected&&<><div className="gearDetailGrid"><div><label>STATUS</label><b>{selected.status==='owned'?'Bought / Owned':'Will Buy'}</b></div><div><label>{selected.status==='owned'?'PAID':'EXPECTED'}</label><b>{money(selected.amount)}</b></div><div><label>PURCHASE DATE</label><b>{selected.purchaseDate||'Not entered'}</b></div><div><label>QUANTITY</label><b>{selected.qty}</b></div></div><div className="gearDetailNote">{selected.note||'No note yet.'}</div><div className="gearDetailActions"><button className="secondary" onClick={()=>{setEditing(selected);setSelected(null)}}>Edit details</button><button className="primary" onClick={()=>{saveGear({...selected,status:selected.status==='owned'?'planned':'owned'});setSelected(null)}}>{selected.status==='owned'?'Move to Will Buy':'Mark bought'}</button><button className="danger full" onClick={()=>{deleteGear(selected.id);setSelected(null)}}>Delete item</button></div></>}</Modal>

    <GearEditor item={editing} open={editing!==undefined} onClose={()=>setEditing(undefined)} onSave={item=>{saveGear(item);setEditing(undefined)}}/>
  </>
}

function GearEditor({item,open,onClose,onSave}:{item:GearItem|null|undefined;open:boolean;onClose:()=>void;onSave:(x:GearItem)=>void}){
  const [draft,setDraft]=useState<GearItem|null>(null)
  const current=draft??(item===undefined?null:item??{id:'',name:'',category:'Riding Gear',owner:'Jayrut',status:'owned',amount:null,qty:1,purchaseDate:'',note:''})
  const set=<K extends keyof GearItem>(k:K,v:GearItem[K])=>setDraft({...current!,[k]:v})
  const close=()=>{setDraft(null);onClose()}
  if(!open||!current)return null
  const save=()=>{if(!current.name.trim())return;onSave({...current,id:current.id||`g_${Date.now().toString(36)}`,name:current.name.trim(),qty:Math.max(1,Math.round(current.qty||1))});setDraft(null)}
  return <Modal open={open} onClose={close} title="Gear editor"><ModalHead kicker="GEAR GARAGE" title={item?'Edit gear item':'Add gear item'} onClose={close} desc="Unknown prices can stay blank."/><div className="field"><label>ITEM NAME</label><input value={current.name} onChange={e=>set('name',e.target.value)}/></div><div className="formGrid"><div className="field"><label>CATEGORY</label><select value={current.category} onChange={e=>set('category',e.target.value as GearCategory)}>{categories.map(x=><option key={x}>{x}</option>)}</select></div><div className="field"><label>OWNER</label><select value={current.owner} onChange={e=>set('owner',e.target.value as GearOwner)}>{owners.map(x=><option key={x}>{x}</option>)}</select></div></div><div className="formGrid"><div className="field"><label>STATUS</label><select value={current.status} onChange={e=>set('status',e.target.value as GearStatus)}><option value="owned">Bought</option><option value="planned">Will Buy</option></select></div><div className="field"><label>QUANTITY</label><input inputMode="numeric" value={current.qty} onChange={e=>set('qty',Number(e.target.value)||1)}/></div></div><div className="field"><label>PAID / EXPECTED AMOUNT · ₹</label><input inputMode="decimal" value={current.amount??''} onChange={e=>set('amount',e.target.value===''?null:Number(e.target.value))}/></div><div className="field"><label>PURCHASE DATE · OPTIONAL</label><input type="date" value={current.purchaseDate||''} onChange={e=>set('purchaseDate',e.target.value)}/></div><div className="field"><label>NOTE / ORDER INFORMATION</label><textarea value={current.note||''} onChange={e=>set('note',e.target.value)}/></div><div className="modalActions"><button className="secondary" onClick={close}>Cancel</button><button className="primary" onClick={save}>Save item</button></div></Modal>
}
