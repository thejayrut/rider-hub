/* Rider Hub owner-manual parser v2.
   Extracts only high-confidence technical/maintenance values and preserves source
   pages internally without cluttering the normal Bike information UI. */
(()=>{
'use strict';
const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDFJS_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
const clean=s=>String(s||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\s*\n\s*/g,' ').trim();
const source=(value,page,confidence='manual')=>value?{value,page,confidence}:null;
const kmValues=s=>[...String(s||'').matchAll(/\b(\d{3,6})\s*(?:km|kms|kilomet(?:er|re)s?)\b/gi)].map(m=>Number(m[1])).filter(n=>n>=200&&n<=100000);
function win(page,re,radius=650){const m=re.exec(page);if(!m)return'';return page.slice(Math.max(0,m.index-radius),Math.min(page.length,m.index+m[0].length+radius))}
function first(pages,re,radius=650){for(let i=0;i<pages.length;i++){re.lastIndex=0;const text=win(pages[i],re,radius);if(text)return{page:i+1,text}}return null}
function labelledNumber(pages,label,unit,range=[0,9999],digits='\\d{1,4}(?:\\.\\d+)?'){
  for(let i=0;i<pages.length;i++){
    const p=pages[i];
    const a=new RegExp(`(?:${label})[^0-9]{0,90}(${digits})\\s*(?:${unit})\\b`,'i').exec(p);
    const b=new RegExp(`(${digits})\\s*(?:${unit})\\b[^A-Za-z0-9]{0,40}(?:${label})`,'i').exec(p);
    const m=a||b;if(!m)continue;const n=Number(m[1]);if(n>=range[0]&&n<=range[1])return{value:n,page:i+1};
  }
  return null;
}
function addExtra(out,label,value,page,key=''){
  if(value==null||value==='')return;
  const k=(key||label).toLowerCase();
  if(out.extraSpecs.some(x=>(x.key||x.label).toLowerCase()===k))return;
  out.extraSpecs.push({key:key||label,label,value:String(value),page:Number(page||0),confidence:'manual'});
}
function tyreValue(text){
  const re=/\b(\d{2,3})\s*\/\s*(\d{2,3})\s*(?:[-–]\s*)?(R\s*)?(\d{2})\b/ig;
  return [...text.matchAll(re)].map(m=>`${m[1]}/${m[2]}${m[3]?' R ': ' - '}${m[4]}`.replace(/\s+/g,' ').trim());
}
function parsePages(inputPages){
  const pages=(inputPages||[]).map(clean);
  const out={status:'processed',pageCount:pages.length,fields:{},extraSpecs:[],serviceMilestones:[],maintenance:[],warnings:[]};

  let hit=first(pages,/\b(?:engine\s+displacement|cubic\s+capacity|displacement)\b/i,700);
  if(!hit)hit=first(pages,/\bengine\b/i,520);
  if(hit){const m=hit.text.match(/\b(\d{2,4}(?:\.\d+)?)\s*(?:cc|cm3|cm³)\b/i);if(m&&Number(m[1])>=40&&Number(m[1])<=2500)out.fields.engine=source(`${m[1]} cc`,hit.page)}

  let n=labelledNumber(pages,'fuel\\s*(?:tank)?\\s*capacity|fuel\\s*tank(?:\\s+capacity)?|tank\\s+capacity','l|litre|litres|liter|liters',[2,45],'\\d{1,2}(?:\\.\\d+)?');
  if(n)out.fields.fuelTank=source(`${n.value} L`,n.page);
  if(!out.fields.fuelTank){
    hit=first(pages,/\b(?:fuel\s+tank|fuel\s+capacity)\b/i,900);
    if(hit){const m=hit.text.match(/(?:fuel\s+tank(?:\s+capacity)?|fuel\s+capacity)[^0-9]{0,120}(\d{1,2}(?:\.\d+)?)\s*(?:l|litre|litres|liter|liters)\b/i);if(m&&Number(m[1])>=2&&Number(m[1])<=45)out.fields.fuelTank=source(`${m[1]} L`,hit.page)}
  }

  hit=first(pages,/\b(?:transmission|gearbox|constant\s+mesh|number\s+of\s+gears)\b/i,750);
  if(hit){
    const m=hit.text.match(/\b([4-8])\s*(?:[- ]?speed|forward\s+gears?)\b/i)||hit.text.match(/\b(?:number\s+of\s+gears|gears)\s*[:\-]?\s*([4-8])\b/i);
    if(m)out.fields.transmission=source(`${m[1]}-speed`,hit.page);
  }

  let fVal='',rVal='',tyrePage=0;
  const tyrePattern='(\\d{2,3})\\s*\\/\\s*(\\d{2,3})\\s*(?:[-–]\\s*)?(R\\s*)?(\\d{2})';
  const fmtTyre=m=>m?`${m[1]}/${m[2]}${m[3]?' R ': ' - '}${m[4]}`.replace(/\s+/g,' ').trim():'';
  for(let i=0;i<pages.length;i++){
    if(!fVal){const m=new RegExp(`front\\s+(?:tyre|tire)(?:\\s+size)?[^0-9]{0,100}${tyrePattern}`,'i').exec(pages[i]);if(m){fVal=fmtTyre(m);tyrePage=i+1}}
    if(!rVal){const m=new RegExp(`rear\\s+(?:tyre|tire)(?:\\s+size)?[^0-9]{0,100}${tyrePattern}`,'i').exec(pages[i]);if(m){rVal=fmtTyre(m);tyrePage=tyrePage||i+1}}
  }
  if(fVal||rVal)out.fields.tyres=source([fVal&&`${fVal} front`,rVal&&`${rVal} rear`].filter(Boolean).join(' · '),tyrePage);
  if(!out.fields.tyres){
    hit=first(pages,/\b(?:tyre|tire)\s*(?:size|specification|specifications)?\b/i,1000);
    if(hit){const vals=[...new Set(tyreValue(hit.text))];if(vals.length)out.fields.tyres=source(vals.slice(0,2).map((x,i)=>`${x}${i===0?' front':i===1?' rear':''}`).join(' · '),hit.page)}
  }

  let brakePage=0;const brake=[];
  for(let i=0;i<pages.length;i++){
    for(const pos of ['front','rear']){
      if(brake.some(x=>x.includes(` ${pos} `)))continue;
      const m=new RegExp(`${pos}\\s+brake[^0-9]{0,100}(\\d{2,3})\\s*mm[^A-Za-z]{0,40}(disc|disk|drum)`,'i').exec(pages[i])||new RegExp(`${pos}\\s+brake[^A-Za-z]{0,100}(disc|disk|drum)[^0-9]{0,40}(\\d{2,3})\\s*mm`,'i').exec(pages[i]);
      if(m){const mm=/^\d/.test(m[1])?m[1]:m[2],kind=/^\d/.test(m[1])?m[2]:m[1];brake.push(`${mm} mm ${pos} ${String(kind).replace('disk','disc').toLowerCase()}`);brakePage=brakePage||i+1}
    }
  }
  const abs=first(pages,/\b(?:dual[\s-]*channel|single[\s-]*channel)?\s*abs\b/i,350);if(abs){brakePage=brakePage||abs.page;const a=abs.text.match(/\b(dual[\s-]*channel|single[\s-]*channel)\s*abs\b/i);brake.push(a?`${a[1].replace(/\s+/g,' ')} ABS`:'ABS')}
  if(brake.length)out.fields.braking=source([...new Set(brake)].join(' · '),brakePage);

  const extras=[
    ['Engine oil capacity','engineOilCapacity','engine\\s+oil(?:\\s+capacity|\\s+quantity)?','l|litre|litres|liter|liters',[0.5,8]],
    ['Coolant capacity','coolantCapacity','coolant(?:\\s+capacity|\\s+quantity)?','l|litre|litres|liter|liters',[0.2,10]],
    ['Ground clearance','groundClearance','ground\\s+clearance','mm',[80,400]],
    ['Seat height','seatHeight','seat\\s+height','mm',[550,1100]],
    ['Wheelbase','wheelbase','wheel\\s*base','mm',[900,1900]],
    ['Kerb weight','kerbWeight','(?:kerb|curb)\\s+(?:weight|mass)','kg|kilograms?',[60,500]],
    ['Battery','battery','battery(?:\\s+rating|\\s+capacity)?','v|volt|volts',[6,24]]
  ];
  for(const [label,key,re,unit,range] of extras){const v=labelledNumber(pages,re,unit,range);if(v)addExtra(out,label,`${v.value} ${unit.split('|')[0].replace(/\\/g,'')}`,v.page,key)}

  const suspensionSpecs=[['Front suspension','frontSuspension',/\bfront\s+suspension\b/i],['Rear suspension','rearSuspension',/\brear\s+suspension\b/i]];
  for(const [label,key,re] of suspensionSpecs){const h=first(pages,re,260);if(!h)continue;const m=h.text.match(new RegExp(`${re.source}[^.]{0,140}`,'i'));if(m){const value=m[0].replace(re,'').replace(/^\s*[:\-–]\s*/,'').trim();if(value.length>=4&&value.length<=145)addExtra(out,label,value,h.page,key)}}

  hit=first(pages,/\b(?:drive\s+chain|chain\s+(?:clean|cleaning|lubricat|maintenance|slack))\b/i,900);
  if(hit){const vals=kmValues(hit.text).filter(v=>v<=5000);if(vals.length){const interval=Math.min(...vals);if(interval>=250)out.fields.chainIntervalKm=source(interval,hit.page)}}

  for(let i=0;i<pages.length;i++){
    if(!/\b(?:periodic\s+maintenance|service\s+schedule|maintenance\s+schedule|scheduled\s+service|maintenance\s+chart)\b/i.test(pages[i]))continue;
    const vals=kmValues(pages[i]);
    if(vals.length){out.serviceMilestones=[...new Set([...out.serviceMilestones,...vals])].sort((a,b)=>a-b).slice(0,30);out.maintenance.push({page:i+1,text:'Periodic maintenance/service schedule found in the owner’s manual.'})}
  }
  if(out.fields.chainIntervalKm)out.maintenance.push({page:out.fields.chainIntervalKm.page,text:`Drive-chain care interval: ${Number(out.fields.chainIntervalKm.value).toLocaleString('en-IN')} km.`});
  if(!Object.keys(out.fields).length&&!out.extraSpecs.length&&!out.serviceMilestones.length)out.warnings.push('No high-confidence motorcycle specifications were found automatically.');
  return out;
}

async function processPdf(file){
  if(!file)throw new Error('Choose an owner’s manual PDF');
  if(file.type&&file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name||''))throw new Error('Owner’s manual must be a PDF');
  if(Number(file.size||0)>50*1024*1024)throw new Error('Owner’s manual is too large. Use a PDF under 50 MB.');
  const pdfjs=await import(PDFJS);pdfjs.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
  const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;const pages=[];let chars=0;
  for(let n=1;n<=Math.min(pdf.numPages,300);n++){
    const page=await pdf.getPage(n),content=await page.getTextContent();
    const text=content.items.map(x=>x.str||'').join(' ');pages.push(text);chars+=text.length;if(chars>3_000_000)break;
  }
  if(pages.join(' ').replace(/\s+/g,' ').trim().length<180)return{status:'scanned',pageCount:pdf.numPages,fields:{},extraSpecs:[],serviceMilestones:[],maintenance:[],warnings:['This PDF appears to be scanned or does not contain enough searchable text. The manual is still saved, but Rider Hub did not guess specifications from it.']};
  const out=parsePages(pages);out.pageCount=pdf.numPages;return out;
}

const oldProcess=window.riderHubProcessOwnerManual;
window.riderHubParseManualTextPagesV2=parsePages;
window.riderHubProcessOwnerManual=async function(file){
  const result=await processPdf(file);
  if(window.state?.bike){window.state.bike.manualExtraSpecs=Array.isArray(result.extraSpecs)?result.extraSpecs:[];window.state.bike.manualParserVersion=2}
  window.RIDER_HUB_LAST_MANUAL_RESULT=result;
  return result;
};
window.RIDER_HUB_PDF_READER_V2=true;
window.riderHubLegacyManualProcessor=oldProcess;
})();
