import { useEffect, useState } from 'react'
import { useRiderHub } from '../store/RiderHubProvider'
import { connectDrive, disconnectDrive, getDriveConfig, isDriveConnected, setDriveClientId, syncAppState } from '../services/googleDriveSync'
import { getMapsDemoKey } from '../services/googleMaps'
import { Modal, ModalHead } from './Modal'
import type { RiderHubState } from '../types'

type Panel='account'|'install'|'notifications'|'maps'|'backup'|'emergency'|'storage'|'settings'|'about'|null
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>}

export function MorePage(){
  const store=useRiderHub();const [panel,setPanel]=useState<Panel>(null),[install,setInstall]=useState<InstallEvent|null>(null),[status,setStatus]=useState('')
  useEffect(()=>{const onInstall=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent)};window.addEventListener('beforeinstallprompt',onInstall);return()=>window.removeEventListener('beforeinstallprompt',onInstall)},[])
  const drive=getDriveConfig(),syncLabel=isDriveConnected()?(drive.profile?.email||'Connected'):drive.clientId?'Reconnect needed':'Not connected'
  const doInstall=async()=>{if(!install){setStatus('Use your browser menu → Install app / Add to Home screen.');return}await install.prompt();const r=await install.userChoice;setStatus(r.outcome==='accepted'?'Install started.':'Install cancelled.');if(r.outcome==='accepted')setInstall(null)}
  const exportData=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(store.state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='RiderHub_Backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  const importData=(file:File|null)=>{if(!file)return;const r=new FileReader();r.onload=()=>{try{store.replaceState(JSON.parse(String(r.result)) as RiderHubState,'import backup');setStatus('Backup imported.')}catch{setStatus('That backup could not be read.')}};r.readAsText(file)}
  return <>
    <section className="card moreHero"><div className="kicker">MORE</div><h1>Rider Hub</h1><p>Account, app controls and utilities.</p></section>
    <div className="moreGrid">
      <MoreCard icon="◉" title="My Account" sub={syncLabel} onClick={()=>{setStatus('');setPanel('account')}}/>
      <MoreCard icon="↓" title="Install Rider Hub" sub="Add to phone or desktop" onClick={()=>{setStatus('');setPanel('install')}}/>
      <MoreCard icon="!" title="Notifications" sub="Ride and maintenance reminders" onClick={()=>{setStatus('');setPanel('notifications')}}/>
      <MoreCard icon="⌖" title="Weather & Maps" sub={getMapsDemoKey()?'Connected on this device':'Not connected'} onClick={()=>setPanel('maps')}/>
      <MoreCard icon="⇄" title="Backup / Import" sub="Export or restore app data" onClick={()=>{setStatus('');setPanel('backup')}}/>
      <MoreCard icon="SOS" title="Emergency contacts" sub="Manage from Ride Mode" onClick={()=>setPanel('emergency')}/>
      <MoreCard icon="▤" title="Files & storage" sub={syncLabel} onClick={()=>setPanel('storage')}/>
      <MoreCard icon="⚙" title="App settings" sub="Preferences and permissions" onClick={()=>setPanel('settings')}/>
      <MoreCard icon="RH" title="About Rider Hub" sub="Charcoal Ember" onClick={()=>setPanel('about')}/>
    </div>
    <Modal open={panel==='account'} onClose={()=>setPanel(null)} title="My Account"><AccountPanel status={status} setStatus={setStatus}/></Modal>
    <Modal open={panel==='install'} onClose={()=>setPanel(null)} title="Install"><ModalHead kicker="INSTALL" title="Install Rider Hub" onClose={()=>setPanel(null)}/><button className="primary full" onClick={doInstall}>Install app</button>{status&&<div className="inlineNote">{status}</div>}<div className="routeCard"><strong>Android / Chrome</strong><p>Browser menu → Install app or Add to Home screen.</p></div><div className="routeCard"><strong>Desktop Chrome / Edge</strong><p>Use the install icon in the address bar or browser menu.</p></div></Modal>
    <Modal open={panel==='notifications'} onClose={()=>setPanel(null)} title="Notifications"><NotificationSettings onClose={()=>setPanel(null)}/></Modal>
    <Modal open={panel==='maps'} onClose={()=>setPanel(null)} title="Weather & Maps"><ModalHead kicker="WEATHER + MAPS" title="Connection" onClose={()=>setPanel(null)}/><div className="routeCard"><strong>Status</strong><p>{getMapsDemoKey()?'Connected on this device.':'Not connected on this device.'}</p></div><div className="caption">Use the Weather Connect action in your Banswara ride to add or change the connection key.</div></Modal>
    <Modal open={panel==='backup'} onClose={()=>setPanel(null)} title="Backup"><ModalHead kicker="BACKUP" title="Export / Import" onClose={()=>setPanel(null)}/><div className="grid2"><button className="secondary" onClick={exportData}>Export JSON</button><label className="secondary fileButton">Import JSON<input type="file" accept="application/json,.json" onChange={e=>importData(e.target.files?.[0]??null)}/></label></div>{status&&<div className="inlineNote">{status}</div>}</Modal>
    <Modal open={panel==='emergency'} onClose={()=>setPanel(null)} title="Emergency"><ModalHead kicker="EMERGENCY" title="Contacts" onClose={()=>setPanel(null)}/><div className="routeCard"><strong>Ride Mode</strong><p>Open your ride → Ride Mode → Emergency to add, edit, delete or call custom contacts. 112 and 108 remain fixed actions.</p></div></Modal>
    <Modal open={panel==='storage'} onClose={()=>setPanel(null)} title="Storage"><ModalHead kicker="FILES & STORAGE" title="Your files" onClose={()=>setPanel(null)}/><div className="routeCard"><strong>Supported</strong><p>PDF · JPG/JPEG · PNG · WEBP · HEIC/HEIF · TIFF · GIF · BMP · DOC/DOCX · ODT · RTF · TXT</p></div><div className="routeCard"><strong>Cross-device sync</strong><p>{syncLabel}</p></div><button className="primary full" onClick={()=>setPanel('account')}>Open My Account</button></Modal>
    <Modal open={panel==='settings'} onClose={()=>setPanel(null)} title="Settings"><ModalHead kicker="SETTINGS" title="App settings" onClose={()=>setPanel(null)}/><div className="routeCard"><strong>Units</strong><p>Metric · km · °C · PSI</p></div><div className="routeCard"><strong>Theme</strong><p>Charcoal Ember</p></div></Modal>
    <Modal open={panel==='about'} onClose={()=>setPanel(null)} title="About"><ModalHead kicker="RIDER HUB" title="TVS Ronin · Charcoal Ember" onClose={()=>setPanel(null)} desc="Personal motorcycle OS"/></Modal>
  </>
}

