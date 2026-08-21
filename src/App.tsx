import { useMemo, useState } from 'react'
import { loadLegacyState } from './lib/legacyBridge'
import type { GearItem, Ride } from './types'

type Page = 'home' | 'bike' | 'rides' | 'gear' | 'docs'

const money = (n: number | null) => n == null ? 'PRICE TBD' : `₹${Math.round(n).toLocaleString('en-IN')}`

function GearPage({ gear }: { gear: GearItem[] }) {
  const [status, setStatus] = useState<'all'|'owned'|'planned'>('all')
  const [owner, setOwner] = useState<'all'|'Jayrut'|'Mom'|'Bike / Shared'>('all')
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => gear.filter(x => (status==='all'||x.status===status) && (owner==='all'||x.owner===owner) && `${x.name} ${x.category} ${x.owner} ${x.note ?? ''}`.toLowerCase().includes(query.toLowerCase())), [gear,status,owner,query])
  const owned = gear.filter(x=>x.status==='owned')
  const planned = gear.filter(x=>x.status==='planned')
  const categories = ['Riding Gear','Luggage','Electronics','Bike Accessories','Camera & Mounts','Cleaning & Care'] as const
  const symbol = (c: GearItem['category']) => c==='Riding Gear'?'◒':c==='Luggage'?'▣':c==='Electronics'?'◉':c==='Camera & Mounts'?'◎':c==='Cleaning & Care'?'✦':'◇'
  return <>
    <section className="card gearHero">
      <div className="kicker">GEAR GARAGE</div><h1>Your riding inventory</h1>
      <p>Owned gear, planned purchases, bike setup, luggage, electronics and care items — all in one editable garage.</p>
      <div className="gearSummary">
        <div><label>OWNED</label><b>{owned.length}</b><small>products in garage</small></div>
        <div><label>WILL BUY</label><b>{planned.length}</b><small>planned products</small></div>
        <div><label>KNOWN SPEND</label><b>{money(owned.reduce((a,x)=>a+(x.amount??0),0))}</b><small>excludes unknown prices</small></div>
        <div><label>PLANNED BUDGET</label><b>{money(planned.reduce((a,x)=>a+(x.amount??0),0))}</b><small>known expected prices</small></div>
      </div>
    </section>
    <div className="gearToolbar">
      <div className="gearSearch"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search helmet, luggage, Mom…" /></div>
      <div className="chips">{(['all','owned','planned'] as const).map(v=><button className={status===v?'active':''} onClick={()=>setStatus(v)} key={v}>{v==='all'?'ALL':v==='owned'?'BOUGHT':'WILL BUY'}</button>)}</div>
      <div className="chips">{(['all','Jayrut','Mom','Bike / Shared'] as const).map(v=><button className={owner===v?'active':''} onClick={()=>setOwner(v)} key={v}>{v==='all'?'EVERYTHING':v==='Jayrut'?'MY GEAR':v.toUpperCase()}</button>)}</div>
    </div>
    {categories.map(cat=>{
      const rows=filtered.filter(x=>x.category===cat); if(!rows.length)return null
      return <section key={cat}><div className="sectionTitle"><h3>{cat}</h3><span>{rows.length} {rows.length===1?'ITEM':'ITEMS'}</span></div><div className="gearList">{rows.map(x=><article className="gearCard" key={x.id}><div className="gearAvatar">{symbol(x.category)}</div><div className="min0"><h4>{x.name}{x.qty>1?` ×${x.qty}`:''}</h4><div className="gearMeta">{x.owner} • {x.category}</div></div><div className="gearRight"><b className={x.amount==null?'unknown':''}>{money(x.amount)}</b><span className={x.status}>{x.status==='owned'?'BOUGHT':'WILL BUY'}</span></div></article>)}</div></section>
    })}
    <div className="dataNote">Prices marked unknown stay blank rather than being guessed.</div>
  </>
}

function RidesPage({ ride, onBackToList }: { ride?: Ride; onBackToList?: () => void }) {
  if (ride && onBackToList) return <>
    <button className="backLink" onClick={onBackToList}>‹ My rides</button>
    <section className="card rideHero"><div className="kicker">UPCOMING RIDE</div><h1>{ride.name}</h1><p>{ride.startDate} → {ride.endDate} · {ride.riders} riders</p></section>
    {ride.days.map(day=><section className="card dayCard" key={day.day}><div className="row between"><div><div className="kicker">DAY {day.day}</div><h3>{day.from} → {day.to}</h3></div><span className="pill">{day.date}</span></div><div className="timeline">{day.tasks.map(t=><div className={`task ${t.status}`} key={t.id}><time>{t.time}</time><div><strong>{t.title}</strong><p>{t.desc}</p></div><span>{t.status.toUpperCase()}</span></div>)}</div></section>)}
  </>
  return null
}

