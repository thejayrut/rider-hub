const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('ride-pdf-importer.js','utf8');
const window={};const ctx={window,console,String,Number,Date,RegExp,Set};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);
const text=`Himalayan Weekend Ride
28 Aug 2026
Day 1 - Ahmedabad to Udaipur
06:00 Depart Ahmedabad
08:30 Breakfast stop
Ahmedabad → Himmatnagar → Udaipur
Hotel Lake View check-in
Day 2 - Udaipur to Ahmedabad
07:00 Breakfast
09:00 Depart hotel
Udaipur → Ahmedabad
29 Aug 2026`;
const r=window.riderHubParseRideText(text,{fileName:'trip.pdf'});
assert.strictEqual(r.name,'Himalayan Weekend Ride');
assert.strictEqual(r.days.length,2);
assert(r.days[0].tasks.length>=2);
assert(r.route.includes('Ahmedabad'));
assert(r.lodging.some(x=>/Hotel/.test(x)));
console.log('ride-pdf smoke: PASS');