function MoreCard({icon,title,sub,onClick}:{icon:string;title:string;sub:string;onClick:()=>void}){return <button className="moreCard" onClick={onClick}><b>{icon}</b><span><strong>{title}</strong><small>{sub}</small></span></button>}

function AccountPanel({status,setStatus}:{status:string;setStatus:(x:string)=>void}){
  const store=useRiderHub();const cfg=getDriveConfig();const [clientId,setClient]=useState(cfg.clientId||''),[busy,setBusy]=useState(false)
  const connect=async()=>{if(!clientId.trim())return setStatus('Add your Google Web Client ID first.');setDriveClientId(clientId);setBusy(true);setStatus('Connecting…');try{const p=await connectDrive(true);setStatus(`Connected as ${p.email}.`)}catch(e){setStatus(e instanceof Error?e.message:'Could not connect')}finally{setBusy(false)}}
  const sync=async()=>{setBusy(true);setStatus('Syncing…');try{if(!isDriveConnected())await connectDrive(false);const result=await syncAppState(store.state,s=>store.replaceState(s,'cloud sync'));setStatus(result==='downloaded'?'Downloaded newer Rider Hub data.':'Rider Hub data synced.')}catch(e){setStatus(e instanceof Error?e.message:'Sync failed')}finally{setBusy(false)}}
  return <><ModalHead kicker="MY ACCOUNT" title={cfg.profile?.name||'Rider Hub'} desc={cfg.profile?.email||'Connect Google Drive to use the same data and files across your devices.'}/><div className="routeCard"><strong>Cloud sync</strong><p>{isDriveConnected()?(cfg.profile?.email||'Connected'):cfg.clientId?'Reconnect needed':'Not connected'}{cfg.lastSync?` · Last sync ${new Date(cfg.lastSync).toLocaleString()}`:''}</p></div><div className="field"><label>GOOGLE WEB CLIENT ID</label><input value={clientId} onChange={e=>setClient(e.target.value)} placeholder="xxxxxxxx.apps.googleusercontent.com"/></div><div className="grid2"><button className="secondary" disabled={busy} onClick={connect}>{isDriveConnected()?'Reconnect':'Connect Google'}</button><button className="primary" disabled={busy||!clientId.trim()} onClick={sync}>Sync now</button></div>{cfg.clientId&&<button className="secondary full" onClick={()=>{disconnectDrive();setStatus('Disconnected.')}}>Disconnect</button>}{status&&<div className="inlineNote">{status}</div>}</>
}

function NotificationSettings({onClose}:{onClose:()=>void}){const [status,setStatus]=useState(typeof Notification==='undefined'?'unsupported':Notification.permission);const request=async()=>{if(typeof Notification==='undefined')return;setStatus(await Notification.requestPermission())};return <><ModalHead kicker="NOTIFICATIONS" title="Ride + maintenance alerts" onClose={onClose}/><div className="routeCard"><strong>Status</strong><p>{status==='granted'?'Allowed':status==='denied'?'Blocked in browser permissions':status==='default'?'Not enabled yet':'Not supported'}</p></div>{status==='default'&&<button className="primary full" onClick={request}>Enable notifications</button>}{status==='denied'&&<div className="alert">Open your browser site permissions and set Notifications to Allow.</div>}</>}
