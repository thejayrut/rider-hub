import type { RouteSegment } from '../types'

const KEY_STORAGE='riderhub_maps_demo_key'
export const BANSWARA={lat:23.5461,lng:74.4347}

export type WeatherSnapshot={
  temperature:number|null
  feelsLike:number|null
  description:string
  rainChance:number|null
  thunderChance:number|null
  humidity:number|null
  windKph:number|null
  updatedAt:string
}

export type DailyWeather={date:string;max:number|null;min:number|null;rainChance:number|null;description:string}
export type RouteIntel={distanceKm:number;durationMin:number;mode:'traffic-aware'|'basic';notice:string}

export function getMapsDemoKey(){return localStorage.getItem(KEY_STORAGE)?.trim()||''}
export function clearMapsDemoKey(){localStorage.removeItem(KEY_STORAGE)}
export function saveMapsDemoKey(key:string){localStorage.setItem(KEY_STORAGE,key.trim())}

async function getJson(url:string,init?:RequestInit){const r=await fetch(url,init);if(!r.ok){const text=await r.text().catch(()=>r.statusText);throw new Error(`${r.status} ${text.slice(0,160)}`)}return r.json()}

export async function validateMapsDemoKey(key:string){
  const q=new URLSearchParams({'key':key,'location.latitude':String(BANSWARA.lat),'location.longitude':String(BANSWARA.lng),'unitsSystem':'METRIC'})
  await getJson(`https://weather.googleapis.com/v1/currentConditions:lookup?${q}`)
  return true
}

export async function fetchCurrentWeather():Promise<WeatherSnapshot>{
  const key=getMapsDemoKey();if(!key)throw new Error('Weather & Maps not connected')
  const q=new URLSearchParams({'key':key,'location.latitude':String(BANSWARA.lat),'location.longitude':String(BANSWARA.lng),'unitsSystem':'METRIC'})
  const j=await getJson(`https://weather.googleapis.com/v1/currentConditions:lookup?${q}`)
  return {
    temperature:j.temperature?.degrees??null,
    feelsLike:j.feelsLikeTemperature?.degrees??null,
    description:j.weatherCondition?.description?.text??'Conditions available',
    rainChance:j.precipitation?.probability?.percent??null,
    thunderChance:j.thunderstormProbability??null,
    humidity:j.relativeHumidity??null,
    windKph:j.wind?.speed?.value??null,
    updatedAt:j.currentTime??new Date().toISOString()
  }
}

export async function fetchDailyWeather():Promise<DailyWeather[]>{
  const key=getMapsDemoKey();if(!key)throw new Error('Weather & Maps not connected')
  const q=new URLSearchParams({'key':key,'location.latitude':String(BANSWARA.lat),'location.longitude':String(BANSWARA.lng),'unitsSystem':'METRIC','days':'10','pageSize':'10'})
  const j=await getJson(`https://weather.googleapis.com/v1/forecast/days:lookup?${q}`)
  return (j.forecastDays??[]).map((x:any)=>({
    date:[x.displayDate?.year,String(x.displayDate?.month??'').padStart(2,'0'),String(x.displayDate?.day??'').padStart(2,'0')].join('-'),
    max:x.maxTemperature?.degrees??x.daytimeForecast?.maxTemperature?.degrees??null,
    min:x.minTemperature?.degrees??x.nighttimeForecast?.minTemperature?.degrees??null,
    rainChance:x.daytimeForecast?.precipitation?.probability?.percent??x.nighttimeForecast?.precipitation?.probability?.percent??null,
    description:x.daytimeForecast?.weatherCondition?.description?.text??'Forecast available'
  }))
}

async function compute(segment:RouteSegment,trafficAware:boolean):Promise<RouteIntel>{
  const key=getMapsDemoKey();if(!key)throw new Error('Weather & Maps not connected')
  const body:any={origin:{address:segment.origin},destination:{address:segment.destination},intermediates:segment.waypoints.map(address=>({address})),travelMode:'DRIVE',routingPreference:trafficAware?'TRAFFIC_AWARE':'TRAFFIC_UNAWARE',polylineQuality:'OVERVIEW'}
  if(trafficAware)body.extraComputations=['TRAFFIC_ON_POLYLINE']
  const j=await getJson('https://routes.googleapis.com/directions/v2:computeRoutes',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'routes.duration,routes.distanceMeters,routes.travelAdvisory.speedReadingIntervals'},body:JSON.stringify(body)})
  const r=j.routes?.[0];if(!r)throw new Error('No route returned')
  const seconds=Number(String(r.duration??'0s').replace('s',''))||0
  return {distanceKm:(r.distanceMeters??0)/1000,durationMin:seconds/60,mode:trafficAware?'traffic-aware':'basic',notice:trafficAware?'Traffic-aware ETA available.':'Route estimate available. Live traffic timing is not available for this route right now.'}
}

export async function computeRouteIntel(segment:RouteSegment):Promise<RouteIntel>{
  try{return await compute(segment,true)}catch(first){
    try{return await compute(segment,false)}catch{throw first}
  }
}

export function googleMapsUrl(segment:RouteSegment){
  const q=new URLSearchParams({api:'1',origin:segment.origin,destination:segment.destination,travelmode:'two-wheeler',dir_action:'navigate'})
  if(segment.waypoints.length)q.set('waypoints',segment.waypoints.join('|'))
  return `https://www.google.com/maps/dir/?${q.toString()}`
}
