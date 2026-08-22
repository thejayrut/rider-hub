/* Rider Hub authentication transition guard.
   Prevents transient signed-out/blank-workspace events from flashing onboarding
   or motorcycle setup while an account is being resolved. Existing local accounts
   are released as soon as Firebase identifies the user; cloud reconciliation then
   continues in the background. */
(()=>{
'use strict';
const REDIRECT_KEY='riderhub_firebase_redirect_pending_v1';
let rawUser=typeof window.riderHubFirebaseUser==='function'?window.riderHubFirebaseUser:null;
let rawLogin=typeof window.rhLoginGoogle==='function'?window.rhLoginGoogle:null;
let transition=!!sessionStorage.getItem(REDIRECT_KEY);
let fallbackTimer=0;
window.RIDER_HUB_AUTH_TRANSITION=transition;

function actualUser(){try{return typeof rawUser==='function'?rawUser():null}catch{return null}}
function shell(){return document.querySelector('#rhAuthShell')}
function stage(){return document.querySelector('#rhAuthStage')}
function showOpening(){
  const sh=shell(),st=stage();if(!sh||!st)return;
  sh.classList.add('active');
  const small=sh.querySelector('.rh-auth-brand small');if(small)small.textContent='MOTORCYCLE OS';
  st.innerHTML='<div class="rh-auth-opening rh-auth-opening-v32"><div class="rh-opening-emblem">RH</div><div class="rh-slide-kicker">RIDER HUB</div><h2>Opening your Rider Hub</h2><p>Checking your saved workspace. If this device already has your Rider Hub, it opens immediately while cloud sync continues in the background.</p><div class="rh-opening-dots"><i></i><i></i><i></i></div></div>';
}
function begin(){
  transition=true;window.RIDER_HUB_AUTH_TRANSITION=true;clearTimeout(fallbackTimer);showOpening();
}
function finish(){transition=false;window.RIDER_HUB_AUTH_TRANSITION=false;clearTimeout(fallbackTimer)}

try{
  Object.defineProperty(window,'riderHubFirebaseUser',{
    configurable:true,
    get(){return ()=>transition?null:actualUser()},
    set(fn){rawUser=fn}
  });
}catch{}
try{
  Object.defineProperty(window,'rhLoginGoogle',{
    configurable:true,
    get(){return async function(...args){
      begin();
      if(typeof rawLogin!=='function'){
        finish();
        window.toast?.('Google sign-in is still loading. Try again in a moment.');
        window.rhAuthShowLogin?.();
        return false;
      }
      try{return await rawLogin.apply(this,args)}
      finally{
        fallbackTimer=setTimeout(()=>{
          if(!actualUser()&&transition){finish();window.rhAuthShowLogin?.()}
        },1400);
      }
    }},
    set(fn){rawLogin=fn}
  });
}catch{}

window.riderHubActualFirebaseUser=actualUser;
window.riderHubBeginAuthTransition=begin;
window.riderHubFinishAuthTransition=finish;
window.riderHubShowAuthOpening=showOpening;

/* Once Firebase has positively identified a user, do not keep the whole app
   blocked behind the transition screen. The fast-start layer decides whether a
   cached workspace can be shown immediately or whether cloud hydration must finish. */
window.addEventListener('riderhub-sync-status',event=>{
  const kind=String(event?.detail?.kind||'');
  if(!transition)return;
  if(actualUser()){
    finish();
    return;
  }
  if(kind==='loading'||kind==='syncing'||kind==='signedout'){
    showOpening();
    event.stopImmediatePropagation();
    return;
  }
  if(kind==='error'){
    finish();
    setTimeout(()=>window.rhAuthShowLogin?.(),0);
  }
});

if(transition)setTimeout(showOpening,0);
})();