export default function App(){
  const [data] = useState(loadLegacyState)
  const [page,setPage] = useState<Page>('home')
  const [selectedRide,setSelectedRide] = useState<Ride|null>(null)
  const ride=data.rides[0]
  const rideProgress = ride?.days.flatMap(d=>d.tasks).length ? Math.round((ride.days.flatMap(d=>d.tasks).filter(t=>t.status==='done'||t.status==='skipped').length / ride.days.flatMap(d=>d.tasks).length)*100) : 0
  return <div className="appShell">
    <div className="topo" />
    <header><div className="brand"><div className="mark">RH</div><div><b>RIDER <em>HUB</em></b><small>PHASE 3 · CHARCOAL EMBER</small></div></div><span className="phase">REACT + TYPESCRIPT</span></header>
    <main>
      {page==='home' && <><section className="card hero"><div className="kicker">RIDER HUB</div><h1>Your motorcycle OS.<br/><span>Production architecture begins here.</span></h1><div className="bikePlate"><strong>{data.bike.manufacturer} {data.bike.model}</strong><small>{data.bike.variant} • {data.bike.colour} • {data.bike.year}</small><div className="metrics"><div><label>ODOMETER</label><b>{data.bike.currentOdometer.toLocaleString('en-IN')} km</b></div><div><label>ARCHITECTURE</label><b>Phase 3</b></div></div></div></section><div className="sectionTitle"><h3>Migration status</h3></div><section className="card infoCard">Existing Phase 2 local data is read through a migration bridge so Gear, Bike and Ride data do not need to be re-entered.</section></>}
      {page==='bike' && <><section className="card rideHero"><div className="kicker">MY MOTORCYCLE</div><h1>{data.bike.manufacturer} {data.bike.model}</h1><p>{data.bike.variant} • {data.bike.colour} • {data.bike.year}</p></section><div className="infoGrid"><div><label>ODOMETER</label><b>{data.bike.currentOdometer.toLocaleString('en-IN')} km</b></div><div><label>BRAKING</label><b>{data.bike.braking}</b></div><div><label>MODEL</label><b>{data.bike.model}</b></div><div><label>COLOUR</label><b>{data.bike.colour}</b></div></div></>}
      {page==='gear' && <GearPage gear={data.gear} />}
      {page==='rides' && (selectedRide ? <RidesPage ride={selectedRide} onBackToList={()=>setSelectedRide(null)} /> : <><div className="sectionHead"><div><div className="kicker">MY RIDES</div><h2>Plan. Ride. Remember.</h2></div><button>+ Add ride</button></div><div className="rideSummary"><div className="card stat"><label>UPCOMING</label><b>1</b><small>planned</small></div><div className="card stat"><label>COMPLETED</label><b>0</b><small>rides</small></div><div className="card stat"><label>TOURING</label><b>{ride?.touringKm ?? 0}</b><small>km logged</small></div></div>{ride&&<article className="card rideCard" onClick={()=>setSelectedRide(ride)}><div className="rideCardTop"><div><div className="kicker">OFFLINE READY</div><h3>{ride.name}</h3><div className="route">{ride.route}</div></div><span className="rideStatus">UPCOMING</span></div><div className="rideMeta"><span>{ride.startDate} → {ride.endDate}</span><span>{ride.riders} riders</span><span>{ride.days.length} days</span></div><div className="progress"><i style={{width:`${rideProgress}%`}} /></div></article>}</>)}
      {page==='docs' && <><section className="card rideHero"><div className="kicker">DOCUMENT VAULT</div><h1>Bike + rider documents</h1><p>The Phase 3 backend will move private files from browser-only storage to authenticated encrypted cloud storage without exposing them in GitHub.</p></section><section className="card infoCard">DigiLocker remains a server-side connector target after official Requester onboarding and OAuth credentials are available.</section></>}
    </main>
    <nav>{(['home','bike','rides','gear','docs'] as Page[]).map(p=><button className={page===p?'active':''} onClick={()=>{setPage(p);if(p==='rides')setSelectedRide(null)}} key={p}>{p==='home'?'⌂':p==='bike'?'◇':p==='rides'?'↗':p==='gear'?'▣':'▤'}<span>{p[0].toUpperCase()+p.slice(1)}</span></button>)}</nav>
  </div>
}
