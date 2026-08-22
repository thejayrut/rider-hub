const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('auth-transition-guard.js','utf8');
const listeners={};let stage={innerHTML:''};const shell={classList:{add(){},remove(){}},querySelector(){return {textContent:''}}};
const document={querySelector(s){if(s==='#rhAuthShell')return shell;if(s==='#rhAuthStage')return stage;return null}};
const sessionStorage={getItem(){return null}};const window={addEventListener(t,f){(listeners[t]??=[]).push(f)},toast(){}};
const ctx={window,document,sessionStorage,setTimeout,clearTimeout,console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);
let user=null;window.riderHubFirebaseUser=()=>user;window.rhLoginGoogle=async()=>{user={uid:'u1'}};
(async()=>{await window.rhLoginGoogle();assert(window.RIDER_HUB_AUTH_TRANSITION===true);let stopped=false;for(const f of listeners['riderhub-sync-status'])f({detail:{kind:'syncing'},stopImmediatePropagation(){stopped=true}});assert(stopped);assert.strictEqual(window.riderHubFirebaseUser(),null);for(const f of listeners['riderhub-sync-status'])f({detail:{kind:'synced'},stopImmediatePropagation(){}});assert.strictEqual(window.RIDER_HUB_AUTH_TRANSITION,false);assert.strictEqual(window.riderHubFirebaseUser().uid,'u1');console.log('auth-transition smoke: PASS')})().catch(e=>{console.error(e);process.exit(1)});
