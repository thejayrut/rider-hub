export type GearStatus = 'owned' | 'planned'
export type GearOwner = 'Jayrut' | 'Mom' | 'Bike / Shared'
export type GearCategory = 'Riding Gear' | 'Luggage' | 'Electronics' | 'Bike Accessories' | 'Camera & Mounts' | 'Cleaning & Care'

export interface GearItem {
  id: string
  name: string
  category: GearCategory
  owner: GearOwner
  status: GearStatus
  amount: number | null
  qty: number
  purchaseDate?: string
  note?: string
}

export interface Bike {
  id: string
  manufacturer: string
  model: string
  variant: string
  colour: string
  year: number
  currentOdometer: number
  braking: string
}

export type RideTaskStatus = 'upcoming' | 'done' | 'delayed' | 'skipped'
export interface RideTask { id: string; time: string; title: string; desc: string; status: RideTaskStatus; delayMin?: number }
export interface RideDay { day: number; date: string; from: string; to: string; title: string; tasks: RideTask[] }
export interface Ride { id: string; name: string; status: 'planned' | 'completed'; startDate: string; endDate: string; route: string; riders: number; offlineReady: boolean; touringKm: number; days: RideDay[] }

export interface RiderHubState {
  bike: Bike
  gear: GearItem[]
  rides: Ride[]
}
