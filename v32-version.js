/* Rider Hub v32 About/version label. */
(()=>{
'use strict';
const CREATOR='Jayrut Gajjar',EMAIL='jayrut.raw@gmail.com',VERSION='v32';
window.openAboutRiderHub=function(){
  window.openModal?.(`<div class="modalhead"><div><div class="kicker">RIDER HUB</div><h3>About Rider Hub</h3><p class="caption">Personal motorcycle OS · ${VERSION}</p></div><button class="round" onclick="closeModal()">×</button></div><div class="rh-about-maker"><div class="brandmark">RH</div><div><span>MADE BY</span><strong>${CREATOR}</strong></div></div><div class="routecard"><strong>Why Rider Hub exists</strong><p>Rider Hub was made to keep the motorcycle, maintenance, documents, gear and the actual ride-day workflow in one focused place — so riders spend less time hunting through notes, PDFs and separate apps when it matters.</p></div><div class="routecard"><strong>Private files</strong><p>When you connect Google Drive, private documents and ride/manual PDFs can be backed up to your own Rider Hub folder in your Google Drive.</p></div><div class="rh-social-row"><button onclick="openInstagramApp()" aria-label="Open Instagram app"><span class="rh-social-icon">◎</span><strong>Instagram</strong></button><button onclick="openYouTubeApp()" aria-label="Open YouTube app"><span class="rh-social-icon">▶</span><strong>YouTube</strong></button><button onclick="openFeedbackEmail()" aria-label="Email feedback"><span class="rh-social-icon">✉</span><strong>Feedback</strong></button></div><div class="caption rh-about-email">Feedback: ${EMAIL}</div>`);
};
function patchMoreVersion(){
  const root=document.querySelector('#more');if(!root)return;
  root.querySelectorAll('.more-card small').forEach(x=>{if(/Made by Jayrut Gajjar/i.test(x.textContent||''))x.textContent=`Made by ${CREATOR} · ${VERSION}`});
}
const prevMore=window.renderMore;
if(typeof prevMore==='function')window.renderMore=function(){const out=prevMore.apply(this,arguments);patchMoreVersion();return out};
const prevRender=window.render;
if(typeof prevRender==='function')window.render=function(){const out=prevRender.apply(this,arguments);patchMoreVersion();return out};
setTimeout(patchMoreVersion,250);
})();
