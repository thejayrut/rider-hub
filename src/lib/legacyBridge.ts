import type { GearItem, RiderHubState, Ride, RideDay, RideTask } from '../types'

const LEGACY_KEY = 'riderhub_v6'

const fallbackRide: Ride = {
  id: 'ride_banswara_2026',
  name: 'Banswara 3-Day Ronin Adventure',
  status: 'planned',
  startDate: '2026-08-28',
  endDate: '2026-08-30',
  route: 'Ahmedabad → Banswara → Ahmedabad',
  riders: 2,
  offlineReady: true,
  touringKm: 0,
  days: []
}

export function loadLegacyState(): RiderHubState {
  const fallback: RiderHubState = {
    bike: { id: 'bike_ronin_2026', manufacturer: 'TVS', model: 'Ronin', variant: 'Mid', colour: 'Charcoal Ember', year: 2026, currentOdometer: 3200, braking: 'Dual-Channel ABS' },
    gear: [],
    rides: [fallbackRide]
  }

  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return fallback
    const legacy = JSON.parse(raw) as any
    const gearSource = Array.isArray(legacy.gear) ? legacy.gear : Array.isArray(legacy.gear?.items) ? legacy.gear.items : []
    const gear: GearItem[] = gearSource.map((x: any) => ({
      id: String(x.id ?? crypto.randomUUID()),
      name: String(x.name ?? 'Gear item'),
      category: x.category ?? 'Riding Gear',
      owner: x.owner ?? 'Jayrut',
      status: x.status === 'planned' ? 'planned' : 'owned',
      amount: x.amount == null ? null : Number(x.amount),
      qty: Math.max(1, Number(x.qty ?? 1)),
      purchaseDate: x.purchaseDate || '',
      note: x.note || ''
    }))

    const taskMap = legacy.ride?.tasks ?? {}
    const dayDefs: Array<{day:number;date:string;from:string;to:string;title:string;tasks:Array<[string,string,string]>}> = [
      {day:1,date:'2026-08-28',from:'Ahmedabad',to:'Banswara',title:'Travel + Mangarh + relaxed Banswara',tasks:[['04:15','Wake / light food','Final tyre, chain, brakes, rain gear, straps and documents.'],['05:00','Leave Home','Start before traffic builds.'],['09:15','Mangarh Dham','Quiet morning target.'],['12:00','Hotel check-in','Lunch and remove wet gear.'],['15:15','Anand Sagar + Kalpavriksha','Short quiet stop.'],['16:15','Kagdi Pick Up Weir','Leave if crowded.'],['20:00','Fuel + prep','Fill bike and prep Saturday bag.'],['21:15','Sleep','Saturday starts early.']]},
      {day:2,date:'2026-08-29',from:'Banswara',to:'Banswara',title:'Backwaters + Mahi + Singhpura',tasks:[['04:45','Wake','Tea / banana / biscuits.'],['05:10','Leave hotel','Be rolling before normal visitors.'],['05:35','Chacha Kota','Normal access + safe firm dirt/grass only.'],['07:00','Mahi Dam','Visitor road only; obey barricades.'],['09:45','Singhpura Falls','Park and walk; no riding through pedestrian water crossing.'],['21:15','Sleep','Sunday starts early.']]},
      {day:3,date:'2026-08-30',from:'Banswara',to:'Ahmedabad',title:'Jagmer off-road + Arthuna + home',tasks:[['04:45','Wake + pack','Keep the bike light for Jagmer.'],['05:30','Jagmer / Jagmeru','Firm red dirt/grass; rough sections solo only.'],['09:15','Arthuna','Explore the archaeological complex properly.'],['10:45','Leave for Ahmedabad','No more sightseeing.'],['16:30','Ahmedabad target','Rain/traffic buffer until 18:00.']]}
    ]
    const days: RideDay[] = dayDefs.map(d => ({...d,tasks:d.tasks.map((t,i):RideTask=>({id:`ban_d${d.day}_${i}`,time:t[0],title:t[1],desc:t[2],status:(taskMap[`${d.day}_${i}`] ?? 'upcoming') as RideTask['status'],delayMin:taskMap[`${d.day}_${i}_delay`] ? Number(taskMap[`${d.day}_${i}_delay`]) : undefined}))}))

    return {
      bike: {
        id: 'bike_ronin_2026',
        manufacturer: legacy.bike?.manufacturer ?? 'TVS',
        model: legacy.bike?.model ?? 'Ronin',
        variant: legacy.bike?.variant ?? 'Mid',
        colour: legacy.bike?.colour ?? 'Charcoal Ember',
        year: Number(legacy.bike?.year ?? 2026),
        currentOdometer: Number(legacy.bike?.odo ?? legacy.bike?.currentOdometer ?? 3200),
        braking: legacy.bike?.braking ?? 'Dual-Channel ABS'
      },
      gear,
      rides: [{...fallbackRide,days}]
    }
  } catch {
    return fallback
  }
}
