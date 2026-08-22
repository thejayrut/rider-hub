import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DEFAULT_STATE } from '../domain/defaultData'
import { loadLegacyState } from '../lib/legacyBridge'
import { markLocalModified } from '../services/googleDriveSync'
import type { BikeIssue, ExpenseState, GearItem, RiderHubState, RideTaskStatus } from '../types'

const STORAGE_KEY = 'riderhub_phase3_v1'

const clone = <T,>(value:T):T => JSON.parse(JSON.stringify(value)) as T

function loadInitial(): RiderHubState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as RiderHubState
  } catch { /* use migration */ }
  return loadLegacyState()
}

type Store = {
  state: RiderHubState
  canUndo: boolean
  lastChange: string
  undo: () => void
  replaceState: (value:RiderHubState,label?:string) => void
  updateOdometer: (value:number) => void
  selectRideDay: (rideId:string, dayIndex:number) => void
  setTask: (rideId:string, dayIndex:number, taskId:string, status:RideTaskStatus) => void
  delayTask: (rideId:string, dayIndex:number, taskId:string, minutes:number) => void
  commitExpenses: (rideId:string, expenses:ExpenseState) => void
  addFuel: (rideId:string, odometer:number, litres:number, amount:number) => void
  setNotes: (rideId:string, notes:string) => void
  addIssue: (rideId:string, issue:Omit<BikeIssue,'id'|'createdAt'|'odometer'>) => void
  togglePreflight: (rideId:string, dayIndex:number, key:string) => void
  toggleChecklist: (rideId:string, group:'packing'|'content'|'backup', key:string) => void
  setEmergencyContacts: (rideId:string, contacts:string[]) => void
  saveGear: (item:GearItem) => void
  deleteGear: (id:string) => void
}

const Ctx = createContext<Store | null>(null)

export function RiderHubProvider({children}:{children:ReactNode}){
  const [state,setState] = useState<RiderHubState>(loadInitial)
  const [undoStack,setUndoStack] = useState<RiderHubState[]>([])
  const [lastChange,setLastChange] = useState('')
  const firstPersist=useRef(true)

  useEffect(()=>{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state))
    if(firstPersist.current){firstPersist.current=false}else markLocalModified()
  },[state])

  const mutate = useCallback((label:string, fn:(next:RiderHubState)=>void)=>{
    setState(prev=>{
      setUndoStack(stack=>[...stack.slice(-39),clone(prev)])
      setLastChange(label)
      const next=clone(prev)
      fn(next)
      return next
    })
  },[])

  const undo=useCallback(()=>{
    setUndoStack(stack=>{
      if(!stack.length)return stack
      const previous=stack[stack.length-1]
      setState(previous)
      setLastChange('Undo')
      return stack.slice(0,-1)
    })
  },[])

  const replaceState=useCallback((value:RiderHubState,label='cloud sync')=>{
    setState(prev=>{setUndoStack(stack=>[...stack.slice(-39),clone(prev)]);setLastChange(label);return clone(value)})
  },[])

  const updateOdometer=(value:number)=>mutate('odometer',next=>{next.bike.currentOdometer=Math.max(0,Math.round(value))})
  const selectRideDay=(rideId:string,dayIndex:number)=>mutate('selected ride day',next=>{const r=next.rides.find(x=>x.id===rideId);if(r)r.operations.selectedDay=Math.max(0,Math.min(dayIndex,r.days.length-1))})

  const setTask=(rideId:string,dayIndex:number,taskId:string,status:RideTaskStatus)=>mutate('ride task',next=>{
    const r=next.rides.find(x=>x.id===rideId);if(!r)return
    r.operations.tasks[taskId]=status
    delete r.operations.delays[taskId]
    const day=r.days[dayIndex];if(!day)return
    const complete=day.tasks.every(t=>['done','skipped'].includes(r.operations.tasks[t.id]??t.status))
    if(complete&&dayIndex<r.days.length-1)r.operations.selectedDay=dayIndex+1
  })

  const delayTask=(rideId:string,dayIndex:number,taskId:string,minutes:number)=>mutate('ride delay',next=>{
    const r=next.rides.find(x=>x.id===rideId);if(!r)return
    r.operations.tasks[taskId]='delayed';r.operations.delays[taskId]=Math.max(0,Math.round(minutes));r.operations.selectedDay=dayIndex
  })

  const commitExpenses=(rideId:string,expenses:ExpenseState)=>mutate('expenses',next=>{const r=next.rides.find(x=>x.id===rideId);if(r)r.operations.expenses=clone(expenses)})

  const addFuel=(rideId:string,odometer:number,litres:number,amount:number)=>mutate('fuel log',next=>{
    const r=next.rides.find(x=>x.id===rideId);if(!r)return
    const safeAmount=Math.max(0,Number(amount)||0)
    const safeOdo=Math.max(0,Math.round(odometer))
    r.operations.fuelLogs.push({id:crypto.randomUUID(),odometer:safeOdo,litres:Math.max(0,Number(litres)||0),amount:safeAmount,createdAt:new Date().toISOString()})
    r.operations.expenses.fuel+=safeAmount
    if(safeOdo>next.bike.currentOdometer)next.bike.currentOdometer=safeOdo
  })

  const setNotes=(rideId:string,notes:string)=>mutate('ride notes',next=>{const r=next.rides.find(x=>x.id===rideId);if(r)r.operations.notes=notes})
  const addIssue=(rideId:string,issue:Omit<BikeIssue,'id'|'createdAt'|'odometer'>)=>mutate('bike issue',next=>{const r=next.rides.find(x=>x.id===rideId);if(r)r.operations.issues.push({...issue,id:crypto.randomUUID(),createdAt:new Date().toISOString(),odometer:next.bike.currentOdometer})})
  const togglePreflight=(rideId:string,dayIndex:number,key:string)=>mutate('pre-ride check',next=>{const r=next.rides.find(x=>x.id===rideId);if(r){const k=`${dayIndex}_${key}`;r.operations.preflight[k]=!r.operations.preflight[k]}})
  const toggleChecklist=(rideId:string,group:'packing'|'content'|'backup',key:string)=>mutate(group+' checklist',next=>{const r=next.rides.find(x=>x.id===rideId);if(r)r.operations[group][key]=!r.operations[group][key]})
  const setEmergencyContacts=(rideId:string,contacts:string[])=>mutate('emergency contacts',next=>{const r=next.rides.find(x=>x.id===rideId);if(r)r.operations.customEmergency=contacts.slice(0,3)})
  const saveGear=(item:GearItem)=>mutate(state.gear.some(x=>x.id===item.id)?'edit gear':'add gear',next=>{const i=next.gear.findIndex(x=>x.id===item.id);if(i>=0)next.gear[i]=item;else next.gear.push(item)})
  const deleteGear=(id:string)=>mutate('delete gear',next=>{next.gear=next.gear.filter(x=>x.id!==id)})

  const value=useMemo<Store>(()=>({state,canUndo:undoStack.length>0,lastChange,undo,replaceState,updateOdometer,selectRideDay,setTask,delayTask,commitExpenses,addFuel,setNotes,addIssue,togglePreflight,toggleChecklist,setEmergencyContacts,saveGear,deleteGear}),[state,undoStack.length,lastChange,undo,replaceState])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRiderHub(){const x=useContext(Ctx);if(!x)throw new Error('useRiderHub must be used inside RiderHubProvider');return x}
export { DEFAULT_STATE }
