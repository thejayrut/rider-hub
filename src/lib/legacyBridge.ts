import { DEFAULT_GEAR, DEFAULT_STATE } from '../domain/defaultData'
import type { GearItem, RiderHubState, RideTaskStatus } from '../types'

const LEGACY_KEYS=['riderhub_v6','riderhub_phase2d_v1','riderhub_phase2c_v1','riderhub_phase2b_v1']
const clone=<T,>(x:T):T=>JSON.parse(JSON.stringify(x)) as T

function normalizeGear(source:any):GearItem[]{
  const raw=Array.isArray(source)?source:Array.isArray(source?.items)?source.items:[]
  if(!raw.length)return clone(DEFAULT_GEAR)
  const oldWasSimplified=raw.length<20&&raw.some((x:any)=>/^g\d+$/.test(String(x.id??'')))
  if(oldWasSimplified)return clone(DEFAULT_GEAR)
  const defaults=new Map(DEFAULT_GEAR.map(x=>[x.id,clone(x)]))
  for(const x of raw){
    const id=String(x.id??crypto.randomUUID())
    const base=defaults.get(id)
    const category=(x.category??base?.category??'Riding Gear') as GearItem['category']
    const owner=(x.owner??base?.owner??'Jayrut') as GearItem['owner']
    defaults.set(id,{...(base??{} as GearItem),id,name:String(x.name??base?.name??'Gear item'),category,owner,status:x.status==='planned'?'planned':'owned',amount:x.amount==null?base?.amount??null:Number(x.amount),qty:Math.max(1,Number(x.qty??base?.qty??1)),purchaseDate:x.purchaseDate??base?.purchaseDate??'',note:x.note??base?.note??''})
  }
  return [...defaults.values()]
}

export function loadLegacyState():RiderHubState{
  const next=clone(DEFAULT_STATE)
  try{
    let legacy:any=null
    for(const key of LEGACY_KEYS){const raw=localStorage.getItem(key);if(raw){legacy=JSON.parse(raw);break}}
    if(!legacy)return next

    next.bike.manufacturer=legacy.bike?.manufacturer??next.bike.manufacturer
    next.bike.model=legacy.bike?.model??next.bike.model
    next.bike.variant=legacy.bike?.variant??legacy.bike?.trim?.split('•')?.[0]?.trim()??next.bike.variant
    next.bike.colour=legacy.bike?.colour??next.bike.colour
    next.bike.year=Number(legacy.bike?.year??next.bike.year)
    next.bike.currentOdometer=Number(legacy.bike?.odo??legacy.bike?.currentOdometer??next.bike.currentOdometer)
    next.bike.braking=legacy.bike?.braking??next.bike.braking
    next.bike.chainLastOdometer=Number(legacy.bike?.chainLast??legacy.maintenance?.chain?.odometer??next.bike.chainLastOdometer)
    next.gear=normalizeGear(legacy.gear)

    const r=next.rides[0]
    const oldRide=legacy.ride??legacy.rides?.items?.find((x:any)=>x.id==='ride_banswara_2026')
    if(oldRide){
      if(Number.isFinite(Number(oldRide.selectedDay)))r.operations.selectedDay=Math.max(0,Math.min(Number(oldRide.selectedDay),r.days.length-1))
      const oldTasks=oldRide.tasks??{}
      for(const day of r.days){
        for(let i=0;i<day.tasks.length;i++){
          const t=day.tasks[i]
          const oldKey=`${day.day}_${i}`
          const val=oldTasks[oldKey]??oldRide.days?.find((d:any)=>d.day===day.day)?.tasks?.[i]?.status
          if(['upcoming','done','delayed','skipped'].includes(val))r.operations.tasks[t.id]=val as RideTaskStatus
          const delay=oldTasks[`${oldKey}_delay`]??oldRide.days?.find((d:any)=>d.day===day.day)?.tasks?.[i]?.delayMin
          if(delay!=null)r.operations.delays[t.id]=Number(delay)
        }
      }
      if(oldRide.expenses)r.operations.expenses={...r.operations.expenses,...oldRide.expenses}
      if(Array.isArray(oldRide.fuelLogs))r.operations.fuelLogs=oldRide.fuelLogs.map((x:any)=>({id:String(x.id??crypto.randomUUID()),odometer:Number(x.odo??x.odometer??next.bike.currentOdometer),litres:Number(x.litres??0),amount:Number(x.amount??0),createdAt:String(x.createdAt??x.time??new Date().toISOString())}))
      r.operations.notes=String(oldRide.notes??'')
      r.operations.issues=Array.isArray(oldRide.issues)?oldRide.issues.map((x:any)=>({id:String(x.id??crypto.randomUUID()),note:String(x.note??''),severity:(x.severity??'Monitor'),odometer:Number(x.odo??x.odometer??next.bike.currentOdometer),createdAt:String(x.createdAt??x.time??new Date().toISOString())})):[]
      r.operations.packing={...r.operations.packing,...(oldRide.packing??{})}
      r.operations.content={...r.operations.content,...(oldRide.content??{})}
      r.operations.backup={...r.operations.backup,...(oldRide.backup??{})}
      r.operations.preflight={...r.operations.preflight,...(oldRide.preflight??{})}
      if(Array.isArray(oldRide.customEmergency))r.operations.customEmergency=oldRide.customEmergency.slice(0,3)
    }
    return next
  }catch{return next}
}
