/* Rider Hub OAuth bootstrap + Connect button fix. The OAuth Client ID is public; no client secret is stored here. */
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
    return originalRequest(syncAfter);
  };
}

// Keep the client field prefilled if the cloud modal is opened before another render pass.
document.addEventListener('click',()=>{
  setTimeout(()=>{
    const input=document.querySelector('#rhGoogleClientId');
    if(input&&!input.value)input.value=readCfg().clientId||DEFAULT_CLIENT_ID;
  },0);
},true);
})();
