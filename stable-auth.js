import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {getAuth,setPersistence,browserLocalPersistence,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signOut,deleteUser,reauthenticateWithPopup} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,deleteDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
const CFG=window.RIDER_HUB_FIREBASE_CONFIG;
const ALLOWED=String(window.riderHubAllowedEmail?.()||'jayrut2006@gmail.com').toLowerCase();
const app=initializeApp(CFG),auth=getAuth(app),db=getFirestore(app);
let current=null,revision=0,saving=false,pending=null;
const provider=()=>{const p=new GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});return p};
const stateRef=uid=>doc(db,'users',uid,'riderhub','state');
const profileRef=uid=>doc(db,'users',uid);
async function loadState(user){const snap=await getDoc(stateRef(user.uid));if(!snap.exists())return null;const d=snap.data()||{};revision=Number(d.revision||0);return d.state||null}
async function writeProfile(user){await setDoc(profileRef(user.uid),{displayName:user.displayName||'',email:user.email||'',photoURL:user.photoURL||'',lastLoginAt:serverTimestamp()},{merge:true})}
async function enter(user){const email=String(user?.email||'').toLowerCase();if(!user)return;if(email!==ALLOWED){await signOut(auth).catch(()=>{});window.riderHubAuthBlocked?.(email);return}current=user;window.riderHubFirebaseUser=()=>current;try{await writeProfile(user);const cloud=await loadState(user);window.riderHubSetUser?.(user,cloud);if(!cloud)await saveNow(window.riderHubExportState?.())}catch(e){console.warn('Rider Hub cloud load unavailable',e);window.riderHubSetUser?.(user,null)}}
async function saveNow(state){if(!current||!state||saving)return false;saving=true;try{revision=Math.max(0,revision)+1;await setDoc(stateRef(current.uid),{schema:4,revision,clientId:'stable-'+current.uid.slice(0,12),state,clientUpdatedAt:Date.now(),updatedAt:serverTimestamp()});return true}catch(e){console.warn('Rider Hub cloud save unavailable',e);revision=Math.max(0,revision-1);return false}finally{saving=false;if(pending){const x=pending;pending=null;setTimeout(()=>saveNow(x),100)}}}
window.riderHubCloudSave=state=>{if(saving){pending=state;return}saveNow(state)};
window.riderHubFirebaseUser=()=>current||auth.currentUser||null;
window.riderHubLogin=async()=>{
  try{
    await signInWithPopup(auth,provider());
  }catch(e){
    console.error('Rider Hub sign-in failed',e);
    const code=String(e?.code||'');
    if(code.includes('popup-closed')||code.includes('cancelled-popup'))return window.toast?.('Google sign-in was cancelled');
    if(code.includes('popup-blocked'))return window.toast?.('Allow pop-ups for Rider Hub, then try again');
    if(code.includes('unauthorized-domain'))return window.toast?.('This Rider Hub domain is not authorized for Google sign-in');
    window.toast?.(`Google sign-in failed${code?` · ${code.replace('auth/','')}`:''}`);
  }
};
window.riderHubLogout=async()=>{try{if(current)await saveNow(window.riderHubExportState?.());await signOut(auth)}catch(e){console.warn(e)}current=null;window.riderHubSignedOut?.()};
async function clearCloud(user){await deleteDoc(stateRef(user.uid)).catch(()=>{});await deleteDoc(profileRef(user.uid)).catch(()=>{})}
async function reauth(user){const p=provider();p.setCustomParameters({prompt:'select_account',login_hint:user.email||''});await reauthenticateWithPopup(user,p)}
window.riderHubDeleteAccount=async()=>{const user=auth.currentUser;if(!user)return window.toast?.('Sign in again first');try{window.toast?.('Deleting Rider Hub account…');if(window.cloudSyncConnected?.())await window.riderHubDeleteDriveData?.().catch(()=>{});await window.riderHubDeleteLocalAccountFiles?.(user.uid).catch(()=>{});await clearCloud(user);try{await deleteUser(user)}catch(e){if(String(e?.code||'').includes('requires-recent-login')){await reauth(user);await deleteUser(auth.currentUser)}else throw e}localStorage.removeItem('riderhub_stable_v1');current=null;window.riderHubSignedOut?.();window.toast?.('Rider Hub account deleted')}catch(e){console.error('Account deletion failed',e);window.toast?.(String(e?.code||'').includes('requires-recent-login')?'Sign in again, then retry account deletion':e?.message||'Could not delete account')}};
await setPersistence(auth,browserLocalPersistence);
onAuthStateChanged(auth,user=>{if(user)enter(user);else{current=null;window.riderHubFirebaseUser=()=>null;window.riderHubSignedOut?.()}});
