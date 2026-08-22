import { useCallback, useEffect, useState } from 'react'
import { AccountModal } from './components/AccountModal'
import { BikePage } from './components/BikePage'
import { GearPage } from './components/GearPage'
import { MorePage } from './components/MorePage'
import { RideDetail } from './components/RideDetail'
import { RidesPage } from './components/RidesPage'
import { Modal, ModalHead } from './components/Modal'
import { useRiderHub } from './store/RiderHubProvider'

type Page='home'|'bike'|'rides'|'gear'|'more'

function parseHash(){const h=location.hash.replace(/^#/,'');if(h.startsWith('ride/'))return{page:'rides' as Page,rideId:decodeURIComponent(h.slice(5))};if(['home','bike','rides','gear','more'].includes(h))return{page:h as Page,rideId:null};if(h==='docs')return{page:'bike' as Page,rideId:null};return{page:'home' as Page,rideId:null}}

export default function App(){
  const store=useRiderHub(),initial=parseHash();const [page,setPageState]=useState<Page>(initial.page),[rideId,setRideId]=useState<string|null>(initial.rideId),[notifications,setNotifications]=useState(false),[account,setAccount]=useState(false)
  const navigate=useCallback((next:Page)=>{setPageState(next);setRideId(null);history.pushState({page:next},'',`${location.pathname}#${next}`);window.scrollTo(0,0)},[])
  const openRide=useCallback((id:string)=>{setPageState('rides');setRideId(id);history.pushState({page:'rides',rideId:id},'',`${location.pathname}#ride/${encodeURIComponent(id)}`);window.scrollTo(0,0)},[])
  const backToRides=()=>{if(location.hash.startsWith('#ride/'))history.back();else{setRideId(null);navigate('rides')}}
  useEffect(()=>{const pop=()=>{const p=parseHash();setPageState(p.page);setRideId(p.rideId);window.scrollTo(0,0)};window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop)},[])
  const chainKm=Math.max(0,store.state.bike.currentOdometer-store.state.bike.chainLastOdometer)
  return <div className="appShell"><div className="topo"/><header className="appHeader"><button className="brand accountBrand" onClick={()=>setAccount(true)} aria-label="My Account"><div className="mark">RH</div><div><b>TVS <em>RONIN</em></b><small>CHARCOAL EMBER</small></div></button><div className="headerActions"><button className="round" disabled={!store.canUndo} title={store.canUndo?`Undo ${store.lastChange}`:'Nothing to undo'} onClick={store.undo}>↶</button><button className="round" onClick={()=>setNotifications(true)}>!</button></div></header><main>
    {page==='home'&&<Home onPage={navigate} chainKm={chainKm}/>} 
    {page==='bike'&&<BikePage/>}
    {page==='gear'&&<GearPage/>}
    {page==='more'&&<MorePage/>}
    {page==='rides'&&(rideId?<RideDetail rideId={rideId} onBack={backToRides}/>:<RidesPage onOpen={openRide}/>)}
  </main><nav className="bottomNav">{(['home','bike','rides','gear','more'] as Page[]).map(p=><button className={page===p?'active':''} onClick={()=>navigate(p)} key={p}><b>{p==='home'?'⌂':p==='bike'?'◇':p==='rides'?'↗':p==='gear'?'▣':'•••'}</b><span>{p[0].toUpperCase()+p.slice(1)}</span></button>)}</nav><NotificationPanel open={notifications} onClose={()=>setNotifications(false)}/><AccountModal open={account} onClose={()=>setAccount(false)}/></div>
}

function Home({onPage,chainKm}:{onPage:(p:Page)=>void;chainKm:number}){const {state}=useRiderHub();const b=state.bike;return <><section className="card hero"><div className="kicker">RIDER HUB</div><h1>Your motorcycle OS.<br/><span>Ready for the next ride.</span></h1><button className="bikePlate" onClick={()=>onPage('bike')}><div className="row between"><div><strong>{b.manufacturer} {b.model}</strong><small>{b.variant} • {b.colour} • {b.year}</small></div><span className={`pill ${chainKm>500?'due':chainKm>=400?'soon':'good'}`}>CHAIN {chainKm} KM</span></div><div className="metrics"><div><label>ODOMETER</label><b>{b.currentOdometer.toLocaleString('en-IN')} km</b></div><div><label>NEXT SERVICE</label><b className="ember">{b.nextServiceKm.toLocaleString('en-IN')} km</b></div></div></button></section><div className="sectionHead"><div><div className="kicker">QUICK ACCESS</div><h2>Rider controls</h2></div></div><div className="quickGrid"><button onClick={()=>onPage('rides')}><b>↗</b><span>Upcoming ride</span></button><button onClick={()=>onPage('bike')}><b>◉</b><span>Odometer</span></button><button onClick={()=>onPage('gear')}><b>▣</b><span>Gear</span></button><button onClick={()=>onPage('more')}><b>•••</b><span>More</span></button></div><div className="sectionHead"><div><div className="kicker">NEEDS ATTENTION</div><h2>Bike status</h2></div></div><section className="card attention"><div className="row between"><div><strong>Chain care</strong><div className="caption">Reminder at 400 km · due by 500 km</div></div><span className={`pill ${chainKm>500?'due':chainKm>=400?'soon':'good'}`}>{chainKm>500?'OVERDUE':chainKm>=400?'DUE SOON':'GOOD'}</span></div><div className="progress"><i style={{width:`${Math.min(100,chainKm/5)}%`}}/></div></section></>}

function NotificationPanel({open,onClose}:{open:boolean;onClose:()=>void}){const [status,setStatus]=useState(typeof Notification==='undefined'?'unsupported':Notification.permission);const request=async()=>{if(typeof Notification==='undefined')return;setStatus(await Notification.requestPermission())};return <Modal open={open} onClose={onClose} title="Notifications"><ModalHead kicker="NOTIFICATIONS" title="Ride + maintenance alerts" onClose={onClose}/><div className="routeCard"><strong>Status</strong><p>{status==='granted'?'Allowed':status==='denied'?'Blocked in browser permissions':status==='default'?'Not enabled yet':'Not supported in this browser'}</p></div>{status==='default'&&<button className="primary full" onClick={request}>Enable notifications</button>}{status==='denied'&&<div className="alert">Open your browser site permissions and set Notifications to Allow.</div>}</Modal>}
