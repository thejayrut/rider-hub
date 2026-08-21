import { useState } from 'react'
import { useRiderHub } from '../store/RiderHubProvider'
import { Modal, ModalHead } from './Modal'

const money=(n:number)=>`₹${Math.round(n).toLocaleString('en-IN')}`

export function BikePage(){
  const {state,updateOdometer}=useRiderHub();const b=state.bike
  const [edit,setEdit]=useState(false);const [odo,setOdo]=useState(String(b.currentOdometer));const [armed,setArmed]=useState(false)
  const chainKm=Math.max(0,b.currentOdometer-b.chainLastOdometer)
  const accessories=state.gear.filter(x=>x.category==='Bike Accessories'&&x.status==='owned')
  const save=()=>{const v=Math.round(Number(odo));if(!Number.isFinite(v)||v<0)return;if(v<b.currentOdometer&&!armed){setArmed(true);return}updateOdometer(v);setEdit(false);setArmed(false)}
  return <>
    <section className="card rideHero"><div className="kicker">MY MOTORCYCLE</div><h1>{b.manufacturer} {b.model}</h1><p>{b.variant} • {b.colour} • {b.year}</p><div className="metrics"><div><label>MASTER ODOMETER</label><b>{b.currentOdometer.toLocaleString('en-IN')} km</b></div><div><label>OWNED SINCE</label><b>{b.purchaseDate}</b></div></div></section>
    <div className="sectionHead"><div><div className="kicker">OVERVIEW</div><h2>Bike information</h2></div><button onClick={()=>{setOdo(String(b.currentOdometer));setEdit(true)}}>Edit odo</button></div>
    <div className="infoGrid">{[['Manufacturer',b.manufacturer],['Model',b.model],['Variant',b.variant],['Colour',b.colour],['Year',String(b.year)],['Engine',b.engine],['Braking',b.braking],['Transmission',b.transmission],['Fuel tank',b.fuelTank],['Tyres',b.tyres],['Insurance',b.insurance],['Next service',`${b.nextServiceKm.toLocaleString('en-IN')} km or ${b.nextServiceDate}`]].map(([k,v])=><div key={k}><label>{k.toUpperCase()}</label><b>{v}</b></div>)}</div>
    <div className="sectionHead"><div><div className="kicker">MAINTENANCE</div><h2>Maintenance engine</h2></div></div>
    <section className="card list"><div className="listRow"><div className="ico">⛓</div><div><strong>Chain clean + lube</strong><p>{chainKm} km since last care. Rider Hub reminder begins at 400 km; due by 500 km.</p></div><span className={`pill ${chainKm>500?'due':chainKm>=400?'soon':'good'}`}>{chainKm>500?'OVERDUE':chainKm>=400?'SOON':'GOOD'}</span></div><div className="listRow"><div className="ico">🔧</div><div><strong>Second service</strong><p>5,500–6,000 km or 6 months, whichever comes first.</p></div><span className="pill soon">UPCOMING</span></div><div className="listRow"><div className="ico">🛞</div><div><strong>Tyre pressure</strong><p>Check weekly and before long rides.</p></div><span className="pill good">WEEKLY</span></div></section>
    <div className="sectionHead"><div><div className="kicker">SERVICE HISTORY</div><h2>Completed work</h2></div></div><section className="card list">{b.serviceHistory.map(x=><div className="listRow" key={x.id}><div className="ico">✓</div><div><strong>{x.name}</strong><p>{x.date} · {x.odometer} km · {x.work}</p></div><b>{money(x.cost)}</b></div>)}</section>
    <div className="sectionHead"><div><div className="kicker">ACCESSORIES</div><h2>Installed / owned</h2></div></div><section className="card list">{accessories.map(x=><div className="listRow" key={x.id}><div className="ico">◇</div><div><strong>{x.name}</strong><p>{x.note||'Bike accessory'}</p></div><span className="pill good">OWNED</span></div>)}</section>
    <Modal open={edit} onClose={()=>setEdit(false)} title="Update odometer"><ModalHead kicker="MASTER ODOMETER" title="Update reading" onClose={()=>setEdit(false)} desc="This is the one authoritative odometer across Rider Hub."/><div className="field"><label>ODOMETER KM</label><input inputMode="numeric" value={odo} onChange={e=>{setOdo(e.target.value);setArmed(false)}}/></div>{armed&&<div className="alert red">This is lower than the current master odometer. Tap Confirm again only if this is a correction.</div>}<div className="modalActions"><button className="secondary" onClick={()=>setEdit(false)}>Close</button><button className="confirm" onClick={save}>✓ Confirm</button></div></Modal>
  </>
}
