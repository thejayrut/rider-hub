/* Temporary GitHub Pages local preview helper.
   The production Rider Hub account flow belongs on Firebase Hosting. This file
   only lets the GitHub Pages fallback open the local-first app without cloud auth. */
(()=>{
  if(location.hostname!=='thejayrut.github.io')return;

  function hideShell(){
    const shell=document.querySelector('#rhAuthShell');
    if(shell)shell.classList.remove('active');
  }

  function addPreviewButton(){
    const stage=document.querySelector('#rhAuthStage');
    if(!stage||stage.querySelector('#rhLocalPreview'))return;
    const google=[...stage.querySelectorAll('button')].find(b=>/continue with google/i.test(b.textContent||''));
    if(!google)return;

    const btn=document.createElement('button');
    btn.id='rhLocalPreview';
    btn.className='rh-auth-button full';
    btn.textContent='Preview locally without sign-in';
    btn.style.marginTop='8px';
    btn.onclick=()=>{
      localStorage.removeItem('riderhub_auth_session_v1');
      hideShell();
      setTimeout(hideShell,300);
      setTimeout(hideShell,900);
      if(typeof window.toast==='function')window.toast('Local preview · cloud sync is off');
    };
    google.insertAdjacentElement('afterend',btn);

    const note=stage.querySelector('#rhAuthNote');
    if(note)note.textContent='Google mobile sign-in will be enabled on Firebase Hosting. Local preview keeps data on this device only.';
  }

  new MutationObserver(addPreviewButton).observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(addPreviewButton,200);
  setTimeout(addPreviewButton,800);
})();
