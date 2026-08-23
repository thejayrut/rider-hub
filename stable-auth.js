import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {getAuth,setPersistence,browserLocalPersistence,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signOut,deleteUser,reauthenticateWithPopup} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,deleteDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
const CFG=window.RIDER_HUB_FIREBASE_CONFIG;
const ALLOWED=String(window.riderHubAllowedEmail?.()||'jayrut2006@gmail.com').toLowerCase();
const app=initializeApp(CFG),auth=getAuth(app),db=getFirestore(app);
let current=null,revision=0,saving=false,pending=null,authResolved=false;
let cloud={state:navigator.onLine?'local':'offline',lastSavedAt:localStorage.getItem('riderhub_last_cloud_save')||'',lastLoadedAt:'',error:''};
const provider=()=>{const p=new GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});return p};
const stateRef=uid=>doc(db,'users',uid,'riderhub','state');
const profileRef=uid=>doc(db,'users',uid);
function setCloud(state,extra={}){cloud={...cloud,state,...extra};window.dispatchEvent(new CustomEvent('riderhub-cloud-state',{detail:{...cloud}}))}
window.riderHubCloudState=()=>({...cloud});
async function loadState(user){const snap=await getDoc(stateRef(user.uid));if(!snap.exists())return null;const d=snap.data()||{};revision=Number(d.revision||0);return d.state||null}
async function writeProfile(user){await setDoc(profileRef(user.uid),{displayName:user.displayName||'',email:user.email||'',photoURL:user.photoURL||'',lastLoginAt:serverTimestamp()},{merge:true})}
async function saveNow(state){
  if(!current||!state||saving)return false;
  if(!navigator.onLine){setCloud('offline');return false}
  saving=true;setCloud('syncing',{error:''});
  try{
    revision=Math.max(0,revision)+1;
    await setDoc(stateRef(current.uid),{schema:4,revision,clientId:'stable-'+current.uid.slice(0,12),state,clientUpdatedAt:Date.now(),updatedAt:serverTimestamp()});
    const at=new Date().toISOString();localStorage.setItem('riderhub_last_cloud_save',at);setCloud('synced',{lastSavedAt:at,error:''});return true;
  }catch(e){console.warn('Rider Hub cloud save unavailable',e);revision=Math.max(0,revision-1);setCloud(navigator.onLine?'pending':'offline',{error:String(e?.message||'')});return false}
  finally{saving=false;if(pending){const x=pending;pending=null;setTimeout(()=>saveNow(x),100)}}
}
window.riderHubCloudSave=state=>{if(saving){pending=state;setCloud('pending');return Promise.resolve(false)}return saveNow(state)};
window.riderHubFirebaseUser=()=>current||auth.currentUser||null;
window.riderHubAuthResolved=()=>authResolved;
const stateJson=()=>{try{return JSON.stringify(window.riderHubExportState?.()||null)}catch{return''}};
async function hydrateCloud(user,localAtStart){
  if(!navigator.onLine)return setCloud('offline');
  setCloud('syncing',{error:''});
  try{
    await writeProfile(user);const remote=await loadState(user),localNow=stateJson();
    if(localNow&&localAtStart&&localNow!==localAtStart){await saveNow(window.riderHubExportState?.());return}
    if(remote){window.riderHubSetUser?.(user,remote);setCloud('synced',{lastLoadedAt:new Date().toISOString(),error:''})}
    else await saveNow(window.riderHubExportState?.());
  }catch(e){console.warn('Rider Hub cloud hydration unavailable',e);setCloud(navigator.onLine?'pending':'offline',{error:String(e?.message||'')})}
}
function enterFast(user){
  const email=String(user?.email||'').toLowerCase();if(email!==ALLOWED)return false;
  current=user;window.riderHubFirebaseUser=()=>current;window.riderHubSetUser?.(user,null);authResolved=true;window.riderHubAuthReady?.(user);
  const localAtStart=stateJson();setCloud(navigator.onLine?'local':'offline');setTimeout(()=>hydrateCloud(user,localAtStart),0);return true;
}
window.riderHubLogin=async()=>{try{await signInWithPopup(auth,provider())}catch(e){console.error('Rider Hub sign-in failed',e);const code=String(e?.code||'');if(code.includes('popup-closed')||code.includes('cancelled-popup'))return window.toast?.('Google sign-in was cancelled');if(code.includes('popup-blocked'))return window.toast?.('Allow pop-ups for Rider Hub, then try again');if(code.includes('unauthorized-domain'))return window.toast?.('This Rider Hub domain is not authorized for Google sign-in');window.toast?.(`Google sign-in failed${code?` · ${code.replace('auth/','')}`:''}`)}};
window.riderHubLogout=async()=>{try{if(current)await saveNow(window.riderHubExportState?.());await signOut(auth)}catch(e){console.warn(e)}current=null;setCloud(navigator.onLine?'local':'offline')};
async function clearCloud(user){await deleteDoc(stateRef(user.uid)).catch(()=>{});await deleteDoc(profileRef(user.uid)).catch(()=>{})}
async function reauth(user){const p=provider();p.setCustomParameters({prompt:'select_account',login_hint:user.email||''});await reauthenticateWithPopup(user,p)}
window.riderHubDeleteAccount=async()=>{
  const user=auth.currentUser;if(!user)return window.toast?.('Sign in again first');
  try{
    window.toast?.('Deleting Rider Hub account…');
    if(window.riderHubDriveRemembered?.()&&!window.cloudSyncConnected?.())await window.riderHubEnsureDriveAccess?.(false).catch(()=>false);
    if(window.cloudSyncConnected?.())await window.riderHubDeleteDriveData?.().catch(()=>{});
    await window.riderHubDeleteLocalAccountFiles?.(user.uid).catch(()=>{});await clearCloud(user);
    try{await deleteUser(user)}catch(e){if(String(e?.code||'').includes('requires-recent-login')){await reauth(user);await deleteUser(auth.currentUser)}else throw e}
    for(const key of ['riderhub_stable_v1','riderhub_onboarding_seen_v1','riderhub_drive_v2','riderhub_last_cloud_save','riderhub_last_drive_file_sync'])localStorage.removeItem(key);
    current=null;setCloud('local',{lastSavedAt:'',lastLoadedAt:'',error:''});window.toast?.('Rider Hub account deleted');
  }catch(e){console.error('Account deletion failed',e);window.toast?.(String(e?.code||'').includes('requires-recent-login')?'Sign in again, then retry account deletion':e?.message||'Could not delete account')}
};
window.addEventListener('online',()=>{if(current){setCloud('local');setTimeout(()=>hydrateCloud(current,stateJson()),0)}});
window.addEventListener('offline',()=>setCloud('offline'));
window.riderHubAuthBooting?.();
await setPersistence(auth,browserLocalPersistence);
onAuthStateChanged(auth,user=>{
  if(user){
    if(enterFast(user))return;
    signOut(auth).catch(()=>{}).finally(()=>{current=null;authResolved=true;window.riderHubAuthBlocked?.(String(user.email||'').toLowerCase());window.riderHubAuthReady?.(null)});return;
  }
  current=null;window.riderHubFirebaseUser=()=>null;authResolved=true;window.riderHubSignedOut?.();window.riderHubAuthReady?.(null);setCloud(navigator.onLine?'local':'offline');
});
