import { useState } from 'react'
import type { Ride } from '../types'
import { useRiderHub } from '../store/RiderHubProvider'
import { Modal, ModalHead } from './Modal'

const progress=(r:Ride)=>{const all=r.days.flatMap(d=>d.tasks);if(!all.length)return 0;const done=all.filter(t=>['done','skipped'].includes(r.operations.tasks[t.id]??t.status)).length;return Math.round(done/all.length*100)}

export function RidesPage({onOpen}:{onOpen:(rideId:string)=>void}){
  const store=useRiderHub(),{state}=store;const upcoming=state.rides.filter(r=>r.status!=='completed'),completed=state.rides.filter(r=>r.status==='completed')
  const [add,setAdd]=useState(false),[name,setName]=useState(''),[route,setRoute]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState('')
  const save=()=>{if(!name.trim())return;const next=JSON.parse(JSON.stringify(state));const s=start||new Date().toISOString().slice(0,10),e=end||s;const ride:Ride={id:`ride_${Date.now().toString(36)}`,name:name.trim(),status:'planned',startDate:s,endDate:e,route:route.trim()||'Route not added',riders:1,offlineReady:true,touringKm:0,budgetMin:0,budgetMax:0,days:[{day:1,date:s,from:'Start',to:route.trim()||'Destination',title:'Ride day',endTime:'20:00',tasks:[],segments:[]}],operations:{selectedDay:0,tasks:{},delays:{},preflight:{},expenses:{hotel:0,fuel:0,food:0,parking:0,misc:0},fuelLogs:[],notes:'',issues:[],packing:{},content:{},backup:{},customEmergency:[]}};next.rides.push(ride);store.replaceState(next,'add ride');setAdd(false);setName('');setRoute('');setStart('');setEnd('')}
  return <>
    <div className="sectionHead first"><div><div className="kicker">MY RIDES</div><h2>Plan. Ride. Remember.</h2></div><button className="addRideButton" onClick={()=>setAdd(true)}>+ Add ride</button></div>
    <div className="rideSummary"><div className="card stat"><label>UPCOMING</label><b>{upcoming.length}</b><small>planned</small></div><div className="card stat"><label>COMPLETED</label><b>{completed.length}</b><small>rides</small></div><div className="card stat"><label>TOURING</label><b>{state.rides.reduce((a,r)=>a+r.touringKm,0)}</b><small>km logged</small></div></div>
    <div className="rideList">{upcoming.map(r=><article className="card rideCard" key={r.id} onClick={()=>onOpen(r.id)}><div className="rideCardTop"><div><div className="kicker">{r.offlineReady?'OFFLINE READY':'PLANNED'}</div><h3>{r.name}</h3><div className="route">{r.route}</div></div><span className="rideStatus">UPCOMING</span></div><div className="rideMeta"><span>{r.startDate} → {r.endDate}</span><span>{r.riders} rider{r.riders===1?'':'s'}</span><span>{r.days.length} day{r.days.length===1?'':'s'}</span></div><div className="progress"><i style={{width:`${progress(r)}%`}}/></div></article>)}</div>
    {!upcoming.length&&<div className="emptyState">No upcoming rides.</div>}
    <Modal open={add} onClose={()=>setAdd(false)} title="Add ride"><ModalHead kicker="ADD RIDE" title="New ride" onClose={()=>setAdd(false)}/><div className="field"><label>RIDE NAME</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Weekend ride"/></div><div className="field"><label>ROUTE</label><input value={route} onChange={e=>setRoute(e.target.value)} placeholder="Ahmedabad → destination"/></div><div className="grid2"><div className="field"><label>START</label><input type="date" value={start} onChange={e=>setStart(e.target.value)}/></div><div className="field"><label>END</label><input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></div></div><div className="modalActions"><button className="secondary" onClick={()=>setAdd(false)}>Cancel</button><button className="confirm" onClick={save}>✓ Add ride</button></div></Modal>
  </>
}
