/* Rider Hub v32 fast startup.
   Paints a cached signed-in workspace immediately and keeps first-time/new-device
   account resolution behind one compact gate instead of flashing onboarding or
   motorcycle setup. */
(()=>{
'use strict';
const AUTH_KEY='riderhub_auth_session_v1';
const USER_PREFIX='riderhub_public_state_v1_';
let waitTimer=0;
let waitingForCloud=false;
let unresolved=false;
const parse=(s,f=null)=>{try{return JSON.parse(s||'null')??f}catch{return f}};
const session=()=>parse(localStorage.getItem(AUTH_KEY));
const keyFor=uid=>USER_PREFIX+encodeURIComponent(String(uid||''));
const cachedFor=uid=>uid?parse(localStorage.getItem(keyFor(uid))):null;
const actualUser=()=>typeof window.riderHubActualFirebaseUser==='function'?window.riderHubActualFirebaseUser():null;
const shell=()=>document.querySelector('#rhAuthShell');
const stage=()=>document.querySelector('#rhAuthStage');

function applyAccentFrom(state){
  const c=state?.ui?.accentColor;
  if(!/^#[0-9a-f]{6}$/i.test(String(c||'')))return;
  if(typeof window.riderHubApplyAccent==='function'){window.riderHubApplyAccent(c);return}
  const n=parseInt(c.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;
  document.documentElement.style.setProperty('--ember',c);
  document.documentElement.style.setProperty('--ember2',c);
  document.documentElement.style.setProperty('--soft',`rgba(${r},${g},${b},.11)`);
  document.documentElement.style.setProperty('--rh-accent',c);
}
function reveal(){document.documentElement.classList.remove('rh-preboot')}
function markWaiting(on){
  waitingForCloud=!!on;
  window.RIDER_HUB_WAIT_FOR_CLOUD=waitingForCloud;
  if(!on){clearTimeout(waitTimer);return}
  clearTimeout(waitTimer);
  waitTimer=setTimeout(()=>{
    if(!waitingForCloud)return;
    unresolved=true;
    window.RIDER_HUB_CLOUD_UNRESOLVED=true;
    showCloudTimeout();
  },6500);
}
function showCloudTimeout(){
  const sh=shell(),st=stage();if(!sh||!st)return;
  sh.classList.add('active');
  st.innerHTML='<div class="rh-auth-opening rh-auth-opening-v32 rh-cloud-timeout"><div class="rh-opening-emblem">RH</div><div class="rh-slide-kicker">RIDER HUB</div><h2>We could not reach your saved workspace.</h2><p>Your account is signed in, but this device has no local Rider Hub copy and the cloud check took too long. Nothing was overwritten.</p><div class="rh-auth-actions"><button type="button" class="secondary" onclick="location.reload()">Retry</button></div></div>';
}
function bootCachedSession(){
  const s=session(),uid=s?.provider==='firebase'&&s?.uid?s.uid:'';
  if(!uid)return false;
  const cached=cachedFor(uid);
  if(!cached?.profile?.publicUser){markWaiting(true);setTimeout(()=>window.riderHubShowAuthOpening?.(),0);return false}
  markWaiting(false);unresolved=false;window.RIDER_HUB_CLOUD_UNRESOLVED=false;
  applyAccentFrom(cached);
  try{
    window.riderHubActivatePublicUser?.({
      uid,
      email:cached.profile?.account?.email||s.email||'',
      name:cached.profile?.account?.name||cached.profile?.account?.email||'Rider',
      photoURL:cached.profile?.account?.photoURL||'',
      provider:'firebase'
    });
    if(typeof window.render==='function')window.render();
    shell()?.classList.remove('active');
  }catch(e){console.warn('Rider Hub fast local boot unavailable',e)}
  return true;
}

window.riderHubFastStartHasCachedWorkspace=uid=>!!cachedFor(uid);
window.riderHubFastStartWaiting=()=>waitingForCloud;
window.riderHubFastStartUnresolved=()=>unresolved;
window.riderHubFastStartRetry=()=>location.reload();

/* Register before auth-flow-controller so hydration state is settled before that
   controller decides between Home and first-time motorcycle setup. */
window.addEventListener('riderhub-sync-status',event=>{
  const kind=String(event?.detail?.kind||'');
  const user=actualUser();
  if(user){
    const cached=cachedFor(user.uid);
    if(kind==='syncing'&&/opening|cloud|workspace/i.test(String(event?.detail?.detail||''))){
      markWaiting(!cached?.profile?.publicUser);
      if(cached?.profile?.publicUser){
        applyAccentFrom(cached);
        setTimeout(()=>shell()?.classList.remove('active'),0);
      }
      return;
    }
    if(kind==='synced'||kind==='conflict'||kind==='local'){
      markWaiting(false);unresolved=false;window.RIDER_HUB_CLOUD_UNRESOLVED=false;
      const now=cachedFor(user.uid);if(now)applyAccentFrom(now);
      return;
    }
    if((kind==='pending'||kind==='error'||kind==='offline')&&waitingForCloud&&!cached?.profile?.publicUser){
      unresolved=true;window.RIDER_HUB_CLOUD_UNRESOLVED=true;markWaiting(true);setTimeout(showCloudTimeout,0);
    }
  }else if(kind==='signedout'){
    markWaiting(false);unresolved=false;window.RIDER_HUB_CLOUD_UNRESOLVED=false;
  }
});

bootCachedSession();
setTimeout(reveal,0);
setTimeout(reveal,1200);
})();
