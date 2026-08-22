/* Rider Hub Firebase email authentication + per-user state sync.
   Requires window.RIDER_HUB_FIREBASE_CONFIG to be filled from Firebase Console.
   Firebase web configuration is public by design; no admin/service credentials belong in this file. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendEmailVerification, sendPasswordResetEmail, updateProfile
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const CFG=window.RIDER_HUB_FIREBASE_CONFIG;
const AUTH_KEY='riderhub_auth_session_v1';
let auth=null,db=null,ready=false,current=null,syncTimer=null,syncing=false;
const note=(text,warn=false)=>{const n=document.querySelector('#rhAuthNote');if(n){n.className='rh-auth-note'+(warn?' warn':'');n.textContent=text}if(typeof window.toast==='function'&&warn)window.toast(text)};
const validConfig=c=>!!(c&&c.apiKey&&c.projectId&&c.appId&&c.authDomain);

function wireLoginUi(){
 const stage=document.querySelector('#rhAuthStage');if(!stage)return;
 const login=[...stage.querySelectorAll('button')].find(b=>b.textContent.trim()==='Login with email');
 const signup=[...stage.querySelectorAll('button')].find(b=>b.textContent.trim()==='Create account with email');
 if(login){login.onclick=()=>window.rhEmailLogin();login.disabled=!ready}
 if(signup){signup.onclick=()=>window.rhEmailSignup();signup.disabled=!ready}
 if((login||signup)&&!stage.querySelector('#rhForgotPassword')){
  const btn=document.createElement('button');btn.id='rhForgotPassword';btn.className='rh-auth-button full';btn.textContent='Forgot password';btn.onclick=()=>window.rhEmailReset();
  const host=document.querySelector('#rhAuthNote')?.parentElement||stage;host.insertBefore(btn,document.querySelector('#rhAuthNote')||null);
 }
 if(!ready&&document.querySelector('#rhAuthNote'))note('Email login is being configured. Google sign-in remains available.',false);
}
new MutationObserver(wireLoginUi).observe(document.documentElement,{subtree:true,childList:true});

async function pullUserState(user){
 if(!db||!user)return false;
 try{
  const ref=doc(db,'users',user.uid,'riderhub','state');const snap=await getDoc(ref);
  if(snap.exists()&&snap.data()?.state&&typeof window.riderHubImportState==='function'){
   window.riderHubImportState(snap.data().state);return true;
  }
 }catch(e){console.warn('Rider Hub Firestore pull unavailable',e)}
 return false;
}
async function pushUserState(){
 if(!db||!current||syncing||typeof window.riderHubExportState!=='function')return false;
 syncing=true;
 try{
  const ref=doc(db,'users',current.uid,'riderhub','state');
  await setDoc(ref,{schema:1,state:window.riderHubExportState(),updatedAt:serverTimestamp()},{merge:true});return true;
 }catch(e){console.warn('Rider Hub Firestore sync unavailable',e);return false}finally{syncing=false}
}
window.riderHubFirebaseQueueSync=function(){if(!current||!db)return;clearTimeout(syncTimer);syncTimer=setTimeout(pushUserState,1200)};
window.riderHubFirebaseSyncNow=async function(){const ok=await pushUserState();if(typeof window.toast==='function')window.toast(ok?'Account data synced':'Account sync unavailable')};

async function enterUser(user){
 current=user;
 localStorage.setItem(AUTH_KEY,JSON.stringify({at:new Date().toISOString(),provider:'firebase',uid:user.uid}));
 if(typeof window.riderHubActivatePublicUser==='function')window.riderHubActivatePublicUser({uid:user.uid,email:user.email||'',name:user.displayName||user.email||'Rider',provider:'firebase'});
 const pulled=await pullUserState(user);if(!pulled)await pushUserState();
 document.querySelector('#rhAuthShell')?.classList.remove('active');
 if(typeof window.renderMore==='function')window.renderMore();
}

window.rhEmailSignup=async function(){
 if(!ready)return note('Email login is not configured yet.',true);
 const email=document.querySelector('#rhEmail')?.value.trim(),password=document.querySelector('#rhPassword')?.value||'';
 const name=document.querySelector('#rhName')?.value?.trim()||'';
 if(!email||password.length<6)return note('Enter a valid email and a password of at least 6 characters.',true);
 try{
  note('Creating account…');const cred=await createUserWithEmailAndPassword(auth,email,password);
  if(name)await updateProfile(cred.user,{displayName:name});await sendEmailVerification(cred.user);await signOut(auth);
  localStorage.removeItem(AUTH_KEY);note('Account created. Check your email, verify it, then log in.');
 }catch(e){note((e?.message||'Could not create account').replace('Firebase: ','').slice(0,150),true)}
};
window.rhEmailLogin=async function(){
 if(!ready)return note('Email login is not configured yet.',true);
 const email=document.querySelector('#rhEmail')?.value.trim(),password=document.querySelector('#rhPassword')?.value||'';
 if(!email||!password)return note('Enter your email and password.',true);
 try{
  note('Signing in…');const cred=await signInWithEmailAndPassword(auth,email,password);
  if(!cred.user.emailVerified){await sendEmailVerification(cred.user).catch(()=>{});await signOut(auth);return note('Verify your email first. A new verification email was sent.',true)}
  await enterUser(cred.user);if(typeof window.toast==='function')window.toast('Signed in to Rider Hub');
 }catch(e){note('Email or password is incorrect, or the account is unavailable.',true)}
};
window.rhEmailReset=async function(){
 if(!ready)return note('Email login is not configured yet.',true);
 const email=document.querySelector('#rhEmail')?.value.trim();if(!email)return note('Enter your email address first.',true);
 try{await sendPasswordResetEmail(auth,email);note('Password reset email sent.')}catch(e){note('Could not send password reset email.',true)}
};

if(validConfig(CFG)){
 try{
  const app=initializeApp(CFG);auth=getAuth(app);db=getFirestore(app);await setPersistence(auth,browserLocalPersistence);ready=true;wireLoginUi();
  onAuthStateChanged(auth,async user=>{
   if(user&&user.emailVerified){await enterUser(user)}
   else if(!user&&localStorage.getItem(AUTH_KEY)?.includes('firebase'))localStorage.removeItem(AUTH_KEY);
  });
  const previousLogout=window.logoutRiderHub;
  window.logoutRiderHub=async function(){try{if(typeof window.riderHubPublicBeforeLogout==='function')window.riderHubPublicBeforeLogout();if(auth?.currentUser)await signOut(auth)}catch{}localStorage.removeItem(AUTH_KEY);current=null;if(typeof previousLogout==='function')previousLogout();};
 }catch(e){console.error('Rider Hub Firebase initialization failed',e);ready=false;wireLoginUi()}
}else{
 ready=false;wireLoginUi();
}
window.riderHubFirebaseReady=()=>ready;
