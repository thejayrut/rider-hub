const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('approved-runtime-fixes.js','utf8');
let modal='',saves=0;
const window={
 state:{profile:{publicUser:true,bikeConfigured:true,account:{name:'Alex Rider'}},bike:{manufacturer:'TVS',model:'Ronin',variant:'Mid',colour:'Charcoal Ember',odo:3200,serviceHistory:[{name:'old'}],firstService:{odo:767},purchase:'Jun 2026',insurance:'policy'},gear:[]},
 RIDER_HUB_MOTORCYCLE_CATALOG:{profiles:{'tvs|ronin':{manualUrl:'old'}}},
 rhSaveApprovedBike(){this.state.bike={...this.state.bike,manufacturer:'Royal Enfield',model:'Hunter 350',variant:'Metro'};return true},
 save(){saves++},addEventListener(){},openModal(html){modal=html},openGearEditor(){throw new Error('legacy editor should not be used')}
};
const document={querySelector(){return null}};
const ctx={window,document,String,Number,setTimeout:()=>0,console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);
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
console.log('runtime-fixes smoke tests: PASS');
