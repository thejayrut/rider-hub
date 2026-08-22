/* Compatibility bridge for newer isolated feature modules.
   app.js intentionally keeps state as a global lexical binding (`let state`),
   which is visible to classic scripts but is not a property of window. */
(()=>{
'use strict';
try{
  if(!Object.prototype.hasOwnProperty.call(window,'state')){
    Object.defineProperty(window,'state',{configurable:true,get:()=>state,set:value=>{state=value}});
  }
}catch(e){console.warn('Rider Hub state bridge unavailable',e)}
})();
