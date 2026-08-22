const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('approved-runtime-fixes.js','utf8');
let modal='',saves=0;const storage=new Map();
const window={
 state:{profile:{publicUser:true,bikeConfigured:true,account:{name:'Alex Rider'}},bike:{manufacturer:'TVS',model:'Ronin',variant:'Mid',colour:'Charcoal Ember',odo:3200,serviceHistory:[{name:'old'}],firstService:{odo:767},purchase:'Jun 2026',insurance:'policy'},gear:[]},
 RIDER_HUB_MOTORCYCLE_CATALOG:{profiles:{'tvs|ronin':{manualUrl:'old'}}},
 riderHubExportState(){return {blocked:true}},
 rhSaveApprovedBike(){this.state.bike={...this.state.bike,manufacturer:'Royal Enfield',model:'Hunter 350',variant:'Metro'};return true},
 save(){saves++},addEventListener(){},openModal(html){modal=html},openGearEditor(){throw new Error('legacy editor should not be used')}
};
const document={querySelector(){return null}};
const localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const location={hostname:'rider-hub-506306.firebaseapp.com'};
const ctx={window,document,localStorage,location,String,Number,JSON,setTimeout:()=>0,console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);
assert.strictEqual(window.RIDER_HUB_MOTORCYCLE_CATALOG.profiles['tvs|ronin'].manualUrl,'https://www.tvsmotor.com/-/media/Feature/Owners/UserManual2026/TVS-Ronin.pdf');
window.rhSaveApprovedBike(false);
assert.strictEqual(window.state.bike.serviceHistory.length,0);
assert.strictEqual(JSON.stringify(window.state.bike.firstService),JSON.stringify({odo:0,date:'Not added',cost:0}));
assert.strictEqual(window.state.bike.purchase,'Not added');
assert.strictEqual(window.state.bike.insurance,'Not added');
assert(window.state.bike.manualUrl.includes('hunter-350-dual-channel.pdf'));
assert(saves>=1);
window.openGearEditor();
assert(modal.includes('Alex Rider'));
assert(!modal.includes('<option selected>Jayrut</option>'));
window.state={bike:{name:'TVS Ronin'},profile:{}};
storage.set('riderhub_v6','{"saved":true}');
assert.strictEqual(window.riderHubExportState().bike.name,'TVS Ronin');
storage.delete('riderhub_v6');
assert.strictEqual(window.riderHubExportState().blocked,true);
console.log('runtime-fixes smoke tests: PASS');
