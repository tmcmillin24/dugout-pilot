// Detect source changes only. Never publish new rule interpretations automatically.
import { readFile, writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
const catalog=JSON.parse(await readFile(new URL('../src/lib/coaching/usssa-sources.json',import.meta.url),'utf8'));
const baselinePath=new URL('../docs/usssa-source-baseline.json',import.meta.url);
const allowed=url=>{const u=new URL(url);return u.protocol==='https:'&&(u.hostname==='usssa.com'||u.hostname.endsWith('.usssa.com')||u.hostname==='usssa.net'||u.hostname.endsWith('.usssa.net')||u.hostname==='usssabaseball.org'||u.hostname.endsWith('.usssabaseball.org'));};
async function download(url) {
  if(!allowed(url))throw Error('Unapproved source host');
  let response; let target=url;
  for(let redirect=0;redirect<6;redirect++) {
    response=await fetch(target,{redirect:'manual',signal:AbortSignal.timeout(15000)});
    if(response.status>=300&&response.status<400){const location=response.headers.get('location');if(!location)throw Error('Missing redirect target');target=new URL(location,target).href;if(!allowed(target))throw Error('Unapproved redirect host');continue;}
    break;
  }
  if(!response?.ok)throw Error(`HTTP ${response?.status}`);
  if(Number(response.headers.get('content-length')??0)>10000000)throw Error('Source exceeds 10 MB');
  const reader=response.body.getReader();let size=0;const parts=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>10000000){await reader.cancel();throw Error('Source exceeds 10 MB');}parts.push(value);}
  return {body:Buffer.concat(parts),url:target};
}
function links(html,base) {
  const found=[];for(const match of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label=match[2].replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
    if(!/rule\s*book|rulebook|by.?laws/i.test(label)||!/(baseball|softball|fastpitch|slowpitch)/i.test(label))continue;
    try {const url=new URL(match[1].replace(/&amp;/g,'&'),base).href;if(allowed(url))found.push({label,url});}catch{}
  }
  return found.sort((a,b)=>a.url.localeCompare(b.url));
}
const urls=[...new Set([catalog.directory,...Object.values(catalog.sports).map(s=>s.auditUrl??s.landingUrl)])];
const documents=new Map();const errors=[];const directories=[];
await Promise.all(urls.map(async url=>{try{const response=await download(url);const found=links(response.body.toString('utf8'),response.url);directories.push({url,links:found});if(!found.length)errors.push({url,error:'No recognized rulebook links found; review the page layout.'});for(const link of found)documents.set(link.url,link.label);}catch(error){errors.push({url,error:error.message});}}));
for(const sport of Object.values(catalog.sports))if(sport.snapshotUrl)documents.set(sport.snapshotUrl,sport.snapshotEdition);
const results=await Promise.all([...documents].map(async([url,label])=>{try{const response=await download(url);if(response.body.subarray(0,5).toString()!=='%PDF-')throw Error('Expected a PDF rulebook');return{url,label,resolvedUrl:response.url,sha256:createHash('sha256').update(response.body).digest('hex')};}catch(error){return{url,label,error:error.message};}}));
results.sort((a,b)=>a.url.localeCompare(b.url));directories.sort((a,b)=>a.url.localeCompare(b.url));
const report={checkedAt:new Date().toISOString(),directories,documents:results,errors};
const stable=data=>JSON.stringify({directories:data.directories,documents:data.documents,errors:data.errors});
let baseline=null;try{baseline=JSON.parse(await readFile(baselinePath,'utf8'));}catch{}
const changed=baseline&&stable(baseline)!==stable(report);
const broken=errors.length+results.filter(r=>r.error).length;
console.log(JSON.stringify({...report,changed:!!changed,brokenSources:broken},null,2));
if(process.argv.includes('--record-baseline'))await writeFile(baselinePath,JSON.stringify(report,null,2)+'\n');
// An unavailable source is always a failed check, even if already in the baseline.
if(broken||changed||!baseline&&!process.argv.includes('--record-baseline'))process.exitCode=1;
