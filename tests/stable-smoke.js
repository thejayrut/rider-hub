const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('stable-app.js','utf8');
function el(){return{innerHTML:'',textContent:'',value:'',hidden:false,style:{setProperty(){}},classList:{s:new Set(),add(x){this.s.add(x)},remove(x){this.s.delete(x)},toggle(x,on){if(on)this.s.add(x);else this.s.delete(x)},contains(x){return this.s.has(x)}},addEventListener(){},insertAdjacentHTML(){},insertAdjacentElement(){},click(){}}}
const sels={};for(const s of ['#home','#bike','#rides','#gear','#more','#modal','#modalWrap','#rideMode','#rideModeInner','#toast','#authShell','#authStage','.brand-title','.brand-sub'])sels[s]=el();
const pages=['home','bike','rides','gear','more'].map(id=>{const e=sels['#'+id];e.id=id;return e});
const navs=['home','bike','gear','more'].map(p=>{const e=el();e.dataset={page:p};return e});
const document={documentElement:{style:{setProperty(){}}},querySelector:s=>sels[s]||null,querySelectorAll:s=>s==='.page'?pages:s==='.navbtn'?navs:[],createElement:()=>el(),body:{appendChild(){}}};
const store=new Map();store.set('riderhub_v6',JSON.stringify({profile:{bikeConfigured:true,account:{email:'jayrut2006@gmail.com',name:'Jayrut'}},bike:{name:'TVS Ronin',manufacturer:'TVS',model:'Ronin',variant:'Mid',colour:'Charcoal Ember',year:2026,odo:3200},ride:{selectedDay:0,tasks:{}},gear:[{id:'g1',name:'Helmet',status:'owned',owner:'Jayrut',category:'Riding Gear'}],ui:{page:'home'}}));
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
let opened='';
const window={state:null,scrollTo(){},open:u=>{opened=u},addEventListener(){},riderHubMotorcycleProfile(){return null},riderHubMotorcycleModels:async()=>[],riderHubMotorcycleMakes:async()=>[]};
const navigator={};
const ctx={window,document,localStorage,navigator,indexedDB:{open(){throw new Error('not used')}},URL,URLSearchParams,Blob,File:global.File,console,Math,JSON,String,Number,Date,Object,Array,RegExp,parseInt,setTimeout:()=>0,clearTimeout(){}};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);
assert.strictEqual(window.state.rides[0].days.length,3,'legacy Banswara ride must migrate to three days');
assert.strictEqual(window.state.gear.length,1,'legacy gear must survive migration');
function input(sel,value){sels[sel]=el();sels[sel].value=value}
input('#rideName','20 Day Test');input('#rideStart','2026-09-01');input('#rideDays','20');input('#rideFrom','Ahmedabad');input('#rideTo','Ladakh');
window.saveNewRide();
assert.strictEqual(window.state.rides[0].days.length,20,'ride creator must support 20 days');
const r=window.state.rides.find(x=>x.id==='ride_banswara_2026');r.days[0].tasks.forEach((t,i)=>{if(i<r.days[0].tasks.length-1)t.status='done'});window.rideModeTask(r.id,0,r.days[0].tasks.length-1,'done');
assert.strictEqual(r.selectedDay,1,'Ride Mode must automatically advance after a completed day');
window.openRideMode(r.id);const html=sels['#rideModeInner'].innerHTML;for(const label of ['Map','Expenses','Fuel log','Notes','Packing','Emergency','Summary','Tomorrow','Edit day','Add task'])assert(html.includes(label),`Ride Mode missing ${label}`);
window.openMap(r.id,1,0);assert(opened.includes('google.com/maps/dir'),'map navigation must open Google Maps');
console.log('stable Rider Hub smoke tests: PASS');
