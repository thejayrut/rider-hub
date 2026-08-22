import { useEffect, type ReactNode } from 'react'

export function Modal({open,onClose,children,title}:{open:boolean;onClose:()=>void;children:ReactNode;title?:string}){
  useEffect(()=>{
    if(!open)return
    const prev=document.body.style.overflow
    document.body.style.overflow='hidden'
    history.pushState({...history.state,rhModal:true},'',location.href)
    const onPop=(event:PopStateEvent)=>{event.stopImmediatePropagation();onClose()}
    window.addEventListener('popstate',onPop,{once:true,capture:true})
    return()=>{document.body.style.overflow=prev;window.removeEventListener('popstate',onPop,{capture:true})}
  },[open,onClose])
  if(!open)return null
  const close=()=>{if(history.state?.rhModal)history.back();else onClose()}
  return <div className="modalBackdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section className="modalSheet" role="dialog" aria-modal="true" aria-label={title}><div className="grab"/>{children}</section></div>
}

export function ModalHead({kicker,title,onClose,desc}:{kicker:string;title:string;onClose:()=>void;desc?:string}){return <div className="modalHead"><div><div className="kicker">{kicker}</div><h3>{title}</h3>{desc&&<p>{desc}</p>}</div><button className="round" onClick={onClose}>×</button></div>}
