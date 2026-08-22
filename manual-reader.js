/* Rider Hub owner's-manual text extraction.
   Uses PDF.js only when a user explicitly asks Rider Hub to process a PDF.
   Parsing is conservative: only values with recognisable labels/patterns are applied. */
(()=>{
'use strict';
const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDFJS_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

const clean=s=>String(s||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\s*\n\s*/g,' ').trim();
const kmValues=s=>[...String(s||'').matchAll(/\b(\d{3,6})\s*km\b/gi)].map(m=>Number(m[1])).filter(n=>n>=200&&n<=100000);
function around(text,re,radius=420){
  const m=re.exec(text); if(!m)return '';
  return text.slice(Math.max(0,m.index-radius),Math.min(text.length,m.index+m[0].length+radius));
}
function firstPageWindow(pages,re,radius=420){
  for(let i=0;i<pages.length;i++){
    re.lastIndex=0;
    const w=around(pages[i],re,radius);
    if(w)return {page:i+1,text:w};
  }
  return null;
}
function source(value,page,confidence='manual'){return value?{value,page,confidence}:null}
function parseManualTextPages(inputPages){
  const pages=(inputPages||[]).map(clean);
  const out={status:'processed',pageCount:pages.length,fields:{},serviceMilestones:[],maintenance:[],warnings:[]};

  let hit=firstPageWindow(pages,/\b(?:engine\s+displacement|displacement|engine)\b/i,520);
  if(hit){
    const m=hit.text.match(/\b(\d{2,4}(?:\.\d+)?)\s*(?:cc|cm3|cm³)\b/i);
    if(m&&Number(m[1])>=40&&Number(m[1])<=2500)out.fields.engine=source(`${m[1]} cc`,hit.page);
  }

  hit=firstPageWindow(pages,/\b(?:fuel\s+tank(?:\s+capacity)?|tank\s+capacity)\b/i,420);
  if(hit){
    const m=hit.text.match(/\b(\d{1,2}(?:\.\d+)?)\s*(?:l|litre|litres|liter|liters)\b/i);
    if(m&&Number(m[1])>=2&&Number(m[1])<=45)out.fields.fuelTank=source(`${m[1]} L`,hit.page);
  }

  hit=firstPageWindow(pages,/\b(?:transmission|gearbox|constant\s+mesh)\b/i,420);
  if(hit){
    const m=hit.text.match(/\b([4-8])[\s-]*speed\b/i);
    if(m)out.fields.transmission=source(`${m[1]}-speed`,hit.page);
  }

  hit=firstPageWindow(pages,/\b(?:tyre|tire)(?:s|\s+size)?\b/i,650);
  if(hit){
    const matches=[...hit.text.matchAll(/\b(\d{2,3}\/\d{2,3}(?:\s*[A-Z])?[- ](?:R\s*)?\d{2})\b/gi)].map(m=>m[1].replace(/\s+/g,' '));
    const uniq=[...new Set(matches)];
    if(uniq.length>=2)out.fields.tyres=source(`${uniq[0]} front · ${uniq[1]} rear`,hit.page);
    else if(uniq.length===1)out.fields.tyres=source(uniq[0],hit.page);
  }

  const front=firstPageWindow(pages,/\bfront\s+brake\b/i,360);
  const rear=firstPageWindow(pages,/\brear\s+brake\b/i,360);
  const brakeParts=[];
  let brakePage=0;
  if(front){
    brakePage=front.page;
    const m=front.text.match(/\b(\d{2,3})\s*mm\b.{0,70}\b(disc|drum)\b/i) || front.text.match(/\b(disc|drum)\b.{0,70}\b(\d{2,3})\s*mm\b/i);
    if(m){
      const mm=/^\d/.test(m[1])?m[1]:m[2], kind=/^\d/.test(m[1])?m[2]:m[1];
      brakeParts.push(`${mm} mm front ${String(kind).toLowerCase()}`);
    }
  }
  if(rear){
    brakePage=brakePage||rear.page;
    const m=rear.text.match(/\b(\d{2,3})\s*mm\b.{0,70}\b(disc|drum)\b/i) || rear.text.match(/\b(disc|drum)\b.{0,70}\b(\d{2,3})\s*mm\b/i);
    if(m){
      const mm=/^\d/.test(m[1])?m[1]:m[2], kind=/^\d/.test(m[1])?m[2]:m[1];
      brakeParts.push(`${mm} mm rear ${String(kind).toLowerCase()}`);
    }
  }
  const abs=firstPageWindow(pages,/\b(?:dual[\s-]*channel|single[\s-]*channel)?\s*abs\b/i,260);
  if(abs){
    brakePage=brakePage||abs.page;
    const a=abs.text.match(/\b(dual[\s-]*channel|single[\s-]*channel)\s*abs\b/i);
    brakeParts.push(a?`${a[1].replace(/\s+/g,' ')} ABS`:'ABS');
  }
  if(brakeParts.length)out.fields.braking=source([...new Set(brakeParts)].join(' · '),brakePage);

  hit=firstPageWindow(pages,/\b(?:drive\s+chain|chain\s+(?:clean|cleaning|lubricat|maintenance))\b/i,700);
  if(hit){
    const vals=kmValues(hit.text).filter(n=>n<=5000);
    if(vals.length){
      const interval=Math.min(...vals);
      if(interval>=250)out.fields.chainIntervalKm=source(interval,hit.page);
    }
  }

  for(let i=0;i<pages.length;i++){
    if(!/\b(?:periodic\s+maintenance|service\s+schedule|maintenance\s+schedule|scheduled\s+service)\b/i.test(pages[i]))continue;
    const vals=kmValues(pages[i]);
    if(vals.length>=2){
      out.serviceMilestones=[...new Set([...out.serviceMilestones,...vals])].sort((a,b)=>a-b).slice(0,20);
      out.maintenance.push({page:i+1,text:'Periodic maintenance/service schedule found in the owner’s manual.'});
    }
  }

  if(out.fields.chainIntervalKm)out.maintenance.push({page:out.fields.chainIntervalKm.page,text:`Drive-chain care interval found: ${out.fields.chainIntervalKm.value.toLocaleString('en-IN')} km.`});
  if(!Object.keys(out.fields).length&&!out.serviceMilestones.length)out.warnings.push('No high-confidence motorcycle specifications were found automatically.');
  return out;
}

async function processPdf(file){
  if(!file)throw new Error('Choose an owner’s manual PDF');
  if(file.type&&file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name||''))throw new Error('Owner’s manual must be a PDF');
  if(Number(file.size||0)>50*1024*1024)throw new Error('Owner’s manual is too large. Use a PDF under 50 MB.');
  const pdfjs=await import(PDFJS);
  pdfjs.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
  const data=await file.arrayBuffer();
  const pdf=await pdfjs.getDocument({data}).promise;
  const limit=Math.min(pdf.numPages,260),pages=[];
  let chars=0;
  for(let n=1;n<=limit;n++){
    const page=await pdf.getPage(n);
    const content=await page.getTextContent();
    const text=content.items.map(x=>x.str||'').join(' ');
    pages.push(text);
    chars+=text.length;
    if(chars>2_500_000)break;
  }
  const searchable=pages.join(' ').replace(/\s+/g,' ').trim();
  if(searchable.length<180)return {status:'scanned',pageCount:pdf.numPages,fields:{},serviceMilestones:[],maintenance:[],warnings:['This PDF appears to be scanned or does not contain enough searchable text. The manual is still saved, but Rider Hub did not guess specifications from it.']};
  const parsed=parseManualTextPages(pages);
  parsed.pageCount=pdf.numPages;
  return parsed;
}

window.riderHubParseManualTextPages=parseManualTextPages;
window.riderHubProcessOwnerManual=processPdf;
window.RIDER_HUB_PDFJS_VERSION='4.10.38';
})();
