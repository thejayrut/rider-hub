/* Rider Hub v31 Undo coverage for new Bike, Gear, Ride and SOS actions. */
(()=>{
'use strict';
const wrap=(name,label)=>{
  const fn=window[name];if(typeof fn!=='function'||fn.__rhUndoWrapped)return;
  const wrapped=function(...args){window.snapshot?.(label);return fn.apply(this,args)};
  wrapped.__rhUndoWrapped=true;window[name]=wrapped;
};
[
  ['markChainCareDone','chain care'],
  ['rhV31SaveGear','gear'],['rhV31ToggleGear','gear status'],['rhV31DeleteGear','delete gear'],
  ['saveEmergencyContact','emergency contact'],['deleteEmergencyContact','delete emergency contact'],
  ['rhSaveManualRide','add ride'],['rhSaveImportedRide','import ride'],['rhSaveRideTask','ride task'],
  ['rhSetRideTask','ride task'],['rhSaveRideDelay','ride delay'],['rhModeNextTask','ride task'],
  ['rhToggleRideCheck','pre-ride check'],['rhSaveRideExpenses','ride expenses'],['rhAddFuel','fuel log'],
  ['rhDeleteFuel','fuel log'],['rhSaveRideNotes','ride notes'],['rhSaveRideIssue','bike issue'],
  ['rhToggleRideChecklist','ride checklist'],['rhMarkRideComplete','ride completion']
].forEach(x=>wrap(x[0],x[1]));
})();
