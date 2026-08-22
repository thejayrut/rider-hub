/* Rider Hub deterministic onboarding/auth coordinator.
   Keeps the three manual welcome slides stable while Firebase initializes and
   guarantees the first-time motorcycle gate after authentication. */
(()=>{
'use strict';
const AUTH_KEY='riderhub_auth_session_v1';
const SLIDES=[
  {k:'YOUR MOTORCYCLE OS',h:'Everything around your motorcycle, in one place.',p:'Keep your bike information, maintenance, service history, gear and private documents organised around the motorcycle you actually ride.',f:[['Your bike','A workspace that adapts to your motorcycle.'],['Ownership','Odometer, service history and documents stay together.']]},
  {k:'RIDE MODE',h:'Plan less while riding. Miss less when tired.',p:'Ride plans, progress, emergency tools, notes and packing stay easy to reach when you are on the road.',f:[['Ride progress','Track what is done, delayed or skipped.'],['Road-ready','Keep the important controls close during a ride.']]},
  {k:'RIDER HUB',h:'Your bike and rides can follow you across devices.',p:'Sign in to keep your Rider Hub available across your devices while the core experience remains local-first.',f:[['Private account','Your workspace belongs to your account.'],['Offline core','Your local copy remains useful when the network disappears.']]}
];
let index=0;
let mode='welcome';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shell=()=>document.querySelector('#rhAuthShell');
const stage=()=>document.querySelector('#rhAuthStage');
const firebaseUser=()=>typeof window.riderHubFirebaseUser==='function'?window.riderHubFirebaseUser():null;
const publicUser=()=>!!window.state?.profile?.publicUser;
const bikeConfigured=()=>!!window.state?.profile?.bikeConfigured;

function genericBrand(){
  const small=document.querySelector('#rhAuthShell .rh-auth-brand small');
  if(small)small.textContent='MOTORCYCLE OS';
}
function renderWelcome(i=index){
  const sh=shell(),st=stage();if(!sh||!st)return;
  mode='welcome';index=Math.max(0,Math.min(SLIDES.length-1,Number(i)||0));genericBrand();sh.classList.add('active');
  const s=SLIDES[index];
  st.innerHTML=`<div class="rh-slide-kicker">${esc(s.k)}</div><h1>${esc(s.h)}</h1><p>${esc(s.p)}</p><div class="rh-auth-features">${s.f.map(x=>`<div class="rh-auth-feature"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('')}</div><div class="rh-auth-dots">${SLIDES.map((_,n)=>`<i class="rh-auth-dot ${n===index?'active':''}"></i>`).join('')}</div><div class="rh-auth-actions">${index?'<button type="button" onclick="rhApprovedWelcomeBack()">Back</button>':''}<button type="button" class="primary" onclick="rhApprovedWelcomeNext()">${index===SLIDES.length-1?'Continue':'Next'}</button></div>`;
}
function renderLogin(message='',warn=false){
  const sh=shell(),st=stage();if(!sh||!st)return;
  mode='login';genericBrand();sh.classList.add('active');
  st.innerHTML=`<div class="rh-auth-login"><div class="rh-slide-kicker">MY ACCOUNT</div><h2>Sign in to Rider Hub</h2><p>Use your Google account to keep your Rider Hub available across your devices.</p><div class="rh-auth-form"><button id="rhGoogleFirebaseLogin" type="button" class="rh-auth-button primary full" onclick="rhLoginGoogle()">Continue with Google</button><div id="rhAuthNote" class="rh-auth-note${warn?' warn':''}">${esc(message)}</div></div></div>`;
}
window.rhApprovedWelcomeBack=()=>renderWelcome(index-1);
window.rhApprovedWelcomeNext=()=>index===SLIDES.length-1?renderLogin():renderWelcome(index+1);
window.rhAuthShowWelcome=()=>renderWelcome(0);
window.rhAuthShowLogin=()=>renderLogin();
window.riderHubAuthFlowMode=()=>mode;
window.riderHubAuthSlideIndex=()=>index;

function restoreSignedOutUi(){
  if(firebaseUser())return;
  if(mode==='login')renderLogin();else renderWelcome(index);
}
function enforceSignedInGate(){
  if(!firebaseUser())return;
  if(publicUser()&&!bikeConfigured()){
    mode='setup';
    if(typeof window.riderHubRequireBikeSetup==='function')window.riderHubRequireBikeSetup();
    return;
  }
  mode='app';shell()?.classList.remove('active');
}

window.addEventListener('riderhub-sync-status',event=>{
  const kind=String(event?.detail?.kind||'');
  if(kind==='signedout'){
    queueMicrotask(restoreSignedOutUi);
    setTimeout(restoreSignedOutUi,30);
    return;
  }
  if(kind==='error'&&!firebaseUser()){
    setTimeout(()=>{
      if(mode==='login')renderLogin('Sign-in could not start. Check your connection and reload Rider Hub.',true);
      else restoreSignedOutUi();
    },30);
    return;
  }
  if(kind==='loading'||kind==='syncing')return;
  setTimeout(enforceSignedInGate,30);
});

function hasRememberedFirebaseSession(){
  try{const s=JSON.parse(localStorage.getItem(AUTH_KEY)||'null');return !!(s&&s.provider==='firebase'&&s.uid)}catch{return false}
}
genericBrand();
if(!hasRememberedFirebaseSession()){
  renderWelcome(0);
  setTimeout(()=>{if(!firebaseUser()&&mode==='welcome')renderWelcome(index)},140);
}
})();
