/* Rider Hub OAuth bootstrap + cloud status UX fixes. The OAuth Client ID is public; no client secret is stored here. */
(()=>{
const CFG='riderhub_cloud_sync_v1';
const DEFAULT_CLIENT_ID='819467937839-rpdc20lrpgtmsi4ijtisppg1rr1dsq8t.apps.googleusercontent.com';

function readCfg(){try{return JSON.parse(localStorage.getItem(CFG)||'{}')}catch{return{}}}
function writeCfg(patch){localStorage.setItem(CFG,JSON.stringify({...readCfg(),...patch}))}

// A Web OAuth Client ID is a public browser identifier, so keep Rider Hub's ID available on every device.
if(!readCfg().clientId)writeCfg({clientId:DEFAULT_CLIENT_ID});

// Preload Google Identity Services before the user taps Connect so mobile browsers do not block the OAuth popup.
if(!window.google?.accounts?.oauth2&&!document.querySelector('script[data-rh-gis]')){
  const s=document.createElement('script');
  s.src='https://accounts.google.com/gsi/client';
  s.async=true;
  s.defer=true;
  s.dataset.rhGis='1';
  document.head.appendChild(s);
}

// Use rider-friendly status wording. A linked account stays linked even when the short-lived OAuth token expires.
window.cloudSyncLabel=function(){
  const c=typeof window.riderHubCloudConfig==='function'?window.riderHubCloudConfig():readCfg();
  if(typeof window.cloudSyncConnected==='function'&&window.cloudSyncConnected())return 'Connected';
  if(c.email&&c.clientId)return 'Google linked · Ready to sync';
  if(c.clientId)return 'Ready to connect';
  return 'Not connected';
};

function refreshCloudUi(){
  const c=typeof window.riderHubCloudConfig==='function'?window.riderHubCloudConfig():readCfg();
  const label=window.cloudSyncLabel();
  document.querySelectorAll('#modal .routecard').forEach(card=>{
    const heading=card.querySelector('strong')?.textContent?.trim();
    if(heading==='Cloud sync'||heading==='Status'){
      const p=card.querySelector('p');
      if(p)p.textContent=label+(c.lastSync?' · Last sync '+new Date(c.lastSync).toLocaleString():'');
    }
  });
  if(typeof window.renderMore==='function')window.renderMore();
}

function watchConnection(){
  let tries=0;
  const timer=setInterval(()=>{
    refreshCloudUi();
    tries++;
    if((typeof window.cloudSyncConnected==='function'&&window.cloudSyncConnected())||tries>=30){
      clearInterval(timer);
      setTimeout(refreshCloudUi,1200);
    }
  },400);
}

const originalRequest=window.requestDriveAccess;
if(typeof originalRequest==='function'){
  window.requestDriveAccess=function(syncAfter=false){
    const input=document.querySelector('#rhGoogleClientId');
    const typed=input?.value?.trim();
    if(typed)writeCfg({clientId:typed});
    else if(!readCfg().clientId)writeCfg({clientId:DEFAULT_CLIENT_ID});

    if(!window.google?.accounts?.oauth2){
      if(typeof toast==='function')toast('Google sign-in is loading. Tap Connect Google again in a moment.');
      return;
    }
    const out=originalRequest(syncAfter);
    watchConnection();
    return out;
  };
}

const originalSyncNow=window.riderHubSyncNow;
if(typeof originalSyncNow==='function'){
  window.riderHubSyncNow=function(){
    const out=originalSyncNow.apply(this,arguments);
    watchConnection();
    setTimeout(refreshCloudUi,1800);
    return out;
  };
}

// Keep the client field prefilled and keep any open account status current.
document.addEventListener('click',()=>{
  setTimeout(()=>{
    const input=document.querySelector('#rhGoogleClientId');
    if(input&&!input.value)input.value=readCfg().clientId||DEFAULT_CLIENT_ID;
    refreshCloudUi();
  },0);
},true);

setTimeout(refreshCloudUi,250);
})();
