/* Rider Hub self-service account deletion.
   Deletes Rider Hub Firestore data, local account-scoped files/state, and then
   the Firebase Authentication user. Optional Drive deletion removes the app-created
   Rider Hub folder and its owned descendants. */
import {getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {getAuth,GoogleAuthProvider,reauthenticateWithPopup,deleteUser} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {getFirestore,doc,deleteDoc} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

window.openDeleteRiderHubAccount=function(){
  const u=typeof window.riderHubFirebaseUser==='function'?window.riderHubFirebaseUser():null;
  if(!u)return window.toast?.('Sign in to delete a Rider Hub account');
  if(typeof window.openModal!=='function')return;
  window.openModal(`<div class="modalhead"><div><div class="kicker">DELETE ACCOUNT</div><h3>Delete Rider Hub account</h3><p class="caption">${esc(u.email||'Signed-in account')}</p></div><button class="round" onclick="closeModal()">×</button></div>
    <div class="rh-delete-confirm"><strong>This is permanent.</strong><p>Rider Hub will delete this account's synced app data and local account data. Your Google account itself is not deleted.</p></div>
    <label class="routecard" style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input id="rhDeleteDriveToo" type="checkbox" checked style="margin-top:2px"><span><strong>Delete Rider Hub files from Google Drive too</strong><p>If Drive is connected, the app-created My Drive / Rider Hub folder and its files are permanently deleted. If Drive cannot be connected, those Drive files are left in your Google Drive.</p></span></label>
    <div class="field"><label>TYPE DELETE TO CONFIRM</label><input id="rhDeleteConfirmText" autocomplete="off" placeholder="DELETE"></div>
    <button id="rhDeleteAccountButton" class="danger full" style="margin-top:12px" onclick="confirmDeleteRiderHubAccount()">Delete account permanently</button>`);
};

window.confirmDeleteRiderHubAccount=async function(){
  const input=document.querySelector('#rhDeleteConfirmText'),btn=document.querySelector('#rhDeleteAccountButton');
  if(String(input?.value||'').trim().toUpperCase()!=='DELETE')return window.toast?.('Type DELETE to confirm');
  if(!getApps().length)return window.toast?.('Rider Hub account is still starting');
  const app=getApp(),auth=getAuth(app),db=getFirestore(app),user=auth.currentUser;
  if(!user)return window.toast?.('Sign in again before deleting the account');
  if(btn){btn.disabled=true;btn.textContent='Verifying account…'}
  try{
    const provider=new GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account',login_hint:user.email||''});
    await reauthenticateWithPopup(user,provider);

    const deleteDrive=!!document.querySelector('#rhDeleteDriveToo')?.checked;
    if(deleteDrive){
      if(typeof window.cloudSyncConnected==='function'&&!window.cloudSyncConnected()){
        if(btn)btn.textContent='Connecting Drive…';
        await window.requestDriveAccess?.(false);
      }
      if(typeof window.cloudSyncConnected==='function'&&window.cloudSyncConnected()&&typeof window.riderHubDeleteDriveData==='function'){
        if(btn)btn.textContent='Deleting Drive files…';
        await window.riderHubDeleteDriveData();
      }
    }

    if(btn)btn.textContent='Deleting Rider Hub data…';
    await deleteDoc(doc(db,'users',user.uid,'riderhub','state')).catch(e=>{if(e?.code!=='not-found')throw e});
    await deleteDoc(doc(db,'users',user.uid)).catch(e=>{if(e?.code!=='not-found')throw e});
    await window.riderHubDeleteLocalAccountFiles?.(user.uid).catch(()=>{});

    const uid=user.uid;
    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i)||'';
      if(k.includes(uid)||k==='riderhub_auth_session_v1'||k==='riderhub_public_active_uid_v1')localStorage.removeItem(k);
    }
    if(btn)btn.textContent='Deleting account…';
    await deleteUser(user);
    try{localStorage.removeItem('riderhub_v6')}catch{}
    location.replace(window.RIDER_HUB_CANONICAL_URL||'/');
  }catch(e){
    console.error('Rider Hub account deletion failed',e);
    const code=String(e?.code||'');
    let msg=e?.message||'Could not delete the account';
    if(code.includes('popup-closed')||code.includes('cancelled'))msg='Account deletion cancelled during verification';
    if(code.includes('requires-recent-login'))msg='Sign out, sign back in, then try account deletion again';
    if(code.includes('permission-denied'))msg='Rider Hub could not delete synced data. Deploy the updated Firestore rules, then try again.';
    window.toast?.(msg);
    if(btn){btn.disabled=false;btn.textContent='Delete account permanently'}
  }
};
