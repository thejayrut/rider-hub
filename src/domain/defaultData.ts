import type { DocumentRecord, GearItem, Ride, RiderHubState } from '../types'

export const HOME = '3G7X+FJ2, Gaurav Path, Shastrinagar, Naranpura, Ahmedabad, Gujarat 380063'
export const HOTEL = 'Hotel Landmark, College Road, Opp. COCO Petrol Pump, Banswara, Rajasthan 327001'

export const DEFAULT_GEAR: GearItem[] = [
  {id:'g_ls2_helmet',name:'LS2 FF800 Storm 2 Helmet',category:'Riding Gear',owner:'Jayrut',status:'owned',amount:11300,qty:1,purchaseDate:'2026-06-28',note:'Bought. Personal riding helmet.'},
  {id:'g_solace_jacket',name:'Solace Furious V4.0 Touring Jacket',category:'Riding Gear',owner:'Jayrut',status:'owned',amount:16899,qty:1,purchaseDate:'2026-07-12',note:'Paid price confirmed from purchase record.'},
  {id:'g_smk_mom',name:'SMK Typhoon Helmet',category:'Riding Gear',owner:'Mom',status:'owned',amount:5650,qty:1,purchaseDate:'2026-08-14',note:'Latest replacement order total. Editable if the final item-only price differs.'},
  {id:'g_tarmac_mom',name:'Tarmac Drifter II Level 2 Jacket',category:'Riding Gear',owner:'Mom',status:'owned',amount:6699,qty:1,purchaseDate:'2026-07-13',note:'₹6,499 item + ₹200 shipping.'},
  {id:'g_grid_mk3',name:'ViaTerra Grid MK3 Gloves',category:'Riding Gear',owner:'Jayrut',status:'planned',amount:7000,qty:1,note:'Planned purchase.'},
  {id:'g_coolpro',name:'Solace Coolpro Sus V4T Mesh Pants',category:'Riding Gear',owner:'Jayrut',status:'planned',amount:11500,qty:1,note:'Planned purchase.'},
  {id:'g_xt_evo',name:'Solace XT Evo Pro Boots',category:'Riding Gear',owner:'Jayrut',status:'planned',amount:9300,qty:1,note:'Planned purchase.'},
  {id:'g_rain_gloves',name:'Solace V2.0 Rain Over Gloves',category:'Riding Gear',owner:'Jayrut',status:'planned',amount:1350,qty:1,note:'Planned purchase.'},
  {id:'g_holeshot_mom',name:'ViaTerra Holeshot Short Gloves',category:'Riding Gear',owner:'Mom',status:'planned',amount:3500,qty:1,note:'Planned purchase.'},
  {id:'g_miller_mom',name:'ViaTerra Miller Women\'s Mesh Pants',category:'Riding Gear',owner:'Mom',status:'planned',amount:8000,qty:1,note:'Planned purchase.'},
  {id:'g_raida_mom',name:'Raida Tourer Boots',category:'Riding Gear',owner:'Mom',status:'planned',amount:4250,qty:1,note:'Planned purchase.'},
  {id:'g_balaclava',name:'LS2 Lycra Balaclava',category:'Riding Gear',owner:'Jayrut',status:'owned',amount:550,qty:1,purchaseDate:'2026-06-28',note:'Inventory count intentionally set to 1.'},
  {id:'g_water_bladd',name:'Solace Water Bladder',category:'Luggage',owner:'Jayrut',status:'planned',amount:1750,qty:1,note:'Planned purchase.'},
  {id:'g_leh70',name:'ViaTerra LEH 70L Saddlebags',category:'Luggage',owner:'Bike / Shared',status:'owned',amount:5299,qty:1,note:'Bought.'},
  {id:'g_rynox_tank',name:'Rynox Optimus 3 Tank Bag 21L',category:'Luggage',owner:'Bike / Shared',status:'owned',amount:3900,qty:1,note:'Bought.'},
  {id:'g_saddle_stay',name:'MotoCare Saddle Stay',category:'Luggage',owner:'Bike / Shared',status:'owned',amount:2400,qty:1,purchaseDate:'2026-08-14',note:'Saddle Stay with Plate.'},
  {id:'g_rack_backrest',name:'MotoCare Rear Rack + Backrest / Pipe Carrier',category:'Luggage',owner:'Bike / Shared',status:'owned',amount:3920,qty:1,purchaseDate:'2026-08-14',note:'Pipe Carrier with Backrest.'},
  {id:'g_ejeas',name:'EJEAS Q8 Mesh Intercom',category:'Electronics',owner:'Bike / Shared',status:'owned',amount:10998,qty:2,purchaseDate:'2026-06-28',note:'2 units.'},
  {id:'g_aoocci',name:'Aoocci C3 Pro 5" Smart Screen',category:'Electronics',owner:'Bike / Shared',status:'owned',amount:8882.09,qty:1,purchaseDate:'2026-06-11',note:'Actual bank debit.'},
  {id:'g_vayu',name:'Portronics Vayu 5.0 Tyre Inflator',category:'Electronics',owner:'Bike / Shared',status:'owned',amount:2289.1,qty:1,purchaseDate:'2026-06-28',note:'Portronics inflator only.'},
  {id:'g_windshield',name:'MotoCare Windshield',category:'Bike Accessories',owner:'Bike / Shared',status:'owned',amount:2240,qty:1,purchaseDate:'2026-06-17',note:'Installed.'},
  {id:'g_knuckle',name:'Sarkart Knuckle Guards',category:'Bike Accessories',owner:'Bike / Shared',status:'owned',amount:366,qty:1,note:'Installed.'},
  {id:'g_crash',name:'Moto Torque Crash Guard',category:'Bike Accessories',owner:'Bike / Shared',status:'owned',amount:4700,qty:1,note:'Installed.'},
  {id:'g_headlight',name:'Moto Torque Headlight Guard',category:'Bike Accessories',owner:'Bike / Shared',status:'owned',amount:1300,qty:1,purchaseDate:'2026-06-17',note:'Installed.'},
  {id:'g_radiator',name:'Moto Torque Radiator Guard',category:'Bike Accessories',owner:'Bike / Shared',status:'owned',amount:700,qty:1,purchaseDate:'2026-06-17',note:'Installed.'},
  {id:'g_side',name:'Moto Torque Side Stand Extender',category:'Bike Accessories',owner:'Bike / Shared',status:'owned',amount:450,qty:1,purchaseDate:'2026-06-17',note:'Installed.'},
  {id:'g_caliper',name:'TVS Caliper Guard',category:'Bike Accessories',owner:'Bike / Shared',status:'owned',amount:509,qty:1,note:'Installed.'},
  {id:'g_tankgrip',name:'TVS Tank Grip',category:'Bike Accessories',owner:'Bike / Shared',status:'owned',amount:783,qty:1,note:'Installed.'},
  {id:'g_fork',name:'TVS Fork Cover',category:'Bike Accessories',owner:'Bike / Shared',status:'owned',amount:378,qty:1,note:'Installed.'},
  {id:'g_chin',name:'LS2 FF800 Chin Mount',category:'Camera & Mounts',owner:'Jayrut',status:'owned',amount:999,qty:1,purchaseDate:'2026-07-07',note:'MotoVibe chin mount.'},
  {id:'g_lensmount',name:'DJI Action Lens-Centre POV Mount',category:'Camera & Mounts',owner:'Jayrut',status:'owned',amount:299,qty:1,purchaseDate:'2026-07-07',note:'Lens-centre POV mount.'},
  {id:'g_motul_chain',name:'Motul Chain Lube + Cleaner',category:'Cleaning & Care',owner:'Bike / Shared',status:'owned',amount:426,qty:1,note:'Bike maintenance consumable.'},
  {id:'g_chainbrush',name:'Chain Brush',category:'Cleaning & Care',owner:'Bike / Shared',status:'owned',amount:110,qty:1,note:'Bike cleaning tool.'},
  {id:'g_wavex',name:'WaveX Matte Shampoo / Cleaner',category:'Cleaning & Care',owner:'Bike / Shared',status:'owned',amount:625,qty:1,note:'Bike detailing.'},
  {id:'g_wd40',name:'WD-40',category:'Cleaning & Care',owner:'Bike / Shared',status:'owned',amount:497,qty:1,note:'Garage consumable.'},
  {id:'g_trim',name:'Turtle Wax Trim Restorer',category:'Cleaning & Care',owner:'Bike / Shared',status:'owned',amount:729,qty:1,note:'Bike detailing.'},
  {id:'g_tireshine',name:'Sheeba Tyre Shine',category:'Cleaning & Care',owner:'Bike / Shared',status:'owned',amount:160,qty:1,note:'Bike detailing.'},
  {id:'g_pads',name:'WaveX Applicator Pads',category:'Cleaning & Care',owner:'Bike / Shared',status:'owned',amount:296,qty:1,note:'Detailing accessory.'},
  {id:'g_microfiber',name:'Microfiber Cloth Set',category:'Cleaning & Care',owner:'Bike / Shared',status:'owned',amount:399,qty:1,note:'Detailing accessory.'},
  {id:'g_brushset',name:'Detailing Brush Set',category:'Cleaning & Care',owner:'Bike / Shared',status:'owned',amount:310,qty:1,note:'Detailing accessory.'},
  {id:'g_washer',name:'Cordless Pressure Washer',category:'Cleaning & Care',owner:'Bike / Shared',status:'owned',amount:1685,qty:1,note:'Bike washing equipment.'},
  {id:'g_cover',name:'Neodrift Premium Bike Cover',category:'Bike Accessories',owner:'Bike / Shared',status:'owned',amount:999,qty:1,note:'Bike cover.'},
  {id:'g_screen',name:'Screen Guard',category:'Bike Accessories',owner:'Bike / Shared',status:'owned',amount:199,qty:1,note:'Screen protection.'}
]

