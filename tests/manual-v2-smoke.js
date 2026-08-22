const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('manual-reader-v2.js','utf8');
const window={riderHubProcessOwnerManual:null,state:{bike:{}}};
const ctx={window,console,String,Number,Math,RegExp,Set,Date};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);
const pages=[
`TECHNICAL SPECIFICATIONS Engine displacement 452 cc Transmission 6 speed constant mesh Fuel tank capacity 17.0 L Front tyre size 90/90 - 21 Rear tyre size 140/80 R 17 Ground clearance 230 mm Seat height 825 mm Wheelbase 1510 mm Kerb weight 196 kg`,
`BRAKES Front brake 320 mm disc Rear brake 270 mm disc Dual channel ABS`,
`PERIODIC MAINTENANCE schedule 500 km 5000 km 10000 km Drive chain clean lubricate every 500 km`
];
const r=window.riderHubParseManualTextPagesV2(pages);
assert.strictEqual(r.fields.engine.value,'452 cc');
assert.strictEqual(r.fields.fuelTank.value,'17 L');
assert(r.fields.transmission.value.includes('6-speed'));
assert(r.fields.tyres.value.includes('90/90'));
assert(r.fields.tyres.value.includes('140/80'));
assert(r.fields.braking.value.includes('320 mm'));
assert(r.extraSpecs.some(x=>x.key==='groundClearance'));
assert(r.serviceMilestones.includes(5000));
console.log('manual-v2 smoke: PASS');
