import type { Ride } from '../types'
import { useRiderHub } from '../store/RiderHubProvider'

const progress=(r:Ride)=>{const all=r.days.flatMap(d=>d.tasks);if(!all.length)return 0;const done=all.filter(t=>['done','skipped'].includes(r.operations.tasks[t.id]??t.status)).length;return Math.round(done/all.length*100)}

export function RidesPage({onOpen}:{onOpen:(rideId:string)=>void}){
  const {state}=useRiderHub();const upcoming=state.rides.filter(r=>r.status!=='completed'),completed=state.rides.filter(r=>r.status==='completed')
  return <>
    <div className="sectionHead first"><div><div className="kicker">MY RIDES</div><h2>Plan. Ride. Remember.</h2></div><button disabled title="Manual ride editor moves after parity">+ Add ride</button></div>
    <div className="rideSummary"><div className="card stat"><label>UPCOMING</label><b>{upcoming.length}</b><small>planned</small></div><div className="card stat"><label>COMPLETED</label><b>{completed.length}</b><small>rides</small></div><div className="card stat"><label>TOURING</label><b>{state.rides.reduce((a,r)=>a+r.touringKm,0)}</b><small>km logged</small></div></div>
    <div className="rideList">{upcoming.map(r=><article className="card rideCard" key={r.id} onClick={()=>onOpen(r.id)}><div className="rideCardTop"><div><div className="kicker">{r.offlineReady?'OFFLINE READY':'PLANNED'}</div><h3>{r.name}</h3><div className="route">{r.route}</div></div><span className="rideStatus">UPCOMING</span></div><div className="rideMeta"><span>{r.startDate} → {r.endDate}</span><span>{r.riders} rider{r.riders===1?'':'s'}</span><span>{r.days.length} days</span></div><div className="progress"><i style={{width:`${progress(r)}%`}}/></div></article>)}</div>
    {!upcoming.length&&<div className="emptyState">No upcoming rides.</div>}
  </>
}
