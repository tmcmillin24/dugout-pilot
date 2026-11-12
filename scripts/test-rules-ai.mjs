import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
function load(path) {
 if(path.pathname.endsWith('.json'))return JSON.parse(readFileSync(path,'utf8'));
 const exports={};
 vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports,Request,Response,URL,AbortSignal,Date,JSON,TextEncoder,TextDecoder,setTimeout,crypto:webcrypto,require:name=>load(new URL(name,path))});return exports;
}
const {createRulesHandler,referencesFor,rulebooksFor,extractAnswer}=load(new URL('../supabase/functions/rules-assistant/index.ts',import.meta.url));
const {downloadPDF}=load(new URL('../supabase/functions/rules-assistant/documents.ts',import.meta.url));
const team='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',user='11111111-1111-4111-8111-111111111111';
const context={sport:'baseball',age:'11U',season:'2026',organization:'usssa'};
const req=(question='How many balls and strikes do you get?',history=[])=>new Request('https://local.test',{method:'POST',headers:{Authorization:'Bearer user-token'},body:JSON.stringify({teamId:team,question,history})});
function harness(options={}) {
 const calls=[],cache=new Map(),versions=new Map(),files=new Map();let generationCount=0;const waits=[];let clock=new Date('2026-11-12T12:00:00Z'),revision=1,serial=0;
 const env={SUPABASE_URL:'https://project.supabase.co',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'admin-secret',GEMINI_API_KEY:'gemini-secret'};
 const ok=value=>new Response(JSON.stringify(value));
 const fetch=async(url,init={})=>{
  calls.push({url,init});
  if(url.endsWith('/auth/v1/user'))return options.authFailure?new Response('{}',{status:401}):ok({id:user});
  if(url.includes('/team_memberships?'))return ok(options.member===false?[]:[{role:'coach'}]);
  if(url.includes('/teams?'))return ok([{activation_status:options.expired?'trial':'active',trial_ends_at:'2000-01-01',test_access:false}]);
  if(url.includes('/team_boards?'))return ok([{board:{rulesContext:{...context,sport:options.sport??'baseball',age:options.age??'11U',season:options.season??'2026'},eventRules:'Coach note',players:[{name:'SECRET ROSTER'}]}}]);
  if(url.includes('/rules_source_versions?'))return options.noCache?new Response('{}',{status:404}):ok(versions.has(new URL(url).searchParams.get('url').slice(3))?[versions.get(new URL(url).searchParams.get('url').slice(3))]:[]);
  if(url.endsWith('/rules_source_versions')){if(!options.noCache)versions.set(JSON.parse(init.body).url,JSON.parse(init.body));return ok(null);}
  if(url.includes('/rules_answer_cache?')) {
   if(options.noCache)return new Response('{}',{status:404});
   if(init.method==='DELETE')return ok(null);
   const entry=cache.get(new URL(url).searchParams.get('cache_key').slice(3));
   return ok(entry&&Date.parse(entry.expires_at)>clock.getTime()?[{answer:entry.answer}]:[]);
  }
  if(url.endsWith('/rules_answer_cache')){if(options.noCache)return new Response('{}',{status:404});const value=JSON.parse(init.body);cache.set(value.cache_key,value);return ok(null);}
  if(url.includes('/consume_rules_ai_budget'))return options.limited?new Response(JSON.stringify({code:'P0001',message:'Ask AI usage limit reached'}),{status:400}):ok(null);
  if(/\/(images|wp-content|mlb\/official-information)\//.test(url)) {
   if(options.sourceFailure)return new Response('{}',{status:403});
   if(options.html)return new Response('<html>Cloud protection</html>');
   return new Response(`%PDF-1.4\nsource ${url} version ${revision}`);
  }
  if(url==='https://generativelanguage.googleapis.com/upload/v1beta/files') {
   if(options.uploadQuota)return new Response('{}',{status:429});
   if(options.uploadFailure)return new Response('{}',{status:403});
   return new Response(null,{headers:{'x-goog-upload-url':`https://generativelanguage.googleapis.com/upload/v1beta/files?upload_id=${++serial}`}});
  }
  if(url.includes('upload_id=')) {
   assert.equal(Object.prototype.toString.call(init.body),'[object ArrayBuffer]');assert.equal(new TextDecoder().decode(init.body.slice(0,5)),'%PDF-');
   const uploadId=new URL(url).searchParams.get('upload_id');
   const file={name:`files/book${uploadId}`,uri:`https://generativelanguage.googleapis.com/v1beta/files/book${uploadId}`,state:'ACTIVE',expirationTime:new Date(clock.getTime()+48*3600000).toISOString()};files.set(file.uri,file);return ok({file});
  }
  if(url.startsWith('https://generativelanguage.googleapis.com/v1beta/files/'))return files.has(url)?ok(files.get(url)):new Response('{}',{status:404});
  if(url.includes(':generateContent')) {
   generationCount++;
   if(options.recover503&&generationCount===1)return new Response('{}',{status:503});
   if(options.providerStatus)return new Response('{}',{status:options.providerStatus});
   if(options.quota)return new Response('{}',{status:429});
   if(options.failure)return new Response('{}',{status:503,headers:options.longBackoff?{'retry-after':'60'}:{}});
   const body=JSON.parse(init.body),input=JSON.parse(body.contents[0].parts[0].text),books=input.rulebooks;
   assert.equal(body.tools,undefined);
   const attached=body.contents[0].parts.filter(p=>p.fileData);
   assert.equal(attached.length,books.length);
   for(const p of attached){assert.equal(p.fileData.mimeType,'application/pdf');assert.ok(files.has(p.fileData.fileUri));}
   const id=options.forged?'mlb-forged-source':books[0].id;
   const result={kind:options.clarify?'clarification':'reference',answer:options.clarify?'Which format does your event use?':'Verified ruling from attached documents.',sourceIds:options.clarify?[]:[id],ruleCitations:options.clarify||options.noRule?[]:[{sourceId:id,rule:'Rule 7.01',page:6}]};
   return ok({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(result)}]}}]});
  }
  throw Error('Unexpected request '+url);
 };
 return {calls,cache,versions,files,waits,changeSource:()=>{revision++;clock=new Date(clock.getTime()+7*3600000);},expireFiles:()=>{files.clear();},handler:createRulesHandler({fetch,sleep:async ms=>{waits.push(ms);},env:name=>options.noKey&&name==='GEMINI_API_KEY'?undefined:env[name],now:()=>clock})};
}
for(const sport of ['baseball','fastpitch','slowpitch']) {
 const h=harness({sport});const response=await h.handler(req());const data=await response.json();
 assert.equal(response.status,200,JSON.stringify(data));assert.equal(data.kind,'reference');assert.ok(data.citations.length);
 const providers=h.calls.filter(c=>c.url.includes(':generateContent'));assert.equal(providers.length,1);
 const body=JSON.parse(providers[0].init.body),input=JSON.parse(body.contents[0].parts[0].text);
 assert.equal(body.tools,undefined);assert.equal(body.generationConfig.responseMimeType,'application/json');
 assert.ok(input.rulebooks.some(b=>b.id.includes(sport)));
 assert.equal(input.rulebooks.some(b=>b.id.startsWith('mlb-')),sport==='baseball');
 assert.ok(!providers[0].init.body.includes('SECRET ROSTER'));assert.ok(!providers[0].init.body.includes('admin-secret'));
 assert.equal(providers[0].init.headers['x-goog-api-key'],'gemini-secret');
 assert.ok(h.calls.findIndex(c=>c.url.includes('consume_rules'))<h.calls.findIndex(c=>c.url.includes(':generateContent')));
 const label=data.citations[0];assert.equal(data.answer.slice(label.start,label.end),'[1]');assert.match(label.title,/Rule 7.01/);
}
for(const [options,status,code] of [[{member:false},403,'membership_required'],[{expired:true},403,'trial_expired'],[{limited:true},429,'app_usage_limit'],[{quota:true},429,'quota_exhausted'],[{sourceFailure:true},503,'source_http'],[{html:true},503,'source_not_pdf'],[{uploadFailure:true},503,'document_upload'],[{uploadQuota:true},429,'document_quota'],[{failure:true},503,'lookup_unavailable']]) {
 const h=harness(options),response=await h.handler(req());const data=await response.json();assert.equal(response.status,status,JSON.stringify(data));assert.equal(data.code,code);assert.equal(h.cache.size,0);
 if(options.member===false||options.expired)assert.equal(h.calls.filter(c=>c.url.includes('googleapis')).length,0);
}
for(const [options,status] of [[{authFailure:true},401],[{noKey:true},503],[{forged:true},502],[{noRule:true},502]]){const h=harness(options);assert.equal((await h.handler(req())).status,status);assert.equal(h.cache.size,0);}
const cached=harness();await cached.handler(req());let data=await(await cached.handler(req())).json();assert.equal(data.cacheHit,true);assert.equal(cached.calls.filter(c=>c.url.includes(':generateContent')).length,1);
assert.equal(cached.calls.filter(c=>c.url.includes('upload_id=')).length,2);
await cached.handler(req('Can the runner advance?'));assert.equal(cached.calls.filter(c=>c.url.includes(':generateContent')).length,2);assert.equal(cached.calls.filter(c=>c.url.includes('upload_id=')).length,2);
await cached.handler(req('How many balls and strikes do you get?',[{role:'user',content:'A different play'}]));assert.equal(cached.calls.filter(c=>c.url.includes(':generateContent')).length,3);
cached.changeSource();data=await(await cached.handler(req())).json();assert.equal(data.cacheHit,undefined);assert.equal(cached.calls.filter(c=>c.url.includes(':generateContent')).length,4);assert.equal(cached.calls.filter(c=>c.url.includes('upload_id=')).length,4);
cached.expireFiles();await cached.handler(req('What is a force play?'));assert.equal(cached.calls.filter(c=>c.url.includes('upload_id=')).length,6);
const noCache=harness({noCache:true});await noCache.handler(req());await noCache.handler(req());assert.equal(noCache.calls.filter(c=>c.url.includes(':generateContent')).length,2);
const clarification=harness({clarify:true});assert.equal((await(await clarification.handler(req())).json()).kind,'clarification');assert.equal(clarification.cache.size,0);
assert.equal(rulebooksFor({...context,sport:'fastpitch',season:'2027'}).length,0);
for(const season of ['2026','2027'])for(let age=4;age<=18;age++)for(const topic of ['bats','pitching'])assert.ok(referencesFor({...context,season,age:`${age}U`}).some(ref=>ref.id===`usssa-baseball-${season}-${age}U-${topic}`));
assert.throws(()=>extractAnswer({candidates:[{finishReason:'MAX_TOKENS'}]},[]));
const refreshHarness=harness();assert.equal((await refreshHarness.handler(new Request('https://local.test',{method:'POST',headers:{Authorization:'Bearer user-token'},body:JSON.stringify({action:'refresh_sources'})}))).status,403);assert.equal(refreshHarness.calls.length,0);
await assert.rejects(downloadPDF(async()=>new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}}),'https://www.mlb.com/book.pdf'),/official source/);
console.log('PASS direct official PDF delivery, upload reuse/renewal, source changes, missing-cache operation, role checks, edition/sport isolation, one generation, rule/page citations and forged-source rejection. Gemini responses mocked.');

const recovery=harness({recover503:true});assert.equal((await recovery.handler(req())).status,200);assert.equal(recovery.calls.filter(c=>c.url.includes(':generateContent')).length,2);assert.equal(recovery.waits.length,1);assert.ok(recovery.waits[0]>=750&&recovery.waits[0]<=2000);assert.equal(recovery.calls.filter(c=>c.url.includes('upload_id=')).length,2);
const unavailable=harness({failure:true});assert.equal((await unavailable.handler(req())).status,503);assert.equal(unavailable.calls.filter(c=>c.url.includes(':generateContent')).length,2);assert.equal(unavailable.cache.size,0);
for(const providerStatus of [400,401,403,429]){const h=harness({providerStatus});await h.handler(req());assert.equal(h.calls.filter(c=>c.url.includes(':generateContent')).length,1);assert.equal(h.waits.length,0);}
console.log('PASS recover transient 503 with one delayed retry; cap persistent outages; no retries for quota/auth/invalid requests; no document reupload on retry.');

const longBackoff=harness({failure:true,longBackoff:true});await longBackoff.handler(req());assert.equal(longBackoff.calls.filter(c=>c.url.includes(':generateContent')).length,1);assert.equal(longBackoff.waits.length,0);
