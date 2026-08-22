/* Rider Hub motorcycle catalog.
   A curated India-first list is merged with the public NHTSA vPIC motorcycle
   catalog for broader global make/model coverage. Detailed variants, colours,
   specifications and service data are only supplied when Rider Hub has a
   verified model profile; unknown motorcycles remain editable instead of guessed. */
(()=>{
'use strict';
const API='https://vpic.nhtsa.dot.gov/api/vehicles';
const CACHE_PREFIX='riderhub_vpic_v1_';
const CACHE_MS=7*24*60*60*1000;
const escKey=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

const CURATED_MAKES=[
 'AJP','Aprilia','Arch Motorcycle','Bajaj','Benelli','Beta','Bimota','BMW Motorrad','Brixton','BSA','CFMOTO','Ducati','Fantic','GasGas','Harley-Davidson','Hero','Honda','Husqvarna','Indian Motorcycle','Jawa','Kawasaki','Keeway','KTM','Lambretta','Lifan','Moto Guzzi','Moto Morini','MV Agusta','Norton','QJMotor','Royal Enfield','Sherco','Suzuki','SWM','Triumph','TVS','Vespa','Victory','Yamaha','Yezdi','Zero Motorcycles'
];

const CURATED_MODELS={
 'TVS':['Apache RR 310','Apache RTR 160 2V','Apache RTR 160 4V','Apache RTR 180','Apache RTR 200 4V','Apache RTR 310','Raider','Radeon','Ronin','Sport','Star City+'],
 'Royal Enfield':['Bear 650','Bullet 350','Classic 350','Classic 650','Continental GT 650','Goan Classic 350','Guerrilla 450','Himalayan 450','Hunter 350','Interceptor 650','Meteor 350','Scram 440','Shotgun 650','Super Meteor 650'],
 'Bajaj':['Avenger 160 Street','Avenger 220 Cruise','Dominar 250','Dominar 400','Pulsar 125','Pulsar 150','Pulsar N150','Pulsar N160','Pulsar N250','Pulsar NS125','Pulsar NS160','Pulsar NS200','Pulsar RS200'],
 'Hero':['Glamour','HF Deluxe','Karizma XMR','Mavrick 440','Passion+','Splendor+','Splendor+ XTEC','Super Splendor XTEC','Xpulse 200 4V','Xpulse 210','Xtreme 125R','Xtreme 160R 4V','Xtreme 250R'],
 'Honda':['CB125R','CB200X','CB300F','CB300R','CB350','CB350 H’ness','CB350RS','CB500X','CB650R','CBR650R','Gold Wing Tour','Hornet 2.0','NX200','NX500','Rebel 500','Shine 100','Shine 125','SP125','Unicorn'],
 'KTM':['125 Duke','200 Duke','250 Adventure','250 Duke','390 Adventure','390 Adventure X','390 Duke','RC 200','RC 390'],
 'Yamaha':['FZ-FI','FZ-S FI','FZ-X','MT-15 V2','R15 V4','R15S','R3','MT-03'],
 'Suzuki':['Gixxer','Gixxer SF','Gixxer 250','Gixxer SF 250','V-Strom SX','Hayabusa','Katana','GSX-8R','V-Strom 800 DE'],
 'Kawasaki':['Ninja 300','Ninja 500','Ninja 650','Ninja ZX-4R','Ninja ZX-6R','Ninja ZX-10R','Versys 650','Versys 1100','Z500','Z650','Z900'],
 'Triumph':['Bonneville T100','Bonneville T120','Scrambler 400 X','Scrambler 900','Speed 400','Speed T4','Street Triple R','Street Triple RS','Tiger Sport 660','Tiger 900'],
 'BMW Motorrad':['G 310 GS','G 310 RR','G 310 R','F 800 GS','F 900 GS','R 1300 GS','R 12','S 1000 RR'],
 'Harley-Davidson':['X440','Nightster','Sportster S','Fat Bob 114','Fat Boy 114','Pan America 1250 Special','Street Glide','Road Glide'],
 'Ducati':['DesertX','Diavel V4','Hypermotard 698 Mono','Monster','Multistrada V2','Multistrada V4','Panigale V2','Panigale V4','Scrambler Icon','Streetfighter V2','Streetfighter V4'],
 'Aprilia':['RS 457','Tuono 457','RS 660','Tuono 660','RSV4','Tuareg 660']
};

const PROFILES={
 'tvs|ronin':{
   variants:{
     'Base':['Lightning Black','Magma Red'],
     'Mid':['Glacier Silver','Charcoal Ember'],
     'Top':['Nimbus Grey','Midnight Blue']
   },
   specs:{
     engine:'225.9 cc single-cylinder, 4-stroke, oil-cooled, fuel-injected',
     transmission:'5-speed · assist & slipper clutch',
     fuelTank:'14 L',
     tyres:'110/70-17 front · 130/70-17 rear · tubeless'
   },
   brakingByVariant:{
     'Base':'300 mm front disc · 240 mm rear disc · single-channel ABS',
     'Mid':'300 mm front disc · 240 mm rear disc · dual-channel ABS',
     'Top':'300 mm front disc · 240 mm rear disc · dual-channel ABS'
   },
   manualUrl:'https://www.tvsmotor.com/-/media/21072023/TVS-Ronin.pdf?hash=B0D10006325160B97EF8A1643B54E89E&la=en',
   serviceMilestones:[1000,6000,12000,18000,24000,30000,36000],
   chainIntervalKm:500,
   serviceSummary:'Use the TVS Ronin owner manual as the authority. Rider Hub tracks the first service and subsequent periodic service targets without replacing workshop guidance.'
 },
 'royal enfield|hunter 350':{
   variants:{
     'Retro':['Factory Black'],
     'Metro':['Graphite Grey','Rio White','Dapper Grey','Tarmac Black','Tokyo Black','London Red','Rebel Blue','Moonshot White','Mumbai Yellow']
   },
   specs:{
     engine:'349 cc single-cylinder, 4-stroke, air-oil cooled, EFI',
     transmission:'5-speed constant mesh',
     fuelTank:'13 L'
   },
   tyresByVariant:{
     'Retro':'100/80-17 front · 120/80-17 rear · spoke wheels',
     'Metro':'110/70-17 front · 140/70-17 rear · tubeless alloy wheels'
   },
   brakingByVariant:{
     'Retro':'300 mm front disc · 153 mm rear drum · single-channel ABS',
     'Metro':'300 mm front disc · 270 mm rear disc · dual-channel ABS'
   },
   manualUrl:'https://www.royalenfield.com/in/en/support/owners-manual/',
   serviceMilestones:[500,5000,10000,15000,20000,25000,30000,35000,40000,45000,50000],
   chainIntervalKm:500,
   serviceSummary:'Periodic maintenance starts at 500 km, then continues at the intervals specified in the Royal Enfield owner manual. Drive-chain inspection/clean/lube should follow the manual and riding conditions.'
 }
};

function uniqSorted(values){return [...new Set((values||[]).map(v=>String(v||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));}
function cacheRead(key){try{const v=JSON.parse(localStorage.getItem(CACHE_PREFIX+key)||'null');if(v&&Date.now()-v.at<CACHE_MS&&Array.isArray(v.data))return v.data}catch{}return null;}
function cacheWrite(key,data){try{localStorage.setItem(CACHE_PREFIX+key,JSON.stringify({at:Date.now(),data}))}catch{}}
async function fetchJson(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('Catalog service unavailable');return r.json();}

async function globalMakes(){
 const cached=cacheRead('makes');if(cached)return uniqSorted([...CURATED_MAKES,...cached]);
 try{
   const j=await fetchJson(`${API}/GetMakesForVehicleType/moto?format=json`);
   const names=(j.Results||[]).map(x=>x.MakeName||x.Make_Name).filter(Boolean);
   cacheWrite('makes',names);
   return uniqSorted([...CURATED_MAKES,...names]);
 }catch{return uniqSorted(CURATED_MAKES)}
}

async function modelsForMake(make){
 const name=String(make||'').trim();if(!name)return[];
 const local=CURATED_MODELS[name]||[];
 const key='models_'+escKey(name);
 const cached=cacheRead(key);if(cached)return uniqSorted([...local,...cached]);
 try{
   const url=`${API}/GetModelsForMakeYear/make/${encodeURIComponent(name)}/vehicletype/motorcycle?format=json`;
   const j=await fetchJson(url);
   const models=(j.Results||[]).map(x=>x.Model_Name||x.ModelName||x.Model).filter(Boolean);
   cacheWrite(key,models);
   return uniqSorted([...local,...models]);
 }catch{return uniqSorted(local)}
}

function profile(make,model){return PROFILES[`${escKey(make)}|${escKey(model)}`]||null;}
function nextServiceKm(entry,odo){const n=Math.max(0,Number(odo)||0);return (entry?.serviceMilestones||[]).find(x=>x>n)||0;}

window.RIDER_HUB_MOTORCYCLE_CATALOG={curatedMakes:CURATED_MAKES.slice(),curatedModels:CURATED_MODELS,profiles:PROFILES};
window.riderHubMotorcycleMakes=globalMakes;
window.riderHubMotorcycleModels=modelsForMake;
window.riderHubMotorcycleProfile=profile;
window.riderHubNextServiceKm=nextServiceKm;
})();
