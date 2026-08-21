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

export interface ServiceRecord {
  id: string
  name: string
  date: string
  odometer: number
  cost: number
  work: string
}

export interface Bike {
  id: string
  manufacturer: string
  model: string
  variant: string
  colour: string
  year: number
  purchaseDate: string
  currentOdometer: number
  braking: string
  engine: string
  transmission: string
  fuelTank: string
  tyres: string
  insurance: string
  chainLastOdometer: number
  nextServiceKm: number
  nextServiceDate: string
  serviceHistory: ServiceRecord[]
}

export type RideTaskStatus = 'upcoming' | 'done' | 'delayed' | 'skipped'
export interface RideTask {
  id: string
  time: string
  title: string
  desc: string
  status: RideTaskStatus
  delayMin?: number
}

export interface RouteSegment {
  id: string
  label: string
  origin: string
  destination: string
  waypoints: string[]
  backup?: boolean
}

export interface RideDay {
  day: number
  date: string
  from: string
  to: string
  title: string
  endTime: string
  tasks: RideTask[]
  segments: RouteSegment[]
}

export interface HotelBooking {
  name: string
  address: string
  checkIn: string
  checkOut: string
  nights: number
  room: string
  guests: string
  paid: number
  bookingStatus: string
}

export interface ExpenseState {
  hotel: number
  fuel: number
  food: number
  parking: number
  misc: number
}

export interface FuelLog {
  id: string
  odometer: number
  litres: number
  amount: number
  createdAt: string
}

export interface BikeIssue {
  id: string
  note: string
  severity: 'Monitor' | 'Needs attention' | 'Stop riding'
  odometer: number
  createdAt: string
}

export interface RideOperations {
  selectedDay: number
  tasks: Record<string, RideTaskStatus>
  delays: Record<string, number>
  preflight: Record<string, boolean>
  expenses: ExpenseState
  fuelLogs: FuelLog[]
  notes: string
  issues: BikeIssue[]
  packing: Record<string, boolean>
  content: Record<string, boolean>
  backup: Record<string, boolean>
  customEmergency: string[]
}

export interface Ride {
  id: string
  name: string
  status: 'planned' | 'completed'
  startDate: string
  endDate: string
  route: string
  riders: number
  offlineReady: boolean
  touringKm: number
  budgetMin: number
  budgetMax: number
  hotel?: HotelBooking
  days: RideDay[]
  operations: RideOperations
}

export interface DocumentRecord {
  id: string
  name: string
  summary: string
  detail: string
  private: boolean
}

export interface RiderHubState {
  version: 3
  bike: Bike
  gear: GearItem[]
  rides: Ride[]
  documents: DocumentRecord[]
}
