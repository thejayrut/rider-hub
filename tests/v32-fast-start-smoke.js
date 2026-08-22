const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('v32-fast-start.js','utf8');
function make({cached=true,redirect=false}={}){
  const store=new Map(),sessionStore=new Map();
  const auth={provider:'firebase',uid:'u1',email:'rider@example.com'};
  store.set('riderhub_auth_session_v1',JSON.stringify(auth));
  if(cached)store.set('riderhub_public_state_v1_'+encodeURIComponent('u1'),JSON.stringify({profile:{publicUser:true,bikeConfigured:true,account:{uid:'u1',email:'rider@example.com',name:'Rider'}},bike:{name:'Royal Enfield Himalayan 450',variant:'Adventure',colour:'Kaza Brown'},ui:{accentColor:'#795548',page:'home'}}));
  if(redirect)sessionStore.set('riderhub_firebase_redirect_pending_v1','1');
  const cls=new Set(['active']),rootCls=new Set(['rh-preboot']),style=new Map();
  const shell={classList:{add:x=>cls.add(x),remove:x=>cls.delete(x)}};
  const stage={innerHTML:''},brand={textContent:''},sub={textContent:''};
  const document={
    documentElement:{classList:{add:x=>rootCls.add(x),remove:x=>rootCls.delete(x)},style:{setProperty:(k,v)=>style.set(k,v)}},
    title:'Rider Hub',
    querySelector(sel){if(sel==='#rhAuthShell')return shell;if(sel==='#rhAuthStage')return stage;if(sel==='.header .brandname')return brand;if(sel==='.header .brand .sub')return sub;return null;}
  };
  const listeners={};let activated=0,rendered=0,accent='';
  const window={state:{},addEventListener(t,fn){(listeners[t]??=[]).push(fn)},riderHubActivatePublicUser(){activated++},render(){rendered++},riderHubApplyAccent(c){accent=c}};
  const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
  const sessionStorage={getItem:k=>sessionStore.has(k)?sessionStore.get(k):null,setItem:(k,v)=>sessionStore.set(k,String(v)),removeItem:k=>sessionStore.delete(k)};
  const timers=[];const setTimeout=(fn,ms)=>{if(ms<=1200)fn();else timers.push({fn,ms});return timers.length};const clearTimeout=()=>{};
  const context={window,document,localStorage,sessionStorage,setTimeout,clearTimeout,console,JSON,String,Number,Math,Date,parseInt,encodeURIComponent,location:{reload(){}}};context.globalThis=context;
  vm.createContext(context);vm.runInContext(code,context);
  return{window,document,cls,rootCls,style,brand,sub,get activated(){return activated},get rendered(){return rendered},get accent(){return accent},timers};
}
let t=make({cached:true});
assert.strictEqual(t.activated,1,'cached workspace was not activated immediately');
assert(t.rendered>=1,'cached workspace was not rendered immediately');
assert(!t.cls.has('active'),'auth shell stayed active for cached user');
assert.strictEqual(t.accent,'#795548');
assert.strictEqual(t.brand.textContent,'Royal Enfield Himalayan 450');
assert.strictEqual(t.window.RIDER_HUB_WAIT_FOR_CLOUD,false);
assert(!t.rootCls.has('rh-preboot'),'preboot visibility guard was not released');

t=make({cached:false});
assert.strictEqual(t.window.RIDER_HUB_WAIT_FOR_CLOUD,true,'cache miss should wait for cloud identity resolution');
assert.strictEqual(t.activated,0,'cache miss must not invent a local workspace');
assert(t.timers.some(x=>x.ms===6500),'cloud wait must be bounded');
console.log('v32 fast-start smoke: PASS');