const task = (day:number, i:number, time:string, title:string, desc:string) => ({id:`ban_d${day}_t${i+1}`,time,title,desc,status:'upcoming' as const})

export const BANSWARA_RIDE: Ride = {
  id:'ride_banswara_2026',name:'Banswara 3-Day Ronin Adventure',status:'planned',startDate:'2026-08-28',endDate:'2026-08-30',route:'Ahmedabad → Banswara → Ahmedabad',riders:2,offlineReady:true,touringKm:0,budgetMin:6070,budgetMax:7170,
  hotel:{name:'Hotel Landmark, Banswara',address:HOTEL,checkIn:'Fri, 28 Aug 2026 after 12:00 PM',checkOut:'Sun, 30 Aug 2026 before 12:00 PM',nights:2,room:'Deluxe Room · 1 Double Bed · Room Only',guests:'2 Adults',paid:2470,bookingStatus:'Confirmed'},
  days:[
    {day:1,date:'2026-08-28',from:'Ahmedabad',to:'Banswara',title:'Travel + Mangarh + relaxed Banswara',endTime:'21:30',segments:[
      {id:'d1a',label:'Part 1 · Home → Balasinor',origin:HOME,destination:'Balasinor, Gujarat',waypoints:['Odhav Circle, Ahmedabad','BPCL R B Patel Sons, Kuha, Gujarat','Haldharvas Chokdi, Gujarat','Ladvel Chokdi, Gujarat']},
      {id:'d1b',label:'Part 2 · Balasinor → Mangarh',origin:'Balasinor, Gujarat',destination:'Mangarh Dham, Anandpuri, Rajasthan',waypoints:['Lunawada, Gujarat','Santrampur, Gujarat','Khedapada, Santrampur, Mahisagar, Gujarat']},
      {id:'d1c',label:'Part 3 · Mangarh → Hotel',origin:'Mangarh Dham, Anandpuri, Rajasthan',destination:HOTEL,waypoints:['Anandpuri Bus Stand, Rajasthan','New Bus Stand, Banswara, Rajasthan']},
      {id:'d1x',label:'Wet-weather · Home → Godhra',origin:HOME,destination:'Godhra Bypass, Gujarat',waypoints:['Odhav Circle, Ahmedabad','BPCL R B Patel Sons, Kuha, Gujarat','Haldharvas Chokdi, Gujarat','Ladvel Chokdi, Gujarat','Vavadi Khurd Toll Plaza, Gujarat'],backup:true},
      {id:'d1y',label:'Wet-weather · Godhra → Jhalod',origin:'Godhra Bypass, Gujarat',destination:'Jhalod, Gujarat',waypoints:['Bhatwada Toll Plaza, Gujarat','Limkheda Bypass, Gujarat','Dahod Bypass, Gujarat'],backup:true},
      {id:'d1z',label:'Wet-weather · Jhalod → Hotel',origin:'Jhalod, Gujarat',destination:HOTEL,waypoints:[],backup:true}
    ],tasks:[
      task(1,0,'04:15','Wake / light food','Final tyre, chain, brakes, rain gear, straps and documents.'),task(1,1,'05:00','Leave Home','Start before traffic builds.'),task(1,2,'07:00','Breakfast + break','20–30 min, water and stretch.'),task(1,3,'09:15','Mangarh Dham','Quiet morning target.'),task(1,4,'12:00','Hotel check-in','Lunch and remove wet gear.'),task(1,5,'12:30','Rest','Recovery + charge electronics.'),task(1,6,'15:15','Anand Sagar + Kalpavriksha','Short quiet stop.'),task(1,7,'16:15','Kagdi Pick Up Weir','Leave if crowded.'),task(1,8,'17:10','Dialab Lake · optional','Only if both riders are fresh.'),task(1,9,'18:30','Dinner','Simple meal.'),task(1,10,'20:00','Fuel + prep','Fill bike and prep Saturday bag.'),task(1,11,'21:15','Sleep','Saturday starts early.')
    ]},
    {day:2,date:'2026-08-29',from:'Banswara',to:'Banswara',title:'Backwaters + Mahi + Singhpura',endTime:'21:15',segments:[
      {id:'d2a',label:'Part 1 · Hotel → Chacha Kota → Mahi',origin:HOTEL,destination:'Mahi Bajaj Sagar Dam, Banswara, Rajasthan',waypoints:['Chacha Kota, Banswara, Rajasthan']},
      {id:'d2b',label:'Part 2 · Mahi → Singhpura → Hotel',origin:'Mahi Bajaj Sagar Dam, Banswara, Rajasthan',destination:HOTEL,waypoints:['Ghatol, Rajasthan','Singhpura, Ghatol, Banswara, Rajasthan','Singhpura Falls, Rajasthan']}
    ],tasks:[
      task(2,0,'04:45','Wake','Tea / banana / biscuits.'),task(2,1,'05:10','Leave hotel','Be rolling before normal visitors.'),task(2,2,'05:35','Chacha Kota','Normal access + safe firm dirt/grass only.'),task(2,3,'07:00','Mahi Dam','Visitor road only; obey barricades.'),task(2,4,'08:00','Breakfast','Proper breakfast + short rest.'),task(2,5,'09:00','Leave for Singhpura','Navigate to Singhpura/Ghatol first.'),task(2,6,'09:45','Singhpura Falls','Park, walk; do not ride through pedestrian water crossing.'),task(2,7,'13:15','Back Banswara','Lunch.'),task(2,8,'14:15','Rest','Dry boots/socks/rain gear.'),task(2,9,'18:00','Flexible evening','Nothing compulsory.'),task(2,10,'21:15','Sleep','Sunday starts early.')
    ]},
    {day:3,date:'2026-08-30',from:'Banswara',to:'Ahmedabad',title:'Jagmer off-road + Arthuna + home',endTime:'18:00',segments:[
      {id:'d3a',label:'Part 1 · Hotel → Jagmer → Hotel',origin:HOTEL,destination:HOTEL,waypoints:['Jagmer Hills, Banswara, Rajasthan']},
      {id:'d3b',label:'Part 2 · Hotel → Lunawada via Arthuna',origin:HOTEL,destination:'Lunawada, Gujarat',waypoints:['Arthuna Group of Temples, Rajasthan','Khedapada, Santrampur, Mahisagar, Gujarat','Santrampur Bus Station, Gujarat']},
      {id:'d3c',label:'Part 3 · Lunawada → Home',origin:'Lunawada, Gujarat',destination:HOME,waypoints:['Balasinor, Gujarat','Ladvel Chokdi, Gujarat','BPCL R B Patel Sons, Kuha, Gujarat','Odhav Circle, Ahmedabad']}
    ],tasks:[
      task(3,0,'04:45','Wake + pack','Keep only a light Jagmer bag if hotel can hold luggage.'),task(3,1,'05:10','Leave hotel','Light bike for dirt riding.'),task(3,2,'05:30','Jagmer / Jagmeru','Paved approach → firm red dirt/grass; rough parts solo only.'),task(3,3,'07:15','Return hotel','Collect luggage.'),task(3,4,'07:30','Breakfast + checkout','Final tyre, chain and luggage check.'),task(3,5,'08:15','Leave for Arthuna','Normal public road.'),task(3,6,'09:15','Arthuna','Explore archaeological complex properly.'),task(3,7,'10:45','Leave for Ahmedabad','No more sightseeing.'),task(3,8,'12:30','Lunch + rest','30–45 min.'),task(3,9,'16:30','Ahmedabad target','Rain/traffic buffer until 18:00.')
    ]}
  ],
  operations:{selectedDay:0,tasks:{},delays:{},preflight:{},expenses:{hotel:2470,fuel:0,food:0,parking:0,misc:0},fuelLogs:[],notes:'',issues:[],packing:{rain:false,firstaid:false,puncture:false,tools:false,power:false,documents:false,water:false,socks:false},content:{departure:false,mangarh:false,chacha:false,mahi:false,singhpura:false,jagmer:false,arthuna:false,arrival:false},backup:{action5:false,phone:false,photos:false,booking:false},customEmergency:['','','']}
}

