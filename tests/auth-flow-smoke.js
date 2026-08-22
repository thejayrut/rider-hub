const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('auth-flow-controller.js','utf8');
function make(){
 const listeners={};
 const shell={classList:{set:new Set(),add(x){this.set.add(x)},remove(x){this.set.delete(x)},contains(x){return this.set.has(x)}}};
 const stage={innerHTML:''};
 const small={textContent:''};
 const document={querySelector(sel){if(sel==='#rhAuthShell')return shell;if(sel==='#rhAuthStage')return stage;if(sel==='#rhAuthShell .rh-auth-brand small')return small;return null;}};
 const store=new Map();
 const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const window={state:{profile:{}},addEventListener(type,fn){(listeners[type]??=[]).push(fn)}};
 const context={window,document,localStorage,setTimeout,clearTimeout,queueMicrotask,console,String,Number,Math,JSON};
 context.globalThis=context;vm.createContext(context);vm.runInContext(code,context);
 function fire(kind){for(const fn of listeners['riderhub-sync-status']||[])fn({detail:{kind}})}
 return {window,shell,stage,fire};
}
(async()=>{
 let t=make();
 assert(t.stage.innerHTML.includes('Everything around your motorcycle'));
 assert(!t.stage.innerHTML.includes('Continue with Google'));
 assert.strictEqual(t.window.riderHubAuthSlideIndex(),0);
 t.window.rhApprovedWelcomeNext();
 assert(t.stage.innerHTML.includes('Plan less while riding'));
 assert.strictEqual(t.window.riderHubAuthSlideIndex(),1);
 t.window.rhApprovedWelcomeNext();
 assert(t.stage.innerHTML.includes('Your bike and rides can follow you across devices'));
 assert.strictEqual(t.window.riderHubAuthSlideIndex(),2);
 await new Promise(r=>setTimeout(r,180));
 assert(t.stage.innerHTML.includes('Your bike and rides can follow you across devices'),'third slide auto-skipped');
 t.window.rhApprovedWelcomeNext();
 assert(t.stage.innerHTML.includes('Continue with Google'));
 const visible=t.stage.innerHTML.replace(/<[^>]+>/g,' ');
 assert(!/\bFirebase\b|\bFirestore\b|Google Sign-In is ready/.test(visible),visible);
 t.fire('signedout');
 t.stage.innerHTML='TECHNICAL LOGIN OVERRIDE';
 await new Promise(r=>setTimeout(r,50));
 assert(t.stage.innerHTML.includes('Continue with Google'),'signed-out restore lost login mode');
 assert(!t.stage.innerHTML.includes('TECHNICAL'));

 t=make();
 t.window.rhApprovedWelcomeNext();
 assert.strictEqual(t.window.riderHubAuthSlideIndex(),1);
 t.fire('signedout');
 t.stage.innerHTML='FIREBASE OVERRIDE';
 await new Promise(r=>setTimeout(r,50));
 assert.strictEqual(t.window.riderHubAuthSlideIndex(),1,'slide index reset');
 assert(t.stage.innerHTML.includes('Plan less while riding'),'slide 2 not restored');

 t=make();
 t.window.rhApprovedWelcomeNext();
 setTimeout(()=>{t.stage.innerHTML='OLDER SLIDE 1 RESET'},0);
 t.fire('signedout');
 t.stage.innerHTML='FIREBASE TECHNICAL LOGIN';
 await new Promise(r=>setTimeout(r,60));
 assert.strictEqual(t.window.riderHubAuthSlideIndex(),1,'competing listeners changed slide index');
 assert(t.stage.innerHTML.includes('Plan less while riding'),'controller did not win signed-out race');

 t=make();
 let gates=0;
 t.window.riderHubFirebaseUser=()=>({uid:'u1'});
 t.window.state={profile:{publicUser:true,bikeConfigured:false}};
 t.window.riderHubRequireBikeSetup=()=>{gates++};
 t.fire('synced');
 await new Promise(r=>setTimeout(r,60));
 assert.strictEqual(gates,1,'new-user bike gate not enforced');

 t=make();
 t.window.riderHubFirebaseUser=()=>({uid:'u2'});
 t.window.state={profile:{publicUser:true,bikeConfigured:true}};
 t.shell.classList.add('active');
 t.fire('synced');
 await new Promise(r=>setTimeout(r,60));
 assert(!t.shell.classList.contains('active'),'existing user auth shell not hidden');
 console.log('auth-flow smoke tests: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
