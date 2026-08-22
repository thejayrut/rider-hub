const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('manual-reader.js','utf8');
const window={};
const ctx={window,console,String,Number,Math,Date,Set,RegExp};
ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);
const pages=[
 'TECHNICAL SPECIFICATIONS Engine displacement 349 cc. Transmission 5 speed constant mesh. Fuel tank capacity 13 L.',
 'TYRES Front tyre 110/70 R17 Rear tyre 140/70 R17. Front brake 300 mm disc. Rear brake 270 mm disc. Dual channel ABS.',
 'PERIODIC MAINTENANCE service schedule 500 km 5000 km 10000 km 15000 km. Drive chain clean and lubricate every 500 km.'
];
const out=window.riderHubParseManualTextPages(pages);
assert.strictEqual(out.fields.engine.value,'349 cc');
assert.strictEqual(out.fields.fuelTank.value,'13 L');
assert.strictEqual(out.fields.transmission.value,'5-speed');
assert(out.fields.tyres.value.includes('110/70 R17'));
assert(out.fields.braking.value.toLowerCase().includes('300 mm front disc'));
assert.strictEqual(out.fields.chainIntervalKm.value,500);
assert(out.serviceMilestones.includes(5000));
console.log('manual-reader smoke tests: PASS');
