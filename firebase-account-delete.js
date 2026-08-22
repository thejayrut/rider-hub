/* Rider Hub self-service account deletion v32.
   Keeps the destructive flow bounded: no automatic Drive reconnect, no minutes-long
   waits, and reauthentication only when the Firebase session is no longer recent. */
import {getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {getAuth,GoogleAuthProvider,reauthenticateWithPopup,deleteUser} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {getFirestore,doc,deleteDoc} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const timeout=(promise,ms,label)=>Promise.race([promise,new Promise((_,rej)=>setTimeout(()=>rej(new Error(label||'Request timed out')),ms))]);
const recent=user=>{const t=Date.parse(user?.metadata?.lastSignInTime||'');return Number.isFinite(t)&&Date.now()-t<8*60*1000};

window.openDeleteRiderHubAccount=function(){
  const u=typeof window.riderHubActualFirebaseUser==='function'?window.riderHubActualFirebaseUser():typeof window.riderHubFirebaseUser==='function'?window.riderHubFirebaseUser():null;
  if(!u)return window.toast?.('Sign in to delete a Rider Hub account');
  if(typeof window.openModal!=='function')return;
  window.openModal(`<div class="modalhead"><div><div class="kicker">DELETE ACCOUNT</div><h3>Delete Rider Hub account</h3><p class="caption">${esc(u.email||'Signed-in account')}</p></div><button class="round" onclick="closeModal()">×</button></div>
    <div class="rh-delete-confirm"><strong>This is permanent.</strong><p>Rider Hub deletes this account's synced app data and local account data. Your Google account itself is not deleted.</p></div>
    <label class="routecard" style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input id="rhDeleteDriveToo" type="checkbox" style="margin-top:2px"><span><strong>Also delete the Rider Hub folder from Google Drive</strong><p>Optional. For a fast account deletion, this only runs when Drive is already connected. Rider Hub will not stop to reconnect Drive during deletion.</p></span></label>
    <div class="field"><label>TYPE DELETE TO CONFIRM</label><input id="rhDeleteConfirmText" autocomplete="off" placeholder="DELETE"></div>
    <button id="rhDeleteAccountButton" class="danger full" style="margin-top:12px" onclick="confirmDeleteRiderHubAccount()">Delete account permanently</button>`);
};

async function verifyIfNeeded(user,btn){
  if(recent(user))return true;
  if(btn)btn.textContent='Verify account…';
  const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account',login_hint:user.email||''});
  await timeout(reauthenticateWithPopup(user,provider),30000,'Account verification timed out');
  return true;
}
async function deleteDriveIfRequested(){
  if(!document.querySelector('#rhDeleteDriveToo')?.checked)return;
  if(!(typeof window.cloudSyncConnected==='function'&&window.cloudSyncConnected()))return;
  if(typeof window.riderHubDeleteDriveData!=='function')return;
  await timeout(window.riderHubDeleteDriveData(),3000,'Drive cleanup timed out').catch(e=>console.warn('Rider Hub Drive cleanup skipped',e));
}

window.confirmDeleteRiderHubAccount=async function(){
  const input=document.querySelector('#rhDeleteConfirmText'),btn=document.querySelector('#rhDeleteAccountButton');
  if(String(input?.value||'').trim().toUpperCase()!=='DELETE')return window.toast?.('Type DELETE to confirm');
  if(!getApps().length)return window.toast?.('Rider Hub account is still starting');
  const app=getApp(),auth=getAuth(app),db=getFirestore(app),user=auth.currentUser;
  if(!user)return window.toast?.('Sign in again before deleting the account');
  if(btn){btn.disabled=true;btn.textContent='Preparing deletion…'}
  try{
    await verifyIfNeeded(user,btn);
    const uid=user.uid;
    if(btn)btn.textContent='Deleting Rider Hub data…';
    const cloudDeletes=Promise.all([
      deleteDoc(doc(db,'users',uid,'riderhub','state')).catch(e=>{if(e?.code!=='not-found')throw e}),
      deleteDoc(doc(db,'users',uid)).catch(e=>{if(e?.code!=='not-found')throw e})
    ]);
    const localDelete=Promise.resolve(window.riderHubDeleteLocalAccountFiles?.(uid)).catch(()=>{});
    const driveDelete=deleteDriveIfRequested();
    await timeout(Promise.all([cloudDeletes,localDelete,driveDelete]),6000,'Account data deletion timed out');

    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i)||'';
      if(k.includes(uid)||k==='riderhub_auth_session_v1'||k==='riderhub_public_active_uid_v1')localStorage.removeItem(k);
    }
    if(btn)btn.textContent='Deleting account…';
    await timeout(deleteUser(user),8000,'Account deletion timed out');
    try{localStorage.removeItem('riderhub_v6')}catch{}
    location.replace(window.RIDER_HUB_CANONICAL_URL||'/');
  }catch(e){
    console.error('Rider Hub account deletion failed',e);
    const code=String(e?.code||'');let msg=e?.message||'Could not delete the account';
    if(code.includes('popup-closed')||code.includes('cancelled'))msg='Account deletion cancelled during verification';
    if(code.includes('requires-recent-login'))msg='Sign out, sign back in, then try account deletion again';
    if(code.includes('permission-denied'))msg='Rider Hub could not delete synced data. Try again when the connection is stable.';
    if(/timed out/i.test(msg))msg='Deletion took too long. Nothing else will be removed until you try again.';
    window.toast?.(msg);
    if(btn){btn.disabled=false;btn.textContent='Delete account permanently'}
  }
};