export const DEFAULT_DOCUMENTS: DocumentRecord[] = [
  {id:'vehicle_invoice',name:'Vehicle invoice',summary:'10 Jun 2026 · ₹150,340',detail:'Dealer vehicle invoice. Sensitive identifiers stay masked.',private:true},
  {id:'vehicle_tax',name:'Lifetime vehicle tax',summary:'₹1,693',detail:'Lifetime vehicle tax record.',private:true},
  {id:'insurance',name:'ICICI Lombard insurance',summary:'OD to 04 Jun 2027 · TP to 04 Jun 2031',detail:'Bundled policy summary. Sensitive policy identifiers stay masked.',private:true},
  {id:'licence',name:'Learner licence',summary:'02 Jun–01 Dec 2026',detail:'Learner licence validity summary.',private:true},
  {id:'service_invoice',name:'First service invoice',summary:'19 Jun 2026 · 767 km · ₹1,000',detail:'1st Free Service · engine oil + filter · 767 km.',private:true},
  {id:'hotelBooking',name:'Hotel Landmark booking',summary:'28–30 Aug 2026 · ₹2,470 paid',detail:'2 nights · Deluxe Room · 2 adults · Room Only.',private:true}
]

export const DEFAULT_STATE: RiderHubState = {
  version:3,
  bike:{id:'bike_ronin_2026',manufacturer:'TVS',model:'Ronin',variant:'Mid',colour:'Charcoal Ember',year:2026,purchaseDate:'Jun 2026',currentOdometer:3200,braking:'Dual-Channel ABS',engine:'225.9 cc single-cylinder',transmission:'5-speed',fuelTank:'14 L',tyres:'Tubeless',insurance:'ICICI Lombard bundled policy',chainLastOdometer:3000,nextServiceKm:5500,nextServiceDate:'07 Dec 2026',serviceHistory:[{id:'svc1',name:'1st Free Service',date:'19 Jun 2026',odometer:767,cost:1000,work:'Engine oil + oil filter'}]},
  gear:DEFAULT_GEAR,
  rides:[BANSWARA_RIDE],
  documents:DEFAULT_DOCUMENTS
}
