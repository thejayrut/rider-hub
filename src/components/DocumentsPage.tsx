import { useState } from 'react'
import { useRiderHub } from '../store/RiderHubProvider'
import { deletePrivateDoc, getPrivateDoc, openPrivateDoc, savePrivateDoc } from '../services/privateDocs'
import { Modal, ModalHead } from './Modal'
import type { DocumentRecord } from '../types'

export function DocumentsPage(){
  const {state}=useRiderHub();const [selected,setSelected]=useState<DocumentRecord|null>(null);const [message,setMessage]=useState('')
  const attach=async(file:File|null)=>{if(!selected||!file)return;await savePrivateDoc(selected.id,file);setMessage(`${file.name} saved privately on this device.`)}
  const open=async()=>{if(!selected)return;const ok=await openPrivateDoc(selected.id);setMessage(ok?'Opened private file.':'No private file attached yet.')}
  const remove=async()=>{if(!selected)return;await deletePrivateDoc(selected.id);setMessage('Private attachment removed.')}
  return <>
    <section className="card rideHero"><div className="kicker">DOCUMENT VAULT</div><h1>Bike + rider documents</h1><p>Sensitive identifiers stay masked. Private file bytes stay in IndexedDB on this device until an authenticated zero-cost cloud option is selected.</p></section>
    <div className="sectionHead"><div><div className="kicker">VAULT</div><h2>Stored records</h2></div></div><section className="card list">{state.documents.map(x=><button className="listRow docRow" key={x.id} onClick={()=>{setSelected(x);setMessage('')}}><div className="ico">▤</div><div><strong>{x.name}</strong><p>{x.summary}</p></div><span className="pill good">SAVED</span></button>)}</section>
    <div className="sectionHead"><div><div className="kicker">DIGILOCKER</div><h2>Verified documents</h2></div></div><section className="card infoCard"><div className="row between"><div><strong>DigiLocker connector</strong><p className="caption">Prepared as a future server-side OAuth connector. Official Requester onboarding and credentials are required; no OTP, password or client secret will ever be placed in browser code.</p></div><span className="pill soon">NOT CONNECTED</span></div></section>
    <Modal open={!!selected} onClose={()=>setSelected(null)} title="Document"><ModalHead kicker="DOCUMENT" title={selected?.name??''} onClose={()=>setSelected(null)} desc={selected?.summary}/>{selected&&<><div className="alert">{selected.detail}</div><div className="docActions"><button className="secondary" onClick={open}>Open attached file</button><label className="secondary fileButton">Attach / replace<input type="file" accept="application/pdf,image/*" onChange={e=>attach(e.target.files?.[0]??null)}/></label><button className="danger" onClick={remove}>Remove attachment</button></div>{message&&<div className="inlineNote">{message}</div>}<PrivateStatus id={selected.id}/></>}</Modal>
  </>
}

function PrivateStatus({id}:{id:string}){const [name,setName]=useState('Checking…');useState(()=>{getPrivateDoc(id).then(f=>setName(f?`Attached: ${f.name}`:'No file attached yet')).catch(()=>setName('Could not read private storage'))});return <div className="caption" style={{marginTop:10}}>{name}</div>}
