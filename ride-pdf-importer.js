/* Rider Hub ride-plan PDF importer.
   Reads searchable itinerary PDFs locally with PDF.js and builds a reviewable
   ride draft. Missing details stay editable instead of being invented. */
(()=>{
'use strict';
const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDFJS_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
const clean=s=>String(s||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim();
const dateRe=/\b(?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\b/ig;
const timeRe=/^(?:[-•*]\s*)?(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)[\s:–—-]+(.+)$/;
function unique(a){return [...new Set(a.filter(Boolean))]}
function routeFrom(line){
  const s=clean(line);if(!s)return'';
  if(/[→➜➡]/.test(s)){const p=s.split(/[→➜➡]/).map(clean).filter(Boolean);if(p.length>=2)return p.join(' → ')}
  const m=s.match(/\bfrom\s+(.{2,70}?)\s+to\s+(.{2,70})(?:$|[.;])/i);return m?`${clean(m[1])} → ${clean(m[2])}`:'';
}
function newDay(n=1){return{day:n,date:'',title:`Day ${n}`,from:'',to:'',tasks:[],route:'',notes:[]}}
function parseRideText(text,{fileName=''}={}){
  const lines=String(text||'').split(/\r?\n/).map(clean).filter(Boolean).filter(x=>x.length<500);
  const warnings=[];let title='';
  for(const line of lines.slice(0,20)){
    if(/^(itinerary|trip\s+plan|tour\s+plan|ride\s+plan|travel\s+plan)$/i.test(line))continue;
    if(/day\s*\d+/i.test(line)||dateRe.test(line)){dateRe.lastIndex=0;continue}dateRe.lastIndex=0;
    if(line.length>=4&&line.length<=100){title=line;break}
  }
  if(!title)title=fileName?String(fileName).replace(/\.pdf$/i,'').replace(/[_-]+/g,' '):'Imported ride';
  const dates=[];for(const line of lines){for(const m of line.matchAll(dateRe))dates.push(m[0]);dateRe.lastIndex=0}
  const routes=unique(lines.map(routeFrom));
  const lodging=lines.filter(x=>/\b(hotel|stay|check[ -]?in|check[ -]?out|booking|resort|hostel|homestay|guest\s*house)\b/i.test(x)).slice(0,20);
  const emergency=lines.filter(x=>/\b(emergency|hospital|ambulance|sos|contact)\b/i.test(x)).slice(0,10);
  const days=[];let current=null;
  for(const line of lines){
    if(line===title)continue;
    const onlyDate=line.match(dateRe);dateRe.lastIndex=0;
    if(onlyDate&&clean(line.replace(onlyDate[0],''))===''){if(current&&!current.date)current.date=onlyDate[0];continue}
    const dh=line.match(/^\s*day\s*(\d{1,2})(?:\s*[:.\-–—]\s*(.*))?$/i)||line.match(/^\s*day\s*(\d{1,2})\b\s*(.*)$/i);
    if(dh){current=newDay(Number(dh[1]));if(clean(dh[2]))current.title=clean(dh[2]);days.push(current);continue}
    const tm=line.match(timeRe),route=routeFrom(line),bullet=/^[-•*]\s+/.test(line),action=/\b(?:ride|depart|departure|arrive|arrival|breakfast|lunch|dinner|fuel|petrol|stop|visit|check[ -]?in|check[ -]?out|start|meet)\b/i.test(line);
    if(!current){if(!(tm||route||bullet||action))continue;current=newDay(1);days.push(current)}
    const d=line.match(dateRe);dateRe.lastIndex=0;if(d&&!current.date)current.date=d[0];
    if(route&&!current.route){current.route=route;const p=route.split(' → ');current.from=p[0]||'';current.to=p[p.length-1]||''}
    if(tm){current.tasks.push({time:clean(tm[1]).toUpperCase(),title:clean(tm[2]),note:'',status:'upcoming',delay:0});continue}
    if(bullet){const t=clean(line.replace(/^[-•*]\s+/,''));if(t)current.tasks.push({time:'',title:t,note:'',status:'upcoming',delay:0});continue}
    if(action&&line.length<=180){
      if(!current.tasks.some(t=>t.title===line))current.tasks.push({time:'',title:line,note:'',status:'upcoming',delay:0});
    }
  }
  const meaningful=days.filter((d,i)=>d.tasks.length||d.route||d.date||i===0);
  const finalDays=meaningful.length?meaningful:[newDay(1)];
  if(finalDays.length===1&&finalDays[0].tasks.length===0)warnings.push('No timed itinerary items were detected. Add tasks during review or inside Ride Mode.');
  if(!routes.length)warnings.push('No clear route line was detected. Add the route during review.');
  const route=routes[0]||finalDays.find(d=>d.route)?.route||'';
  return{
    name:title,
    start:dates[0]||finalDays.find(d=>d.date)?.date||'',
    end:dates.length>1?dates[dates.length-1]:(dates[0]||''),
    route,
    days:finalDays,
    lodging,
    emergency,
    source:'pdf',
    sourceFileName:fileName||'',
    warnings,
    extractedAt:new Date().toISOString()
  };
}
async function processPdf(file){
  if(!file)throw new Error('Choose a ride-plan PDF');
  if(file.type&&file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name||''))throw new Error('Ride plan must be a PDF');
  if(Number(file.size||0)>50*1024*1024)throw new Error('Ride-plan PDF is too large. Use a PDF under 50 MB.');
  const pdfjs=await import(PDFJS);pdfjs.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
  const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;const pages=[];let chars=0;
  for(let n=1;n<=Math.min(pdf.numPages,180);n++){
    const page=await pdf.getPage(n),content=await page.getTextContent();let line='';const out=[];
    for(const item of content.items){const s=String(item.str||'').trim();if(s)line+=(line?' ':'')+s;if(item.hasEOL&&line){out.push(line);line=''}}if(line)out.push(line);
    pages.push(out.join('\n'));chars+=out.join(' ').length;if(chars>2_000_000)break;
  }
  const text=pages.join('\n');if(text.replace(/\s+/g,' ').trim().length<100)throw new Error('This PDF appears scanned or has too little searchable text. Create the ride manually, or use a searchable PDF.');
  const draft=parseRideText(text,{fileName:file.name});draft.pageCount=pdf.numPages;return draft;
}
window.riderHubParseRideText=parseRideText;
window.riderHubProcessRidePdf=processPdf;
window.RIDER_HUB_RIDE_PDF_IMPORTER_VERSION=1;
})();
