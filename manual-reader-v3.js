/* Rider Hub owner-manual parser v3.
   Adds front/rear tyre sizes plus solo and rider+pillion pressures when the manual
   actually contains them. Page/source metadata stays internal. */
(()=>{
'use strict';
const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDFJS_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
const oldProcess=window.riderHubProcessOwnerManual;
const clean=s=>String(s||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\s*\n\s*/g,' ').trim();
function tyreSize(text,pos){
  const p=pos==='front'?'front':'rear';
  const re=new RegExp(`${p}\\s+(?:tyre|tire)(?:\\s+size)?[^0-9]{0,120}(\\d{2,3})\\s*\\/\\s*(\\d{2,3})\\s*(?:[-–]\\s*)?(R\\s*)?(\\d{2})`,'i');
  const m=re.exec(text);if(!m)return'';
  return `${m[1]}/${m[2]}${m[3]?' R ':' - '}${m[4]}`.replace(/\s+/g,' ').trim();
}
function pressureValue(segment,pos){
  const unit='(?:psi|bar|kpa|kg\\s*\\/\\s*cm(?:2|²))';
  const p=pos==='front'?'front':'rear';
  const a=new RegExp(`${p}[^0-9]{0,90}(\\d{1,3}(?:\\.\\d+)?)\\s*(${unit})`,'i').exec(segment);
  const b=new RegExp(`(\\d{1,3}(?:\\.\\d+)?)\\s*(${unit})[^A-Za-z0-9]{0,70}${p}`,'i').exec(segment);
  const m=a||b;if(!m)return'';
  const n=Number(m[1]);if(!Number.isFinite(n)||n<=0)return'';
  return `${m[1]} ${String(m[2]).replace(/\s+/g,' ')}`;
}
function pressurePair(segment){return{front:pressureValue(segment,'front'),rear:pressureValue(segment,'rear')}}
function pagePressure(page){
  const t=clean(page),low=t.toLowerCase();
  if(!/(tyre|tire).{0,80}pressure|pressure.{0,80}(tyre|tire)/i.test(t))return null;
  const blocks=[];
  const labels=[
    ['pillion',/(?:with\s+(?:a\s+)?pillion|rider\s*(?:and|\+)\s*pillion|two\s+persons?|2\s+persons?|fully\s+loaded|laden|maximum\s+load)/ig],
    ['solo',/(?:without\s+pillion|rider\s+only|one\s+person|1\s+person|solo|unladen)/ig]
  ];
  for(const [kind,re] of labels){
    let m;while((m=re.exec(t))){blocks.push({kind,start:Math.max(0,m.index-320),end:Math.min(t.length,m.index+520)})}
  }
  const out={solo:{front:'',rear:''},pillion:{front:'',rear:''}};
  for(const b of blocks){const pair=pressurePair(t.slice(b.start,b.end));if(pair.front)out[b.kind].front=pair.front;if(pair.rear)out[b.kind].rear=pair.rear}
  if(!out.solo.front&&!out.solo.rear&&!out.pillion.front&&!out.pillion.rear){
    const pair=pressurePair(t);out.solo=pair;
  }
  const has=Object.values(out.solo).some(Boolean)||Object.values(out.pillion).some(Boolean);
  return has?out:null;
}
async function extract(file){
  const pdfjs=await import(PDFJS);pdfjs.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
  const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
  let front='',rear='',pressure=null,pressurePage=0,sizePage=0;
  for(let n=1;n<=Math.min(pdf.numPages,300);n++){
    const page=await pdf.getPage(n),content=await page.getTextContent(),text=content.items.map(x=>x.str||'').join(' ');
    if(!front){front=tyreSize(text,'front');if(front)sizePage=n}
    if(!rear){rear=tyreSize(text,'rear');if(rear)sizePage=sizePage||n}
    if(!pressure){const p=pagePressure(text);if(p){pressure=p;pressurePage=n}}
    if(front&&rear&&pressure)break;
  }
  return{front,rear,sizePage,pressure,pressurePage};
}
window.riderHubParseTyrePressurePageV3=pagePressure;
window.riderHubProcessOwnerManual=async function(file){
  const base=typeof oldProcess==='function'?await oldProcess(file):{status:'saved',fields:{},extraSpecs:[],serviceMilestones:[],maintenance:[],warnings:[]};
  try{
    const x=await extract(file);
    if(x.front||x.rear){
      base.tyreSizes={front:x.front,rear:x.rear,page:x.sizePage};
      if(!base.fields)base.fields={};
      base.fields.tyres={value:[x.front&&`${x.front} front`,x.rear&&`${x.rear} rear`].filter(Boolean).join(' · '),page:x.sizePage,confidence:'manual'};
    }
    if(x.pressure)base.tyrePressure={...x.pressure,page:x.pressurePage};
    if(window.state?.bike){
      if(base.tyreSizes)window.state.bike.manualTyreSizes=base.tyreSizes;
      if(base.tyrePressure)window.state.bike.manualTyrePressure=base.tyrePressure;
      window.state.bike.manualParserVersion=3;
    }
  }catch(e){console.warn('Rider Hub tyre-pressure extraction skipped',e)}
  window.RIDER_HUB_LAST_MANUAL_RESULT=base;
  return base;
};
window.RIDER_HUB_PDF_READER_V3=true;
})();
