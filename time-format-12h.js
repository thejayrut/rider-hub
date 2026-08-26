(()=>{
'use strict';

function formatTime12(text){
  return String(text??'').replace(/(^|[^\d])([01]?\d|2[0-3]):([0-5]\d)(?!\s*(?:AM|PM)\b)/gi,(full,prefix,h,m)=>{
    const hour=Number(h);
    const suffix=hour>=12?'PM':'AM';
    const display=hour%12||12;
    return `${prefix}${display}:${m} ${suffix}`;
  });
}

function formatNode(node){
  if(!node)return;
  if(node.nodeType===Node.TEXT_NODE){
    const next=formatTime12(node.nodeValue);
    if(next!==node.nodeValue)node.nodeValue=next;
    return;
  }
  if(node.nodeType!==Node.ELEMENT_NODE&&node.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
  const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
  let textNode;
  while((textNode=walker.nextNode())){
    const next=formatTime12(textNode.nodeValue);
    if(next!==textNode.nodeValue)textNode.nodeValue=next;
  }
}

window.riderHubFormatTime12=formatTime12;

function formatVisibleApp(){
  for(const selector of ['#rides','#rideMode','#modalWrap'])formatNode(document.querySelector(selector));
}

const observer=new MutationObserver(mutations=>{
  for(const mutation of mutations){
    if(mutation.type==='characterData')formatNode(mutation.target);
    for(const node of mutation.addedNodes||[])formatNode(node);
  }
});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
  formatVisibleApp();
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
},{once:true});
else{
  formatVisibleApp();
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
}
})();
